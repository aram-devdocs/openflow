/**
 * VisuallyHidden Primitive - Screen-reader-only content wrapper
 *
 * Hides content visually while keeping it accessible to screen readers.
 * Uses the CSS clip technique which is the most reliable method for
 * hiding content from sighted users while maintaining accessibility.
 *
 * Use cases:
 * - Skip links that should only be visible on focus
 * - Additional context for screen reader users
 * - Form field descriptions that are visually implied
 * - Icon-only button labels
 *
 * @example
 * // Hide text for screen readers only
 * <VisuallyHidden>Skip to main content</VisuallyHidden>
 *
 * // Icon button with accessible label
 * <button>
 *   <SearchIcon aria-hidden="true" />
 *   <VisuallyHidden>Search</VisuallyHidden>
 * </button>
 *
 * // Focusable skip link
 * <VisuallyHidden focusable>
 *   <a href="#main">Skip to main content</a>
 * </VisuallyHidden>
 */

import { cn } from '@openflow/utils';
import { type CSSProperties, type ReactNode, forwardRef } from 'react';

/**
 * Props for the VisuallyHidden component
 */
export interface VisuallyHiddenProps {
  /** Hidden content - visible only to screen readers */
  children: ReactNode;
  /**
   * When true, the content becomes visible when focused.
   * Use for skip links and other focusable elements that should
   * be visible during keyboard navigation.
   * @default false
   */
  focusable?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Inline styles (use sparingly) */
  style?: CSSProperties;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/**
 * CSS styles for visually hidden content.
 * This technique:
 * - Removes element from visual flow (position: absolute)
 * - Makes it invisible (clip: rect(0,0,0,0))
 * - Makes it take no space (width/height: 1px, margin: -1px)
 * - Prevents text wrapping (white-space: nowrap)
 *
 * This is preferred over display:none or visibility:hidden
 * because those also hide content from screen readers.
 */
const visuallyHiddenStyles: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0',
};

/**
 * CSS class for visually hidden content using Tailwind's sr-only
 * Falls back to inline styles if the class is not available
 */
const VISUALLY_HIDDEN_CLASS = 'sr-only';

/**
 * VisuallyHidden - Hide content visually while keeping it accessible
 *
 * This component renders content that is:
 * - Hidden from sighted users
 * - Visible to screen reader users
 * - Optionally visible when focused (for skip links)
 *
 * @example
 * // Basic usage - hidden from view, announced by screen readers
 * <VisuallyHidden>
 *   This text is only for screen readers
 * </VisuallyHidden>
 *
 * @example
 * // Icon button with accessible name
 * <button type="button" aria-label="Close dialog">
 *   <CloseIcon aria-hidden="true" />
 *   <VisuallyHidden>Close dialog</VisuallyHidden>
 * </button>
 *
 * @example
 * // Skip link that appears on focus
 * <VisuallyHidden focusable>
 *   <a href="#main-content">Skip to main content</a>
 * </VisuallyHidden>
 *
 * @example
 * // Additional context for form fields
 * <label>
 *   Email
 *   <VisuallyHidden> (required)</VisuallyHidden>
 * </label>
 */
export const VisuallyHidden = forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  function VisuallyHidden(
    { children, focusable = false, className, style, 'data-testid': dataTestId },
    ref
  ) {
    // When focusable, use focus-within to show content when child is focused
    const baseClass = focusable
      ? cn(
          VISUALLY_HIDDEN_CLASS,
          // On focus-within, undo the sr-only hiding
          'focus-within:not-sr-only',
          'focus-within:static',
          'focus-within:w-auto',
          'focus-within:h-auto',
          'focus-within:p-0',
          'focus-within:m-0',
          'focus-within:overflow-visible',
          'focus-within:clip-auto',
          'focus-within:whitespace-normal'
        )
      : VISUALLY_HIDDEN_CLASS;

    return (
      <span ref={ref} className={cn(baseClass, className)} style={style} data-testid={dataTestId}>
        {children}
      </span>
    );
  }
);

VisuallyHidden.displayName = 'VisuallyHidden';

/**
 * Utility styles object for components that need to apply
 * visually hidden styles programmatically
 */
export const visuallyHiddenStyleObject = visuallyHiddenStyles;

/**
 * Tailwind class string for visually hidden content
 * Can be used when you can't use the component
 */
export const visuallyHiddenClassName = VISUALLY_HIDDEN_CLASS;
