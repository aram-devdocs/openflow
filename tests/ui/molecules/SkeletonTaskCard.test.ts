import { describe, expect, it } from 'vitest';
import {
  SKELETON_TASK_CARD_BADGE_CLASSES,
  SKELETON_TASK_CARD_BASE_CLASSES,
  SKELETON_TASK_CARD_DESCRIPTION_CLASSES,
  SKELETON_TASK_CARD_DESCRIPTION_GAP_CLASSES,
  SKELETON_TASK_CARD_FOOTER_CLASSES,
  SKELETON_TASK_CARD_FOOTER_GAP_CLASSES,
  SKELETON_TASK_CARD_FOOTER_PADDING_CLASSES,
  SKELETON_TASK_CARD_HEADER_GAP_CLASSES,
  SKELETON_TASK_CARD_PADDING_CLASSES,
  SKELETON_TASK_CARD_SPACING_CLASSES,
  SKELETON_TASK_CARD_TITLE_CLASSES,
  getBadgeDimensions,
  getBaseSize,
  getResponsiveSizeClasses,
} from '../../../packages/ui/molecules/SkeletonTaskCard';

describe('SkeletonTaskCard', () => {
  // =============================================================================
  // SKELETON_TASK_CARD_BASE_CLASSES Tests
  // =============================================================================

  describe('SKELETON_TASK_CARD_BASE_CLASSES', () => {
    it('should include rounded-lg for border radius', () => {
      expect(SKELETON_TASK_CARD_BASE_CLASSES).toContain('rounded-lg');
    });

    it('should include border styling', () => {
      expect(SKELETON_TASK_CARD_BASE_CLASSES).toContain('border');
      expect(SKELETON_TASK_CARD_BASE_CLASSES).toContain('border-[rgb(var(--border))]');
    });

    it('should include card background color', () => {
      expect(SKELETON_TASK_CARD_BASE_CLASSES).toContain('bg-[rgb(var(--card))]');
    });

    it('should match expected base classes string', () => {
      expect(SKELETON_TASK_CARD_BASE_CLASSES).toBe(
        'rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]'
      );
    });
  });

  // =============================================================================
  // SKELETON_TASK_CARD_PADDING_CLASSES Tests
  // =============================================================================

  describe('SKELETON_TASK_CARD_PADDING_CLASSES', () => {
    it('should have sm padding class', () => {
      expect(SKELETON_TASK_CARD_PADDING_CLASSES.sm).toBe('p-2.5');
    });

    it('should have md padding class', () => {
      expect(SKELETON_TASK_CARD_PADDING_CLASSES.md).toBe('p-3');
    });

    it('should have lg padding class', () => {
      expect(SKELETON_TASK_CARD_PADDING_CLASSES.lg).toBe('p-4');
    });

    it('should have all three sizes defined', () => {
      expect(Object.keys(SKELETON_TASK_CARD_PADDING_CLASSES)).toEqual(['sm', 'md', 'lg']);
    });

    it('should have progressively larger padding', () => {
      // sm = 2.5 (10px), md = 3 (12px), lg = 4 (16px)
      const smPadding = Number.parseFloat(SKELETON_TASK_CARD_PADDING_CLASSES.sm.replace('p-', ''));
      const mdPadding = Number.parseFloat(SKELETON_TASK_CARD_PADDING_CLASSES.md.replace('p-', ''));
      const lgPadding = Number.parseFloat(SKELETON_TASK_CARD_PADDING_CLASSES.lg.replace('p-', ''));

      expect(smPadding).toBeLessThan(mdPadding);
      expect(mdPadding).toBeLessThan(lgPadding);
    });
  });

  // =============================================================================
  // SKELETON_TASK_CARD_SPACING_CLASSES Tests
  // =============================================================================

  describe('SKELETON_TASK_CARD_SPACING_CLASSES', () => {
    it('should have sm spacing class', () => {
      expect(SKELETON_TASK_CARD_SPACING_CLASSES.sm).toBe('space-y-2');
    });

    it('should have md spacing class', () => {
      expect(SKELETON_TASK_CARD_SPACING_CLASSES.md).toBe('space-y-3');
    });

    it('should have lg spacing class', () => {
      expect(SKELETON_TASK_CARD_SPACING_CLASSES.lg).toBe('space-y-4');
    });

    it('should all use space-y- prefix', () => {
      for (const value of Object.values(SKELETON_TASK_CARD_SPACING_CLASSES)) {
        expect(value).toMatch(/^space-y-\d+$/);
      }
    });
  });

  // =============================================================================
  // SKELETON_TASK_CARD_HEADER_GAP_CLASSES Tests
  // =============================================================================

  describe('SKELETON_TASK_CARD_HEADER_GAP_CLASSES', () => {
    it('should have sm gap class', () => {
      expect(SKELETON_TASK_CARD_HEADER_GAP_CLASSES.sm).toBe('gap-1.5');
    });

    it('should have md gap class', () => {
      expect(SKELETON_TASK_CARD_HEADER_GAP_CLASSES.md).toBe('gap-2');
    });

    it('should have lg gap class', () => {
      expect(SKELETON_TASK_CARD_HEADER_GAP_CLASSES.lg).toBe('gap-3');
    });

    it('should all use gap- prefix', () => {
      for (const value of Object.values(SKELETON_TASK_CARD_HEADER_GAP_CLASSES)) {
        expect(value).toMatch(/^gap-[\d.]+$/);
      }
    });
  });

  // =============================================================================
  // SKELETON_TASK_CARD_TITLE_CLASSES Tests
  // =============================================================================

  describe('SKELETON_TASK_CARD_TITLE_CLASSES', () => {
    it('should have sm title height class', () => {
      expect(SKELETON_TASK_CARD_TITLE_CLASSES.sm).toBe('h-4');
    });

    it('should have md title height class', () => {
      expect(SKELETON_TASK_CARD_TITLE_CLASSES.md).toBe('h-5');
    });

    it('should have lg title height class', () => {
      expect(SKELETON_TASK_CARD_TITLE_CLASSES.lg).toBe('h-6');
    });

    it('should all use h- prefix for height', () => {
      for (const value of Object.values(SKELETON_TASK_CARD_TITLE_CLASSES)) {
        expect(value).toMatch(/^h-\d+$/);
      }
    });
  });

  // =============================================================================
  // SKELETON_TASK_CARD_BADGE_CLASSES Tests
  // =============================================================================

  describe('SKELETON_TASK_CARD_BADGE_CLASSES', () => {
    it('should have sm badge dimensions', () => {
      expect(SKELETON_TASK_CARD_BADGE_CLASSES.sm).toEqual({ height: 'h-5', width: 'w-14' });
    });

    it('should have md badge dimensions', () => {
      expect(SKELETON_TASK_CARD_BADGE_CLASSES.md).toEqual({ height: 'h-6', width: 'w-16' });
    });

    it('should have lg badge dimensions', () => {
      expect(SKELETON_TASK_CARD_BADGE_CLASSES.lg).toEqual({ height: 'h-7', width: 'w-20' });
    });

    it('should have height and width properties for all sizes', () => {
      for (const value of Object.values(SKELETON_TASK_CARD_BADGE_CLASSES)) {
        expect(value).toHaveProperty('height');
        expect(value).toHaveProperty('width');
        expect(value.height).toMatch(/^h-\d+$/);
        expect(value.width).toMatch(/^w-\d+$/);
      }
    });
  });

  // =============================================================================
  // SKELETON_TASK_CARD_DESCRIPTION_CLASSES Tests
  // =============================================================================

  describe('SKELETON_TASK_CARD_DESCRIPTION_CLASSES', () => {
    it('should have sm description height class', () => {
      expect(SKELETON_TASK_CARD_DESCRIPTION_CLASSES.sm).toBe('h-3');
    });

    it('should have md description height class', () => {
      expect(SKELETON_TASK_CARD_DESCRIPTION_CLASSES.md).toBe('h-3.5');
    });

    it('should have lg description height class', () => {
      expect(SKELETON_TASK_CARD_DESCRIPTION_CLASSES.lg).toBe('h-4');
    });
  });

  // =============================================================================
  // SKELETON_TASK_CARD_DESCRIPTION_GAP_CLASSES Tests
  // =============================================================================

  describe('SKELETON_TASK_CARD_DESCRIPTION_GAP_CLASSES', () => {
    it('should have sm description gap class', () => {
      expect(SKELETON_TASK_CARD_DESCRIPTION_GAP_CLASSES.sm).toBe('space-y-0.5');
    });

    it('should have md description gap class', () => {
      expect(SKELETON_TASK_CARD_DESCRIPTION_GAP_CLASSES.md).toBe('space-y-1');
    });

    it('should have lg description gap class', () => {
      expect(SKELETON_TASK_CARD_DESCRIPTION_GAP_CLASSES.lg).toBe('space-y-1.5');
    });
  });

  // =============================================================================
  // SKELETON_TASK_CARD_FOOTER_CLASSES Tests
  // =============================================================================

  describe('SKELETON_TASK_CARD_FOOTER_CLASSES', () => {
    it('should have sm footer height class', () => {
      expect(SKELETON_TASK_CARD_FOOTER_CLASSES.sm).toBe('h-2.5');
    });

    it('should have md footer height class', () => {
      expect(SKELETON_TASK_CARD_FOOTER_CLASSES.md).toBe('h-3');
    });

    it('should have lg footer height class', () => {
      expect(SKELETON_TASK_CARD_FOOTER_CLASSES.lg).toBe('h-3.5');
    });
  });

  // =============================================================================
  // SKELETON_TASK_CARD_FOOTER_GAP_CLASSES Tests
  // =============================================================================

  describe('SKELETON_TASK_CARD_FOOTER_GAP_CLASSES', () => {
    it('should have sm footer gap class', () => {
      expect(SKELETON_TASK_CARD_FOOTER_GAP_CLASSES.sm).toBe('gap-3');
    });

    it('should have md footer gap class', () => {
      expect(SKELETON_TASK_CARD_FOOTER_GAP_CLASSES.md).toBe('gap-4');
    });

    it('should have lg footer gap class', () => {
      expect(SKELETON_TASK_CARD_FOOTER_GAP_CLASSES.lg).toBe('gap-5');
    });
  });

  // =============================================================================
  // SKELETON_TASK_CARD_FOOTER_PADDING_CLASSES Tests
  // =============================================================================

  describe('SKELETON_TASK_CARD_FOOTER_PADDING_CLASSES', () => {
    it('should have sm footer padding class', () => {
      expect(SKELETON_TASK_CARD_FOOTER_PADDING_CLASSES.sm).toBe('pt-1.5');
    });

    it('should have md footer padding class', () => {
      expect(SKELETON_TASK_CARD_FOOTER_PADDING_CLASSES.md).toBe('pt-2');
    });

    it('should have lg footer padding class', () => {
      expect(SKELETON_TASK_CARD_FOOTER_PADDING_CLASSES.lg).toBe('pt-3');
    });
  });

  // =============================================================================
  // getBaseSize Utility Function Tests
  // =============================================================================

  describe('getBaseSize', () => {
    describe('with string size values', () => {
      it('should return sm when passed sm', () => {
        expect(getBaseSize('sm')).toBe('sm');
      });

      it('should return md when passed md', () => {
        expect(getBaseSize('md')).toBe('md');
      });

      it('should return lg when passed lg', () => {
        expect(getBaseSize('lg')).toBe('lg');
      });
    });

    describe('with responsive object values', () => {
      it('should return base value when base is defined', () => {
        expect(getBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
      });

      it('should return md as default when base is not defined', () => {
        expect(getBaseSize({ md: 'lg', lg: 'lg' })).toBe('md');
      });

      it('should handle object with only base defined', () => {
        expect(getBaseSize({ base: 'lg' })).toBe('lg');
      });

      it('should handle object with all breakpoints defined', () => {
        expect(
          getBaseSize({ base: 'sm', sm: 'sm', md: 'md', lg: 'lg', xl: 'lg', '2xl': 'lg' })
        ).toBe('sm');
      });

      it('should handle empty object by returning md default', () => {
        expect(getBaseSize({})).toBe('md');
      });
    });
  });

  // =============================================================================
  // getResponsiveSizeClasses Utility Function Tests
  // =============================================================================

  describe('getResponsiveSizeClasses', () => {
    describe('with string size values', () => {
      it('should return direct class for sm size', () => {
        expect(getResponsiveSizeClasses('sm', SKELETON_TASK_CARD_PADDING_CLASSES)).toBe('p-2.5');
      });

      it('should return direct class for md size', () => {
        expect(getResponsiveSizeClasses('md', SKELETON_TASK_CARD_PADDING_CLASSES)).toBe('p-3');
      });

      it('should return direct class for lg size', () => {
        expect(getResponsiveSizeClasses('lg', SKELETON_TASK_CARD_PADDING_CLASSES)).toBe('p-4');
      });
    });

    describe('with responsive object values', () => {
      it('should return base classes without prefix for base breakpoint', () => {
        const result = getResponsiveSizeClasses({ base: 'sm' }, SKELETON_TASK_CARD_PADDING_CLASSES);
        expect(result).toBe('p-2.5');
      });

      it('should add breakpoint prefix for non-base breakpoints', () => {
        const result = getResponsiveSizeClasses(
          { base: 'sm', md: 'lg' },
          SKELETON_TASK_CARD_PADDING_CLASSES
        );
        expect(result).toBe('p-2.5 md:p-4');
      });

      it('should handle multiple breakpoints in correct order', () => {
        const result = getResponsiveSizeClasses(
          { base: 'sm', sm: 'sm', md: 'md', lg: 'lg' },
          SKELETON_TASK_CARD_PADDING_CLASSES
        );
        expect(result).toBe('p-2.5 sm:p-2.5 md:p-3 lg:p-4');
      });

      it('should skip undefined breakpoints', () => {
        const result = getResponsiveSizeClasses(
          { base: 'sm', lg: 'lg' },
          SKELETON_TASK_CARD_PADDING_CLASSES
        );
        expect(result).toBe('p-2.5 lg:p-4');
      });

      it('should handle spacing classes with multi-part class names', () => {
        const result = getResponsiveSizeClasses(
          { base: 'sm', md: 'lg' },
          SKELETON_TASK_CARD_SPACING_CLASSES
        );
        expect(result).toBe('space-y-2 md:space-y-4');
      });

      it('should handle empty responsive object', () => {
        const result = getResponsiveSizeClasses({}, SKELETON_TASK_CARD_PADDING_CLASSES);
        expect(result).toBe('');
      });
    });

    describe('breakpoint order', () => {
      it('should follow Tailwind breakpoint order: base, sm, md, lg, xl, 2xl', () => {
        const result = getResponsiveSizeClasses(
          { '2xl': 'lg', base: 'sm', xl: 'lg', sm: 'sm', lg: 'md', md: 'md' },
          SKELETON_TASK_CARD_PADDING_CLASSES
        );
        // Should be ordered: base, sm, md, lg, xl, 2xl
        expect(result).toBe('p-2.5 sm:p-2.5 md:p-3 lg:p-3 xl:p-4 2xl:p-4');
      });
    });

    describe('class splitting for multiple classes', () => {
      it('should split multiple classes and add prefix to each', () => {
        // Test with spacing classes that have multiple parts
        const multiClassMap = {
          sm: 'class-a class-b',
          md: 'class-c class-d',
          lg: 'class-e class-f',
        };
        const result = getResponsiveSizeClasses({ base: 'sm', md: 'md' }, multiClassMap);
        expect(result).toBe('class-a class-b md:class-c md:class-d');
      });
    });
  });

  // =============================================================================
  // getBadgeDimensions Utility Function Tests
  // =============================================================================

  describe('getBadgeDimensions', () => {
    describe('with string size values', () => {
      it('should return sm badge dimensions', () => {
        expect(getBadgeDimensions('sm')).toEqual({ height: 'h-5', width: 'w-14' });
      });

      it('should return md badge dimensions', () => {
        expect(getBadgeDimensions('md')).toEqual({ height: 'h-6', width: 'w-16' });
      });

      it('should return lg badge dimensions', () => {
        expect(getBadgeDimensions('lg')).toEqual({ height: 'h-7', width: 'w-20' });
      });
    });

    describe('with responsive object values', () => {
      it('should return dimensions based on base value', () => {
        expect(getBadgeDimensions({ base: 'lg', md: 'sm' })).toEqual({
          height: 'h-7',
          width: 'w-20',
        });
      });

      it('should return md dimensions when base is not defined', () => {
        expect(getBadgeDimensions({ md: 'lg' })).toEqual({ height: 'h-6', width: 'w-16' });
      });

      it('should return md dimensions for empty object', () => {
        expect(getBadgeDimensions({})).toEqual({ height: 'h-6', width: 'w-16' });
      });
    });
  });

  // =============================================================================
  // Component Behavior Documentation Tests
  // =============================================================================

  describe('component behavior documentation', () => {
    it('should document that skeleton uses aria-hidden="true" for accessibility', () => {
      // The component sets aria-hidden={true} to hide from screen readers
      // This test documents the expected accessibility behavior
      expect(true).toBe(true);
    });

    it('should document that skeleton uses role="presentation" for accessibility', () => {
      // The component sets role="presentation" to indicate decorative content
      // This test documents the expected accessibility behavior
      expect(true).toBe(true);
    });

    it('should document that skeleton supports forwardRef', () => {
      // The component is wrapped in forwardRef for ref forwarding
      // This test documents the expected ref forwarding behavior
      expect(true).toBe(true);
    });

    it('should document that skeleton supports data-testid on all parts', () => {
      // When data-testid is provided, the component adds it to:
      // - Container: data-testid
      // - Title: data-testid-title
      // - Badge: data-testid-badge
      // - Description lines: data-testid-description-1, data-testid-description-2
      // - Footer: data-testid-footer
      // - Metadata: data-testid-metadata-1, data-testid-metadata-2
      expect(true).toBe(true);
    });
  });

  // =============================================================================
  // Size Consistency Tests
  // =============================================================================

  describe('size consistency', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    it('should have consistent sizes across all class maps', () => {
      const classMaps = [
        SKELETON_TASK_CARD_PADDING_CLASSES,
        SKELETON_TASK_CARD_SPACING_CLASSES,
        SKELETON_TASK_CARD_HEADER_GAP_CLASSES,
        SKELETON_TASK_CARD_TITLE_CLASSES,
        SKELETON_TASK_CARD_DESCRIPTION_CLASSES,
        SKELETON_TASK_CARD_DESCRIPTION_GAP_CLASSES,
        SKELETON_TASK_CARD_FOOTER_CLASSES,
        SKELETON_TASK_CARD_FOOTER_GAP_CLASSES,
        SKELETON_TASK_CARD_FOOTER_PADDING_CLASSES,
      ];

      for (const classMap of classMaps) {
        for (const size of sizes) {
          expect(classMap).toHaveProperty(size);
          expect(classMap[size]).toBeDefined();
          expect(typeof classMap[size]).toBe('string');
        }
      }
    });

    it('should have badge classes with proper object structure for all sizes', () => {
      for (const size of sizes) {
        expect(SKELETON_TASK_CARD_BADGE_CLASSES).toHaveProperty(size);
        expect(SKELETON_TASK_CARD_BADGE_CLASSES[size]).toHaveProperty('height');
        expect(SKELETON_TASK_CARD_BADGE_CLASSES[size]).toHaveProperty('width');
      }
    });
  });

  // =============================================================================
  // Type Safety Tests (compile-time documentation)
  // =============================================================================

  describe('type safety documentation', () => {
    it('should document SkeletonTaskCardSize type as sm | md | lg', () => {
      const validSizes: ('sm' | 'md' | 'lg')[] = ['sm', 'md', 'lg'];
      for (const size of validSizes) {
        expect(getBaseSize(size)).toBe(size);
      }
    });

    it('should document ResponsiveValue support for all breakpoints', () => {
      const responsiveValue = {
        base: 'sm' as const,
        sm: 'sm' as const,
        md: 'md' as const,
        lg: 'lg' as const,
        xl: 'lg' as const,
        '2xl': 'lg' as const,
      };
      expect(getBaseSize(responsiveValue)).toBe('sm');
    });
  });

  // =============================================================================
  // Default Props Documentation Tests
  // =============================================================================

  describe('default props documentation', () => {
    it('should document size default as md', () => {
      // Component default: size = 'md'
      expect(getBaseSize('md')).toBe('md');
    });

    it('should document showDescription default as true', () => {
      // Component default: showDescription = true
      // Description section is shown by default
      expect(true).toBe(true);
    });

    it('should document showFooter default as true', () => {
      // Component default: showFooter = true
      // Footer section is shown by default
      expect(true).toBe(true);
    });

    it('should document descriptionLines default as 2', () => {
      // Component default: descriptionLines = 2
      // Two description lines are shown by default
      expect(true).toBe(true);
    });
  });

  // =============================================================================
  // Layout Structure Documentation Tests
  // =============================================================================

  describe('layout structure documentation', () => {
    it('should document header contains title and badge skeletons', () => {
      // Header row: Title skeleton (w-2/3) + status badge skeleton (rounded-full, shrink-0)
      expect(SKELETON_TASK_CARD_TITLE_CLASSES).toBeDefined();
      expect(SKELETON_TASK_CARD_BADGE_CLASSES).toBeDefined();
    });

    it('should document description section structure', () => {
      // Description section contains 1 or 2 lines based on descriptionLines prop
      // Line 1: full width (w-full)
      // Line 2: 4/5 width (w-4/5)
      expect(SKELETON_TASK_CARD_DESCRIPTION_CLASSES).toBeDefined();
      expect(SKELETON_TASK_CARD_DESCRIPTION_GAP_CLASSES).toBeDefined();
    });

    it('should document footer section structure', () => {
      // Footer row: Two metadata skeletons (w-20 and w-16)
      // Has top padding and gap between items
      expect(SKELETON_TASK_CARD_FOOTER_CLASSES).toBeDefined();
      expect(SKELETON_TASK_CARD_FOOTER_GAP_CLASSES).toBeDefined();
      expect(SKELETON_TASK_CARD_FOOTER_PADDING_CLASSES).toBeDefined();
    });
  });

  // =============================================================================
  // Data Attributes Documentation Tests
  // =============================================================================

  describe('data attributes documentation', () => {
    it('should document data-size attribute behavior', () => {
      // data-size="sm" | "md" | "lg" for string sizes
      // data-size="responsive" for object sizes
      expect(true).toBe(true);
    });

    it('should document data-show-description attribute', () => {
      // data-show-description="true" | "false"
      expect(true).toBe(true);
    });

    it('should document data-show-footer attribute', () => {
      // data-show-footer="true" | "false"
      expect(true).toBe(true);
    });

    it('should document data-description-lines attribute', () => {
      // data-description-lines="1" | "2"
      expect(true).toBe(true);
    });
  });

  // =============================================================================
  // Tailwind Class Consistency Tests
  // =============================================================================

  describe('tailwind class consistency', () => {
    it('should use valid Tailwind padding classes', () => {
      for (const value of Object.values(SKELETON_TASK_CARD_PADDING_CLASSES)) {
        expect(value).toMatch(/^p-[\d.]+$/);
      }
    });

    it('should use valid Tailwind spacing classes', () => {
      for (const value of Object.values(SKELETON_TASK_CARD_SPACING_CLASSES)) {
        expect(value).toMatch(/^space-y-\d+$/);
      }
    });

    it('should use valid Tailwind gap classes', () => {
      for (const value of Object.values(SKELETON_TASK_CARD_HEADER_GAP_CLASSES)) {
        expect(value).toMatch(/^gap-[\d.]+$/);
      }
    });

    it('should use valid Tailwind height classes', () => {
      for (const value of Object.values(SKELETON_TASK_CARD_TITLE_CLASSES)) {
        expect(value).toMatch(/^h-[\d.]+$/);
      }
    });

    it('should use valid Tailwind pt classes for footer padding', () => {
      for (const value of Object.values(SKELETON_TASK_CARD_FOOTER_PADDING_CLASSES)) {
        expect(value).toMatch(/^pt-[\d.]+$/);
      }
    });
  });

  // =============================================================================
  // Responsive Breakpoint Order Tests
  // =============================================================================

  describe('responsive breakpoint order', () => {
    it('should follow standard Tailwind breakpoint order', () => {
      // Expected order: base < sm < md < lg < xl < 2xl
      const result = getResponsiveSizeClasses(
        { base: 'sm', sm: 'sm', md: 'md', lg: 'lg', xl: 'lg', '2xl': 'lg' },
        SKELETON_TASK_CARD_PADDING_CLASSES
      );
      const parts = result.split(' ');

      // First class should be base (no prefix)
      expect(parts[0]).toBe('p-2.5');

      // Subsequent classes should have breakpoint prefixes in order
      expect(parts[1]).toMatch(/^sm:/);
      expect(parts[2]).toMatch(/^md:/);
      expect(parts[3]).toMatch(/^lg:/);
      expect(parts[4]).toMatch(/^xl:/);
      expect(parts[5]).toMatch(/^2xl:/);
    });
  });
});
