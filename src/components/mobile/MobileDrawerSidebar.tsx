import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, Folder, FileText, Search, GitBranch, Terminal, Extend, LayoutGrid } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useFileStore } from '@/stores/useFileStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useEditorStore } from '@/stores/useEditorStore';

interface MobileDrawerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'explorer' | 'search' | 'git' | 'extensions';
  onTabChange: (tab: 'explorer' | 'search' | 'git' | 'extensions') => void;
}

export const MobileDrawerSidebar: React.FC<MobileDrawerSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
}) => {
  const [drawerWidth, setDrawerWidth] = useState(280);
  const drawerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const { toggleSidebar, sidebarWidth } = useLayoutStore();
  const { files, activeFileId, createFile, createFolder, deleteFile, renameFile } = useFileStore();
  const { activeProjectId, projects, setActiveProject, createProject } = useProjectStore();
  const { activeTabId, tabs, closeTab, setActiveTab } = useEditorStore();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0].clientX > drawerWidth) {
      startXRef.current = e.touches[0].clientX;
      isDraggingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = startXRef.current - e.touches[0].clientX;
    if (deltaX > 50) {
      onClose();
      isDraggingRef.current = false;
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const projectFiles = activeProjectId ? Object.values(files).filter(f => f.projectId === activeProjectId) : [];

  const renderFileTree = (items: typeof projectFiles, level = 0) => (
    <div className="space-y-0.5" role="tree">
      {items
        .filter(f => f.parentId === null || (level === 0 && !f.parentId))
        .map(file => (
          <div key={file.id}>
            {file.isDirectory ? (
              <div className="flex items-center gap-2 px-3 py-2 text-white/80 hover:bg-white/[0.05] rounded-lg cursor-pointer">
                <Folder className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium truncate">{file.name}</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setActiveTab({ fileId: file.id, language: getLanguage(file.name) });
                  onClose();
                }}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2 text-left text-white/80 hover:bg-white/[0.05] rounded-lg cursor-pointer transition-colors',
                  activeFileId === file.id && 'bg-indigo-600/20 text-indigo-300'
                )}
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm truncate">{file.name}</span>
              </button>
            )}
          </div>
        ))}
    </div>
  );

  if (!isOpen) return null;

  const drawerContent = (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Sidebar">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        className="absolute top-0 bottom-0 right-0 bg-[#161820] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right"
        style={{ width: drawerWidth }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between h-12 px-4 border-b border-white/10 bg-gradient-to-r from-indigo-600/10 to-cyan-500/10">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-medium text-white">Sidebar</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-white/10 overflow-x-auto pb-2 px-2" role="tablist">
          {[
            { id: 'explorer', label: 'Explorer', icon: Folder },
            { id: 'search', label: 'Search', icon: Search },
            { id: 'git', label: 'Source Control', icon: GitBranch },
            { id: 'extensions', label: 'Extensions', icon: Extend },
          ].map(({ id, label, icon }) => {
            const Icon = icon;
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id as any)}
                role="tab"
                aria-selected={isActive}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-white/70 hover:bg-white/[0.05] hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'explorer' && (
            <div className="space-y-4">
              {activeProjectId && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-white/60 uppercase tracking-wider">Project</h4>
                    <button
                      onClick={() => createFile('untitled.ts', null, false, '// New file\n')}
                      className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white"
                      aria-label="New file"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {renderFileTree(projectFiles)}
                </div>
              )}

              {!activeProjectId && (
                <div className="text-center py-8 text-white/40">
                  <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No project open</p>
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('aura-new-project'));
                      onClose();
                    }}
                    className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
                  >
                    Create Project
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="text-center py-8 text-white/40">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Global search</p>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('aura-global-search'));
                  onClose();
                }}
                className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
              >
                Open Search
              </button>
            </div>
          )}

          {activeTab === 'git' && (
            <div className="text-center py-8 text-white/40">
              <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Git integration</p>
            </div>
          )}

          {activeTab === 'extensions' && (
            <div className="text-center py-8 text-white/40">
              <Extend className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Extensions panel</p>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={() => {
              setActiveBottomTab('terminal');
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Terminal className="w-4 h-4" />
            <span className="text-sm">Open Terminal</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};

function getLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
    py: 'python', rs: 'rust', go: 'go', java: 'java',
    cpp: 'cpp', c: 'c', cs: 'csharp', php: 'php', rb: 'ruby',
    swift: 'swift', kt: 'kotlin', sh: 'bash', html: 'html', css: 'css', json: 'json', md: 'markdown',
  };
  return langMap[ext || ''] || 'plaintext';
}

import { useState } from 'react';
import { setActiveBottomTab } from '@/stores/useLayoutStore';