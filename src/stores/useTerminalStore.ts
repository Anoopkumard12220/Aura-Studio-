import { create } from 'zustand';

interface TerminalStore {
  terminalHistory: string;
  maxHistoryLines: number;
  writeToTerminal: (data: string) => void;
  clearTerminal: () => void;
  addToHistory: (data: string) => void;
}

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  terminalHistory: '',
  maxHistoryLines: 5000,
  
  writeToTerminal: (data: string) => {
    set((state) => {
      const newHistory = state.terminalHistory + data;
      const lines = newHistory.split('\n');
      if (lines.length > state.maxHistoryLines) {
        return { terminalHistory: lines.slice(-state.maxHistoryLines).join('\n') };
      }
      return { terminalHistory: newHistory };
    });
  },

  clearTerminal: () => {
    set({ terminalHistory: '' });
  },

  addToHistory: (data: string) => {
    get().writeToTerminal(data);
  },
}));