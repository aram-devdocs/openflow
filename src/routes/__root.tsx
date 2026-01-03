/**
 * Root Route
 *
 * The root layout component that wraps all routes.
 * Provides QueryClientProvider and sets up the base layout structure.
 * Includes ErrorBoundary for graceful error handling.
 *
 * Real-time Data Sync:
 * This component includes useDataSync which subscribes to data-changed events
 * and automatically invalidates TanStack Query caches. This enables real-time
 * synchronization between:
 * - Multiple Tauri windows
 * - Browser clients connected via HTTP/WebSocket
 * - Mixed Tauri + browser environments
 */

import { useDataSync } from '@openflow/hooks';
import { ErrorBoundary, RouteError } from '@openflow/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import {
  GlobalShortcutsProvider,
  KeyboardShortcutsDialogProvider,
  NavigationProvider,
  ProjectSelectionProvider,
  WebviewBoundsProvider,
} from '../providers';
import type { RouterContext } from '../routerContext';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

/**
 * DataSyncProvider
 *
 * Inner component that enables real-time data synchronization.
 * Must be rendered inside QueryClientProvider since useDataSync uses useQueryClient.
 *
 * This hook subscribes to the 'data-changed' WebSocket/Tauri event channel and
 * automatically invalidates TanStack Query caches when data changes occur on any
 * connected client or the backend.
 */
function DataSyncProvider({ children }: { children: React.ReactNode }) {
  // Enable real-time data sync across all clients
  useDataSync();

  return <>{children}</>;
}

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
      <DataSyncProvider>
        <WebviewBoundsProvider>
          <KeyboardShortcutsDialogProvider>
            <NavigationProvider>
              <ProjectSelectionProvider>
                <GlobalShortcutsProvider>
                  <div className="min-h-screen bg-background text-foreground">
                    <ErrorBoundary
                      fallback={(error) => (
                        <RouteError error={error} onRetry={handleRetry} onGoHome={handleGoHome} />
                      )}
                    >
                      <Outlet />
                    </ErrorBoundary>
                  </div>
                </GlobalShortcutsProvider>
              </ProjectSelectionProvider>
            </NavigationProvider>
          </KeyboardShortcutsDialogProvider>
        </WebviewBoundsProvider>
      </DataSyncProvider>

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
