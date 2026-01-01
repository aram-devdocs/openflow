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
import { createLogger } from '@openflow/utils';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const logger = createLogger('useGlobalShortcuts');

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
 * Internal type for tracking handler registrations with unique IDs.
 * Using IDs prevents race conditions when components rapidly mount/unmount.
 */
interface HandlerRegistration {
  id: number;
  handler: () => void;
}

// Counter for unique registration IDs
let registrationIdCounter = 0;

/**
 * Provider hook for global shortcuts.
 * Use this in the GlobalShortcutsProvider component.
 *
 * @param navigate - Navigation function for fallback settings navigation
 */
export function useGlobalShortcutsProvider(
  navigate?: (path: string) => void
): GlobalShortcutsContextValue {
  logger.debug('useGlobalShortcutsProvider initialized', {
    hasNavigate: !!navigate,
  });

  // Use refs for handlers to avoid re-registering event listeners
  // Store as registration objects to prevent race conditions
  const newTaskHandlerRef = useRef<HandlerRegistration | null>(null);
  const settingsHandlerRef = useRef<HandlerRegistration | null>(null);

  // Track if handlers exist (for UI hints)
  const [hasNewTaskHandler, setHasNewTaskHandler] = useState(false);
  const [hasSettingsHandler, setHasSettingsHandler] = useState(false);

  const registerNewTaskHandler = useCallback((handler: () => void) => {
    const id = ++registrationIdCounter;
    newTaskHandlerRef.current = { id, handler };
    setHasNewTaskHandler(true);
    logger.debug('New task handler registered', { registrationId: id });

    return () => {
      // Only clear if this is still the current registration (prevents race conditions)
      if (newTaskHandlerRef.current?.id === id) {
        newTaskHandlerRef.current = null;
        setHasNewTaskHandler(false);
        logger.debug('New task handler unregistered', { registrationId: id });
      }
    };
  }, []);

  const registerSettingsHandler = useCallback((handler: () => void) => {
    const id = ++registrationIdCounter;
    settingsHandlerRef.current = { id, handler };
    setHasSettingsHandler(true);
    logger.debug('Settings handler registered', { registrationId: id });

    return () => {
      // Only clear if this is still the current registration (prevents race conditions)
      if (settingsHandlerRef.current?.id === id) {
        settingsHandlerRef.current = null;
        setHasSettingsHandler(false);
        logger.debug('Settings handler unregistered', { registrationId: id });
      }
    };
  }, []);

  const triggerNewTask = useCallback(() => {
    if (newTaskHandlerRef.current) {
      logger.info('Triggering new task action (programmatic)', {
        registrationId: newTaskHandlerRef.current.id,
      });
      newTaskHandlerRef.current.handler();
    } else {
      logger.debug('New task trigger called but no handler registered');
    }
  }, []);

  const triggerSettings = useCallback(() => {
    if (settingsHandlerRef.current) {
      logger.info('Triggering settings action (programmatic)', {
        registrationId: settingsHandlerRef.current.id,
      });
      settingsHandlerRef.current.handler();
    } else if (navigate) {
      // Fallback: navigate to settings if no custom handler
      logger.info('Triggering settings fallback navigation', { path: '/settings' });
      navigate('/settings');
    } else {
      logger.debug('Settings trigger called but no handler or navigate function');
    }
  }, [navigate]);

  // Register global keyboard event listeners
  useEffect(() => {
    logger.debug('Setting up global keyboard event listeners');

    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Cmd+N: New task (prevent browser's default new window behavior)
      if (isMeta && e.key.toLowerCase() === 'n' && !e.shiftKey && !e.altKey) {
        if (newTaskHandlerRef.current) {
          e.preventDefault();
          logger.info('Keyboard shortcut activated: Cmd+N (new task)', {
            registrationId: newTaskHandlerRef.current.id,
          });
          newTaskHandlerRef.current.handler();
          return;
        }
        logger.debug('Cmd+N pressed but no handler registered, allowing default behavior');
      }

      // Cmd+,: Settings (common Mac shortcut for preferences)
      if (isMeta && e.key === ',' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        if (settingsHandlerRef.current) {
          logger.info('Keyboard shortcut activated: Cmd+, (settings)', {
            registrationId: settingsHandlerRef.current.id,
          });
          settingsHandlerRef.current.handler();
        } else if (navigate) {
          logger.info('Keyboard shortcut activated: Cmd+, (settings fallback navigation)', {
            path: '/settings',
          });
          navigate('/settings');
        } else {
          logger.debug('Cmd+, pressed but no handler or navigate function');
        }
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      logger.debug('Cleaning up global keyboard event listeners');
      window.removeEventListener('keydown', handler);
    };
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
    const error = new Error('useGlobalShortcuts must be used within a GlobalShortcutsProvider');
    logger.error('useGlobalShortcuts called outside of GlobalShortcutsProvider', {
      error: error.message,
    });
    throw error;
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
    logger.debug('useNewTaskShortcut: Registering handler');
    const unregister = registerNewTaskHandler(handler);
    return () => {
      logger.debug('useNewTaskShortcut: Unregistering handler (unmount)');
      unregister();
    };
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
    logger.debug('useSettingsShortcut: Registering handler');
    const unregister = registerSettingsHandler(handler);
    return () => {
      logger.debug('useSettingsShortcut: Unregistering handler (unmount)');
      unregister();
    };
  }, [registerSettingsHandler, handler]);
}
