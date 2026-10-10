import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useDiagnosticsStore } from '@/stores/useDiagnosticsStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Trash2, Filter, Copy, Search, Download, PauseCircle, PlayCircle, X } from 'lucide-react';

interface LogEntry {
  id: string;
  level: 'log' | 'info' | 'warn' | 'error';
  args: any[];
  timestamp: number;
  source: string;
}

interface ConsoleLogViewerProps {
  logs?: LogEntry[];
  onClear?: () => void;
}

export const ConsoleLogViewer: React.FC<ConsoleLogViewerProps> = ({ logs = [], onClear }) => {
  const [filter, setFilter] = useState<'all' | 'log' | 'info' | 'warn' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const filteredLogs = useMemo(() => {
    let result = logs;
    
    if (filter !== 'all') {
      result = result.filter(l => l.level === filter);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.args.some(arg => String(arg).toLowerCase().includes(q))
      );
    }
    
    return result;
  }, [logs, filter, searchQuery]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const formatArg = (arg: any): string => {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, (key, val) => 
          typeof val === 'bigint' ? val.toString() + 'n' : val
        , 2);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
  };

  const levelConfig = {
    log: { color: 'text-white/80', bg: 'bg-white/5', icon: null },
    info: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: null },
    warn: { color: 'text-amber-400', bg: 'bg-amber-400/10', icon: null },
    error: { color: 'text-red-400', bg: 'bg-red-400/10', icon: null },
  };

  return (
    <div className="flex flex-col h-full bg-[#111217] border-l border-white/[0.06]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-white/[0.06] bg-frame">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter console..."
            className="w-full pl-8 pr-8 py-1.5 bg-canvas border border-white/10 rounded text-xs text-white placeholder:text-white/40 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        
        <div className="flex items-center gap-1">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-2 py-1 bg-canvas border border-white/10 rounded text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="log">Logs</option>
            <option value="info">Info</option>
            <option value="warn">Warnings</option>
            <option value="error">Errors</option>
          </select>
          
          <button
            onClick={() => setPaused(!paused)}
            className={clsx(
              'p-1.5 rounded transition-colors flex items-center gap-1',
              paused 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            )}
            title={paused ? 'Resume' : 'Pause'}
          >
            {paused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
            <span className="text-xs hidden sm:inline">{paused ? 'Paused' : 'Live'}</span>
          </button>
          
          <label className={clsx(
            'flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer',
            autoScroll ? 'bg-green-500/10 text-green-400' : 'hover:bg-white/5'
          )}>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-3 h-3 accent-green-500"
            />
            <span className="text-xs hidden sm:inline">Auto-scroll</span>
          </label>
          
          <button
            onClick={onClear}
            className="p-1.5 rounded hover:bg-white/[0.06] text-white/50 hover:text-white transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Console Output */}
      <div className="flex-1 overflow-auto scrollbar-thin p-2 font-mono text-xs" ref={logsContainerRef}>
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30">
            <span className="mb-2">No console output</span>
            <span className="text-[10px]">Console logs from preview and runtime appear here</span>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((entry) => {
              const config = levelConfig[entry.level];
              return (
                <div
                  key={entry.id}
                  className={clsx(
                    'px-2 py-1 rounded border-l-2 transition-colors',
                    config.bg,
                    config.color
                  )}
                >
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="text-white/30 font-mono whitespace-nowrap shrink-0">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                    <span className={clsx('font-medium text-white/60 shrink-0', config.color)}>
                      {entry.level.toUpperCase()}
                    </span>
                    <span className="text-white/40 text-[10px] shrink-0">{entry.source}</span>
                    <div className="flex-1 min-w-0 whitespace-pre-wrap break-all">
                      {entry.args.map((arg, i) => (
                        <span key={i} className={i > 0 ? 'text-white/70' : ''}>
                          {formatArg(arg)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};