export interface NetworkState {
  isOnline: boolean;
  canExecuteRemote: boolean;
  effectiveConnectionType?: string;
  downlink?: number;
  rtt?: number;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAUpdateEvent {
  type: 'UPDATE_AVAILABLE' | 'UPDATING' | 'UPDATED';
  serviceWorkerRegistration?: ServiceWorkerRegistration;
}

export interface CacheStatus {
  name: string;
  size: number;
  entries: number;
  lastUpdated: number;
}

export interface OfflineCapability {
  driverId: string;
  language: string;
  offlineCapable: boolean;
  fallbackMessage?: string;
}