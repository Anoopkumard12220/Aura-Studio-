import React, { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { createPortal } from 'react-dom';
import { Plus, Folder, X, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ProjectSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectSwitcherModal: React.FC<ProjectSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { projects, activeProjectId, setActiveProject, addProject, removeProject } = useProjectStore();
  const [newProjectName, setNewProjectName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && showCreateDialog) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, showCreateDialog]);

  const handleCreate = () => {
    if (!newProjectName.trim()) return;
    
    const newProject = {
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      name: newProjectName.trim(),
      templateType: 'empty',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastOpenedAt: Date.now(),
    };
    
    addProject(newProject);
    setActiveProject(newProject.id);
    setNewProjectName('');
    setShowCreateDialog(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') setShowCreateDialog(false);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/95 backdrop-blur-sm">
      <div className="bg-frame border border-white/10 rounded-xl overflow-hidden w-full max-w-md mx-4 glass-strong animate-fade-in">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Switch Project</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {showCreateDialog ? (
          <div className="p-4 space-y-4">
            <input
              ref={inputRef}
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Project name..."
              className="w-full px-3 py-2 bg-canvas border border-white/10 rounded text-white placeholder:text-white/40 focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        ) : (
          <div className="max-h-80 overflow-auto scrollbar-thin">
            {projects.length === 0 ? (
              <div className="p-8 text-center text-white/40">
                <Folder className="w-12 h-12 mx-auto mb-3 text-white/20" />
                <p>No projects yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {projects.map((project) => (
                  <li key={project.id}>
                    <button
                      onClick={() => { setActiveProject(project.id); onClose(); }}
                      className={twMerge(
                        'w-full px-4 py-3 text-left flex items-center gap-3 transition-colors',
                        'hover:bg-white/[0.03]',
                        activeProjectId === project.id && 'bg-indigo-500/10'
                      )}
                    >
                      <Folder className={twMerge(
                        'w-5 h-5 flex-shrink-0',
                        activeProjectId === project.id ? 'text-indigo-400' : 'text-amber-400'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={twMerge(
                          'text-sm font-medium truncate',
                          activeProjectId === project.id ? 'text-white' : 'text-white/90'
                        )}>
                          {project.name}
                        </p>
                        <p className="text-xs text-white/40 truncate">
                          {new Date(project.lastOpenedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {activeProjectId === project.id && (
                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        <div className="p-3 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};