export type ActivityTab = 'files' | 'search' | 'git' | 'settings' | 'packages';

export interface LayoutState {
  isSidebarOpen: boolean;
  activeActivityTab: ActivityTab;
  sidebarWidth: number;
  isBottomPanelOpen: boolean;
  bottomPanelHeight: number;
  activeBottomTab: 'terminal' | 'output' | 'problems' | 'preview';
  isFullscreen: boolean;
}