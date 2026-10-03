import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Wand2,
  Download,
  Trash2,
  Sparkles,
  AlertCircle,
  Loader2,
  ExternalLink,
  Layers,
  Palette,
  Type,
  Maximize2,
  ArrowRight
} from 'lucide-react';
import { ThumbnailConceptItem, GeneratedThumbnail } from '../types';
import { generateThumbnailImage } from '../services/videoAndImageService';
import { getStoredGeminiApiKey } from '../services/geminiKeyService';

interface ImagenStudioModuleProps {
  thumbnailConcepts?: ThumbnailConceptItem[];
  thumbnails?: GeneratedThumbnail[];
  onAddThumbnail?: (thumb: GeneratedThumbnail) => void;
  onDeleteThumbnail?: (id: string) => void;
  onOpenSettingsModal?: () => void;
  onSwitchToBRollStudio?: () => void;
}

export const ImagenStudioModule: React.FC<ImagenStudioModuleProps> = ({
  thumbnailConcepts = [],
  thumbnails = [],
  onAddThumbnail,
  onDeleteThumbnail,
  onOpenSettingsModal,
  onSwitchToBRollStudio,
}) => {
  const safeThumbnailConcepts = Array.isArray(thumbnailConcepts) ? thumbnailConcepts : [];

  // Internal state for thumbnails loaded from localStorage
  const [internalThumbnails, setInternalThumbnails] = useState<GeneratedThumbnail[]>(() => {
    try {
      const saved = localStorage.getItem('narrator_veo_thumbnails');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const activeThumbnails = Array.isArray(thumbnails) && thumbnails.length > 0
    ? thumbnails
    : (Array.isArray(internalThumbnails) ? internalThumbnails : []);

  // Persist internal thumbnails
  useEffect(() => {
    try {
      localStorage.setItem('narrator_veo_thumbnails', JSON.stringify(internalThumbnails));
    } catch {
      // ignore
    }
  }, [internalThumbnails]);

  // Generation Dock Form State
  const [promptInput, setPromptInput] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1' | '9:16'>('16:9');
  const [textOverlay, setTextOverlay] = useState<string>('');
  const [conceptTitle, setConceptTitle] = useState<string>('');
  const [selectedConceptIndex, setSelectedConceptIndex] = useState<number | null>(null);

  // Status & Error
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inspecting enlarged image modal
  const [previewThumbnail, setPreviewThumbnail] = useState<GeneratedThumbnail | null>(null);

  // Auto-populate if concepts exist and promptInput is empty
  useEffect(() => {
    if (!promptInput && safeThumbnailConcepts.length > 0 && selectedConceptIndex === null) {
      const first = safeThumbnailConcepts[0];
      setSelectedConceptIndex(0);
      setPromptInput(first.aiImagePrompt || first.visualComposition);
      setTextOverlay(first.textOverlay || '');
      setConceptTitle(first.conceptTitle || 'Concept #1');
    }
  }, [safeThumbnailConcepts]);

  const handleSelectConcept = (concept: ThumbnailConceptItem, index: number) => {
    setSelectedConceptIndex(index);
    setPromptInput(concept.aiImagePrompt || concept.visualComposition);
    setTextOverlay(concept.textOverlay || '');
    setConceptTitle(concept.conceptTitle || `Concept #${index + 1}`);
    setAspectRatio('16:9'); // YouTube thumbnails standard
  };

  const handleStartGeneration = async () => {
    const trimmed = promptInput.trim();
    if (!trimmed) return;

    const key = getStoredGeminiApiKey();
    if (!key) {
      if (onOpenSettingsModal) onOpenSettingsModal();
      setErrorMessage('A Gemini API Key is required for image generation. Please configure it in Settings.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await generateThumbnailImage({
        prompt: trimmed,
        aspectRatio: aspectRatio,
        imageSize: '1K',
      });

      const newThumb: GeneratedThumbnail = {
        id: 'thumb_' + Date.now(),
        conceptTitle: conceptTitle || `Thumbnail #${activeThumbnails.length + 1}`,
        prompt: trimmed,
        aspectRatio: aspectRatio,
        imageUrl: res.imageUrl,
        textOverlay: textOverlay.trim() || undefined,
        createdAt: Date.now(),
      };

      setInternalThumbnails((prev) => [newThumb, ...prev]);
      if (onAddThumbnail) {
        onAddThumbnail(newThumb);
      }
    } catch (err: any) {
      console.error('Image generation error:', err);
      setErrorMessage(
        err?.message ||
          'Failed to generate visual thumbnail. If using standard key, ensure Gemini Imagen / image generation is active.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    setInternalThumbnails((prev) => prev.filter((t) => t.id !== id));
    if (onDeleteThumbnail) {
      onDeleteThumbnail(id);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Top Banner / Breadcrumb */}
      <div className="rounded-2xl border border-pink-200 dark:border-pink-900/60 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Imagen Thumbnail Studio
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                Google Imagen 3
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              High-CTR visual cover generation powered by Google Imagen & Thumbnail Art Director concepts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono font-medium text-zinc-700 dark:text-zinc-300 text-xs">
            Rendered Thumbnails: <strong className="text-pink-600 dark:text-pink-400">{activeThumbnails.length}</strong>
          </span>
          <button
            type="button"
            onClick={onSwitchToBRollStudio}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 font-sans text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Art Director</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Grid: Gallery on Left (7 cols) & Generation Dock on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: RENDERED THUMBNAILS GALLERY */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#12131a] p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-pink-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Rendered Visual Gallery
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {activeThumbnails.length} {activeThumbnails.length === 1 ? 'Graphic' : 'Graphics'}
              </span>
            </div>

            {activeThumbnails.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-500 flex items-center justify-center">
                  <Wand2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    No Thumbnails Rendered Yet
                  </h4>
                  <p className="text-xs text-zinc-500 max-w-sm">
                    Select a concept from the <strong>Thumbnail Art Director</strong> on the right or enter a custom prompt to synthesize 16:9 covers with Google Imagen.
                  </p>
                </div>
                {safeThumbnailConcepts.length === 0 && onSwitchToBRollStudio && (
                  <button
                    type="button"
                    onClick={onSwitchToBRollStudio}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-pink-600 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-pink-700 transition-colors cursor-pointer"
                  >
                    <span>Generate Thumbnail Concepts in B-Roll Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeThumbnails.map((thumb) => (
                  <div
                    key={thumb.id}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 overflow-hidden flex flex-col shadow-xs group"
                  >
                    {/* Visual Media Viewport */}
                    <div
                      className={`relative w-full bg-black flex items-center justify-center overflow-hidden cursor-pointer ${
                        thumb.aspectRatio === '9:16'
                          ? 'aspect-[9/16]'
                          : thumb.aspectRatio === '1:1'
                          ? 'aspect-square'
                          : 'aspect-video'
                      }`}
                      onClick={() => setPreviewThumbnail(thumb)}
                    >
                      <img
                        src={thumb.imageUrl}
                        alt={thumb.conceptTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />

                      {/* Simulated Viral Text Overlay Badge */}
                      {thumb.textOverlay && (
                        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/85 text-white font-extrabold text-xs tracking-wider uppercase shadow-xl border border-white/25 pointer-events-none">
                          {thumb.textOverlay}
                        </div>
                      )}

                      {/* Hover action overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewThumbnail(thumb);
                          }}
                          className="p-2 rounded-lg bg-white/90 text-zinc-900 hover:bg-white text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
                          title="View enlarged"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <a
                          href={thumb.imageUrl}
                          download={`${thumb.conceptTitle.replace(/\s+/g, '-').toLowerCase() || 'thumbnail'}.png`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
                          title="Download PNG"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PNG</span>
                        </a>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px] truncate max-w-[180px]">
                          {thumb.conceptTitle}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-[10px]">
                            {thumb.aspectRatio}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDelete(thumb.id)}
                            className="p-1 text-zinc-400 hover:text-red-500 cursor-pointer transition-colors"
                            title="Delete thumbnail"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed font-mono">
                        {thumb.prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: IMAGEN GENERATOR DOCK & THUMBNAIL ART DIRECTOR CONCEPTS */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Generation Dock */}
          <div className="rounded-2xl border border-pink-200/80 dark:border-pink-900/40 bg-white dark:bg-[#12131a] p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Imagen Generator Dock
                </h3>
              </div>
              <span className="text-[11px] font-mono text-pink-600 dark:text-pink-400 font-semibold bg-pink-50 dark:bg-pink-950/60 px-2 py-0.5 rounded border border-pink-200 dark:border-pink-800">
                1K High-Res
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold mb-0.5">Generation Notice</p>
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Concept Title */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Concept Title
              </label>
              <input
                type="text"
                value={conceptTitle}
                onChange={(e) => setConceptTitle(e.target.value)}
                placeholder="e.g., The Ultimate Breakdown"
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Image Prompt Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>AI Visual Image Prompt (Midjourney / Imagen syntax)</span>
                <span className="text-[10px] font-normal text-zinc-500">
                  {promptInput.length} chars
                </span>
              </label>
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="High contrast YouTube thumbnail, expressive close-up face looking in awe, dramatic cinematic neon rim lighting, bold vivid colors, photorealistic 8k, sharp focus --ar 16:9"
                rows={5}
                className="w-full text-xs font-mono p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500 leading-relaxed"
              />
            </div>

            {/* Viral Text Overlay (Simulated on Thumbnail) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-zinc-500" />
                <span>Text Overlay Badge (YouTube Graphic)</span>
              </label>
              <input
                type="text"
                value={textOverlay}
                onChange={(e) => setTextOverlay(e.target.value)}
                placeholder="e.g., DON'T DO THIS!, 10X SECRET, BUSTED"
                className="w-full text-xs font-bold uppercase tracking-wider p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`py-1 text-center font-mono font-semibold rounded cursor-pointer ${
                    aspectRatio === '16:9'
                      ? 'bg-white dark:bg-zinc-800 text-pink-600 dark:text-pink-400 shadow-2xs'
                      : 'text-zinc-500'
                  }`}
                >
                  16:9 (YouTube)
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('1:1')}
                  className={`py-1 text-center font-mono font-semibold rounded cursor-pointer ${
                    aspectRatio === '1:1'
                      ? 'bg-white dark:bg-zinc-800 text-pink-600 dark:text-pink-400 shadow-2xs'
                      : 'text-zinc-500'
                  }`}
                >
                  1:1 (Square)
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`py-1 text-center font-mono font-semibold rounded cursor-pointer ${
                    aspectRatio === '9:16'
                      ? 'bg-white dark:bg-zinc-800 text-pink-600 dark:text-pink-400 shadow-2xs'
                      : 'text-zinc-500'
                  }`}
                >
                  9:16 (Shorts)
                </button>
              </div>
            </div>

            {/* Generate Image Button */}
            <button
              type="button"
              onClick={handleStartGeneration}
              disabled={isGenerating || !promptInput.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Visual Image with Imagen...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Visual Thumbnail (1K PNG)</span>
                </>
              )}
            </button>
          </div>

          {/* INJECT CONCEPTS FROM THUMBNAIL ART DIRECTOR */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#12131a] p-4 flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-pink-500" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Concepts from Thumbnail Art Director ({safeThumbnailConcepts.length})
                </h4>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">One-click populate</span>
            </div>

            {safeThumbnailConcepts.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 text-center flex flex-col items-center gap-2">
                <p className="text-xs text-zinc-500">
                  No Thumbnail Art Director concepts loaded yet. Run a topic analysis in B-Roll Studio to generate viral concepts with custom color grading.
                </p>
                <button
                  type="button"
                  onClick={onSwitchToBRollStudio}
                  className="px-2.5 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Go to B-Roll & Thumbnail Studio
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
                {safeThumbnailConcepts.map((concept, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectConcept(concept, idx)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedConceptIndex === idx
                        ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 shadow-2xs'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-pink-300 dark:hover:border-pink-800 bg-zinc-50 dark:bg-zinc-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-pink-600 dark:text-pink-400 text-xs">
                        {concept.conceptTitle}
                      </span>
                      {concept.textOverlay && (
                        <span className="px-2 py-0.5 rounded bg-black text-white text-[10px] font-extrabold uppercase tracking-wider">
                          "{concept.textOverlay}"
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed mb-1.5">
                      {concept.visualComposition}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                      <span className="truncate">🎨 {concept.colorGrading}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enlarged Modal Preview */}
      {previewThumbnail && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewThumbnail(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
              <span className="font-bold text-white text-sm">{previewThumbnail.conceptTitle}</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewThumbnail.imageUrl}
                  download={`${previewThumbnail.conceptTitle || 'thumbnail'}.png`}
                  className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full 1K PNG</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewThumbnail(null)}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              <img
                src={previewThumbnail.imageUrl}
                alt={previewThumbnail.conceptTitle}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              {previewThumbnail.textOverlay && (
                <div className="absolute bottom-6 right-6 px-4 py-2 rounded-xl bg-black/85 text-white font-black text-lg tracking-wider uppercase shadow-2xl border border-white/20">
                  {previewThumbnail.textOverlay}
                </div>
              )}
            </div>

            <div className="p-4 bg-zinc-950 text-xs font-mono text-zinc-400 border-t border-zinc-800">
              <span className="text-zinc-500 uppercase tracking-wider block mb-1">Prompt:</span>
              <p className="text-zinc-200 select-all leading-relaxed">{previewThumbnail.prompt}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
