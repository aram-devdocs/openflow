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
import { useState } from 'react';
import { Button } from '../atoms/Button';
import { Menu } from './Menu';
import type { MenuItem } from './Menu';

const meta: Meta<typeof Menu> = {
  title: 'Molecules/Menu',
  component: Menu,
  parameters: {
    layout: 'centered',
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
        <Button variant="secondary" onClick={handleOpen}>
          <MoreVertical className="h-4 w-4" />
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
          onClick={handleOpen}
          className="flex items-center gap-2 rounded-full bg-[rgb(var(--muted))] p-2 hover:bg-[rgb(var(--accent))]"
        >
          <User className="h-5 w-5 text-[rgb(var(--foreground))]" />
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
              label: 'Disabled Option',
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
        <div className="mt-60 text-xs text-[rgb(var(--muted-foreground))]">
          <p>Keyboard shortcuts:</p>
          <ul className="list-inside list-disc">
            <li>Arrow Up/Down: Navigate options</li>
            <li>Home/End: Jump to first/last option</li>
            <li>Enter/Space: Select highlighted option</li>
            <li>Escape/Tab: Close menu</li>
          </ul>
          <button
            onClick={() => setIsOpen(true)}
            className="mt-2 text-[rgb(var(--primary))] underline"
          >
            Reopen menu
          </button>
        </div>
      </div>
    );
  },
};

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
