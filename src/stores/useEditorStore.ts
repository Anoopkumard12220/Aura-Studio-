import { create } from 'zustand';
import { EditorTab } from '@/types/editor';

interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
  addTab: (tab: EditorTab) => void;
  removeTab: (fileId: string) => void;
  setActiveTab: (fileId: string) => void;
  updateTabDirty: (fileId: string, isDirty: boolean) => void;
  updateTabLanguage: (fileId: string, language: string) => void;
  clearTabs: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  addTab: (tab) => set((state) => {
    const exists = state.tabs.find(t => t.fileId === tab.fileId);
    if (exists) {
      return { activeTabId: tab.fileId };
    }
    return { tabs: [...state.tabs, tab], activeTabId: tab.fileId };
  }),
  removeTab: (fileId) => set((state) => {
    const nextTabs = state.tabs.filter(t => t.fileId !== fileId);
    let nextActive = state.activeTabId;
    if (state.activeTabId === fileId) {
      nextActive = nextTabs.length > 0 ? nextTabs[nextTabs.length - 1].fileId : null;
    }
    return { tabs: nextTabs, activeTabId: nextActive };
  }),
  setActiveTab: (fileId) => set({ activeTabId: fileId }),
  updateTabDirty: (fileId, isDirty) => set((state) => ({
    tabs: state.tabs.map(t => t.fileId === fileId ? { ...t, isDirty } : t)
  })),
  updateTabLanguage: (fileId, language) => set((state) => ({
    tabs: state.tabs.map(t => t.fileId === fileId ? { ...t, language } : t)
  })),
  clearTabs: () => set({ tabs: [], activeTabId: null }),
}));