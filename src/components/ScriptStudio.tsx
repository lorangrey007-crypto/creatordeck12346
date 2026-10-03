import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Mic, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { sendScriptChatMessage, ScriptChatMessage } from '../services/scriptGeneratorService';
import { ScriptCanvasPane } from './script-studio/ScriptCanvasPane';
import { ScriptChatPane } from './script-studio/ScriptChatPane';

interface ScriptStudioProps {
  onSendScriptToVoiceStudio: (title: string, content: string) => void;
  onSendBothScriptsToVoiceStudio: (shortTitle: string, shortContent: string, longTitle: string, longContent: string) => void;
  onSwitchToVoiceStudio: () => void;
  currentActiveTabTitle: string;
  onSyncScripts?: (shortScript: string, longScript: string) => void;
}

const STORAGE_KEY = 'narrator_script_studio_v2';

export const ScriptStudio: React.FC<ScriptStudioProps> = ({
  onSendScriptToVoiceStudio,
  onSendBothScriptsToVoiceStudio,
  onSwitchToVoiceStudio,
  currentActiveTabTitle,
  onSyncScripts,
}) => {
  // Conversational Chat State
  const [messages, setMessages] = useState<ScriptChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          return parsed.messages;
        }
      }
    } catch {
      // Ignore parse failure
    }
    return [
      {
        id: 'msg-welcome',
        role: 'model',
        text: "I am your YouTube Script Director. Paste an idea, a Reddit story, or a topic you want to cover.\n\nI will create your scripts on the left canvas according to your exact needs:\n1. ⚡ Shorts Only: Engaging hooks & punchy narration for YouTube Shorts (15s, 30s, 60s, or custom duration).\n2. 🎬 Long-Form Only: Comprehensive storytelling script with pacing tailored to your requested length (2–3 min, 5 min, 8–10 min monetized, etc.).\n\nYou can ask for both formats or just one. Your drafts update live on the canvas.",
        timestamp: Date.now(),
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [useSearch, setUseSearch] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Dual-Script Canvas State
  const [activeCanvasTab, setActiveCanvasTab] = useState<'short' | 'long'>('short');
  const [shortScript, setShortScript] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.shortScript || '';
      }
    } catch {
      // Ignore
    }
    return '';
  });

  const [longScript, setLongScript] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.longScript || '';
      }
    } catch {
      // Ignore
    }
    return '';
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Persist session
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          messages,
          shortScript,
          longScript,
        })
      );
    } catch {
      // LocalStorage error fallback
    }
    onSyncScripts?.(shortScript, longScript);
  }, [messages, shortScript, longScript, onSyncScripts]);

  // Word Count & Duration Metrics
  const calculateStats = (text: string) => {
    const cleanText = text.replace(/\[.*?\]/g, ' ').trim();
    const words = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
    const estSeconds = Math.round(words / 2.5); // ~150 words per minute average speaking rate
    return { wordCount: words, estimatedSeconds: estSeconds };
  };

  const shortStats = calculateStats(shortScript);
  const longStats = calculateStats(longScript);
  const activeStats = activeCanvasTab === 'short' ? shortStats : longStats;

  // Count Mid-Roll Ad anchors in Long Form Script
  const midRollAdCount = (longScript.match(/\[MID-ROLL AD|\[MID-ROLL|\[AD RETENTION/gi) || []).length;

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText || inputMessage).trim();
    if (!textToSend || isGenerating) return;

    const userMessage: ScriptChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsGenerating(true);

    try {
      const response = await sendScriptChatMessage({
        messages: updatedMessages.map((m) => ({ role: m.role, text: m.text })),
        currentShortScript: shortScript,
        currentLongScript: longScript,
        useSearch,
      });

      const assistantMessage: ScriptChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        text: response.reply,
        timestamp: Date.now() + 1,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If model provided or updated script blocks, update our canvas
      if (response.shortScript && response.shortScript.trim()) {
        setShortScript(response.shortScript);
      }
      if (response.longScript && response.longScript.trim()) {
        setLongScript(response.longScript);
      }
    } catch (err: any) {
      const errorMessage: ScriptChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'model',
        text: `Error connecting with Script Director: ${err.message || 'Please check your connection.'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFastDirective = (directivePrompt: string) => {
    setInputMessage((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return directivePrompt;
      }
      return `${trimmed} — ${directivePrompt}`;
    });
    setTimeout(() => {
      const el = document.getElementById('textarea-director-input') as HTMLTextAreaElement | null;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }, 20);
  };

  const insertTag = (tag: string) => {
    if (activeCanvasTab === 'short') {
      setShortScript((prev) => prev + (prev.endsWith(' ') || !prev ? '' : ' ') + tag);
    } else {
      setLongScript((prev) => prev + (prev.endsWith(' ') || !prev ? '' : ' ') + tag);
    }
  };

  // Transfer Handlers to Voice Studio
  const handleTransferActive = () => {
    if (activeCanvasTab === 'short') {
      if (!shortScript.trim()) return;
      onSendScriptToVoiceStudio('Shorts Only', shortScript);
    } else {
      if (!longScript.trim()) return;
      onSendScriptToVoiceStudio('Long-Form Only', longScript);
    }
    onSwitchToVoiceStudio();
  };

  const handleTransferLongForm = () => {
    if (!longScript.trim()) return;
    onSendScriptToVoiceStudio('Long-Form Only', longScript);
    onSwitchToVoiceStudio();
  };

  const handleTransferBoth = () => {
    if (!shortScript.trim() && !longScript.trim()) return;
    onSendBothScriptsToVoiceStudio(
      'Shorts Only',
      shortScript.trim() || 'Shorts script draft',
      'Long-Form Only',
      longScript.trim() || 'Long-form script draft'
    );
    onSwitchToVoiceStudio();
  };

  const handleClearHistory = () => {
    if (window.confirm('Reset conversation and start a new story session?')) {
      setMessages([
        {
          id: `msg-${Date.now()}`,
          role: 'model',
          text: "Fresh canvas ready! Give me a story, an intriguing hook, or a YouTube premise, and we will write your Shorts Only or Long-Form Only scripts to your exact length.",
          timestamp: Date.now(),
        },
      ]);
      setShortScript('');
      setLongScript('');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-62px)] overflow-hidden bg-zinc-50 dark:bg-[#0c0d12]">
      {/* Studio Top Banner */}
      <div className="bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-200/70 dark:border-blue-900/50 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-blue-600 dark:bg-blue-500 text-white">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                Script Studio & Story Architect
              </span>
              <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-[10px] font-mono font-medium text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                Co-Writer Active
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Conversational script creation for Shorts Only & Long-Form Only YouTube narration
            </p>
          </div>
        </div>

        {/* Studio Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 text-[11px] font-medium">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Non-Destructive Live Canvas</span>
          </div>

          <button
            id="btn-switch-to-voice-studio"
            onClick={onSwitchToVoiceStudio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Switch to Voice Studio</span>
          </button>
        </div>
      </div>

      {/* Main Two-Pane Studio Workspace: LEFT = Results Canvas, RIGHT = Chat Director */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT PANE: Results Dual-Script Canvas & Transfer Gate (7 cols on lg) */}
        <ScriptCanvasPane
          activeCanvasTab={activeCanvasTab}
          setActiveCanvasTab={setActiveCanvasTab}
          shortScript={shortScript}
          setShortScript={setShortScript}
          longScript={longScript}
          setLongScript={setLongScript}
          activeStats={activeStats}
          midRollAdCount={midRollAdCount}
          insertTag={insertTag}
          handleTransferActive={handleTransferActive}
          handleTransferLongForm={handleTransferLongForm}
          handleTransferBoth={handleTransferBoth}
          onCoworkerDirective={handleFastDirective}
        />

        {/* RIGHT PANE: Conversational Creative Director Chat (5 cols on lg) */}
        <ScriptChatPane
          messages={messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          useSearch={useSearch}
          setUseSearch={setUseSearch}
          isGenerating={isGenerating}
          chatBottomRef={chatBottomRef}
          handleClearHistory={handleClearHistory}
          handleFastDirective={handleFastDirective}
          handleSendMessage={handleSendMessage}
          handleKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};
