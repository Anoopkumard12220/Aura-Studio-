import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createPortal } from 'react-dom';
import { X, ChevronDown } from 'lucide-react';

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: React.ReactElement;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, items, align = 'left' }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current || !dropdownRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    
    let left = align === 'left' ? triggerRect.left : triggerRect.right - dropdownRect.width;
    const top = triggerRect.bottom + 4;
    
    if (left < 8) left = 8;
    if (left + dropdownRect.width > window.innerWidth - 8) {
      left = window.innerWidth - dropdownRect.width - 8;
    }
    
    setPosition({ top: `${top}px`, left: `${left}px` });
  };

  useEffect(() => {
    if (open) {
      requestAnimationFrame(updatePosition);
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleClickOutside = (e: MouseEvent) => {
    if (triggerRef.current?.contains(e.target as Node)) return;
    if (dropdownRef.current?.contains(e.target as Node)) return;
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={position}
      className="fixed z-50 min-w-[160px] bg-[#1c1e29] border border-white/10 rounded-lg shadow-xl overflow-hidden animate-fade-in scrollbar-thin"
      role="menu"
    >
      {items.map((item, index) => (
        item.divider ? (
          <div key={`divider-${index}`} className="h-px bg-white/10 my-1" role="separator" />
        ) : (
          <button
            key={index}
            onClick={() => { item.onClick(); setOpen(false); }}
            disabled={item.disabled}
            className={twMerge(
              'w-full px-3 py-2 text-left text-sm text-white/90 flex items-center gap-2 transition-colors',
              'hover:bg-white/10 focus:outline-none focus:bg-white/10',
              item.danger && 'text-rose-400 hover:bg-rose-400/10'
            )}
            role="menuitem"
          >
            {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
            {item.label}
          </button>
        )
      ))}
    </div>
  );

  return (
    <>
      {React.cloneElement(trigger, {
        ref: triggerRef,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          setOpen(!open);
        },
        'aria-haspopup': true,
        'aria-expanded': open,
      })}
      {open && createPortal(dropdownContent, document.body)}
    </>
  );
};