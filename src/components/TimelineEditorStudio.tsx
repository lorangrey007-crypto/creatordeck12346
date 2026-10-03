import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Download,
  Share2,
  Folder,
  Layers,
  Sparkles,
  Sliders,
  Play,
  RotateCcw,
  Scissors,
  Check,
  FileSpreadsheet,
  Database,
} from 'lucide-react';
import { TimelineTrack, TimelineClip, TimelineTool, MediaAsset } from '../types/timeline';
import { createDefaultTracks, generateEDL } from '../lib/timelineUtils';
import { PreviewMonitor } from './PreviewMonitor';
import { MultiTrackCanvas } from './MultiTrackCanvas';
import { CoWorkerChatPane } from './CoWorkerChatPane';
import { MediaBinDrawer } from './MediaBinDrawer';
import { ClipInspectorDrawer } from './ClipInspectorDrawer';
import { VideoExportModal } from './VideoExportModal';
import { MotionTemplate } from '../lib/videoTemplates';
import { getAllVaultAssets, incrementVaultAssetReuse } from '../services/vaultStorageService';
import { VaultAsset } from '../types/vault';

interface TimelineEditorProps {
  apiKey: string;
  onOpenSettings: () => void;
}

export const TimelineEditorStudio: React.FC<TimelineEditorProps> = ({
  apiKey,
  onOpenSettings,
}) => {
  // Timeline State
  const [tracks, setTracks] = useState<TimelineTrack[]>(() => {
    const saved = localStorage.getItem('creator_timeline_tracks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return createDefaultTracks();
  });

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(60);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [fps] = useState<number>(30);
  const [zoom, setZoom] = useState<number>(65); // px per second
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<TimelineTool>('select');
  const [activeSideTab, setActiveSideTab] = useState<'media' | 'vault' | 'templates' | 'coworker'>('media');
  const [exportedStatus, setExportedStatus] = useState<string | null>(null);
  const [showExportVideoModal, setShowExportVideoModal] = useState<boolean>(false);
  const [vaultAssets, setVaultAssets] = useState<VaultAsset[]>([]);

  // Load persistent vault assets
  useEffect(() => {
    getAllVaultAssets().then((items) => {
      setVaultAssets(items);
    }).catch(console.error);
  }, [activeSideTab]);

  // Selected Clip Reference
  const selectedClip = React.useMemo(() => {
    if (!selectedClipId) return null;
    for (const track of tracks) {
      const clip = track.clips.find((c) => c.id === selectedClipId);
      if (clip) return clip;
    }
    return null;
  }, [tracks, selectedClipId]);

  // Update specific clip properties (Chroma Key, blend mode, opacity)
  const handleUpdateClip = (updatedClip: TimelineClip) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== updatedClip.trackId) return track;
        return {
          ...track,
          clips: track.clips.map((c) => (c.id === updatedClip.id ? updatedClip : c)),
        };
      })
    );
  };

  // Insert Motion Template into V2 Overlay track at playhead
  const handleInsertTemplate = (tmpl: MotionTemplate) => {
    const overlayTrack = tracks.find((t) => t.type === 'overlay') || tracks[0];
    const newClip: TimelineClip = {
      id: `tmpl-clip-${Date.now()}`,
      trackId: overlayTrack.id,
      name: tmpl.clipData.name || tmpl.name,
      type: 'overlay',
      start: currentTime,
      duration: tmpl.clipData.duration || tmpl.duration,
      textOverlay: tmpl.clipData.textOverlay,
      opacity: tmpl.clipData.opacity ?? 1.0,
      blendMode: tmpl.clipData.blendMode || 'normal',
      chromaKey: tmpl.clipData.chromaKey,
      isTemplate: true,
      templateCategory: tmpl.category,
    };

    setTracks((prev) =>
      prev.map((t) => (t.id === overlayTrack.id ? { ...t, clips: [...t.clips, newClip] } : t))
    );
    setSelectedClipId(newClip.id);
    setActiveSideTab('templates');
  };

  // Media Bin Assets
  const [assets, setAssets] = useState<MediaAsset[]>([
    {
      id: 'asset-v1',
      name: 'Cinematic Drone Opening',
      type: 'video',
      url: '',
      duration: 5.5,
      createdAt: Date.now(),
      source: 'veo-studio',
    },
    {
      id: 'asset-a1',
      name: 'Vocal Hook Narration (Take 1)',
      type: 'audio',
      url: '',
      duration: 7.2,
      createdAt: Date.now(),
      source: 'voice-studio',
    },
    {
      id: 'asset-v2',
      name: 'Cyberpunk Cityscape B-Roll',
      type: 'video',
      url: '',
      duration: 4.0,
      createdAt: Date.now(),
      source: 'veo-studio',
    },
    {
      id: 'asset-a2',
      name: 'Atmospheric Synth Ambience',
      type: 'audio',
      url: '',
      duration: 15.0,
      createdAt: Date.now(),
      source: 'sample',
    },
  ]);

  // Persist Tracks to LocalStorage
  useEffect(() => {
    localStorage.setItem('creator_timeline_tracks', JSON.stringify(tracks));
    // Calculate total project duration based on furthest clip end
    let maxEnd = 30;
    tracks.forEach((t) => {
      t.clips.forEach((c) => {
        if (c.start + c.duration > maxEnd) {
          maxEnd = c.start + c.duration;
        }
      });
    });
    setDuration(Math.max(30, maxEnd + 10));
  }, [tracks]);

  // Playback RequestAnimationFrame Loop
  const playheadRef = useRef<number>(currentTime);
  playheadRef.current = currentTime;
  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (isPlayingRef.current) {
        let nextTime = playheadRef.current + delta;
        if (nextTime >= duration) {
          nextTime = 0;
          setIsPlaying(false);
        }
        setCurrentTime(nextTime);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [duration]);

  // Keyboard Shortcuts (Space for Play/Pause, V for Select, C for Razor, Backspace for Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'c' || e.key === 'C') {
        setActiveTool('razor');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelectedClip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, tracks]);

  // Add Starter Clips for Instant Playability
  const handleAddSampleClips = () => {
    const sampleClips: TimelineTrack[] = [
      {
        id: 'track-v2',
        name: 'V2 Overlay',
        label: 'V2 • B-Roll & Titles',
        type: 'overlay',
        order: 0,
        muted: false,
        solo: false,
        locked: false,
        visible: true,
        volume: 1.0,
        height: 52,
        clips: [
          {
            id: 'sample-c-v2',
            trackId: 'track-v2',
            name: 'Cyberpunk B-Roll Overlay',
            type: 'overlay',
            start: 4.5,
            duration: 4.0,
            textOverlay: 'Night Neon Aesthetic Cutaway',
          },
        ],
      },
      {
        id: 'track-v1',
        name: 'V1 Main Video',
        label: 'V1 • Primary Video',
        type: 'video',
        order: 1,
        muted: false,
        solo: false,
        locked: false,
        visible: true,
        volume: 1.0,
        height: 64,
        clips: [
          {
            id: 'sample-c-v1-1',
            trackId: 'track-v1',
            name: 'Cinematic Drone Opening',
            type: 'video',
            start: 0,
            duration: 5.5,
          },
          {
            id: 'sample-c-v1-2',
            trackId: 'track-v1',
            name: 'Studio Presenter Action',
            type: 'video',
            start: 5.5,
            duration: 8.0,
          },
        ],
      },
      {
        id: 'track-a1',
        name: 'A1 Voiceover',
        label: 'A1 • Voiceover Narration',
        type: 'audio',
        order: 2,
        muted: false,
        solo: false,
        locked: false,
        visible: true,
        volume: 1.0,
        height: 54,
        clips: [
          {
            id: 'sample-c-a1',
            trackId: 'track-a1',
            name: 'Narration Hook Intro [whispers]',
            type: 'audio',
            start: 0.5,
            duration: 7.2,
          },
        ],
      },
      {
        id: 'track-a2',
        name: 'A2 Music & SFX',
        label: 'A2 • Music & Ambience',
        type: 'sfx',
        order: 3,
        muted: false,
        solo: false,
        locked: false,
        visible: true,
        volume: 0.75,
        height: 54,
        clips: [
          {
            id: 'sample-c-a2',
            trackId: 'track-a2',
            name: 'Atmospheric Synth Bed',
            type: 'sfx',
            start: 0,
            duration: 15.0,
          },
        ],
      },
    ];

    setTracks(sampleClips);
  };

  // Add Asset into appropriate track at playhead
  const handleAddClipToTimeline = (asset: MediaAsset) => {
    let targetTrackType: 'video' | 'overlay' | 'audio' | 'sfx' = 'video';
    if (asset.type === 'audio') targetTrackType = 'audio';
    else if (asset.type === 'image') targetTrackType = 'overlay';

    const targetTrack = tracks.find((t) => t.type === targetTrackType) || tracks[0];

    const newClip: TimelineClip = {
      id: `clip-${Date.now()}`,
      trackId: targetTrack.id,
      name: asset.name,
      type: targetTrack.type,
      start: currentTime,
      duration: asset.duration,
      mediaUrl: asset.url,
    };

    setTracks((prev) =>
      prev.map((t) => (t.id === targetTrack.id ? { ...t, clips: [...t.clips, newClip] } : t))
    );
    setSelectedClipId(newClip.id);
  };

  // Upload Local File
  const handleFileUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video')
      ? 'video'
      : file.type.startsWith('audio')
      ? 'audio'
      : 'image';

    const newAsset: MediaAsset = {
      id: `asset-${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      type: type as any,
      url,
      duration: 5.0, // default placeholder duration until metadata loads
      sizeBytes: file.size,
      createdAt: Date.now(),
      source: 'uploaded',
    };

    setAssets((prev) => [newAsset, ...prev]);
  };

  // Delete Selected Clip
  const handleDeleteSelectedClip = () => {
    if (!selectedClipId) return;
    setTracks((prev) =>
      prev.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== selectedClipId),
      }))
    );
    setSelectedClipId(null);
  };

  // Split Clip at Playhead
  const handleSplitClipAtPlayhead = () => {
    if (!selectedClipId) return;

    setTracks((prev) =>
      prev.map((track) => {
        const clip = track.clips.find((c) => c.id === selectedClipId);
        if (!clip) return track;

        if (currentTime > clip.start && currentTime < clip.start + clip.duration) {
          const firstDuration = currentTime - clip.start;
          const secondDuration = clip.duration - firstDuration;

          const clip1: TimelineClip = {
            ...clip,
            duration: firstDuration,
          };
          const clip2: TimelineClip = {
            ...clip,
            id: `clip-${Date.now()}`,
            start: currentTime,
            duration: secondDuration,
            sourceOffset: (clip.sourceOffset || 0) + firstDuration,
          };

          return {
            ...track,
            clips: track.clips.flatMap((c) => (c.id === clip.id ? [clip1, clip2] : [c])),
          };
        }
        return track;
      })
    );
  };

  // CoWorker Chat Directives Execution
  const handleExecuteDirective = (directive: string) => {
    if (directive === 'split') {
      handleSplitClipAtPlayhead();
    } else if (directive === 'ripple_gaps') {
      // Ripple delete: snap each track clips sequentially
      setTracks((prev) =>
        prev.map((track) => {
          let cursor = 0;
          const sorted = [...track.clips].sort((a, b) => a.start - b.start);
          const aligned = sorted.map((clip) => {
            const updated = { ...clip, start: cursor };
            cursor += clip.duration;
            return updated;
          });
          return { ...track, clips: aligned };
        })
      );
    } else if (directive === 'add_broll') {
      const overlayTrack = tracks.find((t) => t.type === 'overlay') || tracks[0];
      const newClip: TimelineClip = {
        id: `clip-${Date.now()}`,
        trackId: overlayTrack.id,
        name: 'AI Generated B-Roll Cutaway',
        type: 'overlay',
        start: currentTime,
        duration: 3.5,
        textOverlay: 'Visual Hook Overlay Frame',
      };
      setTracks((prev) =>
        prev.map((t) => (t.id === overlayTrack.id ? { ...t, clips: [...t.clips, newClip] } : t))
      );
      setSelectedClipId(newClip.id);
    } else if (directive === 'add_music') {
      const musicTrack = tracks.find((t) => t.type === 'sfx') || tracks[3];
      const newClip: TimelineClip = {
        id: `clip-${Date.now()}`,
        trackId: musicTrack.id,
        name: 'Ambient Studio Synth Bed',
        type: 'sfx',
        start: 0,
        duration: 20.0,
      };
      setTracks((prev) =>
        prev.map((t) => (t.id === musicTrack.id ? { ...t, clips: [...t.clips, newClip] } : t))
      );
    }
  };

  // Export EDL for Premiere Pro / DaVinci Resolve
  const handleExportEDL = () => {
    const edlContent = generateEDL(tracks, fps);
    const blob = new Blob([edlContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creatordeck_timeline_${Date.now()}.edl`;
    a.click();
    URL.revokeObjectURL(url);
    setExportedStatus('EDL Exported!');
    setTimeout(() => setExportedStatus(null), 3000);
  };

  // Reset Timeline
  const handleResetTimeline = () => {
    if (window.confirm('Reset all timeline tracks to empty default?')) {
      setTracks(createDefaultTracks());
      setCurrentTime(0);
      setSelectedClipId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden select-none">
      {/* Top Workstation Header */}
      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                CoWorker-Editor Workstation
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/80">
                Step 3 • NLE Timeline
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Multi-track timeline, real-time preview monitor, razor editing & live AI co-worker
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2">
          {exportedStatus && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold animate-pulse">
              <Check className="w-3.5 h-3.5" />
              {exportedStatus}
            </span>
          )}

          <button
            onClick={handleAddSampleClips}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700"
            title="Load ready-to-play sample footage, voiceover, and B-roll"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>Load Demo Project</span>
          </button>

          <button
            onClick={() => setShowExportVideoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer transition-all shadow-xs"
            title="Render and download full MP4/WebM video file for direct YouTube upload"
          >
            <Film className="w-3.5 h-3.5 text-white" />
            <span>Export Video (.MP4)</span>
          </button>

          <button
            onClick={handleExportEDL}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer transition-all shadow-xs"
            title="Export standard EDL Edit Decision List for DaVinci Resolve or Adobe Premiere"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export to NLE (.EDL)</span>
          </button>

          <button
            onClick={handleResetTimeline}
            className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700"
            title="Reset Timeline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Studio Body: Top Split Monitor & Media / Assistant */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {/* Top Half: Monitor (Left) + Drawer/CoWorker (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[300px] max-h-[460px]">
          {/* Program Monitor (8 cols) */}
          <div className="lg:col-span-8 flex flex-col h-full">
            <PreviewMonitor
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              aspectRatio={aspectRatio}
              fps={fps}
              tracks={tracks}
              onPlayToggle={() => setIsPlaying(!isPlaying)}
              onSeek={(t) => setCurrentTime(t)}
              onAspectRatioToggle={() =>
                setAspectRatio(aspectRatio === '16:9' ? '9:16' : '16:9')
              }
            />
          </div>

          {/* Right Side Tab: Media Bin or CoWorker Chat (4 cols) */}
          <div className="lg:col-span-4 flex flex-col h-full">
            {/* Tab Headers */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-t-xl border-t border-x border-zinc-200 dark:border-zinc-800 shrink-0">
              <button
                onClick={() => setActiveSideTab('media')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeSideTab === 'media'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Media Bin</span>
              </button>
              <button
                onClick={() => setActiveSideTab('vault')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeSideTab === 'vault'
                    ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Vault (0 Cr)</span>
              </button>
              <button
                onClick={() => setActiveSideTab('templates')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeSideTab === 'templates'
                    ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Templates & Key</span>
              </button>
              <button
                onClick={() => setActiveSideTab('coworker')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeSideTab === 'coworker'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>CoWorker</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 min-h-0">
              {activeSideTab === 'media' ? (
                <MediaBinDrawer
                  assets={assets}
                  onAddClipToTimeline={handleAddClipToTimeline}
                  onFileUpload={handleFileUpload}
                  onAddSampleClips={handleAddSampleClips}
                />
              ) : activeSideTab === 'vault' ? (
                <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
                  <div className="px-3 py-2 bg-purple-50 dark:bg-purple-950/60 border-b border-purple-200 dark:border-purple-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 text-xs font-bold">
                      <Database className="w-3.5 h-3.5" />
                      <span>Veo-Vault (0-Credit DB)</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                      {vaultAssets.length} Saved
                    </span>
                  </div>

                  <div className="flex-1 p-2.5 overflow-y-auto space-y-2">
                    {vaultAssets.length === 0 ? (
                      <div className="text-center p-4 text-xs text-zinc-500 dark:text-zinc-400">
                        No vault assets found. Open Veo-Vault tab to import or pre-seed footage!
                      </div>
                    ) : (
                      vaultAssets.map((va) => (
                        <div
                          key={va.id}
                          className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 flex items-center justify-between text-xs transition-all"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate text-[11px]">
                              {va.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {va.durationSec || 5}s • {va.category} • Reused {va.timesReused}x
                            </span>
                          </div>
                          <button
                            onClick={async () => {
                              await incrementVaultAssetReuse(va.id);
                              handleAddClipToTimeline({
                                id: va.id,
                                name: va.name,
                                type: va.type,
                                url: va.blobUrl || '',
                                duration: va.durationSec || 5.0,
                                createdAt: Date.now(),
                                source: 'sample',
                              });
                            }}
                            className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold cursor-pointer shrink-0"
                            title="Reuse cached asset with 0 credit deduction"
                          >
                            + Drop (0 Cr)
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : activeSideTab === 'templates' ? (
                <ClipInspectorDrawer
                  selectedClip={selectedClip}
                  onUpdateClip={handleUpdateClip}
                  onInsertTemplate={handleInsertTemplate}
                />
              ) : (
                <CoWorkerChatPane
                  tracks={tracks}
                  currentTime={currentTime}
                  duration={duration}
                  onExecuteDirective={handleExecuteDirective}
                />
              )}
            </div>
          </div>
        </div>

        {/* Bottom Half: Multi-Track Timeline Canvas */}
        <div className="flex-1 min-h-[280px]">
          <MultiTrackCanvas
            tracks={tracks}
            currentTime={currentTime}
            duration={duration}
            zoom={zoom}
            fps={fps}
            selectedClipId={selectedClipId}
            activeTool={activeTool}
            onSeek={(t) => setCurrentTime(t)}
            onSelectClip={(id) => setSelectedClipId(id)}
            onUpdateTracks={(newTracks) => setTracks(newTracks)}
            onSplitClipAtPlayhead={handleSplitClipAtPlayhead}
            onDeleteSelectedClip={handleDeleteSelectedClip}
            onZoomChange={(z) => setZoom(z)}
            onSetActiveTool={(tool) => setActiveTool(tool)}
          />
        </div>
      </div>

      {/* Video Export Modal */}
      <VideoExportModal
        isOpen={showExportVideoModal}
        onClose={() => setShowExportVideoModal(false)}
        tracks={tracks}
        aspectRatio={aspectRatio}
        fps={fps}
        duration={duration}
      />
    </div>
  );
};
