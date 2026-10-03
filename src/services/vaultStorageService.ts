import { VaultAsset, VaultStats, VaultCategory } from '../types/vault';

const DB_NAME = 'creatordeck_veo_vault_db';
const DB_VERSION = 1;
const STORE_NAME = 'vault_assets';

/**
 * Initializes or opens the persistent IndexedDB storage
 */
function openVaultDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves or updates an asset in the persistent local vault (0 credits)
 */
export async function saveVaultAsset(asset: VaultAsset): Promise<void> {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(asset);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieves all cached assets from the persistent local vault
 */
export async function getAllVaultAssets(): Promise<VaultAsset[]> {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const results: VaultAsset[] = request.result || [];
      // Sort newest first
      resolve(results.sort((a, b) => b.createdAt - a.createdAt));
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Deletes an asset by ID from local vault
 */
export async function deleteVaultAsset(id: string): Promise<void> {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Increments the 0-credit reuse counter for an asset
 */
export async function incrementVaultAssetReuse(id: string): Promise<void> {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      const item: VaultAsset = req.result;
      if (item) {
        item.timesReused = (item.timesReused || 0) + 1;
        item.lastReusedAt = Date.now();
        store.put(item);
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Computes storage stats and 0-credit savings metrics
 */
export function calculateVaultStats(assets: VaultAsset[]): VaultStats {
  const totalAssets = assets.length;
  let totalStorageBytes = 0;
  let reusedCount = 0;

  assets.forEach((a) => {
    totalStorageBytes += a.fileSizeBytes || 0;
    reusedCount += a.timesReused || 0;
  });

  // Every reuse of a video or voice asset saves ~20-50 credits
  const totalSavedCredits = reusedCount * 25;

  return {
    totalAssets,
    totalSavedCredits,
    totalStorageBytes,
    reusedCount,
  };
}

/**
 * Default pre-seeded vault assets to ensure immediate usability
 */
export const DEFAULT_STARTER_VAULT_ASSETS: VaultAsset[] = [
  {
    id: 'vault-asset-1',
    name: 'Cinematic Hyper-Lapse Cyberpunk City',
    category: 'broll',
    type: 'video',
    durationSec: 5.5,
    tags: ['cyberpunk', 'cityscape', 'neon', '4k', 'broll'],
    description: 'High-contrast nocturnal urban shot with flying transit flares',
    sourceModule: 'veo-studio',
    fileSizeBytes: 2400000,
    resolution: '1080p',
    aspectRatio: '16:9',
    createdAt: Date.now() - 3600000 * 24,
    timesReused: 3,
  },
  {
    id: 'vault-asset-2',
    name: 'Suspenseful Mystery Piano & String Bed',
    category: 'sfx',
    type: 'audio',
    durationSec: 18.0,
    tags: ['mystery', 'tension', 'cinematic', 'background-audio'],
    description: 'Atmospheric low-drone cello and pulsing suspense ostinato',
    sourceModule: 'voice-studio',
    fileSizeBytes: 1850000,
    resolution: 'WAV',
    aspectRatio: '16:9',
    createdAt: Date.now() - 3600000 * 12,
    timesReused: 5,
  },
  {
    id: 'vault-asset-3',
    name: 'Curious Presenter Silhouette (Green Screen)',
    category: 'hooks',
    type: 'video',
    durationSec: 4.2,
    tags: ['green-screen', 'presenter', 'hook', 'question-gesture'],
    description: 'Alpha-ready chroma-keyed gesture clip perfect for opening hooks',
    sourceModule: 'local-import',
    fileSizeBytes: 3100000,
    resolution: '1080p',
    aspectRatio: '16:9',
    createdAt: Date.now() - 3600000 * 8,
    timesReused: 2,
  },
  {
    id: 'vault-asset-4',
    name: 'Dramatic Sunset Horizon Drone Drift',
    category: 'backgrounds',
    type: 'video',
    durationSec: 6.0,
    tags: ['nature', 'drone', 'sunset', 'outro', 'serene'],
    description: 'Golden hour drone drift over tranquil mountain ranges',
    sourceModule: 'veo-studio',
    fileSizeBytes: 4200000,
    resolution: '1080p',
    aspectRatio: '16:9',
    createdAt: Date.now() - 3600000 * 4,
    timesReused: 4,
  },
];
