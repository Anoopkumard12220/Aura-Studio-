import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FileItem } from '@/types/files';

export class ZipService {
  static async exportProject(projectName: string, files: Record<string, FileItem>): Promise<void> {
    const zip = new JSZip();

    for (const id in files) {
      const item = files[id];
      const cleanPath = item.path.startsWith('/') ? item.path.slice(1) : item.path;
      if (item.isDirectory) {
        zip.folder(cleanPath);
      } else {
        zip.file(cleanPath, item.content || '');
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${projectName.toLowerCase().replace(/\s+/g, '-')}.zip`);
  }

  static async importZip(file: File): Promise<{ name: string; files: Omit<FileItem, 'id'>[] }> {
    const zip = new JSZip();
    const loaded = await zip.loadAsync(file);
    const importedFiles: Omit<FileItem, 'id'>[] = [];

    for (const [relativePath, zipEntry] of Object.entries(loaded.files)) {
      if (zipEntry.dir) {
        importedFiles.push({
          name: relativePath.split('/').filter(Boolean).pop() || '',
          path: '/' + relativePath.replace(/\/$/, ''),
          isDirectory: true,
          parentId: null
        });
      } else {
        const text = await zipEntry.async('string');
        const parts = relativePath.split('/');
        const fileName = parts.pop() || '';
        importedFiles.push({
          name: fileName,
          path: '/' + relativePath,
          isDirectory: false,
          parentId: null,
          content: text
        });
      }
    }

    return {
      name: file.name.replace(/\.zip$/i, ''),
      files: importedFiles
    };
  }
}