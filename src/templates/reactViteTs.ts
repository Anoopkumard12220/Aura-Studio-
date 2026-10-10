import { ProjectTemplate } from './index';

export const reactViteTsTemplate: ProjectTemplate = {
  id: 'react-vite-ts',
  name: 'React 18 + Vite + TypeScript',
  description: 'Production-ready React workspace with TypeScript, Tailwind CSS, and instant live reload.',
  category: 'frontend',
  language: 'TypeScript',
  iconName: 'Atom',
  badge: 'Fast Refresh',
  defaultRunCommand: 'npm run dev',
  files: [
    {
      path: '/package.json',
      content: JSON.stringify({
        name: 'aura-react-vite-ts',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.3.1',
          'react-dom': '^18.3.1',
          'lucide-react': '^0.395.0'
        },
        devDependencies: {
          '@types/react': '^18.3.3',
          '@types/react-dom': '^18.3.0',
          '@vitejs/plugin-react': '^4.3.1',
          typescript: '^5.4.5',
          vite: '^5.3.1',
          tailwindcss: '^3.4.4',
          postcss: '^8.4.38',
          autoprefixer: '^10.4.19'
        }
      }, null, 2)
    },
    {
      path: '/vite.config.ts',
      content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nimport path from 'path';\n\nexport default defineConfig({\n  plugins: [react()],\n  resolve: {\n    alias: {\n      '@': path.resolve(__dirname, './src'),\n    },\n  },\n  server: { port: 5173 }\n});`
    },
    {
      path: '/tsconfig.json',
      content: `{\n  "compilerOptions": {\n    "target": "ES2020",\n    "useDefineForClassFields": true,\n    "lib": ["ES2020", "DOM", "DOM.Iterable"],\n    "module": "ESNext",\n    "skipLibCheck": true,\n    "moduleResolution": "bundler",\n    "allowImportingTsExtensions": true,\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "noEmit": true,\n    "jsx": "react-jsx",\n    "strict": true,\n    "noUnusedLocals": true,\n    "noUnusedParameters": true,\n    "noFallthroughCasesInSwitch": true,\n    "baseUrl": ".",\n    "paths": {\n      "@/*": ["src/*"]\n    }\n  },\n  "include": ["src"],\n  "references": [{ "path": "./tsconfig.node.json" }]\n}`
    },
    {
      path: '/tsconfig.node.json',
      content: `{\n  "compilerOptions": {\n    "composite": true,\n    "skipLibCheck": true,\n    "module": "ESNext",\n    "moduleResolution": "bundler",\n    "allowSyntheticDefaultImports": true,\n    "strict": true\n  },\n  "include": ["vite.config.ts"]\n}`
    },
    {
      path: '/index.html',
      content: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Aura React App</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>`
    },
    {
      path: '/src/main.tsx',
      content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`
    },
    {
      path: '/src/App.tsx',
      content: `import React, { useState } from 'react';\nimport { Monitor, Zap, Heart, Settings } from 'lucide-react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  const [theme, setTheme] = useState<'dark' | 'light'>('dark');\n\n  return (\n    <div\n      className={\`min-h-screen transition-colors duration-300 \${theme === 'dark' ? 'bg-[#0a0b0e] text-[#f0f6fc]' : 'bg-white text-black'}\`}\n    >\n      <header className="p-6 border-b border-white/10 bg-[#111217]/80 backdrop-blur-sm">\n        <div className="max-w-4xl mx-auto flex items-center justify-between">\n          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">\n            Aura Studio React\n          </h1>\n          <button\n            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}\n            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"\n            aria-label="Toggle theme"\n          >\n            {theme === 'dark' ? <Monitor className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}\n          </button>\n        </div>\n      </header>\n\n      <main className="max-w-4xl mx-auto p-6 space-y-8">\n        <section>\n          <h2 className="text-xl font-semibold mb-4">Interactive Counter</h2>\n          <div className="bg-[#161820] border border-white/10 rounded-xl p-6">\n            <div className="flex items-center justify-between">\n              <div>\n                <p className="text-4xl font-mono font-bold text-indigo-400">{count}</p>\n                <p className="text-white/50 mt-1">Click the button to increment</p>\n              </div>\n              <button\n                onClick={() => setCount(c => c + 1)}\n                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 active:bg-indigo-700 transition-colors flex items-center gap-2"\n              >\n                <Zap className="w-5 h-5" />\n                Increment\n              </button>\n            </div>\n          </div>\n        </section>\n\n        <section>\n          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>\n          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">\n            <Card\n              icon={<Zap className="w-6 h-6 text-indigo-400" />}\n              title="Fast Refresh"\n              description="Instant HMR updates while editing"\n            />\n            <Card\n              icon={<Monitor className="w-6 h-6 text-cyan-400" />}\n              title="TypeScript Ready"\n              description="Strict type checking out of the box"\n            />\n            <Card\n              icon={<Heart className="w-6 h-6 text-rose-400" />}\n              title="Tailwind CSS"\n              description="Utility-first styling built-in"\n            />\n            <Card\n              icon={<Settings className="w-6 h-6 text-amber-400" />}\n              title="Vite Config"\n              description="Optimized build & dev server"\n            />\n          </div>\n        </section>\n\n        <section>\n          <h2 className="text-xl font-semibold mb-4">Project Structure</h2>\n          <pre className="bg-[#161820] border border-white/10 rounded-xl p-4 overflow-x-auto text-sm">\n{`project-root/\n├── index.html\n├── package.json\n├── tsconfig.json\n├── tsconfig.node.json\n├── vite.config.ts\n├── tailwind.config.js\n├── postcss.config.js\n└── src/\n    ├── main.tsx\n    ├── App.tsx\n    └── index.css`}\n          </pre>\n        </section>\n      </main>\n\n      <footer className="border-t border-white/10 py-4 px-6 text-center text-white/40 text-sm">\n        Built with Aura Studio · React 18 + Vite + TypeScript\n      </footer>\n    </div>\n  );\n}\n\ninterface CardProps {\n  icon: React.ReactNode;\n  title: string;\n  description: string;\n}\n\nfunction Card({ icon, title, description }: CardProps) {\n  return (\n    <div className="bg-[#161820] border border-white/10 rounded-xl p-4 hover:border-indigo-500/50 transition-colors">\n      <div className="mb-3">{icon}</div>\n      <h3 className="font-medium mb-1">{title}</h3>\n      <p className="text-white/50 text-sm">{description}</p>\n    </div>\n  );\n}`
    },
    {
      path: '/src/index.css',
      content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n* {\n  box-sizing: border-box;\n}\n\nbody {\n  margin: 0;\n  min-height: 100vh;\n}\n\n:root {\n  --color-canvas: #0a0b0e;\n  --color-frame: #111217;\n  --color-surface: #161820;\n  --color-raised: #1c1e29;\n  --color-accent-indigo: #6366f1;\n  --color-accent-cyan: #06b6d4;\n}\n\n@layer base {\n  html {\n    -webkit-font-smoothing: antialiased;\n    -moz-osx-font-smoothing: grayscale;\n  }\n}`
    },
    {
      path: '/tailwind.config.js',
      content: `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: [\n    "./index.html",\n    "./src/**/*.{js,ts,jsx,tsx}",\n  ],\n  theme: {\n    extend: {\n      colors: {\n        canvas: '#0a0b0e',\n        frame: '#111217',\n        surface: '#161820',\n        raised: '#1c1e29',\n        'border-subtle': 'rgba(255, 255, 255, 0.06)',\n        'border-hover': 'rgba(255, 255, 255, 0.12)',\n        'accent-indigo': '#6366f1',\n        'accent-cyan': '#06b6d4',\n      },\n      fontFamily: {\n        ui: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Inter', 'sans-serif'],\n        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Monaco', 'monospace'],\n      },\n    },\n  },\n  plugins: [],\n}`
    },
    {
      path: '/postcss.config.js',
      content: `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}`
    }
  ]
};