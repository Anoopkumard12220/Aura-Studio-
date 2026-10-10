# Aura Studio PWA Implementation (Version 07)

## Overview

Version 07 implements a complete Progressive Web App (PWA) toolchain with offline-first architecture, enabling Aura Studio to work fully offline for local runtimes while gracefully degrading remote execution capabilities.

## Features Implemented

### 1. Web App Manifest (`public/manifest.webmanifest`)
- **Standalone display mode** with window controls overlay
- **macOS-style squircle icons** (72-512px) with maskable variants
- **File handlers** for `.zip`, `.js`, `.ts`, `.py`, `.cpp`, `.c`, `.h`, `.json`, `.md`, `.html`, `.css`
- **Protocol handler** for `aura-studio://` deep links
- **Shortcuts** for New Project and Open Project
- **Dark theme** colors matching macOS aesthetic

### 2. Service Worker (`src/pwa/sw.ts`)
Built with Workbox using **injectManifest** strategy for full control:

| Cache Strategy | Resources | TTL | Max Entries |
|---------------|-----------|-----|-------------|
| **CacheFirst** | Monaco Editor language chunks, WASM binaries | 30 days | 100 |
| **CacheFirst** | Pyodide WASM & Python stdlib wheels | 30 days | 80 |
| **CacheFirst** | WebContainer WASM binaries | 30 days | 40 |
| **CacheFirst** | Clang WASM compiler binaries | 30 days | 30 |
| **StaleWhileRevalidate** | Fonts, images, static assets | 60 days | 200 |
| **NetworkFirst** | Local source files (`/src/`) | 7 days | 500 |
| **NetworkOnly** | Remote compiler APIs (Piston, Judge0) | - | - |

**Special Features:**
- SPA navigation fallback to `/index.html`
- Offline HTML fallback page with capability matrix
- Message channel for cache status queries
- Automatic outdated cache cleanup on activation

### 3. Service Worker Registration (`src/pwa/registerServiceWorker.ts`)
- Auto-registration in production (configurable via `VITE_FORCE_SW`)
- Lifecycle event handling: `installed`, `waiting`, `controlling`, `activated`
- Update notification system with custom events
- Helper functions: `checkForUpdate()`, `skipWaiting()`, `getCacheStatus()`, `clearCache()`

### 4. Offline Capability Matrix (`src/pwa/offlineMatrix.ts`)
Honest offline capability mapping:

| Driver | Language | Offline | Fallback Message |
|--------|----------|---------|------------------|
| `js-worker` | JavaScript/TypeScript/JSX/TSX | ✅ | - |
| `pyodide` | Python | ✅ | WASM must be cached online first |
| `webcontainer` | Node.js/TypeScript/JavaScript | ✅ | Container must boot online first |
| `clang-wasm` | C/C++ | ✅ | Compiler must be cached online first |
| `remote-sandbox` | Rust/Go/Java/C#/PHP/Ruby/Kotlin/Swift/Dart | ❌ | Requires internet connection |

**Key Functions:**
- `getOfflineExecutionWarning(driverId, language)` - Returns user-facing warning
- `getAvailableLanguages()` - Filters by network state
- `getUnavailableLanguages()` - Lists disabled languages when offline

### 5. Network State Management (`src/stores/useNetworkStore.ts`)
Zustand store with:
- `isOnline` / `canExecuteRemote` flags
- Connection quality: `effectiveConnectionType`, `downlink`, `rtt`
- `online`/`offline` event listeners
- Network Information API integration
- Active connection check via `/favicon.svg` HEAD request

### 6. UI Components

#### `OfflineStatusBarItem` (`src/components/pwa/OfflineStatusBarItem.tsx`)
- Status bar indicator with WiFi/Offline icon
- Dropdown with connection details
- Offline diagnostics count badge
- Quick actions: Check Connection, View Diagnostics

#### `InstallPromptModal` (`src/components/pwa/InstallPromptModal.tsx`)
- Captures `beforeinstallprompt` event
- macOS-style design with gradient icon
- Persists dismiss/install state in localStorage
- Auto-shows on first visit (if not dismissed)

#### `UpdateAvailableToast` (`src/components/pwa/UpdateAvailableToast.tsx`)
- Non-intrusive bottom-right toast
- Shows when SW update is waiting
- One-click "Update & Reload" with `skipWaiting()`

#### `NetworkStatusToast` (`src/components/pwa/UpdateAvailableToast.tsx`)
- Online/offline transition notifications
- Explains capability changes
- Auto-dismiss after 5s (configurable)

### 7. Vite PWA Configuration (`vite.config.ts`)
```typescript
VitePWA({
  strategies: 'injectManifest',
  srcDir: 'src/pwa',
  filename: 'sw.ts',
  workbox: {
    maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB for WASM
    // ... runtime caching rules
  }
})
```

### 8. Icon Generation Script (`scripts/generate-pwa-icons.ts`)
Generates all required PNG sizes from SVG source using Sharp:
- Standard icons: 72, 96, 128, 144, 152, 192, 384, 512
- Maskable: 512 (with safe zone)
- Apple touch icon: 180
- Favicon: 32x32

Run with: `npm run pwa:generate-icons`

## Integration Points

### App.tsx Initialization
```typescript
// Initialize PWA features
initializeOfflineMatrix();
registerServiceWorker();

// Listen for PWA events
onPWAEvent((event) => {
  if (event.type === 'UPDATE_AVAILABLE') setShowUpdateToast(true);
});

// Network status toasts
window.addEventListener('aura-network-change', (e) => {
  setNetworkToast({ isOnline: e.detail.isOnline });
});
```

### StatusBar Integration
```tsx
<OfflineStatusBarItem />  // Shows in bottom-right status bar
```

### Runtime Selector Integration
```typescript
const warning = getOfflineExecutionWarning(driverId, language);
if (warning) {
  // Show disabled state with tooltip
  // Display warning in modal on click
}
```

## Build & Deploy

### Development
```bash
npm run dev          # SW disabled by default
VITE_FORCE_SW=true npm run dev  # Enable SW in dev
```

### Production Build
```bash
npm run build        # Generates SW with precache manifest
npm run preview      # Test production build with SW
```

### Icon Generation
```bash
npm run pwa:generate-icons  # Run after SVG changes
```

## Offline Behavior

### Fully Functional Offline
- ✅ File editing & project management
- ✅ JavaScript/TypeScript execution (Web Worker)
- ✅ Cached Monaco language services
- ✅ Local file persistence (IndexedDB)
- ✅ Terminal with local shells
- ✅ Project templates (cached)
- ✅ Diagnostics for local runtimes

### Degraded Offline
- ⚠️ Python (Pyodide) - needs WASM cached on first online run
- ⚠️ Node.js (WebContainer) - needs container booted online first
- ⚠️ C/C++ (Clang WASM) - needs compiler cached online first

### Unavailable Offline
- ❌ Rust, Go, Java, C#, PHP, Ruby, Kotlin, Swift, Dart
- ❌ Remote compiler APIs (Piston/Judge0)
- ❌ Live preview server for external URLs
- ❌ Git operations requiring network

## Testing

Run PWA tests:
```bash
npm test -- src/tests/pwa.test.ts
```

Test offline mode:
1. Open DevTools → Application → Service Workers
2. Check "Offline"
3. Verify UI shows offline indicator
4. Try executing remote language → shows warning
5. Execute JavaScript → works

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | 40+ | 44+ | 11.1+ | 17+ |
| Cache API | 40+ | 39+ | 11.1+ | 17+ |
| Install Prompt | 68+ | - | - | 79+ |
| File Handling | 102+ | - | - | 102+ |
| Protocol Handler | 96+ | - | - | 96+ |
| Window Controls Overlay | 99+ | - | - | 99+ |

**Requires:** HTTPS (or localhost) for Service Worker registration.

## Architecture Notes

### COOP/COEP Headers
Required for `SharedArrayBuffer` (WebContainer, Pyodide threading):
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
Configured in `vite.config.ts` for both dev and preview servers.

### Cache Storage Limits
- Standard: ~50-100MB per origin
- With `maximumFileSizeToCacheInBytes: 50MB` for WASM binaries
- Monitor with `getCacheStatus()` in DevTools

### Update Strategy
- `autoUpdate` registration type
- `skipWaiting: true`, `clientsClaim: true`
- Hourly update checks in background
- User prompted via toast when update ready

## Future Enhancements (v08+)

- [ ] Background Sync for pending executions
- [ ] Periodic Background Sync for cache warming
- [ ] Web App Manifest v2 (when available)
- [ ] Better iOS PWA support (no install prompt)
- [ ] File System Access API persistence
- [ ] Push notifications for long-running tasks
- [ ] Shared Worker for cross-tab state sync