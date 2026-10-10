export interface VisualViewportState {
  height: number;
  width: number;
  offsetLeft: number;
  offsetTop: number;
  pageLeft: number;
  pageTop: number;
  scale: number;
  isKeyboardOpen: boolean;
  keyboardHeight: number;
}

export interface TouchTarget {
  minWidth: number;
  minHeight: number;
  recommendedWidth: number;
  recommendedHeight: number;
}

export const TOUCH_TARGETS: TouchTarget = {
  minWidth: 44,
  minHeight: 44,
  recommendedWidth: 48,
  recommendedHeight: 48,
};

export interface MobileLayoutState {
  isMobile: boolean;
  isTablet: boolean;
  isLandscape: boolean;
  sidebarMode: 'docked' | 'drawer' | 'hidden';
  bottomPanelMode: 'docked' | 'sheet' | 'hidden';
  accessoryBarVisible: boolean;
}

export interface ViewportMetrics {
  innerWidth: number;
  innerHeight: number;
  visualViewportHeight: number;
  visualViewportWidth: number;
  keyboardHeight: number;
  scale: number;
}

export interface MobileGestureConfig {
  pinchZoomEnabled: boolean;
  touchSelectionEnabled: boolean;
  longPressDelay: number;
  doubleTapDelay: number;
  swipeThreshold: number;
}

export const DEFAULT_GESTURE_CONFIG: MobileGestureConfig = {
  pinchZoomEnabled: true,
  touchSelectionEnabled: true,
  longPressDelay: 500,
  doubleTapDelay: 300,
  swipeThreshold: 50,
};

export interface AccessoryKey {
  key: string;
  insertText: string;
  label: string;
  icon?: string;
}

export const ACCESSORY_KEYS: AccessoryKey[] = [
  { key: 'Tab', insertText: '  ', label: 'Tab' },
  { key: '{', insertText: '{', label: '{' },
  { key: '}', insertText: '}', label: '}' },
  { key: '[', insertText: '[', label: '[' },
  { key: ']', insertText: ']', label: ']' },
  { key: '(', insertText: '(', label: '(' },
  { key: ')', insertText: ')', label: ')' },
  { key: ';', insertText: ';', label: ';' },
  { key: '=', insertText: '=', label: '=' },
  { key: '"', insertText: '"', label: '"' },
  { key: "'", insertText: "'", label: "'" },
  { key: '`', insertText: '`', label: '`' },
];

export interface MobileBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

export const MOBILE_BREAKPOINTS: MobileBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};

export function isMobileViewport(width: number = window.innerWidth): boolean {
  return width < MOBILE_BREAKPOINTS.mobile;
}

export function isTabletViewport(width: number = window.innerWidth): boolean {
  return width >= MOBILE_BREAKPOINTS.mobile && width < MOBILE_BREAKPOINTS.tablet;
}

export function getSidebarMode(width: number): MobileLayoutState['sidebarMode'] {
  if (width < MOBILE_BREAKPOINTS.mobile) return 'drawer';
  if (width < MOBILE_BREAKPOINTS.tablet) return 'docked';
  return 'docked';
}

export function getBottomPanelMode(width: number): MobileLayoutState['bottomPanelMode'] {
  if (width < MOBILE_BREAKPOINTS.mobile) return 'sheet';
  return 'docked';
}