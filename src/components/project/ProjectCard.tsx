import React from 'react';
import { Project } from '@/types/project';
import { Folder, Trash2, Edit, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ProjectCardProps {
  project: Project;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExport: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isActive,
  onSelect,
  onEdit,
  onDelete,
  onExport,
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={twMerge(
      'bg-surface border rounded-xl overflow-hidden transition-all',
      isActive 
        ? 'border-indigo-500/50 bg-indigo-500/5' 
        : 'border-white/10 hover:border-white/20'
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <button
            onClick={onSelect}
            className="flex-1 flex items-center gap-3 text-left transition-colors"
          >
            <div className={twMerge(
              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
              isActive ? 'bg-indigo-500/20' : 'bg-amber-500/20'
            )}>
              <Folder className={twMerge(
                'w-5 h-5',
                isActive ? 'text-indigo-400' : 'text-amber-400'
              )} />
            </div>
            <div className="min-w-0">
              <h3 className={twMerge(
                'text-sm font-medium truncate',
                isActive ? 'text-white' : 'text-white/90'
              )}>
                {project.name}
              </h3>
              {project.description && (
                <p className="text-xs text-white/50 truncate mt-0.5">
                  {project.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                <span>{formatDate(project.lastOpenedAt)}</span>
                <span className="px-1.5 py-0.5 bg-white/5 rounded text-white/60">
                  {project.templateType}
                </span>
              </div>
            </div>
            {isActive && (
              <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0 mt-1" />
            )}
          </button>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onExport(); }}
              className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              title="Export"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              title="Rename"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};