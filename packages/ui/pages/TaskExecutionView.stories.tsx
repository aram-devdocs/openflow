import type { Permission, Task, TaskStep, TaskWithSteps } from '@openflow/generated';
import { PermissionStatus, StepStatus, TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import {
  PermissionPrompt,
  STEP_STATUS_COLORS,
  STEP_STATUS_ICONS,
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  TaskExecutionError,
  TaskExecutionHeader,
  TaskExecutionNotFound,
  TaskExecutionSkeleton,
  TaskExecutionView,
  TaskStepItem,
  TaskStepList,
} from './TaskExecutionView';

const meta: Meta<typeof TaskExecutionView> = {
  title: 'Pages/TaskExecutionView',
  component: TaskExecutionView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Task execution page component that displays a task with its execution steps.

## Architecture

- **Pure view layer** - all state comes from TanStack Query hooks
- **Event subscriptions** - invalidates queries on backend events
- **Step progress** - displays live agent events
- **Permission handling** - prompts for agent permission requests

## Usage

\`\`\`tsx
function TaskExecutionRoute() {
  const { taskId } = Route.useParams();
  const { data: taskWithSteps, isLoading, error, refetch } = useTaskWithSteps(taskId);
  const { data: isRunning } = useIsTaskRunning(taskId);
  const { data: permission } = usePendingPermission(taskId, {
    refetchInterval: isRunning ? 1000 : false,
  });

  // Subscribe to live updates
  useTaskSubscription(taskId);

  const startTask = useStartTask();
  // ... other mutations

  if (isLoading) return <TaskExecutionView state="loading" />;
  if (error) return <TaskExecutionView state="error" errorMessage={error.message} onRetry={refetch} />;
  if (!taskWithSteps) return <TaskExecutionView state="not-found" />;

  return (
    <TaskExecutionView
      state="ready"
      taskWithSteps={taskWithSteps}
      isRunning={isRunning}
      pendingPermission={permission}
      onStart={() => startTask.mutate(taskId)}
      // ... other callbacks
    />
  );
}
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: 'radio',
      options: ['loading', 'not-found', 'error', 'ready'],
      description: 'Page state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TaskExecutionView>;

// ============================================================================
// Mock Data Factory
// ============================================================================

function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    projectId: 'project-1',
    title: 'Implement user authentication',
    description: 'Add OAuth2 authentication with Google and GitHub providers',
    status: TaskStatus.Pending,
    autoRun: false,
    currentStepIndex: 0,
    worktreeId: undefined,
    workflowTemplate: undefined,
    parentTaskId: undefined,
    defaultExecutorProfileId: undefined,
    baseBranch: 'main',
    archivedAt: undefined,
    startedAt: undefined,
    endedAt: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockStep(overrides: Partial<TaskStep> = {}): TaskStep {
  return {
    id: 'step-1',
    taskId: 'task-1',
    stepIndex: 0,
    title: 'Create authentication module',
    prompt: 'Create a new authentication module with OAuth2 support for Google and GitHub.',
    providerId: 'claude-code',
    status: StepStatus.Pending,
    sessionId: undefined,
    startedAt: undefined,
    endedAt: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockTaskWithSteps(taskOverrides: Partial<Task> = {}, stepCount = 3): TaskWithSteps {
  const task = createMockTask(taskOverrides);
  const steps: TaskStep[] = [
    createMockStep({
      id: 'step-1',
      stepIndex: 0,
      title: 'Create authentication module',
      prompt: 'Create a new authentication module with OAuth2 support.',
    }),
    createMockStep({
      id: 'step-2',
      stepIndex: 1,
      title: 'Add Google OAuth provider',
      prompt: 'Implement Google OAuth2 provider with proper scopes.',
    }),
    createMockStep({
      id: 'step-3',
      stepIndex: 2,
      title: 'Add GitHub OAuth provider',
      prompt: 'Implement GitHub OAuth2 provider.',
    }),
  ].slice(0, stepCount);

  return { task, steps };
}

function createMockPermission(): Permission {
  return {
    id: 'perm-1',
    sessionId: 'session-1',
    toolName: 'Write',
    description: 'Write to file src/auth/oauth.ts',
    filePath: 'src/auth/oauth.ts',
    status: PermissionStatus.Pending,
    createdAt: new Date().toISOString(),
    respondedAt: undefined,
    expiredAt: undefined,
  };
}

// ============================================================================
// Page States
// ============================================================================

/**
 * Loading state - shows skeleton.
 */
export const Loading: Story = {
  args: {
    state: 'loading',
  },
};

/**
 * Not found state - task doesn't exist.
 */
export const NotFound: Story = {
  args: {
    state: 'not-found',
    onBack: fn(),
  },
};

/**
 * Error state - failed to load task.
 */
export const ErrorState: Story = {
  args: {
    state: 'error',
    errorMessage: 'Failed to load task: network error',
    onRetry: fn(),
    onBack: fn(),
  },
};

// ============================================================================
// Task Status Variants
// ============================================================================

/**
 * Pending task - ready to start.
 */
export const PendingTask: Story = {
  args: {
    state: 'ready',
    taskWithSteps: createMockTaskWithSteps({ status: TaskStatus.Pending }),
    onStart: fn(),
    onBack: fn(),
  },
};

/**
 * Running task - execution in progress.
 */
export const RunningTask: Story = {
  args: {
    state: 'ready',
    taskWithSteps: createMockTaskWithSteps({
      status: TaskStatus.Running,
      currentStepIndex: 1,
      startedAt: new Date().toISOString(),
    }),
    isRunning: true,
    onPause: fn(),
    onCancel: fn(),
    onBack: fn(),
  },
  render: (args) => {
    // Override steps to show mixed statuses
    if (!args.taskWithSteps) return <TaskExecutionView {...args} />;
    const taskWithSteps = {
      ...args.taskWithSteps,
      steps: args.taskWithSteps.steps.map((step, i) => ({
        ...step,
        status: i === 0 ? StepStatus.Completed : i === 1 ? StepStatus.Running : StepStatus.Pending,
      })),
    };
    return <TaskExecutionView {...args} taskWithSteps={taskWithSteps} />;
  },
};

/**
 * Paused task - can be resumed.
 */
export const PausedTask: Story = {
  args: {
    state: 'ready',
    taskWithSteps: createMockTaskWithSteps({
      status: TaskStatus.Paused,
      currentStepIndex: 1,
      startedAt: new Date().toISOString(),
    }),
    onResume: fn(),
    onCancel: fn(),
    onBack: fn(),
  },
  render: (args) => {
    if (!args.taskWithSteps) return <TaskExecutionView {...args} />;
    const taskWithSteps = {
      ...args.taskWithSteps,
      steps: args.taskWithSteps.steps.map((step, i) => ({
        ...step,
        status: i === 0 ? StepStatus.Completed : i === 1 ? StepStatus.Failed : StepStatus.Pending,
      })),
    };
    return <TaskExecutionView {...args} taskWithSteps={taskWithSteps} />;
  },
};

/**
 * Completed task - all steps finished.
 */
export const CompletedTask: Story = {
  args: {
    state: 'ready',
    taskWithSteps: createMockTaskWithSteps({
      status: TaskStatus.Completed,
      currentStepIndex: 3,
      startedAt: new Date(Date.now() - 300000).toISOString(),
      endedAt: new Date().toISOString(),
    }),
    onBack: fn(),
  },
  render: (args) => {
    if (!args.taskWithSteps) return <TaskExecutionView {...args} />;
    const taskWithSteps = {
      ...args.taskWithSteps,
      steps: args.taskWithSteps.steps.map((step) => ({
        ...step,
        status: StepStatus.Completed,
      })),
    };
    return <TaskExecutionView {...args} taskWithSteps={taskWithSteps} />;
  },
};

/**
 * Failed task - step encountered error.
 */
export const FailedTask: Story = {
  args: {
    state: 'ready',
    taskWithSteps: createMockTaskWithSteps({
      status: TaskStatus.Failed,
      currentStepIndex: 1,
      startedAt: new Date(Date.now() - 60000).toISOString(),
      endedAt: new Date().toISOString(),
    }),
    onBack: fn(),
  },
  render: (args) => {
    if (!args.taskWithSteps) return <TaskExecutionView {...args} />;
    const taskWithSteps = {
      ...args.taskWithSteps,
      steps: args.taskWithSteps.steps.map((step, i) => ({
        ...step,
        status: i === 0 ? StepStatus.Completed : i === 1 ? StepStatus.Failed : StepStatus.Pending,
      })),
    };
    return <TaskExecutionView {...args} taskWithSteps={taskWithSteps} />;
  },
};

/**
 * Cancelled task - manually stopped.
 */
export const CancelledTask: Story = {
  args: {
    state: 'ready',
    taskWithSteps: createMockTaskWithSteps({
      status: TaskStatus.Cancelled,
      currentStepIndex: 1,
      startedAt: new Date(Date.now() - 30000).toISOString(),
      endedAt: new Date().toISOString(),
    }),
    onBack: fn(),
  },
  render: (args) => {
    if (!args.taskWithSteps) return <TaskExecutionView {...args} />;
    const taskWithSteps = {
      ...args.taskWithSteps,
      steps: args.taskWithSteps.steps.map((step, i) => ({
        ...step,
        status: i === 0 ? StepStatus.Completed : StepStatus.Skipped,
      })),
    };
    return <TaskExecutionView {...args} taskWithSteps={taskWithSteps} />;
  },
};

// ============================================================================
// Permission Handling
// ============================================================================

/**
 * Running task with pending permission.
 */
export const WithPendingPermission: Story = {
  args: {
    state: 'ready',
    taskWithSteps: createMockTaskWithSteps({
      status: TaskStatus.Running,
      currentStepIndex: 0,
      startedAt: new Date().toISOString(),
    }),
    isRunning: true,
    pendingPermission: createMockPermission(),
    onApprovePermission: fn(),
    onDenyPermission: fn(),
    onPause: fn(),
    onCancel: fn(),
    onBack: fn(),
  },
  render: (args) => {
    if (!args.taskWithSteps) return <TaskExecutionView {...args} />;
    const taskWithSteps = {
      ...args.taskWithSteps,
      steps: args.taskWithSteps.steps.map((step, i) => ({
        ...step,
        status: i === 0 ? StepStatus.Running : StepStatus.Pending,
      })),
    };
    return <TaskExecutionView {...args} taskWithSteps={taskWithSteps} />;
  },
};

// ============================================================================
// Loading States (Mutations)
// ============================================================================

/**
 * Starting task mutation loading.
 */
export const StartingTask: Story = {
  args: {
    state: 'ready',
    taskWithSteps: createMockTaskWithSteps({ status: TaskStatus.Pending }),
    isStarting: true,
    onStart: fn(),
    onBack: fn(),
  },
};

/**
 * Pausing task mutation loading.
 */
export const PausingTask: Story = {
  args: {
    state: 'ready',
    taskWithSteps: createMockTaskWithSteps({ status: TaskStatus.Running }),
    isRunning: true,
    isPausing: true,
    onPause: fn(),
    onCancel: fn(),
    onBack: fn(),
  },
};

// ============================================================================
// Edge Cases
// ============================================================================

/**
 * Task with no steps.
 */
export const NoSteps: Story = {
  args: {
    state: 'ready',
    taskWithSteps: createMockTaskWithSteps({ status: TaskStatus.Pending }, 0),
    onStart: fn(),
    onBack: fn(),
  },
};

/**
 * Task with many steps.
 */
export const ManySteps: Story = {
  render: () => {
    const task = createMockTask({ status: TaskStatus.Running, currentStepIndex: 5 });
    const steps: TaskStep[] = Array.from({ length: 10 }, (_, i) =>
      createMockStep({
        id: `step-${i + 1}`,
        stepIndex: i,
        title: `Step ${i + 1}: ${['Setup', 'Configure', 'Implement', 'Test', 'Deploy', 'Monitor', 'Optimize', 'Document', 'Review', 'Finalize'][i]}`,
        prompt: `Execute step ${i + 1} of the workflow`,
        status: i < 5 ? StepStatus.Completed : i === 5 ? StepStatus.Running : StepStatus.Pending,
      })
    );
    return (
      <TaskExecutionView
        state="ready"
        taskWithSteps={{ task, steps }}
        isRunning={true}
        onPause={fn()}
        onCancel={fn()}
        onBack={fn()}
      />
    );
  },
};

// ============================================================================
// Sub-components
// ============================================================================

/**
 * TaskExecutionHeader component.
 */
export const HeaderComponent: Story = {
  render: () => (
    <div className="space-y-4">
      {[
        TaskStatus.Pending,
        TaskStatus.Running,
        TaskStatus.Paused,
        TaskStatus.Completed,
        TaskStatus.Failed,
        TaskStatus.Cancelled,
      ].map((status) => (
        <TaskExecutionHeader
          key={status}
          task={createMockTask({ status })}
          onBack={fn()}
          onStart={fn()}
          onPause={fn()}
          onResume={fn()}
          onCancel={fn()}
        />
      ))}
    </div>
  ),
};

/**
 * TaskStepItem component.
 */
export const StepItemComponent: Story = {
  render: () => (
    <div className="w-80 space-y-2 p-4">
      {[
        StepStatus.Pending,
        StepStatus.Running,
        StepStatus.Completed,
        StepStatus.Failed,
        StepStatus.Skipped,
      ].map((status) => (
        <TaskStepItem
          key={status}
          step={createMockStep({
            status,
            title: `${status.charAt(0).toUpperCase() + status.slice(1)} step`,
          })}
          isActive={status === StepStatus.Running}
          onClick={fn()}
        />
      ))}
    </div>
  ),
};

/**
 * TaskStepList component.
 */
export const StepListComponent: Story = {
  render: () => {
    const steps = [
      createMockStep({
        id: 'step-1',
        stepIndex: 0,
        title: 'Completed step',
        status: StepStatus.Completed,
      }),
      createMockStep({
        id: 'step-2',
        stepIndex: 1,
        title: 'Running step',
        status: StepStatus.Running,
      }),
      createMockStep({
        id: 'step-3',
        stepIndex: 2,
        title: 'Pending step',
        status: StepStatus.Pending,
      }),
    ];
    return (
      <div className="w-80 border rounded">
        <TaskStepList steps={steps} currentStepIndex={1} onStepClick={fn()} />
      </div>
    );
  },
};

/**
 * PermissionPrompt component.
 */
export const PermissionPromptComponent: Story = {
  render: () => (
    <div className="w-[500px] p-4">
      <PermissionPrompt permission={createMockPermission()} onApprove={fn()} onDeny={fn()} />
    </div>
  ),
};

/**
 * TaskExecutionSkeleton component.
 */
export const SkeletonComponent: Story = {
  render: () => <TaskExecutionSkeleton />,
};

/**
 * TaskExecutionError component.
 */
export const ErrorComponent: Story = {
  render: () => (
    <div className="h-[400px]">
      <TaskExecutionError
        message="Failed to load task: Network error"
        onRetry={fn()}
        onBack={fn()}
      />
    </div>
  ),
};

/**
 * TaskExecutionNotFound component.
 */
export const NotFoundComponent: Story = {
  render: () => (
    <div className="h-[400px]">
      <TaskExecutionNotFound onBack={fn()} />
    </div>
  ),
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Reference for all exported constants.
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="p-8 space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold mb-2">Step Status Icons</h3>
        <pre className="text-xs bg-muted p-4 rounded overflow-auto">
          {JSON.stringify(Object.keys(STEP_STATUS_ICONS), null, 2)}
        </pre>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Step Status Colors</h3>
        <pre className="text-xs bg-muted p-4 rounded overflow-auto">
          {JSON.stringify(STEP_STATUS_COLORS, null, 2)}
        </pre>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Task Status Labels</h3>
        <pre className="text-xs bg-muted p-4 rounded overflow-auto">
          {JSON.stringify(TASK_STATUS_LABELS, null, 2)}
        </pre>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Task Status Colors</h3>
        <pre className="text-xs bg-muted p-4 rounded overflow-auto">
          {JSON.stringify(TASK_STATUS_COLORS, null, 2)}
        </pre>
      </div>
    </div>
  ),
};
