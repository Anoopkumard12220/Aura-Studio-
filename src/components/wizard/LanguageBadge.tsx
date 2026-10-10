import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const languageColors: Record<string, { bg: string; text: string; dot: string }> = {
  TypeScript: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  JavaScript: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  Python: { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-400' },
  'C++': { bg: 'bg-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
  C: { bg: 'bg-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
  Rust: { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400' },
  Go: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  Java: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
  HTML: { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400' },
  CSS: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  Multi: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', dot: 'bg-indigo-400' },
  Unknown: { bg: 'bg-white/10', text: 'text-white/60', dot: 'bg-white/40' },
};

interface LanguageBadgeProps {
  language: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const LanguageBadge: React.FC<LanguageBadgeProps> = ({ 
  language, 
  size = 'md', 
  showDot = true,
  className 
}) => {
  const colors = languageColors[language] || languageColors.Unknown;
  
  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs gap-1',
    md: 'px-2 py-0.5 text-xs gap-1.5',
    lg: 'px-3 py-1 text-sm gap-2',
  };

  return (
    <span className={clsx(
      'inline-flex items-center font-medium rounded-full',
      colors.bg,
      colors.text,
      sizes[size],
      className
    )}>
      {showDot && <span className={clsx('w-1.5 h-1.5 rounded-full', colors.dot)} />}
      {language}
    </span>
  );
};

export const LanguageDots: React.FC<{ languages: string[]; maxVisible?: number }> = ({ 
  languages, 
  maxVisible = 4 
}) => {
  const unique = [...new Set(languages)];
  const visible = unique.slice(0, maxVisible);
  const remaining = unique.length - maxVisible;

  return (
    <div className="flex items-center gap-1">
      {visible.map((lang, i) => {
        const colors = languageColors[lang] || languageColors.Unknown;
        return (
          <span
            key={lang}
            className={clsx('w-2 h-2 rounded-full', colors.dot)}
            style={{ zIndex: visible.length - i }}
          />
        );
      })}
      {remaining > 0 && (
        <span className="w-2 h-2 rounded-full bg-white/10 text-white/50 text-[8px] flex items-center justify-center font-mono">
          +{remaining}
        </span>
      )}
    </div>
  );
};