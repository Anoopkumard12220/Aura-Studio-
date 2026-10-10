import React from 'react';
import { ProjectTemplate } from '@/templates';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TemplateCardProps {
  template: ProjectTemplate;
  onSelect: () => void;
}

const iconComponents: Record<string, React.ReactNode> = {
  Atom: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  Code: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  Brain: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a4 4 0 0 1 4 4c0 1.76-1.5 3.5-3 4.5s-3-2.74-3-4.5a4 4 0 0 1 4-4z"/><path d="M4 14c0-2.5 2-4 4-4s4 1.5 4 4"/><path d="M16 14c0-2.5 2-4 4-4s4 1.5 4 4"/></svg>,
  Cpu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M9 1v2M9 21v2M1 9h2M21 9h2"/></svg>,
  Grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Server: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  Layers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
};

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect }) => {
  const Icon = iconComponents[template.iconName] || iconComponents.Code;

  return (
    <button
      onClick={onSelect}
      className={clsx(
        'group p-4 bg-surface border rounded-xl transition-all duration-200 flex flex-col h-full',
        'border-white/10 hover:border-indigo-500/50 hover:bg-white/[0.02]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={clsx(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          'bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/30 transition-colors'
        )}>
          {Icon}
        </div>
        <span className={clsx(
          'px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0',
          'bg-indigo-500/20 text-indigo-400'
        )}>
          {template.badge}
        </span>
      </div>

      <h3 className="font-medium text-white mb-1 group-hover:text-indigo-400 transition-colors">
        {template.name}
      </h3>
      <p className="text-white/50 text-sm mb-4 flex-1">
        {template.description}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="px-2 py-0.5 text-xs bg-white/10 rounded text-white/60 font-mono">
          {template.language}
        </span>
        <span className="text-xs text-white/40">
          {template.files.length} files
        </span>
      </div>
    </button>
  );
};