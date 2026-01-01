import type { Meta, StoryObj } from '@storybook/react';
import {
  Bell,
  FileText,
  Filter,
  Folder,
  Globe,
  Mail,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import { Label } from '../atoms/Label';
import {
  DEFAULT_CLOSED_LABEL,
  DEFAULT_EMPTY_LABEL,
  DEFAULT_OPENED_LABEL,
  DEFAULT_PLACEHOLDER,
  DROPDOWN_SIZE_CLASSES,
  Dropdown,
} from './Dropdown';

const meta: Meta<typeof Dropdown> = {
  title: 'Molecules/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A fully accessible dropdown component for selecting from a list of options.

## Accessibility Features
- **ARIA Combobox Pattern**: Uses role="combobox" on trigger, role="listbox" on list, role="option" on items
- **Screen Reader Announcements**: Announces open/close state and selection changes
- **Keyboard Navigation**: Full keyboard support with Arrow keys, Home/End, Enter/Space, Escape, Tab
- **Touch Targets**: ≥44px minimum touch targets for mobile accessibility (WCAG 2.5.5)
- **Focus Management**: Visible focus ring with ring-offset for all backgrounds
- **aria-activedescendant**: Tracks highlighted option for screen readers

## Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Enter, Space | Open dropdown / Select option |
| Arrow Down | Open dropdown / Move to next option |
| Arrow Up | Open dropdown / Move to previous option |
| Home | Move to first option |
| End | Move to last option |
| Escape | Close dropdown |
| Tab | Close dropdown and move focus |

## Exported Utilities
- \`getResponsiveSizeClasses(size)\` - Generate responsive size classes
- \`getOptionId(listboxId, value)\` - Generate unique option ID for aria-activedescendant
        `,
      },
    },
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
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the dropdown trigger',
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

// ============================================================================
// Basic States
// ============================================================================

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
          data-testid="interactive-dropdown"
        />
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Selected: {value || 'None'}</p>
      </div>
    );
  },
};

// ============================================================================
// Sizes
// ============================================================================

/** Small dropdown */
export const SizeSmall: Story = {
  args: {
    options: basicOptions,
    placeholder: 'Small dropdown',
    size: 'sm',
  },
};

/** Medium dropdown (default) */
export const SizeMedium: Story = {
  args: {
    options: basicOptions,
    placeholder: 'Medium dropdown',
    size: 'md',
  },
};

/** Large dropdown */
export const SizeLarge: Story = {
  args: {
    options: basicOptions,
    placeholder: 'Large dropdown',
    size: 'lg',
  },
};

/** Responsive size - adapts to screen width */
export const ResponsiveSize: Story = {
  args: {
    options: basicOptions,
    placeholder: 'Responsive dropdown',
    size: { base: 'md', lg: 'lg' },
  },
  parameters: {
    docs: {
      description: {
        story:
          'The dropdown adapts its size based on screen width. Use responsive objects like `{ base: "md", lg: "lg" }` for different breakpoints.',
      },
    },
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  decorators: [
    (Story: React.ComponentType) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium text-[rgb(var(--muted-foreground))]">Small (36px)</p>
        <Dropdown options={basicOptions} placeholder="Small" size="sm" />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-[rgb(var(--muted-foreground))]">
          Medium (44px) - Default
        </p>
        <Dropdown options={basicOptions} placeholder="Medium" size="md" />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-[rgb(var(--muted-foreground))]">Large (48px)</p>
        <Dropdown options={basicOptions} placeholder="Large" size="lg" />
      </div>
    </div>
  ),
};

// ============================================================================
// With Icons
// ============================================================================

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

// ============================================================================
// States
// ============================================================================

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
export const ErrorState: Story = {
  args: {
    options: basicOptions,
    error: true,
    placeholder: 'Select an option',
  },
};

// ============================================================================
// Content Variations
// ============================================================================

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
        label: 'This is an even longer option label that demonstrates truncation behavior',
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

// ============================================================================
// Real-World Examples
// ============================================================================

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
        data-testid="file-type-selector"
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
        <Label htmlFor="notification-prefs">Notification Preferences</Label>
        <Dropdown
          options={[
            { value: 'all', label: 'All Notifications', icon: Bell },
            { value: 'important', label: 'Important Only', icon: Mail },
            { value: 'none', label: 'None' },
          ]}
          value={value}
          onChange={setValue}
          aria-label="Notification preferences"
          data-testid="notification-prefs"
        />
      </div>
    );
  },
};

/** Theme selector example */
export const ThemeSelector: Story = {
  render: () => {
    const [value, setValue] = useState<string>('system');
    return (
      <div className="space-y-2">
        <Label htmlFor="theme-selector">Theme</Label>
        <Dropdown
          options={[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'system', label: 'System', icon: Settings },
          ]}
          value={value}
          onChange={setValue}
          aria-label="Theme selection"
          size="sm"
          data-testid="theme-selector"
        />
      </div>
    );
  },
};

/** Language selector example */
export const LanguageSelector: Story = {
  render: () => {
    const [value, setValue] = useState<string>('en');
    return (
      <Dropdown
        options={[
          { value: 'en', label: 'English', icon: Globe },
          { value: 'es', label: 'Español', icon: Globe },
          { value: 'fr', label: 'Français', icon: Globe },
          { value: 'de', label: 'Deutsch', icon: Globe },
          { value: 'ja', label: '日本語', icon: Globe },
        ]}
        value={value}
        onChange={setValue}
        aria-label="Language selection"
        data-testid="language-selector"
      />
    );
  },
};

/** Priority selector example */
export const PrioritySelector: Story = {
  render: () => {
    const [value, setValue] = useState<string>('medium');
    return (
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Dropdown
          options={[
            { value: 'low', label: 'Low Priority' },
            { value: 'medium', label: 'Medium Priority' },
            { value: 'high', label: 'High Priority', icon: Zap },
            { value: 'critical', label: 'Critical', icon: Zap },
          ]}
          value={value}
          onChange={setValue}
          aria-label="Task priority"
          data-testid="priority-selector"
        />
      </div>
    );
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/** Focus ring visibility */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Press Tab to see the focus ring with ring-offset for visibility on all backgrounds.
      </p>
      <Dropdown
        options={basicOptions}
        placeholder="Focus me with Tab"
        data-testid="focus-ring-demo"
      />
    </div>
  ),
};

/** Touch target accessibility */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        All interactive elements have minimum 44px touch targets for mobile accessibility (WCAG
        2.5.5).
      </p>
      <div className="flex flex-col gap-4">
        <Dropdown options={basicOptions} placeholder="44px min-height (md)" size="md" />
        <Dropdown options={basicOptions} placeholder="48px min-height (lg)" size="lg" />
      </div>
    </div>
  ),
};

/** Screen reader accessibility */
export const ScreenReaderAccessibility: Story = {
  render: () => {
    const [value, setValue] = useState<string>('');

    return (
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Turn on a screen reader to hear announcements for:
        </p>
        <ul className="list-disc list-inside text-sm text-[rgb(var(--muted-foreground))]">
          <li>Dropdown open/close state</li>
          <li>Selected option changes</li>
          <li>Current highlighted option (via aria-activedescendant)</li>
        </ul>
        <Dropdown
          options={basicOptions}
          value={value || undefined}
          onChange={setValue}
          placeholder="Screen reader demo"
          aria-label="Demo dropdown for screen reader testing"
          data-testid="sr-demo"
        />
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
          data-testid="keyboard-nav-demo"
        />
        <div className="text-xs text-[rgb(var(--muted-foreground))]">
          <p className="font-medium">Keyboard shortcuts:</p>
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

/** forwardRef demo */
export const RefForwarding: Story = {
  render: () => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleFocus = () => {
      // Find the trigger button inside the dropdown container
      const trigger = dropdownRef.current?.querySelector('button');
      trigger?.focus();
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          The Dropdown component supports forwardRef for programmatic focus management.
        </p>
        <Dropdown
          ref={dropdownRef}
          options={basicOptions}
          placeholder="Ref forwarding demo"
          data-testid="ref-forward-demo"
        />
        <Button onClick={handleFocus} size="sm">
          Focus Dropdown
        </Button>
      </div>
    );
  },
};

/** data-testid demo */
export const DataTestIdDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Use data-testid for automated testing. The component generates:
      </p>
      <ul className="list-disc list-inside text-xs text-[rgb(var(--muted-foreground))]">
        <li>
          <code>[testid]</code> - Container
        </li>
        <li>
          <code>[testid]-trigger</code> - Trigger button
        </li>
        <li>
          <code>[testid]-listbox</code> - Options list
        </li>
        <li>
          <code>[testid]-option-[value]</code> - Individual options
        </li>
      </ul>
      <Dropdown options={basicOptions} placeholder="With data-testid" data-testid="my-dropdown" />
    </div>
  ),
};

/** Custom labels demo */
export const CustomLabels: Story = {
  render: () => {
    const [value, setValue] = useState<string>('');

    return (
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Customize screen reader announcements with custom labels.
        </p>
        <Dropdown
          options={basicOptions}
          value={value || undefined}
          onChange={setValue}
          placeholder="Custom labels demo"
          openedLabel="Menu expanded"
          closedLabel="Menu collapsed"
          emptyLabel="Nothing to select"
          aria-label="Custom labels dropdown"
        />
      </div>
    );
  },
};

// ============================================================================
// All States Showcase
// ============================================================================

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
          <Dropdown options={basicOptions} placeholder="Select an option" onChange={() => {}} />
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
          <Dropdown options={basicOptions} value="option1" disabled onChange={() => {}} />
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

// ============================================================================
// Constants and Utilities Reference
// ============================================================================

/** Constants and utilities reference */
export const ConstantsReference: Story = {
  render: () => (
    <div className="max-w-md space-y-4">
      <p className="text-sm font-medium">Exported Constants:</p>
      <div className="rounded-md bg-[rgb(var(--muted))] p-3 text-xs font-mono overflow-x-auto">
        <p className="text-[rgb(var(--muted-foreground))]">{'// Default labels'}</p>
        <p>DEFAULT_OPENED_LABEL = &quot;{DEFAULT_OPENED_LABEL}&quot;</p>
        <p>DEFAULT_CLOSED_LABEL = &quot;{DEFAULT_CLOSED_LABEL}&quot;</p>
        <p>DEFAULT_EMPTY_LABEL = &quot;{DEFAULT_EMPTY_LABEL}&quot;</p>
        <p>DEFAULT_PLACEHOLDER = &quot;{DEFAULT_PLACEHOLDER}&quot;</p>
        <p className="mt-2 text-[rgb(var(--muted-foreground))]">{'// Size classes'}</p>
        <p>DROPDOWN_SIZE_CLASSES.sm = &quot;{DROPDOWN_SIZE_CLASSES.sm}&quot;</p>
        <p>DROPDOWN_SIZE_CLASSES.md = &quot;{DROPDOWN_SIZE_CLASSES.md}&quot;</p>
        <p>DROPDOWN_SIZE_CLASSES.lg = &quot;{DROPDOWN_SIZE_CLASSES.lg}&quot;</p>
      </div>

      <p className="text-sm font-medium">Exported CSS Class Constants:</p>
      <ul className="list-disc list-inside text-xs text-[rgb(var(--muted-foreground))]">
        <li>DROPDOWN_TRIGGER_CLASSES</li>
        <li>DROPDOWN_TRIGGER_HOVER_CLASSES</li>
        <li>DROPDOWN_TRIGGER_FOCUS_CLASSES</li>
        <li>DROPDOWN_TRIGGER_DISABLED_CLASSES</li>
        <li>DROPDOWN_TRIGGER_ERROR_CLASSES</li>
        <li>DROPDOWN_TRIGGER_OPEN_CLASSES</li>
        <li>DROPDOWN_LISTBOX_CLASSES</li>
        <li>DROPDOWN_OPTION_BASE_CLASSES</li>
        <li>DROPDOWN_OPTION_HIGHLIGHTED_CLASSES</li>
        <li>DROPDOWN_OPTION_SELECTED_CLASSES</li>
        <li>DROPDOWN_OPTION_DISABLED_CLASSES</li>
      </ul>

      <p className="text-sm font-medium">Utility Functions:</p>
      <div className="rounded-md bg-[rgb(var(--muted))] p-3 text-xs font-mono">
        <p className="text-[rgb(var(--muted-foreground))]">
          {'// Generate responsive size classes'}
        </p>
        <p>{"getResponsiveSizeClasses('md')"}</p>
        <p>{"getResponsiveSizeClasses({ base: 'sm', lg: 'lg' })"}</p>
        <p className="mt-2 text-[rgb(var(--muted-foreground))]">{'// Generate option ID'}</p>
        <p>{"getOptionId('listbox-123', 'option1')"}</p>
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
