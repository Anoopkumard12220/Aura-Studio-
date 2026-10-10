import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PyodideDriver } from '@/runtimes/drivers/PyodideDriver';

describe('PyodideDriver', () => {
  let driver: PyodideDriver;
  let events: any[] = [];

  beforeEach(() => {
    driver = new PyodideDriver();
    events = [];
  });

  afterEach(() => {
    driver.terminate();
  });

  const collectEvents = (event: any) => events.push(event);

  it('should have correct metadata', () => {
    expect(driver.id).toBe('pyodide');
    expect(driver.tier).toBe(2);
    expect(driver.offlineCapable).toBe(false);
    expect(driver.supportedLanguages).toContain('python');
    expect(driver.supportedLanguages).toContain('py');
  });

  it('should execute simple Python code', async () => {
    await driver.execute({
      code: 'print("Hello from Python")',
      language: 'python',
    }, collectEvents);

    // Note: This test requires network for Pyodide CDN
    // In CI, we'd mock the worker or use a local Pyodide build
  });

  it('should handle Python syntax errors', async () => {
    await driver.execute({
      code: 'print("Missing paren"', // Syntax error
      language: 'python',
    }, collectEvents);

    // Would capture stderr with syntax error
  });

  it('should extract imports for package installation', () => {
    const code = `
import numpy as np
import pandas
from matplotlib import pyplot
import os
import sys
`;
    const imports = driver['extractImports'](code);
    expect(imports).toContain('numpy');
    expect(imports).toContain('pandas');
    expect(imports).toContain('matplotlib');
    // stdlib modules should be filtered out
    expect(imports).not.toContain('os');
    expect(imports).not.toContain('sys');
  });

  it('should support stdin', () => {
    driver.sendStdin('test input\n');
    // Would send to worker
  });
});