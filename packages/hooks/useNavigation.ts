/**
 * Navigation context hook for managing sidebar and mobile drawer state.
 *
 * This hook provides centralized navigation state management that persists
 * sidebar collapsed state in localStorage and manages mobile drawer state
 * in session memory.
 */
import { createLogger } from '@openflow/utils';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const logger = createLogger('useNavigation');

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
  // Track initialization for logging
  const hasLoggedInit = useRef(false);

  // Sidebar collapsed state - persisted to localStorage
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      const initialValue = stored === 'true';

      // Log initialization once
      if (!hasLoggedInit.current) {
        hasLoggedInit.current = true;
        logger.debug('Navigation provider initialized', {
          sidebarCollapsed: initialValue,
          restoredFromStorage: stored !== null,
        });
      }

      return initialValue;
    }
    return false;
  });

  // Mobile drawer state - session only (not persisted)
  const [isMobileDrawerOpen, setMobileDrawerOpenState] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsedState((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
      logger.info('Sidebar toggled', {
        previousState: prev ? 'collapsed' : 'expanded',
        newState: next ? 'collapsed' : 'expanded',
      });
      return next;
    });
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState((prev) => {
      if (prev !== collapsed) {
        logger.info('Sidebar state set', {
          previousState: prev ? 'collapsed' : 'expanded',
          newState: collapsed ? 'collapsed' : 'expanded',
        });
      }
      return collapsed;
    });
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
  }, []);

  const openMobileDrawer = useCallback(() => {
    setMobileDrawerOpenState((prev) => {
      if (!prev) {
        logger.info('Mobile drawer opened');
      }
      return true;
    });
  }, []);

  const closeMobileDrawer = useCallback(() => {
    setMobileDrawerOpenState((prev) => {
      if (prev) {
        logger.info('Mobile drawer closed');
      }
      return false;
    });
  }, []);

  const setMobileDrawerOpen = useCallback((open: boolean) => {
    setMobileDrawerOpenState((prev) => {
      if (prev !== open) {
        logger.debug('Mobile drawer state set', {
          previousState: prev ? 'open' : 'closed',
          newState: open ? 'open' : 'closed',
        });
      }
      return open;
    });
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
    const error = new Error('useNavigation must be used within a NavigationProvider');
    logger.error('useNavigation called outside of NavigationProvider', {
      error: error.message,
    });
    throw error;
  }
  return context;
}
