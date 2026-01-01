import type { Meta, StoryObj } from '@storybook/react';
import {
  Archive,
  Copy,
  Download,
  Edit,
  FileText,
  Folder,
  HelpCircle,
  LogOut,
  MoreVertical,
  Settings,
  Share,
  Star,
  Trash,
  User,
} from 'lucide-react';
import type React from 'react';
import { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import {
  MENU_ANIMATION_CLASSES,
  MENU_BASE_CLASSES,
  MENU_DIVIDER_CLASSES,
  MENU_ITEM_BASE_CLASSES,
  Menu,
  getItemAnnouncement,
  getPositionStyles,
} from './Menu';
import type { MenuItem, MenuPosition } from './Menu';

const meta: Meta<typeof Menu> = {
  title: 'Molecules/Menu',
  component: Menu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A fully accessible context/dropdown menu component.

## Accessibility Features

- **ARIA Roles**: \`role="menu"\` on container, \`role="menuitem"\` on items, \`role="separator"\` on dividers
- **Keyboard Navigation**: Arrow keys, Home/End, Enter/Space to select, Escape to close
- **Screen Reader**: Announces highlighted items via \`aria-activedescendant\` and VisuallyHidden status
- **Touch Targets**: 44px minimum height for WCAG 2.5.5 compliance
- **Reduced Motion**: Animations respect \`prefers-reduced-motion\`

## Usage

\`\`\`tsx
<Menu
  items={[
    { id: 'edit', label: 'Edit', icon: Edit, onClick: handleEdit },
    { id: 'divider', label: '', divider: true },
    { id: 'delete', label: 'Delete', destructive: true, onClick: handleDelete },
  ]}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  position={{ x: 100, y: 200 }}
  aria-label="Actions menu"
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
      description: 'Whether the menu is open',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessible label for the menu',
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for automated testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Menu>;

const basicItems: MenuItem[] = [
  { id: 'edit', label: 'Edit', icon: Edit, onClick: () => console.log('Edit') },
  { id: 'copy', label: 'Copy', icon: Copy, onClick: () => console.log('Copy') },
  {
    id: 'share',
    label: 'Share',
    icon: Share,
    onClick: () => console.log('Share'),
  },
];

// =============================================================================
// BASIC EXAMPLES
// =============================================================================

/** Default menu with basic items */
export const Default: Story = {
  args: {
    items: basicItems,
    isOpen: true,
    position: { x: 100, y: 100 },
    onClose: () => console.log('Close'),
    'aria-label': 'Actions menu',
  },
};

/** Interactive menu with button trigger */
export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleOpen = (event: React.MouseEvent) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setPosition({ x: rect.left, y: rect.bottom + 4 });
      setIsOpen(true);
    };

    return (
      <div className="relative">
        <Button
          variant="secondary"
          onClick={handleOpen}
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open actions menu</span>
        </Button>
        <Menu
          items={basicItems}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position={position}
          aria-label="Actions menu"
        />
      </div>
    );
  },
};

// =============================================================================
// ITEM VARIATIONS
// =============================================================================

/** Menu with icons and keyboard shortcuts */
export const WithShortcuts: Story = {
  args: {
    items: [
      {
        id: 'copy',
        label: 'Copy',
        icon: Copy,
        shortcut: '⌘C',
        onClick: () => console.log('Copy'),
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: Edit,
        shortcut: '⌘E',
        onClick: () => console.log('Edit'),
      },
      {
        id: 'download',
        label: 'Download',
        icon: Download,
        shortcut: '⌘D',
        onClick: () => console.log('Download'),
      },
    ],
    isOpen: true,
    position: { x: 100, y: 100 },
    onClose: () => console.log('Close'),
    'aria-label': 'Actions with shortcuts',
  },
};

/** Menu with dividers */
export const WithDividers: Story = {
  args: {
    items: [
      {
        id: 'edit',
        label: 'Edit',
        icon: Edit,
        onClick: () => console.log('Edit'),
      },
      {
        id: 'copy',
        label: 'Copy',
        icon: Copy,
        onClick: () => console.log('Copy'),
      },
      { id: 'divider1', label: '', divider: true },
      {
        id: 'share',
        label: 'Share',
        icon: Share,
        onClick: () => console.log('Share'),
      },
      {
        id: 'download',
        label: 'Download',
        icon: Download,
        onClick: () => console.log('Download'),
      },
      { id: 'divider2', label: '', divider: true },
      {
        id: 'delete',
        label: 'Delete',
        icon: Trash,
        destructive: true,
        onClick: () => console.log('Delete'),
      },
    ],
    isOpen: true,
    position: { x: 100, y: 100 },
    onClose: () => console.log('Close'),
    'aria-label': 'Actions menu',
  },
};

/** Menu with disabled items */
export const WithDisabledItems: Story = {
  args: {
    items: [
      {
        id: 'edit',
        label: 'Edit',
        icon: Edit,
        onClick: () => console.log('Edit'),
      },
      {
        id: 'copy',
        label: 'Copy',
        icon: Copy,
        disabled: true,
        onClick: () => console.log('Copy'),
      },
      {
        id: 'share',
        label: 'Share',
        icon: Share,
        onClick: () => console.log('Share'),
      },
      {
        id: 'download',
        label: 'Download',
        icon: Download,
        disabled: true,
        onClick: () => console.log('Download'),
      },
    ],
    isOpen: true,
    position: { x: 100, y: 100 },
    onClose: () => console.log('Close'),
    'aria-label': 'Actions with disabled items',
  },
};

/** Menu with destructive actions */
export const WithDestructiveAction: Story = {
  args: {
    items: [
      {
        id: 'edit',
        label: 'Edit',
        icon: Edit,
        onClick: () => console.log('Edit'),
      },
      {
        id: 'archive',
        label: 'Archive',
        icon: Archive,
        onClick: () => console.log('Archive'),
      },
      { id: 'divider', label: '', divider: true },
      {
        id: 'delete',
        label: 'Delete',
        icon: Trash,
        destructive: true,
        onClick: () => console.log('Delete'),
      },
    ],
    isOpen: true,
    position: { x: 100, y: 100 },
    onClose: () => console.log('Close'),
    'aria-label': 'Actions menu',
  },
};

/** Text-only menu (no icons) */
export const TextOnly: Story = {
  args: {
    items: [
      { id: 'option1', label: 'Option 1', onClick: () => console.log('1') },
      { id: 'option2', label: 'Option 2', onClick: () => console.log('2') },
      { id: 'option3', label: 'Option 3', onClick: () => console.log('3') },
      { id: 'divider', label: '', divider: true },
      { id: 'option4', label: 'Option 4', onClick: () => console.log('4') },
    ],
    isOpen: true,
    position: { x: 100, y: 100 },
    onClose: () => console.log('Close'),
    'aria-label': 'Simple menu',
  },
};

/** Menu with many items */
export const ManyItems: Story = {
  args: {
    items: [
      {
        id: 'edit',
        label: 'Edit',
        icon: Edit,
        onClick: () => console.log('Edit'),
      },
      {
        id: 'copy',
        label: 'Copy',
        icon: Copy,
        onClick: () => console.log('Copy'),
      },
      {
        id: 'share',
        label: 'Share',
        icon: Share,
        onClick: () => console.log('Share'),
      },
      {
        id: 'download',
        label: 'Download',
        icon: Download,
        onClick: () => console.log('Download'),
      },
      {
        id: 'star',
        label: 'Add to favorites',
        icon: Star,
        onClick: () => console.log('Star'),
      },
      {
        id: 'archive',
        label: 'Archive',
        icon: Archive,
        onClick: () => console.log('Archive'),
      },
      { id: 'divider', label: '', divider: true },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        onClick: () => console.log('Settings'),
      },
      {
        id: 'help',
        label: 'Help',
        icon: HelpCircle,
        onClick: () => console.log('Help'),
      },
      { id: 'divider2', label: '', divider: true },
      {
        id: 'delete',
        label: 'Delete',
        icon: Trash,
        destructive: true,
        onClick: () => console.log('Delete'),
      },
    ],
    isOpen: true,
    position: { x: 100, y: 100 },
    onClose: () => console.log('Close'),
    'aria-label': 'Full actions menu',
  },
};

// =============================================================================
// REAL-WORLD EXAMPLES
// =============================================================================

/** Context menu example */
export const ContextMenu: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleContextMenu = (event: React.MouseEvent) => {
      event.preventDefault();
      setPosition({ x: event.clientX, y: event.clientY });
      setIsOpen(true);
    };

    return (
      <div>
        <div
          onContextMenu={handleContextMenu}
          className="flex h-40 w-64 items-center justify-center rounded-md border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--muted))] text-sm text-[rgb(var(--muted-foreground))]"
        >
          Right-click here
        </div>
        <Menu
          items={[
            {
              id: 'new-file',
              label: 'New File',
              icon: FileText,
              shortcut: '⌘N',
              onClick: () => console.log('New File'),
            },
            {
              id: 'new-folder',
              label: 'New Folder',
              icon: Folder,
              shortcut: '⇧⌘N',
              onClick: () => console.log('New Folder'),
            },
            { id: 'divider1', label: '', divider: true },
            {
              id: 'copy',
              label: 'Copy',
              icon: Copy,
              shortcut: '⌘C',
              onClick: () => console.log('Copy'),
            },
            {
              id: 'paste',
              label: 'Paste',
              icon: Edit,
              shortcut: '⌘V',
              disabled: true,
              onClick: () => console.log('Paste'),
            },
            { id: 'divider2', label: '', divider: true },
            {
              id: 'delete',
              label: 'Delete',
              icon: Trash,
              destructive: true,
              onClick: () => console.log('Delete'),
            },
          ]}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position={position}
          aria-label="Context menu"
        />
      </div>
    );
  },
};

/** User menu example */
export const UserMenu: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleOpen = (event: React.MouseEvent) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setPosition({ x: rect.right - 160, y: rect.bottom + 4 });
      setIsOpen(true);
    };

    return (
      <div>
        <button
          type="button"
          onClick={handleOpen}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className="flex items-center gap-2 rounded-full bg-[rgb(var(--muted))] p-2 hover:bg-[rgb(var(--accent))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2"
        >
          <User className="h-5 w-5 text-[rgb(var(--foreground))]" />
          <span className="sr-only">Open user menu</span>
        </button>
        <Menu
          items={[
            {
              id: 'profile',
              label: 'Profile',
              icon: User,
              onClick: () => console.log('Profile'),
            },
            {
              id: 'settings',
              label: 'Settings',
              icon: Settings,
              onClick: () => console.log('Settings'),
            },
            {
              id: 'help',
              label: 'Help',
              icon: HelpCircle,
              onClick: () => console.log('Help'),
            },
            { id: 'divider', label: '', divider: true },
            {
              id: 'logout',
              label: 'Log out',
              icon: LogOut,
              destructive: true,
              onClick: () => console.log('Logout'),
            },
          ]}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position={position}
          aria-label="User menu"
        />
      </div>
    );
  },
};

// =============================================================================
// ACCESSIBILITY DEMOS
// =============================================================================

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="space-y-4">
        <Menu
          items={[
            {
              id: 'first',
              label: 'First Option',
              onClick: () => console.log('First'),
            },
            {
              id: 'second',
              label: 'Second Option',
              onClick: () => console.log('Second'),
            },
            {
              id: 'disabled',
              label: 'Disabled Option (skipped by keyboard)',
              disabled: true,
              onClick: () => console.log('Disabled'),
            },
            {
              id: 'fourth',
              label: 'Fourth Option',
              onClick: () => console.log('Fourth'),
            },
            {
              id: 'fifth',
              label: 'Fifth Option',
              onClick: () => console.log('Fifth'),
            },
          ]}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position={{ x: 100, y: 100 }}
          aria-label="Keyboard demo menu"
        />
        <div className="mt-60 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--muted))] p-4 text-xs text-[rgb(var(--muted-foreground))]">
          <p className="font-semibold mb-2">Keyboard Shortcuts:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              <kbd className="rounded bg-[rgb(var(--background))] px-1">↑</kbd> /{' '}
              <kbd className="rounded bg-[rgb(var(--background))] px-1">↓</kbd>: Navigate options
            </li>
            <li>
              <kbd className="rounded bg-[rgb(var(--background))] px-1">Home</kbd> /{' '}
              <kbd className="rounded bg-[rgb(var(--background))] px-1">End</kbd>: Jump to
              first/last
            </li>
            <li>
              <kbd className="rounded bg-[rgb(var(--background))] px-1">Enter</kbd> /{' '}
              <kbd className="rounded bg-[rgb(var(--background))] px-1">Space</kbd>: Select item
            </li>
            <li>
              <kbd className="rounded bg-[rgb(var(--background))] px-1">Escape</kbd> /{' '}
              <kbd className="rounded bg-[rgb(var(--background))] px-1">Tab</kbd>: Close menu
            </li>
          </ul>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="mt-3 text-[rgb(var(--primary))] underline"
          >
            Reopen menu
          </button>
        </div>
      </div>
    );
  },
};

/** Screen reader accessibility demo */
export const ScreenReaderAccessibility: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="space-y-4">
        <Menu
          items={[
            {
              id: 'edit',
              label: 'Edit document',
              icon: Edit,
              onClick: () => console.log('Edit'),
            },
            { id: 'divider', label: '', divider: true },
            {
              id: 'delete',
              label: 'Delete permanently',
              icon: Trash,
              destructive: true,
              onClick: () => console.log('Delete'),
            },
          ]}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position={{ x: 100, y: 100 }}
          aria-label="Document actions"
          data-testid="sr-demo-menu"
        />
        <div className="mt-44 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--muted))] p-4 text-xs text-[rgb(var(--muted-foreground))]">
          <p className="font-semibold mb-2">Screen Reader Behavior:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Menu announced with aria-label: "Document actions"</li>
            <li>Items announced with role="menuitem"</li>
            <li>Highlighted item tracked via aria-activedescendant</li>
            <li>Dividers use role="separator" (not announced)</li>
            <li>Destructive actions announced as "(destructive action)"</li>
            <li>Disabled items include aria-disabled="true"</li>
          </ul>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="mt-3 text-[rgb(var(--primary))] underline"
          >
            Reopen menu
          </button>
        </div>
      </div>
    );
  },
};

/** Touch target accessibility - all items have 44px min-height */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <Menu
        items={[
          { id: 'short', label: 'Short', onClick: () => {} },
          { id: 'medium', label: 'Medium length label', onClick: () => {} },
          {
            id: 'long',
            label: 'Very long label that might wrap on narrow screens',
            onClick: () => {},
          },
        ]}
        isOpen={true}
        onClose={() => {}}
        position={{ x: 100, y: 100 }}
        aria-label="Touch demo"
      />
      <div className="mt-48 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--muted))] p-4 text-xs text-[rgb(var(--muted-foreground))]">
        <p className="font-semibold mb-2">Touch Target Compliance (WCAG 2.5.5):</p>
        <ul className="list-inside list-disc space-y-1">
          <li>All menu items have minimum height of 44px</li>
          <li>Ensures easy touch interaction on mobile devices</li>
          <li>Applied via min-h-[44px] class on menu items</li>
        </ul>
      </div>
    </div>
  ),
};

/** Focus ring visibility demo */
export const FocusRingVisibility: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleOpen = (event: React.MouseEvent) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setPosition({ x: rect.left, y: rect.bottom + 4 });
      setIsOpen(true);
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Button
            variant="primary"
            onClick={handleOpen}
            aria-haspopup="menu"
            aria-expanded={isOpen}
          >
            Open Menu (light bg)
          </Button>
        </div>
        <Menu
          items={basicItems}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position={position}
          aria-label="Focus demo menu"
        />
        <div className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--muted))] p-4 text-xs text-[rgb(var(--muted-foreground))]">
          <p className="font-semibold mb-2">Focus Management:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Menu receives focus when opened</li>
            <li>focus:outline-none on menu container (using aria-activedescendant)</li>
            <li>Visual highlight on currently navigated item</li>
            <li>Tab key closes menu and returns focus to page</li>
          </ul>
        </div>
      </div>
    );
  },
};

/** Reduced motion support */
export const ReducedMotion: Story = {
  render: () => (
    <div className="space-y-4">
      <Menu
        items={basicItems}
        isOpen={true}
        onClose={() => {}}
        position={{ x: 100, y: 100 }}
        aria-label="Reduced motion demo"
      />
      <div className="mt-48 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--muted))] p-4 text-xs text-[rgb(var(--muted-foreground))]">
        <p className="font-semibold mb-2">Reduced Motion Support:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Animations use motion-safe: prefix</li>
          <li>Users with prefers-reduced-motion see no animations</li>
          <li>Transitions on hover also respect this setting</li>
        </ul>
        <p className="mt-2">To test: Enable "Reduce motion" in your OS accessibility settings.</p>
      </div>
    </div>
  ),
};

// =============================================================================
// REF FORWARDING & DATA ATTRIBUTES
// =============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: () => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(true);
    const [dimensions, setDimensions] = useState<string>('');

    const measureMenu = () => {
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        setDimensions(`Width: ${rect.width.toFixed(0)}px, Height: ${rect.height.toFixed(0)}px`);
      }
    };

    return (
      <div className="space-y-4">
        <Menu
          ref={menuRef}
          items={basicItems}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position={{ x: 100, y: 100 }}
          aria-label="Ref demo menu"
        />
        <div className="mt-48 flex gap-2">
          <button
            type="button"
            onClick={measureMenu}
            className="rounded-md bg-[rgb(var(--primary))] px-3 py-2 text-sm text-[rgb(var(--primary-foreground))]"
          >
            Measure Menu
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-md bg-[rgb(var(--secondary))] px-3 py-2 text-sm text-[rgb(var(--secondary-foreground))]"
          >
            Reopen Menu
          </button>
        </div>
        {dimensions && <p className="text-sm text-[rgb(var(--muted-foreground))]">{dimensions}</p>}
      </div>
    );
  },
};

/** Data attributes demo */
export const DataAttributes: Story = {
  args: {
    items: [
      { id: 'item1', label: 'Regular Item', onClick: () => {} },
      { id: 'item2', label: 'Destructive Item', destructive: true, onClick: () => {} },
    ],
    isOpen: true,
    position: { x: 100, y: 100 },
    onClose: () => {},
    'aria-label': 'Data attributes demo',
    'data-testid': 'example-menu',
    'data-entity-type': 'document',
    'data-archived': false,
  },
};

// =============================================================================
// POSITION VARIATIONS
// =============================================================================

/** Different positions */
export const PositionVariations: Story = {
  render: () => {
    const positions: { label: string; position: MenuPosition }[] = [
      { label: 'Absolute (100, 100)', position: { x: 100, y: 100 } },
      { label: 'Absolute (300, 100)', position: { x: 300, y: 100 } },
      { label: 'Left aligned', position: { x: 'left', y: 100 } },
      { label: 'Right aligned', position: { x: 'right', y: 100 } },
    ];

    const [activePosition, setActivePosition] = useState(0);
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap mb-8">
          {positions.map((p, i) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setActivePosition(i);
                setIsOpen(true);
              }}
              className={`rounded-md px-3 py-2 text-sm ${
                activePosition === i
                  ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
                  : 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Menu
          items={basicItems}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position={positions[activePosition]?.position ?? { x: 100, y: 100 }}
          aria-label="Position demo menu"
        />
      </div>
    );
  },
};

// =============================================================================
// ALL VARIATIONS SHOWCASE
// =============================================================================

/** All menu variations showcase */
export const AllVariations: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mb-2 text-sm font-medium">Basic menu</p>
        <Menu
          items={basicItems}
          isOpen={true}
          onClose={() => {}}
          position={{ x: 0, y: 30 }}
          aria-label="Basic menu"
        />
      </div>

      <div className="mt-32">
        <p className="mb-2 text-sm font-medium">With shortcuts</p>
        <Menu
          items={[
            { id: 'copy', label: 'Copy', icon: Copy, shortcut: '⌘C' },
            { id: 'paste', label: 'Paste', icon: Edit, shortcut: '⌘V' },
          ]}
          isOpen={true}
          onClose={() => {}}
          position={{ x: 0, y: 30 }}
          aria-label="Shortcuts menu"
        />
      </div>

      <div className="mt-32">
        <p className="mb-2 text-sm font-medium">With dividers and destructive</p>
        <Menu
          items={[
            { id: 'edit', label: 'Edit', icon: Edit },
            { id: 'divider', label: '', divider: true },
            {
              id: 'delete',
              label: 'Delete',
              icon: Trash,
              destructive: true,
            },
          ]}
          isOpen={true}
          onClose={() => {}}
          position={{ x: 0, y: 30 }}
          aria-label="Destructive menu"
        />
      </div>

      <div className="mt-32">
        <p className="mb-2 text-sm font-medium">With disabled items</p>
        <Menu
          items={[
            { id: 'enabled', label: 'Enabled' },
            { id: 'disabled', label: 'Disabled', disabled: true },
            { id: 'also-enabled', label: 'Also Enabled' },
          ]}
          isOpen={true}
          onClose={() => {}}
          position={{ x: 0, y: 30 }}
          aria-label="Disabled items menu"
        />
      </div>
    </div>
  ),
};

// =============================================================================
// CONSTANTS REFERENCE
// =============================================================================

/** Constants and utilities reference */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold mb-2">Exported Constants</h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-[rgb(var(--foreground))]">MENU_BASE_CLASSES</p>
            <code className="block mt-1 p-2 rounded bg-[rgb(var(--muted))] text-xs overflow-x-auto">
              {MENU_BASE_CLASSES}
            </code>
          </div>

          <div>
            <p className="font-medium text-[rgb(var(--foreground))]">MENU_ANIMATION_CLASSES</p>
            <code className="block mt-1 p-2 rounded bg-[rgb(var(--muted))] text-xs overflow-x-auto">
              {MENU_ANIMATION_CLASSES}
            </code>
          </div>

          <div>
            <p className="font-medium text-[rgb(var(--foreground))]">MENU_ITEM_BASE_CLASSES</p>
            <code className="block mt-1 p-2 rounded bg-[rgb(var(--muted))] text-xs overflow-x-auto">
              {MENU_ITEM_BASE_CLASSES}
            </code>
          </div>

          <div>
            <p className="font-medium text-[rgb(var(--foreground))]">MENU_DIVIDER_CLASSES</p>
            <code className="block mt-1 p-2 rounded bg-[rgb(var(--muted))] text-xs overflow-x-auto">
              {MENU_DIVIDER_CLASSES}
            </code>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Utility Functions</h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-[rgb(var(--foreground))]">getPositionStyles(position)</p>
            <p className="text-[rgb(var(--muted-foreground))]">
              Converts MenuPosition to CSS styles object
            </p>
            <code className="block mt-1 p-2 rounded bg-[rgb(var(--muted))] text-xs">
              {'getPositionStyles({ x: 100, y: 200 })'}
              <br />
              {`// => { position: 'fixed', left: 100, top: 200 }`}
              <br />
              <br />
              {`getPositionStyles({ x: 'right', y: 'bottom' })`}
              <br />
              {`// => { position: 'fixed', right: 0, bottom: 0 }`}
            </code>
          </div>

          <div>
            <p className="font-medium text-[rgb(var(--foreground))]">
              getItemAnnouncement(label, destructive?)
            </p>
            <p className="text-[rgb(var(--muted-foreground))]">
              Gets screen reader announcement for menu item
            </p>
            <code className="block mt-1 p-2 rounded bg-[rgb(var(--muted))] text-xs">
              {`getItemAnnouncement('Delete', true)`}
              <br />
              {`// => "Delete (destructive action)"`}
            </code>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Live Utility Examples</h3>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Position (100, 200):</strong>{' '}
            <code className="bg-[rgb(var(--muted))] px-1 rounded">
              {JSON.stringify(getPositionStyles({ x: 100, y: 200 }))}
            </code>
          </p>
          <p>
            <strong>Position (right, bottom):</strong>{' '}
            <code className="bg-[rgb(var(--muted))] px-1 rounded">
              {JSON.stringify(getPositionStyles({ x: 'right', y: 'bottom' }))}
            </code>
          </p>
          <p>
            <strong>Announcement (Edit):</strong>{' '}
            <code className="bg-[rgb(var(--muted))] px-1 rounded">
              "{getItemAnnouncement('Edit')}"
            </code>
          </p>
          <p>
            <strong>Announcement (Delete, destructive):</strong>{' '}
            <code className="bg-[rgb(var(--muted))] px-1 rounded">
              "{getItemAnnouncement('Delete', true)}"
            </code>
          </p>
        </div>
      </div>
    </div>
  ),
};
