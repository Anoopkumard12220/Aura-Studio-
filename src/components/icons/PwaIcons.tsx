import React from 'react';

export const PwaIcons: React.FC = () => {
  // These are inline SVG icons for PWA manifest generation
  // In production, these would be generated as actual PNG files
  
  const icon192 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="192" height="192" rx="32" fill="url(#bg)"/>
      <path d="M96 40a56 56 0 1 0 0 112 56 56 0 0 0 0-112zm0 16a40 40 0 1 1 0 80 40 40 0 0 1 0-80z" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
      <circle cx="96" cy="96" r="12" fill="white" opacity="0.9"/>
    </svg>
  );

  const icon512 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
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
  );

  const maskable512 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
        </linearGradient>
      </defs>
      <!-- Safe zone: 60% center = 307x307, so content within 102-410 -->
      <rect width="512" height="512" rx="84" fill="url(#bg)"/>
      <path d="M256 120a136 136 0 1 0 0 272 136 136 0 0 0 0-272zm0 40a96 96 0 1 1 0 192 96 96 0 0 1 0-192z" fill="none" stroke="white" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
      <circle cx="256" cy="256" r="40" fill="white" opacity="0.9"/>
    </svg>
  );

  return (
    <div className="pwa-icons hidden" aria-hidden="true">
      <div data-size="192" dangerouslySetInnerHTML={{ __html: icon192 }} />
      <div data-size="512" dangerouslySetInnerHTML={{ __html: icon512 }} />
      <div data-size="512" data-purpose="maskable" dangerouslySetInnerHTML={{ __html: maskable512 }} />
    </div>
  );
};

// Helper to generate actual PNG files (for build script)
export const generatePwaIcons = async (): Promise<Blob[]> => {
  // This would be used in a build script to generate actual PNG files
  // For now, returning placeholder
  return [];
};

export const PWA_ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
export const PWA_MASKABLE_SIZES = [512];