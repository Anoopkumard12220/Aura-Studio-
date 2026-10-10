import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, RefreshCw, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { onPWAEvent } from '@/pwa/registerServiceWorker';
import { getWorkboxInstance, skipWaiting } from '@/pwa/registerServiceWorker';

interface UpdateAvailableToastProps {
  isVisible: boolean;
  onDismiss: () => void;
  onUpdate: () => void;
}

export const UpdateAvailableToast: React.FC<UpdateAvailableToastProps> = ({ 
  isVisible, 
  onDismiss, 
  onUpdate 
}) => {
  const [updateInfo, setUpdateInfo] = useState<{
    available: boolean;
    refreshing: boolean;
  }>({ available: false, refreshing: false });

  useEffect(() => {
    const unsubscribe = onPWAEvent((event: any) => {
      if (event.type === 'UPDATE_AVAILABLE' || event.type === 'WAITING') {
        setUpdateInfo({ available: true, refreshing: false });
      } else if (event.type === 'UPDATED' || event.type === 'CONTROLLING') {
        setUpdateInfo({ available: false, refreshing: false });
        // Could auto-reload or show "restart required" toast
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    // Check for update on mount
    getWorkboxInstance()?.update().catch(console.error);
  }, [isVisible]);

  const handleUpdate = async () => {
    setUpdateInfo(prev => ({ ...prev, refreshing: true }));
    try {
      await skipWaiting();
      onUpdate();
    } catch (error) {
      console.error('Failed to skip waiting:', error);
      setUpdateInfo(prev => ({ ...prev, refreshing: false }));
    }
  };

  if (!isVisible || !updateInfo.available) return null;

  const toastContent = (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in w-80">
      <div className="bg-[#161820] border border-indigo-500/50 rounded-xl p-4 shadow-2xl glass-strong flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white">Update Available</h4>
            <p className="text-xs text-white/60 mt-0.5">
              A new version of Aura Studio is ready. Update to get the latest features and fixes.
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors flex-shrink-0 mt-0.5"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          <button
            onClick={handleUpdate}
            disabled={updateInfo.refreshing}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
              'bg-indigo-600 text-white hover:bg-indigo-500',
              updateInfo.refreshing && 'opacity-50 cursor-wait'
            )}
          >
            {updateInfo.refreshing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Update & Reload</span>
              </>
            )}
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Later</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(toastContent, document.body);
};

export const NetworkStatusToast: React.FC<{ 
  isOnline: boolean; 
  onDismiss: () => void;
  persistent?: boolean;
}> = ({ isOnline, onDismiss, persistent = false }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!persistent) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [persistent, onDismiss]);

  if (!visible) return null;

  const toastContent = (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in w-72">
      <div className={clsx(
        'rounded-xl p-4 shadow-2xl glass-strong flex items-center gap-3 animate-slide-in',
        isOnline ? 'bg-green-500/15 border border-green-500/30' : 'bg-amber-500/15 border border-amber-500/30'
      )}>
        <div className={clsx(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          isOnline ? 'bg-green-500/20' : 'bg-amber-500/20'
        )}>
          {isOnline ? (
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            {isOnline ? 'Back Online' : 'Gone Offline'}
          </p>
          <p className="text-xs text-white/60 mt-0.5">
            {isOnline 
              ? 'All runtimes available. Remote execution restored.' 
              : 'Remote execution disabled. Local JS/TS and cached WASM runtimes still work.'
            }
          </p>
        </div>
        {!persistent && (
          <button
            onClick={() => { setVisible(false); onDismiss(); }}
            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(toastContent, document.body);
};

import { AlertTriangle } from 'lucide-react';