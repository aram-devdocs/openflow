/**
 * Section Primitive - Semantic `<section>` landmark with required aria-label
 *
 * A section represents a thematic grouping of content. For accessibility,
 * sections MUST have an accessible name via aria-label or aria-labelledby.
 * This primitive enforces accessibility by making aria-label required.
 *
 * @example
 * // Basic usage with required aria-label
 * <Section aria-label="Features">
 *   <h2>Features</h2>
 *   <p>Content here...</p>
 * </Section>
 *
 * // With spacing props
 * <Section aria-label="Pricing" p="8" className="bg-gray-100">
 *   <h2>Pricing Plans</h2>
 * </Section>
 *
 * // With aria-labelledby instead (for visible headings)
 * <Section aria-label="Introduction" aria-labelledby="intro-heading">
 *   <h2 id="intro-heading">Introduction</h2>
 * </Section>
 */

import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import type { A11yProps, Breakpoint, ResponsiveValue, SpacingValue } from './types';

/**
 * Spacing props for Section component
 */
export interface SectionSpacingProps {
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
  /** Gap between children (when using flex/grid) */
  gap?: ResponsiveValue<SpacingValue>;
}

/**
 * Section component props
 *
 * IMPORTANT: aria-label is REQUIRED for accessibility.
 * Sections without accessible names are navigation landmarks that
 * screen reader users cannot identify or navigate to effectively.
 */
export interface SectionProps
  extends SectionSpacingProps,
    Omit<A11yProps, 'aria-label'>,
    Omit<HTMLAttributes<HTMLElement>, keyof A11yProps> {
  /**
   * Accessible label for the section (REQUIRED)
   *
   * This label is announced by screen readers when navigating landmarks.
   * Choose a concise, descriptive name that identifies the section's purpose.
   *
   * @example
   * aria-label="Product features"
   * aria-label="User testimonials"
   * aria-label="Contact form"
   */
  'aria-label': string;
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
const SPACING_PREFIX_MAP: Record<keyof SectionSpacingProps, string> = {
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
export function extractSpacingClasses(props: SectionSpacingProps): string[] {
  const classes: string[] = [];

  for (const [prop, prefix] of Object.entries(SPACING_PREFIX_MAP)) {
    const value = props[prop as keyof SectionSpacingProps];
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
 * Section - Semantic landmark primitive with required accessibility label
 *
 * The Section primitive wraps the HTML `<section>` element and enforces
 * accessibility best practices by requiring an aria-label. This ensures
 * that screen reader users can identify and navigate to sections effectively.
 *
 * According to WCAG and ARIA best practices, a `<section>` element should
 * have an accessible name to be exposed as a navigation landmark.
 *
 * @example
 * // Basic section with content
 * <Section aria-label="Featured Products">
 *   <h2>Featured Products</h2>
 *   <ProductGrid />
 * </Section>
 *
 * // Section with spacing
 * <Section aria-label="Newsletter" p={{ base: '4', md: '8' }} className="bg-primary">
 *   <NewsletterForm />
 * </Section>
 *
 * // Using aria-labelledby for visible heading (aria-label still required for TypeScript)
 * <Section aria-label="About Us" aria-labelledby="about-heading">
 *   <h2 id="about-heading">About Us</h2>
 *   <p>Company description...</p>
 * </Section>
 */
export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  {
    children,
    className,
    style,
    id,
    'data-testid': dataTestId,
    'aria-label': ariaLabel,
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

  return (
    <section
      ref={ref}
      id={id}
      data-testid={dataTestId}
      className={cn(...spacingClasses, className)}
      style={style}
      aria-label={ariaLabel}
      {...filteredProps}
    >
      {children}
    </section>
  );
});

Section.displayName = 'Section';
