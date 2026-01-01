/**
 * Article Primitive - Semantic `<article>` landmark wrapper
 *
 * An article represents a self-contained composition that is independently
 * distributable or reusable (e.g., a forum post, magazine article, blog entry,
 * user-submitted comment, or any other independent item of content).
 *
 * Unlike Section, Article does not require an aria-label because articles
 * are self-documenting through their content (headings, etc.).
 *
 * @example
 * // Basic usage
 * <Article>
 *   <h2>Blog Post Title</h2>
 *   <p>Article content here...</p>
 * </Article>
 *
 * // With spacing props
 * <Article p="8" className="bg-gray-100">
 *   <h2>Feature Article</h2>
 * </Article>
 *
 * // With optional aria-label for additional context
 * <Article aria-label="Featured article about accessibility">
 *   <h2>Web Accessibility</h2>
 * </Article>
 */

import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import type { A11yProps, Breakpoint, ResponsiveValue, SpacingValue } from './types';

/**
 * Spacing props for Article component
 */
export interface ArticleSpacingProps {
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
 * Article component props
 *
 * Articles represent self-contained content and do not require
 * an aria-label (unlike Section), though one can be provided
 * for additional screen reader context if desired.
 */
export interface ArticleProps
  extends ArticleSpacingProps,
    A11yProps,
    Omit<HTMLAttributes<HTMLElement>, keyof A11yProps> {
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
const SPACING_PREFIX_MAP: Record<keyof ArticleSpacingProps, string> = {
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
export function extractSpacingClasses(props: ArticleSpacingProps): string[] {
  const classes: string[] = [];

  for (const [prop, prefix] of Object.entries(SPACING_PREFIX_MAP)) {
    const value = props[prop as keyof ArticleSpacingProps];
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
 * Article - Semantic landmark primitive for self-contained content
 *
 * The Article primitive wraps the HTML `<article>` element and provides
 * spacing props and accessibility attribute forwarding. Articles represent
 * self-contained compositions that are independently distributable.
 *
 * Use Article for:
 * - Blog posts
 * - News articles
 * - Forum posts
 * - User comments
 * - Product cards (in a list)
 * - Any independent content item
 *
 * @example
 * // Blog post
 * <Article>
 *   <h2>My Blog Post</h2>
 *   <time dateTime="2025-01-15">January 15, 2025</time>
 *   <p>Content...</p>
 * </Article>
 *
 * // News article with spacing
 * <Article p={{ base: '4', md: '8' }} className="bg-white shadow-md">
 *   <h2>Breaking News</h2>
 *   <p>Details...</p>
 * </Article>
 *
 * // Product card
 * <Article aria-labelledby="product-title">
 *   <img src="product.jpg" alt="Product image" />
 *   <h3 id="product-title">Product Name</h3>
 *   <p>$99.00</p>
 * </Article>
 */
export const Article = forwardRef<HTMLElement, ArticleProps>(function Article(
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
    <article
      ref={ref}
      id={id}
      data-testid={dataTestId}
      className={cn(...spacingClasses, className)}
      style={style}
      {...filteredProps}
    >
      {children}
    </article>
  );
});

Article.displayName = 'Article';
