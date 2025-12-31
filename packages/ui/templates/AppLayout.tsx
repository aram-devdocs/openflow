import { cn } from '@openflow/utils';
import type { ReactNode } from 'react';
import { HamburgerButton } from '../atoms/HamburgerButton';
import { SkipLink } from '../atoms/SkipLink';
import { Drawer } from '../organisms/Drawer';

export interface AppLayoutProps {
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
  /** Additional CSS classes for the main container */
  className?: string;
  /** Additional CSS classes for the content area */
  contentClassName?: string;
}

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
export function AppLayout({
  sidebar,
  header,
  children,
  sidebarCollapsed = false,
  isMobileDrawerOpen = false,
  onMobileDrawerToggle,
  className,
  contentClassName,
}: AppLayoutProps) {
  const handleOpenDrawer = () => {
    onMobileDrawerToggle?.(true);
  };

  const handleCloseDrawer = () => {
    onMobileDrawerToggle?.(false);
  };

  return (
    <div
      className={cn(
        'flex h-screen w-screen overflow-hidden',
        'bg-[rgb(var(--background))] text-[rgb(var(--foreground))]',
        className
      )}
    >
      {/* Skip link - first focusable element for keyboard navigation */}
      <SkipLink />

      {/* Desktop Sidebar - hidden on mobile */}
      <div
        className={cn(
          'hidden md:block shrink-0',
          'motion-safe:transition-[width] motion-safe:duration-200 motion-safe:ease-in-out',
          sidebarCollapsed ? 'md:w-14' : 'md:w-72'
        )}
      >
        {sidebar}
      </div>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={isMobileDrawerOpen}
        onClose={handleCloseDrawer}
        position="left"
        ariaLabel="Navigation menu"
      >
        {sidebar}
      </Drawer>

      {/* Main area: Header + Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header with hamburger button on mobile */}
        <div className="flex h-14 shrink-0 items-center border-b border-[rgb(var(--border))] bg-[rgb(var(--background))]">
          {/* Hamburger button - only visible on mobile */}
          <div className="pl-2 md:hidden">
            <HamburgerButton onClick={handleOpenDrawer} isOpen={isMobileDrawerOpen} />
          </div>

          {/* Header content */}
          <div className="flex-1">{header}</div>
        </div>

        {/* Main content */}
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'flex-1 overflow-auto scrollbar-thin focus:outline-none',
            'bg-[rgb(var(--background))]',
            contentClassName
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

AppLayout.displayName = 'AppLayout';
