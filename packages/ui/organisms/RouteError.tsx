import { AlertCircle, Home, RotateCw } from 'lucide-react';
import { Button } from '../atoms/Button';

export interface RouteErrorProps {
  /** The error that occurred */
  error: Error;
  /** Callback to retry/reload the current route */
  onRetry?: () => void;
  /** Callback to navigate to home page */
  onGoHome?: () => void;
}

/**
 * Full-page error component for route-level errors.
 * Displays a user-friendly error message with retry and navigation options.
 *
 * @example
 * // In a route file
 * export const Route = createFileRoute('/tasks/$taskId')({
 *   component: TaskDetailPage,
 *   errorComponent: ({ error }) => (
 *     <RouteError
 *       error={error}
 *       onRetry={() => window.location.reload()}
 *       onGoHome={() => navigate('/')}
 *     />
 *   ),
 * });
 */
export function RouteError({ error, onRetry, onGoHome }: RouteErrorProps) {
  return (
    <div
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 bg-[rgb(var(--background))]"
    >
      <div className="rounded-full bg-[rgb(var(--destructive))]/10 p-4">
        <AlertCircle className="h-12 w-12 text-[rgb(var(--destructive))]" />
      </div>

      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">
          Oops! Something went wrong
        </h1>
        <p className="text-[rgb(var(--muted-foreground))]">
          We encountered an unexpected error. Please try again or return to the home page.
        </p>
      </div>

      <div className="flex gap-3">
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            <RotateCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
        {onGoHome && (
          <Button variant="primary" onClick={onGoHome}>
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        )}
      </div>

      {/* Technical details (collapsed by default) */}
      <details className="mt-4 max-w-lg w-full">
        <summary className="cursor-pointer text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors">
          Technical Details
        </summary>
        <pre className="mt-2 overflow-auto rounded-md bg-[rgb(var(--surface-1))] p-4 text-xs text-[rgb(var(--muted-foreground))] border border-[rgb(var(--border))]">
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      </details>
    </div>
  );
}
