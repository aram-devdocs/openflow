import { WorkflowStepStatus } from '@openflow/generated';
import type { WorkflowStep, WorkflowTemplate } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { WorkflowPreview } from './WorkflowPreview';

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
  },
  decorators: [
    (Story) => (
      <div className="w-80 p-4 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--background))]">
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
  description: string,
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
