import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { XtermTerminal } from './XtermTerminal';
import { TerminalTabs } from './TerminalTabs';
import { TerminalToolbar } from './TerminalToolbar';
import { TerminalTab, TerminalConfig, DEFAULT_TERMINAL_CONFIG } from '@/types/terminal';
import { runtimeManager } from '@/runtimes/RuntimeManager';
import { TerminalStreamThrottler, RingBufferTerminal } from '@/services/terminalBuffer';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TerminalPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMaximize?: () => void;
}

export const TerminalPanel = forwardRef<HTMLDivElement, TerminalPanelProps>(
  ({ isOpen, onClose, onMaximize }, ref) => {
    const [tabs, setTabs] = useState<TerminalTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const terminalRefs = useRef<Map<string, any>>(new Map());
    const activeTerminalRef = useRef<any>(null);
    
    // Terminal output throttling
    const throttlerRef = useRef<TerminalStreamThrottler | null>(null);
    const ringBufferRef = useRef<RingBufferTerminal | null>(null);
    const unsubscribeRuntimeRef = useRef<() => void>(null);

    useImperativeHandle(ref, () => ({
      newTab: createTab,
      closeTab: closeTab,
      write: (data: string) => activeTerminalRef.current?.write(data),
      writeln: (data: string) => activeTerminalRef.current?.writeln(data),
      clear: () => activeTerminalRef.current?.clear(),
      focus: () => activeTerminalRef.current?.focus(),
      getThrottlerStats: () => throttlerRef.current?.getStats(),
      searchTerminal: (query: string) => ringBufferRef.current?.search(query) || [],
    }));

    // Initialize throttler and ring buffer
    useEffect(() => {
      throttlerRef.current = new TerminalStreamThrottler(
        (batch) => {
          // Write batched output to active terminal
          activeTerminalRef.current?.write(batch);
        },
        {
          maxLines: 5000,
          maxBatchSize: 100,
          flushIntervalMs: 16,
          warningThreshold: 4500,
        }
      );

      ringBufferRef.current = new RingBufferTerminal(5000);

      // Subscribe to runtime events
      unsubscribeRuntimeRef.current = runtimeManager.onEvent((event) => {
        if (event.type === 'stdout' || event.type === 'stderr') {
          throttlerRef.current?.write(event.data);
          ringBufferRef.current?.append(event.data, event.type);
        } else if (event.type === 'status') {
          throttlerRef.current?.write(`\r\n\x1b[90m${event.data}\x1b[0m\r\n`);
          ringBufferRef.current?.append(`\r\n\x1b[90m${event.data}\x1b[0m\r\n`, 'system');
        }
      });

      return () => {
        throttlerRef.current?.destroy();
        ringBufferRef.current?.clear();
        unsubscribeRuntimeRef.current?.();
      };
    }, []);

    // Initialize with one tab
    useEffect(() => {
      if (tabs.length === 0) {
        createTab('Terminal');
      }
    }, []);

    // Update active terminal ref when tab changes
    useEffect(() => {
      if (activeTabId) {
        activeTerminalRef.current = terminalRefs.current.get(activeTabId) || null;
      }
    }, [activeTabId]);

    const createTab = (title: string = 'Terminal', shell: string = 'bash', cwd: string = '/') => {
      const id = 'term_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const newTab: TerminalTab = {
        id,
        title,
        isActive: true,
        process: undefined,
      };
      
      setTabs(prev => [...prev.map(t => ({ ...t, isActive: false })), newTab]);
      setActiveTabId(id);
      return id;
    };

    const closeTab = (id: string) => {
      setTabs(prev => {
        const next = prev.filter(t => t.id !== id);
        if (next.length === 0) {
          setTimeout(() => createTab(), 0);
        } else if (activeTabId === id) {
          setActiveTabId(next[next.length - 1].id);
        }
        return next;
      });
    };

    const handleTabChange = (id: string) => {
      setTabs(prev => prev.map(t => ({ ...t, isActive: t.id === id })));
      setActiveTabId(id);
      setTimeout(() => {
        const term = terminalRefs.current.get(id);
        term?.focus();
      }, 0);
    };

    const handleNewTab = () => createTab();

    const handleClear = () => {
      activeTerminalRef.current?.clear();
      ringBufferRef.current?.clear();
    };

    const handleKill = () => {
      runtimeManager.terminate();
      activeTerminalRef.current?.writeln('\r\n\x1b[33m[Process terminated]\x1b[0m\r\n$ ');
    };

    const handleCopy = () => {
      activeTerminalRef.current?.focus();
    };

    const handleSearch = () => setSearchOpen(!searchOpen);

    const handleSettings = () => {
      // TODO: Open terminal settings
    };

    const handleMaximizeToggle = () => {
      setIsMaximized(!isMaximized);
      onMaximize?.();
    };

    const handleTerminalReady = useCallback((id: string) => (term: any) => {
      terminalRefs.current.set(id, term);
      if (id === activeTabId) {
        activeTerminalRef.current = term;
      }
    }, [activeTabId]);

    const handleTerminalInput = useCallback((id: string) => (data: string) => {
      const term = terminalRefs.current.get(id);
      if (term) {
        term.write(data);
      }
      runtimeManager.sendStdin(data);
    }, []);

    const activeTab = tabs.find(t => t.id === activeTabId);

    if (!isOpen) return null;

    return (
      <div
        className={twMerge(
          'flex flex-col bg-[#111217] border-l border-white/[0.06]',
          isMaximized ? 'fixed inset-0 z-50 rounded-none' : 'h-full'
        )}
      >
        <TerminalTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={handleTabChange}
          onTabClose={closeTab}
          onNewTab={handleNewTab}
        />

        <TerminalToolbar
          activeTabId={activeTabId}
          onClear={handleClear}
          onKill={handleKill}
          onCopy={handleCopy}
          onSearch={handleSearch}
          onSettings={handleSettings}
          isMaximized={isMaximized}
          onMaximizeToggle={handleMaximizeToggle}
          onClose={onClose}
        />

        {searchOpen && (
          <div className="flex items-center gap-2 px-2 py-1 bg-[#161820] border-b border-white/[0.06]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in terminal..."
              className="flex-1 px-2 py-1 bg-canvas border border-white/10 rounded text-sm text-white placeholder:text-white/40 focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => setSearchOpen(false)}
              className="p-1.5 rounded hover:bg-white/[0.06] text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={twMerge(
                'absolute inset-0',
                activeTabId === tab.id ? 'block' : 'hidden'
              )}
            >
              <XtermTerminal
                ref={handleTerminalReady(tab.id)}
                onInput={handleTerminalInput(tab.id)}
                config={DEFAULT_TERMINAL_CONFIG}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
);

TerminalPanel.displayName = 'TerminalPanel';

import { X } from 'lucide-react';