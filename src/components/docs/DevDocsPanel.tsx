import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, BookOpen, ChevronRight, ChevronDown, Loader2, ExternalLink, Home, Menu, Code } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface DevDocsEntry {
  name: string;
  slug: string;
  version: string;
  description: string;
  tags: string[];
  path: string;
}

interface DevDocsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEVDOCS_API = 'https://devdocs.io/api';
const DOCS_SOURCES = [
  { slug: 'javascript', name: 'JavaScript', icon: '📜' },
  { slug: 'typescript', name: 'TypeScript', icon: '🔷' },
  { slug: 'react', name: 'React', icon: '⚛️' },
  { slug: 'node', name: 'Node.js', icon: '🟢' },
  { slug: 'python', name: 'Python', icon: '🐍' },
  { slug: 'html', name: 'HTML', icon: '🌐' },
  { slug: 'css', name: 'CSS', icon: '🎨' },
  { slug: 'rust', name: 'Rust', icon: '🦀' },
  { slug: 'go', name: 'Go', icon: '🐹' },
  { slug: 'docker', name: 'Docker', icon: '🐳' },
  { slug: 'git', name: 'Git', icon: '📚' },
  { slug: 'bash', name: 'Bash', icon: '💻' },
  { slug: 'sql', name: 'SQL', icon: '🗄️' },
  { slug: 'regex', name: 'Regex', icon: '🔍' },
  { slug: 'markdown', name: 'Markdown', icon: '📝' },
];

export const DevDocsPanel: React.FC<DevDocsPanelProps> = ({ isOpen, onClose }) => {
  const [activeDoc, setActiveDoc] = useState<string>('javascript');
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<DevDocsEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [docContent, setDocContent] = useState<string>('');
  const [contentLoading, setContentLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const loadEntries = useCallback(async (docSlug: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${DEVDOCS_API}/docs/${docSlug}/index.json`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      } else {
        setEntries([]);
      }
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadContent = useCallback(async (docSlug: string, path: string) => {
    setContentLoading(true);
    try {
      const response = await fetch(`${DEVDOCS_API}/docs/${docSlug}${path}`);
      if (response.ok) {
        const html = await response.text();
        setDocContent(html);
      } else {
        setDocContent('<p>Failed to load content</p>');
      }
    } catch {
      setDocContent('<p>Error loading content</p>');
    } finally {
      setContentLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries(activeDoc);
  }, [activeDoc, loadEntries]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      // Reset to all entries for current doc
      loadEntries(activeDoc);
      return;
    }
    const timer = setTimeout(() => {
      // Filter existing entries
      // In a real implementation, you'd use the DevDocs search API
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredEntries = entries.filter(e => 
    e.name.toLowerCase().includes(query.toLowerCase()) ||
    e.tags?.some(t => t.toLowerCase().includes(query.toLowerCase()))
  );

  const handleEntryClick = (entry: DevDocsEntry) => {
    loadContent(activeDoc, entry.path);
    setSelectedIndex(0);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="w-[1000px] max-w-[95vw] max-h-[85vh] bg-[#161820] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Developer Documentation"
      >
        {/* Header */}
        <div className="h-12 border-b border-white/[0.06] flex items-center px-4 space-x-3 bg-gradient-to-r from-indigo-600/10 to-cyan-500/10">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-white">Developer Documentation</span>
          <div className="flex-1" />
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b border-white/[0.06] bg-surface/50 flex items-center gap-3">
          {/* Doc Selector */}
          <div className="relative">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-white/10 rounded-lg text-sm text-white hover:bg-white/5 transition-colors">
              <Code className="w-3 h-3" />
              <span>{DOCS_SOURCES.find(d => d.slug === activeDoc)?.name || activeDoc}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#161820] border border-white/10 rounded-lg shadow-xl overflow-hidden z-10">
              {DOCS_SOURCES.map(doc => (
                <button
                  key={doc.slug}
                  onClick={() => {
                    setActiveDoc(doc.slug);
                    setQuery('');
                  }}
                  className={clsx(
                    'w-full px-3 py-2 text-left text-sm transition-colors',
                    activeDoc === doc.slug ? 'bg-indigo-600/30 text-white' : 'text-white/80 hover:bg-white/[0.03]'
                  )}
                >
                  <span className="mr-2">{doc.icon}</span>
                  {doc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search documentation..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar - Entry List */}
          <div className="w-72 border-r border-white/[0.06] overflow-y-auto flex flex-col">
            <div className="p-3 border-b border-white/10">
              <h4 className="text-xs font-medium text-white/60 uppercase tracking-wider">Contents</h4>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {loading ? (
                <div className="flex items-center justify-center h-full text-white/40">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/40">
                  No entries found
                </div>
              ) : (
                filteredEntries.map((entry, i) => {
                  const isSelected = i === selectedIndex;
                  return (
                    <button
                      key={entry.path}
                      onClick={() => handleEntryClick(entry)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={twMerge(
                        'w-full text-left px-2 py-1.5 rounded transition-colors',
                        isSelected ? 'bg-indigo-600/30 text-white' : 'text-white/70 hover:bg-white/[0.03]'
                      )}
                    >
                      <span className="text-sm font-medium truncate block">{entry.name}</span>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {entry.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50">{tag}</span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {contentLoading ? (
              <div className="h-full flex items-center justify-center text-white/40">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              </div>
            ) : docContent ? (
              <div 
                className="prose prose-invert max-w-none text-white/80"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(docContent) }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/30">
                <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm">Select a topic from the sidebar</p>
                <p className="text-xs mt-1">Documentation powered by DevDocs.io</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-4 py-2 flex items-center justify-between text-[10px] text-white/40">
          <span>Documentation from DevDocs.io & MDN</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

function sanitizeHtml(html: string): string {
  // Basic sanitization - remove scripts, event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

import { useRef } from 'react';