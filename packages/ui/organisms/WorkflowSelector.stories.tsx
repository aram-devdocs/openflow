import type { WorkflowStep, WorkflowStepStatus, WorkflowTemplate } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { WorkflowSelector } from './WorkflowSelector';

const meta: Meta<typeof WorkflowSelector> = {
  title: 'Organisms/WorkflowSelector',
  component: WorkflowSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    workflows: {
      control: false,
      description: 'Available workflow templates to choose from',
    },
    selectedWorkflow: {
      control: false,
      description: 'Currently selected workflow template (null for no template)',
    },
    onSelectWorkflow: {
      action: 'select',
      description: 'Callback when a workflow is selected or deselected',
    },
    loading: {
      control: 'boolean',
      description: 'Whether workflows are still loading',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the selector is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof WorkflowSelector>;

/** Helper to create a workflow step with required fields */
function createStep(
  index: number,
  name: string,
  description: string,
  status: WorkflowStepStatus = 'pending' as WorkflowStepStatus
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

/** Sample workflow templates for stories */
const featureDevWorkflow = createWorkflow('workflow-1', 'Feature Development', [
  createStep(0, 'Requirements', 'Define feature requirements'),
  createStep(1, 'Implementation', 'Implement the feature'),
  createStep(2, 'Testing', 'Write and run tests'),
  createStep(3, 'Review', 'Code review and refinement'),
]);

const sampleWorkflows: WorkflowTemplate[] = [
  featureDevWorkflow,
  createWorkflow('workflow-2', 'Bug Fix', [
    createStep(0, 'Reproduce', 'Reproduce the bug'),
    createStep(1, 'Fix', 'Implement the fix'),
    createStep(2, 'Verify', 'Verify the fix works'),
  ]),
  createWorkflow('workflow-3', 'Refactoring', [
    createStep(0, 'Analysis', 'Analyze code to refactor'),
    createStep(1, 'Plan', 'Create refactoring plan'),
    createStep(2, 'Execute', 'Execute refactoring'),
    createStep(3, 'Test', 'Run regression tests'),
    createStep(4, 'Document', 'Update documentation'),
  ]),
];

/** Interactive demo wrapper */
function WorkflowSelectorDemo({
  workflows = sampleWorkflows,
  initialSelection = null,
  ...props
}: Partial<React.ComponentProps<typeof WorkflowSelector>> & {
  initialSelection?: WorkflowTemplate | null;
}) {
  const [selected, setSelected] = useState<WorkflowTemplate | null>(initialSelection);

  return (
    <div className="w-96">
      <WorkflowSelector
        workflows={workflows}
        selectedWorkflow={selected}
        onSelectWorkflow={setSelected}
        {...props}
      />
      <div className="mt-4 rounded-lg border border-[rgb(var(--border))] p-3">
        <p className="text-xs text-[rgb(var(--muted-foreground))]">
          Selected: {selected ? selected.name : 'No template'}
        </p>
      </div>
    </div>
  );
}

/** Default workflow selector with multiple options */
export const Default: Story = {
  render: () => <WorkflowSelectorDemo />,
};

/** With a workflow pre-selected */
export const WithSelection: Story = {
  render: () => <WorkflowSelectorDemo initialSelection={featureDevWorkflow} />,
};

/** Loading state with skeletons */
export const Loading: Story = {
  render: () => (
    <div className="w-96">
      <WorkflowSelector
        workflows={[]}
        selectedWorkflow={null}
        onSelectWorkflow={() => {}}
        loading
      />
    </div>
  ),
};

/** Empty state - no workflows available */
export const Empty: Story = {
  render: () => (
    <div className="w-96">
      <WorkflowSelector workflows={[]} selectedWorkflow={null} onSelectWorkflow={() => {}} />
    </div>
  ),
};

/** Disabled state */
export const Disabled: Story = {
  render: () => <WorkflowSelectorDemo disabled />,
};

/** Single workflow option */
export const SingleWorkflow: Story = {
  render: () => <WorkflowSelectorDemo workflows={[featureDevWorkflow]} />,
};

/** Many workflow options */
export const ManyWorkflows: Story = {
  render: () => {
    const manyWorkflows: WorkflowTemplate[] = [
      ...sampleWorkflows,
      createWorkflow('workflow-4', 'API Development', [
        createStep(0, 'Design', 'Design API endpoints'),
        createStep(1, 'Implement', 'Implement endpoints'),
      ]),
      createWorkflow('workflow-5', 'Documentation', [
        createStep(0, 'Write', 'Write documentation'),
      ]),
      createWorkflow('workflow-6', 'Performance Optimization', [
        createStep(0, 'Profile', 'Profile performance'),
        createStep(1, 'Optimize', 'Implement optimizations'),
        createStep(2, 'Benchmark', 'Run benchmarks'),
      ]),
    ];

    return <WorkflowSelectorDemo workflows={manyWorkflows} />;
  },
};

/** Workflow with single step */
export const SingleStepWorkflow: Story = {
  render: () => {
    const singleStepWorkflow: WorkflowTemplate[] = [
      createWorkflow('workflow-single', 'Quick Fix', [createStep(0, 'Fix', 'Apply quick fix')]),
    ];

    return <WorkflowSelectorDemo workflows={singleStepWorkflow} />;
  },
};

/** Long workflow names */
export const LongNames: Story = {
  render: () => {
    const longNameWorkflows: WorkflowTemplate[] = [
      createWorkflow(
        'workflow-long-1',
        'Complete End-to-End Feature Development with Testing and Documentation',
        [createStep(0, 'Step 1', 'First step'), createStep(1, 'Step 2', 'Second step')]
      ),
      createWorkflow(
        'workflow-long-2',
        'Comprehensive Security Audit and Vulnerability Assessment',
        [
          createStep(0, 'Audit', 'Security audit'),
          createStep(1, 'Fix', 'Fix vulnerabilities'),
          createStep(2, 'Verify', 'Verify fixes'),
        ]
      ),
    ];

    return <WorkflowSelectorDemo workflows={longNameWorkflows} />;
  },
};

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Keyboard Navigation</h3>
        <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
          <li>Tab to navigate between options</li>
          <li>Enter or Space to select an option</li>
          <li>Focus rings are visible for accessibility</li>
        </ul>
      </div>
      <WorkflowSelectorDemo />
    </div>
  ),
};
