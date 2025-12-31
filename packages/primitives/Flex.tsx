/**
 * Flex Primitive - Flexbox container with responsive layout support
 *
 * A flexbox container extending Box with:
 * - Direction, wrap, justify, align props
 * - Responsive values for all flex properties
 * - Gap support for spacing between children
 * - ARIA attribute forwarding
 *
 * @example
 * // Basic horizontal layout
 * <Flex gap="4">
 *   <Box>Item 1</Box>
 *   <Box>Item 2</Box>
 * </Flex>
 *
 * // Centered column layout
 * <Flex direction="column" align="center" justify="center" gap="4">
 *   <Box>Top</Box>
 *   <Box>Bottom</Box>
 * </Flex>
 *
 * // Responsive layout
 * <Flex direction={{ base: 'column', md: 'row' }} gap={{ base: '2', md: '4' }}>
 *   <Box>Item 1</Box>
 *   <Box>Item 2</Box>
 * </Flex>
 */

import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, createElement, forwardRef } from 'react';
import type {
  A11yProps,
  AlignItems,
  Breakpoint,
  FlexDirection,
  FlexWrap,
  JustifyContent,
  ResponsiveValue,
  SpacingProps,
  SpacingValue,
} from './types';

/**
 * Supported HTML elements for the Flex component
 */
export type FlexElement =
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
  | 'ul'
  | 'ol'
  | 'menu';

/**
 * Flex component props
 */
export interface FlexProps
  extends SpacingProps,
    A11yProps,
    Omit<HTMLAttributes<HTMLElement>, keyof A11yProps> {
  /** HTML element to render as (defaults to 'div') */
  as?: FlexElement;
  /** Children content */
  children?: ReactNode;
  /** Element ID */
  id?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
  /** Flex direction */
  direction?: ResponsiveValue<FlexDirection>;
  /** Flex wrap */
  wrap?: ResponsiveValue<FlexWrap>;
  /** Justify content (main axis alignment) */
  justify?: ResponsiveValue<JustifyContent>;
  /** Align items (cross axis alignment) */
  align?: ResponsiveValue<AlignItems>;
  /** Display as inline-flex instead of flex */
  inline?: boolean;
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
 * Flex direction to Tailwind class mapping
 */
const DIRECTION_MAP: Record<FlexDirection, string> = {
  row: 'flex-row',
  'row-reverse': 'flex-row-reverse',
  column: 'flex-col',
  'column-reverse': 'flex-col-reverse',
};

/**
 * Flex wrap to Tailwind class mapping
 */
const WRAP_MAP: Record<FlexWrap, string> = {
  nowrap: 'flex-nowrap',
  wrap: 'flex-wrap',
  'wrap-reverse': 'flex-wrap-reverse',
};

/**
 * Justify content to Tailwind class mapping
 */
const JUSTIFY_MAP: Record<JustifyContent, string> = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

/**
 * Align items to Tailwind class mapping
 */
const ALIGN_MAP: Record<AlignItems, string> = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
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
 * Generate responsive classes for flex properties using a mapping
 */
function getResponsiveFlexClasses<T extends string>(
  value: ResponsiveValue<T> | undefined,
  mapping: Record<T, string>
): string[] {
  if (value === undefined) return [];

  const classes: string[] = [];

  if (typeof value === 'string') {
    classes.push(mapping[value]);
  } else if (typeof value === 'object' && value !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = value[breakpoint];
      if (breakpointValue !== undefined) {
        const flexClass = mapping[breakpointValue];
        if (breakpoint === 'base') {
          classes.push(flexClass);
        } else {
          classes.push(`${breakpoint}:${flexClass}`);
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
 * List of flex-specific prop keys to filter from rest props
 */
const FLEX_PROP_KEYS = new Set<string>(['direction', 'wrap', 'justify', 'align', 'inline']);

/**
 * Flex - Flexbox container primitive
 *
 * A flexible box layout container for arranging children in rows or columns.
 * Provides responsive flex properties and all spacing props from Box.
 *
 * @example
 * // Simple horizontal layout
 * <Flex gap="4">
 *   <Box p="4">A</Box>
 *   <Box p="4">B</Box>
 *   <Box p="4">C</Box>
 * </Flex>
 *
 * // Vertical centered layout
 * <Flex direction="column" align="center" gap="2">
 *   <Box>Top</Box>
 *   <Box>Middle</Box>
 *   <Box>Bottom</Box>
 * </Flex>
 *
 * // Responsive - column on mobile, row on desktop
 * <Flex
 *   direction={{ base: 'column', md: 'row' }}
 *   gap={{ base: '2', md: '4' }}
 *   justify="between"
 * >
 *   <Box>Left</Box>
 *   <Box>Right</Box>
 * </Flex>
 *
 * // Wrap with space between
 * <Flex wrap="wrap" gap="4" justify="between">
 *   {items.map(item => <Box key={item.id}>{item.name}</Box>)}
 * </Flex>
 */
export const Flex = forwardRef<HTMLElement, FlexProps>(function Flex(
  {
    as = 'div',
    children,
    className,
    style,
    id,
    'data-testid': dataTestId,
    // Flex props
    direction,
    wrap,
    justify,
    align,
    inline = false,
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

  // Build flex classes
  const flexClasses: string[] = [inline ? 'inline-flex' : 'flex'];
  flexClasses.push(...getResponsiveFlexClasses(direction, DIRECTION_MAP));
  flexClasses.push(...getResponsiveFlexClasses(wrap, WRAP_MAP));
  flexClasses.push(...getResponsiveFlexClasses(justify, JUSTIFY_MAP));
  flexClasses.push(...getResponsiveFlexClasses(align, ALIGN_MAP));

  // Filter out spacing and flex props from rest
  const filteredProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(restProps)) {
    if (!SPACING_PROP_KEYS.has(key) && !FLEX_PROP_KEYS.has(key)) {
      filteredProps[key] = value;
    }
  }

  return createElement(
    as,
    {
      ref,
      id,
      'data-testid': dataTestId,
      className: cn(...flexClasses, ...spacingClasses, className),
      style,
      ...filteredProps,
    },
    children
  );
});

Flex.displayName = 'Flex';
