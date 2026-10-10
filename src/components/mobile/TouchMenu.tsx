import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TouchMenuItem {
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
}

interface TouchMenuProps {
  items: TouchMenuItem[];
  triggerRef: React.RefObject<HTMLElement>;
  isOpen: boolean;
  onClose: () => void;
  position?: 'bottom' | 'top' | 'left' | 'right';
}

export const TouchMenu: React.FC<TouchMenuProps> = ({
  items,
  triggerRef,
  isOpen,
  onClose,
  position = 'bottom',
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current?.getBoundingClientRect();

    if (!menuRect) return;

    let top = 0, left = 0, bottom = 0, right = 0;

    switch (position) {
      case 'bottom':
        top = triggerRect.bottom + 4;
        left = triggerRect.left + triggerRect.width / 2 - menuRect.width / 2;
        break;
      case 'top':
        bottom = window.innerHeight - triggerRect.top + 4;
        left = triggerRect.left + triggerRect.width / 2 - menuRect.width / 2;
        break;
      case 'left':
        right = window.innerWidth - triggerRect.left + 4;
        top = triggerRect.top + triggerRect.height / 2 - menuRect.height / 2;
        break;
      case 'right':
        left = triggerRect.right + 4;
        top = triggerRect.top + triggerRect.height / 2 - menuRect.height / 2;
        break;
    }

    // Clamp to viewport
    const padding = 8;
    if (left < padding) left = padding;
    if (left + menuRect.width > window.innerWidth - padding) {
      left = window.innerWidth - menuRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + menuRect.height > window.innerHeight - padding) {
      top = window.innerHeight - menuRect.height - padding;
    }

    setPositionStyle({ top, left, bottom: undefined, right: undefined });
  }, [isOpen, triggerRef, position]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={positionStyle}
      className={clsx(
        'fixed z-50 bg-[#161820] border border-white/10 rounded-lg shadow-2xl min-w-[180px] max-w-[280px] py-1 overflow-hidden animate-fade-in',
        position === 'bottom' && 'top-auto',
        position === 'top' && 'bottom-auto',
      )}
      role="menu"
      aria-orientation="vertical"
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.action();
            onClose();
          }}
          disabled={item.disabled}
          className={clsx(
            'w-full px-3 py-2.5 text-left flex items-center gap-2 text-sm transition-colors',
            item.destructive
              ? 'text-red-400 hover:bg-red-500/10'
              : 'text-white/80 hover:bg-white/[0.04]',
            item.disabled && 'opacity-40 cursor-not-allowed'
          )}
          role="menuitem"
          aria-disabled={item.disabled}
        >
          {item.icon && (
            <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>
          )}
          <span className="flex-1 truncate">{item.label}</span>
          {item.shortcut && (
            <span className="text-[10px] font-mono text-white/40 px-1.5 py-0.5 rounded bg-white/[0.06]">
              {item.shortcut}
            </span>
          )}
        </button>
      ))}
    </div>,
    document.body
  );
};

interface TouchContextMenuProps {
  items: TouchMenuItem[];
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
}

export const TouchContextMenu: React.FC<TouchContextMenuProps> = ({
  items,
  x,
  y,
  isOpen,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Adjust position to stay in viewport
    setTimeout(() => {
      if (!menuRef.current) return;
      const rect = menuRef.current.getBoundingClientRect();
      
      let adjustedX = x;
      let adjustedY = y;
      
      if (adjustedX + rect.width > window.innerWidth - 8) {
        adjustedX = window.innerWidth - rect.width - 8;
      }
      if (adjustedY + rect.height > window.innerHeight - 8) {
        adjustedY = window.innerHeight - rect.height - 8;
      }
      
      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }, 0);
  }, [isOpen, x, y]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 bg-[#161820] border border-white/10 rounded-lg shadow-2xl min-w-[180px] max-w-[280px] py-1 overflow-hidden animate-fade-in pointer-events-auto"
      style={{ left: x, top: y }}
      role="menu"
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.action();
            onClose();
          }}
          disabled={item.disabled}
          className={clsx(
            'w-full px-3 py-2.5 text-left flex items-center gap-2 text-sm transition-colors',
            item.destructive
              ? 'text-red-400 hover:bg-red-500/10'
              : 'text-white/80 hover:bg-white/[0.04]',
            item.disabled && 'opacity-40 cursor-not-allowed'
          )}
          role="menuitem"
        >
          {item.icon && <span className="w-4 h-4">{item.icon}</span>}
          <span className="flex-1 truncate">{item.label}</span>
          {item.shortcut && (
            <span className="text-[10px] font-mono text-white/40 px-1.5 py-0.5 rounded bg-white/[0.06]">
              {item.shortcut}
            </span>
          )}
        </button>
      ))}
    </div>,
    document.body
  );
};

export function useTouchContextMenu() {
  const [state, setState] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    items: TouchMenuItem[];
  }>({ isOpen: false, x: 0, y: 0, items: [] });

  const open = useCallback((e: React.TouchEvent | React.MouseEvent, items: TouchMenuItem[]) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setState({ isOpen: true, x: clientX, y: clientY, items });
  }, []);

  const close = useCallback(() => {
    setState(s => ({ ...s, isOpen: false }));
  }, []);

  return { ...state, open, close };
}