/**
 * App Layout Route
 *
 * Parent layout route that wraps all application pages with consistent layout.
 * Provides the AppLayout template with sidebar and header that persists across
 * navigation. Uses NavigationContext for centralized layout state management.
 *
 * Layout variants are supported via route context to customize behavior:
 * - 'default': Full sidebar and header
 * - 'settings': Collapsed sidebar, settings-specific header
 * - 'task': Task detail layout integration
 * - 'minimal': No sidebar, minimal header
 *
 * Routes under /_app/ will automatically inherit this layout.
 */

import { useNavigation } from '@openflow/hooks';
import { AppLayout } from '@openflow/ui';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';

/** Supported layout variants for app routes */
export type LayoutVariant = 'default' | 'settings' | 'task' | 'minimal';

/** Route context interface for layout customization */
export interface AppLayoutRouteContext {
  /** Layout variant to apply */
  layoutVariant?: LayoutVariant;
}

/**
 * Helper to compute layout properties based on variant.
 * Extracted to avoid TypeScript narrowing issues with literal types.
 */
function getLayoutProperties(
  variant: LayoutVariant,
  navigationSidebarCollapsed: boolean
): { showSidebar: boolean; sidebarCollapsed: boolean } {
  const showSidebar = variant !== 'minimal';
  const forceSidebarCollapsed = variant === 'settings';
  const sidebarCollapsed = forceSidebarCollapsed || navigationSidebarCollapsed;
  return { showSidebar, sidebarCollapsed };
}

export const Route = createFileRoute('/_app')({
  component: AppLayoutRoute,
});

function AppLayoutRoute() {
  const navigation = useNavigation();

  // Get layout variant from route context (default to 'default')
  // Note: In future steps, child routes will set this via beforeLoad
  const layoutVariant: LayoutVariant = 'default';

  // Compute layout properties based on variant
  const { showSidebar, sidebarCollapsed } = useMemo(
    () => getLayoutProperties(layoutVariant, navigation.sidebarCollapsed),
    [navigation.sidebarCollapsed]
  );

  // Callback for mobile drawer toggle
  const handleMobileDrawerToggle = useCallback(
    (open: boolean) => {
      navigation.setMobileDrawerOpen(open);
    },
    [navigation]
  );

  return (
    <AppLayout
      sidebarCollapsed={sidebarCollapsed}
      isMobileDrawerOpen={navigation.isMobileDrawerOpen}
      onMobileDrawerToggle={handleMobileDrawerToggle}
      sidebar={showSidebar ? <AppSidebarPlaceholder /> : null}
      header={<AppHeaderPlaceholder />}
    >
      <Outlet />
    </AppLayout>
  );
}

/**
 * Placeholder sidebar component.
 *
 * This is a temporary placeholder that will be replaced in Phase 3
 * when Page components are extracted. Currently, individual routes
 * provide their own sidebar content.
 *
 * After migration, the sidebar content will be composed at this level
 * using data from a shared session context.
 */
function AppSidebarPlaceholder() {
  // Placeholder - individual routes currently handle their own sidebar
  // This will be populated with a shared sidebar in Phase 3
  return null;
}

/**
 * Placeholder header component.
 *
 * This is a temporary placeholder that will be replaced when
 * header content is unified. Currently, individual routes
 * provide their own header content with route-specific data.
 */
function AppHeaderPlaceholder() {
  // Placeholder - individual routes currently handle their own header
  // This will be populated with a shared header in Phase 3
  return null;
}
