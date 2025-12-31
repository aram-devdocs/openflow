/**
 * Theme management hook with system preference detection and persistence.
 *
 * Supports three modes:
 * - 'light': Force light theme
 * - 'dark': Force dark theme
 * - 'system': Follow system preference (default)
 *
 * The resolved theme is applied to the document root as a '.light' class
 * (dark mode is the default, no class needed).
 */
import { createContext, useContext, useEffect, useState } from 'react';

/** Available theme options */
export type Theme = 'light' | 'dark' | 'system';

/** The actual theme being displayed (after resolving 'system') */
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  /** The user's theme preference (may be 'system') */
  theme: Theme;
  /** The actual theme being displayed */
  resolvedTheme: ResolvedTheme;
  /** Set the theme preference */
  setTheme: (theme: Theme) => void;
}

/** Storage key for theme preference in localStorage */
const THEME_STORAGE_KEY = 'openflow-theme';

/**
 * Hook to detect system color scheme preference.
 * Automatically updates when the system preference changes.
 */
function useSystemTheme(): ResolvedTheme {
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark'; // Default to dark when no window (SSR)
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return systemTheme;
}

/**
 * Provider hook that manages theme state.
 * Use this in your ThemeProvider component.
 */
export function useThemeProvider(): ThemeContextValue {
  const systemTheme = useSystemTheme();
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    }
    return 'system'; // Default to system preference
  });

  // Compute the resolved theme
  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    // Add light class if light theme (dark is default, no class needed)
    if (resolvedTheme === 'light') {
      root.classList.add('light');
    }
  }, [resolvedTheme]);

  return { theme, resolvedTheme, setTheme };
}

/**
 * Context for theme values.
 * Used internally by ThemeProvider and useTheme.
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Hook to access theme functionality.
 * Must be used within a ThemeProvider.
 *
 * @example
 * const { theme, resolvedTheme, setTheme } = useTheme();
 *
 * // Check current theme
 * console.log(resolvedTheme); // 'light' or 'dark'
 *
 * // Set theme
 * setTheme('dark');
 * setTheme('light');
 * setTheme('system'); // Follow system preference
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
