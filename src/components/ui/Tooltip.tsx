import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactElement;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  position = 'top', 
  delay = 200 
}) => {
  const [visible, setVisible] = useState(false);
  const [positionStyles, setPositionStyles] = useState<React.CSSProperties>({});
  const childRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number>();

  const updatePosition = () => {
    if (!childRef.current || !tooltipRef.current) return;
    
    const childRect = childRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 8;
    
    let top = 0, left = 0;
    
    switch (position) {
      case 'top':
        top = childRect.top - tooltipRect.height - gap;
        left = childRect.left + (childRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = childRect.bottom + gap;
        left = childRect.left + (childRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = childRect.top + (childRect.height - tooltipRect.height) / 2;
        left = childRect.left - tooltipRect.width - gap;
        break;
      case 'right':
        top = childRect.top + (childRect.height - tooltipRect.height) / 2;
        left = childRect.right + gap;
        break;
    }
    
    setPositionStyles({ top: `${top}px`, left: `${left}px` });
  };

  const show = () => {
    timeoutRef.current = window.setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(updatePosition);
    }, delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  useEffect(() => {
    if (visible) updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [visible]);

  const tooltipElement = (
    <div
      ref={tooltipRef}
      style={positionStyles}
      className={twMerge(
        'fixed z-50 px-2 py-1 text-xs font-medium text-white bg-[#1c1e29] border border-white/10 rounded shadow-lg pointer-events-none animate-fade-in',
        `tooltip-${position}`
      )}
      role="tooltip"
    >
      {content}
    </div>
  );

  return (
    <>
      {React.cloneElement(children, { 
        ref: childRef,
        onMouseEnter: show,
        onMouseLeave: hide,
        onFocus: show,
        onBlur: hide,
      })}
      {visible && createPortal(tooltipElement, document.body)}
    </>
  );
};