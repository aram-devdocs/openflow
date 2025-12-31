import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../atoms/Button';
import { ErrorBoundary } from './ErrorBoundary';

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Organisms/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
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
  },
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

/** Component that throws an error when triggered */
function ErrorThrower({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('This is a test error thrown by the ErrorThrower component');
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
}: {
  fallback?: React.ComponentProps<typeof ErrorBoundary>['fallback'];
  showCustomFallback?: boolean;
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
      <ErrorBoundary key={key} fallback={customFallback}>
        <ErrorThrower shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </div>
  );
}

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

/** Show the default fallback UI directly */
export const DefaultFallbackUI: Story = {
  render: () => {
    // Force the error state to show the default fallback
    const [showError, setShowError] = useState(true);

    if (!showError) {
      return (
        <div className="w-80">
          <Button onClick={() => setShowError(true)}>Show Error UI</Button>
        </div>
      );
    }

    return (
      <div className="w-80">
        <div
          role="alert"
          className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-[rgb(var(--border))] p-6 text-center"
        >
          <div className="rounded-full bg-[rgb(var(--destructive))]/10 p-3">
            <svg
              className="h-6 w-6 text-[rgb(var(--destructive))]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">
              Something went wrong
            </h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              An error occurred while rendering this section.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowError(false)}>
            Try Again
          </Button>
        </div>
      </div>
    );
  },
};

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
