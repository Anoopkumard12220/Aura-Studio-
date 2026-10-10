import React, { useState, useCallback, useMemo } from 'react';
import { useFileStore } from '@/stores/useFileStore';
import { FileTreeNode } from './FileTreeNode';
import { FixedSizeList as List } from 'react-window';
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

export const FileExplorer: React.FC = () => {
  const { 
    files, 
    expandedFolderIds, 
    activeFileId, 
    openFile, 
    toggleFolder,
    createFile,
    deleteFile,
    renameFile,
  } = useFileStore();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string | null } | null>(null);

  const buildVirtualTree = useCallback((): VirtualNode[] => {
    const result: VirtualNode[] = [];
    
    const traverse = (parentId: string | null, depth: number) => {
      const children = Object.values(files).filter(f => f.parentId === parentId);
      children.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      
      for (const child of children) {
        const expanded = expandedFolderIds.has(child.id);
        result.push({
          id: child.id,
          name: child.name,
          path: child.path,
          isDirectory: child.isDirectory,
          parentId: child.parentId,
          depth,
          expanded,
          isDirty: child.isDirty,
          content: child.content,
        });
        
        if (child.isDirectory && expanded) {
          traverse(child.id, depth + 1);
        }
      }
    };
    
    traverse(null, 0);
    return result;
  }, [files, expandedFolderIds]);

  const virtualNodes = useMemo(() => buildVirtualTree(), [buildVirtualTree]);

  const ItemRenderer = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const node = virtualNodes[index];
    return (
      <div style={style}>
        <FileTreeNode
          node={node}
          isActive={activeFileId === node.id}
          onClick={() => {
            if (!node.isDirectory) openFile(node.id);
            else toggleFolder(node.id);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, fileId: node.id });
          }}
          onCreateFile={() => {
            const newId = createFile('new-file.txt', node.id, false, '');
            openFile(newId);
          }}
          onCreateFolder={() => {
            createFile('new-folder', node.id, true);
            toggleFolder(node.id);
          }}
          onRename={() => {
            const newName = prompt('Rename to:', node.name);
            if (newName && newName !== node.name) renameFile(node.id, newName);
          }}
          onDelete={() => {
            if (confirm(`Delete ${node.name}?`)) deleteFile(node.id);
          }}
        />
      </div>
    );
  };

  const handleClickOutside = () => setContextMenu(null);

  return (
    <div 
      className="flex flex-col h-full bg-surface"
      onClick={handleClickOutside}
    >
      <div className="p-2 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Files</span>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors" title="New File">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </button>
          <button className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors" title="New Folder">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors" title="Refresh">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto scrollbar-thin">
        <List
          height={600}
          itemCount={virtualNodes.length}
          itemSize={24}
          width="100%"
          itemData={virtualNodes}
        >
          {ItemRenderer}
        </List>
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 bg-raised border border-white/10 rounded shadow-xl min-w-[160px] animate-fade-in"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="py-1">
            <button className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              New File
            </button>
            <button className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              New Folder
            </button>
            <div className="h-px bg-white/10 my-1" />
            <button className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              Rename
            </button>
            <button className="w-full px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-400/10 flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};