import { create } from 'zustand';
import { ActivityTab } from '@/types/layout';

interface LayoutState {
  isSidebarOpen: boolean;
  activeActivityTab: ActivityTab;
  sidebarWidth: number;
  isBottomPanelOpen: boolean;
  bottomPanelHeight: number;
  activeBottomTab: 'terminal' | 'output' | 'problems' | 'preview';
  isFullscreen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveActivityTab: (tab: ActivityTab) => void;
  setSidebarWidth: (width: number) => void;
  toggleBottomPanel: () => void;
  setBottomPanelOpen: (open: boolean) => void;
  setBottomPanelHeight: (height: number) => void;
  setActiveBottomTab: (tab: 'terminal' | 'output' | 'problems' | 'preview') => void;
  toggleFullscreen: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isSidebarOpen: true,
  activeActivityTab: 'files',
  sidebarWidth: 260,
  isBottomPanelOpen: true,
  bottomPanelHeight: 220,
  activeBottomTab: 'terminal',
  isFullscreen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setActiveActivityTab: (tab) => set((state) => ({
    activeActivityTab: tab,
    isSidebarOpen: state.activeActivityTab === tab && state.isSidebarOpen ? false : true
  })),
  setSidebarWidth: (width) => set({ sidebarWidth: Math.max(180, Math.min(width, 480)) }),
  toggleBottomPanel: () => set((state) => ({ isBottomPanelOpen: !state.isBottomPanelOpen })),
  setBottomPanelOpen: (open) => set({ isBottomPanelOpen: open }),
  setBottomPanelHeight: (height) => set({ bottomPanelHeight: Math.max(120, Math.min(height, 600)) }),
  setActiveBottomTab: (tab) => set({ activeBottomTab: tab }),
  toggleFullscreen: () => set((state) => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      return { isFullscreen: true };
    } else {
      document.exitFullscreen().catch(() => {});
      return { isFullscreen: false };
    }
  })
}));