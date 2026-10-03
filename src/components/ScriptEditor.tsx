import React, { useRef } from 'react';
import { 
  Clock, 
  Sparkles, 
  Wand2, 
  RotateCcw, 
  Copy, 
  Check, 
  Volume2, 
  Flame, 
  Smile, 
  Gauge,
  PenTool
} from 'lucide-react';
import { CustomAudioStyle } from '../types';
import { calculateScriptStats, cleanScriptText, DEFAULT_SCRIPT } from '../services/elevenParser';

interface ScriptEditorProps {
  content: string;
  pacingMultiplier: number;
  customStyles: CustomAudioStyle[];
  onChangeContent: (text: string) => void;
  onChangePacing: (val: number) => void;
  onOpenScriptWriter?: () => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  content,
  pacingMultiplier,
  customStyles,
  onChangeContent,
  onChangePacing,
  onOpenScriptWriter,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = React.useState(false);
  const [cleaned, setCleaned] = React.useState(false);

  const stats = calculateScriptStats(content, pacingMultiplier, customStyles);

  // Insert tag at cursor or wrap selected text
  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let replacement = '';
    if (tag.includes('pause') || tag.includes('sighs') || tag.includes('gasps') || tag.includes('laughs')) {
      // Standalone tag
      replacement = ` ${tag} `;
    } else {
      // Delivery style tag
      replacement = selectedText ? `${tag} ${selectedText}` : `${tag} `;
    }

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    onChangeContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + replacement.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const handleCleanScript = () => {
    const cleanedText = cleanScriptText(content);
    onChangeContent(cleanedText);
    setCleaned(true);
    setTimeout(() => setCleaned(false), 2000);
  };

  const handleLoadSample = () => {
    onChangeContent(DEFAULT_SCRIPT);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111317] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs overflow-hidden transition-colors">
      {/* Top Header & Script Actions */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-[#0c0d12]/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Script Studio
          </span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">Google TTS</span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenScriptWriter && (
            <button
              id="btn-open-script-writer-editor"
              onClick={onOpenScriptWriter}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/60 rounded-md transition-colors cursor-pointer"
              title="Open AI Human Script Writer (Google TTS Standard)"
            >
              <PenTool className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>AI Script Writer</span>
            </button>
          )}

          <button
            id="btn-clean-script"
            onClick={handleCleanScript}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
              cleaned
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs'
                : 'text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60'
            }`}
            title="Clean text formatting while preserving all Google voice tags"
          >
            {cleaned ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">Cleaned!</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>Format Clean</span>
              </>
            )}
          </button>

          <button
            id="btn-load-sample"
            onClick={handleLoadSample}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Load Sample Script"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sample</span>
          </button>

          <button
            id="btn-copy-script"
            onClick={handleCopy}
            className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-md transition-colors cursor-pointer"
            title="Copy Raw Script"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Quick-Insert ElevenLabs v3 Tag Palette */}
      <div className="px-4 py-2 border-b border-zinc-200/80 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-950/30 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-[11px] font-medium text-zinc-400 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-zinc-400" /> Tags:
        </span>

        {/* Timing Pauses */}
        <button
          onClick={() => insertTag('[pause]')}
          className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700/60 transition-all cursor-pointer"
          title="Standard 1.0s silence gap"
        >
          + [pause]
        </button>
        <button
          onClick={() => insertTag('[long pause]')}
          className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700/60 transition-all cursor-pointer"
          title="2.0s suspenseful pause"
        >
          + [long pause]
        </button>
        <button
          onClick={() => insertTag('[dramatic pause]')}
          className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700/60 transition-all cursor-pointer"
          title="2.5s cliffhanger pause"
        >
          + [dramatic pause]
        </button>
        <button
          onClick={() => insertTag('[short pause]')}
          className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700/60 transition-all cursor-pointer"
          title="0.4s hesitation"
        >
          + [short pause]
        </button>

        <span className="h-3 w-px bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

        {/* Emotions & Tones */}
        <button
          onClick={() => insertTag('[whispers]')}
          className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700/60 transition-all cursor-pointer"
        >
          + [whispers]
        </button>
        <button
          onClick={() => insertTag('[suspense]')}
          className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700/60 transition-all cursor-pointer"
        >
          + [suspense]
        </button>
        <button
          onClick={() => insertTag('[dark]')}
          className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700/60 transition-all cursor-pointer"
        >
          + [dark]
        </button>
        <button
          onClick={() => insertTag('[urgent]')}
          className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700/60 transition-all cursor-pointer"
        >
          + [urgent]
        </button>
        <button
          onClick={() => insertTag('[solemn]')}
          className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700/60 transition-all cursor-pointer"
        >
          + [solemn]
        </button>

        <span className="h-3 w-px bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

        {/* Human Reactions */}
        <button
          onClick={() => insertTag('[sighs]')}
          className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700/60 transition-all cursor-pointer"
        >
          + [sighs]
        </button>
        <button
          onClick={() => insertTag('[gasps]')}
          className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700/60 transition-all cursor-pointer"
        >
          + [gasps]
        </button>
        <button
          onClick={() => insertTag('[clears throat]')}
          className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700/60 transition-all cursor-pointer"
        >
          + [clears throat]
        </button>
        <button
          onClick={() => insertTag('[laughs]')}
          className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700/60 transition-all cursor-pointer"
        >
          + [laughs]
        </button>

        {/* Custom Styles */}
        {customStyles.map((cs) => (
          <button
            key={cs.id}
            onClick={() => insertTag(`[${cs.tag}]`)}
            className="px-2 py-0.5 rounded-md bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-[11px] border border-zinc-300 dark:border-zinc-600 transition-all cursor-pointer"
            title={`Custom Style: ${cs.name}`}
          >
            + [{cs.tag}]
          </button>
        ))}
      </div>

      {/* Main Textarea */}
      <div className="relative flex-1 min-h-[340px] p-4 flex flex-col">
        <textarea
          ref={textareaRef}
          id="script-textarea"
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
          placeholder="Paste your story or script here with Google voice tags like [pause], [whispers], [dark], [sighs], [hesitates]..."
          className="w-full flex-1 resize-none bg-transparent font-sans text-sm md:text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 outline-hidden selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900"
          spellCheck={false}
        />
      </div>

      {/* Script Inspector & Pacing Multiplier Footer */}
      <div className="px-4 py-3 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-[#0c0d12]/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Live Counters */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{stats.characters.toLocaleString()}</span>
            <span>chars</span>
            {stats.characters > 5000 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 font-sans">
                12k Chunking Ready
              </span>
            )}
          </div>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{stats.words.toLocaleString()}</span> words
          </div>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{stats.pauseCount} pauses</span>
          </div>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
            <Flame className="w-3.5 h-3.5 text-zinc-400" />
            <span>{stats.emotionCount} delivery tags</span>
          </div>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
            ~{Math.floor(stats.estimatedSeconds / 60)}m {stats.estimatedSeconds % 60}s est. runtime
          </div>
        </div>

        {/* Pacing Scale Multiplier Slider */}
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <Gauge className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          <span className="text-zinc-700 dark:text-zinc-300 font-medium text-[11px]">Pause Scale:</span>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={pacingMultiplier}
            onChange={(e) => onChangePacing(parseFloat(e.target.value))}
            className="w-20 accent-zinc-900 dark:accent-white cursor-pointer"
            title="Adjust pause duration scale for this script (e.g. 0.8x for snappy Shorts, 1.2x for tense documentaries)"
          />
          <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 min-w-[32px] text-[11px]">
            {pacingMultiplier.toFixed(2)}x
          </span>
          {pacingMultiplier !== 1.0 && (
            <button
              onClick={() => onChangePacing(1.0)}
              className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 ml-1 underline cursor-pointer"
            >
              reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
