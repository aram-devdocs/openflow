/**
 * SkipLink Atom - Accessibility component for keyboard navigation bypass
 *
 * The SkipLink allows keyboard users to bypass navigation and skip directly
 * to main content. This follows WCAG 2.4.1 Bypass Blocks (Level A).
 *
 * Features:
 * - Visually hidden by default, visible only on focus
 * - High contrast visibility when focused (primary background)
 * - Links to #main-content by default (matches Main primitive)
 * - Proper focus ring for keyboard accessibility
 * - Touch target ≥44px when visible
 * - forwardRef support for ref forwarding
 * - data-testid support for automated testing
 *
 * @example
 * // In AppLayout, add as first focusable element:
 * <SkipLink />
 * // Then ensure main content has: id="main-content" tabIndex={-1}
 *
 * // Or use with Main primitive:
 * <>
 *   <SkipLink />
 *   <Header>...</Header>
 *   <Main>
 *     <h1>Page Title</h1>
 *   </Main>
 * </>
 */

import { DEFAULT_MAIN_ID, Link, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { forwardRef, useState } from 'react';

/**
 * SkipLink component props
 */
export interface SkipLinkProps {
  /** ID of the target element to skip to (defaults to "main-content") */
  targetId?: string;
  /** Link text content (defaults to "Skip to main content") */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/**
 * Default skip link text
 */
export const DEFAULT_SKIP_LINK_TEXT = 'Skip to main content';

/**
 * Base classes for skip link styling
 */
export const SKIP_LINK_BASE_CLASSES = [
  // Visually hidden by default using sr-only
  'sr-only',
  // Focus styles override sr-only to make visible
  'focus:not-sr-only',
  'focus:fixed',
  'focus:left-4',
  'focus:top-4',
  'focus:z-[100]',
  // Touch target ≥44px (WCAG 2.5.5)
  'focus:min-h-[44px]',
  'focus:min-w-[44px]',
  // High contrast styling
  'focus:rounded-md',
  'focus:bg-[rgb(var(--primary))]',
  'focus:px-4',
  'focus:py-3',
  'focus:text-[rgb(var(--primary-foreground))]',
  'focus:font-medium',
  // Focus ring for visibility on any background
  'focus:outline-none',
  'focus:ring-2',
  'focus:ring-[rgb(var(--ring))]',
  'focus:ring-offset-2',
  // Shadow for prominence
  'focus:shadow-lg',
  // Ensure it's inline-flex for proper sizing
  'focus:inline-flex',
  'focus:items-center',
  'focus:justify-center',
];

/**
 * Generates the full class string for the SkipLink
 */
export function getSkipLinkClasses(className?: string): string {
  return cn(...SKIP_LINK_BASE_CLASSES, className);
}

/**
 * SkipLink - Accessibility component for keyboard navigation bypass
 *
 * The SkipLink is an essential accessibility feature that allows keyboard users
 * to bypass repetitive navigation and jump directly to the main content.
 *
 * This satisfies WCAG 2.4.1 Bypass Blocks (Level A) requirement.
 *
 * @example
 * // Basic usage - links to #main-content by default
 * <SkipLink />
 *
 * // Custom target
 * <SkipLink targetId="content-area">Skip to content</SkipLink>
 *
 * // Multiple skip links for complex layouts
 * <SkipLink targetId="main-content">Skip to main content</SkipLink>
 * <SkipLink targetId="search">Skip to search</SkipLink>
 */
export const SkipLink = forwardRef<HTMLAnchorElement, SkipLinkProps>(function SkipLink(
  {
    targetId = DEFAULT_MAIN_ID,
    children = DEFAULT_SKIP_LINK_TEXT,
    className,
    'data-testid': dataTestId,
  },
  ref
) {
  // Track focus state for screen reader announcement
  const [isFocused, setIsFocused] = useState(false);

  return (
    <>
      <Link
        ref={ref}
        href={`#${targetId}`}
        className={getSkipLinkClasses(className)}
        data-testid={dataTestId}
        underline="none"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        {children}
      </Link>
      {/* Announce to screen readers when focused */}
      {isFocused && (
        <VisuallyHidden aria-live="polite" aria-atomic="true">
          Skip link focused. Press Enter to skip to main content.
        </VisuallyHidden>
      )}
    </>
  );
});

SkipLink.displayName = 'SkipLink';
