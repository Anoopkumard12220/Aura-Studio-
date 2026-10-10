import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JsWorkerDriver } from '@/runtimes/drivers/JsWorkerDriver';

describe('JsWorkerDriver', () => {
  let driver: JsWorkerDriver;
  let events: any[] = [];

  beforeEach(() => {
    driver = new JsWorkerDriver();
    events = [];
  });

  afterEach(() => {
    driver.terminate();
  });

  const collectEvents = (event: any) => events.push(event);

  it('should have correct metadata', () => {
    expect(driver.id).toBe('js-worker');
    expect(driver.tier).toBe(1);
    expect(driver.offlineCapable).toBe(true);
    expect(driver.supportedLanguages).toContain('javascript');
    expect(driver.supportedLanguages).toContain('typescript');
  });

  it('should execute simple JavaScript and capture console.log', async () => {
    await driver.execute({
      code: 'console.log("Hello World");',
      language: 'javascript',
    }, collectEvents);

    expect(events.some(e => e.type === 'stdout' && e.data.includes('Hello World'))).toBe(true);
    expect(events.some(e => e.type === 'exit' && e.data === 0)).toBe(true);
  });

  it('should capture console.error as stderr', async () => {
    await driver.execute({
      code: 'console.error("Error message");',
      language: 'javascript',
    }, collectEvents);

    expect(events.some(e => e.type === 'stderr' && e.data.includes('Error message'))).toBe(true);
  });

  it('should transpile TypeScript to JavaScript', async () => {
    await driver.execute({
      code: 'const x: number = 42; console.log(x);',
      language: 'typescript',
    }, collectEvents);

    expect(events.some(e => e.type === 'stdout' && e.data.includes('42'))).toBe(true);
    expect(events.some(e => e.type === 'exit' && e.data === 0)).toBe(true);
  });

  it('should transpile JSX', async () => {
    await driver.execute({
      code: 'const element = <div>Hello</div>; console.log(element);',
      language: 'jsx',
    }, collectEvents);

    expect(events.some(e => e.type === 'exit' && e.data === 0)).toBe(true);
  });

  it('should handle runtime errors', async () => {
    await driver.execute({
      code: 'throw new Error("Test error");',
      language: 'javascript',
    }, collectEvents);

    expect(events.some(e => e.type === 'stderr' && e.data.includes('Test error'))).toBe(true);
    expect(events.some(e => e.type === 'exit' && e.data === 1)).toBe(true);
  });

  it('should handle syntax errors', async () => {
    await driver.execute({
      code: 'const x = ;', // Invalid syntax
      language: 'javascript',
    }, collectEvents);

    expect(events.some(e => e.type === 'stderr')).toBe(true);
    expect(events.some(e => e.type === 'exit' && e.data !== 0)).toBe(true);
  });

  it('should handle async code with Promises', async () => {
    await driver.execute({
      code: 'await new Promise(r => setTimeout(r, 10)); console.log("Done");',
      language: 'javascript',
    }, collectEvents);

    expect(events.some(e => e.type === 'stdout' && e.data.includes('Done'))).toBe(true);
    expect(events.some(e => e.type === 'exit' && e.data === 0)).toBe(true);
  });

  it('should terminate on watchdog timeout', async () => {
    const fastDriver = new JsWorkerDriver();
    const timeoutEvents: any[] = [];
    
    await fastDriver.execute({
      code: 'while(true) {}', // Infinite loop
      language: 'javascript',
      timeoutMs: 100, // Very short timeout
    }, (e) => timeoutEvents.push(e));

    // Wait for watchdog
    await new Promise(r => setTimeout(r, 200));

    expect(timeoutEvents.some(e => e.type === 'stderr' && e.data.includes('Watchdog Timeout'))).toBe(true);
    expect(timeoutEvents.some(e => e.type === 'exit' && e.data === 124)).toBe(true);
    
    fastDriver.terminate();
  });

  it('should support console.warn and console.info', async () => {
    await driver.execute({
      code: 'console.warn("Warning"); console.info("Info");',
      language: 'javascript',
    }, collectEvents);

    expect(events.some(e => e.type === 'stderr' && e.data.includes('Warning'))).toBe(true);
    expect(events.some(e => e.type === 'stdout' && e.data.includes('Info'))).toBe(true);
  });

  it('should handle object logging', async () => {
    await driver.execute({
      code: 'console.log({a: 1, b: {c: 2}});',
      language: 'javascript',
    }, collectEvents);

    expect(events.some(e => e.type === 'stdout' && e.data.includes('a') && e.data.includes('c'))).toBe(true);
  });
});