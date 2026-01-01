import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import {
  CONTENT_PADDING_CLASSES,
  // Constants
  DEFAULT_DIALOG_TITLE,
  FOOTER_KEY_CLASSES,
  FOOTER_NOTE_CLASSES,
  GROUP_SPACING_CLASSES,
  GROUP_TITLE_CLASSES,
  HINT_CONTAINER_CLASSES,
  HINT_KEY_CLASSES,
  HINT_KEY_SIZE_CLASSES,
  ICON_SIZE_MAP,
  ITEM_PADDING_CLASSES,
  KEYS_CONTAINER_CLASSES,
  KEY_BASE_CLASSES,
  KEY_SIZE_CLASSES,
  KeyboardShortcutsDialog,
  SHORTCUT_ITEM_BASE_CLASSES,
  SHORTCUT_LIST_CLASSES,
  SIZE_TO_DIALOG_SIZE,
  SR_DIALOG_OPENED,
  SR_GROUP_COUNT_TEMPLATE,
  SR_PLATFORM_NOTE,
  SR_SHORTCUTS_IN_GROUP_TEMPLATE,
  SR_TOGGLE_HINT,
  type ShortcutGroup,
  TOGGLE_HINT_TEXT,
  TOGGLE_SHORTCUT_KEYS,
  defaultShortcutGroups,
  getTotalShortcutCount,
} from './KeyboardShortcutsDialog';

const meta: Meta<typeof KeyboardShortcutsDialog> = {
  title: 'Organisms/KeyboardShortcutsDialog',
  component: KeyboardShortcutsDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A dialog that displays all keyboard shortcuts available in the application.
Opens with Cmd+/ (Ctrl+/) and displays shortcuts grouped by category.

## Accessibility Features
- Inherits Dialog focus trap, escape key handling, and ARIA attributes
- role="list" and role="listitem" for shortcut lists
- Screen reader announcements for groups and shortcut counts
- Keys announced with full names (e.g., "Command plus K")
- Touch targets ≥44px on mobile via Dialog molecule
- motion-safe transitions for reduced motion support

## Usage
\`\`\`tsx
<KeyboardShortcutsDialog
  isOpen={isOpen}
  onClose={handleClose}
/>
\`\`\`
        `,
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
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the dialog',
    },
    title: {
      control: 'text',
      description: 'Accessible title for the dialog',
    },
  },
};

export default meta;
type Story = StoryObj<typeof KeyboardShortcutsDialog>;

// ============================================================================
// Basic Examples
// ============================================================================

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
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          data-testid="default-dialog"
        />
      </div>
    );
  },
};

/** Dialog shown in open state */
export const Open: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    'data-testid': 'open-dialog',
  },
};

/** Custom title for the dialog */
export const CustomTitle: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Open Shortcuts</Button>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Quick Reference"
          data-testid="custom-title-dialog"
        />
      </div>
    );
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/** Small size dialog */
export const SizeSmall: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Small Dialog</Button>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          size="sm"
          data-testid="small-dialog"
        />
      </div>
    );
  },
};

/** Medium size dialog (default) */
export const SizeMedium: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Medium Dialog</Button>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          size="md"
          data-testid="medium-dialog"
        />
      </div>
    );
  },
};

/** Large size dialog */
export const SizeLarge: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Large Dialog</Button>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          size="lg"
          data-testid="large-dialog"
        />
      </div>
    );
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => {
    const [openSize, setOpenSize] = useState<'sm' | 'md' | 'lg' | null>(null);
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={() => setOpenSize('sm')}>Small</Button>
          <Button onClick={() => setOpenSize('md')}>Medium</Button>
          <Button onClick={() => setOpenSize('lg')}>Large</Button>
        </div>
        {openSize && (
          <KeyboardShortcutsDialog
            isOpen={true}
            onClose={() => setOpenSize(null)}
            size={openSize}
            data-testid={`${openSize}-dialog`}
          />
        )}
      </div>
    );
  },
};

/** Responsive sizing */
export const ResponsiveSizing: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Responsive Dialog</Button>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Small on mobile, medium on tablet, large on desktop
        </p>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          size={{ base: 'sm', md: 'md', lg: 'lg' }}
          data-testid="responsive-dialog"
        />
      </div>
    );
  },
};

// ============================================================================
// Custom Shortcuts
// ============================================================================

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
          title="Editor Shortcuts"
          data-testid="custom-shortcuts-dialog"
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
          data-testid="minimal-shortcuts-dialog"
        />
      </div>
    );
  },
};

/** Many shortcut groups */
export const ManyGroups: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    const manyGroups: ShortcutGroup[] = [
      ...defaultShortcutGroups,
      {
        title: 'Git',
        shortcuts: [
          { keys: ['⌘', '⇧', 'G'], description: 'Open source control' },
          { keys: ['⌘', '⇧', 'C'], description: 'Commit changes' },
          { keys: ['⌘', '⇧', 'P'], description: 'Push changes' },
        ],
      },
      {
        title: 'Terminal',
        shortcuts: [
          { keys: ['⌘', '`'], description: 'Toggle terminal' },
          { keys: ['⌘', '⇧', '`'], description: 'New terminal' },
          { keys: ['⌘', 'C'], description: 'Copy in terminal' },
          { keys: ['⌘', 'V'], description: 'Paste in terminal' },
        ],
      },
    ];

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Show All Shortcuts</Button>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          shortcutGroups={manyGroups}
          data-testid="many-groups-dialog"
        />
      </div>
    );
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h3 className="mb-2 text-sm font-semibold">Keyboard Navigation</h3>
          <ul className="space-y-1 text-sm text-[rgb(var(--muted-foreground))]">
            <li>
              Press <kbd className="rounded bg-[rgb(var(--muted))] px-1">Tab</kbd> to navigate
              elements
            </li>
            <li>
              Press <kbd className="rounded bg-[rgb(var(--muted))] px-1">Escape</kbd> to close
            </li>
            <li>
              Press <kbd className="rounded bg-[rgb(var(--muted))] px-1">Enter</kbd> or{' '}
              <kbd className="rounded bg-[rgb(var(--muted))] px-1">Space</kbd> on close button
            </li>
          </ul>
        </div>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          data-testid="keyboard-nav-dialog"
        />
      </div>
    );
  },
};

/** Screen reader accessibility demo */
export const ScreenReaderAccessibility: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h3 className="mb-2 text-sm font-semibold">Screen Reader Features</h3>
          <ul className="space-y-1 text-sm text-[rgb(var(--muted-foreground))]">
            <li>Dialog announced with group and shortcut counts</li>
            <li>Keys announced with full names (e.g., &quot;Command plus K&quot;)</li>
            <li>Each group has proper role=&quot;group&quot; with aria-labelledby</li>
            <li>Shortcut lists use role=&quot;list&quot; and role=&quot;listitem&quot;</li>
            <li>Platform note announced for Windows/Linux users</li>
          </ul>
        </div>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          data-testid="screen-reader-dialog"
        />
      </div>
    );
  },
};

/** Touch target accessibility demo */
export const TouchTargetAccessibility: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h3 className="mb-2 text-sm font-semibold">Touch Target Compliance (WCAG 2.5.5)</h3>
          <ul className="space-y-1 text-sm text-[rgb(var(--muted-foreground))]">
            <li>Shortcut items have min-h-[44px] on mobile</li>
            <li>Close button from Dialog meets 44px requirement</li>
            <li>Touch targets relax on desktop (sm: breakpoint)</li>
          </ul>
        </div>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          data-testid="touch-target-dialog"
        />
      </div>
    );
  },
};

/** Focus ring visibility demo */
export const FocusRingVisibility: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h3 className="mb-2 text-sm font-semibold">Focus Ring Visibility</h3>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Tab through the dialog to see focus rings. Close button has visible focus-visible ring
            with ring-offset.
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          data-testid="focus-ring-dialog"
        />
      </div>
    );
  },
};

/** Reduced motion demo */
export const ReducedMotion: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h3 className="mb-2 text-sm font-semibold">Reduced Motion Support</h3>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            All hover transitions use motion-safe: prefix. Users with prefers-reduced-motion see no
            animations.
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          data-testid="reduced-motion-dialog"
        />
      </div>
    );
  },
};

// ============================================================================
// Ref and Data Attributes
// ============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const [refInfo, setRefInfo] = useState<string | null>(null);

    useEffect(() => {
      if (isOpen && dialogRef.current) {
        setRefInfo(`Ref connected to: ${dialogRef.current.tagName}`);
      }
    }, [isOpen]);

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        {refInfo && <p className="text-sm text-[rgb(var(--success))]">{refInfo}</p>}
        <KeyboardShortcutsDialog
          ref={dialogRef}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          data-testid="ref-forwarding-dialog"
        />
      </div>
    );
  },
};

/** Data-testid demo */
export const DataTestId: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h3 className="mb-2 text-sm font-semibold">Data Attributes for Testing</h3>
          <ul className="space-y-1 text-sm text-[rgb(var(--muted-foreground))]">
            <li>
              <code>data-testid=&quot;kbd-dialog&quot;</code> - Main dialog
            </li>
            <li>
              <code>data-testid=&quot;kbd-dialog-content&quot;</code> - Content area
            </li>
            <li>
              <code>data-testid=&quot;kbd-dialog-hint&quot;</code> - Toggle hint
            </li>
            <li>
              <code>data-testid=&quot;kbd-dialog-group-N&quot;</code> - Group N
            </li>
            <li>
              <code>data-testid=&quot;kbd-dialog-shortcut-N-M&quot;</code> - Shortcut M in group N
            </li>
            <li>
              <code>data-testid=&quot;kbd-dialog-footer-note&quot;</code> - Footer note
            </li>
          </ul>
        </div>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          data-testid="kbd-dialog"
        />
      </div>
    );
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** Global keyboard shortcut handler */
export const GlobalShortcutHandler: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Open with Cmd+/ or Ctrl+/
        if ((e.metaKey || e.ctrlKey) && e.key === '/') {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-center">
          <h3 className="mb-2 text-lg font-semibold">Global Shortcut Handler</h3>
          <p className="mb-4 text-sm text-[rgb(var(--muted-foreground))]">
            Press{' '}
            <kbd className="rounded bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-xs">
              Cmd+/
            </kbd>{' '}
            or{' '}
            <kbd className="rounded bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-xs">
              Ctrl+/
            </kbd>{' '}
            to toggle the shortcuts dialog
          </p>
          <Button onClick={() => setIsOpen(true)}>Or Click Here</Button>
        </div>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          data-testid="global-handler-dialog"
        />
      </div>
    );
  },
};

/** Application header integration */
export const HeaderIntegration: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="w-full max-w-3xl">
        <header className="flex items-center justify-between border-b border-[rgb(var(--border))] p-4">
          <h1 className="text-lg font-semibold">My Application</h1>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
            <kbd className="mr-2 rounded bg-[rgb(var(--muted))] px-1 py-0.5 font-mono text-[10px]">
              ?
            </kbd>
            Shortcuts
          </Button>
        </header>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          data-testid="header-integration-dialog"
        />
      </div>
    );
  },
};

/** Help menu context */
export const HelpMenuContext: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Button variant="ghost" size="sm">
            Documentation
          </Button>
          <Button variant="ghost" size="sm">
            Support
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
            Keyboard Shortcuts
          </Button>
        </div>
        <KeyboardShortcutsDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          data-testid="help-menu-dialog"
        />
      </div>
    );
  },
};

// ============================================================================
// Showcase
// ============================================================================

/** All default shortcut groups displayed outside dialog */
export const AllDefaultGroups: Story = {
  render: () => {
    return (
      <div className="space-y-8 p-4 max-w-2xl">
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

/** Keyboard key styling showcase */
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

// ============================================================================
// Constants Reference
// ============================================================================

/** Reference of all exported constants and utilities */
export const ConstantsReference: Story = {
  render: () => {
    return (
      <div className="space-y-6 p-4 max-w-3xl">
        <h2 className="text-lg font-semibold">Constants & Utilities Reference</h2>

        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h3 className="mb-3 text-sm font-semibold">Label Constants</h3>
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(
              {
                DEFAULT_DIALOG_TITLE,
                TOGGLE_SHORTCUT_KEYS,
                TOGGLE_HINT_TEXT,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h3 className="mb-3 text-sm font-semibold">Screen Reader Constants</h3>
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(
              {
                SR_TOGGLE_HINT,
                SR_PLATFORM_NOTE,
                SR_DIALOG_OPENED,
                SR_GROUP_COUNT_TEMPLATE,
                SR_SHORTCUTS_IN_GROUP_TEMPLATE,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h3 className="mb-3 text-sm font-semibold">Size Mappings</h3>
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(
              {
                SIZE_TO_DIALOG_SIZE,
                CONTENT_PADDING_CLASSES,
                GROUP_SPACING_CLASSES,
                ITEM_PADDING_CLASSES,
                KEY_SIZE_CLASSES,
                HINT_KEY_SIZE_CLASSES,
                ICON_SIZE_MAP,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h3 className="mb-3 text-sm font-semibold">CSS Class Constants</h3>
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(
              {
                HINT_CONTAINER_CLASSES,
                KEY_BASE_CLASSES,
                HINT_KEY_CLASSES,
                GROUP_TITLE_CLASSES,
                SHORTCUT_LIST_CLASSES,
                SHORTCUT_ITEM_BASE_CLASSES,
                KEYS_CONTAINER_CLASSES,
                FOOTER_NOTE_CLASSES,
                FOOTER_KEY_CLASSES,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h3 className="mb-3 text-sm font-semibold">Utility Functions</h3>
          <div className="space-y-2 text-sm">
            <div>
              <code>getBaseSize(size)</code> - Get base size from responsive value
              <p className="text-[rgb(var(--muted-foreground))] text-xs mt-1">
                Example: getBaseSize(&apos;md&apos;) = &apos;md&apos;, getBaseSize(
                {'{ base: "sm", md: "lg" }'}) = &apos;sm&apos;
              </p>
            </div>
            <div>
              <code>getResponsiveSizeClasses(size)</code> - Get content spacing classes
              <p className="text-[rgb(var(--muted-foreground))] text-xs mt-1">
                Example: getResponsiveSizeClasses(&apos;md&apos;) = &apos;
                {CONTENT_PADDING_CLASSES.md}&apos;
              </p>
            </div>
            <div>
              <code>getDialogSize(size)</code> - Convert to Dialog size
              <p className="text-[rgb(var(--muted-foreground))] text-xs mt-1">
                Example: getDialogSize(&apos;sm&apos;) = &apos;md&apos;,
                getDialogSize(&apos;lg&apos;) = &apos;xl&apos;
              </p>
            </div>
            <div>
              <code>formatKeysForSR(keys)</code> - Format keys for screen reader
              <p className="text-[rgb(var(--muted-foreground))] text-xs mt-1">
                Example: formatKeysForSR([&apos;⌘&apos;, &apos;K&apos;]) = &apos;Command plus
                K&apos;
              </p>
            </div>
            <div>
              <code>buildGroupCountAnnouncement(count)</code> - Build group count SR text
              <p className="text-[rgb(var(--muted-foreground))] text-xs mt-1">
                Example: buildGroupCountAnnouncement(5) = &apos;5 shortcut groups available.&apos;
              </p>
            </div>
            <div>
              <code>buildShortcutsInGroupAnnouncement(count, title)</code> - Build shortcuts in
              group SR text
              <p className="text-[rgb(var(--muted-foreground))] text-xs mt-1">
                Example: buildShortcutsInGroupAnnouncement(4, &apos;Navigation&apos;) = &apos;4
                shortcuts in Navigation.&apos;
              </p>
            </div>
            <div>
              <code>getTotalShortcutCount(groups)</code> - Count all shortcuts
              <p className="text-[rgb(var(--muted-foreground))] text-xs mt-1">
                Example: getTotalShortcutCount(defaultShortcutGroups) ={' '}
                {getTotalShortcutCount(defaultShortcutGroups)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
