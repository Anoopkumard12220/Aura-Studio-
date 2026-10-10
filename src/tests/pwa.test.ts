import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OfflineMatrix, OFFLINE_CAPABILITIES, initializeOfflineMatrix, getOfflineExecutionWarning } from '@/pwa/offlineMatrix';
import { useNetworkStore } from '@/stores/useNetworkStore';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('PWA Offline Matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNetworkStore.getState().setOnline(true);
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('OFFLINE_CAPABILITIES', () => {
    it('should have all expected language capabilities', () => {
      const languages = OFFLINE_CAPABILITIES.map(c => c.language);
      expect(languages).toContain('javascript');
      expect(languages).toContain('typescript');
      expect(languages).toContain('python');
      expect(languages).toContain('cpp');
      expect(languages).toContain('c');
      expect(languages).toContain('rust');
      expect(languages).toContain('go');
      expect(languages).toContain('java');
      expect(languages).toContain('csharp');
    });

    it('should mark remote languages as offline incapable', () => {
      const rustCap = OFFLINE_CAPABILITIES.find(c => c.language === 'rust' && c.driverId === 'remote-sandbox');
      expect(rustCap?.offlineCapable).toBe(false);
      expect(rustCap?.fallbackMessage).toBeDefined();
    });

    it('should mark local JS/TS as offline capable', () => {
      const jsCap = OFFLINE_CAPABILITIES.find(c => c.language === 'javascript' && c.driverId === 'js-worker');
      expect(jsCap?.offlineCapable).toBe(true);
    });

    it('should mark Pyodide as offline capable with warning', () => {
      const pyCap = OFFLINE_CAPABILITIES.find(c => c.language === 'python' && c.driverId === 'pyodide');
      expect(pyCap?.offlineCapable).toBe(true);
      expect(pyCap?.fallbackMessage).toContain('WASM runtime must be cached');
    });
  });

  describe('OfflineMatrix.getCapability', () => {
    it('should return capability for valid driver/language', () => {
      const cap = OfflineMatrix.getCapability('js-worker', 'javascript');
      expect(cap).toBeDefined();
      expect(cap?.offlineCapable).toBe(true);
    });

    it('should return undefined for invalid combination', () => {
      const cap = OfflineMatrix.getCapability('invalid', 'language');
      expect(cap).toBeUndefined();
    });
  });

  describe('OfflineMatrix.canExecuteOffline', () => {
    it('should return true for offline-capable combinations', () => {
      expect(OfflineMatrix.canExecuteOffline('js-worker', 'javascript')).toBe(true);
      expect(OfflineMatrix.canExecuteOffline('pyodide', 'python')).toBe(true);
      expect(OfflineMatrix.canExecuteOffline('webcontainer', 'node')).toBe(true);
    });

    it('should return false for online-only combinations', () => {
      expect(OfflineMatrix.canExecuteOffline('remote-sandbox', 'rust')).toBe(false);
      expect(OfflineMatrix.canExecuteOffline('remote-sandbox', 'go')).toBe(false);
      expect(OfflineMatrix.canExecuteOffline('remote-sandbox', 'java')).toBe(false);
    });
  });

  describe('OfflineMatrix.getAvailableLanguages', () => {
    it('should return all languages when online', () => {
      useNetworkStore.getState().setOnline(true);
      const available = OfflineMatrix.getAvailableLanguages();
      expect(available.length).toBeGreaterThan(10);
    });

    it('should return only offline-capable languages when offline', () => {
      useNetworkStore.getState().setOnline(false);
      const available = OfflineMatrix.getAvailableLanguages();
      expect(available).toContain('javascript');
      expect(available).toContain('typescript');
      expect(available).toContain('python');
      expect(available).not.toContain('rust');
      expect(available).not.toContain('go');
    });
  });

  describe('OfflineMatrix.getUnavailableLanguages', () => {
    it('should return empty array when online', () => {
      useNetworkStore.getState().setOnline(true);
      const unavailable = OfflineMatrix.getUnavailableLanguages();
      expect(unavailable.length).toBe(0);
    });

    it('should return remote-only languages when offline', () => {
      useNetworkStore.getState().setOnline(false);
      const unavailable = OfflineMatrix.getUnavailableLanguages();
      expect(unavailable).toContain('rust');
      expect(unavailable).toContain('go');
      expect(unavailable).toContain('java');
    });
  });

  describe('getOfflineExecutionWarning', () => {
    it('should return warning for remote languages when offline', () => {
      useNetworkStore.getState().setOnline(false);
      const warning = getOfflineExecutionWarning('remote-sandbox', 'rust');
      expect(warning).toContain('internet connection');
    });

    it('should return fallback message for cached WASM when offline', () => {
      useNetworkStore.getState().setOnline(false);
      const warning = getOfflineExecutionWarning('pyodide', 'python');
      expect(warning).toContain('WASM runtime must be cached');
    });

    it('should return null when online', () => {
      useNetworkStore.getState().setOnline(true);
      const warning = getOfflineExecutionWarning('remote-sandbox', 'rust');
      expect(warning).toBeNull();
    });
  });
});

describe('useNetworkStore', () => {
  beforeEach(() => {
    useNetworkStore.setState({ isOnline: true, canExecuteRemote: true });
  });

  it('should initialize with navigator.onLine', () => {
    const state = useNetworkStore.getState();
    expect(state.isOnline).toBe(true);
  });

  it('should update online status', () => {
    useNetworkStore.getState().setOnline(false);
    expect(useNetworkStore.getState().isOnline).toBe(false);
    expect(useNetworkStore.getState().canExecuteRemote).toBe(false);
  });

  it('should dispatch network change event', () => {
    const listener = vi.fn();
    window.addEventListener('aura-network-change', listener);
    
    useNetworkStore.getState().setOnline(false);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      detail: { isOnline: false }
    }));
    
    window.removeEventListener('aura-network-change', listener);
  });
});