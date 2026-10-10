import React from 'react';
import { useDiagnosticsStore } from '@/stores/useDiagnosticsStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface DiagnosticBadgeProps {
  source?: string;
  filePath?: string;
  className?: string;
  showZero?: boolean;
  compact?: boolean;
}

export const DiagnosticBadge: React.FC<DiagnosticBadgeProps> = ({ 
  source, 
  filePath, 
  className, 
  showZero = false,
  compact = false,
}) => {
  const { diagnostics, getBySeverity, getBySource, getByFile } = useDiagnosticsStore();
  
  let relevant = diagnostics;
  if (source) relevant = getBySource(source);
  if (filePath) relevant = getByFile(filePath);
  
  const errors = relevant.filter(d => d.severity === 'error').length;
  const warnings = relevant.filter(d => d.severity === 'warning').length;
  const infos = relevant.filter(d => d.severity === 'info').length;
  const total = relevant.length;

  if (total === 0 && !showZero) return null;

  const hasErrors = errors > 0;
  const hasWarnings = warnings > 0;

  if (compact) {
    return (
      <span className={twMerge(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
        hasErrors ? 'bg-red-500/20 text-red-400' :
        hasWarnings ? 'bg-amber-500/20 text-amber-400' :
        'bg-blue-500/20 text-blue-400',
        className
      )}>
        {hasErrors && (
          <span className="flex items-center gap-0.5">
            <AlertCircle className="w-2.5 h-2.5" />
            {errors}
          </span>
        )}
        {hasWarnings && (
          <span className="flex items-center gap-0.5">
            <AlertTriangle className="w-2.5 h-2.5" />
            {warnings}
          </span>
        )}
        {infos > 0 && !hasErrors && !hasWarnings && (
          <span className="flex items-center gap-0.5">
            <Info className="w-2.5 h-2.5" />
            {infos}
          </span>
        )}
        {total === 0 && (
          <span className="text-white/50">Clean</span>
        )}
      </span>
    );
  }

  return (
    <div className={twMerge('flex items-center gap-1.5', className)}>
      {errors > 0 && (
        <span className={clsx(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
          'bg-red-500/20 text-red-400'
        )}>
          <AlertCircle className="w-3 h-3" />
          {errors}
        </span>
      )}
      {warnings > 0 && (
        <span className={clsx(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
          'bg-amber-500/20 text-amber-400'
        )}>
          <AlertTriangle className="w-3 h-3" />
          {warnings}
        </span>
      )}
      {infos > 0 && !hasErrors && !hasWarnings && (
        <span className={clsx(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
          'bg-blue-500/20 text-blue-400'
        )}>
          <Info className="w-3 h-3" />
          {infos}
        </span>
      )}
      {total === 0 && showZero && (
        <span className={clsx(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
          'bg-green-500/20 text-green-400'
        )}>
          Clean
        </span>
      )}
    </div>
  );
};

export const FileDiagnosticIndicator: React.FC<{ filePath: string; className?: string }> = ({ 
  filePath, 
  className 
}) => {
  const { getByFile } = useDiagnosticsStore();
  const diagnostics = getByFile(filePath);
  
  const hasErrors = diagnostics.some(d => d.severity === 'error');
  const hasWarnings = diagnostics.some(d => d.severity === 'warning');
  
  if (!hasErrors && !hasWarnings) return null;

  return (
    <span className={twMerge(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
      hasErrors ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400',
      className
    )}>
      {hasErrors ? (
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      )}
    </span>
  );
};