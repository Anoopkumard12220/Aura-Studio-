import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface FileContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  x,
  y,
  onClose,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
}) => {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.context-menu')) onClose();
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const menuContent = (
    <div
      className="context-menu fixed z-50 bg-raised border border-white/10 rounded shadow-xl min-w-[160px] animate-fade-in"
      style={{ left: x, top: y }}
      role="menu"
    >
      <div className="py-1">
        <button
          onClick={() => { onNewFile(); onClose(); }}
          className={twMerge(
            'w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 flex items-center gap-2 transition-colors'
          )}
          role="menuitem"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          New File
        </button>
        <button
          onClick={() => { onNewFolder(); onClose(); }}
          className={twMerge(
            'w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 flex items-center gap-2 transition-colors'
          )}
          role="menuitem"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          New Folder
        </button>
        <div className="h-px bg-white/10 my-1" />
        <button
          onClick={() => { onRename(); onClose(); }}
          className={twMerge(
            'w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 flex items-center gap-2 transition-colors'
          )}
          role="menuitem"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          Rename
        </button>
        <button
          onClick={() => { onDelete(); onClose(); }}
          className={twMerge(
            'w-full px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-400/10 flex items-center gap-2 transition-colors'
          )}
          role="menuitem"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
};