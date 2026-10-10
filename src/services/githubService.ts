import { db } from '@/db/database';
import { GitHubRepoInfo, GitHubFileTree, CachedApiResponse } from '@/types/apis';

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const MAX_FILES_PER_REPO = 100;

const cache = new Map<string, CachedApiResponse<any>>();

interface GitHubHeaders {
  Accept: string;
  Authorization?: string;
  'X-GitHub-Api-Version'?: string;
}

function getHeaders(token?: string): GitHubHeaders {
  const headers: GitHubHeaders = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers.Authorization = `token ${token}`;
  }
  return headers;
}

async function fetchWithCache<T>(url: string, cacheKey: string, token?: string): Promise<T> {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const headers = getHeaders(token);
  if (cached?.etag) {
    headers['If-None-Match'] = cached.etag;
  }

  const response = await fetch(url, { headers });
  
  if (response.status === 304 && cached) {
    cached.timestamp = Date.now();
    return cached.data;
  }
  
  if (!response.ok) {
    const error = new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    (error as any).status = response.status;
    (error as any).rateLimit = {
      limit: response.headers.get('X-RateLimit-Limit'),
      remaining: response.headers.get('X-RateLimit-Remaining'),
      reset: response.headers.get('X-RateLimit-Reset'),
    };
    throw error;
  }

  const data = await response.json();
  const etag = response.headers.get('ETag') || undefined;
  
  if (cache.size >= 50) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  
  cache.set(cacheKey, { data, timestamp: Date.now(), etag });
  return data;
}

export class GitHubService {
  static async searchRepositories(query: string, limit = 20): Promise<GitHubRepoInfo[]> {
    try {
      const url = `${GITHUB_API_URL}/search/repositories?q=${encodeURIComponent(query)}&per_page=${limit}&sort=stars&order=desc`;
      const data = await fetchWithCache<{ items: GitHubRepoInfo[] }>(url, `search:${query}:${limit}`);
      return data.items;
    } catch (err: any) {
      console.warn('[GitHubService] Search error:', err.message);
      return [];
    }
  }

  static async getRepository(owner: string, repo: string, token?: string): Promise<GitHubRepoInfo | null> {
    try {
      const url = `${GITHUB_API_URL}/repos/${owner}/${repo}`;
      const data = await fetchWithCache<GitHubRepoInfo>(url, `repo:${owner}/${repo}`, token);
      return data;
    } catch (err: any) {
      console.warn('[GitHubService] Get repo error:', err.message);
      return null;
    }
  }

  static async getFileTree(owner: string, repo: string, branch: string, token?: string): Promise<GitHubFileTree | null> {
    try {
      const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
      const data = await fetchWithCache<GitHubFileTree>(url, `tree:${owner}/${repo}/${branch}`, token);
      return data;
    } catch (err: any) {
      console.warn('[GitHubService] Get tree error:', err.message);
      return null;
    }
  }

  static async fetchFileContent(owner: string, repo: string, branch: string, path: string, token?: string): Promise<string | null> {
    try {
      const url = `${GITHUB_RAW_URL}/${owner}/${repo}/${branch}/${path}`;
      const headers = token ? { Authorization: `token ${token}` } : {};
      const response = await fetch(url, { headers });
      if (response.ok) return await response.text();
      return null;
    } catch {
      return null;
    }
  }

  static async cloneRepositoryToVfs(
    owner: string,
    repo: string,
    token?: string
  ): Promise<{ projectId: string; fileCount: number }> {
    // 1. Fetch repo metadata
    const repoInfo = await this.getRepository(owner, repo, token);
    if (!repoInfo) {
      throw new Error(`Failed to access GitHub repository: ${owner}/${repo}`);
    }

    const projectId = 'proj_gh_' + Math.random().toString(36).substring(2, 9);
    const now = Date.now();

    // 2. Create project entry
    await db.projects.put({
      id: projectId,
      name: repoInfo.name,
      description: repoInfo.description || `Cloned from ${owner}/${repo}`,
      templateType: 'github-clone',
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    });

    // 3. Fetch default branch tree
    const defaultBranch = repoInfo.default_branch || 'main';
    const treeData = await this.getFileTree(owner, repo, defaultBranch, token);
    if (!treeData) {
      throw new Error('Failed to fetch repository tree');
    }

    // 4. Batch download blobs (capped at MAX_FILES_PER_REPO)
    const blobsToFetch = treeData.tree
      .filter((node) => node.type === 'blob')
      .slice(0, MAX_FILES_PER_REPO);

    const dbFiles = [];

    for (const node of blobsToFetch) {
      const content = await this.fetchFileContent(owner, repo, defaultBranch, node.path, token);
      if (content !== null) {
        const parts = node.path.split('/');
        const name = parts.pop() || '';
        dbFiles.push({
          id: 'f_' + Math.random().toString(36).substring(2, 9),
          projectId,
          path: '/' + node.path,
          name,
          isDirectory: false,
          parentId: null,
          content,
          size: new Blob([content]).size,
          updatedAt: now,
        });
      }
    }

    if (dbFiles.length > 0) {
      await db.files.bulkPut(dbFiles);
    }

    return { projectId, fileCount: dbFiles.length };
  }

  static async createGist(
    files: Record<string, { content: string }>,
    description: string,
    token: string
  ): Promise<string | null> {
    try {
      const response = await fetch(`${GITHUB_API_URL}/gists`, {
        method: 'POST',
        headers: {
          ...getHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files, description, public: false }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.html_url;
      }
      return null;
    } catch {
      return null;
    }
  }

  static getRateLimitInfo(token?: string): Promise<{ limit: number; remaining: number; reset: number } | null> {
    return fetch(`${GITHUB_API_URL}/rate_limit`, { headers: getHeaders(token) })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);
  }

  static clearCache(): void {
    cache.clear();
  }
}

export class GitHubAuth {
  static validateToken(token: string): Promise<boolean> {
    return fetch(`${GITHUB_API_URL}/user`, { headers: getHeaders(token) })
      .then(r => r.ok)
      .catch(() => false);
  }

  static getUserInfo(token: string): Promise<{ login: string; name: string; avatar_url: string } | null> {
    return fetch(`${GITHUB_API_URL}/user`, { headers: getHeaders(token) })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);
  }
}