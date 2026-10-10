import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useFileStore } from '@/stores/useFileStore';

describe('useFileStore', () => {
  beforeEach(() => {
    useFileStore.setState({
      files: {},
      openFileIds: [],
      activeFileId: null,
      expandedFolderIds: new Set(['root']),
    });
  });

  it('should create a file', () => {
    const id = useFileStore.getState().createFile('test.txt', null, false, 'content');
    const state = useFileStore.getState();
    expect(state.files[id]).toBeDefined();
    expect(state.files[id].name).toBe('test.txt');
    expect(state.files[id].content).toBe('content');
    expect(state.files[id].isDirectory).toBe(false);
  });

  it('should create a directory', () => {
    const id = useFileStore.getState().createFile('new-folder', null, true);
    const state = useFileStore.getState();
    expect(state.files[id]).toBeDefined();
    expect(state.files[id].name).toBe('new-folder');
    expect(state.files[id].isDirectory).toBe(true);
    expect(state.files[id].content).toBeUndefined();
  });

  it('should open a file and add to tabs', () => {
    const id = useFileStore.getState().createFile('test.txt', null, false, 'content');
    useFileStore.getState().openFile(id);
    const state = useFileStore.getState();
    expect(state.openFileIds).toContain(id);
    expect(state.activeFileId).toBe(id);
  });

  it('should not open a directory as a tab', () => {
    const id = useFileStore.getState().createFile('folder', null, true);
    useFileStore.getState().openFile(id);
    const state = useFileStore.getState();
    expect(state.openFileIds).not.toContain(id);
  });

  it('should close a file', () => {
    const id = useFileStore.getState().createFile('test.txt', null, false, 'content');
    useFileStore.getState().openFile(id);
    useFileStore.getState().closeFile(id);
    const state = useFileStore.getState();
    expect(state.openFileIds).not.toContain(id);
    expect(state.activeFileId).toBeNull();
  });

  it('should update file content and mark dirty', () => {
    const id = useFileStore.getState().createFile('test.txt', null, false, 'original');
    useFileStore.getState().updateFileContent(id, 'modified');
    const state = useFileStore.getState();
    expect(state.files[id].content).toBe('modified');
    expect(state.files[id].isDirty).toBe(true);
  });

  it('should save file and clear dirty flag', () => {
    const id = useFileStore.getState().createFile('test.txt', null, false, 'original');
    useFileStore.getState().updateFileContent(id, 'modified');
    useFileStore.getState().saveFile(id);
    const state = useFileStore.getState();
    expect(state.files[id].isDirty).toBe(false);
  });

  it('should delete a file', () => {
    const id = useFileStore.getState().createFile('test.txt', null, false, 'content');
    useFileStore.getState().deleteFile(id);
    const state = useFileStore.getState();
    expect(state.files[id]).toBeUndefined();
  });

  it('should rename a file', () => {
    const id = useFileStore.getState().createFile('old.txt', null, false, 'content');
    useFileStore.getState().renameFile(id, 'new.txt');
    const state = useFileStore.getState();
    expect(state.files[id].name).toBe('new.txt');
    expect(state.files[id].path).toBe('/new.txt');
  });

  it('should toggle folder expansion', () => {
    const id = useFileStore.getState().createFile('folder', null, true);
    useFileStore.getState().toggleFolder(id);
    let state = useFileStore.getState();
    expect(state.expandedFolderIds.has(id)).toBe(true);
    
    useFileStore.getState().toggleFolder(id);
    state = useFileStore.getState();
    expect(state.expandedFolderIds.has(id)).toBe(false);
  });

  it('should clamp sidebar width boundaries', () => {
    const { setSidebarWidth } = useLayoutStore.getState();
    setSidebarWidth(100);
    expect(useLayoutStore.getState().sidebarWidth).toBe(180);
    setSidebarWidth(600);
    expect(useLayoutStore.getState().sidebarWidth).toBe(480);
  });
});