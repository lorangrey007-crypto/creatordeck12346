import { getApiKeyHeaders, getCustomApiKey } from './geminiKeyService';

export interface ScriptGenerationParams {
  topic: string;
  tone?: 'conversational' | 'mystery' | 'hook' | 'documentary' | 'dramatic' | 'explainer';
  durationTarget?: 'short' | 'medium' | 'long';
  includeTags?: boolean;
  humanImperfections?: boolean;
}

export interface ScriptChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ScriptChatResponse {
  reply: string;
  shortScript: string | null;
  longScript: string | null;
}

export interface ScriptGenerationResult {
  script: string;
  wordCount: number;
  estimatedSeconds: number;
}

export async function sendScriptChatMessage(params: {
  messages: { role: 'user' | 'model'; text: string }[];
  currentShortScript?: string;
  currentLongScript?: string;
  useSearch?: boolean;
}): Promise<ScriptChatResponse> {
  const customKey = getCustomApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getApiKeyHeaders(),
  };

  const response = await fetch('/api/scripts/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages: params.messages,
      currentShortScript: params.currentShortScript || '',
      currentLongScript: params.currentLongScript || '',
      useSearch: params.useSearch || false,
      apiKey: customKey || undefined,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData.details || errData.error || `HTTP ${response.status}: Failed to communicate with script director`;
    throw new Error(message);
  }

  return response.json();
}

/**
 * Generates an authentic human-style voiceover script tailored to Google TTS standards.
 * Pure script creation — does NOT trigger audio synthesis automatically.
 */
export async function generateAiScript(
  params: ScriptGenerationParams
): Promise<ScriptGenerationResult> {
  const customKey = getCustomApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getApiKeyHeaders(),
  };

  const response = await fetch('/api/scripts/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      topic: params.topic,
      tone: params.tone || 'conversational',
      durationTarget: params.durationTarget || 'medium',
      includeTags: params.includeTags ?? true,
      humanImperfections: params.humanImperfections ?? true,
      apiKey: customKey || undefined,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData.details || errData.error || `HTTP ${response.status}: Failed to generate script`;
    throw new Error(message);
  }

  const data = await response.json();
  return {
    script: data.script,
    wordCount: data.wordCount,
    estimatedSeconds: data.estimatedSeconds,
  };
}
