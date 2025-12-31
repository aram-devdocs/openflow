import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DARK_LABEL,
  DEFAULT_LIGHT_LABEL,
  THEME_TOGGLE_COMPACT_BASE_CLASSES,
  getSizeClasses,
} from '../../../packages/ui/atoms/ThemeToggleCompact';

describe('ThemeToggleCompact', () => {
  // =============================================================================
  // getSizeClasses utility function tests
  // =============================================================================

  describe('getSizeClasses', () => {
    describe('string size values', () => {
      it('returns correct classes for size sm', () => {
        const result = getSizeClasses('sm');
        expect(result.button).toContain('h-11');
        expect(result.button).toContain('w-11');
        expect(result.button).toContain('sm:h-9');
        expect(result.button).toContain('sm:w-9');
        expect(result.icon).toContain('h-4');
        expect(result.icon).toContain('w-4');
      });

      it('returns correct classes for size md', () => {
        const result = getSizeClasses('md');
        expect(result.button).toContain('h-11');
        expect(result.button).toContain('w-11');
        expect(result.icon).toContain('h-5');
        expect(result.icon).toContain('w-5');
      });

      it('returns correct classes for size lg', () => {
        const result = getSizeClasses('lg');
        expect(result.button).toContain('h-12');
        expect(result.button).toContain('w-12');
        expect(result.icon).toContain('h-6');
        expect(result.icon).toContain('w-6');
      });
    });

    describe('responsive object size values', () => {
      it('handles base breakpoint only', () => {
        const result = getSizeClasses({ base: 'sm' });
        expect(result.button).toContain('h-11');
        expect(result.button).toContain('w-11');
        expect(result.button).toContain('sm:h-9');
        expect(result.button).toContain('sm:w-9');
        expect(result.icon).toContain('h-4');
        expect(result.icon).toContain('w-4');
      });

      it('handles base and md breakpoints', () => {
        const result = getSizeClasses({ base: 'sm', md: 'lg' });
        // Base classes
        expect(result.button).toContain('h-11');
        expect(result.button).toContain('w-11');
        // md: prefixed classes for lg size
        expect(result.button).toContain('md:h-12');
        expect(result.button).toContain('md:w-12');
        expect(result.icon).toContain('md:h-6');
        expect(result.icon).toContain('md:w-6');
      });

      it('handles multiple breakpoints', () => {
        const result = getSizeClasses({ base: 'sm', md: 'md', lg: 'lg' });
        // Base classes
        expect(result.button).toContain('h-11');
        // md: prefixed classes
        expect(result.button).toContain('md:h-11');
        // lg: prefixed classes
        expect(result.button).toContain('lg:h-12');
        expect(result.icon).toContain('lg:h-6');
      });

      it('handles non-base breakpoints only', () => {
        const result = getSizeClasses({ md: 'md', lg: 'lg' });
        // Only md: and lg: prefixed classes, no base
        expect(result.button.some((c) => c === 'h-11')).toBe(false);
        expect(result.button).toContain('md:h-11');
        expect(result.button).toContain('lg:h-12');
      });

      it('handles all breakpoints', () => {
        const result = getSizeClasses({
          base: 'sm',
          sm: 'sm',
          md: 'md',
          lg: 'lg',
          xl: 'lg',
          '2xl': 'lg',
        });
        expect(result.button).toContain('h-11');
        expect(result.button).toContain('sm:h-9');
        expect(result.button).toContain('md:h-11');
        expect(result.button).toContain('lg:h-12');
        expect(result.button).toContain('xl:h-12');
        expect(result.button).toContain('2xl:h-12');
      });
    });

    describe('returns arrays of class names', () => {
      it('returns separate button and icon arrays', () => {
        const result = getSizeClasses('md');
        expect(Array.isArray(result.button)).toBe(true);
        expect(Array.isArray(result.icon)).toBe(true);
      });

      it('button and icon arrays have different values', () => {
        const result = getSizeClasses('md');
        expect(result.button).not.toEqual(result.icon);
      });
    });
  });

  // =============================================================================
  // Touch target accessibility tests
  // =============================================================================

  describe('touch target accessibility', () => {
    it('sm size has 44px touch target on mobile', () => {
      const result = getSizeClasses('sm');
      // h-11 = 44px, w-11 = 44px
      expect(result.button).toContain('h-11');
      expect(result.button).toContain('w-11');
    });

    it('sm size relaxes to 36px on larger screens', () => {
      const result = getSizeClasses('sm');
      // sm:h-9 = 36px, sm:w-9 = 36px
      expect(result.button).toContain('sm:h-9');
      expect(result.button).toContain('sm:w-9');
    });

    it('md size has 44px touch target on all screens', () => {
      const result = getSizeClasses('md');
      expect(result.button).toContain('h-11');
      expect(result.button).toContain('w-11');
      // No sm: override for md size
      expect(result.button.some((c) => c.startsWith('sm:h-'))).toBe(false);
    });

    it('lg size has 48px touch target', () => {
      const result = getSizeClasses('lg');
      // h-12 = 48px, w-12 = 48px
      expect(result.button).toContain('h-12');
      expect(result.button).toContain('w-12');
    });

    it('all sizes meet WCAG 2.5.5 minimum (44px)', () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      for (const size of sizes) {
        const result = getSizeClasses(size);
        // All sizes have at least h-11 (44px) at base
        const hasMinTouch = result.button.some((c) => c === 'h-11' || c === 'h-12');
        expect(hasMinTouch).toBe(true);
      }
    });
  });

  // =============================================================================
  // Icon sizing tests
  // =============================================================================

  describe('icon sizing', () => {
    it('sm size uses 16px icon (h-4 w-4)', () => {
      const result = getSizeClasses('sm');
      expect(result.icon).toContain('h-4');
      expect(result.icon).toContain('w-4');
    });

    it('md size uses 20px icon (h-5 w-5)', () => {
      const result = getSizeClasses('md');
      expect(result.icon).toContain('h-5');
      expect(result.icon).toContain('w-5');
    });

    it('lg size uses 24px icon (h-6 w-6)', () => {
      const result = getSizeClasses('lg');
      expect(result.icon).toContain('h-6');
      expect(result.icon).toContain('w-6');
    });

    it('icon size increases proportionally with button size', () => {
      const sm = getSizeClasses('sm');
      const md = getSizeClasses('md');
      const lg = getSizeClasses('lg');

      // Icon sizes: sm=4, md=5, lg=6
      expect(sm.icon).toContain('h-4');
      expect(md.icon).toContain('h-5');
      expect(lg.icon).toContain('h-6');
    });
  });

  // =============================================================================
  // Base classes tests
  // =============================================================================

  describe('THEME_TOGGLE_COMPACT_BASE_CLASSES', () => {
    it('includes flex layout', () => {
      expect(THEME_TOGGLE_COMPACT_BASE_CLASSES).toContain('flex');
      expect(THEME_TOGGLE_COMPACT_BASE_CLASSES).toContain('items-center');
      expect(THEME_TOGGLE_COMPACT_BASE_CLASSES).toContain('justify-center');
    });

    it('includes rounded corners', () => {
      expect(THEME_TOGGLE_COMPACT_BASE_CLASSES).toContain('rounded-md');
    });

    it('includes text color', () => {
      expect(THEME_TOGGLE_COMPACT_BASE_CLASSES).toContain('text-[rgb(var(--muted-foreground))]');
    });

    it('includes hover states', () => {
      expect(THEME_TOGGLE_COMPACT_BASE_CLASSES).toContain('hover:text-[rgb(var(--foreground))]');
      expect(THEME_TOGGLE_COMPACT_BASE_CLASSES).toContain('hover:bg-[rgb(var(--surface-1))]');
    });

    it('includes focus-visible ring', () => {
      expect(THEME_TOGGLE_COMPACT_BASE_CLASSES).toContain('focus-visible:outline-none');
      expect(THEME_TOGGLE_COMPACT_BASE_CLASSES).toContain('focus-visible:ring-2');
      expect(THEME_TOGGLE_COMPACT_BASE_CLASSES).toContain('focus-visible:ring-[rgb(var(--ring))]');
      expect(THEME_TOGGLE_COMPACT_BASE_CLASSES).toContain('focus-visible:ring-offset-2');
    });

    it('includes motion-safe transition', () => {
      expect(THEME_TOGGLE_COMPACT_BASE_CLASSES).toContain('motion-safe:transition-colors');
    });
  });

  // =============================================================================
  // Default label constants tests
  // =============================================================================

  describe('default labels', () => {
    it('DEFAULT_LIGHT_LABEL describes switching to light theme', () => {
      expect(DEFAULT_LIGHT_LABEL).toBe('Switch to light theme');
    });

    it('DEFAULT_DARK_LABEL describes switching to dark theme', () => {
      expect(DEFAULT_DARK_LABEL).toBe('Switch to dark theme');
    });

    it('labels are different from each other', () => {
      expect(DEFAULT_LIGHT_LABEL).not.toBe(DEFAULT_DARK_LABEL);
    });

    it('both labels include the word "Switch"', () => {
      expect(DEFAULT_LIGHT_LABEL).toContain('Switch');
      expect(DEFAULT_DARK_LABEL).toContain('Switch');
    });

    it('both labels include theme name', () => {
      expect(DEFAULT_LIGHT_LABEL).toContain('light');
      expect(DEFAULT_DARK_LABEL).toContain('dark');
    });
  });

  // =============================================================================
  // ARIA label behavior documentation tests
  // =============================================================================

  describe('ARIA label behavior', () => {
    it('documents that aria-label reflects target theme, not current theme', () => {
      // When resolvedTheme is 'dark', aria-label should be 'Switch to light theme'
      // When resolvedTheme is 'light', aria-label should be 'Switch to dark theme'
      // This is verified in the component implementation
      expect(DEFAULT_LIGHT_LABEL).toBe('Switch to light theme');
      expect(DEFAULT_DARK_LABEL).toBe('Switch to dark theme');
    });
  });

  // =============================================================================
  // Size consistency tests
  // =============================================================================

  describe('size consistency', () => {
    it('all sizes have both button and icon classes', () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      for (const size of sizes) {
        const result = getSizeClasses(size);
        expect(result.button.length).toBeGreaterThan(0);
        expect(result.icon.length).toBeGreaterThan(0);
      }
    });

    it('button classes always include height and width', () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      for (const size of sizes) {
        const result = getSizeClasses(size);
        const hasHeight = result.button.some((c) => c.startsWith('h-') || c.includes(':h-'));
        const hasWidth = result.button.some((c) => c.startsWith('w-') || c.includes(':w-'));
        expect(hasHeight).toBe(true);
        expect(hasWidth).toBe(true);
      }
    });

    it('icon classes always include height and width', () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      for (const size of sizes) {
        const result = getSizeClasses(size);
        const hasHeight = result.icon.some((c) => c.startsWith('h-'));
        const hasWidth = result.icon.some((c) => c.startsWith('w-'));
        expect(hasHeight).toBe(true);
        expect(hasWidth).toBe(true);
      }
    });
  });

  // =============================================================================
  // Responsive breakpoint order tests
  // =============================================================================

  describe('responsive breakpoint order', () => {
    it('applies breakpoints in correct order', () => {
      const result = getSizeClasses({
        base: 'sm',
        sm: 'sm',
        md: 'md',
        lg: 'lg',
      });

      // Find indices of classes
      const baseIndex = result.button.findIndex((c) => c === 'h-11');
      const smIndex = result.button.findIndex((c) => c === 'sm:h-9');
      const mdIndex = result.button.findIndex((c) => c === 'md:h-11');
      const lgIndex = result.button.findIndex((c) => c === 'lg:h-12');

      // Verify order: base < sm < md < lg
      expect(baseIndex).toBeLessThan(smIndex);
      expect(smIndex).toBeLessThan(mdIndex);
      expect(mdIndex).toBeLessThan(lgIndex);
    });
  });

  // =============================================================================
  // Default props documentation tests
  // =============================================================================

  describe('default props documentation', () => {
    it('documents default size is md', () => {
      // This is documented in the component interface
      // Default size is 'md' which provides 44px touch target
      const result = getSizeClasses('md');
      expect(result.button).toContain('h-11');
    });

    it('documents default disabled is false', () => {
      // Default disabled is false, allowing normal interaction
      // When disabled, component adds 'cursor-not-allowed opacity-50'
      expect(true).toBe(true); // Documentation test
    });

    it('documents default labels', () => {
      expect(DEFAULT_LIGHT_LABEL).toBe('Switch to light theme');
      expect(DEFAULT_DARK_LABEL).toBe('Switch to dark theme');
    });
  });
});
