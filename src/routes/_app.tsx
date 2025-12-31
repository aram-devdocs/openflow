/**
 * App Layout Route
 *
 * Parent layout route that wraps all application pages with consistent layout.
 * Uses NavigationContext for centralized layout state management.
 *
 * Routes under /_app/ will automatically inherit this layout.
 *
 * PHASE 2 NOTE: During this transitional phase, child routes still provide
 * their own layout wrappers (e.g., DashboardLayout). The AppLayout wrapper
 * will be added here in Phase 3 when we have unified AppSidebar and AppHeader
 * components. Until then, this route just passes through to child routes.
 */

import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app')({
  component: AppLayoutRoute,
});

/**
 * App layout route component.
 *
 * Phase 2: Passthrough to child routes that manage their own layout.
 * Phase 3: Will wrap children in AppLayout with shared sidebar/header.
 */
function AppLayoutRoute() {
  // Phase 2: Child routes provide their own complete layout
  // Phase 3: This will wrap with AppLayout using useNavigation() for state
  return <Outlet />;
}
