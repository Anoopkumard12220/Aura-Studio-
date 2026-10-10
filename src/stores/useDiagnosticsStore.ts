import { create } from 'zustand';
import { DiagnosticItem } from '@/types/diagnostics';

interface DiagnosticsState {
  diagnostics: DiagnosticItem[];
  addDiagnostic: (item: Omit<DiagnosticItem, 'id' | 'timestamp'>) => void;
  removeDiagnostic: (id: string) => void;
  clearDiagnostics: (source?: string) => void;
  clearAll: () => void;
  getBySource: (source: string) => DiagnosticItem[];
  getBySeverity: (severity: DiagnosticItem['severity']) => DiagnosticItem[];
  getByFile: (filePath: string) => DiagnosticItem[];
}

export const useDiagnosticsStore = create<DiagnosticsState>((set, get) => ({
  diagnostics: [],
  
  addDiagnostic: (item) => set((state) => ({
    diagnostics: [
      ...state.diagnostics,
      {
        ...item,
        id: 'diag_' + Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
      },
    ],
  })),

  removeDiagnostic: (id) => set((state) => ({
    diagnostics: state.diagnostics.filter(d => d.id !== id),
  })),

  clearDiagnostics: (source) => set((state) => ({
    diagnostics: source 
      ? state.diagnostics.filter(d => d.source !== source)
      : state.diagnostics,
  })),

  clearAll: () => set({ diagnostics: [] }),

  getBySource: (source) => get().diagnostics.filter(d => d.source === source),

  getBySeverity: (severity) => get().diagnostics.filter(d => d.severity === severity),

  getByFile: (filePath) => get().diagnostics.filter(d => d.filePath === filePath),
}));