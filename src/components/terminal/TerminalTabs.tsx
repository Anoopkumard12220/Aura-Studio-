import React, { useState, useCallback } from 'react';
import { Plus, X, Terminal, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TerminalTab } from '@/types/terminal';

interface TerminalTabsProps {
  tabs: TerminalTab[];
  activeTabId: string | null;
  onTabChange: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
  onMaximize?: (id: string) => void;
}

export const TerminalTabs: React.FC<TerminalTabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  onNewTab,
  onMaximize,
}) => {
  const [hoveredClose, setHoveredClose] = useState<string | null>(null);

  const handleTabClick = useCallback((id: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.tab-close')) return;
    onTabChange(id);
  }, [onTabChange]);

  const handleCloseClick = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onTabClose(id);
  }, [onTabClose]);

  const handleNewTabClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onNewTab();
  }, [onNewTab]);

  return (
    <div className="flex items-center h-7 bg-[#161820] border-b border-white/[0.06] px-1">
      <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={(e) => handleTabClick(tab.id, e)}
            onMouseEnter={() => setHoveredClose(tab.id)}
            onMouseLeave={() => setHoveredClose(null)}
            className={twMerge(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg transition-colors',
              'whitespace-nowrap min-w-[120px] max-w-[200px]',
              activeTabId === tab.id
                ? 'bg-[#111217] text-white border-b-2 border-indigo-500'
                : 'text-white/70 hover:text-white hover:bg-white/[0.03]'
            )}
          >
            <Terminal className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-xs truncate flex-1">
              {tab.title}
              {tab.process && (
                <>
                  <span className="text-white/40 ml-1">·</span>
                  <span className="text-white/50 text-xs font-mono ml-1">{tab.process.command}</span>
                </>
              )}
            </span>
            {hoveredClose === tab.id && (
              <button
                onClick={(e) => handleCloseClick(tab.id, e)}
                className="p-0.5 rounded hover:bg-rose-500/20 text-white/50 hover:text-rose-400 transition-colors flex-shrink-0 tab-close"
                aria-label="Close terminal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 ml-2">
        <button
          onClick={handleNewTabClick}
          className="p-1.5 rounded hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors"
          title="New Terminal (Ctrl+Shift+`)"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};