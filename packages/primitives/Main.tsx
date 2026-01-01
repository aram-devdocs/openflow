/**
 * Main Primitive - Semantic `<main>` landmark with skip link targeting
 *
 * The main element represents the dominant content of the <body> of a document.
 * There should only be one visible main element per page. It is a landmark
 * region that allows assistive technology users to quickly navigate to the
 * primary content.
 *
 * This primitive defaults id="main-content" for skip link targeting.
 *
 * @example
 * // Basic usage (with default id for skip link)
 * <Main>
 *   <h1>Page Title</h1>
 *   <p>Main content here...</p>
 * </Main>
 *
 * // With custom id
 * <Main id="content">
 *   <h1>Page Title</h1>
 * </Main>
 *
 * // With spacing props
 * <Main p={{ base: '4', md: '8' }} className="max-w-7xl mx-auto">
 *   <h1>Page Title</h1>
 * </Main>
 */

import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import type { A11yProps, Breakpoint, ResponsiveValue, SpacingValue } from './types';

/**
 * Spacing props for Main component
 */
export interface MainSpacingProps {
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
 * Main component props
 *
 * The main element should contain the primary content of the page.
 * There should only be one visible main element at a time.
 */
export interface MainProps
  extends MainSpacingProps,
    A11yProps,
    Omit<HTMLAttributes<HTMLElement>, keyof A11yProps> {
  /**
   * Element ID for skip link targeting
   *
   * Defaults to "main-content" which is the conventional target for skip links.
   * Customize this if you have multiple pages with different skip link patterns.
   *
   * @default "main-content"
   */
  id?: string;
  /** Children content */
  children?: ReactNode;
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
const SPACING_PREFIX_MAP: Record<keyof MainSpacingProps, string> = {
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
export function extractSpacingClasses(props: MainSpacingProps): string[] {
  const classes: string[] = [];

  for (const [prop, prefix] of Object.entries(SPACING_PREFIX_MAP)) {
    const value = props[prop as keyof MainSpacingProps];
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
 * Default ID for skip link targeting
 */
export const DEFAULT_MAIN_ID = 'main-content';

/**
 * Main - Semantic main content landmark primitive
 *
 * The Main primitive wraps the HTML `<main>` element and provides
 * skip link targeting, spacing props, and accessibility attribute forwarding.
 *
 * The main element is a landmark region for the document's primary content.
 * Screen readers allow users to jump directly to main content.
 *
 * Use Main for:
 * - The primary content area of a page
 * - Content that is unique to the page (not header, nav, footer)
 *
 * Best practices:
 * - Only one visible main element per page
 * - Content that repeats across pages (header, nav, footer) should NOT be in main
 * - Use with a skip link that targets this element's id
 *
 * @example
 * // With skip link pattern
 * <SkipLink href="#main-content">Skip to main content</SkipLink>
 * <Header>...</Header>
 * <Nav>...</Nav>
 * <Main>
 *   <h1>Page Title</h1>
 *   <p>This is the main content...</p>
 * </Main>
 * <Footer>...</Footer>
 *
 * // With responsive spacing
 * <Main p={{ base: '4', md: '6', lg: '8' }} className="max-w-6xl mx-auto">
 *   <h1>Centered Content</h1>
 * </Main>
 *
 * // With custom id
 * <Main id="primary-content">
 *   <h1>Page Title</h1>
 * </Main>
 */
export const Main = forwardRef<HTMLElement, MainProps>(function Main(
  {
    children,
    className,
    style,
    id = DEFAULT_MAIN_ID,
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
    <main
      ref={ref}
      id={id}
      data-testid={dataTestId}
      className={cn(...spacingClasses, className)}
      style={style}
      {...filteredProps}
    >
      {children}
    </main>
  );
});

Main.displayName = 'Main';
