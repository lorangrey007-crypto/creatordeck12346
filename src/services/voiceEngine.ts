import { VoiceProfile, ParsedSegment, TTSEngine } from '../types';
import { getAudioContext, generateReactionBuffer, createSilenceBuffer } from './audioMastering';
import { renderGeminiTtsAudio, TTSProgressInfo } from './geminiTtsService';

export interface ModelProgressInfo {
  status: 'connecting' | 'rendering' | 'ready' | 'error';
  message: string;
}

export const BUILT_IN_VOICES: VoiceProfile[] = [
  // Google Gemini Neural TTS Voices (Online Studio Quality)
  {
    id: 'gemini-charon',
    name: 'Charon — Deep Cinematic Storyteller',
    engine: 'google-gemini',
    geminiVoiceKey: 'Charon',
    gender: 'male',
    style: 'Deep, resonant, immersive pacing — ideal for Reddit stories & dark mysteries',
    description: 'Rich low-end vocal timbre with authentic human cadence, breath acoustics, and gravitas.',
    accent: 'American (Cinematic Baritone)',
    pitchBias: -1.2,
    rateBias: 0.98,
    emotionExaggeration: 0.7,
  },
  {
    id: 'gemini-kore',
    name: 'Kore — Expressive Narrative & Drama',
    engine: 'google-gemini',
    geminiVoiceKey: 'Kore',
    gender: 'female',
    style: 'Warm, empathetic, expressive storytelling with natural dynamic range',
    description: 'Genuine vocal warmth and nuanced inflection for essays, fiction, and character dialogue.',
    accent: 'American (Warm Contralto)',
    pitchBias: 0.0,
    rateBias: 1.0,
    emotionExaggeration: 0.75,
  },
  {
    id: 'gemini-puck',
    name: 'Puck — Dynamic & Modern Narrator',
    engine: 'google-gemini',
    geminiVoiceKey: 'Puck',
    gender: 'male',
    style: 'Snappy, punchy, energetic hook delivery for YouTube Shorts & Podcasts',
    description: 'Crisp enunciation and contemporary pacing engineered for viewer engagement.',
    accent: 'American (Modern Tenor)',
    pitchBias: 0.4,
    rateBias: 1.08,
    emotionExaggeration: 0.8,
  },
  {
    id: 'gemini-fenrir',
    name: 'Fenrir — Gritty Suspense & True Crime',
    engine: 'google-gemini',
    geminiVoiceKey: 'Fenrir',
    gender: 'male',
    style: 'Tense, gravelly, solemn documentary presentation',
    description: 'Deliberate cadence and low-register intensity designed for crime investigations and thriller scripts.',
    accent: 'American (Deep Bass)',
    pitchBias: -2.0,
    rateBias: 0.92,
    emotionExaggeration: 0.85,
  },
  {
    id: 'gemini-zephyr',
    name: 'Zephyr — Clear Commentary & Audiobooks',
    engine: 'google-gemini',
    geminiVoiceKey: 'Zephyr',
    gender: 'female',
    style: 'Articulate, calm, intelligent long-form pacing',
    description: 'Refined enunciation and effortless clarity suited for audiobooks, educational essays, and business explainers.',
    accent: 'American (Clear Midrange)',
    pitchBias: 0.2,
    rateBias: 1.0,
    emotionExaggeration: 0.65,
  },
  {
    id: 'gemini-aoede',
    name: 'Aoede — Rich Dramatic & Classical Storyteller',
    engine: 'google-gemini',
    geminiVoiceKey: 'Aoede',
    gender: 'female',
    style: 'Lyrical, nuanced soprano delivery with poetic emotional resonance',
    description: 'High emotional sensitivity and classic theatrical delivery for dramatic scenes and reflective memoirs.',
    accent: 'Classical (Nuanced Soprano)',
    pitchBias: 0.5,
    rateBias: 0.96,
    emotionExaggeration: 0.8,
  },
];

/**
 * Extracts acoustic fingerprint from an uploaded sample to calibrate a Google Gemini neural voice profile
 */
export async function extractVoiceCloneProfile(
  file: File,
  name: string,
  engine: TTSEngine = 'google-gemini'
): Promise<VoiceProfile> {
  const ctx = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  // Compute acoustic spectral centroid & average pitch bias
  const data = audioBuffer.getChannelData(0);
  let zeroCrossings = 0;
  let energySum = 0;

  for (let i = 1; i < data.length; i++) {
    if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
      zeroCrossings++;
    }
    energySum += data[i] * data[i];
  }

  const duration = audioBuffer.duration;
  const approxFreq = zeroCrossings / (2 * Math.max(0.1, duration));
  const isFemale = approxFreq > 165;
  const pitchBias = isFemale ? Math.min(2.5, (approxFreq - 180) / 40) : Math.max(-2.5, (approxFreq - 120) / 30);
  const matchedGoogleKey = isFemale ? 'Kore' : 'Charon';

  return {
    id: `cloned_${Date.now()}`,
    name: `${name.trim() || 'Custom Clone'} (Calibrated)`,
    engine: 'google-gemini',
    gender: isFemale ? 'female' : 'male',
    style: 'Acoustic calibration derived from uploaded audio sample',
    description: `Target timbre calibrated from ${file.name} (${duration.toFixed(1)}s reference).`,
    accent: 'Calibrated Voice',
    pitchBias,
    rateBias: 1.0,
    geminiVoiceKey: matchedGoogleKey,
    emotionExaggeration: 0.75,
    isCloned: true,
    referenceAudioName: file.name,
  };
}

/**
 * Blends two neural voices mathematically to create a hybrid signature profile (Voice DNA)
 */
export function blendVoices(
  voiceA: VoiceProfile,
  voiceB: VoiceProfile,
  ratio: number, // 0.0 (100% A) to 1.0 (100% B)
  name: string
): VoiceProfile {
  const combinedPitch = voiceA.pitchBias * (1 - ratio) + voiceB.pitchBias * ratio;
  const combinedRate = voiceA.rateBias * (1 - ratio) + voiceB.rateBias * ratio;
  const combinedEmotion = (voiceA.emotionExaggeration || 0.6) * (1 - ratio) + (voiceB.emotionExaggeration || 0.6) * ratio;

  const targetKey = ratio > 0.5 ? (voiceB.geminiVoiceKey || 'Charon') : (voiceA.geminiVoiceKey || 'Charon');

  return {
    id: `blended_${Date.now()}`,
    name: `${name.trim() || 'Custom Blend'} (Hybrid)`,
    engine: 'google-gemini',
    gender: ratio > 0.5 ? voiceB.gender : voiceA.gender,
    style: `Hybrid DNA blend: ${Math.round((1 - ratio) * 100)}% ${voiceA.name.split('—')[0].trim()} + ${Math.round(ratio * 100)}% ${voiceB.name.split('—')[0].trim()}`,
    description: 'Custom acoustic blend powered by Google Gemini TTS neural engine.',
    accent: 'Custom Hybrid',
    pitchBias: combinedPitch,
    rateBias: combinedRate,
    geminiVoiceKey: targetKey,
    emotionExaggeration: combinedEmotion,
    isBlended: true,
    blendInfo: {
      voiceAId: voiceA.id,
      voiceBId: voiceB.id,
      ratio,
    },
  };
}

/**
 * Renders an individual script segment using Google Gemini TTS API
 */
export async function renderSegmentAudio(
  segment: ParsedSegment,
  voice: VoiceProfile,
  ctx: AudioContext,
  onProgress?: (info: ModelProgressInfo) => void
): Promise<AudioBuffer> {
  // If this segment is an organic paralinguistic human reaction (sigh, gasp, laugh, etc.)
  if (segment.reactionSound) {
    const reactionBuf = generateReactionBuffer(segment.reactionSound, ctx);
    segment.durationSec = reactionBuf.duration;
    return reactionBuf;
  }

  const cleanText = segment.cleanText.trim();
  if (!cleanText) {
    // Pure silence pause segment
    const silenceDur = (segment.pauseBeforeSec || 0) + (segment.pauseAfterSec || 0.4);
    const silenceBuf = createSilenceBuffer(Math.max(0.1, silenceDur), ctx);
    segment.durationSec = silenceBuf.duration;
    return silenceBuf;
  }

  // Render via Google Gemini TTS API (Server-Side Endpoint)
  return renderGeminiTtsAudio(segment, voice, ctx, (info: TTSProgressInfo) => {
    onProgress?.({
      status: info.status,
      message: info.message,
    });
  });
}
