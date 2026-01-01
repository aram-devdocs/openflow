/**
 * AppLayout Template - Main application layout with sidebar, header, and content area
 *
 * This template provides the overall structure of the application with:
 * - A collapsible sidebar on the left (hidden on mobile with drawer alternative)
 * - A header bar at the top with mobile hamburger menu
 * - A main content area that fills the remaining space
 *
 * Accessibility features:
 * - Skip link targets main content for keyboard navigation
 * - Proper landmark structure (banner, navigation, main)
 * - Focus management on mobile drawer open/close
 * - Responsive sidebar collapse with reduced motion support
 * - Screen reader announcements for navigation state changes
 *
 * @example
 * <AppLayout
 *   sidebar={<Sidebar ... />}
 *   header={<Header ... />}
 *   sidebarCollapsed={sidebarCollapsed}
 *   isMobileDrawerOpen={isMobileDrawerOpen}
 *   onMobileDrawerToggle={setMobileDrawerOpen}
 * >
 *   <DashboardPage />
 * </AppLayout>
 */

import {
  Aside,
  Box,
  DEFAULT_MAIN_ID,
  Flex,
  Header as HeaderPrimitive,
  Main,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, forwardRef, useCallback, useId, useRef } from 'react';
import { HamburgerButton } from '../atoms/HamburgerButton';
import { SkipLink } from '../atoms/SkipLink';
import { Drawer } from '../organisms/Drawer';

// ============================================================================
// Types
// ============================================================================

export type AppLayoutSize = 'sm' | 'md' | 'lg';
export type AppLayoutBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AppLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Sidebar content (typically the Sidebar component) */
  sidebar: ReactNode;
  /** Header content (typically the Header component) */
  header: ReactNode;
  /** Main content area */
  children: ReactNode;
  /** Whether the sidebar is collapsed (desktop only) */
  sidebarCollapsed?: boolean;
  /** Whether the mobile drawer is open */
  isMobileDrawerOpen?: boolean;
  /** Callback to open/close the mobile drawer */
  onMobileDrawerToggle?: (open: boolean) => void;
  /** Skip link text (for customization) */
  skipLinkText?: string;
  /** Accessible label for the sidebar region */
  sidebarLabel?: string;
  /** Accessible label for the header region */
  headerLabel?: string;
  /** Accessible label for the main content region */
  mainLabel?: string;
  /** Accessible label for mobile drawer */
  mobileDrawerLabel?: string;
  /** Additional CSS classes for the main container */
  className?: string;
  /** Additional CSS classes for the content area */
  contentClassName?: string;
  /** Size variant (affects sidebar width) */
  size?: ResponsiveValue<AppLayoutSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: readonly AppLayoutBreakpoint[] = [
  'base',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
] as const;

/**
 * Default skip link text
 */
export const DEFAULT_SKIP_LINK_TEXT = 'Skip to main content';

/**
 * Default sidebar label for screen readers
 */
export const DEFAULT_SIDEBAR_LABEL = 'Main navigation';

/**
 * Default header label for screen readers
 */
export const DEFAULT_HEADER_LABEL = 'Site header';

/**
 * Default main content label for screen readers
 */
export const DEFAULT_MAIN_LABEL = 'Main content';

/**
 * Default mobile drawer label
 */
export const DEFAULT_MOBILE_DRAWER_LABEL = 'Navigation menu';

/**
 * Screen reader announcement when sidebar collapses
 */
export const SR_SIDEBAR_COLLAPSED = 'Navigation sidebar collapsed';

/**
 * Screen reader announcement when sidebar expands
 */
export const SR_SIDEBAR_EXPANDED = 'Navigation sidebar expanded';

/**
 * Screen reader announcement when mobile drawer opens
 */
export const SR_DRAWER_OPENED = 'Navigation drawer opened';

/**
 * Screen reader announcement when mobile drawer closes
 */
export const SR_DRAWER_CLOSED = 'Navigation drawer closed';

/**
 * Base classes for the app layout container
 */
export const APP_LAYOUT_CONTAINER_CLASSES = [
  'flex h-screen w-screen overflow-hidden',
  'bg-[rgb(var(--background))] text-[rgb(var(--foreground))]',
].join(' ');

/**
 * Base classes for desktop sidebar container
 */
export const APP_LAYOUT_SIDEBAR_BASE_CLASSES = [
  'hidden md:block shrink-0',
  'motion-safe:transition-[width] motion-safe:duration-200 motion-safe:ease-in-out',
].join(' ');

/**
 * Sidebar width classes when expanded
 */
export const SIDEBAR_EXPANDED_WIDTH_CLASSES: Record<AppLayoutSize, string> = {
  sm: 'md:w-60',
  md: 'md:w-72',
  lg: 'md:w-80',
};

/**
 * Sidebar width classes when collapsed
 */
export const SIDEBAR_COLLAPSED_WIDTH = 'md:w-14';

/**
 * Base classes for the main area container (header + content)
 */
export const APP_LAYOUT_MAIN_AREA_CLASSES = 'flex min-w-0 flex-1 flex-col';

/**
 * Base classes for the header container
 */
export const APP_LAYOUT_HEADER_CONTAINER_CLASSES = [
  'flex h-14 shrink-0 items-center',
  'border-b border-[rgb(var(--border))]',
  'bg-[rgb(var(--background))]',
].join(' ');

/**
 * Classes for the hamburger button container (mobile only)
 */
export const APP_LAYOUT_HAMBURGER_CONTAINER_CLASSES = 'pl-2 md:hidden';

/**
 * Classes for the header content container
 */
export const APP_LAYOUT_HEADER_CONTENT_CLASSES = 'flex-1';

/**
 * Base classes for the main content area
 */
export const APP_LAYOUT_MAIN_CONTENT_CLASSES = [
  'flex-1 overflow-auto scrollbar-thin',
  'bg-[rgb(var(--background))]',
  'focus:outline-none',
].join(' ');

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<AppLayoutSize> | undefined): AppLayoutSize {
  if (size === undefined) {
    return 'md';
  }

  if (typeof size === 'string') {
    return size;
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<Record<AppLayoutBreakpoint, AppLayoutSize>>;
    // Return base if specified, otherwise first defined value, otherwise default
    if (sizeObj.base) return sizeObj.base;
    for (const bp of BREAKPOINT_ORDER) {
      if (sizeObj[bp]) return sizeObj[bp] as AppLayoutSize;
    }
  }

  return 'md';
}

/**
 * Generate responsive sidebar width classes
 */
export function getResponsiveSidebarClasses(
  size: ResponsiveValue<AppLayoutSize> | undefined,
  isCollapsed: boolean
): string {
  if (isCollapsed) {
    return SIDEBAR_COLLAPSED_WIDTH;
  }

  if (size === undefined) {
    return SIDEBAR_EXPANDED_WIDTH_CLASSES.md;
  }

  if (typeof size === 'string') {
    return SIDEBAR_EXPANDED_WIDTH_CLASSES[size];
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<Record<AppLayoutBreakpoint, AppLayoutSize>>;
    const classes: string[] = [];

    for (const breakpoint of BREAKPOINT_ORDER) {
      const sizeValue = sizeObj[breakpoint];
      if (sizeValue !== undefined) {
        const widthClass = SIDEBAR_EXPANDED_WIDTH_CLASSES[sizeValue];
        // Extract width number (e.g., "md:w-72" -> "72")
        const widthMatch = widthClass.match(/md:w-(\d+)/);
        if (widthMatch) {
          if (breakpoint === 'base') {
            classes.push(`md:w-${widthMatch[1]}`);
          } else {
            classes.push(`${breakpoint}:w-${widthMatch[1]}`);
          }
        }
      }
    }

    return classes.length > 0 ? classes.join(' ') : SIDEBAR_EXPANDED_WIDTH_CLASSES.md;
  }

  return SIDEBAR_EXPANDED_WIDTH_CLASSES.md;
}

/**
 * Build sidebar state announcement for screen readers
 */
export function buildSidebarAnnouncement(isCollapsed: boolean): string {
  return isCollapsed ? SR_SIDEBAR_COLLAPSED : SR_SIDEBAR_EXPANDED;
}

/**
 * Build drawer state announcement for screen readers
 */
export function buildDrawerAnnouncement(isOpen: boolean, label: string): string {
  return isOpen ? `${label} opened` : `${label} closed`;
}

// ============================================================================
// AppLayout Component
// ============================================================================

/**
 * AppLayout is the main application layout template.
 * Stateless - receives all content via props.
 *
 * It provides the overall structure of the application with:
 * - A collapsible sidebar on the left
 * - A header bar at the top
 * - A main content area that fills the remaining space
 *
 * The layout uses dark mode by default (via CSS variables from globals.css).
 * Sidebar width transitions smoothly when collapsed/expanded.
 *
 * @example
 * <AppLayout
 *   sidebar={
 *     <Sidebar
 *       projects={projects}
 *       tasks={tasks}
 *       isCollapsed={sidebarCollapsed}
 *       onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
 *       // ... other props
 *     />
 *   }
 *   header={
 *     <Header
 *       onSearch={() => setCommandPaletteOpen(true)}
 *       // ... other props
 *     />
 *   }
 *   sidebarCollapsed={sidebarCollapsed}
 * >
 *   {children}
 * </AppLayout>
 */
export const AppLayout = forwardRef<HTMLDivElement, AppLayoutProps>(function AppLayout(
  {
    sidebar,
    header,
    children,
    sidebarCollapsed = false,
    isMobileDrawerOpen = false,
    onMobileDrawerToggle,
    skipLinkText = DEFAULT_SKIP_LINK_TEXT,
    sidebarLabel = DEFAULT_SIDEBAR_LABEL,
    headerLabel = DEFAULT_HEADER_LABEL,
    mainLabel = DEFAULT_MAIN_LABEL,
    mobileDrawerLabel = DEFAULT_MOBILE_DRAWER_LABEL,
    className,
    contentClassName,
    size = 'md',
    'data-testid': dataTestId,
    ...props
  },
  ref
) {
  const id = useId();
  const sidebarId = `${id}-sidebar`;
  const headerId = `${id}-header`;
  const previousDrawerState = useRef(isMobileDrawerOpen);
  const previousSidebarState = useRef(sidebarCollapsed);

  const handleOpenDrawer = useCallback(() => {
    onMobileDrawerToggle?.(true);
  }, [onMobileDrawerToggle]);

  const handleCloseDrawer = useCallback(() => {
    onMobileDrawerToggle?.(false);
  }, [onMobileDrawerToggle]);

  // Track state changes for announcements
  const drawerChanged = previousDrawerState.current !== isMobileDrawerOpen;
  const sidebarChanged = previousSidebarState.current !== sidebarCollapsed;

  // Update refs after render
  if (drawerChanged) {
    previousDrawerState.current = isMobileDrawerOpen;
  }
  if (sidebarChanged) {
    previousSidebarState.current = sidebarCollapsed;
  }

  const sidebarWidthClasses = getResponsiveSidebarClasses(size, sidebarCollapsed);

  return (
    <Flex
      ref={ref}
      className={cn(APP_LAYOUT_CONTAINER_CLASSES, className)}
      data-testid={dataTestId}
      data-sidebar-collapsed={sidebarCollapsed}
      data-drawer-open={isMobileDrawerOpen}
      data-size={getBaseSize(size)}
      {...props}
    >
      {/* Skip link - first focusable element for keyboard navigation */}
      <SkipLink targetId={DEFAULT_MAIN_ID}>{skipLinkText}</SkipLink>

      {/* Screen reader announcements for state changes */}
      {drawerChanged && (
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite">
            {buildDrawerAnnouncement(isMobileDrawerOpen, mobileDrawerLabel)}
          </Text>
        </VisuallyHidden>
      )}
      {sidebarChanged && (
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite">
            {buildSidebarAnnouncement(sidebarCollapsed)}
          </Text>
        </VisuallyHidden>
      )}

      {/* Desktop Sidebar - hidden on mobile */}
      <Aside
        id={sidebarId}
        aria-label={sidebarLabel}
        className={cn(APP_LAYOUT_SIDEBAR_BASE_CLASSES, sidebarWidthClasses)}
        data-testid={dataTestId ? `${dataTestId}-sidebar` : undefined}
      >
        {sidebar}
      </Aside>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={isMobileDrawerOpen}
        onClose={handleCloseDrawer}
        position="left"
        aria-label={mobileDrawerLabel}
        data-testid={dataTestId ? `${dataTestId}-drawer` : undefined}
      >
        {sidebar}
      </Drawer>

      {/* Main area: Header + Content */}
      <Flex
        direction="column"
        className={APP_LAYOUT_MAIN_AREA_CLASSES}
        data-testid={dataTestId ? `${dataTestId}-main-area` : undefined}
      >
        {/* Header with hamburger button on mobile */}
        <HeaderPrimitive
          id={headerId}
          aria-label={headerLabel}
          className={APP_LAYOUT_HEADER_CONTAINER_CLASSES}
          data-testid={dataTestId ? `${dataTestId}-header` : undefined}
        >
          {/* Hamburger button - only visible on mobile */}
          <Box className={APP_LAYOUT_HAMBURGER_CONTAINER_CLASSES}>
            <HamburgerButton
              onClick={handleOpenDrawer}
              isOpen={isMobileDrawerOpen}
              controlsId="mobile-nav"
              data-testid={dataTestId ? `${dataTestId}-hamburger` : undefined}
            />
          </Box>

          {/* Header content */}
          <Box className={APP_LAYOUT_HEADER_CONTENT_CLASSES}>{header}</Box>
        </HeaderPrimitive>

        {/* Main content */}
        <Main
          id={DEFAULT_MAIN_ID}
          tabIndex={-1}
          aria-label={mainLabel}
          className={cn(APP_LAYOUT_MAIN_CONTENT_CLASSES, contentClassName)}
          data-testid={dataTestId ? `${dataTestId}-main` : undefined}
        >
          {children}
        </Main>
      </Flex>
    </Flex>
  );
});

// ============================================================================
// Display Names
// ============================================================================

AppLayout.displayName = 'AppLayout';
