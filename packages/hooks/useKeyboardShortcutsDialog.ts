import { createLogger } from '@openflow/utils';
/**
 * Hook for managing the keyboard shortcuts dialog state.
 *
 * Provides centralized state management for the keyboard shortcuts
 * help dialog and registers global shortcuts to open it (Cmd+/ or ?).
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const logger = createLogger('useKeyboardShortcutsDialog');

export interface KeyboardShortcutsDialogContextValue {
  /** Whether the dialog is currently open */
  isOpen: boolean;
  /** Open the keyboard shortcuts dialog */
  open: () => void;
  /** Close the keyboard shortcuts dialog */
  close: () => void;
  /** Toggle the keyboard shortcuts dialog */
  toggle: () => void;
}

/**
 * Context for keyboard shortcuts dialog state.
 * Used internally by KeyboardShortcutsDialogProvider and useKeyboardShortcutsDialog.
 */
export const KeyboardShortcutsDialogContext =
  createContext<KeyboardShortcutsDialogContextValue | null>(null);

/**
 * Provider hook that manages keyboard shortcuts dialog state.
 * Use this in your KeyboardShortcutsDialogProvider component.
 *
 * Automatically registers global keyboard shortcuts:
 * - Cmd+/ (Ctrl+/) to open the dialog
 * - ? to open the dialog (when not in an input)
 *
 * @example
 * function KeyboardShortcutsDialogProvider({ children }) {
 *   const value = useKeyboardShortcutsDialogProvider();
 *   return (
 *     <KeyboardShortcutsDialogContext.Provider value={value}>
 *       {children}
 *       <KeyboardShortcutsDialog isOpen={value.isOpen} onClose={value.close} />
 *     </KeyboardShortcutsDialogContext.Provider>
 *   );
 * }
 */
export function useKeyboardShortcutsDialogProvider(): KeyboardShortcutsDialogContextValue {
  const [isOpen, setIsOpen] = useState(false);
  const hasLoggedInit = useRef(false);

  // Log provider initialization once
  useEffect(() => {
    if (!hasLoggedInit.current) {
      logger.debug('Provider initialized');
      hasLoggedInit.current = true;
    }
  }, []);

  const open = useCallback(() => {
    logger.debug('Opening dialog');
    setIsOpen(true);
    logger.info('Dialog opened');
  }, []);

  const close = useCallback(() => {
    logger.debug('Closing dialog');
    setIsOpen(false);
    logger.info('Dialog closed');
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const newState = !prev;
      logger.debug('Toggling dialog', { previousState: prev, newState });
      logger.info(`Dialog ${newState ? 'opened' : 'closed'} via toggle`);
      return newState;
    });
  }, []);

  // Register global keyboard shortcuts
  useEffect(() => {
    logger.debug('Registering global keyboard shortcuts', {
      shortcuts: ['Cmd+/ or Ctrl+/', '? (when not in input)'],
    });

    const handler = (e: KeyboardEvent) => {
      // Cmd+/ or Ctrl+/ to toggle shortcuts dialog
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        logger.info('Keyboard shortcut activated', {
          shortcut: e.metaKey ? 'Cmd+/' : 'Ctrl+/',
          action: 'toggle',
        });
        toggle();
        return;
      }

      // ? key (with shift) also opens shortcuts (when not in an input)
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        const isInputField =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target.isContentEditable;

        if (!isInputField) {
          e.preventDefault();
          logger.info('Keyboard shortcut activated', {
            shortcut: '?',
            action: 'open',
          });
          open();
        } else {
          logger.debug('Keyboard shortcut ignored (input field focused)', {
            shortcut: '?',
            targetType: target.tagName,
          });
        }
      }
    };

    window.addEventListener('keydown', handler);

    return () => {
      logger.debug('Cleaning up keyboard shortcuts listener');
      window.removeEventListener('keydown', handler);
    };
  }, [toggle, open]);

  return { isOpen, open, close, toggle };
}

/**
 * Hook to access keyboard shortcuts dialog functionality.
 * Must be used within a KeyboardShortcutsDialogProvider.
 *
 * @example
 * const { isOpen, open, close, toggle } = useKeyboardShortcutsDialog();
 *
 * // Open the dialog
 * open();
 *
 * // Close the dialog
 * close();
 *
 * // Check if dialog is open
 * if (isOpen) { ... }
 */
export function useKeyboardShortcutsDialog(): KeyboardShortcutsDialogContextValue {
  const context = useContext(KeyboardShortcutsDialogContext);
  if (!context) {
    logger.error('useKeyboardShortcutsDialog called outside of provider context');
    throw new Error(
      'useKeyboardShortcutsDialog must be used within a KeyboardShortcutsDialogProvider'
    );
  }
  return context;
}
