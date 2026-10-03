import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Sparkles,
  Zap,
  ShieldCheck,
  AlertTriangle,
  HardDrive
} from 'lucide-react';
import { 
  getCustomApiKey, 
  setCustomApiKey, 
  clearCustomApiKey, 
  pingGeminiConnection, 
  ConnectionStatus 
} from '../services/geminiKeyService';

interface GeminiStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyChanged?: () => void;
  onOpenBackupModal?: () => void;
  initialStatus?: ConnectionStatus | null;
}

export const GeminiStatusModal: React.FC<GeminiStatusModalProps> = ({
  isOpen,
  onClose,
  onKeyChanged,
  onOpenBackupModal,
  initialStatus,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ConnectionStatus | null>(initialStatus || null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const activeCustom = getCustomApiKey();
      setKeyInput(activeCustom);
      handleTestConnection(activeCustom);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async (testKey?: string) => {
    setIsTesting(true);
    setSaveFeedback(null);
    try {
      const result = await pingGeminiConnection(testKey);
      setCurrentStatus(result);
    } catch {
      // Handled in pingGeminiConnection
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveCustomKey = async () => {
    const trimmed = keyInput.trim();
    setIsTesting(true);
    try {
      const result = await pingGeminiConnection(trimmed);
      setCurrentStatus(result);

      if (result.status === 'authenticated') {
        setCustomApiKey(trimmed);
        setSaveFeedback('API Key verified and saved successfully!');
        onKeyChanged?.();
      } else if (result.status === 'quota_exceeded') {
        setCustomApiKey(trimmed);
        setSaveFeedback('Key saved, but this key is currently rate-limited (429 Quota Exceeded).');
        onKeyChanged?.();
      } else {
        setSaveFeedback('Warning: Verification failed. Check key spelling or permissions.');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearKey = async () => {
    clearCustomApiKey();
    setKeyInput('');
    setIsTesting(true);
    try {
      const result = await pingGeminiConnection('');
      setCurrentStatus(result);
      setSaveFeedback('API Key removed. A personal Gemini API key is required to generate content.');
      onKeyChanged?.();
    } finally {
      setIsTesting(false);
    }
  };

  const isHealthy = currentStatus?.status === 'authenticated';
  const isQuota = currentStatus?.status === 'quota_exceeded';
  const isAuthErr = currentStatus?.status === 'auth_error';
  const isKeyRequired = currentStatus?.status === 'key_required' || !keyInput.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="modal-gemini-status"
        className="w-full max-w-lg bg-white dark:bg-[#111317] border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Gemini API Connection & Key Manager
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Live health, latency ping, and multi-key fallback switcher
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Live Status Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            isHealthy 
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40' 
              : isQuota
              ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40'
              : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isHealthy ? 'bg-emerald-400' : isQuota ? 'bg-amber-400' : 'bg-rose-400'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${
                    isHealthy ? 'bg-emerald-500' : isQuota ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />
                </span>

                <div>
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    {isHealthy && 'Connection Healthy & Authenticated'}
                    {isQuota && 'Rate Limit / Quota Exceeded (429)'}
                    {isAuthErr && 'Authentication Failed (Check Key)'}
                    {isKeyRequired && 'No API Key Configured (Required)'}
                    {!isHealthy && !isQuota && !isAuthErr && !isKeyRequired && 'Connection Pending or Error'}
                  </h3>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                    {currentStatus?.keySource === 'custom' 
                      ? 'Running on your user API key' 
                      : 'BYOK Active: Server has zero API keys configured'}
                    {currentStatus?.keyMasked && (
                      <span className="font-mono ml-1.5 px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-[10px] text-zinc-700 dark:text-zinc-300">
                        {currentStatus.keyMasked}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Latency badge & ping button */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                    {currentStatus && currentStatus.status !== 'key_required' ? `${currentStatus.latencyMs} ms` : '—'}
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    roundtrip
                  </div>
                </div>

                <button
                  id="btn-re-ping-api"
                  onClick={() => handleTestConnection(keyInput.trim())}
                  disabled={isTesting || !keyInput.trim()}
                  className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                  title="Ping Gemini API now"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Error or Quota message */}
            {currentStatus?.error && (
              <div className="mt-2.5 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800 space-y-2">
                <div className="text-[11px] text-rose-700 dark:text-rose-300 font-mono break-all flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                  <span>{currentStatus.error}</span>
                </div>

                {/* Quota reached backup helper */}
                {currentStatus.status === 'quota_exceeded' && onOpenBackupModal && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-amber-900 dark:text-amber-200">
                      <span className="font-semibold">Safe workflow:</span> Save your project to your PC now so you can resume anytime or switch keys.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenBackupModal();
                      }}
                      className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                    >
                      <HardDrive className="w-3 h-3" />
                      <span>Save to PC</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Key Change Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
                Configure Gemini API Key
              </label>

              {getCustomApiKey() && (
                <button
                  onClick={handleClearKey}
                  disabled={isTesting}
                  className="text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear Stored Key
                </button>
              )}
            </div>

            <div className="relative">
              <input
                id="input-custom-gemini-key"
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Paste Gemini API Key (AIzaSy...)"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg px-3 py-2 pr-10 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 outline-hidden focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Your API key is stored locally in your browser and used exclusively for your sessions. It powers Voiceover TTS, Script Studio, SEO, and B-Roll directions directly with zero server key usage.
            </p>
          </div>

          {/* Feedback notification */}
          {saveFeedback && (
            <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{saveFeedback}</span>
            </div>
          )}

          {/* Strict BYOK Notice */}
          <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-xl p-3 border border-zinc-200/60 dark:border-zinc-800/80 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% Client BYOK Architecture</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              The server does not provide or share any API keys or quota. Every user must provide their own free Gemini API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-blue-500 underline">Google AI Studio</a>.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/40 flex items-center justify-between">
          <button
            onClick={() => handleTestConnection(keyInput.trim())}
            disabled={isTesting}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              Done
            </button>
            <button
              id="btn-save-custom-api-key"
              onClick={handleSaveCustomKey}
              disabled={isTesting || !keyInput.trim()}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Save & Apply Key</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
