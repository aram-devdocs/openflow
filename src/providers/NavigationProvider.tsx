/**
 * NavigationProvider
 *
 * Provides navigation context to the application.
 * This provider lives in src/ because it needs to import from hooks package.
 */
import { NavigationContext, useNavigationProvider } from '@openflow/hooks';
import type { ReactNode } from 'react';

export interface NavigationProviderProps {
  children: ReactNode;
}

/**
 * NavigationProvider manages navigation state across the application.
 * Wraps your app to enable shared sidebar and mobile drawer state.
 *
 * Features:
 * - Sidebar collapsed state persisted to localStorage
 * - Mobile drawer state (session-only)
 * - Single source of truth for navigation state across all routes
 *
 * @example
 * <NavigationProvider>
 *   <App />
 * </NavigationProvider>
 *
 * // Later, in a component:
 * const { sidebarCollapsed, toggleSidebar } = useNavigation();
 * toggleSidebar();
 */
export function NavigationProvider({ children }: NavigationProviderProps) {
  const navigationValue = useNavigationProvider();

  return (
    <NavigationContext.Provider value={navigationValue}>{children}</NavigationContext.Provider>
  );
}

NavigationProvider.displayName = 'NavigationProvider';
