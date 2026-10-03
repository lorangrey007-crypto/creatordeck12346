import React, { useRef } from 'react';
import { Folder, Film, Mic, Image as ImageIcon, Upload, Plus, Sparkles } from 'lucide-react';
import { MediaAsset } from '../types/timeline';

interface MediaBinProps {
  assets: MediaAsset[];
  onAddClipToTimeline: (asset: MediaAsset) => void;
  onFileUpload: (file: File) => void;
  onAddSampleClips: () => void;
}

export const MediaBinDrawer: React.FC<MediaBinProps> = ({
  assets,
  onAddClipToTimeline,
  onFileUpload,
  onAddSampleClips,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      {/* Bin Header */}
      <div className="px-3 py-2.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-zinc-100">Media Project Bin</span>
          <span className="text-[10px] text-zinc-400 font-mono">({assets.length})</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors cursor-pointer"
            title="Import video, audio, or image from computer"
          >
            <Upload className="w-3 h-3 text-blue-400" />
            <span>Import</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*,image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>
      </div>

      {/* Asset Grid */}
      <div className="flex-1 p-2.5 overflow-y-auto space-y-2">
        {assets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
            <Film className="w-8 h-8 text-zinc-600" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-300">Media Bin is Empty</p>
              <p className="text-[11px] text-zinc-500 max-w-[200px]">
                Import your own footage, or load production samples from Voice Studio & Veo.
              </p>
            </div>
            <button
              onClick={onAddSampleClips}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer transition-colors shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Starter Media</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1.5">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="p-2 rounded-lg bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 flex items-center justify-between text-xs group transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                    {asset.type === 'video' ? (
                      <Film className="w-3.5 h-3.5 text-indigo-400" />
                    ) : asset.type === 'audio' ? (
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-zinc-200 truncate text-[11px]">
                      {asset.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {asset.duration.toFixed(1)}s • {asset.source}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onAddClipToTimeline(asset)}
                  className="px-2 py-1 rounded bg-blue-600/80 hover:bg-blue-600 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Place clip onto Timeline at current playhead"
                >
                  <Plus className="w-3 h-3" />
                  <span>Insert</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media Bin Footer */}
      <div className="px-3 py-2 bg-zinc-950/90 border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between">
        <span>Drag & drop media into tracks</span>
        <button
          onClick={onAddSampleClips}
          className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
        >
          Load Starter Assets
        </button>
      </div>
    </div>
  );
};
