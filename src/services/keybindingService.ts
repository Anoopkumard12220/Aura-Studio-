import { 
  KeyBinding, 
  KeyModifiers, 
  parseKeyBinding, 
  matchKeyBinding, 
  formatKeyBinding, 
  DEFAULT_KEYBINDINGS, 
  CONTEXT_EXPRESSIONS 
} from '@/types/shortcuts';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface KeybindingState {
  bindings: KeyBinding[];
  isMac: boolean;
  registerBinding: (binding: KeyBinding) => void;
  unregisterBinding: (action: string) => void;
  getBindingForAction: (action: string) => KeyBinding | undefined;
  getFormattedBinding: (action: string) => string;
  handleKeyDown: (event: KeyboardEvent) => boolean;
  resetToDefaults: () => void;
}

const STORAGE_KEY = 'aura_keybindings';

function loadCustomBindings(): KeyBinding[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((b: any) => ({
        ...b,
        modifiers: {
          ctrlKey: b.modifiers.ctrlKey ?? false,
          metaKey: b.modifiers.metaKey ?? false,
          shiftKey: b.modifiers.shiftKey ?? false,
          altKey: b.modifiers.altKey ?? false,
        },
      }));
    }
  } catch {}
  return [];
}

function saveCustomBindings(bindings: KeyBinding[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
  } catch {}
}

export const useKeybindingStore = create<KeybindingState>()(
  devtools(
    (set, get) => ({
      bindings: [...DEFAULT_KEYBINDINGS, ...loadCustomBindings()],
      isMac: navigator.platform.includes('Mac'),

      registerBinding: (binding) => {
        set((state) => {
          const filtered = state.bindings.filter(b => b.action !== binding.action);
          const updated = [...filtered, binding];
          saveCustomBindings(updated.filter(b => !DEFAULT_KEYBINDINGS.some(d => d.action === b.action)));
          return { bindings: updated };
        });
      },

      unregisterBinding: (action) => {
        set((state) => {
          const updated = state.bindings.filter(b => b.action !== action);
          saveCustomBindings(updated.filter(b => !DEFAULT_KEYBINDINGS.some(d => d.action === b.action)));
          return { bindings: updated };
        });
      },

      getBindingForAction: (action) => {
        return get().bindings.find(b => b.action === action);
      },

      getFormattedBinding: (action) => {
        const binding = get().getBindingForAction(action);
        return binding ? formatKeyBinding({ key: binding.key, modifiers: binding.modifiers }, get().isMac) : '';
      },

      handleKeyDown: (event) => {
        const { bindings, isMac } = get();
        
        // Check context expressions
        for (const binding of bindings) {
          if (binding.when && CONTEXT_EXPRESSIONS[binding.when]) {
            if (!CONTEXT_EXPRESSIONS[binding.when]!(event)) continue;
          }

          if (matchKeyBinding(event, { key: binding.key, modifiers: binding.modifiers })) {
            // Dispatch custom event for the action
            window.dispatchEvent(new CustomEvent('aura-keybinding', { 
              detail: { action: binding.action, event } 
            }));
            return true;
          }
        }
        return false;
      },

      resetToDefaults: () => {
        set({ bindings: DEFAULT_KEYBINDINGS });
        localStorage.removeItem(STORAGE_KEY);
      },
    }),
    { name: 'keybinding-store' }
  )
);

// Initialize global keyboard listener
if (typeof window !== 'undefined') {
  const store = useKeybindingStore.getState();
  
  window.addEventListener('keydown', (event) => {
    // Skip if in input/textarea (unless it's a global shortcut)
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    // Allow global shortcuts (Cmd/Ctrl) to pass through even in inputs
    const isGlobalShortcut = event.metaKey || event.ctrlKey;
    
    if (isInput && !isGlobalShortcut) return;
    
    store.handleKeyDown(event);
  });
}

// Action handler registry
type ActionHandler = (event: KeyboardEvent) => void;
const actionHandlers = new Map<string, ActionHandler[]>();

export function registerActionHandler(action: string, handler: ActionHandler): () => void {
  const handlers = actionHandlers.get(action) || [];
  handlers.push(handler);
  actionHandlers.set(action, handlers);
  
  return () => {
    const handlers = actionHandlers.get(action) || [];
    const idx = handlers.indexOf(handler);
    if (idx !== -1) handlers.splice(idx, 1);
  };
}

export function dispatchKeybindingAction(action: string, event: KeyboardEvent): void {
  const handlers = actionHandlers.get(action) || [];
  handlers.forEach(h => h(event));
}

// Built-in action handlers
export function setupDefaultHandlers(): void {
  const { toggleSidebar, toggleBottomPanel, setActiveBottomTab } = require('@/stores/useLayoutStore').useLayoutStore.getState();
  const { createFile } = require('@/stores/useFileStore').useFileStore.getState();

  registerActionHandler('nav.toggleSidebar', () => toggleSidebar());
  registerActionHandler('nav.togglePanel', () => toggleBottomPanel());
  registerActionHandler('nav.commandPalette', () => {
    window.dispatchEvent(new CustomEvent('aura-open-command-palette'));
  });
  registerActionHandler('file.new', () => createFile('untitled.ts', null, false, '// New file\n'));
  registerActionHandler('runtime.run', () => {
    setActiveBottomTab('terminal');
    window.dispatchEvent(new CustomEvent('aura-run-code'));
  });
}