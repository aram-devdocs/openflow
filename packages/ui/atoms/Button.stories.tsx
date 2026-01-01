import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Button component with multiple variants, loading state, and full accessibility support.

## Features
- **Responsive sizing** - Supports responsive values for size prop
- **Touch targets** - Minimum 44px height on touch devices (WCAG 2.5.5)
- **Focus ring** - Visible ring with offset for all backgrounds
- **Loading state** - Spinner with screen reader announcement
- **Icon support** - Leading and trailing icon slots
- **Full width** - Optional full-width mode

## Accessibility
- \`aria-busy\` during loading state
- \`aria-disabled\` reflects disabled/loading
- Screen readers announce "Loading" during loading
- Focus ring uses ring-offset for visibility
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive'],
      description: 'Visual style variant',
      table: {
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button - supports responsive values',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner and disable interactions',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    loadingText: {
      control: 'text',
      description: 'Text to show while loading (replaces children)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make button full width',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// ============================================================================
// Basic Variants
// ============================================================================

/** Default button with primary variant */
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
  },
};

/** Primary variant - main call to action */
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

/** Secondary variant - alternative action */
export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

/** Ghost variant - subtle action */
export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

/** Destructive variant - dangerous action */
export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
  },
};

/** All variants displayed together */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button variants side by side for comparison.',
      },
    },
  },
};

// ============================================================================
// Sizes
// ============================================================================

/** Small size button */
export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
};

/** Medium size button (default) */
export const Medium: Story = {
  args: {
    children: 'Medium',
    size: 'md',
  },
};

/** Large size button */
export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg',
  },
};

/** All sizes displayed together */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button sizes. Note: Small and medium have 44px min-height on touch devices.',
      },
    },
  },
};

// ============================================================================
// Responsive Sizing
// ============================================================================

/** Responsive size - changes at breakpoints */
export const ResponsiveSize: Story = {
  args: {
    children: 'Responsive Button',
    size: { base: 'sm', md: 'md', lg: 'lg' },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Button size changes at different breakpoints: sm on mobile, md on tablet, lg on desktop.',
      },
    },
  },
};

/** Responsive size comparison */
export const ResponsiveSizeComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Fixed size (always medium):</p>
        <Button size="md">Fixed Medium</Button>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Responsive (sm → md → lg):</p>
        <Button size={{ base: 'sm', md: 'md', lg: 'lg' }}>Responsive</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compare fixed vs responsive sizing. Resize your browser to see the difference.',
      },
    },
  },
};

// ============================================================================
// Loading States
// ============================================================================

/** Loading state with spinner */
export const Loading: Story = {
  args: {
    children: 'Submit',
    loading: true,
  },
};

/** Loading with custom text */
export const LoadingWithText: Story = {
  args: {
    children: 'Submit',
    loading: true,
    loadingText: 'Saving...',
  },
  parameters: {
    docs: {
      description: {
        story: 'When loading, the button shows the loadingText instead of children.',
      },
    },
  },
};

/** Loading state across variants */
export const LoadingVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary" loading>
        Primary
      </Button>
      <Button variant="secondary" loading>
        Secondary
      </Button>
      <Button variant="ghost" loading>
        Ghost
      </Button>
      <Button variant="destructive" loading>
        Destructive
      </Button>
    </div>
  ),
};

/** Loading state across sizes */
export const LoadingSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm" loading>
        Small
      </Button>
      <Button size="md" loading>
        Medium
      </Button>
      <Button size="lg" loading>
        Large
      </Button>
    </div>
  ),
};

// ============================================================================
// Disabled States
// ============================================================================

/** Disabled state */
export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

/** Disabled state across variants */
export const DisabledVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary" disabled>
        Primary
      </Button>
      <Button variant="secondary" disabled>
        Secondary
      </Button>
      <Button variant="ghost" disabled>
        Ghost
      </Button>
      <Button variant="destructive" disabled>
        Destructive
      </Button>
    </div>
  ),
};

// ============================================================================
// Icons
// ============================================================================

/** Button with leading icon */
export const WithIcon: Story = {
  args: {
    children: 'Add Item',
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden={true}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
};

/** Button with trailing icon */
export const WithIconAfter: Story = {
  args: {
    children: 'Next',
    iconAfter: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden={true}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    ),
  },
};

/** Button with both icons */
export const WithBothIcons: Story = {
  args: {
    children: 'Settings',
    icon: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden={true}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    iconAfter: (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden={true}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    ),
  },
};

/** Icon buttons across sizes */
export const IconButtonSizes: Story = {
  render: () => {
    const PlusIcon = ({ className }: { className?: string }) => (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden={true}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    );

    return (
      <div className="flex items-center gap-4">
        <Button size="sm" icon={<PlusIcon className="h-3 w-3" />}>
          Small
        </Button>
        <Button size="md" icon={<PlusIcon className="h-4 w-4" />}>
          Medium
        </Button>
        <Button size="lg" icon={<PlusIcon className="h-5 w-5" />}>
          Large
        </Button>
      </div>
    );
  },
};

// ============================================================================
// Full Width
// ============================================================================

/** Full width button */
export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

/** Full width with loading */
export const FullWidthLoading: Story = {
  args: {
    children: 'Submit',
    fullWidth: true,
    loading: true,
    loadingText: 'Processing...',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

// ============================================================================
// Focus States
// ============================================================================

/** Focus ring demonstration */
export const FocusRing: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="p-4 bg-background">
        <p className="text-sm text-muted-foreground mb-2">On light background:</p>
        <div className="flex gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </div>
      <div className="p-4 bg-slate-900 rounded">
        <p className="text-sm text-slate-400 mb-2">On dark background:</p>
        <div className="flex gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="ghost" className="text-white hover:bg-slate-800">
            Ghost
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Focus ring uses ring-offset-2 to ensure visibility on all backgrounds. Tab through buttons to see the focus ring.',
      },
    },
  },
};

// ============================================================================
// Touch Target Accessibility
// ============================================================================

/** Touch target demonstration */
export const TouchTargets: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        On touch devices, all buttons have a minimum height of 44px for WCAG 2.5.5 compliance. On
        desktop, they use their natural heights.
      </p>
      <div className="flex items-center gap-4 p-2 bg-muted/30 rounded">
        <div className="text-xs text-muted-foreground">44px guide →</div>
        <div className="h-11 border-l-2 border-dashed border-muted-foreground/50" />
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All buttons meet WCAG 2.5.5 touch target requirements (44px minimum on touch devices).',
      },
    },
  },
};

// ============================================================================
// Accessibility States
// ============================================================================

/** Screen reader accessibility */
export const ScreenReaderDemo: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Screen readers will announce "Loading" when buttons are in loading state. The button also
        has aria-busy and aria-disabled attributes.
      </p>
      <div className="flex gap-4">
        <Button>Normal Button</Button>
        <Button loading loadingText="Saving...">
          Save
        </Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="text-xs font-mono text-muted-foreground">
        <p>Normal: role="button"</p>
        <p>Loading: aria-busy={true} aria-disabled="true"</p>
        <p>Disabled: disabled aria-disabled="true"</p>
      </div>
    </div>
  ),
};

// ============================================================================
// Type Attribute
// ============================================================================

/** Button types */
export const ButtonTypes: Story = {
  render: () => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        alert('Form submitted!');
      }}
      className="flex gap-4"
    >
      <Button type="button">Button (no submit)</Button>
      <Button type="submit" variant="primary">
        Submit
      </Button>
      <Button type="reset" variant="secondary">
        Reset
      </Button>
    </form>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button supports type="button" (default), type="submit", and type="reset".',
      },
    },
  },
};

// ============================================================================
// Real-world Examples
// ============================================================================

/** Form submit button */
export const FormSubmit: Story = {
  render: () => {
    return (
      <form className="w-80 flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <input type="text" placeholder="Enter your email" className="px-3 py-2 border rounded-md" />
        <Button type="submit" fullWidth>
          Subscribe
        </Button>
      </form>
    );
  },
};

/** Dialog action buttons */
export const DialogActions: Story = {
  render: () => (
    <div className="flex justify-end gap-2 pt-4 border-t">
      <Button variant="ghost">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </div>
  ),
};

/** Button group */
export const ButtonGroup: Story = {
  render: () => (
    <div className="inline-flex rounded-md shadow-sm">
      <Button variant="secondary" className="rounded-r-none border-r-0">
        Previous
      </Button>
      <Button variant="secondary" className="rounded-none border-x">
        Current
      </Button>
      <Button variant="secondary" className="rounded-l-none border-l-0">
        Next
      </Button>
    </div>
  ),
};

/** Loading workflow */
export const LoadingWorkflow: Story = {
  render: function LoadingWorkflow() {
    return (
      <div className="flex flex-col gap-4 items-start">
        <p className="text-sm text-muted-foreground">Simulated async workflow:</p>
        <Button>Idle</Button>
        <Button loading loadingText="Saving...">
          Save Changes
        </Button>
        <Button disabled>Saved!</Button>
      </div>
    );
  },
};

/** Custom className */
export const CustomClass: Story = {
  args: {
    children: 'Wide Button',
    className: 'w-48',
  },
};
