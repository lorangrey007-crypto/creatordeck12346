import React, { useState } from 'react';
import { X, SlidersHorizontal, Plus, Trash2 } from 'lucide-react';
import { CustomAudioStyle } from '../types';

interface CustomStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  customStyles: CustomAudioStyle[];
  onSaveStyles: (styles: CustomAudioStyle[]) => void;
}

export const CustomStyleModal: React.FC<CustomStyleModalProps> = ({
  isOpen,
  onClose,
  customStyles,
  onSaveStyles,
}) => {
  const [tagInput, setTagInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [pitchOffset, setPitchOffset] = useState(-1.5);
  const [speedMultiplier, setSpeedMultiplier] = useState(0.9);
  const [gainDb] = useState(0);
  const [bassBoost] = useState(2.0);

  if (!isOpen) return null;

  const handleAddStyle = () => {
    const cleanTag = tagInput.toLowerCase().replace(/[^a-z0-9-_]/g, '').trim();
    if (!cleanTag) return;

    const newStyle: CustomAudioStyle = {
      id: `style_${Date.now()}`,
      tag: cleanTag,
      name: nameInput.trim() || cleanTag,
      pitchOffset,
      speedMultiplier,
      gainDb,
      bassBoost,
      trebleBoost: 0,
    };

    onSaveStyles([...customStyles, newStyle]);
    setTagInput('');
    setNameInput('');
  };

  const handleDeleteStyle = (id: string) => {
    onSaveStyles(customStyles.filter((s) => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#111317] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Custom Style Tags
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          Define custom tags for your script (e.g. <code className="text-zinc-900 dark:text-zinc-200 font-mono">[interrogation]</code>). The audio engine automatically shifts pitch, tempo, and resonance when this tag appears.
        </p>

        {/* Existing Custom Styles List */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Active Tags ({customStyles.length}):
          </label>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {customStyles.map((style) => (
              <div
                key={style.id}
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                    [{style.tag}]
                  </span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{style.name}</span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Pitch: {style.pitchOffset > 0 ? `+${style.pitchOffset}` : style.pitchOffset}st • Speed: {style.speedMultiplier}x
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteStyle(style.id)}
                  className="text-zinc-400 hover:text-rose-500 p-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Custom Style Form */}
        <div className="bg-zinc-50 dark:bg-zinc-900/40 p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 space-y-3">
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Create New Tag Profile</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                Tag Name (without brackets):
              </label>
              <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs">
                <span className="text-zinc-400 font-mono">[</span>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. dramatic-whisper"
                  className="w-full bg-transparent outline-hidden font-mono text-zinc-900 dark:text-zinc-100"
                />
                <span className="text-zinc-400 font-mono">]</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                Display Label:
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Dramatic Whisper"
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                <span>Pitch Offset:</span>
                <span className="font-mono">{pitchOffset > 0 ? `+${pitchOffset}` : pitchOffset}st</span>
              </div>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.5"
                value={pitchOffset}
                onChange={(e) => setPitchOffset(parseFloat(e.target.value))}
                className="w-full accent-zinc-900 dark:accent-white cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                <span>Speed Multiplier:</span>
                <span className="font-mono">{speedMultiplier.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                className="w-full accent-zinc-900 dark:accent-white cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleAddStyle}
            disabled={!tagInput.trim()}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              !tagInput.trim()
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                : 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 active:scale-95 shadow-xs cursor-pointer'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Custom Tag</span>
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
