import type { Meta, StoryObj } from '@storybook/react';
import type React from 'react';
import { useRef, useState } from 'react';
import {
  DEFAULT_ARIA_LABEL_TEMPLATE,
  ENTITY_CONTEXT_MENU_BASE_CLASSES,
  ENTITY_TYPE_LABELS,
  EntityContextMenu,
  MENU_ITEM_IDS,
  getEntityLabel,
  getScreenReaderAnnouncement,
} from './EntityContextMenu';

const meta: Meta<typeof EntityContextMenu> = {
  title: 'Molecules/EntityContextMenu',
  component: EntityContextMenu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
EntityContextMenu provides a consistent context menu for managing entities (tasks, chats, projects).

## Features
- **Type-aware labels**: Menu items use proper entity type names (Task, Chat, Project)
- **Archived state handling**: Shows restore instead of archive for archived items
- **Keyboard navigation**: Arrow keys, Enter/Space to select, Escape to close (inherited from Menu)
- **Screen reader support**: Announces menu state and action count on open
- **Focus management**: Menu receives focus when opened, returns focus on close
- **Touch-friendly**: 44px minimum touch targets on all menu items
- **Motion-safe animations**: Respects prefers-reduced-motion

## Accessibility
- Uses role="menu" with role="menuitem" for items
- Provides aria-label for screen readers
- Announces via aria-live when menu opens
- Keyboard navigation: Arrow keys, Home/End, Escape
- Focus trap within menu when open

## Usage
\`\`\`tsx
<EntityContextMenu
  entityType="task"
  isOpen={menuOpen}
  position={{ x: mouseX, y: mouseY }}
  onClose={() => setMenuOpen(false)}
  onViewDetails={handleView}
  onEdit={handleEdit}
  onArchive={handleArchive}
  onDelete={handleDelete}
/>
\`\`\`
        `,
      },
    },
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
    'aria-label': {
      control: 'text',
      description: 'Custom aria-label override',
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for automated testing',
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

// =============================================================================
// Basic Examples - Entity Types
// =============================================================================

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

// =============================================================================
// Archived States
// =============================================================================

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

// =============================================================================
// Action Subsets
// =============================================================================

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

/** Menu with all possible actions including duplicate and open in IDE */
export const AllActionsMenu: Story = {
  args: {
    entityType: 'project',
    isOpen: true,
    position: defaultPosition,
    onClose: () => console.log('Close'),
    onViewDetails: () => console.log('View details'),
    onEdit: () => console.log('Edit'),
    onDuplicate: () => console.log('Duplicate'),
    onOpenInIDE: () => console.log('Open in IDE'),
    onArchive: () => console.log('Archive'),
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

// =============================================================================
// Interactive Examples
// =============================================================================

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
          data-testid="task-context-menu"
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
          data-testid="archived-project-menu"
        />
      </div>
    );
  },
};

// =============================================================================
// Comparison Views
// =============================================================================

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

// =============================================================================
// Accessibility Demos
// =============================================================================

/** Keyboard navigation demo - use Arrow keys to navigate, Enter/Space to select */
export const KeyboardNavigation: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [lastAction, setLastAction] = useState<string>('');

    return (
      <div className="space-y-4">
        <div className="text-sm">
          <p className="font-medium">Keyboard Controls:</p>
          <ul className="ml-4 list-disc text-[rgb(var(--muted-foreground))]">
            <li>Arrow Up/Down: Navigate items</li>
            <li>Home/End: Jump to first/last item</li>
            <li>Enter/Space: Select item</li>
            <li>Escape: Close menu</li>
          </ul>
        </div>

        {lastAction && (
          <div className="rounded-md bg-[rgb(var(--muted))] p-2 text-sm">
            Last action: {lastAction}
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm text-[rgb(var(--primary-foreground))]"
        >
          {isOpen ? 'Menu is open - focus it!' : 'Open Menu'}
        </button>

        <EntityContextMenu
          entityType="task"
          isOpen={isOpen}
          position={{ x: 20, y: 200 }}
          onClose={() => {
            setIsOpen(false);
            setLastAction('Closed menu');
          }}
          onViewDetails={() => {
            setLastAction('View Task');
            setIsOpen(false);
          }}
          onEdit={() => {
            setLastAction('Edit Task');
            setIsOpen(false);
          }}
          onDuplicate={() => {
            setLastAction('Duplicate Task');
            setIsOpen(false);
          }}
          onArchive={() => {
            setLastAction('Archive Task');
            setIsOpen(false);
          }}
          onDelete={() => {
            setLastAction('Delete Task');
            setIsOpen(false);
          }}
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
        <div className="text-sm">
          <p className="font-medium">Screen Reader Features:</p>
          <ul className="ml-4 list-disc text-[rgb(var(--muted-foreground))]">
            <li>role="menu" on container</li>
            <li>role="menuitem" on each action</li>
            <li>aria-label describes menu purpose</li>
            <li>Announces menu open with action count</li>
            <li>Announces highlighted item</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm text-[rgb(var(--primary-foreground))]"
        >
          {isOpen ? 'Close Menu' : 'Open Menu'}
        </button>

        <EntityContextMenu
          entityType="project"
          isOpen={isOpen}
          position={{ x: 20, y: 180 }}
          onClose={() => setIsOpen(false)}
          onViewDetails={() => console.log('View')}
          onEdit={() => console.log('Edit')}
          onDuplicate={() => console.log('Duplicate')}
          onOpenInIDE={() => console.log('Open in IDE')}
          onArchive={() => console.log('Archive')}
          onDelete={() => console.log('Delete')}
          aria-label="Project actions menu with 6 items"
        />
      </div>
    );
  },
};

/** Touch target accessibility - all items have 44px minimum touch target */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm">
        <p className="font-medium">Touch Target Accessibility:</p>
        <p className="text-[rgb(var(--muted-foreground))]">
          All menu items have a minimum height of 44px for WCAG 2.5.5 compliance.
        </p>
      </div>

      <EntityContextMenu
        entityType="task"
        isOpen={true}
        position={{ x: 20, y: 120 }}
        onClose={() => {}}
        onViewDetails={() => console.log('View')}
        onEdit={() => console.log('Edit')}
        onArchive={() => console.log('Archive')}
        onDelete={() => console.log('Delete')}
      />
    </div>
  ),
};

// =============================================================================
// Ref Forwarding & Data Attributes
// =============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: () => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState<string>('');

    const handleMeasure = () => {
      if (menuRef.current) {
        const { width, height } = menuRef.current.getBoundingClientRect();
        setDimensions(`${Math.round(width)}px × ${Math.round(height)}px`);
      }
    };

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleMeasure}
          className="rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm text-[rgb(var(--primary-foreground))]"
        >
          Measure Menu
        </button>

        {dimensions && (
          <div className="rounded-md bg-[rgb(var(--muted))] p-2 text-sm">
            Menu dimensions: {dimensions}
          </div>
        )}

        <EntityContextMenu
          ref={menuRef}
          entityType="task"
          isOpen={true}
          position={{ x: 20, y: 150 }}
          onClose={() => {}}
          onViewDetails={() => console.log('View')}
          onEdit={() => console.log('Edit')}
          onArchive={() => console.log('Archive')}
          onDelete={() => console.log('Delete')}
        />
      </div>
    );
  },
};

/** Data attributes demo */
export const DataAttributes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm">
        <p className="font-medium">Data Attributes:</p>
        <ul className="ml-4 list-disc text-[rgb(var(--muted-foreground))]">
          <li>data-testid="custom-menu"</li>
          <li>data-entity-type="task"</li>
          <li>data-archived="false"</li>
          <li>data-state="open"</li>
        </ul>
      </div>

      <EntityContextMenu
        entityType="task"
        isOpen={true}
        position={{ x: 20, y: 150 }}
        onClose={() => {}}
        onViewDetails={() => console.log('View')}
        onEdit={() => console.log('Edit')}
        onArchive={() => console.log('Archive')}
        onDelete={() => console.log('Delete')}
        data-testid="custom-menu"
      />
    </div>
  ),
};

// =============================================================================
// Real-World Usage Examples
// =============================================================================

/** Task list with context menus */
export const TaskListExample: Story = {
  render: () => {
    const [activeMenu, setActiveMenu] = useState<{
      id: string;
      position: { x: number; y: number };
    } | null>(null);

    const tasks = [
      { id: '1', title: 'Implement login form', status: 'In Progress' },
      { id: '2', title: 'Review pull request', status: 'Pending' },
      { id: '3', title: 'Update documentation', status: 'Completed' },
    ];

    const handleContextMenu = (id: string, event: React.MouseEvent) => {
      event.preventDefault();
      setActiveMenu({ id, position: { x: event.clientX, y: event.clientY } });
    };

    return (
      <div className="w-80 space-y-2">
        <h3 className="text-sm font-medium">Tasks (right-click for menu)</h3>
        {tasks.map((task) => (
          <div
            key={task.id}
            onContextMenu={(e) => handleContextMenu(task.id, e)}
            className="cursor-context-menu rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3"
          >
            <div className="font-medium">{task.title}</div>
            <div className="text-sm text-[rgb(var(--muted-foreground))]">{task.status}</div>
          </div>
        ))}

        {activeMenu && (
          <EntityContextMenu
            entityType="task"
            isOpen={true}
            position={activeMenu.position}
            onClose={() => setActiveMenu(null)}
            onViewDetails={() => {
              console.log(`View task ${activeMenu.id}`);
              setActiveMenu(null);
            }}
            onEdit={() => {
              console.log(`Edit task ${activeMenu.id}`);
              setActiveMenu(null);
            }}
            onArchive={() => {
              console.log(`Archive task ${activeMenu.id}`);
              setActiveMenu(null);
            }}
            onDelete={() => {
              console.log(`Delete task ${activeMenu.id}`);
              setActiveMenu(null);
            }}
          />
        )}
      </div>
    );
  },
};

/** Project card with context menu */
export const ProjectCardExample: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleContextMenu = (event: React.MouseEvent) => {
      event.preventDefault();
      setPosition({ x: event.clientX, y: event.clientY });
      setIsOpen(true);
    };

    return (
      <div
        onContextMenu={handleContextMenu}
        className="w-64 cursor-context-menu rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm"
      >
        <div className="mb-2 flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-[rgb(var(--primary))]" />
          <div>
            <div className="font-medium">My Project</div>
            <div className="text-xs text-[rgb(var(--muted-foreground))]">Updated 2 hours ago</div>
          </div>
        </div>
        <div className="text-sm text-[rgb(var(--muted-foreground))]">
          A sample project with context menu support. Right-click to see available actions.
        </div>

        <EntityContextMenu
          entityType="project"
          isOpen={isOpen}
          position={position}
          onClose={() => setIsOpen(false)}
          onViewDetails={() => {
            console.log('View project');
            setIsOpen(false);
          }}
          onEdit={() => {
            console.log('Edit project');
            setIsOpen(false);
          }}
          onDuplicate={() => {
            console.log('Duplicate project');
            setIsOpen(false);
          }}
          onOpenInIDE={() => {
            console.log('Open in IDE');
            setIsOpen(false);
          }}
          onArchive={() => {
            console.log('Archive project');
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

// =============================================================================
// Constants Reference
// =============================================================================

/** Reference for exported constants and utilities */
export const ConstantsReference: Story = {
  render: () => (
    <div className="max-w-lg space-y-6 text-sm">
      <div>
        <h3 className="mb-2 font-semibold">Entity Type Labels</h3>
        <pre className="overflow-auto rounded-md bg-[rgb(var(--muted))] p-4">
          {JSON.stringify(ENTITY_TYPE_LABELS, null, 2)}
        </pre>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Menu Item IDs</h3>
        <pre className="overflow-auto rounded-md bg-[rgb(var(--muted))] p-4">
          {JSON.stringify(MENU_ITEM_IDS, null, 2)}
        </pre>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Default ARIA Label Template</h3>
        <pre className="overflow-auto rounded-md bg-[rgb(var(--muted))] p-4">
          "{DEFAULT_ARIA_LABEL_TEMPLATE}"
        </pre>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Base Classes</h3>
        <pre className="overflow-auto rounded-md bg-[rgb(var(--muted))] p-4">
          "{ENTITY_CONTEXT_MENU_BASE_CLASSES || '(empty - inherits from Menu)'}"
        </pre>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Utility Functions</h3>
        <div className="space-y-2">
          <div className="rounded-md bg-[rgb(var(--muted))] p-2">
            <code>getEntityLabel('task')</code> → "{getEntityLabel('task')}"
          </div>
          <div className="rounded-md bg-[rgb(var(--muted))] p-2">
            <code>getScreenReaderAnnouncement('task', true, 4)</code> → "
            {getScreenReaderAnnouncement('task', true, 4)}"
          </div>
          <div className="rounded-md bg-[rgb(var(--muted))] p-2">
            <code>buildMenuItems('chat', false, handlers)</code> → MenuItem[]
          </div>
        </div>
      </div>
    </div>
  ),
};
