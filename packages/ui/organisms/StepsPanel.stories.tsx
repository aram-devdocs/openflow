import { WorkflowStepStatus } from '@openflow/generated';
import type { WorkflowStep } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import {
  DEFAULT_ADD_STEP_LABEL,
  DEFAULT_AUTO_START_LABEL,
  DEFAULT_COLLAPSE_LABEL,
  DEFAULT_COMPLETE_STEP_LABEL,
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_ERROR_TITLE,
  DEFAULT_EXPAND_LABEL,
  DEFAULT_LOADING_LABEL,
  DEFAULT_RETRY_LABEL,
  DEFAULT_SKELETON_COUNT,
  DEFAULT_SKIP_STEP_LABEL,
  DEFAULT_START_STEP_LABEL,
  DEFAULT_STEPS_PANEL_LABEL,
  DEFAULT_VIEW_CHAT_LABEL,
  SR_STEP_COLLAPSED,
  SR_STEP_COMPLETED,
  SR_STEP_EXPANDED,
  SR_STEP_SELECTED,
  SR_STEP_SKIPPED,
  SR_STEP_STARTED,
  SR_STEP_TOGGLED,
  StepsPanel,
  StepsPanelError,
  StepsPanelSkeleton,
} from './StepsPanel';

const meta = {
  title: 'Organisms/StepsPanel',
  component: StepsPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The StepsPanel component displays and manages workflow steps with full accessibility support.

## Features
- **Step list** with status indicators, checkboxes, and expandable descriptions
- **Actions**: Start, Complete, Skip, and View Chat buttons
- **Auto-start toggle** for automatic progression
- **Loading skeleton** and **error state** with retry
- **Keyboard navigation** (Enter/Space to select)
- **Screen reader announcements** for all actions
- **Touch targets ≥44px** (WCAG 2.5.5)
- **Responsive sizing** with sm/md/lg variants

## Accessibility
- \`role="complementary"\` on aside element
- \`role="list"\` with \`role="listitem"\` for steps
- \`aria-current="step"\` for active step
- \`aria-expanded\` for expandable details
- Screen reader announcements via \`aria-live\`

## Exports
The component exports the following for testing and customization:
- Components: \`StepsPanel\`, \`StepsPanelSkeleton\`, \`StepsPanelError\`
- Default labels: \`DEFAULT_STEPS_PANEL_LABEL\`, \`DEFAULT_ADD_STEP_LABEL\`, etc.
- Screen reader announcements: \`SR_STEP_SELECTED\`, \`SR_STEP_STARTED\`, etc.
- Utility functions: \`getStepIcon\`, \`getStatusLabel\`, \`buildStepAccessibleLabel\`, etc.
- CSS class constants: \`STEPS_PANEL_BASE_CLASSES\`, \`STEP_ITEM_BASE_CLASSES\`, etc.
        `,
      },
    },
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
    onRetry: fn(),
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

// ============================================================================
// Sample Data
// ============================================================================

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
  if (i <= 3) {
    return { ...base, chatId: `chat-${i + 1}` };
  }
  return base;
});

// ============================================================================
// Basic Examples
// ============================================================================

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
 * Steps panel with error state
 */
export const ErrorState: Story = {
  args: {
    steps: [],
    error: true,
    errorMessage: 'Network error: Unable to fetch workflow steps.',
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

// ============================================================================
// Step Status Variations
// ============================================================================

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

// ============================================================================
// Feature Variations
// ============================================================================

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

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size variant
 */
export const SizeSmall: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
    size: 'sm',
  },
};

/**
 * Medium size variant (default)
 */
export const SizeMedium: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
    size: 'md',
  },
};

/**
 * Large size variant
 */
export const SizeLarge: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
    size: 'lg',
  },
};

/**
 * Responsive sizing demo
 */
export const ResponsiveSizing: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
    size: { base: 'sm', md: 'md', lg: 'lg' },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates responsive sizing - small on mobile, medium on tablet, large on desktop.',
      },
    },
  },
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Skeleton loading component standalone
 */
export const SkeletonStandalone: StoryObj<typeof StepsPanelSkeleton> = {
  render: (args) => <StepsPanelSkeleton {...args} />,
  args: {
    stepCount: 4,
    'data-testid': 'steps-skeleton',
  },
};

/**
 * Skeleton with custom step count
 */
export const SkeletonCustomCount: StoryObj<typeof StepsPanelSkeleton> = {
  render: (args) => <StepsPanelSkeleton {...args} />,
  args: {
    stepCount: 6,
  },
};

/**
 * Error state standalone
 */
export const ErrorStandalone: StoryObj<typeof StepsPanelError> = {
  render: (args) => <StepsPanelError {...args} />,
  args: {
    message: 'Failed to connect to the server.',
    onRetry: fn(),
    'data-testid': 'steps-error',
  },
};

/**
 * Error state with retrying
 */
export const ErrorRetrying: StoryObj<typeof StepsPanelError> = {
  render: (args) => <StepsPanelError {...args} />,
  args: {
    message: 'Failed to load steps.',
    onRetry: fn(),
    retrying: true,
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Keyboard navigation demo - use Tab and Enter to interact
 */
export const KeyboardNavigation: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
  },
  parameters: {
    docs: {
      description: {
        story: `
**Keyboard Navigation:**
- **Tab**: Move focus between steps and controls
- **Enter/Space**: Select a step or activate a button
- **Arrow keys**: Navigate within expanded step actions

Try tabbing through the steps and pressing Enter to select them.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the first step button
    const firstStep = canvas.getAllByRole('button')[0];
    expect(firstStep).toBeInTheDocument();

    // Focus the first step
    await userEvent.tab();
  },
};

/**
 * Screen reader accessibility demo
 */
export const ScreenReaderAccessibility: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
    'aria-label': 'Workflow steps for feature implementation',
    'data-testid': 'steps-panel',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Screen Reader Support:**
- Panel has \`role="complementary"\` with descriptive \`aria-label\`
- Steps list has \`role="list"\` with \`role="listitem"\` for each step
- Active step is indicated with \`aria-current="step"\`
- Expandable sections use \`aria-expanded\` and \`aria-controls\`
- All actions announce their effect via \`aria-live\` region

The component uses VisuallyHidden for screen reader announcements:
- Step selection: "${SR_STEP_SELECTED}"
- Step expansion: "${SR_STEP_EXPANDED}"
- Step actions: "${SR_STEP_STARTED}", "${SR_STEP_COMPLETED}", "${SR_STEP_SKIPPED}"
        `,
      },
    },
  },
};

/**
 * Touch target accessibility demo (44px minimum)
 */
export const TouchTargetAccessibility: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
  },
  parameters: {
    docs: {
      description: {
        story: `
**Touch Target Compliance (WCAG 2.5.5):**
- All interactive elements have minimum 44x44px touch targets on mobile
- Touch targets relax on larger screens (\`sm:\` breakpoint)
- Step rows use \`min-h-[44px]\` for touch accessibility

Classes used: \`min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0\`
        `,
      },
    },
  },
};

/**
 * Focus ring visibility demo
 */
export const FocusRingVisibility: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
  },
  parameters: {
    docs: {
      description: {
        story: `
**Focus Ring Visibility:**
- All interactive elements have visible focus rings
- Focus rings use \`focus-visible:ring-2\` for keyboard navigation
- Ring colors adapt to theme (\`ring-[rgb(var(--ring))]\`)

Try tabbing through the interface to see focus rings.
        `,
      },
    },
  },
};

/**
 * Reduced motion support demo
 */
export const ReducedMotionSupport: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
  },
  parameters: {
    docs: {
      description: {
        story: `
**Reduced Motion Support:**
- All animations use \`motion-safe:\` prefix
- Animations respect \`prefers-reduced-motion\` system setting
- Progress indicator uses \`motion-safe:animate-ping\`
- Transitions use \`motion-safe:transition-colors\`

Users who prefer reduced motion will see static alternatives.
        `,
      },
    },
  },
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

/**
 * Ref forwarding demo
 */
export const RefForwarding: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
    'data-testid': 'steps-panel-ref',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Ref Forwarding:**
All components support ref forwarding for programmatic access:
\`\`\`tsx
const ref = useRef<HTMLElement>(null);
<StepsPanel ref={ref} steps={steps} />
\`\`\`

Sub-components also support refs:
- \`StepsPanelSkeleton\` → \`HTMLDivElement\`
- \`StepsPanelError\` → \`HTMLDivElement\`
        `,
      },
    },
  },
};

/**
 * Data attributes demo
 */
export const DataAttributes: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
    'data-testid': 'steps-panel',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Data Attributes for Testing:**
- \`data-testid\`: Custom test identifier
- \`data-step-count\`: Number of steps
- \`data-completed-count\`: Number of completed steps
- \`data-disabled\`: When panel is disabled

Step items have additional attributes:
- \`data-step-index\`: Step index (0-based)
- \`data-step-status\`: Current status (pending, inprogress, completed, skipped)
- \`data-active\`: When step is active
        `,
      },
    },
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/**
 * Feature development workflow
 */
export const FeatureDevelopmentWorkflow: Story = {
  args: {
    steps: [
      {
        index: 0,
        name: 'Requirements Gathering',
        description:
          'Collect and document user stories, acceptance criteria, and technical requirements.',
        status: WorkflowStepStatus.Completed,
        chatId: 'chat-req',
      },
      {
        index: 1,
        name: 'Design Review',
        description:
          'Review UI/UX designs and provide feedback. Ensure designs meet accessibility standards.',
        status: WorkflowStepStatus.Completed,
        chatId: 'chat-design',
      },
      {
        index: 2,
        name: 'Implementation',
        description:
          'Build the feature following TDD principles. Write unit tests first, then implement.',
        status: WorkflowStepStatus.InProgress,
        chatId: 'chat-impl',
      },
      {
        index: 3,
        name: 'Integration Testing',
        description: 'Test the feature in integration with other system components.',
        status: WorkflowStepStatus.Pending,
      },
      {
        index: 4,
        name: 'Code Review',
        description: 'Submit PR for review. Address feedback and ensure code quality standards.',
        status: WorkflowStepStatus.Pending,
      },
      {
        index: 5,
        name: 'Deployment',
        description: 'Deploy to staging, run smoke tests, then deploy to production.',
        status: WorkflowStepStatus.Pending,
      },
    ],
    activeStepIndex: 2,
    autoStart: true,
  },
};

/**
 * Bug fix workflow
 */
export const BugFixWorkflow: Story = {
  args: {
    steps: [
      {
        index: 0,
        name: 'Reproduce Issue',
        description: 'Reproduce the bug locally and document the reproduction steps.',
        status: WorkflowStepStatus.Completed,
        chatId: 'chat-repro',
      },
      {
        index: 1,
        name: 'Root Cause Analysis',
        description: 'Investigate the code and identify the root cause of the issue.',
        status: WorkflowStepStatus.Completed,
        chatId: 'chat-rca',
      },
      {
        index: 2,
        name: 'Write Failing Test',
        description: 'Write a test that demonstrates the bug and fails.',
        status: WorkflowStepStatus.Completed,
        chatId: 'chat-test',
      },
      {
        index: 3,
        name: 'Fix Implementation',
        description: 'Implement the fix to make the test pass.',
        status: WorkflowStepStatus.InProgress,
        chatId: 'chat-fix',
      },
      {
        index: 4,
        name: 'Verify Fix',
        description: 'Run all tests and verify the fix works in all scenarios.',
        status: WorkflowStepStatus.Pending,
      },
    ],
    activeStepIndex: 3,
  },
};

/**
 * Documentation workflow
 */
export const DocumentationWorkflow: Story = {
  args: {
    steps: [
      {
        index: 0,
        name: 'Outline',
        description: 'Create a document outline with main sections and topics.',
        status: WorkflowStepStatus.Completed,
        chatId: 'chat-outline',
      },
      {
        index: 1,
        name: 'First Draft',
        description: 'Write the initial content for all sections.',
        status: WorkflowStepStatus.InProgress,
        chatId: 'chat-draft',
      },
      {
        index: 2,
        name: 'Technical Review',
        description: 'Have the documentation reviewed for technical accuracy.',
        status: WorkflowStepStatus.Pending,
      },
      {
        index: 3,
        name: 'Editorial Review',
        description: 'Review for grammar, style, and clarity.',
        status: WorkflowStepStatus.Pending,
      },
      {
        index: 4,
        name: 'Publish',
        description: 'Publish the documentation and update navigation.',
        status: WorkflowStepStatus.Pending,
      },
    ],
    activeStepIndex: 1,
    onAddStep: undefined, // No adding steps to a fixed workflow
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Constants reference - exported values for testing and customization
 */
export const ConstantsReference: Story = {
  args: {
    steps: sampleSteps,
    activeStepIndex: 2,
  },
  parameters: {
    docs: {
      description: {
        story: `
## Exported Constants

### Default Labels
| Constant | Value |
|----------|-------|
| \`DEFAULT_STEPS_PANEL_LABEL\` | "${DEFAULT_STEPS_PANEL_LABEL}" |
| \`DEFAULT_LOADING_LABEL\` | "${DEFAULT_LOADING_LABEL}" |
| \`DEFAULT_ADD_STEP_LABEL\` | "${DEFAULT_ADD_STEP_LABEL}" |
| \`DEFAULT_AUTO_START_LABEL\` | "${DEFAULT_AUTO_START_LABEL}" |
| \`DEFAULT_START_STEP_LABEL\` | "${DEFAULT_START_STEP_LABEL}" |
| \`DEFAULT_COMPLETE_STEP_LABEL\` | "${DEFAULT_COMPLETE_STEP_LABEL}" |
| \`DEFAULT_SKIP_STEP_LABEL\` | "${DEFAULT_SKIP_STEP_LABEL}" |
| \`DEFAULT_VIEW_CHAT_LABEL\` | "${DEFAULT_VIEW_CHAT_LABEL}" |
| \`DEFAULT_EXPAND_LABEL\` | "${DEFAULT_EXPAND_LABEL}" |
| \`DEFAULT_COLLAPSE_LABEL\` | "${DEFAULT_COLLAPSE_LABEL}" |

### Error State Labels
| Constant | Value |
|----------|-------|
| \`DEFAULT_ERROR_TITLE\` | "${DEFAULT_ERROR_TITLE}" |
| \`DEFAULT_ERROR_MESSAGE\` | "${DEFAULT_ERROR_MESSAGE}" |
| \`DEFAULT_RETRY_LABEL\` | "${DEFAULT_RETRY_LABEL}" |

### Screen Reader Announcements
| Constant | Value |
|----------|-------|
| \`SR_STEP_SELECTED\` | "${SR_STEP_SELECTED}" |
| \`SR_STEP_EXPANDED\` | "${SR_STEP_EXPANDED}" |
| \`SR_STEP_COLLAPSED\` | "${SR_STEP_COLLAPSED}" |
| \`SR_STEP_STARTED\` | "${SR_STEP_STARTED}" |
| \`SR_STEP_COMPLETED\` | "${SR_STEP_COMPLETED}" |
| \`SR_STEP_SKIPPED\` | "${SR_STEP_SKIPPED}" |
| \`SR_STEP_TOGGLED\` | "${SR_STEP_TOGGLED}" |

### Configuration
| Constant | Value |
|----------|-------|
| \`DEFAULT_SKELETON_COUNT\` | ${DEFAULT_SKELETON_COUNT} |

### Utility Functions
- \`getStepIcon(status)\` - Get icon component for step status
- \`getStatusLabel(status)\` - Get human-readable status label
- \`getBaseSize(size)\` - Get base size from responsive value
- \`getResponsiveSizeClasses(size, classMap)\` - Generate responsive classes
- \`buildStepAccessibleLabel(index, name, status)\` - Build accessible label
- \`buildStepActionAnnouncement(action, stepName)\` - Build screen reader announcement
- \`getProgressSummary(completed, total)\` - Get progress text

### CSS Class Constants
Size classes, base classes, and state classes are exported for testing and customization.
See the source code for the full list.
        `,
      },
    },
  },
};
