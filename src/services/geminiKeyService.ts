export interface ConnectionStatus {
  status: 'authenticated' | 'quota_exceeded' | 'auth_error' | 'connecting' | 'key_required' | 'error';
  latencyMs: number;
  error?: string;
  keySource: 'custom' | 'none';
  keyMasked?: string;
  lastChecked: number;
}

const PRIMARY_STORAGE_KEY = 'creatordeck_gemini_api_key';
const LEGACY_STORAGE_KEY = 'narrator_custom_gemini_api_key';

let cachedKey: string | null = null;
const listeners = new Set<(status: ConnectionStatus) => void>();

export function getCustomApiKey(): string {
  if (cachedKey !== null) return cachedKey;
  try {
    const saved = localStorage.getItem(PRIMARY_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    cachedKey = saved ? saved.trim() : '';
  } catch {
    cachedKey = '';
  }
  return cachedKey;
}

export const getStoredGeminiApiKey = getCustomApiKey;

export function hasConfiguredApiKey(): boolean {
  return getCustomApiKey().length > 6;
}

export function setCustomApiKey(key: string): void {
  const trimmed = key.trim();
  cachedKey = trimmed;
  try {
    if (trimmed) {
      localStorage.setItem(PRIMARY_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(PRIMARY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to save API key to localStorage', err);
  }
}

export function clearCustomApiKey(): void {
  cachedKey = '';
  try {
    localStorage.removeItem(PRIMARY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear API key from localStorage', err);
  }
}

export function getApiKeyHeaders(): Record<string, string> {
  const key = getCustomApiKey();
  return key ? { 'x-gemini-api-key': key } : {};
}

export async function pingGeminiConnection(overrideKey?: string): Promise<ConnectionStatus> {
  const targetKey = overrideKey !== undefined ? overrideKey.trim() : getCustomApiKey();
  const startTime = Date.now();

  if (!targetKey || targetKey.length < 8) {
    const result: ConnectionStatus = {
      status: 'key_required',
      latencyMs: 0,
      error: 'No Gemini API key configured. Enter your personal key to activate AI features.',
      keySource: 'none',
      lastChecked: Date.now(),
    };
    notifyListeners(result);
    return result;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-gemini-api-key': targetKey,
    };

    const response = await fetch('/api/gemini/ping', {
      method: 'POST',
      headers,
      body: JSON.stringify({ apiKey: targetKey }),
    });

    const elapsed = Date.now() - startTime;
    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      const result: ConnectionStatus = {
        status: 'authenticated',
        latencyMs: data.latencyMs || elapsed,
        keySource: 'custom',
        keyMasked: data.keyMasked,
        lastChecked: Date.now(),
      };
      notifyListeners(result);
      return result;
    } else {
      const status = response.status === 429 
        ? 'quota_exceeded' 
        : data.status === 'key_required'
        ? 'key_required'
        : response.status === 401 
        ? 'auth_error' 
        : 'error';
      const result: ConnectionStatus = {
        status,
        latencyMs: data.latencyMs || elapsed,
        error: data.error || `HTTP ${response.status}: Verification failed`,
        keySource: targetKey ? 'custom' : 'none',
        lastChecked: Date.now(),
      };
      notifyListeners(result);
      return result;
    }
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    const result: ConnectionStatus = {
      status: 'error',
      latencyMs: elapsed,
      error: err.message || 'Network error connecting to Gemini API',
      keySource: targetKey ? 'custom' : 'none',
      lastChecked: Date.now(),
    };
    notifyListeners(result);
    return result;
  }
}

function notifyListeners(status: ConnectionStatus) {
  listeners.forEach((fn) => fn(status));
}

export function subscribeConnectionStatus(callback: (status: ConnectionStatus) => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
