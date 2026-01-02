import { WorkflowStepStatus } from '@openflow/generated';
import type { WorkflowStep, WorkflowTemplate } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import {
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_LOADING_LABEL,
  DEFAULT_RETRY_LABEL,
  DEFAULT_SKELETON_STEP_COUNT,
  DEFAULT_WORKFLOW_PREVIEW_LABEL,
  SR_MORE_STEPS_PLURAL,
  SR_MORE_STEPS_SINGULAR,
  SR_STATUS_COMPLETED,
  SR_STATUS_IN_PROGRESS,
  SR_STATUS_PENDING,
  SR_STATUS_SKIPPED,
  STEP_ICON_CLASSES,
  STEP_TEXT_COMPLETED_CLASSES,
  STEP_TEXT_DEFAULT_CLASSES,
  WORKFLOW_PREVIEW_BASE_CLASSES,
  WORKFLOW_PREVIEW_SIZE_CLASSES,
  WorkflowPreview,
  WorkflowPreviewError,
  WorkflowPreviewSkeleton,
} from './WorkflowPreview';

const meta: Meta<typeof WorkflowPreview> = {
  title: 'Organisms/WorkflowPreview',
  component: WorkflowPreview,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    workflow: {
      control: false,
      description: 'Workflow template to preview',
    },
    maxSteps: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Maximum number of steps to show',
    },
    showDescriptions: {
      control: 'boolean',
      description: 'Whether to show step descriptions',
    },
    activeStepIndex: {
      control: { type: 'number', min: 0, max: 10 },
      description: 'Index of the currently active step',
    },
    loading: {
      control: 'boolean',
      description: 'Whether to show loading state',
    },
    error: {
      control: 'boolean',
      description: 'Whether to show error state',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80 p-4 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WorkflowPreview>;

/** Helper to create a workflow step with required fields */
function createStep(
  index: number,
  name: string,
  description = '',
  status: WorkflowStepStatus = WorkflowStepStatus.Pending
): WorkflowStep {
  return { index, name, description, status };
}

/** Helper to create a workflow template with required fields */
function createWorkflow(
  id: string,
  name: string,
  steps: WorkflowStep[],
  description?: string
): WorkflowTemplate {
  const now = new Date().toISOString();
  return {
    id,
    name,
    description,
    content: `# ${name}\n\n${steps.map((s) => `### [ ] Step: ${s.name}\n${s.description}`).join('\n\n')}`,
    isBuiltin: false,
    steps,
    createdAt: now,
    updatedAt: now,
  };
}

/** Sample workflow with all pending steps */
const pendingWorkflow = createWorkflow(
  'workflow-1',
  'Feature Development',
  [
    createStep(0, 'Requirements', 'Define feature requirements and acceptance criteria'),
    createStep(1, 'Implementation', 'Implement the feature following best practices'),
    createStep(2, 'Testing', 'Write and run comprehensive tests'),
    createStep(3, 'Review', 'Code review and refinement'),
  ],
  'Standard feature development workflow'
);

/** Sample workflow with mixed status steps */
const inProgressWorkflow = createWorkflow('workflow-2', 'Bug Fix Workflow', [
  createStep(
    0,
    'Reproduce',
    'Reproduce the bug in a test environment',
    WorkflowStepStatus.Completed
  ),
  createStep(1, 'Analyze', 'Analyze root cause of the issue', WorkflowStepStatus.Completed),
  createStep(2, 'Fix', 'Implement the fix', WorkflowStepStatus.InProgress),
  createStep(3, 'Verify', 'Verify the fix works correctly', WorkflowStepStatus.Pending),
  createStep(4, 'Deploy', 'Deploy the fix to production', WorkflowStepStatus.Pending),
]);

/** Sample workflow with skipped step */
const skippedStepWorkflow = createWorkflow('workflow-3', 'Quick Patch', [
  createStep(0, 'Identify', 'Identify the issue', WorkflowStepStatus.Completed),
  createStep(1, 'Review', 'Optional peer review', WorkflowStepStatus.Skipped),
  createStep(2, 'Apply', 'Apply the patch', WorkflowStepStatus.InProgress),
]);

// =============================================================================
// Basic Examples
// =============================================================================

/** Default preview with all pending steps */
export const Default: Story = {
  args: {
    workflow: pendingWorkflow,
  },
};

/** Preview with description showing the workflow purpose */
export const WithDescription: Story = {
  args: {
    workflow: pendingWorkflow,
    showDescriptions: true,
  },
};

/** Preview showing in-progress workflow with mixed statuses */
export const InProgress: Story = {
  args: {
    workflow: inProgressWorkflow,
  },
};

/** Preview showing in-progress workflow with descriptions */
export const InProgressWithDescriptions: Story = {
  args: {
    workflow: inProgressWorkflow,
    showDescriptions: true,
  },
};

/** Preview with a skipped step */
export const WithSkippedStep: Story = {
  args: {
    workflow: skippedStepWorkflow,
  },
};

/** Preview with active step highlighted */
export const WithActiveStep: Story = {
  args: {
    workflow: inProgressWorkflow,
    activeStepIndex: 2,
  },
};

// =============================================================================
// Step Limit Variations
// =============================================================================

/** Preview with step limit - shows "+N more" indicator */
export const LimitedSteps: Story = {
  args: {
    workflow: inProgressWorkflow,
    maxSteps: 3,
  },
};

/** Preview with step limit and descriptions */
export const LimitedStepsWithDescriptions: Story = {
  args: {
    workflow: inProgressWorkflow,
    maxSteps: 3,
    showDescriptions: true,
  },
};

/** Single step workflow */
export const SingleStep: Story = {
  args: {
    workflow: createWorkflow('workflow-single', 'Quick Task', [
      createStep(0, 'Execute', 'Execute the quick task'),
    ]),
  },
};

// =============================================================================
// Size Variants
// =============================================================================

/** Small size variant */
export const SizeSmall: Story = {
  args: {
    workflow: pendingWorkflow,
    showDescriptions: true,
    size: 'sm',
  },
};

/** Medium size variant (default) */
export const SizeMedium: Story = {
  args: {
    workflow: pendingWorkflow,
    showDescriptions: true,
    size: 'md',
  },
};

/** Large size variant */
export const SizeLarge: Story = {
  args: {
    workflow: pendingWorkflow,
    showDescriptions: true,
    size: 'lg',
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-8 w-[400px]">
      <div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Small (sm)</p>
        <WorkflowPreview workflow={inProgressWorkflow} showDescriptions size="sm" />
      </div>
      <div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Medium (md)</p>
        <WorkflowPreview workflow={inProgressWorkflow} showDescriptions size="md" />
      </div>
      <div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Large (lg)</p>
        <WorkflowPreview workflow={inProgressWorkflow} showDescriptions size="lg" />
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

/** Responsive size - small on mobile, large on desktop */
export const ResponsiveSizing: Story = {
  args: {
    workflow: pendingWorkflow,
    showDescriptions: true,
    size: { base: 'sm', md: 'md', lg: 'lg' },
  },
};

// =============================================================================
// Loading State
// =============================================================================

/** Loading state with skeleton */
export const Loading: Story = {
  args: {
    workflow: pendingWorkflow,
    loading: true,
  },
};

/** Loading state with descriptions */
export const LoadingWithDescriptions: Story = {
  args: {
    workflow: pendingWorkflow,
    loading: true,
    showDescriptions: true,
  },
};

/** Loading state with custom step count */
export const LoadingCustomStepCount: Story = {
  args: {
    workflow: pendingWorkflow,
    loading: true,
    maxSteps: 5,
  },
};

/** Skeleton component directly */
export const SkeletonDirect: Story = {
  render: () => <WorkflowPreviewSkeleton stepCount={4} showDescriptions />,
};

// =============================================================================
// Error State
// =============================================================================

/** Error state with default message */
export const ErrorState: Story = {
  args: {
    workflow: pendingWorkflow,
    error: true,
  },
};

/** Error state with custom message */
export const ErrorWithMessage: Story = {
  args: {
    workflow: pendingWorkflow,
    error: true,
    errorMessage: 'Unable to load workflow steps. Please check your connection.',
  },
};

/** Error state with retry button */
export const ErrorWithRetry: Story = {
  args: {
    workflow: pendingWorkflow,
    error: true,
    errorMessage: 'Failed to load workflow',
    onRetry: () => alert('Retry clicked'),
  },
};

/** Error component directly */
export const ErrorDirect: Story = {
  render: () => (
    <WorkflowPreviewError
      message="Failed to load workflow"
      onRetry={() => alert('Retry clicked')}
    />
  ),
};

// =============================================================================
// Edge Cases
// =============================================================================

/** Workflow with long step names */
export const LongStepNames: Story = {
  args: {
    workflow: createWorkflow('workflow-long', 'Complex Workflow', [
      createStep(
        0,
        'Initialize Development Environment and Configure Dependencies',
        'Set up the development environment with all necessary dependencies'
      ),
      createStep(
        1,
        'Implement Core Business Logic with Comprehensive Error Handling',
        'Build the main functionality with proper error handling'
      ),
      createStep(
        2,
        'Write Unit Tests, Integration Tests, and End-to-End Tests',
        'Comprehensive testing coverage'
      ),
    ]),
    showDescriptions: true,
  },
};

/** All steps completed */
export const AllCompleted: Story = {
  args: {
    workflow: createWorkflow('workflow-done', 'Completed Workflow', [
      createStep(0, 'Step One', 'First step', WorkflowStepStatus.Completed),
      createStep(1, 'Step Two', 'Second step', WorkflowStepStatus.Completed),
      createStep(2, 'Step Three', 'Third step', WorkflowStepStatus.Completed),
    ]),
  },
};

/** Many steps workflow */
export const ManySteps: Story = {
  args: {
    workflow: createWorkflow('workflow-many', 'Comprehensive Pipeline', [
      createStep(0, 'Planning', 'Plan the work', WorkflowStepStatus.Completed),
      createStep(1, 'Design', 'Design the solution', WorkflowStepStatus.Completed),
      createStep(2, 'Setup', 'Setup environment', WorkflowStepStatus.Completed),
      createStep(3, 'Development', 'Develop the feature', WorkflowStepStatus.InProgress),
      createStep(4, 'Unit Tests', 'Write unit tests', WorkflowStepStatus.Pending),
      createStep(5, 'Integration', 'Integration testing', WorkflowStepStatus.Pending),
      createStep(6, 'Documentation', 'Write documentation', WorkflowStepStatus.Pending),
      createStep(7, 'Code Review', 'Peer review', WorkflowStepStatus.Pending),
      createStep(8, 'QA', 'Quality assurance', WorkflowStepStatus.Pending),
      createStep(9, 'Deploy', 'Deploy to production', WorkflowStepStatus.Pending),
    ]),
    maxSteps: 5,
  },
};

// =============================================================================
// Accessibility Demos
// =============================================================================

/** Screen reader accessibility demo */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        This story demonstrates screen reader accessibility features:
      </p>
      <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-1 list-disc pl-4">
        <li>role="region" with aria-label for landmark navigation</li>
        <li>Workflow summary announced via aria-live region</li>
        <li>Step status announced after step name</li>
        <li>aria-current="step" on active step</li>
        <li>Accessible "more steps" count</li>
      </ul>
      <WorkflowPreview
        workflow={inProgressWorkflow}
        activeStepIndex={2}
        maxSteps={3}
        data-testid="accessible-preview"
      />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-4 max-w-md">
        <Story />
      </div>
    ),
  ],
};

/** Focus ring visibility demo */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Tab to the retry button to see the focus ring:
      </p>
      <WorkflowPreviewError message="Failed to load workflow" onRetry={() => {}} />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-4 max-w-md">
        <Story />
      </div>
    ),
  ],
};

/** Touch target accessibility demo */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        The retry button meets WCAG 2.5.5 (44x44px minimum on mobile). Resize your browser to see
        the touch target adjust.
      </p>
      <WorkflowPreviewError message="Failed to load workflow" onRetry={() => {}} />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-4 max-w-md">
        <Story />
      </div>
    ),
  ],
};

/** Reduced motion support */
export const ReducedMotion: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        In-progress step spinner respects prefers-reduced-motion. Enable "Reduce motion" in your OS
        accessibility settings to test.
      </p>
      <WorkflowPreview workflow={inProgressWorkflow} />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-4 max-w-md">
        <Story />
      </div>
    ),
  ],
};

// =============================================================================
// Ref Forwarding & Data Attributes
// =============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: () => {
    const ref = useRef<HTMLDivElement>(null);

    return (
      <div className="space-y-4">
        <Button
          onClick={() => {
            if (ref.current) {
              ref.current.style.outline = '2px solid blue';
              setTimeout(() => {
                if (ref.current) {
                  ref.current.style.outline = '';
                }
              }, 1000);
            }
          }}
        >
          Flash Preview Border
        </Button>
        <WorkflowPreview ref={ref} workflow={pendingWorkflow} data-testid="ref-demo" />
      </div>
    );
  },
  decorators: [
    (Story) => (
      <div className="p-4 max-w-md">
        <Story />
      </div>
    ),
  ],
};

/** Data attributes demo */
export const DataAttributes: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Inspect the elements to see data attributes:
      </p>
      <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-1 list-disc pl-4">
        <li>data-testid for testing</li>
        <li>data-workflow-id for workflow identification</li>
        <li>data-step-count for total steps</li>
        <li>data-visible-steps for shown steps</li>
        <li>data-step-index on each step</li>
        <li>data-step-status on each step</li>
      </ul>
      <WorkflowPreview workflow={inProgressWorkflow} maxSteps={3} data-testid="data-attrs-demo" />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-4 max-w-md">
        <Story />
      </div>
    ),
  ],
};

// =============================================================================
// Interactive Demos
// =============================================================================

/** Interactive loading transition */
export const LoadingTransition: Story = {
  render: () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={loading ? 'primary' : 'secondary'}
            onClick={() => {
              setLoading(true);
              setError(false);
            }}
          >
            Loading
          </Button>
          <Button
            size="sm"
            variant={error ? 'destructive' : 'secondary'}
            onClick={() => {
              setLoading(false);
              setError(true);
            }}
          >
            Error
          </Button>
          <Button
            size="sm"
            variant={!loading && !error ? 'primary' : 'secondary'}
            onClick={() => {
              setLoading(false);
              setError(false);
            }}
          >
            Content
          </Button>
        </div>
        <WorkflowPreview
          workflow={inProgressWorkflow}
          loading={loading}
          error={error}
          onRetry={() => {
            setLoading(true);
            setError(false);
          }}
        />
      </div>
    );
  },
  decorators: [
    (Story) => (
      <div className="p-4 max-w-md">
        <Story />
      </div>
    ),
  ],
};

// =============================================================================
// Real-World Examples
// =============================================================================

/** Task creation wizard */
export const TaskCreationWizard: Story = {
  render: () => {
    const workflow = createWorkflow(
      'task-wizard',
      'Create New Task',
      [
        createStep(
          0,
          'Select Project',
          'Choose the project for this task',
          WorkflowStepStatus.Completed
        ),
        createStep(
          1,
          'Choose Workflow',
          'Select a workflow template',
          WorkflowStepStatus.InProgress
        ),
        createStep(2, 'Configure Options', 'Set task options and parameters'),
        createStep(3, 'Review & Create', 'Review and create the task'),
      ],
      'Create a new task with AI assistance'
    );

    return (
      <div className="p-4 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))]">
        <WorkflowPreview
          workflow={workflow}
          showDescriptions
          activeStepIndex={1}
          size={{ base: 'sm', md: 'md' }}
        />
      </div>
    );
  },
  decorators: [
    (Story) => (
      <div className="p-4 max-w-md">
        <Story />
      </div>
    ),
  ],
};

/** Workflow selector dropdown preview */
export const WorkflowSelectorPreview: Story = {
  render: () => {
    const workflows = [
      createWorkflow('wf-1', 'Feature Development', [
        createStep(0, 'Requirements'),
        createStep(1, 'Implementation'),
        createStep(2, 'Testing'),
        createStep(3, 'Review'),
      ]),
      createWorkflow('wf-2', 'Bug Fix', [
        createStep(0, 'Reproduce'),
        createStep(1, 'Fix'),
        createStep(2, 'Verify'),
      ]),
    ];
    const [selected, setSelected] = useState(0);

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {workflows.map((wf, i) => (
            <Button
              key={wf.id}
              size="sm"
              variant={selected === i ? 'primary' : 'secondary'}
              onClick={() => setSelected(i)}
            >
              {wf.name}
            </Button>
          ))}
        </div>
        <div className="p-4 border border-[hsl(var(--border))] rounded-lg">
          {workflows[selected] && (
            <WorkflowPreview workflow={workflows[selected]} size="sm" maxSteps={4} />
          )}
        </div>
      </div>
    );
  },
  decorators: [
    (Story) => (
      <div className="p-4 max-w-md">
        <Story />
      </div>
    ),
  ],
};

// =============================================================================
// Constants Reference
// =============================================================================

/** Constants reference for developers */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl text-sm">
      <h3 className="font-medium text-[hsl(var(--foreground))]">Constants Reference</h3>

      <div className="space-y-2">
        <h4 className="font-medium text-xs text-[hsl(var(--muted-foreground))]">Default Labels</h4>
        <pre className="p-2 bg-[hsl(var(--muted))] rounded text-xs overflow-x-auto">
          {`DEFAULT_WORKFLOW_PREVIEW_LABEL = "${DEFAULT_WORKFLOW_PREVIEW_LABEL}"
DEFAULT_LOADING_LABEL = "${DEFAULT_LOADING_LABEL}"
DEFAULT_ERROR_MESSAGE = "${DEFAULT_ERROR_MESSAGE}"
DEFAULT_RETRY_LABEL = "${DEFAULT_RETRY_LABEL}"
DEFAULT_SKELETON_STEP_COUNT = ${DEFAULT_SKELETON_STEP_COUNT}`}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-xs text-[hsl(var(--muted-foreground))]">
          Screen Reader Status Labels
        </h4>
        <pre className="p-2 bg-[hsl(var(--muted))] rounded text-xs overflow-x-auto">
          {`SR_STATUS_COMPLETED = "${SR_STATUS_COMPLETED}"
SR_STATUS_IN_PROGRESS = "${SR_STATUS_IN_PROGRESS}"
SR_STATUS_SKIPPED = "${SR_STATUS_SKIPPED}"
SR_STATUS_PENDING = "${SR_STATUS_PENDING}"
SR_MORE_STEPS_SINGULAR = "${SR_MORE_STEPS_SINGULAR}"
SR_MORE_STEPS_PLURAL = "${SR_MORE_STEPS_PLURAL}"`}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-xs text-[hsl(var(--muted-foreground))]">CSS Classes</h4>
        <pre className="p-2 bg-[hsl(var(--muted))] rounded text-xs overflow-x-auto">
          {`WORKFLOW_PREVIEW_BASE_CLASSES = "${WORKFLOW_PREVIEW_BASE_CLASSES}"
STEP_TEXT_COMPLETED_CLASSES = "${STEP_TEXT_COMPLETED_CLASSES}"
STEP_TEXT_DEFAULT_CLASSES = "${STEP_TEXT_DEFAULT_CLASSES}"`}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-xs text-[hsl(var(--muted-foreground))]">Size Classes</h4>
        <pre className="p-2 bg-[hsl(var(--muted))] rounded text-xs overflow-x-auto">
          {`WORKFLOW_PREVIEW_SIZE_CLASSES = ${JSON.stringify(WORKFLOW_PREVIEW_SIZE_CLASSES, null, 2)}`}
        </pre>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-xs text-[hsl(var(--muted-foreground))]">
          Step Icon Classes
        </h4>
        <pre className="p-2 bg-[hsl(var(--muted))] rounded text-xs overflow-x-auto">
          {`STEP_ICON_CLASSES = ${JSON.stringify(STEP_ICON_CLASSES, null, 2)}`}
        </pre>
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};
