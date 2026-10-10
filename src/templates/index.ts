export interface TemplateFile {
  path: string;
  content: string;
  isDirectory?: boolean;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'frontend' | 'backend' | 'systems' | 'datascience' | 'polyglot';
  language: string;
  iconName: string;
  badge: string;
  defaultRunCommand: string;
  files: TemplateFile[];
}

import { reactViteTsTemplate } from './reactViteTs';
import { vanillaTsTemplate } from './vanillaTs';
import { pythonDataScienceTemplate } from './pythonDataScience';
import { cppAlgorithmTemplate } from './cppAlgorithm';
import { html5CanvasTemplate } from './html5Canvas';
import { nodeExpressApiTemplate } from './nodeExpressApi';
import { polyglotPlaygroundTemplate } from './polyglotPlayground';

export const TEMPLATES: ProjectTemplate[] = [
  reactViteTsTemplate,
  vanillaTsTemplate,
  pythonDataScienceTemplate,
  cppAlgorithmTemplate,
  html5CanvasTemplate,
  nodeExpressApiTemplate,
  polyglotPlaygroundTemplate,
];

export const TEMPLATES_BY_CATEGORY = {
  frontend: TEMPLATES.filter(t => t.category === 'frontend'),
  backend: TEMPLATES.filter(t => t.category === 'backend'),
  systems: TEMPLATES.filter(t => t.category === 'systems'),
  datascience: TEMPLATES.filter(t => t.category === 'datascience'),
  polyglot: TEMPLATES.filter(t => t.category === 'polyglot'),
};

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return TEMPLATES.find(t => t.id === id);
}