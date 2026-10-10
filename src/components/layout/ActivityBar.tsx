import React from 'react';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { 
  FileText, 
  Search, 
  GitBranch, 
  Settings, 
  Package,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const activityTabs = [
  { id: 'files' as const, icon: FileText, label: 'Explorer', shortcut: 'Cmd+1' },
  { id: 'search' as const, icon: Search, label: 'Search', shortcut: 'Cmd+2' },
  { id: 'git' as const, icon: GitBranch, label: 'Source Control', shortcut: 'Cmd+3' },
  { id: 'packages' as const, icon: Package, label: 'Packages', shortcut: 'Cmd+4' },
  { id: 'settings' as const, icon: Settings, label: 'Settings', shortcut: 'Cmd+,' },
] as const;

export const ActivityBar: React.FC = () => {
  const { activeActivityTab, setActiveActivityTab, isSidebarOpen, toggleSidebar } = useLayoutStore();

  return (
    <div className="flex flex-col h-full w-12 bg-[#111217] border-r border-white/[0.06] flex-shrink-0">
      <div className="flex flex-col flex-1 items-center pt-3 space-y-1 overflow-hidden">
        {activityTabs.map(({ id, icon: Icon, label, shortcut }) => (
          <button
            key={id}
            onClick={() => setActiveActivityTab(id)}
            className={twMerge(
              'relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150',
              'text-white/60 hover:text-white hover:bg-white/[0.06]',
              activeActivityTab === id 
                ? 'text-indigo-400 bg-indigo-500/10' 
                : ''
            )}
            title={`${label} (${shortcut})`}
            aria-label={`${label} (${shortcut})`}
            aria-pressed={activeActivityTab === id}
            role="tab"
          >
            <Icon className="w-5 h-5" />
            <span className="absolute left-full ml-2 px-2 py-1 text-xs bg-[#1c1e29] border border-white/10 rounded whitespace-nowrap opacity-0 invisible transition-all group-hover:opacity-100 group-hover:visible pointer-events-none">
              {label}
            </span>
          </button>
        ))}
      </div>
      
      <div className="p-2 border-t border-white/[0.06]">
        <button
          onClick={toggleSidebar}
          className={twMerge(
            'w-full h-8 rounded-lg flex items-center justify-center transition-colors',
            'text-white/50 hover:text-white hover:bg-white/[0.06]'
          )}
          title={isSidebarOpen ? 'Collapse Sidebar (Cmd+B)' : 'Expand Sidebar (Cmd+B)'}
          aria-label={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};