import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeState, ThemeMode } from '@/types/common';

interface ThemeStore extends ThemeState {
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'dark',
      setTheme: (mode) => set({ mode }),
      toggleTheme: () => set((state) => ({ mode: state.mode === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'aura-theme',
    }
  )
);