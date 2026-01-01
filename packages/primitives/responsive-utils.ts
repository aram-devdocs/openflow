/**
 * Shared responsive utilities for generating breakpoint-aware Tailwind classes.
 *
 * These utilities are used across primitives and atoms to generate responsive
 * class strings from ResponsiveValue<T> props.
 *
 * @example
 * ```ts
 * // Generate responsive size classes
 * const classes = generateResponsiveClasses(
 *   size,
 *   SIZE_CLASSES,
 *   'base' // default key
 * );
 *
 * // Get base value for non-CSS usage (e.g., spinner size)
 * const baseSize = getResponsiveBaseValue(size, 'md');
 * ```
 */

import type { Breakpoint, ResponsiveValue } from './types';

/**
 * Ordered list of breakpoints for consistent class generation.
 * Classes are applied mobile-first, so base comes first.
 */
export const BREAKPOINT_ORDER: readonly Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/**
 * Generate responsive Tailwind classes from a ResponsiveValue and a class map.
 *
 * Handles both simple values (string) and responsive objects.
 * For responsive objects, generates breakpoint-prefixed classes (e.g., "md:text-lg").
 *
 * @param value - The responsive value (string or object with breakpoint keys)
 * @param classMap - Map from value to Tailwind class(es)
 * @param defaultValue - Optional default value if the input is undefined
 * @returns Array of class strings to be joined
 *
 * @example
 * ```ts
 * const SIZE_CLASSES = { sm: 'h-8 px-3', md: 'h-10 px-4', lg: 'h-12 px-6' };
 *
 * // Simple value: returns ['h-10 px-4']
 * generateResponsiveClasses('md', SIZE_CLASSES);
 *
 * // Responsive value: returns ['h-8 px-3', 'md:h-10', 'md:px-4', 'lg:h-12', 'lg:px-6']
 * generateResponsiveClasses({ base: 'sm', md: 'md', lg: 'lg' }, SIZE_CLASSES);
 * ```
 */
export function generateResponsiveClasses<T extends string>(
  value: ResponsiveValue<T> | undefined,
  classMap: Record<T, string>,
  defaultValue?: T
): string[] {
  const classes: string[] = [];

  // Handle undefined with optional default
  if (value === undefined) {
    if (defaultValue !== undefined) {
      const defaultClass = classMap[defaultValue];
      if (defaultClass) {
        classes.push(defaultClass);
      }
    }
    return classes;
  }

  if (typeof value === 'string') {
    // Simple non-responsive value
    const classValue = classMap[value];
    if (classValue) {
      classes.push(classValue);
    }
  } else if (typeof value === 'object' && value !== null) {
    // Responsive object value
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (value as Partial<Record<Breakpoint, T>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const classValue = classMap[breakpointValue];
        if (classValue) {
          // Split classes and add breakpoint prefix to each
          const individualClasses = classValue.split(' ');
          for (const cls of individualClasses) {
            if (breakpoint === 'base') {
              classes.push(cls);
            } else {
              classes.push(`${breakpoint}:${cls}`);
            }
          }
        }
      }
    }
  }

  return classes;
}

/**
 * Get the base (non-responsive) value from a ResponsiveValue.
 *
 * For responsive objects, returns the 'base' breakpoint value.
 * Falls back to the provided default if no base value is found.
 *
 * @param value - The responsive value
 * @param defaultValue - Default to return if no base value exists
 * @returns The base value
 *
 * @example
 * ```ts
 * // Simple value: returns 'md'
 * getResponsiveBaseValue('md', 'sm');
 *
 * // Responsive with base: returns 'lg'
 * getResponsiveBaseValue({ base: 'lg', md: 'xl' }, 'sm');
 *
 * // Responsive without base: returns default 'sm'
 * getResponsiveBaseValue({ md: 'lg' }, 'sm');
 * ```
 */
export function getResponsiveBaseValue<T>(
  value: ResponsiveValue<T> | undefined,
  defaultValue: T
): T {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value === 'object' && value !== null) {
    return (value as Partial<Record<Breakpoint, T>>).base ?? defaultValue;
  }

  return value;
}

/**
 * Check if a value is a responsive object (has breakpoint keys).
 *
 * @param value - The value to check
 * @returns true if the value is a responsive object
 */
export function isResponsiveObject<T>(
  value: ResponsiveValue<T> | undefined
): value is Partial<Record<Breakpoint, T>> {
  return typeof value === 'object' && value !== null;
}

/**
 * Generate a single responsive class string with optional breakpoint prefix.
 *
 * @param baseClass - The base class without breakpoint prefix
 * @param breakpoint - The breakpoint to prefix with (or 'base' for no prefix)
 * @returns The class string, optionally prefixed
 *
 * @example
 * ```ts
 * prefixWithBreakpoint('text-lg', 'base'); // 'text-lg'
 * prefixWithBreakpoint('text-lg', 'md');   // 'md:text-lg'
 * ```
 */
export function prefixWithBreakpoint(baseClass: string, breakpoint: Breakpoint): string {
  if (breakpoint === 'base') {
    return baseClass;
  }
  return `${breakpoint}:${baseClass}`;
}
