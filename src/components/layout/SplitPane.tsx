import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SplitPaneProps {
  children: [React.ReactNode, React.ReactNode];
  direction: 'horizontal' | 'vertical';
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  onChange?: (size: number) => void;
}

export const SplitPane: React.FC<SplitPaneProps> = ({ 
  children, 
  direction, 
  defaultSize = 260, 
  minSize = 180, 
  maxSize = 480,
  onChange 
}) => {
  const [size, setSize] = useState(defaultSize);
  const [dragging, setDragging] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onChange) onChange(size);
  }, [size, onChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging || !paneRef.current) return;
      
      const rect = paneRef.current.getBoundingClientRect();
      let newSize: number;
      
      if (direction === 'horizontal') {
        newSize = e.clientX - rect.left;
      } else {
        newSize = e.clientY - rect.top;
      }
      
      setSize(Math.max(minSize, Math.min(newSize, maxSize)));
    };

    const handleMouseUp = () => {
      setDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, direction, minSize, maxSize]);

  const [first, second] = children;

  if (direction === 'horizontal') {
    return (
      <div className="flex h-full w-full" ref={paneRef}>
        <div 
          className={clsx('flex-shrink-0 overflow-hidden transition-all duration-75', dragging && 'select-none')}
          style={{ width: size }}
        >
          {first}
        </div>
        <div
          ref={handleRef}
          className={clsx(
            'w-px relative flex-shrink-0 transition-colors',
            'bg-white/[0.06] hover:bg-white/[0.12] active:bg-indigo-500/50',
            'cursor-col-resize select-none',
            'before:content-[""] before:absolute before:inset-y-0 before:w-3 before:-left-1.5 before:bg-transparent',
            dragging && 'bg-indigo-500/50'
          )}
          onMouseDown={handleMouseDown}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panel"
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-transparent hover:bg-white/10 transition-colors" />
        </div>
        <div className="flex-1 overflow-hidden min-w-0">
          {second}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col" ref={paneRef}>
      <div 
        className={clsx('flex-shrink-0 overflow-hidden transition-all duration-75', dragging && 'select-none')}
        style={{ height: size }}
      >
        {first}
      </div>
      <div
        ref={handleRef}
        className={clsx(
          'h-px relative flex-shrink-0 w-full transition-colors',
          'bg-white/[0.06] hover:bg-white/[0.12] active:bg-indigo-500/50',
          'cursor-row-resize select-none',
          'before:content-[""] before:absolute before:inset-x-0 before:h-3 before:-top-1.5 before:bg-transparent',
          dragging && 'bg-indigo-500/50'
        )}
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize panel"
      >
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-transparent hover:bg-white/10 transition-colors" />
      </div>
      <div className="flex-1 overflow-hidden min-h-0">
        {second}
      </div>
    </div>
  );
};