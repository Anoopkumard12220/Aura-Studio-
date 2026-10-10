export interface TerminalTab {
  id: string;
  title: string;
  isActive: boolean;
  process?: {
    pid: number;
    command: string;
    cwd: string;
  };
}

export interface TerminalState {
  tabs: TerminalTab[];
  activeTabId: string | null;
  fontSize: number;
  cursorBlink: boolean;
  theme: TerminalTheme;
}

export type TerminalTheme = 'aura-dark' | 'aura-light' | 'dracula' | 'nord' | 'github-dark';

export interface TerminalConfig {
  fontSize: number;
  fontFamily: string;
  cursorBlink: boolean;
  cursorStyle: 'block' | 'underline' | 'bar';
  scrollback: number;
  theme: TerminalTheme;
  bellStyle: 'none' | 'visual' | 'sound' | 'both';
}

export const DEFAULT_TERMINAL_CONFIG: TerminalConfig = {
  fontSize: 12,
  fontFamily: '"JetBrains Mono", Menlo, Consolas, monospace',
  cursorBlink: true,
  cursorStyle: 'block',
  scrollback: 10000,
  theme: 'aura-dark',
  bellStyle: 'visual',
};