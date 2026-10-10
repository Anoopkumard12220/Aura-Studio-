import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { Terminal, FileText, AlertTriangle, Eye, Bug } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TerminalPanel } from '@/components/terminal/TerminalPanel';
import { PreviewPanel } from '@/components/preview/PreviewPanel';
import { ProblemsPanel } from '@/components/diagnostics/ProblemsPanel';
import { ConsoleLogViewer } from '@/components/diagnostics/ConsoleLogViewer';

const bottomTabs = [
  { id: 'terminal' as const, icon: Terminal, label: 'Terminal' },
  { id: 'output' as const, icon: FileText, label: 'Output' },
  { id: 'problems' as const, icon: AlertTriangle, label: 'Problems' },
  { id: 'console' as const, icon: Bug, label: 'Debug Console' },
  { id: 'preview' as const, icon: Eye, label: 'Preview' },
] as const;

interface BottomPanelRef {
  focusTerminal: () => void;
  newTerminalTab: () => void;
}

export const BottomPanel = forwardRef<BottomPanelRef, {}>(
  ({}, ref) => {
    const { 
      isBottomPanelOpen, 
      bottomPanelHeight, 
      activeBottomTab, 
      setActiveBottomTab,
      toggleBottomPanel 
    } = useLayoutStore();
    const { activeProjectId } = useProjectStore();

    const terminalPanelRef = useRef<TerminalPanel>(null);

    useImperativeHandle(ref, () => ({
      focusTerminal: () => {
        terminalPanelRef.current?.focus();
      },
      newTerminalTab: () => {
        terminalPanelRef.current?.newTab();
      },
    }));

    if (!isBottomPanelOpen) return null;

    return (
      <div
        className="flex flex-col bg-surface border-t border-white/[0.06] transition-all duration-150"
        style={{ height: bottomPanelHeight }}
      >
        <div className="flex items-center border-b border-white/[0.06] px-2 bg-frame">
          <div className="flex items-center space-x-1">
            {bottomTabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveBottomTab(id)}
                className={twMerge(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
                  'text-white/60 hover:text-white hover:bg-white/[0.06]',
                  activeBottomTab === id ? 'text-indigo-400 bg-indigo-500/10' : ''
                )}
                title={label}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button
            onClick={toggleBottomPanel}
            className="p-1.5 hover:bg-white/[0.06] rounded text-white/50 hover:text-white transition-colors"
            title="Close Panel"
          >
            <span className="w-4 h-4">✕</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          {activeBottomTab === 'terminal' && (
            <TerminalPanel
              ref={terminalPanelRef}
              isOpen={true}
              onClose={() => {}}
            />
          )}
          {activeBottomTab === 'output' && (
            <div className="h-full w-full bg-canvas font-mono text-xs text-secondary p-3 overflow-auto scrollbar-thin">
              <div className="text-white/50">Runtime output streams here</div>
              <div className="text-white/30 text-xs mt-2 font-mono">
                Execution output from WebContainer, Pyodide, and remote sandboxes
              </div>
            </div>
          )}
          {activeBottomTab === 'problems' && (
            <ProblemsPanel />
          )}
          {activeBottomTab === 'console' && (
            <ConsoleLogViewer />
          )}
          {activeBottomTab === 'preview' && (
            <PreviewPanel
              projectId={activeProjectId}
              isOpen={true}
              onClose={() => setActiveBottomTab('terminal')}
            />
          )}
        </div>
      </div>
    );
  }
);

BottomPanel.displayName = 'BottomPanel';