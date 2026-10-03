import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  HardDrive, 
  FileJson, 
  CheckCircle2, 
  AlertCircle, 
  Clapperboard, 
  FileText, 
  Globe, 
  AudioWaveform, 
  Sparkles, 
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { 
  CreatorDeckBackup, 
  BackupSummary, 
  buildProjectBackup, 
  downloadBackupToPc, 
  parseBackupFile, 
  restoreBackupToStorage 
} from '../services/projectBackupService';
import { ScriptTab, VoiceProfile, CustomAudioStyle, PronunciationRule, MasteringSettings } from '../types';

interface ProjectBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: ScriptTab[];
  activeTabId: string;
  customVoices: VoiceProfile[];
  customStyles: CustomAudioStyle[];
  pronunciations: PronunciationRule[];
  mastering: MasteringSettings;
  onProjectRestored: (backup: CreatorDeckBackup) => void;
}

export const ProjectBackupModal: React.FC<ProjectBackupModalProps> = ({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  customVoices,
  customStyles,
  pronunciations,
  mastering,
  onProjectRestored,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'export' | 'import'>('export');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Import states
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<CreatorDeckBackup | null>(null);
  const [backupSummary, setBackupSummary] = useState<BackupSummary | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Build current snapshot summary for export tab
  const currentBackup = buildProjectBackup(
    tabs,
    activeTabId,
    customVoices,
    customStyles,
    pronunciations,
    mastering
  );

  const handleExportNow = () => {
    downloadBackupToPc(currentBackup);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const processFile = async (file: File) => {
    setImportError(null);
    setParsedBackup(null);
    setBackupSummary(null);

    if (!file.name.endsWith('.json')) {
      setImportError('Please select a valid .json project backup file.');
      return;
    }

    try {
      const { backup, summary } = await parseBackupFile(file);
      setImportedFile(file);
      setParsedBackup(backup);
      setBackupSummary(summary);
    } catch (err: any) {
      setImportError(err.message || 'Failed to read project backup file.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleConfirmRestore = () => {
    if (!parsedBackup) return;
    setIsRestoring(true);
    try {
      restoreBackupToStorage(parsedBackup);
      onProjectRestored(parsedBackup);
      onClose();
    } catch (e: any) {
      setImportError('Failed to apply backup to local storage: ' + (e?.message || e));
      setIsRestoring(false);
    }
  };

  return (
    <div 
      id="modal-project-backup"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div 
        className="bg-white dark:bg-[#12131a] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                Save & Load Project on PC
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 font-mono font-medium">
                  Offline JSON
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Keep all scripts, B-Roll, voice takes, and SEO safe on your local drive.
              </p>
            </div>
          </div>
          <button
            id="btn-close-backup-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6 bg-zinc-50/50 dark:bg-zinc-900/40 shrink-0">
          <button
            id="tab-backup-export"
            type="button"
            onClick={() => setActiveSubTab('export')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'export'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Save to PC (Export)</span>
          </button>
          <button
            id="tab-backup-import"
            type="button"
            onClick={() => setActiveSubTab('import')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'import'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Load from PC (Restore)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeSubTab === 'export' ? (
            <>
              {/* Context Callout */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950 dark:text-blue-200 leading-relaxed">
                  <span className="font-semibold">Never lose your work to API limits:</span> If your daily Gemini quota ends, save this file to your computer. You can reload it tomorrow, use it with another API key, or keep it as a production archive.
                </div>
              </div>

              {/* What will be saved */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Included in this Backup:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {tabs.length} Script Tab{tabs.length === 1 ? '' : 's'}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[170px]">
                        {tabs[0]?.title || 'Scripts'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center gap-2.5">
                    <Clapperboard className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        B-Roll & Visuals
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {currentBackup.brollStudio?.result?.shotSheet?.length || 0} shots, {currentBackup.brollStudio?.result?.thumbnails?.length || 0} concepts
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        YouTube SEO
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {currentBackup.seoStudio?.result?.titles?.length ? `${currentBackup.seoStudio.result.titles.length} titles & tags` : 'Ready to save'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center gap-2.5">
                    <AudioWaveform className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Voice & Audio Setup
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Mastering, {customVoices.length} voices, {pronunciations.length} rules
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  id="btn-download-project-backup"
                  type="button"
                  onClick={handleExportNow}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup File to PC (.json)</span>
                </button>
              </div>

              {downloadSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Project file downloaded to your PC! You can safely restore it anytime.</span>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Import Tab */}
              <div
                id="dropzone-backup-file"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30' 
                    : 'border-zinc-300 dark:border-zinc-700 hover:border-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                  <FileJson className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {importedFile ? importedFile.name : 'Click to select or drag & drop backup file'}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Supports any <code className="font-mono text-blue-600 dark:text-blue-400 font-semibold">.json</code> project backup generated by CreatorDeck
                </p>
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Summary of parsed file */}
              {backupSummary && (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Backup Verified: {backupSummary.projectName}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {new Date(backupSummary.exportedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-white dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/70">
                      <div className="text-zinc-500 dark:text-zinc-400 text-[10px]">Scripts</div>
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {backupSummary.tabCount} Script Tab{backupSummary.tabCount === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/70">
                      <div className="text-zinc-500 dark:text-zinc-400 text-[10px]">Visuals</div>
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {backupSummary.brollSceneCount} B-Roll cuts, {backupSummary.thumbnailCount} Thumbs
                      </div>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/70">
                      <div className="text-zinc-500 dark:text-zinc-400 text-[10px]">SEO Status</div>
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {backupSummary.hasSeo ? `${backupSummary.seoTitleCount} Titles & Tags` : 'None'}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/70">
                      <div className="text-zinc-500 dark:text-zinc-400 text-[10px]">Audio Settings</div>
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {backupSummary.voiceCount} Custom Voices, {backupSummary.dictionaryCount} Rules
                      </div>
                    </div>
                  </div>

                  <button
                    id="btn-confirm-restore-backup"
                    type="button"
                    onClick={handleConfirmRestore}
                    disabled={isRestoring}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                    <span>Restore Project to Workspace</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
          <span>Backups are stored purely on your computer.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
