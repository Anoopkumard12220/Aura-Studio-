import { ProjectTemplate } from './index';

export const cppAlgorithmTemplate: ProjectTemplate = {
  id: 'cpp-algorithm',
  name: 'C++ Algorithm & Console',
  description: 'C++17 standard library sandbox for algorithms, data structures, and competitive programming.',
  category: 'systems',
  language: 'C++',
  iconName: 'Cpu',
  badge: 'C++17',
  defaultRunCommand: 'make && ./main',
  files: [
    {
      path: '/main.cpp',
      content: `// Aura Studio - C++ Algorithm Sandbox\n// Compile: g++ -O2 -std=c++17 main.cpp -o main\n\n#include <bits/stdc++.h>\nusing namespace std;\n\n// ============================================\n// Utility: Timer for benchmarking\n// ============================================\nclass Timer {\n    chrono::high_resolution_clock::time_point start;\npublic:\n    Timer() : start(chrono::high_resolution_clock::now()) {}\n    ~Timer() {\n        auto end = chrono::high_resolution_clock::now();\n        auto duration = chrono::duration_cast<chrono::microseconds>(end - start);\n        cout << \"⏱  Elapsed: \" << duration.count() << \" µs\" << endl;\n    }\n};\n\n// ============================================\n// Algorithm Implementations\n// ============================================\n\n// Binary Search - O(log n)\nint binarySearch(const vector<int>& arr, int target) {\n    int left = 0, right = arr.size() - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (arr[mid] == target) return mid;\n        if (arr[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}\n\n// Quick Sort - O(n log n) average\nvoid quickSort(vector<int>& arr, int low, int high) {\n    if (low >= high) return;\n    int pivot = arr[high];\n    int i = low - 1;\n    for (int j = low; j < high; j++) {\n        if (arr[j] <= pivot) swap(arr[++i], arr[j]);\n    }\n    swap(arr[i + 1], arr[high]);\n    int pi = i + 1;\n    quickSort(arr, low, pi - 1);\n    quickSort(arr, pi + 1, high);\n}\n\n// Merge Sort - O(n log n) guaranteed\nvoid merge(vector<int>& arr, int l, int m, int r) {\n    vector<int> left(arr.begin() + l, arr.begin() + m + 1);\n    vector<int> right(arr.begin() + m + 1, arr.begin() + r + 1);\n    int i = 0, j = 0, k = l;\n    while (i < (int)left.size() && j < (int)right.size()) {\n        arr[k++] = (left[i] <= right[j]) ? left[i++] : right[j++];\n    }\n    while (i < (int)left.size()) arr[k++] = left[i++];\n    while (j < (int)right.size()) arr[k++] = right[j++];\n}\n\nvoid mergeSort(vector<int>& arr, int l, int r) {\n    if (l >= r) return;\n    int m = l + (r - l) / 2;\n    mergeSort(arr, l, m);\n    mergeSort(arr, m + 1, r);\n    merge(arr, l, m, r);\n}\n\n// Heap Sort - O(n log n)\nvoid heapify(vector<int>& arr, int n, int i) {\n    int largest = i;\n    int left = 2 * i + 1;\n    int right = 2 * i + 2;\n    if (left < n && arr[left] > arr[largest]) largest = left;\n    if (right < n && arr[right] > arr[largest]) largest = right;\n    if (largest != i) {\n        swap(arr[i], arr[largest]);\n        heapify(arr, n, largest);\n    }\n}\n\nvoid heapSort(vector<int>& arr) {\n    int n = arr.size();\n    for (int i = n / 2 - 1; i >= 0; i--) heapify(arr, n, i);\n    for (int i = n - 1; i > 0; i--) {\n        swap(arr[0], arr[i]);\n        heapify(arr, i, 0);\n    }\n}\n\n// Kadane's Algorithm - Max Subarray Sum - O(n)\nint maxSubarraySum(const vector<int>& arr) {\n    int maxSoFar = arr[0], maxEndingHere = arr[0];\n    for (size_t i = 1; i < arr.size(); i++) {\n        maxEndingHere = max(arr[i], maxEndingHere + arr[i]);\n        maxSoFar = max(maxSoFar, maxEndingHere);\n    }\n    return maxSoFar;\n}\n\n// Two Pointer - Pair Sum in Sorted Array\nbool twoSum(const vector<int>& arr, int target) {\n    int left = 0, right = arr.size() - 1;\n    while (left < right) {\n        int sum = arr[left] + arr[right];\n        if (sum == target) return true;\n        if (sum < target) left++;\n        else right--;\n    }\n    return false;\n}\n\n// Graph: Dijkstra's Shortest Path\nusing Graph = vector<vector<pair<int, int>>>;\n\nvector<int> dijkstra(const Graph& graph, int src) {\n    int n = graph.size();\n    vector<int> dist(n, INT_MAX);\n    dist[src] = 0;\n    using P = pair<int, int>;\n    priority_queue<P, vector<P>, greater<P>> pq;\n    pq.emplace(0, src);\n    \n    while (!pq.empty()) {\n        auto [d, u] = pq.top(); pq.pop();\n        if (d > dist[u]) continue;\n        for (auto [v, w] : graph[u]) {\n            if (dist[v] > dist[u] + w) {\n                dist[v] = dist[u] + w;\n                pq.emplace(dist[v], v);\n            }\n        }\n    }\n    return dist;\n}\n\n// ============================================\n// Data Structures\n// ============================================\n\n// Disjoint Set Union (Union-Find)\nstruct DSU {\n    vector<int> parent, rank;\n    DSU(int n = 0) : parent(n), rank(n, 0) {\n        iota(parent.begin(), parent.end(), 0);\n    }\n    int find(int x) {\n        return parent[x] == x ? x : parent[x] = find(parent[x]);\n    }\n    bool unite(int a, int b) {\n        a = find(a); b = find(b);\n        if (a == b) return false;\n        if (rank[a] < rank[b]) swap(a, b);\n        parent[b] = a;\n        if (rank[a] == rank[b]) rank[a]++;\n        return true;\n    }\n};\n\n// ============================================\n// Main Demo\n// ============================================\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    \n    cout << \"╔═══════════════════════════════════════════╗\\n\";\n    cout << \"║   Aura Studio - C++ Algorithm Sandbox   ║\\n\";\n    cout << \"║           C++17 / Clang-WASM Ready       ║\\n\";\n    cout << \"╚═══════════════════════════════════════════╝\\n\\n\";\n\n    // Test data\n    vector<int> data = {64, 34, 25, 12, 22, 11, 90, 5, 77, 30};\n    vector<int> sorted = data;\n    sort(sorted.begin(), sorted.end());\n\n    // 1. Binary Search\n    cout << \"🔍 Binary Search:\" << endl;\n    cout << \"   Array: \";\n    for (int x : sorted) cout << x << ' ';\n    cout << \"\\n   Search 22: Index \" << binarySearch(sorted, 22) << endl;\n    cout << \"   Search 100: Index \" << binarySearch(sorted, 100) << \" (not found)\\n\";\n\n    // 2. Sorting Benchmarks\n    cout << \"\\n📊 Sorting Benchmarks (10,000 elements):\" << endl;\n    \n    vector<int> testData(10000);\n    iota(testData.begin(), testData.end(), 1);\n    random_device rd;\n    mt19937 g(rd());\n    shuffle(testData.begin(), testData.end(), g);\n\n    auto runSort = [&](const string& name, auto sortFn) {\n        vector<int> copy = testData;\n        cout << \"   \" << name << \": \";\n        Timer t;\n        sortFn(copy);\n        cout << (is_sorted(copy.begin(), copy.end()) ? \"✅\" : \"❌\") << endl;\n    };\n\n    runSort(\"std::sort    \", [](auto& v) { sort(v.begin(), v.end()); });\n    runSort(\"Quick Sort   \", [](auto& v) { quickSort(v, 0, v.size() - 1); });\n    runSort(\"Merge Sort   \", [](auto& v) { mergeSort(v, 0, v.size() - 1); });\n    runSort(\"Heap Sort    \", [](auto& v) { heapSort(v); });\n\n    // 3. Kadane's Algorithm\n    cout << \"\\n📈 Kadane's Max Subarray:\" << endl;\n    vector<int> nums = {-2, 1, -3, 4, -1, 2, 1, -5, 4};\n    cout << \"   Array: \";\n    for (int x : nums) cout << x << ' ';\n    cout << \"\\n   Max Sum: \" << maxSubarraySum(nums) << \" (subarray: [4, -1, 2, 1])\\n\";\n\n    // 4. Two Pointer\n    cout << \"\\n🎯 Two Pointer - Pair Sum:\" << endl;\n    cout << \"   Array: \";\n    for (int x : sorted) cout << x << ' ';\n    cout << \"\\n   Target 42: \" << (twoSum(sorted, 42) ? \"Found (12+30)\" : \"Not found\") << endl;\n    cout << \"   Target 200: \" << (twoSum(sorted, 200) ? \"Found\" : \"Not found\") << endl;\n\n    // 5. Graph - Dijkstra\n    cout << \"\\n🗺️  Dijkstra Shortest Path:\" << endl;\n    Graph graph(5);\n    graph[0].emplace_back(1, 4);\n    graph[0].emplace_back(2, 1);\n    graph[1].emplace_back(3, 1);\n    graph[2].emplace_back(1, 2);\n    graph[2].emplace_back(3, 5);\n    graph[3].emplace_back(4, 3);\n    \n    auto dist = dijkstra(graph, 0);\n    cout << \"   Distances from node 0: \";\n    for (size_t i = 0; i < dist.size(); i++) {\n        cout << \"dist[\" << i << \"]=\" << (dist[i] == INT_MAX ? -1 : dist[i]) << \" \";\n    }\n    cout << endl;\n\n    // 6. Union-Find\n    cout << \"\\n🔗 Union-Find (DSU):\" << endl;\n    DSU dsu(10);\n    dsu.unite(1, 2);\n    dsu.unite(2, 3);\n    dsu.unite(4, 5);\n    cout << \"   1 and 3 connected: \" << (dsu.find(1) == dsu.find(3) ? \"Yes\" : \"No\") << endl;\n    cout << \"   1 and 4 connected: \" << (dsu.find(1) == dsu.find(4) ? \"Yes\" : \"No\") << endl;\n\n    cout << \"\\n════════════════════════════════════════════\\n\";\n    cout << \"✨ Edit main.cpp to add your algorithms!\\n\";\n    cout << \"💡 Tip: Use #include <bits/stdc++.h> for all STL\\n\";\n    \n    return 0;\n}`
    },
    {
      path: '/Makefile',
      content: `# Aura Studio C++ Makefile\n# Compatible with g++, clang++, and emscripten (WASM)\n\nCXX = g++\nCXXFLAGS = -O2 -std=c++17 -Wall -Wextra -pedantic\nTARGET = main\nSRC = main.cpp\n\n# Default target\nall: $(TARGET)\n\n$(TARGET): $(SRC)\n\t$(CXX) $(CXXFLAGS) $(SRC) -o $(TARGET)\n\n# WebAssembly target (requires emscripten SDK)\nwasm: $(SRC)\n\tem++ $(CXXFLAGS) $(SRC) -o main.html -s EXPORTED_RUNTIME_METHODS='[\"ccall\",\"cwrap\"]' -s MODULARIZE=1\n\n# Debug build\ndebug: CXXFLAGS += -g -O0 -fsanitize=address,undefined\ndebug: $(TARGET)\n\n# Run\nrun: $(TARGET)\n\t./$(TARGET)\n\n# Clean\nclean:\n\trm -f $(TARGET) main.html main.js main.wasm\n\n.PHONY: all wasm debug run clean`
    },
    {
      path: '/README.md',
      content: `# C++ Algorithm Sandbox

C++17 standard library environment for algorithms, data structures, and competitive programming.

## Compilation

### Native (g++/clang++)
\`\`\`bash
make          # Optimized build (-O2)
make debug    # Debug build with sanitizers
make run      # Build and run
\`\`\`

### WebAssembly (Emscripten)
\`\`\`bash
make wasm     # Generates main.html, main.js, main.wasm
\`\`\`

## Features Included
- ✅ **Sorting**: Quick, Merge, Heap, std::sort benchmarking
- ✅ **Search**: Binary search, Two-pointer technique
- ✅ **Dynamic Programming**: Kadane's max subarray
- ✅ **Graph Algorithms**: Dijkstra's shortest path
- ✅ **Data Structures**: Union-Find (DSU)
- ✅ **Utilities**: High-resolution timer, random generators

## In-Browser (WebAssembly) Notes
- Uses Emscripten for WASM compilation
- File I/O via virtual filesystem (IndexedDB)
- No networking or threading (pthreads optional)
- Console I/O redirected to browser terminal

## Standards
- C++17 (`-std=c++17`)
- `<bits/stdc++.h>` for all STL headers
- `-O2` optimization by default
- Sanitizers available in debug mode`
    }
  ]
};