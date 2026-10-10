export interface DiagnosticItem {
  id: string;
  source: string;
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  code?: string;
  filePath?: string;
  timestamp: number;
  relatedInformation?: DiagnosticRelatedInfo[];
}

export interface DiagnosticRelatedInfo {
  message: string;
  filePath: string;
  line: number;
  column: number;
}

export interface DiagnosticsState {
  diagnostics: DiagnosticItem[];
  addDiagnostic: (item: Omit<DiagnosticItem, 'id' | 'timestamp'>) => void;
  removeDiagnostic: (id: string) => void;
  clearDiagnostics: (source?: string) => void;
  clearAll: () => void;
  getBySource: (source: string) => DiagnosticItem[];
  getBySeverity: (severity: DiagnosticItem['severity']) => DiagnosticItem[];
}