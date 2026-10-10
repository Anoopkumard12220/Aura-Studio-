import { BaseDriver } from './BaseDriver';
import { ExecutionRequest, ExecutionEvent } from '@/types/runtime';

export class ClangWasmDriver extends BaseDriver {
  id = 'clang-wasm';
  name = 'In-Browser C/C++ to WASM (Clang)';
  tier = 4 as const;
  supportedLanguages = ['c', 'cpp', 'c++', 'cc', 'cxx'];
  description = 'Compiles C/C++ to WebAssembly using Clang/LLVM WASM and executes with WASI';
  offlineCapable = false; // Requires WASM binary

  private worker: Worker | null = null;
  private clangWasmUrl = 'https://cdn.jsdelivr.net/npm/@wasmer/wasi@latest/dist/wasi.js';

  async execute(request: ExecutionRequest, onEvent: (event: ExecutionEvent) => void): Promise<void> {
    this.terminate();
    onEvent(this.createEvent('status', 'Initializing Clang WASM compiler...'));

    const workerCode = this.createWorkerScript();
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));

    this.worker.onmessage = (e) => {
      const event = e.data as ExecutionEvent;
      onEvent(event);
    };

    this.worker.onerror = (err) => {
      onEvent(this.createEvent('stderr', `\x1b[31m[Worker Error] \${err.message}\x1b[0m\r\n`));
      onEvent(this.createEvent('exit', 1));
    };

    this.worker.postMessage({
      code: request.code,
      language: request.language,
      files: request.files,
      stdin: request.stdin,
    });
  }

  private createWorkerScript(): string {
    return `
      let wasiInstance = null;
      let initialized = false;

      async function init() {
        if (initialized) return;
        
        try {
          // Load WASI runtime
          self.importScripts('https://cdn.jsdelivr.net/npm/@wasmer/wasi@latest/dist/wasi.js');
          
          const { WasmFs } = await import('https://cdn.jsdelivr.net/npm/@wasmer/wasi@latest/dist/wasi.js');
          wasiInstance = new WasmFs();
          
          initialized = true;
          self.postMessage({ type: 'status', data: 'WASI runtime ready.' });
        } catch (err) {
          self.postMessage({ type: 'stderr', data: '\x1b[31m[WASI Init Failed] ' + err.message + '\x1b[0m\r\n' });
          self.postMessage({ type: 'exit', data: 1 });
        }
      }

      async function compileAndRun(code, language, files, stdin) {
        try {
          self.postMessage({ type: 'status', data: 'Compiling ' + language + ' to WebAssembly...' });
          
          // Use WebAssembly Explorer-style compilation via remote API or local WASM
          // For now, use a remote compilation service
          const response = await fetch('https://wasm.floitsch.dev/compile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              language: language === 'c' ? 'c' : 'cpp',
              optimization: 'O2',
              target: 'wasm32-wasi',
            })
          });

          if (!response.ok) {
            throw new Error('Compilation service unavailable: ' + response.status);
          }

          const result = await response.json();
          
          if (!result.success) {
            self.postMessage({ type: 'stderr', data: '\x1b[31m[Compilation Error]\\n' + result.stderr + '\x1b[0m\r\n' });
            self.postMessage({ type: 'exit', data: 1 });
            return;
          }

          self.postMessage({ type: 'stdout', data: '\x1b[32m[Compilation Successful]\x1b[0m\r\n' });
          self.postMessage({ type: 'status', data: 'Executing WebAssembly module...' });

          // Execute with WASI
          const wasmBytes = Uint8Array.from(atob(result.wasm), c => c.charCodeAt(0));
          const instance = await WebAssembly.instantiate(wasmBytes, {
            wasi_snapshot_preview1: wasiInstance.wasiImport,
          });
          
          wasiInstance.fs.writeFileSync('/dev/stdin', stdin || '');
          
          const start = instance.instance.exports._start;
          if (start) {
            start();
          }
          
          const stdout = wasiInstance.fs.readFileSync('/dev/stdout', 'utf8');
          const stderr = wasiInstance.fs.readFileSync('/dev/stderr', 'utf8');
          
          if (stdout) self.postMessage({ type: 'stdout', data: stdout + '\r\n' });
          if (stderr) self.postMessage({ type: 'stderr', data: '\x1b[31m' + stderr + '\x1b[0m\r\n' });
          
          self.postMessage({ type: 'exit', data: 0 });
        } catch (err) {
          self.postMessage({ type: 'stderr', data: '\x1b[31m[Execution Error] ' + err.message + '\x1b[0m\r\n' });
          self.postMessage({ type: 'exit', data: 1 });
        }
      }

      self.onmessage = async (e) => {
        const { code, language, files, stdin } = e.data;
        await init();
        await compileAndRun(code, language, files, stdin);
      };
    `;
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  sendStdin(data: string): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'stdin', data });
    }
  }
}