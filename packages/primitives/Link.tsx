/**
 * Link Primitive - Anchor wrapper with external link handling and focus ring styles
 *
 * The foundational link primitive that wraps `<a>` elements with:
 * - Automatic security attributes for external links (rel="noopener noreferrer")
 * - Customizable underline behavior (always, on hover, or none)
 * - Typography props (size, weight, color)
 * - Focus ring styles for keyboard accessibility
 * - ARIA attribute forwarding
 * - className merging with Tailwind conflict resolution
 *
 * @example
 * // Basic internal link
 * <Link href="/about">About Us</Link>
 *
 * // External link (automatically adds security attributes)
 * <Link href="https://github.com" external>GitHub</Link>
 *
 * // Styled link
 * <Link href="/contact" color="primary" underline="hover">Contact</Link>
 */

import { cn } from '@openflow/utils';
import { type AnchorHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { getResponsiveClasses } from './Text';
import type { A11yProps, FontWeight, ResponsiveValue, TextSize } from './types';

/**
 * Underline behavior options
 */
export type LinkUnderline = 'always' | 'hover' | 'none';

/**
 * Link component props
 */
export interface LinkProps
  extends A11yProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof A11yProps> {
  /** Link URL (required) */
  href: string;
  /** Children content */
  children?: ReactNode;
  /** Element ID */
  id?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
  /** Whether link opens in new tab (adds target="_blank" and security attributes) */
  external?: boolean;
  /** Underline behavior: 'always', 'hover', or 'none' (defaults to 'hover') */
  underline?: LinkUnderline;
  /** Text size */
  size?: ResponsiveValue<TextSize>;
  /** Font weight */
  weight?: ResponsiveValue<FontWeight>;
  /** Text color (Tailwind color class without 'text-' prefix, e.g., 'blue-500', 'primary') */
  color?: string;
  /** Whether the link is disabled (visual + prevents navigation) */
  disabled?: boolean;
}

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
 * Generate color class from color prop
 */
function getColorClass(color: string): string {
  // Check if it's a CSS variable pattern (e.g., "muted-foreground", "primary")
  // vs standard Tailwind color (e.g., "red-500", "blue-600")
  const isStandardTailwind = /^[a-z]+-\d{2,3}$/.test(color);
  if (isStandardTailwind) {
    return `text-${color}`;
  }
  // CSS variable pattern
  return `text-[rgb(var(--${color}))]`;
}

/**
 * Generate underline classes based on underline prop
 */
function getUnderlineClasses(underline: LinkUnderline): string[] {
  switch (underline) {
    case 'always':
      return ['underline', 'underline-offset-4'];
    case 'hover':
      return ['no-underline', 'hover:underline', 'underline-offset-4'];
    case 'none':
      return ['no-underline'];
  }
}

/**
 * Generate disabled classes
 */
function getDisabledClasses(disabled: boolean): string[] {
  if (disabled) {
    return ['opacity-50', 'cursor-not-allowed', 'pointer-events-none'];
  }
  return [];
}

/**
 * Link - Anchor element primitive
 *
 * A semantic anchor element wrapper with security defaults and accessibility features.
 * Provides consistent styling and automatic handling of external links.
 *
 * @example
 * // Internal navigation link
 * <Link href="/dashboard">Go to Dashboard</Link>
 *
 * // External link with new tab
 * <Link href="https://docs.example.com" external>
 *   Read Documentation
 * </Link>
 *
 * // Styled link with custom appearance
 * <Link
 *   href="/contact"
 *   size="lg"
 *   weight="semibold"
 *   color="primary"
 *   underline="hover"
 * >
 *   Contact Us
 * </Link>
 *
 * // Link in body text
 * <Paragraph>
 *   Visit our <Link href="/privacy">privacy policy</Link> for more information.
 * </Paragraph>
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    href,
    children,
    className,
    style,
    id,
    'data-testid': dataTestId,
    // Link-specific props
    external = false,
    underline = 'hover',
    size,
    weight,
    color,
    disabled = false,
    // Native anchor props that we handle specially
    target,
    rel,
    onClick,
    // Rest props include A11y and native HTML attributes
    ...restProps
  },
  ref
) {
  // Build classes
  const linkClasses: string[] = [];

  // Base link styling - focus ring for accessibility
  linkClasses.push(
    'rounded',
    'focus:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-[rgb(var(--ring))]',
    'focus-visible:ring-offset-2',
    'transition-colors'
  );

  // Size classes
  if (size !== undefined) {
    linkClasses.push(...getResponsiveClasses(size, TEXT_SIZE_MAP));
  }

  // Weight classes
  if (weight !== undefined) {
    linkClasses.push(...getResponsiveClasses(weight, FONT_WEIGHT_MAP));
  }

  // Color class
  if (color) {
    linkClasses.push(getColorClass(color));
  }

  // Underline classes
  linkClasses.push(...getUnderlineClasses(underline));

  // Disabled classes
  linkClasses.push(...getDisabledClasses(disabled));

  // Handle external link attributes
  const externalProps: Record<string, string> = {};
  if (external) {
    externalProps.target = target || '_blank';
    // Security: prevent reverse tabnapping and referrer leaks
    externalProps.rel = rel || 'noopener noreferrer';
  } else if (target) {
    // If user manually sets target, respect it
    externalProps.target = target;
    if (rel) {
      externalProps.rel = rel;
    }
  }

  // Handle disabled click
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <a
      ref={ref}
      id={id}
      data-testid={dataTestId}
      href={disabled ? undefined : href}
      className={cn(...linkClasses, className)}
      style={style}
      onClick={handleClick}
      aria-disabled={disabled || undefined}
      {...externalProps}
      {...restProps}
    >
      {children}
    </a>
  );
});

Link.displayName = 'Link';
