import { CustomAudioStyle, ParsedSegment, PronunciationRule } from '../types';
import { DEFAULT_SCRIPT } from './storageService';

export { DEFAULT_SCRIPT };

export interface ScriptStats {
  characters: number;
  words: number;
  sentences: number;
  pauseCount: number;
  emotionCount: number;
  estimatedSeconds: number;
}

export type PauseTagConfig = { type: 'pause'; duration: number };
export type DeliveryTagConfig = { type: 'delivery'; pitch: number; speed: number; gain: number; whisper: boolean };
export type ReactionTagConfig = {
  type: 'reaction';
  reaction: 'sigh' | 'gasp' | 'laugh' | 'gulp' | 'throat-clear' | 'exhale';
  duration: number;
};
export type GoogleVoiceTagConfig = PauseTagConfig | DeliveryTagConfig | ReactionTagConfig;
export type ElevenTagConfig = GoogleVoiceTagConfig;

// Built-in Google TTS Voice Tag profiles
export const GOOGLE_VOICE_TAGS: Record<string, GoogleVoiceTagConfig> = {
  // Timing
  '[short pause]': { type: 'pause', duration: 0.4 },
  '[pause]': { type: 'pause', duration: 1.0 },
  '[long pause]': { type: 'pause', duration: 2.0 },
  '[dramatic pause]': { type: 'pause', duration: 2.5 },
  '[hesitates]': { type: 'pause', duration: 0.6 },

  // Delivery & Tone
  '[whispers]': { type: 'delivery', pitch: -1, speed: 0.92, gain: -3, whisper: true },
  '[quietly]': { type: 'delivery', pitch: -0.5, speed: 0.95, gain: -3, whisper: true },
  '[shouts]': { type: 'delivery', pitch: 2, speed: 1.15, gain: 2.5, whisper: false },
  '[drawn out]': { type: 'delivery', pitch: -0.5, speed: 0.78, gain: 0, whisper: false },
  '[rushed]': { type: 'delivery', pitch: 1, speed: 1.25, gain: 0.5, whisper: false },
  '[flatly]': { type: 'delivery', pitch: -1.5, speed: 0.96, gain: -1, whisper: false },
  '[seriously]': { type: 'delivery', pitch: -1.2, speed: 0.9, gain: 0.5, whisper: false },
  '[solemn]': { type: 'delivery', pitch: -1.5, speed: 0.88, gain: -0.5, whisper: false },
  '[dark]': { type: 'delivery', pitch: -2.2, speed: 0.86, gain: 1, whisper: false },
  '[creepy]': { type: 'delivery', pitch: -2.0, speed: 0.84, gain: -1, whisper: true },
  '[angry]': { type: 'delivery', pitch: 1.5, speed: 1.18, gain: 2.0, whisper: false },
  '[furious]': { type: 'delivery', pitch: 2.0, speed: 1.25, gain: 2.5, whisper: false },
  '[confident]': { type: 'delivery', pitch: 0.5, speed: 1.05, gain: 1.0, whisper: false },
  '[excited]': { type: 'delivery', pitch: 1.8, speed: 1.15, gain: 1.5, whisper: false },
  '[calm]': { type: 'delivery', pitch: -0.5, speed: 0.95, gain: 0, whisper: false },
  '[matter-of-fact]': { type: 'delivery', pitch: -0.8, speed: 1.0, gain: 0, whisper: false },
  // Normal / Reset Tone
  '[normal]': { type: 'delivery', pitch: 0, speed: 1.0, gain: 0, whisper: false },
  '[neutral]': { type: 'delivery', pitch: 0, speed: 1.0, gain: 0, whisper: false },
  '[reset]': { type: 'delivery', pitch: 0, speed: 1.0, gain: 0, whisper: false },
  '[default]': { type: 'delivery', pitch: 0, speed: 1.0, gain: 0, whisper: false },

  // Organic Human Reactions
  '[sighs]': { type: 'reaction', reaction: 'sigh', duration: 1.1 },
  '[gasps]': { type: 'reaction', reaction: 'gasp', duration: 0.8 },
  '[laughs]': { type: 'reaction', reaction: 'laugh', duration: 1.2 },
  '[gulps]': { type: 'reaction', reaction: 'gulp', duration: 0.6 },
  '[clears throat]': { type: 'reaction', reaction: 'throat-clear', duration: 0.9 },
  '[exhales]': { type: 'reaction', reaction: 'exhale', duration: 1.0 },
};

export const ELEVEN_V3_TAGS = GOOGLE_VOICE_TAGS;

/**
 * Strips markdown headers, bullet points, speaker prefixes, non-standard quotes,
 * bold/italics, and excessive spacing while preserving all Google voice bracketed tags.
 */
export function cleanScriptText(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // 1. Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Normalize smart quotes, apostrophes, dashes, ellipses
  text = text.replace(/[\u2018\u2019\u201A\u201B]/g, "'");
  text = text.replace(/[\u201C\u201D\u201E\u201F]/g, '"');
  text = text.replace(/\u2014/g, ' — ');
  text = text.replace(/\u2013/g, ' - ');
  text = text.replace(/\u2026/g, '...');

  // 3. Remove Markdown header indicators at start of lines (#, ##, ###, etc.)
  text = text.replace(/^[ \t]*#{1,6}[ \t]+/gm, '');

  // 4. Remove bullet list markers at start of lines (*, -, •, –)
  text = text.replace(/^[ \t]*[*\-•–][ \t]+/gm, '');

  // 5. Remove numbered list prefixes at start of lines (e.g. "1. ", "2) ")
  text = text.replace(/^[ \t]*\d+[.)][ \t]+/gm, '');

  // 6. Remove speaker prefixes (e.g. "Narrator: ", "Host: ", "VO: ", "Speaker 1: ")
  text = text.replace(/^[ \t]*(?:Narrator|Host|Voiceover|VO|V\.O\.|Speaker\s*\d+|Protagonist|Interviewer)[ \t]*:[ \t]*/gmi, '');

  // 7. Convert Markdown links [Link Text](https://url) to just Link Text
  text = text.replace(/\[([^\]]+)\]\((?:https?:\/\/[^\)]+|[^\)]+)\)/g, '$1');

  // 8. Convert parenthetical performance directions into voice tags if recognized
  text = text.replace(/\((?:whispers|whispering)\)/gi, '[whispers]');
  text = text.replace(/\((?:sighs|sighing)\)/gi, '[sighs]');
  text = text.replace(/\((?:gasps|gasping)\)/gi, '[gasps]');
  text = text.replace(/\((?:laughs|laughing|chuckles)\)/gi, '[laughs]');
  text = text.replace(/\((?:gulps|gulping)\)/gi, '[gulps]');
  text = text.replace(/\((?:clears throat|clearing throat)\)/gi, '[clears throat]');
  text = text.replace(/\((?:pause|short pause)\)/gi, '[short pause]');
  text = text.replace(/\((?:long pause|dramatic pause)\)/gi, '[dramatic pause]');

  // 9. Remove markdown formatting like bold, italic, strikethrough, inline code
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  text = text.replace(/~~([^~]+)~~/g, '$1');
  text = text.replace(/`([^`]+)`/g, '$1');

  // 10. Normalize spacing inside bracket tags: e.g. [  pause  ] -> [pause]
  text = text.replace(/\[[ \t]+([^\]]+?)[ \t]+\]/g, '[$1]');

  // 11. Normalize punctuation spacing (remove spaces before punctuation)
  text = text.replace(/[ \t]+([.,!?;:])/g, '$1');

  // 12. Fix missing space after sentence punctuation if immediately followed by an uppercase letter
  text = text.replace(/([.!?])([A-Z])/g, '$1 $2');

  // 13. Remove trailing whitespace on each line
  text = text.replace(/[ \t]+$/gm, '');

  // 14. Remove excessive horizontal spaces (preserve single spaces)
  text = text.replace(/[ \t]{2,}/g, ' ');

  // 15. Clean excessive blank lines (max 2 consecutive newlines)
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Applies custom pronunciation rules to text before synthesis
 */
export function applyPronunciations(text: string, rules: PronunciationRule[]): string {
  let result = text;
  for (const rule of rules) {
    if (!rule.enabled || !rule.find.trim()) continue;
    try {
      const regex = new RegExp(`\\b${escapeRegExp(rule.find)}\\b`, 'gi');
      result = result.replace(regex, rule.replaceWith);
    } catch {
      // fallback substring replace
      result = result.split(rule.find).join(rule.replaceWith);
    }
  }
  return result;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Calculates live script stats for the inspector
 */
export function calculateScriptStats(
  text: string,
  pacingMultiplier: number = 1.0,
  customStyles: CustomAudioStyle[] = []
): ScriptStats {
  if (!text.trim()) {
    return {
      characters: 0,
      words: 0,
      sentences: 0,
      pauseCount: 0,
      emotionCount: 0,
      estimatedSeconds: 0,
    };
  }

  // Count bracketed tags
  const tagMatches = text.match(/\[[^\]]+\]/g) || [];
  let pauseSecs = 0;
  let pauseCount = 0;
  let emotionCount = 0;

  for (const tag of tagMatches) {
    const lower = tag.toLowerCase();
    const info = ELEVEN_V3_TAGS[lower];
    if (info) {
      if (info.type === 'pause') {
        pauseCount++;
        pauseSecs += info.duration * pacingMultiplier;
      } else if (info.type === 'reaction') {
        pauseSecs += (info.duration || 1.0);
      } else {
        emotionCount++;
      }
    } else {
      // Check custom styles
      const isCustom = customStyles.some(s => `[${s.tag.toLowerCase()}]` === lower);
      if (isCustom) {
        emotionCount++;
      }
    }
  }

  // Words & Characters in clean spoken text
  const cleanSpoken = text.replace(/\[[^\]]+\]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleanSpoken ? cleanSpoken.split(/\s+/).filter(Boolean).length : 0;
  const characters = cleanSpoken.length;

  // Average conversational English speed: ~145 words per minute (2.4 words per sec)
  const spokenSecs = words > 0 ? words / 2.4 : 0;
  const estimatedSeconds = Math.round(spokenSecs + pauseSecs);

  // Approximate sentence count
  const sentences = cleanSpoken.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;

  return {
    characters,
    words,
    sentences,
    pauseCount,
    emotionCount,
    estimatedSeconds,
  };
}

/**
 * Master parser: splits script into sequential segments for streaming execution.
 * Guaranteed: NO bracketed tags remain in cleanText!
 */
export function parseScriptToSegments(
  rawScript: string,
  pacingMultiplier: number = 1.0,
  customStyles: CustomAudioStyle[] = []
): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  if (!rawScript.trim()) return segments;

  // Step 1: Normalize line endings
  const normalized = rawScript.replace(/\r\n/g, '\n');

  // Step 2: Extract paragraphs or lines, respecting double newlines
  const paragraphs = normalized.split(/\n\n+/);

  let segmentCounter = 0;

  // Persistent delivery state that carries across sentences until explicitly changed or reset
  let activeDelivery = {
    pitchDelta: 0,
    speedMultiplier: 1.0,
    gainDb: 0,
    whisper: false,
    emotion: '',
  };

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) continue;

    // Split paragraph by sentences, but preserve tags attached to sentences
    // We split on sentence punctuation followed by space or newline
    const sentenceRegex = /([^.!?\n]+(?:[.!?]+|$)|\n)/g;
    const rawMatches = paragraph.match(sentenceRegex) || [paragraph];

    for (let rawSentence of rawMatches) {
      rawSentence = rawSentence.trim();
      if (!rawSentence) continue;

      // Extract all tags inside this sentence
      const tags: string[] = [];
      const tagRegex = /\[([^\]]+)\]/g;
      let match;

      let pauseBefore = 0;
      let pauseAfter = 0;
      let reactionSound: ParsedSegment['reactionSound'] | undefined = undefined;

      while ((match = tagRegex.exec(rawSentence)) !== null) {
        const fullTag = `[${match[1].toLowerCase().trim()}]`;
        tags.push(fullTag);

        // Check ElevenLabs v3 built-in catalog
        const cfg = ELEVEN_V3_TAGS[fullTag];
        if (cfg) {
          if (cfg.type === 'pause') {
            const tagIndex = match.index;
            if (tagIndex < 5) {
              pauseBefore += cfg.duration * pacingMultiplier;
            } else {
              pauseAfter += cfg.duration * pacingMultiplier;
            }
          } else if (cfg.type === 'delivery') {
            // Update persistent delivery state so it persists across entire sentence & paragraph!
            if (fullTag === '[normal]' || fullTag === '[neutral]' || fullTag === '[reset]' || fullTag === '[default]') {
              activeDelivery = {
                pitchDelta: 0,
                speedMultiplier: 1.0,
                gainDb: 0,
                whisper: false,
                emotion: '',
              };
            } else {
              activeDelivery = {
                pitchDelta: cfg.pitch,
                speedMultiplier: cfg.speed,
                gainDb: cfg.gain,
                whisper: cfg.whisper,
                emotion: fullTag.replace(/[\[\]]/g, ''),
              };
            }
          } else if (cfg.type === 'reaction') {
            reactionSound = cfg.reaction;
          }
        }

        // Check custom styles
        const customStyle = customStyles.find(s => `[${s.tag.toLowerCase()}]` === fullTag);
        if (customStyle) {
          activeDelivery = {
            pitchDelta: customStyle.pitchOffset,
            speedMultiplier: customStyle.speedMultiplier,
            gainDb: customStyle.gainDb,
            whisper: false,
            emotion: customStyle.name,
          };
        }
      }

      // Check for standalone punctuation cues like "..." or "—"
      if (rawSentence.includes('...') || rawSentence.includes('…')) {
        pauseAfter += 0.4 * pacingMultiplier;
      }
      if (rawSentence.includes(' — ') || rawSentence.includes(' - ')) {
        pauseAfter += 0.25 * pacingMultiplier;
      }

      // ABSOLUTE ZERO-PRONUNCIATION GUARANTEE:
      // Strip ALL bracketed tags from the clean spoken text
      const cleanText = rawSentence.replace(/\[[^\]]+\]/g, '').replace(/\s+/g, ' ').trim();

      // Only push if there is actual clean spoken text OR a reaction/pause
      if (cleanText.length > 0 || reactionSound || pauseBefore > 0 || pauseAfter > 0) {
        segments.push({
          id: `seg_${segmentCounter}_${Date.now()}`,
          index: segmentCounter++,
          rawText: rawSentence,
          cleanText: cleanText,
          tags,
          emotion: activeDelivery.emotion,
          pauseBeforeSec: pauseBefore,
          pauseAfterSec: pauseAfter,
          pitchDelta: activeDelivery.pitchDelta,
          speedMultiplier: activeDelivery.speedMultiplier,
          gainDb: activeDelivery.gainDb,
          whisper: activeDelivery.whisper,
          reactionSound,
          status: 'idle',
        });
      }
    }
  }

  return segments;
}
