import React from 'react';
import { X, History, Play, Download, Trash2, FileText } from 'lucide-react';
import { RenderedTake } from '../types';

interface RecentTakesModalProps {
  isOpen: boolean;
  onClose: () => void;
  takes: RenderedTake[];
  onRestoreTake: (take: RenderedTake) => void;
  onDeleteTake: (id: string) => void;
  onClearAll: () => void;
}

export const RecentTakesModal: React.FC<RecentTakesModalProps> = ({
  isOpen,
  onClose,
  takes = [],
  onRestoreTake,
  onDeleteTake,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const safeTakes = Array.isArray(takes) ? takes : [];

  const downloadWav = (take: RenderedTake) => {
    const url = URL.createObjectURL(take.wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${take.tabTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_take_${new Date(take.timestamp).toISOString().slice(11, 19).replace(/:/g, '-')}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSrt = (take: RenderedTake) => {
    const blob = new Blob([take.srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${take.tabTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_captions.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#111317] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              History & Takes Gallery
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-500">
          Compare previous renders, restore older audio takes into the timeline player, or download prior .wav and .srt files.
        </p>

        {/* Takes List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
          {safeTakes.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-xs">
              No recent takes rendered yet. Click &quot;Generate Speech&quot; to render your first take!
            </div>
          ) : (
            safeTakes.map((take, idx) => (
              <div
                key={take.id}
                className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Take #{safeTakes.length - idx}: {take.tabTitle}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                      {take.voiceName.split('—')[0].trim()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1 font-mono">
                    <span>{new Date(take.timestamp).toLocaleTimeString()}</span>
                    <span>•</span>
                    <span>{take.totalDurationSec.toFixed(1)}s runtime</span>
                    <span>•</span>
                    <span>{take.segmentCount} sentences</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onRestoreTake(take)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-zinc-900 dark:text-zinc-100 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition-colors"
                    title="Load this take into the waveform player"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Load Player</span>
                  </button>

                  <button
                    onClick={() => downloadWav(take)}
                    className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    title="Download WAV"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => downloadSrt(take)}
                    className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    title="Download SRT Captions"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteTake(take.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete Take"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
          {safeTakes.length > 0 ? (
            <button
              onClick={onClearAll}
              className="text-xs text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              Clear All Takes
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
