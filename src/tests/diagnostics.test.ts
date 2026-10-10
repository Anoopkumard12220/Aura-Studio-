import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ErrorParser } from '@/services/errorParser';
import { useDiagnosticsStore } from '@/stores/useDiagnosticsStore';

describe('ErrorParser', () => {
  it('should parse TypeScript errors', () => {
    const output = `src/App.tsx(10,5): error TS2322: Type 'string' is not assignable to type 'number'.
src/utils.ts(20,12): warning TS6133: 'unused' is declared but never used.`;
    
    const errors = ErrorParser.parse(output, 'typescript');
    
    expect(errors.length).toBe(2);
    expect(errors[0].severity).toBe('error');
    expect(errors[0].code).toBe('TS2322');
    expect(errors[0].line).toBe(10);
    expect(errors[0].column).toBe(5);
    expect(errors[0].filePath).toBe('src/App.tsx');
    
    expect(errors[1].severity).toBe('warning');
    expect(errors[1].code).toBe('TS6133');
  });

  it('should parse Python tracebacks', () => {
    const output = `Traceback (most recent call last):
  File "main.py", line 15, in <module>
    result = calculate()
  File "main.py", line 10, in calculate
    return 1 / 0
ZeroDivisionError: division by zero`;
    
    const errors = ErrorParser.parse(output, 'python');
    
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0].source).toBe('python');
    expect(errors[0].severity).toBe('error');
    expect(errors[0].message).toContain('ZeroDivisionError');
  });

  it('should parse Rust errors', () => {
    const output = `error[E0308]: mismatched types
 --> src/main.rs:10:5
  |
10 |     let x: i32 = "hello";
  |     ^^^^^^^^^^^^^^^^^^^^^ expected integer, found string
  |
  = note: expected type \`i32\`
         found type \`&str\``;
    
    const errors = ErrorParser.parse(output, 'rust');
    
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0].source).toBe('rust');
    expect(errors[0].severity).toBe('error');
    expect(errors[0].line).toBe(10);
  });

  it('should parse C++ errors', () => {
    const output = `main.cpp:15:10: error: expected ';' before '}' token
   15 |     return 0
      |          ^
main.cpp:20:5: warning: unused variable 'x' [-Wunused-variable]
   20 |     int x = 5;
      |     ^`;
    
    const errors = ErrorParser.parse(output, 'cpp');
    
    expect(errors.length).toBe(2);
    expect(errors[0].severity).toBe('error');
    expect(errors[0].line).toBe(15);
    expect(errors[1].severity).toBe('warning');
    expect(errors[1].line).toBe(20);
  });

  it('should format for Monaco markers', () => {
    const errors = [
      { message: 'Test error', line: 10, column: 5, severity: 'error' as const, code: 'TS2322', source: 'typescript' },
      { message: 'Test warning', line: 20, column: 10, severity: 'warning' as const, code: 'TS6133', source: 'typescript' },
    ];
    
    const markers = ErrorParser.formatForMonaco(errors);
    
    expect(markers.length).toBe(2);
    expect(markers[0].severity).toBe(8); // Error
    expect(markers[1].severity).toBe(4); // Warning
    expect(markers[0].startLineNumber).toBe(10);
    expect(markers[0].startColumn).toBe(5);
  });

  it('should parse preview console messages', () => {
    const msg = {
      type: 'PREVIEW_UNCAUGHT_ERROR',
      message: 'Uncaught TypeError: Cannot read property of undefined',
      source: 'http://localhost:5173/src/App.tsx',
      lineno: 25,
      colno: 10,
      stack: 'TypeError: Cannot read property...\n    at App (src/App.tsx:25)',
    };
    
    const parsed = ErrorParser.parsePreviewConsoleMessage(msg);
    
    expect(parsed).not.toBeNull();
    expect(parsed!.message).toContain('TypeError');
    expect(parsed!.line).toBe(25);
    expect(parsed!.column).toBe(10);
    expect(parsed!.filePath).toContain('App.tsx');
  });
});

describe('DiagnosticsStore', () => {
  beforeEach(() => {
    useDiagnosticsStore.getState().clearAll();
  });

  it('should add and retrieve diagnostics', () => {
    useDiagnosticsStore.getState().addDiagnostic({
      source: 'TypeScript',
      message: 'Type error',
      line: 10,
      severity: 'error',
    });

    const all = useDiagnosticsStore.getState().diagnostics;
    expect(all.length).toBe(1);
    expect(all[0].message).toBe('Type error');
    expect(all[0].id).toMatch(/^diag_/);
  });

  it('should filter by severity', () => {
    useDiagnosticsStore.getState().addDiagnostic({
      source: 'Test', message: 'Error', severity: 'error',
    });
    useDiagnosticsStore.getState().addDiagnostic({
      source: 'Test', message: 'Warning', severity: 'warning',
    });
    useDiagnosticsStore.getState().addDiagnostic({
      source: 'Test', message: 'Info', severity: 'info',
    });

    const errors = useDiagnosticsStore.getState().getBySeverity('error');
    const warnings = useDiagnosticsStore.getState().getBySeverity('warning');
    const infos = useDiagnosticsStore.getState().getBySeverity('info');

    expect(errors.length).toBe(1);
    expect(warnings.length).toBe(1);
    expect(infos.length).toBe(1);
  });

  it('should filter by source', () => {
    useDiagnosticsStore.getState().addDiagnostic({
      source: 'TypeScript', message: 'TS error', severity: 'error',
    });
    useDiagnosticsStore.getState().addDiagnostic({
      source: 'ESLint', message: 'Lint warning', severity: 'warning',
    });

    const ts = useDiagnosticsStore.getState().getBySource('TypeScript');
    const eslint = useDiagnosticsStore.getState().getBySource('ESLint');

    expect(ts.length).toBe(1);
    expect(eslint.length).toBe(1);
  });

  it('should clear diagnostics by source', () => {
    useDiagnosticsStore.getState().addDiagnostic({
      source: 'TypeScript', message: 'TS error', severity: 'error',
    });
    useDiagnosticsStore.getState().addDiagnostic({
      source: 'ESLint', message: 'Lint warning', severity: 'warning',
    });

    useDiagnosticsStore.getState().clearDiagnostics('TypeScript');
    
    const remaining = useDiagnosticsStore.getState().diagnostics;
    expect(remaining.length).toBe(1);
    expect(remaining[0].source).toBe('ESLint');
  });

  it('should clear all diagnostics', () => {
    useDiagnosticsStore.getState().addDiagnostic({
      source: 'Test', message: 'Error', severity: 'error',
    });
    
    useDiagnosticsStore.getState().clearAll();
    expect(useDiagnosticsStore.getState().diagnostics.length).toBe(0);
  });
});