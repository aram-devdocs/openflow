/**
 * List Primitive - Semantic list wrapper with ul/ol support
 *
 * A semantic list primitive that wraps HTML list elements with:
 * - Ordered (ol) and unordered (ul) support
 * - List style type customization
 * - Responsive gap between items
 * - ARIA attribute forwarding
 * - Spacing props support
 *
 * @example
 * // Basic unordered list
 * <List>
 *   <ListItem>Item 1</ListItem>
 *   <ListItem>Item 2</ListItem>
 * </List>
 *
 * // Ordered list
 * <List ordered>
 *   <ListItem>First</ListItem>
 *   <ListItem>Second</ListItem>
 * </List>
 *
 * // Custom style type
 * <List styleType="circle" gap="2">
 *   <ListItem>Item A</ListItem>
 *   <ListItem>Item B</ListItem>
 * </List>
 */

import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import type { A11yProps, Breakpoint, ResponsiveValue, SpacingProps, SpacingValue } from './types';

/**
 * List style type values
 */
export type ListStyleType =
  | 'none'
  | 'disc'
  | 'decimal'
  | 'circle'
  | 'square'
  | 'decimal-leading-zero'
  | 'lower-roman'
  | 'upper-roman'
  | 'lower-alpha'
  | 'upper-alpha';

/**
 * List component props
 */
export interface ListProps
  extends SpacingProps,
    A11yProps,
    Omit<HTMLAttributes<HTMLUListElement | HTMLOListElement>, keyof A11yProps> {
  /** Children content (ListItem components) */
  children?: ReactNode;
  /** Element ID */
  id?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
  /** Whether list is ordered (renders as ol vs ul) */
  ordered?: boolean;
  /** List style type */
  styleType?: ListStyleType;
  /** Starting number for ordered lists */
  start?: number;
  /** Whether to reverse order (for ordered lists) */
  reversed?: boolean;
  /** Gap between list items */
  gap?: ResponsiveValue<SpacingValue>;
  /** List marker position */
  markerPosition?: 'inside' | 'outside';
  /** Custom marker color (Tailwind color class without 'marker-' prefix) */
  markerColor?: string;
}

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/**
 * List style type to Tailwind class mapping
 */
const LIST_STYLE_MAP: Record<ListStyleType, string> = {
  none: 'list-none',
  disc: 'list-disc',
  decimal: 'list-decimal',
  circle: 'list-[circle]',
  square: 'list-[square]',
  'decimal-leading-zero': 'list-[decimal-leading-zero]',
  'lower-roman': 'list-[lower-roman]',
  'upper-roman': 'list-[upper-roman]',
  'lower-alpha': 'list-[lower-alpha]',
  'upper-alpha': 'list-[upper-alpha]',
};

/**
 * Marker position to Tailwind class mapping
 */
const MARKER_POSITION_MAP: Record<'inside' | 'outside', string> = {
  inside: 'list-inside',
  outside: 'list-outside',
};

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
    classes.push(getSpacingClass(prefix, value));
  } else if (typeof value === 'object' && value !== null) {
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
 * Generate responsive classes for gap between list items using flex
 */
function getGapClasses(gap: ResponsiveValue<SpacingValue> | undefined): string[] {
  if (gap === undefined) return [];

  const classes: string[] = ['flex', 'flex-col'];

  if (typeof gap === 'string') {
    classes.push(getSpacingClass('gap', gap));
  } else if (typeof gap === 'object' && gap !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = gap[breakpoint];
      if (breakpointValue !== undefined) {
        const gapClass = getSpacingClass('gap', breakpointValue);
        if (breakpoint === 'base') {
          classes.push(gapClass);
        } else {
          classes.push(`${breakpoint}:${gapClass}`);
        }
      }
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
 * List of List-specific prop keys to filter from rest props
 */
const LIST_PROP_KEYS = new Set<string>(['ordered', 'styleType', 'markerPosition', 'markerColor']);

/**
 * List - Semantic list primitive
 *
 * A wrapper for HTML list elements (ul/ol) with styling and accessibility support.
 * Use with ListItem components for proper list semantics.
 *
 * @example
 * // Basic unordered list
 * <List>
 *   <ListItem>First item</ListItem>
 *   <ListItem>Second item</ListItem>
 *   <ListItem>Third item</ListItem>
 * </List>
 *
 * // Ordered list with custom start
 * <List ordered start={5}>
 *   <ListItem>Fifth</ListItem>
 *   <ListItem>Sixth</ListItem>
 * </List>
 *
 * // Custom styling
 * <List styleType="circle" markerPosition="inside" gap="2">
 *   <ListItem>Item A</ListItem>
 *   <ListItem>Item B</ListItem>
 * </List>
 *
 * // Numbered with Roman numerals
 * <List ordered styleType="upper-roman" gap="4">
 *   <ListItem>Section I</ListItem>
 *   <ListItem>Section II</ListItem>
 * </List>
 *
 * // Reversed ordered list
 * <List ordered reversed>
 *   <ListItem>Last (but numbered 3)</ListItem>
 *   <ListItem>Middle (but numbered 2)</ListItem>
 *   <ListItem>First (but numbered 1)</ListItem>
 * </List>
 */
export const List = forwardRef<HTMLUListElement | HTMLOListElement, ListProps>(function List(
  {
    children,
    className,
    style,
    id,
    'data-testid': dataTestId,
    // List props
    ordered = false,
    styleType,
    start,
    reversed,
    gap,
    markerPosition,
    markerColor,
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
    // Rest props include A11y and native HTML attributes
    ...restProps
  },
  ref
) {
  // Build spacing classes (excluding gap which is handled separately)
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
  });

  // Build list classes
  const listClasses: string[] = [];

  // Style type
  if (styleType !== undefined) {
    listClasses.push(LIST_STYLE_MAP[styleType]);
  } else {
    // Default style type based on ordered
    listClasses.push(ordered ? 'list-decimal' : 'list-disc');
  }

  // Marker position
  if (markerPosition !== undefined) {
    listClasses.push(MARKER_POSITION_MAP[markerPosition]);
  }

  // Marker color
  if (markerColor) {
    // Handle CSS variable colors like "muted-foreground" -> "marker:[rgb(var(--muted-foreground))]"
    // Also handle standard Tailwind colors like "red-500" -> "marker:text-red-500"
    if (markerColor.includes('-') && !markerColor.match(/^\d/)) {
      const isStandardTailwind = /^[a-z]+-\d{2,3}$/.test(markerColor);
      if (isStandardTailwind) {
        listClasses.push(`marker:text-${markerColor}`);
      } else {
        listClasses.push(`marker:text-[rgb(var(--${markerColor}))]`);
      }
    } else {
      listClasses.push(`marker:text-${markerColor}`);
    }
  }

  // Gap classes - uses flex column layout for gap support
  const gapClasses = getGapClasses(gap);

  // Filter out spacing and list props from rest
  const filteredProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(restProps)) {
    if (!SPACING_PROP_KEYS.has(key) && !LIST_PROP_KEYS.has(key)) {
      filteredProps[key] = value;
    }
  }

  // Common props for both ul and ol
  const commonProps = {
    ref: ref as React.Ref<HTMLUListElement> & React.Ref<HTMLOListElement>,
    id,
    'data-testid': dataTestId,
    className: cn(...listClasses, ...gapClasses, ...spacingClasses, className),
    style,
    ...filteredProps,
  };

  if (ordered) {
    return (
      <ol {...commonProps} start={start} reversed={reversed}>
        {children}
      </ol>
    );
  }

  return <ul {...commonProps}>{children}</ul>;
});

List.displayName = 'List';
