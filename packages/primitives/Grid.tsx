/**
 * Grid Primitive - CSS Grid container with responsive layout support
 *
 * A CSS Grid container with:
 * - Columns and rows props (1-12 columns, 1-6 rows)
 * - Gap, gapX, gapY for grid spacing
 * - Grid flow direction
 * - Responsive values for all grid properties
 * - ARIA attribute forwarding
 *
 * @example
 * // Basic 3-column grid
 * <Grid columns={3} gap="4">
 *   <Box>Item 1</Box>
 *   <Box>Item 2</Box>
 *   <Box>Item 3</Box>
 * </Grid>
 *
 * // Responsive columns
 * <Grid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap="4">
 *   {items.map(item => <Box key={item.id}>{item.name}</Box>)}
 * </Grid>
 *
 * // Different gap for rows and columns
 * <Grid columns={3} gapX="4" gapY="8">
 *   <Box>Item 1</Box>
 *   <Box>Item 2</Box>
 * </Grid>
 */

import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, createElement, forwardRef } from 'react';
import type { A11yProps, Breakpoint, ResponsiveValue, SpacingProps, SpacingValue } from './types';

/**
 * Number of grid columns (1-12) or 'none'
 */
export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'none';

/**
 * Number of grid rows (1-6) or 'none'
 */
export type GridRows = 1 | 2 | 3 | 4 | 5 | 6 | 'none';

/**
 * Grid flow direction
 */
export type GridFlow = 'row' | 'col' | 'dense' | 'row-dense' | 'col-dense';

/**
 * Supported HTML elements for the Grid component
 */
export type GridElement =
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
 * Grid component props
 */
export interface GridProps
  extends SpacingProps,
    A11yProps,
    Omit<HTMLAttributes<HTMLElement>, keyof A11yProps> {
  /** HTML element to render as (defaults to 'div') */
  as?: GridElement;
  /** Children content */
  children?: ReactNode;
  /** Element ID */
  id?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
  /** Number of columns (1-12) or 'none' */
  columns?: ResponsiveValue<GridColumns>;
  /** Number of rows (1-6) or 'none' */
  rows?: ResponsiveValue<GridRows>;
  /** Column gap */
  gapX?: ResponsiveValue<SpacingValue>;
  /** Row gap */
  gapY?: ResponsiveValue<SpacingValue>;
  /** Grid flow direction */
  flow?: ResponsiveValue<GridFlow>;
  /** Display as inline-grid instead of grid */
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
 * Grid columns to Tailwind class mapping
 */
const COLUMNS_MAP: Record<GridColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
  none: 'grid-cols-none',
};

/**
 * Grid rows to Tailwind class mapping
 */
const ROWS_MAP: Record<GridRows, string> = {
  1: 'grid-rows-1',
  2: 'grid-rows-2',
  3: 'grid-rows-3',
  4: 'grid-rows-4',
  5: 'grid-rows-5',
  6: 'grid-rows-6',
  none: 'grid-rows-none',
};

/**
 * Grid flow to Tailwind class mapping
 */
const FLOW_MAP: Record<GridFlow, string> = {
  row: 'grid-flow-row',
  col: 'grid-flow-col',
  dense: 'grid-flow-dense',
  'row-dense': 'grid-flow-row-dense',
  'col-dense': 'grid-flow-col-dense',
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
 * Generate responsive classes for grid properties using a mapping
 */
function getResponsiveGridClasses<T extends string | number>(
  value: ResponsiveValue<T> | undefined,
  mapping: Record<T, string>
): string[] {
  if (value === undefined) return [];

  const classes: string[] = [];

  if (typeof value === 'string' || typeof value === 'number') {
    classes.push(mapping[value as T]);
  } else if (typeof value === 'object' && value !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (value as Partial<Record<Breakpoint, T>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const gridClass = mapping[breakpointValue];
        if (breakpoint === 'base') {
          classes.push(gridClass);
        } else {
          classes.push(`${breakpoint}:${gridClass}`);
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
 * List of grid-specific prop keys to filter from rest props
 */
const GRID_PROP_KEYS = new Set<string>(['columns', 'rows', 'gapX', 'gapY', 'flow', 'inline']);

/**
 * Grid - CSS Grid container primitive
 *
 * A grid layout container for arranging children in columns and rows.
 * Provides responsive grid properties and all spacing props from Box.
 *
 * @example
 * // Simple 3-column grid
 * <Grid columns={3} gap="4">
 *   <Box p="4">A</Box>
 *   <Box p="4">B</Box>
 *   <Box p="4">C</Box>
 * </Grid>
 *
 * // Responsive columns
 * <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
 *   {items.map(item => <Box key={item.id}>{item.name}</Box>)}
 * </Grid>
 *
 * // Different gaps for rows and columns
 * <Grid columns={3} gapX="4" gapY="8">
 *   <Box>Item 1</Box>
 *   <Box>Item 2</Box>
 *   <Box>Item 3</Box>
 * </Grid>
 *
 * // Dense packing
 * <Grid columns={3} flow="dense" gap="4">
 *   <Box className="col-span-2">Wide item</Box>
 *   <Box>Regular</Box>
 *   <Box>Regular</Box>
 * </Grid>
 */
export const Grid = forwardRef<HTMLElement, GridProps>(function Grid(
  {
    as = 'div',
    children,
    className,
    style,
    id,
    'data-testid': dataTestId,
    // Grid props
    columns,
    rows,
    gapX,
    gapY,
    flow,
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

  // Build grid classes
  const gridClasses: string[] = [inline ? 'inline-grid' : 'grid'];
  gridClasses.push(...getResponsiveGridClasses(columns, COLUMNS_MAP));
  gridClasses.push(...getResponsiveGridClasses(rows, ROWS_MAP));
  gridClasses.push(...getResponsiveGridClasses(flow, FLOW_MAP));

  // Handle gapX and gapY separately (they use gap-x-* and gap-y-* classes)
  if (gapX !== undefined) {
    gridClasses.push(...getResponsiveSpacingClasses('gap-x', gapX));
  }
  if (gapY !== undefined) {
    gridClasses.push(...getResponsiveSpacingClasses('gap-y', gapY));
  }

  // Filter out spacing and grid props from rest
  const filteredProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(restProps)) {
    if (!SPACING_PROP_KEYS.has(key) && !GRID_PROP_KEYS.has(key)) {
      filteredProps[key] = value;
    }
  }

  return createElement(
    as,
    {
      ref,
      id,
      'data-testid': dataTestId,
      className: cn(...gridClasses, ...spacingClasses, className),
      style,
      ...filteredProps,
    },
    children
  );
});

Grid.displayName = 'Grid';
