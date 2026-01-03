/**
 * KeyboardShortcutsSettingsPage - Stateless Page Component for Keyboard Shortcuts Settings
 *
 * This is a top-level stateless component that displays all keyboard shortcuts.
 * It receives all required data via props, making it fully testable in Storybook.
 *
 * Accessibility Features:
 * - Proper page landmark structure with region role
 * - Screen reader announcements for shortcut groups
 * - role="list" and role="listitem" for shortcut lists
 * - Keys announced with full names (e.g., "Command plus K")
 * - WCAG 2.5.5 touch targets (≥44px) on mobile
 * - motion-safe transitions for reduced motion support
 *
 * @module pages/KeyboardShortcutsSettingsPage
 */

import { Box, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { forwardRef } from 'react';
import { Card, CardContent, CardHeader } from '../molecules/Card';
// Re-use types and defaults from the dialog organism
import type { Shortcut, ShortcutGroup } from '../organisms/KeyboardShortcutsDialog';
export type { Shortcut, ShortcutGroup };

// ============================================================================
// Types
// ============================================================================

/**
 * Props for the KeyboardShortcutsSettingsPage component.
 */
export interface KeyboardShortcutsSettingsPageProps {
  /** Shortcut groups to display */
  shortcutGroups: ShortcutGroup[];
  /** Optional data-testid for testing */
  'data-testid'?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format keys for screen reader announcement
 */
export function formatKeysForScreenReader(keys: string[]): string {
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

// ============================================================================
// Styles
// ============================================================================

const KEY_CLASSES = cn(
  'inline-flex items-center justify-center',
  'min-w-[1.5rem] h-6 px-1.5',
  'rounded border border-[rgb(var(--border))]',
  'bg-[rgb(var(--surface-1))]',
  'font-medium text-xs text-[rgb(var(--foreground))]',
  'shadow-sm'
);

const SHORTCUT_ITEM_CLASSES = cn(
  'flex items-center justify-between py-2 px-2 rounded-md',
  'hover:bg-[rgb(var(--accent))]',
  'min-h-[44px] sm:min-h-0',
  'motion-safe:transition-colors motion-safe:duration-75'
);

// ============================================================================
// Sub-Components
// ============================================================================

interface ShortcutItemProps {
  shortcut: Shortcut;
  'data-testid'?: string;
}

const ShortcutItem = forwardRef<HTMLDivElement, ShortcutItemProps>(function ShortcutItem(
  { shortcut, 'data-testid': dataTestId },
  ref
) {
  const keysLabel = formatKeysForScreenReader(shortcut.keys);

  return (
    <Box ref={ref} role="listitem" className={SHORTCUT_ITEM_CLASSES} data-testid={dataTestId}>
      <Text size="sm" color="foreground">
        {shortcut.description}
      </Text>

      <Box className="flex items-center gap-1" aria-label={`Keys: ${keysLabel}`}>
        {shortcut.keys.map((key, keyIndex) => (
          <Box as="kbd" key={keyIndex} className={KEY_CLASSES} aria-hidden={true}>
            {key}
          </Box>
        ))}
      </Box>

      <VisuallyHidden>Shortcut: {keysLabel}</VisuallyHidden>
    </Box>
  );
});

interface ShortcutGroupCardProps {
  group: ShortcutGroup;
  groupIndex: number;
  'data-testid'?: string;
}

const ShortcutGroupCard = forwardRef<HTMLDivElement, ShortcutGroupCardProps>(
  function ShortcutGroupCard({ group, groupIndex, 'data-testid': dataTestId }, ref) {
    return (
      <Card ref={ref} data-testid={dataTestId ? `${dataTestId}-group-${groupIndex}` : undefined}>
        <CardHeader className="pb-3">
          <Text as="h3" size="base" weight="semibold" color="foreground">
            {group.title}
          </Text>
        </CardHeader>
        <CardContent className="pt-0">
          <Box role="list" aria-label={`${group.title} shortcuts`} className="space-y-1">
            {group.shortcuts.map((shortcut, shortcutIndex) => (
              <ShortcutItem
                key={shortcutIndex}
                shortcut={shortcut}
                data-testid={
                  dataTestId ? `${dataTestId}-shortcut-${groupIndex}-${shortcutIndex}` : undefined
                }
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }
);

interface PlatformNoteCardProps {
  'data-testid'?: string;
}

const PlatformNoteCard = forwardRef<HTMLDivElement, PlatformNoteCardProps>(
  function PlatformNoteCard({ 'data-testid': dataTestId }, ref) {
    return (
      <Card ref={ref} data-testid={dataTestId ? `${dataTestId}-platform-note` : undefined}>
        <CardHeader className="pb-3">
          <Text as="h3" size="base" weight="semibold" color="foreground">
            Platform Note
          </Text>
        </CardHeader>
        <CardContent className="pt-0">
          <Text size="sm" color="muted-foreground">
            On Windows/Linux, use{' '}
            <Box as="kbd" className={KEY_CLASSES}>
              Ctrl
            </Box>{' '}
            instead of{' '}
            <Box as="kbd" className={KEY_CLASSES}>
              ⌘
            </Box>
          </Text>
          <VisuallyHidden>Note: On Windows or Linux, use Control instead of Command</VisuallyHidden>
        </CardContent>
      </Card>
    );
  }
);

// ============================================================================
// Main Component
// ============================================================================

/**
 * KeyboardShortcutsSettingsPage displays all keyboard shortcuts organized by category.
 *
 * @example
 * <KeyboardShortcutsSettingsPage shortcutGroups={defaultShortcutGroups} />
 */
export const KeyboardShortcutsSettingsPage = forwardRef<
  HTMLDivElement,
  KeyboardShortcutsSettingsPageProps
>(function KeyboardShortcutsSettingsPage({ shortcutGroups, 'data-testid': dataTestId }, ref) {
  const totalShortcuts = shortcutGroups.reduce((acc, group) => acc + group.shortcuts.length, 0);

  return (
    <Box
      ref={ref}
      className="space-y-6"
      role="region"
      aria-label="Keyboard Shortcuts"
      data-testid={dataTestId}
    >
      {/* Screen reader announcement */}
      <VisuallyHidden>
        <Text as="span" role="status" aria-live="polite" aria-atomic="true">
          Keyboard shortcuts settings page loaded. {shortcutGroups.length} groups with{' '}
          {totalShortcuts} shortcuts total.
        </Text>
      </VisuallyHidden>

      {/* Platform note card */}
      <PlatformNoteCard data-testid={dataTestId} />

      {/* Shortcut groups */}
      {shortcutGroups.map((group, groupIndex) => (
        <ShortcutGroupCard
          key={group.title}
          group={group}
          groupIndex={groupIndex}
          data-testid={dataTestId}
        />
      ))}
    </Box>
  );
});

KeyboardShortcutsSettingsPage.displayName = 'KeyboardShortcutsSettingsPage';
