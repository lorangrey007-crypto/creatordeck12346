import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download, 
  FileText, 
  FolderArchive, 
  RefreshCw, 
  Layers, 
  Check 
} from 'lucide-react';
import JSZip from 'jszip';
import { ParsedSegment } from '../types';
import { audioBufferToWavBlob } from '../services/audioMastering';

interface TimelinePlayerProps {
  audioBuffer: AudioBuffer | null;
  wavBlob: Blob | null;
  srtContent: string;
  segments: ParsedSegment[];
  scriptTitle: string;
  onReRollSegment: (segmentIndex: number) => void;
  isAuditioningAmbience: boolean;
}

export const TimelinePlayer: React.FC<TimelinePlayerProps> = ({
  audioBuffer,
  wavBlob,
  srtContent,
  segments,
  scriptTitle,
  onReRollSegment,
  isAuditioningAmbience,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [showSentenceList, setShowSentenceList] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [exportFormat, setExportFormat] = useState<'wav' | 'mp3'>('wav');

  // Web Audio playback node refs
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const totalDuration = audioBuffer ? audioBuffer.duration : 0;

  // Initialize or get audio context
  const getPlayerCtx = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Stop playback on buffer change
  useEffect(() => {
    stopPlayback();
    pausedAtRef.current = 0;
    setCurrentTime(0);
  }, [audioBuffer]);

  // Draw waveform - sleek monochromatic studio waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const isDark = document.documentElement.classList.contains('dark');

    ctx.clearRect(0, 0, width, height);

    if (!audioBuffer) {
      // Draw subtle empty guide line
      ctx.strokeStyle = isDark ? '#27272a' : '#e4e4e7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    const progressRatio = totalDuration > 0 ? currentTime / totalDuration : 0;
    const progressX = width * progressRatio;

    const playedColor = isDark ? '#ffffff' : '#09090b';
    const unplayedColor = isDark ? '#27272a' : '#e2e8f0';

    // Draw waveform bars
    for (let i = 0; i < width; i += 2) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const barHeight = Math.max(3, (max - min) * amp * 0.95);
      const y = (height - barHeight) / 2;

      ctx.fillStyle = i < progressX ? playedColor : unplayedColor;
      ctx.fillRect(i, y, 1.5, barHeight);
    }

    // Draw Playhead line
    ctx.strokeStyle = isDark ? '#ffffff' : '#09090b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(progressX, 0);
    ctx.lineTo(progressX, height);
    ctx.stroke();
  }, [audioBuffer, currentTime, totalDuration]);

  // Playback loop
  const startPlayback = () => {
    if (!audioBuffer) return;
    const ctx = getPlayerCtx();

    // Create source
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = playbackRate;

    const gainNode = ctx.createGain();
    gainNode.gain.value = isMuted ? 0 : volume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    const offset = pausedAtRef.current;
    source.start(0, offset);

    startTimeRef.current = ctx.currentTime - offset / playbackRate;
    audioSourceRef.current = source;
    gainNodeRef.current = gainNode;
    setIsPlaying(true);

    source.onended = () => {
      setIsPlaying(false);
      pausedAtRef.current = 0;
      setCurrentTime(0);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };

    const updateTime = () => {
      if (!audioSourceRef.current) return;
      const played = (ctx.currentTime - startTimeRef.current) * playbackRate;
      if (played >= totalDuration) {
        setCurrentTime(totalDuration);
        setIsPlaying(false);
        pausedAtRef.current = 0;
        return;
      }
      setCurrentTime(played);
      animFrameRef.current = requestAnimationFrame(updateTime);
    };

    animFrameRef.current = requestAnimationFrame(updateTime);
  };

  const stopPlayback = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch {
        // Ignored
      }
      audioSourceRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pausedAtRef.current = currentTime;
      stopPlayback();
    } else {
      if (currentTime >= totalDuration) {
        pausedAtRef.current = 0;
        setCurrentTime(0);
      }
      startPlayback();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = x / rect.width;
    const newTime = ratio * totalDuration;

    pausedAtRef.current = newTime;
    setCurrentTime(newTime);

    if (isPlaying) {
      stopPlayback();
      startPlayback();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs - Math.floor(secs)) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  // Downloads
  const downloadMasterWav = () => {
    if (!wavBlob) return;
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scriptTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_master.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSrt = () => {
    if (!srtContent) return;
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scriptTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_captions.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSplitClipsZip = async () => {
    if (!segments || segments.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('voice_clips') || zip;

      let clipCounter = 1;
      for (const seg of segments) {
        if (seg.audioBuffer) {
          const segWavBlob = audioBufferToWavBlob(seg.audioBuffer);
          const safeName = `clip_${String(clipCounter++).padStart(3, '0')}_${seg.cleanText.slice(0, 15).replace(/[^a-z0-9]/gi, '_')}.wav`;
          folder.file(safeName, segWavBlob);
        }
      }

      // Also include the SRT
      if (srtContent) {
        folder.file('synchronized_captions.srt', srtContent);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${scriptTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_split_clips.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create split zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#111317] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 shadow-xs space-y-4 transition-colors">
      {/* Waveform & Timecode Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-play-pause"
            onClick={togglePlayPause}
            disabled={!audioBuffer}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              !audioBuffer
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                : 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 active:scale-95 shadow-xs'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <div className="font-mono text-xs text-zinc-900 dark:text-zinc-100 font-medium">
            <span>{formatTime(currentTime)}</span>
            <span className="text-zinc-400 mx-1">/</span>
            <span className="text-zinc-500">{formatTime(totalDuration)}</span>
          </div>

          {isAuditioningAmbience && (
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              Ambience Active
            </span>
          )}
        </div>

        {/* Speed & Volume */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-400 text-[11px]">Speed:</span>
            {[1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => setPlaybackRate(rate)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  playbackRate === rate
                    ? 'bg-white dark:bg-zinc-800 font-semibold text-zinc-950 dark:text-white shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Interactive Waveform Canvas */}
      <div className="relative w-full h-20 bg-zinc-50 dark:bg-[#0c0d12] rounded-lg border border-zinc-200/80 dark:border-zinc-800 overflow-hidden cursor-pointer">
        <canvas
          ref={canvasRef}
          width={800}
          height={80}
          onClick={handleSeek}
          className="w-full h-full block"
        />
        {!audioBuffer && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500 dark:text-zinc-400 font-sans pointer-events-none">
            Click &quot;Generate Speech&quot; to synthesize audio
          </div>
        )}
      </div>

      {/* Sentence Inspector / Re-Roll Drawer Toggle */}
      {segments.length > 0 && (
        <div>
          <button
            onClick={() => setShowSentenceList(!showSentenceList)}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {showSentenceList ? 'Hide Sentences' : `Inspect & Re-Roll Sentences (${segments.length})`}
            </span>
          </button>

          {showSentenceList && (
            <div className="mt-2.5 max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-zinc-200/80 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50/50 dark:bg-zinc-950/40">
              {segments.map((seg, idx) => (
                <div
                  key={seg.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] text-zinc-400 shrink-0">
                      #{idx + 1}
                    </span>
                    <p className="truncate font-sans text-zinc-800 dark:text-zinc-200">
                      {seg.cleanText || (seg.reactionSound ? `[Reaction: ${seg.reactionSound}]` : '[Pause Gap]')}
                    </p>
                    {seg.tags.length > 0 && (
                      <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {seg.tags.join(' ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] text-zinc-500">
                      {seg.durationSec ? `${seg.durationSec.toFixed(1)}s` : '0.0s'}
                    </span>
                    <button
                      onClick={() => onReRollSegment(idx)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition-colors"
                      title="Re-roll only this sentence with new vocal inflection"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Re-Roll</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Broadcast Export Suite */}
      <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Format toggle (.wav / .mp3) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Format:</span>
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
            <button
              onClick={() => setExportFormat('wav')}
              className={`px-2 py-0.5 rounded-md font-mono transition-all ${
                exportFormat === 'wav'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              .WAV (Studio)
            </button>
            <button
              onClick={() => setExportFormat('mp3')}
              className={`px-2 py-0.5 rounded-md font-mono transition-all ${
                exportFormat === 'mp3'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              .MP3
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Synchronized SRT Captions */}
          <button
            id="btn-export-srt"
            onClick={downloadSrt}
            disabled={!srtContent}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !srtContent
                ? 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-400 cursor-not-allowed'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
            }`}
            title="Download tag-free, synchronized .SRT subtitle file"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export .SRT</span>
          </button>

          {/* Numbered Split Clips ZIP */}
          <button
            id="btn-export-zip"
            onClick={downloadSplitClipsZip}
            disabled={!audioBuffer || isZipping}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !audioBuffer || isZipping
                ? 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-400 cursor-not-allowed'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
            }`}
            title="Export all sentences as numbered individual clips in a single .ZIP"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>{isZipping ? 'Zipping...' : 'Split Clips (.ZIP)'}</span>
          </button>

          {/* Primary Master Lossless WAV Button */}
          <button
            id="btn-export-master-wav"
            onClick={downloadMasterWav}
            disabled={!wavBlob}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !wavBlob
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                : 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 active:scale-95 shadow-xs cursor-pointer'
            }`}
            title="Export master audio track"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Master</span>
          </button>
        </div>
      </div>
    </div>
  );
};
