import {
  KeyboardShortcutsDialogContext,
  useKeyboardShortcutsDialogProvider,
} from '@openflow/hooks';
import type { ReactNode } from 'react';
import { KeyboardShortcutsDialog, type ShortcutGroup } from '../organisms/KeyboardShortcutsDialog';

export interface KeyboardShortcutsDialogProviderProps {
  children: ReactNode;
  /** Custom shortcut groups (uses defaults if not provided) */
  shortcutGroups?: ShortcutGroup[];
}

/**
 * KeyboardShortcutsDialogProvider manages the keyboard shortcuts dialog state.
 * Wraps your app to enable the shortcuts dialog with ⌘+/ or ? to open.
 *
 * Features:
 * - Global ⌘+/ (Ctrl+/) to toggle the dialog
 * - ? key to open (when not in an input field)
 * - Provides context for programmatic control
 *
 * @example
 * <KeyboardShortcutsDialogProvider>
 *   <App />
 * </KeyboardShortcutsDialogProvider>
 *
 * // Later, in a component:
 * const { open, close } = useKeyboardShortcutsDialog();
 * open(); // Programmatically open the dialog
 */
export function KeyboardShortcutsDialogProvider({
  children,
  shortcutGroups,
}: KeyboardShortcutsDialogProviderProps) {
  const value = useKeyboardShortcutsDialogProvider();

  return (
    <KeyboardShortcutsDialogContext.Provider value={value}>
      {children}
      <KeyboardShortcutsDialog
        isOpen={value.isOpen}
        onClose={value.close}
        shortcutGroups={shortcutGroups}
      />
    </KeyboardShortcutsDialogContext.Provider>
  );
}

KeyboardShortcutsDialogProvider.displayName = 'KeyboardShortcutsDialogProvider';
