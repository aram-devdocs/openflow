import { useEffect, useCallback, useRef } from 'react';

/**
 * Configuration for a keyboard shortcut.
 */
export interface ShortcutConfig {
  /** The key to listen for (e.g., 'k', 'Enter', 'Escape') */
  key: string;
  /** Whether Cmd (Mac) or Ctrl (Windows/Linux) must be pressed */
  meta?: boolean;
  /** Whether Shift must be pressed */
  shift?: boolean;
  /** Whether Alt/Option must be pressed */
  alt?: boolean;
  /** The action to execute when the shortcut is triggered */
  action: () => void;
  /** Optional condition for when the shortcut should be active */
  when?: () => boolean;
  /** Optional description for accessibility/documentation */
  description?: string;
}

/**
 * Hook to handle keyboard shortcuts with cross-platform meta/ctrl key normalization.
 *
 * This hook provides centralized keyboard shortcut handling that:
 * - Normalizes Cmd (Mac) and Ctrl (Windows/Linux) as a single "meta" key
 * - Supports modifier key combinations (meta, shift, alt)
 * - Allows conditional shortcuts via the `when` function
 * - Properly cleans up event listeners on unmount
 * - Prevents default browser behavior when shortcuts match
 *
 * @param shortcuts - Array of shortcut configurations to register
 *
 * @example
 * ```tsx
 * function TaskView() {
 *   const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
 *
 *   useKeyboardShortcuts([
 *     {
 *       key: 'k',
 *       meta: true,
 *       action: () => setCommandPaletteOpen(true),
 *       description: 'Open command palette',
 *     },
 *     {
 *       key: 'Escape',
 *       action: () => setCommandPaletteOpen(false),
 *       when: () => isCommandPaletteOpen,
 *       description: 'Close command palette',
 *     },
 *     {
 *       key: 'Enter',
 *       meta: true,
 *       shift: true,
 *       action: () => sendAndStartNextStep(),
 *       when: () => isChatInputFocused(),
 *       description: 'Send message and start next step',
 *     },
 *   ]);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]): void {
  // Use ref to avoid re-registering listener on every render
  // while still having access to latest shortcuts
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    for (const shortcut of shortcutsRef.current) {
      // Check meta key (Cmd on Mac, Ctrl on Windows/Linux)
      // When meta is required, accept either metaKey OR ctrlKey for cross-platform support
      const metaMatch = shortcut.meta
        ? e.metaKey || e.ctrlKey
        : !e.metaKey && !e.ctrlKey;

      // Check shift key
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

      // Check alt key
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;

      // Check key match (case-insensitive)
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

      if (metaMatch && shiftMatch && altMatch && keyMatch) {
        // Check optional condition
        if (!shortcut.when || shortcut.when()) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Utility type for common shortcut actions used across the application.
 */
export type ShortcutAction =
  | 'openCommandPalette'
  | 'createNewTask'
  | 'openSettings'
  | 'toggleTerminal'
  | 'closeModal'
  | 'sendMessage'
  | 'sendAndStartNext'
  | 'saveStep'
  | 'quickActions'
  | 'navigateUp'
  | 'navigateDown'
  | 'startStep';

/**
 * Returns a human-readable label for a shortcut configuration.
 * Useful for displaying shortcut hints in tooltips or menus.
 *
 * @param config - The shortcut configuration
 * @returns A string like "Cmd+K" or "Ctrl+Shift+Enter"
 *
 * @example
 * ```tsx
 * const shortcut = { key: 'k', meta: true };
 * const label = getShortcutLabel(shortcut);
 * // Returns "⌘K" on Mac, "Ctrl+K" on Windows/Linux
 * ```
 */
export function getShortcutLabel(
  config: Pick<ShortcutConfig, 'key' | 'meta' | 'shift' | 'alt'>
): string {
  const isMac =
    typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().includes('MAC');

  const parts: string[] = [];

  if (config.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (config.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (config.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }

  // Format the key for display
  const keyDisplay = formatKeyForDisplay(config.key);
  parts.push(keyDisplay);

  return isMac ? parts.join('') : parts.join('+');
}

/**
 * Formats a key for display in shortcut labels.
 */
function formatKeyForDisplay(key: string): string {
  const keyMap: Record<string, string> = {
    enter: '↵',
    escape: 'Esc',
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
    backspace: '⌫',
    delete: '⌦',
    tab: '⇥',
    ' ': 'Space',
  };

  const lowerKey = key.toLowerCase();
  return keyMap[lowerKey] ?? key.toUpperCase();
}

/**
 * Pre-defined shortcuts matching the global shortcuts from the spec.
 * Use these as building blocks when setting up shortcuts in components.
 */
export const globalShortcuts = {
  commandPalette: { key: 'k', meta: true },
  newTask: { key: 'n', meta: true },
  settings: { key: ',', meta: true },
  toggleTerminal: { key: '`', meta: true },
  escape: { key: 'Escape' },
} as const;

/**
 * Pre-defined shortcuts for the task view.
 */
export const taskViewShortcuts = {
  sendMessage: { key: 'Enter', meta: true },
  sendAndStartNext: { key: 'Enter', meta: true, shift: true },
  saveStep: { key: 's', meta: true },
  quickActions: { key: '.', meta: true },
  navigateUp: { key: 'ArrowUp' },
  navigateDown: { key: 'ArrowDown' },
  startStep: { key: 'Enter' },
} as const;
