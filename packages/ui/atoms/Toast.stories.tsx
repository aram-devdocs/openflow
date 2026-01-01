import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useRef, useState } from 'react';
import { Toast, type ToastVariant } from './Toast';

const meta: Meta<typeof Toast> = {
  title: 'Atoms/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Toast notification component with full accessibility support.

## Accessibility Features
- Uses \`role="alert"\` for errors (assertive announcement)
- Uses \`role="status"\` for other variants (polite announcement)
- \`aria-live\` region ensures screen reader announcements
- Dismiss button has proper accessible label
- Touch target ≥44px on mobile (WCAG 2.5.5)
- Icons are decorative (aria-hidden)
- Status conveyed beyond color through icons and screen reader text

## Responsive
- Supports responsive sizes via ResponsiveValue<ToastSize>
- Proper stacking and layout on mobile screens
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info'],
      description: 'Visual style variant - affects colors and ARIA role',
      table: {
        defaultValue: { summary: 'info' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the toast - supports responsive values',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    title: {
      control: 'text',
      description: 'Title text (required)',
    },
    description: {
      control: 'text',
      description: 'Optional description text',
    },
    dismissLabel: {
      control: 'text',
      description: 'Custom aria-label for dismiss button',
      table: {
        defaultValue: { summary: 'Dismiss notification' },
      },
    },
    onDismiss: { action: 'dismissed' },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

// ============================================================================
// Basic Variants
// ============================================================================

/** Default info toast - uses role="status" for polite announcements */
export const Default: Story = {
  args: {
    id: '1',
    variant: 'info',
    title: 'Information',
    description: 'This is an informational message.',
  },
};

/** Success toast - operation completed, uses role="status" */
export const Success: Story = {
  args: {
    id: '2',
    variant: 'success',
    title: 'Project created',
    description: 'Your project has been successfully created.',
  },
};

/** Error toast - uses role="alert" for assertive (immediate) announcements */
export const ErrorToast: Story = {
  args: {
    id: '3',
    variant: 'error',
    title: 'Failed to save',
    description: 'An error occurred while saving your changes.',
  },
};

/** Warning toast - caution, uses role="status" */
export const Warning: Story = {
  args: {
    id: '4',
    variant: 'warning',
    title: 'Unsaved changes',
    description: 'You have unsaved changes that may be lost.',
  },
};

/** Info toast - informational, uses role="status" */
export const Info: Story = {
  args: {
    id: '5',
    variant: 'info',
    title: 'New update available',
    description: 'Version 2.0 is ready to install.',
  },
};

// ============================================================================
// Sizes
// ============================================================================

/** Small toast - compact for tight spaces */
export const SizeSmall: Story = {
  args: {
    id: '6',
    variant: 'info',
    size: 'sm',
    title: 'Small toast',
    description: 'More compact padding and text.',
  },
};

/** Medium toast - default size */
export const SizeMedium: Story = {
  args: {
    id: '7',
    variant: 'info',
    size: 'md',
    title: 'Medium toast',
    description: 'Default padding and text size.',
  },
};

/** Large toast - more prominent */
export const SizeLarge: Story = {
  args: {
    id: '8',
    variant: 'info',
    size: 'lg',
    title: 'Large toast',
    description: 'Larger padding and text for emphasis.',
  },
};

/** Responsive sizing - adapts to viewport */
export const ResponsiveSize: Story = {
  args: {
    id: '9',
    variant: 'info',
    size: { base: 'sm', md: 'md', lg: 'lg' },
    title: 'Responsive toast',
    description:
      'Size changes based on viewport width. Small on mobile, medium on tablet, large on desktop.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Resize the viewport to see the toast change size. Uses ResponsiveValue for size prop.',
      },
    },
  },
};

// ============================================================================
// Action Buttons
// ============================================================================

/** Toast with action button - for user actions */
export const WithAction: Story = {
  args: {
    id: '10',
    variant: 'error',
    title: 'Failed to save',
    description: 'Would you like to retry?',
    action: {
      label: 'Retry',
      onClick: () => console.log('Retry clicked'),
    },
  },
};

/** Action with custom aria-label */
export const ActionWithAriaLabel: Story = {
  args: {
    id: '11',
    variant: 'info',
    title: 'New version available',
    description: 'Update now to get the latest features.',
    action: {
      label: 'Update',
      'aria-label': 'Update application to version 2.0',
      onClick: () => console.log('Update clicked'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Action button with custom aria-label for more descriptive screen reader text.',
      },
    },
  },
};

/** Success with view action */
export const SuccessWithAction: Story = {
  args: {
    id: '12',
    variant: 'success',
    title: 'File uploaded',
    description: 'document.pdf was uploaded successfully.',
    action: {
      label: 'View file',
      onClick: () => console.log('View clicked'),
    },
  },
};

// ============================================================================
// Content Variations
// ============================================================================

/** Toast without dismiss button - for auto-dismissing toasts */
export const NoDismiss: Story = {
  args: {
    id: '13',
    variant: 'success',
    title: 'Auto-dismissing',
    description: 'This toast will dismiss automatically.',
    onDismiss: undefined,
  },
};

/** Toast without description - title only */
export const TitleOnly: Story = {
  args: {
    id: '14',
    variant: 'info',
    title: 'Brief notification',
  },
};

/** Toast with long content - text wrapping */
export const LongContent: Story = {
  args: {
    id: '15',
    variant: 'warning',
    title: 'Multiple files affected',
    description:
      'This operation will affect 15 files across 3 directories. Please review the changes carefully before proceeding with this action.',
  },
};

/** Custom dismiss label */
export const CustomDismissLabel: Story = {
  args: {
    id: '16',
    variant: 'info',
    title: 'Custom dismiss',
    description: 'This toast has a custom dismiss button label.',
    dismissLabel: 'Close this notification',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom aria-label on dismiss button for more context.',
      },
    },
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/** All variants with ARIA roles - demonstrates role differences */
export const AllVariantsWithRoles: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-[rgb(var(--muted-foreground))] mb-2">
        Error uses role=&quot;alert&quot; (assertive), others use role=&quot;status&quot; (polite)
      </div>
      <Toast
        id="1"
        variant="error"
        title="Error (role=alert)"
        description="Immediately announces to screen readers."
        onDismiss={() => {}}
      />
      <Toast
        id="2"
        variant="success"
        title="Success (role=status)"
        description="Waits for a pause before announcing."
        onDismiss={() => {}}
      />
      <Toast
        id="3"
        variant="warning"
        title="Warning (role=status)"
        description="Polite announcement to screen readers."
        onDismiss={() => {}}
      />
      <Toast
        id="4"
        variant="info"
        title="Info (role=status)"
        description="Standard polite announcement."
        onDismiss={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates ARIA role differences:
- **Error** uses \`role="alert"\` with \`aria-live="assertive"\` for immediate screen reader interruption
- **Other variants** use \`role="status"\` with \`aria-live="polite"\` which waits for a pause
        `,
      },
    },
  },
};

/** Focus ring visibility demonstration */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-[rgb(var(--muted-foreground))] mb-2">
        Tab through to see focus rings on action and dismiss buttons
      </div>
      <Toast
        id="1"
        variant="error"
        title="Tab to see focus rings"
        description="Both the action button and dismiss button have visible focus rings."
        action={{
          label: 'Retry',
          onClick: () => {},
        }}
        onDismiss={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Focus rings are visible on keyboard navigation. Tab through to test.',
      },
    },
  },
};

/** Touch target accessibility - 44px minimum */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-[rgb(var(--muted-foreground))] mb-2">
        Buttons have 44px minimum touch target on mobile (WCAG 2.5.5)
      </div>
      <Toast
        id="1"
        variant="info"
        size="sm"
        title="Touch targets"
        description="Even in small size, buttons maintain 44px touch target on mobile."
        action={{
          label: 'Action',
          onClick: () => {},
        }}
        onDismiss={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Action and dismiss buttons have min 44x44px touch targets on mobile devices.',
      },
    },
  },
};

/** Screen reader accessibility - variant prefixes */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-[rgb(var(--muted-foreground))] mb-2">
        Screen readers announce variant prefix (Error:, Warning:, Success:)
      </div>
      <Toast
        id="1"
        variant="error"
        title="Connection failed"
        description="Screen reader will announce 'Error: Connection failed'."
        onDismiss={() => {}}
      />
      <Toast
        id="2"
        variant="warning"
        title="Low battery"
        description="Screen reader will announce 'Warning: Low battery'."
        onDismiss={() => {}}
      />
      <Toast
        id="3"
        variant="success"
        title="Saved"
        description="Screen reader will announce 'Success: Saved'."
        onDismiss={() => {}}
      />
      <Toast
        id="4"
        variant="info"
        title="New message"
        description="Info variant has no prefix - just reads the title directly."
        onDismiss={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'VisuallyHidden text prepends variant type for screen readers.',
      },
    },
  },
};

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-[rgb(var(--muted-foreground))] mb-2">
        Use Tab to navigate between action and dismiss buttons
      </div>
      <Toast
        id="1"
        variant="error"
        title="Keyboard navigation"
        description="Press Tab to focus action, Tab again for dismiss. Enter/Space to activate."
        action={{
          label: 'Primary action',
          onClick: () => alert('Action clicked!'),
        }}
        onDismiss={() => alert('Dismissed!')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All interactive elements are keyboard accessible.',
      },
    },
  },
};

// ============================================================================
// Ref Forwarding & Testing
// ============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  render: function RefDemo() {
    const toastRef = useRef<HTMLDivElement>(null);
    const [message, setMessage] = useState('Click button to log ref');

    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => {
            if (toastRef.current) {
              setMessage(
                `Toast element: ${toastRef.current.tagName}, role: ${toastRef.current.getAttribute('role')}`
              );
            }
          }}
          className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded"
        >
          Log ref info
        </button>
        <div className="text-sm text-[rgb(var(--muted-foreground))]">{message}</div>
        <Toast
          ref={toastRef}
          id="ref-demo"
          variant="info"
          title="Ref forwarding"
          description="This toast forwards its ref."
          onDismiss={() => {}}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Toast supports ref forwarding for programmatic access.',
      },
    },
  },
};

/** Data-testid support */
export const DataTestId: Story = {
  args: {
    id: 'test-1',
    variant: 'success',
    title: 'Test toast',
    description: 'Has data-testid for automated testing.',
    'data-testid': 'my-toast',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Supports data-testid for automated testing. Dismiss button gets `{testid}-dismiss`.',
      },
    },
  },
};

// ============================================================================
// Interactive Demos
// ============================================================================

/** Interactive demo with state management */
export const InteractiveDemo: Story = {
  render: function InteractiveToasts() {
    const [toasts, setToasts] = useState<
      Array<{ id: string; variant: ToastVariant; title: string; description: string }>
    >([
      {
        id: '1',
        variant: 'error',
        title: 'Connection lost',
        description: 'Unable to connect to the server.',
      },
      {
        id: '2',
        variant: 'success',
        title: 'File uploaded',
        description: 'document.pdf was uploaded.',
      },
    ]);

    const handleDismiss = useCallback((id: string) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(() => {
      const variants: ToastVariant[] = ['success', 'error', 'warning', 'info'];
      const variant = variants[Math.floor(Math.random() * variants.length)] ?? 'info';
      const newToast = {
        id: Date.now().toString(),
        variant,
        title: `New ${variant} toast`,
        description: 'This is a dynamically added toast.',
      };
      setToasts((prev) => [...prev, newToast]);
    }, []);

    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={addToast}
          className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded self-start"
        >
          Add random toast
        </button>
        <div className="flex flex-col gap-2">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              variant={toast.variant}
              title={toast.title}
              description={toast.description}
              action={
                toast.variant === 'error'
                  ? { label: 'Retry', onClick: () => alert('Retrying...') }
                  : undefined
              }
              onDismiss={handleDismiss}
            />
          ))}
          {toasts.length === 0 && (
            <div className="text-[rgb(var(--muted-foreground))] text-sm">
              No toasts. Click button to add some.
            </div>
          )}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing toast state management with add and dismiss.',
      },
    },
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** Form submission feedback */
export const FormSubmissionFeedback: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="text-sm font-medium">Form submission scenarios:</div>
      <Toast
        id="1"
        variant="success"
        title="Form submitted"
        description="Thank you for your feedback. We'll get back to you within 24 hours."
        onDismiss={() => {}}
      />
      <Toast
        id="2"
        variant="error"
        title="Submission failed"
        description="Please check your internet connection and try again."
        action={{
          label: 'Retry',
          onClick: () => {},
        }}
        onDismiss={() => {}}
      />
    </div>
  ),
};

/** File operations */
export const FileOperations: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="text-sm font-medium">File operation notifications:</div>
      <Toast
        id="1"
        variant="success"
        title="3 files uploaded"
        description="report.pdf, data.xlsx, and image.png"
        action={{
          label: 'View files',
          onClick: () => {},
        }}
        onDismiss={() => {}}
      />
      <Toast
        id="2"
        variant="warning"
        title="Large file detected"
        description="upload.zip (2.3 GB) may take several minutes."
        onDismiss={() => {}}
      />
      <Toast
        id="3"
        variant="error"
        title="Upload failed"
        description="video.mp4 exceeds the 100 MB limit."
        action={{
          label: 'Upgrade plan',
          onClick: () => {},
        }}
        onDismiss={() => {}}
      />
    </div>
  ),
};

/** Network status notifications */
export const NetworkStatus: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="text-sm font-medium">Network status updates:</div>
      <Toast
        id="1"
        variant="error"
        title="Connection lost"
        description="You appear to be offline. Changes will sync when reconnected."
        onDismiss={() => {}}
      />
      <Toast
        id="2"
        variant="success"
        title="Back online"
        description="Your connection has been restored. Syncing changes..."
        onDismiss={() => {}}
      />
      <Toast
        id="3"
        variant="warning"
        title="Slow connection"
        description="Loading may be slower than usual."
        onDismiss={() => {}}
      />
    </div>
  ),
};

/** All sizes comparison */
export const AllSizesComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-sm font-medium mb-2">Small (sm)</div>
        <Toast
          id="sm"
          variant="info"
          size="sm"
          title="Small toast"
          description="Compact padding and text."
          action={{ label: 'Action', onClick: () => {} }}
          onDismiss={() => {}}
        />
      </div>
      <div>
        <div className="text-sm font-medium mb-2">Medium (md) - Default</div>
        <Toast
          id="md"
          variant="info"
          size="md"
          title="Medium toast"
          description="Standard padding and text size."
          action={{ label: 'Action', onClick: () => {} }}
          onDismiss={() => {}}
        />
      </div>
      <div>
        <div className="text-sm font-medium mb-2">Large (lg)</div>
        <Toast
          id="lg"
          variant="info"
          size="lg"
          title="Large toast"
          description="Larger padding and text for emphasis."
          action={{ label: 'Action', onClick: () => {} }}
          onDismiss={() => {}}
        />
      </div>
    </div>
  ),
};

/** All variants comparison */
export const AllVariantsComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Toast
        id="1"
        variant="success"
        title="Success"
        description="Operation completed successfully."
        onDismiss={() => {}}
      />
      <Toast
        id="2"
        variant="error"
        title="Error"
        description="An error occurred during the operation."
        onDismiss={() => {}}
      />
      <Toast
        id="3"
        variant="warning"
        title="Warning"
        description="Please proceed with caution."
        onDismiss={() => {}}
      />
      <Toast
        id="4"
        variant="info"
        title="Info"
        description="Here is some useful information."
        onDismiss={() => {}}
      />
    </div>
  ),
};
