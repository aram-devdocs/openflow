/**
 * Text Primitive - Typography wrapper with size, weight, and color props
 *
 * The foundational typography primitive that wraps inline text elements with:
 * - Polymorphic `as` prop for semantic HTML (span, p, strong, em, etc.)
 * - Responsive text size and font weight
 * - Color customization via Tailwind classes
 * - Text truncation and line clamping
 * - ARIA attribute forwarding
 * - className merging with Tailwind conflict resolution
 *
 * @example
 * // Basic usage
 * <Text size="lg" weight="semibold">Hello World</Text>
 *
 * // Responsive sizing
 * <Text size={{ base: 'sm', md: 'base', lg: 'lg' }}>Responsive text</Text>
 *
 * // Truncation
 * <Text truncate className="max-w-xs">Long text that will be truncated...</Text>
 *
 * // Line clamping
 * <Text lineClamp={2}>Multi-line text that will be clamped to 2 lines...</Text>
 */

import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, createElement, forwardRef } from 'react';
import type { A11yProps, Breakpoint, FontWeight, ResponsiveValue, TextSize } from './types';

/**
 * Supported HTML elements for the Text component
 */
export type TextElement =
  | 'span'
  | 'p'
  | 'strong'
  | 'em'
  | 'small'
  | 'del'
  | 'ins'
  | 'mark'
  | 'code'
  | 'abbr'
  | 'cite'
  | 'kbd'
  | 'samp'
  | 'sub'
  | 'sup'
  | 'time'
  | 'var'
  | 'label';

/**
 * Text component props
 */
export interface TextProps extends A11yProps, Omit<HTMLAttributes<HTMLElement>, keyof A11yProps> {
  /** HTML element to render as (defaults to 'span') */
  as?: TextElement;
  /** Children content */
  children?: ReactNode;
  /** Element ID */
  id?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
  /** Text size */
  size?: ResponsiveValue<TextSize>;
  /** Font weight */
  weight?: ResponsiveValue<FontWeight>;
  /** Text color (Tailwind color class without 'text-' prefix, e.g., 'red-500', 'muted-foreground') */
  color?: string;
  /** Truncate text with ellipsis */
  truncate?: boolean;
  /** Line clamp (max number of lines) */
  lineClamp?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Text alignment */
  align?: ResponsiveValue<'left' | 'center' | 'right' | 'justify'>;
  /** Letter spacing */
  tracking?: ResponsiveValue<'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest'>;
  /** Line height */
  leading?: ResponsiveValue<'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'>;
  /** Text decoration */
  decoration?: 'underline' | 'overline' | 'line-through' | 'none';
  /** Text transform */
  transform?: 'uppercase' | 'lowercase' | 'capitalize' | 'normal-case';
  /** White space handling */
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-line' | 'pre-wrap' | 'break-spaces';
  /** Word break */
  wordBreak?: 'normal' | 'words' | 'all' | 'keep';
}

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

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
const TEXT_ALIGN_MAP: Record<'left' | 'center' | 'right' | 'justify', string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
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
 * Line clamp to Tailwind class mapping
 */
const LINE_CLAMP_MAP: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
};

/**
 * Word break to Tailwind class mapping
 */
const WORD_BREAK_MAP: Record<'normal' | 'words' | 'all' | 'keep', string> = {
  normal: 'break-normal',
  words: 'break-words',
  all: 'break-all',
  keep: 'break-keep',
};

/**
 * White space to Tailwind class mapping
 */
const WHITE_SPACE_MAP: Record<
  'normal' | 'nowrap' | 'pre' | 'pre-line' | 'pre-wrap' | 'break-spaces',
  string
> = {
  normal: 'whitespace-normal',
  nowrap: 'whitespace-nowrap',
  pre: 'whitespace-pre',
  'pre-line': 'whitespace-pre-line',
  'pre-wrap': 'whitespace-pre-wrap',
  'break-spaces': 'whitespace-break-spaces',
};

/**
 * Generate responsive classes for a property using a mapping
 */
export function getResponsiveClasses<T extends string | number>(
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
 * Text - Typography primitive
 *
 * The foundational building block for inline text content. Provides:
 * - Polymorphic rendering via `as` prop
 * - Responsive text size and font weight
 * - Text truncation and line clamping
 * - Full ARIA attribute support
 * - Tailwind className merging
 *
 * @example
 * // Basic text
 * <Text size="lg" weight="medium">Hello World</Text>
 *
 * // Semantic HTML
 * <Text as="strong" weight="bold">Important text</Text>
 *
 * // Responsive sizing
 * <Text size={{ base: 'sm', md: 'base', lg: 'lg' }}>
 *   Responsive text
 * </Text>
 *
 * // With truncation
 * <Text truncate className="max-w-xs">
 *   This is a very long text that will be truncated with an ellipsis
 * </Text>
 *
 * // Line clamp
 * <Text lineClamp={2}>
 *   Multi-line text that will be clamped to two lines with an ellipsis
 * </Text>
 *
 * // Custom color
 * <Text color="red-500">Error text</Text>
 * <Text color="muted-foreground">Secondary text</Text>
 */
export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  {
    as = 'span',
    children,
    className,
    style,
    id,
    'data-testid': dataTestId,
    // Typography props
    size,
    weight,
    color,
    truncate,
    lineClamp,
    align,
    tracking,
    leading,
    decoration,
    transform,
    whiteSpace,
    wordBreak,
    // Rest props include A11y and native HTML attributes
    ...restProps
  },
  ref
) {
  // Build typography classes
  const typographyClasses: string[] = [];

  // Size classes
  if (size !== undefined) {
    typographyClasses.push(...getResponsiveClasses(size, TEXT_SIZE_MAP));
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

  // Line clamp
  if (lineClamp !== undefined) {
    typographyClasses.push(LINE_CLAMP_MAP[lineClamp]);
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

  // Text decoration
  if (decoration) {
    typographyClasses.push(decoration);
  }

  // Text transform
  if (transform) {
    typographyClasses.push(transform);
  }

  // White space
  if (whiteSpace) {
    typographyClasses.push(WHITE_SPACE_MAP[whiteSpace]);
  }

  // Word break
  if (wordBreak) {
    typographyClasses.push(WORD_BREAK_MAP[wordBreak]);
  }

  return createElement(
    as,
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

Text.displayName = 'Text';
