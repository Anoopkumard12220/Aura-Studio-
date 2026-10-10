import React from 'react';
import { runtimeManager } from '@/runtimes/RuntimeManager';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Play, Square, RotateCcw, Terminal, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ExecutionControlsProps {
  state: 'idle' | 'initializing' | 'compiling' | 'running' | 'completed' | 'failed' | 'cancelled';
  onRun: () => void;
  onStop: () => void;
  onRestart: () => void;
  exitCode?: number;
  durationMs?: number;
  language?: string;
}

export const ExecutionControls: React.FC<ExecutionControlsProps> = ({
  state,
  onRun,
  onStop,
  onRestart,
  exitCode,
  durationMs,
  language,
}) => {
  const isRunning = ['initializing', 'compiling', 'running'].includes(state);
  const isFinished = ['completed', 'failed', 'cancelled'].includes(state);

  const stateConfig = {
    idle: { label: 'Ready', icon: Zap, color: 'text-green-400', bg: 'bg-green-400/10' },
    initializing: { label: 'Initializing...', icon: Loader2, color: 'text-indigo-400', bg: 'bg-indigo-400/10', animate: true },
    compiling: { label: 'Compiling...', icon: Loader2, color: 'text-amber-400', bg: 'bg-amber-400/10', animate: true },
    running: { label: 'Running...', icon: Loader2, color: 'text-cyan-400', bg: 'bg-cyan-400/10', animate: true },
    completed: { 
      label: exitCode === 0 ? 'Completed' : `Failed (${exitCode})`, 
      icon: exitCode === 0 ? CheckCircle : XCircle, 
      color: exitCode === 0 ? 'text-green-400' : 'text-red-400',
      bg: exitCode === 0 ? 'bg-green-400/10' : 'bg-red-400/10'
    },
    failed: { label: `Failed (${exitCode})`, icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
    cancelled: { label: 'Cancelled', icon: Square, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  };

  const config = stateConfig[state];

  return (
    <div className="flex items-center gap-3">
      {/* Status Badge */}
      <div className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-medium',
        config.bg,
        config.color
      )}>
        {config.animate && <config.icon className="w-4 h-4 animate-spin" />}
        {!config.animate && <config.icon className="w-4 h-4" />}
        <span>{config.label}</span>
        {durationMs && (
          <span className="text-white/50 ml-1">({durationMs}ms)</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {!isRunning && (
          <button
            onClick={onRun}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors',
              'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700'
            )}
            title="Run (Ctrl+Enter)"
          >
            <Play className="w-4 h-4" />
            <span>Run</span>
          </button>
        )}

        {isRunning && (
          <button
            onClick={onStop}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors',
              'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700'
            )}
            title="Stop (Ctrl+C)"
          >
            <Square className="w-4 h-4" />
            <span>Stop</span>
          </button>
        )}

        {isFinished && (
          <button
            onClick={onRestart}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors',
              'bg-surface border border-white/10 text-white hover:bg-white/5 hover:border-white/20'
            )}
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart</span>
          </button>
        )}

        {/* Quick Terminal Button */}
        <button
          className={clsx(
            'p-2 rounded-lg transition-colors',
            'bg-surface border border-white/10 text-white/70 hover:bg-white/5 hover:border-white/20 hover:text-white'
          )}
          title="Open Terminal"
        >
          <Terminal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};