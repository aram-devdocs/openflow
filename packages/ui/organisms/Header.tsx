import {
  Box,
  Heading,
  Paragraph,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { Menu, MessageSquarePlus, Search, TerminalSquare, X } from 'lucide-react';
import { type HTMLAttributes, forwardRef, useCallback, useId, useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { ThemeToggleCompact } from '../atoms/ThemeToggleCompact';
import type { ResolvedTheme } from '../atoms/ThemeToggleCompact';

// ============================================================================
// Types
// ============================================================================

export type HeaderSize = 'sm' | 'md' | 'lg';
export type HeaderBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface HeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'role'> {
  /** Callback when the search button is clicked (opens CommandPalette) */
  onSearch?: () => void;
  /** Callback when the new chat button is clicked */
  onNewChat?: () => void;
  /** Callback when the new terminal button is clicked */
  onNewTerminal?: () => void;
  /** Callback when the hamburger menu button is clicked (mobile navigation) */
  onMenuToggle?: () => void;
  /** Callback when the title/logo is clicked (navigation to home) */
  onTitleClick?: () => void;
  /** Whether the mobile menu is open */
  isMenuOpen?: boolean;
  /** Optional title to display in the header */
  title?: string;
  /** Optional subtitle to display below the title */
  subtitle?: string;
  /** Whether the search feature is available */
  searchEnabled?: boolean;
  /** Whether the new chat feature is available */
  newChatEnabled?: boolean;
  /** Whether the new terminal feature is available */
  newTerminalEnabled?: boolean;
  /** Whether to show the hamburger menu button (for mobile navigation) */
  showMenuButton?: boolean;
  /** Current resolved theme for theme toggle */
  resolvedTheme?: ResolvedTheme;
  /** Callback when theme toggle is clicked */
  onThemeToggle?: () => void;
  /** Responsive size - affects padding and button sizes */
  size?: ResponsiveValue<HeaderSize>;
  /** Accessible label for the header region */
  'aria-label'?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: readonly HeaderBreakpoint[] = [
  'base',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
] as const;

/**
 * Default accessible label for the header banner landmark
 */
export const DEFAULT_HEADER_LABEL = 'Application header';

/**
 * Default label when no title is provided
 */
export const DEFAULT_APP_NAME = 'OpenFlow';

/**
 * Default label for search button
 */
export const DEFAULT_SEARCH_LABEL = 'Search (Cmd+K)';

/**
 * Default label for new chat button
 */
export const DEFAULT_NEW_CHAT_LABEL = 'New Chat';

/**
 * Default label for new terminal button
 */
export const DEFAULT_NEW_TERMINAL_LABEL = 'New Terminal';

/**
 * Default label for opening the menu
 */
export const DEFAULT_OPEN_MENU_LABEL = 'Open navigation menu';

/**
 * Default label for closing the menu
 */
export const DEFAULT_CLOSE_MENU_LABEL = 'Close navigation menu';

/**
 * Screen reader announcement for menu state changes
 */
export const SR_MENU_OPENED = 'Navigation menu opened';
export const SR_MENU_CLOSED = 'Navigation menu closed';

/**
 * Keyboard shortcut hint text
 */
export const KEYBOARD_SHORTCUT_TEXT = '⌘K';

/**
 * Base header classes (always applied)
 */
export const HEADER_BASE_CLASSES = [
  'flex h-full items-center justify-between',
  'border-b border-[rgb(var(--border))]',
  'bg-[rgb(var(--background))]',
].join(' ');

/**
 * Header padding classes by size
 */
export const HEADER_PADDING_CLASSES: Record<HeaderSize, string> = {
  sm: 'px-3',
  md: 'px-4',
  lg: 'px-6',
};

/**
 * Title text size classes by size
 */
export const HEADER_TITLE_SIZE_CLASSES: Record<HeaderSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

/**
 * Subtitle text size classes by size
 */
export const HEADER_SUBTITLE_SIZE_CLASSES: Record<HeaderSize, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

/**
 * Button gap classes by size
 */
export const HEADER_BUTTON_GAP_CLASSES: Record<HeaderSize, string> = {
  sm: 'gap-1',
  md: 'gap-2',
  lg: 'gap-3',
};

/**
 * Icon size map by header size
 */
export const HEADER_ICON_SIZE_MAP: Record<HeaderSize, 'xs' | 'sm' | 'md'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
};

/**
 * Button size map by header size
 */
export const HEADER_BUTTON_SIZE_MAP: Record<HeaderSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

/**
 * Title container classes (left section)
 */
export const HEADER_TITLE_CONTAINER_CLASSES = 'flex flex-col justify-center min-w-0';

/**
 * Title text classes
 */
export const HEADER_TITLE_CLASSES = 'font-semibold text-[rgb(var(--foreground))] truncate';

/**
 * Subtitle text classes
 */
export const HEADER_SUBTITLE_CLASSES = 'text-[rgb(var(--muted-foreground))] truncate';

/**
 * Actions container classes (right section)
 */
export const HEADER_ACTIONS_CONTAINER_CLASSES = 'flex items-center flex-shrink-0';

/**
 * Keyboard shortcut badge classes
 */
export const HEADER_KBD_CLASSES = [
  'pointer-events-none hidden select-none items-center gap-1',
  'rounded border border-[rgb(var(--border))] bg-[rgb(var(--muted))]',
  'px-1.5 py-0.5 text-[10px] font-medium text-[rgb(var(--muted-foreground))]',
  'sm:flex',
].join(' ');

/**
 * Menu button container classes (for hamburger menu)
 */
export const HEADER_MENU_BUTTON_CONTAINER_CLASSES = 'md:hidden';

/**
 * Desktop navigation classes (hidden on mobile)
 */
export const HEADER_DESKTOP_NAV_CLASSES = 'hidden md:flex items-center';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<HeaderSize> | undefined): HeaderSize {
  if (size === undefined) {
    return 'md';
  }

  if (typeof size === 'string') {
    return size;
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<Record<HeaderBreakpoint, HeaderSize>>;
    if (sizeObj.base) return sizeObj.base;
    for (const bp of BREAKPOINT_ORDER) {
      if (sizeObj[bp]) return sizeObj[bp] as HeaderSize;
    }
  }

  return 'md';
}

/**
 * Generate responsive size classes
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<HeaderSize> | undefined,
  classMap: Record<HeaderSize, string>
): string {
  if (size === undefined) {
    return classMap.md;
  }

  if (typeof size === 'string') {
    return classMap[size];
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<Record<HeaderBreakpoint, HeaderSize>>;
    const classes: string[] = [];

    for (const breakpoint of BREAKPOINT_ORDER) {
      const sizeValue = sizeObj[breakpoint];
      if (sizeValue !== undefined) {
        const sizeClass = classMap[sizeValue];
        if (breakpoint === 'base') {
          classes.push(sizeClass);
        } else {
          // Add responsive prefix
          classes.push(`${breakpoint}:${sizeClass}`);
        }
      }
    }

    return classes.join(' ');
  }

  return classMap.md;
}

/**
 * Build accessible header label for screen readers
 */
export function buildHeaderAccessibleLabel(title?: string, subtitle?: string): string {
  const parts: string[] = [];

  if (title) {
    parts.push(title);
  } else {
    parts.push(DEFAULT_APP_NAME);
  }

  if (subtitle) {
    parts.push(subtitle);
  }

  return parts.join(', ');
}

/**
 * Get menu button accessible label based on state
 */
export function getMenuButtonLabel(isOpen: boolean): string {
  return isOpen ? DEFAULT_CLOSE_MENU_LABEL : DEFAULT_OPEN_MENU_LABEL;
}

/**
 * Get menu state announcement for screen reader
 */
export function getMenuStateAnnouncement(isOpen: boolean): string {
  return isOpen ? SR_MENU_OPENED : SR_MENU_CLOSED;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Header component for top navigation with role="banner" landmark.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - role="banner" landmark for accessibility
 * - Responsive sizing with mobile hamburger menu
 * - Search button that opens the CommandPalette (Cmd+K)
 * - New chat button for quick chat creation
 * - New terminal button for opening a terminal session
 * - Optional title and subtitle display
 * - Quick theme toggle
 * - Screen reader announcements for menu state
 * - Touch targets ≥44px (WCAG 2.5.5)
 *
 * @example
 * <Header
 *   title="My Project"
 *   subtitle="3 tasks in progress"
 *   onSearch={() => setCommandPaletteOpen(true)}
 *   onNewChat={() => createNewChat()}
 *   onNewTerminal={() => openTerminal()}
 *   onMenuToggle={() => setMenuOpen(!menuOpen)}
 *   isMenuOpen={menuOpen}
 *   resolvedTheme="dark"
 *   onThemeToggle={() => toggleTheme()}
 * />
 */
export const Header = forwardRef<HTMLElement, HeaderProps>(function Header(
  {
    onSearch,
    onNewChat,
    onNewTerminal,
    onMenuToggle,
    onTitleClick,
    isMenuOpen = false,
    title,
    subtitle,
    searchEnabled = true,
    newChatEnabled = true,
    newTerminalEnabled = true,
    showMenuButton = true,
    resolvedTheme,
    onThemeToggle,
    size,
    'aria-label': ariaLabel,
    'data-testid': testId,
    className,
    ...props
  },
  ref
) {
  const titleId = useId();
  const baseSize = getBaseSize(size);

  // Track menu state for announcements
  const [prevMenuOpen, setPrevMenuOpen] = useState(isMenuOpen);
  const [announcement, setAnnouncement] = useState<string | null>(null);

  // Announce menu state changes
  if (isMenuOpen !== prevMenuOpen) {
    setPrevMenuOpen(isMenuOpen);
    setAnnouncement(getMenuStateAnnouncement(isMenuOpen));
    // Clear announcement after it's read
    setTimeout(() => setAnnouncement(null), 1000);
  }

  // Handle menu toggle with keyboard support
  const handleMenuToggle = useCallback(() => {
    onMenuToggle?.();
  }, [onMenuToggle]);

  // Build classes
  const paddingClasses = getResponsiveSizeClasses(size, HEADER_PADDING_CLASSES);
  const titleSizeClasses = getResponsiveSizeClasses(size, HEADER_TITLE_SIZE_CLASSES);
  const subtitleSizeClasses = getResponsiveSizeClasses(size, HEADER_SUBTITLE_SIZE_CLASSES);
  const buttonGapClasses = getResponsiveSizeClasses(size, HEADER_BUTTON_GAP_CLASSES);
  const iconSize = HEADER_ICON_SIZE_MAP[baseSize];
  const buttonSize = HEADER_BUTTON_SIZE_MAP[baseSize];

  // Determine effective aria-label
  const effectiveAriaLabel = ariaLabel || DEFAULT_HEADER_LABEL;

  return (
    <Box
      as="header"
      ref={ref}
      role="banner"
      aria-label={effectiveAriaLabel}
      aria-labelledby={title ? titleId : undefined}
      className={cn(HEADER_BASE_CLASSES, paddingClasses, className)}
      data-testid={testId}
      data-size={baseSize}
      data-menu-open={isMenuOpen}
      {...props}
    >
      {/* Screen reader announcement for menu state changes */}
      {announcement && (
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite" aria-atomic="true">
            {announcement}
          </Text>
        </VisuallyHidden>
      )}

      {/* Left section: Title and subtitle */}
      {onTitleClick ? (
        <Box
          as="button"
          type="button"
          onClick={onTitleClick}
          className={cn(
            HEADER_TITLE_CONTAINER_CLASSES,
            'cursor-pointer rounded-md px-2 py-1 -ml-2',
            'hover:bg-[rgb(var(--accent))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2',
            'transition-colors duration-150'
          )}
          aria-label="Go to dashboard"
          data-testid={testId ? `${testId}-title-button` : undefined}
        >
          {title ? (
            <Heading
              level={1}
              id={titleId}
              className={cn(HEADER_TITLE_CLASSES, titleSizeClasses)}
              data-testid={testId ? `${testId}-title` : undefined}
            >
              {title}
            </Heading>
          ) : null}
          {subtitle ? (
            <Paragraph
              className={cn(HEADER_SUBTITLE_CLASSES, subtitleSizeClasses)}
              data-testid={testId ? `${testId}-subtitle` : undefined}
            >
              {subtitle}
            </Paragraph>
          ) : null}
          {!title && !subtitle && (
            <Text
              as="span"
              className={cn('font-medium text-[rgb(var(--foreground))]', titleSizeClasses)}
              data-testid={testId ? `${testId}-app-name` : undefined}
            >
              {DEFAULT_APP_NAME}
            </Text>
          )}
        </Box>
      ) : (
        <Box className={HEADER_TITLE_CONTAINER_CLASSES}>
          {title ? (
            <Heading
              level={1}
              id={titleId}
              className={cn(HEADER_TITLE_CLASSES, titleSizeClasses)}
              data-testid={testId ? `${testId}-title` : undefined}
            >
              {title}
            </Heading>
          ) : null}
          {subtitle ? (
            <Paragraph
              className={cn(HEADER_SUBTITLE_CLASSES, subtitleSizeClasses)}
              data-testid={testId ? `${testId}-subtitle` : undefined}
            >
              {subtitle}
            </Paragraph>
          ) : null}
          {!title && !subtitle && (
            <Text
              as="span"
              className={cn('font-medium text-[rgb(var(--foreground))]', titleSizeClasses)}
              data-testid={testId ? `${testId}-app-name` : undefined}
            >
              {DEFAULT_APP_NAME}
            </Text>
          )}
        </Box>
      )}

      {/* Right section: Action buttons */}
      <Box className={cn(HEADER_ACTIONS_CONTAINER_CLASSES, buttonGapClasses)}>
        {/* Mobile hamburger menu button */}
        {showMenuButton && onMenuToggle && (
          <Box className={HEADER_MENU_BUTTON_CONTAINER_CLASSES}>
            <Button
              variant="ghost"
              size={buttonSize}
              onClick={handleMenuToggle}
              aria-label={getMenuButtonLabel(isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              data-testid={testId ? `${testId}-menu-button` : undefined}
              data-state={isMenuOpen ? 'open' : 'closed'}
              className="min-h-[44px] min-w-[44px]"
            >
              <Icon icon={isMenuOpen ? X : Menu} size={iconSize} aria-hidden={true} />
            </Button>
          </Box>
        )}

        {/* Desktop navigation actions */}
        <Box
          as="nav"
          aria-label="Quick actions"
          className={cn(HEADER_DESKTOP_NAV_CLASSES, buttonGapClasses)}
          data-testid={testId ? `${testId}-nav` : undefined}
        >
          {/* Search button */}
          {searchEnabled && (
            <Button
              variant="ghost"
              size={buttonSize}
              onClick={onSearch}
              className="gap-2"
              aria-label={DEFAULT_SEARCH_LABEL}
              data-testid={testId ? `${testId}-search-button` : undefined}
            >
              <Icon icon={Search} size={iconSize} aria-hidden={true} />
              <Text as="span" className="hidden sm:inline">
                Search
              </Text>
              <Box as="kbd" className={HEADER_KBD_CLASSES} aria-hidden={true}>
                <Text as="span" className="text-xs">
                  {KEYBOARD_SHORTCUT_TEXT.charAt(0)}
                </Text>
                {KEYBOARD_SHORTCUT_TEXT.slice(1)}
              </Box>
              <VisuallyHidden>, keyboard shortcut Command K</VisuallyHidden>
            </Button>
          )}

          {/* New chat button */}
          {newChatEnabled && (
            <Button
              variant="ghost"
              size={buttonSize}
              onClick={onNewChat}
              aria-label={DEFAULT_NEW_CHAT_LABEL}
              data-testid={testId ? `${testId}-new-chat-button` : undefined}
            >
              <Icon icon={MessageSquarePlus} size={iconSize} aria-hidden={true} />
              <Text as="span" className="hidden sm:inline">
                New Chat
              </Text>
            </Button>
          )}

          {/* New terminal button */}
          {newTerminalEnabled && (
            <Button
              variant="ghost"
              size={buttonSize}
              onClick={onNewTerminal}
              aria-label={DEFAULT_NEW_TERMINAL_LABEL}
              data-testid={testId ? `${testId}-new-terminal-button` : undefined}
            >
              <Icon icon={TerminalSquare} size={iconSize} aria-hidden={true} />
              <Text as="span" className="hidden sm:inline">
                Terminal
              </Text>
            </Button>
          )}
        </Box>

        {/* Theme toggle - always visible */}
        {resolvedTheme && onThemeToggle && (
          <ThemeToggleCompact
            resolvedTheme={resolvedTheme}
            onToggle={onThemeToggle}
            size={buttonSize}
            data-testid={testId ? `${testId}-theme-toggle` : undefined}
          />
        )}
      </Box>
    </Box>
  );
});

Header.displayName = 'Header';
