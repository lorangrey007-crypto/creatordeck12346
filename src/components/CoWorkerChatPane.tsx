import React, { useState } from 'react';
import { Bot, Send, Sparkles, Wand2, Scissors, FastForward, AlignLeft, BookmarkCheck, ArrowDown } from 'lucide-react';
import { CoWorkerMessage, TimelineTrack } from '../types/timeline';

interface CoWorkerChatProps {
  tracks: TimelineTrack[];
  currentTime: number;
  duration: number;
  onExecuteDirective: (directive: string) => void;
}

export const CoWorkerChatPane: React.FC<CoWorkerChatProps> = ({
  tracks,
  currentTime,
  duration,
  onExecuteDirective,
}) => {
  const [messages, setMessages] = useState<CoWorkerMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content:
        'Hey creator! I am your AI Co-Worker Editing Assistant. I can inspect your timeline tracks, suggest cutaways, auto-align voiceovers with B-roll, ripple-delete dead gaps, and place markers.',
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSend = (text?: string) => {
    const prompt = text || inputValue.trim();
    if (!prompt) return;

    const userMsg: CoWorkerMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!text) setInputValue('');
    setIsProcessing(true);

    // Timeline analysis & smart response
    setTimeout(() => {
      let replyContent = '';
      const lower = prompt.toLowerCase();

      if (lower.includes('split') || lower.includes('cut') || lower.includes('razor')) {
        replyContent = `Executing cut at playhead (${currentTime.toFixed(2)}s). I checked your active clips and applied a razor slice so you can adjust the timing or insert an overlay.`;
        onExecuteDirective('split');
      } else if (lower.includes('ripple') || lower.includes('gap') || lower.includes('dead air')) {
        replyContent =
          'Scanned your timeline: aligned all sequential clips and removed trailing gap spaces on Voiceover and Video tracks.';
        onExecuteDirective('ripple_gaps');
      } else if (lower.includes('broll') || lower.includes('overlay') || lower.includes('cutaway')) {
        replyContent = `Inserted a high-energy B-Roll overlay clip onto Track V2 starting at ${currentTime.toFixed(2)}s lasting 3.5 seconds.`;
        onExecuteDirective('add_broll');
      } else if (lower.includes('music') || lower.includes('sfx') || lower.includes('audio')) {
        replyContent =
          'Added background atmospheric synth music bed to Track A2 and set the master mix volume to 80% to keep voiceover clear.';
        onExecuteDirective('add_music');
      } else {
        const totalClips = tracks.reduce((acc, t) => acc + t.clips.length, false ? 0 : 0) + tracks.reduce((acc, t) => acc + t.clips.length, 0);
        replyContent = `I analyzed your timeline: you currently have ${tracks.length} active tracks with ${totalClips} clip(s) across a ${duration.toFixed(1)}s project. Would you like me to insert a 3.5s B-roll overlay, split at playhead, or ripple-delete silence?`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: replyContent,
          timestamp: Date.now(),
        },
      ]);
      setIsProcessing(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
      {/* CoWorker Header */}
      <div className="px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">CoWorker Editor AI</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Timeline Linked
        </span>
      </div>

      {/* Suggested Quick Directives */}
      <div className="p-2 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleSend('Cut active clip at playhead')}
          className="px-2 py-1 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium flex items-center gap-1 shrink-0 cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700"
        >
          <Scissors className="w-3 h-3 text-amber-500" />
          <span>Split at Playhead</span>
        </button>

        <button
          onClick={() => handleSend('Add B-Roll overlay cutaway at playhead')}
          className="px-2 py-1 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium flex items-center gap-1 shrink-0 cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700"
        >
          <Sparkles className="w-3 h-3 text-sky-500" />
          <span>Insert B-Roll</span>
        </button>

        <button
          onClick={() => handleSend('Ripple delete gaps and silence')}
          className="px-2 py-1 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium flex items-center gap-1 shrink-0 cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700"
        >
          <FastForward className="w-3 h-3 text-emerald-500" />
          <span>Ripple Gaps</span>
        </button>
      </div>

      {/* Message Chat Feed */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl max-w-[88%] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/60 rounded-bl-xs'
              }`}
            >
              {m.content}
            </div>
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 px-1">
              {new Date(m.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 italic">
            <Wand2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
            <span>CoWorker is modifying timeline...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-2 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Ask CoWorker to edit, split, or add clips..."
          className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputValue.trim()}
          className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
