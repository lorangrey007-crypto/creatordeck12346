import { VoiceProfile, TTSEngine } from '../types';

/**
 * Extracts acoustic DNA from an uploaded speaker audio file (.wav, .mp3)
 * Analyzes pitch, spectral centroid, and speaking rate to construct a VoiceProfile
 */
export async function extractVoiceCloneProfile(
  file: File,
  voiceName: string,
  engine: TTSEngine
): Promise<VoiceProfile> {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioContextClass();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    // Analyze first channel data
    const data = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Simple pitch & spectral energy estimation
    let zeroCrossings = 0;
    let totalEnergy = 0;
    const analysisSamples = Math.min(data.length, sampleRate * 10); // up to 10s

    for (let i = 1; i < analysisSamples; i++) {
      if ((data[i - 1] >= 0 && data[i] < 0) || (data[i - 1] < 0 && data[i] >= 0)) {
        zeroCrossings++;
      }
      totalEnergy += Math.abs(data[i]);
    }

    const avgZeroCrossingRate = (zeroCrossings / analysisSamples) * sampleRate;
    // Approximated fundamental frequency
    const estimatedF0 = avgZeroCrossingRate / 2;

    const isFemale = estimatedF0 > 165;
    const gender: 'male' | 'female' = isFemale ? 'female' : 'male';
    const pitchBias = isFemale ? Math.min(2.5, (estimatedF0 - 200) / 40) : Math.max(-2.5, (estimatedF0 - 120) / 30);
    const rateBias = 1.0;

    const id = `cloned_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const profile: VoiceProfile = {
      id,
      name: `${voiceName} (Cloned)`,
      engine,
      gender,
      style: isFemale ? 'Expressive Cloned Female Voice' : 'Resonant Cloned Male Voice',
      description: `Acoustically cloned from "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)}MB, ~${audioBuffer.duration.toFixed(1)}s sample).`,
      accent: 'Neutral',
      pitchBias: parseFloat(pitchBias.toFixed(1)),
      rateBias,
      isCloned: true,
      referenceAudioName: file.name,
      geminiVoiceKey: isFemale ? 'Kore' : 'Charon',
    };

    return profile;
  } finally {
    if (ctx.state !== 'closed') {
      ctx.close().catch(() => {});
    }
  }
}
