import { type Task, TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TaskList } from './TaskList';

const meta: Meta<typeof TaskList> = {
  title: 'Organisms/TaskList',
  component: TaskList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    groupByStatus: {
      control: 'boolean',
      description: 'Whether to group tasks by status (kanban view)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TaskList>;

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

/** Named first task for single task stories */
const firstTask = mockTasks[0];

/** Fewer tasks for simpler stories */
const fewTasks = mockTasks.slice(0, 3);

/** Default list view */
export const Default: Story = {
  args: {
    tasks: fewTasks,
  },
};

/** List view with selection */
export const WithSelection: Story = {
  render: function ListWithSelection() {
    const [selectedId, setSelectedId] = useState<string>('task-2');

    return (
      <div className="max-w-md">
        <TaskList tasks={fewTasks} selectedTaskId={selectedId} onSelectTask={setSelectedId} />
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

    // Only pass selectedTaskId when it has a value
    const taskListProps = {
      tasks,
      onSelectTask: setSelectedId,
      onStatusChange: handleStatusChange,
      ...(selectedId && { selectedTaskId: selectedId }),
    };

    return (
      <div className="max-w-md">
        <TaskList {...taskListProps} />
      </div>
    );
  },
};

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

    // Only pass selectedTaskId when it has a value
    const taskListProps = {
      tasks,
      groupByStatus: true as const,
      onSelectTask: setSelectedId,
      onStatusChange: handleStatusChange,
      ...(selectedId && { selectedTaskId: selectedId }),
    };

    return (
      <div className="p-4">
        <TaskList {...taskListProps} />
      </div>
    );
  },
};

/** Empty state */
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
};

/** List with many tasks */
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
