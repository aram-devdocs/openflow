import type { Meta, StoryObj } from '@storybook/react';
import { Badge, taskStatusToVariant, taskStatusToLabel } from './Badge';
import { TaskStatus } from '@openflow/generated';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'success',
        'warning',
        'error',
        'info',
        'todo',
        'inprogress',
        'inreview',
        'done',
        'cancelled',
      ],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

/** Default badge with neutral styling */
export const Default: Story = {
  args: {
    children: 'Badge',
    variant: 'default',
    size: 'md',
  },
};

/** Small badge size */
export const Small: Story = {
  args: {
    children: 'Small',
    variant: 'default',
    size: 'sm',
  },
};

/** Success variant for positive states */
export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
};

/** Warning variant for cautionary states */
export const Warning: Story = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
};

/** Error variant for negative states */
export const Error: Story = {
  args: {
    children: 'Error',
    variant: 'error',
  },
};

/** Info variant for informational states */
export const Info: Story = {
  args: {
    children: 'Info',
    variant: 'info',
  },
};

/** All general variants displayed together */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};

/** All size variants displayed together */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
    </div>
  ),
};

/** Task status: To Do */
export const StatusTodo: Story = {
  args: {
    children: 'To Do',
    variant: 'todo',
  },
};

/** Task status: In Progress */
export const StatusInProgress: Story = {
  args: {
    children: 'In Progress',
    variant: 'inprogress',
  },
};

/** Task status: In Review */
export const StatusInReview: Story = {
  args: {
    children: 'In Review',
    variant: 'inreview',
  },
};

/** Task status: Done */
export const StatusDone: Story = {
  args: {
    children: 'Done',
    variant: 'done',
  },
};

/** Task status: Cancelled */
export const StatusCancelled: Story = {
  args: {
    children: 'Cancelled',
    variant: 'cancelled',
  },
};

/** All task status variants displayed together */
export const AllTaskStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="todo">To Do</Badge>
      <Badge variant="inprogress">In Progress</Badge>
      <Badge variant="inreview">In Review</Badge>
      <Badge variant="done">Done</Badge>
      <Badge variant="cancelled">Cancelled</Badge>
    </div>
  ),
};

/** Example using helper functions with TaskStatus enum */
export const WithTaskStatusEnum: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {Object.values(TaskStatus).map((status) => (
        <Badge key={status} variant={taskStatusToVariant(status)}>
          {taskStatusToLabel(status)}
        </Badge>
      ))}
    </div>
  ),
};

/** Badge with long text content */
export const LongText: Story = {
  args: {
    children: 'This is a badge with longer text content',
    variant: 'info',
  },
};

/** Badge with custom className */
export const CustomClassName: Story = {
  args: {
    children: 'Custom Style',
    variant: 'default',
    className: 'uppercase tracking-wider',
  },
};
