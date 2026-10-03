import React from 'react';
import { 
  AudioWaveform, 
  Radio, 
  Plus, 
  Layers, 
  Zap, 
  Volume2, 
  ShieldCheck, 
  Music, 
  Mic,
  Cpu,
  Sparkles,
  Flame
} from 'lucide-react';
import { VoiceProfile, MasteringSettings, TTSEngine } from '../types';

interface VoiceAndMasteringPanelProps {
  engine: TTSEngine;
  voices?: VoiceProfile[];
  allVoices?: VoiceProfile[];
  selectedVoiceId: string;
  mastering: MasteringSettings;
  masterSpeed: number;
  masterPitch: number;
  emotionExaggeration?: number;
  isAuditioning?: boolean;
  onAuditionVoice?: (voiceId: string) => void;
  onChangeEmotionExaggeration?: (val: number) => void;
  onSelectEngine: (engine: TTSEngine) => void;
  onSelectVoice: (id: string) => void;
  onUpdateMastering: (settings: MasteringSettings) => void;
  onChangeMasterSpeed: (val: number) => void;
  onChangeMasterPitch: (val: number) => void;
  onOpenCloneModal: () => void;
  onOpenBlendModal: () => void;
}

export const VoiceAndMasteringPanel: React.FC<VoiceAndMasteringPanelProps> = ({
  engine,
  allVoices = [],
  selectedVoiceId,
  mastering,
  masterSpeed,
  masterPitch,
  emotionExaggeration = 0.65,
  isAuditioning = false,
  onAuditionVoice,
  onChangeEmotionExaggeration,
  onSelectEngine,
  onSelectVoice,
  onUpdateMastering,
  onChangeMasterSpeed,
  onChangeMasterPitch,
  onOpenCloneModal,
  onOpenBlendModal,
}) => {
  // Filter voices by active engine (include matching custom voices)
  const engineVoices = allVoices.filter((v) => v.engine === engine);
  const currentVoice = engineVoices.find((v) => v.id === selectedVoiceId) || engineVoices[0] || allVoices[0];

  const toggleMasteringSetting = (key: keyof MasteringSettings) => {
    onUpdateMastering({
      ...mastering,
      [key]: !mastering[key],
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Voice & Model Deck */}
      <div className="bg-white dark:bg-[#111317] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 shadow-xs transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80 mb-3.5">
          <div className="flex items-center gap-2">
            <AudioWaveform className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Google Neural Voice Engine
            </h2>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium font-mono">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>Gemini TTS</span>
          </div>
        </div>

        {/* Engine Specs Pill */}
        <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-[11px]">
          <span className="text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Google GenAI Online Service
          </span>
          <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">
            24kHz Broadcast Quality
          </span>
        </div>

        {/* Voice Selector Dropdown */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Voice Model:
            </label>
            <div className="flex items-center gap-1.5">
              <button
                id="btn-clone-voice"
                onClick={onOpenCloneModal}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60 transition-colors"
                title="Drop audio sample to clone speaker zero-shot"
              >
                <Plus className="w-3 h-3" />
                <span>Clone</span>
              </button>
              <button
                id="btn-blend-voice"
                onClick={onOpenBlendModal}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60 transition-colors"
                title="Blend two voices into a hybrid signature"
              >
                <Layers className="w-3 h-3" />
                <span>Blend</span>
              </button>
            </div>
          </div>

          <select
            id="voice-select"
            value={currentVoice?.id || ''}
            onChange={(e) => onSelectVoice(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 outline-hidden focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          >
            {allVoices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.gender.toUpperCase()} • {v.accent})
              </option>
            ))}
          </select>

          {/* Active Voice Card Info */}
          {currentVoice && (
            <div className="bg-zinc-50/80 dark:bg-zinc-900/60 rounded-lg p-2.5 border border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="font-medium text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>{currentVoice.style}</span>
                </p>
                {currentVoice.geminiVoiceKey && (
                  <span className="font-mono text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded">
                    Google {currentVoice.geminiVoiceKey}
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                {currentVoice.description}
              </p>
              {onAuditionVoice && (
                <div className="pt-1 flex items-center justify-end">
                  <button
                    id="btn-audition-voice"
                    onClick={() => onAuditionVoice(currentVoice.id)}
                    disabled={isAuditioning}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title="Generate and play immediate voice audition sample with Google Gemini TTS"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isAuditioning ? 'Auditioning Voice...' : 'Audition Sample'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Emotion Dynamic Range Control */}
        {onChangeEmotionExaggeration && (
          <div className="mt-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
            <div className="flex justify-between text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" />
                Vocal Dynamic Range & Acting:
              </span>
              <span className="font-mono">
                {Math.round(emotionExaggeration * 100)}%
                {emotionExaggeration > 0.8 ? ' (Intense / Dramatic)' : emotionExaggeration < 0.4 ? ' (Subdued / Measured)' : ' (Natural Studio)'}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={emotionExaggeration}
              onChange={(e) => onChangeEmotionExaggeration(parseFloat(e.target.value))}
              className="w-full accent-blue-600 dark:accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
              <span>Subdued</span>
              <span>Natural Inflection</span>
              <span>Intense Drama</span>
            </div>
          </div>
        )}

        {/* Master Speed & Pitch Trims */}
        <div className="grid grid-cols-2 gap-3 mt-3.5 pt-3.5 border-t border-zinc-200/80 dark:border-zinc-800/80">
          <div>
            <div className="flex justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              <span>Speed:</span>
              <span className="font-mono">{masterSpeed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.02"
              value={masterSpeed}
              onChange={(e) => onChangeMasterSpeed(parseFloat(e.target.value))}
              className="w-full accent-zinc-900 dark:accent-white cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              <span>Pitch:</span>
              <span className="font-mono">{masterPitch > 0 ? `+${masterPitch}` : masterPitch}st</span>
            </div>
            <input
              type="range"
              min="-4"
              max="4"
              step="0.5"
              value={masterPitch}
              onChange={(e) => onChangeMasterPitch(parseFloat(e.target.value))}
              className="w-full accent-zinc-900 dark:accent-white cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Broadcast Mastering Suite */}
      <div className="bg-white dark:bg-[#111317] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 shadow-xs transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80 mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Studio Mastering
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            YouTube / Shorts
          </span>
        </div>

        <div className="space-y-2">
          {/* Shure SM7B Warmth EQ */}
          <label className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 cursor-pointer border border-zinc-200/60 dark:border-zinc-800 transition-colors">
            <div className="flex items-center gap-2.5">
              <Zap className={`w-4 h-4 ${mastering.broadcastEq ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`} />
              <div>
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  SM7B Broadcast Warmth EQ
                </p>
                <p className="text-[11px] text-zinc-500">
                  +150Hz vocal resonance & silky 10kHz air
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={mastering.broadcastEq}
              onChange={() => toggleMasteringSetting('broadcastEq')}
              className="w-4 h-4 accent-zinc-900 dark:accent-white rounded cursor-pointer"
            />
          </label>

          {/* YouTube -14 LUFS Loudness */}
          <label className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 cursor-pointer border border-zinc-200/60 dark:border-zinc-800 transition-colors">
            <div className="flex items-center gap-2.5">
              <Volume2 className={`w-4 h-4 ${mastering.youtubeLufs ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`} />
              <div>
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  YouTube Broadcast Level (-14 LUFS)
                </p>
                <p className="text-[11px] text-zinc-500">
                  True peak normalization for high playback clarity
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={mastering.youtubeLufs}
              onChange={() => toggleMasteringSetting('youtubeLufs')}
              className="w-4 h-4 accent-zinc-900 dark:accent-white rounded cursor-pointer"
            />
          </label>

          {/* Dynamic Compressor & Limiter */}
          <label className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 cursor-pointer border border-zinc-200/60 dark:border-zinc-800 transition-colors">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className={`w-4 h-4 ${mastering.peakLimiter ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`} />
              <div>
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  Vocal Leveler & Limiter
                </p>
                <p className="text-[11px] text-zinc-500">
                  Lifts quiet whispers and tames dynamic spikes
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={mastering.peakLimiter}
              onChange={() => toggleMasteringSetting('peakLimiter')}
              className="w-4 h-4 accent-zinc-900 dark:accent-white rounded cursor-pointer"
            />
          </label>

          {/* Anti-Aliasing Nyquist Filter */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  De-Whistle & Anti-Aliasing
                </p>
                <p className="text-[11px] text-zinc-500">
                  Eliminates 24kHz Nyquist whistling & digital high-frequency squeal
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
