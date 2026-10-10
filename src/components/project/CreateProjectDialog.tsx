import React, { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { createPortal } from 'react-dom';
import { X, Folder, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const templates = [
  { id: 'empty', name: 'Empty Project', description: 'Start from scratch', icon: Folder },
  { id: 'react', name: 'React App', description: 'Vite + React + TypeScript', icon: Folder },
  { id: 'node', name: 'Node.js', description: 'Basic Node.js project', icon: Folder },
  { id: 'python', name: 'Python', description: 'Python project with venv', icon: Folder },
];

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ isOpen, onClose }) => {
  const { addProject } = useProjectStore();
  const [projectName, setProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('empty');
  const [description, setDescription] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleCreate = () => {
    if (!projectName.trim()) return;
    
    const newProject = {
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      name: projectName.trim(),
      description: description.trim(),
      templateType: selectedTemplate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastOpenedAt: Date.now(),
    };
    
    addProject(newProject);
    setProjectName('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/95 backdrop-blur-sm">
      <div className="bg-frame border border-white/10 rounded-xl overflow-hidden w-full max-w-2xl mx-4 glass-strong animate-fade-in">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Project Name</label>
            <input
              ref={inputRef}
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-awesome-project"
              className="w-full px-3 py-2 bg-canvas border border-white/10 rounded text-white placeholder:text-white/40 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm text-white/70 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your project"
              rows={3}
              className="w-full px-3 py-2 bg-canvas border border-white/10 rounded text-white placeholder:text-white/40 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm text-white/70 mb-2">Template</label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={twMerge(
                      'p-3 rounded-lg border transition-all text-left',
                      selectedTemplate === template.id
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/10 hover:border-white/20'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={twMerge(
                        'w-5 h-5 flex-shrink-0',
                        selectedTemplate === template.id ? 'text-indigo-400' : 'text-white/60'
                      )} />
                      <div>
                        <p className={twMerge(
                          'text-sm font-medium',
                          selectedTemplate === template.id ? 'text-white' : 'text-white/90'
                        )}>
                          {template.name}
                        </p>
                        <p className="text-xs text-white/50">{template.description}</p>
                      </div>
                      {selectedTemplate === template.id && (
                        <Check className="w-4 h-4 text-indigo-400 ml-auto" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-white/10 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!projectName.trim()}
            className={twMerge(
              'px-4 py-2 text-sm rounded transition-colors',
              projectName.trim()
                ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            )}
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};