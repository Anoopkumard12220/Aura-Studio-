export interface ExecutionRequest {
  code: string;
  language: string;
  files?: Record<string, string>;
  entryPoint?: string;
  stdin?: string;
  timeoutMs?: number;
  projectId?: string;
}

export interface ExecutionEvent {
  type: 'stdout' | 'stderr' | 'exit' | 'error' | 'status' | 'stdin';
  data: string | number;
  metadata?: Record<string, any>;
}

export interface DriverInfo {
  id: string;
  name: string;
  supportedLanguages: string[];
  tier: 1 | 2 | 3 | 4 | 5;
  description: string;
  offlineCapable: boolean;
}

export type ExecutionState = 'idle' | 'initializing' | 'compiling' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ExecutionResult {
  state: ExecutionState;
  exitCode?: number;
  durationMs?: number;
  stdout: string;
  stderr: string;
  error?: string;
}

export interface TerminalInstance {
  id: string;
  name: string;
  shell: string;
  cwd: string;
  pid?: number;
}