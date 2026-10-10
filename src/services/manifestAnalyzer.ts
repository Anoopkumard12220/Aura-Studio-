import { db, DBFile } from '@/db/database';

export interface ProjectManifest {
  projectId: string;
  name: string;
  templateType: string;
  language: string;
  runCommand: string;
  packageManager?: 'npm' | 'pip' | 'cargo' | 'make';
  dependencies: string[];
  devDependencies: string[];
  entryPoints: string[];
  scripts: Record<string, string>;
  hasTypeScript: boolean;
  hasPackageJson: boolean;
  fileCount: number;
  totalSize: number;
}

export class ManifestAnalyzer {
  static async analyzeProject(projectId: string): Promise<ProjectManifest | null> {
    const project = await db.projects.get(projectId);
    if (!project) return null;

    const files = await db.files.where('projectId').equals(projectId).toArray();
    
    const manifest: ProjectManifest = {
      projectId,
      name: project.name,
      templateType: project.templateType,
      language: 'Unknown',
      runCommand: '',
      dependencies: [],
      devDependencies: [],
      entryPoints: [],
      scripts: {},
      hasTypeScript: false,
      hasPackageJson: false,
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    };

    // Check for package.json
    const packageJsonFile = files.find(f => f.path === '/package.json' && !f.isDirectory);
    if (packageJsonFile && packageJsonFile.content) {
      manifest.hasPackageJson = true;
      manifest.packageManager = 'npm';
      try {
        const pkg = JSON.parse(packageJsonFile.content);
        manifest.dependencies = Object.keys(pkg.dependencies || {});
        manifest.devDependencies = Object.keys(pkg.devDependencies || {});
        manifest.scripts = pkg.scripts || {};
        manifest.runCommand = pkg.scripts?.dev || pkg.scripts?.start || 'npm run dev';
        
        if (pkg.devDependencies?.typescript || pkg.dependencies?.typescript) {
          manifest.hasTypeScript = true;
          manifest.language = 'TypeScript';
        } else {
          manifest.language = 'JavaScript';
        }
      } catch {}
    }

    // Check for Cargo.toml (Rust)
    const cargoFile = files.find(f => f.path === '/rust/Cargo.toml' || f.path === '/Cargo.toml');
    if (cargoFile && cargoFile.content) {
      manifest.packageManager = 'cargo';
      manifest.language = 'Rust';
      manifest.runCommand = 'cargo run';
    }

    // Check for requirements.txt (Python)
    const reqFile = files.find(f => f.path.endsWith('/requirements.txt'));
    if (reqFile && reqFile.content) {
      manifest.packageManager = 'pip';
      manifest.language = 'Python';
      manifest.runCommand = 'python main.py';
      manifest.dependencies = reqFile.content
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'))
        .map(l => l.split('>=')[0].split('==')[0].split('~=')[0].trim());
    }

    // Check for Makefile (C/C++)
    const makeFile = files.find(f => f.path.endsWith('/Makefile'));
    if (makeFile) {
      manifest.packageManager = 'make';
      if (manifest.language === 'Unknown') manifest.language = 'C/C++';
      manifest.runCommand = 'make && ./main';
    }

    // Check for tsconfig.json
    const tsconfigFile = files.find(f => f.path === '/tsconfig.json');
    if (tsconfigFile) {
      manifest.hasTypeScript = true;
    }

    // Find entry points
    const entryPatterns = [
      '/src/main.tsx', '/src/main.ts', '/src/main.js', '/src/index.ts', '/src/index.js',
      '/main.py', '/main.cpp', '/main.c', '/main.rs',
      '/src/App.tsx', '/src/App.jsx', '/src/App.tsx'
    ];
    
    for (const pattern of entryPatterns) {
      const found = files.find(f => f.path === pattern && !f.isDirectory);
      if (found) manifest.entryPoints.push(pattern);
    }

    // Infer language from file extensions if still unknown
    if (manifest.language === 'Unknown') {
      const extCounts = new Map<string, number>();
      for (const f of files) {
        if (!f.isDirectory && f.path.includes('.')) {
          const ext = f.path.split('.').pop()?.toLowerCase() || '';
          extCounts.set(ext, (extCounts.get(ext) || 0) + 1);
        }
      }
      
      const topExt = Array.from(extCounts.entries())
        .sort((a, b) => b[1] - a[1])[0];
      
      if (topExt) {
        const langMap: Record<string, string> = {
          ts: 'TypeScript', tsx: 'TypeScript',
          js: 'JavaScript', jsx: 'JavaScript',
          py: 'Python',
          rs: 'Rust',
          cpp: 'C++', cc: 'C++', cxx: 'C++', c: 'C', h: 'C',
          go: 'Go',
          java: 'Java',
          html: 'HTML', css: 'CSS'
        };
        manifest.language = langMap[topExt[0]] || topExt[0].toUpperCase();
      }
    }

    return manifest;
  }

  static async getAllManifests(): Promise<ProjectManifest[]> {
    const projects = await db.projects.toArray();
    const manifests: ProjectManifest[] = [];
    
    for (const project of projects) {
      const manifest = await this.analyzeProject(project.id);
      if (manifest) manifests.push(manifest);
    }
    
    return manifests.sort((a, b) => b.totalSize - a.totalSize);
  }

  static getLanguageFromTemplate(templateType: string): string {
    const langMap: Record<string, string> = {
      'react-vite-ts': 'TypeScript',
      'vanilla-ts': 'TypeScript',
      'python-data-science': 'Python',
      'cpp-algorithm': 'C++',
      'html5-canvas': 'JavaScript',
      'node-express-api': 'TypeScript',
      'polyglot-playground': 'Multi',
    };
    return langMap[templateType] || 'Unknown';
  }

  static getRunCommandFromTemplate(templateType: string): string {
    const cmdMap: Record<string, string> = {
      'react-vite-ts': 'npm run dev',
      'vanilla-ts': 'npx tsx src/main.ts',
      'python-data-science': 'python main.py',
      'cpp-algorithm': 'make && ./main',
      'html5-canvas': 'npx vite',
      'node-express-api': 'npm run dev',
      'polyglot-playground': 'See individual language folders',
    };
    return cmdMap[templateType] || '';
  }
}