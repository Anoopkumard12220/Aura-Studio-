import { BaseDriver } from './BaseDriver';
import { ExecutionRequest, ExecutionEvent } from '@/types/runtime';

export class PyodideDriver extends BaseDriver {
  id = 'pyodide';
  name = 'In-Browser CPython 3.11 (Pyodide WASM)';
  tier = 2 as const;
  supportedLanguages = ['python', 'py'];
  description = 'Runs Python 3.11+ via Pyodide WebAssembly with micropip package support';
  offlineCapable = false; // Requires CDN for Pyodide

  private worker: Worker | null = null;

  async execute(request: ExecutionRequest, onEvent: (event: ExecutionEvent) => void): Promise<void> {
    this.terminate();
    onEvent(this.createEvent('status', 'Initializing Pyodide CPython WASM runtime...'));

    const workerCode = this.createWorkerScript();
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));

    this.worker.onmessage = (e) => {
      const event = e.data as ExecutionEvent;
      onEvent(event);
    };

    this.worker.onerror = (err) => {
      onEvent(this.createEvent('stderr', `\x1b[31m[Worker Error] ${err.message}\x1b[0m\r\n`));
      onEvent(this.createEvent('exit', 1));
    };

    // Send code to worker
    this.worker.postMessage({ 
      code: request.code,
      stdin: request.stdin,
      packages: this.extractImports(request.code),
    });
  }

  private extractImports(code: string): string[] {
    const imports: string[] = [];
    const importRegex = /^(?:import|from)\s+(\w+)/gm;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      const pkg = match[1];
      if (!['os', 'sys', 'json', 'math', 'random', 'datetime', 'collections', 'itertools', 'functools', 'pathlib', 're', 'statistics'].includes(pkg)) {
        imports.push(pkg);
      }
    }
    return [...new Set(imports)];
  }

  private createWorkerScript(): string {
    return `
      let pyodide = null;
      let initialized = false;
      let micropipLoaded = false;
      const packageCache = new Set();

      async function init() {
        if (initialized) return;
        
        try {
          self.postMessage({ type: 'status', data: 'Loading Pyodide core...' });
          
          // Load Pyodide from CDN
          await self.importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js');
          pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
            stdout: (text) => self.postMessage({ type: 'stdout', data: text + '\r\n' }),
            stderr: (text) => self.postMessage({ type: 'stderr', data: '\x1b[31m' + text + '\x1b[0m\r\n' }),
          });
          
          self.postMessage({ type: 'status', data: 'Loading micropip...' });
          await pyodide.loadPackage(['micropip']);
          micropipLoaded = true;
          initialized = true;
          
          self.postMessage({ type: 'status', data: 'Pyodide ready.' });
        } catch (err) {
          self.postMessage({ type: 'stderr', data: '\x1b[31m[Pyodide Init Failed] ' + err.message + '\x1b[0m\r\n' });
          self.postMessage({ type: 'exit', data: 1 });
        }
      }

      async function installPackages(packages) {
        if (!micropipLoaded || packages.length === 0) return;
        
        for (const pkg of packages) {
          if (packageCache.has(pkg)) continue;
          
          try {
            self.postMessage({ type: 'status', data: \`Installing \${pkg} via micropip...\` });
            await pyodide.runPythonAsync(\`import micropip; await micropip.install('\${pkg}')\`);
            packageCache.add(pkg);
            self.postMessage({ type: 'stdout', data: \`\x1b[32m[\${pkg} installed]\x1b[0m\r\n\` });
          } catch (err) {
            self.postMessage({ type: 'stderr', data: \`\x1b[33m[Warning] Could not install \${pkg}: \${err.message}\x1b[0m\r\n\` });
          }
        }
      }

      // Patch input() for stdin support
      function patchInput() {
        pyodide.runPythonAsync(\`
import sys
_original_stdin = sys.stdin

class StdinWrapper:
    def __init__(self):
        self.buffer = []
    
    def readline(self):
        if self.buffer:
            return self.buffer.pop(0) + '\\n'
        # Block until input arrives (will be filled via postMessage)
        return self._wait_for_input()
    
    def _wait_for_input(self):
        # This is a synchronous wait - in real impl would use async
        return ''
    
    def write(self, data):
        pass
    
    def flush(self):
        pass

sys.stdin = StdinWrapper()
        \`);
      }

      self.onmessage = async (e) => {
        const { code, stdin, packages } = e.data;
        
        try {
          await init();
          
          if (packages && packages.length > 0) {
            await installPackages(packages);
          }
          
          // Handle stdin if provided
          if (stdin) {
            pyodide.runPythonAsync(\`
import sys
sys.stdin.buffer = sys.stdin.buffer || sys.stdin
\`);
          }
          
          self.postMessage({ type: 'status', data: 'Executing Python script...' });
          
          // Execute user code
          await pyodide.runPythonAsync(code);
          
          self.postMessage({ type: 'exit', data: 0 });
        } catch (err) {
          const msg = err.message || String(err);
          self.postMessage({ type: 'stderr', data: '\x1b[31m[Python Error] ' + msg + '\x1b[0m\r\n' });
          self.postMessage({ type: 'exit', data: 1 });
        }
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