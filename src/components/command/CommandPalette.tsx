import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronRight, Keyboard, X, Command } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useFileStore } from '@/stores/useFileStore';
import { useEditorStore } from '@/stores/useEditorStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useKeybindingStore, getFormattedBinding } from '@/services/keybindingService';
import { NpmService } from '@/services/npmService';
import { GitHubService } from '@/services/githubService';
import { registerActionHandler } from '@/services/keybindingService';

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void | Promise<void>;
  shortcut?: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<CommandItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { toggleSidebar, toggleBottomPanel, setActiveBottomTab } = useLayoutStore();
  const { createFile, createFolder } = useFileStore();
  const { activeTabId, tabs, closeTab } = useEditorStore();
  const { activeProjectId, projects, setActiveProject, createProject } = useProjectStore();
  const { isMac } = useKeybindingStore();

  const activeTab = activeTabId ? tabs.find(t => t.fileId === activeTabId) : null;
  const activeFile = activeTab;

  const getShortcut = useCallback((action: string) => {
    return getFormattedBinding(action);
  }, []);

  const commands = useMemo((): CommandItem[] => {
    const baseCommands: CommandItem[] = [
      // File Operations
      {
        id: 'file.new',
        title: 'New File',
        description: 'Create a new file',
        category: 'File',
        icon: FilePlus,
        shortcut: getShortcut('file.new'),
        action: () => createFile('untitled.ts', null, false, '// New file\n'),
        keywords: ['new', 'create', 'file'],
      },
      {
        id: 'file.new-folder',
        title: 'New Folder',
        description: 'Create a new folder',
        category: 'File',
        icon: FolderPlus,
        action: () => createFolder('new-folder', null),
        keywords: ['new', 'create', 'folder', 'directory'],
      },
      {
        id: 'file.save',
        title: 'Save',
        description: 'Save the active file',
        category: 'File',
        icon: Save,
        shortcut: getShortcut('file.save'),
        action: () => window.dispatchEvent(new CustomEvent('aura-save-file')),
        keywords: ['save', 'write'],
      },
      {
        id: 'file.save-all',
        title: 'Save All',
        description: 'Save all open files',
        category: 'File',
        icon: SaveAll,
        action: () => window.dispatchEvent(new CustomEvent('aura-save-all')),
        keywords: ['save', 'all'],
      },
      {
        id: 'file.close',
        title: 'Close Tab',
        description: 'Close the active tab',
        category: 'File',
        icon: X,
        shortcut: getShortcut('file.close'),
        action: () => activeTab && closeTab(activeTab.fileId),
        keywords: ['close', 'tab'],
      },

      // Navigation
      {
        id: 'nav.command-palette',
        title: 'Command Palette',
        description: 'Open command palette',
        category: 'Navigation',
        icon: Command,
        shortcut: getShortcut('nav.commandPalette'),
        action: () => {},
        keywords: ['command', 'palette', 'search'],
      },
      {
        id: 'nav.quick-open',
        title: 'Quick Open',
        description: 'Quickly open a file',
        category: 'Navigation',
        icon: Search,
        shortcut: getShortcut('nav.quickOpen'),
        action: () => window.dispatchEvent(new CustomEvent('aura-quick-open')),
        keywords: ['open', 'file', 'goto'],
      },
      {
        id: 'nav.toggle-sidebar',
        title: 'Toggle Sidebar',
        description: 'Show/hide the sidebar',
        category: 'Navigation',
        icon: Sidebar,
        shortcut: getShortcut('nav.toggleSidebar'),
        action: () => toggleSidebar(),
        keywords: ['sidebar', 'explorer', 'toggle'],
      },
      {
        id: 'nav.toggle-panel',
        title: 'Toggle Panel',
        description: 'Show/hide the bottom panel',
        category: 'Navigation',
        icon: PanelBottom,
        shortcut: getShortcut('nav.togglePanel'),
        action: () => toggleBottomPanel(),
        keywords: ['panel', 'terminal', 'bottom', 'toggle'],
      },

      // Runtime
      {
        id: 'runtime.run',
        title: 'Run Code',
        description: 'Execute the active file',
        category: 'Runtime',
        icon: Play,
        shortcut: getShortcut('runtime.run'),
        action: () => {
          setActiveBottomTab('terminal');
          window.dispatchEvent(new CustomEvent('aura-run-code'));
        },
        keywords: ['run', 'execute', 'play', 'start'],
      },
      {
        id: 'runtime.stop',
        title: 'Stop Execution',
        description: 'Stop the running process',
        category: 'Runtime',
        icon: Square,
        action: () => window.dispatchEvent(new CustomEvent('aura-stop-code')),
        keywords: ['stop', 'kill', 'terminate'],
      },
      {
        id: 'runtime.restart',
        title: 'Restart Runtime',
        description: 'Restart the active runtime',
        category: 'Runtime',
        icon: RefreshCw,
        action: () => window.dispatchEvent(new CustomEvent('aura-restart-runtime')),
        keywords: ['restart', 'reload', 'runtime'],
      },

      // View
      {
        id: 'view.zen-mode',
        title: 'Toggle Zen Mode',
        description: 'Enter distraction-free editing',
        category: 'View',
        icon: Maximize2,
        shortcut: getShortcut('view.zenMode'),
        action: () => window.dispatchEvent(new CustomEvent('aura-toggle-zen')),
        keywords: ['zen', 'focus', 'distraction', 'fullscreen'],
      },
      {
        id: 'view.split-editor',
        title: 'Split Editor',
        description: 'Split the editor horizontally',
        category: 'View',
        icon: Columns2,
        action: () => window.dispatchEvent(new CustomEvent('aura-split-editor')),
        keywords: ['split', 'editor', 'horizontal'],
      },

      // Project
      {
        id: 'project.new',
        title: 'New Project',
        description: 'Create a new project from template',
        category: 'Project',
        icon: FolderPlus,
        shortcut: getShortcut('file.new'),
        action: () => window.dispatchEvent(new CustomEvent('aura-new-project')),
        keywords: ['new', 'project', 'create', 'template'],
      },
      {
        id: 'project.open',
        title: 'Open Project',
        description: 'Open an existing project',
        category: 'Project',
        icon: FolderOpen,
        action: () => window.dispatchEvent(new CustomEvent('aura-open-project')),
        keywords: ['open', 'project'],
      },
      {
        id: 'project.clone-github',
        title: 'Clone from GitHub',
        description: 'Clone a GitHub repository',
        category: 'Project',
        icon: GitBranch,
        action: () => window.dispatchEvent(new CustomEvent('aura-clone-github')),
        keywords: ['clone', 'github', 'git', 'repository'],
      },

      // Editor
      {
        id: 'editor.format',
        title: 'Format Document',
        description: 'Format the active file',
        category: 'Editor',
        icon: FileText,
        shortcut: 'Shift+Alt+F',
        action: () => window.dispatchEvent(new CustomEvent('aura-format-document')),
        keywords: ['format', 'prettier', 'beautify'],
      },
      {
        id: 'editor.comment',
        title: 'Toggle Line Comment',
        description: 'Comment/uncomment selected lines',
        category: 'Editor',
        icon: Type,
        shortcut: getShortcut('edit.comment'),
        action: () => window.dispatchEvent(new CustomEvent('aura-toggle-comment')),
        keywords: ['comment', 'uncomment'],
      },
      {
        id: 'editor.find',
        title: 'Find',
        description: 'Find in current file',
        category: 'Editor',
        icon: Search,
        shortcut: getShortcut('edit.find'),
        action: () => window.dispatchEvent(new CustomEvent('aura-find')),
        keywords: ['find', 'search'],
      },
      {
        id: 'editor.replace',
        title: 'Replace',
        description: 'Replace in current file',
        category: 'Editor',
        icon: Replace,
        shortcut: getShortcut('edit.replace'),
        action: () => window.dispatchEvent(new CustomEvent('aura-replace')),
        keywords: ['replace', 'substitute'],
      },

      // Terminal
      {
        id: 'terminal.new',
        title: 'New Terminal',
        description: 'Create a new terminal instance',
        category: 'Terminal',
        icon: Terminal,
        shortcut: getShortcut('nav.toggleTerminal'),
        action: () => window.dispatchEvent(new CustomEvent('aura-new-terminal')),
        keywords: ['terminal', 'shell', 'command', 'prompt'],
      },
      {
        id: 'terminal.clear',
        title: 'Clear Terminal',
        description: 'Clear the active terminal',
        category: 'Terminal',
        icon: Trash2,
        action: () => window.dispatchEvent(new CustomEvent('aura-clear-terminal')),
        keywords: ['clear', 'terminal', 'clean'],
      },

      // Tools
      {
        id: 'tools.npm-search',
        title: 'Search npm Packages',
        description: 'Search and install npm packages',
        category: 'Tools',
        icon: Package,
        action: () => window.dispatchEvent(new CustomEvent('aura-open-npm-search')),
        keywords: ['npm', 'package', 'install', 'dependency'],
      },
      {
        id: 'tools.osv-audit',
        title: 'Security Audit',
        description: 'Run OSV vulnerability audit',
        category: 'Tools',
        icon: Shield,
        action: () => window.dispatchEvent(new CustomEvent('aura-osv-audit')),
        keywords: ['security', 'audit', 'vulnerability', 'osv'],
      },
      {
        id: 'tools.global-search',
        title: 'Global Search',
        description: 'Search across all project files',
        category: 'Tools',
        icon: Search,
        shortcut: 'Cmd+Shift+F',
        action: () => window.dispatchEvent(new CustomEvent('aura-global-search')),
        keywords: ['search', 'find', 'grep', 'global'],
      },
      {
        id: 'tools.dev-docs',
        title: 'Developer Documentation',
        description: 'Open DevDocs/MDN reference',
        category: 'Tools',
        icon: BookOpen,
        action: () => window.dispatchEvent(new CustomEvent('aura-open-devdocs')),
        keywords: ['docs', 'documentation', 'reference', 'mdn'],
      },
    ];

    return baseCommands;
  }, [
    getShortcut,
    createFile,
    createFolder,
    activeTab,
    closeTab,
    toggleSidebar,
    toggleBottomPanel,
    setActiveBottomTab,
    activeProjectId,
    projects,
    setActiveProject,
    createProject,
  ]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Show recent commands first, then all
      const recent = recentCommands
        .map(id => commands.find(c => c.id === id))
        .filter(Boolean) as CommandItem[];
      const others = commands.filter(c => !recentCommands.includes(c.id));
      return [...recent, ...others];
    }

    const q = query.toLowerCase();
    return commands.filter(cmd => 
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q) ||
      cmd.keywords?.some(k => k.toLowerCase().includes(q)) ||
      cmd.shortcut?.toLowerCase().includes(q)
    );
  }, [query, commands, recentCommands]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        scrollIntoView();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        scrollIntoView();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = filteredCommands[selectedIndex];
        if (cmd) {
          executeCommand(cmd);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const scrollIntoView = () => {
    const item = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    item?.scrollIntoView({ block: 'nearest' });
  };

  const executeCommand = (cmd: CommandItem) => {
    // Update recent commands
    setRecentCommands(prev => {
      const filtered = prev.filter(id => id !== cmd.id);
      return [cmd.id, ...filtered].slice(0, 10);
    });

    cmd.action();
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} pointer-events="auto" />
      
      <div 
        className="w-[640px] max-w-[90vw] bg-[#161820]/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-2xl pointer-events-auto animate-slide-down"
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
      >
        <div className="h-12 border-b border-white/[0.06] flex items-center px-4 space-x-3 bg-gradient-to-r from-indigo-600/10 to-cyan-500/10">
          <div className="flex items-center space-x-2 text-white/60">
            <Command className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Command Palette</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={handleInputChange}
            className="flex-1 bg-transparent border-none text-sm text-white placeholder-white/40 focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-white/50">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </span>
        </div>

        <div 
          ref={listRef}
          className="max-h-[400px] overflow-y-auto p-2 space-y-0.5"
          role="listbox"
          aria-label="Available commands"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/40">
              No commands match "{query}"
            </div>
          ) : (
            filteredCommands.map((cmd, i) => {
              const Icon = cmd.icon;
              const isSelected = i === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  data-index={i}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={twMerge(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                    isSelected 
                      ? 'bg-indigo-600/30 text-white' 
                      : 'text-white/80 hover:bg-white/[0.04]'
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/[0.04]">
                      <Icon className={clsx('w-4 h-4', isSelected ? 'text-indigo-300' : 'text-white/60')} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium truncate">{cmd.title}</span>
                        {cmd.description && (
                          <span className="text-[10px] text-white/40 uppercase tracking-wider">{cmd.category}</span>
                        )}
                      </div>
                      {cmd.description && (
                        <p className="text-[11px] text-white/50 truncate mt-0.5">{cmd.description}</p>
                      )}
                    </div>
                  </div>
                  {cmd.shortcut && (
                    <span className={clsx(
                      'text-[10px] font-mono px-2 py-0.5 rounded',
                      isSelected ? 'bg-white/10 text-white/70' : 'bg-white/[0.03] text-white/40'
                    )}>
                      {cmd.shortcut}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-white/[0.06] px-3 py-2 flex items-center justify-between text-[10px] text-white/40">
          <span>{filteredCommands.length} command(s)</span>
          <span>↑↓ Navigate • ⏎ Execute • ESC Close</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Import icons
import { FilePlus, FolderPlus, Save, SaveAll, Sidebar, PanelBottom, Play, Square, RefreshCw, Maximize2, Columns2, FolderOpen, GitBranch, Terminal, Trash2, Package, Shield, BookOpen, Replace, Type, Search } from 'lucide-react';