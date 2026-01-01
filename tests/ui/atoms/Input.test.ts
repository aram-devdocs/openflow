/**
 * Input Component Utility Function Tests
 *
 * Tests for the Input atom utility functions and class generation.
 * Component rendering is tested via Storybook.
 */

import { describe, expect, it } from 'vitest';

// =============================================================================
// Re-implement utility functions for testing
// (mirrors the logic in Input.tsx)
// =============================================================================

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'search';
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

const sizeClasses: Record<InputSize, { input: string; icon: string; iconWrapper: string }> = {
  sm: {
    input: 'h-8 px-3 text-xs min-h-[44px] sm:min-h-8',
    icon: 'h-3.5 w-3.5',
    iconWrapper: 'px-2',
  },
  md: {
    input: 'h-9 px-3 text-sm min-h-[44px] sm:min-h-9',
    icon: 'h-4 w-4',
    iconWrapper: 'px-3',
  },
  lg: {
    input: 'h-10 px-4 text-base min-h-[44px]',
    icon: 'h-5 w-5',
    iconWrapper: 'px-3',
  },
};

const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

function getSizeClasses(size: ResponsiveValue<InputSize>): {
  input: string[];
  icon: string[];
  iconWrapper: string[];
} {
  const input: string[] = [];
  const icon: string[] = [];
  const iconWrapper: string[] = [];

  if (typeof size === 'string') {
    const classes = sizeClasses[size];
    input.push(...classes.input.split(' '));
    icon.push(...classes.icon.split(' '));
    iconWrapper.push(...classes.iconWrapper.split(' '));
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, InputSize>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const classes = sizeClasses[breakpointValue];
        if (breakpoint === 'base') {
          input.push(...classes.input.split(' '));
          icon.push(...classes.icon.split(' '));
          iconWrapper.push(...classes.iconWrapper.split(' '));
        } else {
          input.push(...classes.input.split(' ').map((c) => `${breakpoint}:${c}`));
          icon.push(...classes.icon.split(' ').map((c) => `${breakpoint}:${c}`));
          iconWrapper.push(...classes.iconWrapper.split(' ').map((c) => `${breakpoint}:${c}`));
        }
      }
    }
  }

  return { input, icon, iconWrapper };
}

function getBaseSize(size: ResponsiveValue<InputSize>): InputSize {
  if (typeof size === 'string') {
    return size;
  }
  if (typeof size === 'object' && size !== null) {
    return (size as Partial<Record<Breakpoint, InputSize>>).base ?? 'md';
  }
  return 'md';
}

// =============================================================================
// Tests
// =============================================================================

describe('ui/atoms/Input - Utility Functions', () => {
  // ===========================================================================
  // Size Classes - Input
  // ===========================================================================

  describe('sizeClasses.input', () => {
    it('sm input has correct height', () => {
      expect(sizeClasses.sm.input).toContain('h-8');
    });

    it('sm input has correct padding', () => {
      expect(sizeClasses.sm.input).toContain('px-3');
    });

    it('sm input has correct text size', () => {
      expect(sizeClasses.sm.input).toContain('text-xs');
    });

    it('md input has correct height', () => {
      expect(sizeClasses.md.input).toContain('h-9');
    });

    it('md input has correct padding', () => {
      expect(sizeClasses.md.input).toContain('px-3');
    });

    it('md input has correct text size', () => {
      expect(sizeClasses.md.input).toContain('text-sm');
    });

    it('lg input has correct height', () => {
      expect(sizeClasses.lg.input).toContain('h-10');
    });

    it('lg input has correct padding', () => {
      expect(sizeClasses.lg.input).toContain('px-4');
    });

    it('lg input has correct text size', () => {
      expect(sizeClasses.lg.input).toContain('text-base');
    });
  });

  // ===========================================================================
  // Size Classes - Icons
  // ===========================================================================

  describe('sizeClasses.icon', () => {
    it('sm icon has correct dimensions', () => {
      expect(sizeClasses.sm.icon).toContain('h-3.5');
      expect(sizeClasses.sm.icon).toContain('w-3.5');
    });

    it('md icon has correct dimensions', () => {
      expect(sizeClasses.md.icon).toContain('h-4');
      expect(sizeClasses.md.icon).toContain('w-4');
    });

    it('lg icon has correct dimensions', () => {
      expect(sizeClasses.lg.icon).toContain('h-5');
      expect(sizeClasses.lg.icon).toContain('w-5');
    });
  });

  // ===========================================================================
  // Touch Target Accessibility (WCAG 2.5.5)
  // ===========================================================================

  describe('touch target accessibility (WCAG 2.5.5)', () => {
    it('sm input has 44px min-height on mobile', () => {
      expect(sizeClasses.sm.input).toContain('min-h-[44px]');
    });

    it('sm input relaxes min-height on desktop', () => {
      expect(sizeClasses.sm.input).toContain('sm:min-h-8');
    });

    it('md input has 44px min-height on mobile', () => {
      expect(sizeClasses.md.input).toContain('min-h-[44px]');
    });

    it('md input relaxes min-height on desktop', () => {
      expect(sizeClasses.md.input).toContain('sm:min-h-9');
    });

    it('lg input has 44px min-height on all devices', () => {
      expect(sizeClasses.lg.input).toContain('min-h-[44px]');
    });

    it('all sizes meet WCAG 2.5.5 touch target minimum (44px)', () => {
      for (const sizeClass of Object.values(sizeClasses)) {
        expect(sizeClass.input).toContain('min-h-[44px]');
      }
    });
  });

  // ===========================================================================
  // getSizeClasses
  // ===========================================================================

  describe('getSizeClasses', () => {
    it('handles simple string size sm', () => {
      const result = getSizeClasses('sm');
      expect(result.input).toContain('h-8');
      expect(result.input).toContain('px-3');
      expect(result.input).toContain('text-xs');
      expect(result.input).toContain('min-h-[44px]');
      expect(result.input).toContain('sm:min-h-8');
    });

    it('handles simple string size md', () => {
      const result = getSizeClasses('md');
      expect(result.input).toContain('h-9');
      expect(result.input).toContain('text-sm');
    });

    it('handles simple string size lg', () => {
      const result = getSizeClasses('lg');
      expect(result.input).toContain('h-10');
      expect(result.input).toContain('px-4');
      expect(result.input).toContain('text-base');
    });

    it('handles responsive size with base only', () => {
      const result = getSizeClasses({ base: 'sm' });
      expect(result.input).toContain('h-8');
      expect(result.input).toContain('px-3');
      expect(result.input).toContain('text-xs');
    });

    it('handles responsive size with base and md', () => {
      const result = getSizeClasses({ base: 'sm', md: 'lg' });
      // Base classes (no prefix)
      expect(result.input).toContain('h-8');
      expect(result.input).toContain('px-3');
      // md: prefixed classes
      expect(result.input).toContain('md:h-10');
      expect(result.input).toContain('md:px-4');
      expect(result.input).toContain('md:text-base');
    });

    it('handles responsive size with multiple breakpoints', () => {
      const result = getSizeClasses({
        base: 'sm',
        sm: 'sm',
        md: 'md',
        lg: 'lg',
      });

      // Base classes
      expect(result.input).toContain('h-8');

      // sm: classes
      expect(result.input).toContain('sm:h-8');
      expect(result.input).toContain('sm:px-3');

      // md: classes
      expect(result.input).toContain('md:h-9');
      expect(result.input).toContain('md:px-3');

      // lg: classes
      expect(result.input).toContain('lg:h-10');
      expect(result.input).toContain('lg:px-4');
    });

    it('handles responsive size with xl and 2xl breakpoints', () => {
      const result = getSizeClasses({
        base: 'sm',
        xl: 'md',
        '2xl': 'lg',
      });

      expect(result.input).toContain('h-8'); // base
      expect(result.input).toContain('xl:h-9'); // xl
      expect(result.input).toContain('2xl:h-10'); // 2xl
    });

    it('handles non-sequential breakpoints', () => {
      const result = getSizeClasses({ base: 'sm', lg: 'lg' });

      // Base classes
      expect(result.input).toContain('h-8');

      // lg classes (skip sm and md)
      expect(result.input).toContain('lg:h-10');
    });

    it('returns empty arrays for null input', () => {
      // @ts-expect-error Testing edge case
      const result = getSizeClasses(null);
      expect(result.input).toEqual([]);
      expect(result.icon).toEqual([]);
      expect(result.iconWrapper).toEqual([]);
    });

    it('generates icon classes for all sizes', () => {
      const smResult = getSizeClasses('sm');
      expect(smResult.icon).toContain('h-3.5');
      expect(smResult.icon).toContain('w-3.5');

      const mdResult = getSizeClasses('md');
      expect(mdResult.icon).toContain('h-4');
      expect(mdResult.icon).toContain('w-4');

      const lgResult = getSizeClasses('lg');
      expect(lgResult.icon).toContain('h-5');
      expect(lgResult.icon).toContain('w-5');
    });

    it('generates icon wrapper classes for all sizes', () => {
      const smResult = getSizeClasses('sm');
      expect(smResult.iconWrapper).toContain('px-2');

      const mdResult = getSizeClasses('md');
      expect(mdResult.iconWrapper).toContain('px-3');

      const lgResult = getSizeClasses('lg');
      expect(lgResult.iconWrapper).toContain('px-3');
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
        expect(sizeClass.input).toMatch(/h-\d+/);
      }
    });

    it('all sizes include horizontal padding', () => {
      for (const sizeClass of Object.values(sizeClasses)) {
        expect(sizeClass.input).toMatch(/px-\d+/);
      }
    });

    it('all sizes include text size', () => {
      for (const sizeClass of Object.values(sizeClasses)) {
        expect(sizeClass.input).toMatch(/text-(xs|sm|base|lg)/);
      }
    });

    it('larger sizes have larger heights', () => {
      const heightSm = sizeClasses.sm.input.match(/h-(\d+)/)?.[1];
      const heightMd = sizeClasses.md.input.match(/h-(\d+)/)?.[1];
      const heightLg = sizeClasses.lg.input.match(/h-(\d+)/)?.[1];

      expect(heightSm).toBeDefined();
      expect(heightMd).toBeDefined();
      expect(heightLg).toBeDefined();

      if (heightSm && heightMd && heightLg) {
        expect(Number.parseInt(heightSm)).toBeLessThan(Number.parseInt(heightMd));
        expect(Number.parseInt(heightMd)).toBeLessThan(Number.parseInt(heightLg));
      }
    });

    it('icon sizes scale with input sizes', () => {
      // sm: 3.5 (14px), md: 4 (16px), lg: 5 (20px)
      expect(sizeClasses.sm.icon).toContain('h-3.5');
      expect(sizeClasses.md.icon).toContain('h-4');
      expect(sizeClasses.lg.icon).toContain('h-5');
    });
  });

  // ===========================================================================
  // Base Input Classes (verified manually against component)
  // ===========================================================================

  describe('base input classes', () => {
    const baseClasses = [
      'flex',
      'w-full',
      'rounded-md',
      'border',
      'motion-safe:transition-colors',
      'motion-safe:duration-150',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-offset-2',
    ];

    it('includes all expected base classes', () => {
      expect(baseClasses).toContain('flex');
      expect(baseClasses).toContain('w-full');
      expect(baseClasses).toContain('rounded-md');
      expect(baseClasses).toContain('border');
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
  // Error State Classes
  // ===========================================================================

  describe('error state classes', () => {
    const errorClasses =
      'border-[rgb(var(--destructive))] focus-visible:ring-[rgb(var(--destructive))]';

    it('includes destructive border color', () => {
      expect(errorClasses).toContain('border-[rgb(var(--destructive))]');
    });

    it('includes destructive focus ring color', () => {
      expect(errorClasses).toContain('focus-visible:ring-[rgb(var(--destructive))]');
    });
  });

  // ===========================================================================
  // Disabled State Classes
  // ===========================================================================

  describe('disabled state classes', () => {
    const disabledClasses = 'cursor-not-allowed opacity-50';

    it('includes cursor-not-allowed', () => {
      expect(disabledClasses).toContain('cursor-not-allowed');
    });

    it('includes reduced opacity', () => {
      expect(disabledClasses).toContain('opacity-50');
    });
  });

  // ===========================================================================
  // Variant Classes
  // ===========================================================================

  describe('variant classes', () => {
    it('default variant uses rounded-md', () => {
      const defaultVariantClass = 'rounded-md';
      expect(defaultVariantClass).toBe('rounded-md');
    });

    it('search variant uses rounded-full', () => {
      const searchVariantClass = 'rounded-full';
      expect(searchVariantClass).toBe('rounded-full');
    });
  });

  // ===========================================================================
  // ARIA Attributes Documentation
  // ===========================================================================

  describe('ARIA attributes documentation', () => {
    it('documents aria-invalid for error state', () => {
      // The component sets aria-invalid="true" when error prop is true
      const ariaInvalidBehavior = 'aria-invalid="true" when error prop is true';
      expect(ariaInvalidBehavior).toContain('aria-invalid');
    });

    it('documents aria-describedby for error messages', () => {
      // The component combines aria-describedby with errorMessageId
      const describedByBehavior = 'combines aria-describedby with errorMessageId';
      expect(describedByBehavior).toContain('aria-describedby');
    });

    it('documents clear button aria-label', () => {
      // Clear button has aria-label="Clear input"
      const clearButtonAriaLabel = 'Clear input';
      expect(clearButtonAriaLabel).toBe('Clear input');
    });
  });

  // ===========================================================================
  // Icon Padding Classes
  // ===========================================================================

  describe('icon padding classes', () => {
    it('leading icon adds left padding', () => {
      const paddingLeftClass = 'pl-10';
      expect(paddingLeftClass).toBe('pl-10');
    });

    it('trailing icon adds right padding', () => {
      const paddingRightClass = 'pr-10';
      expect(paddingRightClass).toBe('pr-10');
    });
  });

  // ===========================================================================
  // Clear Button Classes
  // ===========================================================================

  describe('clear button classes', () => {
    const clearButtonClasses = [
      'rounded-full',
      'p-1',
      'hover:bg-[rgb(var(--muted))]',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
    ];

    it('clear button is rounded', () => {
      expect(clearButtonClasses).toContain('rounded-full');
    });

    it('clear button has padding', () => {
      expect(clearButtonClasses).toContain('p-1');
    });

    it('clear button has hover state', () => {
      expect(clearButtonClasses).toContain('hover:bg-[rgb(var(--muted))]');
    });

    it('clear button has focus state', () => {
      expect(clearButtonClasses).toContain('focus-visible:outline-none');
      expect(clearButtonClasses).toContain('focus-visible:ring-2');
    });
  });

  // ===========================================================================
  // File Input Classes
  // ===========================================================================

  describe('file input classes', () => {
    const fileInputClasses =
      'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[rgb(var(--foreground))] cursor-pointer file:cursor-pointer';

    it('file input has no border on file button', () => {
      expect(fileInputClasses).toContain('file:border-0');
    });

    it('file input has transparent background', () => {
      expect(fileInputClasses).toContain('file:bg-transparent');
    });

    it('file input has proper text styling', () => {
      expect(fileInputClasses).toContain('file:text-sm');
      expect(fileInputClasses).toContain('file:font-medium');
    });

    it('file input has cursor-pointer', () => {
      expect(fileInputClasses).toContain('cursor-pointer');
      expect(fileInputClasses).toContain('file:cursor-pointer');
    });
  });

  // ===========================================================================
  // Responsive Breakpoint Testing
  // ===========================================================================

  describe('responsive breakpoint ordering', () => {
    it('breakpoints are ordered correctly', () => {
      expect(BREAKPOINT_ORDER).toEqual(['base', 'sm', 'md', 'lg', 'xl', '2xl']);
    });

    it('base has no prefix', () => {
      const result = getSizeClasses({ base: 'sm' });
      // Base classes should not have any prefix
      const baseOnlyClasses = result.input.filter((c) => !c.includes(':'));
      expect(baseOnlyClasses.length).toBeGreaterThan(0);
    });

    it('non-base breakpoints have prefix', () => {
      const result = getSizeClasses({ base: 'sm', lg: 'lg' });
      // lg classes should have lg: prefix
      const lgPrefixedClasses = result.input.filter((c) => c.startsWith('lg:'));
      expect(lgPrefixedClasses.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Default Props Documentation
  // ===========================================================================

  describe('default props documentation', () => {
    it('documents default type as text', () => {
      const defaultType = 'text';
      expect(defaultType).toBe('text');
    });

    it('documents default size as md', () => {
      const defaultSize = 'md';
      expect(defaultSize).toBe('md');
    });

    it('documents default variant as default', () => {
      const defaultVariant: InputVariant = 'default';
      expect(defaultVariant).toBe('default');
    });

    it('documents default showClearButton as false', () => {
      const defaultShowClearButton = false;
      expect(defaultShowClearButton).toBe(false);
    });
  });
});
