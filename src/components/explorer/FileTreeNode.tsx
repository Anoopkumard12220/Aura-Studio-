import React from 'react';
import { FileIcon } from './FileIcon';
import { ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface VirtualNode {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  parentId: string | null;
  depth: number;
  expanded: boolean;
  isDirty?: boolean;
  content?: string;
}

interface FileTreeNodeProps {
  node: VirtualNode;
  isActive: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  isActive,
  onClick,
  onContextMenu,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
}) => {
  const indent = node.depth * 16;

  return (
    <div
      className={clsx(
        'flex items-center h-6 px-1 transition-colors',
        isActive && 'bg-indigo-500/10 text-white',
        'hover:bg-white/[0.03]'
      )}
      style={{ paddingLeft: 8 + indent }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {node.isDirectory ? (
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="p-0.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors flex-shrink-0"
          aria-label={node.expanded ? 'Collapse folder' : 'Expand folder'}
        >
          {node.expanded ? (
            <FolderOpen className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      ) : (
        <span className="w-5 flex-shrink-0" />
      )}
      
      <FileIcon 
        name={node.name} 
        isDirectory={node.isDirectory} 
        className="w-4 h-4 flex-shrink-0"
      />
      
      <span 
        className={clsx(
          'flex-1 truncate text-sm font-medium',
          node.isDirty && 'text-amber-400'
        )}
        title={node.path}
      >
        {node.name}
        {node.isDirty && !node.isDirectory && (
          <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
        )}
      </span>
    </div>
  );
};