import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';
import { RefreshCw, AlertTriangle, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('Aura Studio Error:', error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/95 backdrop-blur-sm">
          <div className="bg-frame border border-white/10 rounded-xl p-8 max-w-md w-full mx-4 glass-strong">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-rose-400" />
              </div>
              
              <div>
                <h2 className="text-lg font-semibold text-white">Kernel Panic</h2>
                <p className="text-sm text-secondary mt-1">Aura Studio encountered an unexpected error</p>
              </div>

              <details className="w-full text-left">
                <summary className="text-xs text-secondary cursor-pointer select-none mb-2">
                  Technical Details (Click to expand)
                </summary>
                <pre className="bg-canvas border border-white/10 rounded p-3 text-xs text-secondary overflow-auto max-h-40 font-mono">
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>

              <div className="flex gap-3 w-full pt-2">
                <Button 
                  variant="secondary" 
                  className="flex-1" 
                  onClick={() => navigator.clipboard.writeText(
                    `${this.state.error?.toString()}\n\n${this.state.errorInfo?.componentStack}`
                  )}
                >
                  <Terminal className="w-4 h-4 mr-2" />
                  Copy Error
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1" 
                  onClick={this.handleRestart}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restart Session
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}