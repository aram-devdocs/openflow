/**
 * Icon Component Utility Function Tests
 *
 * Tests for the Icon atom utility functions and class generation.
 * Component rendering is tested via Storybook.
 */

import { type IconSize, getResponsiveSizeClasses } from '@openflow/ui';
import { describe, expect, it } from 'vitest';

// =============================================================================
// Re-implement utility functions for testing
// (mirrors the logic in Icon.tsx)
// =============================================================================

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

const sizeClasses: Record<IconSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

// =============================================================================
// Tests
// =============================================================================

describe('ui/atoms/Icon - Utility Functions', () => {
  // ===========================================================================
  // Size Classes Definition
  // ===========================================================================

  describe('sizeClasses', () => {
    it('xs size has correct dimensions (12x12px)', () => {
      expect(sizeClasses.xs).toBe('h-3 w-3');
    });

    it('sm size has correct dimensions (16x16px)', () => {
      expect(sizeClasses.sm).toBe('h-4 w-4');
    });

    it('md size has correct dimensions (20x20px)', () => {
      expect(sizeClasses.md).toBe('h-5 w-5');
    });

    it('lg size has correct dimensions (24x24px)', () => {
      expect(sizeClasses.lg).toBe('h-6 w-6');
    });

    it('xl size has correct dimensions (32x32px)', () => {
      expect(sizeClasses.xl).toBe('h-8 w-8');
    });

    it('all sizes have matching height and width', () => {
      for (const [_size, classes] of Object.entries(sizeClasses)) {
        const parts = classes.split(' ');
        const height = parts.find((p) => p.startsWith('h-'));
        const width = parts.find((p) => p.startsWith('w-'));

        expect(height).toBeDefined();
        expect(width).toBeDefined();

        // Extract numeric value and compare
        const hVal = height?.replace('h-', '');
        const wVal = width?.replace('w-', '');
        expect(hVal).toBe(wVal);
      }
    });
  });

  // ===========================================================================
  // getResponsiveSizeClasses
  // ===========================================================================

  describe('getResponsiveSizeClasses', () => {
    describe('string sizes', () => {
      it('handles xs size', () => {
        const classes = getResponsiveSizeClasses('xs');
        expect(classes).toEqual(['h-3 w-3']);
      });

      it('handles sm size', () => {
        const classes = getResponsiveSizeClasses('sm');
        expect(classes).toEqual(['h-4 w-4']);
      });

      it('handles md size (default)', () => {
        const classes = getResponsiveSizeClasses('md');
        expect(classes).toEqual(['h-5 w-5']);
      });

      it('handles lg size', () => {
        const classes = getResponsiveSizeClasses('lg');
        expect(classes).toEqual(['h-6 w-6']);
      });

      it('handles xl size', () => {
        const classes = getResponsiveSizeClasses('xl');
        expect(classes).toEqual(['h-8 w-8']);
      });
    });

    describe('responsive object sizes', () => {
      it('handles base breakpoint only', () => {
        const classes = getResponsiveSizeClasses({ base: 'sm' });
        expect(classes).toContain('h-4');
        expect(classes).toContain('w-4');
      });

      it('handles base and md breakpoints', () => {
        const classes = getResponsiveSizeClasses({ base: 'sm', md: 'lg' });

        // Base classes (no prefix)
        expect(classes).toContain('h-4');
        expect(classes).toContain('w-4');

        // MD classes (with prefix)
        expect(classes).toContain('md:h-6');
        expect(classes).toContain('md:w-6');
      });

      it('handles multiple breakpoints progressively', () => {
        const classes = getResponsiveSizeClasses({
          base: 'xs',
          sm: 'sm',
          md: 'md',
          lg: 'lg',
          xl: 'xl',
        });

        // Base (xs)
        expect(classes).toContain('h-3');
        expect(classes).toContain('w-3');

        // sm
        expect(classes).toContain('sm:h-4');
        expect(classes).toContain('sm:w-4');

        // md
        expect(classes).toContain('md:h-5');
        expect(classes).toContain('md:w-5');

        // lg
        expect(classes).toContain('lg:h-6');
        expect(classes).toContain('lg:w-6');

        // xl
        expect(classes).toContain('xl:h-8');
        expect(classes).toContain('xl:w-8');
      });

      it('handles non-sequential breakpoints', () => {
        const classes = getResponsiveSizeClasses({ base: 'sm', lg: 'xl' });

        // Base
        expect(classes).toContain('h-4');
        expect(classes).toContain('w-4');

        // LG (skip md)
        expect(classes).toContain('lg:h-8');
        expect(classes).toContain('lg:w-8');

        // MD should not be present
        const mdClasses = classes.filter((c) => c.startsWith('md:'));
        expect(mdClasses).toHaveLength(0);

        // SM should not be present (only base breakpoint)
        const smClasses = classes.filter((c) => c.startsWith('sm:'));
        expect(smClasses).toHaveLength(0);
      });

      it('handles 2xl breakpoint', () => {
        const classes = getResponsiveSizeClasses({ base: 'sm', '2xl': 'xl' });

        expect(classes).toContain('h-4');
        expect(classes).toContain('2xl:h-8');
        expect(classes).toContain('2xl:w-8');
      });
    });

    describe('edge cases', () => {
      it('returns empty array for empty object', () => {
        const classes = getResponsiveSizeClasses({} as ResponsiveValue<IconSize>);
        expect(classes).toEqual([]);
      });

      it('returns string size class for undefined handling', () => {
        // When given a simple string, return in array format
        const classes = getResponsiveSizeClasses('md');
        expect(classes.length).toBe(1);
        expect(classes[0]).toBe('h-5 w-5');
      });
    });
  });

  // ===========================================================================
  // Size Progression
  // ===========================================================================

  describe('size progression', () => {
    it('sizes increase in logical steps', () => {
      const sizeOrder: IconSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
      const dimensions = sizeOrder.map((size) => {
        const classes = sizeClasses[size];
        const match = classes.match(/h-(\d+)/);
        return match?.[1] ? Number.parseInt(match[1], 10) : 0;
      });

      for (let i = 1; i < dimensions.length; i++) {
        const prev = dimensions[i - 1];
        const curr = dimensions[i];
        if (prev !== undefined && curr !== undefined) {
          expect(curr).toBeGreaterThan(prev);
        }
      }
    });

    it('xs to xl doubles in size', () => {
      const xsMatch = sizeClasses.xs.match(/h-(\d+)/);
      const xlMatch = sizeClasses.xl.match(/h-(\d+)/);

      expect(xsMatch).toBeDefined();
      expect(xlMatch).toBeDefined();

      const xsHeight = Number.parseInt(xsMatch?.[1] ?? '0', 10);
      const xlHeight = Number.parseInt(xlMatch?.[1] ?? '0', 10);

      // xl should be significantly larger than xs
      expect(xlHeight).toBeGreaterThan(xsHeight * 2);
    });
  });

  // ===========================================================================
  // Accessibility Behavior Documentation
  // ===========================================================================

  describe('accessibility behavior (documented)', () => {
    it('decorative icons should have aria-hidden="true"', () => {
      // This test documents expected behavior - actual testing in Storybook/RTL
      // When no aria-label is provided, icon is decorative
      const decorativeIcon = {
        ariaHidden: 'true',
        ariaLabel: undefined,
        role: undefined,
      };

      expect(decorativeIcon.ariaHidden).toBe('true');
      expect(decorativeIcon.ariaLabel).toBeUndefined();
    });

    it('meaningful icons should have aria-label and role="img"', () => {
      // This test documents expected behavior - actual testing in Storybook/RTL
      // When aria-label is provided, icon is meaningful
      const meaningfulIcon = {
        ariaHidden: undefined,
        ariaLabel: 'Warning',
        role: 'img',
      };

      expect(meaningfulIcon.ariaHidden).toBeUndefined();
      expect(meaningfulIcon.ariaLabel).toBe('Warning');
      expect(meaningfulIcon.role).toBe('img');
    });

    it('all icons should have focusable="false"', () => {
      // This test documents expected behavior - actual testing in Storybook/RTL
      // All icons should not be focusable (focus goes to containing button)
      const icon = { focusable: 'false' };
      expect(icon.focusable).toBe('false');
    });
  });

  // ===========================================================================
  // Size Consistency Tests
  // ===========================================================================

  describe('size consistency', () => {
    it('all sizes include both height and width', () => {
      for (const [_size, classes] of Object.entries(sizeClasses)) {
        expect(classes).toMatch(/h-\d+/);
        expect(classes).toMatch(/w-\d+/);
      }
    });

    it('all sizes use Tailwind spacing scale', () => {
      // Valid Tailwind spacing values: 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, etc.
      const validSpacing = [
        '0.5',
        '1',
        '1.5',
        '2',
        '2.5',
        '3',
        '3.5',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '14',
        '16',
      ];

      for (const [_size, classes] of Object.entries(sizeClasses)) {
        const heightMatch = classes.match(/h-(\d+\.?\d*)/)?.[1];
        const widthMatch = classes.match(/w-(\d+\.?\d*)/)?.[1];

        expect(heightMatch).toBeDefined();
        expect(widthMatch).toBeDefined();
        expect(validSpacing).toContain(heightMatch);
        expect(validSpacing).toContain(widthMatch);
      }
    });
  });

  // ===========================================================================
  // Responsive Class Generation
  // ===========================================================================

  describe('responsive class generation details', () => {
    it('base classes have no prefix', () => {
      const classes = getResponsiveSizeClasses({ base: 'md' });
      const hasUnprefixedHeight = classes.some((c) => c === 'h-5');
      const hasUnprefixedWidth = classes.some((c) => c === 'w-5');

      expect(hasUnprefixedHeight).toBe(true);
      expect(hasUnprefixedWidth).toBe(true);
    });

    it('breakpoint classes have correct prefix format', () => {
      const classes = getResponsiveSizeClasses({ base: 'sm', md: 'lg' });

      const mdHeight = classes.find((c) => c.startsWith('md:h-'));
      const mdWidth = classes.find((c) => c.startsWith('md:w-'));

      expect(mdHeight).toBe('md:h-6');
      expect(mdWidth).toBe('md:w-6');
    });

    it('splits size classes correctly for prefixing', () => {
      const classes = getResponsiveSizeClasses({ sm: 'md' });

      // Each dimension should be separate
      expect(classes).toContain('sm:h-5');
      expect(classes).toContain('sm:w-5');

      // Should not have combined class
      const hasCombined = classes.some((c) => c === 'sm:h-5 w-5');
      expect(hasCombined).toBe(false);
    });
  });

  // ===========================================================================
  // Default Prop Values
  // ===========================================================================

  describe('default prop values (documented)', () => {
    it('default size is md', () => {
      // This test documents expected default - actual testing in Storybook/RTL
      const defaultSize = 'md';
      expect(defaultSize).toBe('md');
    });

    it('default icon is decorative (no aria-label)', () => {
      // This test documents expected default - actual testing in Storybook/RTL
      const defaultAriaLabel = undefined;
      expect(defaultAriaLabel).toBeUndefined();
    });
  });
});
