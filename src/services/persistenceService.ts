import { db, DBFile } from '@/db/database';
import { FileItem } from '@/types/files';

export class PersistenceService {
  static async loadProjectFiles(projectId: string): Promise<Record<string, FileItem>> {
    const records = await db.files.where('projectId').equals(projectId).toArray();
    const map: Record<string, FileItem> = {};
    for (const r of records) {
      map[r.id] = {
        id: r.id,
        name: r.name,
        path: r.path,
        isDirectory: r.isDirectory,
        parentId: r.parentId,
        content: r.content,
        isDirty: false
      };
    }
    return map;
  }

  static async saveFile(projectId: string, file: FileItem): Promise<void> {
    const record: DBFile = {
      id: file.id,
      projectId,
      path: file.path,
      name: file.name,
      isDirectory: file.isDirectory,
      parentId: file.parentId,
      content: file.content,
      size: file.content ? new Blob([file.content]).size : 0,
      updatedAt: Date.now()
    };
    await db.files.put(record);
  }

  static async batchSaveFiles(projectId: string, files: FileItem[]): Promise<void> {
    const records: DBFile[] = files.map(file => ({
      id: file.id,
      projectId,
      path: file.path,
      name: file.name,
      isDirectory: file.isDirectory,
      parentId: file.parentId,
      content: file.content,
      size: file.content ? new Blob([file.content]).size : 0,
      updatedAt: Date.now()
    }));
    await db.transaction('rw', db.files, async () => {
      await db.files.bulkPut(records);
    });
  }

  static async deleteFile(fileId: string): Promise<void> {
    await db.files.delete(fileId);
  }
}