import React, { useEffect, useRef } from 'react';
import { runtimeManager } from '@/runtimes/RuntimeManager';
import { TerminalStreamThrottler, RingBufferTerminal } from '@/services/terminalBuffer';
import { useTerminalStore } from '@/stores/useTerminalStore';

interface TerminalOutputManagerProps {
  children: React.ReactNode;
}

export const TerminalOutputManager: React.FC<TerminalOutputManagerProps> = ({ children }) => {
  const { writeToTerminal, terminalHistory, addToHistory, maxHistoryLines } = useTerminalStore();
  const throttlerRef = useRef<TerminalStreamThrottler | null>(null);
  const ringBufferRef = useRef<RingBufferTerminal | null>(null);
  const unsubscribeRef = useRef<() => void>(null);

  useEffect(() => {
    // Initialize throttler
    throttlerRef.current = new TerminalStreamThrottler(
      (batch, meta) => {
        // Write batched output to terminal
        writeToTerminal(batch);
        
        // Also add to ring buffer for search/history
        if (ringBufferRef.current) {
          ringBufferRef.current.append(batch, 'stdout');
        }
      },
      {
        maxLines: maxHistoryLines,
        maxBatchSize: 100,
        flushIntervalMs: 16,
        warningThreshold: maxHistoryLines * 0.9,
      }
    );

    // Initialize ring buffer
    ringBufferRef.current = new RingBufferTerminal(maxHistoryLines);

    // Subscribe to runtime events
    unsubscribeRef.current = runtimeManager.onEvent((event) => {
      if (event.type === 'stdout' || event.type === 'stderr') {
        throttlerRef.current?.write(event.data);
      } else if (event.type === 'status') {
        // Status messages go through too
        throttlerRef.current?.write(`\r\n\x1b[90m${event.data}\x1b[0m\r\n`);
      }
    });

    return () => {
      throttlerRef.current?.destroy();
      ringBufferRef.current?.clear();
      unsubscribeRef.current?.();
    };
  }, [writeToTerminal, maxHistoryLines]);

  return <>{children}</>;
};

export function useTerminalOutput() {
  const { writeToTerminal, clearTerminal, terminalHistory } = useTerminalStore();
  const throttlerRef = useRef<TerminalStreamThrottler | null>(null);
  const ringBufferRef = useRef<RingBufferTerminal | null>(null);

  const initialize = () => {
    if (throttlerRef.current) return;

    throttlerRef.current = new TerminalStreamThrottler(
      (batch) => writeToTerminal(batch),
      { maxLines: 5000, maxBatchSize: 100, flushIntervalMs: 16 }
    );

    ringBufferRef.current = new RingBufferTerminal(5000);
  };

  const write = (data: string) => {
    throttlerRef.current?.write(data);
    ringBufferRef.current?.append(data, 'stdout');
  };

  const writeLine = (line: string, type: 'stdout' | 'stderr' | 'system' = 'stdout') => {
    throttlerRef.current?.writeLine(line);
    ringBufferRef.current?.append(`${line}\n`, type);
  };

  const destroy = () => {
    throttlerRef.current?.destroy();
    ringBufferRef.current?.clear();
  };

  const search = (query: string) => {
    return ringBufferRef.current?.search(query) || [];
  };

  const getStats = () => {
    return throttlerRef.current?.getStats() || { lineCount: 0, totalWritten: 0, totalDropped: 0, bufferSize: 0 };
  };

  return { initialize, write, writeLine, destroy, search, getStats };
}

import { create } from 'zustand';

interface TerminalStore {
  terminalHistory: string;
  maxHistoryLines: number;
  writeToTerminal: (data: string) => void;
  clearTerminal: () => void;
  addToHistory: (data: string) => void;
}

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  terminalHistory: '',
  maxHistoryLines: 5000,
  
  writeToTerminal: (data: string) => {
    set((state) => {
      const newHistory = state.terminalHistory + data;
      // Keep only last maxHistoryLines
      const lines = newHistory.split('\n');
      if (lines.length > state.maxHistoryLines) {
        return { terminalHistory: lines.slice(-state.maxHistoryLines).join('\n') };
      }
      return { terminalHistory: newHistory };
    });
  },

  clearTerminal: () => {
    set({ terminalHistory: '' });
  },

  addToHistory: (data: string) => {
    // Same as writeToTerminal for now
    get().writeToTerminal(data);
  },
}));