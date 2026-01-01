import { type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { Moon, Sun } from 'lucide-react';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

/** The actual theme being displayed (after resolving 'system') */
export type ResolvedTheme = 'light' | 'dark';

/** Size options for ThemeToggleCompact */
export type ThemeToggleCompactSize = 'sm' | 'md' | 'lg';

export interface ThemeToggleCompactProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'> {
  /** The resolved theme (light or dark, not system) */
  resolvedTheme: ResolvedTheme;
  /** Callback when toggle is clicked */
  onToggle: () => void;
  /** Size of the toggle - supports responsive values. Default: 'md' */
  size?: ResponsiveValue<ThemeToggleCompactSize>;
  /** Disabled state */
  disabled?: boolean;
  /** Custom aria-label for switching to light theme */
  lightLabel?: string;
  /** Custom aria-label for switching to dark theme */
  darkLabel?: string;
  /** Data test id for testing */
  'data-testid'?: string;
}

/**
 * Size to Tailwind classes mapping.
 * Touch targets: 44px minimum on touch devices for WCAG 2.5.5 compliance.
 */
const sizeClasses: Record<ThemeToggleCompactSize, { button: string; icon: string }> = {
  sm: {
    // 44px touch target on mobile, 36px on larger screens
    button: 'h-11 w-11 sm:h-9 sm:w-9',
    icon: 'h-4 w-4',
  },
  md: {
    // 44px touch target on all sizes
    button: 'h-11 w-11',
    icon: 'h-5 w-5',
  },
  lg: {
    // 48px touch target
    button: 'h-12 w-12',
    icon: 'h-6 w-6',
  },
};

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
type Breakpoint = (typeof BREAKPOINT_ORDER)[number];

/**
 * Get size classes for the given size prop.
 * Exported for testing.
 */
export function getSizeClasses(size: ResponsiveValue<ThemeToggleCompactSize>): {
  button: string[];
  icon: string[];
} {
  const button: string[] = [];
  const icon: string[] = [];

  if (typeof size === 'string') {
    const classes = sizeClasses[size];
    button.push(...classes.button.split(' '));
    icon.push(...classes.icon.split(' '));
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, ThemeToggleCompactSize>>)[
        breakpoint
      ];
      if (breakpointValue !== undefined) {
        const classes = sizeClasses[breakpointValue];
        if (breakpoint === 'base') {
          button.push(...classes.button.split(' '));
          icon.push(...classes.icon.split(' '));
        } else {
          button.push(...classes.button.split(' ').map((c) => `${breakpoint}:${c}`));
          icon.push(...classes.icon.split(' ').map((c) => `${breakpoint}:${c}`));
        }
      }
    }
  }

  return { button, icon };
}

/**
 * Base classes for the button.
 * Exported for testing.
 */
export const THEME_TOGGLE_COMPACT_BASE_CLASSES =
  'flex items-center justify-center rounded-md text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-1))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))] motion-safe:transition-colors';

/**
 * Default label for switching to light theme.
 * Exported for testing.
 */
export const DEFAULT_LIGHT_LABEL = 'Switch to light theme';

/**
 * Default label for switching to dark theme.
 * Exported for testing.
 */
export const DEFAULT_DARK_LABEL = 'Switch to dark theme';

/**
 * Compact theme toggle button for quick access in headers and sidebars.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Shows the opposite theme icon (sun when dark, moon when light) to indicate
 * what clicking will switch to.
 *
 * Built on @openflow/primitives for accessibility and responsiveness:
 * - Uses VisuallyHidden for screen reader announcements
 * - Touch target meets WCAG 2.5.5 (≥44px on touch devices)
 * - Focus ring visible on all backgrounds
 * - Accessible with proper ARIA label
 * - forwardRef support
 *
 * Features:
 * - Single button toggle between light and dark
 * - Accessible with proper ARIA label
 * - Responsive sizing via ResponsiveValue
 * - 44px+ touch target (WCAG 2.5.5/2.5.8)
 * - Focus-visible ring for keyboard navigation
 * - Disabled state support
 *
 * @example
 * // Basic usage
 * const { resolvedTheme, setTheme } = useTheme();
 * const handleToggle = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
 * <ThemeToggleCompact resolvedTheme={resolvedTheme} onToggle={handleToggle} />
 *
 * @example
 * // Responsive sizing
 * <ThemeToggleCompact
 *   resolvedTheme={resolvedTheme}
 *   onToggle={handleToggle}
 *   size={{ base: 'sm', md: 'md', lg: 'lg' }}
 * />
 *
 * @example
 * // Disabled state
 * <ThemeToggleCompact resolvedTheme={resolvedTheme} onToggle={handleToggle} disabled />
 */
export const ThemeToggleCompact = forwardRef<HTMLButtonElement, ThemeToggleCompactProps>(
  function ThemeToggleCompact(
    {
      resolvedTheme,
      onToggle,
      size = 'md',
      disabled = false,
      lightLabel = DEFAULT_LIGHT_LABEL,
      darkLabel = DEFAULT_DARK_LABEL,
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) {
    // Determine the target theme (what clicking will switch to)
    const targetTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    const ariaLabel = targetTheme === 'light' ? lightLabel : darkLabel;

    // Get responsive size classes
    const { button: buttonClasses, icon: iconClasses } = getSizeClasses(size);

    return (
      <button
        ref={ref}
        type="button"
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        className={cn(
          THEME_TOGGLE_COMPACT_BASE_CLASSES,
          ...buttonClasses,
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        data-state={resolvedTheme}
        data-testid={dataTestId}
        {...props}
      >
        {/* Screen reader announcement for state changes */}
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite" aria-atomic="true">
            {`Current theme: ${resolvedTheme}`}
          </Text>
        </VisuallyHidden>

        {resolvedTheme === 'dark' ? (
          <Sun className={cn(...iconClasses)} aria-hidden="true" focusable="false" />
        ) : (
          <Moon className={cn(...iconClasses)} aria-hidden="true" focusable="false" />
        )}
      </button>
    );
  }
);

ThemeToggleCompact.displayName = 'ThemeToggleCompact';
