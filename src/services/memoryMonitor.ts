export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedPercentage: number;
  warning: boolean;
  critical: boolean;
}

export interface MemoryThresholds {
  warning: number;
  critical: number;
}

const DEFAULT_THRESHOLDS: MemoryThresholds = {
  warning: 0.7,
  critical: 0.85,
};

export class MemoryMonitor {
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private thresholds: MemoryThresholds;
  private listeners: Array<(info: MemoryInfo) => void> = [];
  private lastInfo: MemoryInfo | null = null;
  private warningShown = false;

  constructor(thresholds: Partial<MemoryThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  start(intervalMs = 5000): void {
    if (this.checkInterval) return;

    this.check();
    this.checkInterval = setInterval(() => this.check(), intervalMs);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  check(): MemoryInfo | null {
    if (typeof performance === 'undefined' || !performance.memory) {
      return null;
    }

    const memory = performance.memory as any;
    const usedJSHeapSize = memory.usedJSHeapSize || 0;
    const totalJSHeapSize = memory.totalJSHeapSize || 0;
    const jsHeapSizeLimit = memory.jsHeapSizeLimit || 0;

    const usedPercentage = jsHeapSizeLimit > 0 ? usedJSHeapSize / jsHeapSizeLimit : 0;
    const warning = usedPercentage >= this.thresholds.warning;
    const critical = usedPercentage >= this.thresholds.critical;

    const info: MemoryInfo = {
      usedJSHeapSize,
      totalJSHeapSize,
      jsHeapSizeLimit,
      usedPercentage,
      warning,
      critical,
    };

    this.lastInfo = info;
    this.notifyListeners(info);

    if (warning && !this.warningShown) {
      this.warningShown = true;
      this.dispatchWarningEvent(info);
    } else if (!warning) {
      this.warningShown = false;
    }

    return info;
  }

  private notifyListeners(info: MemoryInfo): void {
    this.listeners.forEach(listener => {
      try {
        listener(info);
      } catch (e) {
        console.error('[MemoryMonitor] Listener error:', e);
      }
    });
  }

  private dispatchWarningEvent(info: MemoryInfo): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aura-memory-warning', {
        detail: {
          type: info.critical ? 'critical' : 'warning',
          info,
        },
      }));
    }
  }

  subscribe(listener: (info: MemoryInfo) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  getLastInfo(): MemoryInfo | null {
    return this.lastInfo;
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  getFormattedInfo(): string {
    const info = this.lastInfo;
    if (!info) return 'Memory info unavailable';

    return [
      `Used: ${this.formatBytes(info.usedJSHeapSize)}`,
      `Total: ${this.formatBytes(info.totalJSHeapSize)}`,
      `Limit: ${this.formatBytes(info.jsHeapSizeLimit)}`,
      `Usage: ${(info.usedPercentage * 100).toFixed(1)}%`,
      info.critical ? '🔴 CRITICAL' : info.warning ? '🟡 WARNING' : '🟢 OK',
    ].join(' | ');
  }

  forceGC(): void {
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  }

  destroy(): void {
    this.stop();
    this.listeners = [];
  }
}

export const memoryMonitor = new MemoryMonitor();

export function useMemoryMonitor(): MemoryInfo | null {
  const [info, setInfo] = useState<MemoryInfo | null>(null);

  useEffect(() => {
    const monitor = new MemoryMonitor();
    const unsubscribe = monitor.subscribe(setInfo);
    monitor.start(3000);

    return () => {
      unsubscribe();
      monitor.destroy();
    };
  }, []);

  return info;
}

import { useState, useEffect } from 'react';