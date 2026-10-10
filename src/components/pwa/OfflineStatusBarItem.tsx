import React from 'react';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { useDiagnosticsStore } from '@/stores/useDiagnosticsStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Wifi, WifiOff, AlertTriangle, ExternalLink, Info, Download, AlertCircle } from 'lucide-react';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';

export const OfflineStatusBarItem: React.FC = () => {
  const { isOnline, canExecuteRemote, effectiveConnectionType, downlink, rtt } = useNetworkStore();
  const { diagnostics } = useDiagnosticsStore();
  
  // Count offline-related diagnostics
  const offlineDiagnostics = diagnostics.filter(d => 
    d.source === 'Remote Execution' || 
    d.message.toLowerCase().includes('offline') ||
    d.message.toLowerCase().includes('network')
  ).length;

  const dropdownItems: DropdownItem[] = [
    {
      label: isOnline ? 'Online' : 'Offline',
      icon: isOnline ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-amber-400" />,
      disabled: true,
    },
    {
      label: canExecuteRemote ? 'Remote execution available' : 'Remote execution unavailable',
      icon: canExecuteRemote ? <ExternalLink className="w-4 h-4 text-green-400" /> : <ExternalLink className="w-4 h-4 text-amber-400" />,
      disabled: true,
    },
    { divider: true },
    {
      label: 'Check Connection',
      onClick: () => useNetworkStore.getState().checkConnection(),
      icon: <Wifi className="w-4 h-4" />,
      disabled: !isOnline,
    },
    {
      label: 'View Offline Diagnostics',
      onClick: () => {
        // Could open diagnostics panel filtered
        window.dispatchEvent(new CustomEvent('aura-open-diagnostics', { 
          detail: { filter: 'offline' } 
        }));
      },
      icon: <AlertTriangle className="w-4 h-4" />,
      disabled: offlineDiagnostics === 0,
    },
    { divider: true },
    {
      label: effectiveConnectionType ? `Connection: ${effectiveConnectionType}` : 'Connection: Unknown',
      disabled: true,
    },
    {
      label: downlink ? `Downlink: ${downlink.toFixed(1)} Mbps` : 'Downlink: Unknown',
      disabled: true,
    },
    {
      label: rtt ? `RTT: ${rtt} ms` : 'RTT: Unknown',
      disabled: true,
    },
  ];

  const getTooltipText = () => {
    if (isOnline && canExecuteRemote) return 'Online - All runtimes available';
    if (isOnline && !canExecuteRemote) return 'Online - Remote execution limited';
    return 'Offline - Local runtimes only (JS/TS, cached WASM)';
  };

  return (
    <Dropdown
      trigger={
        <button
          className={twMerge(
            'flex items-center gap-1.5 px-2 py-1 rounded transition-colors',
            'hover:bg-white/[0.05]',
            isOnline ? 'text-green-400' : 'text-amber-400'
          )}
          title={getTooltipText()}
          aria-label="Network status"
        >
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          <span className="text-xs font-medium hidden sm:inline">
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {offlineDiagnostics > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" 
              title={`${offlineDiagnostics} offline-related issues`} />
          )}
        </button>
      }
      items={dropdownItems}
      align="right"
    />
  );
};

export const NetworkStatusIndicator: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isOnline, canExecuteRemote } = useNetworkStore();
  
  if (compact) {
    return (
      <span className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
        isOnline ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
      )}>
        {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        <span>{isOnline ? 'Online' : 'Offline'}</span>
        {!canExecuteRemote && isOnline && (
          <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px]">
            Limited
          </span>
        )}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-xs',
        isOnline ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
      )}>
        {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </span>
      
      {!canExecuteRemote && isOnline && (
        <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3" />
          <span>Remote execution unavailable</span>
        </span>
      )}
    </div>
  );
};