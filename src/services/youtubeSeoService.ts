import { YouTubeSeoResult } from '../types';
import { getCustomApiKey } from './geminiKeyService';

export async function generateYouTubeSeo(
  script: string,
  topic?: string,
  videoType: 'shorts' | 'long-form' = 'long-form'
): Promise<YouTubeSeoResult> {
  const customKey = getCustomApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (customKey) {
    headers['x-gemini-api-key'] = customKey;
  }

  const res = await fetch('/api/youtube/seo', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      script,
      topic,
      videoType,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.details || errorData.error || 'Failed to generate YouTube SEO metadata');
  }

  const data: YouTubeSeoResult = await res.json();
  return data;
}
