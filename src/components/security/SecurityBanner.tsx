import React, { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertTriangle, AlertCircle, Info, X, ChevronDown, ChevronUp, Shield, Zap } from 'lucide-react';
import { memoryMonitor, MemoryInfo } from '@/services/memoryMonitor';
import { securityAudit, SecurityViolation } from '@/services/securityAudit';

interface SecurityBannerProps {
  onDismiss?: () => void;
  showMemoryWarning?: boolean;
  showSecurityViolations?: boolean;
  maxVisible?: number;
}

interface BannerItem {
  id: string;
  type: 'memory' | 'security' | 'csp' | 'performance';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  details?: string;
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
}

export const SecurityBanner: React.FC<SecurityBannerProps> = ({
  onDismiss,
  showMemoryWarning = true,
  showSecurityViolations = true,
  maxVisible = 3,
}) => {
  const [items, setItems] = useState<BannerItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Monitor memory
  useEffect(() => {
    if (!showMemoryWarning) return;

    const handleMemoryWarning = (e: CustomEvent) => {
      const { type, info } = e.detail;
      const id = `memory-${type}`;
      
      const item: BannerItem = {
        id,
        type: 'memory',
        severity: type === 'critical' ? 'critical' : 'warning',
        title: type === 'critical' ? 'Critical Memory Usage' : 'High Memory Usage',
        message: `Heap usage at ${(info.usedPercentage * 100).toFixed(1)}% (${memoryMonitor.formatBytes(info.usedJSHeapSize)} / ${memoryMonitor.formatBytes(info.jsHeapSizeLimit)})`,
        details: `Consider closing inactive editor tabs or restarting the IDE.`,
        action: {
          label: type === 'critical' ? 'Force GC' : 'Close Tabs',
          onClick: type === 'critical' ? () => memoryMonitor.forceGC() : () => window.dispatchEvent(new CustomEvent('aura-close-inactive-tabs')),
        },
        dismissible: true,
      };

      setItems(prev => {
        const filtered = prev.filter(i => i.id !== id);
        return [item, ...filtered].slice(0, maxVisible);
      });
    };

    window.addEventListener('aura-memory-warning', handleMemoryWarning as EventListener);
    return () => window.removeEventListener('aura-memory-warning', handleMemoryWarning as EventListener);
  }, [showMemoryWarning, maxVisible]);

  // Monitor security violations
  useEffect(() => {
    if (!showSecurityViolations) return;

    const handleSecurityViolation = (violation: SecurityViolation) => {
      const id = `security-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      
      const item: BannerItem = {
        id,
        type: 'security',
        severity: violation.severity as 'info' | 'warning' | 'critical',
        title: 'Security Violation Detected',
        message: violation.message,
        details: violation.source ? `Source: ${violation.source}` : undefined,
        dismissible: true,
      };

      setItems(prev => [item, ...prev].slice(0, maxVisible));
    };

    const unsubscribe = securityAudit.subscribe(handleSecurityViolation);
    return unsubscribe;
  }, [showSecurityViolations, maxVisible]);

  // Auto-clear old memory warnings
  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev => {
        const now = Date.now();
        return prev.filter(item => {
          if (item.type !== 'memory') return true;
          // Keep memory warnings for 30 seconds
          const timestamp = parseInt(item.id.split('-')[1] || '0');
          return now - timestamp < 30000;
        });
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) return null;

  const visibleItems = items.slice(0, maxVisible);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none animate-slide-down">
      {visibleItems.map((item, index) => (
        <div
          key={item.id}
          className="pointer-events-auto mx-4 my-2"
          role="alert"
          aria-live="polite"
        >
          <SecurityBannerItem
            item={item}
            expanded={expanded === item.id}
            onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
            onDismiss={() => {
              setItems(prev => prev.filter(i => i.id !== item.id));
              onDismiss?.();
            }}
          />
        </div>
      ))}
    </div>
  );
};

interface SecurityBannerItemProps {
  item: BannerItem;
  expanded: boolean;
  onToggle: () => void;
  onDismiss: () => void;
}

const SecurityBannerItem: React.FC<SecurityBannerItemProps> = ({ item, expanded, onToggle, onDismiss }) => {
  const severityColors = {
    info: { bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-400', icon: <Info className="w-4 h-4" /> },
    warning: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400', icon: <AlertTriangle className="w-4 h-4" /> },
    critical: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', icon: <AlertCircle className="w-4 h-4" /> },
  };

  const colors = severityColors[item.severity];
  const typeIcons = {
    memory: <Zap className="w-4 h-4" />,
    security: <Shield className="w-4 h-4" />,
    csp: <AlertTriangle className="w-4 h-4" />,
    performance: <Zap className="w-4 h-4" />,
  };

  return (
    <div className={twMerge(
      'rounded-xl p-4 shadow-xl backdrop-blur-md transition-all',
      colors.bg,
      colors.border,
      'border'
    )}>
      <div className="flex items-start gap-3">
        <div className={clsx('flex-shrink-0 mt-0.5', colors.text)}>
          {typeIcons[item.type] || colors.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h4 className={clsx('text-sm font-medium', colors.text)}>{item.title}</h4>
              <p className="text-xs text-white/70 mt-0.5">{item.message}</p>
            </div>
            <button
              onClick={onDismiss}
              className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors flex-shrink-0 ml-2"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {item.details && (
            <div className={twMerge(
              'mt-2 text-[11px] text-white/60 transition-all overflow-hidden',
              expanded ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
            )}>
              {item.details}
            </div>
          )}

          {item.action && (
            <div className="mt-3">
              <button
                onClick={item.action.onClick}
                className={twMerge(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  item.severity === 'critical'
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
                )}
              >
                {item.action.label}
              </button>
            </div>
          )}

          {item.details && (
            <button
              onClick={onToggle}
              className={twMerge(
                'mt-2 flex items-center gap-1 text-[10px] text-white/50 hover:text-white transition-colors',
                'border-t border-white/10 pt-2'
              )}
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>{expanded ? 'Hide details' : 'Show details'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const MemoryWarningBanner: React.FC<{ threshold?: number }> = ({ threshold = 0.8 }) => {
  const [show, setShow] = useState(false);
  const [info, setInfo] = useState<MemoryInfo | null>(null);

  useEffect(() => {
    const handleWarning = (e: CustomEvent) => {
      const { type, info } = e.detail;
      if (info.usedPercentage >= threshold) {
        setInfo(info);
        setShow(true);
      }
    };

    window.addEventListener('aura-memory-warning', handleWarning as EventListener);
    return () => window.removeEventListener('aura-memory-warning', handleWarning as EventListener);
  }, [threshold]);

  if (!show || !info) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40 animate-slide-down pointer-events-auto">
      <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-400">Critical Memory Usage</h4>
            <p className="text-xs text-white/70 mt-1">
              Heap at {(info.usedPercentage * 100).toFixed(1)}% ({memoryMonitor.formatBytes(info.usedJSHeapSize)} used)
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => { memoryMonitor.forceGC(); setShow(false); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30"
              >
                Force GC
              </button>
              <button
                onClick={() => { window.dispatchEvent(new CustomEvent('aura-close-inactive-tabs')); setShow(false); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-white/10 text-white/80 hover:bg-white/5"
              >
                Close Tabs
              </button>
            </div>
          </div>
          <button onClick={() => setShow(false)} className="p-1 text-white/50 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const CSPViolationBanner: React.FC = () => {
  const [violations, setViolations] = useState<SecurityViolation[]>([]);

  useEffect(() => {
    const unsubscribe = securityAudit.subscribe((violation) => {
      setViolations(prev => [violation, ...prev].slice(0, 5));
    });
    return unsubscribe;
  }, []);

  if (violations.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40 animate-slide-down">
      {violations.map((v, i) => (
        <div key={i} className="mb-2">
          <SecurityBannerItem
            item={{
              id: `csp-${i}`,
              type: 'csp',
              severity: v.severity as 'info' | 'warning' | 'critical',
              title: 'CSP Violation',
              message: v.message,
              details: v.source,
              dismissible: true,
            }}
            expanded={false}
            onToggle={() => {}}
            onDismiss={() => setViolations(prev => prev.filter((_, idx) => idx !== i))}
          />
        </div>
      ))}
    </div>
  );
};