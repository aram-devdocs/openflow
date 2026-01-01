/**
 * SettingsLayout Template - Settings page layout with navigation sidebar and content area
 *
 * This template provides the structure for settings pages with:
 * - A navigation sidebar on the left with grouped items
 * - A horizontal tab-like navigation on mobile
 * - A content area on the right for settings forms
 * - Optional title and description header
 *
 * Accessibility features:
 * - role="navigation" with aria-label for settings nav
 * - role="tablist" pattern on mobile with proper keyboard navigation
 * - aria-current="page" for active navigation item
 * - Screen reader announcements for navigation changes
 * - Responsive design with mobile-first approach
 * - Touch target ≥44px on mobile (WCAG 2.5.5)
 * - Focus ring with ring-offset for visibility
 * - motion-safe transitions for reduced motion support
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

import {
  Box,
  Flex,
  Header as HeaderPrimitive,
  Heading,
  List,
  ListItem,
  Main,
  Nav,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import type { LucideIcon } from 'lucide-react';
import {
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Icon } from '../atoms/Icon';

// ============================================================================
// Types
// ============================================================================

export type SettingsLayoutSize = 'sm' | 'md' | 'lg';
export type SettingsLayoutBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface SettingsNavItem {
  /** Unique identifier for the nav item */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Whether this item is a section header (non-clickable) */
  isSection?: boolean;
  /** Whether this item is disabled */
  disabled?: boolean;
}

export interface SettingsLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
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
  /** Size variant (affects padding and font sizes) */
  size?: ResponsiveValue<SettingsLayoutSize>;
  /** Accessible label for the navigation region */
  navLabel?: string;
  /** Accessible label for the content region */
  contentLabel?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: readonly SettingsLayoutBreakpoint[] = [
  'base',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
] as const;

/**
 * Default navigation label for screen readers
 */
export const DEFAULT_NAV_LABEL = 'Settings navigation';

/**
 * Default content label for screen readers
 */
export const DEFAULT_CONTENT_LABEL = 'Settings content';

/**
 * Screen reader announcement when navigation changes
 */
export const SR_NAV_CHANGED = 'Navigated to';

/**
 * Screen reader text for section headers
 */
export const SR_SECTION_HEADER = 'Section:';

/**
 * Screen reader text for active page indicator
 */
export const SR_CURRENT_PAGE = 'Current page:';

/**
 * Base classes for the settings layout container
 */
export const SETTINGS_LAYOUT_CONTAINER_CLASSES = [
  'flex h-full flex-col md:flex-row',
  'bg-[rgb(var(--background))]',
].join(' ');

/**
 * Size-based padding classes for content
 */
export const SETTINGS_LAYOUT_SIZE_CLASSES: Record<
  SettingsLayoutSize,
  {
    headerPadding: string;
    contentPadding: string;
    navItemPadding: string;
    mobileNavGap: string;
  }
> = {
  sm: {
    headerPadding: 'px-3 py-3 md:px-4 md:py-4',
    contentPadding: 'p-3 md:p-4',
    navItemPadding: 'px-2 py-1.5 text-xs',
    mobileNavGap: 'gap-0.5 p-1.5',
  },
  md: {
    headerPadding: 'px-4 py-4 md:px-6 md:py-6',
    contentPadding: 'p-4 md:p-6',
    navItemPadding: 'px-3 py-2 text-sm',
    mobileNavGap: 'gap-1 p-2',
  },
  lg: {
    headerPadding: 'px-5 py-5 md:px-8 md:py-8',
    contentPadding: 'p-5 md:p-8',
    navItemPadding: 'px-4 py-2.5 text-base',
    mobileNavGap: 'gap-1.5 p-2.5',
  },
};

/**
 * Classes for mobile horizontal navigation container
 */
export const SETTINGS_MOBILE_NAV_CLASSES = [
  'shrink-0 border-b border-[rgb(var(--border))]',
  'overflow-x-auto scrollbar-hidden md:hidden',
].join(' ');

/**
 * Base classes for mobile navigation tab buttons
 */
export const SETTINGS_MOBILE_TAB_BASE_CLASSES = [
  'flex shrink-0 items-center gap-2 rounded-md font-medium',
  'min-h-[44px] min-w-[44px]', // Touch target (WCAG 2.5.5)
  'motion-safe:transition-colors motion-safe:duration-150',
  'whitespace-nowrap',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
].join(' ');

/**
 * Active state classes for mobile tabs
 */
export const SETTINGS_MOBILE_TAB_ACTIVE_CLASSES = [
  'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]',
].join(' ');

/**
 * Inactive state classes for mobile tabs
 */
export const SETTINGS_MOBILE_TAB_INACTIVE_CLASSES = [
  'text-[rgb(var(--muted-foreground))]',
  'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
].join(' ');

/**
 * Disabled state classes for mobile tabs
 */
export const SETTINGS_MOBILE_TAB_DISABLED_CLASSES = [
  'opacity-50 cursor-not-allowed',
  'pointer-events-none',
].join(' ');

/**
 * Classes for desktop sidebar navigation container
 */
export const SETTINGS_DESKTOP_NAV_CLASSES = [
  'hidden shrink-0 border-r border-[rgb(var(--border))]',
  'overflow-y-auto scrollbar-thin md:block',
].join(' ');

/**
 * Classes for navigation list container
 */
export const SETTINGS_NAV_LIST_CLASSES = 'space-y-1';

/**
 * Classes for section header items
 */
export const SETTINGS_SECTION_HEADER_CLASSES = [
  'pt-4 pb-1 first:pt-0',
  'px-3 text-xs font-semibold uppercase tracking-wider',
  'text-[rgb(var(--muted-foreground))]',
].join(' ');

/**
 * Base classes for desktop navigation items
 */
export const SETTINGS_NAV_ITEM_BASE_CLASSES = [
  'flex w-full items-center gap-3 rounded-md font-medium',
  'motion-safe:transition-colors motion-safe:duration-150',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
].join(' ');

/**
 * Active state classes for desktop nav items
 */
export const SETTINGS_NAV_ITEM_ACTIVE_CLASSES = [
  'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]',
].join(' ');

/**
 * Inactive state classes for desktop nav items
 */
export const SETTINGS_NAV_ITEM_INACTIVE_CLASSES = [
  'text-[rgb(var(--muted-foreground))]',
  'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
].join(' ');

/**
 * Disabled state classes for desktop nav items
 */
export const SETTINGS_NAV_ITEM_DISABLED_CLASSES = [
  'opacity-50 cursor-not-allowed',
  'pointer-events-none',
].join(' ');

/**
 * Classes for the content area wrapper
 */
export const SETTINGS_CONTENT_WRAPPER_CLASSES = 'flex-1 overflow-y-auto scrollbar-thin';

/**
 * Classes for the header section
 */
export const SETTINGS_HEADER_CLASSES = 'border-b border-[rgb(var(--border))]';

/**
 * Default nav width for desktop
 */
export const DEFAULT_NAV_WIDTH = '240px';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get base size from responsive value
 */
export function getBaseSize(
  size: ResponsiveValue<SettingsLayoutSize> | undefined
): SettingsLayoutSize {
  if (size === undefined) {
    return 'md';
  }

  if (typeof size === 'string') {
    return size;
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<Record<SettingsLayoutBreakpoint, SettingsLayoutSize>>;
    // Return base if specified, otherwise first defined value, otherwise default
    if (sizeObj.base) return sizeObj.base;
    for (const bp of BREAKPOINT_ORDER) {
      if (sizeObj[bp]) return sizeObj[bp] as SettingsLayoutSize;
    }
  }

  return 'md';
}

/**
 * Generate responsive size classes for a specific property
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<SettingsLayoutSize> | undefined,
  property: keyof typeof SETTINGS_LAYOUT_SIZE_CLASSES.md
): string {
  const baseSize = getBaseSize(size);
  return SETTINGS_LAYOUT_SIZE_CLASSES[baseSize][property];
}

/**
 * Build navigation change announcement for screen readers
 */
export function buildNavChangeAnnouncement(label: string): string {
  return `${SR_NAV_CHANGED} ${label}`;
}

/**
 * Get the ID for a navigation item's tab element
 */
export function getNavItemId(prefix: string, itemId: string): string {
  return `${prefix}-nav-item-${itemId}`;
}

/**
 * Get the ID for the tab panel
 */
export function getTabPanelId(prefix: string): string {
  return `${prefix}-tabpanel`;
}

/**
 * Filter navigation items to only clickable items (excluding section headers)
 */
export function getClickableNavItems(navigation: SettingsNavItem[]): SettingsNavItem[] {
  return navigation.filter((item) => !item.isSection);
}

/**
 * Get the index of an item in the clickable items list
 */
export function getNavItemIndex(clickableItems: SettingsNavItem[], itemId: string): number {
  return clickableItems.findIndex((item) => item.id === itemId);
}

/**
 * Find the next non-disabled item index (wrapping)
 */
export function findNextEnabledItem(
  items: SettingsNavItem[],
  currentIndex: number,
  direction: 1 | -1
): number {
  const len = items.length;
  if (len === 0) return currentIndex;

  let index = currentIndex;

  for (let i = 0; i < len; i++) {
    index = (index + direction + len) % len;
    const item = items[index];
    if (item && !item.disabled) {
      return index;
    }
  }

  return currentIndex;
}

// ============================================================================
// SettingsLayout Component
// ============================================================================

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
 */
export const SettingsLayout = forwardRef<HTMLDivElement, SettingsLayoutProps>(
  function SettingsLayout(
    {
      navigation,
      activeNavId,
      onNavChange,
      children,
      title,
      description,
      navWidth = DEFAULT_NAV_WIDTH,
      className,
      contentClassName,
      size = 'md',
      navLabel = DEFAULT_NAV_LABEL,
      contentLabel = DEFAULT_CONTENT_LABEL,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) {
    const id = useId();
    const previousActiveNavId = useRef(activeNavId);
    const [announcement, setAnnouncement] = useState<string | null>(null);

    // Get clickable items for keyboard navigation
    const clickableItems = getClickableNavItems(navigation);

    // Get size-based classes
    const baseSize = getBaseSize(size);
    const sizeClasses = SETTINGS_LAYOUT_SIZE_CLASSES[baseSize];

    // Track focused item index for keyboard navigation
    const [focusedIndex, setFocusedIndex] = useState(() => {
      if (activeNavId) {
        const idx = getNavItemIndex(clickableItems, activeNavId);
        return idx >= 0 ? idx : 0;
      }
      return 0;
    });

    // Handle navigation change with announcement
    const handleNavChange = useCallback(
      (itemId: string, label: string) => {
        if (itemId !== activeNavId) {
          onNavChange?.(itemId);
          setAnnouncement(buildNavChangeAnnouncement(label));
        }
      },
      [activeNavId, onNavChange]
    );

    // Clear announcement after it's been read
    useEffect(() => {
      if (announcement) {
        const timer = setTimeout(() => setAnnouncement(null), 1000);
        return () => clearTimeout(timer);
      }
    }, [announcement]);

    // Update focused index when activeNavId changes externally
    useEffect(() => {
      if (activeNavId && activeNavId !== previousActiveNavId.current) {
        const idx = getNavItemIndex(clickableItems, activeNavId);
        if (idx >= 0) {
          setFocusedIndex(idx);
        }
        previousActiveNavId.current = activeNavId;
      }
    }, [activeNavId, clickableItems]);

    // Keyboard navigation handler for mobile tabs
    const handleMobileKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        const { key } = event;
        let newIndex = focusedIndex;
        let handled = false;

        switch (key) {
          case 'ArrowLeft':
          case 'ArrowUp':
            newIndex = findNextEnabledItem(clickableItems, focusedIndex, -1);
            handled = true;
            break;
          case 'ArrowRight':
          case 'ArrowDown':
            newIndex = findNextEnabledItem(clickableItems, focusedIndex, 1);
            handled = true;
            break;
          case 'Home':
            newIndex = findNextEnabledItem(clickableItems, -1, 1);
            handled = true;
            break;
          case 'End':
            newIndex = findNextEnabledItem(clickableItems, clickableItems.length, -1);
            handled = true;
            break;
          case 'Enter':
          case ' ': {
            const focusedItem = clickableItems[focusedIndex];
            if (focusedItem && !focusedItem.disabled) {
              handleNavChange(focusedItem.id, focusedItem.label);
            }
            handled = true;
            break;
          }
        }

        if (handled) {
          event.preventDefault();
          event.stopPropagation();
          if (newIndex !== focusedIndex) {
            setFocusedIndex(newIndex);
          }
        }
      },
      [clickableItems, focusedIndex, handleNavChange]
    );

    // Keyboard navigation handler for desktop list
    const handleDesktopKeyDown = useCallback(
      (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        const { key } = event;
        let newIndex = index;
        let handled = false;

        switch (key) {
          case 'ArrowUp':
            newIndex = findNextEnabledItem(clickableItems, index, -1);
            handled = true;
            break;
          case 'ArrowDown':
            newIndex = findNextEnabledItem(clickableItems, index, 1);
            handled = true;
            break;
          case 'Home':
            newIndex = findNextEnabledItem(clickableItems, -1, 1);
            handled = true;
            break;
          case 'End':
            newIndex = findNextEnabledItem(clickableItems, clickableItems.length, -1);
            handled = true;
            break;
        }

        if (handled) {
          event.preventDefault();
          const targetItem = clickableItems[newIndex];
          if (newIndex !== index && targetItem) {
            // Focus the new button
            const targetId = getNavItemId(id, targetItem.id);
            const targetElement = document.getElementById(targetId);
            targetElement?.focus();
          }
        }
      },
      [clickableItems, id]
    );

    return (
      <Flex
        ref={ref}
        className={cn(SETTINGS_LAYOUT_CONTAINER_CLASSES, className)}
        data-testid={dataTestId}
        data-size={baseSize}
        data-active-nav={activeNavId}
        {...props}
      >
        {/* Screen reader announcements for navigation changes */}
        {announcement && (
          <VisuallyHidden>
            <Text as="span" role="status" aria-live="polite" aria-atomic="true">
              {announcement}
            </Text>
          </VisuallyHidden>
        )}

        {/* Mobile: Horizontal scrollable navigation with tablist pattern */}
        <Nav
          className={SETTINGS_MOBILE_NAV_CLASSES}
          aria-label={navLabel}
          data-testid={dataTestId ? `${dataTestId}-mobile-nav` : undefined}
        >
          <Flex
            role="tablist"
            aria-orientation="horizontal"
            className={sizeClasses.mobileNavGap}
            onKeyDown={handleMobileKeyDown}
            data-testid={dataTestId ? `${dataTestId}-mobile-tablist` : undefined}
          >
            {clickableItems.map((item, index) => {
              const isActive = item.id === activeNavId;
              const isFocused = index === focusedIndex;
              const itemElementId = getNavItemId(id, item.id);

              return (
                <button
                  key={item.id}
                  id={itemElementId}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={getTabPanelId(id)}
                  aria-disabled={item.disabled || undefined}
                  tabIndex={isFocused ? 0 : -1}
                  onClick={() => !item.disabled && handleNavChange(item.id, item.label)}
                  className={cn(
                    SETTINGS_MOBILE_TAB_BASE_CLASSES,
                    sizeClasses.navItemPadding,
                    isActive
                      ? SETTINGS_MOBILE_TAB_ACTIVE_CLASSES
                      : SETTINGS_MOBILE_TAB_INACTIVE_CLASSES,
                    item.disabled && SETTINGS_MOBILE_TAB_DISABLED_CLASSES
                  )}
                  data-testid={dataTestId ? `${dataTestId}-mobile-tab-${item.id}` : undefined}
                  data-active={isActive}
                  data-disabled={item.disabled || undefined}
                >
                  {item.icon && (
                    <Icon
                      icon={item.icon}
                      size="sm"
                      aria-hidden={true}
                      className={cn(
                        isActive
                          ? 'text-[rgb(var(--accent-foreground))]'
                          : 'text-[rgb(var(--muted-foreground))]'
                      )}
                    />
                  )}
                  <Text as="span">{item.label}</Text>
                </button>
              );
            })}
          </Flex>
        </Nav>

        {/* Desktop: Vertical sidebar navigation */}
        <Nav
          className={SETTINGS_DESKTOP_NAV_CLASSES}
          style={{ width: navWidth }}
          aria-label={navLabel}
          data-testid={dataTestId ? `${dataTestId}-desktop-nav` : undefined}
        >
          <Box p="4">
            <List className={SETTINGS_NAV_LIST_CLASSES}>
              {navigation.map((item) => {
                // Section headers
                if (item.isSection) {
                  return (
                    <ListItem
                      key={item.id}
                      className={SETTINGS_SECTION_HEADER_CLASSES}
                      aria-hidden={true}
                      data-testid={dataTestId ? `${dataTestId}-section-${item.id}` : undefined}
                    >
                      <Text as="span">{item.label}</Text>
                      {/* Screen reader gets full context */}
                      <VisuallyHidden>
                        {SR_SECTION_HEADER} {item.label}
                      </VisuallyHidden>
                    </ListItem>
                  );
                }

                // Navigation items
                const isActive = item.id === activeNavId;
                const clickableIndex = getNavItemIndex(clickableItems, item.id);

                return (
                  <ListItem key={item.id}>
                    <button
                      id={getNavItemId(id, item.id)}
                      type="button"
                      onClick={() => !item.disabled && handleNavChange(item.id, item.label)}
                      onKeyDown={(e) => handleDesktopKeyDown(e, clickableIndex)}
                      disabled={item.disabled}
                      className={cn(
                        SETTINGS_NAV_ITEM_BASE_CLASSES,
                        sizeClasses.navItemPadding,
                        isActive
                          ? SETTINGS_NAV_ITEM_ACTIVE_CLASSES
                          : SETTINGS_NAV_ITEM_INACTIVE_CLASSES,
                        item.disabled && SETTINGS_NAV_ITEM_DISABLED_CLASSES
                      )}
                      aria-current={isActive ? 'page' : undefined}
                      aria-disabled={item.disabled || undefined}
                      data-testid={dataTestId ? `${dataTestId}-nav-item-${item.id}` : undefined}
                      data-active={isActive}
                      data-disabled={item.disabled || undefined}
                    >
                      {item.icon && (
                        <Icon
                          icon={item.icon}
                          size="sm"
                          aria-hidden={true}
                          className={cn(
                            isActive
                              ? 'text-[rgb(var(--accent-foreground))]'
                              : 'text-[rgb(var(--muted-foreground))]'
                          )}
                        />
                      )}
                      <Text as="span">{item.label}</Text>
                      {/* Screen reader announcement for current page */}
                      {isActive && <VisuallyHidden>({SR_CURRENT_PAGE})</VisuallyHidden>}
                    </button>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Nav>

        {/* Settings Content Area */}
        <Main
          id={getTabPanelId(id)}
          role="tabpanel"
          aria-label={contentLabel}
          tabIndex={0}
          className={cn(SETTINGS_CONTENT_WRAPPER_CLASSES, contentClassName)}
          data-testid={dataTestId ? `${dataTestId}-content` : undefined}
        >
          {/* Header with title and description - responsive padding */}
          {(title || description) && (
            <HeaderPrimitive
              className={cn(SETTINGS_HEADER_CLASSES, sizeClasses.headerPadding)}
              data-testid={dataTestId ? `${dataTestId}-header` : undefined}
            >
              {title && (
                <Heading
                  level={1}
                  size={{ base: 'xl', md: '2xl' }}
                  className="text-[rgb(var(--foreground))]"
                >
                  {title}
                </Heading>
              )}
              {description && (
                <Text size="sm" color="muted-foreground" className="mt-1">
                  {description}
                </Text>
              )}
            </HeaderPrimitive>
          )}

          {/* Main content - responsive padding */}
          <Box
            className={sizeClasses.contentPadding}
            data-testid={dataTestId ? `${dataTestId}-main-content` : undefined}
          >
            {children}
          </Box>
        </Main>
      </Flex>
    );
  }
);

// ============================================================================
// Display Names
// ============================================================================

SettingsLayout.displayName = 'SettingsLayout';
