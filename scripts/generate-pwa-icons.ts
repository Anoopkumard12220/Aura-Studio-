#!/usr/bin/env tsx
// PWA Icon Generator for Aura Studio
// Generates all required icon sizes from a single SVG source

import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [512];

const SVG_SOURCE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="84" fill="url(#bg)"/>
  <path d="M256 100a156 156 0 1 0 0 312 156 156 0 0 0 0-312zm0 40a116 116 0 1 1 0 232 116 116 0 0 1 0-232z" fill="none" stroke="white" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
  <circle cx="256" cy="256" r="32" fill="white" opacity="0.9"/>
</svg>
`;

const MASKABLE_SVG_SOURCE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="84" fill="url(#bg)"/>
  <path d="M256 120a136 136 0 1 0 0 272 136 136 0 0 0 0-272zm0 40a96 96 0 1 1 0 192 96 96 0 0 1 0-192z" fill="none" stroke="white" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
  <circle cx="256" cy="256" r="40" fill="white" opacity="0.9"/>
</svg>
`;

async function generateIcons() {
  const outputDir = join(process.cwd(), 'public', 'icons');
  
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log('🎨 Generating PWA icons...');
  
  // Generate standard icons
  for (const size of ICON_SIZES) {
    const outputPath = join(outputDir, `icon-${size}.png`);
    await sharp(Buffer.from(SVG_SOURCE))
      .resize(size, size, { fit: 'fill' })
      .png({ quality: 90, compressionLevel: 6 })
      .toFile(outputPath);
    console.log(`  ✓ icon-${size}.png`);
  }

  // Generate maskable icons (with safe zone)
  for (const size of MASKABLE_SIZES) {
    const outputPath = join(outputDir, `icon-${size}-maskable.png`);
    await sharp(Buffer.from(MASKABLE_SVG_SOURCE))
      .resize(size, size, { fit: 'fill' })
      .png({ quality: 90, compressionLevel: 6 })
      .toFile(outputPath);
    console.log(`  ✓ icon-${size}-maskable.png`);
  }

  // Generate Apple touch icon (180x180)
  const appleTouchPath = join(outputDir, 'apple-touch-icon.png');
  await sharp(Buffer.from(SVG_SOURCE))
    .resize(180, 180, { fit: 'fill' })
    .png({ quality: 90, compressionLevel: 6 })
    .toFile(appleTouchPath);
  console.log(`  ✓ apple-touch-icon.png`);

  // Generate favicon.ico (multiple sizes)
  const faviconPath = join(process.cwd(), 'public', 'favicon.ico');
  await sharp(Buffer.from(SVG_SOURCE))
    .resize(32, 32, { fit: 'fill' })
    .png()
    .toBuffer()
    .then(png32 => 
      sharp(Buffer.from(SVG_SOURCE))
        .resize(16, 16, { fit: 'fill' })
        .png()
        .toBuffer()
        .then(png16 => {
          // Simple ICO creation - just use the 32x32 as favicon
          writeFileSync(faviconPath, png32);
        })
    );
  console.log(`  ✓ favicon.ico`);

  console.log('\\n✅ All PWA icons generated successfully!');
  console.log(`📁 Output: ${outputDir}`);
}

generateIcons().catch(console.error);