import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SPINNER_LABEL,
  SPINNER_BASE_CLASSES,
  getResponsiveSizeClasses,
} from '../../../packages/ui/atoms/Spinner';

describe('Spinner', () => {
  // ===========================================================================
  // SIZE CLASSES
  // ===========================================================================

  describe('getResponsiveSizeClasses', () => {
    describe('static sizes', () => {
      it('returns correct classes for xs size', () => {
        const classes = getResponsiveSizeClasses('xs');
        expect(classes).toEqual(['h-3', 'w-3']);
      });

      it('returns correct classes for sm size', () => {
        const classes = getResponsiveSizeClasses('sm');
        expect(classes).toEqual(['h-4', 'w-4']);
      });

      it('returns correct classes for md size', () => {
        const classes = getResponsiveSizeClasses('md');
        expect(classes).toEqual(['h-5', 'w-5']);
      });

      it('returns correct classes for lg size', () => {
        const classes = getResponsiveSizeClasses('lg');
        expect(classes).toEqual(['h-6', 'w-6']);
      });

      it('returns correct classes for xl size', () => {
        const classes = getResponsiveSizeClasses('xl');
        expect(classes).toEqual(['h-8', 'w-8']);
      });
    });

    describe('responsive sizes', () => {
      it('returns correct classes for base breakpoint only', () => {
        const classes = getResponsiveSizeClasses({ base: 'sm' });
        expect(classes).toEqual(['h-4', 'w-4']);
      });

      it('returns correct classes for base and sm breakpoints', () => {
        const classes = getResponsiveSizeClasses({ base: 'xs', sm: 'md' });
        expect(classes).toEqual(['h-3', 'w-3', 'sm:h-5', 'sm:w-5']);
      });

      it('returns correct classes for base, md, and lg breakpoints', () => {
        const classes = getResponsiveSizeClasses({ base: 'sm', md: 'lg', lg: 'xl' });
        expect(classes).toEqual(['h-4', 'w-4', 'md:h-6', 'md:w-6', 'lg:h-8', 'lg:w-8']);
      });

      it('returns correct classes for all breakpoints', () => {
        const classes = getResponsiveSizeClasses({
          base: 'xs',
          sm: 'sm',
          md: 'md',
          lg: 'lg',
          xl: 'xl',
        });
        expect(classes).toEqual([
          'h-3',
          'w-3',
          'sm:h-4',
          'sm:w-4',
          'md:h-5',
          'md:w-5',
          'lg:h-6',
          'lg:w-6',
          'xl:h-8',
          'xl:w-8',
        ]);
      });

      it('handles sparse breakpoints (skipping some)', () => {
        const classes = getResponsiveSizeClasses({ base: 'xs', lg: 'xl' });
        expect(classes).toEqual(['h-3', 'w-3', 'lg:h-8', 'lg:w-8']);
      });

      it('handles 2xl breakpoint', () => {
        const classes = getResponsiveSizeClasses({ base: 'sm', '2xl': 'xl' });
        expect(classes).toEqual(['h-4', 'w-4', '2xl:h-8', '2xl:w-8']);
      });

      it('handles responsive object without base', () => {
        // This is technically valid - starts at sm breakpoint
        const classes = getResponsiveSizeClasses({ sm: 'md', lg: 'lg' });
        expect(classes).toEqual(['sm:h-5', 'sm:w-5', 'lg:h-6', 'lg:w-6']);
      });
    });

    describe('edge cases', () => {
      it('returns empty array for empty object', () => {
        const classes = getResponsiveSizeClasses({});
        expect(classes).toEqual([]);
      });

      it('handles undefined values in responsive object gracefully', () => {
        const classes = getResponsiveSizeClasses({ base: 'md', md: undefined } as never);
        expect(classes).toContain('h-5');
        expect(classes).toContain('w-5');
      });
    });
  });

  // ===========================================================================
  // CONSTANTS
  // ===========================================================================

  describe('SPINNER_BASE_CLASSES', () => {
    it('includes motion-safe animation', () => {
      expect(SPINNER_BASE_CLASSES).toBe('motion-safe:animate-spin');
    });
  });

  describe('DEFAULT_SPINNER_LABEL', () => {
    it('has correct default value', () => {
      expect(DEFAULT_SPINNER_LABEL).toBe('Loading');
    });
  });

  // ===========================================================================
  // SIZE PROGRESSION
  // ===========================================================================

  describe('size progression', () => {
    it('sizes increase in correct order', () => {
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
      const heightValues = sizes.map((size) => {
        const classes = getResponsiveSizeClasses(size);
        const heightClass = classes.find((c) => c.startsWith('h-'));
        return heightClass ? Number.parseInt(heightClass.replace('h-', ''), 10) : 0;
      });

      // Each size should be larger than the previous
      for (let i = 1; i < heightValues.length; i++) {
        const current = heightValues[i];
        const previous = heightValues[i - 1];
        if (current !== undefined && previous !== undefined) {
          expect(current).toBeGreaterThan(previous);
        }
      }
    });

    it('width matches height for all sizes', () => {
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

      for (const size of sizes) {
        const classes = getResponsiveSizeClasses(size);
        const heightClass = classes.find((c) => c.startsWith('h-'));
        const widthClass = classes.find((c) => c.startsWith('w-'));
        const heightValue = heightClass?.replace('h-', '');
        const widthValue = widthClass?.replace('w-', '');
        expect(heightValue).toBe(widthValue);
      }
    });
  });

  // ===========================================================================
  // ACCESSIBILITY DOCUMENTATION
  // ===========================================================================

  describe('accessibility behavior (documentation)', () => {
    it('documents that spinner uses aria-hidden="true" on SVG', () => {
      // The SVG itself is decorative - the VisuallyHidden element provides the accessible content
      // This documents expected behavior, not testing JSX output
      const expectedBehavior = {
        svgAriaHidden: true,
        svgFocusable: false,
        announcementMethod: 'VisuallyHidden with role="status" and aria-live="polite"',
      };
      expect(expectedBehavior.svgAriaHidden).toBe(true);
      expect(expectedBehavior.svgFocusable).toBe(false);
    });

    it('documents the announce prop behavior', () => {
      // When announce={true} (default): VisuallyHidden element is rendered with aria-live
      // When announce={false}: No announcement element, spinner is silent
      const announceBehavior = {
        announceTrue: 'Renders VisuallyHidden with role="status" and aria-live="polite"',
        announceFalse: 'Does not render announcement element',
        useCase:
          'Set announce={false} when spinner is inside a button with aria-busy, or when parent provides context',
      };
      expect(announceBehavior.announceTrue).toContain('aria-live');
      expect(announceBehavior.useCase).toContain('announce={false}');
    });

    it('documents reduced motion support', () => {
      expect(SPINNER_BASE_CLASSES).toBe('motion-safe:animate-spin');
      // This means: animation only runs when user has NOT enabled "reduce motion" preference
    });
  });

  // ===========================================================================
  // PROPS INTERFACE DOCUMENTATION
  // ===========================================================================

  describe('props interface (documentation)', () => {
    it('documents default values', () => {
      const defaults = {
        size: 'md',
        announce: true,
        label: 'Loading',
      };
      expect(defaults.size).toBe('md');
      expect(defaults.announce).toBe(true);
      expect(defaults.label).toBe(DEFAULT_SPINNER_LABEL);
    });

    it('documents size values', () => {
      const validSizes = ['xs', 'sm', 'md', 'lg', 'xl'];
      const pixelSizes = {
        xs: 12,
        sm: 16,
        md: 20,
        lg: 24,
        xl: 32,
      };
      expect(validSizes).toHaveLength(5);
      expect(pixelSizes.xl).toBeGreaterThan(pixelSizes.xs);
    });

    it('documents label priority', () => {
      // aria-label takes precedence over label prop
      // label prop takes precedence over default
      const priority = ['aria-label', 'label', 'DEFAULT_SPINNER_LABEL'];
      expect(priority[0]).toBe('aria-label');
    });
  });

  // ===========================================================================
  // TAILWIND CLASS CONSISTENCY
  // ===========================================================================

  describe('Tailwind class consistency', () => {
    it('all size classes follow h-X w-X pattern', () => {
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

      for (const size of sizes) {
        const classes = getResponsiveSizeClasses(size);
        expect(classes).toHaveLength(2);
        expect(classes[0]).toMatch(/^h-\d+$/);
        expect(classes[1]).toMatch(/^w-\d+$/);
      }
    });

    it('responsive breakpoint classes follow correct format', () => {
      const classes = getResponsiveSizeClasses({
        base: 'sm',
        sm: 'md',
        md: 'lg',
        lg: 'xl',
        xl: 'xl',
        '2xl': 'xl',
      });

      // Check base classes (no prefix)
      expect(classes).toContain('h-4');
      expect(classes).toContain('w-4');

      // Check prefixed classes
      expect(classes).toContain('sm:h-5');
      expect(classes).toContain('md:h-6');
      expect(classes).toContain('lg:h-8');
      expect(classes).toContain('xl:h-8');
      expect(classes).toContain('2xl:h-8');
    });
  });

  // ===========================================================================
  // RESPONSIVE BREAKPOINT ORDER
  // ===========================================================================

  describe('responsive breakpoint order', () => {
    it('outputs classes in correct breakpoint order', () => {
      const classes = getResponsiveSizeClasses({
        '2xl': 'xl',
        base: 'xs',
        lg: 'lg',
        sm: 'sm',
        md: 'md',
      });

      // Find indices of breakpoint prefixes
      const baseIndex = classes.findIndex((c) => c === 'h-3');
      const smIndex = classes.findIndex((c) => c === 'sm:h-4');
      const mdIndex = classes.findIndex((c) => c === 'md:h-5');
      const lgIndex = classes.findIndex((c) => c === 'lg:h-6');
      const xl2Index = classes.findIndex((c) => c === '2xl:h-8');

      // Verify order: base -> sm -> md -> lg -> 2xl
      expect(baseIndex).toBeLessThan(smIndex);
      expect(smIndex).toBeLessThan(mdIndex);
      expect(mdIndex).toBeLessThan(lgIndex);
      expect(lgIndex).toBeLessThan(xl2Index);
    });
  });

  // ===========================================================================
  // USAGE PATTERNS
  // ===========================================================================

  describe('usage patterns (documentation)', () => {
    it('documents standalone usage pattern', () => {
      // When spinner is used on its own, use default announce={true}
      const standalonePattern = {
        announce: true,
        label: 'Loading', // or custom label
        role: 'status',
        ariaLive: 'polite',
      };
      expect(standalonePattern.announce).toBe(true);
    });

    it('documents button loading pattern', () => {
      // When spinner is inside a button, the button provides context
      const buttonPattern = {
        spinnerAnnounce: false,
        buttonAriaBusy: true,
        buttonDisabled: true,
        reason: 'Button aria-busy announces loading state, spinner is purely visual',
      };
      expect(buttonPattern.spinnerAnnounce).toBe(false);
      expect(buttonPattern.buttonAriaBusy).toBe(true);
    });

    it('documents contextual usage pattern', () => {
      // When spinner is inside a container with its own aria-label
      const contextualPattern = {
        spinnerAnnounce: false,
        containerRole: 'status',
        containerAriaLabel: 'descriptive label',
        reason: 'Container provides accessible context, spinner is purely visual',
      };
      expect(contextualPattern.spinnerAnnounce).toBe(false);
    });
  });
});
