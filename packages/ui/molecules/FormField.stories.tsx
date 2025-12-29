import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '../atoms/Checkbox';
import { Input } from '../atoms/Input';
import { Textarea } from '../atoms/Textarea';
import { FormField } from './FormField';

const meta: Meta<typeof FormField> = {
  title: 'Molecules/FormField',
  component: FormField,
  parameters: {
    layout: 'centered',
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

/** Default form field with text input */
export const Default: Story = {
  args: {
    label: 'Username',
    children: <Input placeholder="Enter username" />,
  },
};

/** Required form field */
export const Required: Story = {
  args: {
    label: 'Email',
    required: true,
    children: <Input type="email" placeholder="you@example.com" />,
  },
};

/** Form field with helper text */
export const WithHelperText: Story = {
  args: {
    label: 'Password',
    required: true,
    helperText: 'Must be at least 8 characters',
    children: <Input type="password" placeholder="Enter password" />,
  },
};

/** Form field with error */
export const WithError: Story = {
  args: {
    label: 'Email',
    required: true,
    error: 'Please enter a valid email address',
    children: <Input type="email" defaultValue="invalid-email" error />,
  },
};

/** Error overrides helper text */
export const ErrorOverridesHelper: Story = {
  args: {
    label: 'Username',
    helperText: 'This text will not show when there is an error',
    error: 'Username is already taken',
    children: <Input defaultValue="admin" error />,
  },
};

/** Disabled form field */
export const Disabled: Story = {
  args: {
    label: 'Username',
    disabled: true,
    children: <Input placeholder="Cannot edit" disabled />,
  },
};

/** Form field with textarea */
export const WithTextarea: Story = {
  args: {
    label: 'Description',
    helperText: 'Max 500 characters',
    children: <Textarea placeholder="Enter description..." rows={4} />,
  },
};

/** Form field with textarea and error */
export const TextareaWithError: Story = {
  args: {
    label: 'Bio',
    required: true,
    error: 'Bio must be at least 10 characters',
    children: <Textarea defaultValue="Hi" error rows={3} />,
  },
};

/** Form field with checkbox */
export const WithCheckbox: Story = {
  render: () => (
    <FormField label="Terms and Conditions" required>
      <div className="flex items-center gap-2">
        <Checkbox id="terms" />
        <label htmlFor="terms" className="text-sm text-[rgb(var(--foreground))]">
          I agree to the terms and conditions
        </label>
      </div>
    </FormField>
  ),
};

/** All states showcase */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <FormField label="Default Field">
        <Input placeholder="Enter text..." />
      </FormField>

      <FormField label="Required Field" required>
        <Input placeholder="Required input" />
      </FormField>

      <FormField label="With Helper" helperText="Some helpful information">
        <Input placeholder="Input with helper" />
      </FormField>

      <FormField label="With Error" error="This field has an error">
        <Input placeholder="Error input" error />
      </FormField>

      <FormField label="Disabled Field" disabled>
        <Input placeholder="Disabled input" disabled />
      </FormField>

      <FormField label="Complete Example" required helperText="We'll never share your email">
        <Input type="email" placeholder="you@example.com" />
      </FormField>
    </div>
  ),
};

/** Form layout example */
export const FormExample: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FormField label="Full Name" required>
        <Input placeholder="John Doe" />
      </FormField>

      <FormField label="Email Address" required helperText="We'll never share your email">
        <Input type="email" placeholder="john@example.com" />
      </FormField>

      <FormField label="Password" required helperText="Must be at least 8 characters">
        <Input type="password" placeholder="Enter password" />
      </FormField>

      <FormField label="Bio">
        <Textarea placeholder="Tell us about yourself..." rows={3} />
      </FormField>
    </div>
  ),
};

/** Form with validation errors */
export const FormWithErrors: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FormField label="Full Name" required error="Name is required">
        <Input error />
      </FormField>

      <FormField label="Email" required error="Please enter a valid email">
        <Input type="email" defaultValue="not-an-email" error />
      </FormField>

      <FormField label="Password" required error="Password must be at least 8 characters">
        <Input type="password" defaultValue="short" error />
      </FormField>
    </div>
  ),
};
