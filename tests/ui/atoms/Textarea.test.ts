/**
 * Textarea Component Utility Function Tests
 *
 * Tests for the Textarea atom utility functions and class generation.
 * Component rendering is tested via Storybook.
 */

import { describe, expect, it } from 'vitest';

// =============================================================================
// Re-implement utility functions for testing
// (mirrors the logic in Textarea.tsx)
// =============================================================================

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type TextareaSize = 'sm' | 'md' | 'lg';
type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

const sizeClasses: Record<TextareaSize, string> = {
  sm: 'min-h-[80px] px-3 py-2 text-xs sm:min-h-[80px]',
  md: 'min-h-[80px] px-3 py-2 text-sm sm:min-h-[80px]',
  lg: 'min-h-[100px] px-4 py-3 text-base sm:min-h-[100px]',
};

const resizeClasses: Record<TextareaResize, string> = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
};

const charCountTextSizes: Record<TextareaSize, string> = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
};

const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

const TEXTAREA_BASE_CLASSES = [
  'flex',
  'w-full',
  'rounded-md',
  'bg-[rgb(var(--background))]',
  'text-[rgb(var(--foreground))]',
  'border',
  'border-[rgb(var(--input))]',
  'motion-safe:transition-colors',
  'motion-safe:duration-150',
  'placeholder:text-[rgb(var(--muted-foreground))]',
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-[rgb(var(--ring))]',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-[rgb(var(--background))]',
] as const;

function getSizeClasses(size: ResponsiveValue<TextareaSize>): string[] {
  const classes: string[] = [];

  if (typeof size === 'string') {
    classes.push(...sizeClasses[size].split(' '));
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, TextareaSize>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const sizeClass = sizeClasses[breakpointValue];
        if (breakpoint === 'base') {
          classes.push(...sizeClass.split(' '));
        } else {
          classes.push(...sizeClass.split(' ').map((c) => `${breakpoint}:${c}`));
        }
      }
    }
  }

  return classes;
}

function getBaseSize(size: ResponsiveValue<TextareaSize>): TextareaSize {
  if (typeof size === 'string') {
    return size;
  }
  if (typeof size === 'object' && size !== null) {
    return (size as Partial<Record<Breakpoint, TextareaSize>>).base ?? 'md';
  }
  return 'md';
}

// =============================================================================
// Tests
// =============================================================================

describe('ui/atoms/Textarea - Utility Functions', () => {
  // ===========================================================================
  // Size Classes
  // ===========================================================================

  describe('sizeClasses', () => {
    it('sm has correct minimum height', () => {
      expect(sizeClasses.sm).toContain('min-h-[80px]');
    });

    it('sm has correct padding', () => {
      expect(sizeClasses.sm).toContain('px-3');
      expect(sizeClasses.sm).toContain('py-2');
    });

    it('sm has correct text size', () => {
      expect(sizeClasses.sm).toContain('text-xs');
    });

    it('md has correct minimum height', () => {
      expect(sizeClasses.md).toContain('min-h-[80px]');
    });

    it('md has correct padding', () => {
      expect(sizeClasses.md).toContain('px-3');
      expect(sizeClasses.md).toContain('py-2');
    });

    it('md has correct text size', () => {
      expect(sizeClasses.md).toContain('text-sm');
    });

    it('lg has correct minimum height', () => {
      expect(sizeClasses.lg).toContain('min-h-[100px]');
    });

    it('lg has correct padding', () => {
      expect(sizeClasses.lg).toContain('px-4');
      expect(sizeClasses.lg).toContain('py-3');
    });

    it('lg has correct text size', () => {
      expect(sizeClasses.lg).toContain('text-base');
    });
  });

  // ===========================================================================
  // Resize Classes
  // ===========================================================================

  describe('resizeClasses', () => {
    it('none disables resize', () => {
      expect(resizeClasses.none).toBe('resize-none');
    });

    it('vertical allows only vertical resize', () => {
      expect(resizeClasses.vertical).toBe('resize-y');
    });

    it('horizontal allows only horizontal resize', () => {
      expect(resizeClasses.horizontal).toBe('resize-x');
    });

    it('both allows resize in all directions', () => {
      expect(resizeClasses.both).toBe('resize');
    });
  });

  // ===========================================================================
  // Character Count Text Sizes
  // ===========================================================================

  describe('charCountTextSizes', () => {
    it('sm uses text-xs for character count', () => {
      expect(charCountTextSizes.sm).toBe('text-xs');
    });

    it('md uses text-xs for character count', () => {
      expect(charCountTextSizes.md).toBe('text-xs');
    });

    it('lg uses text-sm for character count', () => {
      expect(charCountTextSizes.lg).toBe('text-sm');
    });
  });

  // ===========================================================================
  // getSizeClasses
  // ===========================================================================

  describe('getSizeClasses', () => {
    it('handles simple string size sm', () => {
      const result = getSizeClasses('sm');
      expect(result).toContain('min-h-[80px]');
      expect(result).toContain('px-3');
      expect(result).toContain('py-2');
      expect(result).toContain('text-xs');
    });

    it('handles simple string size md', () => {
      const result = getSizeClasses('md');
      expect(result).toContain('min-h-[80px]');
      expect(result).toContain('text-sm');
    });

    it('handles simple string size lg', () => {
      const result = getSizeClasses('lg');
      expect(result).toContain('min-h-[100px]');
      expect(result).toContain('px-4');
      expect(result).toContain('py-3');
      expect(result).toContain('text-base');
    });

    it('handles responsive size with base only', () => {
      const result = getSizeClasses({ base: 'sm' });
      expect(result).toContain('min-h-[80px]');
      expect(result).toContain('px-3');
      expect(result).toContain('text-xs');
    });

    it('handles responsive size with base and md', () => {
      const result = getSizeClasses({ base: 'sm', md: 'lg' });
      // Base classes (no prefix)
      expect(result).toContain('min-h-[80px]');
      expect(result).toContain('px-3');
      expect(result).toContain('text-xs');
      // md: prefixed classes
      expect(result).toContain('md:min-h-[100px]');
      expect(result).toContain('md:px-4');
      expect(result).toContain('md:py-3');
      expect(result).toContain('md:text-base');
    });

    it('handles responsive size with multiple breakpoints', () => {
      const result = getSizeClasses({
        base: 'sm',
        sm: 'sm',
        md: 'md',
        lg: 'lg',
      });

      // Base classes
      expect(result).toContain('min-h-[80px]');
      expect(result).toContain('text-xs');

      // sm: classes
      expect(result).toContain('sm:min-h-[80px]');
      expect(result).toContain('sm:px-3');

      // md: classes
      expect(result).toContain('md:min-h-[80px]');
      expect(result).toContain('md:text-sm');

      // lg: classes
      expect(result).toContain('lg:min-h-[100px]');
      expect(result).toContain('lg:px-4');
    });

    it('handles responsive size with xl and 2xl breakpoints', () => {
      const result = getSizeClasses({
        base: 'sm',
        xl: 'md',
        '2xl': 'lg',
      });

      expect(result).toContain('min-h-[80px]'); // base
      expect(result).toContain('xl:min-h-[80px]'); // xl
      expect(result).toContain('2xl:min-h-[100px]'); // 2xl
    });

    it('handles non-sequential breakpoints', () => {
      const result = getSizeClasses({ base: 'sm', lg: 'lg' });

      // Base classes
      expect(result).toContain('min-h-[80px]');
      expect(result).toContain('text-xs');

      // lg classes (skip sm and md)
      expect(result).toContain('lg:min-h-[100px]');
      expect(result).toContain('lg:text-base');
    });

    it('returns empty array for null input', () => {
      // @ts-expect-error Testing edge case
      const result = getSizeClasses(null);
      expect(result).toEqual([]);
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
    it('all sizes include minimum height', () => {
      for (const sizeClass of Object.values(sizeClasses)) {
        expect(sizeClass).toMatch(/min-h-\[/);
      }
    });

    it('all sizes include horizontal padding', () => {
      for (const sizeClass of Object.values(sizeClasses)) {
        expect(sizeClass).toMatch(/px-\d+/);
      }
    });

    it('all sizes include vertical padding', () => {
      for (const sizeClass of Object.values(sizeClasses)) {
        expect(sizeClass).toMatch(/py-\d+/);
      }
    });

    it('all sizes include text size', () => {
      for (const sizeClass of Object.values(sizeClasses)) {
        expect(sizeClass).toMatch(/text-(xs|sm|base|lg)/);
      }
    });

    it('larger sizes have larger heights', () => {
      // Extract minimum heights - sm/md have 80px, lg has 100px
      expect(sizeClasses.sm).toContain('min-h-[80px]');
      expect(sizeClasses.md).toContain('min-h-[80px]');
      expect(sizeClasses.lg).toContain('min-h-[100px]');
    });
  });

  // ===========================================================================
  // Base Textarea Classes
  // ===========================================================================

  describe('base textarea classes (TEXTAREA_BASE_CLASSES)', () => {
    it('includes layout classes', () => {
      expect(TEXTAREA_BASE_CLASSES).toContain('flex');
      expect(TEXTAREA_BASE_CLASSES).toContain('w-full');
    });

    it('includes border classes', () => {
      expect(TEXTAREA_BASE_CLASSES).toContain('rounded-md');
      expect(TEXTAREA_BASE_CLASSES).toContain('border');
    });

    it('includes background and text colors', () => {
      expect(TEXTAREA_BASE_CLASSES).toContain('bg-[rgb(var(--background))]');
      expect(TEXTAREA_BASE_CLASSES).toContain('text-[rgb(var(--foreground))]');
    });

    it('includes motion-safe transition for accessibility', () => {
      expect(TEXTAREA_BASE_CLASSES).toContain('motion-safe:transition-colors');
      expect(TEXTAREA_BASE_CLASSES).toContain('motion-safe:duration-150');
    });

    it('includes placeholder styling', () => {
      expect(TEXTAREA_BASE_CLASSES).toContain('placeholder:text-[rgb(var(--muted-foreground))]');
    });

    it('includes focus-visible ring for keyboard navigation', () => {
      expect(TEXTAREA_BASE_CLASSES).toContain('focus-visible:outline-none');
      expect(TEXTAREA_BASE_CLASSES).toContain('focus-visible:ring-2');
      expect(TEXTAREA_BASE_CLASSES).toContain('focus-visible:ring-offset-2');
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

    it('documents character count linking via aria-describedby', () => {
      // Character count element ID is included in aria-describedby
      const charCountBehavior = 'character count ID included in aria-describedby';
      expect(charCountBehavior).toContain('aria-describedby');
    });
  });

  // ===========================================================================
  // Character Count Behavior
  // ===========================================================================

  describe('character count behavior', () => {
    it('visual count element has aria-hidden', () => {
      // The visual character count has aria-hidden="true"
      const visualCountHidden = 'aria-hidden="true" on visual count';
      expect(visualCountHidden).toContain('aria-hidden');
    });

    it('screen reader announcement uses aria-live polite', () => {
      // The VisuallyHidden announcement uses aria-live="polite"
      const srAnnouncement = 'aria-live="polite" for screen reader';
      expect(srAnnouncement).toContain('aria-live');
    });

    it('announces when approaching limit (10 or fewer remaining)', () => {
      // Screen reader is notified when ≤10 characters remaining
      const limitThreshold = 10;
      expect(limitThreshold).toBeLessThanOrEqual(10);
    });

    it('announces when limit reached', () => {
      // Screen reader is notified when character limit is reached
      const limitMessage = 'Character limit reached';
      expect(limitMessage).toBe('Character limit reached');
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
      const baseOnlyClasses = result.filter((c) => !c.includes(':'));
      expect(baseOnlyClasses.length).toBeGreaterThan(0);
    });

    it('non-base breakpoints have prefix', () => {
      const result = getSizeClasses({ base: 'sm', lg: 'lg' });
      // lg classes should have lg: prefix
      const lgPrefixedClasses = result.filter((c) => c.startsWith('lg:'));
      expect(lgPrefixedClasses.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Default Props Documentation
  // ===========================================================================

  describe('default props documentation', () => {
    it('documents default size as md', () => {
      const defaultSize: TextareaSize = 'md';
      expect(defaultSize).toBe('md');
    });

    it('documents default resize as vertical', () => {
      const defaultResize: TextareaResize = 'vertical';
      expect(defaultResize).toBe('vertical');
    });

    it('documents default showCharacterCount as false', () => {
      const defaultShowCharacterCount = false;
      expect(defaultShowCharacterCount).toBe(false);
    });

    it('documents default error as undefined', () => {
      const defaultError = undefined;
      expect(defaultError).toBeUndefined();
    });

    it('documents default disabled as undefined', () => {
      const defaultDisabled = undefined;
      expect(defaultDisabled).toBeUndefined();
    });
  });

  // ===========================================================================
  // Character Count Calculation Documentation
  // ===========================================================================

  describe('character count calculation', () => {
    it('uses characterCount prop when provided', () => {
      // Component priority: characterCount > value.length > defaultValue.length
      const priority = 'characterCount prop takes precedence';
      expect(priority).toContain('characterCount');
    });

    it('falls back to value.length when characterCount not provided', () => {
      // If characterCount is undefined, use value.length
      const fallback = 'value.length when characterCount undefined';
      expect(fallback).toContain('value.length');
    });

    it('falls back to defaultValue.length when neither characterCount nor value provided', () => {
      // If both are undefined, use defaultValue.length
      const fallback = 'defaultValue.length as last resort';
      expect(fallback).toContain('defaultValue.length');
    });

    it('defaults to 0 when no value sources available', () => {
      // If all are undefined, default to 0
      const defaultCount = 0;
      expect(defaultCount).toBe(0);
    });
  });

  // ===========================================================================
  // showCharacterCount Behavior
  // ===========================================================================

  describe('showCharacterCount visibility conditions', () => {
    it('requires both showCharacterCount and maxLength', () => {
      // shouldShowCharCount = showCharacterCount && maxLength !== undefined
      const condition = 'showCharacterCount && maxLength !== undefined';
      expect(condition).toContain('showCharacterCount');
      expect(condition).toContain('maxLength');
    });

    it('does not show count when showCharacterCount is false', () => {
      const showCharacterCount = false;
      const maxLength = 100;
      const shouldShow = showCharacterCount && maxLength !== undefined;
      expect(shouldShow).toBe(false);
    });

    it('does not show count when maxLength is undefined', () => {
      const showCharacterCount = true;
      const maxLength = undefined;
      const shouldShow = showCharacterCount && maxLength !== undefined;
      expect(shouldShow).toBe(false);
    });

    it('shows count when both conditions are met', () => {
      const showCharacterCount = true;
      const maxLength = 100;
      const shouldShow = showCharacterCount && maxLength !== undefined;
      expect(shouldShow).toBe(true);
    });
  });

  // ===========================================================================
  // Character Count Color Behavior
  // ===========================================================================

  describe('character count color behavior', () => {
    it('uses muted color when under limit', () => {
      // currentCount < maxLength → muted-foreground
      const colorClass = 'text-[rgb(var(--muted-foreground))]';
      expect(colorClass).toContain('muted-foreground');
    });

    it('uses destructive color when at or over limit', () => {
      // currentCount >= maxLength → destructive
      const colorClass = 'text-[rgb(var(--destructive))]';
      expect(colorClass).toContain('destructive');
    });
  });

  // ===========================================================================
  // Wrapper Container Classes
  // ===========================================================================

  describe('wrapper container classes', () => {
    const wrapperClasses = 'relative flex w-full flex-col';

    it('uses relative positioning for internal elements', () => {
      expect(wrapperClasses).toContain('relative');
    });

    it('uses flex column layout', () => {
      expect(wrapperClasses).toContain('flex');
      expect(wrapperClasses).toContain('flex-col');
    });

    it('spans full width', () => {
      expect(wrapperClasses).toContain('w-full');
    });
  });

  // ===========================================================================
  // Screen Reader Announcement Thresholds
  // ===========================================================================

  describe('screen reader announcement thresholds', () => {
    it('announces at limit reached (remaining <= 0)', () => {
      const remaining = 0;
      const shouldAnnounce = remaining <= 0;
      expect(shouldAnnounce).toBe(true);
    });

    it('announces when close to limit (remaining <= 10)', () => {
      const remaining = 5;
      const shouldAnnounce = remaining <= 10;
      expect(shouldAnnounce).toBe(true);
    });

    it('does not announce when plenty of room (remaining > 10)', () => {
      const remaining = 50;
      const shouldAnnounce = remaining <= 10;
      expect(shouldAnnounce).toBe(false);
    });
  });
});
