import { SecurityViolation, sanitizeHTML, buildCSPHeader, CSP_POLICY, DEFAULT_SECURITY_HEADERS } from '@/types/security';

export class SecurityAudit {
  private violations: SecurityViolation[] = [];
  private listeners: Array<(violation: SecurityViolation) => void> = [];

  constructor() {
    this.setupCSPReportListener();
  }

  private setupCSPReportListener(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('securitypolicyviolation', (e) => {
      const violation: SecurityViolation = {
        type: 'csp',
        severity: this.categorizeSeverity(e),
        message: `CSP violation: ${e.violatedDirective} blocked ${e.blockedURI}`,
        source: e.sourceFile,
        timestamp: Date.now(),
      };

      this.recordViolation(violation);
    });
  }

  private categorizeSeverity(e: SecurityPolicyViolationEvent): SecurityViolation['severity'] {
    if (e.violatedDirective.includes('script-src')) return 'high';
    if (e.violatedDirective.includes('frame-src')) return 'medium';
    if (e.violatedDirective.includes('connect-src')) return 'medium';
    return 'low';
  }

  recordViolation(violation: SecurityViolation): void {
    this.violations.push(violation);
    if (this.violations.length > 100) {
      this.violations.shift();
    }
    this.notifyListeners(violation);
  }

  private notifyListeners(violation: SecurityViolation): void {
    this.listeners.forEach(listener => {
      try {
        listener(violation);
      } catch (err) {
        console.error('[SecurityAudit] Listener error:', err);
      }
    });
  }

  subscribe(listener: (violation: SecurityViolation) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  getViolations(): SecurityViolation[] {
    return [...this.violations];
  }

  clearViolations(): void {
    this.violations = [];
  }

  sanitizePreviewHTML(html: string): { sanitized: string; warnings: string[] } {
    const result = sanitizeHTML(html);
    result.warnings.forEach(w => {
      this.recordViolation({
        type: 'xss',
        severity: 'medium',
        message: w,
        timestamp: Date.now(),
      });
    });
    return { sanitized: result.sanitized, warnings: result.warnings };
  }

  getCSPHeader(): string {
    return buildCSPHeader(CSP_POLICY);
  }

  getAllHeaders(): Record<string, string> {
    return DEFAULT_SECURITY_HEADERS as Record<string, string>;
  }

  validateOrigin(origin: string, allowedOrigins: string[]): boolean {
    try {
      const url = new URL(origin);
      return allowedOrigins.some(allowed => {
        if (allowed === '*') return true;
        const allowedUrl = new URL(allowed);
        return url.origin === allowedUrl.origin;
      });
    } catch {
      return false;
    }
  }

  generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const securityAudit = new SecurityAudit();

export function auditPreviewContent(html: string): string {
  const { sanitized } = securityAudit.sanitizePreviewHTML(html);
  return sanitized;
}

export function injectCSPMetaTag(): void {
  if (typeof document === 'undefined') return;

  const existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existing) existing.remove();

  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = securityAudit.getCSPHeader();
  document.head.appendChild(meta);
}