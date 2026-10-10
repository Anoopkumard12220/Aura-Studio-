import { ProjectTemplate } from './index';

export const vanillaTsTemplate: ProjectTemplate = {
  id: 'vanilla-ts',
  name: 'Vanilla TypeScript',
  description: 'Lightweight TypeScript sandbox for algorithms, utilities, and modern ES modules.',
  category: 'systems',
  language: 'TypeScript',
  iconName: 'Code',
  badge: 'Zero Config',
  defaultRunCommand: 'npx tsx src/main.ts',
  files: [
    {
      path: '/package.json',
      content: JSON.stringify({
        name: 'aura-vanilla-ts',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'tsx watch src/main.ts',
          build: 'tsc',
          start: 'node dist/main.js'
        },
        dependencies: {},
        devDependencies: {
          typescript: '^5.4.5',
          tsx: '^4.7.0',
          '@types/node': '^20.12.0'
        }
      }, null, 2)
    },
    {
      path: '/tsconfig.json',
      content: `{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "ESNext",\n    "moduleResolution": "bundler",\n    "lib": ["ES2022"],\n    "strict": true,\n    "skipLibCheck": true,\n    "esModuleInterop": true,\n    "allowSyntheticDefaultImports": true,\n    "forceConsistentCasingInFileNames": true,\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "noEmit": true,\n    "outDir": "./dist",\n    "rootDir": "./src",\n    "baseUrl": ".",\n    "paths": {\n      "@/*": ["src/*"]\n    }\n  },\n  "include": ["src/**/*"],\n  "exclude": ["node_modules", "dist"]\n}`
    },
    {
      path: '/src/main.ts',
      content: `// Aura Studio - Vanilla TypeScript Playground\n\ninterface Algorithm {\n  name: string;\n  complexity: string;\n  run: (input: number[]) => number[];\n}\n\nconst algorithms: Algorithm[] = [\n  {\n    name: 'Bubble Sort',\n    complexity: 'O(n²)',\n    run: (arr) => {\n      const a = [...arr];\n      for (let i = 0; i < a.length; i++) {\n        for (let j = 0; j < a.length - i - 1; j++) {\n          if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];\n        }\n      }\n      return a;\n    }\n  },\n  {\n    name: 'Quick Sort',\n    complexity: 'O(n log n)',\n    run: (arr) => {\n      if (arr.length <= 1) return arr;\n      const pivot = arr[arr.length >> 1];\n      const left = arr.filter(x => x < pivot);\n      const middle = arr.filter(x => x === pivot);\n      const right = arr.filter(x => x > pivot);\n      return [...quickSort(left), ...middle, ...quickSort(right)];\n    }\n  },\n  {\n    name: 'Merge Sort',\n    complexity: 'O(n log n)',\n    run: (arr) => {\n      if (arr.length <= 1) return arr;\n      const mid = arr.length >> 1;\n      return merge(mergeSort(arr.slice(0, mid)), mergeSort(arr.slice(mid)));\n    }\n  }\n];\n\nfunction quickSort(arr: number[]): number[] {\n  if (arr.length <= 1) return arr;\n  const pivot = arr[arr.length >> 1];\n  const left = arr.filter(x => x < pivot);\n  const middle = arr.filter(x => x === pivot);\n  const right = arr.filter(x => x > pivot);\n  return [...quickSort(left), ...middle, ...quickSort(right)];\n}\n\nfunction merge(left: number[], right: number[]): number[] {\n  const result: number[] = [];\n  let i = 0, j = 0;\n  while (i < left.length && j < right.length) {\n    result.push(left[i] <= right[j] ? left[i++] : right[j++]);\n  }\n  return [...result, ...left.slice(i), ...right.slice(j)];\n}\n\nfunction generateRandomArray(size: number): number[] {\n  return Array.from({ length: size }, () => Math.floor(Math.random() * 1000));\n}\n\nfunction benchmark(algorithm: Algorithm, input: number[]): number {\n  const start = performance.now();\n  algorithm.run(input);\n  return performance.now() - start;\n}\n\nconsole.log('🚀 Aura Studio - Vanilla TypeScript Algorithms\\n');\nconsole.log('═'.repeat(50));\n\nconst testSizes = [100, 500, 1000];\n\nfor (const size of testSizes) {\n  const input = generateRandomArray(size);\n  console.log(`\\n📊 Array Size: ${size}`);\n  console.log('─'.repeat(30));\n\n  for (const algo of algorithms) {\n    const time = benchmark(algo, input);\n    console.log(`  ${algo.name.padEnd(12)} │ ${algo.complexity.padEnd(8)} │ ${time.toFixed(2)} ms`);\n  }\n}\n\nconsole.log('\\n' + '═'.repeat(50));\nconsole.log('✨ Edit src/main.ts to add your own algorithms!');`
    },
    {
      path: '/src/utils.ts',
      content: `// Utility functions for algorithm development\n\nexport function swap<T>(arr: T[], i: number, j: number): void {\n  [arr[i], arr[j]] = [arr[j], arr[i]];\n}\n\nexport function shuffle<T>(arr: T[]): T[] {\n  const result = [...arr];\n  for (let i = result.length - 1; i > 0; i--) {\n    const j = Math.floor(Math.random() * (i + 1));\n    [result[i], result[j]] = [result[j], result[i]];\n  }\n  return result;\n}\n\nexport function range(start: number, end?: number, step = 1): number[] {\n  if (end === undefined) {\n    end = start;\n    start = 0;\n  }\n  return Array.from({ length: Math.ceil((end - start) / step) }, (_, i) => start + i * step);\n}\n\nexport function benchmark<T>(fn: () => T, iterations = 1): { result: T; avgMs: number } {\n  const times: number[] = [];\n  let result: T;\n  for (let i = 0; i < iterations; i++) {\n    const start = performance.now();\n    result = fn();\n    times.push(performance.now() - start);\n  }\n  return { result: result!, avgMs: times.reduce((a, b) => a + b, 0) / times.length };\n}\n\nexport function formatNumber(num: number): string {\n  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';\n  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';\n  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';\n  return num.toString();\n}`
    }
  ]
};