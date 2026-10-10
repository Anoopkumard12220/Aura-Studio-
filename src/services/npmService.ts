import { NpmPackageResult, NpmPackageDetail, CachedApiResponse, ApiError } from '@/types/apis';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org';
const NPM_SEARCH_URL = 'https://registry.npmjs.org/-/v1/search';
const ESM_SH_URL = 'https://esm.sh';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

interface NpmSearchResponse {
  objects: Array<{
    package: {
      name: string;
      version: string;
      description: string;
      publisher?: { username: string };
      links: { npm: string; homepage?: string; repository?: string };
      score?: { final: number; detail: { quality: number; popularity: number; maintenance: number } };
    };
  }>;
  total: number;
}

interface NpmPackageResponse {
  name: string;
  version: string;
  description: string;
  readme?: string;
  keywords: string[];
  license: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  dist: { tarball: string; shasum: string; integrity: string };
  versions: Record<string, any>;
  time: Record<string, string>;
}

const cache = new Map<string, CachedApiResponse<any>>();

async function fetchWithCache<T>(url: string, cacheKey: string): Promise<T> {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (cached?.etag) {
    headers['If-None-Match'] = cached.etag;
  }

  const response = await fetch(url, { headers });
  
  if (response.status === 304 && cached) {
    cached.timestamp = Date.now();
    return cached.data;
  }
  
  if (!response.ok) {
    const error: ApiError = {
      code: 'FETCH_FAILED',
      message: `Request failed with status ${response.status}`,
      status: response.status,
      retryAfter: response.headers.get('Retry-After') ? parseInt(response.headers.get('Retry-After')!) : undefined,
    };
    throw error;
  }

  const data = await response.json();
  const etag = response.headers.get('ETag') || undefined;
  
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  
  cache.set(cacheKey, { data, timestamp: Date.now(), etag });
  return data;
}

export class NpmService {
  static async searchPackages(query: string, limit = 20): Promise<NpmPackageResult[]> {
    if (!query.trim()) return [];
    
    try {
      const url = `${NPM_SEARCH_URL}?text=${encodeURIComponent(query)}&size=${limit}`;
      const data = await fetchWithCache<NpmSearchResponse>(url, `search:${query}:${limit}`);
      
      return data.objects.map((obj) => ({
        name: obj.package.name,
        version: obj.package.version,
        description: obj.package.description || '',
        publisher: obj.package.publisher?.username,
        links: obj.package.links,
        score: obj.package.score,
      }));
    } catch (err: any) {
      console.warn('[NpmService] Search error:', err.message);
      return [];
    }
  }

  static async getPackageDetail(name: string): Promise<NpmPackageDetail | null> {
    try {
      const url = `${NPM_REGISTRY_URL}/${encodeURIComponent(name)}`;
      const data = await fetchWithCache<NpmPackageResponse>(url, `package:${name}`);
      return data;
    } catch (err: any) {
      console.warn('[NpmService] Package detail error:', err.message);
      return null;
    }
  }

  static async fetchPackageTypes(pkgName: string, version = 'latest'): Promise<string | null> {
    try {
      const url = `${ESM_SH_URL}/${pkgName}@${version}/index.d.ts`;
      const response = await fetch(url);
      if (response.ok) return await response.text();
      return null;
    } catch {
      return null;
    }
  }

  static async fetchPackageJson(pkgName: string, version = 'latest'): Promise<any | null> {
    try {
      const url = `${ESM_SH_URL}/${pkgName}@${version}/package.json`;
      const response = await fetch(url);
      if (response.ok) return await response.json();
      return null;
    } catch {
      return null;
    }
  }

  static async fetchModuleCode(pkgName: string, version = 'latest', target = 'es2022'): Promise<string | null> {
    try {
      const url = `${ESM_SH_URL}/${pkgName}@${version}?target=${target}`;
      const response = await fetch(url);
      if (response.ok) return await response.text();
      return null;
    } catch {
      return null;
    }
  }

  static async getPackageVersions(name: string): Promise<string[]> {
    try {
      const detail = await this.getPackageDetail(name);
      return detail ? Object.keys(detail.versions).reverse() : [];
    } catch {
      return [];
    }
  }

  static async getPopularPackages(limit = 50): Promise<NpmPackageResult[]> {
    try {
      const url = `${NPM_SEARCH_URL}?text=stars%3A%3E10000&size=${limit}&sort=popularity`;
      const data = await fetchWithCache<NpmSearchResponse>(url, `popular:${limit}`);
      return data.objects.map((obj) => ({
        name: obj.package.name,
        version: obj.package.version,
        description: obj.package.description || '',
        publisher: obj.package.publisher?.username,
        links: obj.package.links,
        score: obj.package.score,
      }));
    } catch {
      return [];
    }
  }

  static clearCache(): void {
    cache.clear();
  }

  static getCacheStats(): { size: number; keys: string[] } {
    return { size: cache.size, keys: Array.from(cache.keys()) };
  }
}

export class NpmPackageInstaller {
  static async installPackage(
    projectId: string,
    pkgName: string,
    version = 'latest',
    dev = false
  ): Promise<{ success: boolean; message: string }> {
    try {
      const pkg = await NpmService.getPackageDetail(pkgName);
      if (!pkg) {
        return { success: false, message: `Package ${pkgName} not found` };
      }

      const targetVersion = version === 'latest' ? pkg.version : version;
      const versions = Object.keys(pkg.versions);
      if (!versions.includes(targetVersion)) {
        return { success: false, message: `Version ${targetVersion} not found for ${pkgName}` };
      }

      // In a real implementation, this would update package.json in IndexedDB
      // and trigger a WebContainer/npm install
      console.log(`[NpmPackageInstaller] Would install ${pkgName}@${targetVersion} (dev: ${dev}) to project ${projectId}`);
      
      return { success: true, message: `Added ${pkgName}@${targetVersion}` };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  static async installTypes(pkgName: string, version = 'latest'): Promise<string | null> {
    return NpmService.fetchPackageTypes(pkgName, version);
  }
}