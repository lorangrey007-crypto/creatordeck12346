export type TrackType = 'video' | 'overlay' | 'audio' | 'sfx' | 'subtitle';

export interface ChromaKeySettings {
  enabled: boolean;
  color: 'green' | 'blue' | 'magenta' | 'custom';
  customHex?: string;
  similarity: number; // 0.0 - 1.0 (default 0.4)
  smoothness: number; // 0.0 - 1.0 (default 0.1)
  spillReduction: number; // 0.0 - 1.0 (default 0.5)
}

export type BlendMode = 'normal' | 'screen' | 'multiply' | 'overlay' | 'color-dodge';

export interface MotionTransform {
  scale: number; // 0.2 - 3.0 (default 1.0)
  posX: number; // offset from center in px
  posY: number;
  rotation: number; // degrees
}

export interface TimelineClip {
  id: string;
  trackId: string;
  name: string;
  type: TrackType;
  start: number; // in seconds
  duration: number; // in seconds
  sourceOffset?: number; // trim in-point in seconds
  sourceTotalDuration?: number; // total length of raw media in seconds
  mediaUrl?: string; // blob URL, object URL, or data URI
  audioBuffer?: AudioBuffer; // cached WebAudio buffer for audio clips
  color?: string; // hex or tailwind badge style
  thumbnailUrl?: string;
  textOverlay?: string; // text caption or subtitle
  volume?: number; // 0.0 - 2.0 (default 1.0)
  speed?: number; // 0.5 - 2.0 (default 1.0)
  opacity?: number; // 0.0 - 1.0 (for video/overlay)
  aspectRatio?: '16:9' | '9:16' | '1:1';
  // Advanced Layer & Green Screen Features
  chromaKey?: ChromaKeySettings;
  blendMode?: BlendMode;
  transform?: MotionTransform;
  filterPreset?: 'none' | 'cinematic-teal' | 'warm-vintage' | 'noir' | 'cyberpunk-neon' | 'vibrant-boost';
  isTemplate?: boolean;
  templateCategory?: 'subscribe-button' | 'lower-third' | 'countdown' | 'quote-card' | 'split-screen';
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  label: string; // e.g., 'V1 - Main Video', 'V2 - B-Roll / Overlay', 'A1 - Voiceover', 'A2 - Music & SFX'
  order: number;
  muted: boolean;
  solo: boolean;
  locked: boolean;
  visible: boolean;
  volume: number; // 0.0 - 1.5
  height?: number; // in px
  clips: TimelineClip[];
}

export type TimelineTool = 'select' | 'razor' | 'trim-start' | 'trim-end' | 'hand';

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  url: string;
  duration: number;
  sizeBytes?: number;
  thumbnailUrl?: string;
  createdAt: number;
  source: 'voice-studio' | 'veo-studio' | 'imagen-studio' | 'uploaded' | 'sample';
}

export interface TimelineProject {
  id: string;
  title: string;
  fps: number; // 30 or 60
  aspectRatio: '16:9' | '9:16';
  duration: number; // total timeline duration in seconds
  tracks: TimelineTrack[];
  markers: TimelineMarker[];
}

export interface CoWorkerMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  suggestedAction?: {
    label: string;
    type: 'split_at_playhead' | 'ripple_delete_gaps' | 'import_voice_take' | 'add_broll_at_playhead' | 'add_marker' | 'snap_to_beat';
    payload?: any;
  };
}
