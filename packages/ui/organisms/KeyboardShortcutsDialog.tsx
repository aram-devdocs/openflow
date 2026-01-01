import { Box, Heading, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { Keyboard } from 'lucide-react';
import { type HTMLAttributes, forwardRef, useId } from 'react';
import { Icon } from '../atoms/Icon';
import { Dialog, DialogContent, type DialogSize } from '../molecules/Dialog';

// ============================================================================
// Types
// ============================================================================

export type KeyboardShortcutsDialogSize = 'sm' | 'md' | 'lg';
export type KeyboardShortcutsDialogBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * A single keyboard shortcut entry.
 */
export interface Shortcut {
  /** Keys to display (e.g., ['⌘', 'K']) */
  keys: string[];
  /** Description of what the shortcut does */
  description: string;
  /** Optional ID for accessibility linking */
  id?: string;
}

/**
 * A group of related keyboard shortcuts.
 */
export interface ShortcutGroup {
  /** Title of the group */
  title: string;
  /** Shortcuts in this group */
  shortcuts: Shortcut[];
  /** Optional ID for accessibility linking */
  id?: string;
}

export interface KeyboardShortcutsDialogProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role'> {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Custom shortcut groups (uses defaults if not provided) */
  shortcutGroups?: ShortcutGroup[];
  /** Responsive size of the dialog */
  size?: ResponsiveValue<KeyboardShortcutsDialogSize>;
  /** Accessible title for the dialog */
  title?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;

/**
 * Default dialog title
 */
export const DEFAULT_DIALOG_TITLE = 'Keyboard Shortcuts';

/**
 * Shortcut key for opening the dialog
 */
export const TOGGLE_SHORTCUT_KEYS = ['⌘', '/'];

/**
 * Hint text shown at the top of the dialog
 */
export const TOGGLE_HINT_TEXT = 'Press ⌘/ to toggle this dialog';

/**
 * Screen reader hint for toggle shortcut
 */
export const SR_TOGGLE_HINT = 'Press Command Slash to toggle this dialog';

/**
 * Footer note for Windows/Linux users
 */
export const PLATFORM_NOTE_TEXT = 'Note: On Windows/Linux, use Ctrl instead of ⌘';

/**
 * Screen reader version of platform note
 */
export const SR_PLATFORM_NOTE = 'Note: On Windows or Linux, use Control instead of Command';

/**
 * Screen reader announcement for dialog opened
 */
export const SR_DIALOG_OPENED = 'Keyboard shortcuts dialog opened.';

/**
 * Screen reader announcement for group navigation
 */
export const SR_GROUP_COUNT_TEMPLATE = '{count} shortcut groups available.';

/**
 * Screen reader announcement for shortcut count in group
 */
export const SR_SHORTCUTS_IN_GROUP_TEMPLATE = '{count} shortcuts in {group}.';

/**
 * Size mapping from KeyboardShortcutsDialogSize to DialogSize
 */
export const SIZE_TO_DIALOG_SIZE: Record<KeyboardShortcutsDialogSize, DialogSize> = {
  sm: 'md',
  md: 'lg',
  lg: 'xl',
};

/**
 * Content padding classes by size
 */
export const CONTENT_PADDING_CLASSES: Record<KeyboardShortcutsDialogSize, string> = {
  sm: 'space-y-4',
  md: 'space-y-5',
  lg: 'space-y-6',
};

/**
 * Group spacing classes by size
 */
export const GROUP_SPACING_CLASSES: Record<KeyboardShortcutsDialogSize, string> = {
  sm: 'mb-2',
  md: 'mb-2.5',
  lg: 'mb-3',
};

/**
 * Shortcut item padding classes by size
 */
export const ITEM_PADDING_CLASSES: Record<KeyboardShortcutsDialogSize, string> = {
  sm: 'py-1.5 px-1.5',
  md: 'py-2 px-2',
  lg: 'py-2.5 px-2.5',
};

/**
 * Key size classes by size
 */
export const KEY_SIZE_CLASSES: Record<KeyboardShortcutsDialogSize, string> = {
  sm: 'min-w-[1.25rem] h-5 px-1 text-[10px]',
  md: 'min-w-[1.5rem] h-6 px-1.5 text-xs',
  lg: 'min-w-[1.75rem] h-7 px-2 text-sm',
};

/**
 * Hint key inline size classes by size
 */
export const HINT_KEY_SIZE_CLASSES: Record<KeyboardShortcutsDialogSize, string> = {
  sm: 'px-1 py-0.5 text-[10px]',
  md: 'px-1.5 py-0.5 text-xs',
  lg: 'px-2 py-0.5 text-sm',
};

/**
 * Icon size mapping by dialog size
 */
export const ICON_SIZE_MAP: Record<KeyboardShortcutsDialogSize, 'xs' | 'sm' | 'md'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
};

/**
 * Base classes for the header hint section
 */
export const HINT_CONTAINER_CLASSES = 'flex items-center gap-2 text-[rgb(var(--muted-foreground))]';

/**
 * Base classes for keyboard key display
 */
export const KEY_BASE_CLASSES = cn(
  'inline-flex items-center justify-center',
  'rounded border border-[rgb(var(--border))]',
  'bg-[rgb(var(--surface-1))]',
  'font-medium text-[rgb(var(--foreground))]',
  'shadow-sm'
);

/**
 * Hint keyboard key classes (smaller inline style)
 */
export const HINT_KEY_CLASSES = cn('rounded bg-[rgb(var(--muted))] font-mono');

/**
 * Group container classes
 */
export const GROUP_CONTAINER_CLASSES = '';

/**
 * Group title classes
 */
export const GROUP_TITLE_CLASSES =
  'text-sm font-semibold text-[rgb(var(--muted-foreground))] uppercase tracking-wide';

/**
 * Shortcut list container classes
 */
export const SHORTCUT_LIST_CLASSES = 'space-y-1';

/**
 * Shortcut item classes - base styling
 */
export const SHORTCUT_ITEM_BASE_CLASSES = cn(
  'flex items-center justify-between rounded-md',
  'hover:bg-[rgb(var(--accent))]',
  // Touch target compliance - ensure minimum 44px on mobile
  'min-h-[44px] sm:min-h-0',
  // Motion-safe transition
  'motion-safe:transition-colors motion-safe:duration-75'
);

/**
 * Keys container classes
 */
export const KEYS_CONTAINER_CLASSES = 'flex items-center gap-1';

/**
 * Footer note container classes
 */
export const FOOTER_NOTE_CLASSES =
  'text-xs text-[rgb(var(--muted-foreground))] border-t border-[rgb(var(--border))] pt-4';

/**
 * Footer note key classes
 */
export const FOOTER_KEY_CLASSES = cn(
  'rounded bg-[rgb(var(--muted))] px-1 py-0.5 font-mono text-[10px]'
);

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

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size from a responsive value
 */
export function getBaseSize(
  size: ResponsiveValue<KeyboardShortcutsDialogSize> | undefined
): KeyboardShortcutsDialogSize {
  if (size === undefined) {
    return 'md';
  }

  if (typeof size === 'string') {
    return size;
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<
      Record<KeyboardShortcutsDialogBreakpoint, KeyboardShortcutsDialogSize>
    >;
    return sizeObj.base ?? 'md';
  }

  return 'md';
}

/**
 * Generate responsive size classes for content spacing
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<KeyboardShortcutsDialogSize> | undefined
): string {
  if (size === undefined) {
    return CONTENT_PADDING_CLASSES.md;
  }

  if (typeof size === 'string') {
    return CONTENT_PADDING_CLASSES[size];
  }

  if (typeof size === 'object' && size !== null) {
    const classes: string[] = [];
    const sizeObj = size as Partial<
      Record<KeyboardShortcutsDialogBreakpoint, KeyboardShortcutsDialogSize>
    >;

    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = sizeObj[breakpoint];
      if (breakpointValue !== undefined) {
        const sizeClass = CONTENT_PADDING_CLASSES[breakpointValue];
        if (breakpoint === 'base') {
          classes.push(sizeClass);
        } else {
          // Add breakpoint prefix to each class
          const parts = sizeClass.split(' ');
          classes.push(...parts.map((c) => `${breakpoint}:${c}`));
        }
      }
    }
    return classes.join(' ');
  }

  return CONTENT_PADDING_CLASSES.md;
}

/**
 * Get dialog size from KeyboardShortcutsDialogSize
 */
export function getDialogSize(
  size: ResponsiveValue<KeyboardShortcutsDialogSize> | undefined
): ResponsiveValue<DialogSize> {
  if (size === undefined) {
    return 'lg';
  }

  if (typeof size === 'string') {
    return SIZE_TO_DIALOG_SIZE[size];
  }

  if (typeof size === 'object' && size !== null) {
    const result: Partial<Record<KeyboardShortcutsDialogBreakpoint, DialogSize>> = {};
    const sizeObj = size as Partial<
      Record<KeyboardShortcutsDialogBreakpoint, KeyboardShortcutsDialogSize>
    >;

    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = sizeObj[breakpoint];
      if (breakpointValue !== undefined) {
        result[breakpoint] = SIZE_TO_DIALOG_SIZE[breakpointValue];
      }
    }
    return result as ResponsiveValue<DialogSize>;
  }

  return 'lg';
}

/**
 * Format keys array for screen reader announcement
 */
export function formatKeysForSR(keys: string[]): string {
  const keyNames: Record<string, string> = {
    '⌘': 'Command',
    '⇧': 'Shift',
    '⌥': 'Option',
    '⌃': 'Control',
    '↵': 'Enter',
    '↑': 'Up Arrow',
    '↓': 'Down Arrow',
    '←': 'Left Arrow',
    '→': 'Right Arrow',
    Esc: 'Escape',
    Tab: 'Tab',
    Space: 'Space',
    '`': 'Backtick',
    '/': 'Slash',
    ',': 'Comma',
    '.': 'Period',
  };

  return keys.map((key) => keyNames[key] ?? key).join(' plus ');
}

/**
 * Build group count announcement for screen reader
 */
export function buildGroupCountAnnouncement(count: number): string {
  return SR_GROUP_COUNT_TEMPLATE.replace('{count}', String(count));
}

/**
 * Build shortcuts in group announcement for screen reader
 */
export function buildShortcutsInGroupAnnouncement(count: number, groupTitle: string): string {
  return SR_SHORTCUTS_IN_GROUP_TEMPLATE.replace('{count}', String(count)).replace(
    '{group}',
    groupTitle
  );
}

/**
 * Get total shortcut count across all groups
 */
export function getTotalShortcutCount(groups: ShortcutGroup[]): number {
  return groups.reduce((acc, group) => acc + group.shortcuts.length, 0);
}

// ============================================================================
// KeyboardShortcutsDialog Component
// ============================================================================

/**
 * KeyboardShortcutsDialog displays a reference of all keyboard shortcuts.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Opens via ⌘+/ (or Ctrl+/) and displays shortcuts grouped by category.
 *
 * Accessibility features:
 * - Inherits Dialog focus trap, escape key handling, and ARIA attributes
 * - role="list" and role="listitem" for shortcut lists
 * - Screen reader announcements for groups and shortcut counts
 * - Keys announced with full names (e.g., "Command plus K")
 * - Touch targets ≥44px on mobile via Dialog molecule
 * - motion-safe transitions for reduced motion support
 *
 * @example
 * <KeyboardShortcutsDialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 * />
 *
 * @example
 * // With custom shortcuts
 * <KeyboardShortcutsDialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   shortcutGroups={[
 *     {
 *       title: 'Editor',
 *       shortcuts: [
 *         { keys: ['⌘', 'S'], description: 'Save file' },
 *       ],
 *     },
 *   ]}
 * />
 *
 * @example
 * // Responsive sizing
 * <KeyboardShortcutsDialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   size={{ base: 'sm', md: 'md', lg: 'lg' }}
 * />
 */
export const KeyboardShortcutsDialog = forwardRef<HTMLDivElement, KeyboardShortcutsDialogProps>(
  function KeyboardShortcutsDialog(
    {
      isOpen,
      onClose,
      shortcutGroups = defaultShortcutGroups,
      size = 'md',
      title = DEFAULT_DIALOG_TITLE,
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) {
    const baseId = useId();
    const baseSize = getBaseSize(size);
    const contentClasses = getResponsiveSizeClasses(size);
    const dialogSize = getDialogSize(size);
    const totalShortcuts = getTotalShortcutCount(shortcutGroups);

    return (
      <Dialog
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size={dialogSize}
        data-testid={dataTestId}
        className={className}
        {...props}
      >
        {/* Screen reader announcement when dialog opens */}
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite" aria-atomic="true">
            {SR_DIALOG_OPENED} {buildGroupCountAnnouncement(shortcutGroups.length)} {totalShortcuts}{' '}
            shortcuts total.
          </Text>
        </VisuallyHidden>

        <DialogContent
          className={cn('max-h-[60vh] overflow-y-auto scrollbar-thin', contentClasses)}
          data-testid={dataTestId ? `${dataTestId}-content` : undefined}
        >
          {/* Header with icon and toggle hint */}
          <Box
            className={HINT_CONTAINER_CLASSES}
            data-testid={dataTestId ? `${dataTestId}-hint` : undefined}
          >
            <Icon icon={Keyboard} size={ICON_SIZE_MAP[baseSize]} aria-hidden={true} />
            <Text size="sm" color="muted-foreground">
              Press{' '}
              <Box as="kbd" className={cn(HINT_KEY_CLASSES, HINT_KEY_SIZE_CLASSES[baseSize])}>
                ⌘/
              </Box>{' '}
              to toggle this dialog
            </Text>
            <VisuallyHidden>{SR_TOGGLE_HINT}</VisuallyHidden>
          </Box>

          {/* Shortcut groups */}
          {shortcutGroups.map((group, groupIndex) => {
            const groupId = group.id ?? `${baseId}-group-${groupIndex}`;
            const groupTitleId = `${groupId}-title`;

            return (
              <Box
                key={groupId}
                role="group"
                aria-labelledby={groupTitleId}
                data-testid={dataTestId ? `${dataTestId}-group-${groupIndex}` : undefined}
              >
                <Heading
                  level={3}
                  id={groupTitleId}
                  className={cn(GROUP_TITLE_CLASSES, GROUP_SPACING_CLASSES[baseSize])}
                >
                  {group.title}
                </Heading>

                {/* Screen reader announcement for group shortcut count */}
                <VisuallyHidden>
                  {buildShortcutsInGroupAnnouncement(group.shortcuts.length, group.title)}
                </VisuallyHidden>

                <Box
                  className={SHORTCUT_LIST_CLASSES}
                  role="list"
                  aria-label={`${group.title} shortcuts`}
                >
                  {group.shortcuts.map((shortcut, shortcutIndex) => {
                    const shortcutId = shortcut.id ?? `${groupId}-shortcut-${shortcutIndex}`;
                    const keysLabel = formatKeysForSR(shortcut.keys);

                    return (
                      <Box
                        key={shortcutId}
                        role="listitem"
                        className={cn(SHORTCUT_ITEM_BASE_CLASSES, ITEM_PADDING_CLASSES[baseSize])}
                        data-testid={
                          dataTestId
                            ? `${dataTestId}-shortcut-${groupIndex}-${shortcutIndex}`
                            : undefined
                        }
                      >
                        <Text size="sm" color="foreground" id={`${shortcutId}-description`}>
                          {shortcut.description}
                        </Text>

                        <Box className={KEYS_CONTAINER_CLASSES} aria-label={`Keys: ${keysLabel}`}>
                          {shortcut.keys.map((key, keyIndex) => (
                            <Box
                              as="kbd"
                              key={keyIndex}
                              className={cn(KEY_BASE_CLASSES, KEY_SIZE_CLASSES[baseSize])}
                              aria-hidden={true}
                            >
                              {key}
                            </Box>
                          ))}
                        </Box>

                        {/* Screen reader announcement for keys */}
                        <VisuallyHidden>Shortcut: {keysLabel}</VisuallyHidden>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            );
          })}

          {/* Footer note for platform differences */}
          <Text
            as="p"
            className={FOOTER_NOTE_CLASSES}
            data-testid={dataTestId ? `${dataTestId}-footer-note` : undefined}
          >
            <Text as="strong">Note:</Text> On Windows/Linux, use{' '}
            <Box as="kbd" className={FOOTER_KEY_CLASSES} aria-hidden={true}>
              Ctrl
            </Box>{' '}
            instead of{' '}
            <Box as="kbd" className={FOOTER_KEY_CLASSES} aria-hidden={true}>
              ⌘
            </Box>
            <VisuallyHidden>{SR_PLATFORM_NOTE}</VisuallyHidden>
          </Text>
        </DialogContent>
      </Dialog>
    );
  }
);

KeyboardShortcutsDialog.displayName = 'KeyboardShortcutsDialog';
