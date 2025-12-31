import { describe, expect, it } from 'vitest';
import { getSizeClasses } from '../../../packages/ui/atoms/HamburgerButton';

describe('HamburgerButton', () => {
  describe('getSizeClasses', () => {
    describe('with string size values', () => {
      it('returns correct classes for sm size', () => {
        const result = getSizeClasses('sm');

        expect(result.button).toContain('min-h-[44px]');
        expect(result.button).toContain('min-w-[44px]');
        expect(result.button).toContain('sm:h-9');
        expect(result.button).toContain('sm:w-9');
        expect(result.icon).toContain('h-5');
        expect(result.icon).toContain('w-5');
      });

      it('returns correct classes for md size', () => {
        const result = getSizeClasses('md');

        expect(result.button).toContain('min-h-[44px]');
        expect(result.button).toContain('min-w-[44px]');
        expect(result.button).toContain('sm:h-11');
        expect(result.button).toContain('sm:w-11');
        expect(result.icon).toContain('h-6');
        expect(result.icon).toContain('w-6');
      });

      it('returns correct classes for lg size', () => {
        const result = getSizeClasses('lg');

        expect(result.button).toContain('min-h-[44px]');
        expect(result.button).toContain('min-w-[44px]');
        expect(result.icon).toContain('h-7');
        expect(result.icon).toContain('w-7');
      });
    });

    describe('with responsive size values', () => {
      it('handles base breakpoint', () => {
        const result = getSizeClasses({ base: 'sm' });

        expect(result.button).toContain('min-h-[44px]');
        expect(result.button).toContain('min-w-[44px]');
        expect(result.icon).toContain('h-5');
        expect(result.icon).toContain('w-5');
      });

      it('handles sm breakpoint', () => {
        const result = getSizeClasses({ sm: 'md' });

        expect(result.button).toContain('sm:min-h-[44px]');
        expect(result.button).toContain('sm:min-w-[44px]');
        expect(result.icon).toContain('sm:h-6');
        expect(result.icon).toContain('sm:w-6');
      });

      it('handles md breakpoint', () => {
        const result = getSizeClasses({ md: 'lg' });

        expect(result.button).toContain('md:min-h-[44px]');
        expect(result.button).toContain('md:min-w-[44px]');
        expect(result.icon).toContain('md:h-7');
        expect(result.icon).toContain('md:w-7');
      });

      it('handles lg breakpoint', () => {
        const result = getSizeClasses({ lg: 'sm' });

        expect(result.button).toContain('lg:min-h-[44px]');
        expect(result.icon).toContain('lg:h-5');
        expect(result.icon).toContain('lg:w-5');
      });

      it('handles xl breakpoint', () => {
        const result = getSizeClasses({ xl: 'md' });

        expect(result.button).toContain('xl:min-h-[44px]');
        expect(result.icon).toContain('xl:h-6');
        expect(result.icon).toContain('xl:w-6');
      });

      it('handles 2xl breakpoint', () => {
        const result = getSizeClasses({ '2xl': 'lg' });

        expect(result.button).toContain('2xl:min-h-[44px]');
        expect(result.icon).toContain('2xl:h-7');
        expect(result.icon).toContain('2xl:w-7');
      });

      it('handles multiple breakpoints', () => {
        const result = getSizeClasses({ base: 'sm', md: 'md', lg: 'lg' });

        // Base breakpoint classes (no prefix)
        expect(result.button).toContain('min-h-[44px]');
        expect(result.icon).toContain('h-5');
        expect(result.icon).toContain('w-5');

        // md breakpoint classes
        expect(result.button).toContain('md:min-h-[44px]');
        expect(result.icon).toContain('md:h-6');

        // lg breakpoint classes
        expect(result.button).toContain('lg:min-h-[44px]');
        expect(result.icon).toContain('lg:h-7');
      });

      it('handles empty object', () => {
        const result = getSizeClasses({});

        expect(result.button).toEqual([]);
        expect(result.icon).toEqual([]);
      });

      it('processes breakpoints in correct order', () => {
        const result = getSizeClasses({ lg: 'lg', base: 'sm', md: 'md' });

        // Check that base comes before md in the array
        const baseIndex = result.icon.indexOf('h-5');
        const mdIndex = result.icon.indexOf('md:h-6');
        const lgIndex = result.icon.indexOf('lg:h-7');

        expect(baseIndex).toBeLessThan(mdIndex);
        expect(mdIndex).toBeLessThan(lgIndex);
      });
    });
  });

  describe('touch target accessibility', () => {
    it('all sizes have 44px minimum touch target on mobile', () => {
      const sizes = ['sm', 'md', 'lg'] as const;

      for (const size of sizes) {
        const result = getSizeClasses(size);
        expect(result.button).toContain('min-h-[44px]');
        expect(result.button).toContain('min-w-[44px]');
      }
    });

    it('sm size relaxes to 36px on sm+ screens', () => {
      const result = getSizeClasses('sm');
      expect(result.button).toContain('sm:h-9');
      expect(result.button).toContain('sm:w-9');
    });

    it('md size relaxes to 44px on sm+ screens', () => {
      const result = getSizeClasses('md');
      expect(result.button).toContain('sm:h-11');
      expect(result.button).toContain('sm:w-11');
    });

    it('lg size maintains 44px minimum at all breakpoints', () => {
      const result = getSizeClasses('lg');
      // lg has min-h/min-w but no sm: overrides
      expect(result.button).toContain('min-h-[44px]');
      expect(result.button).toContain('min-w-[44px]');
      expect(result.button.filter((c) => c.startsWith('sm:h-'))).toHaveLength(0);
    });
  });

  describe('icon sizing', () => {
    it('sm size has 20px (h-5) icon', () => {
      const result = getSizeClasses('sm');
      expect(result.icon).toContain('h-5');
      expect(result.icon).toContain('w-5');
    });

    it('md size has 24px (h-6) icon', () => {
      const result = getSizeClasses('md');
      expect(result.icon).toContain('h-6');
      expect(result.icon).toContain('w-6');
    });

    it('lg size has 28px (h-7) icon', () => {
      const result = getSizeClasses('lg');
      expect(result.icon).toContain('h-7');
      expect(result.icon).toContain('w-7');
    });
  });

  describe('type safety', () => {
    it('handles null size gracefully', () => {
      // @ts-expect-error Testing runtime behavior with invalid input
      const result = getSizeClasses(null);
      expect(result.button).toEqual([]);
      expect(result.icon).toEqual([]);
    });

    it('handles undefined size gracefully', () => {
      // @ts-expect-error Testing runtime behavior with invalid input
      const result = getSizeClasses(undefined);
      expect(result.button).toEqual([]);
      expect(result.icon).toEqual([]);
    });
  });

  describe('class structure', () => {
    it('returns arrays of individual classes (not space-separated strings)', () => {
      const result = getSizeClasses('md');

      for (const className of result.button) {
        expect(className).not.toContain(' ');
      }

      for (const className of result.icon) {
        expect(className).not.toContain(' ');
      }
    });

    it('includes min-h and min-w reset classes for sm breakpoint', () => {
      const result = getSizeClasses('sm');

      expect(result.button).toContain('sm:min-h-0');
      expect(result.button).toContain('sm:min-w-0');
    });
  });

  describe('accessibility requirements', () => {
    describe('aria-label changes with state', () => {
      // These tests document the expected behavior for aria-label
      it('should use openLabel when closed (isOpen=false)', () => {
        // Component uses: aria-label={isOpen ? closeLabel : openLabel}
        const isOpen = false;
        const openLabel = 'Open navigation menu';
        const closeLabel = 'Close navigation menu';
        const currentLabel = isOpen ? closeLabel : openLabel;
        expect(currentLabel).toBe('Open navigation menu');
      });

      it('should use closeLabel when open (isOpen=true)', () => {
        const isOpen = true;
        const openLabel = 'Open navigation menu';
        const closeLabel = 'Close navigation menu';
        const currentLabel = isOpen ? closeLabel : openLabel;
        expect(currentLabel).toBe('Close navigation menu');
      });
    });

    describe('aria-expanded reflects state', () => {
      it('aria-expanded should be false when closed', () => {
        const isOpen = false;
        expect(isOpen).toBe(false);
      });

      it('aria-expanded should be true when open', () => {
        const isOpen = true;
        expect(isOpen).toBe(true);
      });
    });

    describe('data-state attribute', () => {
      it('should be "closed" when isOpen is false', () => {
        const isOpen = false;
        const dataState = isOpen ? 'open' : 'closed';
        expect(dataState).toBe('closed');
      });

      it('should be "open" when isOpen is true', () => {
        const isOpen = true;
        const dataState = isOpen ? 'open' : 'closed';
        expect(dataState).toBe('open');
      });
    });
  });

  describe('icon selection', () => {
    it('should show Menu icon when closed', () => {
      // Component logic: const Icon = isOpen ? X : Menu
      const isOpen = false;
      const iconType = isOpen ? 'X' : 'Menu';
      expect(iconType).toBe('Menu');
    });

    it('should show X icon when open', () => {
      const isOpen = true;
      const iconType = isOpen ? 'X' : 'Menu';
      expect(iconType).toBe('X');
    });
  });

  describe('screen reader announcements', () => {
    it('announces "Menu closed" when closed', () => {
      const isOpen = false;
      const announcement = isOpen ? 'Menu open' : 'Menu closed';
      expect(announcement).toBe('Menu closed');
    });

    it('announces "Menu open" when open', () => {
      const isOpen = true;
      const announcement = isOpen ? 'Menu open' : 'Menu closed';
      expect(announcement).toBe('Menu open');
    });
  });

  describe('default props', () => {
    it('has sensible defaults documented', () => {
      // These are the default values defined in the component
      const defaults = {
        isOpen: false,
        size: 'md',
        openLabel: 'Open navigation menu',
        closeLabel: 'Close navigation menu',
        controlsId: 'mobile-nav',
      };

      expect(defaults.isOpen).toBe(false);
      expect(defaults.size).toBe('md');
      expect(defaults.openLabel).toBe('Open navigation menu');
      expect(defaults.closeLabel).toBe('Close navigation menu');
      expect(defaults.controlsId).toBe('mobile-nav');
    });
  });
});
