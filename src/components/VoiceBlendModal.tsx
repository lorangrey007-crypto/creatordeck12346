import React, { useState } from 'react';
import { X, Layers, Sparkles } from 'lucide-react';
import { VoiceProfile } from '../types';
import { blendVoices } from '../services/voiceEngine';

interface VoiceBlendModalProps {
  isOpen: boolean;
  onClose: () => void;
  voices: VoiceProfile[];
  onSaveBlendedVoice: (voice: VoiceProfile) => void;
}

export const VoiceBlendModal: React.FC<VoiceBlendModalProps> = ({
  isOpen,
  onClose,
  voices,
  onSaveBlendedVoice,
}) => {
  const [voiceAId, setVoiceAId] = useState(voices[0]?.id || '');
  const [voiceBId, setVoiceBId] = useState(voices[1]?.id || voices[0]?.id || '');
  const [ratio, setRatio] = useState(0.3); // 70% A, 30% B
  const [blendName, setBlendName] = useState('');

  if (!isOpen) return null;

  const voiceA = voices.find((v) => v.id === voiceAId) || voices[0];
  const voiceB = voices.find((v) => v.id === voiceBId) || voices[1] || voices[0];

  const handleSave = () => {
    if (!voiceA || !voiceB) return;
    const finalName = blendName.trim() || `${voiceA.name.split('—')[0].trim()} + ${voiceB.name.split('—')[0].trim()}`;
    const blendedProfile = blendVoices(voiceA, voiceB, ratio, finalName);
    onSaveBlendedVoice(blendedProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#111317] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Voice Blending Lab
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          Blend two narrator models mathematically to create a unique signature voice for your channel.
        </p>

        {/* Voice Selection Grid */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Base Voice (A):
            </label>
            <select
              value={voiceAId}
              onChange={(e) => setVoiceAId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-hidden"
            >
              {voices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
              Infusion Voice (B):
            </label>
            <select
              value={voiceBId}
              onChange={(e) => setVoiceBId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-hidden"
            >
              {voices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ratio Slider */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 space-y-2">
          <div className="flex justify-between text-xs font-medium text-zinc-900 dark:text-zinc-100">
            <span>{Math.round((1 - ratio) * 100)}% Voice A</span>
            <span>{Math.round(ratio * 100)}% Voice B</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={ratio}
            onChange={(e) => setRatio(parseFloat(e.target.value))}
            className="w-full accent-zinc-900 dark:accent-white cursor-pointer"
          />
          <p className="text-[11px] text-zinc-500 text-center">
            70% / 30% is optimal for adding subtle texture or warmth
          </p>
        </div>

        {/* Custom Hybrid Name */}
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
            Hybrid Voice Name:
          </label>
          <input
            type="text"
            value={blendName}
            onChange={(e) => setBlendName(e.target.value)}
            placeholder="e.g. Signature Channel Narrator"
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-hidden focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 active:scale-95 shadow-xs cursor-pointer transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Blend</span>
          </button>
        </div>
      </div>
    </div>
  );
};
