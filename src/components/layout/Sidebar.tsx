import React from 'react';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { FileExplorer } from '../explorer/FileExplorer';
import { QuickOpenModal } from '../search/QuickOpenModal';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Sidebar: React.FC = () => {
  const { activeActivityTab, isSidebarOpen, sidebarWidth, setSidebarWidth } = useLayoutStore();

  if (!isSidebarOpen) return null;

  const renderContent = () => {
    switch (activeActivityTab) {
      case 'files':
        return <FileExplorer />;
      case 'search':
        return (
          <div className="h-full flex flex-col bg-surface border-l border-white/[0.06]">
            <div className="p-3 border-b border-white/[0.06]">
              <input
                type="text"
                placeholder="Search in files..."
                className="w-full px-3 py-2 bg-canvas border border-white/10 rounded text-sm text-white placeholder:text-muted focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex-1 overflow-auto p-3 text-secondary text-sm">
              Search results will appear here
            </div>
          </div>
        );
      case 'git':
        return (
          <div className="h-full flex flex-col bg-surface border-l border-white/[0.06]">
            <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-sm font-medium text-white">Source Control</span>
            </div>
            <div className="flex-1 overflow-auto p-3 text-secondary text-sm">
              Git integration coming soon
            </div>
          </div>
        );
      case 'packages':
        return (
          <div className="h-full flex flex-col bg-surface border-l border-white/[0.06]">
            <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-sm font-medium text-white">Packages</span>
            </div>
            <div className="flex-1 overflow-auto p-3 text-secondary text-sm">
              Package manager coming soon
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="h-full flex flex-col bg-surface border-l border-white/[0.06]">
            <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-sm font-medium text-white">Settings</span>
            </div>
            <div className="flex-1 overflow-auto p-3 text-secondary text-sm">
              Settings panel coming soon
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={twMerge(
        'flex flex-col h-full bg-surface border-r border-white/[0.06] transition-all duration-150',
        'overflow-hidden'
      )}
      style={{ width: sidebarWidth }}
    >
      {renderContent()}
    </div>
  );
};