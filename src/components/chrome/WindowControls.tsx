import React from 'react';
import { Minimize, Maximize, X } from 'lucide-react';

interface WindowControlsProps {
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
}

export const WindowControls: React.FC<WindowControlsProps> = ({ 
  onMinimize, 
  onMaximize, 
  onClose 
}) => {
  return (
    <div className="flex items-center space-x-1" role="group" aria-label="Window controls">
      <button
        type="button"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        onClick={onMinimize}
        aria-label="Minimize"
      >
        <Minimize className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        onClick={onMaximize}
        aria-label="Maximize"
      >
        <Maximize className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-rose-500/20 transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};