import React, { useRef, useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Scissors,
  MousePointer,
  Trash2,
  ZoomIn,
  ZoomOut,
  Plus,
  Play,
  Pause,
} from 'lucide-react';
import { TimelineTrack, TimelineClip, TimelineTool } from '../types/timeline';
import { formatSMPTETimecode, formatAudioTime } from '../lib/timelineUtils';

interface MultiTrackCanvasProps {
  tracks: TimelineTrack[];
  currentTime: number;
  duration: number;
  zoom: number; // pixels per second (e.g. 50 - 200)
  fps: number;
  selectedClipId: string | null;
  activeTool: TimelineTool;
  onSeek: (time: number) => void;
  onSelectClip: (clipId: string | null) => void;
  onUpdateTracks: (newTracks: TimelineTrack[]) => void;
  onSplitClipAtPlayhead: () => void;
  onDeleteSelectedClip: () => void;
  onZoomChange: (newZoom: number) => void;
  onSetActiveTool: (tool: TimelineTool) => void;
}

export const MultiTrackCanvas: React.FC<MultiTrackCanvasProps> = ({
  tracks,
  currentTime,
  duration,
  zoom,
  fps,
  selectedClipId,
  activeTool,
  onSeek,
  onSelectClip,
  onUpdateTracks,
  onSplitClipAtPlayhead,
  onDeleteSelectedClip,
  onZoomChange,
  onSetActiveTool,
}) => {
  const rulerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [draggingClip, setDraggingClip] = useState<{
    clipId: string;
    sourceTrackId: string;
    initialStart: number;
    dragStartX: number;
  } | null>(null);

  // Handle Playhead Scrubbing on Ruler
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(duration, clickX / zoom));
    onSeek(newTime);
    setIsScrubbing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing && rulerRef.current) {
        const rect = rulerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newTime = Math.max(0, Math.min(duration, clickX / zoom));
        onSeek(newTime);
      }

      if (draggingClip && rulerRef.current) {
        const deltaX = e.clientX - draggingClip.dragStartX;
        const deltaTime = deltaX / zoom;
        const targetStart = Math.max(0, draggingClip.initialStart + deltaTime);

        // Update clip position in tracks
        const updated = tracks.map((track) => {
          if (track.id !== draggingClip.sourceTrackId) return track;
          return {
            ...track,
            clips: track.clips.map((clip) => {
              if (clip.id !== draggingClip.clipId) return clip;
              return { ...clip, start: Math.round(targetStart * 100) / 100 };
            }),
          };
        });
        onUpdateTracks(updated);
      }
    };

    const handleMouseUp = () => {
      if (isScrubbing) setIsScrubbing(false);
      if (draggingClip) setDraggingClip(null);
    };

    if (isScrubbing || draggingClip) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing, draggingClip, zoom, duration, tracks, onSeek, onUpdateTracks]);

  // Track Toggles
  const toggleTrackMute = (trackId: string) => {
    onUpdateTracks(
      tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t))
    );
  };

  const toggleTrackLock = (trackId: string) => {
    onUpdateTracks(
      tracks.map((t) => (t.id === trackId ? { ...t, locked: !t.locked } : t))
    );
  };

  const toggleTrackVisibility = (trackId: string) => {
    onUpdateTracks(
      tracks.map((t) => (t.id === trackId ? { ...t, visible: !t.visible } : t))
    );
  };

  // Timeline length in pixels
  const timelinePixelWidth = Math.max(800, duration * zoom + 300);

  // Ruler markings
  const timeStep = zoom > 120 ? 1 : zoom > 60 ? 2 : 5; // seconds interval
  const rulerTicks: number[] = [];
  for (let t = 0; t <= duration + 10; t += timeStep) {
    rulerTicks.push(t);
  }

  // Clip Click with Razor tool vs Select tool
  const handleClipClick = (e: React.MouseEvent, clip: TimelineClip, track: TimelineTrack) => {
    e.stopPropagation();
    if (track.locked) return;

    if (activeTool === 'razor') {
      // Split this clip at current playhead
      if (currentTime > clip.start && currentTime < clip.start + clip.duration) {
        const firstDuration = currentTime - clip.start;
        const secondDuration = clip.duration - firstDuration;

        const clip1: TimelineClip = {
          ...clip,
          duration: firstDuration,
        };
        const clip2: TimelineClip = {
          ...clip,
          id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          start: currentTime,
          duration: secondDuration,
          sourceOffset: (clip.sourceOffset || 0) + firstDuration,
        };

        const updated = tracks.map((t) => {
          if (t.id !== track.id) return t;
          return {
            ...t,
            clips: t.clips.flatMap((c) => (c.id === clip.id ? [clip1, clip2] : [c])),
          };
        });
        onUpdateTracks(updated);
        onSelectClip(clip2.id);
      }
    } else {
      onSelectClip(clip.id);
    }
  };

  const handleClipMouseDown = (e: React.MouseEvent, clip: TimelineClip, track: TimelineTrack) => {
    if (activeTool !== 'select' || track.locked) return;
    e.stopPropagation();
    onSelectClip(clip.id);
    setDraggingClip({
      clipId: clip.id,
      sourceTrackId: track.id,
      initialStart: clip.start,
      dragStartX: e.clientX,
    });
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl select-none"
    >
      {/* Timeline Controls & Tools Bar */}
      <div className="px-4 py-2.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-4">
        {/* Editing Tools (Selection, Razor Split, Delete) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSetActiveTool('select')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTool === 'select'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
            title="Selection & Move Tool (V)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Select (V)</span>
          </button>

          <button
            onClick={() => onSetActiveTool('razor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTool === 'razor'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
            title="Razor Blade Split Tool (C)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Razor (C)</span>
          </button>

          <div className="w-[1px] h-5 bg-zinc-800 mx-1" />

          <button
            onClick={onSplitClipAtPlayhead}
            disabled={!selectedClipId}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Slice selected clip at current playhead"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>Split at Playhead</span>
          </button>

          <button
            onClick={onDeleteSelectedClip}
            disabled={!selectedClipId}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-red-900/60 text-zinc-300 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Delete selected clip (Backspace / Delete)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>

        {/* Timeline Zoom Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ZoomOut
              className="w-4 h-4 cursor-pointer hover:text-zinc-200"
              onClick={() => onZoomChange(Math.max(25, zoom - 25))}
            />
            <input
              type="range"
              min="25"
              max="200"
              value={zoom}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="w-24 accent-blue-500 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
            />
            <ZoomIn
              className="w-4 h-4 cursor-pointer hover:text-zinc-200"
              onClick={() => onZoomChange(Math.min(200, zoom + 25))}
            />
            <span className="font-mono text-[11px] text-zinc-400 w-10 text-right">{zoom}px/s</span>
          </div>
        </div>
      </div>

      {/* Main Multi-Track Scroll Area */}
      <div className="relative flex overflow-x-auto overflow-y-hidden max-h-[360px] select-none bg-zinc-950/70 custom-scrollbar">
        {/* Left Sticky Track Headers */}
        <div className="sticky left-0 z-30 w-52 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col shadow-xl">
          {/* Header empty box matching ruler height */}
          <div className="h-8 border-b border-zinc-800 bg-zinc-950 px-3 flex items-center justify-between text-[11px] font-semibold text-zinc-400">
            <span>TRACKS</span>
            <span>M / L</span>
          </div>

          {/* Track Header controls */}
          {tracks.map((track) => (
            <div
              key={track.id}
              style={{ height: `${track.height || 54}px` }}
              className={`px-3 py-1.5 border-b border-zinc-800/80 flex items-center justify-between text-xs transition-colors ${
                track.type === 'video'
                  ? 'bg-indigo-950/20'
                  : track.type === 'overlay'
                  ? 'bg-sky-950/20'
                  : track.type === 'audio'
                  ? 'bg-emerald-950/20'
                  : 'bg-zinc-900'
              }`}
            >
              <div className="flex flex-col min-w-0 pr-1">
                <span className="font-semibold text-zinc-200 truncate text-[11px]">
                  {track.label}
                </span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">
                  {track.clips.length} clip{track.clips.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Mute, Lock, Visibility buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Visibility */}
                <button
                  onClick={() => toggleTrackVisibility(track.id)}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    track.visible ? 'text-zinc-400 hover:text-zinc-200' : 'text-red-400 bg-red-950/40'
                  }`}
                  title={track.visible ? 'Hide track' : 'Show track'}
                >
                  {track.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                {/* Mute */}
                <button
                  onClick={() => toggleTrackMute(track.id)}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    track.muted ? 'text-red-400 bg-red-950/50' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={track.muted ? 'Unmute track' : 'Mute track'}
                >
                  {track.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                {/* Lock */}
                <button
                  onClick={() => toggleTrackLock(track.id)}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    track.locked ? 'text-amber-400 bg-amber-950/50' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={track.locked ? 'Unlock track' : 'Lock track'}
                >
                  {track.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Scrollable Timeline Track Lanes */}
        <div
          style={{ width: `${timelinePixelWidth}px` }}
          className="relative flex-1 bg-zinc-950 min-h-[260px]"
        >
          {/* 1. Time Ruler */}
          <div
            ref={rulerRef}
            onMouseDown={handleRulerMouseDown}
            className="h-8 border-b border-zinc-800 bg-zinc-950/90 relative cursor-pointer select-none"
          >
            {rulerTicks.map((tick) => {
              const left = tick * zoom;
              return (
                <div
                  key={tick}
                  style={{ left: `${left}px` }}
                  className="absolute top-0 bottom-0 border-l border-zinc-800 flex flex-col justify-between"
                >
                  <span className="text-[10px] font-mono text-zinc-500 pl-1">
                    {formatAudioTime(tick)}
                  </span>
                  <div className="w-[1px] h-1.5 bg-zinc-700" />
                </div>
              );
            })}
          </div>

          {/* 2. Track Lanes Container */}
          <div className="relative">
            {/* Red Playhead Vertical Marker */}
            <div
              style={{ left: `${currentTime * zoom}px` }}
              className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-20 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.8)]"
            >
              {/* Playhead Head Handle */}
              <div className="w-3 h-3.5 bg-red-500 -ml-[5px] -mt-8 rounded-b-sm border-t-2 border-red-300 shadow-md" />
            </div>

            {/* Render Each Track Lane */}
            {tracks.map((track) => (
              <div
                key={track.id}
                style={{ height: `${track.height || 54}px` }}
                className={`relative border-b border-zinc-800/80 w-full overflow-hidden ${
                  track.locked ? 'bg-zinc-950/80 opacity-70' : 'hover:bg-zinc-900/30'
                }`}
                onClick={() => onSelectClip(null)}
              >
                {/* Subtle grid background */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: `linear-gradient(to right, #27272a 1px, transparent 1px)`,
                    backgroundSize: `${zoom}px 100%`,
                  }}
                />

                {/* Clips in this track */}
                {track.clips.map((clip) => {
                  const clipLeft = clip.start * zoom;
                  const clipWidth = Math.max(12, clip.duration * zoom);
                  const isSelected = selectedClipId === clip.id;

                  // Styling depending on track type
                  let clipColorClass = 'bg-blue-700/80 border-blue-500 text-blue-100';
                  if (track.type === 'video') {
                    clipColorClass = 'bg-indigo-700/80 border-indigo-400 text-indigo-100';
                  } else if (track.type === 'overlay') {
                    clipColorClass = 'bg-sky-600/80 border-sky-400 text-sky-100';
                  } else if (track.type === 'audio') {
                    clipColorClass = 'bg-emerald-700/80 border-emerald-400 text-emerald-100';
                  } else if (track.type === 'sfx') {
                    clipColorClass = 'bg-purple-700/80 border-purple-400 text-purple-100';
                  }

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => handleClipClick(e, clip, track)}
                      onMouseDown={(e) => handleClipMouseDown(e, clip, track)}
                      style={{
                        left: `${clipLeft}px`,
                        width: `${clipWidth}px`,
                        height: `${(track.height || 54) - 8}px`,
                        top: '4px',
                      }}
                      className={`absolute rounded-md border text-xs px-2 py-1 flex flex-col justify-between cursor-move overflow-hidden transition-shadow select-none shadow-md ${clipColorClass} ${
                        isSelected
                          ? 'ring-2 ring-white border-white shadow-lg'
                          : 'hover:border-zinc-200'
                      }`}
                      title={`${clip.name} (${clip.duration.toFixed(2)}s)`}
                    >
                      {/* Clip Title & Duration */}
                      <div className="flex items-center justify-between w-full overflow-hidden">
                        <span className="font-semibold text-[11px] truncate leading-tight">
                          {clip.name}
                        </span>
                        <span className="text-[9px] opacity-80 font-mono ml-1 shrink-0">
                          {clip.duration.toFixed(1)}s
                        </span>
                      </div>

                      {/* Mock waveform or filmstrip thumbnail effect */}
                      <div className="w-full h-2.5 opacity-40 flex items-center gap-0.5 overflow-hidden">
                        {Array.from({ length: Math.min(25, Math.floor(clipWidth / 4)) }).map(
                          (_, idx) => (
                            <div
                              key={idx}
                              style={{ height: `${20 + (idx * 17) % 80}%` }}
                              className="w-1 bg-white rounded-full shrink-0"
                            />
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
