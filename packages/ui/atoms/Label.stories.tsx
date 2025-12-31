/**
 * Label Component Stories
 *
 * Comprehensive Storybook stories demonstrating:
 * - All sizes (xs, sm, base, lg)
 * - Required field indicators
 * - Disabled states
 * - Responsive sizing
 * - Description text
 * - Custom required indicators
 * - Form field associations
 * - Accessibility demos
 */

import { Flex, Stack } from '@openflow/primitives';
import type { Meta, StoryObj } from '@storybook/react';
import { AlertCircle, Asterisk } from 'lucide-react';
import { Input } from './Input';
import { Label } from './Label';

const meta: Meta<typeof Label> = {
  title: 'Atoms/Label',
  component: Label,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Semantic form label component with required indicator support, responsive sizing, and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'base', 'lg'],
      description: 'Text size (supports responsive values)',
    },
    required: {
      control: 'boolean',
      description: 'Show required indicator (*)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable styling for associated disabled input',
    },
    htmlFor: {
      control: 'text',
      description: 'ID of the associated input element',
    },
    description: {
      control: 'text',
      description: 'Optional description text shown below the label',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

// =============================================================================
// Basic Stories
// =============================================================================

/** Default label with standard styling */
export const Default: Story = {
  args: {
    children: 'Email Address',
    htmlFor: 'email',
  },
};

/** Label with required indicator */
export const Required: Story = {
  args: {
    children: 'Full Name',
    htmlFor: 'name',
    required: true,
  },
};

/** Disabled label styling */
export const Disabled: Story = {
  args: {
    children: 'Disabled Field',
    htmlFor: 'disabled-field',
    disabled: true,
  },
};

/** Required and disabled combination */
export const RequiredDisabled: Story = {
  args: {
    children: 'Required but Disabled',
    htmlFor: 'required-disabled',
    required: true,
    disabled: true,
  },
};

// =============================================================================
// Size Variants
// =============================================================================

/** Extra small label text */
export const SizeXs: Story = {
  args: {
    children: 'Extra Small Label',
    htmlFor: 'xs-field',
    size: 'xs',
  },
};

/** Small label text (default) */
export const SizeSm: Story = {
  args: {
    children: 'Small Label',
    htmlFor: 'sm-field',
    size: 'sm',
  },
};

/** Base size label text */
export const SizeBase: Story = {
  args: {
    children: 'Base Size Label',
    htmlFor: 'base-field',
    size: 'base',
  },
};

/** Large label text */
export const SizeLg: Story = {
  args: {
    children: 'Large Label',
    htmlFor: 'lg-field',
    size: 'lg',
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <Stack gap="4">
      <Label htmlFor="size-xs" size="xs">
        Extra Small (xs)
      </Label>
      <Label htmlFor="size-sm" size="sm">
        Small (sm) - Default
      </Label>
      <Label htmlFor="size-base" size="base">
        Base Size (base)
      </Label>
      <Label htmlFor="size-lg" size="lg">
        Large (lg)
      </Label>
    </Stack>
  ),
};

// =============================================================================
// Responsive Sizing
// =============================================================================

/** Responsive label that changes size at breakpoints */
export const ResponsiveSize: Story = {
  args: {
    children: 'Responsive Label (resize window)',
    htmlFor: 'responsive-field',
    size: { base: 'sm', md: 'base', lg: 'lg' },
  },
  parameters: {
    docs: {
      description: {
        story:
          'This label grows from small on mobile to large on desktop. Resize the viewport to see the effect.',
      },
    },
  },
};

/** Multiple responsive labels demonstrating different configurations */
export const ResponsiveComparison: Story = {
  render: () => (
    <Stack gap="4" className="w-full">
      <Label htmlFor="resp-1" size={{ base: 'xs', md: 'sm', lg: 'base' }}>
        Subtle (xs → sm → base)
      </Label>
      <Label htmlFor="resp-2" size={{ base: 'sm', lg: 'lg' }}>
        Standard (sm → lg)
      </Label>
      <Label htmlFor="resp-3" size={{ base: 'base', md: 'lg' }}>
        Prominent (base → lg)
      </Label>
    </Stack>
  ),
};

// =============================================================================
// Description Text
// =============================================================================

/** Label with description text */
export const WithDescription: Story = {
  args: {
    children: 'Password',
    htmlFor: 'password',
    required: true,
    description: 'Must be at least 8 characters',
    descriptionId: 'password-desc',
  },
};

/** Multiple labels with descriptions */
export const DescriptionExamples: Story = {
  render: () => (
    <Stack gap="6" className="w-80">
      <Stack gap="1.5">
        <Label
          htmlFor="email-desc"
          required
          description="We'll never share your email"
          descriptionId="email-description"
        >
          Email
        </Label>
        <Input
          id="email-desc"
          type="email"
          aria-describedby="email-description"
          placeholder="you@example.com"
        />
      </Stack>
      <Stack gap="1.5">
        <Label
          htmlFor="username-desc"
          required
          description="3-20 characters, letters and numbers only"
          descriptionId="username-description"
        >
          Username
        </Label>
        <Input id="username-desc" aria-describedby="username-description" placeholder="johndoe" />
      </Stack>
    </Stack>
  ),
};

// =============================================================================
// Custom Required Indicators
// =============================================================================

/** Custom icon as required indicator */
export const CustomRequiredIndicator: Story = {
  args: {
    children: 'Custom Indicator',
    htmlFor: 'custom-required',
    required: true,
    requiredIndicator: (
      <Asterisk
        className="ml-0.5 inline h-3 w-3 text-[rgb(var(--destructive))]"
        aria-hidden="true"
      />
    ),
  },
};

/** Alert icon as required indicator */
export const AlertRequiredIndicator: Story = {
  args: {
    children: 'Urgent Field',
    htmlFor: 'urgent-field',
    required: true,
    requiredIndicator: (
      <AlertCircle
        className="ml-1 inline h-3.5 w-3.5 text-[rgb(var(--destructive))]"
        aria-hidden="true"
      />
    ),
  },
};

/** Text as required indicator */
export const TextRequiredIndicator: Story = {
  args: {
    children: 'Required Field',
    htmlFor: 'text-required',
    required: true,
    requiredIndicator: (
      <span className="ml-1 text-xs text-[rgb(var(--muted-foreground))]" aria-hidden="true">
        (required)
      </span>
    ),
  },
};

// =============================================================================
// Form Field Integration
// =============================================================================

/** Label with basic input */
export const WithInput: Story = {
  render: () => (
    <Stack gap="1.5" className="w-64">
      <Label htmlFor="demo-email">Email Address</Label>
      <Input id="demo-email" type="email" placeholder="you@example.com" />
    </Stack>
  ),
};

/** Required label with input */
export const RequiredWithInput: Story = {
  render: () => (
    <Stack gap="1.5" className="w-64">
      <Label htmlFor="demo-name" required>
        Full Name
      </Label>
      <Input id="demo-name" type="text" placeholder="John Doe" required />
    </Stack>
  ),
};

/** Disabled label with disabled input */
export const DisabledWithInput: Story = {
  render: () => (
    <Stack gap="1.5" className="w-64">
      <Label htmlFor="demo-disabled" disabled>
        Read Only
      </Label>
      <Input id="demo-disabled" type="text" defaultValue="Cannot edit this" disabled />
    </Stack>
  ),
};

/** Complete form field showcase */
export const FormFields: Story = {
  render: () => (
    <Stack gap="4" className="w-64">
      <Stack gap="1.5">
        <Label htmlFor="field-1" required>
          First Name
        </Label>
        <Input id="field-1" type="text" placeholder="Enter first name" />
      </Stack>
      <Stack gap="1.5">
        <Label htmlFor="field-2" required>
          Last Name
        </Label>
        <Input id="field-2" type="text" placeholder="Enter last name" />
      </Stack>
      <Stack gap="1.5">
        <Label htmlFor="field-3">Phone (optional)</Label>
        <Input id="field-3" type="tel" placeholder="(555) 123-4567" />
      </Stack>
      <Stack gap="1.5">
        <Label htmlFor="field-4" disabled>
          Account ID
        </Label>
        <Input id="field-4" type="text" defaultValue="ACC-12345" disabled />
      </Stack>
    </Stack>
  ),
};

// =============================================================================
// State Combinations
// =============================================================================

/** All label states in one view */
export const AllStates: Story = {
  render: () => (
    <Stack gap="4">
      <Label htmlFor="state-1">Default Label</Label>
      <Label htmlFor="state-2" required>
        Required Label
      </Label>
      <Label htmlFor="state-3" disabled>
        Disabled Label
      </Label>
      <Label htmlFor="state-4" required disabled>
        Required Disabled Label
      </Label>
    </Stack>
  ),
};

/** Long label text */
export const LongLabel: Story = {
  args: {
    children:
      'Please enter your complete mailing address including street, city, state, and ZIP code',
    htmlFor: 'address',
  },
};

/** Truncated long label */
export const TruncatedLabel: Story = {
  render: () => (
    <div className="w-48">
      <Label htmlFor="truncated" className="truncate block">
        This is a very long label that should be truncated when it exceeds the container width
      </Label>
    </div>
  ),
};

// =============================================================================
// Horizontal Layout
// =============================================================================

/** Inline label and input */
export const InlineLayout: Story = {
  render: () => (
    <Flex align="center" gap="3">
      <Label htmlFor="inline-input" className="shrink-0">
        Username:
      </Label>
      <Input id="inline-input" type="text" placeholder="Enter username" className="flex-1" />
    </Flex>
  ),
};

/** Multiple inline fields */
export const InlineFormFields: Story = {
  render: () => (
    <Stack gap="4">
      <Flex align="center" gap="3">
        <Label htmlFor="inline-1" className="w-24 shrink-0" required>
          First Name
        </Label>
        <Input id="inline-1" type="text" placeholder="John" className="flex-1" />
      </Flex>
      <Flex align="center" gap="3">
        <Label htmlFor="inline-2" className="w-24 shrink-0" required>
          Last Name
        </Label>
        <Input id="inline-2" type="text" placeholder="Doe" className="flex-1" />
      </Flex>
      <Flex align="center" gap="3">
        <Label htmlFor="inline-3" className="w-24 shrink-0">
          Phone
        </Label>
        <Input id="inline-3" type="tel" placeholder="555-1234" className="flex-1" />
      </Flex>
    </Stack>
  ),
};

// =============================================================================
// Data Attributes
// =============================================================================

/** Label with data-testid */
export const WithTestId: Story = {
  args: {
    children: 'Email Address',
    htmlFor: 'email-testid',
    'data-testid': 'email-label',
    required: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Label with data-testid attribute for automated testing.',
      },
    },
  },
};

// =============================================================================
// Ref Forwarding
// =============================================================================

/** Demonstrating ref forwarding */
export const RefForwarding: Story = {
  render: () => {
    return (
      <Stack gap="1.5" className="w-64">
        <Label
          htmlFor="ref-demo"
          // In a real component, you would use useRef here
          // ref={labelRef}
        >
          Click me to focus input
        </Label>
        <Input id="ref-demo" type="text" placeholder="Focus on label click" />
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Label supports ref forwarding for direct DOM access. Clicking the label focuses the associated input.',
      },
    },
  },
};

// =============================================================================
// Accessibility Demos
// =============================================================================

/** Screen reader accessibility demo */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <Stack gap="4" className="w-80">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">Use a screen reader to verify:</p>
      <Stack gap="1.5">
        <Label htmlFor="a11y-required" required>
          Email Address
        </Label>
        <Input id="a11y-required" type="email" placeholder="you@example.com" />
        <p className="text-xs text-[rgb(var(--muted-foreground))]">
          Screen reader announces: "Email Address (required)"
        </p>
      </Stack>
      <Stack gap="1.5">
        <Label
          htmlFor="a11y-described"
          required
          description="Enter a valid email address"
          descriptionId="a11y-email-desc"
        >
          Work Email
        </Label>
        <Input
          id="a11y-described"
          type="email"
          aria-describedby="a11y-email-desc"
          placeholder="work@company.com"
        />
        <p className="text-xs text-[rgb(var(--muted-foreground))]">
          Screen reader announces label and description together
        </p>
      </Stack>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates how screen readers announce required fields and descriptions for accessibility.',
      },
    },
  },
};

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => (
    <Stack gap="4" className="w-80">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Tab through the form to test keyboard navigation:
      </p>
      <Stack gap="4">
        <Stack gap="1.5">
          <Label htmlFor="kb-1" required>
            First Field
          </Label>
          <Input id="kb-1" type="text" placeholder="Press Tab to continue" />
        </Stack>
        <Stack gap="1.5">
          <Label htmlFor="kb-2" required>
            Second Field
          </Label>
          <Input id="kb-2" type="text" placeholder="Tab navigates between fields" />
        </Stack>
        <Stack gap="1.5">
          <Label htmlFor="kb-3">Third Field (optional)</Label>
          <Input id="kb-3" type="text" placeholder="Click label to focus" />
        </Stack>
      </Stack>
    </Stack>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Clicking a label automatically focuses its associated input. Tab navigation moves between form fields.',
      },
    },
  },
};

// =============================================================================
// Real-World Examples
// =============================================================================

/** Login form example */
export const LoginForm: Story = {
  render: () => (
    <Stack gap="4" className="w-72 rounded-lg border border-[rgb(var(--border))] p-6">
      <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Sign In</h2>
      <Stack gap="4">
        <Stack gap="1.5">
          <Label htmlFor="login-email" required>
            Email
          </Label>
          <Input id="login-email" type="email" placeholder="you@example.com" />
        </Stack>
        <Stack gap="1.5">
          <Label htmlFor="login-password" required>
            Password
          </Label>
          <Input id="login-password" type="password" placeholder="Enter password" />
        </Stack>
        <button
          type="button"
          className="mt-2 rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[rgb(var(--primary-foreground))] hover:bg-[rgb(var(--primary))]/90"
        >
          Sign In
        </button>
      </Stack>
    </Stack>
  ),
};

/** Settings panel example */
export const SettingsPanel: Story = {
  render: () => (
    <Stack gap="6" className="w-80 rounded-lg border border-[rgb(var(--border))] p-6">
      <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Account Settings</h2>
      <Stack gap="4">
        <Stack gap="1.5">
          <Label
            htmlFor="settings-display"
            description="This will be shown publicly"
            descriptionId="display-desc"
          >
            Display Name
          </Label>
          <Input
            id="settings-display"
            type="text"
            defaultValue="John Doe"
            aria-describedby="display-desc"
          />
        </Stack>
        <Stack gap="1.5">
          <Label
            htmlFor="settings-bio"
            description="Brief description for your profile (max 160 characters)"
            descriptionId="bio-desc"
          >
            Bio
          </Label>
          <Input
            id="settings-bio"
            type="text"
            placeholder="Tell us about yourself"
            aria-describedby="bio-desc"
          />
        </Stack>
        <Stack gap="1.5">
          <Label htmlFor="settings-id" disabled>
            Account ID
          </Label>
          <Input id="settings-id" type="text" defaultValue="user_12345abc" disabled />
        </Stack>
      </Stack>
    </Stack>
  ),
};

/** Filter form example */
export const FilterForm: Story = {
  render: () => (
    <Flex gap="4" wrap="wrap" className="rounded-lg bg-[rgb(var(--muted))] p-4">
      <Stack gap="1.5">
        <Label htmlFor="filter-status" size="xs">
          Status
        </Label>
        <select
          id="filter-status"
          className="rounded border border-[rgb(var(--input))] bg-[rgb(var(--background))] px-3 py-1.5 text-sm"
        >
          <option>All</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </Stack>
      <Stack gap="1.5">
        <Label htmlFor="filter-date" size="xs">
          Date Range
        </Label>
        <select
          id="filter-date"
          className="rounded border border-[rgb(var(--input))] bg-[rgb(var(--background))] px-3 py-1.5 text-sm"
        >
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
      </Stack>
      <Stack gap="1.5">
        <Label htmlFor="filter-search" size="xs">
          Search
        </Label>
        <Input
          id="filter-search"
          type="search"
          placeholder="Filter..."
          size="sm"
          className="w-40"
        />
      </Stack>
    </Flex>
  ),
};
