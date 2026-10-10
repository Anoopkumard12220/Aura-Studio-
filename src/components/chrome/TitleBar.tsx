import React from 'react';
import { TrafficLights } from './TrafficLights';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useFileStore } from '@/stores/useFileStore';
import { useEditorStore } from '@/stores/useEditorStore';
import { LayoutGrid, Plus, Play, Square, Terminal, Zap, Loader2, Monitor, Layout, Search, Command } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { runtimeManager } from '@/runtimes/RuntimeManager';
import { ExecutionControls } from '@/components/runtime/ExecutionControls';
import { RuntimeSelector } from '@/components/runtime/RuntimeSelector';
import { RuntimeStatusBadge } from '@/components/runtime/RuntimeStatusBadge';

export const TitleBar: React.FC = () => {
  const { toggleSidebar, setActiveBottomTab, activeBottomTab } = useLayoutStore();
  const { activeProjectId, projects } = useProjectStore();
  const { activeFileId, files } = useFileStore();
  const { activeTabId, tabs } = useEditorStore();
  
  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeFile = activeFileId ? files[activeFileId] : null;
  const activeTab = activeTabId ? tabs.find(t => t.fileId === activeTabId) : null;
  
  const executionState = runtimeManager.getState();
  const currentRequest = runtimeManager.getCurrentRequest();
  const isRunning = ['initializing', 'compiling', 'running'].includes(executionState);

  const handleRun = () => {
    if (!activeFile || !activeTab) return;
    
    const language = activeTab.language || getLanguageFromFilename(activeFile.name);
    const driver = runtimeManager.getDriverForLanguage(language);
    
    if (!driver) {
      alert(`No runtime available for ${language}`);
      return;
    }

    // Open terminal panel
    setActiveBottomTab('terminal');
    
    runtimeManager.execute({
      code: activeFile.content || '',
      language,
      entryPoint: activeFile.path,
      projectId: activeProjectId,
    });
  };

  const handleStop = () => {
    runtimeManager.terminate();
  };

  const handleRestart = () => {
    handleRun();
  };

  const getLanguageFromFilename = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
      py: 'python', rs: 'rust', go: 'go', java: 'java',
      cpp: 'cpp', cc: 'cpp', cxx: 'cpp', c: 'c', cs: 'csharp',
      php: 'php', rb: 'ruby', swift: 'swift', kt: 'kotlin',
      sh: 'bash', html: 'html', css: 'css', json: 'json',
    };
    return langMap[ext || ''] || 'javascript';
  };

  const openCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('aura-open-command-palette'));
  };

  return (
    <div 
      className="h-9 bg-[#111217] border-b border-white/[0.06] flex items-center justify-between px-3 select-none z-50 -webkit-app-region: drag"
      onDoubleClick={() => window.electron?.maximize?.()}
    >
      <div className="flex items-center space-x-3 w-48 -webkit-app-region: drag">
        <TrafficLights />
        <span className="text-xs font-medium text-white/50 tracking-wider uppercase ml-2">Aura Studio</span>
      </div>

      <div className="flex-1 flex items-center justify-center -webkit-app-region: drag">
        <div className="flex items-center space-x-2 bg-[#161820] border border-white/[0.06] rounded-md px-3 py-1 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/80 font-mono">
            {activeProject ? `${activeProject.name} / main` : 'No Project'}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-1 w-48 justify-end -webkit-app-region: no-drag">
        {/* Command Palette Trigger */}
        <button
          onClick={openCommandPalette}
          title="Command Palette (Cmd+K)"
          className="p-1.5 rounded hover:bg-white/[0.06] transition-colors text-white/60 hover:text-white"
        >
          <Command className="w-4 h-4" />
        </button>

        {/* Runtime Selector */}
        {activeFile && (
          <RuntimeSelector
            selectedDriverId={runtimeManager.getDriverForLanguage(
              activeTab?.language || getLanguageFromFilename(activeFile.name)
            )?.id || 'js-worker'}
            onChange={(id) => {}}
            language={activeTab?.language || getLanguageFromFilename(activeFile.name)}
          />
        )}

        {/* Execution Controls */}
        {activeFile && (
          <ExecutionControls
            state={executionState}
            onRun={handleRun}
            onStop={handleStop}
            onRestart={handleRestart}
            language={activeTab?.language || getLanguageFromFilename(activeFile.name)}
          />
        )}

        {/* Terminal Toggle */}
        <button
          onClick={() => setActiveBottomTab('terminal')}
          title="Toggle Terminal (Ctrl+`)"
          className={twMerge(
            'p-1.5 rounded hover:bg-white/[0.06] transition-colors',
            activeBottomTab === 'terminal' ? 'text-indigo-400' : 'text-white/60 hover:text-white'
          )}
        >
          <Terminal className="w-4 h-4" />
        </button>

        {/* Preview Toggle */}
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('aura-toggle-preview'));
          }}
          title="Toggle Preview (Cmd+Shift+P)"
          className="p-1.5 rounded hover:bg-white/[0.06] transition-colors text-white/60 hover:text-white"
        >
          <Monitor className="w-4 h-4" />
        </button>

        <button
          id="new-project-btn"
          title="New Project (Cmd+N)"
          className="p-1.5 hover:bg-white/[0.06] rounded text-white/60 hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        
        <button
          onClick={toggleSidebar}
          title="Toggle Sidebar (Cmd+B)"
          className="p-1.5 hover:bg-white/[0.06] rounded text-white/60 hover:text-white transition-colors"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};