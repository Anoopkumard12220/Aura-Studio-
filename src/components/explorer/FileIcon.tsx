import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const fileIcons: Record<string, React.ReactNode> = {
  ts: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="10" textAnchor="middle" fontWeight="bold" fill="currentColor">TS</text></svg>,
  tsx: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="9" textAnchor="middle" fontWeight="bold" fill="currentColor">TSX</text></svg>,
  js: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="10" textAnchor="middle" fontWeight="bold" fill="currentColor">JS</text></svg>,
  jsx: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="9" textAnchor="middle" fontWeight="bold" fill="currentColor">JSX</text></svg>,
  json: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="9" textAnchor="middle" fontWeight="bold" fill="currentColor">{}</text></svg>,
  html: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="9" textAnchor="middle" fontWeight="bold" fill="currentColor"></></text></svg>,
  css: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="9" textAnchor="middle" fontWeight="bold" fill="currentColor">CSS</text></svg>,
  md: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="10" textAnchor="middle" fontWeight="bold" fill="currentColor">MD</text></svg>,
  py: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="10" textAnchor="middle" fontWeight="bold" fill="currentColor">PY</text></svg>,
  rs: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="10" textAnchor="middle" fontWeight="bold" fill="currentColor">RS</text></svg>,
  go: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="10" textAnchor="middle" fontWeight="bold" fill="currentColor">GO</text></svg>,
  java: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor">JAVA</text></svg>,
  cpp: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor">C++</text></svg>,
  c: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="10" textAnchor="middle" fontWeight="bold" fill="currentColor">C</text></svg>,
  cs: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor">C#</text></svg>,
  php: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="9" textAnchor="middle" fontWeight="bold" fill="currentColor">PHP</text></svg>,
  rb: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="10" textAnchor="middle" fontWeight="bold" fill="currentColor">RB</text></svg>,
  swift: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor">SWIFT</text></svg>,
  kt: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor">KT</text></svg>,
  sh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="9" textAnchor="middle" fontWeight="bold" fill="currentColor">SH</text></svg>,
  yaml: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor">YML</text></svg>,
  yml: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><text x="12" y="16" fontSize="8" textAnchor="middle" fontWeight="bold" fill="currentColor">YML</text></svg>,
  txt: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>,
  default: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>,
};

const folderIcons = {
  closed: <Folder className="w-4 h-4 text-amber-400" />,
  open: <FolderOpen className="w-4 h-4 text-amber-400" />,
};

import { Folder, FolderOpen } from 'lucide-react';

export const FileIcon: React.FC<{ 
  name: string; 
  isDirectory: boolean; 
  expanded?: boolean;
  className?: string;
}> = ({ name, isDirectory, expanded, className }) => {
  if (isDirectory) {
    return (
      <span className={twMerge(className)}>
        {expanded ? folderIcons.open : folderIcons.closed}
      </span>
    );
  }

  const ext = name.split('.').pop()?.toLowerCase() || '';
  const Icon = fileIcons[ext] || fileIcons.default;
  
  return (
    <span className={twMerge(className)}>
      {Icon}
    </span>
  );
};