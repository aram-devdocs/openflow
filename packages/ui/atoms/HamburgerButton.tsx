import { cn } from '@openflow/utils';
import { Menu } from 'lucide-react';

export interface HamburgerButtonProps {
  /** Callback when the button is clicked */
  onClick: () => void;
  /** Whether the menu is currently open (for aria-expanded) */
  isOpen?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the button */
  ariaLabel?: string;
}

/**
 * HamburgerButton is a mobile navigation toggle button.
 * Stateless - receives state via props, emits click events via callback.
 *
 * Features:
 * - Only visible on mobile (md:hidden)
 * - Accessible with proper ARIA attributes
 * - 44x44px minimum touch target
 * - Consistent focus ring styling
 *
 * @example
 * <HamburgerButton
 *   onClick={() => setDrawerOpen(true)}
 *   isOpen={isDrawerOpen}
 * />
 */
export function HamburgerButton({
  onClick,
  isOpen = false,
  className,
  ariaLabel = 'Open navigation menu',
}: HamburgerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Size: 44x44px minimum touch target
        'flex h-11 w-11 items-center justify-center rounded-md',
        // Colors
        'text-[rgb(var(--muted-foreground))]',
        'hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-1))]',
        // Focus styles
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
        // Only visible on mobile
        'md:hidden',
        className
      )}
      aria-label={isOpen ? 'Close navigation menu' : ariaLabel}
      aria-expanded={isOpen}
      aria-controls="mobile-nav"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}

HamburgerButton.displayName = 'HamburgerButton';
