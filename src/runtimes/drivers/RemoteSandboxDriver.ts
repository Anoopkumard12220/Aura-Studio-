import { BaseDriver } from './BaseDriver';
import { ExecutionRequest, ExecutionEvent } from '@/types/runtime';

export class RemoteSandboxDriver extends BaseDriver {
  id = 'remote-sandbox';
  name = 'Secure Remote Sandbox (Piston API)';
  tier = 5 as const;
  supportedLanguages = [
    'rust', 'go', 'java', 'csharp', 'cpp', 'c', 'php', 'ruby',
    'kotlin', 'swift', 'dart', 'r', 'julia', 'bash', 'haskell',
    'elixir', 'erlang', 'ocaml', 'fsharp', 'fortran', 'cobol', 'assembly',
    'clojure', 'groovy', 'scala', 'perl', 'lua', 'racket', 'scheme',
    'typescript', 'javascript', 'nodejs', 'deno', 'bun',
    'python', 'python3', 'pypy',
    'c', 'cpp', 'c++', 'zig', 'nim', 'v', 'dart',
  ];
  description = 'Executes code in secure remote containers via Piston API (emkc.org)';
  offlineCapable = false;

  private abortController: AbortController | null = null;

  private languageMap: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    node: 'nodejs',
    python: 'python',
    python3: 'python',
    rust: 'rust',
    go: 'go',
    java: 'java',
    csharp: 'csharp',
    cpp: 'cpp',
    c: 'c',
    php: 'php',
    ruby: 'ruby',
    kotlin: 'kotlin',
    swift: 'swift',
    dart: 'dart',
    r: 'r',
    julia: 'julia',
    bash: 'bash',
    haskell: 'haskell',
    elixir: 'elixir',
    erlang: 'erlang',
    ocaml: 'ocaml',
    fsharp: 'fsharp',
    fortran: 'fortran',
    cobol: 'cobol',
    assembly: 'assembly',
    zig: 'zig',
    nim: 'nim',
    v: 'v',
  };

  async execute(request: ExecutionRequest, onEvent: (event: ExecutionEvent) => void): Promise<void> {
    this.terminate();
    this.abortController = new AbortController();

    const language = this.languageMap[request.language.toLowerCase()] || request.language;
    
    onEvent(this.createEvent('status', `Connecting to remote sandbox for ${language}...`));

    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: this.abortController.signal,
        body: JSON.stringify({
          language,
          version: '*',
          files: [{ 
            name: this.getDefaultFilename(language), 
            content: request.code 
          }],
          stdin: request.stdin || '',
          compile_timeout: 10000,
          run_timeout: 30000,
        })
      });

      if (!response.ok) {
        throw new Error(`Remote sandbox returned HTTP ${response.status}`);
      }

      const res = await response.json();

      // Compile stage output
      if (res.compile) {
        if (res.compile.stdout) onEvent(this.createEvent('stdout', res.compile.stdout));
        if (res.compile.stderr) onEvent(this.createEvent('stderr', `\x1b[31m${res.compile.stderr}\x1b[0m`));
        if (res.compile.code !== 0) {
          onEvent(this.createEvent('stderr', `\x1b[31m[Compilation Failed with exit code ${res.compile.code}]\x1b[0m\r\n`));
          onEvent(this.createEvent('exit', res.compile.code));
          return;
        }
      }

      // Run stage output
      if (res.run) {
        if (res.run.stdout) onEvent(this.createEvent('stdout', res.run.stdout));
        if (res.run.stderr) onEvent(this.createEvent('stderr', `\x1b[31m${res.run.stderr}\x1b[0m`));
        
        // Include telemetry
        if (res.run.duration_ms || res.run.memory_kb) {
          const telemetry = [];
          if (res.run.duration_ms) telemetry.push(\`Time: \${res.run.duration_ms}ms\`);
          if (res.run.memory_kb) telemetry.push(\`Memory: \${res.run.memory_kb}KB\`);
          onEvent(this.createEvent('stdout', `\x1b[90m[\${telemetry.join(' | ')}]\x1b[0m\r\n`));
        }
        
        onEvent(this.createEvent('exit', res.run.code));
      } else {
        onEvent(this.createEvent('exit', 0));
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        onEvent(this.createEvent('stderr', '\r\n[Execution cancelled by user]\r\n'));
        onEvent(this.createEvent('exit', 130));
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        onEvent(this.createEvent('stderr', `\r\n\x1b[31m[Remote Execution Offline] No internet connection.\x1b[0m\r\n`));
        onEvent(this.createEvent('stderr', 'Editing and syntax checking only. Connect to internet to run.\r\n'));
        onEvent(this.createEvent('exit', 1));
      } else {
        onEvent(this.createEvent('stderr', `\r\n\x1b[31m[Remote Execution Error] \${err.message}\x1b[0m\r\n`));
        onEvent(this.createEvent('stderr', 'Check your internet connection or verify language availability.\r\n'));
        onEvent(this.createEvent('exit', 1));
      }
    }
  }

  private getDefaultFilename(language: string): string {
    const extensions: Record<string, string> = {
      javascript: 'main.js',
      typescript: 'main.ts',
      python: 'main.py',
      rust: 'main.rs',
      go: 'main.go',
      java: 'Main.java',
      csharp: 'Program.cs',
      cpp: 'main.cpp',
      c: 'main.c',
      php: 'main.php',
      ruby: 'main.rb',
      swift: 'main.swift',
      kotlin: 'Main.kt',
      dart: 'main.dart',
      r: 'main.r',
      julia: 'main.jl',
      bash: 'main.sh',
      haskell: 'Main.hs',
      zig: 'main.zig',
    };
    return extensions[language] || 'main.txt';
  }

  terminate(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  sendStdin(data: string): void {
    // Not supported for remote execution in this simple implementation
  }
}