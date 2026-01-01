import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
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
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Visual size of the textarea',
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
    maxLength: {
      control: 'number',
      description: 'Maximum character length',
    },
    showCharacterCount: {
      control: 'boolean',
      description: 'Show character count (requires maxLength)',
    },
    onChange: { action: 'changed' },
    onFocus: { action: 'focused' },
    onBlur: { action: 'blurred' },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

// =============================================================================
// Basic Variants
// =============================================================================

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

// =============================================================================
// Size Variants
// =============================================================================

/** Small size */
export const SizeSmall: Story = {
  args: {
    placeholder: 'Small textarea',
    size: 'sm',
  },
};

/** Medium size (default) */
export const SizeMedium: Story = {
  args: {
    placeholder: 'Medium textarea',
    size: 'md',
  },
};

/** Large size */
export const SizeLarge: Story = {
  args: {
    placeholder: 'Large textarea',
    size: 'lg',
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div>
        <label htmlFor="size-sm" className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">
          Small
        </label>
        <Textarea id="size-sm" placeholder="Small textarea" size="sm" />
      </div>
      <div>
        <label htmlFor="size-md" className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">
          Medium (default)
        </label>
        <Textarea id="size-md" placeholder="Medium textarea" size="md" />
      </div>
      <div>
        <label htmlFor="size-lg" className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block">
          Large
        </label>
        <Textarea id="size-lg" placeholder="Large textarea" size="lg" />
      </div>
    </div>
  ),
};

/** Responsive sizing - adapts to screen size */
export const ResponsiveSize: Story = {
  args: {
    placeholder: 'Resize the window to see size change',
    size: { base: 'sm', md: 'md', lg: 'lg' },
  },
};

// =============================================================================
// Error States
// =============================================================================

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
        errorMessageId="desc-error"
      />
      <span id="desc-error" className="text-xs text-[rgb(var(--destructive))]">
        Description must be at least 50 characters
      </span>
    </div>
  ),
};

/** Error with multiple validators */
export const ErrorWithMultipleMessages: Story = {
  render: () => (
    <div className="flex flex-col gap-1 w-80">
      <Textarea
        placeholder="Enter content"
        defaultValue="bad"
        error
        errorMessageId="content-error"
        aria-describedby="content-hint content-error"
      />
      <span id="content-hint" className="text-xs text-[rgb(var(--muted-foreground))]">
        Content should be meaningful and descriptive
      </span>
      <span id="content-error" className="text-xs text-[rgb(var(--destructive))]">
        Content is too short (minimum 20 characters)
      </span>
    </div>
  ),
};

// =============================================================================
// Disabled States
// =============================================================================

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

// =============================================================================
// Resize Variants
// =============================================================================

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

// =============================================================================
// Character Count
// =============================================================================

/** Basic character count */
export const WithCharacterCount: Story = {
  args: {
    placeholder: 'Enter your message (max 200 characters)',
    maxLength: 200,
    showCharacterCount: true,
  },
};

/** Character count with value */
export const CharacterCountWithValue: Story = {
  args: {
    defaultValue: 'This is some sample text to demonstrate the character count feature.',
    maxLength: 200,
    showCharacterCount: true,
  },
};

/** Interactive character count */
export const CharacterCountInteractive: Story = {
  render: function CharacterCountDemo() {
    const [value, setValue] = useState('');
    const maxLength = 100;
    return (
      <div className="flex flex-col gap-2 w-80">
        <label htmlFor="char-count-demo" className="text-sm font-medium">
          Bio (max {maxLength} characters)
        </label>
        <Textarea
          id="char-count-demo"
          placeholder="Tell us about yourself..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={maxLength}
          showCharacterCount
        />
      </div>
    );
  },
};

/** Character count near limit */
export const CharacterCountNearLimit: Story = {
  args: {
    defaultValue:
      'This text is close to the character limit. Only a few more characters can be typed before reaching the maximum allowed.',
    maxLength: 140,
    showCharacterCount: true,
  },
};

/** Character count at limit (shows red) */
export const CharacterCountAtLimit: Story = {
  args: {
    defaultValue:
      'This text has exactly reached the character limit. No more text can be typed into this field now.',
    maxLength: 100,
    showCharacterCount: true,
  },
};

/** Character count with different sizes */
export const CharacterCountSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div>
        <label
          htmlFor="count-sm"
          className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block"
        >
          Small
        </label>
        <Textarea
          id="count-sm"
          placeholder="Small with count"
          size="sm"
          maxLength={100}
          showCharacterCount
        />
      </div>
      <div>
        <label
          htmlFor="count-md"
          className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block"
        >
          Medium
        </label>
        <Textarea
          id="count-md"
          placeholder="Medium with count"
          size="md"
          maxLength={100}
          showCharacterCount
        />
      </div>
      <div>
        <label
          htmlFor="count-lg"
          className="text-xs text-[rgb(var(--muted-foreground))] mb-1 block"
        >
          Large
        </label>
        <Textarea
          id="count-lg"
          placeholder="Large with count"
          size="lg"
          maxLength={100}
          showCharacterCount
        />
      </div>
    </div>
  ),
};

// =============================================================================
// Required and Validation
// =============================================================================

/** Required textarea */
export const Required: Story = {
  args: {
    placeholder: 'Required field',
    required: true,
  },
};

/** Textarea with max length (no visual count) */
export const WithMaxLength: Story = {
  args: {
    placeholder: 'Limited to 100 characters (no visual count)',
    maxLength: 100,
  },
};

// =============================================================================
// All States Showcase
// =============================================================================

/** All states showcase */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <Textarea placeholder="Default" />
      <Textarea placeholder="With value" defaultValue="Some text content" />
      <Textarea placeholder="Error state" error defaultValue="Invalid content" />
      <Textarea placeholder="Disabled" disabled />
      <Textarea placeholder="Disabled with value" disabled defaultValue="Cannot edit" />
      <Textarea
        placeholder="With character count"
        maxLength={100}
        showCharacterCount
        defaultValue="Sample text"
      />
    </div>
  ),
};

// =============================================================================
// Accessibility Demos
// =============================================================================

/** Focus ring visibility */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-80">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Focus each textarea to see the focus ring. Ring uses offset for visibility.
      </p>
      <div className="bg-white p-4 rounded-md border">
        <Textarea placeholder="Focus on light background" />
      </div>
      <div className="bg-slate-900 p-4 rounded-md">
        <Textarea placeholder="Focus on dark background" />
      </div>
      <div className="bg-blue-100 p-4 rounded-md">
        <Textarea placeholder="Focus on colored background" />
      </div>
    </div>
  ),
};

/** Screen reader accessibility */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Error and character limit messages are announced to screen readers.
      </p>
      <div>
        <label htmlFor="sr-error" className="text-sm font-medium block mb-1">
          With error (aria-live assertive)
        </label>
        <Textarea
          id="sr-error"
          error
          errorMessageId="sr-error-msg"
          defaultValue="Invalid"
          placeholder="This has an error"
        />
        <span id="sr-error-msg" className="text-xs text-[rgb(var(--destructive))] mt-1">
          This field is invalid
        </span>
      </div>
      <div>
        <label htmlFor="sr-count" className="text-sm font-medium block mb-1">
          Near character limit (aria-live polite)
        </label>
        <Textarea
          id="sr-count"
          maxLength={50}
          showCharacterCount
          defaultValue="This text is close to the character limit now"
          placeholder="Character limit approaching"
        />
      </div>
    </div>
  ),
};

/** Keyboard navigation */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Use Tab to navigate between textareas. Focus ring indicates current field.
      </p>
      <Textarea placeholder="First field" />
      <Textarea placeholder="Second field" />
      <Textarea placeholder="Third field" />
    </div>
  ),
};

// =============================================================================
// Ref and Data Attributes
// =============================================================================

/** With data-testid */
export const WithTestId: Story = {
  args: {
    placeholder: 'Textarea with test ID',
    'data-testid': 'my-textarea',
  },
};

/** Textarea with custom width */
export const CustomWidth: Story = {
  args: {
    placeholder: 'Wide textarea',
    className: 'w-96',
  },
};

// =============================================================================
// Real-World Examples
// =============================================================================

/** Comment form */
export const CommentForm: Story = {
  render: function CommentFormDemo() {
    const [comment, setComment] = useState('');
    const maxLength = 500;
    return (
      <form className="flex flex-col gap-3 w-96">
        <label htmlFor="comment" className="text-sm font-medium">
          Leave a comment
        </label>
        <Textarea
          id="comment"
          placeholder="Share your thoughts..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={maxLength}
          showCharacterCount
          rows={4}
        />
        <button
          type="submit"
          disabled={comment.length === 0}
          className="self-end px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-md disabled:opacity-50"
        >
          Post Comment
        </button>
      </form>
    );
  },
};

/** Feedback form with validation */
export const FeedbackForm: Story = {
  render: function FeedbackFormDemo() {
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (feedback.length < 20) {
        setError('Feedback must be at least 20 characters');
        return;
      }
      setError('');
      setSubmitted(true);
    };

    if (submitted) {
      return (
        <div className="w-96 p-4 bg-green-100 rounded-md">
          <p className="text-green-800">Thank you for your feedback!</p>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-96">
        <label htmlFor="feedback" className="text-sm font-medium">
          How can we improve?
        </label>
        <Textarea
          id="feedback"
          placeholder="Tell us what you think..."
          value={feedback}
          onChange={(e) => {
            setFeedback(e.target.value);
            if (error && e.target.value.length >= 20) {
              setError('');
            }
          }}
          error={Boolean(error)}
          errorMessageId={error ? 'feedback-error' : undefined}
          maxLength={1000}
          showCharacterCount
          rows={5}
        />
        {error && (
          <span id="feedback-error" className="text-xs text-[rgb(var(--destructive))]">
            {error}
          </span>
        )}
        <button
          type="submit"
          className="self-end px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-md"
        >
          Submit Feedback
        </button>
      </form>
    );
  },
};

/** Code input (no resize, monospace font) */
export const CodeInput: Story = {
  args: {
    placeholder: 'Paste your code here...',
    className: 'font-mono',
    resize: 'none',
    rows: 10,
    spellCheck: false,
  },
};

/** Notes section with autosave indicator */
export const NotesSection: Story = {
  render: function NotesDemo() {
    const [notes, setNotes] = useState('');
    const [saved, setSaved] = useState(true);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNotes(e.target.value);
      setSaved(false);
      // Simulate autosave after 1 second
      setTimeout(() => setSaved(true), 1000);
    };

    return (
      <div className="flex flex-col gap-2 w-96">
        <div className="flex justify-between items-center">
          <label htmlFor="notes" className="text-sm font-medium">
            Notes
          </label>
          <span className="text-xs text-[rgb(var(--muted-foreground))]">
            {saved ? 'Saved' : 'Saving...'}
          </span>
        </div>
        <Textarea
          id="notes"
          placeholder="Add your notes here..."
          value={notes}
          onChange={handleChange}
          resize="vertical"
          rows={6}
        />
      </div>
    );
  },
};

/** Multi-field form */
export const MultiFieldForm: Story = {
  render: () => (
    <form className="flex flex-col gap-4 w-96">
      <div>
        <label htmlFor="title" className="text-sm font-medium block mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter title"
        />
      </div>
      <div>
        <label htmlFor="summary" className="text-sm font-medium block mb-1">
          Summary
        </label>
        <Textarea
          id="summary"
          placeholder="Brief summary..."
          size="sm"
          maxLength={200}
          showCharacterCount
          rows={2}
        />
      </div>
      <div>
        <label htmlFor="body" className="text-sm font-medium block mb-1">
          Content
        </label>
        <Textarea id="body" placeholder="Full content..." size="md" rows={6} />
      </div>
    </form>
  ),
};
