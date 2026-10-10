import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Package, Download, ExternalLink, Loader2, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { NpmService, NpmPackageResult, NpmPackageDetail } from '@/services/npmService';
import { EsmTypeService } from '@/services/esmTypeService';
import { useProjectStore } from '@/stores/useProjectStore';
import { useFileStore } from '@/stores/useFileStore';

interface NpmSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NpmSearchModal: React.FC<NpmSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NpmPackageResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState<NpmPackageDetail | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [installingTypes, setInstallingTypes] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { activeProjectId } = useProjectStore();
  const { files } = useFileStore();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await NpmService.searchPackages(debouncedQuery, 30);
        setResults(data);
        setSelectedIndex(0);
      } catch (err: any) {
        setError(err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedQuery]);

  // Load package detail on selection change
  useEffect(() => {
    if (results[selectedIndex]) {
      loadPackageDetail(results[selectedIndex].name);
    }
  }, [selectedIndex, results]);

  const loadPackageDetail = async (name: string) => {
    try {
      const detail = await NpmService.getPackageDetail(name);
      setShowDetail(detail);
    } catch {
      setShowDetail(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showDetail) {
        setShowDetail(null);
      } else {
        onClose();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex] && !showDetail) {
        setShowDetail(await NpmService.getPackageDetail(results[selectedIndex].name));
      }
    } else if (e.key === 'Tab' && showDetail) {
      e.preventDefault();
      installPackage(results[selectedIndex].name, showDetail.version);
    }
  };

  const installPackage = async (name: string, version: string, dev = false) => {
    if (!activeProjectId) {
      setError('No active project');
      return;
    }

    setInstalling(name);
    try {
      const result = await NpmPackageInstaller.installPackage(activeProjectId, name, version, dev);
      if (result.success) {
        // Also install types for Monaco
        await installTypes(name, version);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInstalling(null);
    }
  };

  const installTypes = async (name: string, version: string) => {
    setInstallingTypes(name);
    try {
      await EsmTypeService.injectIntoMonaco(name, version);
    } catch (err) {
      console.warn('Failed to install types:', err);
    } finally {
      setInstallingTypes(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="w-[720px] max-w-[95vw] max-h-[85vh] bg-[#161820] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="npm Package Search"
      >
        {/* Header */}
        <div className="h-12 border-b border-white/[0.06] flex items-center px-4 space-x-3 bg-gradient-to-r from-indigo-600/10 to-cyan-500/10">
          <Package className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-white">npm Package Search</span>
          <div className="flex-1" />
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search npm packages..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              autoComplete="off"
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 animate-spin" />}
          </div>
          {error && (
            <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {error}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Results List */}
          <div className="w-80 border-r border-white/[0.06] overflow-y-auto max-h-full">
            {results.length === 0 && !loading && query.trim() ? (
              <div className="p-8 text-center text-white/40">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No packages found for "{query}"</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {results.map((pkg, i) => {
                  const isSelected = i === selectedIndex;
                  return (
                    <button
                      key={pkg.name}
                      onClick={() => {
                        setSelectedIndex(i);
                        loadPackageDetail(pkg.name);
                      }}
                      className={twMerge(
                        'w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3',
                        isSelected ? 'bg-indigo-600/30' : 'hover:bg-white/[0.03]'
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{pkg.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50 font-mono">
                            v{pkg.version}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/50 truncate">{pkg.description || 'No description'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div className="flex-1 overflow-y-auto p-4">
            {showDetail ? (
              <PackageDetailPanel
                pkg={showDetail}
                onInstall={(name, version, dev) => installPackage(name, version, dev)}
                onInstallTypes={(name, version) => installTypes(name, version)}
                installing={installing}
                installingTypes={installingTypes}
                activeProjectId={activeProjectId}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/30">
                <Search className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm">Select a package to view details</p>
                <p className="text-xs mt-1">Press Enter to view details, Tab to install</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-4 py-2 flex items-center justify-between text-[10px] text-white/40">
          <span>{results.length} result(s)</span>
          <span>↑↓ Navigate • ⏎ Details • Tab Install • ESC Close</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

const PackageDetailPanel: React.FC<{
  pkg: NpmPackageDetail;
  onInstall: (name: string, version: string, dev: boolean) => void;
  onInstallTypes: (name: string, version: string) => void;
  installing: string | null;
  installingTypes: string | null;
  activeProjectId: string | null;
}> = ({ pkg, onInstall, onInstallTypes, installing, installingTypes, activeProjectId }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="h-full space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
          <Package className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-white/[0.06] text-white/50 font-mono">v{pkg.version}</span>
            {pkg.license && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">{pkg.license}</span>
            )}
          </div>
          <p className="text-sm text-white/70 mt-1 line-clamp-2">{pkg.description || 'No description'}</p>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-white/50">
            <span>{Object.keys(pkg.dependencies || {}).length} deps</span>
            <span>{Object.keys(pkg.devDependencies || {}).length} dev deps</span>
            <span>{pkg.keywords?.slice(0, 3).join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onInstall(pkg.name, pkg.version, false)}
          disabled={!activeProjectId || installing === pkg.name}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            'bg-indigo-600 text-white hover:bg-indigo-500',
            !activeProjectId && 'opacity-50 cursor-not-allowed'
          )}
        >
          {installing === pkg.name ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Installing...
            </>
          ) : (
            <>
              <Download className="w-3 h-3" />
              Install
            </>
          )}
        </button>
        <button
          onClick={() => onInstall(pkg.name, pkg.version, true)}
          disabled={!activeProjectId || installing === pkg.name}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            'bg-surface border border-white/10 text-white/80 hover:bg-white/5',
            !activeProjectId && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Download className="w-3 h-3" />
          Install (dev)
        </button>
        <button
          onClick={() => onInstallTypes(pkg.name, pkg.version)}
          disabled={installingTypes === pkg.name}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            'bg-surface border border-white/10 text-white/80 hover:bg-white/5'
          )}
        >
          {installingTypes === pkg.name ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Adding Types...
            </>
          ) : (
            <>
              <CheckCircle className="w-3 h-3" />
              Add Types
            </>
          )}
        </button>
        {pkg.links?.homepage && (
          <a href={pkg.links.homepage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white transition-colors">
            <ExternalLink className="w-3 h-3" />
            Homepage
          </a>
        )}
        {pkg.links?.repository && (
          <a href={pkg.links.repository} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white transition-colors">
            <ExternalLink className="w-3 h-3" />
            Repository
          </a>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {pkg.readme && (
          <DetailSection title="README" expanded={expanded.readme} onToggle={() => setExpanded({...expanded, readme: !expanded.readme})}>
            <div className="prose prose-invert max-w-none text-sm text-white/70 whitespace-pre-wrap">{pkg.readme.substring(0, 2000)}</div>
          </DetailSection>
        )}

        <DetailSection title="Dependencies" expanded={expanded.deps} onToggle={() => setExpanded({...expanded, deps: !expanded.deps})}>
          <DependencyList deps={pkg.dependencies} title="Dependencies" />
          <DependencyList deps={pkg.devDependencies} title="Dev Dependencies" />
        </DetailSection>

        <DetailSection title="Versions" expanded={expanded.versions} onToggle={() => setExpanded({...expanded, versions: !expanded.versions})}>
          <div className="flex flex-wrap gap-1">
            {Object.keys(pkg.versions).reverse().slice(0, 20).map(v => (
              <span key={v} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/10 cursor-pointer transition-colors">
                {v}
              </span>
            ))}
          </div>
        </DetailSection>
      </div>
    </div>
  );
};

const DetailSection: React.FC<{
  title: string;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}> = ({ title, children, expanded, onToggle }) => (
  <div className="bg-surface border border-white/10 rounded-lg overflow-hidden">
    <button onClick={onToggle} className="w-full px-3 py-2 flex items-center justify-between text-sm font-medium text-white/80 hover:bg-white/[0.03] transition-colors">
      <span>{title}</span>
      <ChevronDown className={clsx('w-4 h-4 text-white/40 transition-transform', expanded && 'rotate-180')} />
    </button>
    {expanded && <div className="p-3 border-t border-white/10">{children}</div>}
  </div>
);

const DependencyList: React.FC<{ deps: Record<string, string>; title: string }> = ({ deps, title }) => {
  const entries = Object.entries(deps || {});
  if (entries.length === 0) return null;

  return (
    <div className="space-y-1 pt-2">
      <span className="text-[10px] text-white/40 uppercase tracking-wider">{title}</span>
      <div className="flex flex-wrap gap-1">
        {entries.map(([name, version]) => (
          <span key={name} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-white/60">
            {name}@{version}
          </span>
        ))}
      </div>
    </div>
  );
};

// Import missing
import { useRef } from 'react';
import { NpmPackageInstaller } from '@/services/npmService';