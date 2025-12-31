import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Atoms/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A checkbox component with accessibility, responsive sizing, and custom styling.

## Features
- **Touch targets**: 44px minimum on touch devices (WCAG 2.5.5)
- **Indeterminate state**: For "select all" patterns
- **Focus visible**: Clear focus ring on all backgrounds
- **Error state**: Visual feedback for form validation
- **Responsive sizing**: Supports responsive values
- **Screen reader support**: State changes announced

## Usage with Labels
For accessibility, always associate checkboxes with labels:

\`\`\`tsx
// With wrapping label (recommended)
<label className="flex items-center gap-2">
  <Checkbox checked={checked} onChange={onChange} />
  <span>I agree to terms</span>
</label>

// With htmlFor
<Checkbox id="terms" />
<label htmlFor="terms">I agree</label>

// With aria-label (icon-only)
<Checkbox aria-label="Select item" />
\`\`\`
        `,
      },
    },
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
    error: {
      control: 'boolean',
      description: 'Error state for form validation',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the checkbox',
    },
    onChange: { action: 'changed' },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

// =============================================================================
// Basic States
// =============================================================================

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

/** Indeterminate state for "select all" patterns */
export const Indeterminate: Story = {
  args: {
    indeterminate: true,
    'aria-label': 'Indeterminate checkbox',
  },
};

// =============================================================================
// Disabled States
// =============================================================================

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

// =============================================================================
// Error States
// =============================================================================

/** Error state unchecked */
export const ErrorUnchecked: Story = {
  args: {
    error: true,
    'aria-label': 'Error checkbox',
    'aria-describedby': 'error-msg',
  },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Checkbox {...args} />
      <span id="error-msg" className="text-xs text-[rgb(var(--destructive))]">
        This field is required
      </span>
    </div>
  ),
};

/** Error state checked */
export const ErrorChecked: Story = {
  args: {
    checked: true,
    error: true,
    'aria-label': 'Error checked checkbox',
  },
};

/** Error state indeterminate */
export const ErrorIndeterminate: Story = {
  args: {
    indeterminate: true,
    error: true,
    'aria-label': 'Error indeterminate checkbox',
  },
};

// =============================================================================
// Sizes
// =============================================================================

/** Small size checkbox */
export const SizeSmall: Story = {
  args: {
    size: 'sm',
    'aria-label': 'Small checkbox',
  },
};

/** Medium size checkbox (default) */
export const SizeMedium: Story = {
  args: {
    size: 'md',
    'aria-label': 'Medium checkbox',
  },
};

/** Large size checkbox */
export const SizeLarge: Story = {
  args: {
    size: 'lg',
    'aria-label': 'Large checkbox',
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <Checkbox size="sm" checked aria-label="Small checkbox" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Checkbox size="md" checked aria-label="Medium checkbox" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Checkbox size="lg" checked aria-label="Large checkbox" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Large</span>
      </div>
    </div>
  ),
};

// =============================================================================
// Responsive Sizing
// =============================================================================

/** Responsive sizing - grows at larger breakpoints */
export const ResponsiveSizing: Story = {
  args: {
    size: { base: 'sm', md: 'md', lg: 'lg' },
    'aria-label': 'Responsive checkbox',
    checked: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'This checkbox changes size at different breakpoints. Resize the viewport to see the effect.',
      },
    },
  },
};

// =============================================================================
// With Labels
// =============================================================================

/** Checkbox with wrapping label (recommended pattern) */
export const WithWrappingLabel: Story = {
  render: () => (
    <label className="flex cursor-pointer items-center gap-3">
      <Checkbox aria-label="I agree to the terms and conditions" />
      <span className="text-sm text-[rgb(var(--foreground))]">
        I agree to the terms and conditions
      </span>
    </label>
  ),
};

/** Checked checkbox with wrapping label */
export const CheckedWithWrappingLabel: Story = {
  render: () => (
    <label className="flex cursor-pointer items-center gap-3">
      <Checkbox checked aria-label="Remember me" />
      <span className="text-sm text-[rgb(var(--foreground))]">Remember me</span>
    </label>
  ),
};

/** Disabled checkbox with label */
export const DisabledWithLabel: Story = {
  render: () => (
    <label className="flex cursor-not-allowed items-center gap-3 opacity-50">
      <Checkbox disabled aria-label="This option is not available" />
      <span className="text-sm text-[rgb(var(--foreground))]">This option is not available</span>
    </label>
  ),
};

/** Checkbox with htmlFor association */
export const WithHtmlFor: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Checkbox id="newsletter" aria-label="Subscribe to newsletter" />
      <label htmlFor="newsletter" className="cursor-pointer text-sm text-[rgb(var(--foreground))]">
        Subscribe to newsletter
      </label>
    </div>
  ),
};

// =============================================================================
// Interactive Examples
// =============================================================================

/** Interactive checkbox with state */
export const Interactive: Story = {
  render: function InteractiveCheckbox() {
    const [checked, setChecked] = useState(false);
    return (
      <label className="flex cursor-pointer items-center gap-3">
        <Checkbox
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          aria-label="Toggle me"
        />
        <span className="text-sm text-[rgb(var(--foreground))]">
          Click to toggle (currently: {checked ? 'checked' : 'unchecked'})
        </span>
      </label>
    );
  },
};

/** Controlled with external state display */
export const ControlledWithDisplay: Story = {
  render: function ControlledCheckbox() {
    const [checked, setChecked] = useState(false);
    return (
      <div className="flex flex-col gap-4">
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            aria-label="Controlled checkbox"
          />
          <span className="text-sm text-[rgb(var(--foreground))]">Controlled checkbox</span>
        </label>
        <div className="rounded-md bg-[rgb(var(--muted))] p-3">
          <span className="text-xs text-[rgb(var(--muted-foreground))]">
            State: <code className="font-mono">{checked ? 'true' : 'false'}</code>
          </span>
        </div>
      </div>
    );
  },
};

// =============================================================================
// All States Overview
// =============================================================================

/** All checkbox states */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="w-28 text-sm text-[rgb(var(--muted-foreground))]">Normal:</span>
        <Checkbox aria-label="Normal unchecked" />
        <Checkbox checked aria-label="Normal checked" />
        <Checkbox indeterminate aria-label="Normal indeterminate" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-28 text-sm text-[rgb(var(--muted-foreground))]">Disabled:</span>
        <Checkbox disabled aria-label="Disabled unchecked" />
        <Checkbox checked disabled aria-label="Disabled checked" />
        <Checkbox indeterminate disabled aria-label="Disabled indeterminate" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-28 text-sm text-[rgb(var(--muted-foreground))]">Error:</span>
        <Checkbox error aria-label="Error unchecked" />
        <Checkbox checked error aria-label="Error checked" />
        <Checkbox indeterminate error aria-label="Error indeterminate" />
      </div>
    </div>
  ),
};

// =============================================================================
// Form Patterns
// =============================================================================

/** Checkbox list example */
export const CheckboxList: Story = {
  render: function CheckboxListExample() {
    const [selections, setSelections] = useState({
      technology: true,
      design: true,
      business: false,
      science: false,
    });

    const handleChange =
      (key: keyof typeof selections) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelections((prev) => ({ ...prev, [key]: e.target.checked }));
      };

    return (
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">
          Select your interests:
        </legend>
        {Object.entries(selections).map(([key, checked]) => (
          <label key={key} className="flex cursor-pointer items-center gap-3">
            <Checkbox
              checked={checked}
              onChange={handleChange(key as keyof typeof selections)}
              aria-label={key.charAt(0).toUpperCase() + key.slice(1)}
            />
            <span className="text-sm capitalize text-[rgb(var(--foreground))]">{key}</span>
          </label>
        ))}
      </fieldset>
    );
  },
};

/** Select all with indeterminate pattern */
export const SelectAllPattern: Story = {
  render: function SelectAllExample() {
    const [items, setItems] = useState({
      item1: true,
      item2: true,
      item3: false,
    });

    const allChecked = Object.values(items).every(Boolean);
    const someChecked = Object.values(items).some(Boolean);
    const indeterminate = someChecked && !allChecked;

    const handleSelectAll = () => {
      const newValue = !allChecked;
      setItems({
        item1: newValue,
        item2: newValue,
        item3: newValue,
      });
    };

    const handleItemChange =
      (key: keyof typeof items) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setItems((prev) => ({ ...prev, [key]: e.target.checked }));
      };

    return (
      <div className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-center gap-3 border-b border-[rgb(var(--border))] pb-2">
          <Checkbox
            checked={allChecked}
            indeterminate={indeterminate}
            onChange={handleSelectAll}
            aria-label="Select all items"
          />
          <span className="text-sm font-medium text-[rgb(var(--foreground))]">
            Select all items
          </span>
        </label>
        <div className="flex flex-col gap-2 pl-6">
          {Object.entries(items).map(([key, checked], index) => (
            <label key={key} className="flex cursor-pointer items-center gap-3">
              <Checkbox
                checked={checked}
                onChange={handleItemChange(key as keyof typeof items)}
                aria-label={`Item ${index + 1}`}
              />
              <span className="text-sm text-[rgb(var(--foreground))]">Item {index + 1}</span>
            </label>
          ))}
        </div>
      </div>
    );
  },
};

/** Form validation example */
export const FormValidation: Story = {
  render: function FormValidationExample() {
    const [accepted, setAccepted] = useState(false);
    const [showError, setShowError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!accepted) {
        setShowError(true);
      } else {
        setShowError(false);
        alert('Form submitted!');
      }
    };

    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              checked={accepted}
              onChange={(e) => {
                setAccepted(e.target.checked);
                if (e.target.checked) setShowError(false);
              }}
              error={showError}
              aria-describedby={showError ? 'terms-error' : undefined}
              aria-label="Accept terms"
            />
            <span className="text-sm text-[rgb(var(--foreground))]">
              I accept the terms and conditions{' '}
              <span className="text-[rgb(var(--destructive))]">*</span>
            </span>
          </label>
          {showError && (
            <span id="terms-error" className="text-xs text-[rgb(var(--destructive))]" role="alert">
              You must accept the terms to continue
            </span>
          )}
        </div>
        <button
          type="submit"
          className="rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[rgb(var(--primary-foreground))] hover:bg-[rgb(var(--primary))]/90"
        >
          Submit
        </button>
      </form>
    );
  },
};

// =============================================================================
// Accessibility Demos
// =============================================================================

/** Focus ring visibility demo */
export const FocusRingDemo: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Tab through checkboxes to see focus ring on different backgrounds
      </p>
      <div className="flex gap-8">
        <div className="rounded-md bg-[rgb(var(--background))] p-4">
          <label className="flex items-center gap-3">
            <Checkbox aria-label="Light background checkbox" />
            <span className="text-sm">Light bg</span>
          </label>
        </div>
        <div className="rounded-md bg-[rgb(var(--muted))] p-4">
          <label className="flex items-center gap-3">
            <Checkbox checked aria-label="Muted background checkbox" />
            <span className="text-sm">Muted bg</span>
          </label>
        </div>
        <div className="rounded-md bg-[rgb(var(--primary))] p-4">
          <label className="flex items-center gap-3">
            <Checkbox aria-label="Primary background checkbox" />
            <span className="text-sm text-[rgb(var(--primary-foreground))]">Primary bg</span>
          </label>
        </div>
      </div>
    </div>
  ),
};

/** Touch target demo - showing the 44px minimum touch area */
export const TouchTargetDemo: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Touch targets are 44px minimum on mobile (WCAG 2.5.5). The purple outline shows the touch
        area.
      </p>
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="inline-block rounded-md outline-dashed outline-2 outline-purple-400">
            <Checkbox size="sm" aria-label="Small checkbox touch target" />
          </div>
          <span className="text-xs text-[rgb(var(--muted-foreground))]">Small</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="inline-block rounded-md outline-dashed outline-2 outline-purple-400">
            <Checkbox size="md" aria-label="Medium checkbox touch target" />
          </div>
          <span className="text-xs text-[rgb(var(--muted-foreground))]">Medium</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="inline-block rounded-md outline-dashed outline-2 outline-purple-400">
            <Checkbox size="lg" aria-label="Large checkbox touch target" />
          </div>
          <span className="text-xs text-[rgb(var(--muted-foreground))]">Large</span>
        </div>
      </div>
    </div>
  ),
};

/** Screen reader demo */
export const ScreenReaderDemo: Story = {
  render: function ScreenReaderDemoExample() {
    const [checked, setChecked] = useState(false);
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Screen readers will announce state changes when the checkbox is toggled.
        </p>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            aria-label="Accessible checkbox"
          />
          <span className="text-sm text-[rgb(var(--foreground))]">
            Toggle me (state announcements are made to screen readers)
          </span>
        </label>
      </div>
    );
  },
};

/** Keyboard navigation demo */
export const KeyboardNavigationDemo: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Use Tab to navigate and Space to toggle checkboxes
      </p>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Keyboard navigation example:</legend>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox aria-label="Option A" />
          <span className="text-sm">Option A</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox aria-label="Option B" />
          <span className="text-sm">Option B</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <Checkbox aria-label="Option C" />
          <span className="text-sm">Option C</span>
        </label>
      </fieldset>
    </div>
  ),
};

// =============================================================================
// Real-World Examples
// =============================================================================

/** Settings panel example */
export const SettingsPanel: Story = {
  render: function SettingsPanelExample() {
    const [settings, setSettings] = useState({
      notifications: true,
      marketing: false,
      analytics: true,
      updates: true,
    });

    const handleChange =
      (key: keyof typeof settings) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings((prev) => ({ ...prev, [key]: e.target.checked }));
      };

    return (
      <div className="w-80 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
        <h3 className="mb-4 text-sm font-semibold text-[rgb(var(--foreground))]">
          Notification Settings
        </h3>
        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm text-[rgb(var(--foreground))]">Push notifications</span>
            <Checkbox
              checked={settings.notifications}
              onChange={handleChange('notifications')}
              aria-label="Push notifications"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm text-[rgb(var(--foreground))]">Marketing emails</span>
            <Checkbox
              checked={settings.marketing}
              onChange={handleChange('marketing')}
              aria-label="Marketing emails"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm text-[rgb(var(--foreground))]">Usage analytics</span>
            <Checkbox
              checked={settings.analytics}
              onChange={handleChange('analytics')}
              aria-label="Usage analytics"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm text-[rgb(var(--foreground))]">Product updates</span>
            <Checkbox
              checked={settings.updates}
              onChange={handleChange('updates')}
              aria-label="Product updates"
            />
          </label>
        </div>
      </div>
    );
  },
};

/** Task list example */
export const TaskList: Story = {
  render: function TaskListExample() {
    const [tasks, setTasks] = useState([
      { id: 1, text: 'Review pull request', done: true },
      { id: 2, text: 'Update documentation', done: false },
      { id: 3, text: 'Fix accessibility issues', done: false },
      { id: 4, text: 'Deploy to staging', done: false },
    ]);

    const handleToggle = (id: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setTasks((prev) =>
        prev.map((task) => (task.id === id ? { ...task, done: e.target.checked } : task))
      );
    };

    return (
      <div className="w-80 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="border-b border-[rgb(var(--border))] px-4 py-3">
          <h3 className="text-sm font-semibold text-[rgb(var(--foreground))]">Today's Tasks</h3>
        </div>
        <ul className="divide-y divide-[rgb(var(--border))]">
          {tasks.map((task) => (
            <li key={task.id}>
              <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[rgb(var(--muted))]/50">
                <Checkbox
                  checked={task.done}
                  onChange={handleToggle(task.id)}
                  aria-label={`${task.text} - ${task.done ? 'completed' : 'pending'}`}
                />
                <span
                  className={`text-sm ${
                    task.done
                      ? 'text-[rgb(var(--muted-foreground))] line-through'
                      : 'text-[rgb(var(--foreground))]'
                  }`}
                >
                  {task.text}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    );
  },
};

// =============================================================================
// Data Test ID
// =============================================================================

/** With data-testid for testing */
export const WithTestId: Story = {
  args: {
    'data-testid': 'my-checkbox',
    'aria-label': 'Test checkbox',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use `data-testid` prop for testing with tools like Testing Library.',
      },
    },
  },
};
