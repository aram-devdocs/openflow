/**
 * Router context for TanStack Router
 *
 * Provides type-safe access to shared dependencies (like QueryClient)
 * across all routes in the application.
 */

import type { QueryClient } from '@tanstack/react-query';

/**
 * Router context available to all routes.
 * This is passed to createRootRouteWithContext and can be accessed
 * in any route via routeContext.
 */
export interface RouterContext {
  /** TanStack Query client for data fetching */
  queryClient: QueryClient;
}
