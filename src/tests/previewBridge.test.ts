import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PreviewBridge } from '@/services/previewBridge';

describe('PreviewBridge', () => {
  let bridge: PreviewBridge;
  let events: any[] = [];

  beforeEach(() => {
    bridge = new PreviewBridge();
    events = [];
  });

  it('should have getInjectionScript method', () => {
    const script = PreviewBridge.getInjectionScript();
    expect(script).toContain('PREVIEW_CONSOLE');
    expect(script).toContain('PREVIEW_UNCAUGHT_ERROR');
    expect(script).toContain('console.log');
    expect(script).toContain('window.parent.postMessage');
  });

  it('should create instrumented HTML', () => {
    const baseHTML = '<html><head><title>Test</title></head><body>Hello</body></html>';
    const instrumented = PreviewBridge.createInstrumentedHTML(baseHTML);
    
    expect(instrumented).toContain('<script>');
    expect(instrumented).toContain('PREVIEW_CONSOLE');
    expect(instrumented).toContain('</head>');
  });

  it('should filter message events correctly', () => {
    const onMessage = vi.fn();
    bridge.connect(onMessage);
    
    // Simulate a valid console message
    const consoleMsg = {
      type: 'PREVIEW_CONSOLE',
      level: 'log',
      args: ['test'],
      timestamp: Date.now(),
    };
    
    window.dispatchEvent(new MessageEvent('message', { data: consoleMsg }));
    
    expect(onMessage).toHaveBeenCalledWith(consoleMsg);
    
    // Simulate an error message
    const errorMsg = {
      type: 'PREVIEW_UNCAUGHT_ERROR',
      message: 'Test error',
      lineno: 10,
      colno: 5,
    };
    
    window.dispatchEvent(new MessageEvent('message', { data: errorMsg }));
    
    expect(onMessage).toHaveBeenCalledWith(errorMsg);
    
    // Non-preview messages should be ignored
    const otherMsg = { type: 'OTHER', data: 'test' };
    window.dispatchEvent(new MessageEvent('message', { data: otherMsg }));
    
    // Should still only have 2 calls
    expect(onMessage).toHaveBeenCalledTimes(2);
    
    bridge.disconnect();
  });

  it('should disconnect listener', () => {
    const onMessage = vi.fn();
    bridge.connect(onMessage);
    bridge.disconnect();
    
    window.dispatchEvent(new MessageEvent('message', { 
      data: { type: 'PREVIEW_CONSOLE', level: 'log', args: [], timestamp: 0 } 
    }));
    
    expect(onMessage).not.toHaveBeenCalled();
  });
});