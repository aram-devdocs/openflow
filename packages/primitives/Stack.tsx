/**
 * Stack Primitive - Vertical/horizontal stack layout with gap and optional dividers
 *
 * A simplified flexbox layout for stacking items in one direction:
 * - Direction: vertical (column) or horizontal (row)
 * - Gap support for spacing between children
 * - Optional dividers between items
 * - Cross-axis alignment
 * - ARIA attribute forwarding
 *
 * @example
 * // Vertical stack (default)
 * <Stack gap="4">
 *   <Box>Item 1</Box>
 *   <Box>Item 2</Box>
 * </Stack>
 *
 * // Horizontal stack
 * <Stack direction="horizontal" gap="4">
 *   <Box>Left</Box>
 *   <Box>Right</Box>
 * </Stack>
 *
 * // With dividers
 * <Stack gap="4" dividers>
 *   <Box>Section 1</Box>
 *   <Box>Section 2</Box>
 * </Stack>
 */

import { cn } from '@openflow/utils';
import {
  Children,
  Fragment,
  type HTMLAttributes,
  type ReactNode,
  createElement,
  forwardRef,
  isValidElement,
} from 'react';
import type {
  A11yProps,
  AlignItems,
  Breakpoint,
  ResponsiveValue,
  SpacingProps,
  SpacingValue,
  StackDirection,
} from './types';

/**
 * Supported HTML elements for the Stack component
 */
export type StackElement =
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
 * Stack component props
 */
export interface StackProps
  extends SpacingProps,
    A11yProps,
    Omit<HTMLAttributes<HTMLElement>, keyof A11yProps> {
  /** HTML element to render as (defaults to 'div') */
  as?: StackElement;
  /** Children content */
  children?: ReactNode;
  /** Element ID */
  id?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
  /** Stack direction (defaults to 'vertical') */
  direction?: ResponsiveValue<StackDirection>;
  /** Align items along cross axis */
  align?: ResponsiveValue<AlignItems>;
  /** Whether to include dividers between items */
  dividers?: boolean;
  /** Custom divider element (defaults to a simple line) */
  divider?: ReactNode;
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
 * Stack direction to Tailwind class mapping
 */
const DIRECTION_MAP: Record<StackDirection, string> = {
  vertical: 'flex-col',
  horizontal: 'flex-row',
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
 * Generate responsive classes for stack properties using a mapping
 */
function getResponsiveStackClasses<T extends string>(
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
        const stackClass = mapping[breakpointValue];
        if (breakpoint === 'base') {
          classes.push(stackClass);
        } else {
          classes.push(`${breakpoint}:${stackClass}`);
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
 * List of stack-specific prop keys to filter from rest props
 */
const STACK_PROP_KEYS = new Set<string>(['direction', 'align', 'dividers', 'divider']);

/**
 * Default divider component for horizontal stacks
 * Uses aria-hidden as these are decorative visual separators
 */
const HorizontalDivider = () => (
  <div className="w-px self-stretch bg-[rgb(var(--border))]" aria-hidden="true" />
);

/**
 * Default divider component for vertical stacks
 * Uses aria-hidden as these are decorative visual separators
 */
const VerticalDivider = () => (
  <div className="h-px w-full bg-[rgb(var(--border))]" aria-hidden="true" />
);

/**
 * Check if direction is horizontal at base breakpoint
 */
function isHorizontalAtBase(direction: ResponsiveValue<StackDirection> | undefined): boolean {
  if (direction === undefined) return false;
  if (typeof direction === 'string') return direction === 'horizontal';
  if (typeof direction === 'object' && direction !== null) {
    return direction.base === 'horizontal';
  }
  return false;
}

/**
 * Stack - Vertical/horizontal stack primitive
 *
 * A simplified flexbox layout for stacking items in a single direction.
 * Provides gap between items and optional dividers.
 *
 * @example
 * // Basic vertical stack
 * <Stack gap="4">
 *   <Box>Top</Box>
 *   <Box>Middle</Box>
 *   <Box>Bottom</Box>
 * </Stack>
 *
 * // Horizontal stack
 * <Stack direction="horizontal" gap="4" align="center">
 *   <Box>Left</Box>
 *   <Box>Right</Box>
 * </Stack>
 *
 * // With dividers
 * <Stack gap="4" dividers>
 *   <Box>Section 1</Box>
 *   <Box>Section 2</Box>
 *   <Box>Section 3</Box>
 * </Stack>
 *
 * // Responsive - vertical on mobile, horizontal on desktop
 * <Stack direction={{ base: 'vertical', md: 'horizontal' }} gap="4">
 *   <Box>Item 1</Box>
 *   <Box>Item 2</Box>
 * </Stack>
 *
 * // Custom divider
 * <Stack gap="2" dividers divider={<span>•</span>}>
 *   <span>A</span>
 *   <span>B</span>
 *   <span>C</span>
 * </Stack>
 */
export const Stack = forwardRef<HTMLElement, StackProps>(function Stack(
  {
    as = 'div',
    children,
    className,
    style,
    id,
    'data-testid': dataTestId,
    // Stack props
    direction,
    align,
    dividers = false,
    divider,
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

  // Build stack classes
  const stackClasses: string[] = ['flex'];

  // Default to vertical if no direction specified
  if (direction === undefined) {
    stackClasses.push('flex-col');
  } else {
    stackClasses.push(...getResponsiveStackClasses(direction, DIRECTION_MAP));
  }

  stackClasses.push(...getResponsiveStackClasses(align, ALIGN_MAP));

  // Filter out spacing and stack props from rest
  const filteredProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(restProps)) {
    if (!SPACING_PROP_KEYS.has(key) && !STACK_PROP_KEYS.has(key)) {
      filteredProps[key] = value;
    }
  }

  // Process children for dividers
  let renderedChildren: ReactNode = children;

  if (dividers) {
    const childArray = Children.toArray(children).filter(
      (child) => isValidElement(child) || (typeof child === 'string' && child.trim())
    );

    if (childArray.length > 1) {
      const isHorizontal = isHorizontalAtBase(direction);
      const defaultDivider = isHorizontal ? <HorizontalDivider /> : <VerticalDivider />;
      const dividerElement = divider ?? defaultDivider;

      renderedChildren = childArray.map((child, index) => (
        <Fragment key={isValidElement(child) ? (child.key ?? index) : index}>
          {child}
          {index < childArray.length - 1 && dividerElement}
        </Fragment>
      ));
    }
  }

  return createElement(
    as,
    {
      ref,
      id,
      'data-testid': dataTestId,
      className: cn(...stackClasses, ...spacingClasses, className),
      style,
      ...filteredProps,
    },
    renderedChildren
  );
});

Stack.displayName = 'Stack';
