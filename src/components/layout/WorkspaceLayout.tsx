import React, { useState, useEffect } from 'react';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { TitleBar } from '../chrome/TitleBar';
import { ActivityBar } from '../layout/ActivityBar';
import { Sidebar } from '../layout/Sidebar';
import { BottomPanel } from '../layout/BottomPanel';
import { StatusBar } from '../layout/StatusBar';
import { SplitPane } from '../layout/SplitPane';
import { TabBar } from '../editor/TabBar';
import { EditorArea } from '../editor/EditorArea';
import { QuickOpenModal } from '../search/QuickOpenModal';
import { PreviewPanel } from '../preview/PreviewPanel';
import { MobileDrawerSidebar } from '../mobile/MobileDrawerSidebar';
import { MobileAccessoryBar } from '../mobile/MobileAccessoryBar';
import { SecurityBanner, MemoryWarningBanner } from '../security/SecurityBanner';
import { useProjectStore } from '@/stores/useProjectStore';
import { useFileStore } from '@/stores/useFileStore';
import { useEditorStore } from '@/stores/useEditorStore';
import { useVisualViewport, useIsMobile } from '@/hooks/useVisualViewport';
import { useMemoryUsage } from '@/hooks/useMemoryUsage';

export const WorkspaceLayout: React.FC = () => {
  const { 
    isSidebarOpen, 
    sidebarWidth, 
    activeBottomTab,
    setActiveBottomTab,
    toggleSidebar,
  } = useLayoutStore();
  const { activeProjectId } = useProjectStore();
  const { activeFileId, files } = useFileStore();
  const { activeTabId, tabs } = useEditorStore();
  
  const [showPreview, setShowPreview] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(400);
  const [mobileSidebarTab, setMobileSidebarTab] = useState<'explorer' | 'search' | 'git' | 'extensions'>('explorer');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isMobile = useIsMobile();
  const { isKeyboardOpen } = useVisualViewport();
  const memoryInfo = useMemoryUsage();

  // Handle mobile sidebar
  useEffect(() => {
    if (isMobile) {
      setMobileSidebarOpen(isSidebarOpen);
    }
  }, [isMobile, isSidebarOpen]);

  // Listen for preview toggle
  useEffect(() => {
    const handleTogglePreview = () => setShowPreview(prev => !prev);
    window.addEventListener('aura-toggle-preview', handleTogglePreview);
    return () => window.removeEventListener('aura-toggle-preview', handleTogglePreview);
  }, []);

  // Listen for mobile sidebar events
  useEffect(() => {
    const handleOpenSidebar = () => setMobileSidebarOpen(true);
    const handleCloseSidebar = () => setMobileSidebarOpen(false);
    
    window.addEventListener('aura-open-sidebar', handleOpenSidebar);
    window.addEventListener('aura-close-sidebar', handleCloseSidebar);
    
    return () => {
      window.removeEventListener('aura-open-sidebar', handleOpenSidebar);
      window.removeEventListener('aura-close-sidebar', handleCloseSidebar);
    };
  }, []);

  // Handle mobile accessory bar actions
  const activeTab = activeTabId ? tabs.find(t => t.fileId === activeTabId) : null;
  const activeFile = activeFileId ? files[activeFileId] : null;

  const handleRun = () => {
    if (!activeFile || !activeTab) return;
    setActiveBottomTab('terminal');
    window.dispatchEvent(new CustomEvent('aura-run-code'));
  };

  const handleUndo = () => {
    window.dispatchEvent(new CustomEvent('aura-undo'));
  };

  const handleRedo = () => {
    window.dispatchEvent(new CustomEvent('aura-redo'));
  };

  const handleInsertText = (text: string) => {
    window.dispatchEvent(new CustomEvent('aura-insert-text', { detail: { text } }));
  };

  return (
    <div className="flex h-screen w-screen bg-canvas overflow-hidden">
      <TitleBar />
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Activity Bar - hidden on mobile */}
        {!isMobile && <ActivityBar />}

        {/* Main Content Area */}
        <SplitPane 
          direction="horizontal" 
          defaultSize={isMobile ? 0 : sidebarWidth} 
          minSize={180} 
          maxSize={480}
          style={{ flex: 1 }}
        >
          {/* Desktop Sidebar */}
          {!isMobile && <Sidebar />}

          {/* Mobile Drawer Sidebar */}
          <MobileDrawerSidebar
            isOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            activeTab={mobileSidebarTab}
            onTabChange={setMobileSidebarTab}
          />

          {/* Editor Area */}
          <div className="flex-1 flex flex-col min-w-0 relative">
            <SplitPane 
              direction="horizontal" 
              defaultSize={previewWidth} 
              minSize={300} 
              maxSize={800}
              style={{ flex: 1 }}
            >
              <div className="flex-1 flex flex-col min-w-0">
                <TabBar />
                <div className="flex-1 min-h-0">
                  <EditorArea />
                </div>
              </div>
              
              {/* Preview Panel */}
              {showPreview && (
                <div className="flex flex-col min-w-0 border-l border-white/[0.06] bg-surface">
                  <PreviewPanel
                    projectId={activeProjectId}
                    isOpen={true}
                    onClose={() => setShowPreview(false)}
                  />
                </div>
              )}
            </SplitPane>
            
            <BottomPanel />
          </div>
        </SplitPane>

        {/* Security Banners */}
        <SecurityBanner />
        <MemoryWarningBanner threshold={0.8} />

        {/* Mobile Accessory Bar */}
        <MobileAccessoryBar
          onInsertText={handleInsertText}
          onRun={handleRun}
          onUndo={handleUndo}
          onRedo={handleRedo}
          visible={isMobile && isKeyboardOpen}
        />
      </div>
      
      <StatusBar />
      <QuickOpenModal />
    </div>
  );
};