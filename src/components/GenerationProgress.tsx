import React from 'react';
import { Play, Loader2, StopCircle, Volume2, Cpu, HardDrive } from 'lucide-react';

interface GenerationProgressProps {
  isRendering: boolean;
  currentIndex: number;
  totalSegments: number;
  currentSentenceText: string;
  modelProgressMessage?: string;
  onStartRender: () => void;
  onCancelRender: () => void;
  hasAudio: boolean;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  isRendering,
  currentIndex,
  totalSegments,
  currentSentenceText,
  modelProgressMessage,
  onStartRender,
  onCancelRender,
  hasAudio,
}) => {
  const percent = totalSegments > 0 ? Math.round((currentIndex / totalSegments) * 100) : 0;

  return (
    <div className="bg-white dark:bg-[#111317] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 shadow-xs transition-colors">
      {!isRendering ? (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Studio Voice Generation
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              24kHz broadcast PCM with dynamic delivery tags & multi-band mastering
            </p>
          </div>

          <button
            id="btn-render-audio"
            onClick={onStartRender}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 dark:text-zinc-950 dark:bg-white dark:hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Generate Speech (Ctrl + Enter)</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              <Loader2 className="w-4 h-4 text-zinc-800 dark:text-zinc-200 animate-spin" />
              <span>
                {currentIndex > 0 
                  ? `Synthesizing Sentence ${currentIndex} of ${totalSegments} (${percent}%)`
                  : 'Initializing studio voice model...'}
              </span>
            </div>

            <button
              onClick={onCancelRender}
              className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-zinc-900 dark:bg-white transition-all duration-200"
              style={{ width: `${Math.max(5, percent)}%` }}
            />
          </div>

          {/* Model or Sentence info */}
          {modelProgressMessage ? (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800">
              <HardDrive className="w-3 h-3 text-zinc-400 shrink-0" />
              <span className="truncate">{modelProgressMessage}</span>
            </div>
          ) : currentSentenceText ? (
            <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate italic">
              &quot;{currentSentenceText}&quot;
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};
