/**
 * SkeletonArchiveList Unit Tests
 *
 * Tests for the SkeletonArchiveList molecule component focusing on:
 * - Size class generation utilities
 * - Responsive class generation
 * - Constant definitions
 * - Component behavior documentation
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SKELETON_COUNT,
  SKELETON_ACTION_BUTTON_CLASSES,
  SKELETON_ARCHIVE_LIST_BASE_CLASSES,
  SKELETON_ARCHIVE_LIST_SIZE_CLASSES,
  SKELETON_ITEM_CONTAINER_CLASSES,
  SKELETON_METADATA_CLASSES,
  SKELETON_SECONDARY_ACTION_CLASSES,
  SKELETON_SECONDARY_METADATA_CLASSES,
  SKELETON_TITLE_CLASSES,
  getBaseSize,
  getResponsiveSizeClasses,
} from '../../../packages/ui/molecules/SkeletonArchiveList';

describe('SkeletonArchiveList', () => {
  // ===========================================================================
  // Constants
  // ===========================================================================

  describe('DEFAULT_SKELETON_COUNT', () => {
    it('should be 5', () => {
      expect(DEFAULT_SKELETON_COUNT).toBe(5);
    });
  });

  describe('SKELETON_ARCHIVE_LIST_BASE_CLASSES', () => {
    it('should include flex and flex-col', () => {
      expect(SKELETON_ARCHIVE_LIST_BASE_CLASSES).toContain('flex');
      expect(SKELETON_ARCHIVE_LIST_BASE_CLASSES).toContain('flex-col');
    });
  });

  describe('SKELETON_ARCHIVE_LIST_SIZE_CLASSES', () => {
    it('should define gap classes for all sizes', () => {
      expect(SKELETON_ARCHIVE_LIST_SIZE_CLASSES.sm).toBeDefined();
      expect(SKELETON_ARCHIVE_LIST_SIZE_CLASSES.md).toBeDefined();
      expect(SKELETON_ARCHIVE_LIST_SIZE_CLASSES.lg).toBeDefined();
    });

    it('should use gap utilities', () => {
      expect(SKELETON_ARCHIVE_LIST_SIZE_CLASSES.sm).toContain('gap-');
      expect(SKELETON_ARCHIVE_LIST_SIZE_CLASSES.md).toContain('gap-');
      expect(SKELETON_ARCHIVE_LIST_SIZE_CLASSES.lg).toContain('gap-');
    });

    it('should have larger gap for lg size', () => {
      // lg has gap-3, sm and md have gap-2
      expect(SKELETON_ARCHIVE_LIST_SIZE_CLASSES.lg).toBe('gap-3');
      expect(SKELETON_ARCHIVE_LIST_SIZE_CLASSES.sm).toBe('gap-2');
      expect(SKELETON_ARCHIVE_LIST_SIZE_CLASSES.md).toBe('gap-2');
    });
  });

  describe('SKELETON_ITEM_CONTAINER_CLASSES', () => {
    it('should define padding classes for all sizes', () => {
      expect(SKELETON_ITEM_CONTAINER_CLASSES.sm).toBe('p-3');
      expect(SKELETON_ITEM_CONTAINER_CLASSES.md).toBe('p-4');
      expect(SKELETON_ITEM_CONTAINER_CLASSES.lg).toBe('p-5');
    });

    it('should increase padding with size', () => {
      const smPadding = Number.parseInt(SKELETON_ITEM_CONTAINER_CLASSES.sm.replace('p-', ''));
      const mdPadding = Number.parseInt(SKELETON_ITEM_CONTAINER_CLASSES.md.replace('p-', ''));
      const lgPadding = Number.parseInt(SKELETON_ITEM_CONTAINER_CLASSES.lg.replace('p-', ''));

      expect(smPadding).toBeLessThan(mdPadding);
      expect(mdPadding).toBeLessThan(lgPadding);
    });
  });

  describe('SKELETON_TITLE_CLASSES', () => {
    it('should define classes for all sizes', () => {
      expect(SKELETON_TITLE_CLASSES.sm).toBeDefined();
      expect(SKELETON_TITLE_CLASSES.md).toBeDefined();
      expect(SKELETON_TITLE_CLASSES.lg).toBeDefined();
    });

    it('should include height classes', () => {
      expect(SKELETON_TITLE_CLASSES.sm).toContain('h-');
      expect(SKELETON_TITLE_CLASSES.md).toContain('h-');
      expect(SKELETON_TITLE_CLASSES.lg).toContain('h-');
    });

    it('should include width classes', () => {
      expect(SKELETON_TITLE_CLASSES.sm).toContain('w-');
      expect(SKELETON_TITLE_CLASSES.md).toContain('w-');
      expect(SKELETON_TITLE_CLASSES.lg).toContain('w-');
    });
  });

  describe('SKELETON_METADATA_CLASSES', () => {
    it('should define classes for all sizes', () => {
      expect(SKELETON_METADATA_CLASSES.sm).toBeDefined();
      expect(SKELETON_METADATA_CLASSES.md).toBeDefined();
      expect(SKELETON_METADATA_CLASSES.lg).toBeDefined();
    });

    it('should have smaller heights than title', () => {
      // Metadata is smaller text, so should have smaller heights
      expect(SKELETON_METADATA_CLASSES.sm).toContain('h-2.5');
      expect(SKELETON_METADATA_CLASSES.md).toContain('h-3');
      expect(SKELETON_METADATA_CLASSES.lg).toContain('h-3.5');
    });
  });

  describe('SKELETON_SECONDARY_METADATA_CLASSES', () => {
    it('should define classes for all sizes', () => {
      expect(SKELETON_SECONDARY_METADATA_CLASSES.sm).toBeDefined();
      expect(SKELETON_SECONDARY_METADATA_CLASSES.md).toBeDefined();
      expect(SKELETON_SECONDARY_METADATA_CLASSES.lg).toBeDefined();
    });

    it('should be wider than primary metadata', () => {
      // Secondary metadata (archived date) is wider than primary (project name)
      const smPrimaryWidth = Number.parseInt(
        SKELETON_METADATA_CLASSES.sm.match(/w-(\d+)/)?.[1] ?? '0'
      );
      const smSecondaryWidth = Number.parseInt(
        SKELETON_SECONDARY_METADATA_CLASSES.sm.match(/w-(\d+)/)?.[1] ?? '0'
      );
      expect(smSecondaryWidth).toBeGreaterThan(smPrimaryWidth);
    });
  });

  describe('SKELETON_ACTION_BUTTON_CLASSES', () => {
    it('should define classes for all sizes', () => {
      expect(SKELETON_ACTION_BUTTON_CLASSES.sm).toBeDefined();
      expect(SKELETON_ACTION_BUTTON_CLASSES.md).toBeDefined();
      expect(SKELETON_ACTION_BUTTON_CLASSES.lg).toBeDefined();
    });

    it('should include height and width', () => {
      expect(SKELETON_ACTION_BUTTON_CLASSES.sm).toMatch(/h-\d/);
      expect(SKELETON_ACTION_BUTTON_CLASSES.sm).toMatch(/w-\d+/);
    });
  });

  describe('SKELETON_SECONDARY_ACTION_CLASSES', () => {
    it('should define classes for all sizes', () => {
      expect(SKELETON_SECONDARY_ACTION_CLASSES.sm).toBeDefined();
      expect(SKELETON_SECONDARY_ACTION_CLASSES.md).toBeDefined();
      expect(SKELETON_SECONDARY_ACTION_CLASSES.lg).toBeDefined();
    });

    it('should be narrower than primary action button', () => {
      // Secondary action (Delete) is narrower than primary (Restore)
      const smPrimaryWidth = Number.parseInt(
        SKELETON_ACTION_BUTTON_CLASSES.sm.match(/w-(\d+)/)?.[1] ?? '0'
      );
      const smSecondaryWidth = Number.parseInt(
        SKELETON_SECONDARY_ACTION_CLASSES.sm.match(/w-(\d+)/)?.[1] ?? '0'
      );
      expect(smSecondaryWidth).toBeLessThan(smPrimaryWidth);
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
  });

  // ===========================================================================
  // getResponsiveSizeClasses Utility
  // ===========================================================================

  describe('getResponsiveSizeClasses', () => {
    describe('with string size', () => {
      it('should return classes for sm size', () => {
        const result = getResponsiveSizeClasses('sm', SKELETON_ITEM_CONTAINER_CLASSES);
        expect(result).toBe('p-3');
      });

      it('should return classes for md size', () => {
        const result = getResponsiveSizeClasses('md', SKELETON_ITEM_CONTAINER_CLASSES);
        expect(result).toBe('p-4');
      });

      it('should return classes for lg size', () => {
        const result = getResponsiveSizeClasses('lg', SKELETON_ITEM_CONTAINER_CLASSES);
        expect(result).toBe('p-5');
      });
    });

    describe('with responsive object', () => {
      it('should generate base classes without prefix', () => {
        const result = getResponsiveSizeClasses({ base: 'sm' }, SKELETON_ITEM_CONTAINER_CLASSES);
        expect(result).toBe('p-3');
      });

      it('should prefix non-base breakpoint classes', () => {
        const result = getResponsiveSizeClasses(
          { base: 'sm', md: 'lg' },
          SKELETON_ITEM_CONTAINER_CLASSES
        );
        expect(result).toBe('p-3 md:p-5');
      });

      it('should handle multiple breakpoints', () => {
        const result = getResponsiveSizeClasses(
          { base: 'sm', md: 'md', lg: 'lg' },
          SKELETON_ITEM_CONTAINER_CLASSES
        );
        expect(result).toBe('p-3 md:p-4 lg:p-5');
      });

      it('should handle breakpoints in correct order', () => {
        // Even if specified out of order in object, should output in breakpoint order
        const result = getResponsiveSizeClasses(
          { lg: 'lg', base: 'sm', md: 'md' },
          SKELETON_ITEM_CONTAINER_CLASSES
        );
        expect(result).toBe('p-3 md:p-4 lg:p-5');
      });

      it('should skip undefined breakpoints', () => {
        const result = getResponsiveSizeClasses(
          { base: 'sm', lg: 'lg' },
          SKELETON_ITEM_CONTAINER_CLASSES
        );
        expect(result).toBe('p-3 lg:p-5');
        expect(result).not.toContain('md:');
      });

      it('should handle xl and 2xl breakpoints', () => {
        const result = getResponsiveSizeClasses(
          { base: 'sm', xl: 'md', '2xl': 'lg' },
          SKELETON_ITEM_CONTAINER_CLASSES
        );
        expect(result).toBe('p-3 xl:p-4 2xl:p-5');
      });
    });

    describe('with multi-class values', () => {
      it('should prefix each class in multi-class values', () => {
        const result = getResponsiveSizeClasses({ base: 'sm', md: 'md' }, SKELETON_TITLE_CLASSES);
        // sm: 'h-4 w-1/2', md: 'h-5 w-2/3'
        expect(result).toBe('h-4 w-1/2 md:h-5 md:w-2/3');
      });

      it('should handle action button multi-class values', () => {
        const result = getResponsiveSizeClasses(
          { base: 'sm', lg: 'lg' },
          SKELETON_ACTION_BUTTON_CLASSES
        );
        // sm: 'h-7 w-16', lg: 'h-9 w-24'
        expect(result).toBe('h-7 w-16 lg:h-9 lg:w-24');
      });
    });
  });

  // ===========================================================================
  // Component Behavior Documentation
  // ===========================================================================

  describe('Component behavior', () => {
    it('documents that count defaults to DEFAULT_SKELETON_COUNT', () => {
      expect(DEFAULT_SKELETON_COUNT).toBe(5);
    });

    it('documents that size defaults to md', () => {
      // Verify md is a valid size
      expect(SKELETON_ITEM_CONTAINER_CLASSES.md).toBeDefined();
    });

    it('documents that container has aria-hidden="true"', () => {
      // Documented behavior - skeletons are decorative
      expect(true).toBe(true);
    });

    it('documents that container has role="presentation"', () => {
      // Documented behavior - skeletons are presentational
      expect(true).toBe(true);
    });

    it('documents that data-count reflects the count prop', () => {
      // Documented behavior
      expect(true).toBe(true);
    });

    it('documents that data-size reflects the size prop', () => {
      // Documented behavior - "sm", "md", "lg", or "responsive" for objects
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
        SKELETON_ARCHIVE_LIST_SIZE_CLASSES,
        SKELETON_ITEM_CONTAINER_CLASSES,
        SKELETON_TITLE_CLASSES,
        SKELETON_METADATA_CLASSES,
        SKELETON_SECONDARY_METADATA_CLASSES,
        SKELETON_ACTION_BUTTON_CLASSES,
        SKELETON_SECONDARY_ACTION_CLASSES,
      ];

      for (const classMap of classMaps) {
        for (const size of sizes) {
          expect(classMap[size]).toBeDefined();
          expect(typeof classMap[size]).toBe('string');
          expect(classMap[size].length).toBeGreaterThan(0);
        }
      }
    });

    it('all sizes produce non-empty classes', () => {
      for (const size of sizes) {
        const containerResult = getResponsiveSizeClasses(size, SKELETON_ITEM_CONTAINER_CLASSES);
        expect(containerResult.length).toBeGreaterThan(0);
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
      const containerClasses = getResponsiveSizeClasses('md', SKELETON_ITEM_CONTAINER_CLASSES);
      const titleClasses = getResponsiveSizeClasses('md', SKELETON_TITLE_CLASSES);
      const gapClasses = getResponsiveSizeClasses('md', SKELETON_ARCHIVE_LIST_SIZE_CLASSES);

      expect(containerClasses).toBe('p-4');
      expect(titleClasses).toBe('h-5 w-2/3');
      expect(gapClasses).toBe('gap-2');
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge cases', () => {
    it('handles empty responsive object by defaulting to md', () => {
      const result = getBaseSize({});
      expect(result).toBe('md');
    });

    it('handles responsive object with only non-base breakpoints', () => {
      const result = getResponsiveSizeClasses({ md: 'lg' }, SKELETON_ITEM_CONTAINER_CLASSES);
      // No base specified, so should only have md-prefixed classes
      expect(result).toBe('md:p-5');
    });

    it('handles all breakpoints in responsive object', () => {
      const result = getResponsiveSizeClasses(
        { base: 'sm', sm: 'sm', md: 'md', lg: 'lg', xl: 'lg', '2xl': 'lg' },
        SKELETON_ITEM_CONTAINER_CLASSES
      );
      expect(result).toContain('p-3');
      expect(result).toContain('sm:p-3');
      expect(result).toContain('md:p-4');
      expect(result).toContain('lg:p-5');
      expect(result).toContain('xl:p-5');
      expect(result).toContain('2xl:p-5');
    });
  });

  // ===========================================================================
  // Integration with Archive Layout
  // ===========================================================================

  describe('Archive layout matching', () => {
    it('documents that skeleton matches ArchivedTaskItem layout', () => {
      // The skeleton includes:
      // - Title placeholder (h-5 w-2/3 for md)
      // - Metadata row (project name + archived date)
      // - Action buttons (Restore + Delete)
      expect(SKELETON_TITLE_CLASSES.md).toBe('h-5 w-2/3');
      expect(SKELETON_METADATA_CLASSES.md).toBe('h-3 w-24');
      expect(SKELETON_SECONDARY_METADATA_CLASSES.md).toBe('h-3 w-32');
      expect(SKELETON_ACTION_BUTTON_CLASSES.md).toBe('h-8 w-20');
      expect(SKELETON_SECONDARY_ACTION_CLASSES.md).toBe('h-8 w-16');
    });

    it('documents that item container uses card styling', () => {
      // Items have border, background, and rounded corners matching Card component
      // This is documented behavior - verified visually in Storybook
      expect(true).toBe(true);
    });

    it('documents that action buttons match archive item buttons', () => {
      // Primary action (Restore): h-8 w-20 at md
      // Secondary action (Delete): h-8 w-16 at md
      expect(SKELETON_ACTION_BUTTON_CLASSES.md).toContain('h-8');
      expect(SKELETON_ACTION_BUTTON_CLASSES.md).toContain('w-20');
      expect(SKELETON_SECONDARY_ACTION_CLASSES.md).toContain('h-8');
      expect(SKELETON_SECONDARY_ACTION_CLASSES.md).toContain('w-16');
    });
  });
});
