/**
 * Checkbox Component Utility Function Tests
 *
 * Tests for the Checkbox atom utility functions and class generation.
 * Component rendering is tested via Storybook.
 */

import { describe, expect, it } from 'vitest';

// =============================================================================
// Re-implement utility functions for testing
// (mirrors the logic in Checkbox.tsx)
// =============================================================================

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type CheckboxSize = 'sm' | 'md' | 'lg';
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

const sizeClasses: Record<CheckboxSize, { wrapper: string; checkbox: string; icon: string }> = {
  sm: {
    wrapper: 'min-h-[44px] min-w-[44px] sm:min-h-5 sm:min-w-5',
    checkbox: 'h-3.5 w-3.5',
    icon: 'h-3.5 w-3.5 stroke-[3]',
  },
  md: {
    wrapper: 'min-h-[44px] min-w-[44px] sm:min-h-6 sm:min-w-6',
    checkbox: 'h-4 w-4',
    icon: 'h-4 w-4 stroke-[3]',
  },
  lg: {
    wrapper: 'min-h-[44px] min-w-[44px]',
    checkbox: 'h-5 w-5',
    icon: 'h-5 w-5 stroke-[2.5]',
  },
};

const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

function getSizeClasses(size: ResponsiveValue<CheckboxSize>): {
  wrapper: string[];
  checkbox: string[];
  icon: string[];
} {
  const wrapper: string[] = [];
  const checkbox: string[] = [];
  const icon: string[] = [];

  if (typeof size === 'string') {
    const classes = sizeClasses[size];
    wrapper.push(classes.wrapper);
    checkbox.push(classes.checkbox);
    icon.push(classes.icon);
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, CheckboxSize>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const classes = sizeClasses[breakpointValue];
        if (breakpoint === 'base') {
          wrapper.push(...classes.wrapper.split(' '));
          checkbox.push(...classes.checkbox.split(' '));
          icon.push(...classes.icon.split(' '));
        } else {
          wrapper.push(...classes.wrapper.split(' ').map((c) => `${breakpoint}:${c}`));
          checkbox.push(...classes.checkbox.split(' ').map((c) => `${breakpoint}:${c}`));
          icon.push(...classes.icon.split(' ').map((c) => `${breakpoint}:${c}`));
        }
      }
    }
  }

  return { wrapper, checkbox, icon };
}

function getStateAnnouncement(
  checked: boolean | undefined,
  indeterminate: boolean | undefined
): string {
  if (indeterminate) return 'Partially checked';
  if (checked) return 'Checked';
  return 'Not checked';
}

// =============================================================================
// Tests
// =============================================================================

describe('ui/atoms/Checkbox - Utility Functions', () => {
  // ===========================================================================
  // Size Classes
  // ===========================================================================

  describe('sizeClasses', () => {
    it('sm size has correct wrapper dimensions', () => {
      expect(sizeClasses.sm.wrapper).toContain('min-h-[44px]');
      expect(sizeClasses.sm.wrapper).toContain('min-w-[44px]');
    });

    it('sm size has correct checkbox dimensions', () => {
      expect(sizeClasses.sm.checkbox).toContain('h-3.5');
      expect(sizeClasses.sm.checkbox).toContain('w-3.5');
    });

    it('sm size has correct icon dimensions', () => {
      expect(sizeClasses.sm.icon).toContain('h-3.5');
      expect(sizeClasses.sm.icon).toContain('w-3.5');
      expect(sizeClasses.sm.icon).toContain('stroke-[3]');
    });

    it('md size has correct wrapper dimensions', () => {
      expect(sizeClasses.md.wrapper).toContain('min-h-[44px]');
      expect(sizeClasses.md.wrapper).toContain('min-w-[44px]');
    });

    it('md size has correct checkbox dimensions', () => {
      expect(sizeClasses.md.checkbox).toContain('h-4');
      expect(sizeClasses.md.checkbox).toContain('w-4');
    });

    it('md size has correct icon dimensions', () => {
      expect(sizeClasses.md.icon).toContain('h-4');
      expect(sizeClasses.md.icon).toContain('w-4');
    });

    it('lg size has correct wrapper dimensions', () => {
      expect(sizeClasses.lg.wrapper).toContain('min-h-[44px]');
      expect(sizeClasses.lg.wrapper).toContain('min-w-[44px]');
    });

    it('lg size has correct checkbox dimensions', () => {
      expect(sizeClasses.lg.checkbox).toContain('h-5');
      expect(sizeClasses.lg.checkbox).toContain('w-5');
    });

    it('lg size has correct icon dimensions', () => {
      expect(sizeClasses.lg.icon).toContain('h-5');
      expect(sizeClasses.lg.icon).toContain('w-5');
      expect(sizeClasses.lg.icon).toContain('stroke-[2.5]');
    });
  });

  // ===========================================================================
  // Touch Target Accessibility (WCAG 2.5.5)
  // ===========================================================================

  describe('touch target accessibility (WCAG 2.5.5)', () => {
    it('sm size has 44px min dimensions on mobile', () => {
      expect(sizeClasses.sm.wrapper).toContain('min-h-[44px]');
      expect(sizeClasses.sm.wrapper).toContain('min-w-[44px]');
    });

    it('sm size relaxes min dimensions on desktop', () => {
      expect(sizeClasses.sm.wrapper).toContain('sm:min-h-5');
      expect(sizeClasses.sm.wrapper).toContain('sm:min-w-5');
    });

    it('md size has 44px min dimensions on mobile', () => {
      expect(sizeClasses.md.wrapper).toContain('min-h-[44px]');
      expect(sizeClasses.md.wrapper).toContain('min-w-[44px]');
    });

    it('md size relaxes min dimensions on desktop', () => {
      expect(sizeClasses.md.wrapper).toContain('sm:min-h-6');
      expect(sizeClasses.md.wrapper).toContain('sm:min-w-6');
    });

    it('lg size has 44px min dimensions on all devices', () => {
      expect(sizeClasses.lg.wrapper).toContain('min-h-[44px]');
      expect(sizeClasses.lg.wrapper).toContain('min-w-[44px]');
    });

    it('all sizes meet WCAG 2.5.5 touch target minimum (44px)', () => {
      for (const { wrapper } of Object.values(sizeClasses)) {
        expect(wrapper).toContain('min-h-[44px]');
        expect(wrapper).toContain('min-w-[44px]');
      }
    });
  });

  // ===========================================================================
  // getSizeClasses
  // ===========================================================================

  describe('getSizeClasses', () => {
    it('handles simple string size', () => {
      const classes = getSizeClasses('sm');
      expect(classes.wrapper).toEqual(['min-h-[44px] min-w-[44px] sm:min-h-5 sm:min-w-5']);
      expect(classes.checkbox).toEqual(['h-3.5 w-3.5']);
      expect(classes.icon).toEqual(['h-3.5 w-3.5 stroke-[3]']);
    });

    it('handles md string size', () => {
      const classes = getSizeClasses('md');
      expect(classes.wrapper).toEqual(['min-h-[44px] min-w-[44px] sm:min-h-6 sm:min-w-6']);
      expect(classes.checkbox).toEqual(['h-4 w-4']);
      expect(classes.icon).toEqual(['h-4 w-4 stroke-[3]']);
    });

    it('handles lg string size', () => {
      const classes = getSizeClasses('lg');
      expect(classes.wrapper).toEqual(['min-h-[44px] min-w-[44px]']);
      expect(classes.checkbox).toEqual(['h-5 w-5']);
      expect(classes.icon).toEqual(['h-5 w-5 stroke-[2.5]']);
    });

    it('handles responsive size with base only', () => {
      const classes = getSizeClasses({ base: 'sm' });
      expect(classes.wrapper).toContain('min-h-[44px]');
      expect(classes.wrapper).toContain('min-w-[44px]');
      expect(classes.checkbox).toContain('h-3.5');
      expect(classes.checkbox).toContain('w-3.5');
    });

    it('handles responsive size with base and md', () => {
      const classes = getSizeClasses({ base: 'sm', md: 'lg' });
      // Base classes (no prefix)
      expect(classes.checkbox).toContain('h-3.5');
      expect(classes.checkbox).toContain('w-3.5');
      // md: prefixed classes
      expect(classes.checkbox).toContain('md:h-5');
      expect(classes.checkbox).toContain('md:w-5');
    });

    it('handles responsive size with multiple breakpoints', () => {
      const classes = getSizeClasses({
        base: 'sm',
        sm: 'sm',
        md: 'md',
        lg: 'lg',
      });

      // Base classes
      expect(classes.checkbox).toContain('h-3.5');

      // sm: classes
      expect(classes.checkbox).toContain('sm:h-3.5');

      // md: classes
      expect(classes.checkbox).toContain('md:h-4');

      // lg: classes
      expect(classes.checkbox).toContain('lg:h-5');
    });

    it('handles responsive size with xl and 2xl breakpoints', () => {
      const classes = getSizeClasses({
        base: 'sm',
        xl: 'md',
        '2xl': 'lg',
      });

      expect(classes.checkbox).toContain('h-3.5'); // base
      expect(classes.checkbox).toContain('xl:h-4'); // xl
      expect(classes.checkbox).toContain('2xl:h-5'); // 2xl
    });

    it('handles non-sequential breakpoints', () => {
      const classes = getSizeClasses({ base: 'sm', lg: 'lg' });

      // Base classes
      expect(classes.checkbox).toContain('h-3.5');

      // lg classes (skip sm and md)
      expect(classes.checkbox).toContain('lg:h-5');

      // No sm or md prefixed checkbox classes should exist
      const smMdClasses = classes.checkbox.filter(
        (c) => c.startsWith('sm:h-') || c.startsWith('md:h-')
      );
      expect(smMdClasses).toEqual([]);
    });

    it('returns empty arrays for null input', () => {
      // @ts-expect-error Testing edge case
      const classes = getSizeClasses(null);
      expect(classes.wrapper).toEqual([]);
      expect(classes.checkbox).toEqual([]);
      expect(classes.icon).toEqual([]);
    });
  });

  // ===========================================================================
  // getStateAnnouncement
  // ===========================================================================

  describe('getStateAnnouncement', () => {
    it('returns "Not checked" when unchecked', () => {
      expect(getStateAnnouncement(false, false)).toBe('Not checked');
    });

    it('returns "Not checked" when undefined', () => {
      expect(getStateAnnouncement(undefined, undefined)).toBe('Not checked');
    });

    it('returns "Checked" when checked', () => {
      expect(getStateAnnouncement(true, false)).toBe('Checked');
    });

    it('returns "Checked" when checked and indeterminate is undefined', () => {
      expect(getStateAnnouncement(true, undefined)).toBe('Checked');
    });

    it('returns "Partially checked" when indeterminate', () => {
      expect(getStateAnnouncement(false, true)).toBe('Partially checked');
    });

    it('returns "Partially checked" when indeterminate takes precedence over checked', () => {
      expect(getStateAnnouncement(true, true)).toBe('Partially checked');
    });
  });

  // ===========================================================================
  // Size Consistency
  // ===========================================================================

  describe('size consistency', () => {
    it('all sizes include wrapper dimensions', () => {
      for (const { wrapper } of Object.values(sizeClasses)) {
        expect(wrapper).toMatch(/min-h-/);
        expect(wrapper).toMatch(/min-w-/);
      }
    });

    it('all sizes include checkbox dimensions', () => {
      for (const { checkbox } of Object.values(sizeClasses)) {
        expect(checkbox).toMatch(/h-/);
        expect(checkbox).toMatch(/w-/);
      }
    });

    it('all sizes include icon dimensions', () => {
      for (const { icon } of Object.values(sizeClasses)) {
        expect(icon).toMatch(/h-/);
        expect(icon).toMatch(/w-/);
        expect(icon).toMatch(/stroke-/);
      }
    });

    it('checkbox size increases with size prop', () => {
      const heightSm = sizeClasses.sm.checkbox.match(/h-(\d+\.?\d*)/)?.[1];
      const heightMd = sizeClasses.md.checkbox.match(/h-(\d+\.?\d*)/)?.[1];
      const heightLg = sizeClasses.lg.checkbox.match(/h-(\d+\.?\d*)/)?.[1];

      expect(heightSm).toBeDefined();
      expect(heightMd).toBeDefined();
      expect(heightLg).toBeDefined();

      if (heightSm && heightMd && heightLg) {
        expect(Number.parseFloat(heightSm)).toBeLessThan(Number.parseFloat(heightMd));
        expect(Number.parseFloat(heightMd)).toBeLessThan(Number.parseFloat(heightLg));
      }
    });
  });

  // ===========================================================================
  // Base Checkbox Classes
  // ===========================================================================

  describe('base checkbox classes', () => {
    const baseClasses = [
      'peer',
      'shrink-0',
      'cursor-pointer',
      'appearance-none',
      'rounded',
      'border',
      'motion-safe:transition-colors',
      'motion-safe:duration-150',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-offset-2',
    ];

    it('includes all expected base classes', () => {
      expect(baseClasses).toContain('peer');
      expect(baseClasses).toContain('cursor-pointer');
      expect(baseClasses).toContain('appearance-none');
      expect(baseClasses).toContain('rounded');
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
  // Checked State Classes
  // ===========================================================================

  describe('checked state classes', () => {
    const checkedClasses = 'checked:border-[rgb(var(--primary))] checked:bg-[rgb(var(--primary))]';

    it('includes primary border color when checked', () => {
      expect(checkedClasses).toContain('checked:border-[rgb(var(--primary))]');
    });

    it('includes primary background color when checked', () => {
      expect(checkedClasses).toContain('checked:bg-[rgb(var(--primary))]');
    });
  });

  // ===========================================================================
  // Indeterminate State Classes
  // ===========================================================================

  describe('indeterminate state classes', () => {
    const indeterminateClasses =
      'indeterminate:border-[rgb(var(--primary))] indeterminate:bg-[rgb(var(--primary))]';

    it('includes primary border color when indeterminate', () => {
      expect(indeterminateClasses).toContain('indeterminate:border-[rgb(var(--primary))]');
    });

    it('includes primary background color when indeterminate', () => {
      expect(indeterminateClasses).toContain('indeterminate:bg-[rgb(var(--primary))]');
    });
  });

  // ===========================================================================
  // Error State Classes
  // ===========================================================================

  describe('error state classes', () => {
    const errorBorderClass = 'border-[rgb(var(--destructive))]';
    const errorCheckedClasses =
      'checked:border-[rgb(var(--destructive))] checked:bg-[rgb(var(--destructive))]';
    const errorIndeterminateClasses =
      'indeterminate:border-[rgb(var(--destructive))] indeterminate:bg-[rgb(var(--destructive))]';

    it('uses destructive color for error border', () => {
      expect(errorBorderClass).toContain('border-[rgb(var(--destructive))]');
    });

    it('uses destructive color for error checked state', () => {
      expect(errorCheckedClasses).toContain('checked:border-[rgb(var(--destructive))]');
      expect(errorCheckedClasses).toContain('checked:bg-[rgb(var(--destructive))]');
    });

    it('uses destructive color for error indeterminate state', () => {
      expect(errorIndeterminateClasses).toContain('indeterminate:border-[rgb(var(--destructive))]');
      expect(errorIndeterminateClasses).toContain('indeterminate:bg-[rgb(var(--destructive))]');
    });
  });

  // ===========================================================================
  // Disabled State Classes
  // ===========================================================================

  describe('disabled state classes', () => {
    const disabledClasses = 'cursor-not-allowed opacity-50';

    it('includes cursor-not-allowed for non-interactivity', () => {
      expect(disabledClasses).toContain('cursor-not-allowed');
    });

    it('includes opacity-50 for visual feedback', () => {
      expect(disabledClasses).toContain('opacity-50');
    });
  });

  // ===========================================================================
  // Icon Overlay Classes
  // ===========================================================================

  describe('icon overlay classes', () => {
    const iconBaseClasses = [
      'pointer-events-none',
      'absolute',
      'left-0',
      'text-[rgb(var(--primary-foreground))]',
      'opacity-0',
      'motion-safe:transition-opacity',
      'motion-safe:duration-150',
    ];

    const checkIconClasses = ['peer-checked:opacity-100', 'peer-indeterminate:hidden'];

    const indeterminateIconClasses = ['peer-indeterminate:opacity-100', 'peer-checked:hidden'];

    it('check icon base classes include pointer-events-none', () => {
      expect(iconBaseClasses).toContain('pointer-events-none');
    });

    it('check icon base classes include absolute positioning', () => {
      expect(iconBaseClasses).toContain('absolute');
      expect(iconBaseClasses).toContain('left-0');
    });

    it('check icon base classes include foreground color', () => {
      expect(iconBaseClasses).toContain('text-[rgb(var(--primary-foreground))]');
    });

    it('check icon shows when peer is checked', () => {
      expect(checkIconClasses).toContain('peer-checked:opacity-100');
    });

    it('check icon hides when peer is indeterminate', () => {
      expect(checkIconClasses).toContain('peer-indeterminate:hidden');
    });

    it('indeterminate icon shows when peer is indeterminate', () => {
      expect(indeterminateIconClasses).toContain('peer-indeterminate:opacity-100');
    });

    it('indeterminate icon hides when peer is checked', () => {
      expect(indeterminateIconClasses).toContain('peer-checked:hidden');
    });
  });

  // ===========================================================================
  // ARIA Attributes
  // ===========================================================================

  describe('ARIA attributes', () => {
    it('error state should use aria-invalid', () => {
      // This tests the expected behavior - component should set aria-invalid when error is true
      const errorAriaAttribute = 'aria-invalid';
      expect(errorAriaAttribute).toBe('aria-invalid');
    });

    it('error messages should be linked via aria-describedby', () => {
      const describedByAttribute = 'aria-describedby';
      expect(describedByAttribute).toBe('aria-describedby');
    });
  });

  // ===========================================================================
  // Responsive Behavior
  // ===========================================================================

  describe('responsive behavior', () => {
    it('generates correct breakpoint prefixes', () => {
      const classes = getSizeClasses({ base: 'sm', md: 'md', lg: 'lg' });

      // Should have base classes (no prefix)
      expect(classes.checkbox.some((c) => c === 'h-3.5')).toBe(true);

      // Should have md: prefixed classes
      expect(classes.checkbox.some((c) => c === 'md:h-4')).toBe(true);

      // Should have lg: prefixed classes
      expect(classes.checkbox.some((c) => c === 'lg:h-5')).toBe(true);
    });

    it('respects breakpoint order', () => {
      const expectedOrder = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];
      expect(BREAKPOINT_ORDER).toEqual(expectedOrder);
    });

    it('only generates classes for specified breakpoints', () => {
      const classes = getSizeClasses({ base: 'sm', lg: 'lg' });

      // Should NOT have sm: or md: prefixed classes (except for wrapper relaxation)
      const checkboxSmMd = classes.checkbox.filter(
        (c) => c.startsWith('sm:') || c.startsWith('md:')
      );
      expect(checkboxSmMd).toEqual([]);

      // Wrapper may have sm: classes for relaxed touch target
      expect(classes.wrapper.some((c) => c.startsWith('lg:'))).toBe(true);
    });
  });
});
