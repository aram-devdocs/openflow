import type { ResponsiveValue } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import type { LucideIcon } from 'lucide-react';
import { type HTMLAttributes, type KeyboardEvent, type ReactNode, forwardRef } from 'react';
import { Badge } from '../atoms/Badge';
import { Icon } from '../atoms/Icon';

// ============================================================================
// Types
// ============================================================================

/** Size variants for the Tabs component */
export type TabsSize = 'sm' | 'md' | 'lg';

/** Breakpoints supported for responsive sizing */
export type TabsBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Visual variant styles for the Tabs component */
export type TabsVariant = 'default' | 'pills' | 'underline';

export interface Tab {
  /** Unique identifier for the tab */
  id: string;
  /** Label text displayed on the tab */
  label: string;
  /** Optional icon to display before the label */
  icon?: LucideIcon;
  /** Optional badge to display after the label (e.g., count) */
  badge?: string | number;
  /** Whether the tab is disabled */
  disabled?: boolean;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Array of tab definitions */
  tabs: Tab[];
  /** ID of the currently active tab */
  activeTab: string;
  /** Callback when tab changes */
  onTabChange: (tabId: string) => void;
  /** Size variant - can be a single value or responsive object */
  size?: ResponsiveValue<TabsSize>;
  /** Visual variant */
  variant?: TabsVariant;
  /** Whether tabs should take full width */
  fullWidth?: boolean;
  /** Test ID for testing */
  'data-testid'?: string;
}

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Content of the tab panel */
  children: ReactNode;
  /** ID of the tab this panel belongs to */
  tabId: string;
  /** ID of the currently active tab */
  activeTab: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants - Exported for testability
// ============================================================================

/** Base size for responsive fallback */
export const DEFAULT_SIZE: TabsSize = 'md';

/** Default variant */
export const DEFAULT_VARIANT: TabsVariant = 'default';

/** Touch target: min-height 44px for accessibility on all sizes */
export const TABS_SIZE_CLASSES: Record<TabsSize, string> = {
  sm: 'text-xs px-2 py-1 gap-1 min-h-[44px]',
  md: 'text-sm px-3 py-1.5 gap-1.5 min-h-[44px]',
  lg: 'text-base px-4 py-2 gap-2 min-h-[44px]',
};

/** Container styling based on variant */
export const TABS_CONTAINER_CLASSES: Record<TabsVariant, string> = {
  default: 'bg-[rgb(var(--muted))] p-1 rounded-lg',
  pills: 'gap-1',
  underline: 'border-b border-[rgb(var(--border))]',
};

/** Base tab button styling by variant */
export const TABS_TAB_BASE_CLASSES: Record<TabsVariant, string> = {
  default: 'rounded-md',
  pills: 'rounded-full border border-transparent',
  underline: 'border-b-2 border-transparent -mb-px rounded-none',
};

/** Active state styling by variant */
export const TABS_TAB_ACTIVE_CLASSES: Record<TabsVariant, string> = {
  default: 'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm',
  pills:
    'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] border-[rgb(var(--primary))]',
  underline: 'border-[rgb(var(--primary))] text-[rgb(var(--foreground))]',
};

/** Inactive state styling by variant */
export const TABS_TAB_INACTIVE_CLASSES: Record<TabsVariant, string> = {
  default:
    'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--background))]/50',
  pills:
    'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))] hover:border-[rgb(var(--border))]',
  underline:
    'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:border-[rgb(var(--border))]',
};

/** Disabled styling */
export const TABS_TAB_DISABLED_CLASSES = 'opacity-50 cursor-not-allowed';

/** Common tab button base classes */
export const TABS_TAB_COMMON_CLASSES = [
  'inline-flex items-center justify-center font-medium',
  'motion-safe:transition-all motion-safe:duration-150',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2',
  'focus-visible:ring-offset-[rgb(var(--background))]',
].join(' ');

/** Container base classes */
export const TABS_CONTAINER_BASE_CLASSES = 'inline-flex items-center';

/** Icon size mapping */
export const TABS_ICON_SIZE_MAP: Record<TabsSize, 'sm' | 'md'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

/** Tab panel base classes */
export const TABS_PANEL_CLASSES = 'focus-visible:outline-none';

// ============================================================================
// Utility Functions - Exported for testability
// ============================================================================

/**
 * Resolves a ResponsiveValue to its base size for initial render
 */
export function getBaseSize(size: ResponsiveValue<TabsSize> | undefined): TabsSize {
  if (!size) return DEFAULT_SIZE;
  if (typeof size === 'string') return size;
  return size.base ?? DEFAULT_SIZE;
}

/**
 * Generates responsive Tailwind classes for the size prop
 */
export function getResponsiveSizeClasses(size: ResponsiveValue<TabsSize> | undefined): string {
  if (!size) return TABS_SIZE_CLASSES[DEFAULT_SIZE];

  // Simple string value
  if (typeof size === 'string') {
    return TABS_SIZE_CLASSES[size];
  }

  // Responsive object
  const classes: string[] = [];

  // Base/default size (no prefix)
  if (size.base) {
    classes.push(TABS_SIZE_CLASSES[size.base]);
  } else {
    classes.push(TABS_SIZE_CLASSES[DEFAULT_SIZE]);
  }

  // Responsive overrides with breakpoint prefixes
  const breakpointPrefixes: Record<Exclude<TabsBreakpoint, 'base'>, string> = {
    sm: 'sm:',
    md: 'md:',
    lg: 'lg:',
    xl: 'xl:',
    '2xl': '2xl:',
  };

  for (const [breakpoint, prefix] of Object.entries(breakpointPrefixes)) {
    const bp = breakpoint as Exclude<TabsBreakpoint, 'base'>;
    if (size[bp]) {
      const sizeClasses = TABS_SIZE_CLASSES[size[bp] as TabsSize];
      // Prefix each class with the breakpoint
      const prefixedClasses = sizeClasses
        .split(' ')
        .map((cls) => `${prefix}${cls}`)
        .join(' ');
      classes.push(prefixedClasses);
    }
  }

  return classes.join(' ');
}

/**
 * Gets icon size based on tab size
 */
export function getIconSize(size: TabsSize): 'sm' | 'md' {
  return TABS_ICON_SIZE_MAP[size];
}

// ============================================================================
// Components
// ============================================================================

/**
 * Tabs component for tabbed interfaces.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Full keyboard navigation (Arrow keys, Home, End)
 * - ARIA compliant (role="tablist", role="tab", aria-selected)
 * - Responsive sizing with breakpoint support
 * - Three visual variants: default, pills, underline
 * - Support for icons and badges
 * - Disabled state support
 *
 * @example
 * <Tabs
 *   tabs={[
 *     { id: 'steps', label: 'Steps', icon: ListTodo },
 *     { id: 'changes', label: 'Changes', badge: 5 },
 *     { id: 'commits', label: 'Commits' },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 *
 * @example
 * // Responsive sizing
 * <Tabs
 *   tabs={tabs}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   size={{ base: 'sm', md: 'md', lg: 'lg' }}
 * />
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    tabs,
    activeTab,
    onTabChange,
    size = DEFAULT_SIZE,
    variant = DEFAULT_VARIANT,
    fullWidth = false,
    className,
    'data-testid': testId,
    ...props
  },
  ref
) {
  const baseSize = getBaseSize(size);
  const sizeClasses = getResponsiveSizeClasses(size);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const enabledTabs = tabs.filter((tab) => !tab.disabled);
    const currentTab = tabs[currentIndex];
    if (!currentTab) return;

    const currentEnabledIndex = enabledTabs.findIndex((tab) => tab.id === currentTab.id);

    let nextTab: Tab | undefined;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex =
          currentEnabledIndex <= 0 ? enabledTabs.length - 1 : currentEnabledIndex - 1;
        nextTab = enabledTabs[prevIndex];
        break;
      }
      case 'ArrowRight':
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex =
          currentEnabledIndex >= enabledTabs.length - 1 ? 0 : currentEnabledIndex + 1;
        nextTab = enabledTabs[nextIndex];
        break;
      }
      case 'Home': {
        e.preventDefault();
        nextTab = enabledTabs[0];
        break;
      }
      case 'End': {
        e.preventDefault();
        nextTab = enabledTabs[enabledTabs.length - 1];
        break;
      }
    }

    if (nextTab) {
      onTabChange(nextTab.id);
      // Focus the newly activated tab
      const button = document.querySelector(`[data-tab-id="${nextTab.id}"]`) as HTMLButtonElement;
      button?.focus();
    }
  };

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        TABS_CONTAINER_BASE_CLASSES,
        TABS_CONTAINER_CLASSES[variant],
        fullWidth && 'w-full',
        className
      )}
      data-testid={testId}
      data-size={baseSize}
      data-variant={variant}
      data-full-width={fullWidth || undefined}
      {...props}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab;
        const isDisabled = tab.disabled;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            data-tab-id={tab.id}
            data-testid={testId ? `${testId}-tab-${tab.id}` : undefined}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            aria-disabled={isDisabled}
            tabIndex={isActive ? 0 : -1}
            disabled={isDisabled}
            onClick={() => !isDisabled && onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              TABS_TAB_COMMON_CLASSES,
              sizeClasses,
              TABS_TAB_BASE_CLASSES[variant],
              isActive ? TABS_TAB_ACTIVE_CLASSES[variant] : TABS_TAB_INACTIVE_CLASSES[variant],
              isDisabled && TABS_TAB_DISABLED_CLASSES,
              fullWidth && 'flex-1'
            )}
          >
            {tab.icon && (
              <Icon
                icon={tab.icon}
                size={getIconSize(baseSize)}
                className={cn(
                  isActive
                    ? variant === 'pills'
                      ? 'text-[rgb(var(--primary-foreground))]'
                      : 'text-[rgb(var(--foreground))]'
                    : 'text-[rgb(var(--muted-foreground))]'
                )}
                aria-hidden="true"
              />
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <Badge
                variant={isActive && variant === 'pills' ? 'default' : 'info'}
                size="sm"
                className={cn('ml-1', isActive && variant === 'pills' && 'bg-white/20 text-white')}
                aria-label={`${tab.badge} items`}
              >
                {tab.badge}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
});

/**
 * TabPanel component for tab content.
 * Only renders when the associated tab is active.
 *
 * @example
 * <TabPanel tabId="steps" activeTab={activeTab}>
 *   <StepsContent />
 * </TabPanel>
 */
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(
  { children, tabId, activeTab, className, 'data-testid': testId, ...props },
  ref
) {
  if (tabId !== activeTab) {
    return null;
  }

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={`tabpanel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
      tabIndex={0}
      className={cn(TABS_PANEL_CLASSES, className)}
      data-testid={testId}
      {...props}
    >
      {children}
    </div>
  );
});

Tabs.displayName = 'Tabs';
TabPanel.displayName = 'TabPanel';
