/**
 * Formats seconds into SMPTE timecode (HH:MM:SS:FF)
 */
export function formatSMPTETimecode(seconds: number, fps: number = 30): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * fps);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
}

/**
 * Formats seconds into standard audio clock MM:SS.ms
 */
export function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
}

/**
 * Creates initial default tracks for an NLE timeline
 */
export function createDefaultTracks() {
  return [
    {
      id: 'track-v2',
      name: 'V2 Overlay',
      label: 'V2 • B-Roll & Titles',
      type: 'overlay' as const,
      order: 0,
      muted: false,
      solo: false,
      locked: false,
      visible: true,
      volume: 1.0,
      height: 52,
      clips: [],
    },
    {
      id: 'track-v1',
      name: 'V1 Main Video',
      label: 'V1 • Primary Video',
      type: 'video' as const,
      order: 1,
      muted: false,
      solo: false,
      locked: false,
      visible: true,
      volume: 1.0,
      height: 64,
      clips: [],
    },
    {
      id: 'track-a1',
      name: 'A1 Voiceover',
      label: 'A1 • Voiceover Narration',
      type: 'audio' as const,
      order: 2,
      muted: false,
      solo: false,
      locked: false,
      visible: true,
      volume: 1.0,
      height: 54,
      clips: [],
    },
    {
      id: 'track-a2',
      name: 'A2 Music & SFX',
      label: 'A2 • Music & Ambience',
      type: 'sfx' as const,
      order: 3,
      muted: false,
      solo: false,
      locked: false,
      visible: true,
      volume: 0.8,
      height: 54,
      clips: [],
    },
  ];
}

/**
 * Generates an EDL (Edit Decision List) text file for DaVinci Resolve & Premiere Pro
 */
export function generateEDL(tracks: any[], fps = 30): string {
  let edl = `TITLE: CREATORDECK_TIMELINE_EXPORT\nFCM: NON-DROP FRAME\n\n`;
  let eventIndex = 1;

  tracks.forEach((track) => {
    track.clips.forEach((clip: any) => {
      const srcIn = formatSMPTETimecode(clip.sourceOffset || 0, fps);
      const srcOut = formatSMPTETimecode((clip.sourceOffset || 0) + clip.duration, fps);
      const recIn = formatSMPTETimecode(clip.start, fps);
      const recOut = formatSMPTETimecode(clip.start + clip.duration, fps);
      const trackCode = track.type.startsWith('audio') || track.type === 'sfx' ? 'A' : 'V';

      edl += `${String(eventIndex).padStart(3, '0')}  AX       ${trackCode}     C        ${srcIn} ${srcOut} ${recIn} ${recOut}\n`;
      edl += `* FROM CLIP NAME: ${clip.name}\n\n`;
      eventIndex++;
    });
  });

  return edl;
}

/**
 * Synthesizes a test tone / beep buffer for offline testing
 */
export function createSyntheticBeep(ctx: AudioContext, frequency = 440, duration = 0.5): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < buffer.length; i++) {
    data[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * Math.exp(-i / (sampleRate * duration * 0.5));
  }
  return buffer;
}
