/**
 * Footer Primitive - Semantic `<footer>` landmark for closing content
 *
 * The footer element represents a footer for its nearest ancestor sectioning
 * content or sectioning root element. A footer typically contains information
 * about the author, copyright data, links to related documents, or other
 * closing content.
 *
 * A `<footer>` element within `<body>` becomes a contentinfo landmark
 * (role="contentinfo"). A `<footer>` within `<article>`, `<aside>`, `<main>`,
 * `<nav>`, or `<section>` is not a contentinfo landmark and is just structural.
 *
 * @example
 * // Site footer with copyright and links
 * <Footer p={{ base: '4', md: '8' }}>
 *   <nav aria-label="Footer navigation">
 *     <a href="/privacy">Privacy</a>
 *     <a href="/terms">Terms</a>
 *   </nav>
 *   <p>&copy; 2025 Company Name</p>
 * </Footer>
 *
 * // Article footer
 * <article>
 *   <h1>Article Title</h1>
 *   <p>Article content...</p>
 *   <Footer mt="4">
 *     <p>Written by Jane Developer</p>
 *     <p>Published on January 1, 2025</p>
 *   </Footer>
 * </article>
 *
 * // Footer with social links and newsletter signup
 * <Footer py={{ base: '8', md: '12' }} className="bg-gray-900 text-white">
 *   <div>Newsletter signup form...</div>
 *   <nav aria-label="Social links">...</nav>
 *   <p>&copy; 2025 Company Name</p>
 * </Footer>
 */

import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import type { A11yProps, Breakpoint, ResponsiveValue, SpacingValue } from './types';

/**
 * Spacing props for Footer component
 */
export interface FooterSpacingProps {
  /** Padding on all sides */
  p?: ResponsiveValue<SpacingValue>;
  /** Padding horizontal (left and right) */
  px?: ResponsiveValue<SpacingValue>;
  /** Padding vertical (top and bottom) */
  py?: ResponsiveValue<SpacingValue>;
  /** Padding top */
  pt?: ResponsiveValue<SpacingValue>;
  /** Padding right */
  pr?: ResponsiveValue<SpacingValue>;
  /** Padding bottom */
  pb?: ResponsiveValue<SpacingValue>;
  /** Padding left */
  pl?: ResponsiveValue<SpacingValue>;
  /** Margin on all sides */
  m?: ResponsiveValue<SpacingValue>;
  /** Margin horizontal (left and right) */
  mx?: ResponsiveValue<SpacingValue>;
  /** Margin vertical (top and bottom) */
  my?: ResponsiveValue<SpacingValue>;
  /** Margin top */
  mt?: ResponsiveValue<SpacingValue>;
  /** Margin right */
  mr?: ResponsiveValue<SpacingValue>;
  /** Margin bottom */
  mb?: ResponsiveValue<SpacingValue>;
  /** Margin left */
  ml?: ResponsiveValue<SpacingValue>;
  /** Gap between children (when using flex/grid) */
  gap?: ResponsiveValue<SpacingValue>;
}

/**
 * Footer component props
 *
 * When used as a direct child of body, footer becomes a contentinfo landmark.
 * Use aria-label to describe the footer's purpose when multiple footers exist.
 */
export interface FooterProps
  extends FooterSpacingProps,
    A11yProps,
    Omit<HTMLAttributes<HTMLElement>, keyof A11yProps> {
  /**
   * Accessible label for the footer region
   *
   * Not typically needed for page-level footers, but useful when multiple
   * footers exist on a page (e.g., article footers within a page that also
   * has a main site footer).
   *
   * @example
   * aria-label="Site footer"
   * aria-label="Article footer"
   */
  'aria-label'?: string;
  /** Children content */
  children?: ReactNode;
  /** Element ID */
  id?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/**
 * Spacing prop to Tailwind prefix mapping
 */
const SPACING_PREFIX_MAP: Record<keyof FooterSpacingProps, string> = {
  p: 'p',
  px: 'px',
  py: 'py',
  pt: 'pt',
  pr: 'pr',
  pb: 'pb',
  pl: 'pl',
  m: 'm',
  mx: 'mx',
  my: 'my',
  mt: 'mt',
  mr: 'mr',
  mb: 'mb',
  ml: 'ml',
  gap: 'gap',
};

/**
 * Generate Tailwind class for a single spacing value
 */
function getSpacingClass(prefix: string, value: SpacingValue): string {
  if (value === 'auto') {
    return `${prefix}-auto`;
  }
  if (value === 'px') {
    return `${prefix}-px`;
  }
  return `${prefix}-${value}`;
}

/**
 * Generate responsive Tailwind classes for a spacing prop
 */
function getResponsiveSpacingClasses(
  prefix: string,
  value: ResponsiveValue<SpacingValue>
): string[] {
  const classes: string[] = [];

  if (typeof value === 'string') {
    // Simple non-responsive value
    classes.push(getSpacingClass(prefix, value));
  } else if (typeof value === 'object' && value !== null) {
    // Responsive object value
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = value[breakpoint];
      if (breakpointValue !== undefined) {
        const spacingClass = getSpacingClass(prefix, breakpointValue);
        if (breakpoint === 'base') {
          classes.push(spacingClass);
        } else {
          classes.push(`${breakpoint}:${spacingClass}`);
        }
      }
    }
  }

  return classes;
}

/**
 * Extract spacing classes from props
 */
export function extractSpacingClasses(props: FooterSpacingProps): string[] {
  const classes: string[] = [];

  for (const [prop, prefix] of Object.entries(SPACING_PREFIX_MAP)) {
    const value = props[prop as keyof FooterSpacingProps];
    if (value !== undefined) {
      classes.push(...getResponsiveSpacingClasses(prefix, value));
    }
  }

  return classes;
}

/**
 * List of spacing prop keys to filter from rest props
 */
const SPACING_PROP_KEYS = new Set<string>([
  'p',
  'px',
  'py',
  'pt',
  'pr',
  'pb',
  'pl',
  'm',
  'mx',
  'my',
  'mt',
  'mr',
  'mb',
  'ml',
  'gap',
]);

/**
 * Footer - Semantic closing content landmark primitive
 *
 * The Footer primitive wraps the HTML `<footer>` element and provides
 * spacing props and accessibility attribute forwarding. When used as a
 * direct child of body, it becomes a contentinfo landmark (role="contentinfo").
 *
 * Use Footer for:
 * - Site footers with copyright and legal links
 * - Article footers with author and publication info
 * - Section footers with related content
 * - Card footers with actions
 *
 * Not for:
 * - Header content (use Header)
 * - Main content (use Main)
 * - Navigation only (use Nav)
 * - Generic containers (use Box)
 *
 * @example
 * // Site footer
 * <Footer p={{ base: '4', md: '8' }}>
 *   <nav aria-label="Footer navigation">
 *     <a href="/privacy">Privacy</a>
 *     <a href="/terms">Terms</a>
 *   </nav>
 *   <p>&copy; 2025 Company Name</p>
 * </Footer>
 *
 * // Article footer
 * <article>
 *   <h1>Article Title</h1>
 *   <p>Article content...</p>
 *   <Footer mt="4">
 *     <p>Tags: React, TypeScript, Accessibility</p>
 *   </Footer>
 * </article>
 *
 * // Sticky footer (at bottom of viewport)
 * <Footer className="sticky bottom-0 bg-white shadow-[0_-2px_4px_rgba(0,0,0,0.1)]" px="4" py="2">
 *   <p>Sticky footer content</p>
 * </Footer>
 */
export const Footer = forwardRef<HTMLElement, FooterProps>(function Footer(
  {
    children,
    className,
    style,
    id,
    'data-testid': dataTestId,
    // Spacing props
    p,
    px,
    py,
    pt,
    pr,
    pb,
    pl,
    m,
    mx,
    my,
    mt,
    mr,
    mb,
    ml,
    gap,
    // Rest props include A11y and native HTML attributes
    ...restProps
  },
  ref
) {
  // Build spacing classes
  const spacingClasses = extractSpacingClasses({
    p,
    px,
    py,
    pt,
    pr,
    pb,
    pl,
    m,
    mx,
    my,
    mt,
    mr,
    mb,
    ml,
    gap,
  });

  // Filter out any remaining spacing props from rest (defensive)
  const filteredProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(restProps)) {
    if (!SPACING_PROP_KEYS.has(key)) {
      filteredProps[key] = value;
    }
  }

  return (
    <footer
      ref={ref}
      id={id}
      data-testid={dataTestId}
      className={cn(...spacingClasses, className)}
      style={style}
      {...filteredProps}
    >
      {children}
    </footer>
  );
});

Footer.displayName = 'Footer';
