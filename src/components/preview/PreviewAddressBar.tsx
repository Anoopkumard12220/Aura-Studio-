import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Lock, Globe, RefreshCw } from 'lucide-react';

interface PreviewAddressBarProps {
  url: string;
  onReload: () => void;
  isLoading?: boolean;
}

export const PreviewAddressBar: React.FC<PreviewAddressBarProps> = ({ 
  url, 
  onReload, 
  isLoading 
}) => {
  const getDisplayUrl = (url: string) => {
    if (url === 'about:blank') return 'about:blank';
    if (url.startsWith('blob:')) return 'Local Preview';
    try {
      const u = new URL(url);
      return u.host + u.pathname;
    } catch {
      return url;
    }
  };

  const isSecure = url.startsWith('https:') || url.startsWith('blob:');

  return (
    <div className="flex items-center gap-2 bg-[#111217] border border-white/[0.06] rounded-lg px-3 py-1.5 min-w-[300px] max-w-[500px] flex-1">
      <span className="text-white/40 text-xs flex-shrink-0">
        {isSecure ? (
          <Lock className="w-3 h-3 text-green-400" />
        ) : (
          <Globe className="w-3 h-3 text-amber-400" />
        )}
      </span>
      <input
        type="text"
        value={getDisplayUrl(url)}
        readOnly
        className={twMerge(
          'flex-1 bg-transparent text-white/80 text-xs font-mono outline-none',
          'placeholder:text-white/40'
        )}
        placeholder="Enter URL or load project..."
      />
      <button
        onClick={onReload}
        disabled={isLoading}
        className={clsx(
          'p-1.5 rounded hover:bg-white/[0.06] transition-colors flex-shrink-0',
          isLoading ? 'text-white/40 animate-spin' : 'text-white/60 hover:text-white'
        )}
        title="Reload"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
};