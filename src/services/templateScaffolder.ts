import { ProjectTemplate } from '@/templates';
import { db } from '@/db/database';

export class TemplateScaffolder {
  static async scaffoldProject(projectName: string, template: ProjectTemplate): Promise<string> {
    const projectId = 'proj_' + Math.random().toString(36).substring(2, 9);
    const now = Date.now();

    // 1. Create project metadata record
    await db.projects.put({
      id: projectId,
      name: projectName,
      description: template.description,
      templateType: template.id,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now
    });

    // 2. Build file hierarchy - compute parent IDs
    const pathToId = new Map<string, string>();
    pathToId.set('/', projectId); // Root directory maps to project ID

    // First pass: assign IDs and map paths
    const dbFiles = template.files.map(tf => {
      const id = 'f_' + Math.random().toString(36).substring(2, 9);
      pathToId.set(tf.path, id);
      return { id, templateFile: tf };
    });

    // Second pass: create DBFile entries with proper parent IDs
    const records = dbFiles.map(({ id, templateFile }) => {
      const name = templateFile.path.split('/').filter(Boolean).pop() || '';
      const parentPath = templateFile.path.substring(0, templateFile.path.lastIndexOf('/')) || '/';
      const parentId = pathToId.get(parentPath) || null;

      return {
        id,
        projectId,
        path: templateFile.path,
        name,
        isDirectory: !!templateFile.isDirectory,
        parentId,
        content: templateFile.content,
        size: templateFile.content ? new Blob([templateFile.content]).size : 0,
        updatedAt: now
      };
    });

    // 3. Bulk insert all files
    await db.files.bulkPut(records);

    return projectId;
  }

  static async scaffoldFromFiles(projectName: string, templateId: string, files: { path: string; content: string; isDirectory?: boolean }[]): Promise<string> {
    const projectId = 'proj_' + Math.random().toString(36).substring(2, 9);
    const now = Date.now();

    await db.projects.put({
      id: projectId,
      name: projectName,
      description: `Imported from ${templateId}`,
      templateType: templateId,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now
    });

    const pathToId = new Map<string, string>();
    pathToId.set('/', projectId);

    const fileEntries = files.map(f => {
      const id = 'f_' + Math.random().toString(36).substring(2, 9);
      pathToId.set(f.path, id);
      return { id, file: f };
    });

    const records = fileEntries.map(({ id, file }) => {
      const name = file.path.split('/').filter(Boolean).pop() || '';
      const parentPath = file.path.substring(0, file.path.lastIndexOf('/')) || '/';
      const parentId = pathToId.get(parentPath) || null;

      return {
        id,
        projectId,
        path: file.path,
        name,
        isDirectory: !!file.isDirectory,
        parentId,
        content: file.content,
        size: file.content ? new Blob([file.content]).size : 0,
        updatedAt: now
      };
    });

    await db.files.bulkPut(records);
    return projectId;
  }
}