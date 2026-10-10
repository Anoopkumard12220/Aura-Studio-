export interface NpmPackageResult {
  name: string;
  version: string;
  description: string;
  publisher?: string;
  links: {
    npm: string;
    homepage?: string;
    repository?: string;
  };
  score?: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
}

export interface NpmPackageDetail {
  name: string;
  version: string;
  description: string;
  readme?: string;
  keywords: string[];
  license: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  dist: {
    tarball: string;
    shasum: string;
    integrity: string;
  };
  versions: string[];
  time: Record<string, string>;
}

export interface EsmModuleResult {
  code: string;
  map?: any;
  types?: string;
}

export interface GitHubRepoInfo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  updated_at: string;
}

export interface GitHubFileTree {
  sha: string;
  tree: Array<{
    path: string;
    mode: string;
    type: 'blob' | 'tree';
    sha: string;
    size?: number;
  }>;
  truncated: boolean;
}

export interface OSVVulnerability {
  id: string;
  summary: string;
  details: string;
  aliases: string[];
  modified: string;
  published: string;
  withdrawn: string | null;
  affected: Array<{
    package: {
      name: string;
      ecosystem: string;
      purl: string;
    };
    ranges: Array<{
      type: string;
      events: Array<{
        introduced?: string;
        fixed?: string;
        last_affected?: string;
      }>;
    }>;
    versions: string[];
    database_specific: {
      severity: string;
    };
  }>;
  references: Array<{
    type: string;
    url: string;
  }>;
  severity: Array<{
    type: string;
    score: string;
  }>;
}

export interface OSVQueryResult {
  vulns: OSVVulnerability[];
}

export interface DevDocsEntry {
  name: string;
  slug: string;
  version: string;
  description: string;
  tags: string[];
  path: string;
}

export interface ApiRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  retryAfter?: number;
}

export interface CachedApiResponse<T> {
  data: T;
  timestamp: number;
  etag?: string;
}