export interface Project {
  id: string;
  name: string;
  description?: string;
  templateType: string;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
}

export interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
}