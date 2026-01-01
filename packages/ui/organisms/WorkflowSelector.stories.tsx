import type { WorkflowStep, WorkflowStepStatus, WorkflowTemplate } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import {
  // Constants
  DEFAULT_ARIA_LABEL,
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_RETRY_LABEL,
  DEFAULT_ERROR_TITLE,
  DEFAULT_LOADING_LABEL,
  DEFAULT_NO_TEMPLATE_DESCRIPTION,
  DEFAULT_NO_TEMPLATE_TITLE,
  DEFAULT_SELECTED_INDICATOR,
  DEFAULT_SKELETON_COUNT,
  SR_NAVIGATION_HINT,
  SR_OPTION_COUNT_TEMPLATE,
  SR_WORKFLOW_DESELECTED,
  SR_WORKFLOW_SELECTED,
  WORKFLOW_OPTION_SIZE_CLASSES,
  // Components
  WorkflowSelector,
  WorkflowSelectorError,
  // Types
  type WorkflowSelectorProps,
  WorkflowSelectorSkeleton,
  // Utility functions
  buildCountAnnouncement,
  buildHighlightAnnouncement,
  buildSelectionAnnouncement,
  buildWorkflowAccessibleLabel,
  formatStepCount,
  getBaseSize,
  getOptionId,
} from './WorkflowSelector';

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
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
    },
  },
};

export default meta;
type Story = StoryObj<typeof WorkflowSelector>;

// ============================================================================
// Helper Functions
// ============================================================================

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

// ============================================================================
// Sample Data
// ============================================================================

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

// ============================================================================
// Interactive Demo Wrapper
// ============================================================================

function WorkflowSelectorDemo({
  workflows = sampleWorkflows,
  initialSelection = null,
  ...props
}: Partial<WorkflowSelectorProps> & {
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

// ============================================================================
// Basic Examples
// ============================================================================

/** Default workflow selector with multiple options */
export const Default: Story = {
  render: () => <WorkflowSelectorDemo />,
};

/** With a workflow pre-selected */
export const WithSelection: Story = {
  render: () => <WorkflowSelectorDemo initialSelection={featureDevWorkflow} />,
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

// ============================================================================
// Size Variants
// ============================================================================

/** Small size variant */
export const SizeSmall: Story = {
  render: () => <WorkflowSelectorDemo size="sm" />,
};

/** Medium size variant (default) */
export const SizeMedium: Story = {
  render: () => <WorkflowSelectorDemo size="md" />,
};

/** Large size variant */
export const SizeLarge: Story = {
  render: () => <WorkflowSelectorDemo size="lg" />,
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">Small</h3>
        <WorkflowSelectorDemo size="sm" />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">Medium</h3>
        <WorkflowSelectorDemo size="md" />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">Large</h3>
        <WorkflowSelectorDemo size="lg" />
      </div>
    </div>
  ),
};

/** Responsive sizing demo */
export const ResponsiveSizing: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Responsive Sizing</h3>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          This selector uses responsive sizing: small on mobile, medium on tablet, large on desktop.
        </p>
        <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
          Resize the browser to see the size change.
        </p>
      </div>
      <WorkflowSelectorDemo size={{ base: 'sm', md: 'md', lg: 'lg' }} />
    </div>
  ),
};

// ============================================================================
// Loading & Error States
// ============================================================================

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

/** Loading skeleton component directly */
export const SkeletonComponent: Story = {
  render: () => (
    <div className="w-96 space-y-8">
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">
          Default (3 items)
        </h3>
        <WorkflowSelectorSkeleton />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">5 items</h3>
        <WorkflowSelectorSkeleton count={5} />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">Small size</h3>
        <WorkflowSelectorSkeleton size="sm" />
      </div>
    </div>
  ),
};

/** Error state component */
export const ErrorComponent: Story = {
  render: () => (
    <div className="w-96 space-y-8">
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">
          With retry button
        </h3>
        <WorkflowSelectorError onRetry={() => alert('Retry clicked')} />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">Custom message</h3>
        <WorkflowSelectorError message="Network connection lost" onRetry={() => {}} />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">Without retry</h3>
        <WorkflowSelectorError />
      </div>
    </div>
  ),
};

// ============================================================================
// Content Variations
// ============================================================================

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

// ============================================================================
// Accessibility Demos
// ============================================================================

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Keyboard Navigation</h3>
        <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
          <li>
            <kbd className="rounded bg-[rgb(var(--muted))] px-1 py-0.5 text-xs">Tab</kbd> to focus
            the list
          </li>
          <li>
            <kbd className="rounded bg-[rgb(var(--muted))] px-1 py-0.5 text-xs">Arrow Up/Down</kbd>{' '}
            to navigate options
          </li>
          <li>
            <kbd className="rounded bg-[rgb(var(--muted))] px-1 py-0.5 text-xs">Home</kbd> to jump
            to first option
          </li>
          <li>
            <kbd className="rounded bg-[rgb(var(--muted))] px-1 py-0.5 text-xs">End</kbd> to jump to
            last option
          </li>
          <li>
            <kbd className="rounded bg-[rgb(var(--muted))] px-1 py-0.5 text-xs">Enter</kbd> or{' '}
            <kbd className="rounded bg-[rgb(var(--muted))] px-1 py-0.5 text-xs">Space</kbd> to
            select
          </li>
        </ul>
      </div>
      <WorkflowSelectorDemo />
    </div>
  ),
};

/** Screen reader accessibility demo */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Screen Reader Features</h3>
        <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
          <li>ARIA listbox role for proper semantics</li>
          <li>aria-selected indicates current selection</li>
          <li>aria-activedescendant tracks highlighted option</li>
          <li>aria-label provides accessible name for each option</li>
          <li>Live region announces selection changes</li>
          <li>Navigation hint provided on focus</li>
        </ul>
      </div>
      <WorkflowSelectorDemo />
    </div>
  ),
};

/** Focus ring visibility demo */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Focus Ring Visibility</h3>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          Focus rings use ring-offset for visibility on all backgrounds. Tab to see the focus ring.
        </p>
      </div>
      <div className="rounded-lg bg-[rgb(var(--background))] p-4">
        <h4 className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">Light background</h4>
        <WorkflowSelectorDemo />
      </div>
      <div className="rounded-lg bg-[rgb(var(--foreground))] p-4">
        <h4 className="mb-2 text-sm font-medium text-[rgb(var(--background))]">Dark background</h4>
        <WorkflowSelectorDemo />
      </div>
    </div>
  ),
};

/** Touch target accessibility demo */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Touch Target Compliance</h3>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          All options have a minimum touch target of 44px to meet WCAG 2.5.5 requirements for
          pointer target size.
        </p>
      </div>
      <div className="relative">
        <WorkflowSelectorDemo />
        <div className="absolute right-0 top-0 h-11 w-11 border-2 border-dashed border-[rgb(var(--primary))]" />
      </div>
      <p className="text-xs text-[rgb(var(--muted-foreground))]">
        The dashed border shows a 44px reference square.
      </p>
    </div>
  ),
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: () => {
    const Component = () => {
      const ref = useRef<HTMLDivElement>(null);

      const handleClick = () => {
        ref.current?.focus();
      };

      return (
        <div className="w-96 space-y-4">
          <button
            type="button"
            onClick={handleClick}
            className="rounded bg-[rgb(var(--primary))] px-3 py-2 text-sm text-[rgb(var(--primary-foreground))]"
          >
            Focus selector
          </button>
          <WorkflowSelector
            ref={ref}
            workflows={sampleWorkflows}
            selectedWorkflow={null}
            onSelectWorkflow={() => {}}
          />
        </div>
      );
    };

    return <Component />;
  },
};

/** Data attributes demo */
export const DataAttributes: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Data Attributes</h3>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          The component exposes data attributes for testing and CSS targeting:
        </p>
        <ul className="mt-2 list-inside list-disc text-xs text-[rgb(var(--muted-foreground))]">
          <li>
            <code className="bg-[rgb(var(--muted))] px-1">data-testid</code> - Test identification
          </li>
          <li>
            <code className="bg-[rgb(var(--muted))] px-1">data-state</code> - "empty" or "populated"
          </li>
          <li>
            <code className="bg-[rgb(var(--muted))] px-1">data-size</code> - Current size variant
          </li>
          <li>
            <code className="bg-[rgb(var(--muted))] px-1">data-workflow-count</code> - Number of
            workflows
          </li>
          <li>
            <code className="bg-[rgb(var(--muted))] px-1">data-selected-workflow</code> - Selected
            workflow ID
          </li>
          <li>
            <code className="bg-[rgb(var(--muted))] px-1">data-disabled</code> - Disabled state
          </li>
        </ul>
      </div>
      <WorkflowSelectorDemo data-testid="my-workflow-selector" />
    </div>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** New task dialog example */
export const NewTaskDialogExample: Story = {
  render: () => {
    const Component = () => {
      const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);

      return (
        <div className="w-96 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-4 shadow-lg">
          <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Create New Task</h2>
          <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
            Choose a workflow template to structure your task, or start blank.
          </p>
          <div className="mt-4">
            <label className="block text-sm font-medium text-[rgb(var(--foreground))]">
              Workflow Template
            </label>
            <div className="mt-2">
              <WorkflowSelector
                workflows={sampleWorkflows}
                selectedWorkflow={selectedWorkflow}
                onSelectWorkflow={setSelectedWorkflow}
                aria-label="Choose workflow template"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-[rgb(var(--border))] px-3 py-2 text-sm text-[rgb(var(--foreground))]"
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md bg-[rgb(var(--primary))] px-3 py-2 text-sm text-[rgb(var(--primary-foreground))]"
            >
              Create Task
            </button>
          </div>
        </div>
      );
    };

    return <Component />;
  },
};

/** Loading transition demo */
export const LoadingTransition: Story = {
  render: () => {
    const Component = () => {
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(false);

      const handleRetry = () => {
        setError(false);
        setLoading(true);
        setTimeout(() => setLoading(false), 1500);
      };

      const handleSimulateError = () => {
        setError(true);
        setLoading(false);
      };

      return (
        <div className="w-96 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError(false);
                setTimeout(() => setLoading(false), 1500);
              }}
              className="rounded bg-[rgb(var(--primary))] px-3 py-2 text-sm text-[rgb(var(--primary-foreground))]"
            >
              Simulate Load
            </button>
            <button
              type="button"
              onClick={handleSimulateError}
              className="rounded bg-[rgb(var(--destructive))] px-3 py-2 text-sm text-[rgb(var(--destructive-foreground))]"
            >
              Simulate Error
            </button>
          </div>

          {error ? (
            <WorkflowSelectorError onRetry={handleRetry} />
          ) : (
            <WorkflowSelector
              workflows={sampleWorkflows}
              selectedWorkflow={null}
              onSelectWorkflow={() => {}}
              loading={loading}
            />
          )}
        </div>
      );
    };

    return <Component />;
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/** Constants reference for testing and documentation */
export const ConstantsReference: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Exported Constants</h3>

        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">Default Labels</h4>
            <ul className="mt-1 list-inside list-disc text-xs text-[rgb(var(--muted-foreground))]">
              <li>
                <code>DEFAULT_ARIA_LABEL</code>: "{DEFAULT_ARIA_LABEL}"
              </li>
              <li>
                <code>DEFAULT_NO_TEMPLATE_TITLE</code>: "{DEFAULT_NO_TEMPLATE_TITLE}"
              </li>
              <li>
                <code>DEFAULT_NO_TEMPLATE_DESCRIPTION</code>: "{DEFAULT_NO_TEMPLATE_DESCRIPTION}"
              </li>
              <li>
                <code>DEFAULT_EMPTY_TITLE</code>: "{DEFAULT_EMPTY_TITLE}"
              </li>
              <li>
                <code>DEFAULT_EMPTY_DESCRIPTION</code>: "{DEFAULT_EMPTY_DESCRIPTION}"
              </li>
              <li>
                <code>DEFAULT_LOADING_LABEL</code>: "{DEFAULT_LOADING_LABEL}"
              </li>
              <li>
                <code>DEFAULT_ERROR_TITLE</code>: "{DEFAULT_ERROR_TITLE}"
              </li>
              <li>
                <code>DEFAULT_ERROR_RETRY_LABEL</code>: "{DEFAULT_ERROR_RETRY_LABEL}"
              </li>
              <li>
                <code>DEFAULT_SKELETON_COUNT</code>: {DEFAULT_SKELETON_COUNT}
              </li>
              <li>
                <code>DEFAULT_SELECTED_INDICATOR</code>: "{DEFAULT_SELECTED_INDICATOR}"
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">
              Screen Reader Announcements
            </h4>
            <ul className="mt-1 list-inside list-disc text-xs text-[rgb(var(--muted-foreground))]">
              <li>
                <code>SR_WORKFLOW_SELECTED</code>: "{SR_WORKFLOW_SELECTED}"
              </li>
              <li>
                <code>SR_WORKFLOW_DESELECTED</code>: "{SR_WORKFLOW_DESELECTED}"
              </li>
              <li>
                <code>SR_OPTION_COUNT_TEMPLATE</code>: "{SR_OPTION_COUNT_TEMPLATE}"
              </li>
              <li>
                <code>SR_NAVIGATION_HINT</code>: "{SR_NAVIGATION_HINT}"
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">Size Classes</h4>
            <ul className="mt-1 list-inside list-disc text-xs text-[rgb(var(--muted-foreground))]">
              <li>
                <code>WORKFLOW_OPTION_SIZE_CLASSES.sm</code>: "{WORKFLOW_OPTION_SIZE_CLASSES.sm}"
              </li>
              <li>
                <code>WORKFLOW_OPTION_SIZE_CLASSES.md</code>: "{WORKFLOW_OPTION_SIZE_CLASSES.md}"
              </li>
              <li>
                <code>WORKFLOW_OPTION_SIZE_CLASSES.lg</code>: "{WORKFLOW_OPTION_SIZE_CLASSES.lg}"
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">Utility Functions</h4>
            <ul className="mt-1 list-inside list-disc text-xs text-[rgb(var(--muted-foreground))]">
              <li>
                <code>getBaseSize(size)</code> - Get base size from responsive value
              </li>
              <li>
                <code>getResponsiveSizeClasses(size, classMap)</code> - Generate responsive classes
              </li>
              <li>
                <code>getOptionId(listboxId, index)</code> - Generate option ID
              </li>
              <li>
                <code>formatStepCount(count)</code> - Format step count text
              </li>
              <li>
                <code>buildSelectionAnnouncement(workflow)</code> - Build selection announcement
              </li>
              <li>
                <code>buildHighlightAnnouncement(...)</code> - Build highlight announcement
              </li>
              <li>
                <code>buildWorkflowAccessibleLabel(...)</code> - Build accessible label
              </li>
              <li>
                <code>buildCountAnnouncement(count)</code> - Build count announcement
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  ),
};

/** Utility functions demo */
export const UtilityFunctionsDemo: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Utility Function Examples</h3>

        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">getBaseSize()</h4>
            <code className="mt-1 block text-xs text-[rgb(var(--muted-foreground))]">
              getBaseSize('md') → "{getBaseSize('md')}"
              <br />
              getBaseSize({'{ base: "sm", lg: "lg" }'}) → "{getBaseSize({ base: 'sm', lg: 'lg' })}"
            </code>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">formatStepCount()</h4>
            <code className="mt-1 block text-xs text-[rgb(var(--muted-foreground))]">
              formatStepCount(1) → "{formatStepCount(1)}"
              <br />
              formatStepCount(3) → "{formatStepCount(3)}"
            </code>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">getOptionId()</h4>
            <code className="mt-1 block text-xs text-[rgb(var(--muted-foreground))]">
              getOptionId(':r1:-listbox', 0) → "{getOptionId(':r1:-listbox', 0)}"
              <br />
              getOptionId(':r1:-listbox', 2) → "{getOptionId(':r1:-listbox', 2)}"
            </code>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">
              buildCountAnnouncement()
            </h4>
            <code className="mt-1 block text-xs text-[rgb(var(--muted-foreground))]">
              buildCountAnnouncement(3) → "{buildCountAnnouncement(3)}"
            </code>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">
              buildSelectionAnnouncement()
            </h4>
            <code className="mt-1 block text-xs text-[rgb(var(--muted-foreground))]">
              buildSelectionAnnouncement(null) → "{buildSelectionAnnouncement(null)}"
              <br />
              buildSelectionAnnouncement(featureDevWorkflow) → "
              {buildSelectionAnnouncement(featureDevWorkflow)}"
            </code>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">
              buildHighlightAnnouncement()
            </h4>
            <code className="mt-1 block text-xs text-[rgb(var(--muted-foreground))]">
              buildHighlightAnnouncement('Feature Dev', 4, 1, 4) → "
              {buildHighlightAnnouncement('Feature Dev', 4, 1, 4)}"
              <br />
              buildHighlightAnnouncement('No template', null, 0, 4) → "
              {buildHighlightAnnouncement('No template', null, 0, 4)}"
            </code>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">
              buildWorkflowAccessibleLabel()
            </h4>
            <code className="mt-1 block text-xs text-[rgb(var(--muted-foreground))]">
              buildWorkflowAccessibleLabel(null, true) → "{buildWorkflowAccessibleLabel(null, true)}
              "
              <br />
              buildWorkflowAccessibleLabel(featureDevWorkflow, false) → "
              {buildWorkflowAccessibleLabel(featureDevWorkflow, false)}"
              <br />
              buildWorkflowAccessibleLabel(featureDevWorkflow, true) → "
              {buildWorkflowAccessibleLabel(featureDevWorkflow, true)}"
            </code>
          </div>
        </div>
      </div>
    </div>
  ),
};
