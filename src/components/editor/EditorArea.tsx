import React, { useEffect, useRef } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { useFileStore } from '@/stores/useFileStore';
import { MonacoEditorContainer } from './MonacoEditorContainer';

export const EditorArea: React.FC = () => {
  const { activeTabId, tabs } = useEditorStore();
  const { files, updateFileContent, saveFile, setActiveFile } = useFileStore();
  
  const activeTab = activeTabId ? tabs.find(t => t.fileId === activeTabId) : null;
  const activeFile = activeTab ? files[activeTab.fileId] : null;

  return (
    <div className="h-full w-full relative">
      {activeFile && activeTab ? (
        <MonacoEditorContainer
          fileId={activeFile.id}
          fileName={activeFile.name}
          filePath={activeFile.path}
          language={activeTab.language}
          initialContent={activeFile.content || ''}
          isDirty={activeTab.isDirty}
          onContentChange={(content) => updateFileContent(activeFile.id, content)}
          onSave={() => saveFile(activeFile.id)}
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-canvas">
          <div className="text-center space-y-4">
            <svg className="w-16 h-16 mx-auto text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <div>
              <p className="text-white/60 text-lg">No file open</p>
              <p className="text-white/30 text-sm mt-1">Open a file from the explorer or create a new one</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};