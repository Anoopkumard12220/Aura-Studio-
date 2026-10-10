import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shield, AlertTriangle, AlertCircle, Info, CheckCircle, X, Loader2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { OSVService, OSVVulnerability } from '@/services/osvService';
import { useFileStore } from '@/stores/useFileStore';
import { useProjectStore } from '@/stores/useProjectStore';

interface PackageSecurityReportProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PackageSecurityReport: React.FC<PackageSecurityReportProps> = ({ isOpen, onClose }) => {
  const [vulnerabilities, setVulnerabilities] = useState<Map<string, OSVVulnerability[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState({ critical: 0, high: 0, moderate: 0, low: 0, total: 0 });
  const { files } = useFileStore();
  const { activeProjectId } = useProjectStore();

  const runAudit = useCallback(async () => {
    if (!activeProjectId) {
      setError('No active project');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find package.json in project
      const packageJsonFile = Object.values(files).find(
        f => f.projectId === activeProjectId && f.name === 'package.json'
      );

      if (!packageJsonFile) {
        setError('No package.json found in project');
        setVulnerabilities(new Map());
        return;
      }

      let packageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      try {
        packageJson = JSON.parse(packageJsonFile.content);
      } catch {
        setError('Invalid package.json');
        return;
      }

      const results = await OSVService.auditPackageJson(packageJson);
      setVulnerabilities(results);

      // Calculate summary
      let critical = 0, high = 0, moderate = 0, low = 0, total = 0;
      results.forEach(vulns => {
        vulns.forEach(v => {
          total++;
          const severity = OSVService.getSeverityLabel(v).toLowerCase();
          if (severity.includes('critical')) critical++;
          else if (severity.includes('high')) high++;
          else if (severity.includes('moderate') || severity.includes('medium')) moderate++;
          else low++;
        });
      });
      setSummary({ critical, high, moderate, low, total });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, files]);

  useEffect(() => {
    if (isOpen) {
      runAudit();
    }
  }, [isOpen, runAudit]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getSeverityColor = (severity: string) => {
    return OSVService.getSeverityColor(severity);
  };

  const getAllVulns = () => {
    const all: Array<{ pkg: string; vuln: OSVVulnerability }> = [];
    vulnerabilities.forEach((vulns, pkg) => {
      vulns.forEach(v => all.push({ pkg, vuln: v }));
    });
    return all;
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="w-[800px] max-w-[95vw] max-h-[85vh] bg-[#161820] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Security Audit Report"
      >
        {/* Header */}
        <div className="h-12 border-b border-white/[0.06] flex items-center px-4 space-x-3 bg-gradient-to-r from-red-600/10 to-amber-500/10">
          <Shield className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-white">Security Audit (OSV)</span>
          <div className="flex-1" />
          {summary.total > 0 && (
            <div className="flex items-center gap-4 text-xs">
              <span className="text-red-400">{summary.critical} Critical</span>
              <span className="text-red-300">{summary.high} High</span>
              <span className="text-amber-400">{summary.moderate} Moderate</span>
              <span className="text-yellow-400">{summary.low} Low</span>
            </div>
          )}
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
          <button
            onClick={runAudit}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Shield className="w-3 h-3" />
                Re-scan
              </>
            )}
          </button>

          {error && (
            <span className="flex items-center gap-1 text-xs text-red-400 ml-auto">
              <AlertTriangle className="w-3 h-3" />
              {error}
            </span>
          )}

          {summary.total === 0 && !loading && !error && (
            <div className="flex items-center gap-2 text-green-400 ml-auto">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">No vulnerabilities found</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-white/40">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mb-4" />
              <p>Scanning dependencies...</p>
            </div>
          ) : getAllVulns().length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/30">
              <Shield className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-sm">No vulnerabilities detected</p>
              <p className="text-xs mt-1">Your dependencies appear to be secure</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getAllVulns().map(({ pkg, vuln }, index) => {
                const vulnId = `${pkg}-${vuln.id}`;
                const isExpanded = expanded.has(vulnId);
                const severity = OSVService.getSeverityLabel(vuln);
                const severityColor = getSeverityColor(severity);

                return (
                  <div key={vulnId} className="bg-surface border border-white/10 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleExpand(vulnId)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/[0.03] transition-colors"
                    >
                      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', severityColor.replace('text', 'bg').replace('400', '200').replace('500', '200'))}>
                        {severity.toLowerCase().includes('critical') && <AlertTriangle className={clsx('w-4 h-4', severityColor)} />}
                        {severity.toLowerCase().includes('high') && <AlertCircle className={clsx('w-4 h-4', severityColor)} />}
                        {severity.toLowerCase().includes('moderate') && <AlertTriangle className={clsx('w-4 h-4', severityColor)} />}
                        {severity.toLowerCase().includes('low') && <Info className={clsx('w-4 h-4', severityColor)} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white truncate">{pkg}</span>
                          <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', severityColor)}>{severity}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50 font-mono">{vuln.id}</span>
                        </div>
                        <p className="text-[11px] text-white/60 truncate mt-0.5">{vuln.summary || vuln.details?.substring(0, 100) || 'No description'}</p>
                      </div>
                      <ChevronDown className={clsx('w-4 h-4 text-white/40 transition-transform flex-shrink-0', isExpanded && 'rotate-180')} />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-white/10 p-4 space-y-3">
                        <div className="prose prose-invert max-w-none text-sm text-white/70">
                          <p>{vuln.details || 'No details available'}</p>
                        </div>

                        {vuln.affected && vuln.affected.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Affected Versions</h5>
                            <div className="flex flex-wrap gap-1">
                              {vuln.affected.flatMap(a => a.versions || []).slice(0, 10).map(v => (
                                <span key={v} className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">{v}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {vuln.references && vuln.references.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">References</h5>
                            <div className="space-y-1">
                              {vuln.references.slice(0, 5).map((ref, i) => (
                                <a key={i} href={ref.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
                                  <ExternalLink className="w-3 h-3" />
                                  <span className="truncate">{ref.url}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
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
          <span>Powered by OSV (Open Source Vulnerabilities)</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>,
    document.body
  );
};