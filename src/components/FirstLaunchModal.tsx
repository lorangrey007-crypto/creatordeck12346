import React, { useState } from 'react';
import { 
  KeyRound, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  RefreshCw,
  Zap,
  Lock
} from 'lucide-react';
import { 
  setCustomApiKey, 
  pingGeminiConnection, 
  ConnectionStatus 
} from '../services/geminiKeyService';

interface FirstLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyConfigured: () => void;
}

export const FirstLaunchModal: React.FC<FirstLaunchModalProps> = ({
  isOpen,
  onClose,
  onKeyConfigured,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerifyAndSave = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a valid Gemini API key.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const result = await pingGeminiConnection(trimmed);
      setTestResult(result);

      if (result.status === 'authenticated') {
        setCustomApiKey(trimmed);
        onKeyConfigured();
        onClose();
      } else if (result.status === 'quota_exceeded') {
        // Still save, notify user
        setCustomApiKey(trimmed);
        onKeyConfigured();
        onClose();
      } else {
        setErrorMessage(result.error || 'Verification failed. Please check that the key is typed correctly.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error verifying key.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setApiKeyInput(text.trim());
      }
    } catch {
      // Clipboard access denied or unsupported
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="modal-first-launch-byok"
        className="w-full max-w-lg bg-white dark:bg-[#101217] border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Top Header Banner */}
        <div className="p-6 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent border-b border-zinc-200/70 dark:border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  Welcome to CreatorDeck
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold font-mono uppercase rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  Setup
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                All-in-One Content Production Workstation
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-zinc-800 dark:text-zinc-200">
          {/* Privacy & BYOK Explanation */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
              <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Standalone & Private Architecture</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              CreatorDeck runs directly on your device and connects to your own Google Gemini API key. Your scripts, generated voiceovers, and project assets remain 100% private to you and never pass through any shared third-party servers.
            </p>
          </div>

          {/* API Key Input Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="input-first-launch-key" className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                <span>Google Gemini API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer noopener"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Get a Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative flex items-center">
              <input
                id="input-first-launch-key"
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setErrorMessage(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVerifyAndSave();
                }}
                placeholder="AIzaSy..."
                className="w-full pl-3 pr-20 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePasteKey}
                  className="px-2 py-1 rounded text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                  title="Paste from clipboard"
                >
                  Paste
                </button>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Quick 3-Step Guide */}
          <div className="space-y-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/80">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">How to get a key in 30 seconds:</span>
            <ol className="list-decimal list-inside space-y-0.5 ml-1">
              <li>Open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-blue-500 underline">aistudio.google.com/apikey</a>.</li>
              <li>Sign in with your Google account and click <strong>Create API Key</strong>.</li>
              <li>Copy and paste your key above. It is completely free to start.</li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/60 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
          >
            I'll Add Key Later (Browse Only)
          </button>

          <button
            id="btn-verify-and-enter-studio"
            type="button"
            disabled={isVerifying || !apiKeyInput.trim()}
            onClick={handleVerifyAndSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying Key...</span>
              </>
            ) : (
              <>
                <span>Save & Enter Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
