import { BaseDriver } from './BaseDriver';
import { ExecutionRequest, ExecutionEvent } from '@/types/runtime';
import { transform, TransformOptions } from 'sucrase';

export class JsWorkerDriver extends BaseDriver {
  id = 'js-worker';
  name = 'In-Browser JS/TS Engine (Worker)';
  tier = 1 as const;
  supportedLanguages = ['javascript', 'typescript', 'jsx', 'tsx', 'js', 'ts'];
  description = 'Executes JavaScript/TypeScript in a sandboxed Web Worker with Sucrase transpilation';
  offlineCapable = true;

  private currentWorker: Worker | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  async execute(request: ExecutionRequest, onEvent: (event: ExecutionEvent) => void): Promise<void> {
    this.terminate();

    // 1. Transpile TS/JSX to standard ES modules
    let executableCode = request.code;
    const lang = request.language.toLowerCase();
    
    if (['typescript', 'tsx', 'jsx'].includes(lang)) {
      try {
        const transforms: TransformOptions['transforms'] = [];
        if (lang === 'typescript' || lang === 'tsx') transforms.push('typescript');
        if (lang === 'jsx' || lang === 'tsx') transforms.push('jsx');
        
        const compiled = transform(request.code, {
          transforms,
          jsxRuntime: 'classic',
          production: false,
        });
        executableCode = compiled.code;
      } catch (err: any) {
        onEvent(this.createEvent('stderr', `\x1b[31m[Compiler Error]\x1b[0m ${err.message}\r\n`));
        onEvent(this.createEvent('exit', 1));
        return;
      }
    }

    // 2. Create worker script with console interception
    const workerScript = this.createWorkerScript();
    
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    this.currentWorker = new Worker(URL.createObjectURL(blob));

    this.currentWorker.onmessage = (e) => {
      const event = e.data as ExecutionEvent;
      onEvent(event);
      if (event.type === 'exit') {
        this.clearWatchdog();
      }
    };

    this.currentWorker.onerror = (err) => {
      onEvent(this.createEvent('stderr', `\x1b[31m[Worker Error] ${err.message}\x1b[0m\r\n`));
      onEvent(this.createEvent('exit', 1));
      this.clearWatchdog();
    };

    // Watchdog timer (10s default against infinite loops)
    const timeout = request.timeoutMs || 10000;
    this.timer = setTimeout(() => {
      if (this.currentWorker) {
        onEvent(this.createEvent('stderr', `\r\n\x1b[33m[Watchdog Timeout: Execution halted after ${timeout}ms]\x1b[0m\r\n`));
        onEvent(this.createEvent('exit', 124));
        this.terminate();
      }
    }, timeout);

    // Send code to worker
    this.currentWorker.postMessage({ 
      code: executableCode,
      files: request.files,
      entryPoint: request.entryPoint,
    });
  }

  private createWorkerScript(): string {
    return `
      self.onmessage = function(e) {
        const { code, files, entryPoint } = e.data;
        
        // Setup virtual filesystem if provided
        if (files) {
          const originalRequire = self.require;
          const moduleCache = new Map();
          
          self.require = function(id) {
            if (moduleCache.has(id)) return moduleCache.get(id).exports;
            
            const fileContent = files[id] || files['/' + id] || files['./' + id];
            if (fileContent) {
              const module = { exports: {} };
              const fn = new Function('module', 'exports', 'require', fileContent + '\\n');
              fn(module, module.exports, self.require);
              moduleCache.set(id, module);
              return module.exports;
            }
            
            throw new Error(\`Cannot find module '\${id}'\`);
          };
        }

        // Console interception
        const consoleMethods = ['log', 'error', 'warn', 'info', 'debug'];
        const originalConsole = { ...console };
        
        consoleMethods.forEach(method => {
          console[method] = (...args) => {
            const output = args.map(a => {
              if (typeof a === 'object' && a !== null) {
                try {
                  return JSON.stringify(a, (key, val) => 
                    typeof val === 'bigint' ? val.toString() + 'n' : val
                  , 2);
                } catch {
                  return String(a);
                }
              }
              return String(a);
            }).join(' ');
            
            const isErr = method === 'error' || method === 'warn';
            self.postMessage({
              type: isErr ? 'stderr' : 'stdout',
              data: (isErr ? '\x1b[31m' : '') + output + (isErr ? '\x1b[0m' : '') + '\r\n'
            });
          };
        });

        // Process-like interface
        self.process = {
          stdin: null,
          stdout: {
            write: (data) => self.postMessage({ type: 'stdout', data: String(data) })
          },
          stderr: {
            write: (data) => self.postMessage({ type: 'stderr', data: '\x1b[31m' + String(data) + '\x1b[0m' })
          },
          exit: (code = 0) => self.postMessage({ type: 'exit', data: code }),
          argv: ['node', 'main.js'],
          env: {},
          cwd: '/',
        };

        // Timer mocks
        self.setTimeout = setTimeout;
        self.clearTimeout = clearTimeout;
        self.setInterval = setInterval;
        self.clearInterval = clearInterval;

        try {
          const fn = new Function('module', 'exports', 'require', 'console', 'process', code);
          const module = { exports: {} };
          const result = fn(module, module.exports, self.require, console, self.process);
          
          if (result instanceof Promise) {
            result
              .then(() => {
                if (!module.exports) self.postMessage({ type: 'exit', data: 0 });
              })
              .catch(err => {
                self.postMessage({ type: 'stderr', data: '\x1b[31m' + (err.stack || err.message) + '\x1b[0m\r\n' });
                self.postMessage({ type: 'exit', data: 1 });
              });
          } else {
            // Check if async completion was signaled
            if (!self.process?.exited) {
              self.postMessage({ type: 'exit', data: 0 });
            }
          }
        } catch (err) {
          self.postMessage({ type: 'stderr', data: '\x1b[31m' + (err.stack || err.message) + '\x1b[0m\r\n' });
          self.postMessage({ type: 'exit', data: 1 });
        }
      };
    `;
  }

  private clearWatchdog() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  terminate(): void {
    this.clearWatchdog();
    if (this.currentWorker) {
      this.currentWorker.terminate();
      this.currentWorker = null;
    }
  }
}