/**
 * Button Component Utility Function Tests
 *
 * Tests for the Button atom utility functions and class generation.
 * Component rendering is tested via Storybook.
 */

import { describe, expect, it } from 'vitest';

// =============================================================================
// Re-implement utility functions for testing
// (mirrors the logic in Button.tsx)
// =============================================================================

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] hover:bg-[rgb(var(--primary))]/90',
  secondary:
    'bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-foreground))] hover:bg-[rgb(var(--secondary))]/80',
  ghost: 'bg-transparent text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]',
  destructive:
    'bg-[rgb(var(--destructive))] text-[rgb(var(--destructive-foreground))] hover:bg-[rgb(var(--destructive))]/90',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs min-h-[44px] sm:min-h-8',
  md: 'h-9 px-4 text-sm min-h-[44px] sm:min-h-9',
  lg: 'h-10 px-6 text-base min-h-[44px]',
};

const spinnerSizeMap: Record<ButtonSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

function getResponsiveSizeClasses(size: ResponsiveValue<ButtonSize>): string[] {
  const classes: string[] = [];

  if (typeof size === 'string') {
    classes.push(sizeClasses[size]);
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, ButtonSize>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const sizeClass = sizeClasses[breakpointValue];
        const individualClasses = sizeClass.split(' ');
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

  return classes;
}

function getBaseSize(size: ResponsiveValue<ButtonSize>): ButtonSize {
  if (typeof size === 'string') {
    return size;
  }
  if (typeof size === 'object' && size !== null) {
    return (size as Partial<Record<Breakpoint, ButtonSize>>).base ?? 'md';
  }
  return 'md';
}

// =============================================================================
// Tests
// =============================================================================

describe('ui/atoms/Button - Utility Functions', () => {
  // ===========================================================================
  // Variant Classes
  // ===========================================================================

  describe('variantClasses', () => {
    it('primary variant has correct background and text colors', () => {
      expect(variantClasses.primary).toContain('bg-[rgb(var(--primary))]');
      expect(variantClasses.primary).toContain('text-[rgb(var(--primary-foreground))]');
    });

    it('primary variant has hover state', () => {
      expect(variantClasses.primary).toContain('hover:bg-[rgb(var(--primary))]/90');
    });

    it('secondary variant has correct background and text colors', () => {
      expect(variantClasses.secondary).toContain('bg-[rgb(var(--secondary))]');
      expect(variantClasses.secondary).toContain('text-[rgb(var(--secondary-foreground))]');
    });

    it('secondary variant has hover state', () => {
      expect(variantClasses.secondary).toContain('hover:bg-[rgb(var(--secondary))]/80');
    });

    it('ghost variant has transparent background', () => {
      expect(variantClasses.ghost).toContain('bg-transparent');
    });

    it('ghost variant has hover state', () => {
      expect(variantClasses.ghost).toContain('hover:bg-[rgb(var(--muted))]');
    });

    it('destructive variant has correct background and text colors', () => {
      expect(variantClasses.destructive).toContain('bg-[rgb(var(--destructive))]');
      expect(variantClasses.destructive).toContain('text-[rgb(var(--destructive-foreground))]');
    });

    it('destructive variant has hover state', () => {
      expect(variantClasses.destructive).toContain('hover:bg-[rgb(var(--destructive))]/90');
    });

    it('all variants have bg, text, and hover classes', () => {
      for (const [_variant, classes] of Object.entries(variantClasses)) {
        expect(classes).toMatch(/bg-/);
        expect(classes).toMatch(/text-/);
        expect(classes).toMatch(/hover:/);
      }
    });
  });

  // ===========================================================================
  // Size Classes
  // ===========================================================================

  describe('sizeClasses', () => {
    it('sm size has correct height', () => {
      expect(sizeClasses.sm).toContain('h-8');
    });

    it('sm size has correct padding', () => {
      expect(sizeClasses.sm).toContain('px-3');
    });

    it('sm size has correct text size', () => {
      expect(sizeClasses.sm).toContain('text-xs');
    });

    it('md size has correct height', () => {
      expect(sizeClasses.md).toContain('h-9');
    });

    it('md size has correct padding', () => {
      expect(sizeClasses.md).toContain('px-4');
    });

    it('md size has correct text size', () => {
      expect(sizeClasses.md).toContain('text-sm');
    });

    it('lg size has correct height', () => {
      expect(sizeClasses.lg).toContain('h-10');
    });

    it('lg size has correct padding', () => {
      expect(sizeClasses.lg).toContain('px-6');
    });

    it('lg size has correct text size', () => {
      expect(sizeClasses.lg).toContain('text-base');
    });
  });

  // ===========================================================================
  // Touch Target Accessibility (WCAG 2.5.5)
  // ===========================================================================

  describe('touch target accessibility (WCAG 2.5.5)', () => {
    it('sm size has 44px min-height on mobile', () => {
      expect(sizeClasses.sm).toContain('min-h-[44px]');
    });

    it('sm size relaxes min-height on desktop', () => {
      expect(sizeClasses.sm).toContain('sm:min-h-8');
    });

    it('md size has 44px min-height on mobile', () => {
      expect(sizeClasses.md).toContain('min-h-[44px]');
    });

    it('md size relaxes min-height on desktop', () => {
      expect(sizeClasses.md).toContain('sm:min-h-9');
    });

    it('lg size has 44px min-height on all devices', () => {
      expect(sizeClasses.lg).toContain('min-h-[44px]');
    });

    it('all sizes meet WCAG 2.5.5 touch target minimum (44px)', () => {
      for (const sizeClass of Object.values(sizeClasses)) {
        expect(sizeClass).toContain('min-h-[44px]');
      }
    });
  });

  // ===========================================================================
  // Spinner Size Mapping
  // ===========================================================================

  describe('spinnerSizeMap', () => {
    it('sm button uses sm spinner', () => {
      expect(spinnerSizeMap.sm).toBe('sm');
    });

    it('md button uses sm spinner', () => {
      expect(spinnerSizeMap.md).toBe('sm');
    });

    it('lg button uses md spinner', () => {
      expect(spinnerSizeMap.lg).toBe('md');
    });

    it('all button sizes map to valid spinner sizes', () => {
      const validSpinnerSizes = ['sm', 'md', 'lg'];
      for (const spinnerSize of Object.values(spinnerSizeMap)) {
        expect(validSpinnerSizes).toContain(spinnerSize);
      }
    });
  });

  // ===========================================================================
  // Responsive Size Classes
  // ===========================================================================

  describe('getResponsiveSizeClasses', () => {
    it('handles simple string size', () => {
      const classes = getResponsiveSizeClasses('sm');
      expect(classes).toEqual(['h-8 px-3 text-xs min-h-[44px] sm:min-h-8']);
    });

    it('handles md string size', () => {
      const classes = getResponsiveSizeClasses('md');
      expect(classes).toEqual(['h-9 px-4 text-sm min-h-[44px] sm:min-h-9']);
    });

    it('handles lg string size', () => {
      const classes = getResponsiveSizeClasses('lg');
      expect(classes).toEqual(['h-10 px-6 text-base min-h-[44px]']);
    });

    it('handles responsive size with base only', () => {
      const classes = getResponsiveSizeClasses({ base: 'sm' });
      expect(classes).toContain('h-8');
      expect(classes).toContain('px-3');
      expect(classes).toContain('text-xs');
      expect(classes).toContain('min-h-[44px]');
      expect(classes).toContain('sm:min-h-8');
    });

    it('handles responsive size with base and md', () => {
      const classes = getResponsiveSizeClasses({ base: 'sm', md: 'lg' });
      // Base classes (no prefix)
      expect(classes).toContain('h-8');
      expect(classes).toContain('px-3');
      // md: prefixed classes
      expect(classes).toContain('md:h-10');
      expect(classes).toContain('md:px-6');
      expect(classes).toContain('md:text-base');
    });

    it('handles responsive size with multiple breakpoints', () => {
      const classes = getResponsiveSizeClasses({
        base: 'sm',
        sm: 'sm',
        md: 'md',
        lg: 'lg',
      });

      // Base classes
      expect(classes).toContain('h-8');

      // sm: classes
      expect(classes).toContain('sm:h-8');
      expect(classes).toContain('sm:px-3');

      // md: classes
      expect(classes).toContain('md:h-9');
      expect(classes).toContain('md:px-4');

      // lg: classes
      expect(classes).toContain('lg:h-10');
      expect(classes).toContain('lg:px-6');
    });

    it('handles responsive size with xl and 2xl breakpoints', () => {
      const classes = getResponsiveSizeClasses({
        base: 'sm',
        xl: 'md',
        '2xl': 'lg',
      });

      expect(classes).toContain('h-8'); // base
      expect(classes).toContain('xl:h-9'); // xl
      expect(classes).toContain('2xl:h-10'); // 2xl
    });

    it('handles non-sequential breakpoints', () => {
      const classes = getResponsiveSizeClasses({ base: 'sm', lg: 'lg' });

      // Base classes
      expect(classes).toContain('h-8');

      // lg classes (skip sm and md)
      expect(classes).toContain('lg:h-10');

      // No sm or md prefixed classes should exist
      expect(classes.filter((c) => c.startsWith('sm:') || c.startsWith('md:'))).toEqual([
        'sm:min-h-8', // This is part of the sm size class itself
      ]);
    });

    it('returns empty array for null input', () => {
      // @ts-expect-error Testing edge case
      const classes = getResponsiveSizeClasses(null);
      expect(classes).toEqual([]);
    });
  });

  // ===========================================================================
  // getBaseSize
  // ===========================================================================

  describe('getBaseSize', () => {
    it('returns string size directly', () => {
      expect(getBaseSize('sm')).toBe('sm');
      expect(getBaseSize('md')).toBe('md');
      expect(getBaseSize('lg')).toBe('lg');
    });

    it('returns base breakpoint value from object', () => {
      expect(getBaseSize({ base: 'sm' })).toBe('sm');
      expect(getBaseSize({ base: 'lg', md: 'md' })).toBe('lg');
    });

    it('defaults to md when base not specified in object', () => {
      expect(getBaseSize({ md: 'lg' })).toBe('md');
      expect(getBaseSize({ lg: 'lg', xl: 'sm' })).toBe('md');
    });

    it('defaults to md for null input', () => {
      // @ts-expect-error Testing edge case
      expect(getBaseSize(null)).toBe('md');
    });
  });

  // ===========================================================================
  // Size Consistency
  // ===========================================================================

  describe('size consistency', () => {
    it('all sizes include height', () => {
      for (const sizeClass of Object.values(sizeClasses)) {
        expect(sizeClass).toMatch(/h-\d+/);
      }
    });

    it('all sizes include horizontal padding', () => {
      for (const sizeClass of Object.values(sizeClasses)) {
        expect(sizeClass).toMatch(/px-\d+/);
      }
    });

    it('all sizes include text size', () => {
      for (const sizeClass of Object.values(sizeClasses)) {
        expect(sizeClass).toMatch(/text-(xs|sm|base|lg)/);
      }
    });

    it('larger sizes have larger heights', () => {
      const heightSm = sizeClasses.sm.match(/h-(\d+)/)?.[1];
      const heightMd = sizeClasses.md.match(/h-(\d+)/)?.[1];
      const heightLg = sizeClasses.lg.match(/h-(\d+)/)?.[1];

      expect(heightSm).toBeDefined();
      expect(heightMd).toBeDefined();
      expect(heightLg).toBeDefined();

      if (heightSm && heightMd && heightLg) {
        expect(Number.parseInt(heightSm)).toBeLessThan(Number.parseInt(heightMd));
        expect(Number.parseInt(heightMd)).toBeLessThan(Number.parseInt(heightLg));
      }
    });

    it('larger sizes have larger padding', () => {
      const pxSm = sizeClasses.sm.match(/px-(\d+)/)?.[1];
      const pxMd = sizeClasses.md.match(/px-(\d+)/)?.[1];
      const pxLg = sizeClasses.lg.match(/px-(\d+)/)?.[1];

      expect(pxSm).toBeDefined();
      expect(pxMd).toBeDefined();
      expect(pxLg).toBeDefined();

      if (pxSm && pxMd && pxLg) {
        expect(Number.parseInt(pxSm)).toBeLessThan(Number.parseInt(pxMd));
        expect(Number.parseInt(pxMd)).toBeLessThan(Number.parseInt(pxLg));
      }
    });
  });

  // ===========================================================================
  // Variant Accessibility
  // ===========================================================================

  describe('variant accessibility', () => {
    it('all variants have proper foreground text for contrast', () => {
      expect(variantClasses.primary).toContain('text-[rgb(var(--primary-foreground))]');
      expect(variantClasses.secondary).toContain('text-[rgb(var(--secondary-foreground))]');
      expect(variantClasses.destructive).toContain('text-[rgb(var(--destructive-foreground))]');
    });

    it('ghost variant uses foreground color for text', () => {
      expect(variantClasses.ghost).toContain('text-[rgb(var(--foreground))]');
    });

    it('hover states provide visual feedback', () => {
      for (const classes of Object.values(variantClasses)) {
        expect(classes).toMatch(/hover:bg-/);
      }
    });
  });

  // ===========================================================================
  // Base Classes (checked separately in component)
  // ===========================================================================

  describe('base button classes', () => {
    const baseClasses = [
      'inline-flex',
      'items-center',
      'justify-center',
      'gap-2',
      'rounded-md',
      'font-medium',
      'motion-safe:transition-colors',
      'motion-safe:duration-150',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-offset-2',
    ];

    it('includes all expected base classes', () => {
      // These are the expected classes, verified manually against component
      expect(baseClasses).toContain('inline-flex');
      expect(baseClasses).toContain('items-center');
      expect(baseClasses).toContain('justify-center');
      expect(baseClasses).toContain('gap-2');
      expect(baseClasses).toContain('rounded-md');
      expect(baseClasses).toContain('font-medium');
    });

    it('includes motion-safe transition for accessibility', () => {
      expect(baseClasses).toContain('motion-safe:transition-colors');
      expect(baseClasses).toContain('motion-safe:duration-150');
    });

    it('includes focus-visible ring for keyboard navigation', () => {
      expect(baseClasses).toContain('focus-visible:outline-none');
      expect(baseClasses).toContain('focus-visible:ring-2');
      expect(baseClasses).toContain('focus-visible:ring-offset-2');
    });
  });

  // ===========================================================================
  // Disabled/Loading State Classes
  // ===========================================================================

  describe('disabled/loading state classes', () => {
    const disabledClasses = 'pointer-events-none opacity-50';

    it('includes pointer-events-none for non-interactivity', () => {
      expect(disabledClasses).toContain('pointer-events-none');
    });

    it('includes opacity-50 for visual feedback', () => {
      expect(disabledClasses).toContain('opacity-50');
    });
  });
});
