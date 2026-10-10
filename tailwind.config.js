/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0a0b0e',
        frame: '#111217',
        surface: '#161820',
        raised: '#1c1e29',
        'border-subtle': 'rgba(255, 255, 255, 0.06)',
        'border-hover': 'rgba(255, 255, 255, 0.12)',
        'accent-indigo': '#6366f1',
        'accent-cyan': '#06b6d4',
      },
      fontFamily: {
        ui: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}