/**
 * Heading Primitive - Semantic heading (h1-h6) with automatic sizing
 *
 * The foundational heading primitive that provides:
 * - Required `level` prop that determines the HTML tag (h1-h6)
 * - Automatic text sizing based on heading level
 * - Responsive text size and font weight overrides
 * - Color customization via Tailwind classes
 * - Text truncation and alignment
 * - ARIA attribute forwarding (including aria-level for accessible heading level)
 * - className merging with Tailwind conflict resolution
 *
 * @example
 * // Basic usage with automatic sizing
 * <Heading level={1}>Page Title</Heading>
 * <Heading level={2}>Section Title</Heading>
 *
 * // Custom size override
 * <Heading level={1} size="4xl">Large Page Title</Heading>
 *
 * // Responsive sizing
 * <Heading level={2} size={{ base: 'xl', md: '2xl', lg: '3xl' }}>
 *   Responsive Section Title
 * </Heading>
 *
 * // With custom color and weight
 * <Heading level={3} color="muted-foreground" weight="medium">
 *   Subdued Heading
 * </Heading>
 */

import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, createElement, forwardRef } from 'react';
import type {
  A11yProps,
  Breakpoint,
  FontWeight,
  HeadingLevel,
  ResponsiveValue,
  TextSize,
} from './types';

/**
 * Heading component props
 */
export interface HeadingProps
  extends A11yProps,
    Omit<HTMLAttributes<HTMLHeadingElement>, keyof A11yProps> {
  /** Heading level (1-6), determines the HTML tag (h1-h6) - REQUIRED */
  level: HeadingLevel;
  /** Children content */
  children?: ReactNode;
  /** Element ID */
  id?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
  /** Text size (overrides automatic sizing based on level) */
  size?: ResponsiveValue<TextSize>;
  /** Font weight (defaults to 'bold' for all levels) */
  weight?: ResponsiveValue<FontWeight>;
  /** Text color (Tailwind color class without 'text-' prefix, e.g., 'red-500', 'muted-foreground') */
  color?: string;
  /** Truncate text with ellipsis */
  truncate?: boolean;
  /** Text alignment */
  align?: ResponsiveValue<'left' | 'center' | 'right'>;
  /** Letter spacing */
  tracking?: ResponsiveValue<'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest'>;
  /** Line height */
  leading?: ResponsiveValue<'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'>;
}

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/**
 * Default text sizes for each heading level
 * h1 = 4xl, h2 = 3xl, h3 = 2xl, h4 = xl, h5 = lg, h6 = base
 */
const DEFAULT_HEADING_SIZES: Record<HeadingLevel, TextSize> = {
  1: '4xl',
  2: '3xl',
  3: '2xl',
  4: 'xl',
  5: 'lg',
  6: 'base',
};

/**
 * Text size to Tailwind class mapping
 */
const TEXT_SIZE_MAP: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
  '7xl': 'text-7xl',
  '8xl': 'text-8xl',
  '9xl': 'text-9xl',
};

/**
 * Font weight to Tailwind class mapping
 */
const FONT_WEIGHT_MAP: Record<FontWeight, string> = {
  thin: 'font-thin',
  extralight: 'font-extralight',
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
  black: 'font-black',
};

/**
 * Text alignment to Tailwind class mapping
 */
const TEXT_ALIGN_MAP: Record<'left' | 'center' | 'right', string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/**
 * Letter spacing to Tailwind class mapping
 */
const TRACKING_MAP: Record<'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest', string> = {
  tighter: 'tracking-tighter',
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
  wider: 'tracking-wider',
  widest: 'tracking-widest',
};

/**
 * Line height to Tailwind class mapping
 */
const LEADING_MAP: Record<'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose', string> = {
  none: 'leading-none',
  tight: 'leading-tight',
  snug: 'leading-snug',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
  loose: 'leading-loose',
};

/**
 * Generate responsive classes for a property using a mapping
 */
function getResponsiveClasses<T extends string | number>(
  value: ResponsiveValue<T>,
  map: Record<T, string>
): string[] {
  const classes: string[] = [];

  if (typeof value === 'string' || typeof value === 'number') {
    // Simple non-responsive value
    const mappedClass = map[value as T];
    if (mappedClass) {
      classes.push(mappedClass);
    }
  } else if (typeof value === 'object' && value !== null) {
    // Responsive object value
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (value as Partial<Record<Breakpoint, T>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const mappedClass = map[breakpointValue];
        if (mappedClass) {
          if (breakpoint === 'base') {
            classes.push(mappedClass);
          } else {
            classes.push(`${breakpoint}:${mappedClass}`);
          }
        }
      }
    }
  }

  return classes;
}

/**
 * Get the HTML tag for the heading level
 */
function getHeadingTag(level: HeadingLevel): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' {
  return `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * Heading - Semantic heading primitive
 *
 * The foundational building block for heading content. Provides:
 * - Required `level` prop that maps to h1-h6 HTML tags
 * - Automatic text sizing based on heading level
 * - Optional size, weight, and color overrides
 * - Full ARIA attribute support
 * - Tailwind className merging
 *
 * @example
 * // Basic headings
 * <Heading level={1}>Page Title</Heading>
 * <Heading level={2}>Section Title</Heading>
 * <Heading level={3}>Subsection Title</Heading>
 *
 * // Custom styling
 * <Heading level={1} size="5xl" weight="extrabold" tracking="tight">
 *   Hero Title
 * </Heading>
 *
 * // Responsive sizing
 * <Heading level={2} size={{ base: 'xl', md: '2xl', lg: '3xl' }}>
 *   Responsive Heading
 * </Heading>
 *
 * // With color
 * <Heading level={3} color="primary">Primary Heading</Heading>
 * <Heading level={4} color="muted-foreground">Muted Heading</Heading>
 */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  {
    level,
    children,
    className,
    style,
    id,
    'data-testid': dataTestId,
    // Typography props
    size,
    weight = 'bold',
    color,
    truncate,
    align,
    tracking,
    leading,
    // Rest props include A11y and native HTML attributes
    ...restProps
  },
  ref
) {
  // Build typography classes
  const typographyClasses: string[] = [];

  // Size classes - use provided size or default based on level
  const effectiveSize = size ?? DEFAULT_HEADING_SIZES[level];
  if (typeof effectiveSize === 'object') {
    // Responsive value provided - use it directly
    typographyClasses.push(...getResponsiveClasses(effectiveSize, TEXT_SIZE_MAP));
  } else {
    // Simple value (either provided or default)
    typographyClasses.push(TEXT_SIZE_MAP[effectiveSize]);
  }

  // Weight classes
  if (weight !== undefined) {
    typographyClasses.push(...getResponsiveClasses(weight, FONT_WEIGHT_MAP));
  }

  // Color class
  if (color) {
    // Handle CSS variable colors like "muted-foreground" -> "text-[rgb(var(--muted-foreground))]"
    // Also handle standard Tailwind colors like "red-500" -> "text-red-500"
    if (color.includes('-') && !color.match(/^\d/)) {
      // Check if it's a CSS variable pattern (e.g., "muted-foreground", "primary")
      // vs standard Tailwind color (e.g., "red-500", "blue-600")
      const isStandardTailwind = /^[a-z]+-\d{2,3}$/.test(color);
      if (isStandardTailwind) {
        typographyClasses.push(`text-${color}`);
      } else {
        // CSS variable pattern
        typographyClasses.push(`text-[rgb(var(--${color}))]`);
      }
    } else {
      typographyClasses.push(`text-${color}`);
    }
  }

  // Truncation
  if (truncate) {
    typographyClasses.push('truncate');
  }

  // Alignment
  if (align !== undefined) {
    typographyClasses.push(...getResponsiveClasses(align, TEXT_ALIGN_MAP));
  }

  // Letter spacing
  if (tracking !== undefined) {
    typographyClasses.push(...getResponsiveClasses(tracking, TRACKING_MAP));
  }

  // Line height
  if (leading !== undefined) {
    typographyClasses.push(...getResponsiveClasses(leading, LEADING_MAP));
  }

  // Get the correct HTML tag
  const tag = getHeadingTag(level);

  return createElement(
    tag,
    {
      ref,
      id,
      'data-testid': dataTestId,
      className: cn(...typographyClasses, className),
      style,
      ...restProps,
    },
    children
  );
});

Heading.displayName = 'Heading';
