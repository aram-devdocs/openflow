import { TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  Info as InfoIcon,
  XCircle,
} from 'lucide-react';
import { Badge, taskStatusToLabel, taskStatusToVariant } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Badge component for displaying status and labels.

## Accessibility Features
- Uses Text primitive from @openflow/primitives
- Screen reader support via \`isStatus\` prop (announces "Status: {text}")
- Icon support to convey meaning beyond color (WCAG 1.4.1)
- Color contrast meets WCAG 2.1 AA requirements (≥4.5:1)
- Not interactive (no button/link semantics)

## Responsive Sizing
Supports responsive sizes via object notation:
\`\`\`tsx
<Badge size={{ base: 'sm', md: 'md', lg: 'lg' }}>Responsive</Badge>
\`\`\`
        `,
      },
    },
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
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Badge size - supports responsive values',
    },
    isStatus: {
      control: 'boolean',
      description: 'Whether to announce as status for screen readers',
    },
    icon: {
      control: false,
      description: 'Optional icon for conveying meaning beyond color',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

// =============================================================================
// Basic Variants
// =============================================================================

/** Default badge with neutral styling */
export const Default: Story = {
  args: {
    children: 'Badge',
    variant: 'default',
    size: 'md',
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
export const ErrorState: Story = {
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

// =============================================================================
// Size Variants
// =============================================================================

/** Small badge size */
export const Small: Story = {
  args: {
    children: 'Small',
    variant: 'default',
    size: 'sm',
  },
};

/** Medium badge size (default) */
export const Medium: Story = {
  args: {
    children: 'Medium',
    variant: 'default',
    size: 'md',
  },
};

/** Large badge size */
export const Large: Story = {
  args: {
    children: 'Large',
    variant: 'default',
    size: 'lg',
  },
};

/** All size variants displayed together */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

// =============================================================================
// Responsive Sizing
// =============================================================================

/** Badge with responsive sizing - grows on larger screens */
export const ResponsiveSize: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Resize the viewport to see the badge size change
      </p>
      <Badge size={{ base: 'sm', md: 'md', lg: 'lg' }}>Responsive Badge</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badge sizes can be responsive using object notation with breakpoints.',
      },
    },
  },
};

// =============================================================================
// All Variants Overview
// =============================================================================

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

// =============================================================================
// Task Status Variants
// =============================================================================

/** Task status: To Do */
export const StatusTodo: Story = {
  args: {
    children: 'To Do',
    variant: 'todo',
    isStatus: true,
  },
};

/** Task status: In Progress */
export const StatusInProgress: Story = {
  args: {
    children: 'In Progress',
    variant: 'inprogress',
    isStatus: true,
  },
};

/** Task status: In Review */
export const StatusInReview: Story = {
  args: {
    children: 'In Review',
    variant: 'inreview',
    isStatus: true,
  },
};

/** Task status: Done */
export const StatusDone: Story = {
  args: {
    children: 'Done',
    variant: 'done',
    isStatus: true,
  },
};

/** Task status: Cancelled */
export const StatusCancelled: Story = {
  args: {
    children: 'Cancelled',
    variant: 'cancelled',
    isStatus: true,
  },
};

/** All task status variants displayed together */
export const AllTaskStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="todo" isStatus>
        To Do
      </Badge>
      <Badge variant="inprogress" isStatus>
        In Progress
      </Badge>
      <Badge variant="inreview" isStatus>
        In Review
      </Badge>
      <Badge variant="done" isStatus>
        Done
      </Badge>
      <Badge variant="cancelled" isStatus>
        Cancelled
      </Badge>
    </div>
  ),
};

// =============================================================================
// With Icons (Accessibility Enhancement)
// =============================================================================

/** Badge with icon for color-blind accessibility */
export const WithIcon: Story = {
  args: {
    children: 'Success',
    variant: 'success',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Icons help convey meaning beyond color, meeting WCAG 1.4.1 (Use of Color) requirements.',
      },
    },
  },
};

/** All variants with icons for accessibility */
export const AllVariantsWithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success" icon={<CheckCircle2 className="h-3 w-3" />}>
        Success
      </Badge>
      <Badge variant="warning" icon={<AlertTriangle className="h-3 w-3" />}>
        Warning
      </Badge>
      <Badge variant="error" icon={<XCircle className="h-3 w-3" />}>
        Error
      </Badge>
      <Badge variant="info" icon={<InfoIcon className="h-3 w-3" />}>
        Info
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Using icons with badges ensures that status is conveyed through multiple means, not just color.',
      },
    },
  },
};

/** Task statuses with icons for full accessibility */
export const TaskStatusesWithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="todo" icon={<Circle className="h-3 w-3" />} isStatus>
        To Do
      </Badge>
      <Badge variant="inprogress" icon={<Clock className="h-3 w-3" />} isStatus>
        In Progress
      </Badge>
      <Badge variant="inreview" icon={<Eye className="h-3 w-3" />} isStatus>
        In Review
      </Badge>
      <Badge variant="done" icon={<CheckCircle2 className="h-3 w-3" />} isStatus>
        Done
      </Badge>
      <Badge variant="cancelled" icon={<XCircle className="h-3 w-3" />} isStatus>
        Cancelled
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Complete accessibility pattern: isStatus for screen readers + icon for visual distinction beyond color.',
      },
    },
  },
};

// =============================================================================
// With TaskStatus Enum
// =============================================================================

/** Example using helper functions with TaskStatus enum */
export const WithTaskStatusEnum: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {[
        TaskStatus.Todo,
        TaskStatus.Inprogress,
        TaskStatus.Inreview,
        TaskStatus.Done,
        TaskStatus.Cancelled,
      ].map((status) => (
        <Badge key={status} variant={taskStatusToVariant(status)} isStatus>
          {taskStatusToLabel(status)}
        </Badge>
      ))}
    </div>
  ),
};

// =============================================================================
// Edge Cases
// =============================================================================

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

/** Badge with custom aria-label */
export const WithAriaLabel: Story = {
  args: {
    children: 'P1',
    variant: 'error',
    'aria-label': 'Priority 1 - Critical',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Custom aria-label provides additional context for screen readers when the visible text is abbreviated.',
      },
    },
  },
};

/** Badge with data-testid for testing */
export const WithTestId: Story = {
  args: {
    children: 'Testable',
    variant: 'default',
    'data-testid': 'badge-test',
  },
};

// =============================================================================
// Accessibility Demo
// =============================================================================

/** Complete accessibility demonstration */
export const AccessibilityDemo: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Screen Reader Announcements</h3>
        <div className="flex gap-2">
          <Badge variant="inprogress" isStatus>
            In Progress
          </Badge>
          <span className="text-xs text-muted-foreground">
            → announces as &ldquo;Status: In Progress&rdquo;
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Color + Icon (WCAG 1.4.1)</h3>
        <div className="flex gap-2">
          <Badge variant="error" icon={<AlertCircle className="h-3 w-3" />}>
            Error
          </Badge>
          <span className="text-xs text-muted-foreground">
            → meaning conveyed by both color and icon
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Custom Aria Label</h3>
        <div className="flex gap-2">
          <Badge variant="error" aria-label="Priority 1 - Critical">
            P1
          </Badge>
          <span className="text-xs text-muted-foreground">
            → announces as &ldquo;Priority 1 - Critical&rdquo;
          </span>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates all accessibility features of the Badge component.',
      },
    },
  },
};

// =============================================================================
// Responsive Behavior Demo
// =============================================================================

/** Demonstrates all responsive breakpoints */
export const ResponsiveBreakpointsDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Resize the viewport to see badges at different sizes
      </p>

      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">base: sm → md: md → lg: lg</div>
        <Badge size={{ base: 'sm', md: 'md', lg: 'lg' }} variant="info">
          Grows with viewport
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">base: lg → md: md → lg: sm</div>
        <Badge size={{ base: 'lg', md: 'md', lg: 'sm' }} variant="warning">
          Shrinks with viewport
        </Badge>
      </div>
    </div>
  ),
};
