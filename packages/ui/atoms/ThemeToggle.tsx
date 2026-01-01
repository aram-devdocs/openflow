import { Box, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { Monitor, Moon, Sun } from 'lucide-react';
import { type HTMLAttributes, type KeyboardEvent, forwardRef, useCallback, useRef } from 'react';

/** Available theme options */
export type Theme = 'light' | 'dark' | 'system';

/** Size options for ThemeToggle */
export type ThemeToggleSize = 'sm' | 'md' | 'lg';

export interface ThemeToggleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Current theme value */
  theme: Theme;
  /** Callback when theme changes */
  onThemeChange: (theme: Theme) => void;
  /** Size of the toggle - supports responsive values. Default: 'md' */
  size?: ResponsiveValue<ThemeToggleSize>;
  /** Disabled state */
  disabled?: boolean;
  /** Data test id for testing */
  'data-testid'?: string;
}

/**
 * Theme option configuration
 */
const themeOptions: { value: Theme; label: string; description: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', description: 'Switch to light theme', icon: Sun },
  { value: 'dark', label: 'Dark', description: 'Switch to dark theme', icon: Moon },
  { value: 'system', label: 'System', description: 'Use system theme preference', icon: Monitor },
];

/**
 * Size to Tailwind classes mapping.
 * Touch targets: 44px minimum on touch devices for WCAG 2.5.5 compliance.
 */
const sizeClasses: Record<ThemeToggleSize, { container: string; button: string; icon: string }> = {
  sm: {
    container: 'gap-0.5 p-0.5',
    button: 'px-2 py-1.5 text-xs min-h-[44px] sm:min-h-8 min-w-[44px] sm:min-w-0',
    icon: 'h-3.5 w-3.5',
  },
  md: {
    container: 'gap-1 p-1',
    button: 'px-3 py-2 text-sm min-h-[44px] sm:min-h-9 min-w-[44px] sm:min-w-0',
    icon: 'h-4 w-4',
  },
  lg: {
    container: 'gap-1.5 p-1.5',
    button: 'px-4 py-2.5 text-base min-h-[44px] min-w-[44px]',
    icon: 'h-5 w-5',
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
export function getSizeClasses(size: ResponsiveValue<ThemeToggleSize>): {
  container: string[];
  button: string[];
  icon: string[];
} {
  const container: string[] = [];
  const button: string[] = [];
  const icon: string[] = [];

  if (typeof size === 'string') {
    const classes = sizeClasses[size];
    container.push(...classes.container.split(' '));
    button.push(...classes.button.split(' '));
    icon.push(...classes.icon.split(' '));
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, ThemeToggleSize>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const classes = sizeClasses[breakpointValue];
        if (breakpoint === 'base') {
          container.push(...classes.container.split(' '));
          button.push(...classes.button.split(' '));
          icon.push(...classes.icon.split(' '));
        } else {
          container.push(...classes.container.split(' ').map((c) => `${breakpoint}:${c}`));
          button.push(...classes.button.split(' ').map((c) => `${breakpoint}:${c}`));
          icon.push(...classes.icon.split(' ').map((c) => `${breakpoint}:${c}`));
        }
      }
    }
  }

  return { container, button, icon };
}

/**
 * Base classes for the container.
 * Exported for testing.
 */
export const THEME_TOGGLE_BASE_CLASSES =
  'flex rounded-lg bg-[rgb(var(--surface-1))] motion-safe:transition-colors';

/**
 * ThemeToggle component for selecting between light, dark, and system themes.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Built on @openflow/primitives for accessibility and responsiveness:
 * - Uses VisuallyHidden for screen reader announcements
 * - Touch target meets WCAG 2.5.5 (≥44px on touch devices)
 * - Focus ring visible on all backgrounds
 * - Full keyboard navigation (arrow keys within radiogroup)
 * - ARIA radiogroup pattern for accessibility
 *
 * Features:
 * - Three theme options (light, dark, system)
 * - ARIA radiogroup pattern for accessibility
 * - Arrow key navigation between options
 * - Responsive labels (icons only on mobile, labels on larger screens)
 * - Responsive sizing via ResponsiveValue
 * - forwardRef support
 *
 * @example
 * // Basic usage
 * const { theme, setTheme } = useTheme();
 * <ThemeToggle theme={theme} onThemeChange={setTheme} />
 *
 * @example
 * // Responsive sizing
 * <ThemeToggle
 *   theme={theme}
 *   onThemeChange={setTheme}
 *   size={{ base: 'sm', md: 'md', lg: 'lg' }}
 * />
 *
 * @example
 * // Disabled state
 * <ThemeToggle theme={theme} onThemeChange={setTheme} disabled />
 */
export const ThemeToggle = forwardRef<HTMLDivElement, ThemeToggleProps>(function ThemeToggle(
  {
    theme,
    onThemeChange,
    size = 'md',
    disabled = false,
    className,
    'data-testid': dataTestId,
    'aria-hidden': _ariaHidden,
    ...props
  },
  ref
) {
  // Create refs for each button for keyboard navigation
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Get responsive size classes
  const {
    container: containerClasses,
    button: buttonClasses,
    icon: iconClasses,
  } = getSizeClasses(size);

  // Handle keyboard navigation within radiogroup
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      const currentIndex = themeOptions.findIndex((opt) => opt.value === theme);
      let newIndex: number | undefined;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          newIndex = (currentIndex + 1) % themeOptions.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          newIndex = (currentIndex - 1 + themeOptions.length) % themeOptions.length;
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = themeOptions.length - 1;
          break;
        default:
          return;
      }

      // Update the theme and move focus
      const selectedOption = themeOptions[newIndex];
      if (selectedOption) {
        onThemeChange(selectedOption.value);
        buttonRefs.current[newIndex]?.focus();
      }
    },
    [disabled, theme, onThemeChange]
  );

  // Get the current theme label for screen reader announcement
  const currentThemeLabel = themeOptions.find((opt) => opt.value === theme)?.label ?? 'Unknown';

  // Exclude all ARIA Booleanish props that conflict with BoxProps strict boolean types
  const {
    'aria-busy': _ariaBusy,
    'aria-atomic': _ariaAtomic,
    'aria-expanded': _ariaExpanded,
    'aria-pressed': _ariaPressed,
    'aria-selected': _ariaSelected,
    'aria-checked': _ariaChecked,
    'aria-disabled': _ariaDisabled,
    'aria-required': _ariaRequired,
    'aria-invalid': _ariaInvalid,
    'aria-haspopup': _ariaHaspopup,
    'aria-current': _ariaCurrent,
    ...restProps
  } = props;

  return (
    <Box
      ref={ref}
      className={cn(
        THEME_TOGGLE_BASE_CLASSES,
        ...containerClasses,
        disabled && 'opacity-50',
        className
      )}
      role="radiogroup"
      aria-label="Theme selection"
      aria-disabled={disabled || undefined}
      onKeyDown={handleKeyDown}
      data-testid={dataTestId}
      {...restProps}
    >
      {/* Screen reader announcement for theme changes */}
      <VisuallyHidden>
        <Text as="span" role="status" aria-live="polite" aria-atomic="true">
          {`Current theme: ${currentThemeLabel}`}
        </Text>
      </VisuallyHidden>

      {themeOptions.map(({ value, label, description, icon: Icon }, index) => {
        const isSelected = theme === value;
        return (
          <button
            key={value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={description}
            tabIndex={isSelected ? 0 : -1}
            disabled={disabled}
            onClick={() => !disabled && onThemeChange(value)}
            className={cn(
              // Base styles
              'flex items-center justify-center gap-2 rounded-md',
              'motion-safe:transition-colors motion-safe:duration-150',
              // Focus ring with offset for visibility on all backgrounds
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
              // Size classes
              ...buttonClasses,
              // Selected state
              isSelected
                ? 'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm'
                : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]',
              // Disabled state
              disabled && 'cursor-not-allowed'
            )}
            data-state={isSelected ? 'selected' : 'unselected'}
            data-testid={dataTestId ? `${dataTestId}-${value}` : undefined}
          >
            <Icon className={cn(...iconClasses)} aria-hidden="true" />
            <Text as="span" className="sr-only sm:not-sr-only">
              {label}
            </Text>
          </button>
        );
      })}
    </Box>
  );
});

ThemeToggle.displayName = 'ThemeToggle';
