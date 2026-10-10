import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project } from '@/types/project';

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  removeProject: (projectId: string) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  setActiveProject: (projectId: string) => void;
  clearProjects: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],
      activeProjectId: null,
      setProjects: (projects) => set({ projects }),
      addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
      removeProject: (projectId) => set((state) => ({
        projects: state.projects.filter(p => p.id !== projectId),
        activeProjectId: state.activeProjectId === projectId ? null : state.activeProjectId
      })),
      updateProject: (projectId, updates) => set((state) => ({
        projects: state.projects.map(p => p.id === projectId ? { ...p, ...updates } : p)
      })),
      setActiveProject: (projectId) => set({ activeProjectId: projectId }),
      clearProjects: () => set({ projects: [], activeProjectId: null }),
    }),
    {
      name: 'aura-projects',
      partialize: (state) => ({ projects: state.projects, activeProjectId: state.activeProjectId }),
    }
  )
);