import { ProjectTemplate } from './index';

export const pythonDataScienceTemplate: ProjectTemplate = {
  id: 'python-data-science',
  name: 'Python Data Science',
  description: 'NumPy, Pandas, Matplotlib sandbox for data analysis and visualization in-browser.',
  category: 'datascience',
  language: 'Python',
  iconName: 'Brain',
  badge: 'Pyodide Ready',
  defaultRunCommand: 'python main.py',
  files: [
    {
      path: '/main.py',
      content: `# Aura Studio - Python Data Science Sandbox\n# Runs in-browser via Pyodide (CPython WebAssembly)\n\nimport numpy as np\nimport matplotlib\nmatplotlib.use('Agg')\nimport matplotlib.pyplot as plt\nimport json\nimport sys\n\nprint("🔬 Aura Studio - Python Data Science")\nprint("=" * 50)\n\n# 1. NumPy Matrix Operations\nprint("\\n📐 Matrix Operations:")\nprint("-" * 30)\n\nA = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])\nB = np.array([[9, 8, 7], [6, 5, 4], [3, 2, 1]])\n\nprint(f"Matrix A:\\n{A}")\nprint(f"\\nMatrix B:\\n{B}")\nprint(f"\\nA + B:\\n{A + B}")\nprint(f"\\nA @ B (matrix multiply):\\n{A @ B}")\nprint(f"\\nDeterminant of A: {np.linalg.det(A):.4f}")\nprint(f"\\nEigenvalues of A: {np.linalg.eigvals(A)}")\n\n# 2. Statistical Analysis\nprint("\\n\\n📊 Statistical Analysis:")\nprint("-" * 30)\n\ndata = np.random.normal(100, 15, 1000)\nprint(f"Sample size: {len(data)}")\nprint(f"Mean: {np.mean(data):.2f}")\nprint(f"Std Dev: {np.std(data):.2f}")\nprint(f"Median: {np.median(data):.2f}")\nprint(f"Min/Max: {np.min(data):.2f} / {np.max(data):.2f}")\nprint(f"25th/75th Percentile: {np.percentile(data, 25):.2f} / {np.percentile(data, 75):.2f}")\n\n# 3. Linear Regression Example\nprint("\\n\\n📈 Linear Regression:")\nprint("-" * 30)\n\nnp.random.seed(42)\nx = np.linspace(0, 10, 50)\ny = 2.5 * x + 1.2 + np.random.normal(0, 2, 50)\n\nA_design = np.vstack([x, np.ones(len(x))]).T\nm, c = np.linalg.lstsq(A_design, y, rcond=None)[0]\nprint(f"True: y = 2.5x + 1.2")\nprint(f"Fit:  y = {m:.2f}x + {c:.2f}")\nprint(f"R²: {1 - np.sum((y - (m*x + c))**2) / np.sum((y - np.mean(y))**2):.4f}")\n\n# 4. Generate Visualization (saved as base64)\nprint("\\n\\n🎨 Generating Plot...")\nfig, axes = plt.subplots(2, 2, figsize=(10, 8))\nfig.patch.set_facecolor('#0a0b0e')\n\ncolors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b']\n\n# Plot 1: Histogram\naxes[0, 0].hist(data, bins=30, color=colors[0], alpha=0.8, edgecolor='#111217')\naxes[0, 0].set_title('Normal Distribution', color='#f0f6fc')\naxes[0, 0].set_facecolor('#161820')\naxes[0, 0].tick_params(colors='#8b949e')\n\n# Plot 2: Scatter with regression line\naxes[0, 1].scatter(x, y, alpha=0.6, color=colors[1], s=30)\naxes[0, 1].plot(x, m*x + c, color=colors[2], linewidth=2)\naxes[0, 1].set_title('Linear Regression', color='#f0f6fc')\naxes[0, 1].set_facecolor('#161820')\naxes[0, 1].tick_params(colors='#8b949e')\n\n# Plot 3: Eigenvalues\nreal_parts = np.real(np.linalg.eigvals(A))\nimag_parts = np.imag(np.linalg.eigvals(A))\naxes[1, 0].scatter(real_parts, imag_parts, color=colors[2], s=100)\naxes[1, 0].axhline(y=0, color='#545d68', linestyle='--', alpha=0.5)\naxes[1, 0].axvline(x=0, color='#545d68', linestyle='--', alpha=0.5)\naxes[1, 0].set_title('Eigenvalues of Matrix A', color='#f0f6fc')\naxes[1, 0].set_facecolor('#161820')\naxes[1, 0].tick_params(colors='#8b949e')\n\n# Plot 4: Correlation heatmap\ncorr_data = np.random.randn(5, 5)\ncorr_matrix = np.corrcoef(corr_data)\nim = axes[1, 1].imshow(corr_matrix, cmap='RdBu_r', vmin=-1, vmax=1)\naxes[1, 1].set_title('Correlation Matrix', color='#f0f6fc')\naxes[1, 1].set_facecolor('#161820')\nplt.colorbar(im, ax=axes[1, 1])\n\nfor ax in axes.flat:\n    ax.set_xticklabels([])\n    ax.set_yticklabels([])\n    for spine in ax.spines.values():\n        spine.set_color('#545d68')\n\nplt.tight_layout()\nplt.savefig('/tmp/aura_plot.png', facecolor='#0a0b0e', dpi=150, bbox_inches='tight')\nprint("✅ Plot saved to /tmp/aura_plot.png")\n\n# 5. Data Processing with Structured Arrays\nprint("\\n\\n🗂️  Structured Data Processing:")\nprint("-" * 30)\n\ndtype = [('name', 'U20'), ('score', 'f4'), ('category', 'U10')]\nrecords = np.array([\n    ('Alice', 95.5, 'A'),\n    ('Bob', 87.2, 'B'),\n    ('Charlie', 91.8, 'A'),\n    ('Diana', 78.9, 'C'),\n    ('Eve', 93.1, 'A'),\n], dtype=dtype)\n\nprint(f"Records:\\n{records}")\nprint(f"\\nCategory A average: {np.mean(records[records['category'] == 'A']['score']):.1f}")\nprint(f"Top scorer: {records[np.argmax(records['score'])]['name']}")\n\nprint("\\n" + "=" * 50)\nprint("✨ Edit main.py to explore your own data!")\nprint("💡 Tip: Use pandas for DataFrames, matplotlib/seaborn for plots")'
    },
    {
      path: '/requirements.txt',
      content: `numpy>=1.26.0\npandas>=2.1.0\nmatplotlib>=3.8.0\nscipy>=1.11.0`
    },
    {
      path: '/README.md',
      content: `# Python Data Science Sandbox

This project runs in-browser using **Pyodide** - a WebAssembly port of CPython.

## Features
- ✅ NumPy for numerical computing
- ✅ Pandas for data manipulation  
- ✅ Matplotlib for visualization
- ✅ SciPy for scientific computing
- ✅ Full access to Python standard library

## Running
\`\`\`bash
python main.py
\`\`\`

## In-Browser Limitations
- No network access (use local data or bundled datasets)
- File system is virtual (IndexedDB-backed)
- Some C-extensions may not be available
- Matplotlib uses 'Agg' backend (non-interactive)

## Tips
- Use \`plt.savefig()\` to generate images
- Data persists via IndexedDB in Aura Studio
- Install additional packages via micropip in the terminal`
    },
    {
      path: '/data_analysis.py',
      content: `# Extended Data Analysis Example\n\nimport numpy as np\nimport json\n\n# Simulated dataset: E-commerce transactions\nnp.random.seed(42)\nn_transactions = 10000\n\n# Generate synthetic data\nuser_ids = np.random.randint(1, 1001, n_transactions)\nproduct_ids = np.random.randint(1, 101, n_transactions)\nprices = np.random.lognormal(3, 0.5, n_transactions).round(2)\nquantities = np.random.poisson(2, n_transactions) + 1\ntimestamps = np.random.randint(1704067200, 1706745600, n_transactions)  # Jan 2024\n\n# Revenue per user\nrevenue = prices * quantities\nuser_revenue = np.bincount(user_ids, weights=revenue)\n\n# Top customers\ntop_users = np.argsort(user_revenue)[::-1][:10]\nprint("🏆 Top 10 Customers by Revenue:")\nfor i, uid in enumerate(top_users, 1):\n    print(f"  {i:2d}. User {uid}: ${user_revenue[uid]:.2f}")\n\n# Product performance\nproduct_revenue = np.bincount(product_ids, weights=revenue)\ntop_products = np.argsort(product_revenue)[::-1][:5]\nprint("\\n📦 Top 5 Products:")\nfor i, pid in enumerate(top_products, 1):\n    print(f"  {i}. Product {pid}: ${product_revenue[pid]:.2f}")\n\n# Daily revenue trend\ndays = (timestamps - timestamps.min()) // 86400\ndaily_revenue = np.bincount(days, weights=revenue, minlength=days.max() + 1)\nprint(f"\\n📅 Daily Revenue Range: ${daily_revenue.min():.2f} - ${daily_revenue.max():.2f}")\nprint(f"Average Daily: ${daily_revenue.mean():.2f}")\nprint(f"Total Revenue: ${revenue.sum():.2f}")\n\n# Export summary as JSON\nsummary = {\n    "total_transactions": int(n_transactions),\n    "unique_users": int(len(np.unique(user_ids))),\n    "unique_products": int(len(np.unique(product_ids))),\n    "total_revenue": float(revenue.sum()),\n    "avg_order_value": float(revenue.mean()),\n    "top_customer": {"id": int(top_users[0]), "revenue": float(user_revenue[top_users[0]])}\n}\n\nwith open('/tmp/summary.json', 'w') as f:\n    json.dump(summary, f, indent=2)\n\nprint("\\n💾 Summary exported to /tmp/summary.json")`
    }
  ]
};