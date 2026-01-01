import { type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { Menu, X } from 'lucide-react';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

export type HamburgerButtonSize = 'sm' | 'md' | 'lg';

export interface HamburgerButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'> {
  /** Whether the menu is currently open (for aria-expanded and icon) */
  isOpen?: boolean;
  /** Size of the button - supports responsive values. Default: 'md' */
  size?: ResponsiveValue<HamburgerButtonSize>;
  /** Accessible label for the button when closed. Default: 'Open navigation menu' */
  openLabel?: string;
  /** Accessible label for the button when open. Default: 'Close navigation menu' */
  closeLabel?: string;
  /** ID of the controlled navigation element (for aria-controls) */
  controlsId?: string;
  /** Data test id for testing */
  'data-testid'?: string;
}

/**
 * Size to Tailwind classes mapping.
 * Touch targets: 44px minimum on touch devices for WCAG 2.5.5 compliance.
 */
const sizeClasses: Record<HamburgerButtonSize, { button: string; icon: string }> = {
  sm: {
    button: 'min-h-[44px] min-w-[44px] sm:h-9 sm:w-9 sm:min-h-0 sm:min-w-0',
    icon: 'h-5 w-5',
  },
  md: {
    button: 'min-h-[44px] min-w-[44px] sm:h-11 sm:w-11 sm:min-h-0 sm:min-w-0',
    icon: 'h-6 w-6',
  },
  lg: {
    button: 'min-h-[44px] min-w-[44px]',
    icon: 'h-7 w-7',
  },
};

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
type Breakpoint = (typeof BREAKPOINT_ORDER)[number];

/**
 * Get size classes for the given size prop
 */
export function getSizeClasses(size: ResponsiveValue<HamburgerButtonSize>): {
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
      const breakpointValue = (size as Partial<Record<Breakpoint, HamburgerButtonSize>>)[
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
 * HamburgerButton is a mobile navigation toggle button.
 * Stateless - receives state via props, emits click events via callback.
 *
 * Built on @openflow/primitives for accessibility and responsiveness:
 * - Uses VisuallyHidden for screen reader state announcements
 * - Touch target meets WCAG 2.5.5 (≥44px on touch devices)
 * - Focus ring visible on all backgrounds
 * - aria-label changes based on open/close state
 * - aria-expanded reflects current state
 * - Icon changes from Menu to X when open
 *
 * Features:
 * - Only visible on mobile by default (md:hidden)
 * - Accessible with proper ARIA attributes
 * - 44x44px minimum touch target on mobile
 * - Consistent focus ring styling
 * - Responsive sizing
 * - forwardRef support
 *
 * @example
 * // Basic usage
 * <HamburgerButton
 *   onClick={() => setDrawerOpen(!isOpen)}
 *   isOpen={isDrawerOpen}
 * />
 *
 * @example
 * // With custom labels
 * <HamburgerButton
 *   onClick={() => setNavOpen(!isOpen)}
 *   isOpen={isNavOpen}
 *   openLabel="Open sidebar"
 *   closeLabel="Close sidebar"
 *   controlsId="sidebar-nav"
 * />
 *
 * @example
 * // Responsive sizing
 * <HamburgerButton
 *   onClick={handleToggle}
 *   isOpen={isOpen}
 *   size={{ base: 'sm', lg: 'md' }}
 * />
 */
export const HamburgerButton = forwardRef<HTMLButtonElement, HamburgerButtonProps>(
  function HamburgerButton(
    {
      isOpen = false,
      size = 'md',
      openLabel = 'Open navigation menu',
      closeLabel = 'Close navigation menu',
      controlsId = 'mobile-nav',
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) {
    // Get responsive size classes
    const { button: buttonClasses, icon: iconClasses } = getSizeClasses(size);

    // Current aria-label based on state
    const currentLabel = isOpen ? closeLabel : openLabel;

    // Choose icon based on state
    const Icon = isOpen ? X : Menu;

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          // Base layout
          'inline-flex items-center justify-center rounded-md',
          // Colors
          'text-[rgb(var(--muted-foreground))]',
          'hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-1))]',
          // Focus styles with ring-offset for visibility on all backgrounds
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
          // Transitions
          'motion-safe:transition-colors motion-safe:duration-150',
          // Only visible on mobile by default
          'md:hidden',
          // Size classes
          ...buttonClasses,
          className
        )}
        aria-label={currentLabel}
        aria-expanded={isOpen}
        aria-controls={controlsId}
        data-testid={dataTestId}
        data-state={isOpen ? 'open' : 'closed'}
        {...props}
      >
        {/* Screen reader announcement of state */}
        <VisuallyHidden>
          <Text as="span" aria-live="polite">
            {isOpen ? 'Menu open' : 'Menu closed'}
          </Text>
        </VisuallyHidden>
        <Icon className={cn(...iconClasses)} aria-hidden={true} />
      </button>
    );
  }
);

HamburgerButton.displayName = 'HamburgerButton';
