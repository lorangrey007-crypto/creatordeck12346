export type VaultCategory = 'all' | 'hooks' | 'broll' | 'characters' | 'backgrounds' | 'voiceovers' | 'sfx';

export interface VaultAsset {
  id: string;
  name: string;
  category: VaultCategory;
  type: 'video' | 'audio' | 'image';
  durationSec?: number;
  tags: string[];
  description?: string;
  sourceModule: 'veo-studio' | 'voice-studio' | 'imagen-studio' | 'local-import';
  // Blobs and URLs cached locally for zero-credit instant playback
  blobUrl?: string;
  base64Data?: string;
  thumbnailUrl?: string;
  fileSizeBytes: number;
  resolution?: string; // e.g., '1080p', '4K', '720p'
  aspectRatio: '16:9' | '9:16' | '1:1';
  createdAt: number;
  timesReused: number; // tracks 0-credit savings!
  lastReusedAt?: number;
}

export interface VaultFolder {
  id: string;
  name: string;
  description: string;
  category: VaultCategory;
  assetCount: number;
  color: string;
}

export interface VaultStats {
  totalAssets: number;
  totalSavedCredits: number; // approximate credit count saved by reusing
  totalStorageBytes: number;
  reusedCount: number;
}
