/**
 * GlobalShortcutsProvider
 *
 * Provides global keyboard shortcut context to the application.
 * This provider lives in src/ because it needs to import from hooks package
 * and use router navigation.
 */
import { GlobalShortcutsContext, useGlobalShortcutsProvider } from '@openflow/hooks';
import { useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';

export interface GlobalShortcutsProviderProps {
  children: ReactNode;
}

/**
 * GlobalShortcutsProvider manages global keyboard shortcuts across the application.
 *
 * Registered shortcuts:
 * - Cmd+N: Create new task (requires handler registration from a page)
 * - Cmd+,: Open settings (fallback navigates to /settings)
 *
 * Features:
 * - Works across all pages
 * - Allows pages to register custom handlers
 * - Fallback navigation when no handler is registered
 *
 * @example
 * <GlobalShortcutsProvider>
 *   <App />
 * </GlobalShortcutsProvider>
 *
 * // Later, in a component:
 * const { registerNewTaskHandler } = useGlobalShortcuts();
 * useEffect(() => {
 *   return registerNewTaskHandler(() => setDialogOpen(true));
 * }, [registerNewTaskHandler]);
 */
export function GlobalShortcutsProvider({ children }: GlobalShortcutsProviderProps) {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate({ to: path });
  };

  const value = useGlobalShortcutsProvider(handleNavigate);

  return (
    <GlobalShortcutsContext.Provider value={value}>{children}</GlobalShortcutsContext.Provider>
  );
}

GlobalShortcutsProvider.displayName = 'GlobalShortcutsProvider';
