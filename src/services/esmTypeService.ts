import { monaco } from '@/services/monacoWorkerSetup';

const ESM_SH_URL = 'https://esm.sh';
const TYPE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHED_TYPES = 50;

interface TypeDefinition {
  name: string;
  version: string;
  content: string;
  timestamp: number;
}

const typeCache = new Map<string, TypeDefinition>();

const COMMON_TYPE_STUBS: Record<string, string> = {
  react: `
declare module 'react' {
  export type FC<P = {}> = (props: P & { children?: ReactNode }) => ReactElement | null;
  export type ReactNode = ReactElement | string | number | boolean | null | undefined | ReactNode[];
  export type ReactElement = any;
  export type ComponentType<P = {}> = (props: P) => ReactElement | null;
  export function useState<S>(initialState: S | (() => S)): [S, (newState: S | ((prev: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useContext<T>(context: Context<T>): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useCallback<F extends Function>(callback: F, deps: any[]): F;
  export type Context<T> = any;
  export function createContext<T>(defaultValue: T): Context<T>;
}`,
  'react-dom': `
declare module 'react-dom' {
  export function render(element: any, container: Element | null): any;
  export function createRoot(container: Element): { render(element: any): void };
}`,
  lodash: `
declare module 'lodash' {
  export function map<T, U>(collection: T[], iteratee: (value: T) => U): U[];
  export function filter<T>(collection: T[], predicate: (value: T) => boolean): T[];
  export function reduce<T, U>(collection: T[], iteratee: (acc: U, value: T) => U, accumulator: U): U;
  export function find<T>(collection: T[], predicate: (value: T) => boolean): T | undefined;
  export function each<T>(collection: T[], iteratee: (value: T) => void): void;
  export function cloneDeep<T>(value: T): T;
  export function debounce<T extends Function>(func: T, wait: number): T;
  export function throttle<T extends Function>(func: T, wait: number): T;
}`,
  axios: `
declare module 'axios' {
  export interface AxiosRequestConfig { url?: string; method?: string; data?: any; params?: any; headers?: any; }
  export interface AxiosResponse<T = any> { data: T; status: number; statusText: string; headers: any; config: AxiosRequestConfig; }
  export interface AxiosError<T = any> extends Error { config: AxiosRequestConfig; code?: string; request?: any; response?: AxiosResponse<T>; isAxiosError: boolean; }
  export function request<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  export function get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  export function post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  export function put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  export function delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  export default { request, get, post, put, delete };
}`,
  express: `
declare module 'express' {
  export interface Request { params: any; query: any; body: any; headers: any; }
  export interface Response { json(body: any): this; send(body: any): this; status(code: number): this; }
  export interface NextFunction { (err?: any): void; }
  export interface RequestHandler { (req: Request, res: Response, next: NextFunction): any; }
  export interface Express { use(path: string, ...handlers: RequestHandler[]): this; get(path: string, ...handlers: RequestHandler[]): this; post(path: string, ...handlers: RequestHandler[]): this; listen(port: number, callback?: () => void): any; }
  export function express(): Express;
  export default express;
}`,
  typescript: `
declare module 'typescript' {
  export interface Node { kind: SyntaxKind; pos: number; end: number; }
  export interface SourceFile { fileName: string; text: string; }
  export enum SyntaxKind { Identifier = 65, StringLiteral = 8, NumericLiteral = 9 }
  export function createSourceFile(fileName: string, sourceText: string, target: ScriptTarget, setParentNodes?: boolean): SourceFile;
  export enum ScriptTarget { ES2020 = 7 }
}`,
};

export class EsmTypeService {
  static async fetchTypeDefinitions(
    packageName: string,
    version = 'latest'
  ): Promise<string | null> {
    const cacheKey = `${packageName}@${version}`;
    const cached = typeCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < TYPE_CACHE_TTL) {
      return cached.content;
    }

    // Check common stubs first
    const baseName = packageName.replace(/^@.*\//, '').replace(/\/.*/, '');
    if (COMMON_TYPE_STUBS[baseName]) {
      const stub = COMMON_TYPE_STUBS[baseName];
      typeCache.set(cacheKey, { name: packageName, version, content: stub, timestamp: Date.now() });
      return stub;
    }

    try {
      // Try to fetch from esm.sh
      const response = await fetch(`${ESM_SH_URL}/${packageName}@${version}/index.d.ts`);
      if (response.ok) {
        const content = await response.text();
        if (content && !content.includes('404')) {
          this.cacheTypeDefinition(packageName, version, content);
          return content;
        }
      }
    } catch {
      // Ignore fetch errors
    }

    // Try alternative paths
    const alternatives = [
      `${ESM_SH_URL}/${packageName}@${version}/types/index.d.ts`,
      `${ESM_SH_URL}/${packageName}@${version}/dist/index.d.ts`,
      `${ESM_SH_URL}/${packageName}@${version}/lib/index.d.ts`,
    ];

    for (const url of alternatives) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const content = await response.text();
          if (content && !content.includes('404')) {
            this.cacheTypeDefinition(packageName, version, content);
            return content;
          }
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  static cacheTypeDefinition(name: string, version: string, content: string): void {
    if (typeCache.size >= MAX_CACHED_TYPES) {
      const firstKey = typeCache.keys().next().value;
      if (firstKey) typeCache.delete(firstKey);
    }
    typeCache.set(`${name}@${version}`, { name, version, content, timestamp: Date.now() });
  }

  static async injectIntoMonaco(
    packageName: string,
    version = 'latest'
  ): Promise<boolean> {
    const types = await this.fetchTypeDefinitions(packageName, version);
    if (!types) return false;

    try {
      // Get monaco instance
      const monacoInstance = await this.getMonaco();
      if (!monacoInstance) return false;

      // Remove existing if any
      const libName = `npm:${packageName}@${version}`;
      try {
        monacoInstance.languages.typescript.javascriptDefaults.removeExtraLib(libName);
      } catch {}

      // Add new type definitions
      monacoInstance.languages.typescript.javascriptDefaults.addExtraLib(types, libName);
      monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(types, libName);

      return true;
    } catch (err) {
      console.warn('[EsmTypeService] Failed to inject types:', err);
      return false;
    }
  }

  static async injectMultiple(
    packages: Array<{ name: string; version?: string }>
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    await Promise.all(
      packages.map(async (pkg) => {
        const success = await this.injectIntoMonaco(pkg.name, pkg.version || 'latest');
        results.set(pkg.name, success);
      })
    );
    
    return results;
  }

  static async getMonaco(): Promise<any> {
    try {
      // Dynamic import to get monaco
      const { default: monaco } = await import('monaco-editor');
      return monaco;
    } catch {
      return null;
    }
  }

  static getCachedTypes(): Map<string, TypeDefinition> {
    return new Map(typeCache);
  }

  static clearCache(): void {
    typeCache.clear();
  }

  static async fetchPackageTypesFromNpm(
    packageName: string,
    version = 'latest'
  ): Promise<string | null> {
    // Fallback: try unpkg for type definitions
    try {
      const response = await fetch(`https://unpkg.com/${packageName}@${version}/index.d.ts`);
      if (response.ok) {
        const content = await response.text();
        this.cacheTypeDefinition(packageName, version, content);
        return content;
      }
    } catch {}
    return null;
  }
}