import { useState, useEffect, useCallback } from 'react';
import { VisualViewportState, MOBILE_BREAKPOINTS } from '@/types/mobile';

export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>({
    height: typeof window !== 'undefined' ? window.visualViewport?.height || window.innerHeight : 0,
    width: typeof window !== 'undefined' ? window.visualViewport?.width || window.innerWidth : 0,
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    scale: 1,
    isKeyboardOpen: false,
    keyboardHeight: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const vv = window.visualViewport;

    const update = () => {
      const keyboardHeight = window.innerHeight - vv.height;
      const isKeyboardOpen = keyboardHeight > 100;

      setState({
        height: vv.height,
        width: vv.width,
        offsetLeft: vv.offsetLeft,
        offsetTop: vv.offsetTop,
        pageLeft: vv.pageLeft,
        pageTop: vv.pageTop,
        scale: vv.scale,
        isKeyboardOpen,
        keyboardHeight: isKeyboardOpen ? keyboardHeight : 0,
      });
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    update();

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return state;
}

export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINTS.mobile): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}

export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsTablet(w >= MOBILE_BREAKPOINTS.mobile && w < MOBILE_BREAKPOINTS.tablet);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isTablet;
}

export function useViewport(): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return size;
}

export function useKeyboardOpen(): boolean {
  const { isKeyboardOpen } = useVisualViewport();
  return isKeyboardOpen;
}