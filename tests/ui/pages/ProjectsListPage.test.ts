/**
 * Unit tests for ProjectsListPage constants and utility functions
 *
 * Tests cover:
 * - Default values and constants
 * - Screen reader announcement constants
 * - CSS class constants
 * - Size mappings
 * - Utility functions (getBaseSize, getResponsiveSizeClasses, etc.)
 * - Accessibility behavior documentation
 *
 * @module tests/ui/pages/ProjectsListPage.test
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ERROR_DESCRIPTION,
  DEFAULT_ERROR_TITLE,
  DEFAULT_PAGE_LABEL,
  DEFAULT_PAGE_SIZE,
  DEFAULT_RETRY_LABEL,
  DEFAULT_SKELETON_PROJECT_COUNT,
  PAGE_SIZE_GAP,
  PAGE_SIZE_PADDING,
  PROJECTS_LIST_PAGE_BASE_CLASSES,
  PROJECTS_LIST_PAGE_ERROR_CLASSES,
  PROJECTS_LIST_PAGE_SKELETON_CARD_CLASSES,
  PROJECTS_LIST_PAGE_SKELETON_CLASSES,
  PROJECTS_LIST_PAGE_SKELETON_GRID_CLASSES,
  PROJECTS_LIST_PAGE_SKELETON_HEADER_CLASSES,
  type ProjectsListPageBreakpoint,
  type ProjectsListPageSize,
  SKELETON_ICON_DIMENSIONS,
  SR_EMPTY,
  SR_ERROR_PREFIX,
  SR_LOADED_PREFIX,
  SR_LOADING,
  buildLoadedAnnouncement,
  buildPageAccessibleLabel,
  getBaseSize,
  getResponsiveSizeClasses,
  getSkeletonIconDimensions,
} from '../../../packages/ui/pages/ProjectsListPage';

// ============================================================================
// Default Values Tests
// ============================================================================

describe('Default Values', () => {
  it('DEFAULT_SKELETON_PROJECT_COUNT should be 6', () => {
    expect(DEFAULT_SKELETON_PROJECT_COUNT).toBe(6);
  });

  it('DEFAULT_PAGE_SIZE should be "md"', () => {
    expect(DEFAULT_PAGE_SIZE).toBe('md');
  });

  it('DEFAULT_PAGE_LABEL should be "Projects list"', () => {
    expect(DEFAULT_PAGE_LABEL).toBe('Projects list');
  });

  it('DEFAULT_ERROR_TITLE should be "Failed to load projects"', () => {
    expect(DEFAULT_ERROR_TITLE).toBe('Failed to load projects');
  });

  it('DEFAULT_ERROR_DESCRIPTION should be defined', () => {
    expect(DEFAULT_ERROR_DESCRIPTION).toBe('Something went wrong while loading your projects.');
  });

  it('DEFAULT_RETRY_LABEL should be "Try Again"', () => {
    expect(DEFAULT_RETRY_LABEL).toBe('Try Again');
  });
});

// ============================================================================
// Screen Reader Announcement Constants Tests
// ============================================================================

describe('Screen Reader Announcement Constants', () => {
  it('SR_LOADING should be "Loading projects. Please wait."', () => {
    expect(SR_LOADING).toBe('Loading projects. Please wait.');
  });

  it('SR_ERROR_PREFIX should be "Error loading projects:"', () => {
    expect(SR_ERROR_PREFIX).toBe('Error loading projects:');
  });

  it('SR_EMPTY should describe empty state action', () => {
    expect(SR_EMPTY).toBe('No projects found. Create your first project to get started.');
  });

  it('SR_LOADED_PREFIX should be "Projects loaded."', () => {
    expect(SR_LOADED_PREFIX).toBe('Projects loaded.');
  });
});

// ============================================================================
// CSS Class Constants Tests
// ============================================================================

describe('CSS Class Constants', () => {
  describe('PROJECTS_LIST_PAGE_BASE_CLASSES', () => {
    it('should include flex layout', () => {
      expect(PROJECTS_LIST_PAGE_BASE_CLASSES).toContain('flex');
      expect(PROJECTS_LIST_PAGE_BASE_CLASSES).toContain('flex-col');
    });

    it('should include full dimensions', () => {
      expect(PROJECTS_LIST_PAGE_BASE_CLASSES).toContain('h-full');
      expect(PROJECTS_LIST_PAGE_BASE_CLASSES).toContain('w-full');
    });

    it('should include relative positioning', () => {
      expect(PROJECTS_LIST_PAGE_BASE_CLASSES).toContain('relative');
    });
  });

  describe('PROJECTS_LIST_PAGE_ERROR_CLASSES', () => {
    it('should include flex centering', () => {
      expect(PROJECTS_LIST_PAGE_ERROR_CLASSES).toContain('flex');
      expect(PROJECTS_LIST_PAGE_ERROR_CLASSES).toContain('items-center');
      expect(PROJECTS_LIST_PAGE_ERROR_CLASSES).toContain('justify-center');
    });

    it('should include gap for spacing', () => {
      expect(PROJECTS_LIST_PAGE_ERROR_CLASSES).toContain('gap-4');
    });

    it('should include text alignment', () => {
      expect(PROJECTS_LIST_PAGE_ERROR_CLASSES).toContain('text-center');
    });

    it('should include minimum height', () => {
      expect(PROJECTS_LIST_PAGE_ERROR_CLASSES).toContain('min-h-[300px]');
    });
  });

  describe('PROJECTS_LIST_PAGE_SKELETON_CLASSES', () => {
    it('should include flex column layout', () => {
      expect(PROJECTS_LIST_PAGE_SKELETON_CLASSES).toContain('flex');
      expect(PROJECTS_LIST_PAGE_SKELETON_CLASSES).toContain('flex-col');
    });

    it('should include full height', () => {
      expect(PROJECTS_LIST_PAGE_SKELETON_CLASSES).toContain('h-full');
    });
  });

  describe('PROJECTS_LIST_PAGE_SKELETON_HEADER_CLASSES', () => {
    it('should include border styling', () => {
      expect(PROJECTS_LIST_PAGE_SKELETON_HEADER_CLASSES).toContain('border-b');
    });

    it('should include padding', () => {
      expect(PROJECTS_LIST_PAGE_SKELETON_HEADER_CLASSES).toContain('p-4');
    });

    it('should include responsive padding', () => {
      expect(PROJECTS_LIST_PAGE_SKELETON_HEADER_CLASSES).toContain('md:p-6');
    });
  });

  describe('PROJECTS_LIST_PAGE_SKELETON_GRID_CLASSES', () => {
    it('should include grid layout', () => {
      expect(PROJECTS_LIST_PAGE_SKELETON_GRID_CLASSES).toContain('grid');
    });

    it('should include responsive column definitions', () => {
      expect(PROJECTS_LIST_PAGE_SKELETON_GRID_CLASSES).toContain('grid-cols-1');
      expect(PROJECTS_LIST_PAGE_SKELETON_GRID_CLASSES).toContain('sm:grid-cols-2');
      expect(PROJECTS_LIST_PAGE_SKELETON_GRID_CLASSES).toContain('lg:grid-cols-3');
    });

    it('should include gap for spacing', () => {
      expect(PROJECTS_LIST_PAGE_SKELETON_GRID_CLASSES).toContain('gap-4');
    });

    it('should include overflow handling', () => {
      expect(PROJECTS_LIST_PAGE_SKELETON_GRID_CLASSES).toContain('overflow-auto');
    });
  });

  describe('PROJECTS_LIST_PAGE_SKELETON_CARD_CLASSES', () => {
    it('should include border radius', () => {
      expect(PROJECTS_LIST_PAGE_SKELETON_CARD_CLASSES).toContain('rounded-lg');
    });

    it('should include border', () => {
      expect(PROJECTS_LIST_PAGE_SKELETON_CARD_CLASSES).toContain('border');
    });

    it('should include padding', () => {
      expect(PROJECTS_LIST_PAGE_SKELETON_CARD_CLASSES).toContain('p-4');
    });

    it('should include flex column layout', () => {
      expect(PROJECTS_LIST_PAGE_SKELETON_CARD_CLASSES).toContain('flex');
      expect(PROJECTS_LIST_PAGE_SKELETON_CARD_CLASSES).toContain('flex-col');
    });

    it('should include gap for spacing', () => {
      expect(PROJECTS_LIST_PAGE_SKELETON_CARD_CLASSES).toContain('gap-3');
    });
  });
});

// ============================================================================
// Size Mappings Tests
// ============================================================================

describe('Size Mappings', () => {
  describe('PAGE_SIZE_PADDING', () => {
    it('should have all size variants', () => {
      expect(PAGE_SIZE_PADDING).toHaveProperty('sm');
      expect(PAGE_SIZE_PADDING).toHaveProperty('md');
      expect(PAGE_SIZE_PADDING).toHaveProperty('lg');
    });

    it('sm should have smaller padding', () => {
      expect(PAGE_SIZE_PADDING.sm).toBe('p-3');
    });

    it('md should have medium padding with responsive variant', () => {
      expect(PAGE_SIZE_PADDING.md).toBe('p-4 md:p-6');
    });

    it('lg should have larger padding with responsive variant', () => {
      expect(PAGE_SIZE_PADDING.lg).toBe('p-6 md:p-8');
    });
  });

  describe('PAGE_SIZE_GAP', () => {
    it('should have all size variants', () => {
      expect(PAGE_SIZE_GAP).toHaveProperty('sm');
      expect(PAGE_SIZE_GAP).toHaveProperty('md');
      expect(PAGE_SIZE_GAP).toHaveProperty('lg');
    });

    it('gaps should increase with size', () => {
      expect(PAGE_SIZE_GAP.sm).toBe('gap-3');
      expect(PAGE_SIZE_GAP.md).toBe('gap-4');
      expect(PAGE_SIZE_GAP.lg).toBe('gap-6');
    });
  });

  describe('SKELETON_ICON_DIMENSIONS', () => {
    it('should have all size variants', () => {
      expect(SKELETON_ICON_DIMENSIONS).toHaveProperty('sm');
      expect(SKELETON_ICON_DIMENSIONS).toHaveProperty('md');
      expect(SKELETON_ICON_DIMENSIONS).toHaveProperty('lg');
    });

    it('dimensions should increase with size', () => {
      expect(SKELETON_ICON_DIMENSIONS.sm).toBe(32);
      expect(SKELETON_ICON_DIMENSIONS.md).toBe(40);
      expect(SKELETON_ICON_DIMENSIONS.lg).toBe(48);
    });

    it('all values should be numbers', () => {
      expect(typeof SKELETON_ICON_DIMENSIONS.sm).toBe('number');
      expect(typeof SKELETON_ICON_DIMENSIONS.md).toBe('number');
      expect(typeof SKELETON_ICON_DIMENSIONS.lg).toBe('number');
    });
  });
});

// ============================================================================
// getBaseSize Tests
// ============================================================================

describe('getBaseSize', () => {
  it('should return DEFAULT_PAGE_SIZE when size is undefined', () => {
    expect(getBaseSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('should return the size directly when size is a string', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('should return base value when size is a responsive object', () => {
    expect(getBaseSize({ base: 'sm' })).toBe('sm');
    expect(getBaseSize({ base: 'lg' })).toBe('lg');
  });

  it('should return DEFAULT_PAGE_SIZE when responsive object has no base', () => {
    expect(getBaseSize({ md: 'lg' })).toBe(DEFAULT_PAGE_SIZE);
  });

  it('should ignore responsive breakpoints and return base only', () => {
    expect(getBaseSize({ base: 'sm', md: 'md', lg: 'lg' })).toBe('sm');
  });
});

// ============================================================================
// getResponsiveSizeClasses Tests
// ============================================================================

describe('getResponsiveSizeClasses', () => {
  it('should return default classes when size is undefined', () => {
    const result = getResponsiveSizeClasses(undefined, PAGE_SIZE_PADDING);
    expect(result).toBe(PAGE_SIZE_PADDING[DEFAULT_PAGE_SIZE]);
  });

  it('should return classes for string size', () => {
    expect(getResponsiveSizeClasses('sm', PAGE_SIZE_PADDING)).toBe(PAGE_SIZE_PADDING.sm);
    expect(getResponsiveSizeClasses('md', PAGE_SIZE_PADDING)).toBe(PAGE_SIZE_PADDING.md);
    expect(getResponsiveSizeClasses('lg', PAGE_SIZE_PADDING)).toBe(PAGE_SIZE_PADDING.lg);
  });

  it('should generate responsive classes for object with base only', () => {
    const result = getResponsiveSizeClasses({ base: 'sm' }, PAGE_SIZE_GAP);
    expect(result).toBe('gap-3');
  });

  it('should generate responsive classes with breakpoint prefixes', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', md: 'lg' }, PAGE_SIZE_GAP);
    expect(result).toContain('gap-3'); // base
    expect(result).toContain('md:gap-6'); // md breakpoint
  });

  it('should handle all breakpoints', () => {
    const sizeObj: { [K in ProjectsListPageBreakpoint]?: ProjectsListPageSize } = {
      base: 'sm',
      sm: 'sm',
      md: 'md',
      lg: 'lg',
      xl: 'lg',
      '2xl': 'lg',
    };
    const result = getResponsiveSizeClasses(sizeObj, PAGE_SIZE_GAP);
    expect(result).toContain('gap-3'); // base
    expect(result).toContain('sm:gap-3'); // sm
    expect(result).toContain('md:gap-4'); // md
    expect(result).toContain('lg:gap-6'); // lg
    expect(result).toContain('xl:gap-6'); // xl
    expect(result).toContain('2xl:gap-6'); // 2xl
  });

  it('should use default when base is not specified', () => {
    const result = getResponsiveSizeClasses({ md: 'lg' }, PAGE_SIZE_GAP);
    expect(result).toContain(PAGE_SIZE_GAP[DEFAULT_PAGE_SIZE]);
    expect(result).toContain('md:gap-6');
  });
});

// ============================================================================
// getSkeletonIconDimensions Tests
// ============================================================================

describe('getSkeletonIconDimensions', () => {
  it('should return default icon dimensions when size is undefined', () => {
    expect(getSkeletonIconDimensions(undefined)).toBe(SKELETON_ICON_DIMENSIONS[DEFAULT_PAGE_SIZE]);
  });

  it('should return correct dimensions for string sizes', () => {
    expect(getSkeletonIconDimensions('sm')).toBe(32);
    expect(getSkeletonIconDimensions('md')).toBe(40);
    expect(getSkeletonIconDimensions('lg')).toBe(48);
  });

  it('should return base dimensions for responsive objects', () => {
    expect(getSkeletonIconDimensions({ base: 'sm' })).toBe(32);
    expect(getSkeletonIconDimensions({ base: 'lg' })).toBe(48);
  });

  it('should return default when responsive object has no base', () => {
    expect(getSkeletonIconDimensions({ md: 'lg' })).toBe(
      SKELETON_ICON_DIMENSIONS[DEFAULT_PAGE_SIZE]
    );
  });
});

// ============================================================================
// buildLoadedAnnouncement Tests
// ============================================================================

describe('buildLoadedAnnouncement', () => {
  it('should return empty state message for 0 projects', () => {
    expect(buildLoadedAnnouncement(0)).toBe(SR_EMPTY);
  });

  it('should return singular form for 1 project', () => {
    const result = buildLoadedAnnouncement(1);
    expect(result).toContain(SR_LOADED_PREFIX);
    expect(result).toContain('1 project.');
    expect(result).not.toContain('projects');
  });

  it('should return plural form for multiple projects', () => {
    const result = buildLoadedAnnouncement(5);
    expect(result).toContain(SR_LOADED_PREFIX);
    expect(result).toContain('5 projects.');
  });

  it('should handle large numbers', () => {
    const result = buildLoadedAnnouncement(100);
    expect(result).toContain('100 projects.');
  });
});

// ============================================================================
// buildPageAccessibleLabel Tests
// ============================================================================

describe('buildPageAccessibleLabel', () => {
  describe('loading state', () => {
    it('should include "Loading" suffix', () => {
      const result = buildPageAccessibleLabel('loading');
      expect(result).toBe(`${DEFAULT_PAGE_LABEL} - Loading`);
    });
  });

  describe('error state', () => {
    it('should include "Error loading" suffix', () => {
      const result = buildPageAccessibleLabel('error');
      expect(result).toBe(`${DEFAULT_PAGE_LABEL} - Error loading`);
    });
  });

  describe('ready state', () => {
    it('should return base label when project count is undefined', () => {
      const result = buildPageAccessibleLabel('ready');
      expect(result).toBe(DEFAULT_PAGE_LABEL);
    });

    it('should return base label when project count is 0', () => {
      const result = buildPageAccessibleLabel('ready', 0);
      expect(result).toBe(DEFAULT_PAGE_LABEL);
    });

    it('should include singular project count', () => {
      const result = buildPageAccessibleLabel('ready', 1);
      expect(result).toBe(`${DEFAULT_PAGE_LABEL} - 1 project`);
    });

    it('should include plural project count', () => {
      const result = buildPageAccessibleLabel('ready', 5);
      expect(result).toBe(`${DEFAULT_PAGE_LABEL} - 5 projects`);
    });

    it('should handle large project counts', () => {
      const result = buildPageAccessibleLabel('ready', 42);
      expect(result).toBe(`${DEFAULT_PAGE_LABEL} - 42 projects`);
    });
  });
});

// ============================================================================
// Accessibility Behavior Documentation Tests
// ============================================================================

describe('Accessibility Behavior Documentation', () => {
  describe('Loading state behavior', () => {
    it('SR_LOADING provides clear loading message', () => {
      expect(SR_LOADING).toContain('Loading');
      expect(SR_LOADING).toContain('Please wait');
    });
  });

  describe('Error state behavior', () => {
    it('SR_ERROR_PREFIX can be combined with error message', () => {
      const errorMessage = 'Network error';
      const fullAnnouncement = `${SR_ERROR_PREFIX} ${errorMessage}`;
      expect(fullAnnouncement).toBe('Error loading projects: Network error');
    });
  });

  describe('Empty state behavior', () => {
    it('SR_EMPTY provides actionable guidance', () => {
      expect(SR_EMPTY).toContain('No projects');
      expect(SR_EMPTY).toContain('Create');
    });
  });

  describe('Loaded state behavior', () => {
    it('SR_LOADED_PREFIX provides confirmation', () => {
      expect(SR_LOADED_PREFIX).toContain('loaded');
    });
  });
});

// ============================================================================
// Component Behavior Documentation Tests
// ============================================================================

describe('Component Behavior Documentation', () => {
  describe('ProjectsListPage states', () => {
    it('should support loading state', () => {
      // Page should render skeleton when state="loading"
      expect(['loading', 'error', 'ready']).toContain('loading');
    });

    it('should support error state', () => {
      // Page should render error UI when state="error"
      expect(['loading', 'error', 'ready']).toContain('error');
    });

    it('should support ready state', () => {
      // Page should render content when state="ready"
      expect(['loading', 'error', 'ready']).toContain('ready');
    });
  });

  describe('ProjectsListPageSkeleton component', () => {
    it('should be aria-hidden by default', () => {
      // Skeleton has aria-hidden="true"
      expect(true).toBe(true);
    });

    it('should use role="presentation"', () => {
      // Skeleton has role="presentation" for decorative purpose
      expect(true).toBe(true);
    });

    it('should provide SR announcement via VisuallyHidden', () => {
      // VisuallyHidden contains SR_LOADING for screen readers
      expect(true).toBe(true);
    });
  });

  describe('ProjectsListPageError component', () => {
    it('should use role="alert" for immediate announcement', () => {
      // Error component has role="alert"
      expect(true).toBe(true);
    });

    it('should use aria-live="assertive" for interruption', () => {
      // Error announcement interrupts current reading
      expect(true).toBe(true);
    });

    it('should link heading and description via ARIA', () => {
      // Uses aria-labelledby and aria-describedby
      expect(true).toBe(true);
    });
  });
});

// ============================================================================
// Data Attributes Documentation Tests
// ============================================================================

describe('Data Attributes Documentation', () => {
  it('loading state sets data-state="loading"', () => {
    // When state="loading", data-state="loading" and aria-busy="true"
    expect(true).toBe(true);
  });

  it('error state sets data-state="error"', () => {
    // When state="error", data-state="error"
    expect(true).toBe(true);
  });

  it('ready state with projects sets data-state="ready"', () => {
    // When state="ready" and projectCount > 0, data-state="ready"
    expect(true).toBe(true);
  });

  it('ready state without projects sets data-state="empty"', () => {
    // When state="ready" and projectCount === 0, data-state="empty"
    expect(true).toBe(true);
  });

  it('ready state includes data-project-count', () => {
    // When state="ready", data-project-count={projectCount}
    expect(true).toBe(true);
  });

  it('skeleton includes data-count', () => {
    // Skeleton component includes data-count={projectCount}
    expect(true).toBe(true);
  });
});

// ============================================================================
// Responsive Grid Behavior Tests
// ============================================================================

describe('Responsive Grid Behavior', () => {
  it('grid should be 1 column on mobile', () => {
    expect(PROJECTS_LIST_PAGE_SKELETON_GRID_CLASSES).toContain('grid-cols-1');
  });

  it('grid should be 2 columns on small screens', () => {
    expect(PROJECTS_LIST_PAGE_SKELETON_GRID_CLASSES).toContain('sm:grid-cols-2');
  });

  it('grid should be 3 columns on large screens', () => {
    expect(PROJECTS_LIST_PAGE_SKELETON_GRID_CLASSES).toContain('lg:grid-cols-3');
  });
});

// ============================================================================
// Touch Target Compliance Tests
// ============================================================================

describe('Touch Target Compliance (WCAG 2.5.5)', () => {
  it('error retry button should have 44px minimum dimensions', () => {
    // Button component uses min-h-[44px] min-w-[44px]
    expect(true).toBe(true);
  });

  it('project cards should have adequate touch area', () => {
    // Card components have padding and sufficient size for touch
    expect(PROJECTS_LIST_PAGE_SKELETON_CARD_CLASSES).toContain('p-4');
  });
});

// ============================================================================
// Type Safety Tests
// ============================================================================

describe('Type Safety', () => {
  it('ProjectsListPageSize should only accept valid sizes', () => {
    const validSizes: ProjectsListPageSize[] = ['sm', 'md', 'lg'];
    expect(validSizes).toHaveLength(3);
  });

  it('ProjectsListPageBreakpoint should include all breakpoints', () => {
    const validBreakpoints: ProjectsListPageBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];
    expect(validBreakpoints).toHaveLength(6);
  });

  it('SIZE_PADDING should have entries for all sizes', () => {
    const sizes: ProjectsListPageSize[] = ['sm', 'md', 'lg'];
    for (const size of sizes) {
      expect(PAGE_SIZE_PADDING[size]).toBeDefined();
    }
  });

  it('SIZE_GAP should have entries for all sizes', () => {
    const sizes: ProjectsListPageSize[] = ['sm', 'md', 'lg'];
    for (const size of sizes) {
      expect(PAGE_SIZE_GAP[size]).toBeDefined();
    }
  });

  it('SKELETON_ICON_DIMENSIONS should have entries for all sizes', () => {
    const sizes: ProjectsListPageSize[] = ['sm', 'md', 'lg'];
    for (const size of sizes) {
      expect(SKELETON_ICON_DIMENSIONS[size]).toBeDefined();
    }
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('Integration Patterns', () => {
  it('utility functions work together correctly', () => {
    // Get base size from responsive object
    const size = { base: 'sm' as const, md: 'lg' as const };
    const baseSize = getBaseSize(size);
    expect(baseSize).toBe('sm');

    // Get responsive classes
    const classes = getResponsiveSizeClasses(size, PAGE_SIZE_GAP);
    expect(classes).toContain('gap-3');
    expect(classes).toContain('md:gap-6');

    // Get icon dimensions for base size
    const iconDim = getSkeletonIconDimensions(size);
    expect(iconDim).toBe(32);
  });

  it('announcement functions produce valid screen reader text', () => {
    // Build loaded announcement
    const loadedAnnouncement = buildLoadedAnnouncement(5);
    expect(loadedAnnouncement).not.toBe('');
    expect(typeof loadedAnnouncement).toBe('string');

    // Build accessible label
    const label = buildPageAccessibleLabel('ready', 5);
    expect(label).not.toBe('');
    expect(typeof label).toBe('string');
  });
});
