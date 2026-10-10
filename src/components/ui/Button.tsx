import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700',
      secondary: 'bg-surface border border-white/10 text-white hover:bg-surface/80 hover:border-white/20 active:bg-raised',
      ghost: 'text-white/80 hover:bg-white/10 active:bg-white/15',
      danger: 'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700',
    };
    
    const sizes = {
      sm: 'px-2.5 py-1.5 text-xs gap-1.5',
      md: 'px-3 py-1.5 text-sm gap-2',
      lg: 'px-4 py-2 text-base gap-2',
    };

    return (
      <button
        ref={ref}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size]), className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';