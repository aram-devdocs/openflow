import type { Meta, StoryObj } from '@storybook/react';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import {
  DEFAULT_ERROR_DESCRIPTION,
  DEFAULT_ERROR_TITLE,
  DEFAULT_RETRY_LABEL,
  DefaultFallback,
  ERROR_BUTTON_SIZE_MAP,
  ERROR_CONTAINER_BASE_CLASSES,
  ERROR_CONTAINER_SIZE_CLASSES,
  ERROR_DESCRIPTION_SIZE_MAP,
  ERROR_HEADING_SIZE_MAP,
  ERROR_ICON_CONTAINER_BASE_CLASSES,
  ERROR_ICON_CONTAINER_SIZE_CLASSES,
  ERROR_ICON_SIZE_MAP,
  ERROR_TEXT_CONTAINER_CLASSES,
  ErrorBoundary,
  LOGGER_CONTEXT,
  SR_ERROR_CAUGHT,
  SR_RESET_COMPLETE,
  withErrorBoundary,
} from './ErrorBoundary';

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Organisms/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Error Boundary component that catches JavaScript errors in child components.
Prevents the entire app from crashing when a component throws an error.

## Features
- **Logger Integration**: Uses centralized logger for error tracking with full stack traces
- **Accessibility**: role="alert", aria-live regions, screen reader announcements
- **Responsive**: Size variants (sm, md, lg) with responsive breakpoint support
- **Touch Targets**: 44px minimum on mobile for WCAG 2.5.5 compliance
- **Retry Functionality**: Built-in reset button with loading state
- **Customizable**: Custom fallback UI via render function or component

## Accessibility
- Uses \`role="alert"\` with \`aria-live="assertive"\` for error announcements
- Proper heading hierarchy via \`aria-labelledby\`
- Screen reader announcements for both errors and resets
- Touch targets meet 44px minimum on mobile (WCAG 2.5.5)
- Focus ring visible on all backgrounds

## Logging
- Logs errors at ERROR level with full context (stack trace, component info)
- Debug logging for component stack in development
- Info logging for backend persistence tracking
- Logs reset actions for debugging
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    fallback: {
      control: false,
      description: 'Custom fallback UI - can be a component or render function',
    },
    onError: {
      action: 'error',
      description: 'Callback fired when an error is caught',
    },
    logToBackend: {
      control: 'boolean',
      description: 'Whether to log errors to the backend (default: true)',
    },
    componentName: {
      control: 'text',
      description: 'Component name for better error context',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the fallback UI - responsive value supported',
    },
    'data-testid': {
      control: 'text',
      description: 'Data attribute for testing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

// ============================================================================
// Helper Components
// ============================================================================

/** Component that throws an error when triggered */
function ErrorThrower({
  shouldThrow,
  errorMessage,
}: { shouldThrow: boolean; errorMessage?: string }) {
  if (shouldThrow) {
    throw new Error(errorMessage ?? 'This is a test error thrown by the ErrorThrower component');
  }
  return (
    <div className="rounded-lg border border-[rgb(var(--border))] p-6">
      <h3 className="font-medium text-[rgb(var(--foreground))]">Component Rendered Successfully</h3>
      <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
        No errors were thrown during rendering.
      </p>
    </div>
  );
}

/** Interactive demo that allows triggering an error */
function ErrorBoundaryDemo({
  fallback,
  showCustomFallback,
  size,
  componentName,
}: {
  fallback?: React.ComponentProps<typeof ErrorBoundary>['fallback'];
  showCustomFallback?: boolean;
  size?: React.ComponentProps<typeof ErrorBoundary>['size'];
  componentName?: string;
}) {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [key, setKey] = useState(0);

  const handleReset = () => {
    setShouldThrow(false);
    setKey((k) => k + 1);
  };

  const customFallback = showCustomFallback
    ? (error: Error, reset: () => void) => (
        <div className="rounded-lg border border-[rgb(var(--destructive))] bg-[rgb(var(--destructive))]/5 p-6 text-center">
          <h3 className="font-semibold text-[rgb(var(--destructive))]">Custom Error UI</h3>
          <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">{error.message}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                reset();
                handleReset();
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      )
    : fallback;

  return (
    <div className="w-80">
      <div className="mb-4 flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShouldThrow(true)}
          disabled={shouldThrow}
        >
          Trigger Error
        </Button>
        <Button variant="secondary" size="sm" onClick={handleReset}>
          Reset
        </Button>
      </div>
      <ErrorBoundary key={key} fallback={customFallback} size={size} componentName={componentName}>
        <ErrorThrower shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </div>
  );
}

// ============================================================================
// Basic Stories
// ============================================================================

/** Default error boundary with built-in fallback UI */
export const Default: Story = {
  render: () => <ErrorBoundaryDemo />,
};

/** Error boundary with custom fallback component */
export const CustomFallback: Story = {
  render: () => <ErrorBoundaryDemo showCustomFallback />,
};

/** Error boundary with static fallback element */
export const StaticFallback: Story = {
  render: () => (
    <ErrorBoundaryDemo
      fallback={
        <div className="rounded-lg border border-[rgb(var(--warning))] bg-[rgb(var(--warning))]/10 p-6 text-center">
          <h3 className="font-semibold text-[rgb(var(--warning))]">Something went wrong</h3>
          <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
            Please refresh the page to try again.
          </p>
        </div>
      }
    />
  ),
};

/** With component name for better error context */
export const WithComponentName: Story = {
  render: () => <ErrorBoundaryDemo componentName="UserProfile" />,
};

// ============================================================================
// Size Variants
// ============================================================================

/** Small size variant */
export const SizeSmall: Story = {
  render: () => <ErrorBoundaryDemo size="sm" />,
};

/** Medium size variant (default) */
export const SizeMedium: Story = {
  render: () => <ErrorBoundaryDemo size="md" />,
};

/** Large size variant */
export const SizeLarge: Story = {
  render: () => <ErrorBoundaryDemo size="lg" />,
};

/** All size variants comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <h3 className="mb-2 text-sm font-medium text-[rgb(var(--foreground))]">Size: {size}</h3>
          <DefaultFallback
            error={new Error('Test error')}
            onReset={() => {}}
            size={size}
            data-testid={`error-${size}`}
          />
        </div>
      ))}
    </div>
  ),
};

/** Responsive sizing - changes size at breakpoints */
export const ResponsiveSizing: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <p className="mb-4 text-sm text-[rgb(var(--muted-foreground))]">
        Resize your browser window to see the size change at different breakpoints.
      </p>
      <DefaultFallback
        error={new Error('Responsive error')}
        onReset={() => {}}
        size={{ base: 'sm', md: 'md', lg: 'lg' }}
        data-testid="error-responsive"
      />
    </div>
  ),
};

// ============================================================================
// DefaultFallback Component
// ============================================================================

/** Show the default fallback UI directly */
export const DefaultFallbackUI: Story = {
  render: () => (
    <div className="w-80">
      <DefaultFallback
        error={new Error('This is a test error message')}
        onReset={() => alert('Reset clicked!')}
        data-testid="default-fallback"
      />
    </div>
  ),
};

/** DefaultFallback with custom aria-label */
export const FallbackWithAriaLabel: Story = {
  render: () => (
    <div className="w-80">
      <DefaultFallback
        error={new Error('Network request failed')}
        onReset={() => {}}
        aria-label="Network error occurred in the dashboard widget"
      />
    </div>
  ),
};

/** DefaultFallback with ref forwarding */
export const FallbackWithRef: Story = {
  render: () => {
    const ref = useRef<HTMLDivElement>(null);
    const [refInfo, setRefInfo] = useState<string>('');

    return (
      <div className="space-y-4">
        <Button
          onClick={() => {
            if (ref.current) {
              setRefInfo(
                `Element: ${ref.current.tagName}, role: ${ref.current.getAttribute('role')}`
              );
            }
          }}
        >
          Check Ref
        </Button>
        <DefaultFallback ref={ref} error={new Error('Test error')} onReset={() => {}} />
        {refInfo && <p className="text-sm text-[rgb(var(--muted-foreground))]">{refInfo}</p>}
      </div>
    );
  },
};

// ============================================================================
// Error Callback
// ============================================================================

/** Error boundary with error callback */
export const WithErrorCallback: Story = {
  render: () => {
    const [errorLog, setErrorLog] = useState<string[]>([]);
    const [shouldThrow, setShouldThrow] = useState(false);
    const [key, setKey] = useState(0);

    const handleError = (error: Error) => {
      setErrorLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${error.message}`]);
    };

    return (
      <div className="w-96 space-y-4">
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShouldThrow(true)}
            disabled={shouldThrow}
          >
            Trigger Error
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setShouldThrow(false);
              setKey((k) => k + 1);
            }}
          >
            Reset
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setErrorLog([])}>
            Clear Log
          </Button>
        </div>

        <ErrorBoundary key={key} onError={handleError}>
          <ErrorThrower shouldThrow={shouldThrow} />
        </ErrorBoundary>

        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <h4 className="text-sm font-medium text-[rgb(var(--foreground))]">Error Log</h4>
          {errorLog.length === 0 ? (
            <p className="mt-2 text-xs text-[rgb(var(--muted-foreground))]">No errors logged yet</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {errorLog.map((log, i) => (
                <li key={`error-log-${i}`} className="text-xs text-[rgb(var(--muted-foreground))]">
                  {log}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  },
};

// ============================================================================
// Nested Boundaries
// ============================================================================

/** Nested error boundaries */
export const NestedBoundaries: Story = {
  render: () => {
    const [outerError, setOuterError] = useState(false);
    const [innerError, setInnerError] = useState(false);
    const [key, setKey] = useState(0);

    return (
      <div className="w-96 space-y-4">
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setInnerError(true)}
            disabled={innerError}
          >
            Inner Error
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setOuterError(true)}
            disabled={outerError}
          >
            Outer Error
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setOuterError(false);
              setInnerError(false);
              setKey((k) => k + 1);
            }}
          >
            Reset All
          </Button>
        </div>

        <ErrorBoundary
          key={key}
          componentName="OuterComponent"
          fallback={
            <div className="rounded-lg border-2 border-[rgb(var(--destructive))] p-4 text-center">
              <h3 className="font-semibold text-[rgb(var(--destructive))]">
                Outer Boundary Caught Error
              </h3>
            </div>
          }
        >
          <div className="rounded-lg border border-[rgb(var(--border))] p-4">
            <h4 className="mb-2 font-medium text-[rgb(var(--foreground))]">Outer Component</h4>
            {outerError && <ErrorThrower shouldThrow />}

            <ErrorBoundary
              componentName="InnerComponent"
              fallback={
                <div className="rounded-lg border border-[rgb(var(--warning))] bg-[rgb(var(--warning))]/10 p-4 text-center">
                  <h3 className="font-semibold text-[rgb(var(--warning))]">
                    Inner Boundary Caught Error
                  </h3>
                </div>
              }
            >
              <div className="mt-2 rounded-lg border border-[rgb(var(--border))] p-4">
                <h5 className="mb-2 font-medium text-[rgb(var(--foreground))]">Inner Component</h5>
                <ErrorThrower shouldThrow={innerError} />
              </div>
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      </div>
    );
  },
};

// ============================================================================
// Higher-Order Component
// ============================================================================

/** Using withErrorBoundary HOC */
export const WithHOC: Story = {
  render: () => {
    const [shouldThrow, setShouldThrow] = useState(false);

    // Component that may throw
    const RiskyComponent = ({ throw: shouldThrow }: { throw: boolean }) => {
      if (shouldThrow) {
        throw new Error('HOC-wrapped component error');
      }
      return (
        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <p className="text-[rgb(var(--foreground))]">Safe component content</p>
        </div>
      );
    };

    // Wrap with error boundary
    const SafeComponent = withErrorBoundary(RiskyComponent, {
      componentName: 'RiskyComponent',
      size: 'sm',
    });

    return (
      <div className="w-80 space-y-4">
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShouldThrow(true)}
            disabled={shouldThrow}
          >
            Trigger Error
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShouldThrow(false)}>
            Reset
          </Button>
        </div>
        <SafeComponent key={shouldThrow ? 'error' : 'safe'} throw={shouldThrow} />
      </div>
    );
  },
};

// ============================================================================
// Accessibility Stories
// ============================================================================

/** Screen reader accessibility demo */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        The error fallback uses role="alert" with aria-live="assertive" to announce errors
        immediately. Reset actions trigger aria-live="polite" announcements.
      </p>
      <DefaultFallback
        error={new Error('Database connection failed')}
        onReset={() => {}}
        aria-label="Database error in user list"
      />
      <div className="rounded-lg bg-[rgb(var(--muted))]/50 p-4 text-sm">
        <strong>Screen reader will announce:</strong>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Error region with role="alert"</li>
          <li>Title: "{DEFAULT_ERROR_TITLE}"</li>
          <li>Description: "{DEFAULT_ERROR_DESCRIPTION}"</li>
          <li>Button: "{DEFAULT_RETRY_LABEL}"</li>
          <li>On reset: "{SR_RESET_COMPLETE}"</li>
        </ul>
      </div>
    </div>
  ),
};

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Use Tab to focus the retry button, Enter or Space to activate.
      </p>
      <DefaultFallback
        error={new Error('Test error')}
        onReset={() => alert('Reset triggered via keyboard!')}
      />
    </div>
  ),
};

/** Touch target accessibility demo */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        The retry button has a minimum 44px touch target on mobile devices (WCAG 2.5.5 Target Size).
        Resize to mobile width to see the effect.
      </p>
      <div className="w-full max-w-xs">
        <DefaultFallback error={new Error('Test error')} onReset={() => {}} size="sm" />
      </div>
    </div>
  ),
};

/** Focus ring visibility demo */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Focus rings are visible on all backgrounds. Tab to the button to see focus state.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-white p-4">
          <p className="mb-2 text-xs font-medium text-gray-600">Light Background</p>
          <DefaultFallback error={new Error('Light bg')} onReset={() => {}} size="sm" />
        </div>
        <div className="rounded-lg bg-gray-900 p-4">
          <p className="mb-2 text-xs font-medium text-gray-300">Dark Background</p>
          <DefaultFallback error={new Error('Dark bg')} onReset={() => {}} size="sm" />
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** Dashboard widget error */
export const DashboardWidgetError: Story = {
  render: () => {
    const [hasError, setHasError] = useState(true);

    return (
      <div className="w-80 space-y-4">
        <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">Dashboard Widget</h3>
        {hasError ? (
          <DefaultFallback
            error={new Error('Failed to load analytics data')}
            onReset={() => setHasError(false)}
            size="sm"
            aria-label="Analytics widget error"
          />
        ) : (
          <div className="rounded-lg border border-[rgb(var(--border))] p-4">
            <p className="text-[rgb(var(--foreground))]">Analytics data loaded successfully!</p>
          </div>
        )}
      </div>
    );
  },
};

/** Chat panel error with retry */
export const ChatPanelError: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleRetry = () => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
      }, 1500);
    };

    if (success) {
      return (
        <div className="w-96 rounded-lg border border-[rgb(var(--border))] p-6">
          <h3 className="font-semibold text-[rgb(var(--foreground))]">Chat Loaded</h3>
          <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
            Messages have been loaded successfully.
          </p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => setSuccess(false)}>
            Show Error Again
          </Button>
        </div>
      );
    }

    return (
      <div className="w-96">
        <ErrorBoundary
          componentName="ChatPanel"
          size="md"
          fallback={(error, reset) => (
            <div
              role="alert"
              className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-[rgb(var(--destructive))]/30 bg-[rgb(var(--destructive))]/5 p-6 text-center"
            >
              <Icon icon={XCircle} size="lg" className="text-[rgb(var(--destructive))]" />
              <div>
                <h3 className="font-semibold text-[rgb(var(--foreground))]">
                  Unable to Load Messages
                </h3>
                <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">{error.message}</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  handleRetry();
                  reset();
                }}
                loading={loading}
                loadingText="Reconnecting..."
                icon={<RefreshCw />}
              >
                Retry Connection
              </Button>
            </div>
          )}
        >
          <ErrorThrower shouldThrow errorMessage="WebSocket connection failed" />
        </ErrorBoundary>
      </div>
    );
  },
};

/** Form submission error */
export const FormSubmissionError: Story = {
  render: () => {
    const [showError, setShowError] = useState(true);

    return (
      <div className="w-96 space-y-4">
        <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">Settings Form</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-[rgb(var(--foreground))]">Username</label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3 py-2 text-sm"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[rgb(var(--foreground))]">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3 py-2 text-sm"
              placeholder="Enter email"
            />
          </div>
        </div>

        {showError && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-center gap-3 rounded-lg border border-[rgb(var(--destructive))]/30 bg-[rgb(var(--destructive))]/10 p-4"
          >
            <Icon icon={AlertTriangle} size="sm" className="text-[rgb(var(--destructive))]" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[rgb(var(--destructive))]">
                Failed to save settings
              </p>
              <p className="text-xs text-[rgb(var(--muted-foreground))]">
                Server returned an error. Please try again.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowError(false)}>
              Dismiss
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="secondary">Cancel</Button>
          <Button onClick={() => setShowError(true)}>Save Settings</Button>
        </div>
      </div>
    );
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/** Reference of all exported constants */
export const ConstantsReference: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6 text-sm">
      <section>
        <h3 className="mb-2 font-semibold text-[rgb(var(--foreground))]">Default Labels</h3>
        <dl className="grid grid-cols-2 gap-2">
          <dt className="text-[rgb(var(--muted-foreground))]">DEFAULT_ERROR_TITLE:</dt>
          <dd className="font-mono text-[rgb(var(--foreground))]">"{DEFAULT_ERROR_TITLE}"</dd>
          <dt className="text-[rgb(var(--muted-foreground))]">DEFAULT_ERROR_DESCRIPTION:</dt>
          <dd className="font-mono text-[rgb(var(--foreground))]">"{DEFAULT_ERROR_DESCRIPTION}"</dd>
          <dt className="text-[rgb(var(--muted-foreground))]">DEFAULT_RETRY_LABEL:</dt>
          <dd className="font-mono text-[rgb(var(--foreground))]">"{DEFAULT_RETRY_LABEL}"</dd>
        </dl>
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-[rgb(var(--foreground))]">
          Screen Reader Announcements
        </h3>
        <dl className="grid grid-cols-2 gap-2">
          <dt className="text-[rgb(var(--muted-foreground))]">SR_ERROR_CAUGHT:</dt>
          <dd className="font-mono text-[rgb(var(--foreground))]">"{SR_ERROR_CAUGHT}"</dd>
          <dt className="text-[rgb(var(--muted-foreground))]">SR_RESET_COMPLETE:</dt>
          <dd className="font-mono text-[rgb(var(--foreground))]">"{SR_RESET_COMPLETE}"</dd>
        </dl>
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-[rgb(var(--foreground))]">Logger Context</h3>
        <dl className="grid grid-cols-2 gap-2">
          <dt className="text-[rgb(var(--muted-foreground))]">LOGGER_CONTEXT:</dt>
          <dd className="font-mono text-[rgb(var(--foreground))]">"{LOGGER_CONTEXT}"</dd>
        </dl>
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-[rgb(var(--foreground))]">Size Classes</h3>
        <dl className="space-y-2">
          <dt className="text-[rgb(var(--muted-foreground))]">ERROR_CONTAINER_SIZE_CLASSES:</dt>
          <dd className="font-mono text-xs text-[rgb(var(--foreground))]">
            {JSON.stringify(ERROR_CONTAINER_SIZE_CLASSES, null, 2)}
          </dd>
          <dt className="text-[rgb(var(--muted-foreground))]">
            ERROR_ICON_CONTAINER_SIZE_CLASSES:
          </dt>
          <dd className="font-mono text-xs text-[rgb(var(--foreground))]">
            {JSON.stringify(ERROR_ICON_CONTAINER_SIZE_CLASSES, null, 2)}
          </dd>
        </dl>
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-[rgb(var(--foreground))]">Size Maps</h3>
        <dl className="space-y-2">
          <dt className="text-[rgb(var(--muted-foreground))]">ERROR_ICON_SIZE_MAP:</dt>
          <dd className="font-mono text-xs text-[rgb(var(--foreground))]">
            {JSON.stringify(ERROR_ICON_SIZE_MAP, null, 2)}
          </dd>
          <dt className="text-[rgb(var(--muted-foreground))]">ERROR_HEADING_SIZE_MAP:</dt>
          <dd className="font-mono text-xs text-[rgb(var(--foreground))]">
            {JSON.stringify(ERROR_HEADING_SIZE_MAP, null, 2)}
          </dd>
          <dt className="text-[rgb(var(--muted-foreground))]">ERROR_DESCRIPTION_SIZE_MAP:</dt>
          <dd className="font-mono text-xs text-[rgb(var(--foreground))]">
            {JSON.stringify(ERROR_DESCRIPTION_SIZE_MAP, null, 2)}
          </dd>
          <dt className="text-[rgb(var(--muted-foreground))]">ERROR_BUTTON_SIZE_MAP:</dt>
          <dd className="font-mono text-xs text-[rgb(var(--foreground))]">
            {JSON.stringify(ERROR_BUTTON_SIZE_MAP, null, 2)}
          </dd>
        </dl>
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-[rgb(var(--foreground))]">Base Classes</h3>
        <dl className="space-y-2">
          <dt className="text-[rgb(var(--muted-foreground))]">ERROR_CONTAINER_BASE_CLASSES:</dt>
          <dd className="font-mono text-xs text-[rgb(var(--foreground))]">
            "{ERROR_CONTAINER_BASE_CLASSES}"
          </dd>
          <dt className="text-[rgb(var(--muted-foreground))]">
            ERROR_ICON_CONTAINER_BASE_CLASSES:
          </dt>
          <dd className="font-mono text-xs text-[rgb(var(--foreground))]">
            "{ERROR_ICON_CONTAINER_BASE_CLASSES}"
          </dd>
          <dt className="text-[rgb(var(--muted-foreground))]">ERROR_TEXT_CONTAINER_CLASSES:</dt>
          <dd className="font-mono text-xs text-[rgb(var(--foreground))]">
            "{ERROR_TEXT_CONTAINER_CLASSES}"
          </dd>
        </dl>
      </section>
    </div>
  ),
};
