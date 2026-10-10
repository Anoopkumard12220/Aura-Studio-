import { FileItem } from './files';
import { Project } from './project';

export interface DBProject {
  id: string;
  name: string;
  description?: string;
  templateType: string;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
}

export interface DBFile {
  id: string;
  projectId: string;
  path: string;
  name: string;
  isDirectory: boolean;
  parentId: string | null;
  content?: string;
  size: number;
  updatedAt: number;
}

export interface DBSettings {
  key: string;
  value: any;
}