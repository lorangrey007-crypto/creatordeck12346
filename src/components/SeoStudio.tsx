import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Copy,
  Check,
  Globe,
  Clock,
  Tag,
  MessageSquare,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { YouTubeSeoResult } from '../types';
import { generateYouTubeSeo } from '../services/youtubeSeoService';

interface SeoStudioProps {
  currentVoiceScript: string;
  shortScript: string;
  longScript: string;
  onSendToVoiceStudio?: (title: string, content: string) => void;
}

export const SeoStudio: React.FC<SeoStudioProps> = ({
  currentVoiceScript,
  shortScript,
  longScript,
}) => {
  // Source script selection: defaults to custom standalone if no longScript
  const [sourceType, setSourceType] = useState<'custom' | 'long' | 'short' | 'current-voice'>(() => {
    if (longScript.trim()) return 'long';
    if (shortScript.trim()) return 'short';
    if (currentVoiceScript.trim()) return 'current-voice';
    return 'custom';
  });
  const [customText, setCustomText] = useState('');
  const [topicFocus, setTopicFocus] = useState('');
  const [videoType, setVideoType] = useState<'shorts' | 'long-form'>('long-form');

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seoResult, setSeoResult] = useState<YouTubeSeoResult | null>(() => {
    try {
      const saved = localStorage.getItem('narrator_youtube_seo');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getActiveSourceText = (): string => {
    switch (sourceType) {
      case 'current-voice':
        return currentVoiceScript;
      case 'short':
        return shortScript;
      case 'long':
        return longScript;
      case 'custom':
        return customText;
    }
  };

  const handleGenerate = async () => {
    const textToAnalyze = getActiveSourceText().trim();
    if (!textToAnalyze && !topicFocus.trim()) {
      setError('Please select or enter script content or a topic to analyze.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateYouTubeSeo(textToAnalyze, topicFocus.trim(), videoType);
      setSeoResult(result);
      try {
        localStorage.setItem('narrator_youtube_seo', JSON.stringify(result));
      } catch {
        // ignore
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to run search grounded SEO analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const activeContentLength = getActiveSourceText().trim().length;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-62px)] overflow-hidden bg-zinc-50 dark:bg-[#0c0d12]">
      {/* Top Banner */}
      <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-emerald-200/70 dark:border-emerald-900/50 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-emerald-600 dark:bg-emerald-500 text-white">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                YouTube SEO & Metadata Engine
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-[10px] font-mono font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Live Search Grounded
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              High-CTR title variations, 3-tier algorithm description, timed chapters & ranked tags
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hidden sm:inline flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Studio Ready
          </span>
        </div>
      </div>

      {/* Main Workspace Grid: LEFT = Results Canvas, RIGHT = Control / Directive Column */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT COLUMN: Results Display Canvas (8 cols on lg) */}
        <div className="lg:col-span-8 border-r border-zinc-200 dark:border-zinc-800 p-4 lg:p-6 overflow-y-auto flex flex-col gap-6 bg-zinc-50/50 dark:bg-zinc-950/40">
          {!seoResult && !isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl my-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                No YouTube SEO Metadata Generated Yet
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mb-4">
                Select your script on the right and click <strong>"Run Live Grounded SEO Analysis"</strong>. The engine will query Google search trends to build high-CTR titles, timed chapters, descriptions, and tags.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-300 mb-3 animate-pulse">
                <Globe className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                Connecting to Google Search Grounding Index...
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                Analyzing search volumes, YouTube search suggestions, and competitive CTR patterns for your story.
              </p>
            </div>
          )}

          {seoResult && !isLoading && (
            <>
              {/* Quota fallback alert */}
              {seoResult.isQuotaFallback && (
                <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Algorithmic SEO Engine Active:</span>{" "}
                    {seoResult.quotaWarning || "Generated via the built-in algorithmic engine to bypass Gemini API rate limits."}
                  </div>
                </div>
              )}

              {/* Grounding Source Attribution Banner */}
              {seoResult.groundingQueries && seoResult.groundingQueries.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                  <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Google Search Grounded:</span> Analyzed active search trends for:{' '}
                    <span className="font-mono text-[11px] underline">
                      {seoResult.groundingQueries.join(', ')}
                    </span>
                  </div>
                </div>
              )}

              {/* 1. High-CTR Titles */}
              <div className="bg-white dark:bg-[#0f1117] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      1. High-CTR Grounded Title Variations
                    </h3>
                  </div>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Grounded in trending YouTube queries
                  </span>
                </div>

                <div className="space-y-2">
                  {seoResult.titles.map((titleItem, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-start justify-between gap-3 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                            {titleItem.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 ml-7">
                          {titleItem.angle}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(titleItem.title, `title-${idx}`)}
                        className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                      >
                        {copiedKey === `title-${idx}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Structured Description */}
              <div className="bg-white dark:bg-[#0f1117] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      2. Algorithm-Optimized 3-Tier Description
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `${seoResult.description.hook}\n\n${seoResult.description.summary}\n\n${seoResult.description.callToAction}\n\n${seoResult.hashtags.join(' ')}`,
                        'full-desc'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copiedKey === 'full-desc' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied Full Description</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Full Description</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Above the fold Hook */}
                  <div className="p-3 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block mb-1">
                      Above The Fold Hook (First 2 Lines - High CTR Impact)
                    </span>
                    <p className="text-zinc-900 dark:text-zinc-100 leading-relaxed font-medium">
                      {seoResult.description.hook}
                    </p>
                  </div>

                  {/* Body & Context */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                      Body & Keyword-Rich Context
                    </span>
                    <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
                      {seoResult.description.summary}
                    </p>
                  </div>

                  {/* Call to action & Engagement */}
                  <div className="p-3 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                    <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider block mb-1">
                      Viewer Retention & Discussion Prompt
                    </span>
                    <p className="text-zinc-900 dark:text-zinc-100 leading-relaxed">
                      {seoResult.description.callToAction}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Timed Chapters / Timestamps */}
              <div className="bg-white dark:bg-[#0f1117] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      3. Timed YouTube Chapters & Retention Beats
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const chaptersFormatted = seoResult.chapters
                        .map((c) => `${c.timestamp} - ${c.title}`)
                        .join('\n');
                      handleCopy(chaptersFormatted, 'all-chapters');
                    }}
                    className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copiedKey === 'all-chapters' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied Timestamps</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Timestamps</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono text-xs">
                  {seoResult.chapters.map((ch, idx) => (
                    <div
                      key={idx}
                      className="py-2 px-2 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/40 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                          {ch.timestamp}
                        </span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-sans font-medium">
                          {ch.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-sans">
                        Chapter {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Ranked Tags & Viral Hashtags */}
              <div className="bg-white dark:bg-[#0f1117] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      4. High-Search Volume Tags & Hashtags
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(seoResult.tags.join(', '), 'comma-tags')}
                      className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copiedKey === 'comma-tags' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied Tags</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Comma Tags (Upload Box)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Hashtags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {seoResult.hashtags.map((ht, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold font-mono"
                    >
                      {ht}
                    </span>
                  ))}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {seoResult.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Source Control, Video Format & Analysis Trigger (4 cols on lg) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0c0d12] p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Source Selector */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              Select Script Source
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setSourceType('long')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${
                  sourceType === 'long'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80'
                }`}
              >
                Long-Form Only
                {longScript.trim() && <span className="ml-1 text-[10px] text-emerald-500">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => setSourceType('short')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${
                  sourceType === 'short'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80'
                }`}
              >
                Shorts Only
                {shortScript.trim() && <span className="ml-1 text-[10px] text-emerald-500">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => setSourceType('current-voice')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${
                  sourceType === 'current-voice'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80'
                }`}
              >
                Voice Studio Script
                {currentVoiceScript.trim() && <span className="ml-1 text-[10px] text-emerald-500">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => setSourceType('custom')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${
                  sourceType === 'custom'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80'
                }`}
              >
                Custom / Raw Topic
              </button>
            </div>
          </div>

          {/* Video Format */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              Target Video Format
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVideoType('long-form')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  videoType === 'long-form'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                Long-Form (Chapters & Mid-Rolls)
              </button>
              <button
                type="button"
                onClick={() => setVideoType('shorts')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  videoType === 'shorts'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                Shorts (Viral Hashtags)
              </button>
            </div>
          </div>

          {/* Specific Topic / Angle Focus */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              Topic Keyword or Case Name (Optional)
            </label>
            <input
              type="text"
              value={topicFocus}
              onChange={(e) => setTopicFocus(e.target.value)}
              placeholder="e.g. Dyatlov Pass, Missing 411, Lake Michigan anomaly..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {/* Quick Topic Keyword Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="text-[10px] text-zinc-400 font-medium mr-0.5">Presets:</span>
              {["Mystery Investigation", "Deep Sea Anomaly", "Unexplained Disappearance", "Classified Discovery"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTopicFocus((prev) => (prev.trim() ? `${prev.trim()} — ${p}` : p))}
                  title={`Insert "${p}" into topic keyword`}
                  className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-emerald-50 dark:bg-zinc-800 dark:hover:bg-emerald-950/50 text-zinc-600 hover:text-emerald-700 dark:text-zinc-300 dark:hover:text-emerald-300 text-[10px] border border-zinc-200/60 dark:border-zinc-700/60 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">+</span>
                  <span>{p}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
              Google Search Grounding will specifically pull real-time search trends for this entity.
            </p>
          </div>

          {/* Script Content Preview or Custom Input */}
          <div className="flex-1 flex flex-col min-h-[140px]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {sourceType === 'custom' ? 'Custom Script / Notes' : 'Selected Script Content'}
              </label>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                {activeContentLength} characters
              </span>
            </div>

            {sourceType === 'custom' ? (
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Paste story text, plot outline, or news article here to generate grounded SEO..."
                className="w-full flex-1 p-3 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            ) : (
              <div className="w-full flex-1 p-3 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                {getActiveSourceText().trim() ? (
                  getActiveSourceText()
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-3 text-zinc-400 dark:text-zinc-500 italic text-xs font-sans">
                    <span>No text in {sourceType === 'long' ? 'Long-Form Only' : sourceType === 'short' ? 'Shorts Only' : 'Voice Studio'} yet.</span>
                    <span className="text-[11px] mt-1 text-zinc-500 dark:text-zinc-400">Write or generate one in Script Studio, or choose 'Custom / Raw Topic'.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            id="btn-run-seo-grounding"
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || (!activeContentLength && !topicFocus.trim())}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
              isLoading || (!activeContentLength && !topicFocus.trim())
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Searching Google Index & Optimizing...</span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                <span>Run Live Grounded SEO Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
