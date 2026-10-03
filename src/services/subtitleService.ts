import { ParsedSegment } from '../types';

export interface SrtEntry {
  index: number;
  startTime: string; // HH:MM:SS,mmm
  endTime: string;   // HH:MM:SS,mmm
  text: string;
}

/**
 * Formats seconds into SRT timestamp format: 00:00:00,000
 */
export function formatSrtTimestamp(totalSeconds: number): string {
  const safeSec = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSec / 3600);
  const minutes = Math.floor((safeSec % 3600) / 60);
  const seconds = Math.floor(safeSec % 60);
  const milliseconds = Math.floor((safeSec - Math.floor(safeSec)) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

/**
 * Generates clean, synchronized SRT subtitles from rendered segments.
 * GUARANTEED: ZERO TAGS IN SUBTITLES. Captions blank during pauses.
 */
export function generateSrtContent(segments: ParsedSegment[]): string {
  const entries: SrtEntry[] = [];
  let currentTime = 0;
  let srtIndex = 1;

  for (const seg of segments) {
    // 1. Account for pause before sentence (captions are blank during this silence)
    currentTime += seg.pauseBeforeSec;

    // 2. If there is clean spoken text, generate an SRT entry
    const cleanText = seg.cleanText.trim();
    const duration = seg.durationSec || (cleanText.length > 0 ? cleanText.split(/\s+/).length / 2.4 : 1.0);

    if (cleanText.length > 0) {
      const startTimeStr = formatSrtTimestamp(currentTime);
      const endTimeStr = formatSrtTimestamp(currentTime + duration);

      entries.push({
        index: srtIndex++,
        startTime: startTimeStr,
        endTime: endTimeStr,
        text: cleanText,
      });
    }

    // 3. Advance time by spoken audio duration and pause after
    currentTime += duration;
    currentTime += seg.pauseAfterSec;
  }

  // Build the standardized SRT block text
  return entries
    .map(e => `${e.index}\n${e.startTime} --> ${e.endTime}\n${e.text}\n`)
    .join('\n');
}

/**
 * Converts an SRT timestamp (HH:MM:SS,mmm or MM:SS,mmm or HH:MM:SS.mmm) into seconds
 */
export function srtTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const normalized = timeStr.trim().replace(',', '.');
  const parts = normalized.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  return parseFloat(normalized) || 0;
}

export interface ParsedSrtItem {
  index: number;
  startSec: number;
  endSec: number;
  durationSec: number;
  startTime: string;
  endTime: string;
  text: string;
}

/**
 * Parses raw SRT string into structured subtitle blocks with real start/end seconds
 */
export function parseSrtEntries(srtContent: string): ParsedSrtItem[] {
  if (!srtContent || !srtContent.trim()) return [];
  const blocks = srtContent.trim().split(/\n\s*\n/);
  const items: ParsedSrtItem[] = [];

  for (const block of blocks) {
    const lines = block.trim().split(/\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    // Line 1 may be index number, or Line 0 is index
    let timeLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timeLineIdx = i;
        break;
      }
    }
    if (timeLineIdx === -1) continue;

    const [startRaw, endRaw] = lines[timeLineIdx].split('-->').map(s => s.trim());
    const text = lines.slice(timeLineIdx + 1).join(' ').trim();
    const startSec = srtTimeToSeconds(startRaw);
    const endSec = srtTimeToSeconds(endRaw);
    const durationSec = Math.max(0.1, endSec - startSec);

    items.push({
      index: items.length + 1,
      startSec,
      endSec,
      durationSec,
      startTime: startRaw,
      endTime: endRaw,
      text,
    });
  }

  return items;
}

/**
 * Creates a downloadable .srt file Blob
 */
export function createSrtBlob(srtContent: string): Blob {
  return new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
}
