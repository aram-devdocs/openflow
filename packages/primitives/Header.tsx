/**
 * Header Primitive - Semantic `<header>` landmark for introductory content
 *
 * The header element represents introductory content, typically a group of
 * introductory or navigational aids. It may contain heading elements, logos,
 * search forms, author names, and other introductory content.
 *
 * A `<header>` element within `<body>` becomes a banner landmark (role="banner").
 * A `<header>` within `<article>`, `<aside>`, `<main>`, `<nav>`, or `<section>`
 * is not a banner landmark and is just structural.
 *
 * @example
 * // Page header with navigation
 * <Header>
 *   <nav>
 *     <a href="/">Home</a>
 *     <a href="/about">About</a>
 *   </nav>
 * </Header>
 *
 * // Article header
 * <article>
 *   <Header>
 *     <h1>Article Title</h1>
 *     <p>Published on January 1, 2024</p>
 *   </Header>
 *   <p>Article content...</p>
 * </article>
 *
 * // Header with logo and search
 * <Header p={{ base: '4', md: '6' }}>
 *   <img src="/logo.png" alt="Company Logo" />
 *   <nav aria-label="Main navigation">...</nav>
 *   <form role="search">...</form>
 * </Header>
 */

import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import type { A11yProps, Breakpoint, ResponsiveValue, SpacingValue } from './types';

/**
 * Spacing props for Header component
 */
export interface HeaderSpacingProps {
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
 * Header component props
 *
 * When used as a direct child of body, header becomes a banner landmark.
 * Use aria-label to describe the header's purpose when multiple headers exist.
 */
export interface HeaderProps
  extends HeaderSpacingProps,
    A11yProps,
    Omit<HTMLAttributes<HTMLElement>, keyof A11yProps> {
  /**
   * Accessible label for the header region
   *
   * Not typically needed for page-level headers, but useful when multiple
   * headers exist on a page (e.g., article headers within a page that also
   * has a main site header).
   *
   * @example
   * aria-label="Site header"
   * aria-label="Article header"
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
const SPACING_PREFIX_MAP: Record<keyof HeaderSpacingProps, string> = {
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
export function extractSpacingClasses(props: HeaderSpacingProps): string[] {
  const classes: string[] = [];

  for (const [prop, prefix] of Object.entries(SPACING_PREFIX_MAP)) {
    const value = props[prop as keyof HeaderSpacingProps];
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
 * Header - Semantic introductory content landmark primitive
 *
 * The Header primitive wraps the HTML `<header>` element and provides
 * spacing props and accessibility attribute forwarding. When used as a
 * direct child of body, it becomes a banner landmark (role="banner").
 *
 * Use Header for:
 * - Site headers with logo and navigation
 * - Article headers with title and metadata
 * - Section headers with headings
 * - Card headers
 *
 * Not for:
 * - Footer content (use Footer)
 * - Main content (use Main)
 * - Navigation only (use Nav)
 * - Generic containers (use Box)
 *
 * @example
 * // Site header
 * <Header p={{ base: '4', md: '6' }}>
 *   <img src="/logo.png" alt="Company Logo" />
 *   <nav aria-label="Main navigation">
 *     <a href="/">Home</a>
 *     <a href="/about">About</a>
 *   </nav>
 * </Header>
 *
 * // Article header
 * <article>
 *   <Header mb="4">
 *     <h1>Article Title</h1>
 *     <time dateTime="2024-01-01">January 1, 2024</time>
 *   </Header>
 *   <p>Article content...</p>
 * </article>
 *
 * // Sticky header
 * <Header className="sticky top-0 z-50 bg-white shadow" px="4" py="2">
 *   <Logo />
 *   <Navigation />
 * </Header>
 */
export const Header = forwardRef<HTMLElement, HeaderProps>(function Header(
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
    <header
      ref={ref}
      id={id}
      data-testid={dataTestId}
      className={cn(...spacingClasses, className)}
      style={style}
      {...filteredProps}
    >
      {children}
    </header>
  );
});

Header.displayName = 'Header';
