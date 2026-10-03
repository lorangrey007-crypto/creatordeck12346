import React, { useState, useRef, useEffect } from 'react';
import {
  Clapperboard,
  Image as ImageIcon,
  Copy,
  Check,
  Download,
  Film,
  Sparkles,
  Volume2,
  AlertCircle,
  Loader2,
  Send,
  Globe,
  Bot,
  User,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  Video,
  Clock,
  Radio,
  FileText,
  Sliders,
  Play,
  ChevronUp,
  ChevronDown,
  Camera,
  Sparkle,
} from 'lucide-react';
import { BRollThumbnailResult, BRollChatMessage, BRollCueItem, RenderedTake, ThumbnailConceptItem } from '../types';
import { generateYouTubeBRollAndThumbnails } from '../services/youtubeBRollService';
import { synthesizeVeoPrompt, VEO_STYLE_PRESETS, VeoStylePreset } from '../services/veoPromptSynthesizer';
import { parseSrtEntries, ParsedSrtItem } from '../services/subtitleService';
import { generateThumbnailImage } from '../services/videoAndImageService';

interface BRollStudioProps {
  currentVoiceScript: string;
  shortScript: string;
  longScript: string;
  currentSrt?: string;
  latestTake?: RenderedTake | null;
  onSwitchToVeoStudio?: () => void;
  onSwitchToImagenStudio?: () => void;
}

const ART_DIRECTOR_QUICK_DIRECTIVES = [
  { label: '🎨 Darker Mood & Volumetric Light', prompt: 'Make thumbnail concepts more atmospheric and brooding with heavy shadows, volumetric fog, and piercing high-contrast rim light for mobile CTR.' },
  { label: '🔤 Punchy 2-Word Text Overlay', prompt: 'Revise the text overlays on all 3 thumbnails to be maximum 2 to 3 words, ultra-urgent, with high curiosity gap (e.g. "HE KNEW", "DON\'T LOOK").' },
  { label: '⚡ 2x Faster Retention Cuts', prompt: 'Condense the B-roll shot sheet so cuts happen every 2 to 3 seconds with high-energy movement to maximize viewer retention during the hook.' },
  { label: '🕵️ Archival Evidence & Polaroids', prompt: 'Incorporate archival newspaper clippings, vintage crime scene polaroids, and red-string evidence board visuals into the shot sheet.' },
  { label: '💡 Pitch 3 Radical New Thumbnails', prompt: 'Pitch 3 completely new, out-of-the-box thumbnail concepts using psychological curiosity gaps that stand out from typical YouTube videos in this niche.' },
];

const STORAGE_CHAT_KEY = 'narrator_broll_chat_messages';
const STORAGE_RESULT_KEY = 'narrator_youtube_broll';

export const BRollStudio: React.FC<BRollStudioProps> = ({
  currentVoiceScript,
  shortScript,
  longScript,
  currentSrt = '',
  latestTake = null,
  onSwitchToVeoStudio,
  onSwitchToImagenStudio,
}) => {
  // Source selection: Standalone by default if no script yet, or Long-form if exists
  const [sourceType, setSourceType] = useState<'custom' | 'long' | 'short' | 'current-voice' | 'srt'>(() => {
    if (currentSrt.trim()) return 'srt';
    if (longScript.trim()) return 'long';
    if (shortScript.trim()) return 'short';
    if (currentVoiceScript.trim()) return 'current-voice';
    return 'custom';
  });

  const [veoPreset, setVeoPreset] = useState<VeoStylePreset>('cinematic');
  const [expandedVeoIdx, setExpandedVeoIdx] = useState<number | null>(null);
  const [copiedVeoIdx, setCopiedVeoIdx] = useState<number | null>(null);
  const [useVoiceAudio, setUseVoiceAudio] = useState<boolean>(true);

  const [customText, setCustomText] = useState('');
  const [topicFocus, setTopicFocus] = useState('');
  const [genre, setGenre] = useState('documentary / suspense mystery');
  const [activeSubTab, setActiveSubTab] = useState<'thumbnails' | 'shot-sheet'>('thumbnails');

  // Conversational Chat State
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<BRollChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'msg_welcome',
        role: 'model',
        content: "Welcome to the Visual B-Roll & Thumbnail Studio! I am your AI Art Director & Video Editor, connected to live Google Search Grounding to track current YouTube visual trends.\n\nConfigure your script on the right, then give me instructions or pick a quick directive below to start brainstorming high-CTR thumbnails and visual shot lists.",
        timestamp: Date.now(),
      },
    ];
  });

  // Generation & Result State (Loaded from localStorage only, NEVER auto-runs on mount)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BRollThumbnailResult | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_RESULT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Auto-scroll chat without scrolling the outer page
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages.length, isLoading]);

  // Persist chat
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getActiveSourceText = (): string => {
    switch (sourceType) {
      case 'srt': {
        if (!currentSrt.trim()) return '';
        const parsed = parseSrtEntries(currentSrt);
        if (parsed.length > 0) {
          return parsed.map((p) => `[${p.startTime} - ${p.endTime}] ${p.text}`).join('\n');
        }
        return currentSrt;
      }
      case 'long':
        return longScript;
      case 'short':
        return shortScript;
      case 'current-voice':
        return currentVoiceScript;
      case 'custom':
        return customText;
    }
  };

  // Primary Generation / Feedback Handler
  const handleSendMessage = async (feedbackText?: string) => {
    const userMessage = (feedbackText || chatInput).trim();
    const activeText = getActiveSourceText().trim();

    if (!userMessage && !activeText && !topicFocus.trim()) {
      setError('Please provide a script, standalone video topic, or directive message.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // If user typed a message, add it to chat immediately
    const newMessages: BRollChatMessage[] = [...messages];
    if (userMessage) {
      newMessages.push({
        id: `msg_u_${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
      });
      setMessages(newMessages);
      setChatInput('');
    }

    try {
      const formattedHistory = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Convert latestTake WAV audio to base64 if available & user enabled
      let audioBase64: string | undefined = undefined;
      let audioMimeType: string = 'audio/wav';
      if (useVoiceAudio && latestTake?.wavBlob) {
        try {
          const arrayBuffer = await latestTake.wavBlob.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          audioBase64 = btoa(binary);
          audioMimeType = latestTake.wavBlob.type || 'audio/wav';
        } catch (audioErr) {
          console.warn('Could not encode take audio to base64:', audioErr);
        }
      }

      const data = await generateYouTubeBRollAndThumbnails(activeText, genre, {
        topic: topicFocus.trim(),
        userFeedback: userMessage || 'Generate initial grounded thumbnail concepts and editor shot sheet.',
        messages: formattedHistory,
        audioBase64,
        audioMimeType,
      });

      setResult(data);
      try {
        localStorage.setItem(STORAGE_RESULT_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }

      // Add AI reply to chat
      if (data.replyText) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_m_${Date.now()}`,
            role: 'model',
            content: data.replyText || 'I have updated the thumbnail concepts and B-roll shot sheet according to your instructions.',
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate visual B-roll & thumbnail concepts.');
    } finally {
      setIsLoading(false);
    }
  };

  // Insert directive/preset into chat input box without auto-submitting
  const handleInsertDirective = (directiveText: string) => {
    setChatInput((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return directiveText;
      }
      return `${trimmed} — ${directiveText}`;
    });
    setTimeout(() => {
      const inputEl = document.getElementById('input-broll-chat') as HTMLInputElement | null;
      if (inputEl) {
        inputEl.focus();
        inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
      }
    }, 20);
  };

  // Get or synthesize Veo Prompt for a cue
  const getVeoPromptForCue = (cue: BRollCueItem, preset: VeoStylePreset = veoPreset): string => {
    if (cue.veoPrompt && preset === 'cinematic') {
      return cue.veoPrompt;
    }
    return synthesizeVeoPrompt({
      visualAction: cue.visualAction,
      spokenContext: cue.spokenText,
      stylePreset: preset,
      cameraMotion: cue.veoCameraMotion,
      lighting: cue.veoLighting,
    });
  };

  // Export CSV for Premiere / DaVinci / CapCut
  const handleExportCsv = () => {
    if (!result || !result.shotSheet) return;
    const headers = ['Timestamp', 'Spoken Text', 'Visual B-Roll Action', 'SFX Cue', 'Stock Footage Keywords', 'Google Veo Video Prompt'];
    const rows = result.shotSheet.map((item) => [
      `"${item.timestamp.replace(/"/g, '""')}"`,
      `"${item.spokenText.replace(/"/g, '""')}"`,
      `"${item.visualAction.replace(/"/g, '""')}"`,
      `"${item.sfxCue.replace(/"/g, '""')}"`,
      `"${item.stockKeywords.replace(/"/g, '""')}"`,
      `"${getVeoPromptForCue(item).replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `b_roll_shot_sheet_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // State to track generated thumbnail images by index
  const [generatingThumbIdx, setGeneratingThumbIdx] = useState<number | null>(null);
  const [thumbImages, setThumbImages] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem('narrator_generated_thumbnails');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Handle Text-to-Image generation for a thumbnail concept
  const handleGenerateThumbnailImage = async (thumb: ThumbnailConceptItem, idx: number) => {
    setGeneratingThumbIdx(idx);
    try {
      const res = await generateThumbnailImage({
        prompt: thumb.aiImagePrompt,
        aspectRatio: '16:9',
        imageSize: '1K',
      });

      const updated = { ...thumbImages, [idx]: res.imageUrl };
      setThumbImages(updated);
      try {
        localStorage.setItem('narrator_generated_thumbnails', JSON.stringify(updated));
      } catch {
        // quota in localstorage
      }
    } catch (err: any) {
      console.error('Thumbnail image generation error:', err);
      setError(err?.message || 'Failed to generate visual thumbnail with Imagen.');
    } finally {
      setGeneratingThumbIdx(null);
    }
  };

  const activeContentLength = getActiveSourceText().trim().length;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-62px)] overflow-hidden bg-zinc-50 dark:bg-[#0c0d12]">
      {/* Top Banner with Studio Header */}
      <div className="bg-purple-50/70 dark:bg-purple-950/30 border-b border-purple-200/70 dark:border-purple-900/50 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-purple-600 dark:bg-purple-500 text-white">
            <Clapperboard className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                Visual B-Roll & Thumbnail Studio
              </span>
              <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-[10px] font-mono font-medium text-purple-800 dark:text-purple-300 flex items-center gap-1 border border-purple-200 dark:border-purple-800">
                <Globe className="w-3 h-3 text-purple-600 dark:text-purple-300" />
                Live Visual Research
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Conversational Art Director: Iterate thumbnail concepts & second-by-second B-Roll shot sheets with live YouTube visual research
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSwitchToVeoStudio && (
            <button
              type="button"
              onClick={onSwitchToVeoStudio}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold hover:opacity-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Send prompts to Veo Studio for video rendering"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Launch in Veo Studio</span>
            </button>
          )}

          {result && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-zinc-900 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-50 dark:hover:bg-purple-950/60 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Shot Sheet (.CSV)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Dual-Pane Workspace: LEFT = Results Canvas, RIGHT = Chat Director */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT COLUMN: Live Thumbnail & B-Roll Output Canvas (7 Cols) */}
        <div className="lg:col-span-7 border-r border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/40">
          {/* Sub-Tabs Header */}
          <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0d12] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveSubTab('thumbnails')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSubTab === 'thumbnails'
                    ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-300 shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-pink-500" />
                <span>Thumbnail Art Director</span>
                {result?.thumbnails && (
                  <span className="px-1.5 py-0.2 rounded-full bg-pink-100 dark:bg-pink-950 text-[10px] font-mono">
                    3 Concepts
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('shot-sheet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSubTab === 'shot-sheet'
                    ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-300 shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-purple-500" />
                <span>Editor's B-Roll & SFX Shot Sheet</span>
                {result.shotSheet && (
                  <span className="px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950 text-[10px] font-mono">
                    {result.shotSheet.length || 0}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Actions */}
            {result && activeSubTab === 'shot-sheet' && (
              <button
                type="button"
                onClick={() => {
                  const formatted = (result.shotSheet || [])
                    .map(
                      (s) =>
                        `[${s.timestamp}]\nVOICEOVER: ${s.spokenText}\nVISUAL: ${s.visualAction}\nSFX: ${s.sfxCue}\nSEARCH KEYWORDS: ${s.stockKeywords}\n---`
                    )
                    .join('\n\n');
                  handleCopy(formatted, 'all-shots');
                }}
                className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'all-shots' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied All Shots</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Shot Sheet</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Results Display Area */}
          <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
            {/* Quota fallback alert */}
            {result?.isQuotaFallback && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Algorithmic Shot & Thumbnail Director Active:</span>{" "}
                  {result.quotaWarning || "Generated via the built-in algorithmic engine to bypass Gemini API rate limits."}
                </div>
              </div>
            )}

            {/* Grounding Source Info */}
            {result?.groundingQueries && result.groundingQueries.length > 0 && (
              <div className="mb-4 p-2.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 flex items-center gap-2 text-xs text-purple-900 dark:text-purple-200">
                <Globe className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>
                  <strong>Google Search Grounded:</strong> Researched active YouTube CTR trends for:{' '}
                  <span className="font-mono text-[11px] underline">
                    {result.groundingQueries.join(', ')}
                  </span>
                </span>
              </div>
            )}

            {/* Empty State (Waiting for user prompt) */}
            {!result && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3">
                  <Clapperboard className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                  Ready to Direct Visuals & Thumbnails
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mb-4">
                  Select your script or enter an external topic on the right, then converse with the Art Director or pick a directive to start generating high-CTR thumbnails and shot lists.
                </p>
                <button
                  type="button"
                  onClick={() => handleSendMessage('Pitch 3 high-CTR thumbnail concepts and a dynamic B-roll shot sheet.')}
                  disabled={!activeContentLength && !topicFocus.trim()}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    !activeContentLength && !topicFocus.trim()
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pitch Initial Concepts</span>
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-300 mb-3 animate-pulse">
                  <Film className="w-6 h-6 animate-spin" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                  Art Directing Visuals with Google Search Grounding...
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                  Analyzing top YouTube thumbnails, visual color contrast, and retention cue timing.
                </p>
              </div>
            )}

            {/* TAB 1: THUMBNAIL CONCEPTS */}
            {result && !isLoading && activeSubTab === 'thumbnails' && (
              <div className="space-y-4">
                {/* Switch to Imagen Studio Banner */}
                {onSwitchToImagenStudio && (
                  <div className="p-3 rounded-xl bg-pink-50/80 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/50 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                      <div>
                        <span className="text-xs font-bold text-pink-900 dark:text-pink-200 block">
                          Dedicated Imagen Studio Available
                        </span>
                        <span className="text-[10px] text-pink-700 dark:text-pink-300">
                          Synthesize, inspect, and export all 16:9 thumbnail concepts with full Midjourney / Imagen prompts
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onSwitchToImagenStudio}
                      className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Open in Imagen Studio</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {(result.thumbnails || []).map((thumb, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0f1117] shadow-2xs flex flex-col gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                          {thumb.conceptTitle}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleInsertDirective(`I want to refine Concept #${idx + 1} ("${thumb.conceptTitle}"). Make it even more eye-catching for mobile feeds.`)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 border border-purple-200 dark:border-purple-900 flex items-center gap-1 cursor-pointer"
                          title="Insert refinement prompt into chat box"
                        >
                          <span>Tweak in chat</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopy(thumb.aiImagePrompt, `prompt-${idx}`)}
                          className="px-3 py-1 rounded-lg bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-900 text-xs font-semibold hover:bg-pink-100 flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedKey === `prompt-${idx}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Prompt Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy AI Prompt</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Composition Focal Point */}
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800">
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                        Visual Focal Point & Subject
                      </span>
                      <p className="text-xs text-zinc-900 dark:text-zinc-100 leading-relaxed font-medium">
                        {thumb.visualComposition}
                      </p>
                    </div>

                    {/* Text Overlay & Color Grading */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block mb-1">
                          Thumbnail Text Overlay (Max 2–4 Words)
                        </span>
                        <div className="inline-block px-3 py-1 rounded bg-black text-white dark:bg-white dark:text-black font-extrabold text-sm tracking-wider font-mono">
                          {thumb.textOverlay}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                          Color Grading & Mobile Contrast
                        </span>
                        <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-snug">
                          {thumb.colorGrading}
                        </p>
                      </div>
                    </div>

                    {/* AI Generator Prompt */}
                    <div className="p-3 rounded-xl bg-zinc-900 dark:bg-black text-zinc-200 font-mono text-xs border border-zinc-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                          AI Generator Prompt (16:9 Midjourney / Imagen)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleGenerateThumbnailImage(thumb, idx)}
                          disabled={generatingThumbIdx === idx}
                          className="px-2.5 py-1 rounded-md bg-gradient-to-r from-pink-600 to-purple-600 text-white font-sans text-xs font-bold flex items-center gap-1.5 hover:opacity-95 disabled:opacity-50 cursor-pointer shadow-xs transition-all"
                          title="Render real visual image using Gemini/Imagen"
                        >
                          {generatingThumbIdx === idx ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Generating Visual...</span>
                            </>
                          ) : (
                            <>
                              <Sparkle className="w-3.5 h-3.5" />
                              <span>{thumbImages[idx] ? 'Re-generate Image' : 'Generate Visual Image'}</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-zinc-300 select-all leading-relaxed">
                        {thumb.aiImagePrompt}
                      </p>
                    </div>

                    {/* Rendered Visual Image Display */}
                    {thumbImages[idx] && (
                      <div className="rounded-xl border border-pink-200 dark:border-pink-900/60 overflow-hidden bg-black flex flex-col">
                        <div className="px-3 py-1.5 bg-zinc-900 flex items-center justify-between text-[11px] text-zinc-300">
                          <span className="font-semibold flex items-center gap-1 text-pink-400">
                            <ImageIcon className="w-3.5 h-3.5" />
                            Rendered Visual Thumbnail (16:9)
                          </span>
                          <a
                            href={thumbImages[idx]}
                            download={`thumbnail-concept-${idx + 1}.png`}
                            className="text-zinc-400 hover:text-white flex items-center gap-1 font-mono text-[10px]"
                          >
                            <Download className="w-3 h-3" />
                            Download PNG
                          </a>
                        </div>
                        <div className="relative aspect-video w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
                          <img
                            src={thumbImages[idx]}
                            alt={thumb.conceptTitle}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {/* Text Overlay Simulated Badge */}
                          <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/85 text-white font-extrabold text-sm tracking-wider uppercase shadow-lg border border-white/20">
                            {thumb.textOverlay}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: B-ROLL SHOT SHEET */}
            {result && !isLoading && activeSubTab === 'shot-sheet' && (
              <div className="space-y-3">
                {/* Global Veo Style Preset Switcher */}
                <div className="p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <div>
                      <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                        Google Veo 4K AI Video Prompt Engine
                      </span>
                      <span className="text-[10px] text-purple-700 dark:text-purple-300">
                        Synthesizes camera optics, motion physics, and cinematic lighting for Google Veo
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-purple-200 dark:border-purple-800 text-[11px]">
                    <span className="text-[10px] text-zinc-500 font-semibold px-1.5 uppercase">Style Preset:</span>
                    {(['cinematic', 'documentary', 'dark-mystery', 'cyberpunk', 'hyper-real'] as VeoStylePreset[]).map((presetKey) => (
                      <button
                        key={presetKey}
                        type="button"
                        onClick={() => setVeoPreset(presetKey)}
                        className={`px-2 py-1 rounded-md font-medium capitalize transition-all cursor-pointer ${
                          veoPreset === presetKey
                            ? 'bg-purple-600 text-white shadow-2xs font-semibold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        {presetKey.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {(result.shotSheet || []).map((cue, idx) => {
                  const generatedVeoPrompt = getVeoPromptForCue(cue, veoPreset);
                  const isVeoExpanded = expandedVeoIdx === idx;
                  const isCopied = copiedVeoIdx === idx;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0f1117] shadow-2xs flex flex-col gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono text-[11px] font-bold">
                            {cue.timestamp}
                          </span>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                            Shot #{idx + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopy(cue.stockKeywords, `kw-${idx}`)}
                            className="px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1 cursor-pointer"
                            title="Copy stock footage search query for Pexels or Storyblocks"
                          >
                            {copiedKey === `kw-${idx}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">Keywords Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Keywords: <code className="font-mono text-purple-600 dark:text-purple-400">{cue.stockKeywords}</code></span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
                        "{cue.spokenText}"
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                        <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 text-xs">
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                            <Film className="w-3 h-3" />
                            Visual Footage Action
                          </span>
                          <p className="text-zinc-900 dark:text-zinc-100 leading-relaxed font-medium">
                            {cue.visualAction}
                          </p>
                        </div>

                        <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-xs">
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                            <Volume2 className="w-3 h-3" />
                            SFX Audio Trigger
                          </span>
                          <p className="text-amber-900 dark:text-amber-200 font-mono font-medium">
                            {cue.sfxCue}
                          </p>
                        </div>
                      </div>

                      {/* GOOGLE VEO GENERATION BLOCK */}
                      <div className="mt-1 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-gradient-to-br from-purple-50/60 to-indigo-50/40 dark:from-purple-950/20 dark:to-zinc-900/50 overflow-hidden text-xs">
                        <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-purple-100 dark:border-purple-900/30">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1">
                              <Video className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              Google Veo Prompt
                            </span>
                            {cue.veoCameraMotion && (
                              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono text-[10px]">
                                {cue.veoCameraMotion}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                handleCopy(generatedVeoPrompt, `veo-${idx}`);
                                setCopiedVeoIdx(idx);
                                setTimeout(() => setCopiedVeoIdx(null), 2000);
                              }}
                              className="px-2 py-1 rounded-md border border-purple-200 dark:border-purple-800 bg-white dark:bg-zinc-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                              title="Copy prompt formatted for Google Veo 4K generation"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400">Copied Prompt</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Veo Prompt</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setExpandedVeoIdx(isVeoExpanded ? null : idx)}
                              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded cursor-pointer"
                              title={isVeoExpanded ? 'Collapse prompt details' : 'Expand full prompt'}
                            >
                              {isVeoExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Veo Prompt Content */}
                        <div className="p-3">
                          <p className={`font-mono text-[11px] leading-relaxed text-zinc-800 dark:text-zinc-200 select-all ${isVeoExpanded ? '' : 'line-clamp-2'}`}>
                            {generatedVeoPrompt}
                          </p>

                          {/* Detail tags if available */}
                          {(cue.veoCameraMotion || cue.veoLighting) && (
                            <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-purple-100 dark:border-purple-900/20 text-[10px] text-zinc-600 dark:text-zinc-400">
                              {cue.veoCameraMotion && (
                                <span className="flex items-center gap-1">
                                  <Camera className="w-3 h-3 text-purple-500" />
                                  Motion: <strong className="text-zinc-900 dark:text-zinc-100">{cue.veoCameraMotion}</strong>
                                </span>
                              )}
                              {cue.veoLighting && (
                                <span className="flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                  Light: <strong className="text-zinc-900 dark:text-zinc-100">{cue.veoLighting}</strong>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Source Config & Conversational Art Director Chat (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0c0d12] flex flex-col overflow-hidden">
          {/* Script Source & Standalone Topic Setup (Collapsible / Compact) */}
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col gap-2.5 shrink-0">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Script Source (Works Standalone or Connected)
                </label>
                <span className="text-[10px] text-zinc-500">
                  {sourceType === 'custom' ? 'Standalone Mode' : `${activeContentLength} chars`}
                </span>
              </div>

              {/* Source Mode Buttons */}
              <div className="grid grid-cols-2 gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setSourceType('custom')}
                  className={`px-2 py-1 rounded-lg font-medium text-left transition-all ${
                    sourceType === 'custom'
                      ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-300 shadow-2xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80'
                  }`}
                >
                  ⚡ Standalone / Custom
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType('srt')}
                  className={`px-2 py-1 rounded-lg font-medium text-left transition-all ${
                    sourceType === 'srt'
                      ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-300 shadow-2xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80'
                  }`}
                  title="Generate B-Roll precisely synchronized to the recorded voice timestamps"
                >
                  ⏱️ Voice Subtitles (.SRT)
                  {currentSrt.trim() && <span className="ml-1 text-[10px] text-emerald-500 font-bold">✓ Synced</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType('long')}
                  className={`px-2 py-1 rounded-lg font-medium text-left transition-all ${
                    sourceType === 'long'
                      ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-300 shadow-2xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80'
                  }`}
                >
                  Pull: Long-Form Only
                  {longScript.trim() && <span className="ml-1 text-[10px] text-emerald-500">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType('short')}
                  className={`px-2 py-1 rounded-lg font-medium text-left transition-all ${
                    sourceType === 'short'
                      ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-300 shadow-2xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80'
                  }`}
                >
                  Pull: Shorts Only
                  {shortScript.trim() && <span className="ml-1 text-[10px] text-emerald-500">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType('current-voice')}
                  className={`col-span-2 px-2 py-1 rounded-lg font-medium text-left transition-all ${
                    sourceType === 'current-voice'
                      ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-300 shadow-2xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80'
                  }`}
                >
                  Pull: Voice Studio Script
                  {currentVoiceScript.trim() && <span className="ml-1 text-[10px] text-emerald-500">✓</span>}
                </button>
              </div>
            </div>

            {/* If Standalone / Custom, show quick input fields; else show readable preview */}
            {sourceType === 'custom' ? (
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={topicFocus}
                  onChange={(e) => setTopicFocus(e.target.value)}
                  placeholder="Standalone Topic (e.g. Bermuda Triangle mystery, AI takeover...)"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={2}
                  placeholder="Paste your own external script, outline, or plot summary here..."
                  className="w-full p-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] px-0.5">
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                    Loaded from {sourceType === 'srt' ? 'Voice Subtitles (.SRT)' : sourceType === 'long' ? 'Long-Form Only' : sourceType === 'short' ? 'Shorts Only' : 'Voice Studio'}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                    {activeContentLength} characters
                  </span>
                </div>
                <div className="w-full max-h-24 p-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {getActiveSourceText().trim() ? (
                    getActiveSourceText()
                  ) : (
                    <span className="text-zinc-500 dark:text-zinc-400 italic font-sans text-[11px]">
                      {sourceType === 'srt'
                        ? "No SRT subtitles generated yet. Render an audio take in Voice Studio first to automatically extract timestamps."
                        : `No text in ${sourceType === 'long' ? 'Long-Form Only' : sourceType === 'short' ? 'Shorts Only' : 'Voice Studio'} yet. Write one in Script Studio, or switch to 'Standalone / Custom' to paste your own script.`}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Audio-Aware Voice Listening Option */}
            {latestTake && (
              <div className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/25 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shrink-0">
                    <Volume2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Listen to Generated Voice
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-semibold">
                        {latestTake.totalDurationSec.toFixed(1)}s WAV
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                      Gemini listens directly to voice pauses & inflection for ultra-accurate cuts
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={useVoiceAudio}
                    onChange={(e) => setUseVoiceAudio(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            )}

            {/* Genre atmosphere selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 shrink-0">Genre:</span>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="flex-1 px-2 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="documentary / suspense mystery">Documentary & Suspense Mystery</option>
                <option value="true crime / investigative police tape">True Crime & Police Procedural</option>
                <option value="historical intrigue / ancient secret">Historical Lore & Lost Civilizations</option>
                <option value="horror / psychological creepypasta">Dark Psychological & Horror</option>
                <option value="high-tech scientific / space explainer">Science, Space & Tech Explainer</option>
                <option value="dramatic reddit storytime">Dramatic Storytime & Relationship Conflict</option>
              </select>
            </div>
          </div>

          {/* Conversational Art Director Chat Log */}
          <div ref={chatContainerRef} className="flex-1 p-3 overflow-y-auto space-y-3 bg-zinc-50/30 dark:bg-zinc-950/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white font-medium rounded-tr-xs'
                      : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl rounded-tl-xs p-3 text-xs flex items-center gap-2 text-purple-600 dark:text-purple-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Researching YouTube visual trends & updating concepts...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Revision Directives */}
          <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#0c0d12] flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap pl-1">Directives:</span>
            {ART_DIRECTOR_QUICK_DIRECTIVES.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleInsertDirective(d.prompt)}
                disabled={isLoading}
                title={`Insert "${d.prompt}" into chat`}
                className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-purple-50 dark:bg-zinc-900 dark:hover:bg-purple-950/50 text-zinc-700 hover:text-purple-700 dark:text-zinc-300 dark:hover:text-purple-300 text-[11px] whitespace-nowrap transition-all border border-zinc-200/70 dark:border-zinc-800 cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1"
              >
                <span className="text-purple-600 dark:text-purple-400 font-bold text-xs">+</span>
                <span>{d.label}</span>
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0d12] flex flex-col gap-2 shrink-0">
            {error && (
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2">
              <input
                id="input-broll-chat"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Give feedback (e.g. 'Make #1 darker', 'Change text to NO ESCAPE')..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />

              <button
                id="btn-broll-send-directive"
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isLoading || (!chatInput.trim() && !activeContentLength && !topicFocus.trim())}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                  isLoading || (!chatInput.trim() && !activeContentLength && !topicFocus.trim())
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
