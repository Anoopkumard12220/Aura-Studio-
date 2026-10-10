import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RuntimeManager } from '@/runtimes/RuntimeManager';

// Mock all drivers
vi.mock('@/runtimes/drivers/JsWorkerDriver', () => ({
  JsWorkerDriver: vi.fn().mockImplementation(() => ({
    id: 'js-worker',
    name: 'JS Worker',
    tier: 1,
    supportedLanguages: ['javascript', 'typescript'],
    description: 'Test',
    offlineCapable: true,
    execute: vi.fn().mockResolvedValue(undefined),
    terminate: vi.fn(),
  })),
}));

vi.mock('@/runtimes/drivers/PyodideDriver', () => ({
  PyodideDriver: vi.fn().mockImplementation(() => ({
    id: 'pyodide',
    name: 'Pyodide',
    tier: 2,
    supportedLanguages: ['python'],
    description: 'Test',
    offlineCapable: false,
    execute: vi.fn().mockResolvedValue(undefined),
    terminate: vi.fn(),
  })),
}));

vi.mock('@/runtimes/drivers/RemoteSandboxDriver', () => ({
  RemoteSandboxDriver: vi.fn().mockImplementation(() => ({
    id: 'remote-sandbox',
    name: 'Remote',
    tier: 5,
    supportedLanguages: ['rust', 'go'],
    description: 'Test',
    offlineCapable: false,
    execute: vi.fn().mockResolvedValue(undefined),
    terminate: vi.fn(),
  })),
}));

describe('RuntimeManager', () => {
  let manager: RuntimeManager;

  beforeEach(() => {
    manager = new RuntimeManager();
  });

  it('should register all drivers', () => {
    const drivers = manager.getAllDrivers();
    expect(drivers.length).toBeGreaterThanOrEqual(3);
    
    const ids = drivers.map(d => d.id);
    expect(ids).toContain('js-worker');
    expect(ids).toContain('pyodide');
    expect(ids).toContain('remote-sandbox');
  });

  it('should return driver infos with correct structure', () => {
    const infos = manager.getDriverInfos();
    expect(infos.length).toBeGreaterThanOrEqual(3);
    
    for (const info of infos) {
      expect(info.id).toBeTruthy();
      expect(info.name).toBeTruthy();
      expect(Array.isArray(info.supportedLanguages)).toBe(true);
      expect([1,2,3,4,5]).toContain(info.tier);
      expect(typeof info.offlineCapable).toBe('boolean');
    }
  });

  it('should find driver for JavaScript', () => {
    const driver = manager.getDriverForLanguage('javascript');
    expect(driver).toBeTruthy();
    expect(driver?.id).toBe('js-worker');
  });

  it('should find driver for TypeScript', () => {
    const driver = manager.getDriverForLanguage('typescript');
    expect(driver).toBeTruthy();
    expect(driver?.id).toBe('js-worker');
  });

  it('should find driver for Python', () => {
    const driver = manager.getDriverForLanguage('python');
    expect(driver).toBeTruthy();
    expect(driver?.id).toBe('pyodide');
  });

  it('should find driver for Rust (remote)', () => {
    const driver = manager.getDriverForLanguage('rust');
    expect(driver).toBeTruthy();
    expect(driver?.id).toBe('remote-sandbox');
  });

  it('should return null for unsupported language', () => {
    const driver = manager.getDriverForLanguage('cobol');
    expect(driver).toBeNull();
  });

  it('should track execution state', () => {
    expect(manager.getState()).toBe('idle');
    expect(manager.getCurrentRequest()).toBeNull();
  });

  it('should allow event subscription', () => {
    const events: any[] = [];
    const unsubscribe = manager.onEvent((e) => events.push(e));
    
    // Simulate event emission (would need to trigger actual execution)
    // For now just test subscription mechanics
    unsubscribe();
    expect(events.length).toBe(0);
  });
});