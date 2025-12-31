import { WorkflowStepStatus } from '@openflow/generated';
import type { WorkflowStep } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { StepsPanel } from './StepsPanel';

const meta = {
  title: 'Organisms/StepsPanel',
  component: StepsPanel,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onStartStep: fn(),
    onCompleteStep: fn(),
    onSkipStep: fn(),
    onToggleStep: fn(),
    onSelectStep: fn(),
    onViewChat: fn(),
    onAddStep: fn(),
    onAutoStartChange: fn(),
  },
  decorators: [
    (Story) => (
      <div className="h-[500px] w-full max-w-sm border border-[rgb(var(--border))] rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StepsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample workflow steps for stories
const sampleSteps: WorkflowStep[] = [
  {
    index: 0,
    name: 'Requirements Analysis',
    description:
      'Analyze and document the requirements for this feature. Create a requirements.md file with detailed acceptance criteria.',
    status: WorkflowStepStatus.Completed,
    chatId: 'chat-1',
  },
  {
    index: 1,
    name: 'Technical Specification',
    description:
      'Create a technical specification document outlining the implementation approach, architecture decisions, and API design.',
    status: WorkflowStepStatus.Completed,
    chatId: 'chat-2',
  },
  {
    index: 2,
    name: 'Implementation',
    description:
      'Implement the feature according to the specification. Follow TDD principles and ensure proper test coverage.',
    status: WorkflowStepStatus.InProgress,
    chatId: 'chat-3',
  },
  {
    index: 3,
    name: 'Code Review',
    description:
      'Review the implementation for code quality, best practices, and potential issues.',
    status: WorkflowStepStatus.Pending,
  },
  {
    index: 4,
    name: 'Testing & QA',
    description: 'Run comprehensive tests and verify the feature works correctly in all scenarios.',
    status: WorkflowStepStatus.Pending,
  },
];

const allPendingSteps: WorkflowStep[] = sampleSteps.map((step) => {
  const { chatId: _, ...rest } = step;
  return {
    ...rest,
    status: WorkflowStepStatus.Pending,
  };
});

const allCompletedSteps: WorkflowStep[] = sampleSteps.map((step) => ({
  ...step,
  status: WorkflowStepStatus.Completed,
  chatId: `chat-${step.index + 1}`,
}));

const mixedSteps: WorkflowStep[] = [
  {
    index: 0,
    name: 'Planning',
    description: 'Plan the implementation approach',
    status: WorkflowStepStatus.Completed,
    chatId: 'chat-1',
  },
  {
    index: 1,
    name: 'Skipped Step',
    description: 'This step was skipped',
    status: WorkflowStepStatus.Skipped,
  },
  {
    index: 2,
    name: 'Implementation',
    description: 'Implement the feature',
    status: WorkflowStepStatus.InProgress,
    chatId: 'chat-3',
  },
  {
    index: 3,
    name: 'Verification',
    description: 'Verify the implementation',
    status: WorkflowStepStatus.Pending,
  },
];

const longSteps: WorkflowStep[] = Array.from({ length: 10 }, (_, i) => {
  const stepNames = [
    'Setup',
    'Research',
    'Design',
    'Build',
    'Test',
    'Deploy',
    'Monitor',
    'Optimize',
    'Document',
    'Review',
  ];
  const status =
    i < 3
      ? WorkflowStepStatus.Completed
      : i === 3
        ? WorkflowStepStatus.InProgress
        : WorkflowStepStatus.Pending;
  const base = {
    index: i,
    name: `Step ${i + 1}: ${stepNames[i]}`,
    description: `Description for step ${i + 1}. This is a detailed description that explains what needs to be done in this step.`,
    status,
  };
  // Only add chatId for steps that have been started (index <= 3)
  if (i <= 3) {
    return { ...base, chatId: `chat-${i + 1}` };
  }
  return base;
});

/**
 * Default steps panel with mixed step statuses
 */
export const Default: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
  },
};

/**
 * Steps panel in loading state
 */
export const Loading: Story = {
  args: {
    steps: [],
    loading: true,
  },
};

/**
 * Steps panel with all pending steps
 */
export const AllPending: Story = {
  args: {
    steps: allPendingSteps,
  },
};

/**
 * Steps panel with all completed steps
 */
export const AllCompleted: Story = {
  args: {
    steps: allCompletedSteps,
  },
};

/**
 * Steps panel with skipped step
 */
export const WithSkippedStep: Story = {
  args: {
    steps: mixedSteps,
    activeStepIndex: 2,
  },
};

/**
 * Empty steps panel (no steps defined)
 */
export const Empty: Story = {
  args: {
    steps: [],
  },
};

/**
 * Steps panel with auto-start enabled
 */
export const WithAutoStart: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
    autoStart: true,
  },
};

/**
 * Steps panel in disabled state (during processing)
 */
export const Disabled: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
    disabled: true,
  },
};

/**
 * Steps panel with many steps (scrollable)
 */
export const ManySteps: Story = {
  args: {
    steps: longSteps,
    activeStepIndex: 3,
  },
};

/**
 * Steps panel without add step button
 */
export const NoAddButton: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
    onAddStep: undefined,
  },
};

/**
 * Steps panel without auto-start toggle
 */
export const NoAutoStartToggle: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
    onAutoStartChange: undefined,
  },
};

/**
 * Steps panel with minimal features (no add button, no auto-start)
 */
export const Minimal: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
    onAddStep: undefined,
    onAutoStartChange: undefined,
  },
};

/**
 * Steps panel showing first step as active
 */
export const FirstStepActive: Story = {
  args: {
    steps: allPendingSteps,
    activeStepIndex: 0,
  },
};

/**
 * Steps panel with step in progress and auto-start off
 */
export const InProgressNoAutoStart: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
    autoStart: false,
  },
};

/**
 * Steps panel with step currently running
 */
export const StepRunning: Story = {
  args: {
    steps: [
      {
        index: 0,
        name: 'Setup Environment',
        description: 'Configure the development environment',
        status: WorkflowStepStatus.Completed,
        chatId: 'chat-1',
      },
      {
        index: 1,
        name: 'Generate Code',
        description: 'AI is generating the code for this feature...',
        status: WorkflowStepStatus.InProgress,
        chatId: 'chat-2',
      },
      {
        index: 2,
        name: 'Run Tests',
        description: 'Execute the test suite',
        status: WorkflowStepStatus.Pending,
      },
    ],
    activeStepIndex: 1,
    autoStart: true,
  },
};

/**
 * Full featured steps panel with all options
 */
export const FullFeatured: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
    autoStart: true,
  },
};

/**
 * Steps panel without complete and skip handlers (view only mode)
 */
export const ViewOnly: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
    onStartStep: undefined,
    onCompleteStep: undefined,
    onSkipStep: undefined,
    onToggleStep: undefined,
    onAddStep: undefined,
    onAutoStartChange: undefined,
  },
};

/**
 * Steps panel with view chat functionality
 */
export const WithViewChat: Story = {
  args: {
    steps: sampleSteps.map((step) => ({
      ...step,
      status: step.index < 3 ? WorkflowStepStatus.Completed : WorkflowStepStatus.Pending,
      chatId: step.index < 3 ? `chat-${step.index + 1}` : undefined,
    })),
    activeStepIndex: 3,
  },
};
