import { ExecutionRequest, ExecutionEvent } from '@/types/runtime';

export abstract class BaseDriver {
  abstract id: string;
  abstract name: string;
  abstract supportedLanguages: string[];
  abstract tier: 1 | 2 | 3 | 4 | 5;
  abstract description: string;
  abstract offlineCapable: boolean;

  abstract execute(
    request: ExecutionRequest,
    onEvent: (event: ExecutionEvent) => void
  ): Promise<void>;

  abstract terminate(): void;

  sendStdin?(data: string): void;

  protected createEvent(type: ExecutionEvent['type'], data: string | number, metadata?: Record<string, any>): ExecutionEvent {
    return { type, data, metadata };
  }
}

export interface DriverRegistry {
  [driverId: string]: BaseDriver;
}