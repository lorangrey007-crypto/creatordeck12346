import { TimelineClip } from '../types/timeline';

export interface MotionTemplate {
  id: string;
  name: string;
  category: 'subscribe-button' | 'lower-third' | 'countdown' | 'quote-card' | 'split-screen';
  description: string;
  duration: number;
  previewColor: string;
  clipData: Partial<TimelineClip>;
}

export const VIDEO_MOTION_TEMPLATES: MotionTemplate[] = [
  {
    id: 'tmpl-sub-bell',
    name: 'YouTube Subscribe & Bell Pop',
    category: 'subscribe-button',
    description: 'Animated subscribe pill with bell icon, audio click cue, and green screen backdrop option',
    duration: 4.5,
    previewColor: '#dc2626',
    clipData: {
      name: '🔴 Subscribe & Bell Reminder',
      type: 'overlay',
      duration: 4.5,
      opacity: 0.95,
      textOverlay: 'SUBSCRIBE & BELL NOTIFICATIONS',
      blendMode: 'normal',
      chromaKey: {
        enabled: true,
        color: 'green',
        similarity: 0.45,
        smoothness: 0.15,
        spillReduction: 0.5,
      },
      isTemplate: true,
      templateCategory: 'subscribe-button',
    },
  },
  {
    id: 'tmpl-lower-third',
    name: 'Cinematic Minimal Lower-Third',
    category: 'lower-third',
    description: 'Clean name badge with glowing accent line and animated title tag',
    duration: 5.0,
    previewColor: '#2563eb',
    clipData: {
      name: '👤 Speaker Name & Title Banner',
      type: 'overlay',
      duration: 5.0,
      opacity: 0.9,
      textOverlay: 'JOHNATHAN REED // LEAD RESEARCHER',
      blendMode: 'normal',
      isTemplate: true,
      templateCategory: 'lower-third',
    },
  },
  {
    id: 'tmpl-countdown',
    name: '5-Second Dramatic Countdown',
    category: 'countdown',
    description: 'Circular ticking countdown for hooks and suspense points with SFX pulses',
    duration: 5.0,
    previewColor: '#eab308',
    clipData: {
      name: '⏱️ Hook Suspense Countdown',
      type: 'overlay',
      duration: 5.0,
      opacity: 0.85,
      textOverlay: 'COUNTDOWN TO REVEAL',
      blendMode: 'screen',
      isTemplate: true,
      templateCategory: 'countdown',
    },
  },
  {
    id: 'tmpl-quote',
    name: 'Documentary Quote Card',
    category: 'quote-card',
    description: 'Frosted blur frame with elegant serif quotation marks and source citation',
    duration: 6.0,
    previewColor: '#059669',
    clipData: {
      name: '📜 Historical Quote Card',
      type: 'overlay',
      duration: 6.0,
      opacity: 0.92,
      textOverlay: '"The truth is rarely pure and never simple." - Oscar Wilde',
      blendMode: 'normal',
      isTemplate: true,
      templateCategory: 'quote-card',
    },
  },
  {
    id: 'tmpl-greenscreen-presenter',
    name: 'Green Screen Presenter Dock',
    category: 'subscribe-button',
    description: 'Chroma-keyed subject layer with automatic background removal and spill suppressor',
    duration: 7.0,
    previewColor: '#16a34a',
    clipData: {
      name: '🟢 Chroma Key Subject Layer',
      type: 'overlay',
      duration: 7.0,
      opacity: 1.0,
      textOverlay: 'Chroma Key Filter Active',
      chromaKey: {
        enabled: true,
        color: 'green',
        similarity: 0.5,
        smoothness: 0.2,
        spillReduction: 0.6,
      },
      isTemplate: true,
      templateCategory: 'subscribe-button',
    },
  },
];
