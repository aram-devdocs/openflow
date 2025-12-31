/**
 * Nav Primitive - Semantic `<nav>` landmark for navigation regions
 *
 * The nav element represents a section of a page that links to other pages
 * or parts within the page - a section with navigation links. It is a
 * landmark region that allows assistive technology users to quickly navigate
 * to navigation areas.
 *
 * Multiple nav elements can exist on a page, but each should have a unique
 * aria-label to distinguish them (e.g., "Main navigation", "Footer navigation").
 *
 * @example
 * // Basic navigation
 * <Nav aria-label="Main navigation">
 *   <ul>
 *     <li><a href="/">Home</a></li>
 *     <li><a href="/about">About</a></li>
 *   </ul>
 * </Nav>
 *
 * // Breadcrumb navigation
 * <Nav aria-label="Breadcrumb">
 *   <ol>
 *     <li><a href="/">Home</a></li>
 *     <li><a href="/docs">Docs</a></li>
 *     <li>Current Page</li>
 *   </ol>
 * </Nav>
 */

import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import type { A11yProps, Breakpoint, ResponsiveValue, SpacingValue } from './types';

/**
 * Spacing props for Nav component
 */
export interface NavSpacingProps {
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
 * Nav component props
 *
 * When multiple nav elements exist on a page, each should have a unique
 * aria-label to help screen reader users identify the purpose of each
 * navigation region.
 */
export interface NavProps
  extends NavSpacingProps,
    A11yProps,
    Omit<HTMLAttributes<HTMLElement>, keyof A11yProps> {
  /**
   * Accessible label for the navigation region
   *
   * Recommended when multiple nav elements exist on a page.
   * Should describe the type of navigation (e.g., "Main", "Footer", "Breadcrumb").
   *
   * @example
   * aria-label="Main navigation"
   * aria-label="Footer links"
   * aria-label="Breadcrumb"
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
const SPACING_PREFIX_MAP: Record<keyof NavSpacingProps, string> = {
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
export function extractSpacingClasses(props: NavSpacingProps): string[] {
  const classes: string[] = [];

  for (const [prop, prefix] of Object.entries(SPACING_PREFIX_MAP)) {
    const value = props[prop as keyof NavSpacingProps];
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
 * Nav - Semantic navigation landmark primitive
 *
 * The Nav primitive wraps the HTML `<nav>` element and provides
 * spacing props and accessibility attribute forwarding. Nav elements
 * are landmark regions that help screen reader users navigate.
 *
 * Use Nav for:
 * - Main site navigation
 * - Sidebar navigation
 * - Footer links
 * - Breadcrumb trails
 * - Pagination
 * - Table of contents
 *
 * Not for:
 * - Random groups of links (use a regular list)
 * - Links within running text
 *
 * @example
 * // Main navigation
 * <Nav aria-label="Main navigation">
 *   <ul>
 *     <li><a href="/">Home</a></li>
 *     <li><a href="/about">About</a></li>
 *     <li><a href="/contact">Contact</a></li>
 *   </ul>
 * </Nav>
 *
 * // With responsive spacing
 * <Nav aria-label="Site navigation" p={{ base: '2', md: '4' }}>
 *   {/* Navigation content *\/}
 * </Nav>
 *
 * // Breadcrumb navigation
 * <Nav aria-label="Breadcrumb">
 *   <ol>
 *     <li><a href="/">Home</a></li>
 *     <li aria-current="page">Current Page</li>
 *   </ol>
 * </Nav>
 */
export const Nav = forwardRef<HTMLElement, NavProps>(function Nav(
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
    <nav
      ref={ref}
      id={id}
      data-testid={dataTestId}
      className={cn(...spacingClasses, className)}
      style={style}
      {...filteredProps}
    >
      {children}
    </nav>
  );
});

Nav.displayName = 'Nav';
