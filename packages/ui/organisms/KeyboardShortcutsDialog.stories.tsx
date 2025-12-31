import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../atoms/Button';
import {
  KeyboardShortcutsDialog,
  type ShortcutGroup,
  defaultShortcutGroups,
} from './KeyboardShortcutsDialog';

const meta: Meta<typeof KeyboardShortcutsDialog> = {
  title: 'Organisms/KeyboardShortcutsDialog',
  component: KeyboardShortcutsDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A dialog that displays all keyboard shortcuts available in the application. Opens with Cmd+/ (Ctrl+/) or the ? key.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    shortcutGroups: {
      control: 'object',
      description: 'Custom shortcut groups (uses defaults if not provided)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof KeyboardShortcutsDialog>;

/** Default keyboard shortcuts dialog with all standard shortcuts */
export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Open Keyboard Shortcuts</Button>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Or press{' '}
          <kbd className="rounded bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-xs">
            Cmd+/
          </kbd>{' '}
          to toggle
        </p>
        <KeyboardShortcutsDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    );
  },
};

/** Dialog shown in open state */
export const Open: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
};

/** Custom shortcuts for a specific context */
export const CustomShortcuts: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    const customGroups: ShortcutGroup[] = [
      {
        title: 'Editor',
        shortcuts: [
          { keys: ['⌘', 'S'], description: 'Save file' },
          { keys: ['⌘', 'Z'], description: 'Undo' },
          { keys: ['⌘', '⇧', 'Z'], description: 'Redo' },
          { keys: ['⌘', 'F'], description: 'Find' },
          { keys: ['⌘', 'H'], description: 'Find and replace' },
        ],
      },
      {
        title: 'View',
        shortcuts: [
          { keys: ['⌘', 'B'], description: 'Toggle sidebar' },
          { keys: ['⌘', 'J'], description: 'Toggle panel' },
          { keys: ['⌘', '='], description: 'Zoom in' },
          { keys: ['⌘', '-'], description: 'Zoom out' },
        ],
      },
    ];

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Show Editor Shortcuts</Button>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          shortcutGroups={customGroups}
        />
      </div>
    );
  },
};

/** Minimal shortcuts */
export const MinimalShortcuts: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    const minimalGroups: ShortcutGroup[] = [
      {
        title: 'Quick Actions',
        shortcuts: [
          { keys: ['⌘', 'K'], description: 'Command palette' },
          { keys: ['⌘', 'N'], description: 'New item' },
          { keys: ['Esc'], description: 'Close' },
        ],
      },
    ];

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Show Minimal Shortcuts</Button>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          shortcutGroups={minimalGroups}
        />
      </div>
    );
  },
};

/** All default shortcut groups displayed */
export const AllDefaultGroups: Story = {
  render: () => {
    return (
      <div className="space-y-8 p-4">
        <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
          Default Shortcut Groups
        </h2>
        <div className="grid gap-6">
          {defaultShortcutGroups.map((group) => (
            <div
              key={group.title}
              className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
            >
              <h3 className="mb-3 text-sm font-semibold text-[rgb(var(--muted-foreground))] uppercase tracking-wide">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={`${group.title}-${index}`}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm text-[rgb(var(--foreground))]">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded border border-[rgb(var(--border))] bg-[rgb(var(--surface-1))] text-xs font-medium text-[rgb(var(--foreground))] shadow-sm"
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
        </div>
      </div>
    );
  },
};

/** Interactive demo with real keyboard events */
export const InteractiveDemo: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [lastAction, setLastAction] = useState<string | null>(null);

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-center">
          <h3 className="mb-2 text-lg font-semibold text-[rgb(var(--foreground))]">
            Keyboard Shortcuts Demo
          </h3>
          <p className="mb-4 text-sm text-[rgb(var(--muted-foreground))]">
            Press{' '}
            <kbd className="rounded bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-xs">
              Cmd+/
            </kbd>{' '}
            or{' '}
            <kbd className="rounded bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-xs">?</kbd>{' '}
            to open the shortcuts dialog
          </p>
          <Button onClick={() => setIsOpen(true)}>Or Click Here</Button>
          {lastAction && (
            <p className="mt-4 text-sm text-[rgb(var(--primary))]">Last action: {lastAction}</p>
          )}
        </div>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setLastAction('Closed shortcuts dialog');
          }}
        />
      </div>
    );
  },
};

/** Keyboard styling showcase */
export const KeyStyleShowcase: Story = {
  render: () => {
    const sampleKeys = [
      ['⌘'],
      ['⇧'],
      ['⌥'],
      ['⌃'],
      ['↵'],
      ['↑'],
      ['↓'],
      ['←'],
      ['→'],
      ['Esc'],
      ['Tab'],
      ['Space'],
      ['A'],
      ['1'],
      ['F1'],
    ];

    return (
      <div className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Keyboard Key Styles</h2>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          All keyboard keys use consistent styling
        </p>
        <div className="flex flex-wrap gap-2">
          {sampleKeys.map((keys, index) => (
            <div key={index} className="flex items-center gap-1">
              {keys.map((key, keyIndex) => (
                <kbd
                  key={keyIndex}
                  className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded border border-[rgb(var(--border))] bg-[rgb(var(--surface-1))] text-xs font-medium text-[rgb(var(--foreground))] shadow-sm"
                >
                  {key}
                </kbd>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-[rgb(var(--muted-foreground))]">
            Combined Keys
          </h3>
          <div className="flex flex-wrap gap-4">
            {[
              ['⌘', 'K'],
              ['⌘', '⇧', 'P'],
              ['⌃', '⌥', 'Delete'],
              ['⌘', '↵'],
            ].map((combo, index) => (
              <div key={index} className="flex items-center gap-1">
                {combo.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded border border-[rgb(var(--border))] bg-[rgb(var(--surface-1))] text-xs font-medium text-[rgb(var(--foreground))] shadow-sm"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
};
