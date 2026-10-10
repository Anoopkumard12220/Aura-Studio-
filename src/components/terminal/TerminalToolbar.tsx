import React, { useState } from 'react';
import { X, Trash2, Copy, Minimize2, Maximize2, Settings, Search, Filter, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';

interface TerminalToolbarProps {
  activeTabId: string | null;
  onClear: () => void;
  onKill: () => void;
  onCopy: () => void;
  onSearch: () => void;
  onSettings: () => void;
  isMaximized: boolean;
  onMaximizeToggle: () => void;
  onClose: () => void;
}

export const TerminalToolbar: React.FC<TerminalToolbarProps> = ({
  activeTabId,
  onClear,
  onKill,
  onCopy,
  onSearch,
  onSettings,
  isMaximized,
  onMaximizeToggle,
  onClose,
}) => {
  const [showMore, setShowMore] = useState(false);

  const dropdownItems: DropdownItem[] = [
    { label: 'Clear Terminal', onClick: onClear, icon: <Trash2 className="w-4 h-4" /> },
    { label: 'Copy Output', onClick: onCopy, icon: <Copy className="w-4 h-4" /> },
    { label: 'Find...', onClick: onSearch, icon: <Search className="w-4 h-4" /> },
    { label: 'Kill Process', onClick: onKill, icon: <X className="w-4 h-4" />, danger: true },
    { divider: true },
    { label: 'Settings', onClick: onSettings, icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center gap-2 h-8 px-2 bg-[#111217] border-b border-white/[0.06]">
      <div className="flex items-center gap-1">
        <button
          onClick={onClear}
          className={clsx('p-1.5 rounded hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors')}
          title="Clear Terminal"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={onKill}
          className={clsx('p-1.5 rounded hover:bg-white/[0.06] text-white/60 hover:text-rose-400 transition-colors')}
          title="Kill Process (Ctrl+C)"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/[0.06] mx-1" />
        <button
          onClick={onCopy}
          className={clsx('p-1.5 rounded hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors')}
          title="Copy Selection"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={onSearch}
          className={clsx('p-1.5 rounded hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors')}
          title="Find (Ctrl+F)"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <Dropdown
          trigger={
            <button
              className={clsx('p-1.5 rounded hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors')}
              title="More Options"
            >
              <Filter className="w-4 h-4" />
            </button>
          }
          items={dropdownItems}
          align="right"
        />
        
        <button
          onClick={onMaximizeToggle}
          className={clsx(
            'p-1.5 rounded hover:bg-white/[0.06] transition-colors',
            isMaximized ? 'text-indigo-400' : 'text-white/60 hover:text-white'
          )}
          title={isMaximized ? 'Minimize Terminal' : 'Maximize Terminal'}
        >
          {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onClose}
          className={clsx('p-1.5 rounded hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors')}
          title="Close Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};