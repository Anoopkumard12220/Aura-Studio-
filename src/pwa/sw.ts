/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkOnly, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// Clean up outdated caches
cleanupOutdatedCaches();

// Precache Vite build assets
precacheAndRoute(self.__WB_MANIFEST || []);

// Navigation route for SPA fallback
const navigationRoute = new NavigationRoute(
  ({ event }) => {
    const url = new URL(event.request.url);
    // Exclude API routes
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_preview/')) {
      return null;
    }
    return precacheAndRoute([{ url: '/index.html' }]);
  },
  { allowlist: [/^\/$/] }
);

registerRoute(navigationRoute);

// ============================================
// Caching Strategies
// ============================================

// 1. Cache-First for Monaco Editor language chunks and WASM binaries
registerRoute(
  ({ url }) => 
    url.origin === location.origin && 
    (url.pathname.includes('/monaco-editor/') || 
     url.pathname.includes('.wasm') ||
     url.pathname.includes('.js') && url.pathname.includes('/vs/language/')),
  new CacheFirst({
    cacheName: 'monaco-editor-runtime',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// 2. Cache-First for Pyodide WASM binaries & Python standard library wheels
registerRoute(
  ({ url }) => url.origin === 'https://cdn.jsdelivr.net' && url.pathname.includes('/pyodide/'),
  new CacheFirst({
    cacheName: 'pyodide-runtime-v0.25',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 80,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// 3. Cache-First for WebContainer WASM binaries
registerRoute(
  ({ url }) => url.origin === 'https://cdn.jsdelivr.net' && url.pathname.includes('/@webcontainer/'),
  new CacheFirst({
    cacheName: 'webcontainer-runtime',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 40,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// 4. Cache-First for Clang WASM compiler binaries
registerRoute(
  ({ url }) => url.origin === 'https://cdn.jsdelivr.net' && url.pathname.includes('/@wasmer/'),
  new CacheFirst({
    cacheName: 'clang-wasm-runtime',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// 5. Stale-While-Revalidate for fonts and UI assets
registerRoute(
  ({ request }) => request.destination === 'font' || request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'aura-static-assets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
      }),
    ],
  })
);

// 6. Network-First for local files (allows offline fallback)
registerRoute(
  ({ url }) => url.origin === location.origin && url.pathname.startsWith('/src/'),
  new NetworkFirst({
    cacheName: 'aura-source-files',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

// 7. Force NetworkOnly for remote compiler APIs (Piston / Judge0)
registerRoute(
  ({ url }) => url.hostname === 'emkc.org' || url.hostname === 'api.judge0.com',
  new NetworkOnly()
);

// 8. Network-First for manifest and icons
registerRoute(
  ({ url }) => url.pathname.includes('/manifest') || url.pathname.includes('/icons/'),
  new NetworkFirst({
    cacheName: 'aura-manifest-icons',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// ============================================
// Message Handling
// ============================================

self.addEventListener('message', (event) => {
  if (!event.data) return;

  // Skip waiting for new SW
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Get cache status
  if (event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then(status => {
      event.ports[0]?.postMessage({ type: 'CACHE_STATUS', payload: status });
    });
  }

  // Clear specific cache
  if (event.data.type === 'CLEAR_CACHE' && event.data.cacheName) {
    caches.delete(event.data.cacheName).then(success => {
      event.ports[0]?.postMessage({ type: 'CACHE_CLEARED', success });
    });
  }
});

// ============================================
// Helper Functions
// ============================================

async function getCacheStatus(): Promise<any[]> {
  const cacheNames = await caches.keys();
  const statuses = await Promise.all(
    cacheNames.map(async (name) => {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      let totalSize = 0;
      for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
      return {
        name,
        entries: keys.length,
        size: totalSize,
        sizeFormatted: formatBytes(totalSize),
      };
    })
  );
  return statuses;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================
// Periodic Cache Cleanup (optional)
// ============================================

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const validCaches = [
        'monaco-editor-runtime',
        'pyodide-runtime-v0.25',
        'webcontainer-runtime',
        'clang-wasm-runtime',
        'aura-static-assets',
        'aura-source-files',
        'aura-manifest-icons',
        ...Object.keys(self.__WB_MANIFEST || {}).map(m => m.cacheName).filter(Boolean),
      ];
      
      return Promise.all(
        cacheNames
          .filter((name) => !validCaches.some(v => name.startsWith(v)))
          .map((name) => caches.delete(name))
      );
    })
  );
});

// ============================================
// Offline Fallback for Navigation
// ============================================

const FALLBACK_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Aura Studio - Offline</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0a0b0e; color: #f0f6fc; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { text-align: center; max-width: 400px; padding: 2rem; }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #8b949e; font-size: 0.9rem; line-height: 1.5; }
    .status { background: #1c1e29; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 1rem; margin-top: 2rem; }
    .status-item { display: flex; justify-content: space-between; margin: 0.5rem 0; font-size: 0.85rem; }
    .status-item.online { color: #10b981; }
    .status-item.offline { color: #f59e0b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🌌</div>
    <h1>Aura Studio</h1>
    <p>You're currently offline. The IDE will continue to work for local editing and in-browser runtimes.</p>
    <div class="status">
      <div class="status-item offline">⚠ Remote execution unavailable</div>
      <div class="status-item online">✓ Local JS/TS execution</div>
      <div class="status-item online">✓ Cached WASM runtimes</div>
      <div class="status-item online">✓ File editing & management</div>
    </div>
  </div>
</body>
</html>
`;

// Serve fallback for navigation requests when offline
registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ event }) => {
    try {
      return await fetch(event.request);
    } catch {
      return new Response(FALLBACK_HTML, {
        headers: { 'Content-Type': 'text/html' },
      });
    }
  }
);