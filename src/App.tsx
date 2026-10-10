import React from 'react';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { WorkspaceLayout } from './components/layout/WorkspaceLayout';
import { ToastProvider } from './components/notifications/ToastNotification';
import { NewProjectWizard } from './components/wizard/NewProjectWizard';
import { InstallPromptModal } from './components/pwa/InstallPromptModal';
import { UpdateAvailableToast } from './components/pwa/UpdateAvailableToast';
import { NetworkStatusToast } from './components/pwa/UpdateAvailableToast';
import { CommandPalette } from './components/command/CommandPalette';
import { NpmSearchModal } from './components/packages/NpmSearchModal';
import { PackageSecurityReport } from './components/packages/PackageSecurityReport';
import { GlobalSearchPanel } from './components/search/GlobalSearchPanel';
import { DevDocsPanel } from './components/docs/DevDocsPanel';
import { initializeMonacoWorkers } from './services/monacoWorkerSetup';
import { registerAuraTheme } from './services/themeDefinition';
import { useThemeStore } from './stores/useThemeStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useFileStore } from '@/stores/useFileStore';
import { PersistenceService } from '@/services/persistenceService';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { registerServiceWorker, onPWAEvent } from '@/pwa/registerServiceWorker';
import { initializeOfflineMatrix } from '@/pwa/offlineMatrix';
import { useNetworkStore } from '@/stores/useNetworkStore';
import { setupDefaultHandlers } from '@/services/keybindingService';

function AppContent() {
  const { mode } = useThemeStore();
  const { activeProjectId, setActiveProject, projects } = useProjectStore();
  const { loadProjectFiles, clearFiles } = useFileStore();
  
  // Modal states
  const [showWizard, setShowWizard] = React.useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);
  const [showUpdateToast, setShowUpdateToast] = React.useState(false);
  const [networkToast, setNetworkToast] = React.useState<{ isOnline: boolean; persistent: boolean } | null>(null);
  
  // Version 08 modals
  const [showCommandPalette, setShowCommandPalette] = React.useState(false);
  const [showNpmSearch, setShowNpmSearch] = React.useState(false);
  const [showSecurityReport, setShowSecurityReport] = React.useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = React.useState(false);
  const [showDevDocs, setShowDevDocs] = React.useState(false);

  // Keyboard shortcuts
  useKeyboardShortcut([
    { key: 'n', metaKey: true, action: () => setShowWizard(true), description: 'New Project' },
    { key: 'p', metaKey: true, action: () => {}, description: 'Quick Open' },
    { key: 's', metaKey: true, action: () => {}, description: 'Save File' },
    { key: 'b', metaKey: true, action: () => useLayoutStore.getState().toggleSidebar(), description: 'Toggle Sidebar' },
    { key: 'k', metaKey: true, action: () => setShowCommandPalette(true), description: 'Command Palette' },
    { key: 'f', metaKey: true, shiftKey: true, action: () => setShowGlobalSearch(true), description: 'Global Search' },
  ]);

  // Listen for new project button click
  React.useEffect(() => {
    const btn = document.getElementById('new-project-btn');
    if (btn) {
      btn.addEventListener('click', () => setShowWizard(true));
    }
    return () => btn?.removeEventListener('click', () => setShowWizard(true));
  }, []);

  // Initialize PWA features
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    initializeMonacoWorkers();
    registerAuraTheme();
    initializeOfflineMatrix();
    setupDefaultHandlers();
    
    // Register service worker
    registerServiceWorker().then(wb => {
      if (wb) {
        console.log('[App] Service Worker registered');
      }
    });
  }, [mode]);

  // Handle PWA events
  React.useEffect(() => {
    const unsubscribe = onPWAEvent((event: any) => {
      if (event.type === 'UPDATE_AVAILABLE' || event.type === 'WAITING') {
        setShowUpdateToast(true);
      } else if (event.type === 'UPDATED' || event.type === 'CONTROLLING') {
        setShowUpdateToast(false);
      } else if (event.type === 'INSTALLED') {
        // Could show welcome toast
      }
    });
    return unsubscribe;
  }, []);

  // Handle network status changes
  React.useEffect(() => {
    const handleNetworkChange = (e: CustomEvent) => {
      const { isOnline } = e.detail;
      setNetworkToast({ isOnline, persistent: false });
      if (isOnline) {
        setShowInstallPrompt(true);
      }
    };
    
    window.addEventListener('aura-network-change', handleNetworkChange as EventListener);
    return () => window.removeEventListener('aura-network-change', handleNetworkChange as EventListener);
  }, []);

  // Listen for beforeinstallprompt
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setTimeout(() => setShowInstallPrompt(true), 3000);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Version 08: Global event handlers for modals
  React.useEffect(() => {
    const handleCommandPalette = () => setShowCommandPalette(true);
    const handleNpmSearch = () => setShowNpmSearch(true);
    const handleSecurityAudit = () => setShowSecurityReport(true);
    const handleGlobalSearch = () => setShowGlobalSearch(true);
    const handleDevDocs = () => setShowDevDocs(true);

    window.addEventListener('aura-open-command-palette', handleCommandPalette);
    window.addEventListener('aura-open-npm-search', handleNpmSearch);
    window.addEventListener('aura-osv-audit', handleSecurityAudit);
    window.addEventListener('aura-global-search', handleGlobalSearch);
    window.addEventListener('aura-open-devdocs', handleDevDocs);

    return () => {
      window.removeEventListener('aura-open-command-palette', handleCommandPalette);
      window.removeEventListener('aura-open-npm-search', handleNpmSearch);
      window.removeEventListener('aura-osv-audit', handleSecurityAudit);
      window.removeEventListener('aura-global-search', handleGlobalSearch);
      window.removeEventListener('aura-open-devdocs', handleDevDocs);
    };
  }, []);

  React.useEffect(() => {
    if (activeProjectId) {
      PersistenceService.loadProjectFiles(activeProjectId).then(files => {
        loadProjectFiles(files);
      });
    } else {
      clearFiles();
    }
  }, [activeProjectId, loadProjectFiles, clearFiles]);

  React.useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      const lastProject = projects.reduce((latest, p) => 
        p.lastOpenedAt > latest.lastOpenedAt ? p : latest
      );
      setActiveProject(lastProject.id);
    }
  }, [projects, activeProjectId, setActiveProject]);

  const handleWizardClose = () => {
    setShowWizard(false);
  };

  const handleInstallDismiss = () => {
    setShowInstallPrompt(false);
  };

  const handleInstall = () => {
    setShowInstallPrompt(false);
  };

  const handleUpdateDismiss = () => {
    setShowUpdateToast(false);
  };

  const handleUpdate = () => {
    setShowUpdateToast(false);
    window.location.reload();
  };

  const handleNetworkDismiss = () => {
    setNetworkToast(null);
  };

  return (
    <div className="h-screen w-screen">
      <ToastProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ToastProvider>
      
      {/* Existing modals */}
      <NewProjectWizard isOpen={showWizard} onClose={handleWizardClose} />
      <InstallPromptModal 
        isOpen={showInstallPrompt} 
        onClose={handleInstallDismiss}
        onInstall={handleInstall}
      />
      <UpdateAvailableToast
        isVisible={showUpdateToast}
        onDismiss={handleUpdateDismiss}
        onUpdate={handleUpdate}
      />
      {networkToast && (
        <NetworkStatusToast
          isOnline={networkToast.isOnline}
          onDismiss={handleNetworkDismiss}
          persistent={networkToast.persistent}
        />
      )}

      {/* Version 08 modals */}
      <CommandPalette 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)} 
      />
      <NpmSearchModal 
        isOpen={showNpmSearch} 
        onClose={() => setShowNpmSearch(false)} 
      />
      <PackageSecurityReport 
        isOpen={showSecurityReport} 
        onClose={() => setShowSecurityReport(false)} 
      />
      <GlobalSearchPanel 
        isOpen={showGlobalSearch} 
        onClose={() => setShowGlobalSearch(false)} 
      />
      <DevDocsPanel 
        isOpen={showDevDocs} 
        onClose={() => setShowDevDocs(false)} 
      />
    </div>
  );
}

const App: React.FC = () => {
  return <AppContent />;
};

export default App;