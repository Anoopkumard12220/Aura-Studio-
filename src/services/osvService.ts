import { OSVVulnerability, OSVQueryResult, CachedApiResponse } from '@/types/apis';

const OSV_API_URL = 'https://api.osv.dev/v1';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const cache = new Map<string, CachedApiResponse<any>>();

interface OSVQueryRequest {
  package: {
    name: string;
    ecosystem: string;
    purl?: string;
  };
  version?: string;
}

interface OSVBatchRequest {
  queries: OSVQueryRequest[];
}

async function fetchWithCache<T>(url: string, cacheKey: string, options?: RequestInit): Promise<T> {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = new Error(`OSV API error: ${response.status}`);
    (error as any).status = response.status;
    throw error;
  }

  const data = await response.json();
  
  if (cache.size >= 200) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

export class OSVService {
  static async queryVulnerabilities(
    packageName: string,
    ecosystem: 'npm' | 'pypi' | 'go' | 'maven' | 'cargo' | 'nuget' | 'rubygems' | 'crates.io',
    version?: string
  ): Promise<OSVVulnerability[]> {
    try {
      const cacheKey = `vuln:${ecosystem}:${packageName}@${version || 'latest'}`;
      
      const query: OSVQueryRequest = {
        package: {
          name: packageName,
          ecosystem,
        },
      };
      if (version) {
        query.version = version;
      }

      const data = await fetchWithCache<OSVQueryResult>(
        `${OSV_API_URL}/query`,
        cacheKey,
        { method: 'POST', body: JSON.stringify(query) }
      );
      
      return data.vulns || [];
    } catch (err: any) {
      console.warn('[OSVService] Query error:', err.message);
      return [];
    }
  }

  static async queryBatch(
    packages: Array<{ name: string; ecosystem: string; version?: string }>
  ): Promise<Map<string, OSVVulnerability[]>> {
    const results = new Map<string, OSVVulnerability[]>();
    
    // Batch in chunks of 50 (OSV limit)
    const chunks = [];
    for (let i = 0; i < packages.length; i += 50) {
      chunks.push(packages.slice(i, i + 50));
    }

    for (const chunk of chunks) {
      try {
        const queries: OSVQueryRequest[] = chunk.map(p => ({
          package: { name: p.name, ecosystem: p.ecosystem },
          version: p.version,
        }));

        const data = await fetchWithCache<{ results: OSVQueryResult[] }>(
          `${OSV_API_URL}/querybatch`,
          `batch:${JSON.stringify(chunk.map(p => `${p.ecosystem}:${p.name}@${p.version}`)).substring(0, 200)}`,
          { method: 'POST', body: JSON.stringify({ queries }) }
        );

        if (data.results) {
          chunk.forEach((pkg, idx) => {
            const key = `${pkg.ecosystem}:${pkg.name}@${pkg.version || 'latest'}`;
            results.set(key, data.results[idx]?.vulns || []);
          });
        }
      } catch (err: any) {
        console.warn('[OSVService] Batch query error:', err.message);
        chunk.forEach(pkg => {
          const key = `${pkg.ecosystem}:${pkg.name}@${pkg.version || 'latest'}`;
          results.set(key, []);
        });
      }
    }

    return results;
  }

  static async auditPackageJson(packageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }): Promise<Map<string, OSVVulnerability[]>> {
    const packages: Array<{ name: string; ecosystem: string; version: string }> = [];

    for (const [name, version] of Object.entries(packageJson.dependencies || {})) {
      packages.push({ name, ecosystem: 'npm', version: version.replace(/^[^0-9]*/, '') });
    }
    for (const [name, version] of Object.entries(packageJson.devDependencies || {})) {
      packages.push({ name, ecosystem: 'npm', version: version.replace(/^[^0-9]*/, '') });
    }

    return this.queryBatch(packages);
  }

  static getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-red-400';
      case 'moderate': return 'text-amber-400';
      case 'low': return 'text-yellow-400';
      default: return 'text-white/60';
    }
  }

  static getSeverityLabel(vuln: OSVVulnerability): string {
    if (vuln.severity && vuln.severity.length > 0) {
      return vuln.severity[0].score;
    }
    // Fallback: check database_specific
    if (vuln.affected[0]?.database_specific?.severity) {
      return vuln.affected[0].database_specific.severity;
    }
    return 'UNKNOWN';
  }

  static clearCache(): void {
    cache.clear();
  }
}