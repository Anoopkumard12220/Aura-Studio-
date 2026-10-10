/// <reference lib="webworker" />

interface LintTask {
  id: string;
  type: 'lint';
  payload: {
    code: string;
    language: string;
  };
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, payload } = e.data as LintTask;

  if (type !== 'lint') {
    self.postMessage({ id, error: `Unknown task type: ${type}` });
    return;
  }

  try {
    const { code, language } = payload;
    const diagnostics: Array<{
      line: number;
      column: number;
      severity: 'error' | 'warning' | 'info';
      message: string;
      code?: string;
    }> = [];

    // Simple linting based on language
    if (language === 'typescript' || language === 'javascript' || language === 'tsx' || language === 'jsx') {
      const lines = code.split('\n');
      lines.forEach((line, index) => {
        // Check for console.log (warning)
        if (line.includes('console.log')) {
          diagnostics.push({
            line: index + 1,
            column: line.indexOf('console.log') + 1,
            severity: 'warning',
            message: 'Unexpected console.log statement',
            code: 'no-console',
          });
        }
        
        // Check for debugger (warning)
        if (line.includes('debugger')) {
          diagnostics.push({
            line: index + 1,
            column: line.indexOf('debugger') + 1,
            severity: 'warning',
            message: 'Unexpected debugger statement',
            code: 'no-debugger',
          });
        }

        // Check for eval (error)
        if (line.includes('eval(')) {
          diagnostics.push({
            line: index + 1,
            column: line.indexOf('eval(') + 1,
            severity: 'error',
            message: 'eval() is dangerous and should be avoided',
            code: 'no-eval',
          });
        }

        // Check for == instead of === (warning)
        if (/==(?!=)/.test(line) && !/===/.test(line)) {
          const match = line.match(/==(?!=)/);
          if (match) {
            diagnostics.push({
              line: index + 1,
              column: (match.index || 0) + 1,
              severity: 'warning',
              message: 'Expected === instead of ==',
              code: 'eqeqeq',
            });
          }
        }

        // Check for unused variables (simple check)
        const varMatch = line.match(/(const|let|var)\s+(\w+)\s*=/);
        if (varMatch) {
          const varName = varMatch[2];
          // Check if variable is used later in the code
          const usedLater = code.substring(code.indexOf(line) + line.length).includes(varName);
          if (!usedLater && !/^_/.test(varName)) {
            diagnostics.push({
              line: index + 1,
              column: line.indexOf(varName) + 1,
              severity: 'warning',
              message: `'${varName}' is assigned a value but never used`,
              code: 'no-unused-vars',
            });
          }
        }
      });
    }

    if (language === 'python') {
      const lines = code.split('\n');
      lines.forEach((line, index) => {
        // Check for print statements (info)
        if (line.trim().startsWith('print(')) {
          diagnostics.push({
            line: index + 1,
            column: line.indexOf('print(') + 1,
            severity: 'info',
            message: 'print() statement found - consider using logging',
            code: 'print-statement',
          });
        }
        
        // Check for bare except
        if (line.trim() === 'except:' || line.trim().startsWith('except ')) {
          if (!line.includes(' as ')) {
            diagnostics.push({
              line: index + 1,
              column: line.indexOf('except') + 1,
              severity: 'warning',
              message: 'Bare except clause - specify exception type',
              code: 'bare-except',
            });
          }
        }
      });
    }

    self.postMessage({ id, result: diagnostics });
  } catch (error: any) {
    self.postMessage({ id, error: error.message });
  }
};