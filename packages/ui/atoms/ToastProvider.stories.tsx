import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import {
  DEFAULT_DURATION,
  DEFAULT_ERROR_DURATION,
  DEFAULT_MAX_TOASTS,
  DEFAULT_POSITION,
  DEFAULT_REGION_LABEL,
  POSITION_CLASSES,
  TOAST_CONTAINER_BASE_CLASSES,
  ToastProvider,
  getPositionClasses,
  resetToastIdCounter,
  useToast,
} from './ToastProvider';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof ToastProvider> = {
  title: 'Atoms/ToastProvider',
  component: ToastProvider,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
ToastProvider manages toast notifications across the application.
Wrap your app with this provider to enable toast functionality.

## Accessibility Features
- Uses \`role="region"\` for the container landmark
- Each toast has its own \`role="alert"\` or \`role="status"\` based on variant
- Screen reader announcements via aria-live regions
- Container labeled with \`aria-label\` for assistive technology navigation
- Toast count announced to screen readers when it changes

## Responsive Features
- Supports responsive position via ResponsiveValue<ToastPosition>
- Toast sizes can be configured responsively
- Container adapts to screen size (full width on mobile, max-w-md on desktop)

## Timer Management
- Auto-dismiss timers are properly cleaned up on unmount
- Dismissing a toast clears its timer
- Adding toasts when at maxToasts removes oldest first
        `,
      },
    },
  },
  decorators: [
    (Story) => {
      // Reset toast ID counter before each story for consistent IDs
      resetToastIdCounter();
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ToastProvider>;

// ============================================================================
// Helper Components
// ============================================================================

function ToastDemo() {
  const { success, error, warning, info } = useToast();

  return (
    <div className="flex flex-wrap gap-2 p-4">
      <Button onClick={() => success('Success!', 'Your action was successful.')}>
        Show Success
      </Button>
      <Button onClick={() => error('Error!', 'Something went wrong.')}>Show Error</Button>
      <Button onClick={() => warning('Warning!', 'Please be careful.')}>Show Warning</Button>
      <Button onClick={() => info('Info', 'Here is some information.')}>Show Info</Button>
    </div>
  );
}

function ToastDemoWithVariants() {
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap gap-2 p-4">
      <Button
        onClick={() =>
          toast({
            variant: 'success',
            title: 'File uploaded',
            description: 'document.pdf was uploaded successfully.',
          })
        }
      >
        Success
      </Button>
      <Button
        onClick={() =>
          toast({
            variant: 'error',
            title: 'Upload failed',
            description: 'Please check your file and try again.',
          })
        }
        variant="destructive"
      >
        Error
      </Button>
      <Button
        onClick={() =>
          toast({
            variant: 'warning',
            title: 'Low storage',
            description: 'You have less than 10% storage remaining.',
          })
        }
        variant="secondary"
      >
        Warning
      </Button>
      <Button
        onClick={() =>
          toast({
            variant: 'info',
            title: 'New feature',
            description: 'Check out the new dashboard features.',
          })
        }
        variant="ghost"
      >
        Info
      </Button>
    </div>
  );
}

function ToastDemoWithActions() {
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap gap-2 p-4">
      <Button
        onClick={() =>
          toast({
            variant: 'error',
            title: 'Failed to save',
            description: 'Your changes could not be saved.',
            action: {
              label: 'Retry',
              onClick: () => console.log('Retry clicked'),
              'aria-label': 'Retry saving changes',
            },
          })
        }
      >
        Error with Action
      </Button>
      <Button
        onClick={() =>
          toast({
            variant: 'success',
            title: 'Email sent',
            description: 'Your email has been sent.',
            action: {
              label: 'Undo',
              onClick: () => console.log('Undo clicked'),
            },
          })
        }
      >
        Success with Action
      </Button>
    </div>
  );
}

function ToastDemoWithDuration() {
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap gap-2 p-4">
      <Button
        onClick={() =>
          toast({
            variant: 'info',
            title: 'Quick toast',
            description: 'This disappears in 2 seconds.',
            duration: 2000,
          })
        }
      >
        2s Duration
      </Button>
      <Button
        onClick={() =>
          toast({
            variant: 'info',
            title: 'Longer toast',
            description: 'This disappears in 10 seconds.',
            duration: 10000,
          })
        }
      >
        10s Duration
      </Button>
      <Button
        onClick={() =>
          toast({
            variant: 'warning',
            title: 'Persistent toast',
            description: 'This stays until dismissed.',
            duration: 0,
          })
        }
      >
        Infinite (0)
      </Button>
    </div>
  );
}

function ToastDemoMultiple() {
  const { success, error, warning, info } = useToast();
  const counter = useRef(0);

  const addMultiple = () => {
    counter.current += 1;
    success(`Success #${counter.current}`, 'First toast');
    setTimeout(() => {
      counter.current += 1;
      warning(`Warning #${counter.current}`, 'Second toast');
    }, 100);
    setTimeout(() => {
      counter.current += 1;
      error(`Error #${counter.current}`, 'Third toast');
    }, 200);
    setTimeout(() => {
      counter.current += 1;
      info(`Info #${counter.current}`, 'Fourth toast');
    }, 300);
  };

  return (
    <div className="flex flex-wrap gap-2 p-4">
      <Button onClick={addMultiple}>Add 4 Toasts Quickly</Button>
    </div>
  );
}

function ToastDemoMaxToasts() {
  const { info } = useToast();
  const counter = useRef(0);

  return (
    <div className="flex flex-wrap gap-2 p-4">
      <p className="w-full text-sm text-muted-foreground mb-2">
        This provider has maxToasts=3. Older toasts are removed when limit is reached.
      </p>
      <Button
        onClick={() => {
          counter.current += 1;
          info(`Toast #${counter.current}`, 'Watch the oldest toast disappear when you exceed 3.');
        }}
      >
        Add Toast
      </Button>
    </div>
  );
}

function RemoveToastDemo() {
  const { toast, removeToast } = useToast();
  const [toastId, setToastId] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap gap-2 p-4">
      <Button
        onClick={() => {
          const id = toast({
            variant: 'info',
            title: 'Persistent toast',
            description: 'This will not auto-dismiss. Use the button to remove it.',
            duration: 0,
          });
          setToastId(id);
        }}
        disabled={!!toastId}
      >
        Create Persistent Toast
      </Button>
      <Button
        onClick={() => {
          if (toastId) {
            removeToast(toastId);
            setToastId(null);
          }
        }}
        disabled={!toastId}
        variant="secondary"
      >
        Remove Toast Programmatically
      </Button>
    </div>
  );
}

function AllPositionsDemo() {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 h-screen">
      <div className="text-center">
        <div className="text-xs font-medium mb-1">top-left</div>
        <div className="border rounded p-2 text-xs bg-muted">{POSITION_CLASSES['top-left']}</div>
      </div>
      <div className="text-center">
        <div className="text-xs font-medium mb-1">top-center</div>
        <div className="border rounded p-2 text-xs bg-muted">{POSITION_CLASSES['top-center']}</div>
      </div>
      <div className="text-center">
        <div className="text-xs font-medium mb-1">top-right</div>
        <div className="border rounded p-2 text-xs bg-muted">{POSITION_CLASSES['top-right']}</div>
      </div>
      <div className="text-center">
        <div className="text-xs font-medium mb-1">bottom-left</div>
        <div className="border rounded p-2 text-xs bg-muted">{POSITION_CLASSES['bottom-left']}</div>
      </div>
      <div className="text-center">
        <div className="text-xs font-medium mb-1">bottom-center</div>
        <div className="border rounded p-2 text-xs bg-muted">
          {POSITION_CLASSES['bottom-center']}
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-medium mb-1">bottom-right (default)</div>
        <div className="border rounded p-2 text-xs bg-muted">
          {POSITION_CLASSES['bottom-right']}
        </div>
      </div>
    </div>
  );
}

function ToastCountDemo() {
  const { toast, toasts } = useToast();
  const counter = useRef(0);

  return (
    <div className="flex flex-wrap gap-2 p-4">
      <p className="w-full text-sm text-muted-foreground mb-2">
        Current toast count: <strong>{toasts.length}</strong> (also available via data-toast-count
        attribute on container)
      </p>
      <Button
        onClick={() => {
          counter.current += 1;
          toast({
            variant: 'info',
            title: `Toast #${counter.current}`,
            duration: 0, // Persistent so we can see the count
          });
        }}
      >
        Add Toast
      </Button>
    </div>
  );
}

function ScreenReaderDemo() {
  const { success, error, warning, info, toasts } = useToast();

  return (
    <div className="p-4 space-y-4">
      <div className="text-sm text-muted-foreground">
        <p>This demo shows how toasts are announced to screen readers:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            <strong>Error toasts</strong> use role=&quot;alert&quot; (assertive, immediately
            interrupts)
          </li>
          <li>
            <strong>Other toasts</strong> use role=&quot;status&quot; (polite, waits for pause)
          </li>
          <li>Each toast prefixes its content with variant name (e.g., &quot;Error: ...&quot;)</li>
          <li>Toast count changes are announced via a visually hidden live region</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => success('Saved', 'Your changes have been saved.')}>
          Success (polite)
        </Button>
        <Button onClick={() => error('Failed', 'Something went wrong!')} variant="destructive">
          Error (assertive)
        </Button>
        <Button onClick={() => warning('Warning', 'Please review before continuing.')}>
          Warning (polite)
        </Button>
        <Button onClick={() => info('Info', 'New updates are available.')}>Info (polite)</Button>
      </div>

      <div className="p-3 bg-muted rounded text-sm">
        <p className="font-medium">Screen reader will announce:</p>
        <p className="text-muted-foreground mt-1">
          &quot;{toasts.length} notification{toasts.length === 1 ? '' : 's'}&quot; when count
          changes
        </p>
      </div>
    </div>
  );
}

function KeyboardDemo() {
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 't' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toast({
          variant: 'info',
          title: 'Keyboard triggered',
          description: 'You pressed Cmd/Ctrl + T',
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toast]);

  return (
    <div className="p-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        Press <kbd className="px-1.5 py-0.5 bg-muted rounded border">Cmd/Ctrl + T</kbd> to trigger a
        toast via keyboard shortcut.
      </p>
      <p className="text-sm text-muted-foreground">
        Each toast's dismiss button is focusable and can be activated with Enter or Space.
      </p>
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Default ToastProvider with basic demo buttons.
 */
export const Default: Story = {
  render: () => (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
};

/**
 * All toast variants with descriptions.
 */
export const AllVariants: Story = {
  render: () => (
    <ToastProvider>
      <ToastDemoWithVariants />
    </ToastProvider>
  ),
};

/**
 * Toasts with action buttons.
 */
export const WithActions: Story = {
  render: () => (
    <ToastProvider>
      <ToastDemoWithActions />
    </ToastProvider>
  ),
};

/**
 * Custom toast durations including infinite (persistent).
 */
export const CustomDurations: Story = {
  render: () => (
    <ToastProvider>
      <ToastDemoWithDuration />
    </ToastProvider>
  ),
};

/**
 * Multiple toasts stacking behavior.
 */
export const MultipleToasts: Story = {
  render: () => (
    <ToastProvider>
      <ToastDemoMultiple />
    </ToastProvider>
  ),
};

/**
 * Max toasts limit - oldest toasts are removed when limit is exceeded.
 */
export const MaxToastsLimit: Story = {
  render: () => (
    <ToastProvider maxToasts={3}>
      <ToastDemoMaxToasts />
    </ToastProvider>
  ),
};

/**
 * Programmatic toast removal.
 */
export const RemoveToast: Story = {
  render: () => (
    <ToastProvider>
      <RemoveToastDemo />
    </ToastProvider>
  ),
};

/**
 * Top-left position.
 */
export const PositionTopLeft: Story = {
  render: () => (
    <ToastProvider position="top-left">
      <ToastDemo />
    </ToastProvider>
  ),
};

/**
 * Top-center position.
 */
export const PositionTopCenter: Story = {
  render: () => (
    <ToastProvider position="top-center">
      <ToastDemo />
    </ToastProvider>
  ),
};

/**
 * Top-right position.
 */
export const PositionTopRight: Story = {
  render: () => (
    <ToastProvider position="top-right">
      <ToastDemo />
    </ToastProvider>
  ),
};

/**
 * Bottom-left position.
 */
export const PositionBottomLeft: Story = {
  render: () => (
    <ToastProvider position="bottom-left">
      <ToastDemo />
    </ToastProvider>
  ),
};

/**
 * Bottom-center position.
 */
export const PositionBottomCenter: Story = {
  render: () => (
    <ToastProvider position="bottom-center">
      <ToastDemo />
    </ToastProvider>
  ),
};

/**
 * Bottom-right position (default).
 */
export const PositionBottomRight: Story = {
  render: () => (
    <ToastProvider position="bottom-right">
      <ToastDemo />
    </ToastProvider>
  ),
};

/**
 * Responsive position - centered on mobile, bottom-right on desktop.
 */
export const ResponsivePosition: Story = {
  render: () => (
    <ToastProvider position={{ base: 'bottom-center', md: 'bottom-right' }}>
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4">
          Resize the window to see position change:
          <br />• Mobile: bottom-center
          <br />• Desktop (md+): bottom-right
        </p>
        <ToastDemo />
      </div>
    </ToastProvider>
  ),
};

/**
 * All positions reference.
 */
export const AllPositions: Story = {
  render: () => <AllPositionsDemo />,
};

/**
 * Small toast size.
 */
export const SmallToasts: Story = {
  render: () => (
    <ToastProvider toastSize="sm">
      <ToastDemo />
    </ToastProvider>
  ),
};

/**
 * Large toast size.
 */
export const LargeToasts: Story = {
  render: () => (
    <ToastProvider toastSize="lg">
      <ToastDemo />
    </ToastProvider>
  ),
};

/**
 * Responsive toast size.
 */
export const ResponsiveToastSize: Story = {
  render: () => (
    <ToastProvider toastSize={{ base: 'sm', md: 'md', lg: 'lg' }}>
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4">
          Resize the window to see toast size change:
          <br />• Mobile: sm
          <br />• Tablet (md): md
          <br />• Desktop (lg+): lg
        </p>
        <ToastDemo />
      </div>
    </ToastProvider>
  ),
};

/**
 * Custom region label for screen readers.
 */
export const CustomRegionLabel: Story = {
  render: () => (
    <ToastProvider regionLabel="Application alerts and notifications">
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4">
          This provider has a custom region label: &quot;Application alerts and notifications&quot;
          <br />
          Screen readers will use this label when navigating to the notification region.
        </p>
        <ToastDemo />
      </div>
    </ToastProvider>
  ),
};

/**
 * With data-testid for testing.
 */
export const WithTestId: Story = {
  render: () => (
    <ToastProvider data-testid="toast-provider">
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4">
          The toast container has data-testid=&quot;toast-provider&quot;.
          <br />
          Individual toasts have data-testid=&quot;toast-provider-toast-&#123;id&#125;&quot;.
        </p>
        <ToastDemo />
      </div>
    </ToastProvider>
  ),
};

/**
 * Toast count tracking (for testing and debugging).
 */
export const ToastCountTracking: Story = {
  render: () => (
    <ToastProvider data-testid="toast-provider">
      <ToastCountDemo />
    </ToastProvider>
  ),
};

/**
 * Screen reader accessibility demonstration.
 */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <ToastProvider>
      <ScreenReaderDemo />
    </ToastProvider>
  ),
};

/**
 * Keyboard navigation demo.
 */
export const KeyboardNavigation: Story = {
  render: () => (
    <ToastProvider>
      <KeyboardDemo />
    </ToastProvider>
  ),
};

/**
 * Real-world example: Form submission feedback.
 */
export const FormSubmissionExample: Story = {
  render: () => {
    function FormDemo() {
      const { success, error } = useToast();
      const [isLoading, setIsLoading] = useState(false);

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Randomly succeed or fail for demo
        if (Math.random() > 0.5) {
          success('Form submitted', 'Your form has been successfully submitted.');
        } else {
          error('Submission failed', 'Please check your form and try again.');
        }

        setIsLoading(false);
      };

      return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-md">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="you@example.com"
            />
          </div>
          <Button type="submit" loading={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      );
    }

    return (
      <ToastProvider>
        <FormDemo />
      </ToastProvider>
    );
  },
};

/**
 * Real-world example: File upload progress.
 */
export const FileUploadExample: Story = {
  render: () => {
    function FileUploadDemo() {
      const { toast, success, error } = useToast();

      const handleUpload = () => {
        // In a real app, you'd store this ID to remove the loading toast later
        toast({
          variant: 'info',
          title: 'Uploading file...',
          description: 'Please wait while your file is being uploaded.',
          duration: 0, // Don't auto-dismiss
        });

        // Simulate upload progress
        setTimeout(() => {
          // In real code, you'd use removeToast(uploadingId) here first
          // For demo, we just show completion toast
          success('Upload complete', 'document.pdf has been uploaded successfully.');
        }, 2000);
      };

      const handleFailedUpload = () => {
        toast({
          variant: 'info',
          title: 'Uploading file...',
          duration: 0,
        });

        setTimeout(() => {
          error('Upload failed', 'Network error. Please try again.');
        }, 2000);
      };

      return (
        <div className="p-4 space-y-4">
          <Button onClick={handleUpload}>Upload (Success)</Button>
          <Button onClick={handleFailedUpload} variant="secondary">
            Upload (Failure)
          </Button>
        </div>
      );
    }

    return (
      <ToastProvider>
        <FileUploadDemo />
      </ToastProvider>
    );
  },
};

/**
 * Real-world example: Notification center pattern.
 */
export const NotificationCenterExample: Story = {
  render: () => {
    function NotificationDemo() {
      const { toast } = useToast();

      // Simulate incoming notifications
      useEffect(() => {
        const notifications = [
          {
            variant: 'info' as const,
            title: 'New message',
            description: 'You have 3 unread messages.',
          },
          {
            variant: 'warning' as const,
            title: 'Session expiring',
            description: 'Your session will expire in 5 minutes.',
          },
          {
            variant: 'success' as const,
            title: 'Task completed',
            description: 'Build #1234 completed successfully.',
          },
        ];

        const timers: ReturnType<typeof setTimeout>[] = [];

        notifications.forEach((notification, index) => {
          const timer = setTimeout(
            () => {
              toast(notification);
            },
            (index + 1) * 2000
          );
          timers.push(timer);
        });

        return () => timers.forEach(clearTimeout);
      }, [toast]);

      return (
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            Watch as notifications appear automatically over time...
          </p>
        </div>
      );
    }

    return (
      <ToastProvider position="top-right" maxToasts={5}>
        <NotificationDemo />
      </ToastProvider>
    );
  },
};

/**
 * Constants reference for developers.
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold">ToastProvider Constants</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">Durations</h3>
          <div className="mt-2 p-3 bg-muted rounded text-sm font-mono">
            <p>DEFAULT_DURATION = {DEFAULT_DURATION}ms (5 seconds)</p>
            <p>DEFAULT_ERROR_DURATION = {DEFAULT_ERROR_DURATION}ms (8 seconds)</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium">Limits</h3>
          <div className="mt-2 p-3 bg-muted rounded text-sm font-mono">
            <p>DEFAULT_MAX_TOASTS = {DEFAULT_MAX_TOASTS}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium">Position</h3>
          <div className="mt-2 p-3 bg-muted rounded text-sm font-mono">
            <p>DEFAULT_POSITION = &quot;{DEFAULT_POSITION}&quot;</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium">Accessibility</h3>
          <div className="mt-2 p-3 bg-muted rounded text-sm font-mono">
            <p>DEFAULT_REGION_LABEL = &quot;{DEFAULT_REGION_LABEL}&quot;</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium">Base Classes</h3>
          <div className="mt-2 p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
            <p>TOAST_CONTAINER_BASE_CLASSES = &quot;{TOAST_CONTAINER_BASE_CLASSES}&quot;</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium">Position Classes</h3>
          <div className="mt-2 p-3 bg-muted rounded text-xs font-mono space-y-1 overflow-x-auto">
            {Object.entries(POSITION_CLASSES).map(([position, classes]) => (
              <p key={position}>
                &quot;{position}&quot;: &quot;{classes}&quot;
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Utility function demo - getPositionClasses.
 */
export const GetPositionClassesDemo: Story = {
  render: () => (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold">getPositionClasses Utility</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">Simple position</h3>
          <div className="mt-2 p-3 bg-muted rounded text-sm font-mono">
            <p>getPositionClasses(&quot;top-right&quot;)</p>
            <p className="text-muted-foreground">→ &quot;{getPositionClasses('top-right')}&quot;</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium">Responsive position</h3>
          <div className="mt-2 p-3 bg-muted rounded text-sm font-mono">
            <p>
              getPositionClasses(&#123; base: &quot;bottom-center&quot;, md:
              &quot;bottom-right&quot; &#125;)
            </p>
            <p className="text-muted-foreground">
              → &quot;{getPositionClasses({ base: 'bottom-center', md: 'bottom-right' })}&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
};
