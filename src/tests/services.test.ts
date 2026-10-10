import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NpmService } from '@/services/npmService';
import { GitHubService } from '@/services/githubService';
import { OSVService } from '@/services/osvService';
import { EsmTypeService } from '@/services/esmTypeService';
import { parseKeyBinding, matchKeyBinding, formatKeyBinding, DEFAULT_KEYBINDINGS } from '@/types/shortcuts';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('npmService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should parse npm search response correctly', async () => {
    const mockResponse = {
      objects: [{
        package: {
          name: 'lodash',
          version: '4.17.21',
          description: 'Lodash modular utilities.',
          publisher: { username: 'jdalton' },
          links: { npm: 'https://npmjs.com/package/lodash', homepage: 'https://lodash.com', repository: 'https://github.com/lodash/lodash' },
          score: { final: 0.95, detail: { quality: 0.9, popularity: 0.98, maintenance: 0.85 } }
        }
      }],
      total: 1
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
      headers: { get: () => null }
    });

    const results = await NpmService.searchPackages('lodash', 10);
    
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('lodash');
    expect(results[0].version).toBe('4.17.21');
    expect(results[0].publisher).toBe('jdalton');
    expect(results[0].score?.detail.quality).toBe(0.9);
  });

  it('should handle empty query', async () => {
    const results = await NpmService.searchPackages('', 10);
    expect(results).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle fetch error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    const results = await NpmService.searchPackages('test', 10);
    expect(results).toEqual([]);
  });

  it('should fetch package types from esm.sh', async () => {
    const mockTypes = 'declare module "lodash" { export function map<T, U>(arr: T[], fn: (v: T) => U): U[]; }';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => mockTypes
    });

    const types = await NpmService.fetchPackageTypes('lodash', 'latest');
    expect(types).toContain('declare module "lodash"');
  });
});

describe('githubService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should parse repository search response', async () => {
    const mockResponse = {
      items: [{
        id: 123,
        name: 'test-repo',
        full_name: 'user/test-repo',
        description: 'Test repository',
        html_url: 'https://github.com/user/test-repo',
        clone_url: 'https://github.com/user/test-repo.git',
        default_branch: 'main',
        stargazers_count: 100,
        forks_count: 20,
        language: 'TypeScript',
        topics: ['typescript', 'testing'],
        updated_at: '2024-01-01T00:00:00Z'
      }]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
      headers: { get: () => null }
    });

    const results = await GitHubService.searchRepositories('test', 10);
    
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('test-repo');
    expect(results[0].language).toBe('TypeScript');
  });

  it('should handle rate limit headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
      headers: {
        get: (name: string) => {
          if (name === 'X-RateLimit-Limit') return '5000';
          if (name === 'X-RateLimit-Remaining') return '4999';
          if (name === 'X-RateLimit-Reset') return '1234567890';
          return null;
        }
      }
    });

    const results = await GitHubService.searchRepositories('test', 10);
    expect(results).toEqual([]);
  });
});

describe('osvService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should parse vulnerability response', async () => {
    const mockResponse = {
      vulns: [{
        id: 'GHSA-test-1234',
        summary: 'Prototype pollution in lodash',
        details: 'lodash is vulnerable to prototype pollution...',
        aliases: ['CVE-2021-1234'],
        modified: '2024-01-01T00:00:00Z',
        published: '2024-01-01T00:00:00Z',
        withdrawn: null,
        affected: [{
          package: { name: 'lodash', ecosystem: 'npm', purl: 'pkg:npm/lodash' },
          ranges: [{ type: 'ECOSYSTEM', events: [{ introduced: '0', fixed: '4.17.21' }] }],
          versions: ['4.17.20'],
          database_specific: { severity: 'HIGH' }
        }],
        references: [{ type: 'WEB', url: 'https://github.com/advisories/GHSA-test-1234' }],
        severity: [{ type: 'CVSS_V3', score: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' }]
      }]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const vulns = await OSVService.queryVulnerabilities('lodash', 'npm', '4.17.20');
    
    expect(vulns).toHaveLength(1);
    expect(vulns[0].id).toBe('GHSA-test-1234');
    expect(OSVService.getSeverityLabel(vulns[0])).toBe('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H');
  });

  it('should handle batch query', async () => {
    const mockResponse = {
      results: [
        { vulns: [{ id: 'GHSA-1', summary: 'Vuln 1', details: '', aliases: [], modified: '', published: '', withdrawn: null, affected: [], references: [], severity: [] }] },
        { vulns: [] }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const results = await OSVService.queryBatch([
      { name: 'lodash', ecosystem: 'npm', version: '4.17.20' },
      { name: 'react', ecosystem: 'npm', version: '18.0.0' }
    ]);

    expect(results.size).toBe(2);
    expect(results.get('npm:lodash@4.17.20')).toHaveLength(1);
    expect(results.get('npm:react@18.0.0')).toHaveLength(0);
  });
});

describe('shortcuts', () => {
  describe('parseKeyBinding', () => {
    it('should parse simple key', () => {
      const result = parseKeyBinding('k');
      expect(result.key).toBe('K');
      expect(result.modifiers).toEqual({ ctrlKey: false, metaKey: false, shiftKey: false, altKey: false });
    });

    it('should parse Ctrl+K', () => {
      const result = parseKeyBinding('ctrl+k');
      expect(result.key).toBe('K');
      expect(result.modifiers.ctrlKey).toBe(true);
    });

    it('should parse Cmd+Shift+P', () => {
      const result = parseKeyBinding('cmd+shift+p');
      expect(result.key).toBe('P');
      expect(result.modifiers.metaKey).toBe(true);
      expect(result.modifiers.shiftKey).toBe(true);
    });

    it('should parse Alt+F4', () => {
      const result = parseKeyBinding('alt+f4');
      expect(result.key).toBe('F4');
      expect(result.modifiers.altKey).toBe(true);
    });
  });

  describe('matchKeyBinding', () => {
    it('should match exact key and modifiers', () => {
      const event = new KeyboardEvent('keydown', { key: 'K', ctrlKey: true });
      const binding = { key: 'K', modifiers: { ctrlKey: true, metaKey: false, shiftKey: false, altKey: false } };
      expect(matchKeyBinding(event, binding)).toBe(true);
    });

    it('should not match different key', () => {
      const event = new KeyboardEvent('keydown', { key: 'K', ctrlKey: true });
      const binding = { key: 'P', modifiers: { ctrlKey: true, metaKey: false, shiftKey: false, altKey: false } };
      expect(matchKeyBinding(event, binding)).toBe(false);
    });

    it('should not match missing modifier', () => {
      const event = new KeyboardEvent('keydown', { key: 'K' });
      const binding = { key: 'K', modifiers: { ctrlKey: true, metaKey: false, shiftKey: false, altKey: false } };
      expect(matchKeyBinding(event, binding)).toBe(false);
    });
  });

  describe('formatKeyBinding', () => {
    it('should format Mac shortcut', () => {
      const binding = { key: 'K', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false } };
      expect(formatKeyBinding(binding, true)).toBe('⌘K');
    });

    it('should format Windows shortcut', () => {
      const binding = { key: 'K', modifiers: { ctrlKey: true, metaKey: false, shiftKey: false, altKey: false } };
      expect(formatKeyBinding(binding, false)).toBe('Ctrl+K');
    });

    it('should format complex Mac shortcut', () => {
      const binding = { key: 'P', modifiers: { ctrlKey: false, metaKey: true, shiftKey: true, altKey: false } };
      expect(formatKeyBinding(binding, true)).toBe('⌘⇧P');
    });
  });

  describe('DEFAULT_KEYBINDINGS', () => {
    it('should have essential bindings', () => {
      const actions = DEFAULT_KEYBINDINGS.map(b => b.action);
      expect(actions).toContain('file.new');
      expect(actions).toContain('nav.commandPalette');
      expect(actions).toContain('runtime.run');
      expect(actions).toContain('edit.find');
    });

    it('should have unique actions', () => {
      const actions = DEFAULT_KEYBINDINGS.map(b => b.action);
      const unique = new Set(actions);
      expect(unique.size).toBe(actions.length);
    });
  });
});

describe('EsmTypeService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should return common type stubs', async () => {
    const types = await EsmTypeService.fetchTypeDefinitions('react', 'latest');
    expect(types).toContain('declare module');
    expect(types).toContain('useState');
  });

  it('should fetch from esm.sh when not in stubs', async () => {
    const mockTypes = 'declare module "custom-package" { export function foo(): string; }';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => mockTypes
    });

    const types = await EsmTypeService.fetchTypeDefinitions('custom-package', 'latest');
    expect(types).toContain('custom-package');
  });
});