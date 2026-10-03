import { BRollThumbnailResult } from '../types';
import { getCustomApiKey } from './geminiKeyService';

export async function generateYouTubeBRollAndThumbnails(
  script: string,
  genre: string = 'documentary / suspense mystery',
  options?: {
    topic?: string;
    userFeedback?: string;
    messages?: { role: 'user' | 'model'; content: string }[];
    audioBase64?: string;
    audioMimeType?: string;
  }
): Promise<BRollThumbnailResult> {
  const customKey = getCustomApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (customKey) {
    headers['x-gemini-api-key'] = customKey;
  }

  const res = await fetch('/api/youtube/broll-thumbnails', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      script,
      genre,
      topic: options?.topic,
      userFeedback: options?.userFeedback,
      messages: options?.messages,
      audioBase64: options?.audioBase64,
      audioMimeType: options?.audioMimeType || 'audio/wav',
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.details || errorData.error || 'Failed to generate B-Roll & Thumbnail data');
  }

  const data: BRollThumbnailResult = await res.json();
  return data;
}
