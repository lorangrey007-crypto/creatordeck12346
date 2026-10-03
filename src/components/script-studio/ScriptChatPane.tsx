import React, { useRef, useEffect } from 'react';
import {
  Bot,
  Search,
  RefreshCw,
  Send,
  Loader2,
} from 'lucide-react';
import { ScriptChatMessage } from '../../services/scriptGeneratorService';

export const DIRECTOR_PROMPTS = [
  { label: '🛡️ Anti-Copyright Originalizer', prompt: 'Rewrite the active script to be 100% original and strike-proof: change all character names, alter locations/dates, rewrite every sentence into fresh cinematic prose, and keep the suspense high so it passes all Content ID and Reused Content checks.' },
  { label: '⚡ Make Hook 2x Punchier', prompt: 'Rewrite the first 5 seconds of the Short hook to be 2x more intense and arresting. Start in media res.' },
  { label: '🤫 Inject Suspense & Whispers', prompt: 'Add atmospheric pauses and whisper tags to build cinematic tension before the reveal.' },
  { label: '⏱️ Pad to 8–10 Min Ad Length', prompt: 'Flesh out the backstory, evidence, and character motives in the long-form script so it comfortably hits 8–10 minutes with natural mid-roll ad anchors.' },
  { label: '✂️ Cut Fluff & Tighten Pacing', prompt: 'Trim unnecessary exposition from the script and maximize human conversational cadence.' },
  { label: '🎭 Dark True Crime Tone', prompt: 'Recast both scripts in a brooding, chilling, true-crime documentary tone with suspenseful tags.' },
  { label: '🛸 High-Stakes Documentary', prompt: 'Format both scripts as a prestigious, high-stakes investigative documentary.' },
  { label: '🎬 Add Scene Beat Markers', prompt: 'Organize this script into clear cinematic scene beats with [HOOK], [RISING ACTION], [CLIMAX], and [PAYOFF] markers for the video editor.' },
];

interface ScriptChatPaneProps {
  messages: ScriptChatMessage[];
  inputMessage: string;
  setInputMessage: (s: string) => void;
  useSearch: boolean;
  setUseSearch: (b: boolean) => void;
  isGenerating: boolean;
  chatBottomRef?: React.RefObject<HTMLDivElement | null>;
  handleClearHistory: () => void;
  handleFastDirective: (directive: string) => void;
  handleSendMessage: (overrideText?: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const ScriptChatPane: React.FC<ScriptChatPaneProps> = ({
  messages,
  inputMessage,
  setInputMessage,
  useSearch,
  setUseSearch,
  isGenerating,
  chatBottomRef,
  handleClearHistory,
  handleFastDirective,
  handleSendMessage,
  handleKeyDown,
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages.length, isGenerating]);
  return (
    <div className="lg:col-span-5 flex flex-col h-full bg-white dark:bg-zinc-950/60 overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/60 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            CoWorker-Editor Directing Chat
          </span>
          <span className="text-[10px] text-zinc-400">
            Direct revisions • Polish scripts
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Google Search Grounding Toggle */}
          <button
            id="btn-toggle-search-grounding"
            onClick={() => setUseSearch(!useSearch)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              useSearch
                ? 'bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
            title="Verify real-world facts, dates, and historical timelines using Google Search"
          >
            <Search className="w-3 h-3" />
            <span>Web Grounding</span>
          </button>

          {/* Reset / New Session */}
          <button
            id="btn-reset-script-session"
            onClick={handleClearHistory}
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Start new story session"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex gap-3 items-center text-xs text-zinc-500 dark:text-zinc-400 py-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
            <span>Gemini is architecting your story and timing hooks...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Fast Directing Quick Chips */}
      <div className="px-4 py-2 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-wrap items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-zinc-400 font-medium mr-0.5">Preset Directives:</span>
        {DIRECTOR_PROMPTS.map((prompt) => (
          <button
            key={prompt.label}
            type="button"
            onClick={() => handleFastDirective(prompt.prompt)}
            disabled={isGenerating}
            title={`Insert "${prompt.prompt}" into chat`}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 border border-zinc-200 dark:border-zinc-700/80 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer flex items-center gap-1"
          >
            <span className="text-blue-500 dark:text-blue-400 font-bold text-xs">+</span>
            <span>{prompt.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Input Deck */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
        <div className="relative">
          <textarea
            id="textarea-director-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Talk to Gemini: Paste a story, request revisions, or ask to punch up hooks..."
            rows={2}
            disabled={isGenerating}
            className="w-full pl-3 pr-10 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
          <button
            id="btn-send-director-msg"
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isGenerating}
            className={`absolute right-2 bottom-2.5 p-1.5 rounded-lg text-white transition-all ${
              inputMessage.trim() && !isGenerating
                ? 'bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer'
                : 'bg-zinc-300 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
            }`}
            title="Send instruction to director"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1 mt-1">
          <span>Shift + Enter for new line</span>
          <span>Gemini 3.8 Flash • Script Director</span>
        </div>
      </div>
    </div>
  );
};
