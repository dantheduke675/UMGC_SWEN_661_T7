/**
 * ThemeContext — a single source of truth for light/dark mode across the
 * entire app (login flow + the post-login tab shell). Previously each
 * screen tracked `isDark` in its own local `useState`, so toggling the
 * theme on one screen was forgotten the moment you navigated to the next.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ColorScheme, dark, light } from '../constants/theme';

interface ThemeContextValue {
  isDark:       boolean;
  scheme:       ColorScheme;
  toggleTheme:  () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark:      true,
  scheme:      dark,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const toggleTheme = useCallback(() => setIsDark(d => !d), []);
  const scheme = isDark ? dark : light;

  return (
    <ThemeContext.Provider value={{ isDark, scheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
