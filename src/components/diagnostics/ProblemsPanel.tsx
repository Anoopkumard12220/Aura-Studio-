import React, { useState, useMemo } from 'react';
import { useDiagnosticsStore } from '@/stores/useDiagnosticsStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X, Filter, AlertCircle, AlertTriangle, Info, ChevronDown, ChevronRight, FileText, Search, Trash2 } from 'lucide-react';

export const ProblemsPanel: React.FC = () => {
  const { diagnostics, clearDiagnostics, getBySeverity, getBySource } = useDiagnosticsStore();
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'severity' | 'source' | 'file'>('severity');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    let result = diagnostics;
    
    if (filter !== 'all') {
      result = result.filter(d => d.severity === filter);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.message.toLowerCase().includes(q) ||
        d.filePath?.toLowerCase().includes(q) ||
        d.source.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [diagnostics, filter, searchQuery]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    
    for (const diag of filtered) {
      let key: string;
      switch (groupBy) {
        case 'severity':
          key = diag.severity;
          break;
        case 'source':
          key = diag.source;
          break;
        case 'file':
          key = diag.filePath || 'Unknown';
          break;
        default:
          key = 'all';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(diag);
    }
    
    return groups;
  }, [filtered, groupBy]);

  const severityConfig = {
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Errors' },
    warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Warnings' },
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Info' },
  };

  const getGroupLabel = (key: string) => {
    if (groupBy === 'severity') return severityConfig[key as keyof typeof severityConfig]?.label || key;
    return key;
  };

  const getGroupCount = (key: string) => grouped[key]?.length || 0;

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-full bg-surface border-l border-white/[0.06]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-white/[0.06] bg-frame">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter problems..."
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
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
          </select>
          
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as any)}
            className="px-2 py-1 bg-canvas border border-white/10 rounded text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="severity">By Severity</option>
            <option value="source">By Source</option>
            <option value="file">By File</option>
          </select>
          
          <button
            onClick={() => clearDiagnostics()}
            className="p-1.5 rounded hover:bg-white/[0.06] text-white/50 hover:text-white transition-colors"
            title="Clear All"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary Counts */}
      <div className="flex gap-3 px-2 py-1 border-b border-white/[0.06] text-xs">
        <span className="flex items-center gap-1 text-red-400">
          <AlertCircle className="w-3 h-3" />
          {getBySeverity('error').length} errors
        </span>
        <span className="flex items-center gap-1 text-amber-400">
          <AlertTriangle className="w-3 h-3" />
          {getBySeverity('warning').length} warnings
        </span>
        <span className="flex items-center gap-1 text-blue-400">
          <Info className="w-3 h-3" />
          {getBySeverity('info').length} info
        </span>
      </div>

      {/* Problems List */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 p-8">
            <FileText className="w-12 h-12 mb-3 opacity-50" />
            <span>{filter === 'all' ? 'No problems detected' : `No ${filter}s`}</span>
            <span className="text-xs text-white/30 mt-1">Problems appear here from TypeScript, ESLint, runtime, and preview</span>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {Object.entries(grouped).map(([key, items]) => {
              const isExpanded = expandedGroups[key] !== false;
              const config = severityConfig[key as keyof typeof severityConfig] || { icon: Info, color: 'text-white/60', bg: 'bg-white/5' };
              const Icon = config.icon;
              
              return (
                <div key={key} className="border border-white/5 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleGroup(key)}
                    className={twMerge(
                      'w-full px-3 py-2 flex items-center gap-2 transition-colors',
                      'hover:bg-white/[0.02]',
                      config.bg
                    )}
                  >
                    <Icon className={twMerge('w-4 h-4 flex-shrink-0', config.color)} />
                    <span className="font-medium flex-1 text-left">{getGroupLabel(key)}</span>
                    <span className="px-2 py-0.5 text-xs bg-white/10 rounded">{getGroupCount(key)}</span>
                    <span className={clsx(
                      'w-4 h-4 flex items-center justify-center transition-transform',
                      isExpanded && 'rotate-90'
                    )}>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="divide-y divide-white/5">
                      {items.map((diag) => (
                        <div
                          key={diag.id}
                          className="px-3 py-2 text-xs hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <span className={twMerge('w-4 h-4 flex-shrink-0 mt-0.5', config.color)}>
                              <Icon className="w-3 h-3" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white/90">{diag.message}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-white/50">
                                {diag.filePath && (
                                  <span className="font-mono truncate max-w-[200px]">
                                    {diag.filePath}
                                    {diag.line && `:${diag.line}`}
                                    {diag.column && `:${diag.column}`}
                                  </span>
                                )}
                                <span className="text-white/40">{diag.source}</span>
                                {diag.code && (
                                  <span className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] font-mono">
                                    {diag.code}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};