import React, { useState, useEffect } from 'react';
import { 
  AudioWaveform, 
  BookOpen, 
  KeyRound, 
  RotateCcw, 
  ExternalLink, 
  ShieldCheck,
  Zap,
  Sparkles,
  Download,
  HardDrive
} from 'lucide-react';

interface FooterProps {
  onOpenGuide: () => void;
  onOpenKeySettings: () => void;
  onOpenBackup?: () => void;
  onResetWorkspace: () => void;
  isKeyConfigured: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenGuide,
  onOpenKeySettings,
  onOpenBackup,
  onResetWorkspace,
  isKeyConfigured,
}) => {
  const [isAiStudioEnv, setIsAiStudioEnv] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const inIframe = window.self !== window.top;
      const isAisHost = window.location.hostname.includes('ais-') && window.location.hostname.includes('.run.app');
      // Only show in AI Studio (inside iframe or AI Studio sandbox domain)
      // When installed locally or on user's device (localhost), this is false
      setIsAiStudioEnv(inIframe || isAisHost);
    } catch {
      // Cross-origin iframe exception confirms it is embedded inside an iframe (AI Studio preview)
      setIsAiStudioEnv(true);
    }
  }, []);

  return (
    <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#0b0c10]/95 backdrop-blur-md py-3 px-4 lg:px-6 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Brand & Statement */}
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs">
            <AudioWaveform className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
              CreatorDeck
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              End-to-End Video Production Suite
            </span>
          </div>
        </div>

        {/* Center / Right: Interactive Controls & Links */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Direct ZIP Download — ONLY visible inside AI Studio environment */}
          {isAiStudioEnv && (
            <a
              id="btn-footer-download-zip"
              href="/api/download-zip"
              download="creatordeck-project.zip"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs"
              title="Export complete project source code (.zip) to test locally on your computer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export Project (.zip)</span>
            </a>
          )}

          {/* Platform Guide & Features (FAQ / How it works) */}
          <button
            id="btn-footer-feature-guide"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-800 transition-all cursor-pointer shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            <span>How It Works</span>
          </button>

          {/* Save to PC Backup */}
          {onOpenBackup && (
            <button
              id="btn-footer-backup"
              onClick={onOpenBackup}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900 transition-all cursor-pointer shadow-2xs"
              title="Save or restore project data directly to your PC (.json)"
            >
              <HardDrive className="w-3.5 h-3.5 text-blue-500" />
              <span>Save / Load PC</span>
            </button>
          )}

          {/* API Key Settings */}
          <button
            id="btn-footer-key-settings"
            onClick={onOpenKeySettings}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer shadow-2xs ${
              isKeyConfigured
                ? 'bg-zinc-50/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            <span>{isKeyConfigured ? 'API Key Settings' : 'Configure API Key'}</span>
          </button>

          {/* Reset Workspace */}
          <button
            id="btn-footer-reset-workspace"
            onClick={onResetWorkspace}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
            title="Reset active workspace to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Google AI Studio Link */}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer noopener"
            className="hidden md:flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <span>Google AI Studio</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
};
