import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Atoms/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
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
      description: 'Disable the textarea',
    },
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'horizontal', 'both'],
      description: 'Control resize behavior',
    },
    rows: {
      control: 'number',
      description: 'Number of visible text lines',
    },
    onChange: { action: 'changed' },
    onFocus: { action: 'focused' },
    onBlur: { action: 'blurred' },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

/** Default textarea */
export const Default: Story = {
  args: {
    placeholder: 'Enter your message...',
  },
};

/** Textarea with value */
export const WithValue: Story = {
  args: {
    defaultValue:
      'This is some text content that spans multiple lines.\n\nIt can contain paragraphs and more.',
  },
};

/** Textarea with custom rows */
export const CustomRows: Story = {
  args: {
    placeholder: 'Short textarea',
    rows: 3,
  },
};

/** Textarea with many rows */
export const ManyRows: Story = {
  args: {
    placeholder: 'Tall textarea',
    rows: 10,
  },
};

/** Textarea with error state */
export const ErrorState: Story = {
  args: {
    placeholder: 'Invalid input',
    error: true,
    defaultValue: 'This content has validation errors',
  },
};

/** Error state with aria description */
export const ErrorWithDescription: Story = {
  render: () => (
    <div className="flex flex-col gap-1 w-64">
      <Textarea
        placeholder="Enter description"
        defaultValue="Too short"
        error
        aria-describedby="desc-error"
      />
      <span id="desc-error" className="text-xs text-[rgb(var(--destructive))]">
        Description must be at least 50 characters
      </span>
    </div>
  ),
};

/** Disabled textarea */
export const Disabled: Story = {
  args: {
    placeholder: 'Cannot edit',
    disabled: true,
  },
};

/** Disabled textarea with value */
export const DisabledWithValue: Story = {
  args: {
    defaultValue: 'This content is read-only and cannot be modified.',
    disabled: true,
  },
};

/** No resize (resize disabled) */
export const ResizeNone: Story = {
  args: {
    placeholder: 'Cannot resize this textarea',
    resize: 'none',
  },
};

/** Vertical resize only (default) */
export const ResizeVertical: Story = {
  args: {
    placeholder: 'Can resize vertically only',
    resize: 'vertical',
  },
};

/** Horizontal resize only */
export const ResizeHorizontal: Story = {
  args: {
    placeholder: 'Can resize horizontally only',
    resize: 'horizontal',
  },
};

/** Both directions resize */
export const ResizeBoth: Story = {
  args: {
    placeholder: 'Can resize in both directions',
    resize: 'both',
  },
};

/** Required textarea */
export const Required: Story = {
  args: {
    placeholder: 'Required field',
    required: true,
  },
};

/** Textarea with max length */
export const WithMaxLength: Story = {
  args: {
    placeholder: 'Limited to 100 characters',
    maxLength: 100,
  },
};

/** All resize options showcase */
export const AllResizeOptions: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <div>
        <label
          htmlFor="resize-none"
          className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block"
        >
          None
        </label>
        <Textarea id="resize-none" placeholder="resize: none" resize="none" />
      </div>
      <div>
        <label
          htmlFor="resize-vertical"
          className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block"
        >
          Vertical (default)
        </label>
        <Textarea id="resize-vertical" placeholder="resize: vertical" resize="vertical" />
      </div>
      <div>
        <label
          htmlFor="resize-horizontal"
          className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block"
        >
          Horizontal
        </label>
        <Textarea id="resize-horizontal" placeholder="resize: horizontal" resize="horizontal" />
      </div>
      <div>
        <label
          htmlFor="resize-both"
          className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block"
        >
          Both
        </label>
        <Textarea id="resize-both" placeholder="resize: both" resize="both" />
      </div>
    </div>
  ),
};

/** All states showcase */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <Textarea placeholder="Default" />
      <Textarea placeholder="With value" defaultValue="Some text content" />
      <Textarea placeholder="Error state" error defaultValue="Invalid content" />
      <Textarea placeholder="Disabled" disabled />
      <Textarea placeholder="Disabled with value" disabled defaultValue="Cannot edit" />
    </div>
  ),
};

/** Textarea with custom width */
export const CustomWidth: Story = {
  args: {
    placeholder: 'Wide textarea',
    className: 'w-96',
  },
};
