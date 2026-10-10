import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    info: <Info className="w-5 h-5 text-sky-400" />,
  };

  const colors = {
    success: 'border-emerald-500/30 bg-emerald-500/10',
    error: 'border-rose-500/30 bg-rose-500/10',
    warning: 'border-amber-500/30 bg-amber-500/10',
    info: 'border-sky-500/30 bg-sky-500/10',
  };

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove, toast.duration]);

  return (
    <div className={twMerge(
      'flex items-start gap-3 p-4 rounded-lg border animate-slide-in',
      colors[toast.type]
    )} role="alert">
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{toast.title}</p>
        {toast.message && (
          <p className="text-sm text-white/70 mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-80 max-w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  );
};

let toasts: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

const notify = () => {
  listeners.forEach(listener => listener([...toasts]));
};

export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, type: 'success', title, message, duration }];
    notify();
    return id;
  },
  error: (title: string, message?: string, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, type: 'error', title, message, duration }];
    notify();
    return id;
  },
  warning: (title: string, message?: string, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, type: 'warning', title, message, duration }];
    notify();
    return id;
  },
  info: (title: string, message?: string, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, type: 'info', title, message, duration }];
    notify();
    return id;
  },
  remove: (id: string) => {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  },
  subscribe: (listener: (toasts: Toast[]) => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe(setCurrentToasts);
    setCurrentToasts([...toasts]);
    return unsubscribe;
  }, []);

  return (
    <>
      {children}
      <ToastContainer toasts={currentToasts} onRemove={toast.remove} />
    </>
  );
};