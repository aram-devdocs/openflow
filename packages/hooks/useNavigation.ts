/**
 * Navigation context hook for managing sidebar and mobile drawer state.
 *
 * This hook provides centralized navigation state management that persists
 * sidebar collapsed state in localStorage and manages mobile drawer state
 * in session memory.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/** Storage key for sidebar collapsed state in localStorage */
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'openflow-sidebar-collapsed';

export interface NavigationContextValue {
  /** Whether the sidebar is collapsed (desktop only) */
  sidebarCollapsed: boolean;
  /** Toggle sidebar collapsed state */
  toggleSidebar: () => void;
  /** Set sidebar collapsed state directly */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Whether the mobile drawer is open */
  isMobileDrawerOpen: boolean;
  /** Open the mobile drawer */
  openMobileDrawer: () => void;
  /** Close the mobile drawer */
  closeMobileDrawer: () => void;
  /** Set mobile drawer open state */
  setMobileDrawerOpen: (open: boolean) => void;
}

/**
 * Context for navigation state.
 * Used internally by NavigationProvider and useNavigation.
 */
export const NavigationContext = createContext<NavigationContextValue | null>(null);

/**
 * Provider hook that manages navigation state.
 * Use this in your NavigationProvider component.
 *
 * Features:
 * - Sidebar collapsed state persisted to localStorage
 * - Mobile drawer state (session-only)
 * - Memoized context value to prevent unnecessary re-renders
 *
 * @example
 * function NavigationProvider({ children }) {
 *   const value = useNavigationProvider();
 *   return (
 *     <NavigationContext.Provider value={value}>
 *       {children}
 *     </NavigationContext.Provider>
 *   );
 * }
 */
export function useNavigationProvider(): NavigationContextValue {
  // Sidebar collapsed state - persisted to localStorage
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      return stored === 'true';
    }
    return false;
  });

  // Mobile drawer state - session only (not persisted)
  const [isMobileDrawerOpen, setMobileDrawerOpenState] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsedState((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
  }, []);

  const openMobileDrawer = useCallback(() => {
    setMobileDrawerOpenState(true);
  }, []);

  const closeMobileDrawer = useCallback(() => {
    setMobileDrawerOpenState(false);
  }, []);

  const setMobileDrawerOpen = useCallback((open: boolean) => {
    setMobileDrawerOpenState(open);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo<NavigationContextValue>(
    () => ({
      sidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
      isMobileDrawerOpen,
      openMobileDrawer,
      closeMobileDrawer,
      setMobileDrawerOpen,
    }),
    [
      sidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
      isMobileDrawerOpen,
      openMobileDrawer,
      closeMobileDrawer,
      setMobileDrawerOpen,
    ]
  );

  return value;
}

/**
 * Hook to access navigation functionality.
 * Must be used within a NavigationProvider.
 *
 * @example
 * const { sidebarCollapsed, toggleSidebar, isMobileDrawerOpen } = useNavigation();
 *
 * // Toggle sidebar
 * toggleSidebar();
 *
 * // Check sidebar state
 * if (sidebarCollapsed) { ... }
 *
 * // Control mobile drawer
 * openMobileDrawer();
 * closeMobileDrawer();
 */
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
