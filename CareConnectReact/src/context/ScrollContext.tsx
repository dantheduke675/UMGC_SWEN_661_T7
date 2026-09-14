/**
 * ScrollContext — mirrors Flutter's PrimaryScrollController.
 * Each post-login screen registers a scrollBy function on mount and
 * unregisters on unmount. The AccessBar calls scrollBy(±220) without
 * needing to know which screen is active.
 */
import React, { createContext, useContext, useRef, useCallback } from 'react';

interface ScrollContextValue {
  /** Screens call this on mount with a function that scrolls their list by `delta` pixels. */
  register:   (fn: ((delta: number) => void) | null) => void;
  /** AccessBar calls this to scroll the active screen. */
  scrollBy:   (delta: number) => void;
}

const ScrollContext = createContext<ScrollContextValue>({
  register: () => {},
  scrollBy: () => {},
});

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const scrollFnRef = useRef<((delta: number) => void) | null>(null);

  const register = useCallback((fn: ((delta: number) => void) | null) => {
    scrollFnRef.current = fn;
  }, []);

  const scrollBy = useCallback((delta: number) => {
    scrollFnRef.current?.(delta);
  }, []);

  return (
    <ScrollContext.Provider value={{ register, scrollBy }}>
      {children}
    </ScrollContext.Provider>
  );
}

export const useScrollContext = () => useContext(ScrollContext);
