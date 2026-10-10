import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TEMPLATES, getTemplateById } from '@/templates';
import { TemplateScaffolder } from '@/services/templateScaffolder';

// Mock Dexie database
vi.mock('@/db/database', () => ({
  db: {
    projects: {
      put: vi.fn().mockResolvedValue(undefined),
      get: vi.fn(),
      toArray: vi.fn().mockResolvedValue([]),
    },
    files: {
      bulkPut: vi.fn().mockResolvedValue(undefined),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn().mockResolvedValue([]),
        })),
      })),
    },
  },
}));

describe('Template Registry', () => {
  it('should have all 7 core templates', () => {
    expect(TEMPLATES.length).toBe(7);
  });

  it('should have unique template IDs', () => {
    const ids = TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have required fields for each template', () => {
    for (const template of TEMPLATES) {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.category).toBeTruthy();
      expect(template.language).toBeTruthy();
      expect(template.iconName).toBeTruthy();
      expect(template.badge).toBeTruthy();
      expect(template.defaultRunCommand).toBeTruthy();
      expect(Array.isArray(template.files)).toBe(true);
      expect(template.files.length).toBeGreaterThan(0);
    }
  });

  it('should have package.json in React template', () => {
    const reactTemplate = getTemplateById('react-vite-ts');
    expect(reactTemplate).toBeDefined();
    const pkgFile = reactTemplate!.files.find(f => f.path === '/package.json');
    expect(pkgFile).toBeDefined();
    expect(pkgFile!.content).toContain('react');
    expect(pkgFile!.content).toContain('vite');
  });

  it('should have main.py in Python template', () => {
    const pyTemplate = getTemplateById('python-data-science');
    expect(pyTemplate).toBeDefined();
    const mainFile = pyTemplate!.files.find(f => f.path === '/main.py');
    expect(mainFile).toBeDefined();
    expect(mainFile!.content).toContain('numpy');
  });

  it('should have main.cpp and Makefile in C++ template', () => {
    const cppTemplate = getTemplateById('cpp-algorithm');
    expect(cppTemplate).toBeDefined();
    const mainFile = cppTemplate!.files.find(f => f.path === '/main.cpp');
    const makeFile = cppTemplate!.files.find(f => f.path === '/Makefile');
    expect(mainFile).toBeDefined();
    expect(makeFile).toBeDefined();
    expect(mainFile!.content).toContain('#include');
  });

  it('should have package.json in Node.js template', () => {
    const nodeTemplate = getTemplateById('node-express-api');
    expect(nodeTemplate).toBeDefined();
    const pkgFile = nodeTemplate!.files.find(f => f.path === '/package.json');
    expect(pkgFile).toBeDefined();
    expect(pkgFile!.content).toContain('express');
  });

  it('should have multiple language folders in Polyglot template', () => {
    const polyTemplate = getTemplateById('polyglot-playground');
    expect(polyTemplate).toBeDefined();
    const paths = polyTemplate!.files.map(f => f.path);
    expect(paths.some(p => p.startsWith('/python/'))).toBe(true);
    expect(paths.some(p => p.startsWith('/typescript/'))).toBe(true);
    expect(paths.some(p => p.startsWith('/c/'))).toBe(true);
    expect(paths.some(p => p.startsWith('/rust/'))).toBe(true);
  });

  it('should categorize templates correctly', () => {
    const categories = ['frontend', 'backend', 'systems', 'datascience', 'polyglot'];
    for (const cat of categories) {
      const templates = TEMPLATES.filter(t => t.category === cat);
      expect(templates.length).toBeGreaterThan(0);
    }
  });
});

describe('TemplateScaffolder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should scaffold project with correct project metadata', async () => {
    const template = getTemplateById('react-vite-ts')!;
    const projectId = await TemplateScaffolder.scaffoldProject('test-project', template);
    
    expect(projectId).toMatch(/^proj_[a-z0-9]+$/);
    
    // Check that db.projects.put was called
    const { db } = await import('@/db/database');
    expect(db.projects.put).toHaveBeenCalledWith(
      expect.objectContaining({
        id: projectId,
        name: 'test-project',
        templateType: 'react-vite-ts',
      })
    );
  });

  it('should scaffold project with all template files', async () => {
    const template = getTemplateById('vanilla-ts')!;
    const projectId = await TemplateScaffolder.scaffoldProject('test-project', template);
    
    const { db } = await import('@/db/database');
    expect(db.files.bulkPut).toHaveBeenCalled();
    
    const filesArg = vi.mocked(db.files.bulkPut).mock.calls[0][0];
    expect(filesArg.length).toBe(template.files.length);
    
    // Check file structure
    for (const file of filesArg) {
      expect(file.projectId).toBe(projectId);
      expect(file.id).toMatch(/^f_[a-z0-9]+$/);
      expect(file.path).toBeTruthy();
      expect(file.name).toBeTruthy();
      expect(typeof file.isDirectory).toBe('boolean');
    }
  });

  it('should compute parent IDs correctly for nested paths', async () => {
    const template = getTemplateById('react-vite-ts')!;
    await TemplateScaffolder.scaffoldProject('test-project', template);
    
    const { db } = await import('@/db/database');
    const filesArg = vi.mocked(db.files.bulkPut).mock.calls[0][0];
    
    // Find src/App.tsx and check its parent is src/
    const appFile = filesArg.find(f => f.path === '/src/App.tsx');
    const srcDir = filesArg.find(f => f.path === '/src/');
    
    if (appFile && srcDir) {
      expect(appFile.parentId).toBe(srcDir.id);
    }
  });

  it('should handle files without content (directories)', async () => {
    const template = getTemplateById('react-vite-ts')!;
    await TemplateScaffolder.scaffoldProject('test-project', template);
    
    const { db } = await import('@/db/database');
    const filesArg = vi.mocked(db.files.bulkPut).mock.calls[0][0];
    
    const dirs = filesArg.filter(f => f.isDirectory);
    for (const dir of dirs) {
      expect(dir.content).toBeUndefined();
      expect(dir.size).toBe(0);
    }
  });
});

describe('ManifestAnalyzer', () => {
  it('should export analyzeProject function', async () => {
    const { ManifestAnalyzer } = await import('@/services/manifestAnalyzer');
    expect(typeof ManifestAnalyzer.analyzeProject).toBe('function');
  });
});