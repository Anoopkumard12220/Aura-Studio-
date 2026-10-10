import { BaseDriver } from './drivers/BaseDriver';
import { JsWorkerDriver } from './drivers/JsWorkerDriver';
import { PyodideDriver } from './drivers/PyodideDriver';
import { WebContainerDriver } from './drivers/WebContainerDriver';
import { ClangWasmDriver } from './drivers/ClangWasmDriver';
import { RemoteSandboxDriver } from './drivers/RemoteSandboxDriver';
import { ExecutionRequest, ExecutionEvent, ExecutionState, DriverInfo } from '@/types/runtime';
import { useFileStore } from '@/stores/useFileStore';
import { useProjectStore } from '@/stores/useProjectStore';

export class RuntimeManager {
  private drivers: Map<string, BaseDriver> = new Map();
  private activeDriver: BaseDriver | null = null;
  private eventListeners: Set<(event: ExecutionEvent) => void> = new Set();
  private state: ExecutionState = 'idle';
  private currentRequest: ExecutionRequest | null = null;

  constructor() {
    this.registerDrivers();
  }

  private registerDrivers() {
    const drivers = [
      new JsWorkerDriver(),
      new PyodideDriver(),
      new WebContainerDriver(),
      new ClangWasmDriver(),
      new RemoteSandboxDriver(),
    ];

    for (const driver of drivers) {
      this.drivers.set(driver.id, driver);
    }
  }

  getDriver(id: string): BaseDriver | undefined {
    return this.drivers.get(id);
  }

  getAllDrivers(): BaseDriver[] {
    return Array.from(this.drivers.values());
  }

  getDriverInfos(): DriverInfo[] {
    return Array.from(this.drivers.values()).map(d => ({
      id: d.id,
      name: d.name,
      supportedLanguages: d.supportedLanguages,
      tier: d.tier,
      description: d.description,
      offlineCapable: d.offlineCapable,
    }));
  }

  getDriverForLanguage(language: string): BaseDriver | null {
    const lang = language.toLowerCase();
    
    // Priority order: Native > WebContainer > Remote
    const priority = ['js-worker', 'webcontainer', 'pyodide', 'clang-wasm', 'remote-sandbox'];
    
    for (const driverId of priority) {
      const driver = this.drivers.get(driverId);
      if (driver && driver.supportedLanguages.some(l => l.toLowerCase() === lang)) {
        return driver;
      }
    }

    // Fallback: any driver supporting the language
    for (const driver of this.drivers.values()) {
      if (driver.supportedLanguages.some(l => l.toLowerCase() === lang)) {
        return driver;
      }
    }

    return null;
  }

  async execute(request: ExecutionRequest): Promise<void> {
    const driver = this.getDriverForLanguage(request.language);
    
    if (!driver) {
      this.emitEvent({ type: 'error', data: `No driver found for language: ${request.language}` });
      this.emitEvent({ type: 'exit', data: 1 });
      return;
    }

    // Enrich request with project files if not provided
    if (!request.files && request.projectId) {
      const { files } = useFileStore.getState();
      const projectFiles: Record<string, string> = {};
      for (const file of Object.values(files)) {
        if (!file.isDirectory && file.content) {
          projectFiles[file.path] = file.content;
        }
      }
      request.files = projectFiles;
    }

    this.activeDriver = driver;
    this.currentRequest = request;
    this.state = 'initializing';
    this.emitEvent({ type: 'status', data: `Starting ${driver.name}...` });

    try {
      this.state = 'compiling';
      this.emitEvent({ type: 'status', data: 'Compiling...' });
      
      this.state = 'running';
      this.emitEvent({ type: 'status', data: 'Running...' });

      await driver.execute(request, (event) => {
        this.emitEvent(event);
        
        if (event.type === 'exit') {
          this.state = typeof event.data === 'number' && event.data === 0 ? 'completed' : 'failed';
          this.activeDriver = null;
          this.currentRequest = null;
        }
      });
    } catch (err: any) {
      this.state = 'failed';
      this.emitEvent({ type: 'stderr', data: `\x1b[31m[Runtime Error] ${err.message}\x1b[0m\r\n` });
      this.emitEvent({ type: 'exit', data: 1 });
      this.activeDriver = null;
      this.currentRequest = null;
    }
  }

  terminate(): void {
    if (this.activeDriver) {
      this.activeDriver.terminate();
      this.activeDriver = null;
      this.state = 'cancelled';
      this.emitEvent({ type: 'stderr', data: '\r\n[Execution terminated by user]\r\n' });
      this.emitEvent({ type: 'exit', data: 130 });
    }
  }

  sendStdin(data: string): void {
    if (this.activeDriver && this.activeDriver.sendStdin) {
      this.activeDriver.sendStdin(data);
    }
  }

  getState(): ExecutionState {
    return this.state;
  }

  getCurrentRequest(): ExecutionRequest | null {
    return this.currentRequest;
  }

  onEvent(listener: (event: ExecutionEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private emitEvent(event: ExecutionEvent) {
    this.eventListeners.forEach(listener => listener(event));
  }
}

// Singleton instance
export const runtimeManager = new RuntimeManager();