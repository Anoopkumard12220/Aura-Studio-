import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RemoteSandboxDriver } from '@/runtimes/drivers/RemoteSandboxDriver';

describe('RemoteSandboxDriver', () => {
  let driver: RemoteSandboxDriver;
  let events: any[] = [];

  beforeEach(() => {
    driver = new RemoteSandboxDriver();
    events = [];
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    driver.terminate();
    vi.unstubAllGlobals();
  });

  const collectEvents = (event: any) => events.push(event);

  it('should have correct metadata', () => {
    expect(driver.id).toBe('remote-sandbox');
    expect(driver.tier).toBe(5);
    expect(driver.offlineCapable).toBe(false);
    expect(driver.supportedLanguages).toContain('rust');
    expect(driver.supportedLanguages).toContain('go');
    expect(driver.supportedLanguages).toContain('java');
    expect(driver.supportedLanguages).toContain('python');
    expect(driver.supportedLanguages).toContain('cpp');
  });

  it('should map language aliases correctly', () => {
    const map = driver['languageMap'];
    expect(map.javascript).toBe('javascript');
    expect(map.typescript).toBe('typescript');
    expect(map.node).toBe('nodejs');
    expect(map.python).toBe('python');
    expect(map.rust).toBe('rust');
    expect(map.go).toBe('go');
    expect(map.java).toBe('java');
    expect(map.csharp).toBe('csharp');
    expect(map.cpp).toBe('cpp');
  });

  it('should handle successful execution with compile and run stages', async () => {
    const mockResponse = {
      compile: { stdout: '', stderr: '', code: 0 },
      run: { stdout: 'Hello, World!\n', stderr: '', code: 0, duration_ms: 45, memory_kb: 1024 },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    await driver.execute({
      code: 'fn main() { println!("Hello, World!"); }',
      language: 'rust',
    }, collectEvents);

    expect(events.some(e => e.type === 'stdout' && e.data.includes('Hello, World!'))).toBe(true);
    expect(events.some(e => e.type === 'exit' && e.data === 0)).toBe(true);
    expect(events.some(e => e.type === 'stdout' && e.data.includes('Time: 45ms'))).toBe(true);
  });

  it('should handle compilation errors', async () => {
    const mockResponse = {
      compile: { stdout: '', stderr: 'error: expected `;`', code: 1 },
      run: null,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    await driver.execute({
      code: 'fn main() { println!("missing semicolon") }',
      language: 'rust',
    }, collectEvents);

    expect(events.some(e => e.type === 'stderr' && e.data.includes('expected')).toBe(true));
    expect(events.some(e => e.type === 'exit' && e.data === 1)).toBe(true);
  });

  it('should handle network errors gracefully', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Failed to fetch'));

    await driver.execute({
      code: 'print("test")',
      language: 'python',
    }, collectEvents);

    expect(events.some(e => e.type === 'stderr' && e.data.includes('Remote Execution Offline'))).toBe(true);
    expect(events.some(e => e.type === 'stderr' && e.data.includes('Connect to internet'))).toBe(true);
    expect(events.some(e => e.type === 'exit' && e.data === 1)).toBe(true);
  });

  it('should handle abort/cancellation', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    vi.mocked(fetch).mockRejectedValueOnce(abortError);

    await driver.execute({
      code: 'while(true) {}',
      language: 'rust',
    }, collectEvents);

    expect(events.some(e => e.type === 'stderr' && e.data.includes('cancelled by user'))).toBe(true);
    expect(events.some(e => e.type === 'exit' && e.data === 130)).toBe(true);
  });

  it('should get default filename for language', () => {
    const getFilename = driver['getDefaultFilename'];
    expect(getFilename('rust')).toBe('main.rs');
    expect(getFilename('python')).toBe('main.py');
    expect(getFilename('go')).toBe('main.go');
    expect(getFilename('java')).toBe('Main.java');
    expect(getFilename('cpp')).toBe('main.cpp');
    expect(getFilename('javascript')).toBe('main.js');
    expect(getFilename('unknown')).toBe('main.txt');
  });
});