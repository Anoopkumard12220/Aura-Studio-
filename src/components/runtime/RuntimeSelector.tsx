import React from 'react';
import { runtimeManager } from '@/runtimes/RuntimeManager';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ExternalLink, Cpu, Server, Globe, CheckCircle } from 'lucide-react';

interface RuntimeSelectorProps {
  selectedDriverId: string;
  onChange: (driverId: string) => void;
  language?: string;
}

export const RuntimeSelector: React.FC<RuntimeSelectorProps> = ({
  selectedDriverId,
  onChange,
  language,
}) => {
  const drivers = runtimeManager.getDriverInfos();
  
  // Filter drivers by language if provided
  const availableDrivers = language
    ? drivers.filter(d => d.supportedLanguages.some(l => l.toLowerCase() === language.toLowerCase()))
    : drivers;

  const tierLabels: Record<number, { label: string; icon: React.ReactNode; color: string }> = {
    1: { label: 'Native JS/TS', icon: <Cpu className="w-4 h-4" />, color: 'text-indigo-400' },
    2: { label: 'Python WASM', icon: <Cpu className="w-4 h-4" />, color: 'text-green-400' },
    3: { label: 'WebContainer', icon: <Server className="w-4 h-4" />, color: 'text-cyan-400' },
    4: { label: 'Clang WASM', icon: <Cpu className="w-4 h-4" />, color: 'text-purple-400' },
    5: { label: 'Remote', icon: <Globe className="w-4 h-4" />, color: 'text-amber-400' },
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedDriverId}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'px-3 py-1.5 bg-surface border border-white/10 rounded text-sm text-white',
          'focus:border-indigo-500 focus:outline-none',
          'appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%238b949e%27 stroke-width=%272%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E")] bg-no-repeat bg-right-2 bg-center pr-8'
        )}
      >
        {availableDrivers.map(driver => {
          const tierInfo = tierLabels[driver.tier];
          return (
            <option key={driver.id} value={driver.id}>
              {tierInfo?.icon} {driver.name} {driver.offlineCapable ? '(Offline)' : ''}
            </option>
          );
        })}
      </select>

      {availableDrivers.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs">
          {availableDrivers.map(driver => {
            const tierInfo = tierLabels[driver.tier];
            if (!tierInfo) return null;
            const isSelected = selectedDriverId === driver.id;
            return (
              <span
                key={driver.id}
                className={clsx(
                  'px-2 py-0.5 rounded flex items-center gap-1',
                  isSelected 
                    ? `bg-${tierInfo.color.replace('text-', '')}/20 text-${tierInfo.color.replace('text-', '')} border border-current`
                    : 'text-white/40 hover:text-white/60'
                )}
                title={driver.description}
              >
                {tierInfo.icon}
                {driver.tier === 5 && !driver.offlineCapable && <ExternalLink className="w-3 h-3" />}
                {isSelected && <CheckCircle className="w-3 h-3" />}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};