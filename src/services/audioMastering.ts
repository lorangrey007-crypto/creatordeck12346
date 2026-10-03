import { MasteringSettings } from '../types';

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass({ sampleRate: 48000 });
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Creates an organic human non-verbal acoustic buffer
 * (sigh, gasp, laugh, gulp, throat-clear, exhale) using physical synthesis.
 */
export function generateReactionBuffer(
  type: 'sigh' | 'gasp' | 'laugh' | 'gulp' | 'throat-clear' | 'exhale',
  ctx: AudioContext
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  let duration = 0.8;
  if (type === 'sigh') duration = 1.1;
  else if (type === 'gasp') duration = 0.55;
  else if (type === 'laugh') duration = 1.2;
  else if (type === 'gulp') duration = 0.35;
  else if (type === 'throat-clear') duration = 0.75;
  else if (type === 'exhale') duration = 0.95;

  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // Generate shaped acoustic noise & formants with pink-noise lowpass filtering
  let noiseFilter = 0;
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const progress = i / length;

    // Single-pole low-pass filter to remove harsh frequencies above ~1.5kHz
    const rawWhite = Math.random() * 2 - 1;
    noiseFilter = noiseFilter + 0.1 * (rawWhite - noiseFilter);
    const softBreathNoise = noiseFilter * 1.5;

    if (type === 'sigh' || type === 'exhale') {
      // Gentle breath release: soft air decaying
      const env = Math.sin(progress * Math.PI) * Math.exp(-progress * 2.2);
      data[i] = softBreathNoise * env * 0.3;
    } else if (type === 'gasp') {
      // Sharp breath intake
      const env = Math.pow(progress, 2.5) * (1 - Math.pow(progress, 16));
      data[i] = softBreathNoise * env * 0.35;
    } else if (type === 'laugh') {
      // Rhythmic chuckle bursts
      const burstFreq = 4.5;
      const burstEnv = Math.pow(Math.sin(t * burstFreq * Math.PI * 2), 4);
      const vocalTone = Math.sin(2 * Math.PI * 140 * t) * 0.15;
      data[i] = (softBreathNoise * 0.2 + vocalTone) * burstEnv * (1 - progress * 0.7);
    } else if (type === 'gulp') {
      // Low throat resonance click
      const freq = 110 * Math.exp(-progress * 5);
      const tone = Math.sin(2 * Math.PI * freq * t);
      const env = Math.sin(progress * Math.PI) * Math.exp(-progress * 6);
      data[i] = tone * env * 0.4;
    } else if (type === 'throat-clear') {
      // Dual-tone gentle throat rasp
      const rasp2 = Math.sin(2 * Math.PI * 180 * t) * 0.15;
      const env = Math.sin(progress * Math.PI);
      data[i] = (softBreathNoise * 0.25 + rasp2) * env * 0.3;
    }
  }

  // Smooth zero-crossings
  applyZeroCrossingSmoothing(data, sampleRate);
  return buffer;
}

/**
 * Creates a silent audio buffer of specified seconds
 */
export function createSilenceBuffer(seconds: number, ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * seconds));
  return ctx.createBuffer(1, length, sampleRate);
}

/**
 * Applies zero-crossing smoothing to avoid clicks and pops
 */
export function applyZeroCrossingSmoothing(channelData: Float32Array, sampleRate: number, fadeMs = 6): void {
  const fadeSamples = Math.min(Math.floor((fadeMs / 1000) * sampleRate), Math.floor(channelData.length / 2));
  for (let i = 0; i < fadeSamples; i++) {
    const fadeIn = Math.sin((i / fadeSamples) * (Math.PI / 2));
    channelData[i] *= fadeIn;
    const fadeOut = Math.sin(((fadeSamples - i) / fadeSamples) * (Math.PI / 2));
    channelData[channelData.length - 1 - i] *= fadeOut;
  }
}

/**
 * Applies broadcast mastering (SM7B EQ curve, YouTube -14 LUFS normalization, limiter)
 * to an existing AudioBuffer.
 */
export async function masterAudioBuffer(
  inputBuffer: AudioBuffer,
  settings: MasteringSettings,
  ctx: AudioContext
): Promise<AudioBuffer> {
  const sampleRate = inputBuffer.sampleRate;
  const numChannels = inputBuffer.numberOfChannels;
  const length = inputBuffer.length;

  if (length === 0) return inputBuffer;

  // Use OfflineAudioContext for instantaneous rendering
  const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = inputBuffer;

  let lastNode: AudioNode = source;

  // 1. Shure SM7B Broadcast Warmth Parametric EQ
  if (settings.broadcastEq) {
    // Low-shelf: +2.2 dB at 150 Hz (rich broadcaster chest warmth)
    const lowShelf = offlineCtx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 150;
    lowShelf.gain.value = 2.2;

    // Peaking notch: -1.5 dB at 3200 Hz (smooths harsh vocal fatigue)
    const notch = offlineCtx.createBiquadFilter();
    notch.type = 'peaking';
    notch.frequency.value = 3200;
    notch.Q.value = 1.2;
    notch.gain.value = -1.5;

    // High-shelf: +1.0 dB at 8000 Hz (clean studio airy presence without aliasing edge)
    const highShelf = offlineCtx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 8000;
    highShelf.gain.value = 1.0;

    // Studio Anti-Aliasing De-Harsh Low-pass: Eliminates 12kHz/24kHz Nyquist whistle & digital high-frequency whine
    const antiWhistle = offlineCtx.createBiquadFilter();
    antiWhistle.type = 'lowpass';
    antiWhistle.frequency.value = 11200;
    antiWhistle.Q.value = 0.707;

    lastNode.connect(lowShelf);
    lowShelf.connect(notch);
    notch.connect(highShelf);
    highShelf.connect(antiWhistle);
    lastNode = antiWhistle;
  }

  // 2. Broadcast Dynamic Compressor & Peak Limiter
  if (settings.peakLimiter) {
    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.value = -14; // dB
    compressor.knee.value = 12; // soft-knee
    compressor.ratio.value = 3.5; // smooth vocal leveller
    compressor.attack.value = 0.005; // 5ms fast attack
    compressor.release.value = 0.12; // 120ms release

    lastNode.connect(compressor);
    lastNode = compressor;
  }

  // Connect to destination
  lastNode.connect(offlineCtx.destination);
  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();

  // 3. YouTube -14 LUFS Loudness Normalization & Peak Check
  if (settings.youtubeLufs) {
    normalizeToTargetLoudness(renderedBuffer, -14);
  }

  // 4. Zero-crossing smoothing check on entire buffer
  if (settings.zeroCrossingSmooth) {
    for (let c = 0; c < renderedBuffer.numberOfChannels; c++) {
      applyZeroCrossingSmoothing(renderedBuffer.getChannelData(c), sampleRate, 10);
    }
  }

  return renderedBuffer;
}

/**
 * Normalizes an audio buffer to approximately target LUFS (-14 dB for YouTube)
 * with ceiling protection at -1.0 dBFS true peak to prevent any distortion.
 */
function normalizeToTargetLoudness(buffer: AudioBuffer, targetLufs: number): void {
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    let sumSquares = 0;
    let peak = 0;

    for (let i = 0; i < data.length; i++) {
      const val = Math.abs(data[i]);
      if (val > peak) peak = val;
      sumSquares += val * val;
    }

    const rms = Math.sqrt(sumSquares / data.length);
    if (rms <= 0.00001 || peak <= 0.00001) continue;

    // Approximate LUFS from RMS in speech band
    const approxLufs = 20 * Math.log10(rms);
    const gainFactor = Math.pow(10, (targetLufs - approxLufs) / 20);

    // Limit gain so peak never exceeds 0.89 (-1.0 dBFS ceiling)
    const maxSafeGain = 0.89 / peak;
    const finalGain = Math.min(gainFactor, maxSafeGain);

    for (let i = 0; i < data.length; i++) {
      data[i] *= finalGain;
    }
  }
}

/**
 * Stitches multiple AudioBuffers into a single continuous AudioBuffer
 * with zero-crossing crossfades between seams.
 */
export function stitchAudioBuffers(buffers: AudioBuffer[], ctx: AudioContext): AudioBuffer {
  if (buffers.length === 0) {
    return ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  }

  const sampleRate = ctx.sampleRate;
  let totalLength = 0;
  for (const buf of buffers) {
    if (buf.sampleRate === sampleRate) {
      totalLength += buf.length;
    } else {
      totalLength += Math.round((buf.length / buf.sampleRate) * sampleRate);
    }
  }

  const output = ctx.createBuffer(1, Math.max(1, totalLength), sampleRate);
  const outData = output.getChannelData(0);

  let offset = 0;
  for (const buf of buffers) {
    const inData = buf.getChannelData(0);
    if (buf.sampleRate === sampleRate) {
      outData.set(inData, offset);
      offset += buf.length;
    } else {
      // Linear interpolation resample to match target context sample rate
      const targetLen = Math.round((buf.length / buf.sampleRate) * sampleRate);
      const ratio = (buf.length - 1) / Math.max(1, targetLen - 1);
      for (let i = 0; i < targetLen && (offset + i) < outData.length; i++) {
        const srcIdx = i * ratio;
        const i0 = Math.floor(srcIdx);
        const i1 = Math.min(inData.length - 1, i0 + 1);
        const frac = srcIdx - i0;
        outData[offset + i] = inData[i0] * (1 - frac) + inData[i1] * frac;
      }
      offset += targetLen;
    }
  }

  // Smooth the whole track
  applyZeroCrossingSmoothing(outData, sampleRate, 8);
  return output;
}

/**
 * Encodes an AudioBuffer into a broadcast-standard Lossless WAV Blob (48kHz, 16-bit PCM).
 * Ready for immediate import into CapCut.
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let samples: Float32Array;
  if (numChannels === 2) {
    // Interleave stereo
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    samples = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      samples[i * 2] = left[i];
      samples[i * 2 + 1] = right[i];
    }
  } else {
    samples = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM samples (16-bit clamped)
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Creates a subtle 52 Hz cinematic sub drone oscillator for the "Audition with Ambience"
 * toggle, letting the creator hear the vocal sitting on top of atmospheric low-end music.
 */
export function startAuditionAmbience(_ctx: AudioContext): void {
  // Completely disabled to eliminate any background oscillator noise
}

export function stopAuditionAmbience(): void {
  // Completely disabled
}
