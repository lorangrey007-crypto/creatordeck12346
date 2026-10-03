import { VoiceProfile, ParsedSegment } from '../types';
import { getApiKeyHeaders, getCustomApiKey } from './geminiKeyService';

export interface TTSProgressInfo {
  status: 'connecting' | 'rendering' | 'ready' | 'error';
  message: string;
}

/**
 * Client service to communicate with Google Gemini TTS API via server-side endpoint.
 * Zero client-side API keys, zero heavy offline model downloads, pure studio-grade speech.
 */
export async function renderGeminiTtsAudio(
  segment: ParsedSegment,
  voice: VoiceProfile,
  ctx: AudioContext,
  onProgress?: (info: TTSProgressInfo) => void
): Promise<AudioBuffer> {
  const cleanText = segment.cleanText.trim();
  if (!cleanText) {
    // Pure silence segment
    const silenceDuration = Math.max(0.1, (segment.pauseBeforeSec || 0) + (segment.pauseAfterSec || 0.4));
    return ctx.createBuffer(1, Math.floor(silenceDuration * ctx.sampleRate), ctx.sampleRate);
  }

  onProgress?.({
    status: 'rendering',
    message: `Rendering with Google ${voice.name.split('—')[0].trim()}...`,
  });

  // Determine Google voice key (default Charon)
  const voiceKey = voice.geminiVoiceKey || voice.name.split(' ')[0] || 'Charon';

  // Build style prompt if tags indicate an emotion/delivery
  let stylePrompt = '';
  if (segment.whisper) {
    stylePrompt = 'In a quiet, gentle, intimate whisper';
  } else if (segment.emotion) {
    const emLower = segment.emotion.toLowerCase();
    if (emLower.includes('dark') || emLower.includes('creepy') || emLower.includes('horror')) {
      stylePrompt = 'In a dark, eerie, and suspenseful cinematic tone';
    } else if (emLower.includes('excited') || emLower.includes('shout')) {
      stylePrompt = 'With high energy and vibrant enthusiasm';
    } else if (emLower.includes('solemn') || emLower.includes('serious')) {
      stylePrompt = 'In a grave, serious, solemn delivery';
    } else if (emLower.includes('calm')) {
      stylePrompt = 'In a calm, composed, and soothing voice';
    }
  }

  try {
    const customKey = getCustomApiKey();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...getApiKeyHeaders(),
    };

    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text: cleanText,
        voice: voiceKey,
        speed: (voice.rateBias || 1.0) * (segment.speedMultiplier || 1.0),
        pitch: (voice.pitchBias || 0) + (segment.pitchDelta || 0),
        whisper: segment.whisper,
        stylePrompt: stylePrompt,
        apiKey: customKey || undefined,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.details || errData.error || `HTTP ${response.status} failed`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    onProgress?.({
      status: 'ready',
      message: 'Ready',
    });

    segment.durationSec = audioBuffer.duration;
    return audioBuffer;
  } catch (err: any) {
    console.error('[Gemini TTS Client] Synthesis failed:', err);
    onProgress?.({
      status: 'error',
      message: err.message || 'Generation error',
    });
    throw err;
  }
}
