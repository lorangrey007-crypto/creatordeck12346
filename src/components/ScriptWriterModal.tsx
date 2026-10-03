import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  PenTool, 
  Clock, 
  FileText, 
  Copy, 
  Check, 
  PlusCircle, 
  Replace, 
  FilePlus2, 
  Flame, 
  HelpCircle,
  AlertCircle,
  RefreshCw,
  Send
} from 'lucide-react';
import { generateAiScript, ScriptGenerationParams } from '../services/scriptGeneratorService';

interface ScriptWriterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplaceScript: (script: string) => void;
  onAppendScript: (script: string) => void;
  onCreateNewTabWithScript: (title: string, script: string) => void;
  activeTabTitle: string;
}

const TOPIC_PRESETS = [
  { label: 'Submarine Distress Log', prompt: 'A radio operator inside a deep ocean research submarine hearing rhythmic tapping from the hull at midnight' },
  { label: 'Why Sleep Advice Fails', prompt: 'A conversational breakdown of why 8 hours of sleep might actually be making you tired, backed by circadian rhythms' },
  { label: 'Abandoned Mountain Cabin', prompt: 'A hiker finding an immaculate log cabin deep in the Canadian wilderness with dinner still steaming on the table' },
  { label: 'The 10-Second Secret', prompt: 'A snappy high-retention hook about the tiny psychological habit that stops procrastination instantly' },
  { label: 'Space Probe Signal', prompt: 'NASA engineers decoding an unexpected repeating radio pulse from Voyager 1 that matches human Morse code' },
];

export const ScriptWriterModal: React.FC<ScriptWriterModalProps> = ({
  isOpen,
  onClose,
  onReplaceScript,
  onAppendScript,
  onCreateNewTabWithScript,
  activeTabTitle,
}) => {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<ScriptGenerationParams['tone']>('conversational');
  const [durationTarget, setDurationTarget] = useState<'short' | 'medium' | 'long'>('medium');
  const [includeTags, setIncludeTags] = useState(true);
  const [humanImperfections, setHumanImperfections] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [estimatedSeconds, setEstimatedSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const result = await generateAiScript({
        topic: topic.trim(),
        tone,
        durationTarget,
        includeTags,
        humanImperfections,
      });

      setGeneratedScript(result.script);
      setWordCount(result.wordCount);
      setEstimatedSeconds(result.estimatedSeconds);
    } catch (err: any) {
      console.error('Script generation error:', err);
      setErrorMsg(err.message || 'Failed to generate script. Please verify your connection or Gemini API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedScript) return;
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyReplace = () => {
    if (!generatedScript) return;
    onReplaceScript(generatedScript);
    onClose();
  };

  const handleApplyAppend = () => {
    if (!generatedScript) return;
    onAppendScript(generatedScript);
    onClose();
  };

  const handleApplyNewTab = () => {
    if (!generatedScript) return;
    const cleanTitle = topic.slice(0, 24).trim() || 'New AI Script';
    onCreateNewTabWithScript(cleanTitle, generatedScript);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="modal-script-writer"
        className="w-full max-w-2xl bg-white dark:bg-[#111317] border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span>Human Script Writer</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium">
                  Google TTS Standard
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Crafts authentic human voiceover scripts with natural pauses & delivery tags for review
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

        {/* Modal Body - Scrollable */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Topic / Idea Input */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
              <span>What is your story, concept, or video topic?</span>
              <span className="text-[11px] text-zinc-400 font-normal">e.g. mystery, explainer, or hook</span>
            </label>
            <div className="relative">
              <textarea
                id="input-script-topic"
                rows={2}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. A true crime case of a luxury hotel room that vanished from the registry in 1974..."
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 outline-hidden focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none leading-relaxed"
              />
            </div>

            {/* Quick Inspiration Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-zinc-400 font-medium mr-1">Inspirations:</span>
              {TOPIC_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setTopic((prev) => (prev.trim() ? `${prev.trim()} — ${p.prompt}` : p.prompt))}
                  title={`Insert "${p.prompt}" into topic`}
                  className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[11px] border border-zinc-200/60 dark:border-zinc-700/60 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="text-blue-500 font-bold text-xs">+</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone Archetype Selection */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-800 dark:text-zinc-200">
              Narrative Tone & Cadence
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'conversational', label: 'Conversational Story', desc: 'Warm, relatable, spoken friend-to-friend' },
                { id: 'mystery', label: 'Dark Mystery & Horror', desc: 'Suspenseful, eerie with dramatic whispered beats' },
                { id: 'hook', label: 'Snappy Viral Hook', desc: 'High-retention pace for YouTube Shorts & Reels' },
                { id: 'documentary', label: 'Documentary & Lore', desc: 'Thoughtful, historical, cinematic pauses' },
                { id: 'dramatic', label: 'Dramatic Monologue', desc: 'Emotional, personal, intense revelations' },
                { id: 'explainer', label: 'Clear Educational', desc: 'Intuitive analogies with natural explanations' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    tone === t.id
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-950 dark:text-blue-100 shadow-2xs'
                      : 'bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="font-medium text-xs">{t.label}</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration & Tag Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Length */}
            <div className="space-y-1.5">
              <label className="font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                Target Length
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'short', label: 'Short (~30s)', sub: '~85 words' },
                  { id: 'medium', label: 'Standard (~1m)', sub: '~180 words' },
                  { id: 'long', label: 'Long (~2m+)', sub: '~350 words' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDurationTarget(d.id as any)}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                      durationTarget === d.id
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent font-medium shadow-2xs'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="text-[11px] font-medium leading-tight">{d.label}</div>
                    <div className="text-[9px] opacity-75">{d.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Human & Google Voice Tag Toggles */}
            <div className="space-y-2">
              <label className="font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Google TTS Human Realism
              </label>
              <div className="space-y-1.5 bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80">
                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={includeTags}
                    onChange={(e) => setIncludeTags(e.target.checked)}
                    className="rounded accent-blue-600"
                  />
                  <span>Embed Google Voice tags (<code className="text-[10px]">[pause]</code>, <code className="text-[10px]">[whispers]</code>, <code className="text-[10px]">[dark]</code>)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={humanImperfections}
                    onChange={(e) => setHumanImperfections(e.target.checked)}
                    className="rounded accent-blue-600"
                  />
                  <span>Human conversational cadences & breath pauses</span>
                </label>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div>
            <button
              id="btn-generate-ai-script"
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Drafting Human Script with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Voiceover Script (No Voice Triggered)</span>
                </>
              )}
            </button>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Result Review & Human Editing Stage */}
          {generatedScript && (
            <div className="space-y-2.5 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    Generated Script Draft
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    {wordCount} words • ~{Math.floor(estimatedSeconds / 60)}m {estimatedSeconds % 60}s
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Safety notice verifying no auto-voice generation */}
              <div className="px-3 py-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <span>
                  <strong>Review Mode:</strong> Voiceover has <em>not</em> been generated. You can freely edit text or phrasing mistakes below before loading into the studio.
                </span>
              </div>

              {/* Editable Script Textarea */}
              <textarea
                id="textarea-generated-script-review"
                rows={6}
                value={generatedScript}
                onChange={(e) => {
                  setGeneratedScript(e.target.value);
                  const words = e.target.value.split(/\s+/).filter(Boolean).length;
                  setWordCount(words);
                  setEstimatedSeconds(Math.round(words / 2.5));
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-3 text-xs font-sans leading-relaxed text-zinc-900 dark:text-zinc-100 outline-hidden focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              />

              {/* Action Buttons to Apply Script to Project */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApplyAppend}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Append to the end of your active tab's script"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Append to Active</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyNewTab}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Create a new script tab for this script"
                >
                  <FilePlus2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Open in New Tab</span>
                </button>

                <button
                  id="btn-apply-replace-script"
                  type="button"
                  onClick={handleApplyReplace}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title={`Replace contents of "${activeTabTitle}"`}
                >
                  <Replace className="w-3.5 h-3.5" />
                  <span>Replace Active Script</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/40 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Powered by Google Gemini Language Models
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
