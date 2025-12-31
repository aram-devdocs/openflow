/**
 * Box Primitive - Generic container with spacing and accessibility support
 *
 * The foundational layout primitive that wraps HTML elements with:
 * - Polymorphic `as` prop for semantic HTML
 * - Responsive spacing props (padding, margin, gap)
 * - ARIA attribute forwarding
 * - className merging with Tailwind conflict resolution
 *
 * @example
 * // Basic usage
 * <Box p="4" className="bg-gray-100">Content</Box>
 *
 * // Responsive spacing
 * <Box p={{ base: '2', md: '4', lg: '6' }}>Responsive padding</Box>
 *
 * // Polymorphic - render as different element
 * <Box as="section" aria-label="Main content">...</Box>
 */

import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, createElement, forwardRef } from 'react';
import type { A11yProps, Breakpoint, ResponsiveValue, SpacingProps, SpacingValue } from './types';

/**
 * Supported HTML elements for the Box component
 */
export type BoxElement =
  | 'div'
  | 'span'
  | 'section'
  | 'article'
  | 'aside'
  | 'header'
  | 'footer'
  | 'main'
  | 'nav'
  | 'form'
  | 'fieldset'
  | 'figure'
  | 'figcaption'
  | 'address'
  | 'details'
  | 'summary'
  | 'dialog'
  | 'menu'
  | 'ul'
  | 'ol'
  | 'li'
  | 'dl'
  | 'dt'
  | 'dd';

/**
 * Box component props
 */
export interface BoxProps
  extends SpacingProps,
    A11yProps,
    Omit<HTMLAttributes<HTMLElement>, keyof A11yProps> {
  /** HTML element to render as (defaults to 'div') */
  as?: BoxElement;
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
const SPACING_PREFIX_MAP: Record<keyof SpacingProps, string> = {
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
function extractSpacingClasses(props: SpacingProps): string[] {
  const classes: string[] = [];

  for (const [prop, prefix] of Object.entries(SPACING_PREFIX_MAP)) {
    const value = props[prop as keyof SpacingProps];
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
 * Box - Generic container primitive
 *
 * The foundational building block for layout composition. Provides:
 * - Polymorphic rendering via `as` prop
 * - Responsive spacing (padding, margin, gap)
 * - Full ARIA attribute support
 * - Tailwind className merging
 *
 * @example
 * // Basic container
 * <Box p="4" className="rounded-lg">Content</Box>
 *
 * // As different element
 * <Box as="section" aria-label="Features" p="8">
 *   <h2>Features</h2>
 * </Box>
 *
 * // Responsive padding
 * <Box p={{ base: '2', md: '4', lg: '8' }}>
 *   Responsive content
 * </Box>
 *
 * // Combined with other props
 * <Box
 *   as="article"
 *   p="4"
 *   m={{ base: '0', md: '4' }}
 *   className="bg-white shadow"
 *   aria-labelledby="article-title"
 * >
 *   <h2 id="article-title">Article</h2>
 * </Box>
 */
export const Box = forwardRef<HTMLElement, BoxProps>(function Box(
  {
    as = 'div',
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

  return createElement(
    as,
    {
      ref,
      id,
      'data-testid': dataTestId,
      className: cn(...spacingClasses, className),
      style,
      ...filteredProps,
    },
    children
  );
});

Box.displayName = 'Box';
