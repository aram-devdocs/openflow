import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TaskCard } from './TaskCard';
import { TaskStatus, type Task } from '@openflow/generated';

const meta: Meta<typeof TaskCard> = {
  title: 'Organisms/TaskCard',
  component: TaskCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isSelected: {
      control: 'boolean',
      description: 'Whether the card is in a selected state',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TaskCard>;

/** Mock task data for stories */
const mockTask: Task = {
  id: 'task-1',
  projectId: 'project-1',
  title: 'Implement user authentication',
  description:
    'Add OAuth2 authentication with Google and GitHub providers. Include session management and token refresh.',
  status: TaskStatus.Inprogress,
  actionsRequiredCount: 0,
  autoStartNextStep: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockTaskWithActions: Task = {
  ...mockTask,
  id: 'task-2',
  title: 'Fix checkout validation',
  description:
    'Validation errors are not showing correctly on the checkout form.',
  status: TaskStatus.Inprogress,
  actionsRequiredCount: 2,
};

const mockTaskTodo: Task = {
  ...mockTask,
  id: 'task-3',
  title: 'Add dark mode support',
  description: 'Implement dark mode with system preference detection.',
  status: TaskStatus.Todo,
};

const mockTaskDone: Task = {
  ...mockTask,
  id: 'task-4',
  title: 'Setup CI/CD pipeline',
  description: 'Configure GitHub Actions for automated testing and deployment.',
  status: TaskStatus.Done,
};

const mockTaskCancelled: Task = {
  ...mockTask,
  id: 'task-5',
  title: 'Legacy API migration',
  description: 'Migrate deprecated API endpoints to the new REST API.',
  status: TaskStatus.Cancelled,
};

const mockTaskInReview: Task = {
  ...mockTask,
  id: 'task-6',
  title: 'Code review for PR #42',
  description: 'Review the authentication changes submitted in the pull request.',
  status: TaskStatus.Inreview,
};

const mockTaskNoDescription: Task = {
  id: 'task-7',
  projectId: 'project-1',
  title: 'Quick fix for typo in README',
  status: TaskStatus.Todo,
  actionsRequiredCount: 0,
  autoStartNextStep: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockTaskLongTitle: Task = {
  ...mockTask,
  id: 'task-8',
  title:
    'Implement comprehensive error handling with retry logic and circuit breaker patterns for external API calls',
  description: 'This is a complex task that requires careful planning.',
  status: TaskStatus.Todo,
};

/** Default task card */
export const Default: Story = {
  args: {
    task: mockTask,
  },
};

/** Task card with actions required indicator */
export const WithActionsRequired: Story = {
  args: {
    task: mockTaskWithActions,
  },
};

/** Task card in selected state */
export const Selected: Story = {
  args: {
    task: mockTask,
    isSelected: true,
  },
};

/** Interactive task card with selection and status change */
export const Interactive: Story = {
  render: function InteractiveTaskCard() {
    const [task, setTask] = useState(mockTask);
    const [isSelected, setIsSelected] = useState(false);

    const handleStatusChange = (_id: string, status: TaskStatus) => {
      setTask((prev) => ({ ...prev, status }));
    };

    return (
      <TaskCard
        task={task}
        isSelected={isSelected}
        onSelect={() => setIsSelected(!isSelected)}
        onStatusChange={handleStatusChange}
      />
    );
  },
};

/** All task status variants */
export const AllStatuses: Story = {
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-col gap-3">
      <TaskCard task={mockTaskTodo} />
      <TaskCard task={mockTask} />
      <TaskCard task={mockTaskInReview} />
      <TaskCard task={mockTaskDone} />
      <TaskCard task={mockTaskCancelled} />
    </div>
  ),
};

/** Task card without description */
export const NoDescription: Story = {
  args: {
    task: mockTaskNoDescription,
  },
};

/** Task card with long title (should truncate) */
export const LongTitle: Story = {
  args: {
    task: mockTaskLongTitle,
  },
};

/** Task card with status dropdown */
export const WithStatusDropdown: Story = {
  render: function TaskCardWithDropdown() {
    const [task, setTask] = useState(mockTask);

    const handleStatusChange = (_id: string, status: TaskStatus) => {
      setTask((prev) => ({ ...prev, status }));
    };

    return <TaskCard task={task} onStatusChange={handleStatusChange} />;
  },
};

/** Multiple task cards in a list */
export const CardList: Story = {
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: function TaskCardList() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const tasks = [
      mockTaskTodo,
      mockTask,
      mockTaskWithActions,
      mockTaskInReview,
      mockTaskDone,
    ];

    return (
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isSelected={selectedId === task.id}
            onSelect={setSelectedId}
          />
        ))}
      </div>
    );
  },
};

/** Task card with single action required */
export const SingleActionRequired: Story = {
  args: {
    task: {
      ...mockTask,
      actionsRequiredCount: 1,
    },
  },
};

/** Task card with many actions required */
export const ManyActionsRequired: Story = {
  args: {
    task: {
      ...mockTask,
      actionsRequiredCount: 5,
    },
  },
};
