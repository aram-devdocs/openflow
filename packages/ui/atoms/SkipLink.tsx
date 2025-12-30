import { cn } from '@openflow/utils';

export interface SkipLinkProps {
  /** ID of the target element to skip to */
  targetId?: string;
  /** Link text content */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SkipLink is an accessibility component that allows keyboard users
 * to bypass navigation and skip directly to main content.
 *
 * The link is visually hidden until focused, then appears prominently
 * in the top-left corner. This follows WCAG 2.1 bypass blocks guidelines.
 *
 * @example
 * // In AppLayout, add as first focusable element:
 * <SkipLink />
 * // Then ensure main content has: id="main-content" tabIndex={-1}
 */
export function SkipLink({
  targetId = 'main-content',
  children = 'Skip to main content',
  className,
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        // Visually hidden by default
        'sr-only',
        // Visible when focused
        'focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]',
        'focus:rounded-md focus:bg-[rgb(var(--primary))] focus:px-4 focus:py-2',
        'focus:text-[rgb(var(--primary-foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]',
        'focus:shadow-lg',
        className
      )}
    >
      {children}
    </a>
  );
}

SkipLink.displayName = 'SkipLink';
