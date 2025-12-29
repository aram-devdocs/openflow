import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url', 'file'],
      description: 'Input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    error: {
      control: 'boolean',
      description: 'Show error styling',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input',
    },
    onChange: { action: 'changed' },
    onFocus: { action: 'focused' },
    onBlur: { action: 'blurred' },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

/** Default text input */
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

/** Text input with value */
export const WithValue: Story = {
  args: {
    defaultValue: 'Hello, world!',
  },
};

/** Email input type */
export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'you@example.com',
  },
};

/** Password input type */
export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
};

/** Number input type */
export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '0',
    min: 0,
    max: 100,
  },
};

/** Search input type */
export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
};

/** File input type */
export const File: Story = {
  args: {
    type: 'file',
  },
};

/** Input with error state */
export const Error: Story = {
  args: {
    placeholder: 'Invalid input',
    error: true,
    defaultValue: 'invalid@email',
  },
};

/** Error state with aria description */
export const ErrorWithDescription: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <Input
        type="email"
        placeholder="Enter email"
        defaultValue="invalid-email"
        error
        aria-describedby="email-error"
      />
      <span id="email-error" className="text-xs text-[rgb(var(--destructive))]">
        Please enter a valid email address
      </span>
    </div>
  ),
};

/** Disabled input */
export const Disabled: Story = {
  args: {
    placeholder: 'Cannot edit',
    disabled: true,
  },
};

/** Disabled input with value */
export const DisabledWithValue: Story = {
  args: {
    defaultValue: 'Read only value',
    disabled: true,
  },
};

/** Required input */
export const Required: Story = {
  args: {
    placeholder: 'Required field',
    required: true,
  },
};

/** All input types showcase */
export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="search" placeholder="Search input" />
      <Input type="tel" placeholder="Phone input" />
      <Input type="url" placeholder="URL input" />
      <Input type="file" />
    </div>
  ),
};

/** Input states showcase */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <Input placeholder="Default" />
      <Input placeholder="With value" defaultValue="Some text" />
      <Input placeholder="Error state" error defaultValue="Invalid" />
      <Input placeholder="Disabled" disabled />
      <Input placeholder="Disabled with value" disabled defaultValue="Cannot edit" />
    </div>
  ),
};

/** Input with custom width */
export const CustomWidth: Story = {
  args: {
    placeholder: 'Wide input',
    className: 'w-96',
  },
};
