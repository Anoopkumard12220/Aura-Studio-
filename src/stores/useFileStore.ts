import { create } from 'zustand';
import { FileItem } from '@/types/files';

interface FileState {
  files: Record<string, FileItem>;
  openFileIds: string[];
  activeFileId: string | null;
  expandedFolderIds: Set<string>;

  openFile: (fileId: string) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  saveFile: (fileId: string) => void;
  createFile: (name: string, parentId: string | null, isDirectory?: boolean, initialContent?: string) => string;
  deleteFile: (fileId: string) => void;
  renameFile: (fileId: string, newName: string) => void;
  toggleFolder: (folderId: string) => void;
  loadProjectFiles: (files: Record<string, FileItem>) => void;
  clearFiles: () => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: {},
  openFileIds: [],
  activeFileId: null,
  expandedFolderIds: new Set(['root']),

  openFile: (fileId) => set((state) => {
    if (!state.files[fileId] || state.files[fileId].isDirectory) return state;
    const exists = state.openFileIds.includes(fileId);
    return {
      openFileIds: exists ? state.openFileIds : [...state.openFileIds, fileId],
      activeFileId: fileId
    };
  }),

  closeFile: (fileId) => set((state) => {
    const nextOpen = state.openFileIds.filter(id => id !== fileId);
    let nextActive = state.activeFileId;
    if (state.activeFileId === fileId) {
      nextActive = nextOpen.length > 0 ? nextOpen[nextOpen.length - 1] : null;
    }
    return { openFileIds: nextOpen, activeFileId: nextActive };
  }),

  setActiveFile: (fileId) => set({ activeFileId: fileId }),

  updateFileContent: (fileId, content) => set((state) => {
    const target = state.files[fileId];
    if (!target) return state;
    return {
      files: {
        ...state.files,
        [fileId]: { ...target, content, isDirty: true }
      }
    };
  }),

  saveFile: (fileId) => set((state) => {
    const target = state.files[fileId];
    if (!target) return state;
    return {
      files: {
        ...state.files,
        [fileId]: { ...target, isDirty: false }
      }
    };
  }),

  createFile: (name, parentId, isDirectory = false, initialContent = '') => {
    const id = 'f_' + Math.random().toString(36).substring(2, 9);
    const parentPath = parentId && get().files[parentId] ? get().files[parentId].path : '';
    const path = parentPath ? `${parentPath}/${name}` : `/${name}`;

    const newFile: FileItem = {
      id,
      name,
      path,
      isDirectory,
      parentId,
      content: isDirectory ? undefined : initialContent,
      isDirty: false
    };

    set((state) => ({
      files: { ...state.files, [id]: newFile }
    }));
    return id;
  },

  deleteFile: (fileId) => set((state) => {
    const newFiles = { ...state.files };
    delete newFiles[fileId];
    return {
      files: newFiles,
      openFileIds: state.openFileIds.filter(id => id !== fileId),
      activeFileId: state.activeFileId === fileId ? null : state.activeFileId
    };
  }),

  renameFile: (fileId, newName) => set((state) => {
    const target = state.files[fileId];
    if (!target) return state;
    const parentPath = target.parentId && state.files[target.parentId] ? state.files[target.parentId].path : '';
    const newPath = parentPath ? `${parentPath}/${newName}` : `/${newName}`;
    return {
      files: {
        ...state.files,
        [fileId]: { ...target, name: newName, path: newPath }
      }
    };
  }),

  toggleFolder: (folderId) => set((state) => {
    const nextSet = new Set(state.expandedFolderIds);
    if (nextSet.has(folderId)) {
      nextSet.delete(folderId);
    } else {
      nextSet.add(folderId);
    }
    return { expandedFolderIds: nextSet };
  }),

  loadProjectFiles: (files) => set({ files, openFileIds: [], activeFileId: null }),

  clearFiles: () => set({ files: {}, openFileIds: [], activeFileId: null, expandedFolderIds: new Set(['root']) }),
}));