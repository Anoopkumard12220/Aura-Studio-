import { db } from '@/db/database';
import { PreviewBridge } from './previewBridge';

export class VirtualPreviewServer {
  private static serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private static previewOrigin = 'aura-preview';

  static async initialize(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const swCode = this.generateServiceWorker();
        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        
        this.serviceWorkerRegistration = await navigator.serviceWorker.register(swUrl, {
          scope: '/_preview/',
        });
        
        console.log('[VirtualPreviewServer] Service Worker registered');
      } catch (err) {
        console.warn('[VirtualPreviewServer] Service Worker registration failed:', err);
      }
    }
  }

  static generateServiceWorker(): string {
    return `
      const PREVIEW_CACHE = 'aura-preview-v1';
      const FILE_PREFIX = '/_preview/';

      self.addEventListener('install', (event) => {
        self.skipWaiting();
      });

      self.addEventListener('activate', (event) => {
        event.waitUntil(self.clients.claim());
      });

      self.addEventListener('fetch', (event) => {
        const url = new URL(event.request.url);
        
        if (url.pathname.startsWith(FILE_PREFIX)) {
          const path = url.pathname.slice(FILE_PREFIX.length);
          event.respondWith(handlePreviewRequest(path));
        }
      });

      async function handlePreviewRequest(path) {
        try {
          // In real implementation, this would fetch from IndexedDB
          // For now, return a simple response
          if (path === '' || path === '/') {
            return new Response('Preview server ready', {
              headers: { 'Content-Type': 'text/html' }
            });
          }
          
          // Try to serve from cache
          const cache = await caches.open(PREVIEW_CACHE);
          const cached = await cache.match(event.request);
          if (cached) return cached;
          
          return new Response('Not found: ' + path, { status: 404 });
        } catch (err) {
          return new Response('Error: ' + err.message, { status: 500 });
        }
      }

      // Receive files from main thread
      self.addEventListener('message', (event) => {
        if (event.data.type === 'PREVIEW_FILES') {
          const { files } = event.data;
          const cache = caches.open(PREVIEW_CACHE);
          cache.then(c => {
            for (const [path, content] of Object.entries(files)) {
              const response = new Response(content, {
                headers: { 'Content-Type': getContentType(path) }
              });
              c.put(FILE_PREFIX + path, response);
            }
          });
        }
      });

      function getContentType(path) {
        if (path.endsWith('.html')) return 'text/html';
        if (path.endsWith('.css')) return 'text/css';
        if (path.endsWith('.js')) return 'application/javascript';
        if (path.endsWith('.json')) return 'application/json';
        if (path.endsWith('.wasm')) return 'application/wasm';
        if (path.match(/\\.(png|jpg|jpeg|gif|svg|ico)$/)) return 'image/' + path.split('.').pop();
        return 'application/octet-stream';
      }
    `;
  }

  static async serveProject(projectId: string): Promise<string> {
    // Get project files from IndexedDB
    const files = await db.files.where('projectId').equals(projectId).toArray();
    
    const fileMap: Record<string, string> = {};
    let entryPoint = 'index.html';
    
    for (const file of files) {
      if (!file.isDirectory && file.content) {
        const cleanPath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
        fileMap[cleanPath] = file.content;
        
        // Detect entry point
        if (cleanPath === 'index.html' || cleanPath.endsWith('/index.html')) {
          entryPoint = cleanPath;
        }
      }
    }

    // If using Service Worker, send files to it
    if (this.serviceWorkerRegistration?.active) {
      this.serviceWorkerRegistration.active.postMessage({
        type: 'PREVIEW_FILES',
        files: fileMap,
      });
    }

    // Return the preview URL
    return \`/_preview/\${entryPoint}\`;
  }

  static async createBlobURL(html: string): Promise<string> {
    const blob = new Blob([html], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }

  static async createPreviewIframeHTML(projectId: string, viewport?: { width: number; height: number }): Promise<string> {
    const files = await db.files.where('projectId').equals(projectId).toArray();
    
    let htmlContent = '';
    let cssContent = '';
    let jsContent = '';
    
    for (const file of files) {
      if (!file.isDirectory && file.content) {
        const ext = file.path.split('.').pop()?.toLowerCase();
        if (ext === 'html') htmlContent = file.content;
        else if (ext === 'css') cssContent += file.content + '\n';
        else if (ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx') jsContent += file.content + '\n';
      }
    }

    if (!htmlContent) {
      htmlContent = '<!DOCTYPE html><html><head><title>Preview</title></head><body><h1>No HTML file found</h1></body></html>';
    }

    // Inject CSS and JS into HTML
    let finalHTML = htmlContent;
    if (cssContent) {
      const styleTag = \`<style>\${cssContent}</style>\`;
      finalHTML = finalHTML.replace('</head>', styleTag + '</head>');
    }
    if (jsContent) {
      const scriptTag = \`<script>\${jsContent}</script>\`;
      finalHTML = finalHTML.replace('</body>', scriptTag + '</body>');
    }

    // Inject preview bridge
    finalHTML = PreviewBridge.createInstrumentedHTML(finalHTML);

    return finalHTML;
  }
}

export const virtualPreviewServer = VirtualPreviewServer;