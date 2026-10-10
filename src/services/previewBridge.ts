import { PreviewIncomingMessage, PreviewOutgoingMessage } from '@/types/preview';

export class PreviewBridge {
  private listener: ((msg: PreviewIncomingMessage) => void) | null = null;
  private targetOrigin: string = '*';

  connect(onMessage: (msg: PreviewIncomingMessage) => void, targetOrigin?: string) {
    if (targetOrigin) this.targetOrigin = targetOrigin;
    
    this.listener = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'PREVIEW_CONSOLE' || event.data.type === 'PREVIEW_UNCAUGHT_ERROR') {
        onMessage(event.data as PreviewIncomingMessage);
      }
    };
    window.addEventListener('message', this.listener);
  }

  disconnect() {
    if (this.listener) {
      window.removeEventListener('message', this.listener);
      this.listener = null;
    }
  }

  sendToPreview(iframe: HTMLIFrameElement, message: PreviewOutgoingMessage) {
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage(message, this.targetOrigin);
    }
  }

  static getInjectionScript(): string {
    return `
      <script>
        (function() {
          const levels = ['log', 'info', 'warn', 'error'];
          levels.forEach(level => {
            const original = console[level];
            console[level] = function(...args) {
              original.apply(console, args);
              try {
                window.parent.postMessage({
                  type: 'PREVIEW_CONSOLE',
                  level: level,
                  args: args.map(a => {
                    if (a instanceof Error) {
                      return { __error: true, message: a.message, stack: a.stack, name: a.name };
                    }
                    if (typeof a === 'object' && a !== null) {
                      try {
                        return JSON.parse(JSON.stringify(a));
                      } catch {
                        return String(a);
                      }
                    }
                    return String(a);
                  }),
                  timestamp: Date.now()
                }, '*');
              } catch(e) {}
            };
          });

          window.addEventListener('error', function(e) {
            window.parent.postMessage({
              type: 'PREVIEW_UNCAUGHT_ERROR',
              message: e.message,
              source: e.filename,
              lineno: e.lineno,
              colno: e.colno,
              stack: e.error ? e.error.stack : undefined
            }, '*');
          });

          window.addEventListener('unhandledrejection', function(e) {
            window.parent.postMessage({
              type: 'PREVIEW_UNCAUGHT_ERROR',
              message: 'Unhandled Promise Rejection: ' + (e.reason?.message || String(e.reason)),
              stack: e.reason?.stack
            }, '*');
          });
        })();
      </script>
    `;
  }

  static createInstrumentedHTML(baseHTML: string, injectionScript?: string): string {
    const script = injectionScript || this.getInjectionScript();
    const headEnd = baseHTML.indexOf('</head>');
    if (headEnd !== -1) {
      return baseHTML.slice(0, headEnd) + script + baseHTML.slice(headEnd);
    }
    return script + baseHTML;
  }
}

export const previewBridge = new PreviewBridge();