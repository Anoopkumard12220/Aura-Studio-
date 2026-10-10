import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { CanvasAddon } from '@xterm/addon-canvas';
import { SearchAddon } from '@xterm/addon-search';
import '@xterm/xterm/css/xterm.css';
import { clsx } from 'clsx';
import { TerminalConfig } from '@/types/terminal';

interface XtermTerminalProps {
  config?: Partial<TerminalConfig>;
  onInput?: (data: string) => void;
  onReady?: (term: Terminal) => void;
  className?: string;
}

export const XtermTerminal = forwardRef<HTMLDivElement, XtermTerminalProps>(
  ({ config, onInput, onReady, className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const termInstance = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    const mergedConfig: TerminalConfig = {
      fontSize: 12,
      fontFamily: '"JetBrains Mono", Menlo, Consolas, monospace',
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      theme: 'aura-dark',
      bellStyle: 'visual',
      ...config,
    };

    useImperativeHandle(ref, () => ({
      getTerminal: () => termInstance.current,
      write: (data: string) => termInstance.current?.write(data),
      writeln: (data: string) => termInstance.current?.writeln(data),
      clear: () => termInstance.current?.clear(),
      reset: () => termInstance.current?.reset(),
      focus: () => termInstance.current?.focus(),
      setConfig: (newConfig: Partial<TerminalConfig>) => {
        if (termInstance.current) {
          Object.assign(mergedConfig, newConfig);
          applyConfig(termInstance.current, mergedConfig);
        }
      },
    }));

    const applyConfig = (term: Terminal, cfg: TerminalConfig) => {
      term.options.fontSize = cfg.fontSize;
      term.options.fontFamily = cfg.fontFamily;
      term.options.cursorBlink = cfg.cursorBlink;
      term.options.cursorStyle = cfg.cursorStyle;
      term.options.scrollback = cfg.scrollback;
      
      if (cfg.theme === 'aura-dark') {
        term.options.theme = {
          background: '#111217',
          foreground: '#e6edf3',
          cursor: '#6366f1',
          cursorAccent: '#111217',
          selectionBackground: 'rgba(99, 102, 241, 0.3)',
          black: '#1e222d',
          red: '#f43f5e',
          green: '#10b981',
          yellow: '#f59e0b',
          blue: '#38bdf8',
          magenta: '#c084fc',
          cyan: '#06b6d4',
          white: '#f0f6fc',
          brightBlack: '#545d68',
          brightRed: '#f87171',
          brightGreen: '#34d399',
          brightYellow: '#fbbf24',
          brightBlue: '#60a5fa',
          brightMagenta: '#d8b4fe',
          brightCyan: '#22d3ee',
          brightWhite: '#f8fafc',
        };
      }
    };

    useEffect(() => {
      if (!containerRef.current) return;

      const term = new Terminal({
        cursorBlink: mergedConfig.cursorBlink,
        fontFamily: mergedConfig.fontFamily,
        fontSize: mergedConfig.fontSize,
        lineHeight: 1.4,
        scrollback: mergedConfig.scrollback,
        cursorStyle: mergedConfig.cursorStyle,
        allowProposedApi: true,
        convertEol: true,
        screenKeys: true,
      });

      applyConfig(term, mergedConfig);

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      fitAddonRef.current = fitAddon;

      // Try WebGL, fallback to Canvas, fallback to DOM
      try {
        term.loadAddon(new WebglAddon());
      } catch {
        try {
          term.loadAddon(new CanvasAddon());
        } catch {}
      }

      // Search addon
      const searchAddon = new SearchAddon();
      term.loadAddon(searchAddon);

      term.open(containerRef.current);
      fitAddon.fit();

      // Welcome message
      term.writeln('\x1b[1;36mAura Studio Interactive Shell v1.0.0\x1b[0m');
      term.writeln('\x1b[90mType code or execute project files directly.\x1b[0m\r\n');

      if (onInput) {
        term.onData(onInput);
      }

      termInstance.current = term;
      if (onReady) onReady(term);

      // Resize observer
      resizeObserverRef.current = new ResizeObserver(() => {
        try { fitAddon.fit(); } catch {}
      });
      resizeObserverRef.current.observe(containerRef.current);

      return () => {
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
        }
        term.dispose();
      };
    }, []);

    // Expose fit method for external calls
    const fit = () => {
      try { fitAddonRef.current?.fit(); } catch {}
    };

    // Expose focus method
    const focus = () => {
      termInstance.current?.focus();
    };

    // Handle external focus requests
    useEffect(() => {
      const handleFocus = () => focus();
      document.addEventListener('terminal-focus', handleFocus);
      return () => document.removeEventListener('terminal-focus', handleFocus);
    }, []);

    return (
      <div
        ref={containerRef}
        className={clsx('w-full h-full bg-[#111217]', className)}
        style={{ minHeight: '100%' }}
      />
    );
  }
);

XtermTerminal.displayName = 'XtermTerminal';