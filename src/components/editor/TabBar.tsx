import React from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { useFileStore } from '@/stores/useFileStore';
import { X, Circle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, removeTab } = useEditorStore();
  const { saveFile } = useFileStore();

  const handleClose = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    const tab = tabs.find(t => t.fileId === fileId);
    if (tab?.isDirty) {
      if (!confirm(`Save changes to ${tab.fileName}?`)) return;
      saveFile(fileId);
    }
    removeTab(fileId);
  };

  const handleDoubleClick = (fileId: string) => {
    const tab = tabs.find(t => t.fileId === fileId);
    if (tab?.isDirty) {
      saveFile(fileId);
    }
  };

  return (
    <div className="h-8 bg-frame border-b border-white/[0.06] flex items-center overflow-x-auto px-2">
      <div className="flex items-center space-x-1 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.fileId}
            onClick={() => setActiveTab(tab.fileId)}
            onDoubleClick={() => handleDoubleClick(tab.fileId)}
            className={twMerge(
              'flex items-center gap-2 px-3 py-1.5 rounded-t-md transition-all duration-150',
              'text-sm font-medium whitespace-nowrap',
              'hover:bg-white/[0.04]',
              activeTabId === tab.fileId
                ? 'bg-surface text-white border-b-2 border-indigo-500'
                : 'text-white/70 hover:text-white'
            )}
            title={`${tab.filePath}${tab.isDirty ? ' (modified)' : ''}`}
          >
            <span className="flex items-center gap-1.5">
              {tab.fileName}
              {tab.isDirty && (
                <Circle className="w-1.5 h-1.5 text-amber-400" />
              )}
            </span>
            <button
              onClick={(e) => handleClose(e, tab.fileId)}
              className="p-0.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
              aria-label={`Close ${tab.fileName}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </button>
        ))}
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-1 ml-2">
        <button className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors" title="Open Editor Layout">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3z" />
            <path d="M12 3v18" />
            <path d="M3 12h18" />
          </svg>
        </button>
      </div>
    </div>
  );
};