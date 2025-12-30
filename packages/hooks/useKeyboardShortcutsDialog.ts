/**
 * Hook for managing the keyboard shortcuts dialog state.
 *
 * Provides centralized state management for the keyboard shortcuts
 * help dialog and registers global shortcuts to open it (⌘+/ or ?).
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

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
 * - ⌘+/ (Ctrl+/) to open the dialog
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

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Register global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ⌘+/ or Ctrl+/ to toggle shortcuts dialog
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
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
          open();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
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
    throw new Error(
      'useKeyboardShortcutsDialog must be used within a KeyboardShortcutsDialogProvider'
    );
  }
  return context;
}
