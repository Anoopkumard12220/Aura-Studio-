import React from 'react';
import { runtimeManager } from '@/runtimes/RuntimeManager';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Cpu, Server, Globe, HardDrive, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface RuntimeStatusBadgeProps {
  language?: string;
  driverId?: string;
  className?: string;
}

export const RuntimeStatusBadge: React.FC<RuntimeStatusBadgeProps> = ({
  language,
  driverId,
  className,
}) => {
  const drivers = runtimeManager.getDriverInfos();
  
  let driver = driverId 
    ? drivers.find(d => d.id === driverId)
    : language
      ? drivers.find(d => d.supportedLanguages.some(l => l.toLowerCase() === language.toLowerCase()))
      : null;

  if (!driver) {
    driver = drivers[0]; // Default to first driver
  }

  const tierConfig: Record<number, { 
    label: string; 
    icon: React.ReactNode; 
    color: string; 
    bg: string;
    tooltip: string;
  }> = {
    1: { 
      label: 'Native', 
      icon: <Cpu className="w-3 h-3" />, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-400/10',
      tooltip: 'In-browser JS/TS Worker - Instant startup, offline capable'
    },
    2: { 
      label: 'WASM', 
      icon: <Cpu className="w-3 h-3" />, 
      color: 'text-green-400', 
      bg: 'bg-green-400/10',
      tooltip: 'Pyodide CPython WASM - Real Python in browser, requires internet for first load'
    },
    3: { 
      label: 'Container', 
      icon: <Server className="w-3 h-3" />, 
      color: 'text-cyan-400', 
      bg: 'bg-cyan-400/10',
      tooltip: 'WebContainer Node.js - Full in-browser OS with npm, offline after boot'
    },
    4: { 
      label: 'Clang', 
      icon: <Cpu className="w-3 h-3" />, 
      color: 'text-purple-400', 
      bg: 'bg-purple-400/10',
      tooltip: 'Clang WASM - C/C++ to WebAssembly compilation'
    },
    5: { 
      label: 'Remote', 
      icon: <Globe className="w-3 h-3" />, 
      color: 'text-amber-400', 
      bg: 'bg-amber-400/10',
      tooltip: 'Piston API - Remote sandbox for 25+ languages, requires internet'
    },
  };

  const config = tierConfig[driver.tier] || tierConfig[5];

  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium',
        config.bg,
        config.color,
        className
      )}
      title={config.tooltip}
    >
      {config.icon}
      <span>{config.label}</span>
      {!driver.offlineCapable && driver.tier === 5 && (
        <AlertCircle className="w-2.5 h-2.5" title="Requires internet" />
      )}
      {driver.offlineCapable && (
        <CheckCircle className="w-2.5 h-2.5" title="Works offline" />
      )}
    </span>
  );
};

export const RuntimeTierLegend: React.FC = () => {
  const drivers = runtimeManager.getDriverInfos();
  
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
      {[
        { tier: 1, label: 'Tier 1: Native JS/TS Worker' },
        { tier: 2, label: 'Tier 2: Python WASM (Pyodide)' },
        { tier: 3, label: 'Tier 3: WebContainer Node.js' },
        { tier: 4, label: 'Tier 4: Clang C/C++ WASM' },
        { tier: 5, label: 'Tier 5: Remote Sandbox (Piston)' },
      ].map(({ tier, label }) => {
        const driver = drivers.find(d => d.tier === tier);
        const config = {
          1: { color: 'text-indigo-400', bg: 'bg-indigo-400/10', icon: <Cpu className="w-3 h-3" /> },
          2: { color: 'text-green-400', bg: 'bg-green-400/10', icon: <Cpu className="w-3 h-3" /> },
          3: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', icon: <Server className="w-3 h-3" /> },
          4: { color: 'text-purple-400', bg: 'bg-purple-400/10', icon: <Cpu className="w-3 h-3" /> },
          5: { color: 'text-amber-400', bg: 'bg-amber-400/10', icon: <Globe className="w-3 h-3" /> },
        }[tier];
        
        return (
          <span key={tier} className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
              {config.icon}
              <span>{tier}</span>
            </span>
            <span className="text-white/50">{label}</span>
          </span>
        );
      })}
    </div>
  );
};