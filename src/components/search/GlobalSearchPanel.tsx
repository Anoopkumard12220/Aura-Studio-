import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, FileText, Folder, ChevronRight, Loader2, Filter, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useFileStore } from '@/stores/useFileStore';
import { useProjectStore } from '@/stores/useProjectStore';

interface SearchResult {
  fileId: string;
  fileName: string;
  filePath: string;
  matches: Array<{
    lineNumber: number;
    lineContent: string;
    matchStart: number;
    matchEnd: number;
  }>;
}

interface GlobalSearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchPanel: React.FC<GlobalSearchPanelProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    caseSensitive: false,
    wholeWord: false,
    regex: false,
    includePattern: '',
    excludePattern: '',
  });
  const [stats, setStats] = useState({ files: 0, matches: 0, time: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const { files } = useFileStore();
  const { activeProjectId } = useProjectStore();

  const searchFiles = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !activeProjectId) {
      setResults([]);
      setStats({ files: 0, matches: 0, time: 0 });
      return;
    }

    setLoading(true);
    const startTime = performance.now();

    try {
      const projectFiles = Object.values(files).filter(f => f.projectId === activeProjectId && !f.isDirectory);
      const searchResults: SearchResult[] = [];

      const flags = `${filters.caseSensitive ? '' : 'i'}${filters.regex ? '' : ''}`;
      const escapedQuery = filters.regex ? searchQuery : searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = filters.wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery;
      const regex = new RegExp(pattern, flags);

      for (const file of projectFiles) {
        const lines = file.content.split('\n');
        const matches: SearchResult['matches'] = [];

        lines.forEach((line, index) => {
          let match;
          while ((match = regex.exec(line)) !== null) {
            matches.push({
              lineNumber: index + 1,
              lineContent: line,
              matchStart: match.index,
              matchEnd: match.index + match[0].length,
            });
            if (!regex.global) break;
          }
        });

        if (matches.length > 0) {
          searchResults.push({
            fileId: file.id,
            fileName: file.name,
            filePath: file.path,
            matches,
          });
        }
      }

      const time = performance.now() - startTime;
      setResults(searchResults);
      setStats({
        files: searchResults.length,
        matches: searchResults.reduce((sum, r) => sum + r.matches.length, 0),
        time: Math.round(time),
      });
      setSelectedIndex(0);
      setExpandedFiles(new Set(searchResults.slice(0, 5).map(r => r.fileId)));
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [files, activeProjectId, filters]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchFiles(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, searchFiles]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleFileExpanded = (fileId: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const openFile = (fileId: string, lineNumber: number) => {
    window.dispatchEvent(new CustomEvent('aura-open-file', { 
      detail: { fileId, lineNumber } 
    }));
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="w-[900px] max-w-[95vw] max-h-[85vh] bg-[#161820] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Global Search"
      >
        {/* Header */}
        <div className="h-12 border-b border-white/[0.06] flex items-center px-4 space-x-3 bg-gradient-to-r from-indigo-600/10 to-cyan-500/10">
          <Search className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-white">Search in Files</span>
          <div className="flex-1" />
          {stats.matches > 0 && (
            <span className="text-[10px] text-white/50">
              {stats.files} files • {stats.matches} matches • {stats.time}ms
            </span>
          )}
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input & Filters */}
        <div className="p-4 border-b border-white/[0.06] space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search across all project files..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              autoComplete="off"
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 animate-spin" />}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 text-xs text-white/60">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.caseSensitive}
                onChange={e => setFilters(f => ({ ...f, caseSensitive: e.target.checked }))}
                className="w-3 h-3 rounded border-white/20 bg-surface text-indigo-500 focus:ring-indigo-500"
              />
              <span>Case sensitive</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.wholeWord}
                onChange={e => setFilters(f => ({ ...f, wholeWord: e.target.checked }))}
                className="w-3 h-3 rounded border-white/20 bg-surface text-indigo-500 focus:ring-indigo-500"
              />
              <span>Whole word</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.regex}
                onChange={e => setFilters(f => ({ ...f, regex: e.target.checked }))}
                className="w-3 h-3 rounded border-white/20 bg-surface text-indigo-500 focus:ring-indigo-500"
              />
              <span>Regex</span>
            </label>
            <div className="flex-1" />
            <Clock className="w-3 h-3" />
            <span>{stats.time}ms</span>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {results.length === 0 && !loading && query.trim() ? (
            <div className="h-full flex flex-col items-center justify-center text-white/30">
              <Search className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs mt-1">Try adjusting filters or search terms</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {results.map((result, fileIndex) => {
                const isExpanded = expandedFiles.has(result.fileId);
                return (
                  <div key={result.fileId} className="bg-surface border border-white/10 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleFileExpanded(result.fileId)}
                      className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{result.fileName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50">
                            {result.matches.length} match(es)
                          </span>
                        </div>
                        <p className="text-[11px] text-white/40 truncate">{result.filePath}</p>
                      </div>
                      <ChevronRight className={clsx('w-4 h-4 text-white/40 transition-transform flex-shrink-0', isExpanded && 'rotate-90')} />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-white/10 px-3 py-2 max-h-60 overflow-y-auto">
                        {result.matches.map((match, matchIndex) => (
                          <button
                            key={matchIndex}
                            onClick={() => openFile(result.fileId, match.lineNumber)}
                            className="w-full px-3 py-1.5 rounded text-left hover:bg-white/[0.03] transition-colors text-left"
                          >
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-white/40 font-mono w-12 text-right">{match.lineNumber}</span>
                              <span className="text-white/30">|</span>
                              <div className="flex-1 min-w-0 font-mono">
                                {(() => {
                                  const line = match.lineContent;
                                  const before = line.substring(0, match.matchStart);
                                  const matched = line.substring(match.matchStart, match.matchEnd);
                                  const after = line.substring(match.matchEnd);
                                  return (
                                    <span>
                                      <span className="text-white/60">{before}</span>
                                      <mark className="bg-indigo-500/30 text-indigo-200 rounded px-0.5">{matched}</mark>
                                      <span className="text-white/60">{after}</span>
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-4 py-2 flex items-center justify-between text-[10px] text-white/40">
          <span>{results.length} file(s) with matches</span>
          <span>↑↓ Navigate • ⏎ Open • ←/→ Expand • ESC Close</span>
        </div>
      </div>
    </div>,
    document.body
  );
};