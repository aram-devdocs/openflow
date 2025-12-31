/**
 * ListItem Primitive - Semantic list item wrapper
 *
 * A semantic list item primitive that wraps the HTML `<li>` element with:
 * - Proper list item semantics (role="listitem" implicit)
 * - ARIA attribute forwarding
 * - Spacing props support
 * - Polymorphic rendering capability
 *
 * @example
 * // Basic list item
 * <List>
 *   <ListItem>First item</ListItem>
 *   <ListItem>Second item</ListItem>
 * </List>
 *
 * // With custom styling
 * <List>
 *   <ListItem p="2" className="hover:bg-muted">
 *     Interactive item
 *   </ListItem>
 * </List>
 *
 * // With ARIA props for menus
 * <List role="menu">
 *   <ListItem role="menuitem" tabIndex={0}>
 *     Menu option
 *   </ListItem>
 * </List>
 */

import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import type { A11yProps, Breakpoint, ResponsiveValue, SpacingValue } from './types';

/**
 * Spacing props for list item
 */
export interface ListItemSpacingProps {
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
}

/**
 * ListItem component props
 */
export interface ListItemProps
  extends ListItemSpacingProps,
    A11yProps,
    Omit<HTMLAttributes<HTMLLIElement>, keyof A11yProps> {
  /** Children content */
  children?: ReactNode;
  /** Element ID */
  id?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
  /** Value attribute for ordered lists (overrides default number) */
  value?: number;
  /** Whether the item is disabled (visual only, use with role="option") */
  disabled?: boolean;
}

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/**
 * Spacing prop to Tailwind prefix mapping
 */
const SPACING_PREFIX_MAP: Record<keyof ListItemSpacingProps, string> = {
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
function extractSpacingClasses(props: ListItemSpacingProps): string[] {
  const classes: string[] = [];

  for (const [prop, prefix] of Object.entries(SPACING_PREFIX_MAP)) {
    const value = props[prop as keyof ListItemSpacingProps];
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
]);

/**
 * List of ListItem-specific prop keys to filter from rest props
 */
const LIST_ITEM_PROP_KEYS = new Set<string>(['disabled']);

/**
 * ListItem - Semantic list item primitive
 *
 * A wrapper for the HTML `<li>` element with styling and accessibility support.
 * Use as a child of List components for proper list semantics.
 *
 * @example
 * // Basic usage
 * <List>
 *   <ListItem>First item</ListItem>
 *   <ListItem>Second item</ListItem>
 *   <ListItem>Third item</ListItem>
 * </List>
 *
 * // With padding and hover state
 * <List styleType="none">
 *   <ListItem px="4" py="2" className="hover:bg-muted rounded cursor-pointer">
 *     Interactive item
 *   </ListItem>
 * </List>
 *
 * // Menu item pattern
 * <List role="menu" aria-label="Actions">
 *   <ListItem role="menuitem" tabIndex={0}>
 *     Edit
 *   </ListItem>
 *   <ListItem role="menuitem" tabIndex={0}>
 *     Delete
 *   </ListItem>
 * </List>
 *
 * // Ordered list with custom value
 * <List ordered>
 *   <ListItem value={10}>Tenth item</ListItem>
 *   <ListItem value={20}>Twentieth item</ListItem>
 * </List>
 *
 * // Disabled item (for selection lists)
 * <List role="listbox" aria-label="Options">
 *   <ListItem role="option" aria-selected={false}>Available</ListItem>
 *   <ListItem role="option" aria-disabled disabled>Unavailable</ListItem>
 * </List>
 */
export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(function ListItem(
  {
    children,
    className,
    style,
    id,
    'data-testid': dataTestId,
    // ListItem props
    value,
    disabled,
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
  });

  // Build list item classes
  const listItemClasses: string[] = [];

  // Add disabled styling if applicable
  if (disabled) {
    listItemClasses.push('opacity-50', 'cursor-not-allowed');
  }

  // Filter out spacing and list item props from rest
  const filteredProps: Record<string, unknown> = {};
  for (const [key, propValue] of Object.entries(restProps)) {
    if (!SPACING_PROP_KEYS.has(key) && !LIST_ITEM_PROP_KEYS.has(key)) {
      filteredProps[key] = propValue;
    }
  }

  return (
    <li
      ref={ref}
      id={id}
      data-testid={dataTestId}
      value={value}
      className={cn(...listItemClasses, ...spacingClasses, className)}
      style={style}
      {...filteredProps}
    >
      {children}
    </li>
  );
});

ListItem.displayName = 'ListItem';
