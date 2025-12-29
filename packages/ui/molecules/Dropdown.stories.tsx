import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown } from './Dropdown';
import {
  Search,
  Filter,
  Settings,
  User,
  Folder,
  FileText,
  Bell,
  Mail,
} from 'lucide-react';

const meta: Meta<typeof Dropdown> = {
  title: 'Molecules/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'Currently selected value',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no value is selected',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the dropdown is disabled',
    },
    error: {
      control: 'boolean',
      description: 'Whether to show error styling',
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

const basicOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

/** Default dropdown with basic options */
export const Default: Story = {
  args: {
    options: basicOptions,
    placeholder: 'Select an option',
  },
};

/** Dropdown with a pre-selected value */
export const WithValue: Story = {
  args: {
    options: basicOptions,
    value: 'option2',
    placeholder: 'Select an option',
  },
};

/** Interactive dropdown with state management */
export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState<string>('');
    return (
      <div className="space-y-4">
        <Dropdown
          options={basicOptions}
          value={value || undefined}
          onChange={setValue}
          placeholder="Select an option"
        />
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Selected: {value || 'None'}
        </p>
      </div>
    );
  },
};

/** Dropdown with icons on options */
export const WithIcons: Story = {
  args: {
    options: [
      { value: 'search', label: 'Search', icon: Search },
      { value: 'filter', label: 'Filter', icon: Filter },
      { value: 'settings', label: 'Settings', icon: Settings },
      { value: 'user', label: 'Profile', icon: User },
    ],
    value: 'search',
    placeholder: 'Select action',
  },
};

/** Dropdown with disabled options */
export const WithDisabledOptions: Story = {
  args: {
    options: [
      { value: 'option1', label: 'Available Option 1' },
      { value: 'option2', label: 'Disabled Option', disabled: true },
      { value: 'option3', label: 'Available Option 2' },
      { value: 'option4', label: 'Also Disabled', disabled: true },
      { value: 'option5', label: 'Available Option 3' },
    ],
    placeholder: 'Select an option',
  },
};

/** Disabled dropdown */
export const Disabled: Story = {
  args: {
    options: basicOptions,
    value: 'option1',
    disabled: true,
    placeholder: 'Select an option',
  },
};

/** Dropdown with error state */
export const Error: Story = {
  args: {
    options: basicOptions,
    error: true,
    placeholder: 'Select an option',
  },
};

/** Dropdown with many options (scrollable) */
export const ManyOptions: Story = {
  args: {
    options: Array.from({ length: 20 }, (_, i) => ({
      value: `option${i + 1}`,
      label: `Option ${i + 1}`,
    })),
    placeholder: 'Select from many options',
  },
};

/** Dropdown with long labels */
export const LongLabels: Story = {
  args: {
    options: [
      { value: 'short', label: 'Short' },
      {
        value: 'long',
        label: 'This is a very long option label that should be truncated',
      },
      {
        value: 'longer',
        label:
          'This is an even longer option label that demonstrates truncation behavior',
      },
    ],
    placeholder: 'Select an option with a long label',
  },
};

/** Empty dropdown with no options */
export const Empty: Story = {
  args: {
    options: [],
    placeholder: 'No options available',
  },
};

/** File type selector example */
export const FileTypeSelector: Story = {
  render: () => {
    const [value, setValue] = useState<string>('folder');
    return (
      <Dropdown
        options={[
          { value: 'folder', label: 'Folder', icon: Folder },
          { value: 'file', label: 'File', icon: FileText },
        ]}
        value={value}
        onChange={setValue}
        aria-label="File type"
      />
    );
  },
};

/** Notification preferences example */
export const NotificationPreferences: Story = {
  render: () => {
    const [value, setValue] = useState<string>('all');
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-[rgb(var(--foreground))]">
          Notification Preferences
        </label>
        <Dropdown
          options={[
            { value: 'all', label: 'All Notifications', icon: Bell },
            { value: 'important', label: 'Important Only', icon: Mail },
            { value: 'none', label: 'None', disabled: false },
          ]}
          value={value}
          onChange={setValue}
          aria-label="Notification preferences"
        />
      </div>
    );
  },
};

/** All dropdown states showcase */
export const AllStates: Story = {
  decorators: [
    (Story: React.ComponentType) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: () => {
    const [interactiveValue, setInteractiveValue] = useState<string>('');

    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-2 text-sm font-medium">Default (empty)</p>
          <Dropdown
            options={basicOptions}
            placeholder="Select an option"
            onChange={() => {}}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">With value</p>
          <Dropdown
            options={basicOptions}
            value="option2"
            placeholder="Select an option"
            onChange={() => {}}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">With icons</p>
          <Dropdown
            options={[
              { value: 'search', label: 'Search', icon: Search },
              { value: 'filter', label: 'Filter', icon: Filter },
            ]}
            value="search"
            onChange={() => {}}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Disabled</p>
          <Dropdown
            options={basicOptions}
            value="option1"
            disabled
            onChange={() => {}}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Error state</p>
          <Dropdown
            options={basicOptions}
            error
            placeholder="Select an option"
            onChange={() => {}}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Interactive</p>
          <Dropdown
            options={basicOptions}
            value={interactiveValue || undefined}
            onChange={setInteractiveValue}
            placeholder="Click to interact"
          />
          {interactiveValue && (
            <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
              Selected: {interactiveValue}
            </p>
          )}
        </div>
      </div>
    );
  },
};

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => {
    const [value, setValue] = useState<string>('');

    return (
      <div className="space-y-4">
        <Dropdown
          options={[
            { value: 'first', label: 'First Option' },
            { value: 'second', label: 'Second Option' },
            { value: 'third', label: 'Third Option (disabled)', disabled: true },
            { value: 'fourth', label: 'Fourth Option' },
            { value: 'fifth', label: 'Fifth Option' },
          ]}
          value={value || undefined}
          onChange={setValue}
          placeholder="Use keyboard to navigate"
          aria-label="Keyboard navigation demo"
        />
        <div className="text-xs text-[rgb(var(--muted-foreground))]">
          <p>Keyboard shortcuts:</p>
          <ul className="list-inside list-disc">
            <li>Enter/Space/Arrow Down: Open dropdown</li>
            <li>Arrow Up/Down: Navigate options</li>
            <li>Home/End: Jump to first/last option</li>
            <li>Enter/Space: Select highlighted option</li>
            <li>Escape: Close dropdown</li>
            <li>Tab: Close and move focus</li>
          </ul>
        </div>
      </div>
    );
  },
};
