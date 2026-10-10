import React, { useEffect, useRef, useCallback } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { initializeMonacoWorkers } from '@/services/monacoWorkerSetup';
import { registerAuraTheme } from '@/services/themeDefinition';

interface MonacoEditorContainerProps {
  fileId: string;
  fileName: string;
  filePath: string;
  language: string;
  initialContent: string;
  isDirty: boolean;
  onContentChange: (content: string) => void;
  onSave: () => void;
}

const languageMap: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  json: 'json', css: 'css', html: 'html', md: 'markdown',
  py: 'python', rs: 'rust', go: 'go', java: 'java',
  cpp: 'cpp', c: 'c', cs: 'csharp', php: 'php', rb: 'ruby',
  swift: 'swift', kt: 'kotlin', sh: 'shell', yaml: 'yaml', yml: 'yaml',
};

export const MonacoEditorContainer: React.FC<MonacoEditorContainerProps> = ({
  fileId,
  fileName,
  filePath,
  language,
  initialContent,
  isDirty,
  onContentChange,
  onSave,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const modelRef = useRef<monaco.editor.ITextModel | null>(null);
  const initialized = useRef(false);
  const saveTimeout = useRef<number>();

  const getMonacoLanguage = useCallback((lang: string) => {
    return languageMap[lang.toLowerCase()] || 'plaintext';
  }, []);

  const handleEditorMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
    editorRef.current = editor;
    
    if (!initialized.current) {
      initializeMonacoWorkers();
      registerAuraTheme();
      initialized.current = true;
    }

    const model = monacoInstance.editor.createModel(initialContent, getMonacoLanguage(language), monacoInstance.Uri.parse(`file://${filePath}`));
    modelRef.current = model;
    editor.setModel(model);

    editor.onDidChangeModelContent(() => {
      if (modelRef.current) {
        onContentChange(modelRef.current.getValue());
      }
    });

    editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      const statusBar = document.querySelector('.status-bar-cursor');
      if (statusBar) {
        statusBar.textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    editor.focus();
  }, [filePath, language, initialContent, onContentChange, onSave, getMonacoLanguage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  return (
    <Editor
      height="100%"
      width="100%"
      defaultLanguage={getMonacoLanguage(language)}
      value={initialContent}
      theme="aura-dark"
      options={{
        fontSize: 13,
        fontFamily: '"JetBrains Mono", "SF Mono", Menlo, Monaco, monospace',
        lineHeight: 1.5,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        wordWrap: 'on',
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true },
        renderLineHighlight: 'all',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        overviewRulerLanes: 3,
        glyphMargin: false,
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          useShadows: false,
          verticalHasArrows: false,
          horizontalHasArrows: false,
        },
        find: { autoFindInSelection: 'never' },
        hover: { enabled: true },
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        tabCompletion: 'on',
        parameterHints: { enabled: true },
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'mouseover',
        matchBrackets: 'always',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoSurround: 'languageDefined',
      }}
      onMount={handleEditorMount}
      onChange={(value, e) => {
        if (value !== undefined) onContentChange(value);
      }}
    />
  );
};