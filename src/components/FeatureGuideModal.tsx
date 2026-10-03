import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  PenTool, 
  AudioWaveform, 
  Clapperboard, 
  Globe, 
  Sliders, 
  FileSpreadsheet, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  HelpCircle,
  Copy,
  Check,
  Volume2,
  Tv,
  ListOrdered,
  Layers,
  ArrowRight,
  HardDrive,
  Video,
  Image as ImageIcon,
  Wand2,
  Download,
  Film,
  Play,
  Database
} from 'lucide-react';

interface FeatureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenKeySettings: () => void;
}

type GuideTab = 'overview' | 'scripts' | 'voice' | 'mastering' | 'broll' | 'timeline' | 'veovault' | 'veo' | 'imagen' | 'seo' | 'faq';

export const FeatureGuideModal: React.FC<FeatureGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenKeySettings,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('overview');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="modal-feature-guide"
        className="w-full max-w-4xl h-[90vh] max-h-[820px] bg-white dark:bg-[#101217] border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  CreatorDeck Platform Guide
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase font-mono rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  Reference & Docs
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                End-to-end documentation, voice performance syntax, audio mastering, and export workflows
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/40 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
          {[
            { id: 'overview', label: 'Suite Overview', icon: Layers },
            { id: 'scripts', label: 'Script Studio & Coworker', icon: PenTool },
            { id: 'voice', label: 'Voice & Delivery Tags', icon: AudioWaveform },
            { id: 'mastering', label: 'Audio Mastering Rack', icon: Sliders },
            { id: 'broll', label: 'B-Roll & Video Editors', icon: Clapperboard },
            { id: 'timeline', label: 'CoWorker Timeline Editor', icon: Film },
            { id: 'veovault', label: 'Veo-Vault (0-Credit DB)', icon: Database },
            { id: 'veo', label: 'Veo Video Studio (4K)', icon: Video },
            { id: 'imagen', label: 'Imagen Thumbnail Studio', icon: ImageIcon },
            { id: 'seo', label: 'YouTube SEO & Chapters', icon: Globe },
            { id: 'faq', label: 'Architecture & FAQs', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as GuideTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  The Complete YouTube Production Pipeline
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">
                  CreatorDeck eliminates context-switching across multiple disconnected web apps. Everything flows through one continuous, interconnected studio from initial idea to final upload.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                    <span>Script Studio & CoWorker</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Draft, structure, and refine long-form documentary scripts and high-retention 60-second shorts. Use the Step 3 CoWorker-Editor toolbar for rapid rewrites, hook punch-ups, and pacing adjustments.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                    <span>Voice Studio (Speech Synthesis)</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Synthesize studio-grade neural narration using Google voice models. Direct human emotion with bracketed delivery cues, sentence-level timelines, and subtitle (.SRT) exports.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">3</span>
                    <span>Audio Mastering Rack</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Real-time DSP broadcast mastering featuring parametric EQ, soft-knee dynamics compression, acoustic room reverb, and ceiling peak limiting at -0.5 dBFS.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">4</span>
                    <span>B-Roll Studio (NLE Shot Sheets)</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Break down scripts into second-by-second visual shot sheets with search keywords, camera movements, and SFX cues. Export directly into Premiere, DaVinci, or CapCut (.CSV).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">5</span>
                    <span>Veo Video Studio (Cinematic 4K)</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Generate cinematic footage clips or produce high-fidelity motion video prompt engineering pipelines with customized camera angles, lighting, FPS, and aspect ratios.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-pink-600 text-white flex items-center justify-center text-xs">6</span>
                    <span>Imagen Studio & YouTube SEO</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Render high-CTR 16:9 thumbnails with Imagen 3, live YouTube Search Grounding for viral titles, 3-tier descriptions, and click-to-copy timed chapters.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-blue-900 dark:text-blue-200">
                    Unified Inter-Module Memory
                  </span>
                  <p className="text-blue-800/80 dark:text-blue-300/80">
                    When you draft a script in Script Studio, it is instantly available across Voice Studio, B-Roll Studio, Veo Studio, Imagen Studio, and SEO Studio. You can pull from your Long-Form draft, Shorts draft, or paste any standalone external script.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
                <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Local PC Backups (Never Lose Your Project to API Quota)
                  </span>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Click <strong>"Save to PC"</strong> in the top header or footer anytime to download your complete project as a single <code>.json</code> file. If your free Gemini quota runs out or you want to switch API keys, your work is 100% preserved offline on your hard drive.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCRIPT STUDIO */}
          {activeTab === 'scripts' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  Script Studio & CoWorker-Editor
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Built specifically for YouTube pacing, retention curves, chapter monetization, and seamless script directing.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Dual-Format Workspace
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      🎬 Long-Form Script
                    </span>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Crafted for 5–15+ minute deep dives, mysteries, case studies, and documentary storytelling. Features deliberate suspense curves, chapter headers, and mid-roll transition points.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      ⚡ YouTube Shorts Script
                    </span>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Optimized for 15, 30, or 60-second vertical formats with zero wasted introductory words. Paced for 140–160 words per minute to maximize completion percentage.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3: CoWorker-Editor Directives */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Step 3: CoWorker-Editor Directives & Fast Toolbar
                </h4>
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-xs space-y-3">
                  <p>
                    The Script Canvas features an integrated <strong>CoWorker-Editor Toolbar</strong> right above the script editor, paired with the conversational <strong>Director Chat</strong> on the right:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 space-y-1">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">⚡ Punch Up Hook</span>
                      <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">Re-engineers the opening 10 seconds to create high-retention curiosity gaps.</p>
                    </div>
                    <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 space-y-1">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">🎭 Inject Voice Tags</span>
                      <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">Automatically adds inflections like <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px]">[whispers]</code> and <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px]">[dramatic pause]</code>.</p>
                    </div>
                    <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 space-y-1">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">📖 Expand Story</span>
                      <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">Enriches context, sensory details, character motivations, and historical depth.</p>
                    </div>
                    <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 space-y-1">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">⏱️ Tighten Pacing</span>
                      <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">Eliminates filler words, passive voice, and drags to maximize average view duration.</p>
                    </div>
                  </div>
                  <p className="text-zinc-500 text-[11px] pt-1">
                    Formatting helpers allow you to automatically clean excessive whitespace (<strong>Format Spacing</strong>) or strip bracketed delivery cues (<strong>Strip Tags</strong>) with a single click.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VOICE & DELIVERY TAGS */}
          {activeTab === 'voice' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  Voice Studio & Delivery Syntax
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  CreatorDeck leverages Google’s natural neural voices and translates bracketed performance cues into acoustic inflections.
                </p>
              </div>

              {/* Tag Reference Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Supported Delivery & Emotion Tags
                  </h4>
                  <span className="text-[11px] text-zinc-500">Click tag to copy</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { tag: '[whispers]', desc: 'Soft low-pass acoustic filtering, intimate near-mic vocal warmth.' },
                    { tag: '[dramatic pause]', desc: 'Inserts 850ms suspense silence before critical reveals.' },
                    { tag: '[sighs]', desc: 'Reflective breath release for emotional or weary narration.' },
                    { tag: '[gasps]', desc: 'Sudden intake of breath for shocking or terrifying twists.' },
                    { tag: '[clears throat]', desc: 'Natural human pre-narrative pause for realism.' },
                    { tag: '[chuckles]', desc: 'Subtle conversational levity and relaxed storytelling.' },
                    { tag: '[pause:1.5s]', desc: 'Custom duration pause (e.g. 0.5s, 1.0s, 2.0s).' },
                    { tag: '[shouts]', desc: 'High intensity, commanding emphasis for climaxes.' },
                  ].map((item) => (
                    <div 
                      key={item.tag}
                      onClick={() => handleCopyTag(item.tag)}
                      className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer flex items-start justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded">
                            {item.tag}
                          </code>
                          {copiedTag === item.tag && (
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Copied
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          {item.desc}
                        </p>
                      </div>
                      <Copy className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-700 shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Format Clean & Timeline Highlights */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-xs space-y-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Key Voice Studio Capabilities:
                </span>
                <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400 ml-1">
                  <li><strong>Format Clean:</strong> One click removes markdown bold, headers, and bullet points without deleting your voice delivery tags.</li>
                  <li><strong>Sentence Re-Roll:</strong> Re-generate any single awkward sentence without burning quota or re-rendering your whole script.</li>
                  <li><strong>Synchronized Subtitles (.SRT):</strong> Generates word-accurate captions with all bracketed tags cleanly removed.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: MASTERING RACK */}
          {activeTab === 'mastering' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  Studio DSP Mastering Rack
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Every voice segment is rendered into uncompressed 24kHz linear PCM audio and passed through a broadcast mastering chain before playback.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    🎚️ Multi-Band Parametric EQ
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    High-pass filter cuts sub-80Hz mud and mic rumble. Smooth mid-band presence boost at 2.8kHz enhances speech intelligibility across laptop and phone speakers.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    🗜️ Dynamics Compressor
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Soft-knee leveling compressor pulls down loud spikes and elevates quiet vocal nuances for that tight, radio-ready podcast sound.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    🏛️ Acoustic Space & Reverb
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Choose from Dry Broadcast Booth (zero reflections), Natural Vocal Room (warm ambiance), or Cinematic Hall for dramatic narration.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    🛡️ Peak Limiter & Zero-Crossing Fades
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Ceiling brickwall limiter caps peaks at -0.5 dBFS to prevent digital clipping, with 8ms micro-crossfades between spliced sentences.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: B-ROLL & VIDEO EDITORS */}
          {activeTab === 'broll' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  B-Roll Studio & NLE Video Editor Exports
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Bridge the gap between your script and editing timeline with automated shot sheets, camera directions, and thumbnail art direction.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Exporting to Video Editors (.CSV)
                </h4>
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-xs space-y-2">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    How to use the Shot Sheet in your favorite editor:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-zinc-600 dark:text-zinc-400 ml-1">
                    <li>Click <strong>Export Shot Sheet (.CSV)</strong> inside B-Roll Studio.</li>
                    <li><strong>DaVinci Resolve:</strong> Import the CSV into your media pool or edit index to instantly view timed B-roll descriptions and stock footage keywords.</li>
                    <li><strong>Adobe Premiere Pro:</strong> Open the markers panel or import the spreadsheet to guide asset placement alongside your vocal audio track.</li>
                    <li><strong>CapCut & Final Cut:</strong> Use the second-by-second timestamps and SFX cues as an exact visual assembly map.</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Thumbnail Art Direction
                </h4>
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-xs space-y-2">
                  <p>
                    CreatorDeck generates 3 distinct high-CTR thumbnail angles designed for YouTube’s mobile home feed:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400 ml-1">
                    <li><strong>Visual Subject & Framing:</strong> High-contrast subjects placed to avoid YouTube’s bottom-right timestamp overlay.</li>
                    <li><strong>2–4 Word Text Overlay:</strong> Minimalist, curiosity-inducing punchlines that complement rather than repeat the title.</li>
                    <li><strong>Direct AI Image Prompts:</strong> Ready-to-copy prompts tailored for Midjourney v6, Flux, and Leonardo.ai.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB: VEO VIDEO STUDIO (4K) */}
          {activeTab === 'veo' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  Veo Video Studio & Cinematic 4K Dock
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Generate video assets and high-fidelity motion video prompt engineering pipelines with camera dynamics, lens focal lengths, and cinematic lighting.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    🎥 Camera Movements & Angles
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Direct shots with Slow Push-In, Drone Overhead, Low Angle Hero, Orbital 360, Whip Pan, and Dolly Zoom cues calibrated for generative motion video models.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    💡 Atmospheric Lighting Styles
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Switch between Golden Hour backlight, Cyberpunk Neon rim lighting, Moody Film Noir shadows, Diffused Daylight, and Studio Commercial Keylights.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    📐 Aspect Ratios (16:9 vs 9:16)
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Choose 16:9 widescreen for long-form YouTube documentaries or 9:16 vertical orientation for YouTube Shorts, Reels, and TikTok clips.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    🎞️ Scene Prompt Engineering
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Autogenerate prompts directly from your active Script Studio scenes with negative prompt safeguards and seamless copy-to-clipboard actions.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-xs space-y-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  How to Use Veo Studio in Production:
                </span>
                <p className="text-zinc-600 dark:text-zinc-400">
                  1. Load an active scene or draft from Script Studio. 2. Select your desired camera movement, lighting aesthetic, and frame rate. 3. Click <strong>Generate Scene Video</strong> to preview or export the generation prompt into Google VideoFX, Veo, or Runway Gen-3.
                </p>
              </div>
            </div>
          )}

          {/* TAB: IMAGEN THUMBNAIL STUDIO */}
          {activeTab === 'imagen' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  Imagen 3 Thumbnail Studio
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Create high-CTR YouTube thumbnails with photorealistic image generation, typography safe-zones, and mobile feed simulation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    🎨 Visual Styles & Aesthetics
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Choose from <strong>Photorealistic 8K</strong>, <strong>Cinematic 3D Render</strong>, <strong>Moody Documentary</strong>, <strong>Minimalist Vector</strong>, or <strong>Hyper-Vibrant YouTube Pop</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    📱 Mobile Timestamp Safe Zone
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Prompts and layout compositions keep the bottom-right corner clear of critical faces or text so YouTube's video duration badge never blocks key visual elements.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    💥 3-Word Text Punchlines
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Generate high-contrast overlay text hooks (e.g., "IT HAPPENED", "THE LIE", "NEVER AGAIN") engineered to induce curiosity without cluttering the frame.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    📥 One-Click Export & Download
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Download rendered full-resolution 16:9 PNGs ready to upload directly to YouTube Studio or import into Photoshop/Canva for final typography tweaks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SEO & CHAPTERS */}
          {activeTab === 'seo' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  Search-Grounded YouTube SEO Engine
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Harness real-time Google search indexing to craft titles, descriptions, and chapters that rank on YouTube search and suggested feeds.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    🎯 High-CTR Title Angles
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Provides 5 grounded title formulations: Curiosity Gap, Authority/Documentary, Search Intent, and Viral Question angles under 60 characters to prevent mobile truncation.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    📝 3-Tier Description Architecture
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Tier 1 hook above the "Show More" fold, Tier 2 contextual summary with natural semantic keywords, and Tier 3 viewer discussion prompt + targeted hashtags.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    ⏱️ Timed Chapters for YouTube Studio
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Generates formatted timestamps (e.g. <code className="font-mono text-[11px]">00:00 - The Discovery</code>) ready to paste into your description to trigger YouTube’s timeline scrub bar.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    🏷️ Comma-Separated Tag Array
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Mix of broad topic tags and specific long-tail keywords optimized for YouTube Studio's 500-character tag box.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TIMELINE EDITOR (STEP 3) */}
          {activeTab === 'timeline' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  CoWorker NLE Multi-Track Timeline & Monitor (Step 3)
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Full non-linear editing studio with program monitor, multi-track canvas, green screen keyer, and live AI assistant.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    <span className="p-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">🎬</span>
                    <span>Program Monitor & SMPTE Clock</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Real-time canvas compositor supporting 16:9 Landscape and 9:16 Shorts with frame-by-frame stepping (-1F / +1F) and spacebar playback.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    <span className="p-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">✂️</span>
                    <span>Multi-Track Editing & Razor Split</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Independent tracks for Video (V1), Overlays (V2), Voiceover (A1), and Music (A2). Includes Razor Blade (C), Select (V), and timeline zoom.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    <span className="p-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">🟢</span>
                    <span>Chroma Key & Motion Templates</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Green screen background removal with customizable tolerance, plus 1-click YouTube Subscribe buttons, lower-thirds, and countdown timers.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    <span className="p-1 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">📁</span>
                    <span>Export to Premiere & DaVinci (.EDL)</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Export industry-standard Edit Decision Lists (.EDL) to open your project directly in Adobe Premiere Pro or DaVinci Resolve.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: VEO-VAULT (STEP 4) */}
          {activeTab === 'veovault' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  Veo-Vault Engine & Zero-Credit Persistence (Step 4)
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Persistent local IndexedDB database ensuring you never burn API credits regenerating media you already possess.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    <span className="p-1 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">⚡</span>
                    <span>100% Zero-Credit Reuse</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Assets are stored in your browser's persistent IndexedDB storage. Reusing footage or voice takes on the timeline consumes 0 API tokens.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    <span className="p-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">🗂️</span>
                    <span>Folder & Tag Organization</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Smart folders for Opening Hooks, B-Roll, Backgrounds, SFX, and Voiceovers with search filtering and tag querying.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    <span className="p-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">💾</span>
                    <span>Local Disk Import & Backup</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Import local .mp4, .webm, or .wav files directly into the vault, or export the entire library as a JSON backup bundle.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    <span className="p-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">📊</span>
                    <span>Credit Savings Scoreboard</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Real-time tracker displaying estimated credits saved and total megabytes stored in persistent offline memory.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: ARCHITECTURE & FAQS */}
          {activeTab === 'faq' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  Architecture & Frequently Asked Questions
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Everything you need to know about API keys, data privacy, and hosting.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    q: 'Where are my scripts, audio files, and API keys stored?',
                    a: 'Everything is saved 100% locally in your browser storage (IndexedDB and LocalStorage). Your API key is stored on your device and sent only over encrypted HTTPS directly to Google Gemini APIs. No third-party servers ever log or read your scripts.',
                  },
                  {
                    q: 'How do I get or update my Gemini API Key?',
                    a: 'Visit Google AI Studio (aistudio.google.com/apikey), create a free key, and paste it into CreatorDeck. You can manage or replace your key at any time by clicking "API Key" in the header or footer.',
                  },
                  {
                    q: 'Can other people use my API key if I share the app?',
                    a: 'No! Because of CreatorDeck’s Bring-Your-Own-Key (BYOK) architecture, any new visitor is prompted to configure their own personal key. They cannot access your private key or bill usage to your account.',
                  },
                  {
                    q: 'Can I use the generated audio commercially on YouTube?',
                    a: 'Yes. Narration generated with Google Gemini speech models is suitable for YouTube monetization, podcasts, and commercial video production in compliance with Google’s API terms of service.',
                  },
                  {
                    q: 'How does the Audio Mastering Rack work?',
                    a: 'The DSP rack processes raw 24kHz PCM linear audio using multi-band parametric EQ (filtering sub-80Hz rumble and boosting 2.8kHz presence), soft-knee dynamics compression, acoustic room reverb, and a -0.5 dBFS brickwall peak limiter before audio is exported or played.',
                  },
                  {
                    q: 'How do I use the B-Roll Shot Sheet in Premiere or DaVinci?',
                    a: 'Click "Export Shot Sheet (.CSV)" in B-Roll Studio. In DaVinci Resolve or Adobe Premiere, import the CSV file or paste the timestamp markers to line up b-roll cutaways and stock footage clips right against your voice track.',
                  },
                  {
                    q: 'How does Veo Video Studio and Imagen Thumbnail Studio work?',
                    a: 'Veo Studio allows you to generate cinematic video footage clips and prompt recipes with tailored camera movements and lighting styles. Imagen Studio lets you render high-CTR 16:9 thumbnails with mobile timestamp safe zones and overlay text punchlines.',
                  },
                  {
                    q: 'What is the Step 3 CoWorker-Editor in Script Studio?',
                    a: 'Step 3 CoWorker-Editor introduces a quick-action toolbar right on your script editor canvas ("Punch Up Hook", "Inject Voice Tags", "Expand Story", "Tighten Pacing") and a script director chat on the right pane to collaborate dynamically during drafting.',
                  },
                  {
                    q: 'What if my Gemini API quota runs out while I am working?',
                    a: 'No problem at all. Your data is constantly cached in your browser. Just click "Save to PC" in the header to download a complete .json backup file to your computer. When your quota resets tomorrow, or if you enter a fresh API key, click "Load from PC" and you are immediately right back where you left off with zero data lost.',
                  },
                  {
                    q: 'What is the recommended video production workflow?',
                    a: '1. Draft script in Script Studio with CoWorker-Editor → 2. Transfer to Voice Studio & apply delivery tags → 3. Master audio with the DSP Rack & download Audio + SRT → 4. Generate visual shot sheet in B-Roll Studio & export CSV → 5. Generate cinematic video clips in Veo Studio → 6. Render high-CTR thumbnail in Imagen Studio → 7. Extract SEO tags, viral titles & description in SEO Studio.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 space-y-1">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{item.q}</span>
                    </span>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 ml-5">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-zinc-500">Need to update your connection?</span>
                <button
                  onClick={() => {
                    onClose();
                    onOpenKeySettings();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Open API Key Settings</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">CreatorDeck Studio</span>
            <span>•</span>
            <span>Version 2.4</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
