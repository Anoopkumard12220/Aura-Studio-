import { useNetworkStore } from '@/stores/useNetworkStore';
import { runtimeManager } from '@/runtimes/RuntimeManager';
import { OfflineCapability } from '@/types/pwa';

export const OFFLINE_CAPABILITIES: OfflineCapability[] = [
  {
    driverId: 'js-worker',
    language: 'javascript',
    offlineCapable: true,
  },
  {
    driverId: 'js-worker',
    language: 'typescript',
    offlineCapable: true,
  },
  {
    driverId: 'js-worker',
    language: 'jsx',
    offlineCapable: true,
  },
  {
    driverId: 'js-worker',
    language: 'tsx',
    offlineCapable: true,
  },
  {
    driverId: 'pyodide',
    language: 'python',
    offlineCapable: true, // If WASM was cached
    fallbackMessage: 'Python WASM runtime must be cached on first online run. Install Pyodide packages while online.',
  },
  {
    driverId: 'webcontainer',
    language: 'javascript',
    offlineCapable: true, // If container was booted and files mounted
    fallbackMessage: 'WebContainer must be booted while online. File system persists in IndexedDB.',
  },
  {
    driverId: 'webcontainer',
    language: 'typescript',
    offlineCapable: true,
    fallbackMessage: 'WebContainer must be booted while online. TypeScript execution via tsx requires cached dependencies.',
  },
  {
    driverId: 'webcontainer',
    language: 'node',
    offlineCapable: true,
    fallbackMessage: 'WebContainer must be booted while online. Node.js runtime and npm cache persist in IndexedDB.',
  },
  {
    driverId: 'clang-wasm',
    language: 'c',
    offlineCapable: true, // If WASM compiler was cached
    fallbackMessage: 'Clang WASM compiler must be cached on first online run.',
  },
  {
    driverId: 'clang-wasm',
    language: 'cpp',
    offlineCapable: true,
    fallbackMessage: 'Clang WASM compiler must be cached on first online run.',
  },
  {
    driverId: 'remote-sandbox',
    language: 'rust',
    offlineCapable: false,
    fallbackMessage: 'Remote Rust compilation requires internet connection. Use local tools or reconnect.',
  },
  {
    driverId: 'remote-sandbox',
    language: 'go',
    offlineCapable: false,
    fallbackMessage: 'Remote Go compilation requires internet connection. Use local tools or reconnect.',
  },
  {
    driverId: 'remote-sandbox',
    language: 'java',
    offlineCapable: false,
    fallbackMessage: 'Remote Java compilation requires internet connection. Use local tools or reconnect.',
  },
  {
    driverId: 'remote-sandbox',
    language: 'csharp',
    offlineCapable: false,
    fallbackMessage: 'Remote C# compilation requires internet connection. Use local tools or reconnect.',
  },
  {
    driverId: 'remote-sandbox',
    language: 'php',
    offlineCapable: false,
    fallbackMessage: 'Remote PHP execution requires internet connection. Use local tools or reconnect.',
  },
  {
    driverId: 'remote-sandbox',
    language: 'ruby',
    offlineCapable: false,
    fallbackMessage: 'Remote Ruby execution requires internet connection. Use local tools or reconnect.',
  },
  {
    driverId: 'remote-sandbox',
    language: 'kotlin',
    offlineCapable: false,
    fallbackMessage: 'Remote Kotlin compilation requires internet connection. Use local tools or reconnect.',
  },
  {
    driverId: 'remote-sandbox',
    language: 'swift',
    offlineCapable: false,
    fallbackMessage: 'Remote Swift compilation requires internet connection. Use local tools or reconnect.',
  },
  {
    driverId: 'remote-sandbox',
    language: 'dart',
    offlineCapable: false,
    fallbackMessage: 'Remote Dart compilation requires internet connection. Use local tools or reconnect.',
  },
];

export class OfflineMatrix {
  static getCapability(driverId: string, language: string): OfflineCapability | undefined {
    return OFFLINE_CAPABILITIES.find(
      c => c.driverId === driverId && c.language === language
    );
  }

  static getCapabilitiesForLanguage(language: string): OfflineCapability[] {
    return OFFLINE_CAPABILITIES.filter(c => c.language === language);
  }

  static getAllOfflineCapableDrivers(): OfflineCapability[] {
    return OFFLINE_CAPABILITIES.filter(c => c.offlineCapable);
  }

  static getAllOnlineOnlyDrivers(): OfflineCapability[] {
    return OFFLINE_CAPABILITIES.filter(c => !c.offlineCapable);
  }

  static canExecuteOffline(driverId: string, language: string): boolean {
    const capability = this.getCapability(driverId, language);
    if (!capability) return false;
    return capability.offlineCapable;
  }

  static getFallbackMessage(driverId: string, language: string): string | undefined {
    const capability = this.getCapability(driverId, language);
    return capability?.fallbackMessage;
  }

  static getStatusSummary(): { online: number; offline: number; total: number } {
    const networkStore = useNetworkStore.getState();
    const isOnline = networkStore.isOnline;
    
    let online = 0;
    let offline = 0;
    
    for (const cap of OFFLINE_CAPABILITIES) {
      if (cap.offlineCapable) {
        offline++;
      } else {
        online++;
      }
    }
    
    return { online, offline, total: OFFLINE_CAPABILITIES.length };
  }

  static getAvailableLanguages(): string[] {
    const networkStore = useNetworkStore.getState();
    const isOnline = networkStore.isOnline;
    
    const available = new Set<string>();
    
    for (const cap of OFFLINE_CAPABILITIES) {
      if (isOnline || cap.offlineCapable) {
        available.add(cap.language);
      }
    }
    
    return Array.from(available).sort();
  }

  static getUnavailableLanguages(): string[] {
    const networkStore = useNetworkStore.getState();
    const isOnline = networkStore.isOnline;
    
    if (isOnline) return [];
    
    const unavailable = new Set<string>();
    
    for (const cap of OFFLINE_CAPABILITIES) {
      if (!cap.offlineCapable) {
        unavailable.add(cap.language);
      }
    }
    
    return Array.from(unavailable).sort();
  }
}

export function initializeOfflineMatrix(): void {
  // Initialize network listeners
  window.addEventListener('online', () => {
    useNetworkStore.getState().setOnline(true);
    console.log('[OfflineMatrix] Network restored - remote execution available');
  });
  
  window.addEventListener('offline', () => {
    useNetworkStore.getState().setOnline(false);
    console.log('[OfflineMatrix] Network lost - remote execution disabled');
  });

  // Initialize network state
  useNetworkStore.getState().setOnline(navigator.onLine);
}

// Integration with RuntimeManager
export function getOfflineExecutionWarning(driverId: string, language: string): string | null {
  const capability = OfflineMatrix.getCapability(driverId, language);
  const networkStore = useNetworkStore.getState();
  
  if (!capability) return null;
  
  if (!networkStore.isOnline && !capability.offlineCapable) {
    return capability.fallbackMessage || 
      `[Offline Mode] ${language} requires an active internet connection. Please reconnect to use remote execution.`;
  }
  
  if (!networkStore.isOnline && capability.offlineCapable && capability.fallbackMessage) {
    return capability.fallbackMessage;
  }
  
  return null;
}