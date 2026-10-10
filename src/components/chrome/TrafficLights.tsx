import React, { useState } from 'react';

export const TrafficLights: React.FC = () => {
  const [hovered, setHovered] = useState<'close' | 'minimize' | 'fullscreen' | null>(null);

  const buttons = [
    { id: 'close', color: '#ff5f56', symbol: hovered === 'close' ? '✕' : '' },
    { id: 'minimize', color: '#ffbd2e', symbol: hovered === 'minimize' ? '—' : '' },
    { id: 'fullscreen', color: '#27c93f', symbol: hovered === 'fullscreen' ? '⛶' : '' },
  ];

  return (
    <div className="flex items-center space-x-1.5" role="group" aria-label="Window controls">
      {buttons.map(({ id, color, symbol }) => (
        <button
          key={id}
          type="button"
          className="w-3 h-3 rounded-full transition-all duration-150 flex items-center justify-center"
          style={{ backgroundColor: color }}
          onMouseEnter={() => setHovered(id as typeof hovered)}
          onMouseLeave={() => setHovered(null)}
          aria-label={id.charAt(0).toUpperCase() + id.slice(1)}
          onClick={() => {
            if (id === 'close') window.close();
            else if (id === 'minimize') window.electron?.minimize?.();
            else if (id === 'fullscreen') window.electron?.maximize?.();
          }}
        >
          <span 
            className="text-[8px] font-bold text-black/60 opacity-0 transition-opacity"
            style={{ lineHeight: 1 }}
          >
            {symbol}
          </span>
        </button>
      ))}
    </div>
  );
};