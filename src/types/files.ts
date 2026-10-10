export interface FileItem {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  parentId: string | null;
  content?: string;
  isDirty?: boolean;
}

export interface FileState {
  files: Record<string, FileItem>;
  openFileIds: string[];
  activeFileId: string | null;
  expandedFolderIds: Set<string>;
}