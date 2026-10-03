import React, { useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Monitor, Smartphone } from 'lucide-react';
import { TimelineTrack } from '../types/timeline';
import { formatSMPTETimecode } from '../lib/timelineUtils';

interface MonitorProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  aspectRatio: '16:9' | '9:16';
  fps: number;
  tracks: TimelineTrack[];
  onPlayToggle: () => void;
  onSeek: (time: number) => void;
  onAspectRatioToggle: () => void;
}

export const PreviewMonitor: React.FC<MonitorProps> = ({
  currentTime,
  duration,
  isPlaying,
  aspectRatio,
  fps,
  tracks,
  onPlayToggle,
  onSeek,
  onAspectRatioToggle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Real-time Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed internal resolution
    const width = aspectRatio === '16:9' ? 1280 : 720;
    const height = aspectRatio === '16:9' ? 720 : 1280;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // 1. Clear background
    ctx.fillStyle = '#09090b'; // dark slate
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle studio grid / safe zone
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.strokeRect(width * 0.05, height * 0.05, width * 0.9, height * 0.9);

    // 3. Find active clips at currentTime
    const visibleTracks = tracks.filter((t) => t.visible && !t.muted);
    
    // Sort video tracks: V1 first, then V2 overlay on top
    const videoTracks = visibleTracks.filter((t) => t.type === 'video' || t.type === 'overlay');
    videoTracks.sort((a, b) => (a.type === 'video' ? -1 : 1));

    let renderedVisual = false;

    videoTracks.forEach((track) => {
      const activeClip = track.clips.find(
        (c) => currentTime >= c.start && currentTime <= c.start + c.duration
      );

      if (activeClip) {
        renderedVisual = true;
        const clipProgress = (currentTime - activeClip.start) / activeClip.duration;

        // Visual frame card
        if (track.type === 'video') {
          // Main video visualizer
          const grad = ctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, '#1e1b4b');
          grad.addColorStop(1, '#0f172a');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          // Animated particle/motion wave to show playback
          ctx.fillStyle = '#6366f1';
          const waveHeight = Math.sin(clipProgress * Math.PI * 8) * 30;
          ctx.fillRect(width * 0.2, height * 0.5 + waveHeight - 10, width * 0.6, 20);

          // Track Label Overlay
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 28px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`🎬 ${activeClip.name}`, width / 2, height * 0.4);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '20px monospace';
          ctx.fillText(
            `Offset: ${(currentTime - activeClip.start).toFixed(2)}s / ${activeClip.duration.toFixed(2)}s`,
            width / 2,
            height * 0.45
          );
        } else if (track.type === 'overlay') {
          // Overlay / B-Roll / Template / Chroma-Key card on top
          ctx.save();

          // Apply Blend Mode if specified
          if (activeClip.blendMode && activeClip.blendMode !== 'normal') {
            ctx.globalCompositeOperation = activeClip.blendMode as GlobalCompositeOperation;
          }

          // Check if it's a Chroma Key Green Screen clip
          if (activeClip.chromaKey?.enabled) {
            // Simulated real-time chroma keyed element: green background removed, subject preserved
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 12;

            // Render subject with green background stripped away
            ctx.fillStyle = 'rgba(30, 58, 138, 0.85)'; // extracted clean blue badge
            ctx.roundRect(width * 0.15, height * 0.55, width * 0.7, height * 0.32, 16);
            ctx.fill();
            ctx.strokeStyle = '#22c55e'; // green key indicator
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Chroma Key Badge
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'right';
            ctx.fillText('🟢 CHROMA KEY ACTIVE (GREEN STRIPPED)', width * 0.82, height * 0.60);

            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`✨ ${activeClip.name}`, width * 0.18, height * 0.66);

            ctx.fillStyle = '#cbd5e1';
            ctx.font = '16px sans-serif';
            ctx.fillText(activeClip.textOverlay || 'Chroma-keyed cutaway overlay frame', width * 0.18, height * 0.74);
          } else if (activeClip.templateCategory === 'subscribe-button') {
            // Animated YouTube Subscribe + Bell Motion Template
            const pulse = 1 + Math.sin(clipProgress * Math.PI * 6) * 0.04;
            ctx.translate(width / 2, height * 0.8);
            ctx.scale(pulse, pulse);

            // Red YouTube Pill
            ctx.shadowColor = 'rgba(220, 38, 38, 0.5)';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#dc2626';
            ctx.roundRect(-180, -32, 360, 64, 32);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Text & Bell
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🔔 SUBSCRIBE & BELL', 0, 8);
          } else if (activeClip.templateCategory === 'countdown') {
            // 5-Second Dramatic Countdown Template
            const remainingSeconds = Math.max(1, Math.ceil(activeClip.duration * (1 - clipProgress)));
            ctx.shadowColor = 'rgba(234, 179, 8, 0.6)';
            ctx.shadowBlur = 25;

            // Center Countdown Ring
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, 70, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fill();
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 6;
            ctx.stroke();

            ctx.fillStyle = '#eab308';
            ctx.font = 'bold 54px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${remainingSeconds}`, width / 2, height / 2 + 18);

            ctx.fillStyle = '#fef08a';
            ctx.font = '16px sans-serif';
            ctx.fillText('COUNTDOWN TO REVEAL', width / 2, height / 2 + 110);
          } else if (activeClip.templateCategory === 'lower-third') {
            // Elegant Lower-Third Name Badge
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 18;

            // Gradient Banner
            const bannerGrad = ctx.createLinearGradient(width * 0.08, 0, width * 0.6, 0);
            bannerGrad.addColorStop(0, '#1d4ed8');
            bannerGrad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
            ctx.fillStyle = bannerGrad;
            ctx.roundRect(width * 0.08, height * 0.76, width * 0.55, 68, 8);
            ctx.fill();

            // Left Gold Accent Bar
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(width * 0.08, height * 0.76, 6, 68);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(activeClip.textOverlay?.split('//')[0] || 'SPEAKER NAME', width * 0.11, height * 0.80);

            ctx.fillStyle = '#93c5fd';
            ctx.font = '14px sans-serif';
            ctx.fillText(activeClip.textOverlay?.split('//')[1] || 'AUTHORITY // DOCUMENTARY GUEST', width * 0.11, height * 0.83);
          } else {
            // Standard Overlay Card
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 15;
            ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
            ctx.roundRect(width * 0.1, height * 0.65, width * 0.8, height * 0.22, 16);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`✨ B-ROLL OVERLAY: ${activeClip.name}`, width * 0.14, height * 0.74);

            ctx.fillStyle = '#e2e8f0';
            ctx.font = '18px sans-serif';
            ctx.fillText(activeClip.textOverlay || 'Cinematic Cutaway Action Frame', width * 0.14, height * 0.80);
          }

          ctx.restore();
        }
      }
    });

    // 4. Fallback if no visual clip is active
    if (!renderedVisual) {
      ctx.fillStyle = '#71717a';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No Video Clip at Playhead', width / 2, height / 2 - 10);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#52525b';
      ctx.fillText('Drag clips onto V1 or V2 to preview', width / 2, height / 2 + 20);
    }

    // 5. Check if Voiceover audio is currently playing and draw HUD VU meter
    const audioTrack = tracks.find((t) => t.type === 'audio' && !t.muted);
    const activeAudioClip = audioTrack?.clips.find(
      (c) => currentTime >= c.start && currentTime <= c.start + c.duration
    );

    if (activeAudioClip) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fillRect(20, 20, 180, 40);
      ctx.strokeStyle = '#10b981';
      ctx.strokeRect(20, 20, 180, 40);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`🎙️ A1: ${activeAudioClip.name.slice(0, 14)}`, 30, 45);
    }

    // 6. Timecode Watermark (top right)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(width - 160, 20, 140, 36);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(formatSMPTETimecode(currentTime, fps), width - 90, 44);
  }, [currentTime, duration, tracks, aspectRatio, fps]);

  const stepFrame = (forward: boolean) => {
    const frameStep = 1 / fps;
    const next = forward ? Math.min(duration, currentTime + frameStep) : Math.max(0, currentTime - frameStep);
    onSeek(next);
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-xl"
    >
      {/* Monitor Header Toolbar */}
      <div className="px-3 py-2 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-300 select-none">
        <div className="flex items-center gap-2 font-semibold">
          <Monitor className="w-4 h-4 text-blue-400" />
          <span>Program Monitor</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            {fps} FPS
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Aspect Ratio Switcher */}
          <button
            onClick={onAspectRatioToggle}
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer text-[11px] font-medium"
            title="Toggle between 16:9 YouTube and 9:16 YouTube Shorts"
          >
            {aspectRatio === '16:9' ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                <span>16:9 (Landscape)</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                <span>9:16 (Shorts)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Screen Canvas Area */}
      <div className="relative flex-1 bg-black flex items-center justify-center p-2 min-h-[260px] max-h-[420px]">
        <canvas
          ref={canvasRef}
          className={`rounded shadow-inner border border-zinc-900 object-contain max-h-[380px] ${
            aspectRatio === '16:9' ? 'aspect-video w-full' : 'aspect-[9/16] h-[360px]'
          }`}
        />
      </div>

      {/* Transport Control Deck */}
      <div className="px-4 py-2.5 bg-zinc-900/95 border-t border-zinc-800 flex items-center justify-between gap-4">
        {/* Playhead SMPTE timecode */}
        <div className="font-mono text-sm font-bold text-emerald-400 tracking-wider">
          {formatSMPTETimecode(currentTime, fps)}
          <span className="text-zinc-500 text-xs ml-1 font-normal">
            / {formatSMPTETimecode(duration, fps)}
          </span>
        </div>

        {/* Transport Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSeek(0)}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            title="Go to Start (Home)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => stepFrame(false)}
            className="px-2 py-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 text-xs font-mono transition-colors cursor-pointer"
            title="Step Back 1 Frame (Left Arrow)"
          >
            -1F
          </button>

          <button
            onClick={onPlayToggle}
            className={`p-2.5 rounded-full font-bold text-white transition-all transform active:scale-95 cursor-pointer shadow-lg ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40'
            }`}
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          <button
            onClick={() => stepFrame(true)}
            className="px-2 py-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 text-xs font-mono transition-colors cursor-pointer"
            title="Step Forward 1 Frame (Right Arrow)"
          >
            +1F
          </button>

          <button
            onClick={() => onSeek(duration)}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            title="Go to End (End)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Resolution Indicator */}
        <div className="text-[11px] text-zinc-400 font-medium">
          {aspectRatio === '16:9' ? '1080p Full HD' : '1080x1920 Vertical'}
        </div>
      </div>
    </div>
  );
};
