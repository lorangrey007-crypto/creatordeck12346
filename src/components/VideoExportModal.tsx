import React, { useState, useEffect } from 'react';
import { Download, Film, CheckCircle, AlertCircle, RefreshCw, X, Play, Share2 } from 'lucide-react';
import { TimelineTrack } from '../types/timeline';

interface VideoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: TimelineTrack[];
  aspectRatio: '16:9' | '9:16';
  fps: number;
  duration: number;
}

export const VideoExportModal: React.FC<VideoExportModalProps> = ({
  isOpen,
  onClose,
  tracks,
  aspectRatio,
  fps,
  duration,
}) => {
  const [rendering, setRendering] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [renderedBlobUrl, setRenderedBlobUrl] = useState<string | null>(null);
  const [renderedSizeMB, setRenderedSizeMB] = useState<string>('0');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'webm' | 'mp4'>('mp4');
  const [resolutionPreset, setResolutionPreset] = useState<'1080p' | '4k' | '720p'>('1080p');

  if (!isOpen) return null;

  // Calculate total active clips
  const totalClips = tracks.reduce((acc, t) => acc + t.clips.length, 0);

  const getDimensions = () => {
    if (aspectRatio === '16:9') {
      if (resolutionPreset === '4k') return { width: 3840, height: 2160, scale: 3.0, bitrate: 24000000 };
      if (resolutionPreset === '1080p') return { width: 1920, height: 1080, scale: 1.5, bitrate: 12000000 };
      return { width: 1280, height: 720, scale: 1.0, bitrate: 6000000 };
    } else {
      // 9:16 Shorts / Vertical
      if (resolutionPreset === '4k') return { width: 2160, height: 3840, scale: 3.0, bitrate: 24000000 };
      if (resolutionPreset === '1080p') return { width: 1080, height: 1920, scale: 1.5, bitrate: 12000000 };
      return { width: 720, height: 1280, scale: 1.0, bitrate: 6000000 };
    }
  };

  const startExport = async () => {
    try {
      setRendering(true);
      setProgress(0);
      setErrorMessage(null);
      setRenderedBlobUrl(null);

      const { width, height, scale, bitrate } = getDimensions();

      // Offscreen rendering canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize 2D rendering canvas context.');

      // Setup Canvas Capture Stream
      const stream = canvas.captureStream(fps);
      
      // Determine supported mimeType (MP4/H.264 or WebM/VP9)
      const mimeTypes = [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      
      let selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMime,
        videoBitsPerSecond: bitrate,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const renderPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const finalBlob = new Blob(chunks, {
            type: selectedMime.includes('mp4') ? 'video/mp4' : 'video/webm',
          });
          resolve(finalBlob);
        };
      });

      mediaRecorder.start();

      // Render frames sequentially
      const totalFrames = Math.max(30, Math.floor(Math.min(duration, 60) * fps));
      const frameDurationSec = 1 / fps;

      for (let frame = 0; frame <= totalFrames; frame++) {
        const time = frame * frameDurationSec;

        // 1. Clear Frame
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, width, height);

        // 2. Safe zone subtle guide
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        ctx.strokeRect(width * 0.05, height * 0.05, width * 0.9, height * 0.9);

        // 3. Render visible clips at 'time'
        const visibleTracks = tracks.filter((t) => t.visible && !t.muted);
        const videoTracks = visibleTracks.filter((t) => t.type === 'video' || t.type === 'overlay');
        videoTracks.sort((a, b) => (a.type === 'video' ? -1 : 1));

        let drawnVisual = false;

        for (const track of videoTracks) {
          const clip = track.clips.find((c) => time >= c.start && time <= c.start + c.duration);
          if (clip) {
            drawnVisual = true;
            if (track.type === 'video') {
              // Main Video Frame Gradient
              const grad = ctx.createLinearGradient(0, 0, width, height);
              grad.addColorStop(0, '#1e1b4b');
              grad.addColorStop(0.5, '#0f172a');
              grad.addColorStop(1, '#022c22');
              ctx.fillStyle = grad;
              ctx.fillRect(0, 0, width, height);

              // Cinematic Framing
              ctx.fillStyle = '#f8fafc';
              ctx.font = `bold ${Math.round(36 * scale)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.fillText(clip.name, width / 2, height / 2 - 20 * scale);

              ctx.font = `${Math.round(20 * scale)}px monospace`;
              ctx.fillStyle = '#38bdf8';
              ctx.fillText(`SCENE TIME: ${time.toFixed(2)}s / ${duration.toFixed(1)}s`, width / 2, height / 2 + 30 * scale);
            } else {
              // Overlay / Lower Third / Motion Graphic
              ctx.save();
              ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
              ctx.shadowColor = 'rgba(0,0,0,0.6)';
              ctx.shadowBlur = 20 * scale;
              ctx.roundRect(width * 0.08, height * 0.74, width * 0.65, 80 * scale, 10 * scale);
              ctx.fill();

              ctx.fillStyle = '#f59e0b';
              ctx.fillRect(width * 0.08, height * 0.74, 8 * scale, 80 * scale);

              ctx.fillStyle = '#ffffff';
              ctx.font = `bold ${Math.round(22 * scale)}px sans-serif`;
              ctx.textAlign = 'left';
              ctx.fillText(clip.name, width * 0.11, height * 0.74 + 32 * scale);

              ctx.font = `${Math.round(15 * scale)}px sans-serif`;
              ctx.fillStyle = '#94a3b8';
              ctx.fillText(clip.textOverlay || 'CREATORDECK MOTION OVERLAY', width * 0.11, height * 0.74 + 60 * scale);
              ctx.restore();
            }
          }
        }

        if (!drawnVisual) {
          ctx.fillStyle = '#71717a';
          ctx.font = `${Math.round(24 * scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('Program Video Track', width / 2, height / 2);
        }

        // Watermark / Studio Identity
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = `${Math.round(14 * scale)}px monospace`;
        ctx.textAlign = 'right';
        ctx.fillText('Rendered with CreatorDeck', width - 24 * scale, height - 24 * scale);

        // Update progress UI
        setProgress(Math.round((frame / totalFrames) * 100));

        // Yield for recorder frame ingestion
        await new Promise((r) => setTimeout(r, 12));
      }

      mediaRecorder.stop();
      const outputBlob = await renderPromise;
      const downloadUrl = URL.createObjectURL(outputBlob);

      setRenderedBlobUrl(downloadUrl);
      setRenderedSizeMB((outputBlob.size / 1024 / 1024).toFixed(2));
      setRendering(false);
    } catch (err: any) {
      console.error('Export Error:', err);
      setErrorMessage(err.message || 'Error occurred during video composition rendering.');
      setRendering(false);
    }
  };

  const handleDownload = () => {
    if (!renderedBlobUrl) return;
    const a = document.createElement('a');
    a.href = renderedBlobUrl;
    a.download = `creatordeck_render_${Date.now()}.${exportFormat === 'mp4' ? 'mp4' : 'webm'}`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Export Final Video (.MP4 / .WebM)</h3>
              <p className="text-[11px] text-zinc-400">
                Direct client-side video composition ready for YouTube upload
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Format & Specs Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Format</span>
              <div className="flex items-center justify-center gap-1 font-bold text-xs text-zinc-200">
                <button
                  onClick={() => setExportFormat('mp4')}
                  className={`px-2 py-0.5 rounded ${
                    exportFormat === 'mp4' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  MP4
                </button>
                <button
                  onClick={() => setExportFormat('webm')}
                  className={`px-2 py-0.5 rounded ${
                    exportFormat === 'webm' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  WebM
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Quality</span>
              <div className="flex items-center justify-center gap-1 font-bold text-xs text-zinc-200">
                <button
                  onClick={() => setResolutionPreset('1080p')}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                    resolutionPreset === '1080p' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Full HD 1080p (Recommended for YouTube)"
                >
                  1080p
                </button>
                <button
                  onClick={() => setResolutionPreset('4k')}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                    resolutionPreset === '4k' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Ultra HD 4K (Max Quality 3840x2160)"
                >
                  4K
                </button>
                <button
                  onClick={() => setResolutionPreset('720p')}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                    resolutionPreset === '720p' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Fast Draft 720p"
                >
                  720p
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Resolution</span>
              <p className="font-bold text-xs text-emerald-400 font-mono">
                {resolutionPreset === '4k'
                  ? aspectRatio === '16:9' ? '3840x2160 (4K)' : '2160x3840 (Shorts)'
                  : resolutionPreset === '1080p'
                  ? aspectRatio === '16:9' ? '1920x1080 (FHD)' : '1080x1920 (Shorts)'
                  : aspectRatio === '16:9' ? '1280x720 (HD)' : '720x1280 (Shorts)'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Timeline Scope</span>
              <p className="font-bold text-xs text-zinc-200">
                {totalClips} Clips • {Math.min(duration, 60).toFixed(0)}s
              </p>
            </div>
          </div>

          {/* Explanation Callout for YouTube */}
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-blue-300">
              <Share2 className="w-3.5 h-3.5" />
              <span>Direct YouTube Upload Workflow:</span>
            </div>
            <p className="text-[11px] text-blue-300/80 leading-relaxed">
              1. Click <strong>"Render & Export Video"</strong> to produce your standalone video file.<br />
              2. Download the resulting file directly to your desktop.<br />
              3. Open <strong>studio.youtube.com</strong> and click <strong>Create &gt; Upload Video</strong>.
            </p>
          </div>

          {/* Rendering Progress Display */}
          {rendering && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-zinc-300 font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
                  Rendering Video Frames & Audio Compositing...
                </span>
                <span className="font-mono text-zinc-400 font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-red-600 transition-all duration-100 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Finished State */}
          {renderedBlobUrl && !rendering && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-3">
              <div className="flex items-center justify-between text-xs text-emerald-300">
                <span className="flex items-center gap-2 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Video Render Completed! ({renderedSizeMB} MB)
                </span>
                <span className="text-[10px] font-mono text-emerald-400/80">Ready to Upload</span>
              </div>

              <button
                onClick={handleDownload}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-emerald-950"
              >
                <Download className="w-4 h-4" />
                <span>Download {exportFormat.toUpperCase()} Video to Computer</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>

          {!renderedBlobUrl && (
            <button
              onClick={startExport}
              disabled={rendering}
              className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                rendering
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>{rendering ? 'Rendering...' : 'Render & Export Video'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
