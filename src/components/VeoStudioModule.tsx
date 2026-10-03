import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  Download,
  Sparkles,
  Loader2,
  Trash2,
  Film,
  Maximize2,
  Volume2,
  VolumeX,
  Plus,
  RefreshCw,
  ExternalLink,
  Layers,
  Clock,
  Sparkle,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Monitor,
  Smartphone,
  Palette
} from 'lucide-react';
import { VeoClip, BRollCueItem } from '../types';
import { startVeoVideo, pollVeoVideoStatus, downloadVeoVideo } from '../services/videoAndImageService';
import { getStoredGeminiApiKey } from '../services/geminiKeyService';

interface VeoStudioModuleProps {
  shotSheet?: BRollCueItem[];
  activeClips: VeoClip[];
  onAddClip: (clip: VeoClip) => void;
  onUpdateClip: (id: string, updates: Partial<VeoClip>) => void;
  onDeleteClip: (id: string) => void;
  onOpenSettingsModal?: () => void;
}

export const VeoStudioModule: React.FC<VeoStudioModuleProps> = ({
  shotSheet = [],
  activeClips = [],
  onAddClip,
  onUpdateClip,
  onDeleteClip,
  onOpenSettingsModal,
}) => {
  const safeClips = Array.isArray(activeClips) ? activeClips : [];
  const safeShotSheet = Array.isArray(shotSheet) ? shotSheet : [];

  // Selected clip for cinema monitor
  const [selectedClipId, setSelectedClipId] = useState<string | null>(() => {
    return safeClips.length > 0 ? safeClips[0].id : null;
  });

  // Generation Dock Form State
  const [workspaceFormat, setWorkspaceFormat] = useState<'all' | '16:9' | '9:16'>('all');
  const [promptInput, setPromptInput] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [modelType, setModelType] = useState<'veo-3.1-lite-generate-preview' | 'veo-3.1-generate-preview'>('veo-3.1-lite-generate-preview');
  const [selectedShotIndex, setSelectedShotIndex] = useState<number | null>(null);
  const [visualDnaPrompt, setVisualDnaPrompt] = useState<string>('Cinematic 35mm, high contrast chiaroscuro, volumetric haze, photorealistic physics, 24fps');
  const [applyVisualDna, setApplyVisualDna] = useState<boolean>(true);

  // Video Player state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  // Active generating / polling IDs
  const pollingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const activeSelectedClip = safeClips.find((c) => c.id === selectedClipId) || (safeClips.length > 0 ? safeClips[0] : null);

  // Auto-sync selected clip if deleted or empty
  useEffect(() => {
    if (!selectedClipId && safeClips.length > 0) {
      setSelectedClipId(safeClips[0].id);
    }
  }, [safeClips, selectedClipId]);

  // Handle Video Player Events
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Populate prompt from selected shot sheet cue
  const handleSelectShotCue = (cue: BRollCueItem, idx: number) => {
    setSelectedShotIndex(idx);
    setPromptInput(cue.veoPrompt || cue.visualAction);
  };

  // Launch Veo Video Generation Dock
  const handleStartGeneration = async () => {
    let trimmed = promptInput.trim();
    if (!trimmed) return;

    // Apply synchronized Visual DNA motif if toggled
    if (applyVisualDna && visualDnaPrompt.trim()) {
      if (!trimmed.toLowerCase().includes(visualDnaPrompt.slice(0, 20).toLowerCase())) {
        trimmed = `${trimmed}, ${visualDnaPrompt.trim()}`;
      }
    }

    const clipId = 'veo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newClip: VeoClip = {
      id: clipId,
      prompt: trimmed,
      timestamp: selectedShotIndex !== null && shotSheet[selectedShotIndex] ? shotSheet[selectedShotIndex].timestamp : undefined,
      shotNumber: selectedShotIndex !== null ? selectedShotIndex + 1 : undefined,
      durationSec: 5,
      aspectRatio,
      resolution,
      model: modelType,
      status: 'pending',
      createdAt: Date.now(),
    };

    onAddClip(newClip);
    setSelectedClipId(clipId);

    try {
      // Step 1: Initiate Operation
      const res = await startVeoVideo({
        prompt: trimmed,
        model: modelType,
        aspectRatio,
        resolution,
      });

      onUpdateClip(clipId, {
        operationName: res.operationName,
        status: 'polling',
      });

      // Begin polling
      startPolling(clipId, res.operationName);
    } catch (err: any) {
      onUpdateClip(clipId, {
        status: 'failed',
        errorMessage: err?.message || 'Failed to start generation',
      });
    }
  };

  // Poll video operation recursively
  const startPolling = (clipId: string, operationName: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    const poll = async () => {
      attempts++;
      try {
        const check = await pollVeoVideoStatus(operationName);

        if (check.done) {
          if (check.error) {
            onUpdateClip(clipId, {
              status: 'failed',
              errorMessage: check.error,
            });
            return;
          }

          // Step 3: Fetch video stream from server proxy
          const { blobUrl } = await downloadVeoVideo(operationName);

          onUpdateClip(clipId, {
            status: 'ready',
            videoBlobUrl: blobUrl,
          });
          return;
        }

        if (attempts >= maxAttempts) {
          onUpdateClip(clipId, {
            status: 'failed',
            errorMessage: 'Generation timed out. Check Google Cloud status or retry.',
          });
          return;
        }

        // Poll every 5 seconds
        pollingTimeouts.current[clipId] = setTimeout(poll, 5000);
      } catch (pollErr: any) {
        if (attempts >= maxAttempts) {
          onUpdateClip(clipId, {
            status: 'failed',
            errorMessage: pollErr?.message || 'Failed polling status',
          });
        } else {
          pollingTimeouts.current[clipId] = setTimeout(poll, 5000);
        }
      }
    };

    // First poll after 4 seconds
    pollingTimeouts.current[clipId] = setTimeout(poll, 4000);
  };

  // Clean up poll timers on unmount
  useEffect(() => {
    return () => {
      const timers = pollingTimeouts.current;
      for (const id in timers) {
        if (timers[id]) {
          clearTimeout(timers[id]);
        }
      }
    };
  }, []);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-900/15 via-indigo-900/10 to-blue-900/15 border border-purple-200/80 dark:border-purple-800/40 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Veo Video Generation Dock & Cinema Player
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                Google Veo 3.1
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Generate photorealistic 4K/HD video B-rolls using Google Veo, preview with scrub controls, and inject scene cues from your Shot Sheet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono font-medium text-zinc-700 dark:text-zinc-300 text-xs">
            Clips in Dock: <strong className="text-purple-600 dark:text-purple-400">{safeClips.length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono font-medium text-zinc-700 dark:text-zinc-300 text-xs">
            Shot Cues: <strong className="text-blue-600 dark:text-blue-400">{safeShotSheet.length}</strong>
          </span>
        </div>
      </div>

      {/* Main Grid: Cinema Player (Left 7 cols) & Generation Dock (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CINEMA MONITOR & CLIP DOCK */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Cinema Monitor Frame */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-black overflow-hidden shadow-md flex flex-col">
            {/* Monitor Header */}
            <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-mono font-bold text-white uppercase text-[11px] tracking-wider">
                  Veo Cinema Monitor 4K
                </span>
                {activeSelectedClip && (
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                    {activeSelectedClip.aspectRatio} • {activeSelectedClip.resolution}
                  </span>
                )}
              </div>

              {activeSelectedClip?.timestamp && (
                <span className="font-mono text-purple-400 text-[11px] font-semibold">
                  Timestamp: {activeSelectedClip.timestamp}
                </span>
              )}
            </div>

            {/* Video Viewport */}
            <div className="relative aspect-video w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
              {activeSelectedClip?.status === 'ready' && activeSelectedClip.videoBlobUrl ? (
                <video
                  ref={videoRef}
                  src={activeSelectedClip.videoBlobUrl}
                  className="w-full h-full object-contain"
                  loop={isLooping}
                  muted={isMuted}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={togglePlayPause}
                />
              ) : activeSelectedClip?.status === 'polling' || activeSelectedClip?.status === 'pending' ? (
                <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
                  <div className="relative">
                    <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                    <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Google Veo is Rendering Video...</h4>
                    <p className="text-xs text-zinc-400 max-w-sm mt-1">
                      Generating camera optics, neural lighting passes, and 24fps motion physics. Polling Google Cloud every 5s...
                    </p>
                  </div>
                  <div className="w-48 bg-zinc-800 rounded-full h-1.5 overflow-hidden mt-2">
                    <div className="bg-purple-500 h-full w-2/3 animate-pulse" />
                  </div>
                </div>
              ) : activeSelectedClip?.status === 'failed' ? (
                <div className="flex flex-col items-center justify-center p-8 text-center gap-2 text-rose-400">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                  <h4 className="text-sm font-bold">Video Generation Failed</h4>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    {activeSelectedClip.errorMessage || 'Please verify your Gemini API key has Veo video permissions.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center gap-2 text-zinc-500">
                  <Film className="w-10 h-10 text-zinc-700" />
                  <h4 className="text-sm font-medium text-zinc-400">No Video Clip Selected</h4>
                  <p className="text-xs text-zinc-500 max-w-sm">
                    Select a shot from the B-roll sheet or type a prompt on the right to start generating with Google Veo.
                  </p>
                </div>
              )}
            </div>

            {/* Playback Controls Toolbar */}
            {activeSelectedClip?.status === 'ready' && activeSelectedClip.videoBlobUrl && (
              <div className="p-3 bg-zinc-900/90 border-t border-zinc-800 flex flex-col gap-2">
                {/* Scrub bar */}
                <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
                  <span>{currentTime.toFixed(1)}s</span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 5}
                    step="0.05"
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <span>{(duration || 5).toFixed(1)}s</span>
                </div>

                {/* Buttons row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white cursor-pointer transition-all"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                          setCurrentTime(0);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                      title="Rewind to start"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    {/* Speed Selector */}
                    <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-lg text-[10px] font-mono text-zinc-300">
                      {[0.5, 1.0, 1.5, 2.0].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSpeedChange(s)}
                          className={`px-1.5 py-0.5 rounded ${playbackSpeed === s ? 'bg-purple-600 text-white font-bold' : 'hover:text-white'}`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={activeSelectedClip.videoBlobUrl}
                      download={`veo-${activeSelectedClip.id}.mp4`}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-purple-400" />
                      <span>Download MP4</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Generation Clip Queue / Dock */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#12131a] p-4 flex flex-col gap-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Clip Dock ({safeClips.length})
                </h3>
              </div>

              {/* Format Filter Tabs */}
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setWorkspaceFormat('all')}
                  className={`px-2 py-0.5 rounded ${
                    workspaceFormat === 'all'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  All ({safeClips.length})
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceFormat('16:9')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                    workspaceFormat === '16:9'
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Monitor className="w-2.5 h-2.5" />
                  <span>16:9 ({safeClips.filter(c => c.aspectRatio === '16:9').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceFormat('9:16')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                    workspaceFormat === '9:16'
                      ? 'bg-rose-600 text-white shadow-2xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Smartphone className="w-2.5 h-2.5" />
                  <span>9:16 ({safeClips.filter(c => c.aspectRatio === '9:16').length})</span>
                </button>
              </div>
            </div>

            {safeClips.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-500">
                No clips generated yet. Use the prompt dock on the right to start generating Veo clips.
              </div>
            ) : safeClips.filter(c => workspaceFormat === 'all' || c.aspectRatio === workspaceFormat).length === 0 ? (
              <div className="py-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-500">
                No {workspaceFormat} clips found. Switch filter or generate one on the right.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {safeClips
                  .filter(c => workspaceFormat === 'all' || c.aspectRatio === workspaceFormat)
                  .map((clip, idx) => {
                  const isSelected = clip.id === selectedClipId;
                  return (
                    <div
                      key={clip.id}
                      onClick={() => setSelectedClipId(clip.id)}
                      className={`relative p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-28 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-1 ring-purple-500'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                            #{idx + 1} {clip.timestamp ? `• ${clip.timestamp}` : ''}
                          </span>
                          {clip.status === 'ready' ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Ready" />
                          ) : clip.status === 'polling' || clip.status === 'pending' ? (
                            <Loader2 className="w-3 h-3 text-purple-500 animate-spin" title="Generating..." />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-rose-500" title="Failed" />
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-tight">
                          {clip.prompt}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1">
                        <span className="font-mono">{clip.aspectRatio}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClip(clip.id);
                          }}
                          className="p-1 text-zinc-400 hover:text-rose-500 rounded cursor-pointer"
                          title="Delete clip"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: VEO GENERATION DOCK & SCENE PROMPT INJECTOR */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Main Prompt Dock */}
          <div className="rounded-2xl border border-purple-200/80 dark:border-purple-900/40 bg-white dark:bg-[#12131a] p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Google Veo Prompt Dock
                </h3>
              </div>
              <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                Veo 3.1
              </span>
            </div>

            {/* Prompt input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Video Prompt & Camera Direction</span>
                <span className="text-[10px] font-normal text-zinc-500">
                  {promptInput.length} characters
                </span>
              </label>
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Cinematic 4K shot, slow deliberate push-in on rain-streaked window at night, lone silhouette passing outside, 35mm anamorphic lens, cold cyan rain against warm interior tungsten glow, photorealistic physics, 24fps --ar 16:9"
                rows={5}
                className="w-full text-xs font-mono p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Quick Parameters Selector */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`py-1 text-center font-mono font-semibold rounded ${
                      aspectRatio === '16:9' ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-2xs' : 'text-zinc-500'
                    }`}
                  >
                    16:9 (Landscape)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`py-1 text-center font-mono font-semibold rounded ${
                      aspectRatio === '9:16' ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-2xs' : 'text-zinc-500'
                    }`}
                  >
                    9:16 (Shorts)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                  Resolution
                </label>
                <div className="grid grid-cols-2 gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setResolution('720p')}
                    className={`py-1 text-center font-mono font-semibold rounded ${
                      resolution === '720p' ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-2xs' : 'text-zinc-500'
                    }`}
                  >
                    720p (Fast)
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolution('1080p')}
                    className={`py-1 text-center font-mono font-semibold rounded ${
                      resolution === '1080p' ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-2xs' : 'text-zinc-500'
                    }`}
                  >
                    1080p (HD)
                  </button>
                </div>
              </div>
            </div>

            {/* Veo Model Selector */}
            <div className="text-xs">
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                Veo AI Model
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setModelType('veo-3.1-lite-generate-preview')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    modelType === 'veo-3.1-lite-generate-preview'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <span className="font-bold block text-[11px]">Veo 3.1 Lite</span>
                  <span className="text-[10px] text-zinc-500">Faster render speeds</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModelType('veo-3.1-generate-preview')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    modelType === 'veo-3.1-generate-preview'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <span className="font-bold block text-[11px]">Veo 3.1 Pro</span>
                  <span className="text-[10px] text-zinc-500">Maximum cinematic detail</span>
                </button>
              </div>
            </div>

            {/* Sync Visual DNA Across Shorts & Long-Form */}
            <div className="p-3 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/25 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Sync Visual DNA (Shorts ↔ Long-Form)
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={applyVisualDna}
                    onChange={(e) => setApplyVisualDna(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Guarantees matching color palette, camera grade, and lighting between your Shorts and YouTube video.
              </p>
              {applyVisualDna && (
                <input
                  type="text"
                  value={visualDnaPrompt}
                  onChange={(e) => setVisualDnaPrompt(e.target.value)}
                  placeholder="e.g. 35mm film grain, moody neon blues, tungsten rim lighting..."
                  className="w-full px-2.5 py-1 text-xs rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              )}
            </div>

            {/* Generate Action Button */}
            <button
              type="button"
              onClick={handleStartGeneration}
              disabled={!promptInput.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer transition-all"
            >
              <Video className="w-4 h-4" />
              <span>Generate 4K Video with Google Veo</span>
            </button>
          </div>

          {/* Quick Scene Cue Importer from Shot Sheet */}
          {safeShotSheet.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#12131a] p-4 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-blue-500" />
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Inject From B-Roll Shot Sheet ({safeShotSheet.length} Cues)
                  </h4>
                </div>
                <span className="text-[10px] text-zinc-500">One-click populate</span>
              </div>

              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {safeShotSheet.map((cue, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectShotCue(cue, idx)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedShotIndex === idx
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-800 bg-zinc-50 dark:bg-zinc-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        Shot #{idx + 1} ({cue.timestamp})
                      </span>
                      {cue.veoCameraMotion && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {cue.veoCameraMotion}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-800 dark:text-zinc-200 font-medium line-clamp-2">
                      {cue.visualAction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
