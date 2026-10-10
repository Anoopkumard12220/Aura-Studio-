import { Workbox } from 'workbox-window';

let wb: Workbox | null = null;

export async function registerServiceWorker(): Promise<Workbox | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported');
    return null;
  }

  // Only register in production or when explicitly enabled
  const isProduction = import.meta.env.PROD;
  const forceSW = import.meta.env.VITE_FORCE_SW === 'true';
  
  if (!isProduction && !forceSW) {
    console.log('[PWA] Skipping SW registration in development');
    return null;
  }

  try {
    wb = new Workbox('/sw.js', {
      type: 'module',
    });

    // Listen for lifecycle events
    wb.addEventListener('installed', (event) => {
      if (!event.isUpdate) {
        console.log('[PWA] Service Worker installed for offline use');
        dispatchPWAEvent({ type: 'INSTALLED' });
      } else {
        console.log('[PWA] Service Worker update available');
        dispatchPWAEvent({ type: 'UPDATE_AVAILABLE', serviceWorkerRegistration: wb?.registration });
      }
    });

    wb.addEventListener('waiting', () => {
      console.log('[PWA] Service Worker waiting to activate');
      dispatchPWAEvent({ type: 'WAITING' });
    });

    wb.addEventListener('controlling', () => {
      console.log('[PWA] Service Worker now controlling page');
      dispatchPWAEvent({ type: 'CONTROLLING' });
    });

    wb.addEventListener('activated', (event) => {
      if (!event.isUpdate) {
        console.log('[PWA] Service Worker activated');
        dispatchPWAEvent({ type: 'ACTIVATED' });
      } else {
        console.log('[PWA] Service Worker updated');
        dispatchPWAEvent({ type: 'UPDATED' });
      }
    });

    wb.addEventListener('externalinstalled', () => {
      console.log('[PWA] Service Worker installed externally');
    });

    wb.addEventListener('externalwaiting', () => {
      console.log('[PWA] Service Worker waiting externally');
    });

    wb.addEventListener('externalactivated', () => {
      console.log('[PWA] Service Worker activated externally');
    });

    // Register the service worker
    const registration = await wb.register();
    console.log('[PWA] Service Worker registered:', registration.scope);
    
    // Check for updates periodically
    setInterval(() => {
      wb?.update();
    }, 60 * 60 * 1000); // Every hour

    return wb;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

export function getWorkboxInstance(): Workbox | null {
  return wb;
}

export async function checkForUpdate(): Promise<boolean> {
  if (!wb) return false;
  await wb.update();
  return true;
}

export async function skipWaiting(): Promise<void> {
  if (!wb) return;
  wb.messageSW({ type: 'SKIP_WAITING' });
}

export async function getCacheStatus(): Promise<any[]> {
  if (!wb) return [];
  
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      if (event.data.type === 'CACHE_STATUS') {
        resolve(event.data.payload);
      }
    };
    
    wb?.messageSW(
      { type: 'GET_CACHE_STATUS' },
      [channel.port2]
    );
    
    // Timeout fallback
    setTimeout(() => resolve([]), 5000);
  });
}

export async function clearCache(cacheName: string): Promise<boolean> {
  if (!wb) return false;
  
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      if (event.data.type === 'CACHE_CLEARED') {
        resolve(event.data.success);
      }
    };
    
    wb?.messageSW(
      { type: 'CLEAR_CACHE', cacheName },
      [channel.port2]
    );
    
    setTimeout(() => resolve(false), 5000);
  });
}

function dispatchPWAEvent(event: any) {
  window.dispatchEvent(new CustomEvent('aura-pwa', { detail: event }));
}

export function onPWAEvent(listener: (event: any) => void): () => void {
  window.addEventListener('aura-pwa', listener as EventListener);
  return () => window.removeEventListener('aura-pwa', listener as EventListener);
}