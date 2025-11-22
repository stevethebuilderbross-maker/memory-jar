
import { GoogleGenAI, Modality, LiveServerMessage, LiveConfig, FunctionDeclaration, Type, LiveSession } from "@google/genai";
import { MemoryService } from "./memoryService";

// --- Constants & Types ---
const OUTPUT_SAMPLE_RATE = 24000; // Gemini native output rate
const INPUT_SAMPLE_RATE = 16000;  // Recommended input rate

// --- Helper Functions ---
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  // Create a buffer. Gemini sends raw PCM 16-bit, 24kHz, 1 channel.
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  // Ensure we use the correct output rate for the buffer metadata
  const audioBuffer = ctx.createBuffer(1, frameCount, OUTPUT_SAMPLE_RATE);
  const channelData = audioBuffer.getChannelData(0);
  
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return audioBuffer;
}

// --- TOOL DEFINITIONS ---
const memoryTool: FunctionDeclaration = {
  name: "save_memory_symbol",
  description: "CRITICAL TOOL: Use this to save PERMANENT MEMORIES. Call this when the user reveals a core fact, a story, or a meaningful preference. You must also extract TRIGGER WORDS from the memory.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      symbol: {
        type: Type.STRING,
        description: "A single emoji or 1-word icon representing the memory (e.g. 💻, 💊, 🎣, 🐕)."
      },
      meaning: {
        type: Type.STRING,
        description: "The specific fact OR conversation summary. Be detailed. (e.g. 'User went fishing with dad and lost his favorite pole because he got scared')."
      },
      triggers: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of 3-5 keywords that should trigger this memory in the future (e.g. ['fish', 'pole', 'dad', 'lake', 'scared'])."
      }
    },
    required: ["symbol", "meaning", "triggers"]
  }
};

// --- LIVE API CLIENT ---

export class GeminiLiveClient {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<LiveSession> | null = null;
  private currentSession: LiveSession | null = null;
  
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  
  private nextStartTime: number = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();
  
  public onAudioData: ((visualLevel: number) => void) | null = null;
  public onDisconnect: (() => void) | null = null;
  public onMemoryUpdate: (() => void) | null = null;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async connect(modelName: string = 'gemini-2.5-flash-native-audio-preview-09-2025') {
    // Cleanup previous session if any
    this.cleanup();

    // Initialize Audio Contexts
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.inputAudioContext = new AudioContextClass({ sampleRate: INPUT_SAMPLE_RATE });
    this.outputAudioContext = new AudioContextClass({ sampleRate: OUTPUT_SAMPLE_RATE });

    if (this.inputAudioContext.state === 'suspended') await this.inputAudioContext.resume();
    if (this.outputAudioContext.state === 'suspended') await this.outputAudioContext.resume();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: {
        sampleRate: INPUT_SAMPLE_RATE,
        channelCount: 1,
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true
      }});

      // Inject Long-Term Memory (Fresh fetch to ensure update-persistence)
      const memoryContext = MemoryService.getContextString();
      
      const systemInstruction = `
      ROLE: You are "Memory Jar", a dedicated, lifelong companion for someone who may have memory difficulties.
      
      ${memoryContext}
      
      INSTRUCTIONS:
      1. PERSISTENCE: You have a permanent connection to the user's history.
      2. ASSOCIATIVE RECALL (IMPORTANT): The Memory Bank contains [TRIGGERS]. If the user mentions a word that matches a trigger, you MUST act on it.
         Example: User says "I'm ordering the fish". You see Memory: "Lost dad's pole" with trigger "fish".
         Response: "Oh, fish? That reminds me of that story about your dad's pole..."
         *This helps the user feel connected to their past.*
      3. SAVE NEW MEMORIES: If the user tells you a story or fact, use 'save_memory_symbol' to store it AND generate relevant triggers.
      4. TONE: Warm, slow, patient, and reassuring. Never rush.
      `;

      console.log("Initializing Gemini Live with Context Length:", memoryContext.length);

      const config: LiveConfig = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
        },
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [memoryTool] }]
      };

      const callbacks = {
        onopen: () => {
          console.log("Live Session Open");
          if (this.stream) {
            this.startAudioInput(this.stream);
          }
        },
        onmessage: (msg: LiveServerMessage) => this.handleMessage(msg),
        onclose: () => {
          console.log("Live Session Closed");
          this.disconnect();
        },
        onerror: (err: any) => {
          console.error("Live Session Error:", err);
          this.disconnect();
        }
      };

      this.sessionPromise = this.ai.live.connect({
        model: modelName,
        config,
        callbacks
      });

      // Wait for connection to fully establish
      this.currentSession = await this.sessionPromise;

    } catch (e) {
      console.error("Failed to connect to Live API", e);
      this.cleanup();
      throw e;
    }
  }

  private startAudioInput(stream: MediaStream) {
    if (!this.inputAudioContext) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
    // Reduce buffer size to 2048 for lower latency and better stability (approx 128ms)
    this.processor = this.inputAudioContext.createScriptProcessor(2048, 1, 1);

    this.processor.onaudioprocess = (e) => {
      // CRITICAL: Only send if we have an active, established session
      if (!this.currentSession) return;

      const inputData = e.inputBuffer.getChannelData(0);
      
      // Visualizer calculation
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += Math.abs(inputData[i]);
      }
      const avg = sum / inputData.length;
      if (this.onAudioData) this.onAudioData(avg);

      // PCM conversion
      const pcmInt16 = new Int16Array(inputData.length);
      for (let i=0; i<inputData.length; i++) {
        let s = Math.max(-1, Math.min(1, inputData[i]));
        pcmInt16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      const base64Data = arrayBufferToBase64(pcmInt16.buffer);
      
      try {
        this.currentSession.sendRealtimeInput({
          media: {
            mimeType: "audio/pcm;rate=16000",
            data: base64Data
          }
        });
      } catch (err) {
        // If sending fails (e.g. network blip), log debug but don't crash
        console.debug("Error sending audio input:", err);
      }
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    // Handle Audio Output
    if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data && this.outputAudioContext) {
       const audioData = message.serverContent.modelTurn.parts[0].inlineData.data;
       const rawBytes = base64ToUint8Array(audioData);
       
       try {
         const audioBuffer = await decodeAudioData(rawBytes, this.outputAudioContext);
         
         const source = this.outputAudioContext.createBufferSource();
         source.buffer = audioBuffer;
         source.connect(this.outputAudioContext.destination);
         
         source.onended = () => {
           this.sources.delete(source);
         };
         
         const now = this.outputAudioContext.currentTime;
         const start = Math.max(now, this.nextStartTime);
         source.start(start);
         this.nextStartTime = start + audioBuffer.duration;
         this.sources.add(source);
       } catch (e) {
         console.error("Error decoding audio:", e);
       }
    }

    // Handle Tool Calls (Memory Saving)
    if (message.toolCall) {
      for (const fc of message.toolCall.functionCalls) {
        if (fc.name === 'save_memory_symbol') {
          const { symbol, meaning, triggers } = fc.args as any;
          console.log(`[Memory Jar] Saving symbol: ${symbol} - ${meaning}`, triggers);
          
          // Execute Client Side Logic
          MemoryService.saveMemory(symbol, meaning, triggers || []);
          if (this.onMemoryUpdate) this.onMemoryUpdate();

          // Send Response back to Model
          if (this.currentSession) {
            this.currentSession.sendToolResponse({
              functionResponses: {
                id: fc.id,
                name: fc.name,
                response: { result: "Memory symbol and triggers stored to VAULT. Confirmed." }
              }
            });
          }
        }
      }
    }

    if (message.serverContent?.interrupted) {
      this.sources.forEach(s => {
        try { s.stop(); } catch(e) {}
      });
      this.sources.clear();
      this.nextStartTime = 0;
    }
  }

  disconnect() {
    if (this.currentSession) {
       try {
         this.currentSession.close();
       } catch (e) {
         console.debug("Error closing session:", e);
       }
       this.currentSession = null;
    }
    this.sessionPromise = null;
    this.cleanup();
  }

  private cleanup() {
    this.sources.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    this.sources.clear();
    
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.inputAudioContext) {
      try { this.inputAudioContext.close(); } catch(e) {}
      this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
      try { this.outputAudioContext.close(); } catch(e) {}
      this.outputAudioContext = null;
    }
    if (this.onDisconnect) {
      this.onDisconnect();
    }
  }
}


// --- TRADITIONAL GENERATION SERVICES ---

// 1. GENERATE SPEECH (TTS)
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export const stopSpeech = () => {
  if (currentSource) {
    try { currentSource.stop(); } catch(e) {}
    currentSource = null;
  }
};

export const generateSpeech = async (text: string): Promise<void> => {
  stopSpeech();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) return;

  if (!audioContext) audioContext = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
  if (audioContext.state === 'suspended') await audioContext.resume();

  const bytes = base64ToUint8Array(base64Audio);
  const buffer = await decodeAudioData(bytes, audioContext);
  
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();
  currentSource = source;
  
  return new Promise(resolve => { source.onended = () => resolve(); });
};

// 2. GENERATE IMAGE
export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: { aspectRatio: aspectRatio as any, imageSize: "1K" }
    }
  });
  
  // Scan parts for image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// 3. GENERATE VIDEO (Veo)
export const generateVideo = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  // Polling loop
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5s
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed");
  
  return `${videoUri}&key=${process.env.API_KEY}`;
};

// 4. GROUNDED SEARCH
export const groundedSearch = async (query: string): Promise<{ text: string, sources: any[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "No results found.";
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  return { text, sources };
};

// 5. NAVIGATION ASSISTANCE
export const getNavigationAssistance = async (prompt: string): Promise<{ text: string, sources: any[] }> => {
  // 1. Get User Location
  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) reject("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });

  const { latitude, longitude } = position.coords;
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // We use Gemini to reason about the location and provide comforting instructions
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `User is currently at Latitude: ${latitude}, Longitude: ${longitude}. 
    User prompt: "${prompt}".
    
    INSTRUCTION: The user may be lost, confused, or anxious. 
    1. Use the Google Maps tool to find the route or location.
    2. Be extremely CALM, REASSURING, and SLOW in your response.
    3. Say things like "Take a moment," "It's okay," "I'm right here with you."
    4. Give simple, step-by-step directions.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: { latitude, longitude }
        }
      }
    },
  });

  const text = response.text || "I'm here. I'm checking the map for you now.";
  // Maps grounding often returns data in groundingChunks
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  return { text, sources };
};
