import { cn } from '@openflow/utils';
import { Keyboard } from 'lucide-react';
import { Dialog, DialogContent } from '../molecules/Dialog';

/**
 * A group of related keyboard shortcuts.
 */
export interface ShortcutGroup {
  /** Title of the group */
  title: string;
  /** Shortcuts in this group */
  shortcuts: {
    /** Keys to display (e.g., ['⌘', 'K']) */
    keys: string[];
    /** Description of what the shortcut does */
    description: string;
  }[];
}

/**
 * Default shortcut groups for the application.
 * These are the standard shortcuts documented in the app.
 */
export const defaultShortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['⌘', '/'], description: 'Open keyboard shortcuts' },
      { keys: ['⌘', ','], description: 'Open settings' },
      { keys: ['Esc'], description: 'Close dialog / deselect' },
    ],
  },
  {
    title: 'Tasks',
    shortcuts: [
      { keys: ['⌘', 'N'], description: 'Create new task' },
      { keys: ['⌘', '↵'], description: 'Submit form / send message' },
    ],
  },
  {
    title: 'Chat',
    shortcuts: [
      { keys: ['↵'], description: 'Send message' },
      { keys: ['⇧', '↵'], description: 'New line in message' },
      { keys: ['⌘', '⇧', '↵'], description: 'Send and start next step' },
    ],
  },
  {
    title: 'Steps Panel',
    shortcuts: [
      { keys: ['↑'], description: 'Navigate to previous step' },
      { keys: ['↓'], description: 'Navigate to next step' },
      { keys: ['↵'], description: 'Start selected step' },
      { keys: ['⌘', 'S'], description: 'Save current step' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['Tab'], description: 'Navigate to next element' },
      { keys: ['⇧', 'Tab'], description: 'Navigate to previous element' },
      { keys: ['Space'], description: 'Activate focused button' },
      { keys: ['⌘', '`'], description: 'Toggle terminal' },
    ],
  },
];

export interface KeyboardShortcutsDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Custom shortcut groups (uses defaults if not provided) */
  shortcutGroups?: ShortcutGroup[];
  /** Additional class name */
  className?: string;
}

/**
 * KeyboardShortcutsDialog displays a reference of all keyboard shortcuts.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Opens via ⌘+/ (or Ctrl+/) and displays shortcuts grouped by category.
 *
 * @example
 * <KeyboardShortcutsDialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 * />
 */
export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
  shortcutGroups = defaultShortcutGroups,
  className,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="lg"
      className={className}
    >
      <DialogContent className="max-h-[60vh] overflow-y-auto scrollbar-thin">
        <div className="space-y-6">
          {/* Header with icon */}
          <div className="flex items-center gap-2 text-[rgb(var(--muted-foreground))]">
            <Keyboard className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm">
              Press{' '}
              <kbd className="rounded bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-xs">
                ⌘/
              </kbd>{' '}
              to toggle this dialog
            </span>
          </div>

          {/* Shortcut groups */}
          {shortcutGroups.map((group) => (
            <div key={group.title} role="group" aria-labelledby={`shortcut-group-${group.title}`}>
              <h3
                id={`shortcut-group-${group.title}`}
                className="mb-3 text-sm font-semibold text-[rgb(var(--muted-foreground))] uppercase tracking-wide"
              >
                {group.title}
              </h3>
              <div className="space-y-1" role="list">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={`${group.title}-${index}`}
                    role="listitem"
                    className={cn(
                      'flex items-center justify-between py-2 px-2 rounded-md',
                      'hover:bg-[rgb(var(--accent))]',
                      'motion-safe:transition-colors motion-safe:duration-75'
                    )}
                  >
                    <span className="text-sm text-[rgb(var(--foreground))]">
                      {shortcut.description}
                    </span>
                    <div
                      className="flex items-center gap-1"
                      aria-label={`Keys: ${shortcut.keys.join(' ')}`}
                    >
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className={cn(
                            'inline-flex items-center justify-center',
                            'min-w-[1.5rem] h-6 px-1.5',
                            'rounded border border-[rgb(var(--border))]',
                            'bg-[rgb(var(--surface-1))]',
                            'text-xs font-medium text-[rgb(var(--foreground))]',
                            'shadow-sm'
                          )}
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Footer note */}
          <p className="text-xs text-[rgb(var(--muted-foreground))] border-t border-[rgb(var(--border))] pt-4">
            <strong>Note:</strong> On Windows/Linux, use{' '}
            <kbd className="rounded bg-[rgb(var(--muted))] px-1 py-0.5 font-mono text-[10px]">
              Ctrl
            </kbd>{' '}
            instead of{' '}
            <kbd className="rounded bg-[rgb(var(--muted))] px-1 py-0.5 font-mono text-[10px]">
              ⌘
            </kbd>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

KeyboardShortcutsDialog.displayName = 'KeyboardShortcutsDialog';
