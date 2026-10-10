import Dexie, { Table } from 'dexie';

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

export class AuraDatabase extends Dexie {
  projects!: Table<DBProject, string>;
  files!: Table<DBFile, string>;
  settings!: Table<DBSettings, string>;

  constructor() {
    super('AuraStudioDB');
    this.version(1).stores({
      projects: 'id, name, templateType, updatedAt, lastOpenedAt',
      files: 'id, projectId, path, parentId, isDirectory, [projectId+path]',
      settings: 'key'
    });
  }
}

export const db = new AuraDatabase();