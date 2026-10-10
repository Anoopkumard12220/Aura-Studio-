export interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'img-src': string[];
  'frame-src': string[];
  'worker-src': string[];
  'object-src': string[];
  'base-uri': string[];
  'form-action': string[];
  'frame-ancestors': string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

export interface SecurityHeaders {
  'Cross-Origin-Opener-Policy': 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
  'Cross-Origin-Embedder-Policy': 'require-corp' | 'credentialless' | 'unsafe-none';
  'Cross-Origin-Resource-Policy': 'same-origin' | 'same-site' | 'cross-origin';
  'Content-Security-Policy': string;
  'Referrer-Policy': 'strict-origin-when-cross-origin' | 'no-referrer' | 'origin';
  'Permissions-Policy': string;
  'X-Content-Type-Options': 'nosniff';
  'X-Frame-Options': 'DENY' | 'SAMEORIGIN';
  'X-XSS-Protection': '1; mode=block';
}

export interface SanitizationResult {
  sanitized: string;
  removed: string[];
  warnings: string[];
}

export interface SecurityViolation {
  type: 'xss' | 'csp' | 'mixed-content' | 'unsafe-eval' | 'inline-script';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  source?: string;
  timestamp: number;
}

export interface SecretMetadata {
  key: string;
  description: string;
  addedAt: number;
  expiresAt?: number;
  scope: 'github' | 'npm' | 'custom';
}

export interface SecretStore {
  get(key: string): string | null;
  set(key: string, value: string, metadata?: Partial<SecretMetadata>): void;
  delete(key: string): boolean;
  clear(): void;
  keys(): string[];
}

export const CSP_POLICY: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-eval'", 'blob:', 'https://cdn.jsdelivr.net'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    'blob:',
    'https://registry.npmjs.org',
    'https://esm.sh',
    'https://api.github.com',
    'https://api.osv.dev',
    'https://emkc.org',
    'https://cdn.jsdelivr.net',
  ],
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  'frame-src': ["'self'", 'blob:'],
  'worker-src': ["'self'", 'blob:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': true,
  'block-all-mixed-content': true,
};

export function buildCSPHeader(directives: CSPDirectives): string {
  return Object.entries(directives)
    .map(([key, value]) => {
      if (typeof value === 'boolean') {
        return value ? key : '';
      }
      return `${key} ${value.join(' ')}`;
    })
    .filter(Boolean)
    .join('; ');
}

export const DEFAULT_SECURITY_HEADERS: SecurityHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'cross-origin',
  'Content-Security-Policy': buildCSPHeader(CSP_POLICY),
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

export const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /<iframe\b[^>]*>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^>]*>/gi,
  /<applet\b[^>]*>/gi,
  /<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?/gi,
];

export function sanitizeHTML(html: string): SanitizationResult {
  const removed: string[] = [];
  const warnings: string[] = [];
  let sanitized = html;

  for (const pattern of DANGEROUS_PATTERNS) {
    const matches = sanitized.match(pattern);
    if (matches) {
      removed.push(...matches);
      sanitized = sanitized.replace(pattern, '');
      warnings.push(`Removed ${matches.length} dangerous pattern(s): ${pattern.source}`);
    }
  }

  return { sanitized, removed, warnings };
}

export function sanitizeText(text: string): string {
  return text
    .replace(/[<>&"']/g, (char) => ({
      '<': '<',
      '>': '>',
      '&': '&',
      '"': '"',
      "'": ''',
    }[char] || char));
}

export class InMemorySecretStore implements SecretStore {
  private secrets = new Map<string, { value: string; metadata: SecretMetadata }>();

  get(key: string): string | null {
    const entry = this.secrets.get(key);
    if (!entry) return null;
    
    if (entry.metadata.expiresAt && Date.now() > entry.metadata.expiresAt) {
      this.secrets.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: string, metadata: Partial<SecretMetadata> = {}): void {
    this.secrets.set(key, {
      value,
      metadata: {
        key,
        description: metadata.description || '',
        addedAt: Date.now(),
        expiresAt: metadata.expiresAt,
        scope: metadata.scope || 'custom',
      },
    });
  }

  delete(key: string): boolean {
    return this.secrets.delete(key);
  }

  clear(): void {
    this.secrets.clear();
  }

  keys(): string[] {
    return Array.from(this.secrets.keys());
  }

  getMetadata(key: string): SecretMetadata | null {
    const entry = this.secrets.get(key);
    return entry?.metadata || null;
  }
}

export const secretStore = new InMemorySecretStore();