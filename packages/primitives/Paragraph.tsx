/**
 * Paragraph Primitive - Semantic paragraph element with typography props
 *
 * The foundational paragraph primitive that provides:
 * - Renders as semantic `<p>` element by default
 * - Responsive text size
 * - Line height (leading) optimized for body text
 * - Font weight customization
 * - Color customization via Tailwind classes
 * - Text alignment
 * - ARIA attribute forwarding
 * - className merging with Tailwind conflict resolution
 *
 * @example
 * // Basic usage
 * <Paragraph>This is a paragraph of text.</Paragraph>
 *
 * // With custom size and leading
 * <Paragraph size="lg" leading="relaxed">
 *   This paragraph has larger text with relaxed line height.
 * </Paragraph>
 *
 * // Responsive sizing
 * <Paragraph size={{ base: 'sm', md: 'base', lg: 'lg' }}>
 *   Responsive paragraph text
 * </Paragraph>
 */

import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import type { A11yProps, Breakpoint, FontWeight, ResponsiveValue, TextSize } from './types';

/**
 * Paragraph component props
 */
export interface ParagraphProps
  extends A11yProps,
    Omit<HTMLAttributes<HTMLParagraphElement>, keyof A11yProps> {
  /** Children content */
  children?: ReactNode;
  /** Element ID */
  id?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
  /** Text size (defaults to 'base') */
  size?: ResponsiveValue<TextSize>;
  /** Font weight (defaults to 'normal') */
  weight?: ResponsiveValue<FontWeight>;
  /** Line height (defaults to 'relaxed' for improved readability) */
  leading?: ResponsiveValue<'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'>;
  /** Text color (Tailwind color class without 'text-' prefix, e.g., 'red-500', 'muted-foreground') */
  color?: string;
  /** Text alignment */
  align?: ResponsiveValue<'left' | 'center' | 'right' | 'justify'>;
  /** First line indent */
  indent?: boolean;
  /** Maximum width for optimal reading (adds max-w-prose) */
  prose?: boolean;
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
 * Text alignment to Tailwind class mapping
 */
const TEXT_ALIGN_MAP: Record<'left' | 'center' | 'right' | 'justify', string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
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
 * Paragraph - Semantic paragraph primitive
 *
 * The foundational building block for paragraph content. Provides:
 * - Semantic `<p>` element for proper document structure
 * - Default 'relaxed' line height for improved readability
 * - Responsive text size and line height
 * - Optional max-width for optimal reading length
 * - Full ARIA attribute support
 * - Tailwind className merging
 *
 * @example
 * // Basic paragraph
 * <Paragraph>
 *   Lorem ipsum dolor sit amet, consectetur adipiscing elit.
 * </Paragraph>
 *
 * // With custom styling
 * <Paragraph size="lg" leading="loose" color="muted-foreground">
 *   A paragraph with larger text and loose line height.
 * </Paragraph>
 *
 * // Responsive sizing
 * <Paragraph size={{ base: 'sm', md: 'base', lg: 'lg' }}>
 *   Responsive paragraph text
 * </Paragraph>
 *
 * // With optimal reading width
 * <Paragraph prose>
 *   This paragraph has max-w-prose for optimal reading length.
 * </Paragraph>
 *
 * // Justified text with indent
 * <Paragraph align="justify" indent>
 *   This paragraph is justified with first-line indent.
 * </Paragraph>
 */
export const Paragraph = forwardRef<HTMLParagraphElement, ParagraphProps>(function Paragraph(
  {
    children,
    className,
    style,
    id,
    'data-testid': dataTestId,
    // Typography props
    size = 'base',
    weight,
    leading = 'relaxed',
    color,
    align,
    indent,
    prose,
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

  // Leading classes
  if (leading !== undefined) {
    typographyClasses.push(...getResponsiveClasses(leading, LEADING_MAP));
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

  // Alignment
  if (align !== undefined) {
    typographyClasses.push(...getResponsiveClasses(align, TEXT_ALIGN_MAP));
  }

  // First line indent
  if (indent) {
    typographyClasses.push('indent-8');
  }

  // Prose width for optimal reading
  if (prose) {
    typographyClasses.push('max-w-prose');
  }

  return (
    <p
      ref={ref}
      id={id}
      data-testid={dataTestId}
      className={cn(...typographyClasses, className)}
      style={style}
      {...restProps}
    >
      {children}
    </p>
  );
});

Paragraph.displayName = 'Paragraph';
