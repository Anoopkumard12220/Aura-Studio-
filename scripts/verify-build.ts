#!/usr/bin/env tsx
// Production Build Verification Script
// Verifies that the build output meets all requirements

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import { gzipSync, brotliCompressSync } from 'zlib';

const DIST_DIR = join(process.cwd(), 'dist');
const REQUIRED_FILES = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
];

const REQUIRED_DIRS = [
  'assets',
  'icons',
];

const MAX_FILE_SIZES = {
  'index.html': 50 * 1024, // 50KB
  '*.js': 500 * 1024, // 500KB per JS chunk
  '*.css': 100 * 1024, // 100KB per CSS chunk
  '*.woff2': 100 * 1024, // 100KB per font
  '*.png': 200 * 1024, // 200KB per image
  '*.wasm': 10 * 1024 * 1024, // 10MB for WASM
};

const REQUIRED_HEADERS = [
  'Cross-Origin-Opener-Policy: same-origin',
  'Cross-Origin-Embedder-Policy: require-corp',
  'Cross-Origin-Resource-Policy: cross-origin',
];

interface VerificationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  metrics: Record<string, any>;
}

function checkDistExists(): VerificationResult {
  const result: VerificationResult = { passed: true, errors: [], warnings: [], metrics: {} };
  
  if (!existsSync(DIST_DIR)) {
    result.passed = false;
    result.errors.push(`Dist directory not found: ${DIST_DIR}`);
    return result;
  }
  
  result.metrics.distExists = true;
  return result;
}

function checkRequiredFiles(result: VerificationResult): void {
  for (const file of REQUIRED_FILES) {
    const path = join(DIST_DIR, file);
    if (!existsSync(path)) {
      result.passed = false;
      result.errors.push(`Required file missing: ${file}`);
    } else {
      const stats = statSync(path);
      result.metrics[`${file}_size`] = stats.size;
      result.metrics[`${file}_size_kb`] = (stats.size / 1024).toFixed(2);
    }
  }
}

function checkRequiredDirs(result: VerificationResult): void {
  for (const dir of REQUIRED_DIRS) {
    const path = join(DIST_DIR, dir);
    if (!existsSync(path)) {
      result.passed = false;
      result.errors.push(`Required directory missing: ${dir}`);
    } else {
      const files = readdirSync(path);
      result.metrics[`${dir}_file_count`] = files.length;
    }
  }
}

function checkFileSizes(result: VerificationResult): void {
  function walk(dir: string): string[] {
    let files: string[] = [];
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files = files.concat(walk(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    return files;
  }

  const allFiles = walk(DIST_DIR);
  
  for (const file of allFiles) {
    const relativePath = file.replace(DIST_DIR + '/', '');
    const stats = statSync(file);
    const size = stats.size;
    const ext = extname(file).toLowerCase();
    const name = basename(file);
    
    // Check against max sizes
    let maxSize = Infinity;
    for (const [pattern, limit] of Object.entries(MAX_FILE_SIZES)) {
      const regexPattern = pattern.replace('*', '.*');
      if (new RegExp(regexPattern).test(name) || new RegExp(regexPattern).test(ext)) {
        maxSize = Math.min(maxSize, limit);
      }
    }
    
    if (size > maxSize) {
      result.warnings.push(`File exceeds recommended size: ${relativePath} (${(size / 1024).toFixed(2)}KB > ${(maxSize / 1024).toFixed(2)}KB)`);
    }
    
    // Track largest files
    if (size > 100 * 1024) {
      result.metrics.largeFiles = result.metrics.largeFiles || [];
      result.metrics.largeFiles.push({ file: relativePath, sizeKB: (size / 1024).toFixed(2) });
    }
  }
}

function checkManifest(result: VerificationResult): void {
  const manifestPath = join(DIST_DIR, 'manifest.webmanifest');
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
      for (const field of requiredFields) {
        if (!manifest[field]) {
          result.errors.push(`Manifest missing required field: ${field}`);
          result.passed = false;
        }
      }
      
      if (manifest.display !== 'standalone') {
        result.warnings.push(`Manifest display should be 'standalone', got: ${manifest.display}`);
      }
      
      if (!manifest.icons || manifest.icons.length === 0) {
        result.errors.push('Manifest has no icons');
        result.passed = false;
      }
      
      result.metrics.manifestIcons = manifest.icons?.length || 0;
      result.metrics.manifestShortName = manifest.short_name;
    } catch (e) {
      result.errors.push(`Manifest parsing failed: ${e}`);
      result.passed = false;
    }
  }
}

function checkServiceWorker(result: VerificationResult): void {
  const swPath = join(DIST_DIR, 'sw.js');
  if (existsSync(swPath)) {
    const swContent = readFileSync(swPath, 'utf-8');
    
    const requiredPatterns = [
      'workbox',
      'precacheAndRoute',
      'registerRoute',
      'CacheFirst',
      'StaleWhileRevalidate',
      'NetworkFirst',
    ];
    
    for (const pattern of requiredPatterns) {
      if (!swContent.includes(pattern)) {
        result.warnings.push(`Service worker may be missing: ${pattern}`);
      }
    }
    
    result.metrics.swSizeKB = (swContent.length / 1024).toFixed(2);
  }
}

function checkIndexHtml(result: VerificationResult): void {
  const indexPath = join(DIST_DIR, 'index.html');
  if (existsSync(indexPath)) {
    const html = readFileSync(indexPath, 'utf-8');
    
    const requiredElements = [
      'manifest.webmanifest',
      'Cross-Origin-Opener-Policy',
      'Cross-Origin-Embedder-Policy',
      'Content-Security-Policy',
      'viewport-fit=cover',
      'apple-mobile-web-app-capable',
    ];
    
    for (const element of requiredElements) {
      if (!html.includes(element)) {
        result.warnings.push(`index.html missing: ${element}`);
      }
    }
    
    // Check for module script
    if (!html.includes('type="module"')) {
      result.errors.push('index.html missing type="module" script');
      result.passed = false;
    }
  }
}

function checkCompression(result: VerificationResult): void {
  function walk(dir: string): string[] {
    let files: string[] = [];
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files = files.concat(walk(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    return files;
  }

  const allFiles = walk(DIST_DIR);
  let totalOriginal = 0;
  let totalGzip = 0;
  let totalBrotli = 0;
  
  for (const file of allFiles) {
    const ext = extname(file).toLowerCase();
    if (['.js', '.css', '.html', '.json', '.svg', '.wasm', '.woff2'].includes(ext)) {
      const content = readFileSync(file);
      totalOriginal += content.length;
      totalGzip += gzipSync(content).length;
      totalBrotli += brotliCompressSync(content).length;
    }
  }
  
  result.metrics.compression = {
    originalKB: (totalOriginal / 1024).toFixed(2),
    gzipKB: (totalGzip / 1024).toFixed(2),
    brotliKB: (totalBrotli / 1024).toFixed(2),
    gzipRatio: ((1 - totalGzip / totalOriginal) * 100).toFixed(1) + '%',
    brotliRatio: ((1 - totalBrotli / totalOriginal) * 100).toFixed(1) + '%',
  };
}

function checkIcons(result: VerificationResult): void {
  const iconsDir = join(DIST_DIR, 'icons');
  if (existsSync(iconsDir)) {
    const icons = readdirSync(iconsDir).filter(f => f.endsWith('.png'));
    const requiredSizes = [72, 96, 128, 144, 152, 192, 384, 512];
    
    for (const size of requiredSizes) {
      const found = icons.some(icon => icon.includes(`icon-${size}`));
      if (!found) {
        result.warnings.push(`Missing icon size: ${size}x${size}`);
      }
    }
    
    const maskable = icons.some(icon => icon.includes('maskable'));
    if (!maskable) {
      result.warnings.push('Missing maskable icon (512x512)');
    }
    
    result.metrics.iconCount = icons.length;
  }
}

function generateReport(result: VerificationResult): void {
  console.log('\n═══════════════════════════════════════════');
  console.log('  AURA STUDIO - PRODUCTION BUILD VERIFICATION');
  console.log('═══════════════════════════════════════════\n');
  
  if (result.passed && result.errors.length === 0) {
    console.log('✅  BUILD VERIFICATION PASSED\n');
  } else {
    console.log('❌  BUILD VERIFICATION FAILED\n');
  }
  
  if (result.errors.length > 0) {
    console.log('ERRORS:');
    for (const error of result.errors) {
      console.log(`  ✗ ${error}`);
    }
    console.log('');
  }
  
  if (result.warnings.length > 0) {
    console.log('WARNINGS:');
    for (const warning of result.warnings) {
      console.log(`  ⚠ ${warning}`);
    }
    console.log('');
  }
  
  console.log('METRICS:');
  for (const [key, value] of Object.entries(result.metrics)) {
    if (typeof value === 'object') {
      console.log(`  ${key}:`);
      for (const [k, v] of Object.entries(value)) {
        console.log(`    ${k}: ${v}`);
      }
    } else {
      console.log(`  ${key}: ${value}`);
    }
  }
  
  console.log('\n═══════════════════════════════════════════\n');
}

function main(): void {
  let result: VerificationResult = { passed: true, errors: [], warnings: [], metrics: {} };
  
  console.log('🔍 Verifying production build...\n');
  
  // Run all checks
  result = checkDistExists();
  if (!result.passed) {
    generateReport(result);
    process.exit(1);
  }
  
  checkRequiredFiles(result);
  checkRequiredDirs(result);
  checkFileSizes(result);
  checkManifest(result);
  checkServiceWorker(result);
  checkIndexHtml(result);
  checkCompression(result);
  checkIcons(result);
  
  generateReport(result);
  
  if (!result.passed || result.errors.length > 0) {
    process.exit(1);
  }
}

main();