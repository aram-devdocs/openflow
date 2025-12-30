/**
 * ThemeProvider
 *
 * Provides theme context to the application.
 * This provider lives in src/ because it needs to import from both hooks and UI packages.
 */
import { ThemeContext, useThemeProvider } from '@openflow/hooks';
import type { ReactNode } from 'react';

export interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider manages theme state across the application.
 * Wraps your app to enable theme switching functionality.
 *
 * Features:
 * - System preference detection (prefers-color-scheme)
 * - Persistence to localStorage
 * - Real-time updates when system preference changes
 *
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 *
 * // Later, in a component:
 * const { theme, setTheme } = useTheme();
 * setTheme('dark');
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeValue = useThemeProvider();

  return <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>;
}
