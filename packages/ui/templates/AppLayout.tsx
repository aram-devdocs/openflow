import { cn } from '@openflow/utils';
import type { ReactNode } from 'react';
import { SkipLink } from '../atoms/SkipLink';

export interface AppLayoutProps {
  /** Sidebar content (typically the Sidebar component) */
  sidebar: ReactNode;
  /** Header content (typically the Header component) */
  header: ReactNode;
  /** Main content area */
  children: ReactNode;
  /** Whether the sidebar is collapsed */
  sidebarCollapsed?: boolean;
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
  className,
  contentClassName,
}: AppLayoutProps) {
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

      {/* Sidebar */}
      <div
        className={cn(
          'shrink-0 motion-safe:transition-[width] motion-safe:duration-200 motion-safe:ease-in-out',
          sidebarCollapsed ? 'w-14' : 'w-72'
        )}
      >
        {sidebar}
      </div>

      {/* Main area: Header + Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="shrink-0">{header}</div>

        {/* Main content */}
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'flex-1 overflow-auto focus:outline-none',
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
