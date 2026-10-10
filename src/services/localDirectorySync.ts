import { FileItem } from '@/types/files';

export interface DirectoryHandle extends FileSystemDirectoryHandle {
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  keys(): AsyncIterableIterator<string>;
  values(): AsyncIterableIterator<FileSystemHandle>;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
}

export interface FileHandle extends FileSystemFileHandle {
  getFile(): Promise<File>;
  createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
}

export class LocalDirectorySync {
  private rootHandle: FileSystemDirectoryHandle | null = null;

  async initialize(rootHandle: FileSystemDirectoryHandle): Promise<void> {
    this.rootHandle = rootHandle;
  }

  async readDirectory(handle: FileSystemDirectoryHandle, parentPath: string = '/'): Promise<Omit<FileItem, 'id'>[]> {
    const items: Omit<FileItem, 'id'>[] = [];
    
    for await (const [name, entry] of handle.entries()) {
      const currentPath = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;
      
      if (entry.kind === 'directory') {
        const dirHandle = entry as FileSystemDirectoryHandle;
        items.push({
          name,
          path: currentPath,
          isDirectory: true,
          parentId: null
        });
        const children = await this.readDirectory(dirHandle, currentPath);
        items.push(...children);
      } else {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        const text = await file.text();
        items.push({
          name,
          path: currentPath,
          isDirectory: false,
          parentId: null,
          content: text
        });
      }
    }
    
    return items;
  }

  async writeFile(handle: FileSystemDirectoryHandle, path: string, content: string): Promise<void> {
    const parts = path.split('/').filter(Boolean);
    const fileName = parts.pop()!;
    let currentHandle = handle;
    
    for (const part of parts) {
      currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
    }
    
    const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async createDirectory(handle: FileSystemDirectoryHandle, path: string): Promise<void> {
    const parts = path.split('/').filter(Boolean);
    let currentHandle = handle;
    
    for (const part of parts) {
      currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
    }
  }

  async deleteEntry(handle: FileSystemDirectoryHandle, path: string, recursive: boolean = false): Promise<void> {
    const parts = path.split('/').filter(Boolean);
    const entryName = parts.pop()!;
    let currentHandle = handle;
    
    for (const part of parts) {
      currentHandle = await currentHandle.getDirectoryHandle(part);
    }
    
    await currentHandle.removeEntry(entryName, { recursive });
  }

  getRootHandle(): FileSystemDirectoryHandle | null {
    return this.rootHandle;
  }
}

export const localDirectorySync = new LocalDirectorySync();