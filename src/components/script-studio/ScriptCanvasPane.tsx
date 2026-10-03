import React, { useState } from 'react';
import {
  Zap,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  Bot,
  Scissors,
  CheckCircle2,
  Copy,
  Sparkle,
  Gauge,
} from 'lucide-react';

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const QUICK_TAGS = [
  { label: '[pause]', tag: '[pause] ', desc: 'Short natural pause (0.5s)' },
  { label: '[long pause]', tag: '[long pause] ', desc: 'Dramatic tension pause (1.2s)' },
  { label: '[whispers]', tag: '[whispers] ', desc: 'Intimate, chilling, conspiratorial tone' },
  { label: '[dark]', tag: '[dark] ', desc: 'Sinister, brooding, cold true-crime tone' },
  { label: '[excited]', tag: '[excited] ', desc: 'High energy, punchy viral hook' },
  { label: '[hesitates]', tag: '[hesitates] ', desc: 'Uncertain, building emotional mystery' },
  { label: '[sighs]', tag: '[sighs] ', desc: 'Melancholic, authentic human breath' },
];

interface ScriptCanvasPaneProps {
  activeCanvasTab: 'short' | 'long';
  setActiveCanvasTab: (tab: 'short' | 'long') => void;
  shortScript: string;
  setShortScript: (s: string) => void;
  longScript: string;
  setLongScript: (s: string) => void;
  activeStats: { wordCount: number; estimatedSeconds: number };
  midRollAdCount: number;
  insertTag: (tag: string) => void;
  handleTransferActive: () => void;
  handleTransferLongForm: () => void;
  handleTransferBoth: () => void;
  onCoworkerDirective?: (directive: string) => void;
}

export const ScriptCanvasPane: React.FC<ScriptCanvasPaneProps> = ({
  activeCanvasTab,
  setActiveCanvasTab,
  shortScript,
  setShortScript,
  longScript,
  setLongScript,
  activeStats,
  midRollAdCount,
  insertTag,
  handleTransferActive,
  handleTransferLongForm,
  handleTransferBoth,
  onCoworkerDirective,
}) => {
  const [copied, setCopied] = useState(false);
  const [editorNotice, setEditorNotice] = useState<string | null>(null);

  const currentText = activeCanvasTab === 'short' ? shortScript : longScript;
  const setCurrentText = (text: string) => {
    if (activeCanvasTab === 'short') {
      setShortScript(text);
    } else {
      setLongScript(text);
    }
  };

  const handleCopyCurrent = () => {
    if (!currentText) return;
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick helper: strip bracketed tags for clean voiceover preview or export
  const handleStripTags = () => {
    if (!currentText) return;
    const cleaned = currentText.replace(/\[[\w\s-]+\]/g, '').replace(/\s{2,}/g, ' ').trim();
    setCurrentText(cleaned);
    setEditorNotice('Cleaned all bracketed delivery tags.');
    setTimeout(() => setEditorNotice(null), 3000);
  };

  // Clean empty double line breaks
  const handleTidyParagraphs = () => {
    if (!currentText) return;
    const tidied = currentText
      .split('\n')
      .map((l) => l.trim())
      .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
      .join('\n\n');
    setCurrentText(tidied);
    setEditorNotice('Normalized paragraph spacing.');
    setTimeout(() => setEditorNotice(null), 3000);
  };

  // Quick coworker directive triggers
  const triggerCoworker = (directive: string) => {
    if (onCoworkerDirective) {
      onCoworkerDirective(directive);
    }
  };

  // Script pace rating calculation
  const getPacingScore = () => {
    if (activeStats.wordCount === 0) return null;
    if (activeCanvasTab === 'short') {
      if (activeStats.estimatedSeconds <= 60) {
        return { label: 'Optimal Shorts Length (<= 60s)', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' };
      }
      return { label: `Over 60s Shorts Limit (${formatDuration(activeStats.estimatedSeconds)})`, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' };
    } else {
      if (activeStats.estimatedSeconds >= 480) {
        return { label: 'Eligible for Mid-Roll Ads (8+ min)', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' };
      }
      return { label: `Pacing: ${formatDuration(activeStats.estimatedSeconds)} (Aim for 8:00+ for mid-rolls)`, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' };
    }
  };

  const pacing = getPacingScore();

  return (
    <div className="lg:col-span-7 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full bg-white dark:bg-[#0c0d12] overflow-hidden">
      {/* Canvas Sub-Tabs & Duration Indicator */}
      <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Script Tab Selector */}
        <div className="flex items-center gap-1 bg-zinc-200/80 dark:bg-zinc-800 p-0.5 rounded-lg">
          <button
            id="tab-canvas-short"
            onClick={() => setActiveCanvasTab('short')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeCanvasTab === 'short'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Shorts Only</span>
            {shortScript && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
          </button>

          <button
            id="tab-canvas-long"
            onClick={() => setActiveCanvasTab('long')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeCanvasTab === 'long'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Long-Form Only</span>
            {longScript && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
          </button>
        </div>

        {/* Live Metrics Counter */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
              {formatDuration(activeStats.estimatedSeconds)}
            </span>
            <span className="text-[10px] text-zinc-400">est. audio</span>
          </div>

          <div className="h-3 w-px bg-zinc-300 dark:bg-zinc-700" />

          <div className="text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
              {activeStats.wordCount}
            </span>{' '}
            <span className="text-[10px] text-zinc-400">words</span>
          </div>

          {activeCanvasTab === 'long' && (
            <>
              <div className="h-3 w-px bg-zinc-300 dark:bg-zinc-700" />
              <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/70 dark:border-amber-900">
                {midRollAdCount} Mid-Roll Ad Anchors
              </div>
            </>
          )}

          {pacing && (
            <div className={`hidden sm:flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${pacing.color}`}>
              <Gauge className="w-3 h-3" />
              <span>{pacing.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Co-Worker Directives & Formatting Toolbar */}
      <div className="px-4 py-2 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 shrink-0 mr-1">
            <Bot className="w-3 h-3" /> Co-Worker:
          </span>
          <button
            onClick={() => triggerCoworker('Punch up the opening hook to create intense curiosity and start in media res.')}
            className="px-2 py-1 rounded text-[11px] font-medium bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 border border-zinc-200 dark:border-zinc-700 transition-colors shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1"
            title="Ask AI Co-Worker to punch up hook"
          >
            <Zap className="w-2.5 h-2.5 text-amber-500" />
            <span>Punch Up Hook</span>
          </button>
          <button
            onClick={() => triggerCoworker('Insert natural suspense whisper and dramatic pause tags at key emotional beats.')}
            className="px-2 py-1 rounded text-[11px] font-medium bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 border border-zinc-200 dark:border-zinc-700 transition-colors shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1"
            title="Inject whisper and pause delivery tags"
          >
            <Sparkle className="w-2.5 h-2.5 text-purple-500" />
            <span>Inject Tags</span>
          </button>
          <button
            onClick={() => triggerCoworker('Flesh out the story details, character motives, and suspense build-up to pad the length.')}
            className="px-2 py-1 rounded text-[11px] font-medium bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 border border-zinc-200 dark:border-zinc-700 transition-colors shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1"
            title="Expand narrative length"
          >
            <Clock className="w-2.5 h-2.5 text-emerald-500" />
            <span>Expand Story</span>
          </button>
          <button
            onClick={() => triggerCoworker('Cut fluff, eliminate repetitive sentences, and tighten conversational rhythm.')}
            className="px-2 py-1 rounded text-[11px] font-medium bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 border border-zinc-200 dark:border-zinc-700 transition-colors shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1"
            title="Tighten narrative pacing"
          >
            <Scissors className="w-2.5 h-2.5 text-rose-500" />
            <span>Tighten Pacing</span>
          </button>
        </div>

        {/* Canvas Editing Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleTidyParagraphs}
            disabled={!currentText}
            className="px-2 py-1 rounded text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors cursor-pointer"
            title="Format clean paragraphs"
          >
            Format Spacing
          </button>
          <button
            onClick={handleStripTags}
            disabled={!currentText}
            className="px-2 py-1 rounded text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors cursor-pointer"
            title="Remove all bracketed delivery tags"
          >
            Strip Tags
          </button>
          <button
            onClick={handleCopyCurrent}
            disabled={!currentText}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-40"
            title="Copy current active script"
          >
            {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Quick Tag Insertion Bar */}
      <div className="px-4 py-1.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/60 dark:bg-zinc-900/40 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-thin">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 px-1">
          Insert Tag:
        </span>
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag.label}
            onClick={() => insertTag(tag.tag)}
            className="px-2 py-0.5 rounded text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 border border-zinc-200 dark:border-zinc-700 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            title={tag.desc}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Script Editor Canvas Textarea */}
      <div className="flex-1 p-4 relative overflow-hidden flex flex-col">
        {editorNotice && (
          <div className="absolute top-6 right-6 z-10 bg-zinc-900/90 text-white text-xs px-3 py-1.5 rounded-lg shadow-md border border-zinc-700 animate-fade-in">
            {editorNotice}
          </div>
        )}

        <textarea
          id="textarea-script-canvas"
          value={activeCanvasTab === 'short' ? shortScript : longScript}
          onChange={(e) => {
            if (activeCanvasTab === 'short') {
              setShortScript(e.target.value);
            } else {
              setLongScript(e.target.value);
            }
          }}
          placeholder={
            activeCanvasTab === 'short'
              ? "Shorts script will appear here...\nOr write/paste your own script tailored for Shorts (e.g., 15s, 30s, 60s)."
              : "Long-form script will appear here...\nFlexible duration (e.g., 2–3 min, 5 min, 8–10 min) with storytelling twists and pacing."
          }
          className="w-full h-full p-4 font-mono text-xs leading-relaxed bg-zinc-50/50 dark:bg-zinc-950/40 rounded-xl border border-zinc-200/80 dark:border-zinc-800 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400/80"
          spellCheck={false}
        />

        {/* Empty state hint */}
        {!shortScript && !longScript && (
          <div className="absolute inset-0 m-4 flex flex-col items-center justify-center pointer-events-none text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              Script Results Canvas
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
              Use the Creative Director on the right to brainstorm or generate your Shorts Only or Long-Form Only script. Revisions update here in real time.
            </p>
          </div>
        )}
      </div>

      {/* Canvas Footer & Explicit Transfer Gate */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Ready to record? Transfer creates editable tracks in Voice Studio.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-transfer-active-script"
            onClick={handleTransferActive}
            disabled={!(activeCanvasTab === 'short' ? shortScript.trim() : longScript.trim())}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              (activeCanvasTab === 'short' ? shortScript.trim() : longScript.trim())
                ? 'bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white shadow-2xs cursor-pointer'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
            }`}
            title="Send current active script to Voice Studio"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Send Active ({activeCanvasTab === 'short' ? 'Shorts' : 'Long-Form'}) to Voice Studio</span>
          </button>

          <button
            id="btn-transfer-long-script"
            onClick={handleTransferLongForm}
            disabled={!longScript.trim()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              longScript.trim()
                ? 'bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white shadow-2xs cursor-pointer'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
            }`}
            title="Send long-form script to the Voice Studio"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Send Long-Form to Voice Studio</span>
          </button>

          <button
            id="btn-transfer-both-scripts"
            onClick={handleTransferBoth}
            disabled={!shortScript.trim() && !longScript.trim()}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              shortScript.trim() || longScript.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
            }`}
            title="Send both the Shorts and Long-Form scripts as two separate project tabs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Send Both (2 New Tabs)</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
