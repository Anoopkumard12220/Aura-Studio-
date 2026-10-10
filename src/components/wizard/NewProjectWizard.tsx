import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useProjectStore } from '@/stores/useProjectStore';
import { useFileStore } from '@/stores/useFileStore';
import { TemplateScaffolder } from '@/services/templateScaffolder';
import { TEMPLATES, TEMPLATES_BY_CATEGORY, ProjectTemplate } from '@/templates';
import { TemplateCard } from './TemplateCard';
import { Plus, X, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const categories = [
  { id: 'all', label: 'All', icon: null },
  { id: 'frontend', label: 'Frontend', icon: 'Layout' },
  { id: 'backend', label: 'Backend', icon: 'Server' },
  { id: 'systems', label: 'Systems', icon: 'Cpu' },
  { id: 'datascience', label: 'Data Science', icon: 'Brain' },
  { id: 'polyglot', label: 'Polyglot', icon: 'Layers' },
] as const;

export const NewProjectWizard: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ 
  isOpen, 
  onClose 
}) => {
  const { addProject, setActiveProject } = useProjectStore();
  const { loadProjectFiles } = useFileStore();
  const [selectedCategory, setSelectedCategory] = useState<'all' | keyof typeof TEMPLATES_BY_CATEGORY>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState<'templates' | 'details'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredTemplates = TEMPLATES.filter(t => {
    const catMatch = selectedCategory === 'all' || t.category === selectedCategory;
    const searchMatch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.language.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  const handleCreate = async () => {
    if (!selectedTemplate || !projectName.trim()) return;
    
    setCreating(true);
    try {
      const projectId = await TemplateScaffolder.scaffoldProject(projectName.trim(), selectedTemplate);
      
      addProject({
        id: projectId,
        name: projectName.trim(),
        description: projectDescription.trim() || selectedTemplate.description,
        templateType: selectedTemplate.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastOpenedAt: Date.now(),
      });
      
      const files = await TemplateScaffolder['getProjectFiles']?.(projectId) || {};
      loadProjectFiles(files);
      setActiveProject(projectId);
      
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (isOpen && step === 'details') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (step === 'details') setStep('templates');
        else onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/95 backdrop-blur-sm p-4">
      <div className={clsx(
        'bg-frame border border-white/10 rounded-xl overflow-hidden w-full max-w-4xl max-h-[90vh] glass-strong animate-fade-in flex flex-col',
        step === 'details' ? 'max-w-2xl' : ''
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {step === 'templates' && (
              <>
                <h2 className="text-lg font-semibold text-white">Create New Project</h2>
                <span className="px-2 py-0.5 text-xs bg-white/10 rounded text-white/60">
                  {filteredTemplates.length} templates
                </span>
              </>
            )}
            {step === 'details' && selectedTemplate && (
              <>
                <button
                  onClick={() => setStep('templates')}
                  className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-white">Configure Project</h2>
                  <p className="text-xs text-white/50">{selectedTemplate.name}</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {step === 'templates' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Category tabs + Search */}
            <div className="p-4 border-b border-white/10 flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-10 pr-4 py-2 bg-canvas border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as typeof selectedCategory)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5',
                      selectedCategory === cat.id
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Grid */}
            <div className="flex-1 overflow-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => {
                    setSelectedTemplate(template);
                    setProjectName(`${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36).slice(-4)}`);
                    setProjectDescription('');
                    setStep('details');
                  }}
                />
              ))}
              {filteredTemplates.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center h-64 text-white/40">
                  <Search className="w-12 h-12 mb-3 opacity-50" />
                  <p>No templates match your search</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'details' && selectedTemplate && (
          <div className="flex flex-col">
            <div className="flex-1 overflow-auto p-6 space-y-6">
              {/* Template Preview */}
              <div className="bg-surface/50 border border-white/10 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{selectedTemplate.badge}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white">{selectedTemplate.name}</h3>
                    <p className="text-white/60 text-sm mt-1">{selectedTemplate.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-2 py-0.5 text-xs bg-white/10 rounded text-white/60">
                        {selectedTemplate.language}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-white/10 rounded text-white/60">
                        {selectedTemplate.defaultRunCommand}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Details Form */}
              <div className="space-y-4">
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
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="A brief description of your project"
                    rows={3}
                    className="w-full px-3 py-2 bg-canvas border border-white/10 rounded text-white placeholder:text-white/40 focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </div>

                {/* File Preview */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">Files to be created</label>
                  <div className="bg-canvas border border-white/10 rounded-lg max-h-48 overflow-auto scrollbar-thin font-mono text-xs">
                    {selectedTemplate.files.slice(0, 20).map(f => (
                      <div key={f.path} className="px-3 py-1.5 border-b border-white/5 flex items-center gap-2">
                        <span className="text-white/40 w-5">{f.isDirectory ? '📁' : '📄'}</span>
                        <span className="text-white/80 truncate">{f.path}</span>
                        <span className="text-white/40 ml-auto">({(f.content?.length || 0)} bytes)</span>
                      </div>
                    ))}
                    {selectedTemplate.files.length > 20 && (
                      <div className="px-3 py-2 text-white/40 text-center">
                        +{selectedTemplate.files.length - 20} more files
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={() => setStep('templates')}
                className="px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !projectName.trim()}
                className={clsx(
                  'px-4 py-2 text-sm rounded transition-colors flex items-center gap-2',
                  creating ? 'opacity-50 cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                )}
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Project
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};