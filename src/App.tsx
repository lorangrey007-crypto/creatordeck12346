import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header, WorkspaceModule } from './components/Header';
import { ProjectTabs } from './components/ProjectTabs';
import { ScriptEditor } from './components/ScriptEditor';
import { VoiceAndMasteringPanel } from './components/VoiceAndMasteringPanel';
import { GenerationProgress } from './components/GenerationProgress';
import { TimelinePlayer } from './components/TimelinePlayer';
import { VoiceCloneModal } from './components/VoiceCloneModal';
import { VoiceBlendModal } from './components/VoiceBlendModal';
import { CustomStyleModal } from './components/CustomStyleModal';
import { PronunciationModal } from './components/PronunciationModal';
import { RecentTakesModal } from './components/RecentTakesModal';
import { GeminiStatusModal } from './components/GeminiStatusModal';
import { ScriptWriterModal } from './components/ScriptWriterModal';
import { ScriptStudio } from './components/ScriptStudio';
import { SeoStudio } from './components/SeoStudio';
import { BRollStudio } from './components/BRollStudio';
import { VeoStudioModule } from './components/VeoStudioModule';
import { ImagenStudioModule } from './components/ImagenStudioModule';
import { TimelineEditorStudio } from './components/TimelineEditorStudio';
import { VeoVaultEngine } from './components/VeoVaultEngine';
import { Footer } from './components/Footer';
import { FeatureGuideModal } from './components/FeatureGuideModal';
import { FirstLaunchModal } from './components/FirstLaunchModal';
import { ProjectBackupModal } from './components/ProjectBackupModal';
import { CreatorDeckBackup } from './services/projectBackupService';
import { pingGeminiConnection, ConnectionStatus, hasConfiguredApiKey } from './services/geminiKeyService';

import { 
  ScriptTab, 
  WorkspaceFormat,
  VoiceProfile, 
  CustomAudioStyle, 
  PronunciationRule, 
  MasteringSettings, 
  RenderedTake, 
  ParsedSegment,
  TTSEngine,
  VeoClip,
  BRollCueItem
} from './types';

import { BUILT_IN_VOICES, renderSegmentAudio } from './services/voiceEngine';
import { parseScriptToSegments, applyPronunciations, DEFAULT_SCRIPT } from './services/elevenParser';
import { 
  getAudioContext, 
  masterAudioBuffer, 
  stitchAudioBuffers, 
  audioBufferToWavBlob, 
  createSilenceBuffer
} from './services/audioMastering';
import { generateSrtContent } from './services/subtitleService';
import { 
  loadStoredTabs, 
  saveStoredTabs, 
  loadActiveTabId, 
  saveActiveTabId, 
  loadStoredTheme, 
  saveStoredTheme,
  loadStoredCustomVoices,
  saveStoredCustomVoices,
  loadStoredCustomStyles,
  saveStoredCustomStyles,
  loadStoredPronunciations,
  saveStoredPronunciations,
  loadStoredMastering,
  saveStoredMastering
} from './services/storageService';

export default function App() {
  // Tabs & Project State
  const [tabs, setTabs] = useState<ScriptTab[]>(loadStoredTabs);
  const [activeTabId, setActiveTabId] = useState<string>(() => loadActiveTabId(tabs));

  // Active tab object
  const activeTab = useMemo(() => {
    return tabs.find((t) => t.id === activeTabId) || tabs[0] || {
      id: 'default',
      title: 'Script 1',
      content: DEFAULT_SCRIPT,
      pacingMultiplier: 1.0,
      voiceId: 'gemini-charon',
      engine: 'google-gemini' as TTSEngine,
      updatedAt: Date.now(),
    };
  }, [tabs, activeTabId]);

  // Theme Management (Windows system sync + persistent manual override)
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>(loadStoredTheme);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const currentThemeEffective = themeMode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : themeMode;

  useEffect(() => {
    if (currentThemeEffective === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentThemeEffective]);

  const handleThemeChange = (newMode: 'system' | 'light' | 'dark') => {
    setThemeMode(newMode);
    saveStoredTheme(newMode);
  };

  // Custom Voice Roster, Styles, Pronunciations, Mastering
  const [customVoices, setCustomVoices] = useState<VoiceProfile[]>(loadStoredCustomVoices);
  const [customStyles, setCustomStyles] = useState<CustomAudioStyle[]>(loadStoredCustomStyles);
  const [pronunciations, setPronunciations] = useState<PronunciationRule[]>(loadStoredPronunciations);
  const [mastering, setMastering] = useState<MasteringSettings>(loadStoredMastering);

  const [masterSpeed, setMasterSpeed] = useState<number>(1.0);
  const [masterPitch, setMasterPitch] = useState<number>(0);
  const [emotionExaggeration, setEmotionExaggeration] = useState<number>(0.65);
  const [modelProgressMessage, setModelProgressMessage] = useState<string>('');
  const [isAuditioning, setIsAuditioning] = useState<boolean>(false);

  // Audio & Render State
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgressIndex, setRenderProgressIndex] = useState<number>(0);
  const [totalRenderSegments, setTotalRenderSegments] = useState<number>(0);
  const [currentSentenceText, setCurrentSentenceText] = useState<string>('');

  const [currentAudioBuffer, setCurrentAudioBuffer] = useState<AudioBuffer | null>(null);
  const [currentWavBlob, setCurrentWavBlob] = useState<Blob | null>(null);
  const [currentSrt, setCurrentSrt] = useState<string>('');
  const [currentSegments, setCurrentSegments] = useState<ParsedSegment[]>([]);
  const [takes, setTakes] = useState<RenderedTake[]>([]);

  // Modals state
  const [showCloneModal, setShowCloneModal] = useState<boolean>(false);
  const [showBlendModal, setShowBlendModal] = useState<boolean>(false);
  const [showStylesModal, setShowStylesModal] = useState<boolean>(false);
  const [showPronunciationModal, setShowPronunciationModal] = useState<boolean>(false);
  const [showTakesModal, setShowTakesModal] = useState<boolean>(false);
  const [showGeminiStatusModal, setShowGeminiStatusModal] = useState<boolean>(false);
  const [showScriptWriterModal, setShowScriptWriterModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);
  const [restoreSuccessBanner, setRestoreSuccessBanner] = useState<string | null>(null);
  const [hasConfiguredKey, setHasConfiguredKey] = useState<boolean>(() => hasConfiguredApiKey());
  const [showFirstLaunchModal, setShowFirstLaunchModal] = useState<boolean>(() => !hasConfiguredApiKey());
  const [activeModule, setActiveModule] = useState<WorkspaceModule>('voice-studio');

  const handleProjectRestored = (backup: CreatorDeckBackup) => {
    if (backup.tabs && backup.tabs.length > 0) {
      setTabs(backup.tabs);
      if (backup.activeTabId && backup.tabs.some((t) => t.id === backup.activeTabId)) {
        setActiveTabId(backup.activeTabId);
      } else {
        setActiveTabId(backup.tabs[0].id);
      }
    }
    if (backup.customVoices) setCustomVoices(backup.customVoices);
    if (backup.customStyles) setCustomStyles(backup.customStyles);
    if (backup.pronunciations) setPronunciations(backup.pronunciations);
    if (backup.mastering) setMastering(backup.mastering);
    if (backup.scriptStudio?.shortScript) setStudioShortScript(backup.scriptStudio.shortScript);
    if (backup.scriptStudio?.longScript) setStudioLongScript(backup.scriptStudio.longScript);

    setRestoreSuccessBanner(
      `Restored "${backup.projectName}" from your PC! (${backup.tabs.length} script tabs, audio & studio state ready)`
    );
    setTimeout(() => setRestoreSuccessBanner(null), 6000);
  };

  // Retain active scripts generated in Script Studio for SEO & B-Roll modules
  const [studioShortScript, setStudioShortScript] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('narrator_script_studio_v2');
      return saved ? JSON.parse(saved).shortScript || '' : '';
    } catch {
      return '';
    }
  });

  const [studioLongScript, setStudioLongScript] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('narrator_script_studio_v2');
      return saved ? JSON.parse(saved).longScript || '' : '';
    } catch {
      return '';
    }
  });

  // State to manage generated Veo Clips across the workspace
  const [veoClips, setVeoClips] = useState<VeoClip[]>(() => {
    try {
      const saved = localStorage.getItem('narrator_veo_clips');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      // Persist clips metadata (omitting huge blob URLs)
      const toSave = veoClips.map((c) => ({
        ...c,
        videoBlobUrl: undefined, // blob URLs don't persist across reloads
      }));
      localStorage.setItem('narrator_veo_clips', JSON.stringify(toSave));
    } catch {
      // ignore
    }
  }, [veoClips]);

  const handleAddVeoClip = (clip: VeoClip) => {
    setVeoClips((prev) => [clip, ...prev]);
  };

  const handleUpdateVeoClip = (id: string, updates: Partial<VeoClip>) => {
    setVeoClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleDeleteVeoClip = (id: string) => {
    setVeoClips((prev) => prev.filter((c) => c.id !== id));
  };

  // Script Studio to Voice Studio transfer handlers
  const handleSendScriptToVoiceStudio = (title: string, content: string) => {
    const newId = `tab_${Date.now()}`;
    const newTab: ScriptTab = {
      id: newId,
      title,
      content,
      pacingMultiplier: 1.0,
      voiceId: activeTab.voiceId || 'gemini-charon',
      engine: activeTab.engine || 'google-gemini',
      updatedAt: Date.now(),
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setActiveModule('voice-studio');
  };

  const handleSendBothScriptsToVoiceStudio = (
    shortTitle: string,
    shortContent: string,
    longTitle: string,
    longContent: string
  ) => {
    const time = Date.now();
    const shortTab: ScriptTab = {
      id: `tab_${time}_short`,
      title: shortTitle,
      content: shortContent,
      pacingMultiplier: 1.0,
      voiceId: activeTab.voiceId || 'gemini-charon',
      engine: activeTab.engine || 'google-gemini',
      updatedAt: time,
    };
    const longTab: ScriptTab = {
      id: `tab_${time}_long`,
      title: longTitle,
      content: longContent,
      pacingMultiplier: 1.0,
      voiceId: activeTab.voiceId || 'gemini-charon',
      engine: activeTab.engine || 'google-gemini',
      updatedAt: time + 1,
    };
    setTabs((prev) => [...prev, shortTab, longTab]);
    setActiveTabId(shortTab.id);
    setActiveModule('voice-studio');
  };

  // Real-time Gemini API Connection Health & Latency state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);

  const refreshConnectionHealth = async () => {
    try {
      const status = await pingGeminiConnection();
      setConnectionStatus(status);
    } catch {
      // Handled internally in pingGeminiConnection
    }
  };

  useEffect(() => {
    refreshConnectionHealth();
    // Heartbeat ping every 45s to maintain live latency readout
    const interval = setInterval(refreshConnectionHealth, 45000);
    return () => clearInterval(interval);
  }, []);

  const cancelRenderRef = useRef<boolean>(false);

  // Save changes to persistent storage
  useEffect(() => {
    saveStoredTabs(tabs);
  }, [tabs]);

  useEffect(() => {
    saveActiveTabId(activeTabId);
  }, [activeTabId]);

  useEffect(() => {
    saveStoredCustomVoices(customVoices);
  }, [customVoices]);

  useEffect(() => {
    saveStoredCustomStyles(customStyles);
  }, [customStyles]);

  useEffect(() => {
    saveStoredPronunciations(pronunciations);
  }, [pronunciations]);

  useEffect(() => {
    saveStoredMastering(mastering);
  }, [mastering]);

  // Combined Voice Library
  const allVoices = useMemo(() => {
    return [...BUILT_IN_VOICES, ...customVoices];
  }, [customVoices]);

  // Tab operations
  const handleUpdateActiveTab = (updates: Partial<ScriptTab>) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, ...updates, updatedAt: Date.now() } : t))
    );
  };

  const handleCreateTab = (format?: WorkspaceFormat) => {
    const fmt = format || 'long-form';
    const newId = `tab_${Date.now()}`;
    const newTab: ScriptTab = {
      id: newId,
      title: fmt === 'shorts' ? `Shorts #${tabs.filter((t) => t.format === 'shorts').length + 1}` : `Long Script #${tabs.filter((t) => t.format !== 'shorts').length + 1}`,
      format: fmt,
      content: '',
      pacingMultiplier: 1.0,
      voiceId: activeTab.voiceId || 'gemini-charon',
      engine: 'google-gemini',
      updatedAt: Date.now(),
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const handleToggleFormat = (id: string, newFormat: WorkspaceFormat) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, format: newFormat, updatedAt: Date.now() } : t))
    );
  };

  const handleCloseTab = (id: string) => {
    if (tabs.length <= 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[0].id);
    }
  };

  const handleRenameTab = (id: string, newTitle: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t))
    );
  };

  const handleReplaceScript = (newScript: string) => {
    handleUpdateActiveTab({ content: newScript });
  };

  const handleAppendScript = (scriptToAppend: string) => {
    const current = activeTab.content || '';
    const updated = current ? `${current.trim()}\n\n${scriptToAppend.trim()}` : scriptToAppend.trim();
    handleUpdateActiveTab({ content: updated });
  };

  const handleCreateNewTabWithScript = (title: string, newScript: string) => {
    const newId = `tab_${Date.now()}`;
    const newTab: ScriptTab = {
      id: newId,
      title: title || `Script ${tabs.length + 1}`,
      content: newScript,
      pacingMultiplier: 1.0,
      voiceId: activeTab.voiceId || 'gemini-charon',
      engine: 'google-gemini',
      updatedAt: Date.now(),
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  };

  // Keyboard shortcut: Ctrl + Enter to render
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isRendering) {
          handleGenerateAudio();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRendering, activeTab, allVoices, mastering, masterSpeed, masterPitch, customStyles, pronunciations]);

  // Audition Voice Sample (Instant 1-click test of active neural voice)
  const handleAuditionVoice = async (voiceId: string) => {
    if (isAuditioning || isRendering) return;
    setIsAuditioning(true);
    try {
      const ctx = getAudioContext();
      const voice = allVoices.find((v) => v.id === voiceId) || allVoices[0];
      const effectiveVoice: VoiceProfile = {
        ...voice,
        pitchBias: voice.pitchBias + masterPitch,
        rateBias: voice.rateBias * masterSpeed,
        emotionExaggeration: emotionExaggeration,
      };

      const sampleText = voice.style.includes('Reddit') || voice.style.includes('mystery') || voice.id.includes('fenrir') || voice.id.includes('charon')
        ? 'I could not believe what was hiding behind the basement door. It was pitch black.'
        : voice.gender === 'female'
        ? 'Welcome to the documentary. Let us explore the remarkable history of this world.'
        : 'This is an authentic demonstration of Google Gemini neural voice synthesis.';

      const seg: ParsedSegment = {
        id: `audition_${Date.now()}`,
        index: 0,
        rawText: sampleText,
        cleanText: sampleText,
        tags: [],
        pauseBeforeSec: 0,
        pauseAfterSec: 0,
        pitchDelta: 0,
        speedMultiplier: 1.0,
        gainDb: 0,
        whisper: false,
        status: 'idle',
      };

      const buf = await renderSegmentAudio(seg, effectiveVoice, ctx);
      const mastered = await masterAudioBuffer(buf, mastering, ctx);

      const source = ctx.createBufferSource();
      source.buffer = mastered;
      source.connect(ctx.destination);
      source.start();
      source.onended = () => {
        setIsAuditioning(false);
      };
    } catch (err) {
      console.error('Audition voice error:', err);
      setIsAuditioning(false);
    }
  };

  // Master Render Engine (Sequential Chunk Pipeline for 12,000+ characters)
  const handleGenerateAudio = async () => {
    if (!activeTab.content.trim() || isRendering) return;

    cancelRenderRef.current = false;
    setIsRendering(true);

    try {
      const ctx = getAudioContext();

      // Step 1: Pronunciation Dictionary preprocessing
      const processedText = applyPronunciations(activeTab.content, pronunciations);

      // Step 2: Parse text into sequential segments respecting ElevenLabs v3 tags
      // ABSOLUTE ZERO PRONUNCIATION GUARANTEE: all bracketed tags stripped from spoken text
      const segments = parseScriptToSegments(
        processedText,
        activeTab.pacingMultiplier || 1.0,
        customStyles
      );

      if (segments.length === 0) {
        setIsRendering(false);
        return;
      }

      setTotalRenderSegments(segments.length);
      setRenderProgressIndex(0);

      // Find active voice profile
      const voice = allVoices.find((v) => v.id === activeTab.voiceId) || allVoices[0];
      const effectiveVoice: VoiceProfile = {
        ...voice,
        pitchBias: voice.pitchBias + masterPitch,
        rateBias: voice.rateBias * masterSpeed,
        emotionExaggeration: emotionExaggeration,
      };

      const segmentBuffers: AudioBuffer[] = [];

      // Step 3: Sequential Chunking Loop (Flat RAM consumption)
      for (let i = 0; i < segments.length; i++) {
        if (cancelRenderRef.current) break;

        const seg = segments[i];
        setRenderProgressIndex(i + 1);
        setCurrentSentenceText(seg.cleanText || seg.reactionSound || 'Pause Interval');

        // Prepend silence if pauseBeforeSec is set
        if (seg.pauseBeforeSec > 0) {
          const silence = createSilenceBuffer(seg.pauseBeforeSec, ctx);
          segmentBuffers.push(silence);
        }

        // Render vocal performance with Kokoro-82M or Chatterbox Nano 100% offline
        const segAudio = await renderSegmentAudio(seg, effectiveVoice, ctx, (info) => {
          setModelProgressMessage(info.message);
        });
        seg.audioBuffer = segAudio;
        seg.durationSec = segAudio.duration;
        seg.status = 'done';
        segmentBuffers.push(segAudio);

        // Append silence if pauseAfterSec is set
        if (seg.pauseAfterSec > 0) {
          const silence = createSilenceBuffer(seg.pauseAfterSec, ctx);
          segmentBuffers.push(silence);
        }

        // Slight micro-yield to keep UI ultra responsive on low-end CPUs
        await new Promise((r) => setTimeout(r, 10));
      }

      if (cancelRenderRef.current) {
        setIsRendering(false);
        return;
      }

      // Step 4: Stitch all segment buffers with zero-crossing crossfades
      const rawMasterBuffer = stitchAudioBuffers(segmentBuffers, ctx);

      // Step 5: Broadcast Audio Mastering Suite Pass (SM7B EQ, YouTube -14 LUFS, limiter)
      const masteredBuffer = await masterAudioBuffer(rawMasterBuffer, mastering, ctx);

      // Step 6: Encode into broadcast-standard Lossless WAV Blob (48kHz)
      const wavBlob = audioBufferToWavBlob(masteredBuffer);

      // Step 7: Generate synchronized, tag-free .SRT captions
      const srtText = generateSrtContent(segments);

      // Step 8: Update master timeline player state
      setCurrentAudioBuffer(masteredBuffer);
      setCurrentWavBlob(wavBlob);
      setCurrentSrt(srtText);
      setCurrentSegments(segments);

      // Step 9: Save to Recent Takes Gallery
      const newTake: RenderedTake = {
        id: `take_${Date.now()}`,
        tabId: activeTab.id,
        tabTitle: activeTab.title,
        timestamp: Date.now(),
        voiceName: voice.name,
        engine: activeTab.engine,
        totalDurationSec: masteredBuffer.duration,
        segmentCount: segments.length,
        wavBlob,
        srtContent: srtText,
        segments,
      };

      setTakes((prev) => [newTake, ...prev.slice(0, 19)]); // Keep last 20 takes
    } catch (err) {
      console.error('Audio Generation Error:', err);
    } finally {
      setIsRendering(false);
      setCurrentSentenceText('');
    }
  };

  const handleCancelRender = () => {
    cancelRenderRef.current = true;
    setIsRendering(false);
  };

  // Single-Sentence Re-Roll (regenerates only one sentence without re-rendering entire script!)
  const handleReRollSegment = async (segmentIndex: number) => {
    if (!currentSegments[segmentIndex] || isRendering) return;
    try {
      const ctx = getAudioContext();
      const seg = currentSegments[segmentIndex];
      const voice = allVoices.find((v) => v.id === activeTab.voiceId) || allVoices[0];

      // Add a tiny random pitch micro-inflection to give a fresh take
      const reRollInflection = (Math.random() * 0.8 - 0.4);
      const tempVoice: VoiceProfile = {
        ...voice,
        pitchBias: voice.pitchBias + masterPitch + reRollInflection,
        rateBias: voice.rateBias * masterSpeed,
      };

      const newBuffer = await renderSegmentAudio(seg, tempVoice, ctx);
      seg.audioBuffer = newBuffer;
      seg.durationSec = newBuffer.duration;

      // Re-stitch master buffers
      const allBufs: AudioBuffer[] = [];
      for (const s of currentSegments) {
        if (s.pauseBeforeSec > 0) allBufs.push(createSilenceBuffer(s.pauseBeforeSec, ctx));
        if (s.audioBuffer) allBufs.push(s.audioBuffer);
        if (s.pauseAfterSec > 0) allBufs.push(createSilenceBuffer(s.pauseAfterSec, ctx));
      }

      const stitched = stitchAudioBuffers(allBufs, ctx);
      const mastered = await masterAudioBuffer(stitched, mastering, ctx);
      const wav = audioBufferToWavBlob(mastered);
      const srt = generateSrtContent(currentSegments);

      setCurrentAudioBuffer(mastered);
      setCurrentWavBlob(wav);
      setCurrentSrt(srt);
      setCurrentSegments([...currentSegments]);
    } catch (err) {
      console.error('Re-roll error', err);
    }
  };

  const handleRestoreTake = (take: RenderedTake) => {
    setCurrentAudioBuffer(take.segments[0]?.audioBuffer || null);
    setCurrentWavBlob(take.wavBlob);
    setCurrentSrt(take.srtContent);
    setCurrentSegments(take.segments);
    setShowTakesModal(false);
  };

  const handleResetToDefault = () => {
    handleUpdateActiveTab({ content: DEFAULT_SCRIPT, pacingMultiplier: 1.0 });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0c0d12] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
      {/* Top Application Header */}
      <Header
        engine={activeTab.engine}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        themeMode={themeMode}
        currentThemeEffective={currentThemeEffective}
        connectionStatus={connectionStatus}
        onThemeChange={handleThemeChange}
        onOpenStylesModal={() => setShowStylesModal(true)}
        onOpenPronunciationModal={() => setShowPronunciationModal(true)}
        onOpenTakesModal={() => setShowTakesModal(true)}
        onOpenGeminiStatusModal={() => setShowGeminiStatusModal(true)}
        onOpenBackupModal={() => setShowBackupModal(true)}
        onOpenGuide={() => setShowGuideModal(true)}
        onResetToDefault={handleResetToDefault}
        takeCount={takes.length}
      />

      {restoreSuccessBanner && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span>{restoreSuccessBanner}</span>
            <button 
              onClick={() => setRestoreSuccessBanner(null)} 
              className="ml-4 hover:underline text-[11px] font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {activeModule === 'script-studio' ? (
        <ScriptStudio
          onSendScriptToVoiceStudio={handleSendScriptToVoiceStudio}
          onSendBothScriptsToVoiceStudio={handleSendBothScriptsToVoiceStudio}
          onSwitchToVoiceStudio={() => setActiveModule('voice-studio')}
          currentActiveTabTitle={activeTab.title}
          onSyncScripts={(s, l) => {
            setStudioShortScript(s);
            setStudioLongScript(l);
          }}
        />
      ) : activeModule === 'broll-studio' ? (
        <BRollStudio
          currentVoiceScript={activeTab.content}
          shortScript={studioShortScript}
          longScript={studioLongScript}
          currentSrt={currentSrt}
          latestTake={takes.length > 0 ? takes[0] : null}
          onSwitchToVeoStudio={() => setActiveModule('veo-studio')}
          onSwitchToImagenStudio={() => setActiveModule('imagen-studio')}
        />
      ) : activeModule === 'veo-studio' ? (
        <VeoStudioModule
          shotSheet={(() => {
            try {
              const saved = localStorage.getItem('narrator_youtube_broll');
              if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed?.shotSheet)) return parsed.shotSheet;
                if (Array.isArray(parsed?.result?.shotSheet)) return parsed.result.shotSheet;
              }
            } catch {
              // ignore
            }
            return [];
          })()}
          activeClips={veoClips || []}
          onAddClip={handleAddVeoClip}
          onUpdateClip={handleUpdateVeoClip}
          onDeleteClip={handleDeleteVeoClip}
          onOpenSettingsModal={() => setShowGeminiStatusModal(true)}
        />
      ) : activeModule === 'imagen-studio' ? (
        <ImagenStudioModule
          thumbnailConcepts={(() => {
            try {
              const saved = localStorage.getItem('narrator_youtube_broll');
              if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed?.thumbnails)) return parsed.thumbnails;
                if (Array.isArray(parsed?.result?.thumbnails)) return parsed.result.thumbnails;
                if (Array.isArray(parsed?.thumbnailConcepts)) return parsed.thumbnailConcepts;
              }
            } catch {
              // ignore
            }
            return [];
          })()}
          onOpenSettingsModal={() => setShowGeminiStatusModal(true)}
          onSwitchToBRollStudio={() => setActiveModule('broll-studio')}
        />
      ) : activeModule === 'timeline-editor' ? (
        <TimelineEditorStudio
          apiKey=""
          onOpenSettings={() => setShowGeminiStatusModal(true)}
        />
      ) : activeModule === 'veo-vault' ? (
        <VeoVaultEngine
          onSendAssetToTimeline={(asset) => {
            setActiveModule('timeline-editor');
          }}
          onOpenSettings={() => setShowGeminiStatusModal(true)}
        />
      ) : activeModule === 'seo-studio' ? (
        <SeoStudio
          currentVoiceScript={activeTab.content}
          shortScript={studioShortScript}
          longScript={studioLongScript}
          onSendToVoiceStudio={handleSendScriptToVoiceStudio}
        />
      ) : (
        <>
          {/* Multi-Script Project Tabs */}
          <ProjectTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onCreateTab={handleCreateTab}
            onCloseTab={handleCloseTab}
            onRenameTab={handleRenameTab}
            onToggleFormat={handleToggleFormat}
          />

          {/* Main Studio Deck */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-4">
            {/* Top Split Deck: Script on the left, Voice & Mastering on the right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left Column: Script Editor (7 Cols) */}
              <div className="lg:col-span-7 h-full">
                <ScriptEditor
                  content={activeTab.content}
                  pacingMultiplier={activeTab.pacingMultiplier}
                  customStyles={customStyles}
                  onChangeContent={(text) => handleUpdateActiveTab({ content: text })}
                  onChangePacing={(multiplier) => handleUpdateActiveTab({ pacingMultiplier: multiplier })}
                  onOpenScriptWriter={() => setActiveModule('script-studio')}
                />
              </div>

              {/* Right Column: Voice & Mastering Panel (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <VoiceAndMasteringPanel
                  engine={activeTab.engine}
                  selectedVoiceId={activeTab.voiceId}
                  allVoices={allVoices}
                  mastering={mastering}
                  masterSpeed={masterSpeed}
                  masterPitch={masterPitch}
                  emotionExaggeration={emotionExaggeration}
                  isAuditioning={isAuditioning}
                  onAuditionVoice={handleAuditionVoice}
                  onChangeEmotionExaggeration={setEmotionExaggeration}
                  onSelectEngine={(eng) => handleUpdateActiveTab({ engine: eng })}
                  onSelectVoice={(id) => handleUpdateActiveTab({ voiceId: id })}
                  onUpdateMastering={setMastering}
                  onChangeMasterSpeed={setMasterSpeed}
                  onChangeMasterPitch={setMasterPitch}
                  onOpenCloneModal={() => setShowCloneModal(true)}
                  onOpenBlendModal={() => setShowBlendModal(true)}
                />

                {/* Generation Progress & Render Action */}
                <GenerationProgress
                  isRendering={isRendering}
                  currentIndex={renderProgressIndex}
                  totalSegments={totalRenderSegments}
                  currentSentenceText={currentSentenceText}
                  modelProgressMessage={modelProgressMessage}
                  onStartRender={handleGenerateAudio}
                  onCancelRender={handleCancelRender}
                  hasAudio={!!currentAudioBuffer}
                />
              </div>
            </div>

            {/* Bottom Master Timeline, Waveform Player & Export Deck */}
            <div className="w-full">
              <TimelinePlayer
                audioBuffer={currentAudioBuffer}
                segments={currentSegments}
                wavBlob={currentWavBlob}
                srtContent={currentSrt}
                onReRollSegment={handleReRollSegment}
                scriptTitle={activeTab.title}
              />
            </div>
          </main>
        </>
      )}

      {/* Modals & Dialogs */}
      <VoiceCloneModal
        isOpen={showCloneModal}
        onClose={() => setShowCloneModal(false)}
        currentEngine={activeTab.engine}
        onSaveClonedVoice={(voice) => {
          setCustomVoices([...customVoices, voice]);
          handleUpdateActiveTab({ voiceId: voice.id });
        }}
      />

      <VoiceBlendModal
        isOpen={showBlendModal}
        onClose={() => setShowBlendModal(false)}
        voices={allVoices}
        onSaveBlendedVoice={(voice) => {
          setCustomVoices([...customVoices, voice]);
          handleUpdateActiveTab({ voiceId: voice.id });
        }}
      />

      <CustomStyleModal
        isOpen={showStylesModal}
        onClose={() => setShowStylesModal(false)}
        customStyles={customStyles}
        onSaveStyles={setCustomStyles}
      />

      <PronunciationModal
        isOpen={showPronunciationModal}
        onClose={() => setShowPronunciationModal(false)}
        rules={pronunciations}
        onSaveRules={setPronunciations}
      />

      <RecentTakesModal
        isOpen={showTakesModal}
        onClose={() => setShowTakesModal(false)}
        takes={takes}
        onRestoreTake={handleRestoreTake}
        onDeleteTake={(id) => setTakes(takes.filter((t) => t.id !== id))}
        onClearAll={() => setTakes([])}
      />

      {/* Gemini API Connection Health & Key Switcher Modal */}
      <GeminiStatusModal
        isOpen={showGeminiStatusModal}
        onClose={() => setShowGeminiStatusModal(false)}
        onKeyChanged={refreshConnectionHealth}
        onOpenBackupModal={() => setShowBackupModal(true)}
        initialStatus={connectionStatus}
      />

      {/* AI Human-Grade Script Writer Modal (Google TTS Standard) */}
      <ScriptWriterModal
        isOpen={showScriptWriterModal}
        onClose={() => setShowScriptWriterModal(false)}
        onReplaceScript={handleReplaceScript}
        onAppendScript={handleAppendScript}
        onCreateNewTabWithScript={handleCreateNewTabWithScript}
        activeTabTitle={activeTab.title}
      />

      {/* Save / Load Project on PC (Offline JSON Backup) */}
      <ProjectBackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        tabs={tabs}
        activeTabId={activeTabId}
        customVoices={customVoices}
        customStyles={customStyles}
        pronunciations={pronunciations}
        mastering={mastering}
        onProjectRestored={handleProjectRestored}
      />

      {/* Persistent SaaS Footer */}
      <Footer
        onOpenGuide={() => setShowGuideModal(true)}
        onOpenKeySettings={() => setShowGeminiStatusModal(true)}
        onOpenBackup={() => setShowBackupModal(true)}
        onResetWorkspace={handleResetToDefault}
        isKeyConfigured={hasConfiguredKey}
      />

      {/* Feature Directory, How It Works & FAQs Modal */}
      <FeatureGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onOpenKeySettings={() => setShowGeminiStatusModal(true)}
      />

      {/* First Launch / BYOK Setup Modal */}
      <FirstLaunchModal
        isOpen={showFirstLaunchModal}
        onClose={() => setShowFirstLaunchModal(false)}
        onKeyConfigured={() => {
          setHasConfiguredKey(true);
          refreshConnectionHealth();
        }}
      />
    </div>
  );
}
