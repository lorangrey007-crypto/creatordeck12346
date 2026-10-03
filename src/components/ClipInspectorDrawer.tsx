import React, { useState } from 'react';
import { Sparkles, Sliders, Eye, Wand2, Plus, Play, Layers } from 'lucide-react';
import { TimelineClip, ChromaKeySettings, BlendMode } from '../types/timeline';
import { VIDEO_MOTION_TEMPLATES, MotionTemplate } from '../lib/videoTemplates';

interface InspectorProps {
  selectedClip: TimelineClip | null;
  onUpdateClip: (updatedClip: TimelineClip) => void;
  onInsertTemplate: (template: MotionTemplate) => void;
}

export const ClipInspectorDrawer: React.FC<InspectorProps> = ({
  selectedClip,
  onUpdateClip,
  onInsertTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<'inspector' | 'templates'>('templates');

  // Chroma key state helpers
  const chromaKey: ChromaKeySettings = selectedClip?.chromaKey || {
    enabled: false,
    color: 'green',
    similarity: 0.4,
    smoothness: 0.1,
    spillReduction: 0.5,
  };

  const handleToggleChroma = (enabled: boolean) => {
    if (!selectedClip) return;
    onUpdateClip({
      ...selectedClip,
      chromaKey: {
        ...chromaKey,
        enabled,
      },
    });
  };

  const handleChromaColorChange = (color: 'green' | 'blue' | 'magenta' | 'custom') => {
    if (!selectedClip) return;
    onUpdateClip({
      ...selectedClip,
      chromaKey: {
        ...chromaKey,
        color,
      },
    });
  };

  const handleChromaSimilarityChange = (similarity: number) => {
    if (!selectedClip) return;
    onUpdateClip({
      ...selectedClip,
      chromaKey: {
        ...chromaKey,
        similarity,
      },
    });
  };

  const handleBlendModeChange = (blendMode: BlendMode) => {
    if (!selectedClip) return;
    onUpdateClip({
      ...selectedClip,
      blendMode,
    });
  };

  const handleOpacityChange = (opacity: number) => {
    if (!selectedClip) return;
    onUpdateClip({
      ...selectedClip,
      opacity,
    });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      {/* Sub Tabs: Inspector vs Motion Templates */}
      <div className="flex items-center bg-zinc-950 border-b border-zinc-800 p-1">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-zinc-800 text-amber-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Motion Templates ({VIDEO_MOTION_TEMPLATES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inspector')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'inspector'
              ? 'bg-zinc-800 text-blue-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Clip Effects & Key</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 p-3 overflow-y-auto">
        {activeTab === 'templates' ? (
          /* Motion Templates List */
          <div className="space-y-2.5">
            <div className="text-[11px] text-zinc-400 leading-tight">
              Pre-built motion templates for YouTube hooks, subscribe animations, countdowns & green screen overlays.
            </div>

            <div className="grid grid-cols-1 gap-2">
              {VIDEO_MOTION_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 flex flex-col gap-2 group transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        style={{ backgroundColor: tmpl.previewColor }}
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      />
                      <span className="font-semibold text-zinc-200 text-xs">{tmpl.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 shrink-0">
                      {tmpl.duration}s
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-snug">{tmpl.description}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                    <span className="text-[10px] font-mono text-amber-400/90 uppercase tracking-wider">
                      {tmpl.category}
                    </span>
                    <button
                      onClick={() => onInsertTemplate(tmpl)}
                      className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Drop into Timeline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Clip Inspector & Green Screen Keyer */
          <div className="space-y-4">
            {!selectedClip ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Sliders className="w-8 h-8 text-zinc-600" />
                <p className="text-xs font-semibold text-zinc-300">No Clip Selected</p>
                <p className="text-[11px] text-zinc-500 max-w-[220px]">
                  Click any clip on the timeline to tweak Green Screen Chroma Key, blend modes, or opacity.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Selected Clip Header */}
                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="font-semibold text-zinc-200 truncate">{selectedClip.name}</div>
                  <div className="text-[10px] font-mono text-zinc-400">
                    Track: {selectedClip.trackId} • Duration: {selectedClip.duration.toFixed(2)}s
                  </div>
                </div>

                {/* 1. Chroma Key (Green Screen) Section */}
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🟢</span>
                      <span className="font-bold text-zinc-100">Chroma Key (Green Screen)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chromaKey.enabled}
                        onChange={(e) => handleToggleChroma(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>

                  {chromaKey.enabled && (
                    <div className="space-y-3 pt-2 border-t border-zinc-800">
                      {/* Key Color Choice */}
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 text-[11px]">Key Color</span>
                        <div className="flex items-center gap-1.5">
                          {(['green', 'blue', 'magenta'] as const).map((color) => (
                            <button
                              key={color}
                              onClick={() => handleChromaColorChange(color)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize cursor-pointer border ${
                                chromaKey.color === color
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                              }`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Similarity Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-zinc-400">
                          <span>Tolerance / Similarity</span>
                          <span className="font-mono">{(chromaKey.similarity * 100).toFixed(0)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="0.9"
                          step="0.05"
                          value={chromaKey.similarity}
                          onChange={(e) => handleChromaSimilarityChange(Number(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Blend Modes & Compositing */}
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span className="font-bold text-zinc-100">Compositing & Blend Mode</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-[11px]">Mode</span>
                      <select
                        value={selectedClip.blendMode || 'normal'}
                        onChange={(e) => handleBlendModeChange(e.target.value as BlendMode)}
                        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                      >
                        <option value="normal">Normal</option>
                        <option value="screen">Screen (Lighten)</option>
                        <option value="multiply">Multiply (Darken)</option>
                        <option value="overlay">Overlay</option>
                      </select>
                    </div>

                    {/* Opacity */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>Opacity</span>
                        <span className="font-mono">
                          {((selectedClip.opacity ?? 1.0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={selectedClip.opacity ?? 1.0}
                        onChange={(e) => handleOpacityChange(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
