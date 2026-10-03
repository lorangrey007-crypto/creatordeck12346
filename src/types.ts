export type TTSEngine = 'google-gemini' | 'kokoro-82m' | 'chatterbox-nano';

export interface VoiceProfile {
  id: string;
  name: string;
  engine: TTSEngine;
  gender: 'male' | 'female';
  style: string;
  description: string;
  accent: string;
  pitchBias: number;
  rateBias: number;
  geminiVoiceKey?: string;
  kokoroVoiceKey?: string;
  emotionExaggeration?: number;
  isCloned?: boolean;
  isBlended?: boolean;
  referenceAudioName?: string;
  blendInfo?: {
    voiceAId: string;
    voiceBId: string;
    ratio: number;
  };
}

export interface CustomAudioStyle {
  id: string;
  tag: string; // e.g. "late-night-radio"
  name: string;
  pitchOffset: number; // -10 to +10 semitones
  speedMultiplier: number; // 0.6 to 1.6
  gainDb: number; // -6 to +6 dB
  bassBoost: number; // 0 to 6 dB
  trebleBoost: number; // 0 to 6 dB
}

export interface PronunciationRule {
  id: string;
  find: string;
  replaceWith: string;
  enabled: boolean;
}

export type WorkspaceFormat = 'shorts' | 'long-form';

export interface ScriptTab {
  id: string;
  title: string;
  content: string;
  format?: WorkspaceFormat; // 'shorts' (9:16) vs 'long-form' (16:9)
  pacingMultiplier: number; // 0.5 to 1.5
  voiceId: string;
  engine: TTSEngine;
  updatedAt: number;
  // Isolated Workspace State per Tab
  latestTake?: RenderedTake | null;
  isVoiceGenerating?: boolean;
  voiceProgress?: { current: number; total: number; stage: string };
  brollResult?: BRollThumbnailResult | null;
  veoClips?: VeoClip[];
  visualStyleDna?: {
    characterDescription?: string;
    lightingAndPalette?: string;
    cameraPreset?: string;
  };
}

export interface ParsedSegment {
  id: string;
  index: number;
  rawText: string;
  cleanText: string;
  tags: string[];
  emotion?: string;
  pauseBeforeSec: number;
  pauseAfterSec: number;
  pitchDelta: number;
  speedMultiplier: number;
  gainDb: number;
  whisper: boolean;
  reactionSound?: 'sigh' | 'gasp' | 'laugh' | 'gulp' | 'throat-clear' | 'exhale';
  audioBuffer?: AudioBuffer;
  durationSec?: number;
  status: 'idle' | 'rendering' | 'done' | 'error';
}

export interface MasteringSettings {
  broadcastEq: boolean; // Shure SM7B chest warmth & vocal air
  youtubeLufs: boolean; // -14 LUFS broadcast standard
  peakLimiter: boolean; // Zero digital clipping
  zeroCrossingSmooth: boolean; // Click & pop elimination
  outputFormat: 'wav' | 'mp3';
  antiAliasingFilter?: boolean; // Smooth Nyquist edge & zero digital squeal
  auditionAmbience?: boolean; // Deprecated
}

export interface RenderedTake {
  id: string;
  tabId: string;
  tabTitle: string;
  timestamp: number;
  voiceName: string;
  engine: TTSEngine;
  totalDurationSec: number;
  segmentCount: number;
  wavBlob: Blob;
  srtContent: string;
  segments: ParsedSegment[];
}

export interface SeoTitleItem {
  title: string;
  style: string;
  charCount: number;
  rationale: string;
}

export interface SeoDescriptionData {
  aboveTheFold: string;
  bodySynopsis: string;
  keyTopics: string[];
  pinnedComment: string;
}

export interface SeoChapterItem {
  time: string;
  title: string;
}

export interface YouTubeSeoResult {
  titles: SeoTitleItem[];
  description: SeoDescriptionData;
  chapters: SeoChapterItem[];
  tags: string[];
  hashtags: string[];
  groundingQueries?: string[];
  analyzedAt: number;
  isQuotaFallback?: boolean;
  quotaWarning?: string;
}

export interface BRollCueItem {
  timestamp: string;
  durationSec?: number;
  spokenText: string;
  visualAction: string;
  sfxCue: string;
  stockKeywords: string;
  // Veo Video Generation Enhancements
  veoPrompt: string;
  veoCameraMotion?: string;
  veoLighting?: string;
  veoShotType?: string;
  veoStylePreset?: 'cinematic' | 'documentary' | 'dark-mystery' | 'cyberpunk' | 'hyper-real';
  lockedToSrt?: boolean;
}

export interface ThumbnailConceptItem {
  conceptTitle: string;
  visualComposition: string;
  textOverlay: string;
  colorGrading: string;
  aiImagePrompt: string;
  generatedImageUrl?: string;
  isGeneratingImage?: boolean;
  imageError?: string;
}

export interface VeoClip {
  id: string;
  prompt: string;
  timestamp?: string;
  shotNumber?: number;
  durationSec: number;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  model: 'veo-3.1-lite-generate-preview' | 'veo-3.1-generate-preview';
  operationName?: string;
  status: 'pending' | 'polling' | 'ready' | 'failed';
  videoBlobUrl?: string;
  videoDataUrl?: string;
  videoBase64?: string;
  posterFrameUrl?: string;
  createdAt: number;
  errorMessage?: string;
  stylePreset?: string;
}

export interface GeneratedThumbnail {
  id: string;
  conceptTitle: string;
  prompt: string;
  aspectRatio: '16:9' | '1:1' | '9:16';
  imageUrl: string;
  textOverlay?: string;
  createdAt: number;
}

export interface BRollChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface BRollThumbnailResult {
  shotSheet: BRollCueItem[];
  thumbnails: ThumbnailConceptItem[];
  pacingTips: string[];
  replyText?: string;
  groundingQueries?: string[];
  analyzedAt: number;
  isQuotaFallback?: boolean;
  quotaWarning?: string;
}
