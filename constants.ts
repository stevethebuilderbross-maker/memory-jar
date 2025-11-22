import { Scenario, ScenarioId, ScenarioType } from './types';
import { Stethoscope, Pill, Utensils, GraduationCap, Moon, Palette, Video, Globe, Eye, Mic, MapPin } from 'lucide-react';

export const APP_NAME = "Memory Jar AI";
export const TAGLINE = "Not magic. Just memory you forgot to lose.";

export const SCENARIOS: Scenario[] = [
  {
    id: ScenarioId.LIVE,
    type: ScenarioType.LIVE,
    title: "Live Conversation",
    shortDescription: "Real-time voice chat.",
    visualContext: "Listening...",
    narration: "I'm listening. Go ahead.",
    icon: Mic,
    themeColor: "text-indigo-600 bg-indigo-100"
  },
  {
    id: ScenarioId.NAVIGATION,
    type: ScenarioType.INTERACTIVE_MAP,
    title: "Find My Way",
    shortDescription: "Calm, step-by-step guidance.",
    visualContext: "Navigation Assistant Active\nAcquiring Location...",
    narration: "Take a deep breath. It's okay. I'm right here. I'm checking your location now. Where would you like to go? Or just say 'Home'.",
    icon: MapPin,
    themeColor: "text-red-600 bg-red-100"
  },
  {
    id: ScenarioId.DOCTOR,
    type: ScenarioType.TTS,
    title: "The Doctor's Appointment",
    shortDescription: "Context-aware reminders.",
    visualContext: "Upcoming: Dr. Patel (2:15 PM)\nGoal: Discuss scan results.",
    narration: "Dr. Patel, 2:15. Last visit you promised to ask about new scan results. Notes from last time: white-matter stable, keep meds. I just pulled your questions list. Ready when they call you.",
    icon: Stethoscope,
    themeColor: "text-blue-600 bg-blue-100"
  },
  {
    id: ScenarioId.PHARMACY,
    type: ScenarioType.TTS,
    title: "Picking Up Meds",
    shortDescription: "Insurance and order details.",
    visualContext: "CVS Pharmacy - Order #8921\nRefill Status: Ready",
    narration: "Hey boss, refill ready at counter 3. Insurance card is in the left pocket of your jacket. Tell them 'same as last month – 90-day supply.' I already texted your wife 'picking up now.'",
    icon: Pill,
    themeColor: "text-emerald-600 bg-emerald-100"
  },
  {
    id: ScenarioId.DINNER,
    type: ScenarioType.TTS,
    title: "Family Dinner",
    shortDescription: "Discreet memory jogging.",
    visualContext: "Grandson asking about Grandma.\nMemory Context: 1969",
    narration: "1969, roller rink, song was 'Sugar Sugar.' You wore the blue shirt. Go.",
    icon: Utensils,
    themeColor: "text-amber-600 bg-amber-100"
  },
  {
    id: ScenarioId.IMAGE_GEN,
    type: ScenarioType.INTERACTIVE_IMAGE,
    title: "Dream Painter",
    shortDescription: "Generate visual memories.",
    visualContext: "Creative Mode Active\nModel: Gemini 3 Pro Image",
    narration: "A peaceful watercolor painting of a lighthouse at sunset, soft lighting, nostalgic style",
    icon: Palette,
    themeColor: "text-pink-600 bg-pink-100"
  },
  {
    id: ScenarioId.VIDEO_GEN,
    type: ScenarioType.INTERACTIVE_VIDEO,
    title: "Memory Replay",
    shortDescription: "Veo Video Generation.",
    visualContext: "Video Lab Active\nModel: Veo 3.1 Fast",
    narration: "A cinematic drone shot of a futuristic city with flying cars, neon lights, 4k resolution",
    icon: Video,
    themeColor: "text-purple-600 bg-purple-100"
  },
  {
    id: ScenarioId.SEARCH,
    type: ScenarioType.INTERACTIVE_SEARCH,
    title: "Fact Checker",
    shortDescription: "Grounded Google Search.",
    visualContext: "World Knowledge Active\nSource: Google Search",
    narration: "Who won the gold medal in Men's 100m at the Paris 2024 Olympics?",
    icon: Globe,
    themeColor: "text-orange-600 bg-orange-100"
  },
  {
    id: ScenarioId.VISION,
    type: ScenarioType.INTERACTIVE_VISION,
    title: "Visual Aid",
    shortDescription: "Image Understanding.",
    visualContext: "Vision System Active\nModel: Gemini 3 Pro",
    narration: "Analyze this scene and tell me what safety hazards are present.",
    icon: Eye,
    themeColor: "text-teal-600 bg-teal-100"
  },
  {
    id: ScenarioId.BEDTIME,
    type: ScenarioType.TTS,
    title: "Nighttime & Meds",
    shortDescription: "Routine management.",
    visualContext: "Routine: 10:02 PM\n1. Blood Pressure\n2. White Pill",
    narration: "Night meds on the counter, water poured. Blood-pressure pill first, then the white one. Lights off in 20. I'll set tomorrow's alarm for 6:45 and remind you about the 8 AM Zoom. Love you. Sleep good.",
    icon: Moon,
    themeColor: "text-slate-600 bg-slate-100"
  }
];