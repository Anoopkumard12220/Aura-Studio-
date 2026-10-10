import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Monitor, Smartphone, Tablet, Laptop, Maximize2 } from 'lucide-react';
import { ViewportPreset } from '@/types/preview';

interface ViewportSwitcherProps {
  active: ViewportPreset;
  onChange: (preset: ViewportPreset) => void;
}

const presets: { id: ViewportPreset; label: string; icon: React.ReactNode; short: string }[] = [
  { id: 'responsive', label: 'Responsive', icon: <Maximize2 className="w-4 h-4" />, short: 'Auto' },
  { id: 'desktop', label: 'Desktop 1920×1080', icon: <Monitor className="w-4 h-4" />, short: '1920' },
  { id: 'laptop', label: 'MacBook 1280×800', icon: <Laptop className="w-4 h-4" />, short: '1280' },
  { id: 'tablet', label: 'iPad 768×1024', icon: <Tablet className="w-4 h-4" />, short: '768' },
  { id: 'mobile', label: 'iPhone SE 375×667', icon: <Smartphone className="w-4 h-4" />, short: '375' },
];

export const ViewportSwitcher: React.FC<ViewportSwitcherProps> = ({ active, onChange }) => {
  const activePreset = presets.find(p => p.id === active) || presets[0];

  return (
    <div className="relative">
      <button
        onClick={() => onChange(activePreset.id)}
        className={twMerge(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors',
          'bg-[#111217] border border-white/[0.06] text-white/70 hover:text-white hover:border-white/10'
        )}
        title="Viewport: " + activePreset.label
      >
        {activePreset.icon}
        <span className="text-xs font-mono hidden sm:inline">{activePreset.short}</span>
      </button>
      
      <div className="absolute right-0 top-full mt-1 z-10 bg-[#161820] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[200px] animate-fade-in">
        {presets.map(preset => (
          <button
            key={preset.id}
            onClick={() => onChange(preset.id)}
            className={twMerge(
              'w-full px-3 py-2 text-left flex items-center gap-2 transition-colors',
              'text-white/80 hover:bg-white/[0.05] hover:text-white',
              active === preset.id && 'bg-indigo-500/10 text-indigo-400'
            )}
          >
            {preset.icon}
            <span className="text-sm">{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};