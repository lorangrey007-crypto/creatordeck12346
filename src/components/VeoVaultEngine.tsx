import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Folder,
  Film,
  Mic,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Download,
  Trash2,
  Search,
  Tag,
  Zap,
  CheckCircle,
  HardDrive,
  RefreshCw,
  Plus,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import { VaultAsset, VaultCategory, VaultFolder, VaultStats } from '../types/vault';
import {
  getAllVaultAssets,
  saveVaultAsset,
  deleteVaultAsset,
  incrementVaultAssetReuse,
  calculateVaultStats,
  DEFAULT_STARTER_VAULT_ASSETS,
} from '../services/vaultStorageService';

interface VeoVaultProps {
  onSendAssetToTimeline?: (asset: VaultAsset) => void;
  onOpenSettings?: () => void;
}

export const VeoVaultEngine: React.FC<VeoVaultProps> = ({
  onSendAssetToTimeline,
  onOpenSettings,
}) => {
  const [assets, setAssets] = useState<VaultAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<VaultCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<VaultAsset | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load Assets from Persistent IndexedDB
  const refreshAssets = async () => {
    try {
      setLoading(true);
      let items = await getAllVaultAssets();
      if (items.length === 0) {
        // Pre-seed with starter assets
        for (const item of DEFAULT_STARTER_VAULT_ASSETS) {
          await saveVaultAsset(item);
        }
        items = await getAllVaultAssets();
      }
      setAssets(items);
    } catch (err) {
      console.error('Error loading vault assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAssets();
  }, []);

  const stats: VaultStats = calculateVaultStats(assets);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Folder Definitions
  const folders: VaultFolder[] = [
    {
      id: 'fld-all',
      name: 'All Saved Media',
      description: 'Complete cached local archive',
      category: 'all',
      assetCount: assets.length,
      color: '#3b82f6',
    },
    {
      id: 'fld-hooks',
      name: 'Opening Hooks',
      description: 'First 5-second attention grabbers',
      category: 'hooks',
      assetCount: assets.filter((a) => a.category === 'hooks').length,
      color: '#ef4444',
    },
    {
      id: 'fld-broll',
      name: 'B-Roll & Cutaways',
      description: 'Cinematic video overlays & visuals',
      category: 'broll',
      assetCount: assets.filter((a) => a.category === 'broll').length,
      color: '#8b5cf6',
    },
    {
      id: 'fld-backgrounds',
      name: 'Atmospheric Backgrounds',
      description: 'Drone shots, loops & motion backdrops',
      category: 'backgrounds',
      assetCount: assets.filter((a) => a.category === 'backgrounds').length,
      color: '#10b981',
    },
    {
      id: 'fld-sfx',
      name: 'SFX & Music Beds',
      description: 'Drones, risers, and soundscapes',
      category: 'sfx',
      assetCount: assets.filter((a) => a.category === 'sfx').length,
      color: '#f59e0b',
    },
    {
      id: 'fld-voiceovers',
      name: 'Voice Takes Archive',
      description: 'Synthesized voice takes and hooks',
      category: 'voiceovers',
      assetCount: assets.filter((a) => a.category === 'voiceovers').length,
      color: '#06b6d4',
    },
  ];

  // Filtered Assets
  const filteredAssets = assets.filter((asset) => {
    const matchesCategory = activeCategory === 'all' || asset.category === activeCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (asset.description && asset.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  // Handle Local Disk Import (0 credits)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type: 'video' | 'audio' | 'image' = file.type.startsWith('video')
      ? 'video'
      : file.type.startsWith('audio')
      ? 'audio'
      : 'image';

    const newAsset: VaultAsset = {
      id: `vault-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      category: type === 'audio' ? 'sfx' : 'broll',
      type,
      durationSec: 5.0,
      tags: ['imported', 'local-disk', type],
      description: `Locally imported asset from disk (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      sourceModule: 'local-import',
      fileSizeBytes: file.size,
      aspectRatio: '16:9',
      createdAt: Date.now(),
      timesReused: 0,
    };

    await saveVaultAsset(newAsset);
    await refreshAssets();
    showToast(`Stored "${newAsset.name}" in Local Vault (0 Credits Used)!`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Reuse Asset into Timeline
  const handleReuseAsset = async (asset: VaultAsset) => {
    await incrementVaultAssetReuse(asset.id);
    await refreshAssets();
    if (onSendAssetToTimeline) {
      onSendAssetToTimeline(asset);
    }
    showToast(`Reused "${asset.name}" — 0 credits used! (+25 credits saved)`);
  };

  // Delete Asset
  const handleDeleteAsset = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm('Remove this asset from your local persistent vault?')) {
      await deleteVaultAsset(id);
      if (selectedAsset?.id === id) setSelectedAsset(null);
      await refreshAssets();
      showToast('Asset removed from local vault.');
    }
  };

  // Export Complete Vault as JSON Backup
  const handleExportVaultJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(assets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `veo_vault_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Vault database exported to disk.');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden select-none">
      {/* Top Banner & 0-Credit Metrics */}
      <div className="px-6 py-3.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-600/20 border border-purple-300 dark:border-purple-500/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Veo-Vault Engine
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-800/80">
                Step 4 • 0-Credit Persistent Database
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Persistent browser-indexed media vault. Archive once, reuse infinitely without consuming API quota.
            </p>
          </div>
        </div>

        {/* 0-Credit Scoreboard Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-400 text-xs">
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="font-bold font-mono">~{stats.totalSavedCredits}</span>
              <span className="text-[10px] text-emerald-600/90 dark:text-emerald-500/90 ml-1">Credits Saved</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs">
            <HardDrive className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <div>
              <span className="font-bold font-mono">
                {(stats.totalStorageBytes / 1024 / 1024).toFixed(1)} MB
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 ml-1">IndexedDB</span>
            </div>
          </div>

          {/* Action Buttons */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer transition-all shadow-xs"
            title="Import video or audio file from computer into local vault"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import to Vault</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*,image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            onClick={handleExportVaultJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700"
            title="Export vault metadata backup"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Backup</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-purple-100 dark:bg-purple-900/90 border-b border-purple-300 dark:border-purple-700 px-4 py-1.5 text-center text-xs font-semibold text-purple-900 dark:text-purple-100 flex items-center justify-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Folder Hierarchy (3.5 cols) */}
        <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4 flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <span>VAULT FOLDERS</span>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{assets.length} items</span>
          </div>

          <div className="space-y-1 overflow-y-auto flex-1">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setActiveCategory(folder.category)}
                className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                  activeCategory === folder.category
                    ? 'bg-purple-100 dark:bg-purple-950/70 border border-purple-300 dark:border-purple-700/60 text-purple-900 dark:text-purple-200 shadow-xs'
                    : 'hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    style={{ color: folder.color }}
                    className="p-1 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-transparent shrink-0"
                  >
                    <Folder className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold truncate leading-tight">
                      {folder.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                      {folder.description}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 shrink-0 ml-1">
                  {folder.assetCount}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Storage Info Card */}
          <div className="p-3 rounded-xl bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-300 font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Zero-Credit Reuse Rule</span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Every clip reused on the Timeline loads entirely from your browser's persistent cache. No API token calls are ever fired.
            </p>
          </div>
        </div>

        {/* Center Assets Grid & Search (8.5 cols) */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950">
          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cached footage, sound effects, B-roll by name or tag..."
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <span>Showing:</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{filteredAssets.length} asset(s)</span>
            </div>
          </div>

          {/* Assets Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {loading ? (
              <div className="h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                Loading indexed vault assets...
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <Database className="w-10 h-10 text-zinc-400 dark:text-zinc-700" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No Assets in this Folder</h3>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs">
                    Import files from disk or use clips generated in Voice Studio and Veo Studio.
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Import Media Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                      selectedAsset?.id === asset.id
                        ? 'bg-purple-50/50 dark:bg-zinc-900 border-purple-500 ring-1 ring-purple-500 shadow-sm'
                        : 'bg-zinc-50/70 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900'
                    }`}
                  >
                    {/* Card Top: Type badge & Name */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {asset.type === 'video' ? (
                              <Film className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                            ) : asset.type === 'audio' ? (
                              <Mic className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" />
                            )}
                          </span>
                          <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 dark:text-zinc-400">
                            {asset.category}
                          </span>
                        </div>

                        {/* Reuse Count Badge */}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 font-semibold">
                          Reused {asset.timesReused}x
                        </span>
                      </div>

                      <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1 leading-snug">
                        {asset.name}
                      </h4>

                      {asset.description && (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {asset.description}
                        </p>
                      )}

                      {/* Tag Chips */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {asset.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-200/60 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700/60 font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Bottom: Metadata & Actions */}
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-zinc-400 dark:text-zinc-500">
                        {asset.durationSec ? `${asset.durationSec}s` : 'Static'} •{' '}
                        {(asset.fileSizeBytes / 1024 / 1024).toFixed(1)}MB
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReuseAsset(asset);
                          }}
                          className="px-2 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                          title="Drop into Timeline Editor with zero API cost"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Reuse (0 Cr)</span>
                        </button>

                        <button
                          onClick={(e) => handleDeleteAsset(asset.id, e)}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/60 text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete from local vault"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
