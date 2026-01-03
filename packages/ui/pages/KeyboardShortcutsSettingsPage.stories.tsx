/**
 * Storybook stories for KeyboardShortcutsSettingsPage
 *
 * Demonstrates the keyboard shortcuts settings page:
 * - Default state with all shortcut groups
 * - Custom shortcut groups
 * - Accessibility features
 */

import type { Meta, StoryObj } from '@storybook/react';
import { defaultShortcutGroups } from '../organisms/KeyboardShortcutsDialog';
import {
  KeyboardShortcutsSettingsPage,
  formatKeysForScreenReader,
} from './KeyboardShortcutsSettingsPage';

const meta: Meta<typeof KeyboardShortcutsSettingsPage> = {
  title: 'Pages/KeyboardShortcutsSettingsPage',
  component: KeyboardShortcutsSettingsPage,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays all keyboard shortcuts organized by category. Shows platform note for Windows/Linux users and groups shortcuts by functionality.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof KeyboardShortcutsSettingsPage>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default state showing all application keyboard shortcuts
 */
export const Default: Story = {
  args: {
    shortcutGroups: defaultShortcutGroups,
  },
};

/**
 * With custom shortcut groups
 */
export const CustomShortcuts: Story = {
  args: {
    shortcutGroups: [
      {
        title: 'Editor',
        shortcuts: [
          { keys: ['⌘', 'S'], description: 'Save file' },
          { keys: ['⌘', 'Z'], description: 'Undo' },
          { keys: ['⌘', '⇧', 'Z'], description: 'Redo' },
        ],
      },
      {
        title: 'Selection',
        shortcuts: [
          { keys: ['⌘', 'A'], description: 'Select all' },
          { keys: ['⌘', 'D'], description: 'Add selection to next find match' },
        ],
      },
    ],
  },
};

/**
 * Single shortcut group
 */
export const SingleGroup: Story = {
  args: {
    shortcutGroups: [
      {
        title: 'Navigation',
        shortcuts: defaultShortcutGroups[0]?.shortcuts ?? [],
      },
    ],
  },
};

/**
 * With data-testid for testing
 */
export const WithTestId: Story = {
  args: {
    shortcutGroups: defaultShortcutGroups,
    'data-testid': 'shortcuts-page',
  },
};

// ============================================================================
// Documentation Stories
// ============================================================================

/**
 * Demonstrates the screen reader key formatting utility
 */
export const ScreenReaderFormatting: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Screen Reader Key Formatting Examples</h3>
      <div className="grid grid-cols-2 gap-4">
        {[['⌘', 'K'], ['⌘', '⇧', '↵'], ['⌥', '↑'], ['Esc'], ['Tab']].map((keys) => (
          <div key={keys.join('')} className="p-3 border rounded">
            <div className="font-mono text-sm">{JSON.stringify(keys)}</div>
            <div className="text-muted-foreground text-sm">
              → "{formatKeysForScreenReader(keys)}"
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};
