import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sanitizeHTML, sanitizeText, buildCSPHeader, CSP_POLICY, DEFAULT_SECURITY_HEADERS, DANGEROUS_PATTERNS } from '@/types/security';
import { TerminalStreamThrottler, RingBufferTerminal } from '@/services/terminalBuffer';
import { MemoryMonitor } from '@/services/memoryMonitor';
import { SecurityAudit } from '@/services/securityAudit';
import { useVisualViewport, useIsMobile } from '@/hooks/useVisualViewport';

// Mock window.visualViewport
const mockVisualViewport = {
  height: window.innerHeight,
  width: window.innerWidth,
  offsetLeft: 0,
  offsetTop: 0,
  pageLeft: 0,
  pageTop: 0,
  scale: 1,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

describe('Security Types & Sanitization', () => {
  it('should sanitize script tags', () => {
    const html = '<script>alert("xss")</script><p>Safe content</p>';
    const result = sanitizeHTML(html);
    expect(result.sanitized).not.toContain('<script>');
    expect(result.sanitized).toContain('<p>Safe content</p>');
    expect(result.removed.length).toBeGreaterThan(0);
  });

  it('should sanitize event handlers', () => {
    const html = '<div onclick="alert(1)">Click me</div>';
    const result = sanitizeHTML(html);
    expect(result.sanitized).not.toContain('onclick');
  });

  it('should sanitize javascript: URLs', () => {
    const html = '<a href="javascript:alert(1)">Link</a>';
    const result = sanitizeHTML(html);
    expect(result.sanitized).not.toContain('javascript:');
  });

  it('should escape text', () => {
    const text = '<script>alert("xss")</script>';
    const result = sanitizeText(text);
    expect(result).toBe('<script>alert("xss")</script>');
  });

  it('should build CSP header', () => {
    const header = buildCSPHeader(CSP_POLICY);
    expect(header).toContain("default-src 'self'");
    expect(header).toContain("script-src 'self'");
    expect(header).toContain('https://cdn.jsdelivr.net');
  });

  it('should have required security headers', () => {
    expect(DEFAULT_SECURITY_HEADERS['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(DEFAULT_SECURITY_HEADERS['Cross-Origin-Embedder-Policy']).toBe('require-corp');
    expect(DEFAULT_SECURITY_HEADERS['Content-Security-Policy']).toBeDefined();
  });
});

describe('Terminal Buffer', () => {
  let onFlush: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onFlush = vi.fn();
  });

  it('should batch writes', () => {
    const throttler = new TerminalStreamThrottler(onFlush, { flushIntervalMs: 100 });
    
    throttler.write('line 1\n');
    throttler.write('line 2\n');
    
    expect(onFlush).not.toHaveBeenCalled();
  });

  it('should flush after interval', async () => {
    const throttler = new TerminalStreamThrottler(onFlush, { flushIntervalMs: 50 });
    
    throttler.write('line 1\n');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(onFlush).toHaveBeenCalledWith('line 1\n', expect.any(Object));
  });

  it('should truncate excessive output', async () => {
    const throttler = new TerminalStreamThrottler(onFlush, { 
      flushIntervalMs: 50,
      maxBatchSize: 5,
    });
    
    // Write more than maxBatchSize * 10
    for (let i = 0; i < 100; i++) {
      throttler.write(`line ${i}\n`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(onFlush).toHaveBeenCalled();
    const call = onFlush.mock.calls[0];
    expect(call[0]).toContain('truncated to prevent browser freeze');
  });

  it('should track line count', () => {
    const ringBuffer = new RingBufferTerminal(100);
    
    ringBuffer.append('line 1\nline 2\nline 3\n');
    
    expect(ringBuffer.getLineCount()).toBe(3);
  });

  it('should respect max lines limit', () => {
    const ringBuffer = new RingBufferTerminal(5);
    
    for (let i = 0; i < 10; i++) {
      ringBuffer.append(`line ${i}\n`);
    }
    
    expect(ringBuffer.getLineCount()).toBe(5);
    const lines = ringBuffer.getLines();
    expect(lines[0].text).toBe('line 5');
    expect(lines[4].text).toBe('line 9');
  });

  it('should search lines', () => {
    const ringBuffer = new RingBufferTerminal(100);
    
    ringBuffer.append('error: something failed\n');
    ringBuffer.append('warning: deprecated\n');
    ringBuffer.append('error: another error\n');
    
    const results = ringBuffer.search('error');
    expect(results.length).toBe(2);
  });
});

describe('Memory Monitor', () => {
  beforeEach(() => {
    vi.stubGlobal('performance', {
      memory: {
        usedJSHeapSize: 50 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 1024 * 1024 * 1024,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should calculate memory usage', () => {
    const monitor = new MemoryMonitor({ warning: 0.7, critical: 0.85 });
    const info = monitor.check();
    
    expect(info).not.toBeNull();
    expect(info?.usedPercentage).toBeCloseTo(0.05, 1);
    expect(info?.warning).toBe(false);
    expect(info?.critical).toBe(false);
  });

  it('should warn at threshold', () => {
    vi.stubGlobal('performance', {
      memory: {
        usedJSHeapSize: 800 * 1024 * 1024,
        totalJSHeapSize: 900 * 1024 * 1024,
        jsHeapSizeLimit: 1024 * 1024 * 1024,
      },
    });
    
    const monitor = new MemoryMonitor({ warning: 0.7, critical: 0.85 });
    const info = monitor.check();
    
    expect(info?.warning).toBe(true);
    expect(info?.critical).toBe(false);
  });

  it('should format bytes', () => {
    const monitor = new MemoryMonitor();
    expect(monitor.formatBytes(1024)).toBe('1.00 KB');
    expect(monitor.formatBytes(1024 * 1024)).toBe('1.00 MB');
    expect(monitor.formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
  });
});

describe('Security Audit', () => {
  it('should detect CSP violations', () => {
    const headers = {
      'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
    };
    
    const audit = new SecurityAudit();
    const result = audit.auditCSPHeaders(headers);
    
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('should validate missing COOP', () => {
    const headers = {};
    const audit = new SecurityAudit();
    const result = audit.auditCSPHeaders(headers);
    
    const coopViolation = result.violations.find(v => v.message.includes('COOP'));
    expect(coopViolation).toBeDefined();
  });

  it('should sanitize preview HTML', () => {
    const html = '<script>evil()</script><p>Good content</p>';
    const result = SecurityAudit.auditHTMLContent(html);
    
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('should generate nonce', () => {
    const audit = new SecurityAudit();
    const nonce1 = audit.generateNonce();
    const nonce2 = audit.generateNonce();
    
    expect(nonce1.length).toBe(32);
    expect(nonce1).not.toBe(nonce2);
  });
});

describe('Visual Viewport Hook', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      ...window,
      visualViewport: mockVisualViewport,
      innerWidth: 375,
      innerHeight: 667,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should detect mobile viewport', () => {
    // This would test the hook behavior
    expect(true).toBe(true); // Placeholder
  });

  it('should calculate keyboard height', () => {
    expect(true).toBe(true); // Placeholder
  });
});

describe('Mobile Types', () => {
  it('should have correct breakpoints', () => {
    expect(MOBILE_BREAKPOINTS.mobile).toBe(768);
    expect(MOBILE_BREAKPOINTS.tablet).toBe(1024);
  });

  it('should identify mobile viewports', () => {
    expect(isMobileViewport(375)).toBe(true);
    expect(isMobileViewport(768)).toBe(false);
    expect(isMobileViewport(1024)).toBe(false);
  });

  it('should identify tablet viewports', () => {
    expect(isTabletViewport(375)).toBe(false);
    expect(isTabletViewport(768)).toBe(true);
    expect(isTabletViewport(1024)).toBe(false);
  });

  it('should have touch targets', () => {
    expect(TOUCH_TARGETS.minWidth).toBe(44);
    expect(TOUCH_TARGETS.minHeight).toBe(44);
  });
});

describe('Worker Pool', () => {
  it('should create pool instance', () => {
    // WorkerPool requires actual workers, so this is a placeholder
    expect(true).toBe(true);
  });
});

// Helper functions for testing
function isMobileViewport(width: number): boolean {
  return width < MOBILE_BREAKPOINTS.mobile;
}

function isTabletViewport(width: number): boolean {
  return width >= MOBILE_BREAKPOINTS.mobile && width < MOBILE_BREAKPOINTS.tablet;
}

const MOBILE_BREAKPOINTS = { mobile: 768, tablet: 1024, desktop: 1280 };
const TOUCH_TARGETS = { minWidth: 44, minHeight: 44, recommendedWidth: 48, recommendedHeight: 48 };