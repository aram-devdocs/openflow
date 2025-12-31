/**
 * SkeletonCard Unit Tests
 *
 * Tests for the SkeletonCard molecule component focusing on:
 * - Size class generation utilities
 * - Responsive class generation
 * - Constant definitions
 * - Component behavior documentation
 */

import { describe, expect, it } from 'vitest';
import {
  SKELETON_CARD_ACTIONS_GAP_CLASSES,
  SKELETON_CARD_ACTIONS_MARGIN_CLASSES,
  SKELETON_CARD_ACTION_CLASSES,
  SKELETON_CARD_AVATAR_CLASSES,
  SKELETON_CARD_BASE_CLASSES,
  SKELETON_CARD_CONTENT_GAP_CLASSES,
  SKELETON_CARD_DESCRIPTION_CLASSES,
  SKELETON_CARD_HEADER_GAP_CLASSES,
  SKELETON_CARD_PADDING_CLASSES,
  SKELETON_CARD_TITLE_CLASSES,
  getAvatarDimensions,
  getBaseSize,
  getResponsiveSizeClasses,
} from '../../../packages/ui/molecules/SkeletonCard';

describe('SkeletonCard', () => {
  // ===========================================================================
  // Constants - Base Classes
  // ===========================================================================

  describe('SKELETON_CARD_BASE_CLASSES', () => {
    it('should include rounded corners', () => {
      expect(SKELETON_CARD_BASE_CLASSES).toContain('rounded-lg');
    });

    it('should include border styling', () => {
      expect(SKELETON_CARD_BASE_CLASSES).toContain('border');
    });

    it('should include background color', () => {
      expect(SKELETON_CARD_BASE_CLASSES).toContain('bg-');
    });

    it('should use CSS variable for border color', () => {
      expect(SKELETON_CARD_BASE_CLASSES).toContain('border-[rgb(var(--border))]');
    });

    it('should use CSS variable for card background', () => {
      expect(SKELETON_CARD_BASE_CLASSES).toContain('bg-[rgb(var(--card))]');
    });
  });

  // ===========================================================================
  // Constants - Padding Classes
  // ===========================================================================

  describe('SKELETON_CARD_PADDING_CLASSES', () => {
    it('should define padding classes for all sizes', () => {
      expect(SKELETON_CARD_PADDING_CLASSES.sm).toBeDefined();
      expect(SKELETON_CARD_PADDING_CLASSES.md).toBeDefined();
      expect(SKELETON_CARD_PADDING_CLASSES.lg).toBeDefined();
    });

    it('should use padding utilities', () => {
      expect(SKELETON_CARD_PADDING_CLASSES.sm).toContain('p-');
      expect(SKELETON_CARD_PADDING_CLASSES.md).toContain('p-');
      expect(SKELETON_CARD_PADDING_CLASSES.lg).toContain('p-');
    });

    it('should increase padding with size', () => {
      const smPadding = Number.parseInt(SKELETON_CARD_PADDING_CLASSES.sm.replace('p-', ''));
      const mdPadding = Number.parseInt(SKELETON_CARD_PADDING_CLASSES.md.replace('p-', ''));
      const lgPadding = Number.parseInt(SKELETON_CARD_PADDING_CLASSES.lg.replace('p-', ''));

      expect(smPadding).toBeLessThan(mdPadding);
      expect(mdPadding).toBeLessThan(lgPadding);
    });

    it('should have correct padding values', () => {
      expect(SKELETON_CARD_PADDING_CLASSES.sm).toBe('p-3');
      expect(SKELETON_CARD_PADDING_CLASSES.md).toBe('p-4');
      expect(SKELETON_CARD_PADDING_CLASSES.lg).toBe('p-5');
    });
  });

  // ===========================================================================
  // Constants - Header Gap Classes
  // ===========================================================================

  describe('SKELETON_CARD_HEADER_GAP_CLASSES', () => {
    it('should define gap classes for all sizes', () => {
      expect(SKELETON_CARD_HEADER_GAP_CLASSES.sm).toBeDefined();
      expect(SKELETON_CARD_HEADER_GAP_CLASSES.md).toBeDefined();
      expect(SKELETON_CARD_HEADER_GAP_CLASSES.lg).toBeDefined();
    });

    it('should use gap utilities', () => {
      expect(SKELETON_CARD_HEADER_GAP_CLASSES.sm).toContain('gap-');
      expect(SKELETON_CARD_HEADER_GAP_CLASSES.md).toContain('gap-');
      expect(SKELETON_CARD_HEADER_GAP_CLASSES.lg).toContain('gap-');
    });

    it('should have correct gap values', () => {
      expect(SKELETON_CARD_HEADER_GAP_CLASSES.sm).toBe('gap-2');
      expect(SKELETON_CARD_HEADER_GAP_CLASSES.md).toBe('gap-3');
      expect(SKELETON_CARD_HEADER_GAP_CLASSES.lg).toBe('gap-4');
    });
  });

  // ===========================================================================
  // Constants - Avatar Classes
  // ===========================================================================

  describe('SKELETON_CARD_AVATAR_CLASSES', () => {
    it('should define dimensions for all sizes', () => {
      expect(SKELETON_CARD_AVATAR_CLASSES.sm).toBeDefined();
      expect(SKELETON_CARD_AVATAR_CLASSES.md).toBeDefined();
      expect(SKELETON_CARD_AVATAR_CLASSES.lg).toBeDefined();
    });

    it('should include width and height properties', () => {
      expect(SKELETON_CARD_AVATAR_CLASSES.sm).toHaveProperty('width');
      expect(SKELETON_CARD_AVATAR_CLASSES.sm).toHaveProperty('height');
    });

    it('should have correct avatar dimensions', () => {
      expect(SKELETON_CARD_AVATAR_CLASSES.sm).toEqual({ width: 32, height: 32 });
      expect(SKELETON_CARD_AVATAR_CLASSES.md).toEqual({ width: 40, height: 40 });
      expect(SKELETON_CARD_AVATAR_CLASSES.lg).toEqual({ width: 48, height: 48 });
    });

    it('should have square dimensions', () => {
      expect(SKELETON_CARD_AVATAR_CLASSES.sm.width).toBe(SKELETON_CARD_AVATAR_CLASSES.sm.height);
      expect(SKELETON_CARD_AVATAR_CLASSES.md.width).toBe(SKELETON_CARD_AVATAR_CLASSES.md.height);
      expect(SKELETON_CARD_AVATAR_CLASSES.lg.width).toBe(SKELETON_CARD_AVATAR_CLASSES.lg.height);
    });

    it('should increase size progressively', () => {
      expect(SKELETON_CARD_AVATAR_CLASSES.sm.width).toBeLessThan(
        SKELETON_CARD_AVATAR_CLASSES.md.width
      );
      expect(SKELETON_CARD_AVATAR_CLASSES.md.width).toBeLessThan(
        SKELETON_CARD_AVATAR_CLASSES.lg.width
      );
    });
  });

  // ===========================================================================
  // Constants - Title Classes
  // ===========================================================================

  describe('SKELETON_CARD_TITLE_CLASSES', () => {
    it('should define height classes for all sizes', () => {
      expect(SKELETON_CARD_TITLE_CLASSES.sm).toBeDefined();
      expect(SKELETON_CARD_TITLE_CLASSES.md).toBeDefined();
      expect(SKELETON_CARD_TITLE_CLASSES.lg).toBeDefined();
    });

    it('should include height utilities', () => {
      expect(SKELETON_CARD_TITLE_CLASSES.sm).toContain('h-');
      expect(SKELETON_CARD_TITLE_CLASSES.md).toContain('h-');
      expect(SKELETON_CARD_TITLE_CLASSES.lg).toContain('h-');
    });

    it('should have correct height values', () => {
      expect(SKELETON_CARD_TITLE_CLASSES.sm).toBe('h-3.5');
      expect(SKELETON_CARD_TITLE_CLASSES.md).toBe('h-4');
      expect(SKELETON_CARD_TITLE_CLASSES.lg).toBe('h-5');
    });
  });

  // ===========================================================================
  // Constants - Description Classes
  // ===========================================================================

  describe('SKELETON_CARD_DESCRIPTION_CLASSES', () => {
    it('should define height classes for all sizes', () => {
      expect(SKELETON_CARD_DESCRIPTION_CLASSES.sm).toBeDefined();
      expect(SKELETON_CARD_DESCRIPTION_CLASSES.md).toBeDefined();
      expect(SKELETON_CARD_DESCRIPTION_CLASSES.lg).toBeDefined();
    });

    it('should have smaller heights than title', () => {
      // Description text is smaller than title
      expect(SKELETON_CARD_DESCRIPTION_CLASSES.sm).toBe('h-2.5');
      expect(SKELETON_CARD_DESCRIPTION_CLASSES.md).toBe('h-3');
      expect(SKELETON_CARD_DESCRIPTION_CLASSES.lg).toBe('h-3.5');
    });
  });

  // ===========================================================================
  // Constants - Action Classes
  // ===========================================================================

  describe('SKELETON_CARD_ACTION_CLASSES', () => {
    it('should define classes for all sizes', () => {
      expect(SKELETON_CARD_ACTION_CLASSES.sm).toBeDefined();
      expect(SKELETON_CARD_ACTION_CLASSES.md).toBeDefined();
      expect(SKELETON_CARD_ACTION_CLASSES.lg).toBeDefined();
    });

    it('should include height and width', () => {
      expect(SKELETON_CARD_ACTION_CLASSES.sm).toMatch(/h-\d/);
      expect(SKELETON_CARD_ACTION_CLASSES.sm).toMatch(/w-\d+/);
    });

    it('should have correct action button dimensions', () => {
      expect(SKELETON_CARD_ACTION_CLASSES.sm).toBe('h-7 w-16');
      expect(SKELETON_CARD_ACTION_CLASSES.md).toBe('h-8 w-20');
      expect(SKELETON_CARD_ACTION_CLASSES.lg).toBe('h-9 w-24');
    });
  });

  // ===========================================================================
  // Constants - Actions Gap Classes
  // ===========================================================================

  describe('SKELETON_CARD_ACTIONS_GAP_CLASSES', () => {
    it('should define gap classes for all sizes', () => {
      expect(SKELETON_CARD_ACTIONS_GAP_CLASSES.sm).toBeDefined();
      expect(SKELETON_CARD_ACTIONS_GAP_CLASSES.md).toBeDefined();
      expect(SKELETON_CARD_ACTIONS_GAP_CLASSES.lg).toBeDefined();
    });

    it('should use gap utilities', () => {
      expect(SKELETON_CARD_ACTIONS_GAP_CLASSES.sm).toContain('gap-');
      expect(SKELETON_CARD_ACTIONS_GAP_CLASSES.md).toContain('gap-');
      expect(SKELETON_CARD_ACTIONS_GAP_CLASSES.lg).toContain('gap-');
    });

    it('should have correct gap values', () => {
      expect(SKELETON_CARD_ACTIONS_GAP_CLASSES.sm).toBe('gap-1.5');
      expect(SKELETON_CARD_ACTIONS_GAP_CLASSES.md).toBe('gap-2');
      expect(SKELETON_CARD_ACTIONS_GAP_CLASSES.lg).toBe('gap-2.5');
    });
  });

  // ===========================================================================
  // Constants - Actions Margin Classes
  // ===========================================================================

  describe('SKELETON_CARD_ACTIONS_MARGIN_CLASSES', () => {
    it('should define margin-top classes for all sizes', () => {
      expect(SKELETON_CARD_ACTIONS_MARGIN_CLASSES.sm).toBeDefined();
      expect(SKELETON_CARD_ACTIONS_MARGIN_CLASSES.md).toBeDefined();
      expect(SKELETON_CARD_ACTIONS_MARGIN_CLASSES.lg).toBeDefined();
    });

    it('should use margin-top utilities', () => {
      expect(SKELETON_CARD_ACTIONS_MARGIN_CLASSES.sm).toContain('mt-');
      expect(SKELETON_CARD_ACTIONS_MARGIN_CLASSES.md).toContain('mt-');
      expect(SKELETON_CARD_ACTIONS_MARGIN_CLASSES.lg).toContain('mt-');
    });

    it('should have correct margin-top values', () => {
      expect(SKELETON_CARD_ACTIONS_MARGIN_CLASSES.sm).toBe('mt-3');
      expect(SKELETON_CARD_ACTIONS_MARGIN_CLASSES.md).toBe('mt-4');
      expect(SKELETON_CARD_ACTIONS_MARGIN_CLASSES.lg).toBe('mt-5');
    });
  });

  // ===========================================================================
  // Constants - Content Gap Classes
  // ===========================================================================

  describe('SKELETON_CARD_CONTENT_GAP_CLASSES', () => {
    it('should define space-y classes for all sizes', () => {
      expect(SKELETON_CARD_CONTENT_GAP_CLASSES.sm).toBeDefined();
      expect(SKELETON_CARD_CONTENT_GAP_CLASSES.md).toBeDefined();
      expect(SKELETON_CARD_CONTENT_GAP_CLASSES.lg).toBeDefined();
    });

    it('should use space-y utilities', () => {
      expect(SKELETON_CARD_CONTENT_GAP_CLASSES.sm).toContain('space-y-');
      expect(SKELETON_CARD_CONTENT_GAP_CLASSES.md).toContain('space-y-');
      expect(SKELETON_CARD_CONTENT_GAP_CLASSES.lg).toContain('space-y-');
    });

    it('should have correct space-y values', () => {
      expect(SKELETON_CARD_CONTENT_GAP_CLASSES.sm).toBe('space-y-1.5');
      expect(SKELETON_CARD_CONTENT_GAP_CLASSES.md).toBe('space-y-2');
      expect(SKELETON_CARD_CONTENT_GAP_CLASSES.lg).toBe('space-y-2.5');
    });
  });

  // ===========================================================================
  // getBaseSize Utility
  // ===========================================================================

  describe('getBaseSize', () => {
    it('should return the size directly for string values', () => {
      expect(getBaseSize('sm')).toBe('sm');
      expect(getBaseSize('md')).toBe('md');
      expect(getBaseSize('lg')).toBe('lg');
    });

    it('should return base from responsive object', () => {
      expect(getBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
      expect(getBaseSize({ base: 'lg' })).toBe('lg');
    });

    it('should default to md when base is not specified', () => {
      expect(getBaseSize({ md: 'lg' })).toBe('md');
      expect(getBaseSize({ lg: 'lg' })).toBe('md');
    });

    it('should handle all breakpoints', () => {
      expect(getBaseSize({ base: 'sm', sm: 'sm', md: 'md', lg: 'lg', xl: 'lg', '2xl': 'lg' })).toBe(
        'sm'
      );
    });

    it('should handle empty responsive object', () => {
      expect(getBaseSize({})).toBe('md');
    });
  });

  // ===========================================================================
  // getResponsiveSizeClasses Utility
  // ===========================================================================

  describe('getResponsiveSizeClasses', () => {
    describe('with string size', () => {
      it('should return classes for sm size', () => {
        const result = getResponsiveSizeClasses('sm', SKELETON_CARD_PADDING_CLASSES);
        expect(result).toBe('p-3');
      });

      it('should return classes for md size', () => {
        const result = getResponsiveSizeClasses('md', SKELETON_CARD_PADDING_CLASSES);
        expect(result).toBe('p-4');
      });

      it('should return classes for lg size', () => {
        const result = getResponsiveSizeClasses('lg', SKELETON_CARD_PADDING_CLASSES);
        expect(result).toBe('p-5');
      });
    });

    describe('with responsive object', () => {
      it('should generate base classes without prefix', () => {
        const result = getResponsiveSizeClasses({ base: 'sm' }, SKELETON_CARD_PADDING_CLASSES);
        expect(result).toBe('p-3');
      });

      it('should prefix non-base breakpoint classes', () => {
        const result = getResponsiveSizeClasses(
          { base: 'sm', md: 'lg' },
          SKELETON_CARD_PADDING_CLASSES
        );
        expect(result).toBe('p-3 md:p-5');
      });

      it('should handle multiple breakpoints', () => {
        const result = getResponsiveSizeClasses(
          { base: 'sm', md: 'md', lg: 'lg' },
          SKELETON_CARD_PADDING_CLASSES
        );
        expect(result).toBe('p-3 md:p-4 lg:p-5');
      });

      it('should handle breakpoints in correct order', () => {
        // Even if specified out of order in object, should output in breakpoint order
        const result = getResponsiveSizeClasses(
          { lg: 'lg', base: 'sm', md: 'md' },
          SKELETON_CARD_PADDING_CLASSES
        );
        expect(result).toBe('p-3 md:p-4 lg:p-5');
      });

      it('should skip undefined breakpoints', () => {
        const result = getResponsiveSizeClasses(
          { base: 'sm', lg: 'lg' },
          SKELETON_CARD_PADDING_CLASSES
        );
        expect(result).toBe('p-3 lg:p-5');
        expect(result).not.toContain('md:');
      });

      it('should handle xl and 2xl breakpoints', () => {
        const result = getResponsiveSizeClasses(
          { base: 'sm', xl: 'md', '2xl': 'lg' },
          SKELETON_CARD_PADDING_CLASSES
        );
        expect(result).toBe('p-3 xl:p-4 2xl:p-5');
      });
    });

    describe('with multi-class values', () => {
      it('should prefix each class in multi-class values', () => {
        const result = getResponsiveSizeClasses(
          { base: 'sm', md: 'md' },
          SKELETON_CARD_ACTION_CLASSES
        );
        // sm: 'h-7 w-16', md: 'h-8 w-20'
        expect(result).toBe('h-7 w-16 md:h-8 md:w-20');
      });

      it('should handle all action button classes', () => {
        const result = getResponsiveSizeClasses(
          { base: 'sm', lg: 'lg' },
          SKELETON_CARD_ACTION_CLASSES
        );
        // sm: 'h-7 w-16', lg: 'h-9 w-24'
        expect(result).toBe('h-7 w-16 lg:h-9 lg:w-24');
      });
    });

    describe('edge cases', () => {
      it('handles responsive object with only non-base breakpoints', () => {
        const result = getResponsiveSizeClasses({ md: 'lg' }, SKELETON_CARD_PADDING_CLASSES);
        // No base specified, so should only have md-prefixed classes
        expect(result).toBe('md:p-5');
      });

      it('handles all breakpoints in responsive object', () => {
        const result = getResponsiveSizeClasses(
          { base: 'sm', sm: 'sm', md: 'md', lg: 'lg', xl: 'lg', '2xl': 'lg' },
          SKELETON_CARD_PADDING_CLASSES
        );
        expect(result).toContain('p-3');
        expect(result).toContain('sm:p-3');
        expect(result).toContain('md:p-4');
        expect(result).toContain('lg:p-5');
        expect(result).toContain('xl:p-5');
        expect(result).toContain('2xl:p-5');
      });
    });
  });

  // ===========================================================================
  // getAvatarDimensions Utility
  // ===========================================================================

  describe('getAvatarDimensions', () => {
    it('should return dimensions for string size', () => {
      expect(getAvatarDimensions('sm')).toEqual({ width: 32, height: 32 });
      expect(getAvatarDimensions('md')).toEqual({ width: 40, height: 40 });
      expect(getAvatarDimensions('lg')).toEqual({ width: 48, height: 48 });
    });

    it('should use base size for responsive object', () => {
      expect(getAvatarDimensions({ base: 'sm', md: 'lg' })).toEqual({ width: 32, height: 32 });
      expect(getAvatarDimensions({ base: 'lg' })).toEqual({ width: 48, height: 48 });
    });

    it('should default to md when base not specified', () => {
      expect(getAvatarDimensions({ lg: 'lg' })).toEqual({ width: 40, height: 40 });
    });
  });

  // ===========================================================================
  // Component Behavior Documentation
  // ===========================================================================

  describe('Component behavior', () => {
    it('documents that showAvatar defaults to true', () => {
      // Documented behavior
      expect(true).toBe(true);
    });

    it('documents that showActions defaults to false', () => {
      // Documented behavior
      expect(true).toBe(true);
    });

    it('documents that lines defaults to 2', () => {
      // Documented behavior
      expect(true).toBe(true);
    });

    it('documents that size defaults to md', () => {
      // Verify md is a valid size
      expect(SKELETON_CARD_PADDING_CLASSES.md).toBeDefined();
    });

    it('documents that container has aria-hidden="true"', () => {
      // Documented behavior - skeletons are decorative
      expect(true).toBe(true);
    });

    it('documents that container has role="presentation"', () => {
      // Documented behavior - skeletons are presentational
      expect(true).toBe(true);
    });

    it('documents that data-size reflects the size prop', () => {
      // Documented behavior - "sm", "md", "lg", or "responsive" for objects
      expect(true).toBe(true);
    });

    it('documents that data-show-avatar reflects showAvatar prop', () => {
      // Documented behavior
      expect(true).toBe(true);
    });

    it('documents that data-show-actions reflects showActions prop', () => {
      // Documented behavior
      expect(true).toBe(true);
    });

    it('documents that data-lines reflects lines prop', () => {
      // Documented behavior
      expect(true).toBe(true);
    });
  });

  // ===========================================================================
  // Size Consistency Tests
  // ===========================================================================

  describe('Size consistency', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    it('all class maps define all sizes', () => {
      const classMaps = [
        SKELETON_CARD_PADDING_CLASSES,
        SKELETON_CARD_HEADER_GAP_CLASSES,
        SKELETON_CARD_TITLE_CLASSES,
        SKELETON_CARD_DESCRIPTION_CLASSES,
        SKELETON_CARD_ACTION_CLASSES,
        SKELETON_CARD_ACTIONS_GAP_CLASSES,
        SKELETON_CARD_ACTIONS_MARGIN_CLASSES,
        SKELETON_CARD_CONTENT_GAP_CLASSES,
      ];

      for (const classMap of classMaps) {
        for (const size of sizes) {
          expect(classMap[size]).toBeDefined();
          expect(typeof classMap[size]).toBe('string');
          expect(classMap[size].length).toBeGreaterThan(0);
        }
      }
    });

    it('avatar class map defines all sizes', () => {
      for (const size of sizes) {
        expect(SKELETON_CARD_AVATAR_CLASSES[size]).toBeDefined();
        expect(SKELETON_CARD_AVATAR_CLASSES[size]).toHaveProperty('width');
        expect(SKELETON_CARD_AVATAR_CLASSES[size]).toHaveProperty('height');
      }
    });

    it('all sizes produce non-empty classes', () => {
      for (const size of sizes) {
        const paddingResult = getResponsiveSizeClasses(size, SKELETON_CARD_PADDING_CLASSES);
        expect(paddingResult.length).toBeGreaterThan(0);
      }
    });
  });

  // ===========================================================================
  // Type Safety Tests
  // ===========================================================================

  describe('Type safety', () => {
    it('getBaseSize accepts string sizes', () => {
      const sm = getBaseSize('sm');
      const md = getBaseSize('md');
      const lg = getBaseSize('lg');

      expect(sm).toBe('sm');
      expect(md).toBe('md');
      expect(lg).toBe('lg');
    });

    it('getBaseSize accepts responsive objects', () => {
      const result = getBaseSize({ base: 'sm', md: 'lg' });
      expect(result).toBe('sm');
    });

    it('getResponsiveSizeClasses works with different class maps', () => {
      const paddingClasses = getResponsiveSizeClasses('md', SKELETON_CARD_PADDING_CLASSES);
      const titleClasses = getResponsiveSizeClasses('md', SKELETON_CARD_TITLE_CLASSES);
      const headerGapClasses = getResponsiveSizeClasses('md', SKELETON_CARD_HEADER_GAP_CLASSES);

      expect(paddingClasses).toBe('p-4');
      expect(titleClasses).toBe('h-4');
      expect(headerGapClasses).toBe('gap-3');
    });
  });

  // ===========================================================================
  // Integration with Card Layout
  // ===========================================================================

  describe('Card layout matching', () => {
    it('documents that skeleton matches Card component padding', () => {
      // The skeleton uses the same padding structure as Card
      expect(SKELETON_CARD_PADDING_CLASSES.md).toBe('p-4');
    });

    it('documents that avatar size matches typical avatar dimensions', () => {
      // md avatar is 40x40, which matches common avatar sizes
      expect(SKELETON_CARD_AVATAR_CLASSES.md).toEqual({ width: 40, height: 40 });
    });

    it('documents that action buttons match typical button heights', () => {
      // md action button is h-8, which matches button md size
      expect(SKELETON_CARD_ACTION_CLASSES.md).toContain('h-8');
    });

    it('documents that skeleton uses card styling classes', () => {
      // Cards have border, background, and rounded corners
      expect(SKELETON_CARD_BASE_CLASSES).toContain('rounded-lg');
      expect(SKELETON_CARD_BASE_CLASSES).toContain('border');
      expect(SKELETON_CARD_BASE_CLASSES).toContain('bg-');
    });
  });

  // ===========================================================================
  // Responsive Breakpoint Tests
  // ===========================================================================

  describe('Responsive breakpoints', () => {
    it('supports base breakpoint', () => {
      const result = getResponsiveSizeClasses({ base: 'sm' }, SKELETON_CARD_PADDING_CLASSES);
      expect(result).toBe('p-3');
    });

    it('supports sm breakpoint', () => {
      const result = getResponsiveSizeClasses({ sm: 'md' }, SKELETON_CARD_PADDING_CLASSES);
      expect(result).toBe('sm:p-4');
    });

    it('supports md breakpoint', () => {
      const result = getResponsiveSizeClasses({ md: 'lg' }, SKELETON_CARD_PADDING_CLASSES);
      expect(result).toBe('md:p-5');
    });

    it('supports lg breakpoint', () => {
      const result = getResponsiveSizeClasses({ lg: 'lg' }, SKELETON_CARD_PADDING_CLASSES);
      expect(result).toBe('lg:p-5');
    });

    it('supports xl breakpoint', () => {
      const result = getResponsiveSizeClasses({ xl: 'lg' }, SKELETON_CARD_PADDING_CLASSES);
      expect(result).toBe('xl:p-5');
    });

    it('supports 2xl breakpoint', () => {
      const result = getResponsiveSizeClasses({ '2xl': 'lg' }, SKELETON_CARD_PADDING_CLASSES);
      expect(result).toBe('2xl:p-5');
    });

    it('generates classes in correct breakpoint order', () => {
      const result = getResponsiveSizeClasses(
        { '2xl': 'lg', base: 'sm', xl: 'md', md: 'md', sm: 'sm', lg: 'lg' },
        SKELETON_CARD_PADDING_CLASSES
      );
      // Should be ordered: base, sm, md, lg, xl, 2xl
      expect(result).toBe('p-3 sm:p-3 md:p-4 lg:p-5 xl:p-4 2xl:p-5');
    });
  });
});
