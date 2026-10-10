export interface ParsedError {
  message: string;
  filePath?: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  code?: string;
  source: 'typescript' | 'javascript' | 'python' | 'rust' | 'cpp' | 'css' | 'html' | 'json' | 'unknown';
  stack?: string;
  originalLine?: string;
}

export class ErrorParser {
  private static typescriptErrorRegex = /^(.*?)\\((\\d+),(\\d+)\\):\\s*(error|warning)\\s+TS(\\d+):\\s*(.+)$/gm;
  private static javascriptErrorRegex = /^(.*):(\\d+):(\\d+)\\s*(.+)$/gm;
  private static pythonTracebackRegex = /File\\s+["']?([^"']+)["']?,\\s+line\\s+(\\d+)/g;
  private static rustErrorRegex = /^(.*?):(\\d+):(\\d+)\\s*(error|\\[WARN\\]):\\s*(.+)$/gm;
  private static cppErrorRegex = /^(.*?):(\\d+):(\\d+):\\s*(error|warning):\\s*(.+)$/gm;

  static parse(output: string, source?: string): ParsedError[] {
    const errors: ParsedError[] = [];

    if (!output || !output.trim()) return errors;

    // Try TypeScript/Javascript errors
    if (source === 'typescript' || source === 'javascript' || source === 'tsx' || source === 'jsx') {
      errors.push(...this.parseTypeScriptErrors(output));
    }

    // Try Python tracebacks
    if (source === 'python' || output.includes('Traceback (most recent call last)')) {
      errors.push(...this.parsePythonErrors(output));
    }

    // Try Rust errors
    if (source === 'rust' || output.includes('error[')) {
      errors.push(...this.parseRustErrors(output));
    }

    // Try C/C++ errors
    if (source === 'cpp' || source === 'c' || output.includes(': error:') || output.includes(': warning:')) {
      errors.push(...this.parseCppErrors(output));
    }

    // Fallback: generic line-based parsing
    if (errors.length === 0) {
      errors.push(...this.parseGenericErrors(output));
    }

    return errors;
  }

  private static parseTypeScriptErrors(output: string): ParsedError[] {
    const errors: ParsedError[] = [];
    const regex = /^(.*?)\((\d+),(\d+)\):\s*(error|warning)\s+(TS\d+):\s*(.+)$/gm;
    let match;

    while ((match = regex.exec(output)) !== null) {
      errors.push({
        message: match[6],
        filePath: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        severity: match[4] === 'error' ? 'error' : 'warning',
        code: match[5],
        source: 'typescript',
        originalLine: match[0],
      });
    }

    // Also handle plain JS runtime errors
    const jsRegex = /^(.*):(\d+):(\d+)\s*(.+)$/gm;
    while ((match = jsRegex.exec(output)) !== null) {
      if (!match[0].includes('TS') && !match[0].includes('warning') && !match[0].includes('error')) continue;
      errors.push({
        message: match[4],
        filePath: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        severity: 'error',
        source: 'javascript',
        originalLine: match[0],
      });
    }

    return errors;
  }

  private static parsePythonErrors(output: string): ParsedError[] {
    const errors: ParsedError[] = [];
    
    // Match traceback lines
    const tracebackRegex = /File\s+["']?([^"']+)["']?,\s+line\s+(\d+)/g;
    const lines = output.split('\n');
    let lastFile = '';
    let lastLine = 0;
    
    for (const line of lines) {
      const match = tracebackRegex.exec(line);
      if (match) {
        lastFile = match[1];
        lastLine = parseInt(match[2], 10);
      }
    }

    // Extract the actual error message (last line usually)
    const errorLine = lines[lines.length - 1];
    if (errorLine && (errorLine.includes('Error') || errorLine.includes('Exception'))) {
      errors.push({
        message: errorLine.trim(),
        filePath: lastFile,
        line: lastLine,
        severity: 'error',
        source: 'python',
        originalLine: errorLine,
      });
    }

    return errors;
  }

  private static parseRustErrors(output: string): ParsedError[] {
    const errors: ParsedError[] = [];
    const regex = /^(.*?):(\d+):(\d+)\s*(error|warning):\s*(.+)$/gm;
    let match;

    while ((match = regex.exec(output)) !== null) {
      errors.push({
        message: match[5],
        filePath: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        severity: match[4] === 'error' ? 'error' : 'warning',
        source: 'rust',
        originalLine: match[0],
      });
    }

    return errors;
  }

  private static parseCppErrors(output: string): ParsedError[] {
    const errors: ParsedError[] = [];
    const regex = /^(.*?):(\d+):(\d+):\s*(error|warning):\s*(.+)$/gm;
    let match;

    while ((match = regex.exec(output)) !== null) {
      errors.push({
        message: match[5],
        filePath: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        severity: match[4] === 'error' ? 'error' : 'warning',
        source: 'cpp',
        originalLine: match[0],
      });
    }

    return errors;
  }

  private static parseGenericErrors(output: string): ParsedError[] {
    const errors: ParsedError[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      // Look for common error patterns
      if (line.match(/error|Error|Exception|failed|FAILED/i) && !line.match(/^\\s*$/)) {
        errors.push({
          message: line.trim(),
          severity: 'error',
          source: 'unknown',
          originalLine: line,
        });
      } else if (line.match(/warning|Warning/i) && !line.match(/^\\s*$/)) {
        errors.push({
          message: line.trim(),
          severity: 'warning',
          source: 'unknown',
          originalLine: line,
        });
      }
    }

    return errors;
  }

  static parsePreviewConsoleMessage(msg: any): ParsedError | null {
    if (msg.type === 'PREVIEW_UNCAUGHT_ERROR') {
      return {
        message: msg.message,
        filePath: msg.source,
        line: msg.lineno,
        column: msg.colno,
        severity: 'error',
        source: 'javascript',
        stack: msg.stack,
      };
    }
    return null;
  }

  static formatForMonaco(errors: ParsedError[]): any[] {
    return errors.map(err => ({
      severity: err.severity === 'error' ? 8 : 4, // MarkerSeverity.Error : MarkerSeverity.Warning
      startLineNumber: err.line || 1,
      startColumn: err.column || 1,
      endLineNumber: err.line || 1,
      endColumn: (err.column || 1) + 1,
      message: err.message,
      code: err.code,
      source: err.source,
    }));
  }
}