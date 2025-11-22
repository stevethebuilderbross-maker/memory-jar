
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SCENARIOS, APP_NAME } from './constants';
import { Scenario, AudioState, ScenarioId, ScenarioType, GeneratedContent } from './types';
import { 
  generateSpeech, 
  stopSpeech, 
  generateImage, 
  generateVideo, 
  groundedSearch,
  getNavigationAssistance,
  GeminiLiveClient 
} from './services/geminiService';
import { MemoryService, MemorySymbol } from './services/memoryService';
import { Visualizer } from './components/Visualizer';
import { 
  ChevronLeft, Battery, Wifi, Signal, Settings, Bell, Mic, Loader2, Brain, Heart, Music, Coffee, Sparkles, Waves, Volume2, VolumeX, X, Check, Square, Play, Globe, Image as ImageIcon, Film, Save, MapPin, ShieldCheck, Zap, Terminal
} from 'lucide-react';

// --- Cyberpunk Background Component ---
const CyberpunkBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black">
       {/* Deep Space Base */}
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-black to-black"></div>
       
       {/* Digital Grid Floor */}
       <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,243,255,0.05)_100%),linear-gradient(to_right,rgba(0,243,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,243,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [transform:perspective(1000px)_rotateX(60deg)] origin-bottom opacity-30 pointer-events-none"></div>

       {/* Rain Effect (CSS Based) */}
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/raining-stripes.png')] opacity-20 animate-rain mix-blend-screen pointer-events-none"></div>
       
       {/* Atmospheric Fog */}
       <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
    </div>
  );
};

// --- Kawaii Faces Components (Neonified) ---
const FaceHappy = ({ colorClass }: { colorClass: string }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full opacity-100 ${colorClass} drop-shadow-[0_0_10px_currentColor]`}>
    <path d="M30 45 Q35 40 40 45" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" className="animate-pulse" />
    <path d="M60 45 Q65 40 70 45" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" className="animate-pulse" style={{ animationDelay: '0.1s' }}/>
    <path d="M35 65 Q50 80 65 65" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
  </svg>
);
const FaceSleepy = ({ colorClass }: { colorClass: string }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full opacity-50 ${colorClass}`}>
    <line x1="25" y1="50" x2="35" y2="50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <line x1="65" y1="50" x2="75" y2="50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M70 30 L80 30 L70 40" stroke="currentColor" strokeWidth="2" fill="none" className="animate-bounce" />
  </svg>
);
const FaceGlasses = ({ colorClass }: { colorClass: string }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full opacity-100 ${colorClass} drop-shadow-[0_0_15px_currentColor]`}>
    <rect x="20" y="35" width="25" height="15" rx="2" stroke="currentColor" strokeWidth="3" fill="rgba(0,243,255,0.1)" />
    <rect x="55" y="35" width="25" height="15" rx="2" stroke="currentColor" strokeWidth="3" fill="rgba(0,243,255,0.1)" />
    <line x1="45" y1="42" x2="55" y2="42" stroke="currentColor" strokeWidth="3" />
    <path d="M35 70 Q50 75 65 70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
  </svg>
);

const MemoryCube: React.FC<{ scenario: Scenario; onClick: () => void; index: number; }> = ({ scenario, onClick, index }) => {
  const Icon = scenario.icon;
  
  // Map semantic colors to neon equivalents
  const getNeonColors = (type: string) => {
    if (type.includes('live')) return 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] text-cyan-400';
    if (type.includes('navigation')) return 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] text-red-400';
    if (type.includes('image')) return 'border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] text-pink-400';
    if (type.includes('video')) return 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] text-purple-400';
    return 'border-white/10 shadow-none hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,243,255,0.2)] text-slate-300 hover:text-cyan-300';
  };

  const neonClass = getNeonColors(scenario.id);

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full aspect-[4/5] md:aspect-square rounded-xl
        bg-black/80 backdrop-blur-xl border transition-all duration-300 ease-out
        flex flex-col items-center justify-center gap-6 p-6 overflow-hidden
        hover:-translate-y-2 hover:bg-white/5
        ${neonClass}
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Holographic Scanline */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 ease-in-out pointer-events-none"></div>
      
      {/* Icon */}
      <div className="relative z-10 p-4 rounded-lg bg-black/50 border border-white/10 group-hover:border-current transition-colors">
        <Icon size={32} strokeWidth={1.5} className="drop-shadow-[0_0_8px_currentColor]" />
      </div>
      
      {/* Text */}
      <div className="flex flex-col items-center gap-1 relative z-10 text-center">
        <span className="font-display font-bold text-lg tracking-wider uppercase group-hover:text-white transition-colors">
          {scenario.title}
        </span>
        <span className="text-[10px] font-mono text-slate-500 group-hover:text-white/70 tracking-widest uppercase">
          {scenario.shortDescription}
        </span>
      </div>
    </button>
  );
};

export default function App() {
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [audioState, setAudioState] = useState<AudioState>({ isPlaying: false, isLoading: false, error: null });
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [memories, setMemories] = useState<MemorySymbol[]>([]);
  const [isMemorySecure, setIsMemorySecure] = useState(false);

  const liveClientRef = useRef<GeminiLiveClient | null>(null);
  const [apiKey] = useState(process.env.API_KEY || '');

  useEffect(() => {
    MemoryService.init();
    const loadedMemories = MemoryService.getMemories();
    setMemories(loadedMemories);
    setIsMemorySecure(true);
  }, []);

  const handleBack = useCallback(() => {
    stopSpeech();
    if (liveClientRef.current) {
      liveClientRef.current.disconnect();
      liveClientRef.current = null;
    }
    setActiveScenario(null);
    setGeneratedContent(null);
    setAudioState({ isPlaying: false, isLoading: false, error: null });
    setIsConnected(false);
  }, []);

  const handleScenarioSelect = async (scenario: Scenario) => {
    setActiveScenario(scenario);
    if (scenario.type !== ScenarioType.LIVE && 
        !scenario.type.startsWith('interactive_')) {
      // TTS Logic
      setAudioState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        await generateSpeech(scenario.narration);
        setAudioState(prev => ({ ...prev, isLoading: false, isPlaying: true }));
      } catch (err) {
        setAudioState(prev => ({ ...prev, isLoading: false, error: "Failed to generate speech" }));
      }
    }
  };

  const handleGenerate = async (prompt: string) => {
    if (!activeScenario) return;
    setAudioState(prev => ({ ...prev, isLoading: true }));
    setGeneratedContent(null);

    try {
      if (activeScenario.type === ScenarioType.INTERACTIVE_IMAGE) {
        const url = await generateImage(prompt);
        setGeneratedContent({ type: 'image', url });
      } else if (activeScenario.type === ScenarioType.INTERACTIVE_VIDEO) {
        const url = await generateVideo(prompt);
        setGeneratedContent({ type: 'video', url });
      } else if (activeScenario.type === ScenarioType.INTERACTIVE_SEARCH) {
        const result = await groundedSearch(prompt);
        setGeneratedContent({ type: 'text', text: result.text, sources: result.sources });
      } else if (activeScenario.type === ScenarioType.INTERACTIVE_MAP) {
        const result = await getNavigationAssistance(prompt);
        setGeneratedContent({ type: 'text', text: result.text, sources: result.sources });
      }
    } catch (e: any) {
      setAudioState(prev => ({ ...prev, error: e.message || "Generation failed" }));
    } finally {
      setAudioState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleStartLive = async () => {
    if (!apiKey) return alert("API Key missing");
    setAudioState(prev => ({ ...prev, isLoading: true }));
    try {
      liveClientRef.current = new GeminiLiveClient(apiKey);
      liveClientRef.current.onAudioData = (level) => setAudioLevel(level);
      liveClientRef.current.onMemoryUpdate = () => {
        const fresh = MemoryService.getMemories();
        setMemories(fresh);
      };
      liveClientRef.current.onDisconnect = () => {
        setIsConnected(false);
        setAudioState(prev => ({...prev, isLoading: false}));
      };
      await liveClientRef.current.connect();
      setIsConnected(true);
    } catch (e) {
      console.error(e);
      setAudioState(prev => ({ ...prev, error: "Connection failed" }));
    } finally {
      setAudioState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleStopLive = () => {
    if (liveClientRef.current) {
      liveClientRef.current.disconnect();
      setIsConnected(false);
    }
  };

  // --- RENDER HELPERS ---
  const renderInteractiveContent = () => {
    if (audioState.isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-80 bg-black/40 border border-cyan-500/30 rounded-xl animate-pulse">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4 drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]" />
          <p className="text-cyan-200 font-mono text-sm tracking-widest uppercase">Processing Data Stream...</p>
        </div>
      );
    }

    if (generatedContent?.type === 'image') {
      return (
        <div className="rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 animate-fade-in-up bg-black">
           <img src={generatedContent.url} alt="Generated" className="w-full h-auto" />
        </div>
      );
    }
    if (generatedContent?.type === 'video') {
       return (
        <div className="rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 animate-fade-in-up bg-black">
          <video src={generatedContent.url} controls autoPlay loop className="w-full h-auto" />
        </div>
       );
    }
    if (generatedContent?.type === 'text') {
      return (
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-8 rounded-xl animate-fade-in-up shadow-2xl">
          <p className="text-lg leading-relaxed text-slate-200 font-light font-sans">{generatedContent.text}</p>
          {generatedContent.sources && generatedContent.sources.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-[10px] uppercase tracking-widest text-cyan-400 mb-3 font-bold font-display">Data Sources</p>
              <div className="flex flex-wrap gap-2">
                {generatedContent.sources.map((s, i) => {
                  const title = s.web?.title || s.maps?.title || "Source";
                  const uri = s.web?.uri || s.maps?.googleMapsUri || "#";
                  return (
                    <a key={i} href={uri} target="_blank" rel="noopener noreferrer" className="text-xs bg-cyan-950/30 border border-cyan-500/30 px-3 py-1.5 rounded hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_10px_rgba(0,243,255,0.2)] transition truncate max-w-[200px] font-mono">
                      {title}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-80 bg-black/20 border border-white/5 rounded-xl border-dashed">
        <Terminal className="w-12 h-12 text-slate-800 mb-4" />
        <p className="text-slate-600 font-mono text-xs uppercase tracking-widest">Awaiting Input Protocol</p>
      </div>
    );
  };

  // --- MAIN SCENARIO RENDER ---
  if (activeScenario) {
    // LIVE MODE UI - CYBERPUNK
    if (activeScenario.type === ScenarioType.LIVE) {
      return (
        <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col font-sans">
           <CyberpunkBackground />
           
           {/* Ambient Glow */}
           <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${isConnected ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse"></div>
           </div>

           {/* Header */}
           <div className="relative z-10 p-6 flex items-center justify-between">
             <button onClick={handleBack} className="p-3 rounded-full border border-white/10 hover:bg-white/10 hover:border-white/30 transition text-slate-300 group">
               <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
             </button>
             <div className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/5 bg-black/40 backdrop-blur-sm">
                <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${isConnected ? 'bg-cyan-400 text-cyan-400 animate-pulse' : 'bg-red-500 text-red-500'}`}></div>
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">
                  {isConnected ? 'Net_Link: STABLE' : 'Net_Link: OFFLINE'}
                </span>
             </div>
             <div className="w-12"></div>
           </div>

           {/* Main Content */}
           <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8">
              
              {/* Digital Core (Face) */}
              <div className="relative w-72 h-72 mb-16 flex items-center justify-center">
                 {/* Outer Rings */}
                 <div className={`absolute inset-0 border border-dashed border-cyan-500/30 rounded-full ${isConnected ? 'animate-spin-slow' : ''}`}></div>
                 <div className={`absolute inset-8 border border-purple-500/20 rounded-full ${isConnected ? 'animate-spin-slow' : ''}`} style={{ animationDirection: 'reverse', animationDuration: '30s' }}></div>
                 
                 {/* Holographic Core */}
                 <div className={`relative w-56 h-56 rounded-full bg-black/50 border border-white/10 flex items-center justify-center backdrop-blur-sm transition-all duration-500 ${isConnected ? 'animate-neon-pulse' : 'opacity-50 grayscale'}`}>
                    <div className={`w-32 h-32 transition-all duration-300 ${isConnected ? 'text-cyan-400' : 'text-slate-700'}`}>
                      {isConnected ? (
                        audioLevel > 0.05 ? <FaceHappy colorClass="text-cyan-400" /> : <FaceGlasses colorClass="text-cyan-400" />
                      ) : (
                        <FaceSleepy colorClass="text-slate-700" />
                      )}
                    </div>
                 </div>
              </div>

              {/* Status Typography */}
              <div className="text-center space-y-4 mb-12">
                <h2 className={`font-display text-5xl md:text-6xl font-bold tracking-tighter uppercase transition-all duration-500 ${isConnected ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_20px_rgba(0,243,255,0.4)]' : 'text-slate-700'}`}>
                  {isConnected ? "System Active" : "System Standby"}
                </h2>
                <p className="text-slate-400 font-mono text-sm tracking-[0.2em] uppercase">
                  {isConnected 
                    ? "Awaiting Vocal Input..." 
                    : "Initialize Connection"}
                </p>
              </div>

              {/* Primary Action Control (Cyberpunk Button) */}
              <div className="relative group">
                 {!isConnected ? (
                   <button 
                     onClick={handleStartLive}
                     disabled={audioState.isLoading}
                     className="relative flex items-center justify-center w-20 h-20 rounded-none bg-black border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] transition-all duration-300 overflow-hidden clip-path-hexagon"
                     style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)' }}
                   >
                      {audioState.isLoading ? <Loader2 className="animate-spin w-8 h-8" /> : <Mic size={32} />}
                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-cyan-400"></div>
                   </button>
                 ) : (
                   <button 
                     onClick={handleStopLive}
                     className="flex items-center justify-center w-20 h-20 bg-red-900/20 border border-red-500/50 text-red-500 hover:bg-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all"
                     style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)' }}
                   >
                     <Square size={24} fill="currentColor" />
                   </button>
                 )}
              </div>

              {/* Live Memory Stream */}
              {isConnected && memories.length > 0 && (
                <div className="absolute bottom-8 left-0 right-0 px-6">
                  <div className="flex flex-col items-center gap-3">
                     <p className="text-[9px] uppercase tracking-[0.3em] text-cyan-500/70 font-mono font-bold">Cached_Data</p>
                     <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                      {memories.slice(-3).map(m => (
                        <div key={m.id} className="animate-fade-in-up px-4 py-2 bg-black/80 border border-purple-500/40 flex items-center gap-3 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.15)] clip-path-slash">
                          <span className="text-lg drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{m.symbol}</span>
                          <span className="text-xs font-mono text-purple-200/80 max-w-[150px] truncate">{m.meaning}</span>
                        </div>
                      ))}
                     </div>
                  </div>
                </div>
              )}
           </div>
        </div>
      );
    }

    // INTERACTIVE & TTS CONTAINER
    return (
      <div className="relative min-h-screen bg-black text-white flex flex-col overflow-x-hidden font-sans">
         <CyberpunkBackground />
         
         <div className="relative z-10 max-w-4xl mx-auto w-full p-6 min-h-screen flex flex-col">
            {/* Nav */}
            <div className="flex items-center justify-between mb-10">
              <button onClick={handleBack} className="p-3 border border-white/10 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-500/10 transition text-slate-400 rounded-lg"><ChevronLeft /></button>
              <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-slate-500">{activeScenario.title}</span>
              <div className="w-10"></div>
            </div>

            {/* Content Card */}
            <div className="flex-1 bg-black/40 backdrop-blur-xl rounded-sm border border-white/10 p-8 md:p-12 shadow-2xl relative overflow-hidden">
               {/* Decorative Background for Card */}
               <div className={`absolute top-0 right-0 w-96 h-96 rounded-full filter blur-[150px] opacity-10 -translate-y-1/2 translate-x-1/2 ${activeScenario.themeColor.replace('text-', 'bg-').split(' ')[0]}`}></div>

               {/* Header Section */}
               <div className="relative z-10 flex items-start gap-6 mb-10">
                  <div className={`p-4 border border-white/10 bg-black/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] text-cyan-400`}>
                    <activeScenario.icon size={32} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 pt-1">
                    <h1 className="font-display text-3xl md:text-4xl font-bold mb-3 leading-tight text-white">{activeScenario.visualContext.split('\n')[0]}</h1>
                    <p className="text-slate-400 text-lg font-light leading-relaxed border-l-2 border-cyan-500/30 pl-4">{activeScenario.narration}</p>
                  </div>
               </div>

               {/* Interactive Input / Output Area */}
               {[ScenarioType.INTERACTIVE_IMAGE, ScenarioType.INTERACTIVE_VIDEO, ScenarioType.INTERACTIVE_SEARCH, ScenarioType.INTERACTIVE_MAP].includes(activeScenario.type) ? (
                  <div className="relative z-10 mt-4">
                    <form onSubmit={(e) => { e.preventDefault(); handleGenerate((e.target as any).prompt.value); }} className="relative mb-8 group">
                      <input 
                        name="prompt"
                        type="text" 
                        placeholder="Enter command parameters..." 
                        className="w-full bg-black/60 border border-white/10 rounded-none px-6 py-5 text-lg text-cyan-100 placeholder-slate-700 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(0,243,255,0.1)] transition-all font-mono"
                        defaultValue={activeScenario.type === ScenarioType.INTERACTIVE_MAP ? "Find a pharmacy near me" : ""}
                      />
                      <button 
                        type="submit" 
                        disabled={audioState.isLoading}
                        className="absolute right-2 top-2 bottom-2 px-6 bg-cyan-900/20 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500 text-cyan-400 hover:shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {audioState.isLoading ? <Loader2 size={20} className="animate-spin" /> : <span className="font-mono text-xs font-bold uppercase">Execute</span>}
                      </button>
                    </form>
                    {renderInteractiveContent()}
                  </div>
               ) : (
                 /* TTS Audio Controls */
                 <div className="relative z-10 mt-auto pt-12">
                    <div className="bg-black/30 border border-white/5 p-8 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                           <div className={`w-1.5 h-1.5 rounded-none ${audioState.isPlaying ? 'bg-cyan-400 animate-pulse shadow-[0_0_10px_currentColor]' : 'bg-slate-800'}`}></div>
                           <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Audio_Out_Stream</span>
                        </div>
                        <Visualizer isPlaying={audioState.isPlaying} />
                      </div>
                      
                      <div className="flex justify-center gap-12 items-center">
                        <button className="text-slate-600 hover:text-slate-300 transition"><VolumeX size={24} /></button>
                        <button 
                          onClick={() => handleScenarioSelect(activeScenario)} 
                          className={`
                            w-20 h-20 flex items-center justify-center transition-all border
                            ${audioState.isPlaying ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_30px_rgba(0,243,255,0.2)]' : 'bg-transparent border-white/20 text-white hover:border-white hover:bg-white/5'}
                          `}
                        >
                          {audioState.isLoading ? <Loader2 className="animate-spin" size={32} /> : <Play size={32} fill="currentColor" className={audioState.isPlaying ? "ml-1" : "ml-2"} />}
                        </button>
                        <button className="text-slate-600 hover:text-slate-300 transition"><Volume2 size={24} /></button>
                      </div>
                    </div>
                 </div>
               )}
            </div>
         </div>
      </div>
    );
  }

  // --- HOME SCREEN (CYBERPUNK HERO) ---
  return (
    <div className="relative min-h-screen bg-black text-slate-50 selection:bg-cyan-500/30 overflow-x-hidden font-sans">
      <CyberpunkBackground />
      
      {/* Main Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 min-h-screen flex flex-col">
        
        {/* Navbar */}
        <header className="flex items-center justify-center md:justify-between mb-16 animate-fade-in-down border-b border-white/5 pb-6 relative">
          <div className="hidden md:block w-20"></div> {/* Spacer for balancing */}
          
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 flex items-center justify-center border border-cyan-500/50 bg-cyan-950/30 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
               <Brain className="text-cyan-400 w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-display text-2xl font-bold text-white tracking-tight leading-none">{APP_NAME}</h1>
              <p className="text-[9px] text-cyan-500/80 font-mono font-bold tracking-[0.3em] uppercase leading-none mt-1">System Online</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3 px-4 py-2 border border-emerald-500/30 bg-emerald-950/20">
            {isMemorySecure && <ShieldCheck size={14} className="text-emerald-400" />}
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">Vault: SECURE</span>
          </div>
          {/* Mobile Vault Status */}
          <div className="absolute right-0 top-0 md:hidden">
             {isMemorySecure && <ShieldCheck size={16} className="text-emerald-400" />}
          </div>
        </header>

        {/* Hero Greeting - CENTERED */}
        <section className="mb-24 animate-fade-in-up flex flex-col items-center text-center">
           <div className="max-w-3xl flex flex-col items-center">
             <span className="inline-block px-4 py-1.5 mb-8 border border-cyan-500/30 bg-cyan-950/20 text-cyan-300 text-[10px] font-mono font-bold tracking-[0.2em] uppercase rounded-full shadow-[0_0_15px_rgba(0,243,255,0.1)]">
               Cognitive Augmentation Ready
             </span>
             
             <h2 className="font-display text-6xl md:text-8xl lg:text-9xl font-bold mb-8 leading-[0.85] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-900 drop-shadow-[0_0_40px_rgba(0,243,255,0.2)]">
               MEMORY<br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 text-neon-cyan animate-pulse" style={{animationDuration: '4s'}}>JAR AI</span>
             </h2>
             
             <p className="text-slate-400 text-lg md:text-xl font-light max-w-lg mb-12 leading-relaxed">
               Your personal digital archive. <span className="text-slate-200">Secured</span>, <span className="text-slate-200">grounded</span>, and always listening. 
             </p>

             {/* Live Card Hero - Centered */}
             <button 
               onClick={() => handleScenarioSelect(SCENARIOS.find(s => s.type === ScenarioType.LIVE)!)}
               className="group relative w-full md:w-[400px] overflow-hidden border border-cyan-500/30 hover:border-cyan-400 transition-all duration-500 hover:scale-105"
             >
               <div className="absolute inset-0 bg-cyan-950/20 group-hover:bg-cyan-900/30 transition-colors"></div>
               
               {/* Animated Grid Background */}
               <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(0,243,255,.05)_25%,rgba(0,243,255,.05)_26%,transparent_27%,transparent_74%,rgba(0,243,255,.05)_75%,rgba(0,243,255,.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(0,243,255,.05)_25%,rgba(0,243,255,.05)_26%,transparent_27%,transparent_74%,rgba(0,243,255,.05)_75%,rgba(0,243,255,.05)_76%,transparent_77%,transparent)] bg-[size:30px_30px]"></div>

               <div className="relative p-8 flex flex-col items-center gap-6">
                  <div className="flex items-center gap-4">
                     <div className="p-4 border border-cyan-400/30 bg-cyan-950/50 text-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.15)] rounded-full">
                        <Mic className="w-8 h-8" />
                     </div>
                     <div className="flex flex-col items-start">
                        <h3 className="font-display text-2xl font-bold text-white mb-0 group-hover:text-cyan-300 transition-colors">INITIATE LINK</h3>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></div>
                            <p className="text-cyan-200/60 text-xs font-mono uppercase tracking-wider">Voice Interface Ready</p>
                        </div>
                     </div>
                  </div>
               </div>
               
               {/* Corner Accents */}
               <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500"></div>
               <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500"></div>
               <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500"></div>
               <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500"></div>
             </button>
           </div>
        </section>

        {/* Scenario Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pb-24">
          {SCENARIOS.filter(s => s.type !== ScenarioType.LIVE).map((scenario, index) => (
            <MemoryCube 
              key={scenario.id} 
              scenario={scenario} 
              index={index}
              onClick={() => handleScenarioSelect(scenario)} 
            />
          ))}
        </div>

      </div>
    </div>
  );
}
