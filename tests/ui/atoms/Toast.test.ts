import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DISMISS_LABEL,
  SIZE_CLASSES,
  TOAST_BASE_CLASSES,
  type ToastSize,
  type ToastVariant,
  VARIANT_CLASSES,
  VARIANT_ICONS,
  VARIANT_ICON_COLORS,
  getAriaLive,
  getAriaRole,
  getBaseSize,
  getSizeClasses,
} from '../../../packages/ui/atoms/Toast';

describe('Toast', () => {
  // ============================================================================
  // Variant Classes
  // ============================================================================

  describe('VARIANT_CLASSES', () => {
    it('should have classes for all variants', () => {
      expect(VARIANT_CLASSES.success).toBeDefined();
      expect(VARIANT_CLASSES.error).toBeDefined();
      expect(VARIANT_CLASSES.warning).toBeDefined();
      expect(VARIANT_CLASSES.info).toBeDefined();
    });

    it('should include border and background classes for success', () => {
      expect(VARIANT_CLASSES.success).toContain('border-success');
      expect(VARIANT_CLASSES.success).toContain('bg-success');
    });

    it('should include border and background classes for error', () => {
      expect(VARIANT_CLASSES.error).toContain('border-error');
      expect(VARIANT_CLASSES.error).toContain('bg-error');
    });

    it('should include border and background classes for warning', () => {
      expect(VARIANT_CLASSES.warning).toContain('border-warning');
      expect(VARIANT_CLASSES.warning).toContain('bg-warning');
    });

    it('should include border and background classes for info', () => {
      expect(VARIANT_CLASSES.info).toContain('border-info');
      expect(VARIANT_CLASSES.info).toContain('bg-info');
    });
  });

  // ============================================================================
  // Variant Icons
  // ============================================================================

  describe('VARIANT_ICONS', () => {
    it('should have icons for all variants', () => {
      expect(VARIANT_ICONS.success).toBeDefined();
      expect(VARIANT_ICONS.error).toBeDefined();
      expect(VARIANT_ICONS.warning).toBeDefined();
      expect(VARIANT_ICONS.info).toBeDefined();
    });

    it('should use distinct icons for each variant', () => {
      // Different icon components for different semantic meanings
      expect(VARIANT_ICONS.success).not.toBe(VARIANT_ICONS.error);
      expect(VARIANT_ICONS.warning).not.toBe(VARIANT_ICONS.info);
    });
  });

  // ============================================================================
  // Variant Icon Colors
  // ============================================================================

  describe('VARIANT_ICON_COLORS', () => {
    it('should have colors for all variants', () => {
      expect(VARIANT_ICON_COLORS.success).toBe('text-success');
      expect(VARIANT_ICON_COLORS.error).toBe('text-error');
      expect(VARIANT_ICON_COLORS.warning).toBe('text-warning');
      expect(VARIANT_ICON_COLORS.info).toBe('text-info');
    });
  });

  // ============================================================================
  // Size Classes
  // ============================================================================

  describe('SIZE_CLASSES', () => {
    it('should have size objects for all sizes', () => {
      expect(SIZE_CLASSES.sm).toBeDefined();
      expect(SIZE_CLASSES.md).toBeDefined();
      expect(SIZE_CLASSES.lg).toBeDefined();
    });

    it('should have all required properties for each size', () => {
      const sizes: ToastSize[] = ['sm', 'md', 'lg'];
      for (const size of sizes) {
        expect(SIZE_CLASSES[size].container).toBeDefined();
        expect(SIZE_CLASSES[size].icon).toBeDefined();
        expect(SIZE_CLASSES[size].title).toBeDefined();
        expect(SIZE_CLASSES[size].description).toBeDefined();
      }
    });

    it('should have appropriate max-width for each size', () => {
      expect(SIZE_CLASSES.sm.container).toContain('max-w-xs');
      expect(SIZE_CLASSES.md.container).toContain('max-w-sm');
      expect(SIZE_CLASSES.lg.container).toContain('max-w-md');
    });

    it('should have progressively larger padding', () => {
      expect(SIZE_CLASSES.sm.container).toContain('p-3');
      expect(SIZE_CLASSES.md.container).toContain('p-4');
      expect(SIZE_CLASSES.lg.container).toContain('p-5');
    });

    it('should have progressively larger gaps', () => {
      expect(SIZE_CLASSES.sm.container).toContain('gap-2');
      expect(SIZE_CLASSES.md.container).toContain('gap-3');
      expect(SIZE_CLASSES.lg.container).toContain('gap-4');
    });

    it('should have progressively larger icons', () => {
      expect(SIZE_CLASSES.sm.icon).toContain('h-4 w-4');
      expect(SIZE_CLASSES.md.icon).toContain('h-5 w-5');
      expect(SIZE_CLASSES.lg.icon).toContain('h-6 w-6');
    });

    it('should have progressively larger text', () => {
      expect(SIZE_CLASSES.sm.title).toContain('text-xs');
      expect(SIZE_CLASSES.md.title).toContain('text-sm');
      expect(SIZE_CLASSES.lg.title).toContain('text-base');
    });
  });

  // ============================================================================
  // getSizeClasses Utility
  // ============================================================================

  describe('getSizeClasses', () => {
    it('should return size classes for string size', () => {
      const result = getSizeClasses('sm');
      expect(result).toEqual(SIZE_CLASSES.sm);
    });

    it('should return size classes for each string size', () => {
      expect(getSizeClasses('sm')).toEqual(SIZE_CLASSES.sm);
      expect(getSizeClasses('md')).toEqual(SIZE_CLASSES.md);
      expect(getSizeClasses('lg')).toEqual(SIZE_CLASSES.lg);
    });

    it('should handle responsive object with base only', () => {
      const result = getSizeClasses({ base: 'sm' });
      expect(result.container).toContain('max-w-xs');
      expect(result.container).toContain('p-3');
      expect(result.container).toContain('gap-2');
    });

    it('should handle responsive object with multiple breakpoints', () => {
      const result = getSizeClasses({ base: 'sm', md: 'lg' });

      // Base classes (no prefix)
      expect(result.container).toContain('max-w-xs');
      expect(result.container).toContain('p-3');

      // md breakpoint classes
      expect(result.container).toContain('md:max-w-md');
      expect(result.container).toContain('md:p-5');
    });

    it('should handle all breakpoints correctly', () => {
      const result = getSizeClasses({
        base: 'sm',
        sm: 'sm',
        md: 'md',
        lg: 'lg',
        xl: 'lg',
        '2xl': 'lg',
      });

      expect(result.container).toContain('max-w-xs'); // base
      expect(result.container).toContain('sm:max-w-xs');
      expect(result.container).toContain('md:max-w-sm');
      expect(result.container).toContain('lg:max-w-md');
      expect(result.container).toContain('xl:max-w-md');
      expect(result.container).toContain('2xl:max-w-md');
    });

    it('should apply breakpoint prefixes to icon classes', () => {
      const result = getSizeClasses({ base: 'sm', md: 'lg' });
      expect(result.icon).toContain('h-4');
      expect(result.icon).toContain('md:h-6');
    });

    it('should apply breakpoint prefixes to title classes', () => {
      const result = getSizeClasses({ base: 'sm', lg: 'lg' });
      expect(result.title).toContain('text-xs');
      expect(result.title).toContain('lg:text-base');
    });

    it('should default to md size for invalid input', () => {
      // @ts-expect-error - testing invalid input
      const result = getSizeClasses(null);
      expect(result).toEqual(SIZE_CLASSES.md);
    });
  });

  // ============================================================================
  // getBaseSize Utility
  // ============================================================================

  describe('getBaseSize', () => {
    it('should return the size for string input', () => {
      expect(getBaseSize('sm')).toBe('sm');
      expect(getBaseSize('md')).toBe('md');
      expect(getBaseSize('lg')).toBe('lg');
    });

    it('should return base from responsive object', () => {
      expect(getBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
      expect(getBaseSize({ base: 'lg' })).toBe('lg');
    });

    it('should return first defined breakpoint if no base', () => {
      expect(getBaseSize({ sm: 'md' })).toBe('md');
      expect(getBaseSize({ md: 'lg' })).toBe('lg');
    });

    it('should default to md for invalid input', () => {
      // @ts-expect-error - testing invalid input
      expect(getBaseSize(null)).toBe('md');
      // @ts-expect-error - testing invalid input
      expect(getBaseSize(undefined)).toBe('md');
    });

    it('should return md for empty object', () => {
      expect(getBaseSize({})).toBe('md');
    });
  });

  // ============================================================================
  // getAriaRole Utility
  // ============================================================================

  describe('getAriaRole', () => {
    it('should return "alert" for error variant', () => {
      expect(getAriaRole('error')).toBe('alert');
    });

    it('should return "status" for success variant', () => {
      expect(getAriaRole('success')).toBe('status');
    });

    it('should return "status" for warning variant', () => {
      expect(getAriaRole('warning')).toBe('status');
    });

    it('should return "status" for info variant', () => {
      expect(getAriaRole('info')).toBe('status');
    });

    it('should only return "alert" for error', () => {
      const variants: ToastVariant[] = ['success', 'error', 'warning', 'info'];
      for (const variant of variants) {
        if (variant === 'error') {
          expect(getAriaRole(variant)).toBe('alert');
        } else {
          expect(getAriaRole(variant)).toBe('status');
        }
      }
    });
  });

  // ============================================================================
  // getAriaLive Utility
  // ============================================================================

  describe('getAriaLive', () => {
    it('should return "assertive" for error variant', () => {
      expect(getAriaLive('error')).toBe('assertive');
    });

    it('should return "polite" for success variant', () => {
      expect(getAriaLive('success')).toBe('polite');
    });

    it('should return "polite" for warning variant', () => {
      expect(getAriaLive('warning')).toBe('polite');
    });

    it('should return "polite" for info variant', () => {
      expect(getAriaLive('info')).toBe('polite');
    });

    it('should only return "assertive" for error', () => {
      const variants: ToastVariant[] = ['success', 'error', 'warning', 'info'];
      for (const variant of variants) {
        if (variant === 'error') {
          expect(getAriaLive(variant)).toBe('assertive');
        } else {
          expect(getAriaLive(variant)).toBe('polite');
        }
      }
    });
  });

  // ============================================================================
  // Base Classes
  // ============================================================================

  describe('TOAST_BASE_CLASSES', () => {
    it('should include pointer-events-auto for interactivity', () => {
      expect(TOAST_BASE_CLASSES).toContain('pointer-events-auto');
    });

    it('should include flex layout', () => {
      expect(TOAST_BASE_CLASSES).toContain('flex');
    });

    it('should include full width', () => {
      expect(TOAST_BASE_CLASSES).toContain('w-full');
    });

    it('should include items-start for alignment', () => {
      expect(TOAST_BASE_CLASSES).toContain('items-start');
    });

    it('should include rounded-lg for rounded corners', () => {
      expect(TOAST_BASE_CLASSES).toContain('rounded-lg');
    });

    it('should include border', () => {
      expect(TOAST_BASE_CLASSES).toContain('border');
    });

    it('should include shadow-lg', () => {
      expect(TOAST_BASE_CLASSES).toContain('shadow-lg');
    });

    it('should include motion-safe transitions', () => {
      expect(TOAST_BASE_CLASSES).toContain('motion-safe:transition-all');
    });
  });

  // ============================================================================
  // Constants
  // ============================================================================

  describe('DEFAULT_DISMISS_LABEL', () => {
    it('should have a meaningful default value', () => {
      expect(DEFAULT_DISMISS_LABEL).toBe('Dismiss notification');
    });

    it('should be a non-empty string', () => {
      expect(typeof DEFAULT_DISMISS_LABEL).toBe('string');
      expect(DEFAULT_DISMISS_LABEL.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Accessibility Behavior Documentation
  // ============================================================================

  describe('Accessibility Behavior', () => {
    it('documents that error uses assertive announcements', () => {
      // Error toasts should immediately interrupt screen readers
      expect(getAriaRole('error')).toBe('alert');
      expect(getAriaLive('error')).toBe('assertive');
    });

    it('documents that other variants use polite announcements', () => {
      // Non-error toasts should wait for a pause
      for (const variant of ['success', 'warning', 'info'] as ToastVariant[]) {
        expect(getAriaRole(variant)).toBe('status');
        expect(getAriaLive(variant)).toBe('polite');
      }
    });

    it('documents that variant is conveyed beyond color', () => {
      // Each variant has a unique icon for color-blind users
      const icons = Object.values(VARIANT_ICONS);
      const uniqueIcons = new Set(icons);
      expect(uniqueIcons.size).toBe(4);
    });
  });

  // ============================================================================
  // Size Consistency
  // ============================================================================

  describe('Size Consistency', () => {
    it('should have consistent structure across all sizes', () => {
      const sizes: ToastSize[] = ['sm', 'md', 'lg'];
      for (const size of sizes) {
        const classes = SIZE_CLASSES[size];
        expect(classes.container).toMatch(/max-w-/);
        expect(classes.container).toMatch(/p-\d+/);
        expect(classes.container).toMatch(/gap-\d+/);
        expect(classes.icon).toMatch(/h-\d+ w-\d+/);
        expect(classes.title).toMatch(/text-/);
        expect(classes.description).toMatch(/text-/);
      }
    });

    it('should have progressively larger sizes', () => {
      // Padding progression: sm(3) < md(4) < lg(5)
      const smPadding = SIZE_CLASSES.sm.container.match(/p-(\d+)/)?.[1];
      const mdPadding = SIZE_CLASSES.md.container.match(/p-(\d+)/)?.[1];
      const lgPadding = SIZE_CLASSES.lg.container.match(/p-(\d+)/)?.[1];

      expect(Number(smPadding)).toBeLessThan(Number(mdPadding));
      expect(Number(mdPadding)).toBeLessThan(Number(lgPadding));
    });
  });

  // ============================================================================
  // Responsive Breakpoint Order
  // ============================================================================

  describe('Responsive Breakpoint Order', () => {
    it('should apply breakpoints in correct order', () => {
      const result = getSizeClasses({
        base: 'sm',
        sm: 'sm',
        md: 'md',
        lg: 'lg',
      });

      // Classes should be in order: base, sm:, md:, lg:
      const containerClasses = result.container.split(' ');

      // Find indices of prefixed classes
      const baseIndex = containerClasses.findIndex((c) => c === 'max-w-xs');
      const smIndex = containerClasses.findIndex((c) => c.startsWith('sm:'));
      const mdIndex = containerClasses.findIndex((c) => c.startsWith('md:'));
      const lgIndex = containerClasses.findIndex((c) => c.startsWith('lg:'));

      // Verify order
      expect(baseIndex).toBeLessThan(smIndex);
      expect(smIndex).toBeLessThan(mdIndex);
      expect(mdIndex).toBeLessThan(lgIndex);
    });
  });

  // ============================================================================
  // Default Props Documentation
  // ============================================================================

  describe('Default Props Documentation', () => {
    it('documents default variant is info', () => {
      // Default variant should be info (non-alarming)
      expect(getAriaRole('info')).toBe('status');
    });

    it('documents default size is md', () => {
      expect(getBaseSize('md')).toBe('md');
    });

    it('documents default dismiss label', () => {
      expect(DEFAULT_DISMISS_LABEL).toBe('Dismiss notification');
    });
  });
});
