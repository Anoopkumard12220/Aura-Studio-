import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFileStore } from '@/stores/useFileStore';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { createPortal } from 'react-dom';
import { Search, X, File, Folder } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const QuickOpenModal: React.FC = () => {
  const { files, openFile } = useFileStore();
  const { setActiveActivityTab } = useLayoutStore();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fileList = Object.values(files).filter(f => !f.isDirectory);
  
  const filteredFiles = fileList
    .filter(file => {
      if (!query) return true;
      const q = query.toLowerCase();
      return file.name.toLowerCase().includes(q) || file.path.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const aMatch = a.name.toLowerCase().indexOf(query.toLowerCase());
      const bMatch = b.name.toLowerCase().indexOf(query.toLowerCase());
      if (aMatch !== bMatch) return aMatch - bMatch;
      return a.name.localeCompare(b.name);
    });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredFiles.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredFiles[selectedIndex]) {
          openFile(filteredFiles[selectedIndex].id);
          setIsOpen(false);
          setQuery('');
          setSelectedIndex(0);
        }
        break;
    }
  }, [isOpen, filteredFiles, selectedIndex, openFile]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setIsOpen(true);
        setSelectedIndex(0);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="bg-canvas/95 backdrop-blur-sm rounded-xl border border-white/10 shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-fade-in glass-strong">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-white/50" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search files..."
            className="flex-1 bg-transparent text-white placeholder:text-white/40 text-lg outline-none font-mono"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <kbd className="px-2 py-1 text-xs bg-white/5 rounded text-white/50 font-mono">⌘P</kbd>
        </div>
        
        <div className="max-h-96 overflow-auto scrollbar-thin">
          {filteredFiles.length === 0 ? (
            <div className="p-8 text-center text-white/40">
              {query ? 'No matching files' : 'No files in project'}
            </div>
          ) : (
            <div className="py-2">
              {filteredFiles.slice(0, 50).map((file, index) => (
                <button
                  key={file.id}
                  onClick={() => {
                    openFile(file.id);
                    setIsOpen(false);
                    setQuery('');
                    setSelectedIndex(0);
                  }}
                  className={twMerge(
                    'w-full px-4 py-3 text-left flex items-center gap-3 transition-colors',
                    'hover:bg-white/[0.04]',
                    index === selectedIndex && 'bg-indigo-500/10 text-white'
                  )}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <File className={twMerge('w-4 h-4 flex-shrink-0', index === selectedIndex ? 'text-indigo-400' : 'text-white/60')} />
                  <div className="flex-1 min-w-0">
                    <div className={twMerge(
                      'text-sm font-medium truncate',
                      index === selectedIndex ? 'text-white' : 'text-white/90'
                    )}>
                      {file.name}
                    </div>
                    <div className={twMerge(
                      'text-xs truncate font-mono',
                      index === selectedIndex ? 'text-indigo-300' : 'text-white/40'
                    )}>
                      {file.path}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="px-4 py-2 border-t border-white/10 text-xs text-white/40 flex items-center justify-between">
          <span>{filteredFiles.length} file(s)</span>
          <span>↑↓ navigate · ↵ open · Esc close</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};