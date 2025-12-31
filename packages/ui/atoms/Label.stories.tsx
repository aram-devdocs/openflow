import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './Label';

const meta: Meta<typeof Label> = {
  title: 'Atoms/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
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
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

/** Default label */
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

/** Disabled label */
export const Disabled: Story = {
  args: {
    children: 'Disabled Field',
    htmlFor: 'disabled-field',
    disabled: true,
  },
};

/** Required and disabled */
export const RequiredDisabled: Story = {
  args: {
    children: 'Required but Disabled',
    htmlFor: 'required-disabled',
    required: true,
    disabled: true,
  },
};

/** Long label text */
export const LongLabel: Story = {
  args: {
    children:
      'Please enter your complete mailing address including street, city, state, and ZIP code',
    htmlFor: 'address',
  },
};

/** Label with input example */
export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="demo-email">Email Address</Label>
      <input
        id="demo-email"
        type="email"
        placeholder="you@example.com"
        className="rounded border border-[rgb(var(--input))] bg-[rgb(var(--background))] px-3 py-2 text-sm"
      />
    </div>
  ),
};

/** Required label with input */
export const RequiredWithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="demo-name" required>
        Full Name
      </Label>
      <input
        id="demo-name"
        type="text"
        placeholder="John Doe"
        className="rounded border border-[rgb(var(--input))] bg-[rgb(var(--background))] px-3 py-2 text-sm"
        required
      />
    </div>
  ),
};

/** Disabled label with disabled input */
export const DisabledWithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="demo-disabled" disabled>
        Read Only
      </Label>
      <input
        id="demo-disabled"
        type="text"
        value="Cannot edit this"
        disabled
        className="rounded border border-[rgb(var(--input))] bg-[rgb(var(--background))] px-3 py-2 text-sm opacity-50"
      />
    </div>
  ),
};

/** Form field showcase */
export const FormFields: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <div className="flex flex-col gap-2">
        <Label htmlFor="field-1" required>
          First Name
        </Label>
        <input
          id="field-1"
          type="text"
          placeholder="Enter first name"
          className="rounded border border-[rgb(var(--input))] bg-[rgb(var(--background))] px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="field-2" required>
          Last Name
        </Label>
        <input
          id="field-2"
          type="text"
          placeholder="Enter last name"
          className="rounded border border-[rgb(var(--input))] bg-[rgb(var(--background))] px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="field-3">Phone (optional)</Label>
        <input
          id="field-3"
          type="tel"
          placeholder="(555) 123-4567"
          className="rounded border border-[rgb(var(--input))] bg-[rgb(var(--background))] px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="field-4" disabled>
          Account ID
        </Label>
        <input
          id="field-4"
          type="text"
          value="ACC-12345"
          disabled
          className="rounded border border-[rgb(var(--input))] bg-[rgb(var(--background))] px-3 py-2 text-sm opacity-50"
        />
      </div>
    </div>
  ),
};

/** All label states */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Label>Default Label</Label>
      <Label required>Required Label</Label>
      <Label disabled>Disabled Label</Label>
      <Label required disabled>
        Required Disabled Label
      </Label>
    </div>
  ),
};
