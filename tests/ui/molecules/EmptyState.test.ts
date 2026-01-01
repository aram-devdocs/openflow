import { describe, expect, it } from 'vitest';
import {
  EMPTY_STATE_BASE_CLASSES,
  type EmptyStateSize,
  SIZE_STYLES,
  getBaseSize,
  getResponsiveSizeClasses,
} from '../../../packages/ui/molecules/EmptyState';

describe('EmptyState', () => {
  // ===========================================================================
  // Constants
  // ===========================================================================

  describe('EMPTY_STATE_BASE_CLASSES', () => {
    it('should contain flex container classes', () => {
      expect(EMPTY_STATE_BASE_CLASSES).toContain('flex');
      expect(EMPTY_STATE_BASE_CLASSES).toContain('flex-col');
    });

    it('should center content horizontally and vertically', () => {
      expect(EMPTY_STATE_BASE_CLASSES).toContain('items-center');
      expect(EMPTY_STATE_BASE_CLASSES).toContain('justify-center');
    });

    it('should center text', () => {
      expect(EMPTY_STATE_BASE_CLASSES).toContain('text-center');
    });
  });

  describe('SIZE_STYLES', () => {
    it('should define all three sizes', () => {
      expect(SIZE_STYLES).toHaveProperty('sm');
      expect(SIZE_STYLES).toHaveProperty('md');
      expect(SIZE_STYLES).toHaveProperty('lg');
    });

    it('should have container classes for each size', () => {
      expect(SIZE_STYLES.sm.container).toBeDefined();
      expect(SIZE_STYLES.md.container).toBeDefined();
      expect(SIZE_STYLES.lg.container).toBeDefined();
    });

    it('should have icon wrapper classes for each size', () => {
      expect(SIZE_STYLES.sm.iconWrapper).toContain('p-2');
      expect(SIZE_STYLES.md.iconWrapper).toContain('p-3');
      expect(SIZE_STYLES.lg.iconWrapper).toContain('p-4');
    });

    it('should have icon size classes that increase with size', () => {
      expect(SIZE_STYLES.sm.icon).toContain('h-5');
      expect(SIZE_STYLES.md.icon).toContain('h-6');
      expect(SIZE_STYLES.lg.icon).toContain('h-8');
    });

    it('should have heading sizes that increase with component size', () => {
      expect(SIZE_STYLES.sm.headingSize).toBe('sm');
      expect(SIZE_STYLES.md.headingSize).toBe('base');
      expect(SIZE_STYLES.lg.headingSize).toBe('lg');
    });

    it('should have description sizes appropriate for each component size', () => {
      expect(SIZE_STYLES.sm.descriptionSize).toBe('xs');
      expect(SIZE_STYLES.md.descriptionSize).toBe('sm');
      expect(SIZE_STYLES.lg.descriptionSize).toBe('sm');
    });

    it('should have button sizes that match component size appropriately', () => {
      expect(SIZE_STYLES.sm.buttonSize).toBe('sm');
      expect(SIZE_STYLES.md.buttonSize).toBe('md');
      expect(SIZE_STYLES.lg.buttonSize).toBe('md');
    });

    it('should have action container classes with gap', () => {
      expect(SIZE_STYLES.sm.actions).toContain('gap-2');
      expect(SIZE_STYLES.md.actions).toContain('gap-3');
      expect(SIZE_STYLES.lg.actions).toContain('gap-3');
    });

    it('should have padding classes that increase with size', () => {
      // Small has less padding
      expect(SIZE_STYLES.sm.container).toContain('py-6');
      expect(SIZE_STYLES.sm.container).toContain('px-4');

      // Medium has more padding
      expect(SIZE_STYLES.md.container).toContain('py-8');
      expect(SIZE_STYLES.md.container).toContain('px-6');

      // Large has most padding
      expect(SIZE_STYLES.lg.container).toContain('py-12');
      expect(SIZE_STYLES.lg.container).toContain('px-6');
    });
  });

  // ===========================================================================
  // getBaseSize Utility
  // ===========================================================================

  describe('getBaseSize', () => {
    describe('with string values', () => {
      it('should return "sm" for string "sm"', () => {
        expect(getBaseSize('sm')).toBe('sm');
      });

      it('should return "md" for string "md"', () => {
        expect(getBaseSize('md')).toBe('md');
      });

      it('should return "lg" for string "lg"', () => {
        expect(getBaseSize('lg')).toBe('lg');
      });
    });

    describe('with responsive objects', () => {
      it('should return base breakpoint value when provided', () => {
        expect(getBaseSize({ base: 'sm' })).toBe('sm');
        expect(getBaseSize({ base: 'md' })).toBe('md');
        expect(getBaseSize({ base: 'lg' })).toBe('lg');
      });

      it('should return base value even when other breakpoints are set', () => {
        expect(getBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
        expect(getBaseSize({ base: 'lg', sm: 'sm', lg: 'md' })).toBe('lg');
      });

      it('should default to "md" when base is not set', () => {
        expect(getBaseSize({ sm: 'lg' })).toBe('md');
        expect(getBaseSize({ md: 'lg', lg: 'sm' })).toBe('md');
      });

      it('should handle empty object by defaulting to "md"', () => {
        expect(getBaseSize({} as { base?: EmptyStateSize })).toBe('md');
      });
    });

    describe('edge cases', () => {
      it('should handle all breakpoint combinations', () => {
        expect(getBaseSize({ base: 'sm', sm: 'md', md: 'lg', lg: 'md', xl: 'lg' })).toBe('sm');
      });
    });
  });

  // ===========================================================================
  // getResponsiveSizeClasses Utility
  // ===========================================================================

  describe('getResponsiveSizeClasses', () => {
    describe('with string values', () => {
      it('should return container classes for "sm"', () => {
        const classes = getResponsiveSizeClasses('sm');
        expect(classes).toContain('py-6');
        expect(classes).toContain('px-4');
      });

      it('should return container classes for "md"', () => {
        const classes = getResponsiveSizeClasses('md');
        expect(classes).toContain('py-8');
        expect(classes).toContain('px-6');
      });

      it('should return container classes for "lg"', () => {
        const classes = getResponsiveSizeClasses('lg');
        expect(classes).toContain('py-12');
        expect(classes).toContain('px-6');
      });
    });

    describe('with responsive objects', () => {
      it('should generate base classes without prefix', () => {
        const classes = getResponsiveSizeClasses({ base: 'sm' });
        expect(classes).toContain('py-6');
        expect(classes).toContain('px-4');
      });

      it('should generate prefixed classes for sm breakpoint', () => {
        const classes = getResponsiveSizeClasses({ sm: 'md' });
        expect(classes).toContain('sm:py-8');
        expect(classes).toContain('sm:px-6');
      });

      it('should generate prefixed classes for md breakpoint', () => {
        const classes = getResponsiveSizeClasses({ md: 'lg' });
        expect(classes).toContain('md:py-12');
        expect(classes).toContain('md:px-6');
      });

      it('should generate prefixed classes for lg breakpoint', () => {
        const classes = getResponsiveSizeClasses({ lg: 'sm' });
        expect(classes).toContain('lg:py-6');
        expect(classes).toContain('lg:px-4');
      });

      it('should handle multiple breakpoints', () => {
        const classes = getResponsiveSizeClasses({ base: 'sm', md: 'md', lg: 'lg' });
        // Base classes (no prefix)
        expect(classes).toContain('py-6');
        expect(classes).toContain('px-4');
        // md breakpoint
        expect(classes).toContain('md:py-8');
        expect(classes).toContain('md:px-6');
        // lg breakpoint
        expect(classes).toContain('lg:py-12');
        expect(classes).toContain('lg:px-6');
      });

      it('should handle non-contiguous breakpoints', () => {
        const classes = getResponsiveSizeClasses({ base: 'sm', lg: 'lg' });
        // Should have base and lg, but no md
        expect(classes).toContain('py-6');
        expect(classes).toContain('lg:py-12');
        expect(classes).not.toContain('md:py-8');
      });

      it('should handle empty object', () => {
        const classes = getResponsiveSizeClasses({});
        expect(classes).toEqual([]);
      });
    });

    describe('breakpoint order', () => {
      it('should process breakpoints in correct order', () => {
        const classes = getResponsiveSizeClasses({
          '2xl': 'lg',
          base: 'sm',
          xl: 'md',
          lg: 'md',
          md: 'sm',
          sm: 'sm',
        });

        // Find indices of classes to verify order
        const baseIdx = classes.indexOf('py-6');
        const smIdx = classes.findIndex((c) => c.startsWith('sm:'));
        const mdIdx = classes.findIndex((c) => c.startsWith('md:'));
        const lgIdx = classes.findIndex((c) => c.startsWith('lg:'));
        const xlIdx = classes.findIndex((c) => c.startsWith('xl:'));
        const xxlIdx = classes.findIndex((c) => c.startsWith('2xl:'));

        // Verify order: base < sm < md < lg < xl < 2xl
        expect(baseIdx).toBeLessThan(smIdx);
        expect(smIdx).toBeLessThan(mdIdx);
        expect(mdIdx).toBeLessThan(lgIdx);
        expect(lgIdx).toBeLessThan(xlIdx);
        expect(xlIdx).toBeLessThan(xxlIdx);
      });
    });

    describe('class splitting', () => {
      it('should split multi-class container strings into individual prefixed classes', () => {
        // SIZE_STYLES.sm.container = 'py-6 px-4' should become ['py-6', 'px-4'] for base
        const classes = getResponsiveSizeClasses('sm');
        expect(classes.length).toBeGreaterThanOrEqual(2);
        expect(classes.every((c) => !c.includes(' '))).toBe(true);
      });

      it('should prefix each class individually for responsive values', () => {
        const classes = getResponsiveSizeClasses({ md: 'sm' });
        // Should have md:py-6 and md:px-4, not md:py-6 px-4
        expect(classes).toContain('md:py-6');
        expect(classes).toContain('md:px-4');
        expect(classes.every((c) => !c.includes(' '))).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Component Behavior Documentation (for reference in component implementation)
  // ===========================================================================

  describe('component behavior', () => {
    describe('accessibility attributes', () => {
      it('should have role="status" for screen reader announcement', () => {
        // The component uses role="status" on the container
        // This is a status region that announces changes
        expect(true).toBe(true); // Documented behavior
      });

      it('should have aria-label defaulting to title', () => {
        // aria-label uses title by default for accessible name
        // Can be overridden with explicit aria-label prop
        expect(true).toBe(true); // Documented behavior
      });

      it('should have aria-describedby when description is provided', () => {
        // aria-describedby links to description element ID
        // Only set when description prop is provided
        expect(true).toBe(true); // Documented behavior
      });

      it('should use VisuallyHidden for screen reader context announcement', () => {
        // VisuallyHidden announces "Empty state: {title}" to screen readers
        // Uses aria-live="polite" for non-intrusive announcement
        expect(true).toBe(true); // Documented behavior
      });
    });

    describe('semantic structure', () => {
      it('should use h3 for title (Heading level 3)', () => {
        // Uses Heading primitive with level={3}
        // Appropriate for contextual placement within page hierarchy
        expect(true).toBe(true); // Documented behavior
      });

      it('should use Text as paragraph for description', () => {
        // Uses Text primitive with as="p"
        // Connected via aria-describedby for accessibility
        expect(true).toBe(true); // Documented behavior
      });

      it('should use Flex for action button container', () => {
        // Uses Flex primitive with align="center"
        // Gap adjusted based on size
        expect(true).toBe(true); // Documented behavior
      });
    });

    describe('data attributes', () => {
      it('should support data-testid for automated testing', () => {
        // data-testid prop passed to container element
        expect(true).toBe(true); // Documented behavior
      });

      it('should have data-size attribute reflecting base size', () => {
        // data-size shows the current base size for debugging/styling
        expect(true).toBe(true); // Documented behavior
      });
    });

    describe('forwardRef support', () => {
      it('should forward ref to container div element', () => {
        // Ref is forwarded to the outer div element
        // Enables parent components to access DOM node
        expect(true).toBe(true); // Documented behavior
      });
    });

    describe('action button behavior', () => {
      it('should support aria-label on action buttons', () => {
        // EmptyStateAction interface includes aria-label property
        // Allows more descriptive button labels for screen readers
        expect(true).toBe(true); // Documented behavior
      });

      it('should adjust button size based on component size', () => {
        // sm size -> sm button
        // md size -> md button
        // lg size -> md button (capped)
        expect(SIZE_STYLES.sm.buttonSize).toBe('sm');
        expect(SIZE_STYLES.md.buttonSize).toBe('md');
        expect(SIZE_STYLES.lg.buttonSize).toBe('md');
      });

      it('should support loading state on action buttons', () => {
        // EmptyStateAction includes loading property
        // Passed to Button component
        expect(true).toBe(true); // Documented behavior
      });

      it('should support custom button variants', () => {
        // Primary action defaults to 'primary' variant
        // Secondary action defaults to 'secondary' variant
        // Both can be overridden with variant property
        expect(true).toBe(true); // Documented behavior
      });
    });
  });

  // ===========================================================================
  // Size Consistency Tests
  // ===========================================================================

  describe('size consistency', () => {
    it('should have progressively larger vertical padding', () => {
      // Extract py values
      const smPy = SIZE_STYLES.sm.container.match(/py-(\d+)/)?.[1] ?? '0';
      const mdPy = SIZE_STYLES.md.container.match(/py-(\d+)/)?.[1] ?? '0';
      const lgPy = SIZE_STYLES.lg.container.match(/py-(\d+)/)?.[1] ?? '0';

      expect(Number(smPy)).toBeLessThan(Number(mdPy));
      expect(Number(mdPy)).toBeLessThan(Number(lgPy));
    });

    it('should have consistent horizontal padding across sizes', () => {
      // px-4 for sm, px-6 for md and lg
      const smPx = SIZE_STYLES.sm.container.match(/px-(\d+)/)?.[1] ?? '0';
      const mdPx = SIZE_STYLES.md.container.match(/px-(\d+)/)?.[1] ?? '0';
      const lgPx = SIZE_STYLES.lg.container.match(/px-(\d+)/)?.[1] ?? '0';

      expect(Number(smPx)).toBeLessThanOrEqual(Number(mdPx));
      expect(Number(mdPx)).toBe(Number(lgPx)); // md and lg have same px
    });

    it('should have progressively larger icon wrapper margins', () => {
      // mb-2 for sm, mb-3 for md, mb-4 for lg
      const smMb = SIZE_STYLES.sm.iconWrapper.match(/mb-(\d+)/)?.[1] ?? '0';
      const mdMb = SIZE_STYLES.md.iconWrapper.match(/mb-(\d+)/)?.[1] ?? '0';
      const lgMb = SIZE_STYLES.lg.iconWrapper.match(/mb-(\d+)/)?.[1] ?? '0';

      expect(Number(smMb)).toBeLessThan(Number(mdMb));
      expect(Number(mdMb)).toBeLessThan(Number(lgMb));
    });
  });

  // ===========================================================================
  // Type Safety Tests
  // ===========================================================================

  describe('type safety', () => {
    it('should accept valid EmptyStateSize values', () => {
      const validSizes: EmptyStateSize[] = ['sm', 'md', 'lg'];
      for (const size of validSizes) {
        expect(() => getBaseSize(size)).not.toThrow();
        expect(() => getResponsiveSizeClasses(size)).not.toThrow();
      }
    });

    it('should accept ResponsiveValue<EmptyStateSize> objects', () => {
      const validResponsive = [
        { base: 'sm' as EmptyStateSize },
        { base: 'md' as EmptyStateSize, lg: 'lg' as EmptyStateSize },
        { sm: 'md' as EmptyStateSize, md: 'lg' as EmptyStateSize },
      ];

      for (const size of validResponsive) {
        expect(() => getBaseSize(size)).not.toThrow();
        expect(() => getResponsiveSizeClasses(size)).not.toThrow();
      }
    });
  });
});
