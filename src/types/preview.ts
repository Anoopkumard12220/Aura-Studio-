export interface PreviewLogMessage {
  type: 'PREVIEW_CONSOLE';
  level: 'log' | 'info' | 'warn' | 'error';
  args: any[];
  timestamp: number;
}

export interface PreviewErrorMessage {
  type: 'PREVIEW_UNCAUGHT_ERROR';
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
}

export type PreviewIncomingMessage = PreviewLogMessage | PreviewErrorMessage;

export interface PreviewOutgoingMessage {
  type: 'PREVIEW_RELOAD' | 'PREVIEW_HMR' | 'PREVIEW_EVAL';
  payload?: any;
}

export type ViewportPreset = 'responsive' | 'mobile' | 'tablet' | 'laptop' | 'desktop';

export interface ViewportDimensions {
  width: number | string;
  height: number | string;
  label: string;
  icon: string;
}

export const VIEWPORT_PRESETS: Record<ViewportPreset, ViewportDimensions> = {
  responsive: { width: '100%', height: '100%', label: 'Responsive', icon: 'Monitor' },
  mobile: { width: 375, height: 667, label: 'iPhone SE', icon: 'Smartphone' },
  tablet: { width: 768, height: 1024, label: 'iPad', icon: 'Tablet' },
  laptop: { width: 1280, height: 800, label: 'MacBook', icon: 'Laptop' },
  desktop: { width: 1920, height: 1080, label: 'Desktop', icon: 'Monitor' },
};