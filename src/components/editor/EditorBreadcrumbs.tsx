import React from 'react';
import { useFileStore } from '@/stores/useFileStore';
import { ChevronRight, File, Folder } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const EditorBreadcrumbs: React.FC = () => {
  const { activeFileId, files } = useFileStore();
  
  if (!activeFileId || !files[activeFileId]) return null;

  const activeFile = files[activeFileId];
  const pathParts = activeFile.path.split('/').filter(Boolean);
  
  const breadcrumbs = pathParts.map((part, index) => {
    const isLast = index === pathParts.length - 1;
    const currentPath = '/' + pathParts.slice(0, index + 1).join('/');
    const isDirectory = !isLast || activeFile.isDirectory;
    
    return { name: part, path: currentPath, isLast, isDirectory };
  });

  return (
    <div className="h-7 bg-frame border-b border-white/[0.06] flex items-center px-3 overflow-x-auto">
      <div className="flex items-center space-x-1 min-w-max">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-white/30 flex-shrink-0" />
            )}
            <button
              className={twMerge(
                'flex items-center gap-1 px-1.5 py-1 rounded text-xs transition-colors',
                'text-white/70 hover:text-white hover:bg-white/10',
                crumb.isLast && 'text-white font-medium'
              )}
              title={crumb.path}
            >
              {crumb.isDirectory ? (
                <Folder className="w-3 h-3" />
              ) : (
                <File className="w-3 h-3" />
              )}
              <span className="truncate max-w-[150px]">{crumb.name}</span>
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};