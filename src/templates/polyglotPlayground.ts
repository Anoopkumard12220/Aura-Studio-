import { ProjectTemplate } from './index';

export const polyglotPlaygroundTemplate: ProjectTemplate = {
  id: 'polyglot-playground',
  name: 'Polyglot Multi-Language Playground',
  description: 'Starter files in Python, TypeScript, C, and Rust for cross-language experimentation.',
  category: 'polyglot',
  language: 'Multi',
  iconName: 'Layers',
  badge: '4 Languages',
  defaultRunCommand: 'See individual language folders',
  files: [
    {
      path: '/README.md',
      content: `# Polyglot Playground

A multi-language sandbox with starter projects in 4 languages.

## Structure

\`\`\`
polyglot-playground/
├── README.md
├── python/
│   ├── main.py
│   └── algorithms.py
├── typescript/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/main.ts
│   └── src/utils.ts
├── c/
│   ├── main.c
│   └── Makefile
└── rust/
    ├── Cargo.toml
    └── src/main.rs
\`\`\`

## Running Each Language

### Python (via Pyodide)
\`\`\`bash
cd python && python main.py
\`\`\`

### TypeScript (via tsx/Node)
\`\`\`bash
cd typescript && npx tsx src/main.ts
\`\`\`

### C (via gcc/clang)
\`\`\`bash
cd c && make && ./main
\`\`\`

### Rust (via cargo)
\`\`\`bash
cd rust && cargo run
\`\`\`

## Features Per Language

| Language | Includes |
|----------|----------|
| Python | NumPy, Matplotlib, data structures |
| TypeScript | Strict types, algorithm demos |
| C | C11 standard, data structures, algorithms |
| Rust | 2021 edition, iterators, error handling |
`
    },
    {
      path: '/python/main.py',
      content: `# Aura Polyglot - Python Entry Point\n\nimport sys\nsys.path.append('algorithms')\n\nfrom algorithms import fibonacci, sieve_primes, quicksort\n\nprint("🐍 Python Playground")\nprint("=" * 40)\n\n# Fibonacci\nprint(f"Fibonacci(10): {fibonacci(10)}")\n\n# Primes\nprimes = sieve_primes(50)\nprint(f"Primes ≤ 50: {primes}")\n\n# Quicksort\narr = [64, 34, 25, 12, 22, 11, 90]\nprint(f"Original: {arr}")\nprint(f"Sorted: {quicksort(arr)}")\n\nprint("\\n✅ Python module loaded successfully!")`
    },
    {
      path: '/python/algorithms.py',
      content: `# Python Algorithms Module\n\ndef fibonacci(n: int) -> int:\n    \"\"\"Return nth Fibonacci number (iterative).\"\"\"\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n\ndef sieve_primes(limit: int) -> list:\n    \"\"\"Sieve of Eratosthenes.\"\"\"\n    if limit < 2:\n        return []\n    sieve = [True] * (limit + 1)\n    sieve[0] = sieve[1] = False\n    for i in range(2, int(limit**0.5) + 1):\n        if sieve[i]:\n            for j in range(i*i, limit + 1, i):\n                sieve[j] = False\n    return [i for i, is_prime in enumerate(sieve) if is_prime]\n\ndef quicksort(arr: list) -> list:\n    \"\"\"Quick sort implementation.\"\"\"\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)\n\n# Data structure: Binary Search Tree\nclass TreeNode:\n    def __init__(self, val: int):\n        self.val = val\n        self.left = None\n        self.right = None\n\nclass BST:\n    def __init__(self):\n        self.root = None\n    \n    def insert(self, val: int) -> None:\n        if not self.root:\n            self.root = TreeNode(val)\n        else:\n            self._insert(self.root, val)\n    \n    def _insert(self, node: TreeNode, val: int) -> None:\n        if val < node.val:\n            if node.left is None:\n                node.left = TreeNode(val)\n            else:\n                self._insert(node.left, val)\n        else:\n            if node.right is None:\n                node.right = TreeNode(val)\n            else:\n                self._insert(node.right, val)\n    \n    def inorder(self) -> list:\n        result = []\n        self._inorder(self.root, result)\n        return result\n    \n    def _inorder(self, node: TreeNode, result: list) -> None:\n        if node:\n            self._inorder(node.left, result)\n            result.append(node.val)\n            self._inorder(node.right, result)`
    },
    {
      path: '/typescript/package.json',
      content: JSON.stringify({
        name: 'polyglot-typescript',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'tsx src/main.ts',
          build: 'tsc'
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
      path: '/typescript/tsconfig.json',
      content: `{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "ESNext",\n    "moduleResolution": "bundler",\n    "lib": ["ES2022"],\n    "strict": true,\n    "skipLibCheck": true,\n    "esModuleInterop": true,\n    "allowSyntheticDefaultImports": true,\n    "forceConsistentCasingInFileNames": true,\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "noEmit": true,\n    "outDir": "./dist",\n    "rootDir": "./src",\n    "baseUrl": ".",\n    "paths": { "@/*": ["src/*"] }\n  },\n  "include": ["src/**/*"]\n}`
    },
    {
      path: '/typescript/src/main.ts',
      content: `// Aura Polyglot - TypeScript Entry Point\n\nimport { fibonacci, sievePrimes, quicksort, BST } from './utils';\n\nconsole.log('🦕 TypeScript Playground');\nconsole.log('='.repeat(40));\n\n// Fibonacci\nconsole.log(\`Fibonacci(10): \${fibonacci(10)}\`);\n\n// Primes\nconst primes = sievePrimes(50);\nconsole.log(\`Primes ≤ 50: \${primes.join(', ')}\`);\n\n// Quicksort\nconst arr = [64, 34, 25, 12, 22, 11, 90];\nconsole.log(\`Original: [\${arr.join(', ')}]\`);\nconsole.log(\`Sorted: [\${quicksort(arr).join(', ')}]\`);\n\n// Binary Search Tree\nconst bst = new BST();\n[50, 30, 70, 20, 40, 60, 80].forEach(v => bst.insert(v));\nconsole.log(\`BST Inorder: [\${bst.inorder().join(', ')}]\`);\n\nconsole.log('\\n✅ TypeScript module loaded successfully!');`
    },
    {
      path: '/typescript/src/utils.ts',
      content: `// TypeScript Algorithms & Data Structures\n\nexport function fibonacci(n: number): number {\n  let a = 0, b = 1;\n  for (let i = 0; i < n; i++) {\n    [a, b] = [b, a + b];\n  }\n  return a;\n}\n\nexport function sievePrimes(limit: number): number[] {\n  if (limit < 2) return [];\n  const sieve = new Array(limit + 1).fill(true);\n  sieve[0] = sieve[1] = false;\n  for (let i = 2; i * i <= limit; i++) {\n    if (sieve[i]) {\n      for (let j = i * i; j <= limit; j += i) sieve[j] = false;\n    }\n  }\n  return sieve.map((isPrime, i) => isPrime ? i : -1).filter(x => x !== -1);\n}\n\nexport function quicksort<T>(arr: T[]): T[] {\n  if (arr.length <= 1) return arr;\n  const pivot = arr[Math.floor(arr.length / 2)];\n  const left = arr.filter(x => x < pivot);\n  const middle = arr.filter(x => x === pivot);\n  const right = arr.filter(x => x > pivot);\n  return [...quicksort(left), ...middle, ...quicksort(right)];\n}\n\n// Binary Search Tree\nexport class TreeNode<T> {\n  constructor(\n    public val: T,\n    public left: TreeNode<T> | null = null,\n    public right: TreeNode<T> | null = null\n  ) {}\n}\n\nexport class BST<T> {\n  private root: TreeNode<T> | null = null;\n  private compare: (a: T, b: T) => number;\n\n  constructor(compare: (a: T, b: T) => number = (a, b) => a < b ? -1 : a > b ? 1 : 0) {\n    this.compare = compare;\n  }\n\n  insert(val: T): void {\n    if (!this.root) {\n      this.root = new TreeNode(val);\n      return;\n    }\n    this._insert(this.root, val);\n  }\n\n  private _insert(node: TreeNode<T>, val: T): void {\n    if (this.compare(val, node.val) < 0) {\n      if (!node.left) node.left = new TreeNode(val);\n      else this._insert(node.left, val);\n    } else {\n      if (!node.right) node.right = new TreeNode(val);\n      else this._insert(node.right, val);\n    }\n  }\n\n  inorder(): T[] {\n    const result: T[] = [];\n    this._inorder(this.root, result);\n    return result;\n  }\n\n  private _inorder(node: TreeNode<T> | null, result: T[]): void {\n    if (node) {\n      this._inorder(node.left, result);\n      result.push(node.val);\n      this._inorder(node.right, result);\n    }\n  }\n}`
    },
    {
      path: '/c/main.c',
      content: `// Aura Polyglot - C Entry Point\n// Compile: gcc -std=c11 -O2 main.c -o main\n\n#include <stdio.h>\n#include <stdlib.h>\n#include <stdbool.h>\n#include <string.h>\n#include <time.h>\n\n// ============================================\n// Fibonacci\n// ============================================\nunsigned long long fibonacci(int n) {\n    unsigned long long a = 0, b = 1;\n    for (int i = 0; i < n; i++) {\n        unsigned long long tmp = a + b;\n        a = b;\n        b = tmp;\n    }\n    return a;\n}\n\n// ============================================\n// Sieve of Eratosthenes\n// ============================================\nint* sieve_primes(int limit, int* count) {\n    if (limit < 2) { *count = 0; return NULL; }\n    \n    bool* sieve = calloc(limit + 1, sizeof(bool));\n    for (int i = 2; i <= limit; i++) sieve[i] = true;\n    \n    for (int i = 2; i * i <= limit; i++) {\n        if (sieve[i]) {\n            for (int j = i * i; j <= limit; j += i) sieve[j] = false;\n        }\n    }\n    \n    int capacity = limit / 2;\n    int* primes = malloc(capacity * sizeof(int));\n    *count = 0;\n    for (int i = 2; i <= limit; i++) {\n        if (sieve[i]) primes[(*count)++] = i;\n    }\n    \n    free(sieve);\n    return primes;\n}\n\n// ============================================\n// Quicksort\n// ============================================\nvoid swap(int* a, int* b) { int t = *a; *a = *b; *b = t; }\n\nint partition(int* arr, int low, int high) {\n    int pivot = arr[high];\n    int i = low - 1;\n    for (int j = low; j < high; j++) {\n        if (arr[j] <= pivot) swap(&arr[++i], &arr[j]);\n    }\n    swap(&arr[i + 1], &arr[high]);\n    return i + 1;\n}\n\nvoid quicksort(int* arr, int low, int high) {\n    if (low < high) {\n        int pi = partition(arr, low, high);\n        quicksort(arr, low, pi - 1);\n        quicksort(arr, pi + 1, high);\n    }\n}\n\n// ============================================\n// Binary Search Tree\n// ============================================\ntypedef struct TreeNode {\n    int val;\n    struct TreeNode* left;\n    struct TreeNode* right;\n} TreeNode;\n\nTreeNode* create_node(int val) {\n    TreeNode* node = malloc(sizeof(TreeNode));\n    node->val = val;\n    node->left = node->right = NULL;\n    return node;\n}\n\nTreeNode* bst_insert(TreeNode* root, int val) {\n    if (!root) return create_node(val);\n    if (val < root->val) root->left = bst_insert(root->left, val);\n    else root->right = bst_insert(root->right, val);\n    return root;\n}\n\nvoid bst_inorder(TreeNode* root, int** result, int* count, int* capacity) {\n    if (!root) return;\n    bst_inorder(root->left, result, count, capacity);\n    if (*count >= *capacity) {\n        *capacity *= 2;\n        *result = realloc(*result, *capacity * sizeof(int));\n    }\n    (*result)[(*count)++] = root->val;\n    bst_inorder(root->right, result, count, capacity);\n}\n\nvoid bst_free(TreeNode* root) {\n    if (!root) return;\n    bst_free(root->left);\n    bst_free(root->right);\n    free(root);\n}\n\n// ============================================\n// Main\n// ============================================\nint main() {\n    printf(\"╔═══════════════════════════════════════════╗\\n\");\n    printf(\"║   Aura Polyglot - C Playground           ║\\n\");\n    printf(\"║   C11 Standard                           ║\\n\");\n    printf(\"╚═══════════════════════════════════════════╝\\n\\n\");\n\n    // Fibonacci\n    printf(\"Fibonacci(10): %llu\\n\", fibonacci(10));\n\n    // Primes\n    int prime_count;\n    int* primes = sieve_primes(50, &prime_count);\n    printf(\"Primes ≤ 50: \");\n    for (int i = 0; i < prime_count; i++) printf(\"%d \", primes[i]);\n    printf(\"\\n\");\n    free(primes);\n\n    // Quicksort\n    int arr[] = {64, 34, 25, 12, 22, 11, 90};\n    int n = sizeof(arr) / sizeof(arr[0]);\n    printf(\"Original: \");\n    for (int i = 0; i < n; i++) printf(\"%d \", arr[i]);\n    printf(\"\\n\");\n    quicksort(arr, 0, n - 1);\n    printf(\"Sorted: \");\n    for (int i = 0; i < n; i++) printf(\"%d \", arr[i]);\n    printf(\"\\n\");\n\n    // BST\n    TreeNode* root = NULL;\n    int values[] = {50, 30, 70, 20, 40, 60, 80};\n    for (int i = 0; i < 7; i++) root = bst_insert(root, values[i]);\n    \n    int* inorder = malloc(10 * sizeof(int));\n    int count = 0, capacity = 10;\n    bst_inorder(root, &inorder, &count, &capacity);\n    printf(\"BST Inorder: \");\n    for (int i = 0; i < count; i++) printf(\"%d \", inorder[i]);\n    printf(\"\\n\");\n    free(inorder);\n    bst_free(root);\n\n    printf(\"\\n✅ C module loaded successfully!\\n\");\n    return 0;\n}`
    },
    {
      path: '/c/Makefile',
      content: `# Aura Polyglot C Makefile\n\nCC = gcc\nCFLAGS = -std=c11 -O2 -Wall -Wextra -pedantic\nTARGET = main\nSRC = main.c\n\nall: $(TARGET)\n\n$(TARGET): $(SRC)\n\t$(CC) $(CFLAGS) $(SRC) -o $(TARGET)\n\ndebug: CFLAGS += -g -O0 -fsanitize=address,undefined\ndebug: $(TARGET)\n\nrun: $(TARGET)\n\t./$(TARGET)\n\nclean:\n\trm -f $(TARGET)\n\n.PHONY: all debug run clean`
    },
    {
      path: '/rust/Cargo.toml',
      content: `[package]\nname = "polyglot-rust"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\n\n[[bin]]\nname = "main"\npath = "src/main.rs"`
    },
    {
      path: '/rust/src/main.rs',
      content: `// Aura Polyglot - Rust Entry Point\n// Run: cargo run\n\nfn fibonacci(n: u32) -> u64 {\n    let mut a = 0u64;\n    let mut b = 1u64;\n    for _ in 0..n {\n        let tmp = a + b;\n        a = b;\n        b = tmp;\n    }\n    a\n}\n\nfn sieve_primes(limit: u32) -> Vec<u32> {\n    if limit < 2 { return vec![]; }\n    let mut sieve = vec![true; (limit + 1) as usize];\n    sieve[0] = false;\n    sieve[1] = false;\n    \n    for i in 2..=((limit as f64).sqrt() as u32) {\n        if sieve[i as usize] {\n            for j in (i*i..=limit).step_by(i as usize) {\n                sieve[j as usize] = false;\n            }\n        }\n    }\n    \n    sieve.iter()\n        .enumerate()\n        .filter_map(|(i, &is_prime)| if is_prime { Some(i as u32) } else { None })\n        .collect()\n}\n\nfn quicksort<T: Ord + Clone>(arr: &[T]) -> Vec<T> {\n    if arr.len() <= 1 { return arr.to_vec(); }\n    let pivot = arr[arr.len() / 2].clone();\n    let left: Vec<T> = arr.iter().filter(|x| *x < &pivot).cloned().collect();\n    let middle: Vec<T> = arr.iter().filter(|x| *x == &pivot).cloned().collect();\n    let right: Vec<T> = arr.iter().filter(|x| *x > &pivot).cloned().collect();\n    \n    let mut result = quicksort(&left);\n    result.extend(middle);\n    result.extend(quicksort(&right));\n    result\n}\n\n// Binary Search Tree\n#[derive(Debug)]\nstruct TreeNode<T> {\n    val: T,\n    left: Option<Box<TreeNode<T>>>,\n    right: Option<Box<TreeNode<T>>>,\n}\n\nimpl<T: Ord> TreeNode<T> {\n    fn new(val: T) -> Self {\n        Self { val, left: None, right: None }\n    }\n\n    fn insert(&mut self, val: T) {\n        if val < self.val {\n            match &mut self.left {\n                Some(node) => node.insert(val),\n                None => self.left = Some(Box::new(TreeNode::new(val))),\n            }\n        } else {\n            match &mut self.right {\n                Some(node) => node.insert(val),\n                None => self.right = Some(Box::new(TreeNode::new(val))),\n            }\n        }\n    }\n\n    fn inorder(&self, result: &mut Vec<T>) {\n        if let Some(left) = &self.left {\n            left.inorder(result);\n        }\n        result.push(self.val.clone());\n        if let Some(right) = &self.right {\n            right.inorder(result);\n        }\n    }\n}\n\nfn main() {\n    println!(\"╔═══════════════════════════════════════════╗\");\n    println!(\"║   Aura Polyglot - Rust Playground        ║\");\n    println!(\"║   Rust 2021 Edition                      ║\");\n    println!(\"╚═══════════════════════════════════════════╝\\n\");\n\n    // Fibonacci\n    println!(\"Fibonacci(10): {}\", fibonacci(10));\n\n    // Primes\n    let primes = sieve_primes(50);\n    print!(\"Primes ≤ 50: \");\n    for p in primes { print!(\"{} \", p); }\n    println!();\n\n    // Quicksort\n    let arr = vec![64, 34, 25, 12, 22, 11, 90];\n    print!(\"Original: \");\n    for x in &arr { print!(\"{} \", x); }\n    println!();\n    let sorted = quicksort(&arr);\n    print!(\"Sorted: \");\n    for x in &sorted { print!(\"{} \", x); }\n    println!();\n\n    // BST\n    let mut root = TreeNode::new(50);\n    for v in [30, 70, 20, 40, 60, 80] {\n        root.insert(v);\n    }\n    let mut inorder = Vec::new();\n    root.inorder(&mut inorder);\n    print!(\"BST Inorder: \");\n    for x in inorder { print!(\"{} \", x); }\n    println!();\n\n    println!(\"\\n✅ Rust module loaded successfully!\");\n}`
    }
  ]
};