import { ScriptTab, VoiceProfile, CustomAudioStyle, PronunciationRule, MasteringSettings } from '../types';
import { 
  loadStoredTabs, 
  saveStoredTabs, 
  saveActiveTabId, 
  saveStoredCustomVoices, 
  saveStoredCustomStyles, 
  saveStoredPronunciations, 
  saveStoredMastering 
} from './storageService';

export interface CreatorDeckBackup {
  format: 'creatordeck-backup';
  version: 1;
  exportedAt: string;
  projectName: string;
  tabs: ScriptTab[];
  activeTabId?: string;
  customVoices?: VoiceProfile[];
  customStyles?: CustomAudioStyle[];
  pronunciations?: PronunciationRule[];
  mastering?: MasteringSettings;
  scriptStudio?: {
    shortScript?: string;
    longScript?: string;
    messages?: any[];
  };
  brollStudio?: {
    messages?: any[];
    result?: any;
  };
  seoStudio?: {
    result?: any;
    topicFocus?: string;
    videoType?: string;
  };
}

export interface BackupSummary {
  tabCount: number;
  tabTitles: string[];
  hasShortScript: boolean;
  hasLongScript: boolean;
  hasBrollShotSheet: boolean;
  brollSceneCount: number;
  hasThumbnails: boolean;
  thumbnailCount: number;
  hasSeo: boolean;
  seoTitleCount: number;
  voiceCount: number;
  dictionaryCount: number;
  exportedAt: string;
  projectName: string;
}

/**
 * Compiles current app state from memory and persistent stores into a single complete JSON backup.
 */
export function buildProjectBackup(
  tabs: ScriptTab[],
  activeTabId: string,
  customVoices: VoiceProfile[],
  customStyles: CustomAudioStyle[],
  pronunciations: PronunciationRule[],
  mastering: MasteringSettings
): CreatorDeckBackup {
  let scriptStudioData: any = {};
  try {
    const raw = localStorage.getItem('narrator_script_studio_v2');
    if (raw) scriptStudioData = JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read script studio data for backup', e);
  }

  let brollMessages: any[] = [];
  try {
    const raw = localStorage.getItem('narrator_broll_chat_v1');
    if (raw) brollMessages = JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read broll chat for backup', e);
  }

  let brollResult: any = null;
  try {
    const raw = localStorage.getItem('narrator_broll_result_v1');
    if (raw) brollResult = JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read broll result for backup', e);
  }

  let seoResult: any = null;
  try {
    const raw = localStorage.getItem('narrator_youtube_seo');
    if (raw) seoResult = JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read seo result for backup', e);
  }

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const safeProjectName = activeTab ? activeTab.title.replace(/[^\w\s-]/g, '').trim() || 'Untitled-Project' : 'CreatorDeck-Project';

  return {
    format: 'creatordeck-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    projectName: safeProjectName,
    tabs,
    activeTabId,
    customVoices,
    customStyles,
    pronunciations,
    mastering,
    scriptStudio: scriptStudioData,
    brollStudio: {
      messages: brollMessages,
      result: brollResult,
    },
    seoStudio: {
      result: seoResult,
    },
  };
}

/**
 * Triggers a direct browser download of the project JSON backup file to the user's PC.
 */
export function downloadBackupToPc(backup: CreatorDeckBackup): void {
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = backup.projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
  const fileName = `creatordeck-${safeName || 'project'}-${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Parses and inspects an uploaded JSON file to summarize contents before restoring.
 */
export async function parseBackupFile(file: File): Promise<{ backup: CreatorDeckBackup; summary: BackupSummary }> {
  const text = await file.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (err: any) {
    throw new Error('Invalid JSON file. Please ensure you uploaded a valid .json project backup.');
  }

  // Basic structure verification
  const tabs = Array.isArray(parsed.tabs) ? parsed.tabs : [];
  if (tabs.length === 0 && !parsed.scriptStudio && !parsed.brollStudio && !parsed.seoStudio) {
    throw new Error('This file does not appear to be a CreatorDeck project backup. No script tabs or studio data found.');
  }

  const backup: CreatorDeckBackup = {
    format: 'creatordeck-backup',
    version: 1,
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    projectName: parsed.projectName || file.name.replace(/\.json$/i, ''),
    tabs: tabs.map((t: any, i: number) => ({
      id: t.id || `tab_imported_${Date.now()}_${i}`,
      title: t.title || `Imported Script ${i + 1}`,
      content: t.content || '',
      pacingMultiplier: typeof t.pacingMultiplier === 'number' ? t.pacingMultiplier : 1.0,
      voiceId: t.voiceId || 'gemini-charon',
      engine: 'google-gemini',
      updatedAt: t.updatedAt || Date.now(),
    })),
    activeTabId: parsed.activeTabId || (tabs[0] ? tabs[0].id : undefined),
    customVoices: Array.isArray(parsed.customVoices) ? parsed.customVoices : [],
    customStyles: Array.isArray(parsed.customStyles) ? parsed.customStyles : [],
    pronunciations: Array.isArray(parsed.pronunciations) ? parsed.pronunciations : [],
    mastering: parsed.mastering || undefined,
    scriptStudio: parsed.scriptStudio || undefined,
    brollStudio: parsed.brollStudio || undefined,
    seoStudio: parsed.seoStudio || undefined,
  };

  const shotSheet = backup.brollStudio?.result?.shotSheet;
  const thumbnails = backup.brollStudio?.result?.thumbnails;
  const seoTitles = backup.seoStudio?.result?.titles;

  const summary: BackupSummary = {
    tabCount: backup.tabs.length,
    tabTitles: backup.tabs.map(t => t.title),
    hasShortScript: Boolean(backup.scriptStudio?.shortScript),
    hasLongScript: Boolean(backup.scriptStudio?.longScript),
    hasBrollShotSheet: Array.isArray(shotSheet) && shotSheet.length > 0,
    brollSceneCount: Array.isArray(shotSheet) ? shotSheet.length : 0,
    hasThumbnails: Array.isArray(thumbnails) && thumbnails.length > 0,
    thumbnailCount: Array.isArray(thumbnails) ? thumbnails.length : 0,
    hasSeo: Boolean(backup.seoStudio?.result),
    seoTitleCount: Array.isArray(seoTitles) ? seoTitles.length : 0,
    voiceCount: backup.customVoices?.length || 0,
    dictionaryCount: backup.pronunciations?.length || 0,
    exportedAt: backup.exportedAt,
    projectName: backup.projectName,
  };

  return { backup, summary };
}

/**
 * Restores the backup payload into browser storage (localStorage).
 */
export function restoreBackupToStorage(backup: CreatorDeckBackup): void {
  if (backup.tabs && backup.tabs.length > 0) {
    saveStoredTabs(backup.tabs);
    if (backup.activeTabId) {
      saveActiveTabId(backup.activeTabId);
    }
  }

  if (backup.customVoices && backup.customVoices.length > 0) {
    saveStoredCustomVoices(backup.customVoices);
  }

  if (backup.customStyles && backup.customStyles.length > 0) {
    saveStoredCustomStyles(backup.customStyles);
  }

  if (backup.pronunciations && backup.pronunciations.length > 0) {
    saveStoredPronunciations(backup.pronunciations);
  }

  if (backup.mastering) {
    saveStoredMastering(backup.mastering);
  }

  if (backup.scriptStudio) {
    localStorage.setItem('narrator_script_studio_v2', JSON.stringify(backup.scriptStudio));
  }

  if (backup.brollStudio) {
    if (backup.brollStudio.messages) {
      localStorage.setItem('narrator_broll_chat_v1', JSON.stringify(backup.brollStudio.messages));
    }
    if (backup.brollStudio.result) {
      localStorage.setItem('narrator_broll_result_v1', JSON.stringify(backup.brollStudio.result));
    }
  }

  if (backup.seoStudio && backup.seoStudio.result) {
    localStorage.setItem('narrator_youtube_seo', JSON.stringify(backup.seoStudio.result));
  }
}
