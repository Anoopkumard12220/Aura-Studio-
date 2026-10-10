export type KeyModifiers = {
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
};

export interface KeyBinding {
  key: string;
  modifiers: KeyModifiers;
  action: string;
  description: string;
  category: string;
  when?: string;
  weight?: number;
}

export interface KeyBindingContext {
  when: string;
  expression: (event: KeyboardEvent) => boolean;
}

export interface KeyboardShortcut {
  key: string;
  modifiers: Partial<KeyModifiers>;
  action: () => void;
  description: string;
}

export const MODIFIER_KEYS: Record<string, keyof KeyModifiers> = {
  ctrl: 'ctrlKey',
  control: 'ctrlKey',
  cmd: 'metaKey',
  command: 'metaKey',
  meta: 'metaKey',
  shift: 'shiftKey',
  alt: 'altKey',
  option: 'altKey',
};

export function parseKeyBinding(binding: string): { key: string; modifiers: KeyModifiers } {
  const parts = binding.toLowerCase().split(/[+\-\s]+/).filter(Boolean);
  const modifiers: KeyModifiers = { ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  let key = '';

  for (const part of parts) {
    if (part in MODIFIER_KEYS) {
      modifiers[MODIFIER_KEYS[part]] = true;
    } else {
      key = part;
    }
  }

  // Normalize key names
  const keyMap: Record<string, string> = {
    escape: 'Escape',
    enter: 'Enter',
    tab: 'Tab',
    space: ' ',
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    backspace: 'Backspace',
    delete: 'Delete',
    home: 'Home',
    end: 'End',
    pageup: 'PageUp',
    pagedown: 'PageDown',
    insert: 'Insert',
    f1: 'F1', f2: 'F2', f3: 'F3', f4: 'F4', f5: 'F5', f6: 'F6',
    f7: 'F7', f8: 'F8', f9: 'F9', f10: 'F10', f11: 'F11', f12: 'F12',
  };
  key = keyMap[key] || key.toUpperCase();

  return { key, modifiers };
}

export function matchKeyBinding(event: KeyboardEvent, binding: { key: string; modifiers: KeyModifiers }): boolean {
  if (event.key !== binding.key) return false;
  if (event.ctrlKey !== binding.modifiers.ctrlKey) return false;
  if (event.metaKey !== binding.modifiers.metaKey) return false;
  if (event.shiftKey !== binding.modifiers.shiftKey) return false;
  if (event.altKey !== binding.modifiers.altKey) return false;
  return true;
}

export function formatKeyBinding(binding: { key: string; modifiers: KeyModifiers }, isMac = navigator.platform.includes('Mac')): string {
  const parts: string[] = [];
  if (binding.modifiers.ctrlKey) parts.push(isMac ? '⌃' : 'Ctrl');
  if (binding.modifiers.metaKey) parts.push(isMac ? '⌘' : 'Meta');
  if (binding.modifiers.shiftKey) parts.push(isMac ? '⇧' : 'Shift');
  if (binding.modifiers.altKey) parts.push(isMac ? '⌥' : 'Alt');
  
  const keyDisplay: Record<string, string> = {
    Escape: 'Esc',
    Enter: isMac ? '⏎' : 'Enter',
    Tab: isMac ? '⇥' : 'Tab',
    ' ': 'Space',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Backspace: isMac ? '⌫' : 'Backspace',
    Delete: isMac ? '⌦' : 'Del',
  };
  parts.push(keyDisplay[binding.key] || binding.key);
  
  return parts.join(isMac ? '' : '+');
}

export const DEFAULT_KEYBINDINGS: KeyBinding[] = [
  // File operations
  { key: 'n', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'file.new', description: 'New File', category: 'File' },
  { key: 'o', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'file.open', description: 'Open File', category: 'File' },
  { key: 's', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'file.save', description: 'Save', category: 'File' },
  { key: 's', modifiers: { ctrlKey: false, metaKey: true, shiftKey: true, altKey: false }, action: 'file.saveAs', description: 'Save As', category: 'File' },
  { key: 'w', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'file.close', description: 'Close Tab', category: 'File' },
  { key: 'w', modifiers: { ctrlKey: false, metaKey: true, shiftKey: true, altKey: false }, action: 'file.closeAll', description: 'Close All Tabs', category: 'File' },
  
  // Edit operations
  { key: 'z', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'edit.undo', description: 'Undo', category: 'Edit' },
  { key: 'z', modifiers: { ctrlKey: false, metaKey: true, shiftKey: true, altKey: false }, action: 'edit.redo', description: 'Redo', category: 'Edit' },
  { key: 'x', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'edit.cut', description: 'Cut', category: 'Edit' },
  { key: 'c', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'edit.copy', description: 'Copy', category: 'Edit' },
  { key: 'v', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'edit.paste', description: 'Paste', category: 'Edit' },
  { key: 'a', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'edit.selectAll', description: 'Select All', category: 'Edit' },
  { key: 'f', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'edit.find', description: 'Find', category: 'Edit' },
  { key: 'f', modifiers: { ctrlKey: false, metaKey: true, shiftKey: true, altKey: false }, action: 'edit.replace', description: 'Replace', category: 'Edit' },
  { key: 'g', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'edit.findNext', description: 'Find Next', category: 'Edit' },
  { key: 'g', modifiers: { ctrlKey: false, metaKey: true, shiftKey: true, altKey: false }, action: 'edit.findPrev', description: 'Find Previous', category: 'Edit' },
  
  // Navigation
  { key: 'p', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'nav.quickOpen', description: 'Quick Open', category: 'Navigation' },
  { key: 'b', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'nav.toggleSidebar', description: 'Toggle Sidebar', category: 'Navigation' },
  { key: 'j', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'nav.togglePanel', description: 'Toggle Panel', category: 'Navigation' },
  { key: 'k', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'nav.commandPalette', description: 'Command Palette', category: 'Navigation' },
  { key: '`', modifiers: { ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }, action: 'nav.toggleTerminal', description: 'Toggle Terminal', category: 'Navigation' },
  
  // Runtime
  { key: 'Enter', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'runtime.run', description: 'Run Code', category: 'Runtime' },
  { key: 'Enter', modifiers: { ctrlKey: false, metaKey: true, shiftKey: true, altKey: false }, action: 'runtime.runWithArgs', description: 'Run with Arguments', category: 'Runtime' },
  { key: 'F5', modifiers: { ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }, action: 'runtime.debug', description: 'Start Debugging', category: 'Runtime' },
  { key: 'F9', modifiers: { ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }, action: 'runtime.toggleBreakpoint', description: 'Toggle Breakpoint', category: 'Runtime' },
  
  // View
  { key: '1', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'view.focusEditor1', description: 'Focus Editor 1', category: 'View' },
  { key: '2', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'view.focusEditor2', description: 'Focus Editor 2', category: 'View' },
  { key: '3', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'view.focusEditor3', description: 'Focus Editor 3', category: 'View' },
  { key: '4', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'view.focusEditor4', description: 'Focus Editor 4', category: 'View' },
  { key: '0', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'view.focusSidebar', description: 'Focus Sidebar', category: 'View' },
  
  // Developer
  { key: 'i', modifiers: { ctrlKey: false, metaKey: true, shiftKey: true, altKey: false }, action: 'dev.toggleDevTools', description: 'Toggle DevTools', category: 'Developer' },
  { key: 'r', modifiers: { ctrlKey: false, metaKey: true, shiftKey: false, altKey: false }, action: 'dev.reload', description: 'Reload Window', category: 'Developer' },
];

export const CONTEXT_EXPRESSIONS: Record<string, (event: KeyboardEvent) => boolean> = {
  editorFocus: () => document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT' || document.activeElement?.classList.contains('monaco-editor'),
  editorTextFocus: () => document.activeElement?.tagName === 'TEXTAREA' || (document.activeElement as HTMLElement)?.classList.contains('monaco-editor'),
  terminalFocus: () => (document.activeElement as HTMLElement)?.closest('.xterm') !== null,
  sidebarFocus: () => (document.activeElement as HTMLElement)?.closest('[data-sidebar]') !== null,
  panelFocus: () => (document.activeElement as HTMLElement)?.closest('[data-panel]') !== null,
  noModals: () => !document.querySelector('[role="dialog"]'),
  hasSelection: () => window.getSelection()?.toString().length > 0,
};