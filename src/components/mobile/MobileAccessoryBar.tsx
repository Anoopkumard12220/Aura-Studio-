import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Play, Undo, Redo, ChevronLeft, ChevronRight, Terminal, FileText, Search, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ACCESSORY_KEYS } from '@/types/mobile';
import { useVisualViewport } from '@/hooks/useVisualViewport';

interface MobileAccessoryBarProps {
  onInsertText: (text: string) => void;
  onRun: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onTab?: () => void;
  onEscape?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  visible?: boolean;
}

export const MobileAccessoryBar: React.FC<MobileAccessoryBarProps> = ({
  onInsertText,
  onRun,
  onUndo,
  onRedo,
  onTab,
  onEscape,
  onArrowLeft,
  onArrowRight,
  onArrowUp,
  onArrowDown,
  visible = true,
}) => {
  const { isKeyboardOpen, keyboardHeight } = useVisualViewport();

  const showBar = visible && isKeyboardOpen;

  const keys = useMemo(() => [
    { key: 'Tab', insertText: '  ', label: 'Tab', icon: null, action: onTab || (() => onInsertText('  ')) },
    { key: '{', insertText: '{', label: '{', action: () => onInsertText('{') } },
    { key: '}', insertText: '}', label: '}', action: () => onInsertText('}') },
    { key: '[', insertText: '[', label: '[', action: () => onInsertText('[') },
    { key: ']', insertText: ']', label: ']', action: () => onInsertText(']') },
    { key: '(', insertText: '(', label: '(', action: () => onInsertText('(') },
    { key: ')', insertText: ')', label: ')', action: () => onInsertText(')') },
    { key: ';', insertText: ';', label: ';', action: () => onInsertText(';') },
    { key: '=', insertText: '=', label: '=', action: () => onInsertText('=') },
    { key: '"', insertText: '"', label: '"', action: () => onInsertText('"') },
    { key: "'", insertText: "'", label: "'", action: () => onInsertText("'") },
    { key: '`', insertText: '`', label: '`', action: () => onInsertText('`') },
  ], [onInsertText, onTab]);

  const navigationKeys = useMemo(() => [
    { key: 'Esc', label: 'Esc', icon: null, action: onEscape, className: 'text-white/60 hover:text-white' },
    { key: '←', label: 'Left', icon: ChevronLeft, action: onArrowLeft },
    { key: '→', label: 'Right', icon: ChevronRight, action: onArrowRight },
    { key: '↑', label: 'Up', icon: null, action: onArrowUp, className: 'text-white/60 hover:text-white' },
    { key: '↓', label: 'Down', icon: null, action: onArrowDown, className: 'text-white/60 hover:text-white' },
  ], [onEscape, onArrowLeft, onArrowRight, onArrowUp, onArrowDown]);

  if (!showBar) return null;

  const barContent = (
    <div
      className={twMerge(
        'md:hidden fixed bottom-0 left-0 right-0 h-12 bg-[#161820]/95 backdrop-blur-md border-t border-white/10 flex items-center px-2 space-x-1 overflow-x-auto z-40 select-none animate-slide-up',
        keyboardHeight > 0 && `pb-[${keyboardHeight}px]`
      )}
      role="toolbar"
      aria-label="Mobile accessory toolbar"
    >
      <button
        onClick={onRun}
        className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 text-white flex items-center space-x-1.5 text-xs font-semibold shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-transform"
        aria-label="Run code"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>Run</span>
      </button>

      <div className="flex-shrink-0 w-[1px] h-6 bg-white/10 my-auto" />

      <div className="flex items-center space-x-1 overflow-x-auto pb-1 flex-1 min-w-0" role="group" aria-label="Code symbols">
        {keys.map((k) => (
          <button
            key={k.key}
            onClick={k.action}
            className={clsx(
              'min-w-[36px] h-8 px-2 rounded-lg font-mono text-xs font-medium transition-all active:scale-[0.95]',
              'bg-white/[0.06] hover:bg-white/[0.12] text-white active:bg-indigo-600 active:text-white'
            )}
            aria-label={k.label}
          >
            {k.key}
          </button>
        ))}
      </div>

      <div className="flex-shrink-0 w-[1px] h-6 bg-white/10 my-auto" />

      <div className="flex items-center space-x-1" role="group" aria-label="Navigation">
        {navigationKeys.map((k) => (
          <button
            key={k.key}
            onClick={k.action}
            className={clsx(
              'min-w-[36px] h-8 px-2 rounded-lg transition-all active:scale-[0.95]',
              'bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white',
              k.className
            )}
            aria-label={k.label}
          >
            {k.icon ? <k.icon className="w-4 h-4" /> : <span className="text-xs font-medium">{k.key}</span>}
          </button>
        ))}
      </div>

      <div className="flex-shrink-0 w-[1px] h-6 bg-white/10 my-auto" />

      <div className="flex items-center space-x-1" role="group" aria-label="Edit actions">
        <button
          onClick={onUndo}
          className="min-w-[36px] h-8 px-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white transition-colors active:scale-[0.95]"
          aria-label="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          className="min-w-[36px] h-8 px-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white transition-colors active:scale-[0.95]"
          aria-label="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return createPortal(barContent, document.body);
};

export const MobileAccessoryBarSimple: React.FC<MobileAccessoryBarProps> = ({
  onInsertText,
  onRun,
  onUndo,
  onRedo,
  visible = true,
}) => {
  const { isKeyboardOpen, keyboardHeight } = useVisualViewport();
  const showBar = visible && isKeyboardOpen;

  if (!showBar) return null;

  const barContent = (
    <div
      className={twMerge(
        'md:hidden fixed bottom-0 left-0 right-0 h-12 bg-[#161820]/95 backdrop-blur-md border-t border-white/10 flex items-center px-2 space-x-2 overflow-x-auto z-40 select-none animate-slide-up',
        keyboardHeight > 0 && `pb-[${keyboardHeight}px]`
      )}
      role="toolbar"
    >
      <button
        onClick={onRun}
        className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 text-white flex items-center space-x-1.5 text-xs font-semibold shadow"
        aria-label="Run code"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>Run</span>
      </button>

      <div className="flex-1 overflow-x-auto pb-1 flex items-center space-x-1" role="group" aria-label="Code symbols">
        {ACCESSORY_KEYS.map((k) => (
          <button
            key={k.key}
            onClick={() => onInsertText(k.insertText)}
            className="min-w-[32px] h-7 px-2 rounded bg-white/[0.06] hover:bg-white/[0.12] text-xs font-mono text-white flex items-center justify-center transition-colors active:bg-indigo-600"
            aria-label={k.label}
          >
            {k.key}
          </button>
        ))}
      </div>

      <div className="flex-shrink-0 flex items-center space-x-1" role="group" aria-label="Edit actions">
        <button onClick={onUndo} className="min-w-[32px] h-7 px-1.5 rounded bg-white/[0.06] text-white/70 hover:text-white flex items-center justify-center" aria-label="Undo">
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button onClick={onRedo} className="min-w-[32px] h-7 px-1.5 rounded bg-white/[0.06] text-white/70 hover:text-white flex items-center justify-center" aria-label="Redo">
          <Redo className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return createPortal(barContent, document.body);
};