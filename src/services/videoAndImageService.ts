import { getStoredGeminiApiKey } from './geminiKeyService';
import { VeoClip, GeneratedThumbnail } from '../types';

export interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: '16:9' | '1:1' | '9:16' | '4:3';
  imageSize?: '1K' | '2K';
}

export interface GenerateImageResponse {
  imageUrl: string;
  mimeType: string;
  aspectRatio: string;
  prompt: string;
}

/**
 * Generate actual visual image using Gemini/Imagen model via backend proxy
 */
export async function generateThumbnailImage(options: GenerateImageOptions): Promise<GenerateImageResponse> {
  const customKey = getStoredGeminiApiKey();

  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(customKey ? { 'x-gemini-api-key': customKey } : {}),
    },
    body: JSON.stringify({
      prompt: options.prompt,
      aspectRatio: options.aspectRatio || '16:9',
      imageSize: options.imageSize || '1K',
    }),
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // ignore
    }
    const msg = errorData.error || `Image generation failed (${response.status})`;
    throw new Error(msg);
  }

  return response.json();
}

export interface StartVeoVideoOptions {
  prompt: string;
  model?: 'veo-3.1-lite-generate-preview' | 'veo-3.1-generate-preview';
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
  imageBytes?: string;
  imageMimeType?: string;
}

export interface StartVeoVideoResponse {
  operationName: string;
  status: 'pending';
  prompt: string;
  aspectRatio: string;
  resolution: string;
  model: string;
}

/**
 * Step 1: Start Veo video generation job
 */
export async function startVeoVideo(options: StartVeoVideoOptions): Promise<StartVeoVideoResponse> {
  const customKey = getStoredGeminiApiKey();

  const response = await fetch('/api/generate-video', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(customKey ? { 'x-gemini-api-key': customKey } : {}),
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // ignore
    }
    const msg = errorData.error || `Veo video generation failed to start (${response.status})`;
    throw new Error(msg);
  }

  return response.json();
}

/**
 * Step 2: Poll Veo video generation operation status
 */
export async function pollVeoVideoStatus(operationName: string): Promise<{ done: boolean; error?: string | null }> {
  const customKey = getStoredGeminiApiKey();

  const response = await fetch('/api/video-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(customKey ? { 'x-gemini-api-key': customKey } : {}),
    },
    body: JSON.stringify({ operationName }),
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // ignore
    }
    throw new Error(errorData.error || `Failed to check video status (${response.status})`);
  }

  return response.json();
}

/**
 * Step 3: Download finished Veo video stream as an object Blob URL
 */
export async function downloadVeoVideo(operationName: string): Promise<{ blobUrl: string; blob: Blob }> {
  const customKey = getStoredGeminiApiKey();

  const response = await fetch('/api/video-download', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(customKey ? { 'x-gemini-api-key': customKey } : {}),
    },
    body: JSON.stringify({ operationName }),
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // ignore
    }
    throw new Error(errorData.error || `Failed to download video (${response.status})`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  return { blobUrl, blob };
}
