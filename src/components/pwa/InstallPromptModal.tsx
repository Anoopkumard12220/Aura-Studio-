import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, Laptop, CheckCircle2, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BeforeInstallPromptEvent } from '@/types/pwa';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({ 
  isOpen, 
  onClose, 
  onInstall 
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<'accepted' | 'dismissed' | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Capture beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Auto-show if not previously dismissed
      const dismissed = localStorage.getItem('aura_pwa_dismissed');
      const installed = localStorage.getItem('aura_pwa_installed');
      
      if (!dismissed && !installed && isOpen) {
        // Already open via prop
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    // Also listen for appinstalled event
    const installedHandler = () => {
      localStorage.setItem('aura_pwa_installed', 'true');
      localStorage.removeItem('aura_pwa_dismissed');
      setDeferredPrompt(null);
      setInstallResult('accepted');
      // Auto-close after showing success
      setTimeout(() => onClose(), 2000);
    };
    
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, [isOpen, onClose]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Try native install if available
      try {
        await (navigator as any).serviceWorker?.ready;
        // Some browsers support direct install
      } catch {}
      return;
    }

    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      setInstallResult(outcome);
      
      if (outcome === 'accepted') {
        localStorage.setItem('aura_pwa_installed', 'true');
        localStorage.removeItem('aura_pwa_dismissed');
        setDeferredPrompt(null);
        onInstall();
      } else {
        localStorage.setItem('aura_pwa_dismissed', 'true');
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('aura_pwa_dismissed', 'true');
    onClose();
  };

  const handleNotNow = () => {
    onClose();
  };

  // Don't show if already installed or dismissed (unless forced open)
  const dismissed = localStorage.getItem('aura_pwa_dismissed');
  const installed = localStorage.getItem('aura_pwa_installed');
  
  if ((dismissed || installed) && !isOpen) {
    return null;
  }

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
    >
      <div 
        ref={modalRef}
        className={twMerge(
          'w-[420px] max-w-[90vw] bg-[#161820] border border-white/10 rounded-xl shadow-2xl p-6 relative animate-fade-in',
          installResult === 'accepted' && 'border-green-500/50'
        )}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-4 mb-4">
          <div className={clsx(
            'w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0',
            installResult === 'accepted' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white'
          )}>
            {installResult === 'accepted' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Laptop className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 id="install-modal-title" className="text-base font-semibold text-white">
              {installResult === 'accepted' ? 'Installed Successfully!' : 'Install Aura Studio'}
            </h3>
            <p className="text-xs text-white/60">
              {installResult === 'accepted' 
                ? 'Aura Studio is now available as a standalone app' 
                : 'Standalone macOS Desktop Experience'}
            </p>
          </div>
        </div>

        {!installResult && (
          <p className="text-xs text-white/70 mb-6 leading-relaxed">
            Install Aura Studio for full-screen distraction-free development, offline
            code execution, and native system file association.
          </p>
        )}

        {installResult === 'accepted' && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>App installed! You can now launch Aura Studio from your dock/applications.</span>
          </div>
        )}

        {!installResult && (
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={handleNotNow}
              className="px-4 py-2 rounded-lg text-xs font-medium text-white/70 hover:bg-white/[0.06] transition-colors"
            >
              Not Now
            </button>
            <button
              onClick={handleInstall}
              disabled={installing}
              className={clsx(
                'px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all',
                installing && 'opacity-70 cursor-wait'
              )}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{installing ? 'Installing...' : 'Install App'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};