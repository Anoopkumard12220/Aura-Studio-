import { useState, useEffect, useCallback } from 'react';
import { MemoryInfo } from '@/services/memoryMonitor';
import { memoryMonitor } from '@/services/memoryMonitor';

export function useMemoryUsage(): MemoryInfo | null {
  const [info, setInfo] = useState<MemoryInfo | null>(null);

  useEffect(() => {
    const unsubscribe = memoryMonitor.subscribe(setInfo);
    memoryMonitor.start(3000);

    return () => {
      unsubscribe();
    };
  }, []);

  return info;
}

export function useMemoryWarning(): { warning: boolean; critical: boolean } {
  const info = useMemoryUsage();
  return {
    warning: info?.warning ?? false,
    critical: info?.critical ?? false,
  };
}