import { FileItem } from './files';

export interface EditorTab {
  fileId: string;
  fileName: string;
  filePath: string;
  isDirty: boolean;
  language: string;
}

export interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
}