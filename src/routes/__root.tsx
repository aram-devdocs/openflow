/**
 * Root Route
 *
 * The root layout component that wraps all routes.
 * Provides QueryClientProvider and sets up the base layout structure.
 * Includes ErrorBoundary for graceful error handling.
 */

import { ErrorBoundary, RouteError } from '@openflow/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { KeyboardShortcutsDialogProvider, NavigationProvider } from '../providers';
import type { RouterContext } from '../routerContext';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <KeyboardShortcutsDialogProvider>
        <NavigationProvider>
          <div className="min-h-screen bg-background text-foreground">
            <ErrorBoundary
              fallback={(error) => (
                <RouteError error={error} onRetry={handleRetry} onGoHome={handleGoHome} />
              )}
            >
              <Outlet />
            </ErrorBoundary>
          </div>
        </NavigationProvider>
      </KeyboardShortcutsDialogProvider>

      {/* Development tools - only shown in dev mode */}
      {import.meta.env.DEV && (
        <>
          <ReactQueryDevtools buttonPosition="bottom-left" />
          <TanStackRouterDevtools position="bottom-right" />
        </>
      )}
    </QueryClientProvider>
  );
}
