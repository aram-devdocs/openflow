import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { Checkbox } from '../atoms/Checkbox';
import { Input } from '../atoms/Input';
import { Textarea } from '../atoms/Textarea';
import {
  ERROR_TEXT_CLASSES,
  FORM_FIELD_BASE_CLASSES,
  FORM_FIELD_SPACING_CLASSES,
  FormField,
  HELPER_TEXT_CLASSES,
  getBaseSpacing,
  getResponsiveSpacingClasses,
} from './FormField';

const meta: Meta<typeof FormField> = {
  title: 'Molecules/FormField',
  component: FormField,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
FormField combines a Label atom with any form input and provides:

- **Label-Input Association**: Automatically links label to input via htmlFor/id
- **Error Messaging**: Error messages with \`role="alert"\` for screen reader announcement
- **Helper Text**: Contextual helper text that hides when errors are present
- **Required Indicator**: Visual and screen reader support for required fields
- **Responsive Spacing**: Configurable gap between elements
- **Accessibility**: Screen reader announcements for error state changes

### Accessibility Pattern

For proper accessibility, the input should include:
- \`id\` matching the FormField's \`htmlFor\`
- \`aria-required="true"\` for required fields
- \`aria-describedby\` pointing to helper/error message IDs (format: \`{id}-helper\` or \`{id}-error\`)
- \`error\` prop on Input when FormField has an error

### Exported Utilities

- \`getBaseSpacing\`: Get base spacing value from responsive prop
- \`getResponsiveSpacingClasses\`: Generate responsive spacing classes
- \`FORM_FIELD_BASE_CLASSES\`: Base container classes
- \`FORM_FIELD_SPACING_CLASSES\`: Spacing size class mapping
- \`HELPER_TEXT_CLASSES\`: Helper text styling classes
- \`ERROR_TEXT_CLASSES\`: Error text styling classes
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text for the field',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    required: {
      control: 'boolean',
      description: 'Mark field as required',
    },
    helperText: {
      control: 'text',
      description: 'Additional helper text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the field',
    },
    labelSize: {
      control: 'select',
      options: ['xs', 'sm', 'base', 'lg'],
      description: 'Label text size (responsive)',
    },
    spacing: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Gap between elements (responsive)',
    },
    htmlFor: {
      control: 'text',
      description: 'ID for label-input association',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FormField>;

// =============================================================================
// Basic Examples
// =============================================================================

/** Default form field with text input */
export const Default: Story = {
  args: {
    label: 'Username',
    htmlFor: 'username',
    children: <Input id="username" placeholder="Enter username" />,
  },
};

/** Required form field with asterisk indicator */
export const Required: Story = {
  args: {
    label: 'Email',
    htmlFor: 'email',
    required: true,
    children: <Input id="email" type="email" placeholder="you@example.com" aria-required="true" />,
  },
};

/** Form field with helper text for context */
export const WithHelperText: Story = {
  args: {
    label: 'Password',
    htmlFor: 'password',
    required: true,
    helperText: 'Must be at least 8 characters',
    children: (
      <Input
        id="password"
        type="password"
        placeholder="Enter password"
        aria-describedby="password-helper"
      />
    ),
  },
};

/** Form field with error state */
export const WithError: Story = {
  args: {
    label: 'Email',
    htmlFor: 'email-error',
    required: true,
    error: 'Please enter a valid email address',
    children: (
      <Input
        id="email-error"
        type="email"
        defaultValue="invalid-email"
        error
        aria-describedby="email-error-error"
      />
    ),
  },
};

/** Error message overrides helper text when both are present */
export const ErrorOverridesHelper: Story = {
  args: {
    label: 'Username',
    htmlFor: 'username-override',
    helperText: 'This text will not show when there is an error',
    error: 'Username is already taken',
    children: (
      <Input
        id="username-override"
        defaultValue="admin"
        error
        aria-describedby="username-override-error"
      />
    ),
  },
};

/** Disabled form field */
export const Disabled: Story = {
  args: {
    label: 'Username',
    htmlFor: 'username-disabled',
    disabled: true,
    children: <Input id="username-disabled" placeholder="Cannot edit" disabled />,
  },
};

// =============================================================================
// Spacing Variants
// =============================================================================

/** Small spacing between elements */
export const SpacingSmall: Story = {
  args: {
    label: 'Compact Field',
    htmlFor: 'compact',
    spacing: 'sm',
    helperText: 'Small gap spacing',
    children: <Input id="compact" placeholder="Compact layout" />,
  },
};

/** Medium spacing between elements */
export const SpacingMedium: Story = {
  args: {
    label: 'Medium Field',
    htmlFor: 'medium',
    spacing: 'md',
    helperText: 'Medium gap spacing',
    children: <Input id="medium" placeholder="Medium layout" />,
  },
};

/** Large spacing between elements */
export const SpacingLarge: Story = {
  args: {
    label: 'Spacious Field',
    htmlFor: 'spacious',
    spacing: 'lg',
    helperText: 'Large gap spacing',
    children: <Input id="spacious" placeholder="Spacious layout" />,
  },
};

/** Responsive spacing that changes at breakpoints */
export const ResponsiveSpacing: Story = {
  args: {
    label: 'Responsive Field',
    htmlFor: 'responsive-spacing',
    spacing: { base: 'sm', md: 'md', lg: 'lg' },
    helperText: 'Spacing increases on larger screens',
    children: <Input id="responsive-spacing" placeholder="Resize to see spacing change" />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Spacing grows from small to large as viewport increases.',
      },
    },
  },
};

// =============================================================================
// Label Size Variants
// =============================================================================

/** Extra small label text */
export const LabelSizeXS: Story = {
  args: {
    label: 'Extra Small Label',
    htmlFor: 'label-xs',
    labelSize: 'xs',
    children: <Input id="label-xs" placeholder="XS label" />,
  },
};

/** Small label text (default) */
export const LabelSizeSM: Story = {
  args: {
    label: 'Small Label (Default)',
    htmlFor: 'label-sm',
    labelSize: 'sm',
    children: <Input id="label-sm" placeholder="SM label" />,
  },
};

/** Base label text */
export const LabelSizeBase: Story = {
  args: {
    label: 'Base Label',
    htmlFor: 'label-base',
    labelSize: 'base',
    children: <Input id="label-base" placeholder="Base label" />,
  },
};

/** Large label text */
export const LabelSizeLG: Story = {
  args: {
    label: 'Large Label',
    htmlFor: 'label-lg',
    labelSize: 'lg',
    children: <Input id="label-lg" placeholder="LG label" />,
  },
};

/** Responsive label sizing */
export const ResponsiveLabelSize: Story = {
  args: {
    label: 'Responsive Label',
    htmlFor: 'responsive-label',
    labelSize: { base: 'sm', md: 'base', lg: 'lg' },
    helperText: 'Label grows on larger screens',
    children: <Input id="responsive-label" placeholder="Resize to see label change" />,
  },
};

// =============================================================================
// Input Type Variants
// =============================================================================

/** Form field with textarea */
export const WithTextarea: Story = {
  args: {
    label: 'Description',
    htmlFor: 'description',
    helperText: 'Max 500 characters',
    children: (
      <Textarea
        id="description"
        placeholder="Enter description..."
        rows={4}
        aria-describedby="description-helper"
      />
    ),
  },
};

/** Form field with textarea and error */
export const TextareaWithError: Story = {
  args: {
    label: 'Bio',
    htmlFor: 'bio',
    required: true,
    error: 'Bio must be at least 10 characters',
    children: (
      <Textarea
        id="bio"
        defaultValue="Hi"
        error
        rows={3}
        aria-describedby="bio-error"
        aria-required="true"
      />
    ),
  },
};

/** Form field with checkbox */
export const WithCheckbox: Story = {
  render: () => (
    <FormField label="Agreement" htmlFor="terms" required>
      <div className="flex items-center gap-2">
        <Checkbox id="terms" aria-required="true" />
        <label
          htmlFor="terms"
          className="cursor-pointer text-sm text-[rgb(var(--foreground))]"
          id="terms-label"
        >
          I agree to the terms and conditions
        </label>
      </div>
    </FormField>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'For checkbox fields, consider using a secondary label for the full text while the FormField label provides context.',
      },
    },
  },
};

// =============================================================================
// Accessibility Demos
// =============================================================================

/** Full accessibility pattern with aria-describedby */
export const AccessibilityPattern: Story = {
  render: () => (
    <FormField
      label="Username"
      htmlFor="a11y-username"
      required
      helperText="3-20 characters, letters and numbers only"
    >
      <Input
        id="a11y-username"
        placeholder="Enter username"
        aria-required="true"
        aria-describedby="a11y-username-helper"
      />
    </FormField>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates the full accessibility pattern:
1. Label linked via \`htmlFor="a11y-username"\` to \`id="a11y-username"\`
2. Helper text linked via \`aria-describedby="a11y-username-helper"\`
3. Required state indicated via \`aria-required="true"\`
        `,
      },
    },
  },
};

/** Error state with full accessibility */
export const AccessibilityErrorPattern: Story = {
  render: () => (
    <FormField
      label="Email Address"
      htmlFor="a11y-email"
      required
      error="Please enter a valid email address"
    >
      <Input
        id="a11y-email"
        type="email"
        defaultValue="invalid"
        error
        aria-required="true"
        aria-invalid="true"
        aria-describedby="a11y-email-error"
      />
    </FormField>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates error accessibility pattern:
1. Error message has \`role="alert"\` for screen reader announcement
2. Input has \`aria-invalid="true"\` to indicate error state
3. Input linked to error via \`aria-describedby="a11y-email-error"\`
        `,
      },
    },
  },
};

/** Screen reader announcement demo */
export const ScreenReaderAccessibility: Story = {
  render: () => {
    const [error, setError] = useState<string | undefined>(undefined);
    const inputRef = useRef<HTMLInputElement>(null);

    const validate = () => {
      const value = inputRef.current?.value ?? '';
      if (value.length < 3) {
        setError('Username must be at least 3 characters');
      } else {
        setError(undefined);
      }
    };

    return (
      <div className="flex flex-col gap-4">
        <FormField
          label="Username"
          htmlFor="sr-username"
          required
          error={error}
          helperText="Type to trigger validation"
        >
          <Input
            ref={inputRef}
            id="sr-username"
            placeholder="Enter username"
            onBlur={validate}
            error={!!error}
            aria-required="true"
            aria-describedby={error ? 'sr-username-error' : 'sr-username-helper'}
          />
        </FormField>
        <p className="text-xs text-[rgb(var(--muted-foreground))]">
          When an error appears, screen readers will announce it due to aria-live region.
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo showing how error state changes trigger screen reader announcements via the aria-live region.',
      },
    },
  },
};

/** Focus ring visibility */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg bg-white p-4 dark:bg-zinc-900">
        <FormField label="Light Background" htmlFor="focus-light">
          <Input id="focus-light" placeholder="Tab to see focus ring" />
        </FormField>
      </div>
      <div className="rounded-lg bg-zinc-900 p-4 dark:bg-white">
        <FormField label="Dark Background" htmlFor="focus-dark">
          <Input id="focus-dark" placeholder="Tab to see focus ring" />
        </FormField>
      </div>
      <p className="text-xs text-[rgb(var(--muted-foreground))]">
        Focus ring uses ring-offset for visibility on any background.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The focus ring is visible on both light and dark backgrounds using ring-offset.',
      },
    },
  },
};

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FormField label="First Name" htmlFor="kb-first">
        <Input id="kb-first" placeholder="Press Tab to move" />
      </FormField>
      <FormField label="Last Name" htmlFor="kb-last">
        <Input id="kb-last" placeholder="Tab navigates between fields" />
      </FormField>
      <FormField label="Email" htmlFor="kb-email" required>
        <Input id="kb-email" type="email" placeholder="Enter email" aria-required="true" />
      </FormField>
      <p className="text-xs text-[rgb(var(--muted-foreground))]">
        Use Tab and Shift+Tab to navigate between form fields.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates keyboard navigation through multiple form fields.',
      },
    },
  },
};

// =============================================================================
// Ref and Testing
// =============================================================================

/** Using forwardRef for focus management */
export const RefForwarding: Story = {
  render: () => {
    const fieldRef = useRef<HTMLDivElement>(null);
    const [focused, setFocused] = useState(false);

    return (
      <div className="flex flex-col gap-4">
        <FormField
          ref={fieldRef}
          label="With Ref"
          htmlFor="ref-demo"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          <Input id="ref-demo" placeholder="Focus triggers ref callback" />
        </FormField>
        <p className="text-sm">
          Container focused: <strong>{focused ? 'Yes' : 'No'}</strong>
        </p>
        <button
          type="button"
          onClick={() => fieldRef.current?.querySelector('input')?.focus()}
          className="rounded bg-[rgb(var(--primary))] px-4 py-2 text-sm text-[rgb(var(--primary-foreground))]"
        >
          Focus Input via Ref
        </button>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'forwardRef allows programmatic access to the FormField container.',
      },
    },
  },
};

/** data-testid for testing */
export const DataTestId: Story = {
  args: {
    label: 'Test Field',
    htmlFor: 'test-field',
    'data-testid': 'form-field-username',
    children: <Input id="test-field" data-testid="input-username" placeholder="Testable input" />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use data-testid for automated testing. The container and input can have separate test IDs.',
      },
    },
  },
};

/** Data attributes for state tracking */
export const DataAttributes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FormField label="Normal Field" htmlFor="data-normal">
        <Input id="data-normal" placeholder="data-error and data-disabled are undefined" />
      </FormField>
      <FormField label="Error Field" htmlFor="data-error" error="Has data-error='true'">
        <Input id="data-error" error />
      </FormField>
      <FormField label="Disabled Field" htmlFor="data-disabled" disabled>
        <Input id="data-disabled" disabled placeholder="Has data-disabled='true'" />
      </FormField>
      <p className="text-xs text-[rgb(var(--muted-foreground))]">
        Inspect elements to see data-error and data-disabled attributes.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'FormField sets data-error and data-disabled attributes for CSS targeting.',
      },
    },
  },
};

// =============================================================================
// Real-World Examples
// =============================================================================

/** All states showcase */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <FormField label="Default Field" htmlFor="all-default">
        <Input id="all-default" placeholder="Enter text..." />
      </FormField>

      <FormField label="Required Field" htmlFor="all-required" required>
        <Input id="all-required" placeholder="Required input" aria-required="true" />
      </FormField>

      <FormField label="With Helper" htmlFor="all-helper" helperText="Some helpful information">
        <Input id="all-helper" placeholder="Input with helper" aria-describedby="all-helper" />
      </FormField>

      <FormField label="With Error" htmlFor="all-error" error="This field has an error">
        <Input id="all-error" placeholder="Error input" error aria-describedby="all-error-error" />
      </FormField>

      <FormField label="Disabled Field" htmlFor="all-disabled" disabled>
        <Input id="all-disabled" placeholder="Disabled input" disabled />
      </FormField>

      <FormField
        label="Complete Example"
        htmlFor="all-complete"
        required
        helperText="We'll never share your email"
      >
        <Input
          id="all-complete"
          type="email"
          placeholder="you@example.com"
          aria-required="true"
          aria-describedby="all-complete-helper"
        />
      </FormField>
    </div>
  ),
};

/** Login form example */
export const LoginFormExample: Story = {
  render: () => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
      setErrors({
        email: 'Email is required',
        password: 'Password must be at least 8 characters',
      });
    };

    const clear = () => setErrors({});

    return (
      <div className="flex flex-col gap-4">
        <FormField label="Email Address" htmlFor="login-email" required error={errors.email}>
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            error={!!errors.email}
            aria-required="true"
            aria-describedby={errors.email ? 'login-email-error' : undefined}
          />
        </FormField>

        <FormField label="Password" htmlFor="login-password" required error={errors.password}>
          <Input
            id="login-password"
            type="password"
            placeholder="Enter password"
            error={!!errors.password}
            aria-required="true"
            aria-describedby={errors.password ? 'login-password-error' : undefined}
          />
        </FormField>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={validate}
            className="rounded bg-[rgb(var(--destructive))] px-4 py-2 text-sm text-white"
          >
            Trigger Errors
          </button>
          <button
            type="button"
            onClick={clear}
            className="rounded bg-[rgb(var(--muted))] px-4 py-2 text-sm"
          >
            Clear Errors
          </button>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Login form with dynamic error validation.',
      },
    },
  },
};

/** Registration form example */
export const RegistrationFormExample: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FormField label="Full Name" htmlFor="reg-name" required>
        <Input id="reg-name" placeholder="John Doe" aria-required="true" />
      </FormField>

      <FormField
        label="Email Address"
        htmlFor="reg-email"
        required
        helperText="We'll send a confirmation email"
      >
        <Input
          id="reg-email"
          type="email"
          placeholder="john@example.com"
          aria-required="true"
          aria-describedby="reg-email-helper"
        />
      </FormField>

      <FormField
        label="Password"
        htmlFor="reg-password"
        required
        helperText="Must be at least 8 characters with a number"
      >
        <Input
          id="reg-password"
          type="password"
          placeholder="Create a strong password"
          aria-required="true"
          aria-describedby="reg-password-helper"
        />
      </FormField>

      <FormField label="Bio" htmlFor="reg-bio" helperText="Tell us about yourself">
        <Textarea
          id="reg-bio"
          placeholder="Optional bio..."
          rows={3}
          aria-describedby="reg-bio-helper"
        />
      </FormField>
    </div>
  ),
};

/** Contact form example */
export const ContactFormExample: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <FormField label="First Name" htmlFor="contact-first" required className="flex-1">
          <Input id="contact-first" placeholder="First" aria-required="true" />
        </FormField>
        <FormField label="Last Name" htmlFor="contact-last" required className="flex-1">
          <Input id="contact-last" placeholder="Last" aria-required="true" />
        </FormField>
      </div>

      <FormField label="Email" htmlFor="contact-email" required>
        <Input id="contact-email" type="email" placeholder="you@example.com" aria-required="true" />
      </FormField>

      <FormField
        label="Message"
        htmlFor="contact-message"
        required
        helperText="Please describe your inquiry"
      >
        <Textarea
          id="contact-message"
          placeholder="Your message..."
          rows={5}
          aria-required="true"
          aria-describedby="contact-message-helper"
        />
      </FormField>
    </div>
  ),
};

// =============================================================================
// Constants Reference
// =============================================================================

/** Reference for exported constants and utilities */
export const ConstantsReference: Story = {
  render: () => (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <h4 className="font-medium">FORM_FIELD_BASE_CLASSES</h4>
        <code className="text-xs">{JSON.stringify(FORM_FIELD_BASE_CLASSES)}</code>
      </div>
      <div>
        <h4 className="font-medium">FORM_FIELD_SPACING_CLASSES</h4>
        <pre className="text-xs">{JSON.stringify(FORM_FIELD_SPACING_CLASSES, null, 2)}</pre>
      </div>
      <div>
        <h4 className="font-medium">HELPER_TEXT_CLASSES</h4>
        <code className="text-xs">{JSON.stringify(HELPER_TEXT_CLASSES)}</code>
      </div>
      <div>
        <h4 className="font-medium">ERROR_TEXT_CLASSES</h4>
        <code className="text-xs">{JSON.stringify(ERROR_TEXT_CLASSES)}</code>
      </div>
      <div>
        <h4 className="font-medium">getBaseSpacing('md')</h4>
        <code className="text-xs">{getBaseSpacing('md')}</code>
      </div>
      <div>
        <h4 className="font-medium">getResponsiveSpacingClasses({'{ base: "sm", md: "lg" }'})</h4>
        <code className="text-xs">
          {JSON.stringify(getResponsiveSpacingClasses({ base: 'sm', md: 'lg' }))}
        </code>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Reference for all exported constants and utility functions.',
      },
    },
  },
};
