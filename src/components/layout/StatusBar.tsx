import React from 'react';
import { useFileStore } from '@/stores/useFileStore';
import { useEditorStore } from '@/stores/useEditorStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { GitBranch, FileText, Zap, Bell, Terminal, Play, Square, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { runtimeManager } from '@/runtimes/RuntimeManager';
import { RuntimeStatusBadge } from '@/components/runtime/RuntimeStatusBadge';
import { OfflineStatusBarItem } from '@/components/pwa/OfflineStatusBarItem';

export const StatusBar: React.FC = () => {
  const { activeFileId, files } = useFileStore();
  const { activeTabId, tabs } = useEditorStore();
  const { activeProjectId, projects } = useProjectStore();
  const { activeBottomTab } = useLayoutStore();
  
  const activeFile = activeFileId ? files[activeFileId] : null;
  const activeTab = activeTabId ? tabs.find(t => t.fileId === activeTabId) : null;
  const activeProject = activeProjectId ? projects.find(p => p.id === activeProjectId) : null;
  
  const executionState = runtimeManager.getState();
  const currentRequest = runtimeManager.getCurrentRequest();

  const getLanguage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: 'TypeScript', tsx: 'TSX', js: 'JavaScript', jsx: 'JSX',
      json: 'JSON', css: 'CSS', html: 'HTML', md: 'Markdown',
      py: 'Python', rs: 'Rust', go: 'Go', java: 'Java',
      cpp: 'C++', c: 'C', cs: 'C#', php: 'PHP', rb: 'Ruby',
      swift: 'Swift', kt: 'Kotlin', sh: 'Bash', rs: 'Rust',
    };
    return langMap[ext || ''] || 'Plain Text';
  };

  const getEncoding = () => 'UTF-8';
  const getLineEnding = () => 'LF';
  const getCursorPosition = () => 'Ln 1, Col 1';

  const executionStateConfig = {
    idle: { label: 'Ready', icon: Zap, color: 'text-green-400', bg: 'bg-green-400/10' },
    initializing: { label: 'Initializing...', icon: Loader2, color: 'text-indigo-400', bg: 'bg-indigo-400/10', animate: true },
    compiling: { label: 'Compiling...', icon: Loader2, color: 'text-amber-400', bg: 'bg-amber-400/10', animate: true },
    running: { label: 'Running...', icon: Loader2, color: 'text-cyan-400', bg: 'bg-cyan-400/10', animate: true },
    completed: { 
      label: 'Completed', 
      icon: CheckCircle, 
      color: 'text-green-400', 
      bg: 'bg-green-400/10' 
    },
    failed: { label: 'Failed', icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
    cancelled: { label: 'Cancelled', icon: Square, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  };

  const execConfig = executionStateConfig[executionState];

  return (
    <div className="h-6 bg-frame border-t border-white/[0.06] flex items-center px-3 text-xs text-white/70">
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-white/50">
          <GitBranch className="w-3 h-3" />
          <span>{activeProject?.name || 'No Project'}</span>
        </div>
        
        {activeFile && (
          <div className="flex items-center gap-1.5">
            <FileText className="w-3 h-3" />
            <span className="truncate max-w-[200px]">{activeFile.name}</span>
            {activeTab?.isDirty && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-surface border border-white/10 rounded">
          <span>{getEncoding()}</span>
          <span className="text-white/20 mx-1">|</span>
          <span>{getLineEnding()}</span>
        </div>
        
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-surface border border-white/10 rounded cursor-pointer hover:bg-white/5 transition-colors">
          {activeTab && (
            <>
              <span>{activeTab.language || getLanguage(activeFile?.name || '')}</span>
              <span className="text-white/20">|</span>
              <span>{getCursorPosition()}</span>
            </>
          )}
        </div>

        {/* Runtime Status Badge */}
        {currentRequest && (
          <RuntimeStatusBadge language={currentRequest.language} />
        )}

        {/* Execution State */}
        <div className={clsx(
          'flex items-center gap-1.5 px-2 py-0.5 rounded font-mono',
          execConfig.bg,
          execConfig.color
        )}>
          {execConfig.animate && <execConfig.icon className="w-3.5 h-3.5 animate-spin" />}
          {!execConfig.animate && <execConfig.icon className="w-3.5 h-3.5" />}
          <span>{execConfig.label}</span>
        </div>
        
        {/* Network/Offline Status */}
        <OfflineStatusBarItem />
        
        <div className="flex items-center gap-1.5 text-white/50">
          <Terminal className="w-3.5 h-3.5" />
          <span onClick={() => useLayoutStore.getState().setActiveBottomTab('terminal')}>
            Terminal
          </span>
        </div>
        
        <button className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};