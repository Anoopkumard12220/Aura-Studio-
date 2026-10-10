import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStore } from '@/stores/useLayoutStore';

describe('useLayoutStore', () => {
  beforeEach(() => {
    useLayoutStore.setState({
      isSidebarOpen: true,
      activeActivityTab: 'files',
      sidebarWidth: 260,
      isBottomPanelOpen: true,
      bottomPanelHeight: 220,
      activeBottomTab: 'terminal',
      isFullscreen: false,
    });
  });

  it('should toggle sidebar', () => {
    useLayoutStore.getState().toggleSidebar();
    expect(useLayoutStore.getState().isSidebarOpen).toBe(false);
    useLayoutStore.getState().toggleSidebar();
    expect(useLayoutStore.getState().isSidebarOpen).toBe(true);
  });

  it('should set sidebar open state', () => {
    useLayoutStore.getState().setSidebarOpen(false);
    expect(useLayoutStore.getState().isSidebarOpen).toBe(false);
    useLayoutStore.getState().setSidebarOpen(true);
    expect(useLayoutStore.getState().isSidebarOpen).toBe(true);
  });

  it('should set active activity tab', () => {
    useLayoutStore.getState().setActiveActivityTab('search');
    expect(useLayoutStore.getState().activeActivityTab).toBe('search');
  });

  it('should close sidebar when clicking active tab', () => {
    useLayoutStore.getState().setActiveActivityTab('files');
    useLayoutStore.getState().setActiveActivityTab('files');
    expect(useLayoutStore.getState().isSidebarOpen).toBe(false);
  });

  it('should clamp sidebar width to min 180px', () => {
    useLayoutStore.getState().setSidebarWidth(100);
    expect(useLayoutStore.getState().sidebarWidth).toBe(180);
  });

  it('should clamp sidebar width to max 480px', () => {
    useLayoutStore.getState().setSidebarWidth(600);
    expect(useLayoutStore.getState().sidebarWidth).toBe(480);
  });

  it('should toggle bottom panel', () => {
    useLayoutStore.getState().toggleBottomPanel();
    expect(useLayoutStore.getState().isBottomPanelOpen).toBe(false);
    useLayoutStore.getState().toggleBottomPanel();
    expect(useLayoutStore.getState().isBottomPanelOpen).toBe(true);
  });

  it('should clamp bottom panel height to min 120px', () => {
    useLayoutStore.getState().setBottomPanelHeight(50);
    expect(useLayoutStore.getState().bottomPanelHeight).toBe(120);
  });

  it('should clamp bottom panel height to max 600px', () => {
    useLayoutStore.getState().setBottomPanelHeight(800);
    expect(useLayoutStore.getState().bottomPanelHeight).toBe(600);
  });

  it('should set active bottom tab', () => {
    useLayoutStore.getState().setActiveBottomTab('output');
    expect(useLayoutStore.getState().activeBottomTab).toBe('output');
  });
});