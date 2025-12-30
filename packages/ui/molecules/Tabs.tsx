import { cn } from '@openflow/utils';
import type { LucideIcon } from 'lucide-react';
import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { Badge } from '../atoms/Badge';
import { Icon } from '../atoms/Icon';

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
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'default' | 'pills' | 'underline';
  /** Whether tabs should take full width */
  fullWidth?: boolean;
}

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Content of the tab panel */
  children: ReactNode;
  /** ID of the tab this panel belongs to */
  tabId: string;
  /** ID of the currently active tab */
  activeTab: string;
}

/**
 * Tabs component for tabbed interfaces.
 * Stateless - receives all data via props, emits actions via callbacks.
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
 * // Underline variant
 * <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} variant="underline" />
 *
 * @example
 * // Pills variant
 * <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} variant="pills" />
 */
export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  className,
  ...props
}: TabsProps) {
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

  const sizeStyles = {
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  const containerStyles = {
    default: 'bg-[rgb(var(--muted))] p-1 rounded-lg',
    pills: 'gap-1',
    underline: 'border-b border-[rgb(var(--border))]',
  };

  const tabBaseStyles = {
    default: 'rounded-md',
    pills: 'rounded-full border border-transparent',
    underline: 'border-b-2 border-transparent -mb-px rounded-none',
  };

  const tabActiveStyles = {
    default: 'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm',
    pills:
      'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] border-[rgb(var(--primary))]',
    underline: 'border-[rgb(var(--primary))] text-[rgb(var(--foreground))]',
  };

  const tabInactiveStyles = {
    default:
      'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--background))]/50',
    pills:
      'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))] hover:border-[rgb(var(--border))]',
    underline:
      'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:border-[rgb(var(--border))]',
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        'inline-flex items-center',
        containerStyles[variant],
        fullWidth && 'w-full',
        className
      )}
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
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            aria-disabled={isDisabled}
            tabIndex={isActive ? 0 : -1}
            disabled={isDisabled}
            onClick={() => !isDisabled && onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              // Base styles
              'inline-flex items-center justify-center font-medium',
              'motion-safe:transition-all motion-safe:duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
              sizeStyles[size],
              tabBaseStyles[variant],
              // State styles
              isActive ? tabActiveStyles[variant] : tabInactiveStyles[variant],
              // Disabled styles
              isDisabled && 'opacity-50 cursor-not-allowed',
              // Full width
              fullWidth && 'flex-1'
            )}
          >
            {tab.icon && (
              <Icon
                icon={tab.icon}
                size={size === 'lg' ? 'md' : 'sm'}
                className={cn(
                  isActive
                    ? variant === 'pills'
                      ? 'text-[rgb(var(--primary-foreground))]'
                      : 'text-[rgb(var(--foreground))]'
                    : 'text-[rgb(var(--muted-foreground))]'
                )}
              />
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <Badge
                variant={isActive && variant === 'pills' ? 'default' : 'info'}
                size="sm"
                className={cn('ml-1', isActive && variant === 'pills' && 'bg-white/20 text-white')}
              >
                {tab.badge}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * TabPanel component for tab content.
 * Only renders when the associated tab is active.
 *
 * @example
 * <TabPanel tabId="steps" activeTab={activeTab}>
 *   <StepsContent />
 * </TabPanel>
 */
export function TabPanel({ children, tabId, activeTab, className, ...props }: TabPanelProps) {
  if (tabId !== activeTab) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
      tabIndex={0}
      className={cn('focus-visible:outline-none', className)}
      {...props}
    >
      {children}
    </div>
  );
}

Tabs.displayName = 'Tabs';
TabPanel.displayName = 'TabPanel';
