import type { ReactNode } from 'react';
import { cn } from '@openflow/utils';
import type { LucideIcon } from 'lucide-react';
import { Icon } from '../atoms/Icon';

export interface SettingsNavItem {
  /** Unique identifier for the nav item */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Whether this item is a section header (non-clickable) */
  isSection?: boolean;
}

export interface SettingsLayoutProps {
  /** Navigation items for the settings sidebar */
  navigation: SettingsNavItem[];
  /** Currently active navigation item ID */
  activeNavId?: string;
  /** Callback when navigation item is clicked */
  onNavChange?: (id: string) => void;
  /** Main content area */
  children: ReactNode;
  /** Optional title for the settings page */
  title?: string;
  /** Optional description below the title */
  description?: string;
  /** Width of the navigation sidebar */
  navWidth?: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Additional CSS classes for the content area */
  contentClassName?: string;
}

/**
 * SettingsLayout is the settings page layout template.
 * Stateless - receives all content via props.
 *
 * It provides the structure for settings pages with:
 * - A navigation sidebar on the left with grouped items
 * - A content area on the right for settings forms
 * - Optional title and description header
 *
 * The layout is designed for settings/preferences pages where users
 * navigate between different configuration sections.
 *
 * @example
 * <SettingsLayout
 *   navigation={[
 *     { id: 'general', label: 'General', icon: Settings },
 *     { id: 'profiles', label: 'Executor Profiles', icon: User },
 *     { id: 'appearance', label: 'Appearance', isSection: true },
 *     { id: 'theme', label: 'Theme', icon: Palette },
 *   ]}
 *   activeNavId="general"
 *   onNavChange={setActiveSection}
 *   title="Settings"
 *   description="Manage your application preferences"
 * >
 *   <GeneralSettings />
 * </SettingsLayout>
 */
export function SettingsLayout({
  navigation,
  activeNavId,
  onNavChange,
  children,
  title,
  description,
  navWidth = '240px',
  className,
  contentClassName,
}: SettingsLayoutProps) {
  return (
    <div
      className={cn(
        'flex h-full',
        'bg-[rgb(var(--background))]',
        className
      )}
    >
      {/* Settings Navigation Sidebar */}
      <nav
        className="shrink-0 border-r border-[rgb(var(--border))] overflow-y-auto"
        style={{ width: navWidth }}
        aria-label="Settings navigation"
      >
        <div className="p-4">
          <ul className="space-y-1" role="list">
            {navigation.map((item) => {
              // Section headers
              if (item.isSection) {
                return (
                  <li key={item.id} className="pt-4 pb-1 first:pt-0">
                    <span className="px-3 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted-foreground))]">
                      {item.label}
                    </span>
                  </li>
                );
              }

              // Navigation items
              const isActive = item.id === activeNavId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavChange?.(item.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                      'transition-colors duration-150',
                      isActive
                        ? 'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]'
                        : 'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.icon && (
                      <Icon
                        icon={item.icon}
                        size="sm"
                        className={cn(
                          isActive
                            ? 'text-[rgb(var(--accent-foreground))]'
                            : 'text-[rgb(var(--muted-foreground))]'
                        )}
                      />
                    )}
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Settings Content Area */}
      <div className={cn('flex-1 overflow-y-auto', contentClassName)}>
        {/* Header with title and description */}
        {(title || description) && (
          <header className="border-b border-[rgb(var(--border))] px-8 py-6">
            {title && (
              <h1 className="text-2xl font-semibold text-[rgb(var(--foreground))]">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
                {description}
              </p>
            )}
          </header>
        )}

        {/* Main content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

SettingsLayout.displayName = 'SettingsLayout';
