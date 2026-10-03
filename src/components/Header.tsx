import React from 'react';
import { 
  AudioWaveform, 
  Sun, 
  Moon, 
  Laptop, 
  SlidersHorizontal, 
  BookA, 
  History,
  Sparkles,
  Activity,
  KeyRound,
  PenTool,
  Clapperboard,
  Globe,
  BookOpen,
  HardDrive,
  Video,
  Image as ImageIcon,
  Film,
  Database
} from 'lucide-react';
import { TTSEngine } from '../types';
import { ConnectionStatus } from '../services/geminiKeyService';

export type WorkspaceModule = 'script-studio' | 'voice-studio' | 'broll-studio' | 'veo-studio' | 'imagen-studio' | 'timeline-editor' | 'veo-vault' | 'seo-studio';

interface HeaderProps {
  engine: TTSEngine;
  activeModule: WorkspaceModule;
  onModuleChange: (module: WorkspaceModule) => void;
  themeMode: 'system' | 'light' | 'dark';
  currentThemeEffective: 'light' | 'dark';
  connectionStatus: ConnectionStatus | null;
  onThemeChange: (mode: 'system' | 'light' | 'dark') => void;
  onOpenStylesModal: () => void;
  onOpenPronunciationModal: () => void;
  onOpenTakesModal: () => void;
  onOpenGeminiStatusModal: () => void;
  onOpenBackupModal: () => void;
  onOpenGuide: () => void;
  onResetToDefault: () => void;
  takeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  engine,
  activeModule,
  onModuleChange,
  themeMode,
  currentThemeEffective,
  connectionStatus,
  onThemeChange,
  onOpenStylesModal,
  onOpenPronunciationModal,
  onOpenTakesModal,
  onOpenGeminiStatusModal,
  onOpenBackupModal,
  onOpenGuide,
  onResetToDefault,
  takeCount,
}) => {
  const isKeyRequired = connectionStatus?.status === 'key_required';
  const isHealthy = connectionStatus?.status === 'authenticated';
  const isQuota = connectionStatus?.status === 'quota_exceeded';
  const isAuthErr = connectionStatus?.status === 'auth_error';

  return (
    <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#0c0d12]/95 backdrop-blur-md px-4 lg:px-6 py-2.5 transition-colors sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Identity - CreatorDeck */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white dark:bg-blue-500 dark:text-zinc-950 flex items-center justify-center shadow-xs transition-colors">
            <AudioWaveform className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
                CreatorDeck
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-mono tracking-wide rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1 font-medium">
                Production Suite
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Scriptwriting, Voice Mastering, SEO & Visual Direction
            </p>
          </div>
        </div>

        {/* Primary Workspace Module Switcher */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-900/90 p-1 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <button
            id="nav-tab-script-studio"
            onClick={() => onModuleChange('script-studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeModule === 'script-studio'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Script Studio</span>
          </button>

          <button
            id="nav-tab-voice-studio"
            onClick={() => onModuleChange('voice-studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeModule === 'voice-studio'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <AudioWaveform className="w-3.5 h-3.5 text-blue-500" />
            <span>Voice Studio</span>
          </button>

          <button
            id="nav-tab-broll-studio"
            onClick={() => onModuleChange('broll-studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeModule === 'broll-studio'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>B-Roll & Visuals</span>
          </button>

          <button
            id="nav-tab-veo-studio"
            onClick={() => onModuleChange('veo-studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeModule === 'veo-studio'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-purple-400" />
            <span>Veo Studio</span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
              activeModule === 'veo-studio' ? 'bg-purple-800 text-white' : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
            }`}>
              4K Dock
            </span>
          </button>

          <button
            id="nav-tab-imagen-studio"
            onClick={() => onModuleChange('imagen-studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeModule === 'imagen-studio'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
            <span>Imagen Studio</span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
              activeModule === 'imagen-studio' ? 'bg-pink-800 text-white' : 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300'
            }`}>
              Thumbnails
            </span>
          </button>

          <button
            id="nav-tab-timeline-editor"
            onClick={() => onModuleChange('timeline-editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeModule === 'timeline-editor'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-blue-400" />
            <span>CoWorker Editor</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
              activeModule === 'timeline-editor' ? 'bg-blue-800 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
            }`}>
              NLE Timeline
            </span>
          </button>

          <button
            id="nav-tab-veo-vault"
            onClick={() => onModuleChange('veo-vault')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeModule === 'veo-vault'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Veo-Vault</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
              activeModule === 'veo-vault' ? 'bg-purple-800 text-white' : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
            }`}>
              0-Credit DB
            </span>
          </button>

          <button
            id="nav-tab-seo-studio"
            onClick={() => onModuleChange('seo-studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeModule === 'seo-studio'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>YouTube SEO</span>
            <span className={`text-[10px] px-1 py-0.2 rounded font-mono font-medium ${
              activeModule === 'seo-studio' ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
            }`}>
              Grounded SEO
            </span>
          </button>
        </div>

        {/* Real-time Gemini API Health & Latency Status Indicator */}
        <div className="flex items-center gap-2">
          <button
            id="btn-gemini-connection-status"
            onClick={onOpenGeminiStatusModal}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer shadow-2xs hover:scale-[1.01] ${
              isHealthy
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-100/70'
                : isQuota
                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-100 hover:bg-amber-100/70'
                : isAuthErr
                ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-100 hover:bg-rose-100/70'
                : isKeyRequired
                ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-100 hover:bg-rose-100/70'
                : 'bg-zinc-100/80 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70'
            }`}
            title="Click to manage personal Gemini API key and test connection"
          >
            {/* Pulsing Status Dot */}
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isHealthy ? 'bg-emerald-400' : isQuota ? 'bg-amber-400' : 'bg-rose-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isHealthy ? 'bg-emerald-500' : isQuota ? 'bg-amber-500' : 'bg-rose-500'
              }`} />
            </span>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold font-mono text-[11px]">Gemini API</span>
              <span className="text-zinc-400 dark:text-zinc-500">•</span>
              <span className="font-mono text-[11px] font-medium">
                {isKeyRequired ? 'Key Needed' : connectionStatus ? `${connectionStatus.latencyMs}ms` : 'Checking...'}
              </span>
              {isQuota && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-amber-200/70 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-medium">
                  429 Quota
                </span>
              )}
              {isKeyRequired && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-200/80 dark:bg-rose-900 text-rose-900 dark:text-rose-200 font-medium">
                  BYOK Required
                </span>
              )}
              {isHealthy && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono font-medium">
                  BYOK Active
                </span>
              )}
            </div>

            <KeyRound className="w-3 h-3 text-zinc-400 dark:text-zinc-500 ml-0.5" />
          </button>
        </div>

        {/* Quick Tools & Theme Sync */}
        <div className="flex items-center gap-1.5">
          {/* Save to PC / Project Backup */}
          <button
            id="btn-header-backup"
            onClick={onOpenBackupModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 transition-colors border border-zinc-300/80 dark:border-zinc-700/80 cursor-pointer shadow-2xs"
            title="Save & Load Project on PC (Offline JSON Backup)"
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Save to PC</span>
          </button>

          {/* Platform Guide & Docs */}
          <button
            id="btn-header-guide"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors border border-blue-200/80 dark:border-blue-900/80 cursor-pointer shadow-2xs"
            title="How CreatorDeck Works & Features"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {/* Custom Styles Tag Creator */}
          <button
            id="btn-custom-styles"
            onClick={onOpenStylesModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/60"
            title="Custom Audio Style Tags"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="hidden md:inline">Custom Styles</span>
          </button>

          {/* Pronunciation Fixer */}
          <button
            id="btn-pronunciation"
            onClick={onOpenPronunciationModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/60"
            title="Pronunciation Dictionary"
          >
            <BookA className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="hidden md:inline">Dictionary</span>
          </button>

          {/* Recent Takes History */}
          <button
            id="btn-recent-takes"
            onClick={onOpenTakesModal}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/60"
            title="Recent Takes & History"
          >
            <History className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="hidden md:inline">Takes</span>
            {takeCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                {takeCount}
              </span>
            )}
          </button>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

          {/* Theme Switcher */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-md border border-zinc-200/80 dark:border-zinc-800">
            <button
              id="theme-system"
              onClick={() => onThemeChange('system')}
              className={`p-1.5 rounded transition-all ${
                themeMode === 'system'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-medium'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
              title="System Theme"
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
            <button
              id="theme-light"
              onClick={() => onThemeChange('light')}
              className={`p-1.5 rounded transition-all ${
                themeMode === 'light'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-medium'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              id="theme-dark"
              onClick={() => onThemeChange('dark')}
              className={`p-1.5 rounded transition-all ${
                themeMode === 'dark'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-medium'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
              title="Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

