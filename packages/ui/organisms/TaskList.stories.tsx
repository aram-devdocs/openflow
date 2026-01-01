import { type Task, TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  // Constants for reference
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_ERROR_TITLE,
  DEFAULT_KANBAN_LABEL,
  DEFAULT_RETRY_LABEL,
  DEFAULT_SKELETON_COUNT,
  DEFAULT_TASK_LIST_LABEL,
  SR_NAVIGATION_HINT,
  SR_TASK_COUNT_TEMPLATE,
  SR_TASK_SELECTED,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_ORDER,
  TASK_LIST_BASE_CLASSES,
  TASK_LIST_COLUMN_BASE_CLASSES,
  TASK_LIST_COLUMN_CONTENT_CLASSES,
  TASK_LIST_COLUMN_COUNT_CLASSES,
  TASK_LIST_COLUMN_HEADER_CLASSES,
  TASK_LIST_EMPTY_COLUMN_CLASSES,
  TASK_LIST_ERROR_BASE_CLASSES,
  TASK_LIST_GAP_CLASSES,
  TASK_LIST_KANBAN_BASE_CLASSES,
  TASK_LIST_KANBAN_GAP_CLASSES,
  // Components
  TaskList,
  TaskListError,
  TaskListSkeleton,
  // Utility functions
  buildListAccessibleLabel,
  buildSelectionAnnouncement,
  getBaseSize,
  getResponsiveSizeClasses,
} from './TaskList';

const meta: Meta<typeof TaskList> = {
  title: 'Organisms/TaskList',
  component: TaskList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
TaskList organism for displaying a collection of tasks.

## Features
- Display tasks as a simple list or grouped by status (kanban view)
- Loading state with SkeletonTaskCard (TaskListSkeleton)
- Empty state with EmptyState molecule
- Error state with retry (TaskListError)
- Proper list semantics (role="list", role="listitem")
- Keyboard navigation (Arrow keys, Home, End)
- Responsive sizing via ResponsiveValue
- forwardRef support for ref forwarding
- axe-core compliant

## Accessibility
- role="list" and role="listitem" for proper list semantics
- Keyboard navigation with roving tabindex pattern
- Screen reader announcements for selection changes
- Focus management with visible focus rings
- Touch targets ≥44px on mobile (WCAG 2.5.5)

## Usage
\`\`\`tsx
// Simple list view
<TaskList
  tasks={tasks}
  selectedTaskId={selectedId}
  onSelectTask={(id) => setSelectedId(id)}
  onStatusChange={(id, status) => updateStatus(id, status)}
/>

// Kanban view
<TaskList tasks={tasks} groupByStatus />

// Loading state
<TaskListSkeleton count={5} />

// Error state
<TaskListError message="Failed to load" onRetry={refetch} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    groupByStatus: {
      control: 'boolean',
      description: 'Whether to group tasks by status (kanban view)',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant for list items',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TaskList>;

// ============================================================================
// Helper Functions
// ============================================================================

/** Helper to create mock tasks */
function createMockTask(
  id: string,
  title: string,
  status: TaskStatus,
  options: { description?: string; actionsRequiredCount?: number } = {}
): Task {
  const task: Task = {
    id,
    projectId: 'project-1',
    title,
    status,
    actionsRequiredCount: options.actionsRequiredCount ?? 0,
    autoStartNextStep: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (options.description !== undefined) {
    task.description = options.description;
  }

  return task;
}

// ============================================================================
// Mock Data
// ============================================================================

/** Mock tasks for stories */
const mockTasks: Task[] = [
  createMockTask('task-1', 'Set up project scaffolding', TaskStatus.Done, {
    description: 'Initialize the project with Vite, React, and TypeScript.',
  }),
  createMockTask('task-2', 'Implement user authentication', TaskStatus.Inprogress, {
    description: 'Add OAuth2 authentication with Google and GitHub providers.',
    actionsRequiredCount: 2,
  }),
  createMockTask('task-3', 'Design database schema', TaskStatus.Inreview, {
    description: 'Create SQLite schema for tasks, projects, and chats.',
  }),
  createMockTask('task-4', 'Add dark mode support', TaskStatus.Todo, {
    description: 'Implement dark mode with system preference detection.',
  }),
  createMockTask('task-5', 'Write unit tests', TaskStatus.Todo, {
    description: 'Add comprehensive unit tests for all services.',
  }),
  createMockTask('task-6', 'Legacy API migration', TaskStatus.Cancelled, {
    description: 'Migrate deprecated API endpoints to the new REST API.',
  }),
  createMockTask('task-7', 'Performance optimization', TaskStatus.Inprogress, {
    description: 'Optimize database queries and reduce bundle size.',
  }),
  createMockTask('task-8', 'Documentation', TaskStatus.Todo, {
    description: 'Write comprehensive API documentation.',
  }),
];

const firstTask = mockTasks[0];
const fewTasks = mockTasks.slice(0, 3);

// ============================================================================
// Basic Examples
// ============================================================================

/** Default list view */
export const Default: Story = {
  args: {
    tasks: fewTasks,
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
};

/** List view with selection */
export const WithSelection: Story = {
  render: function ListWithSelection() {
    const [selectedId, setSelectedId] = useState<string>('task-2');

    return (
      <div className="max-w-md">
        <TaskList
          tasks={fewTasks}
          selectedTaskId={selectedId}
          onSelectTask={setSelectedId}
          data-testid="task-list"
        />
      </div>
    );
  },
};

/** List view with status change */
export const WithStatusChange: Story = {
  render: function ListWithStatusChange() {
    const [tasks, setTasks] = useState(fewTasks);
    const [selectedId, setSelectedId] = useState('');

    const handleStatusChange = (id: string, status: TaskStatus) => {
      setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status } : task)));
    };

    const taskListProps = {
      tasks,
      onSelectTask: setSelectedId,
      onStatusChange: handleStatusChange,
      ...(selectedId && { selectedTaskId: selectedId }),
    };

    return (
      <div className="max-w-md">
        <TaskList {...taskListProps} data-testid="task-list" />
      </div>
    );
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/** Small size */
export const SizeSmall: Story = {
  args: {
    tasks: fewTasks,
    size: 'sm',
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
};

/** Medium size (default) */
export const SizeMedium: Story = {
  args: {
    tasks: fewTasks,
    size: 'md',
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
};

/** Large size */
export const SizeLarge: Story = {
  args: {
    tasks: fewTasks,
    size: 'lg',
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <h3 className="mb-2 font-medium">Size: {size}</h3>
          <div className="max-w-md">
            <TaskList tasks={fewTasks.slice(0, 2)} size={size} />
          </div>
        </div>
      ))}
    </div>
  ),
};

/** Responsive sizing */
export const ResponsiveSizing: Story = {
  args: {
    tasks: fewTasks,
    size: { base: 'sm', md: 'md', lg: 'lg' },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Size changes based on viewport: small on mobile, medium on tablet, large on desktop.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
};

// ============================================================================
// Kanban View
// ============================================================================

/** Kanban view grouped by status */
export const KanbanView: Story = {
  args: {
    tasks: mockTasks,
    groupByStatus: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

/** Interactive kanban view */
export const InteractiveKanban: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: function InteractiveKanbanView() {
    const [tasks, setTasks] = useState(mockTasks);
    const [selectedId, setSelectedId] = useState('');

    const handleStatusChange = (id: string, status: TaskStatus) => {
      setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status } : task)));
    };

    const taskListProps = {
      tasks,
      groupByStatus: true as const,
      onSelectTask: setSelectedId,
      onStatusChange: handleStatusChange,
      ...(selectedId && { selectedTaskId: selectedId }),
    };

    return (
      <div className="p-4">
        <TaskList {...taskListProps} data-testid="kanban" />
      </div>
    );
  },
};

/** Kanban with sparse columns */
export const SparseKanban: Story = {
  args: {
    tasks: [
      createMockTask('task-1', 'Only todo task', TaskStatus.Todo),
      createMockTask('task-2', 'Only done task', TaskStatus.Done),
    ],
    groupByStatus: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

// ============================================================================
// Empty State
// ============================================================================

/** Empty list */
export const Empty: Story = {
  args: {
    tasks: [],
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
};

/** Empty kanban view */
export const EmptyKanban: Story = {
  args: {
    tasks: [],
    groupByStatus: true,
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
};

// ============================================================================
// Loading States
// ============================================================================

/** Loading skeleton - list view */
export const LoadingSkeleton: Story = {
  render: () => (
    <div className="max-w-md">
      <TaskListSkeleton count={5} data-testid="skeleton" />
    </div>
  ),
};

/** Loading skeleton - kanban view */
export const LoadingSkeletonKanban: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <div className="p-4">
      <TaskListSkeleton groupByStatus count={2} data-testid="skeleton" />
    </div>
  ),
};

/** Skeleton sizes */
export const SkeletonSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <h3 className="mb-2 font-medium">Size: {size}</h3>
          <div className="max-w-md">
            <TaskListSkeleton count={2} size={size} />
          </div>
        </div>
      ))}
    </div>
  ),
};

// ============================================================================
// Error States
// ============================================================================

/** Error state */
export const ErrorState: Story = {
  render: () => (
    <div className="max-w-md">
      <TaskListError
        message="Failed to connect to the server. Please check your internet connection."
        onRetry={() => alert('Retry clicked')}
        data-testid="error"
      />
    </div>
  ),
};

/** Error without retry */
export const ErrorWithoutRetry: Story = {
  render: () => (
    <div className="max-w-md">
      <TaskListError message="Tasks are temporarily unavailable." />
    </div>
  ),
};

/** Error sizes */
export const ErrorSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <h3 className="mb-2 font-medium">Size: {size}</h3>
          <TaskListError
            size={size}
            message="Failed to load tasks"
            onRetry={() => alert('Retry')}
          />
        </div>
      ))}
    </div>
  ),
};

// ============================================================================
// Content Variations
// ============================================================================

/** Single task in list */
export const SingleTask: Story = {
  args: {
    tasks: firstTask ? [firstTask] : [],
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
};

/** Many tasks */
export const ManyTasks: Story = {
  args: {
    tasks: mockTasks,
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
};

/** Tasks with actions required */
export const WithActionsRequired: Story = {
  args: {
    tasks: [
      createMockTask('task-1', 'Task needing attention', TaskStatus.Inprogress, {
        actionsRequiredCount: 3,
      }),
      createMockTask('task-2', 'Another urgent task', TaskStatus.Inprogress, {
        actionsRequiredCount: 1,
      }),
      createMockTask('task-3', 'Normal task', TaskStatus.Todo),
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Keyboard navigation support:
- **Arrow Up/Down/Left/Right**: Navigate between tasks
- **Home**: Jump to first task
- **End**: Jump to last task
- **Enter/Space**: Select the focused task

Try tabbing to the list and using arrow keys to navigate.
        `,
      },
    },
  },
  render: function KeyboardNav() {
    const [selectedId, setSelectedId] = useState<string>('');

    return (
      <div className="max-w-md space-y-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Tab to the list, then use arrow keys to navigate. Press Enter or Space to select.
        </p>
        {selectedId && <p className="text-sm font-medium">Selected: {selectedId}</p>}
        <TaskList
          tasks={fewTasks}
          selectedTaskId={selectedId}
          onSelectTask={setSelectedId}
          data-testid="keyboard-nav"
        />
      </div>
    );
  },
};

/** Screen reader accessibility */
export const ScreenReaderAccessibility: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Screen reader features:
- List announced with role="list" and task count
- Each task is a listitem with full accessible label
- Selection changes are announced via aria-live region
- Navigation hint provided for keyboard users
- Status conveyed beyond color with text labels
        `,
      },
    },
  },
  render: () => (
    <div className="max-w-md space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Use a screen reader to hear announcements for list items, task counts, and selection
        changes.
      </p>
      <TaskList tasks={fewTasks} aria-label="Project tasks with 3 items" data-testid="sr-demo" />
    </div>
  ),
};

/** Touch target accessibility */
export const TouchTargetAccessibility: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Touch targets meet WCAG 2.5.5 (44px minimum on mobile).
Interactive elements (buttons, dropdowns) have adequate tap targets.
        `,
      },
    },
  },
  render: () => (
    <div className="max-w-md space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        All interactive elements have ≥44px touch targets on mobile devices.
      </p>
      <TaskList
        tasks={fewTasks}
        onSelectTask={() => {}}
        onStatusChange={() => {}}
        data-testid="touch-target"
      />
    </div>
  ),
};

/** Focus ring visibility */
export const FocusRingVisibility: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Focus rings are visible on all backgrounds with ring-offset for contrast.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="p-4 bg-[rgb(var(--background))]">
        <h3 className="text-sm font-medium mb-2">Light background</h3>
        <TaskList tasks={fewTasks.slice(0, 2)} onSelectTask={() => {}} />
      </div>
      <div className="p-4 bg-[rgb(var(--muted))]">
        <h3 className="text-sm font-medium mb-2">Muted background</h3>
        <TaskList tasks={fewTasks.slice(0, 2)} onSelectTask={() => {}} />
      </div>
    </div>
  ),
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

/** Ref forwarding demo */
export const RefForwardingDemo: Story = {
  render: function RefDemo() {
    const [message, setMessage] = useState('');
    const listRef = (node: HTMLDivElement | null) => {
      if (node) {
        setMessage(
          `List ref captured. Layout: ${node.dataset.layout}, Task count: ${node.dataset.taskCount}`
        );
      }
    };

    return (
      <div className="max-w-md space-y-4">
        {message && <p className="text-sm text-[rgb(var(--muted-foreground))]">{message}</p>}
        <TaskList ref={listRef} tasks={fewTasks} data-testid="ref-demo" />
      </div>
    );
  },
};

/** Data attributes demo */
export const DataAttributesDemo: Story = {
  render: () => (
    <div className="max-w-md space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Inspect the DOM to see data attributes: data-testid, data-layout, data-task-count, data-size
      </p>
      <TaskList tasks={fewTasks} size="md" data-testid="data-attrs" />
    </div>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** Project task board */
export const ProjectTaskBoard: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'A complete project task board with kanban view, selection, and status changes.',
      },
    },
  },
  render: function ProjectBoard() {
    const [tasks, setTasks] = useState(mockTasks);
    const [selectedId, setSelectedId] = useState('');

    const handleStatusChange = (id: string, status: TaskStatus) => {
      setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status } : task)));
    };

    return (
      <div className="h-screen p-4 bg-[rgb(var(--background))]">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Project Tasks</h1>
          <p className="text-[rgb(var(--muted-foreground))]">
            {tasks.length} tasks across {STATUS_ORDER.length} columns
          </p>
        </div>
        <TaskList
          tasks={tasks}
          groupByStatus
          selectedTaskId={selectedId}
          onSelectTask={setSelectedId}
          onStatusChange={handleStatusChange}
          data-testid="project-board"
        />
      </div>
    );
  },
};

/** Task sidebar */
export const TaskSidebar: Story = {
  render: function Sidebar() {
    const [selectedId, setSelectedId] = useState('task-2');

    return (
      <div className="w-80 h-96 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
        <div className="p-3 border-b border-[rgb(var(--border))]">
          <h2 className="font-semibold">Tasks</h2>
        </div>
        <div className="p-2 overflow-y-auto h-[calc(100%-48px)]">
          <TaskList
            tasks={mockTasks}
            size="sm"
            selectedTaskId={selectedId}
            onSelectTask={setSelectedId}
            data-testid="sidebar"
          />
        </div>
      </div>
    );
  },
};

/** Loading transition */
export const LoadingTransition: Story = {
  render: function LoadingDemo() {
    const [isLoading, setIsLoading] = useState(true);

    return (
      <div className="max-w-md space-y-4">
        <button
          type="button"
          onClick={() => setIsLoading(!isLoading)}
          className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-md"
        >
          Toggle Loading
        </button>
        {isLoading ? <TaskListSkeleton count={3} /> : <TaskList tasks={fewTasks} />}
      </div>
    );
  },
};

/** Error recovery flow */
export const ErrorRecoveryFlow: Story = {
  render: function ErrorRecovery() {
    const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');

    const handleRetry = () => {
      setStatus('loading');
      setTimeout(() => setStatus('success'), 1000);
    };

    return (
      <div className="max-w-md space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStatus('loading')}
            className="px-3 py-1 border rounded text-sm"
          >
            Loading
          </button>
          <button
            type="button"
            onClick={() => setStatus('error')}
            className="px-3 py-1 border rounded text-sm"
          >
            Error
          </button>
          <button
            type="button"
            onClick={() => setStatus('success')}
            className="px-3 py-1 border rounded text-sm"
          >
            Success
          </button>
        </div>
        {status === 'loading' && <TaskListSkeleton count={3} />}
        {status === 'error' && (
          <TaskListError message="Failed to load tasks" onRetry={handleRetry} />
        )}
        {status === 'success' && <TaskList tasks={fewTasks} />}
      </div>
    );
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/** Constants reference for developers */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-6 max-w-4xl">
      <section>
        <h2 className="text-lg font-semibold mb-3">Label Constants</h2>
        <div className="bg-[rgb(var(--muted))] p-4 rounded-lg font-mono text-sm space-y-2">
          <div>DEFAULT_TASK_LIST_LABEL = &quot;{DEFAULT_TASK_LIST_LABEL}&quot;</div>
          <div>DEFAULT_KANBAN_LABEL = &quot;{DEFAULT_KANBAN_LABEL}&quot;</div>
          <div>DEFAULT_EMPTY_TITLE = &quot;{DEFAULT_EMPTY_TITLE}&quot;</div>
          <div>DEFAULT_EMPTY_DESCRIPTION = &quot;{DEFAULT_EMPTY_DESCRIPTION}&quot;</div>
          <div>DEFAULT_ERROR_TITLE = &quot;{DEFAULT_ERROR_TITLE}&quot;</div>
          <div>DEFAULT_ERROR_MESSAGE = &quot;{DEFAULT_ERROR_MESSAGE}&quot;</div>
          <div>DEFAULT_RETRY_LABEL = &quot;{DEFAULT_RETRY_LABEL}&quot;</div>
          <div>DEFAULT_SKELETON_COUNT = {DEFAULT_SKELETON_COUNT}</div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Screen Reader Constants</h2>
        <div className="bg-[rgb(var(--muted))] p-4 rounded-lg font-mono text-sm space-y-2">
          <div>SR_TASK_COUNT_TEMPLATE(3) = &quot;{SR_TASK_COUNT_TEMPLATE(3)}&quot;</div>
          <div>SR_TASK_COUNT_TEMPLATE(1) = &quot;{SR_TASK_COUNT_TEMPLATE(1)}&quot;</div>
          <div>SR_TASK_SELECTED = &quot;{SR_TASK_SELECTED}&quot;</div>
          <div>SR_NAVIGATION_HINT = &quot;{SR_NAVIGATION_HINT}&quot;</div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Status Configuration</h2>
        <div className="bg-[rgb(var(--muted))] p-4 rounded-lg font-mono text-sm">
          <div className="mb-2">
            STATUS_ORDER = [{STATUS_ORDER.map((s) => `"${s}"`).join(', ')}]
          </div>
          <div className="mb-2">
            STATUS_LABELS = {'{'}
            {Object.entries(STATUS_LABELS)
              .map(([k, v]) => `${k}: "${v}"`)
              .join(', ')}
            {'}'}
          </div>
          <div>
            STATUS_COLORS = {'{'}
            {Object.entries(STATUS_COLORS)
              .map(([k, v]) => `${k}: "${v}"`)
              .join(', ')}
            {'}'}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">CSS Class Constants</h2>
        <div className="bg-[rgb(var(--muted))] p-4 rounded-lg font-mono text-xs space-y-2">
          <div>TASK_LIST_BASE_CLASSES = &quot;{TASK_LIST_BASE_CLASSES}&quot;</div>
          <div>TASK_LIST_GAP_CLASSES = {JSON.stringify(TASK_LIST_GAP_CLASSES)}</div>
          <div>TASK_LIST_KANBAN_BASE_CLASSES = &quot;{TASK_LIST_KANBAN_BASE_CLASSES}&quot;</div>
          <div>TASK_LIST_KANBAN_GAP_CLASSES = {JSON.stringify(TASK_LIST_KANBAN_GAP_CLASSES)}</div>
          <div>TASK_LIST_COLUMN_BASE_CLASSES = &quot;{TASK_LIST_COLUMN_BASE_CLASSES}&quot;</div>
          <div>TASK_LIST_COLUMN_HEADER_CLASSES = &quot;{TASK_LIST_COLUMN_HEADER_CLASSES}&quot;</div>
          <div>
            TASK_LIST_COLUMN_CONTENT_CLASSES = &quot;{TASK_LIST_COLUMN_CONTENT_CLASSES}&quot;
          </div>
          <div>TASK_LIST_COLUMN_COUNT_CLASSES = &quot;{TASK_LIST_COLUMN_COUNT_CLASSES}&quot;</div>
          <div>TASK_LIST_EMPTY_COLUMN_CLASSES = &quot;{TASK_LIST_EMPTY_COLUMN_CLASSES}&quot;</div>
          <div>TASK_LIST_ERROR_BASE_CLASSES = &quot;{TASK_LIST_ERROR_BASE_CLASSES}&quot;</div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Utility Functions</h2>
        <div className="bg-[rgb(var(--muted))] p-4 rounded-lg font-mono text-sm space-y-2">
          <div>getBaseSize(&apos;md&apos;) = &quot;{getBaseSize('md')}&quot;</div>
          <div>
            getBaseSize({'{ base: "sm", md: "lg" }'}) = &quot;
            {getBaseSize({ base: 'sm', md: 'lg' })}&quot;
          </div>
          <div>
            getResponsiveSizeClasses(&apos;md&apos;, TASK_LIST_GAP_CLASSES) = &quot;
            {getResponsiveSizeClasses('md', TASK_LIST_GAP_CLASSES)}&quot;
          </div>
          <div>
            buildListAccessibleLabel(tasks, false) = &quot;
            {buildListAccessibleLabel(fewTasks, false)}&quot;
          </div>
          <div>
            buildListAccessibleLabel(tasks, true) = &quot;{buildListAccessibleLabel(fewTasks, true)}
            &quot;
          </div>
          <div>
            buildSelectionAnnouncement(&apos;My Task&apos;) = &quot;
            {buildSelectionAnnouncement('My Task')}&quot;
          </div>
          <div>groupTasksByStatus(tasks) = {'{ todo: [...], inprogress: [...], ... }'}</div>
        </div>
      </section>
    </div>
  ),
};
