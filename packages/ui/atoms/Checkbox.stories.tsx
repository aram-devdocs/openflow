import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Atoms/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Indeterminate state (partially checked)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the checkbox',
    },
    onChange: { action: 'changed' },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

/** Default unchecked checkbox */
export const Default: Story = {
  args: {
    'aria-label': 'Example checkbox',
  },
};

/** Checked checkbox */
export const Checked: Story = {
  args: {
    checked: true,
    'aria-label': 'Checked checkbox',
  },
};

/** Unchecked checkbox */
export const Unchecked: Story = {
  args: {
    checked: false,
    'aria-label': 'Unchecked checkbox',
  },
};

/** Indeterminate state */
export const Indeterminate: Story = {
  args: {
    indeterminate: true,
    'aria-label': 'Indeterminate checkbox',
  },
};

/** Disabled unchecked */
export const DisabledUnchecked: Story = {
  args: {
    disabled: true,
    'aria-label': 'Disabled checkbox',
  },
};

/** Disabled checked */
export const DisabledChecked: Story = {
  args: {
    checked: true,
    disabled: true,
    'aria-label': 'Disabled checked checkbox',
  },
};

/** Disabled indeterminate */
export const DisabledIndeterminate: Story = {
  args: {
    indeterminate: true,
    disabled: true,
    'aria-label': 'Disabled indeterminate checkbox',
  },
};

/** Checkbox with label */
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-3 cursor-pointer">
      <Checkbox aria-label="I agree to the terms and conditions" />
      <span className="text-sm text-[rgb(var(--foreground))]">
        I agree to the terms and conditions
      </span>
    </div>
  ),
};

/** Checked checkbox with label */
export const CheckedWithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-3 cursor-pointer">
      <Checkbox checked aria-label="Remember me" />
      <span className="text-sm text-[rgb(var(--foreground))]">Remember me</span>
    </div>
  ),
};

/** Disabled checkbox with label */
export const DisabledWithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-3 cursor-not-allowed opacity-50">
      <Checkbox disabled aria-label="This option is not available" />
      <span className="text-sm text-[rgb(var(--foreground))]">This option is not available</span>
    </div>
  ),
};

/** All checkbox states */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="w-24 text-sm text-[rgb(var(--muted-foreground))]">Normal:</span>
        <Checkbox aria-label="Normal unchecked" />
        <Checkbox checked aria-label="Normal checked" />
        <Checkbox indeterminate aria-label="Normal indeterminate" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24 text-sm text-[rgb(var(--muted-foreground))]">Disabled:</span>
        <Checkbox disabled aria-label="Disabled unchecked" />
        <Checkbox checked disabled aria-label="Disabled checked" />
        <Checkbox indeterminate disabled aria-label="Disabled indeterminate" />
      </div>
    </div>
  ),
};

/** Checkbox list example */
export const CheckboxList: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium text-[rgb(var(--foreground))] mb-2">
        Select your interests:
      </div>
      <div className="flex items-center gap-3 cursor-pointer">
        <Checkbox checked aria-label="Technology" />
        <span className="text-sm text-[rgb(var(--foreground))]">Technology</span>
      </div>
      <div className="flex items-center gap-3 cursor-pointer">
        <Checkbox checked aria-label="Design" />
        <span className="text-sm text-[rgb(var(--foreground))]">Design</span>
      </div>
      <div className="flex items-center gap-3 cursor-pointer">
        <Checkbox aria-label="Business" />
        <span className="text-sm text-[rgb(var(--foreground))]">Business</span>
      </div>
      <div className="flex items-center gap-3 cursor-pointer">
        <Checkbox aria-label="Science" />
        <span className="text-sm text-[rgb(var(--foreground))]">Science</span>
      </div>
    </div>
  ),
};

/** Select all with indeterminate */
export const SelectAllPattern: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 cursor-pointer border-b border-[rgb(var(--border))] pb-2 mb-1">
        <Checkbox indeterminate aria-label="Select all items" />
        <span className="text-sm font-medium text-[rgb(var(--foreground))]">Select all items</span>
      </div>
      <div className="flex items-center gap-3 cursor-pointer pl-6">
        <Checkbox checked aria-label="Item 1" />
        <span className="text-sm text-[rgb(var(--foreground))]">Item 1</span>
      </div>
      <div className="flex items-center gap-3 cursor-pointer pl-6">
        <Checkbox checked aria-label="Item 2" />
        <span className="text-sm text-[rgb(var(--foreground))]">Item 2</span>
      </div>
      <div className="flex items-center gap-3 cursor-pointer pl-6">
        <Checkbox aria-label="Item 3" />
        <span className="text-sm text-[rgb(var(--foreground))]">Item 3</span>
      </div>
    </div>
  ),
};
