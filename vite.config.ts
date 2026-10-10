import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Aura Studio',
        short_name: 'Aura Studio',
        description: 'A cinematic macOS-inspired web IDE with multi-language editing, local execution, and offline-first architecture',
        theme_color: '#0a0b0e',
        background_color: '#0a0b0e',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'landscape-primary',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        categories: ['developer', 'productivity', 'utilities'],
        shortcuts: [
          { name: 'New Project', short_name: 'New', description: 'Create a new project', url: '/?action=new-project', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Open Project', short_name: 'Open', description: 'Open an existing project', url: '/?action=open-project', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
        file_handlers: [
          {
            action: '/',
            accept: {
              'application/zip': ['.zip'],
              'text/plain': ['.txt', '.js', '.ts', '.py', '.cpp', '.c', '.h', '.json', '.md', '.html', '.css'],
              'application/json': ['.json'],
              'application/x-typescript': ['.ts', '.tsx'],
              'application/javascript': ['.js', '.jsx'],
              'text/x-python': ['.py'],
              'text/x-c++src': ['.cpp', '.cc', '.cxx'],
              'text/x-csrc': ['.c', '.h'],
            },
          },
        ],
        protocol_handlers: [{ protocol: 'aura-studio', url: '/?project=%s' }],
        prefer_related_applications: false,
        launch_handler: { client_mode: 'focus-existing' },
        handle_links: 'preferred',
      },
      srcDir: 'src/pwa',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wasm}'],
        globIgnores: ['**/*.map', '**/sw.js', '**/workbox-*.js'],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/monaco-editor@.*\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'monaco-editor-runtime',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/pyodide@.*\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pyodide-runtime',
              expiration: { maxEntries: 80, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/@webcontainer\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'webcontainer-runtime',
              expiration: { maxEntries: 40, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/@wasmer\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'clang-wasm-runtime',
              expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'font' || request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'aura-static-assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === location.origin && url.pathname.startsWith('/src/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'aura-source-files',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'emkc.org' || url.hostname === 'api.judge0.com',
            handler: 'NetworkOnly',
          },
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/_preview\//],
      },
      devOptions: {
        enabled: false,
        type: 'module',
        navigateFallback: '/index.html',
      },
    }),
    {
      name: 'configure-cross-origin-isolation-headers',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
          'pyodide': ['pyodide'],
          'webcontainer': ['@webcontainer/api'],
          'xterm': ['xterm', 'xterm-addon-fit', 'xterm-addon-web-links'],
        },
      },
    },
  },
  worker: {
    format: 'es',
    plugins: () => [react()],
  },
});