import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { useDiagnosticsStore } from '@/stores/useDiagnosticsStore';
import { PreviewAddressBar } from './PreviewAddressBar';
import { ViewportSwitcher } from './ViewportSwitcher';
import { PreviewBridge, PreviewIncomingMessage } from '@/services/previewBridge';
import { VirtualPreviewServer } from '@/services/virtualPreviewServer';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RefreshCw, Maximize2, Minimize2, ExternalLink, Monitor, Smartphone, Tablet, Laptop, X } from 'lucide-react';

interface PreviewPanelProps {
  projectId?: string;
  url?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
  projectId, 
  url: initialUrl, 
  isOpen, 
  onClose 
}) => {
  const { activeBottomTab, setActiveBottomTab } = useLayoutStore();
  const { addDiagnostic, clearDiagnostics } = useDiagnosticsStore();
  const [viewport, setViewport] = useState<'responsive' | 'mobile' | 'tablet' | 'laptop' | 'desktop'>('responsive');
  const [url, setUrl] = useState(initialUrl || 'about:blank');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef<PreviewBridge>(new PreviewBridge());

  // Connect preview bridge
  useEffect(() => {
    bridgeRef.current.connect((msg: PreviewIncomingMessage) => {
      if (msg.type === 'PREVIEW_UNCAUGHT_ERROR') {
        addDiagnostic({
          source: 'Live Preview',
          message: msg.message,
          line: msg.lineno,
          column: msg.colno,
          severity: 'error',
          filePath: msg.source,
        });
      } else if (msg.type === 'PREVIEW_CONSOLE') {
        // Could add console logs to diagnostics
        console.log('[Preview]', msg.level, ...msg.args);
      }
    });

    return () => bridgeRef.current.disconnect();
  }, [addDiagnostic]);

  // Load preview when project changes
  useEffect(() => {
    if (projectId && !initialUrl) {
      loadPreview(projectId);
    }
  }, [projectId, initialUrl]);

  const loadPreview = async (pid: string) => {
    setIsLoading(true);
    try {
      const html = await VirtualPreviewServer.createPreviewIframeHTML(pid);
      const blobUrl = await VirtualPreviewServer.createBlobURL(html);
      setUrl(blobUrl);
    } catch (err) {
      console.error('Failed to load preview:', err);
      setUrl('about:blank');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReload = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }, []);

  const handleViewportChange = useCallback((vp: typeof viewport) => {
    setViewport(vp);
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleOpenInNewTab = useCallback(() => {
    window.open(url, '_blank');
  }, [url]);

  const dims = getViewportDimensions(viewport);

  if (!isOpen) return null;

  const panelContent = (
    <div className={clsx(
      'flex flex-col bg-[#111217] border-l border-white/[0.06]',
      isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-full'
    )}>
      {/* Preview Chrome */}
      <div className="h-10 bg-[#161820] border-b border-white/[0.06] flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <PreviewAddressBar 
            url={url} 
            onReload={handleReload} 
            isLoading={isLoading}
          />
        </div>
        <div className="flex items-center gap-1">
          <ViewportSwitcher active={viewport} onChange={handleViewportChange} />
          <button
            onClick={handleFullscreenToggle}
            className="p-1.5 rounded hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="p-1.5 rounded hover:bg-white/[0.06] text-white/60 hover:text-white transition-colors"
            title="Open in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/[0.06] text-white/50 hover:text-white transition-colors"
            title="Close Preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Viewport */}
      <div className="flex-1 bg-[#0a0b0e] overflow-auto flex items-center justify-center p-4">
        <div
          style={{ width: dims.width, height: dims.height }}
          className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-200 border border-white/10 relative"
        >
          {isLoading && (
            <div className="absolute inset-0 bg-[#0a0b0e] flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-white/70 text-sm">Loading preview...</span>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={url}
            title="Aura Live Preview"
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-popups"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50">
        {panelContent}
      </div>
    );
  }

  return panelContent;
};

function getViewportDimensions(vp: typeof viewport) {
  switch (vp) {
    case 'mobile': return { width: 375, height: 667 };
    case 'tablet': return { width: 768, height: 1024 };
    case 'laptop': return { width: 1280, height: 800 };
    case 'desktop': return { width: 1920, height: 1080 };
    default: return { width: '100%', height: '100%' };
  }
}