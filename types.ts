import { LucideIcon } from 'lucide-react';

export enum ScenarioId {
  DOCTOR = 'doctor',
  PHARMACY = 'pharmacy',
  DINNER = 'dinner',
  CLASS = 'class',
  BEDTIME = 'bedtime',
  // New Features
  IMAGE_GEN = 'image_gen',
  VIDEO_GEN = 'video_gen',
  SEARCH = 'search',
  VISION = 'vision',
  LIVE = 'live',
  NAVIGATION = 'navigation'
}

export enum ScenarioType {
  TTS = 'tts', // Standard text-to-speech scenario
  INTERACTIVE_IMAGE = 'interactive_image',
  INTERACTIVE_VIDEO = 'interactive_video',
  INTERACTIVE_SEARCH = 'interactive_search',
  INTERACTIVE_VISION = 'interactive_vision',
  INTERACTIVE_MAP = 'interactive_map',
  LIVE = 'live'
}

export interface Scenario {
  id: ScenarioId;
  type: ScenarioType;
  title: string;
  shortDescription: string;
  visualContext: string; // Text displayed on screen
  narration: string; // Spoken by AI (for TTS) or Initial Prompt (for Interactive)
  icon: LucideIcon;
  themeColor: string;
}

export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface GeneratedContent {
  type: 'image' | 'video' | 'text';
  url?: string; // For image/video
  text?: string; // For text response
  sources?: { uri: string; title: string }[]; // For grounding
}