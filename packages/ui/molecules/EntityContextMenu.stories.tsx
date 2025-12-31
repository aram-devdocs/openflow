import type { Meta, StoryObj } from '@storybook/react';
import type React from 'react';
import { useState } from 'react';
import { EntityContextMenu } from './EntityContextMenu';

const meta: Meta<typeof EntityContextMenu> = {
  title: 'Molecules/EntityContextMenu',
  component: EntityContextMenu,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    entityType: {
      control: 'select',
      options: ['task', 'chat', 'project'],
      description: 'The type of entity this menu is for',
    },
    isOpen: {
      control: 'boolean',
      description: 'Whether the menu is open',
    },
    isArchived: {
      control: 'boolean',
      description: 'Whether the entity is archived',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EntityContextMenu>;

const defaultPosition = { x: 100, y: 100 };
const defaultHandlers = {
  onClose: () => console.log('Close'),
  onViewDetails: () => console.log('View details'),
  onEdit: () => console.log('Edit'),
  onArchive: () => console.log('Archive'),
  onDelete: () => console.log('Delete'),
};

/** Task context menu with all actions */
export const TaskMenu: Story = {
  args: {
    entityType: 'task',
    isOpen: true,
    position: defaultPosition,
    ...defaultHandlers,
  },
};

/** Chat context menu with all actions */
export const ChatMenu: Story = {
  args: {
    entityType: 'chat',
    isOpen: true,
    position: defaultPosition,
    ...defaultHandlers,
  },
};

/** Project context menu with all actions */
export const ProjectMenu: Story = {
  args: {
    entityType: 'project',
    isOpen: true,
    position: defaultPosition,
    ...defaultHandlers,
  },
};

/** Archived task menu shows restore instead of archive */
export const ArchivedTaskMenu: Story = {
  args: {
    entityType: 'task',
    isOpen: true,
    position: defaultPosition,
    isArchived: true,
    onClose: () => console.log('Close'),
    onViewDetails: () => console.log('View details'),
    onRestore: () => console.log('Restore'),
    onDelete: () => console.log('Delete'),
  },
};

/** Archived chat menu shows restore instead of archive */
export const ArchivedChatMenu: Story = {
  args: {
    entityType: 'chat',
    isOpen: true,
    position: defaultPosition,
    isArchived: true,
    onClose: () => console.log('Close'),
    onViewDetails: () => console.log('View details'),
    onRestore: () => console.log('Restore'),
    onDelete: () => console.log('Delete'),
  },
};

/** Archived project menu shows restore instead of archive */
export const ArchivedProjectMenu: Story = {
  args: {
    entityType: 'project',
    isOpen: true,
    position: defaultPosition,
    isArchived: true,
    onClose: () => console.log('Close'),
    onViewDetails: () => console.log('View details'),
    onRestore: () => console.log('Restore'),
    onDelete: () => console.log('Delete'),
  },
};

/** Menu with only view and delete actions */
export const ViewAndDeleteOnly: Story = {
  args: {
    entityType: 'task',
    isOpen: true,
    position: defaultPosition,
    onClose: () => console.log('Close'),
    onViewDetails: () => console.log('View details'),
    onDelete: () => console.log('Delete'),
  },
};

/** Menu with only archive and delete actions */
export const ArchiveAndDeleteOnly: Story = {
  args: {
    entityType: 'task',
    isOpen: true,
    position: defaultPosition,
    onClose: () => console.log('Close'),
    onArchive: () => console.log('Archive'),
    onDelete: () => console.log('Delete'),
  },
};

/** Menu with delete only */
export const DeleteOnly: Story = {
  args: {
    entityType: 'chat',
    isOpen: true,
    position: defaultPosition,
    onClose: () => console.log('Close'),
    onDelete: () => console.log('Delete'),
  },
};

/** Closed menu (renders nothing visible) */
export const Closed: Story = {
  args: {
    entityType: 'task',
    isOpen: false,
    position: defaultPosition,
    ...defaultHandlers,
  },
};

/** Interactive context menu triggered by right-click */
export const InteractiveContextMenu: Story = {
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
          Right-click on this task card
        </div>
        <EntityContextMenu
          entityType="task"
          isOpen={isOpen}
          position={position}
          onClose={() => setIsOpen(false)}
          onViewDetails={() => {
            console.log('View task');
            setIsOpen(false);
          }}
          onEdit={() => {
            console.log('Edit task');
            setIsOpen(false);
          }}
          onArchive={() => {
            console.log('Archive task');
            setIsOpen(false);
          }}
          onDelete={() => {
            console.log('Delete task');
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};

/** Interactive archived item context menu */
export const InteractiveArchivedMenu: Story = {
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
          className="flex h-40 w-64 items-center justify-center rounded-md border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--muted))] text-sm text-[rgb(var(--muted-foreground))] opacity-60"
        >
          Right-click on this archived project
        </div>
        <EntityContextMenu
          entityType="project"
          isOpen={isOpen}
          position={position}
          isArchived={true}
          onClose={() => setIsOpen(false)}
          onViewDetails={() => {
            console.log('View project');
            setIsOpen(false);
          }}
          onRestore={() => {
            console.log('Restore project');
            setIsOpen(false);
          }}
          onDelete={() => {
            console.log('Delete project');
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};

/** All entity types side by side */
export const AllEntityTypes: Story = {
  render: () => (
    <div className="flex gap-8">
      <div>
        <p className="mb-2 text-sm font-medium">Task</p>
        <EntityContextMenu
          entityType="task"
          isOpen={true}
          position={{ x: 0, y: 30 }}
          onClose={() => {}}
          onViewDetails={() => console.log('View')}
          onEdit={() => console.log('Edit')}
          onArchive={() => console.log('Archive')}
          onDelete={() => console.log('Delete')}
        />
      </div>

      <div className="ml-48">
        <p className="mb-2 text-sm font-medium">Chat</p>
        <EntityContextMenu
          entityType="chat"
          isOpen={true}
          position={{ x: 0, y: 30 }}
          onClose={() => {}}
          onViewDetails={() => console.log('View')}
          onEdit={() => console.log('Edit')}
          onArchive={() => console.log('Archive')}
          onDelete={() => console.log('Delete')}
        />
      </div>

      <div className="ml-48">
        <p className="mb-2 text-sm font-medium">Project</p>
        <EntityContextMenu
          entityType="project"
          isOpen={true}
          position={{ x: 0, y: 30 }}
          onClose={() => {}}
          onViewDetails={() => console.log('View')}
          onEdit={() => console.log('Edit')}
          onArchive={() => console.log('Archive')}
          onDelete={() => console.log('Delete')}
        />
      </div>
    </div>
  ),
};

/** Active vs Archived comparison */
export const ActiveVsArchived: Story = {
  render: () => (
    <div className="flex gap-8">
      <div>
        <p className="mb-2 text-sm font-medium">Active Task</p>
        <EntityContextMenu
          entityType="task"
          isOpen={true}
          position={{ x: 0, y: 30 }}
          onClose={() => {}}
          onViewDetails={() => console.log('View')}
          onEdit={() => console.log('Edit')}
          onArchive={() => console.log('Archive')}
          onDelete={() => console.log('Delete')}
        />
      </div>

      <div className="ml-48">
        <p className="mb-2 text-sm font-medium">Archived Task</p>
        <EntityContextMenu
          entityType="task"
          isOpen={true}
          isArchived={true}
          position={{ x: 0, y: 30 }}
          onClose={() => {}}
          onViewDetails={() => console.log('View')}
          onRestore={() => console.log('Restore')}
          onDelete={() => console.log('Delete')}
        />
      </div>
    </div>
  ),
};
