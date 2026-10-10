import React, { useState, useRef } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useFileStore } from '@/stores/useFileStore';
import { ZipService } from '@/services/zipExportService';
import { PersistenceService } from '@/services/persistenceService';
import { localDirectorySync } from '@/services/localDirectorySync';
import { createPortal } from 'react-dom';
import { FolderOpen, Download, Upload, X, HardDrive, Archive, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from '@/components/notifications/ToastNotification';

interface ImportExportMenuProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  projectName: string;
}

export const ImportExportMenu: React.FC<ImportExportMenuProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const { activeProjectId, projects, addProject } = useProjectStore();
  const { files, loadProjectFiles, clearFiles } = useFileStore();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportZip = async () => {
    if (!projectId) return;
    setExporting(true);
    try {
      await ZipService.exportProject(projectName, files);
      toast.success('Project exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export project');
    } finally {
      setExporting(false);
      onClose();
    }
  };

  const handleImportZip = async (file: File) => {
    setImporting(true);
    try {
      const result = await ZipService.importZip(file);
      const newProject = {
        id: 'proj_' + Math.random().toString(36).substring(2, 9),
        name: result.name,
        templateType: 'imported',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastOpenedAt: Date.now(),
      };
      
      addProject(newProject);
      
      // Convert imported files to FileItem format with IDs
      const fileMap: Record<string, any> = {};
      for (const importedFile of result.files) {
        const id = 'f_' + Math.random().toString(36).substring(2, 9);
        fileMap[id] = { ...importedFile, id, isDirty: false };
      }
      
      // Update parent IDs based on path hierarchy
      const pathToId: Record<string, string> = {};
      Object.values(fileMap).forEach((file: any) => {
        pathToId[file.path] = file.id;
      });
      
      Object.values(fileMap).forEach((file: any) => {
        if (file.parentId === null && file.path !== '/') {
          const parentPath = file.path.substring(0, file.path.lastIndexOf('/')) || '/';
          file.parentId = pathToId[parentPath] || null;
        }
      });
      
      loadProjectFiles(fileMap);
      toast.success(`Imported "${result.name}" successfully`);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import project');
    } finally {
      setImporting(false);
      onClose();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImportZip(file);
    e.target.value = '';
  };

  const handleLocalDirectory = async () => {
    try {
      // @ts-ignore - File System Access API
      const handle = await window.showDirectoryPicker();
      await localDirectorySync.initialize(handle);
      const items = await localDirectorySync.readDirectory(handle);
      
      const newProject = {
        id: 'proj_' + Math.random().toString(36).substring(2, 9),
        name: handle.name,
        templateType: 'local',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastOpenedAt: Date.now(),
      };
      
      addProject(newProject);
      
      // Convert to file map
      const fileMap: Record<string, any> = {};
      for (const item of items) {
        const id = 'f_' + Math.random().toString(36).substring(2, 9);
        fileMap[id] = { ...item, id, isDirty: false };
      }
      
      // Update parent IDs
      const pathToId: Record<string, string> = {};
      Object.values(fileMap).forEach((file: any) => {
        pathToId[file.path] = file.id;
      });
      
      Object.values(fileMap).forEach((file: any) => {
        if (file.parentId === null && file.path !== '/') {
          const parentPath = file.path.substring(0, file.path.lastIndexOf('/')) || '/';
          file.parentId = pathToId[parentPath] || null;
        }
      });
      
      loadProjectFiles(fileMap);
      toast.success(`Opened local folder "${handle.name}"`);
      onClose();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Directory pick failed:', error);
        toast.error('Failed to open local folder');
      }
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/95 backdrop-blur-sm">
      <div className="bg-frame border border-white/10 rounded-xl overflow-hidden w-full max-w-md mx-4 glass-strong animate-fade-in">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Import / Export</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          <div className="border-t border-white/10 pt-4">
            <h3 className="text-sm font-medium text-white/70 mb-3">Export Project</h3>
            <button
              onClick={handleExportZip}
              disabled={!projectId || exporting}
              className={twMerge(
                'w-full px-4 py-3 rounded-lg border flex items-center justify-center gap-3 text-left transition-colors',
                'border-white/10 hover:border-white/20',
                exporting ? 'opacity-50 cursor-wait' : ''
              )}
            >
              <Archive className="w-5 h-5 text-white/60" />
              <div className="text-left">
                <p className="text-sm font-medium text-white">Export as ZIP</p>
                <p className="text-xs text-white/40">Download complete project archive</p>
              </div>
              {exporting && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
            </button>
          </div>
          
          <div className="border-t border-white/10 pt-4">
            <h3 className="text-sm font-medium text-white/70 mb-3">Import Project</h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className={twMerge(
                'w-full px-4 py-3 rounded-lg border flex items-center justify-center gap-3 text-left transition-colors',
                'border-white/10 hover:border-white/20',
                importing ? 'opacity-50 cursor-wait' : ''
              )}
            >
              <Upload className="w-5 h-5 text-white/60" />
              <div className="text-left">
                <p className="text-sm font-medium text-white">Import from ZIP</p>
                <p className="text-xs text-white/40">Select a .zip file to import</p>
              </div>
              {importing && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          
          <div className="border-t border-white/10 pt-4">
            <button
              onClick={handleLocalDirectory}
              className={twMerge(
                'w-full px-4 py-3 rounded-lg border flex items-center justify-center gap-3 text-left transition-colors',
                'border-white/10 hover:border-white/20'
              )}
            >
              <HardDrive className="w-5 h-5 text-white/60" />
              <div className="text-left">
                <p className="text-sm font-medium text-white">Open Local Folder</p>
                <p className="text-xs text-white/40">Sync with a folder on your disk</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};