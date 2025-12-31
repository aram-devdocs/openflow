/**
 * Hook for managing global keyboard shortcuts that work across all pages.
 *
 * This hook provides a centralized way to:
 * - Register handlers for global shortcuts (Cmd+N, Cmd+,)
 * - Trigger these shortcuts from anywhere in the app
 * - Allow child components to provide their own handlers
 *
 * Global shortcuts:
 * - Cmd+N: Create new task
 * - Cmd+,: Open settings
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface GlobalShortcutsContextValue {
  /**
   * Register a handler for the "new task" shortcut (Cmd+N).
   * Returns an unregister function.
   */
  registerNewTaskHandler: (handler: () => void) => () => void;

  /**
   * Register a handler for the "settings" shortcut (Cmd+,).
   * Returns an unregister function.
   */
  registerSettingsHandler: (handler: () => void) => () => void;

  /**
   * Trigger the new task action programmatically.
   */
  triggerNewTask: () => void;

  /**
   * Trigger the settings action programmatically.
   */
  triggerSettings: () => void;

  /**
   * Whether a new task handler is registered (for UI hints).
   */
  hasNewTaskHandler: boolean;

  /**
   * Whether a settings handler is registered (for UI hints).
   */
  hasSettingsHandler: boolean;
}

/**
 * Context for global shortcuts.
 */
export const GlobalShortcutsContext = createContext<GlobalShortcutsContextValue | null>(null);

/**
 * Provider hook for global shortcuts.
 * Use this in the GlobalShortcutsProvider component.
 *
 * @param navigate - Navigation function for fallback settings navigation
 */
export function useGlobalShortcutsProvider(
  navigate?: (path: string) => void
): GlobalShortcutsContextValue {
  // Use refs for handlers to avoid re-registering event listeners
  const newTaskHandlerRef = useRef<(() => void) | null>(null);
  const settingsHandlerRef = useRef<(() => void) | null>(null);

  // Track if handlers exist (for UI hints)
  const [hasNewTaskHandler, setHasNewTaskHandler] = useState(false);
  const [hasSettingsHandler, setHasSettingsHandler] = useState(false);

  const registerNewTaskHandler = useCallback((handler: () => void) => {
    newTaskHandlerRef.current = handler;
    setHasNewTaskHandler(true);

    return () => {
      if (newTaskHandlerRef.current === handler) {
        newTaskHandlerRef.current = null;
        setHasNewTaskHandler(false);
      }
    };
  }, []);

  const registerSettingsHandler = useCallback((handler: () => void) => {
    settingsHandlerRef.current = handler;
    setHasSettingsHandler(true);

    return () => {
      if (settingsHandlerRef.current === handler) {
        settingsHandlerRef.current = null;
        setHasSettingsHandler(false);
      }
    };
  }, []);

  const triggerNewTask = useCallback(() => {
    if (newTaskHandlerRef.current) {
      newTaskHandlerRef.current();
    }
  }, []);

  const triggerSettings = useCallback(() => {
    if (settingsHandlerRef.current) {
      settingsHandlerRef.current();
    } else if (navigate) {
      // Fallback: navigate to settings if no custom handler
      navigate('/settings');
    }
  }, [navigate]);

  // Register global keyboard event listeners
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Cmd+N: New task (prevent browser's default new window behavior)
      if (isMeta && e.key.toLowerCase() === 'n' && !e.shiftKey && !e.altKey) {
        if (newTaskHandlerRef.current) {
          e.preventDefault();
          newTaskHandlerRef.current();
          return;
        }
      }

      // Cmd+,: Settings (common Mac shortcut for preferences)
      if (isMeta && e.key === ',' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        if (settingsHandlerRef.current) {
          settingsHandlerRef.current();
        } else if (navigate) {
          navigate('/settings');
        }
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  return useMemo(
    () => ({
      registerNewTaskHandler,
      registerSettingsHandler,
      triggerNewTask,
      triggerSettings,
      hasNewTaskHandler,
      hasSettingsHandler,
    }),
    [
      registerNewTaskHandler,
      registerSettingsHandler,
      triggerNewTask,
      triggerSettings,
      hasNewTaskHandler,
      hasSettingsHandler,
    ]
  );
}

/**
 * Hook to access global shortcuts functionality.
 * Must be used within a GlobalShortcutsProvider.
 *
 * @example
 * // Register a handler for Cmd+N
 * const { registerNewTaskHandler } = useGlobalShortcuts();
 *
 * useEffect(() => {
 *   return registerNewTaskHandler(() => {
 *     setCreateTaskDialogOpen(true);
 *   });
 * }, [registerNewTaskHandler]);
 */
export function useGlobalShortcuts(): GlobalShortcutsContextValue {
  const context = useContext(GlobalShortcutsContext);
  if (!context) {
    throw new Error('useGlobalShortcuts must be used within a GlobalShortcutsProvider');
  }
  return context;
}

/**
 * Hook to register a new task handler.
 * Automatically unregisters on unmount.
 *
 * @example
 * useNewTaskShortcut(() => {
 *   setCreateTaskDialogOpen(true);
 * });
 */
export function useNewTaskShortcut(handler: () => void): void {
  const { registerNewTaskHandler } = useGlobalShortcuts();

  useEffect(() => {
    return registerNewTaskHandler(handler);
  }, [registerNewTaskHandler, handler]);
}

/**
 * Hook to register a settings handler.
 * Automatically unregisters on unmount.
 *
 * @example
 * useSettingsShortcut(() => {
 *   navigate('/settings');
 * });
 */
export function useSettingsShortcut(handler: () => void): void {
  const { registerSettingsHandler } = useGlobalShortcuts();

  useEffect(() => {
    return registerSettingsHandler(handler);
  }, [registerSettingsHandler, handler]);
}
