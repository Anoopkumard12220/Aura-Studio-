import { create } from 'zustand';
import { NetworkState } from '@/types/pwa';

interface NetworkStore extends NetworkState {
  setOnline: (online: boolean) => void;
  setConnectionInfo: (info: Partial<NetworkState>) => void;
  checkConnection: () => Promise<boolean>;
}

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  canExecuteRemote: typeof navigator !== 'undefined' ? navigator.onLine : true,
  effectiveConnectionType: undefined,
  downlink: undefined,
  rtt: undefined,

  setOnline: (online) => {
    const wasOnline = get().isOnline;
    set({ 
      isOnline: online, 
      canExecuteRemote: online 
    });
    
    // Dispatch custom event for other components
    if (wasOnline !== online) {
      window.dispatchEvent(new CustomEvent('aura-network-change', { 
        detail: { isOnline: online } 
      }));
    }
  },

  setConnectionInfo: (info) => {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      set({
        effectiveConnectionType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        ...info,
      });
    } else {
      set(info);
    }
  },

  checkConnection: async () => {
    try {
      // Try to fetch a lightweight resource
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch('/favicon.svg', { 
        method: 'HEAD', 
        cache: 'no-cache',
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      get().setOnline(true);
      return true;
    } catch {
      get().setOnline(false);
      return false;
    }
  },
}));

// Initialize network listeners
if (typeof window !== 'undefined') {
  const store = useNetworkStore.getState();
  
  window.addEventListener('online', () => {
    store.setOnline(true);
    // Check actual connection quality
    store.checkConnection();
  });
  
  window.addEventListener('offline', () => {
    store.setOnline(false);
  });

  // Listen for connection quality changes
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    conn.addEventListener('change', () => {
      store.setConnectionInfo({
        effectiveConnectionType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
      });
    });
    
    // Initial values
    store.setConnectionInfo({
      effectiveConnectionType: conn.effectiveType,
      downlink: conn.downlink,
      rtt: conn.rtt,
    });
  }
}