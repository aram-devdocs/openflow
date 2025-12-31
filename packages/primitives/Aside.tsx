/**
 * Aside Primitive - Semantic `<aside>` landmark for complementary content
 *
 * The aside element represents content that is tangentially related to the
 * content around it. It's commonly used for sidebars, pull quotes, advertising,
 * or groups of navigation elements, but is separate from the main content.
 *
 * Multiple aside elements can exist on a page. When multiple exist, each should
 * have a unique aria-label to help screen reader users distinguish between them.
 *
 * @example
 * // Sidebar navigation
 * <Aside aria-label="Related articles">
 *   <ul>
 *     <li><a href="/article-1">Related Article 1</a></li>
 *     <li><a href="/article-2">Related Article 2</a></li>
 *   </ul>
 * </Aside>
 *
 * // Pull quote
 * <Aside aria-label="Pull quote">
 *   <blockquote>"The best code is no code at all."</blockquote>
 * </Aside>
 *
 * // Table of contents
 * <Aside aria-label="Table of contents">
 *   <nav>
 *     <ul>
 *       <li><a href="#section-1">Section 1</a></li>
 *       <li><a href="#section-2">Section 2</a></li>
 *     </ul>
 *   </nav>
 * </Aside>
 */

import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import type { A11yProps, Breakpoint, ResponsiveValue, SpacingValue } from './types';

/**
 * Spacing props for Aside component
 */
export interface AsideSpacingProps {
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
 * Aside component props
 *
 * When multiple aside elements exist on a page, each should have a unique
 * aria-label to help screen reader users distinguish between complementary
 * content regions.
 */
export interface AsideProps
  extends AsideSpacingProps,
    A11yProps,
    Omit<HTMLAttributes<HTMLElement>, keyof A11yProps> {
  /**
   * Accessible label for the aside region
   *
   * Recommended when multiple aside elements exist on a page.
   * Should describe the type of complementary content (e.g., "Related articles", "Table of contents").
   *
   * @example
   * aria-label="Related articles"
   * aria-label="Author bio"
   * aria-label="Table of contents"
   * aria-label="Advertising"
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
const SPACING_PREFIX_MAP: Record<keyof AsideSpacingProps, string> = {
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
export function extractSpacingClasses(props: AsideSpacingProps): string[] {
  const classes: string[] = [];

  for (const [prop, prefix] of Object.entries(SPACING_PREFIX_MAP)) {
    const value = props[prop as keyof AsideSpacingProps];
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
 * Aside - Semantic complementary content landmark primitive
 *
 * The Aside primitive wraps the HTML `<aside>` element and provides
 * spacing props and accessibility attribute forwarding. Aside elements
 * are landmark regions for content tangentially related to main content.
 *
 * Use Aside for:
 * - Sidebars with related links
 * - Pull quotes
 * - Author biography
 * - Glossary/definitions
 * - Table of contents
 * - Advertising
 * - Related articles
 * - Social media widgets
 *
 * Not for:
 * - Main navigation (use Nav)
 * - Primary content (use Main)
 * - Grouped related content (use Section)
 * - Independent content items (use Article)
 *
 * @example
 * // Sidebar with related links
 * <Aside aria-label="Related articles">
 *   <h2>Related Articles</h2>
 *   <ul>
 *     <li><a href="/article-1">First Article</a></li>
 *     <li><a href="/article-2">Second Article</a></li>
 *   </ul>
 * </Aside>
 *
 * // Table of contents
 * <Aside aria-label="Table of contents" p={{ base: '4', md: '6' }}>
 *   <nav>
 *     <h2>On this page</h2>
 *     <ul>
 *       <li><a href="#introduction">Introduction</a></li>
 *       <li><a href="#usage">Usage</a></li>
 *     </ul>
 *   </nav>
 * </Aside>
 *
 * // Pull quote
 * <Aside aria-label="Pull quote" className="border-l-4 pl-4">
 *   <blockquote>
 *     "Accessibility is not a feature, it's a social imperative."
 *   </blockquote>
 * </Aside>
 */
export const Aside = forwardRef<HTMLElement, AsideProps>(function Aside(
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
    <aside
      ref={ref}
      id={id}
      data-testid={dataTestId}
      className={cn(...spacingClasses, className)}
      style={style}
      {...filteredProps}
    >
      {children}
    </aside>
  );
});

Aside.displayName = 'Aside';
