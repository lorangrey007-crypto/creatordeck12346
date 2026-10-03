import React, { useState, useRef } from 'react';
import { X, UploadCloud, Check, AlertCircle, Sparkles, Mic } from 'lucide-react';
import { VoiceProfile, TTSEngine } from '../types';
import { extractVoiceCloneProfile } from '../services/voiceCloning';

interface VoiceCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveClonedVoice: (voice: VoiceProfile) => void;
  currentEngine: TTSEngine;
}

export const VoiceCloneModal: React.FC<VoiceCloneModalProps> = ({
  isOpen,
  onClose,
  onSaveClonedVoice,
  currentEngine,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    if (!file.type.includes('audio') && !file.name.endsWith('.mp3') && !file.name.endsWith('.wav')) {
      setErrorMsg('Please upload a standard .wav or .mp3 audio file.');
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
    if (!voiceName) {
      setVoiceName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleExtractAndSave = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const clonedProfile = await extractVoiceCloneProfile(
        selectedFile,
        voiceName || 'Custom Cloned Voice',
        currentEngine
      );
      onSaveClonedVoice(clonedProfile);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not extract acoustic profile. Please try a different .wav/.mp3 audio clip.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#111317] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Instant Voice Cloning
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          Drop any clean 10–30 second audio clip (.wav or .mp3) of a speaker. The engine extracts the speaker&apos;s acoustic timbre and adds it permanently to your voice library.
        </p>

        {/* Drag & Drop Box */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800'
              : selectedFile
              ? 'border-emerald-500/60 bg-emerald-500/5'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-900/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.wav,.mp3"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="space-y-1 text-xs">
              <Check className="w-6 h-6 text-emerald-500 mx-auto" />
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedFile.name}</p>
              <p className="text-[11px] text-zinc-400 font-mono">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to clone
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <UploadCloud className="w-6 h-6 text-zinc-400 mx-auto" />
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                Drag and drop your audio clip here
              </p>
              <p className="text-[11px] text-zinc-500">or click to browse files</p>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Voice Name Input */}
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
            Voice Name:
          </label>
          <input
            type="text"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            placeholder="e.g. Narrative Documentary Voice"
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-hidden focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExtractAndSave}
            disabled={!selectedFile || isProcessing}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              !selectedFile || isProcessing
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                : 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 active:scale-95 shadow-xs cursor-pointer'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Extracting Voice DNA...' : 'Clone Voice'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
