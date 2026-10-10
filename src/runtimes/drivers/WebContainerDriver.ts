import { BaseDriver } from './BaseDriver';
import { ExecutionRequest, ExecutionEvent } from '@/types/runtime';

export class WebContainerDriver extends BaseDriver {
  id = 'webcontainer';
  name = 'WebContainer Node.js (In-Browser OS)';
  tier = 3 as const;
  supportedLanguages = ['javascript', 'typescript', 'node', 'bash', 'sh'];
  description = 'Full in-browser Node.js environment with npm, file system, and network via WebContainers API';
  offlineCapable = true;

  private containerInstance: any = null;
  private currentProcess: any = null;

  async initContainer(): Promise<any> {
    if (!this.containerInstance) {
      const { WebContainer } = await import('@webcontainer/api');
      this.containerInstance = await WebContainer.boot();
    }
    return this.containerInstance;
  }

  async execute(request: ExecutionRequest, onEvent: (event: ExecutionEvent) => void): Promise<void> {
    this.terminate();
    onEvent(this.createEvent('status', 'Booting in-browser Node.js WebContainer...'));

    try {
      const container = await this.initContainer();

      // Mount virtual project files
      if (request.files && Object.keys(request.files).length > 0) {
        const fileTree: Record<string, any> = {};
        for (const [path, content] of Object.entries(request.files)) {
          const clean = path.startsWith('/') ? path.slice(1) : path;
          fileTree[clean] = { file: { contents: content } };
        }
        await container.mount(fileTree);
        onEvent(this.createEvent('status', \`Mounted \${Object.keys(request.files).length} project files...\`));
      }

      // Determine command to run
      const { cmd, args } = this.parseCommand(request);

      onEvent(this.createEvent('status', \`Running: \${cmd} \${args.join(' ')}\`));

      this.currentProcess = await container.spawn(cmd, args, {
        cwd: request.files ? '/' : undefined,
      });

      // Stream stdout
      const stdoutDecoder = new TextDecoder();
      this.currentProcess.output.pipeTo(new WritableStream({
        write(chunk) {
          const text = stdoutDecoder.decode(chunk, { stream: true });
          onEvent({ type: 'stdout', data: text });
        }
      }));

      // Stream stderr
      const stderrDecoder = new TextDecoder();
      this.currentProcess.output.pipeTo(new WritableStream({
        write(chunk) {
          const text = stderrDecoder.decode(chunk, { stream: true });
          onEvent({ type: 'stderr', data: '\x1b[31m' + text + '\x1b[0m' });
        }
      }));

      const exitCode = await this.currentProcess.exit;
      onEvent(this.createEvent('exit', exitCode));
    } catch (err: any) {
      onEvent(this.createEvent('stderr', `\x1b[31m[WebContainer Error] \${err.message}\x1b[0m\r\n`));
      onEvent(this.createEvent('exit', 1));
    }
  }

  private parseCommand(request: ExecutionRequest): { cmd: string; args: string[] } {
    const entryPoint = request.entryPoint;
    
    if (entryPoint) {
      // Check if it's a package.json script
      if (request.files?.['/package.json'] || request.files?.['package.json']) {
        try {
          const pkgContent = request.files['/package.json'] || request.files['package.json'];
          const pkg = JSON.parse(pkgContent);
          if (pkg.scripts?.[entryPoint]) {
            return { cmd: 'npm', args: ['run', entryPoint] };
          }
        } catch {}
      }
      
      // Direct file execution
      if (entryPoint.endsWith('.ts') || entryPoint.endsWith('.tsx')) {
        return { cmd: 'npx', args: ['tsx', entryPoint] };
      }
      if (entryPoint.endsWith('.js') || entryPoint.endsWith('.jsx')) {
        return { cmd: 'node', args: [entryPoint] };
      }
      if (entryPoint.endsWith('.py')) {
        return { cmd: 'python', args: [entryPoint] };
      }
      if (entryPoint.endsWith('.sh')) {
        return { cmd: 'bash', args: [entryPoint] };
      }
      
      return { cmd: entryPoint, args: [] };
    }

    // Default: run code inline
    return { cmd: 'node', args: ['-e', request.code] };
  }

  terminate(): void {
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = null;
    }
  }

  async sendStdin(data: string): Promise<void> {
    if (this.currentProcess && this.currentProcess.stdin) {
      const writer = this.currentProcess.stdin.getWriter();
      await writer.write(new TextEncoder().encode(data));
      await writer.releaseLock();
    }
  }
}