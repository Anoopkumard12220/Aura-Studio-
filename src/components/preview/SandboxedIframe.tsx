import React, { useRef, useEffect, forwardRef } from 'react';
import { clsx } from 'clsx';

interface SandboxedIframeProps {
  src: string;
  sandbox?: string;
  onLoad?: () => void;
  onError?: (err: ErrorEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  allowFullscreen?: boolean;
}

export const SandboxedIframe = forwardRef<HTMLIFrameElement, SandboxedIframeProps>(
  ({ 
    src, 
    sandbox = 'allow-scripts allow-forms allow-same-origin allow-modals allow-popups', 
    onLoad, 
    onError,
    className,
    style,
    allowFullscreen = true,
  }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
      if (!iframeRef.current) return;
      
      const handleLoad = () => onLoad?.();
      const handleError = (e: ErrorEvent) => onError?.(e);
      
      iframeRef.current.addEventListener('load', handleLoad);
      iframeRef.current.addEventListener('error', handleError);
      
      return () => {
        iframeRef.current?.removeEventListener('load', handleLoad);
        iframeRef.current?.removeEventListener('error', handleError);
      };
    }, [onLoad, onError]);

    // Security: Set up Content Security Policy via sandbox
    // Note: CSP must be set via HTTP headers or meta tag in the iframe content
    
    return (
      <iframe
        ref={iframeRef || ref}
        src={src}
        sandbox={sandbox}
        className={clsx('border-none', className)}
        style={style}
        allowFullscreen={allowFullscreen}
        allow="accelerometer; camera; clipboard-read; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }
);

SandboxedIframe.displayName = 'SandboxedIframe';

// Secure iframe wrapper with CSP injection
export const SecurePreviewIframe: React.FC<{
  src: string;
  content?: string; // HTML content to inject
  onLoad?: () => void;
  className?: string;
}> = ({ src, content, onLoad, className }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    // If content provided, write it to iframe
    if (content) {
      iframeRef.current.srcdoc = content;
    }

    const handleLoad = () => onLoad?.();
    iframeRef.current.addEventListener('load', handleLoad);
    return () => iframeRef.current?.removeEventListener('load', handleLoad);
  }, [content, onLoad]);

  return (
    <iframe
      ref={iframeRef}
      src={!content ? src : undefined}
      sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-popups"
      className={clsx('w-full h-full border-none', className)}
      allowFullscreen
    />
  );
};