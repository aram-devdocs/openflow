import { AlertTriangle } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../atoms/Button';

export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Custom fallback UI - can be a component or render function */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Callback fired when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that catches JavaScript errors in child components.
 * Prevents the entire app from crashing when a component throws an error.
 *
 * @example
 * // Basic usage with default fallback
 * <ErrorBoundary>
 *   <ComponentThatMayError />
 * </ErrorBoundary>
 *
 * @example
 * // With custom fallback component
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <ComponentThatMayError />
 * </ErrorBoundary>
 *
 * @example
 * // With render function for custom reset handling
 * <ErrorBoundary fallback={(error, reset) => (
 *   <div>
 *     <p>Error: {error.message}</p>
 *     <button onClick={reset}>Retry</button>
 *   </div>
 * )}>
 *   <ComponentThatMayError />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught error:', error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // TODO: Log to backend via Tauri command for debugging
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback render function
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.reset);
      }

      // Custom fallback component
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          role="alert"
          className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-6 text-center"
        >
          <div className="rounded-full bg-[rgb(var(--destructive))]/10 p-3">
            <AlertTriangle className="h-6 w-6 text-[rgb(var(--destructive))]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">
              Something went wrong
            </h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              An error occurred while rendering this section.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={this.reset}>
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
