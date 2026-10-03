import { ScriptTab, VoiceProfile, CustomAudioStyle, PronunciationRule, MasteringSettings } from '../types';
import { BUILT_IN_VOICES } from './voiceEngine';

const STORAGE_KEYS = {
  TABS: 'narratorstudio_tabs_v1',
  ACTIVE_TAB: 'narratorstudio_active_tab_v1',
  THEME: 'narratorstudio_theme_v1',
  CUSTOM_VOICES: 'narratorstudio_custom_voices_v1',
  CUSTOM_STYLES: 'narratorstudio_custom_styles_v1',
  PRONUNCIATIONS: 'narratorstudio_pronunciations_v1',
  MASTERING: 'narratorstudio_mastering_v1',
};

export const DEFAULT_SCRIPT = `[seriously] Most parents would have reported the account.

[pause]

I just logged in.

[long pause]

[whispers] Quiet crying. Coming from the computer.

[pause]

My son had died in an accident three weeks earlier. But every night, at 3:17 AM... his Minecraft character logged on.

[dark] The server was private. Just him and me.

[dramatic pause]

[whispers] I clicked into the world. [pause] There he was, standing by the oak tree we planted together.

[gasps]

[seriously] Then, in the chat window, a single message appeared:

[whispers] "Dad... don't turn around."`;

export const DEFAULT_TABS: ScriptTab[] = [
  {
    id: 'tab_minecraft_story',
    title: 'Reddit Story — Minecraft 3:17 AM',
    content: DEFAULT_SCRIPT,
    pacingMultiplier: 1.0,
    voiceId: 'gemini-charon',
    engine: 'google-gemini',
    updatedAt: Date.now(),
  },
];

export const DEFAULT_MASTERING: MasteringSettings = {
  broadcastEq: true,
  youtubeLufs: true,
  peakLimiter: true,
  zeroCrossingSmooth: true,
  outputFormat: 'wav',
  auditionAmbience: false,
};

export const DEFAULT_CUSTOM_STYLES: CustomAudioStyle[] = [
  {
    id: 'style_late_night',
    tag: 'late-night-radio',
    name: 'Late Night Radio',
    pitchOffset: -1.5,
    speedMultiplier: 0.9,
    gainDb: 1.0,
    bassBoost: 3.5,
    trebleBoost: 1.0,
  },
  {
    id: 'style_interrogation',
    tag: 'interrogation',
    name: 'Interrogation Room',
    pitchOffset: -2.0,
    speedMultiplier: 0.85,
    gainDb: 0.5,
    bassBoost: 2.0,
    trebleBoost: -1.0,
  },
];

export const DEFAULT_PRONUNCIATIONS: PronunciationRule[] = [
  {
    id: 'pr_minecraft',
    find: 'Minecraft',
    replaceWith: 'Mine craft',
    enabled: true,
  },
  {
    id: 'pr_herobrine',
    find: 'Herobrine',
    replaceWith: 'Hero bryne',
    enabled: true,
  },
];

export function loadStoredTabs(): ScriptTab[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TABS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((tab: ScriptTab) => ({
          ...tab,
          engine: 'google-gemini' as const,
          voiceId: tab.voiceId?.startsWith('gemini-') ? tab.voiceId : 'gemini-charon',
        }));
      }
    }
  } catch (e) {
    console.error('Failed to load tabs from storage', e);
  }
  return DEFAULT_TABS;
}

export function saveStoredTabs(tabs: ScriptTab[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TABS, JSON.stringify(tabs));
  } catch (e) {
    console.error('Failed to save tabs to storage', e);
  }
}

export function loadActiveTabId(tabs: ScriptTab[]): string {
  try {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
    if (id && tabs.some(t => t.id === id)) return id;
  } catch (e) {
    console.error('Failed to load active tab from storage', e);
  }
  return tabs[0]?.id || 'tab_default';
}

export function saveActiveTabId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, id);
  } catch (e) {
    console.error('Failed to save active tab to storage', e);
  }
}

export function loadStoredTheme(): 'system' | 'light' | 'dark' {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (theme === 'light' || theme === 'dark' || theme === 'system') return theme;
  } catch (e) {
    console.error('Failed to load theme from storage', e);
  }
  return 'system';
}

export function saveStoredTheme(theme: 'system' | 'light' | 'dark'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {
    console.error('Failed to save theme to storage', e);
  }
}

export function loadStoredCustomVoices(): VoiceProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_VOICES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((v: VoiceProfile) => ({
          ...v,
          engine: 'google-gemini' as const,
          geminiVoiceKey: v.geminiVoiceKey || (v.gender === 'female' ? 'Kore' : 'Charon'),
        }));
      }
    }
  } catch (e) {
    console.error('Failed to load custom voices from storage', e);
  }
  return [];
}

export function saveStoredCustomVoices(voices: VoiceProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_VOICES, JSON.stringify(voices));
  } catch (e) {
    console.error('Failed to save custom voices to storage', e);
  }
}

export function loadStoredCustomStyles(): CustomAudioStyle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_STYLES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load custom styles from storage', e);
  }
  return DEFAULT_CUSTOM_STYLES;
}

export function saveStoredCustomStyles(styles: CustomAudioStyle[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_STYLES, JSON.stringify(styles));
  } catch (e) {
    console.error('Failed to save custom styles to storage', e);
  }
}

export function loadStoredPronunciations(): PronunciationRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRONUNCIATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load pronunciations from storage', e);
  }
  return DEFAULT_PRONUNCIATIONS;
}

export function saveStoredPronunciations(rules: PronunciationRule[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRONUNCIATIONS, JSON.stringify(rules));
  } catch (e) {
    console.error('Failed to save pronunciations to storage', e);
  }
}

export function loadStoredMastering(): MasteringSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MASTERING);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_MASTERING, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load mastering from storage', e);
  }
  return DEFAULT_MASTERING;
}

export function saveStoredMastering(settings: MasteringSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MASTERING, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save mastering to storage', e);
  }
}
