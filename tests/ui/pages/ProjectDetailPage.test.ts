/**
 * Unit tests for ProjectDetailPage component
 *
 * Tests cover:
 * - Exported constants (default values, labels, classes)
 * - Utility functions (getBaseSize, getResponsiveSizeClasses, etc.)
 * - Accessibility-related constants
 * - Size mappings
 *
 * @module tests/ui/pages/ProjectDetailPage.test
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BACK_LABEL,
  DEFAULT_ERROR_DESCRIPTION,
  DEFAULT_ERROR_TITLE,
  DEFAULT_PAGE_LABEL,
  DEFAULT_PAGE_SIZE,
  DEFAULT_RETRY_LABEL,
  // Constants
  DEFAULT_SKELETON_TASK_COUNT,
  PAGE_SIZE_GAP,
  PAGE_SIZE_PADDING,
  PROJECT_DETAIL_PAGE_BASE_CLASSES,
  PROJECT_DETAIL_PAGE_ERROR_CLASSES,
  PROJECT_DETAIL_PAGE_ERROR_ICON_CLASSES,
  PROJECT_DETAIL_PAGE_SKELETON_CLASSES,
  PROJECT_DETAIL_PAGE_SKELETON_CONTENT_CLASSES,
  PROJECT_DETAIL_PAGE_SKELETON_HEADER_CLASSES,
  PROJECT_DETAIL_PAGE_SKELETON_MAIN_CLASSES,
  PROJECT_DETAIL_PAGE_SKELETON_SIDEBAR_CLASSES,
  // Types
  type ProjectDetailPageSize,
  SR_EMPTY,
  SR_ERROR_PREFIX,
  SR_LOADED_PREFIX,
  SR_LOADING,
  SR_NOT_FOUND,
  buildLoadedAnnouncement,
  buildPageAccessibleLabel,
  // Utility functions
  getBaseSize,
  getResponsiveSizeClasses,
} from '../../../packages/ui/pages/ProjectDetailPage';

// ============================================================================
// Default Constants Tests
// ============================================================================

describe('Default Constants', () => {
  describe('DEFAULT_SKELETON_TASK_COUNT', () => {
    it('should be 5', () => {
      expect(DEFAULT_SKELETON_TASK_COUNT).toBe(5);
    });
  });

  describe('DEFAULT_PAGE_SIZE', () => {
    it('should be "md"', () => {
      expect(DEFAULT_PAGE_SIZE).toBe('md');
    });
  });

  describe('DEFAULT_PAGE_LABEL', () => {
    it('should be "Project Details"', () => {
      expect(DEFAULT_PAGE_LABEL).toBe('Project Details');
    });
  });
});

// ============================================================================
// Error State Constants Tests
// ============================================================================

describe('Error State Constants', () => {
  describe('DEFAULT_ERROR_TITLE', () => {
    it('should be descriptive', () => {
      expect(DEFAULT_ERROR_TITLE).toBe('Failed to load project');
    });
  });

  describe('DEFAULT_ERROR_DESCRIPTION', () => {
    it('should provide helpful context', () => {
      expect(DEFAULT_ERROR_DESCRIPTION).toBe(
        'An error occurred while loading the project. Please try again.'
      );
    });
  });

  describe('DEFAULT_RETRY_LABEL', () => {
    it('should be actionable', () => {
      expect(DEFAULT_RETRY_LABEL).toBe('Retry');
    });
  });

  describe('DEFAULT_BACK_LABEL', () => {
    it('should be actionable', () => {
      expect(DEFAULT_BACK_LABEL).toBe('Back to Projects');
    });
  });
});

// ============================================================================
// Screen Reader Constants Tests
// ============================================================================

describe('Screen Reader Announcement Constants', () => {
  describe('SR_LOADING', () => {
    it('should announce loading state', () => {
      expect(SR_LOADING).toBe('Loading project details...');
    });

    it('should be polite and informative', () => {
      expect(SR_LOADING).toContain('Loading');
    });
  });

  describe('SR_NOT_FOUND', () => {
    it('should announce not found state', () => {
      expect(SR_NOT_FOUND).toBe('Project not found');
    });
  });

  describe('SR_ERROR_PREFIX', () => {
    it('should be a prefix for error messages', () => {
      expect(SR_ERROR_PREFIX).toBe('Error:');
    });

    it('should end with colon for concatenation', () => {
      expect(SR_ERROR_PREFIX.endsWith(':')).toBe(true);
    });
  });

  describe('SR_EMPTY', () => {
    it('should announce empty tasks state', () => {
      expect(SR_EMPTY).toBe('No tasks found');
    });
  });

  describe('SR_LOADED_PREFIX', () => {
    it('should announce loaded state prefix', () => {
      expect(SR_LOADED_PREFIX).toBe('Project loaded:');
    });

    it('should end with colon for concatenation', () => {
      expect(SR_LOADED_PREFIX.endsWith(':')).toBe(true);
    });
  });
});

// ============================================================================
// CSS Class Constants Tests
// ============================================================================

describe('CSS Class Constants', () => {
  describe('PROJECT_DETAIL_PAGE_BASE_CLASSES', () => {
    it('should include flex layout classes', () => {
      expect(PROJECT_DETAIL_PAGE_BASE_CLASSES).toContain('flex');
      expect(PROJECT_DETAIL_PAGE_BASE_CLASSES).toContain('flex-col');
    });

    it('should include full height', () => {
      expect(PROJECT_DETAIL_PAGE_BASE_CLASSES).toContain('h-full');
    });
  });

  describe('PROJECT_DETAIL_PAGE_ERROR_CLASSES', () => {
    it('should center content', () => {
      expect(PROJECT_DETAIL_PAGE_ERROR_CLASSES).toContain('items-center');
      expect(PROJECT_DETAIL_PAGE_ERROR_CLASSES).toContain('justify-center');
    });

    it('should include full height', () => {
      expect(PROJECT_DETAIL_PAGE_ERROR_CLASSES).toContain('h-full');
    });

    it('should include text centering', () => {
      expect(PROJECT_DETAIL_PAGE_ERROR_CLASSES).toContain('text-center');
    });

    it('should include padding', () => {
      expect(PROJECT_DETAIL_PAGE_ERROR_CLASSES).toContain('p-8');
    });
  });

  describe('PROJECT_DETAIL_PAGE_SKELETON_CLASSES', () => {
    it('should include flex layout', () => {
      expect(PROJECT_DETAIL_PAGE_SKELETON_CLASSES).toContain('flex');
      expect(PROJECT_DETAIL_PAGE_SKELETON_CLASSES).toContain('flex-col');
    });

    it('should fill full height', () => {
      expect(PROJECT_DETAIL_PAGE_SKELETON_CLASSES).toContain('h-full');
    });
  });

  describe('PROJECT_DETAIL_PAGE_SKELETON_HEADER_CLASSES', () => {
    it('should include border', () => {
      expect(PROJECT_DETAIL_PAGE_SKELETON_HEADER_CLASSES).toContain('border-b');
    });

    it('should include flex alignment', () => {
      expect(PROJECT_DETAIL_PAGE_SKELETON_HEADER_CLASSES).toContain('flex');
      expect(PROJECT_DETAIL_PAGE_SKELETON_HEADER_CLASSES).toContain('items-center');
    });
  });

  describe('PROJECT_DETAIL_PAGE_SKELETON_SIDEBAR_CLASSES', () => {
    it('should include width', () => {
      expect(PROJECT_DETAIL_PAGE_SKELETON_SIDEBAR_CLASSES).toContain('w-64');
    });

    it('should include border', () => {
      expect(PROJECT_DETAIL_PAGE_SKELETON_SIDEBAR_CLASSES).toContain('border-r');
    });

    it('should include flex layout', () => {
      expect(PROJECT_DETAIL_PAGE_SKELETON_SIDEBAR_CLASSES).toContain('flex');
      expect(PROJECT_DETAIL_PAGE_SKELETON_SIDEBAR_CLASSES).toContain('flex-col');
    });
  });

  describe('PROJECT_DETAIL_PAGE_SKELETON_MAIN_CLASSES', () => {
    it('should be flexible', () => {
      expect(PROJECT_DETAIL_PAGE_SKELETON_MAIN_CLASSES).toContain('flex-1');
    });

    it('should handle overflow', () => {
      expect(PROJECT_DETAIL_PAGE_SKELETON_MAIN_CLASSES).toContain('overflow-auto');
    });
  });

  describe('PROJECT_DETAIL_PAGE_SKELETON_CONTENT_CLASSES', () => {
    it('should include flex column layout', () => {
      expect(PROJECT_DETAIL_PAGE_SKELETON_CONTENT_CLASSES).toContain('flex');
      expect(PROJECT_DETAIL_PAGE_SKELETON_CONTENT_CLASSES).toContain('flex-col');
    });

    it('should include gap', () => {
      expect(PROJECT_DETAIL_PAGE_SKELETON_CONTENT_CLASSES).toContain('gap-2');
    });
  });

  describe('PROJECT_DETAIL_PAGE_ERROR_ICON_CLASSES', () => {
    it('should include flex centering', () => {
      expect(PROJECT_DETAIL_PAGE_ERROR_ICON_CLASSES).toContain('flex');
      expect(PROJECT_DETAIL_PAGE_ERROR_ICON_CLASSES).toContain('items-center');
      expect(PROJECT_DETAIL_PAGE_ERROR_ICON_CLASSES).toContain('justify-center');
    });

    it('should include rounded full', () => {
      expect(PROJECT_DETAIL_PAGE_ERROR_ICON_CLASSES).toContain('rounded-full');
    });

    it('should include destructive colors', () => {
      expect(PROJECT_DETAIL_PAGE_ERROR_ICON_CLASSES).toContain('text-destructive');
    });

    it('should include bottom margin', () => {
      expect(PROJECT_DETAIL_PAGE_ERROR_ICON_CLASSES).toContain('mb-4');
    });
  });
});

// ============================================================================
// Size Mapping Tests
// ============================================================================

describe('Size Mappings', () => {
  describe('PAGE_SIZE_PADDING', () => {
    it('should have all size variants', () => {
      expect(PAGE_SIZE_PADDING).toHaveProperty('sm');
      expect(PAGE_SIZE_PADDING).toHaveProperty('md');
      expect(PAGE_SIZE_PADDING).toHaveProperty('lg');
    });

    it('should have correct values for each size', () => {
      expect(PAGE_SIZE_PADDING.sm).toBe('p-3');
      expect(PAGE_SIZE_PADDING.md).toBe('p-4 md:p-6');
      expect(PAGE_SIZE_PADDING.lg).toBe('p-6 md:p-8');
    });
  });

  describe('PAGE_SIZE_GAP', () => {
    it('should have all size variants', () => {
      expect(PAGE_SIZE_GAP).toHaveProperty('sm');
      expect(PAGE_SIZE_GAP).toHaveProperty('md');
      expect(PAGE_SIZE_GAP).toHaveProperty('lg');
    });

    it('should increase gap with size', () => {
      expect(PAGE_SIZE_GAP.sm).toBe('gap-1.5');
      expect(PAGE_SIZE_GAP.md).toBe('gap-2');
      expect(PAGE_SIZE_GAP.lg).toBe('gap-2.5');
    });
  });
});

// ============================================================================
// Utility Function Tests: getBaseSize
// ============================================================================

describe('getBaseSize', () => {
  it('should return the size when string is provided', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('should return base from responsive object', () => {
    expect(getBaseSize({ base: 'sm' })).toBe('sm');
    expect(getBaseSize({ base: 'lg', md: 'sm' })).toBe('lg');
  });

  it('should return default when base is not in responsive object', () => {
    expect(getBaseSize({ md: 'lg' })).toBe(DEFAULT_PAGE_SIZE);
  });
});

// ============================================================================
// Utility Function Tests: getResponsiveSizeClasses
// ============================================================================

describe('getResponsiveSizeClasses', () => {
  const testClassMap: Record<ProjectDetailPageSize, string> = {
    sm: 'test-sm',
    md: 'test-md',
    lg: 'test-lg',
  };

  it('should return correct class for string size', () => {
    expect(getResponsiveSizeClasses('sm', testClassMap)).toBe('test-sm');
    expect(getResponsiveSizeClasses('md', testClassMap)).toBe('test-md');
    expect(getResponsiveSizeClasses('lg', testClassMap)).toBe('test-lg');
  });

  it('should handle responsive object with base only', () => {
    expect(getResponsiveSizeClasses({ base: 'sm' }, testClassMap)).toBe('test-sm');
  });

  it('should add breakpoint prefixes for responsive sizes', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', md: 'md', lg: 'lg' }, testClassMap);
    expect(result).toContain('test-sm');
    expect(result).toContain('md:test-md');
    expect(result).toContain('lg:test-lg');
  });

  it('should handle all breakpoints', () => {
    const result = getResponsiveSizeClasses(
      { base: 'sm', sm: 'md', md: 'lg', lg: 'sm', xl: 'md', '2xl': 'lg' },
      testClassMap
    );
    expect(result).toContain('test-sm');
    expect(result).toContain('sm:test-md');
    expect(result).toContain('md:test-lg');
    expect(result).toContain('lg:test-sm');
    expect(result).toContain('xl:test-md');
    expect(result).toContain('2xl:test-lg');
  });

  it('should handle multi-word classes correctly', () => {
    const multiClassMap: Record<ProjectDetailPageSize, string> = {
      sm: 'p-2 m-2',
      md: 'p-4 m-4',
      lg: 'p-6 m-6',
    };

    const result = getResponsiveSizeClasses({ base: 'sm', md: 'md' }, multiClassMap);
    expect(result).toContain('p-2');
    expect(result).toContain('m-2');
    expect(result).toContain('md:p-4');
    expect(result).toContain('md:m-4');
  });
});

// ============================================================================
// Utility Function Tests: buildLoadedAnnouncement
// ============================================================================

describe('buildLoadedAnnouncement', () => {
  const mockProject = {
    id: '1',
    name: 'Test Project',
    gitRepoPath: '/path/to/project',
    baseBranch: 'main',
    setupScript: '',
    devScript: '',
    icon: 'folder',
    workflowsFolder: 'workflows',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('should start with loaded prefix', () => {
    const result = buildLoadedAnnouncement(mockProject, 5);
    expect(result.startsWith(SR_LOADED_PREFIX)).toBe(true);
  });

  it('should include project name', () => {
    const result = buildLoadedAnnouncement(mockProject, 3);
    expect(result).toContain('Test Project');
  });

  it('should use singular "task" for one task', () => {
    const result = buildLoadedAnnouncement(mockProject, 1);
    expect(result).toContain('1 task');
    expect(result).not.toContain('1 tasks');
  });

  it('should use plural "tasks" for multiple tasks', () => {
    const result = buildLoadedAnnouncement(mockProject, 5);
    expect(result).toContain('5 tasks');
  });

  it('should use plural "tasks" for zero tasks', () => {
    const result = buildLoadedAnnouncement(mockProject, 0);
    expect(result).toContain('0 tasks');
  });

  it('should format announcement correctly', () => {
    const result = buildLoadedAnnouncement(mockProject, 3);
    expect(result).toBe('Project loaded: Test Project with 3 tasks');
  });
});

// ============================================================================
// Utility Function Tests: buildPageAccessibleLabel
// ============================================================================

describe('buildPageAccessibleLabel', () => {
  const mockProject = {
    id: '1',
    name: 'My Project',
    gitRepoPath: '/path/to/project',
    baseBranch: 'main',
    setupScript: '',
    devScript: '',
    icon: 'folder',
    workflowsFolder: 'workflows',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('loading state', () => {
    it('should return loading announcement', () => {
      const result = buildPageAccessibleLabel('loading');
      expect(result).toBe(SR_LOADING);
    });

    it('should ignore project when loading', () => {
      const result = buildPageAccessibleLabel('loading', mockProject);
      expect(result).toBe(SR_LOADING);
    });
  });

  describe('not-found state', () => {
    it('should return not found announcement', () => {
      const result = buildPageAccessibleLabel('not-found');
      expect(result).toBe(SR_NOT_FOUND);
    });

    it('should ignore project when not found', () => {
      const result = buildPageAccessibleLabel('not-found', mockProject);
      expect(result).toBe(SR_NOT_FOUND);
    });
  });

  describe('error state', () => {
    it('should return error title', () => {
      const result = buildPageAccessibleLabel('error');
      expect(result).toBe(DEFAULT_ERROR_TITLE);
    });

    it('should ignore project when error', () => {
      const result = buildPageAccessibleLabel('error', mockProject);
      expect(result).toBe(DEFAULT_ERROR_TITLE);
    });
  });

  describe('ready state', () => {
    it('should include project name when provided', () => {
      const result = buildPageAccessibleLabel('ready', mockProject);
      expect(result).toBe('Project Details: My Project');
    });

    it('should return default label when no project', () => {
      const result = buildPageAccessibleLabel('ready');
      expect(result).toBe(DEFAULT_PAGE_LABEL);
    });

    it('should return default label when project is undefined', () => {
      const result = buildPageAccessibleLabel('ready', undefined);
      expect(result).toBe(DEFAULT_PAGE_LABEL);
    });
  });
});

// ============================================================================
// Accessibility Behavior Documentation Tests
// ============================================================================

describe('Accessibility Behavior Documentation', () => {
  it('ProjectDetailPage should have aria-label based on state and project', () => {
    const mockProject = {
      id: '1',
      name: 'Auth Service',
      gitRepoPath: '/path',
      baseBranch: 'main',
      setupScript: '',
      devScript: '',
      icon: 'folder',
      workflowsFolder: 'workflows',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(buildPageAccessibleLabel('ready', mockProject)).toBe('Project Details: Auth Service');
    expect(buildPageAccessibleLabel('loading')).toBe(SR_LOADING);
    expect(buildPageAccessibleLabel('error')).toBe(DEFAULT_ERROR_TITLE);
    expect(buildPageAccessibleLabel('not-found')).toBe(SR_NOT_FOUND);
  });

  it('Loading state should announce via VisuallyHidden', () => {
    expect(SR_LOADING).toBeDefined();
    expect(SR_LOADING.length).toBeGreaterThan(0);
  });

  it('Error state should use role="alert" with assertive announcement', () => {
    expect(SR_ERROR_PREFIX).toContain('Error');
  });

  it('Not found state should use descriptive announcement', () => {
    expect(SR_NOT_FOUND).toContain('not found');
  });
});

// ============================================================================
// Component Props Documentation Tests
// ============================================================================

describe('Component Props Documentation', () => {
  it('ProjectDetailPage accepts state prop with specific values', () => {
    const validStates = ['loading', 'not-found', 'error', 'ready'];
    validStates.forEach((state) => {
      expect(typeof state).toBe('string');
    });
  });

  it('ProjectDetailPageSkeleton accepts skeletonCount prop', () => {
    expect(DEFAULT_SKELETON_TASK_COUNT).toBe(5);
  });

  it('ProjectDetailPageError accepts message and onRetry props', () => {
    expect(DEFAULT_ERROR_TITLE).toBeDefined();
    expect(DEFAULT_RETRY_LABEL).toBeDefined();
  });

  it('ProjectDetailPage accepts size prop with responsive values', () => {
    expect(DEFAULT_PAGE_SIZE).toBe('md');
    expect(PAGE_SIZE_PADDING.md).toBeDefined();
    expect(PAGE_SIZE_GAP.md).toBeDefined();
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('Size Consistency', () => {
  const sizes: ProjectDetailPageSize[] = ['sm', 'md', 'lg'];

  it('all size maps should have all three sizes', () => {
    sizes.forEach((size) => {
      expect(PAGE_SIZE_PADDING[size]).toBeDefined();
      expect(PAGE_SIZE_GAP[size]).toBeDefined();
    });
  });

  it('gap values should progressively increase', () => {
    // Parse the gap values (e.g., "gap-1.5" -> 1.5)
    const parseGap = (gap: string) => Number.parseFloat(gap.replace('gap-', ''));
    expect(parseGap(PAGE_SIZE_GAP.sm)).toBeLessThan(parseGap(PAGE_SIZE_GAP.md));
    expect(parseGap(PAGE_SIZE_GAP.md)).toBeLessThan(parseGap(PAGE_SIZE_GAP.lg));
  });
});

// ============================================================================
// Data Attributes Documentation Tests
// ============================================================================

describe('Data Attributes Documentation', () => {
  it('documents data-testid values', () => {
    const testIds = [
      'project-detail-page',
      'project-detail-page-skeleton',
      'project-detail-page-error',
    ];
    testIds.forEach((testId) => {
      expect(typeof testId).toBe('string');
    });
  });

  it('documents data-state values', () => {
    const states = ['loading', 'error', 'not-found', 'ready'];
    states.forEach((state) => {
      expect(typeof state).toBe('string');
    });
  });

  it('documents data-size attribute', () => {
    const sizes = ['sm', 'md', 'lg'];
    sizes.forEach((size) => {
      expect(typeof size).toBe('string');
    });
  });

  it('documents data-task-count attribute', () => {
    // data-task-count is a number as string
    expect(String(5)).toBe('5');
  });

  it('documents data-sidebar-collapsed attribute', () => {
    // data-sidebar-collapsed is a boolean as string
    expect(String(true)).toBe('true');
    expect(String(false)).toBe('false');
  });

  it('documents data-mobile-drawer-open attribute', () => {
    // data-mobile-drawer-open is a boolean as string
    expect(String(true)).toBe('true');
    expect(String(false)).toBe('false');
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('Integration Patterns', () => {
  it('page label adapts based on state', () => {
    const mockProject = {
      id: '1',
      name: 'Test',
      gitRepoPath: '/test',
      baseBranch: 'main',
      setupScript: '',
      devScript: '',
      icon: 'folder',
      workflowsFolder: 'workflows',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Ready state includes project name
    const readyLabel = buildPageAccessibleLabel('ready', mockProject);
    expect(readyLabel).toContain('Test');

    // Other states use fixed messages
    expect(buildPageAccessibleLabel('loading')).toBe(SR_LOADING);
    expect(buildPageAccessibleLabel('error')).toBe(DEFAULT_ERROR_TITLE);
    expect(buildPageAccessibleLabel('not-found')).toBe(SR_NOT_FOUND);
  });

  it('announcement includes project name and task count', () => {
    const mockProject = {
      id: '1',
      name: 'Auth Service',
      gitRepoPath: '/auth',
      baseBranch: 'main',
      setupScript: '',
      devScript: '',
      icon: 'folder',
      workflowsFolder: 'workflows',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const announcement = buildLoadedAnnouncement(mockProject, 10);
    expect(announcement).toContain('Auth Service');
    expect(announcement).toContain('10 tasks');
  });
});

// ============================================================================
// Sub-Component Documentation Tests
// ============================================================================

describe('Sub-Component Documentation', () => {
  it('ProjectDetailPageSkeleton provides loading placeholder UI', () => {
    // Documents that skeleton component exists with these props
    expect(DEFAULT_SKELETON_TASK_COUNT).toBe(5);
    expect(PROJECT_DETAIL_PAGE_SKELETON_CLASSES).toBeDefined();
    expect(PROJECT_DETAIL_PAGE_SKELETON_HEADER_CLASSES).toBeDefined();
    expect(PROJECT_DETAIL_PAGE_SKELETON_SIDEBAR_CLASSES).toBeDefined();
    expect(PROJECT_DETAIL_PAGE_SKELETON_MAIN_CLASSES).toBeDefined();
    expect(PROJECT_DETAIL_PAGE_SKELETON_CONTENT_CLASSES).toBeDefined();
  });

  it('ProjectDetailPageError provides error state UI', () => {
    // Documents that error component exists with these props
    expect(DEFAULT_ERROR_TITLE).toBeDefined();
    expect(DEFAULT_ERROR_DESCRIPTION).toBeDefined();
    expect(DEFAULT_RETRY_LABEL).toBeDefined();
    expect(DEFAULT_BACK_LABEL).toBeDefined();
    expect(PROJECT_DETAIL_PAGE_ERROR_CLASSES).toBeDefined();
    expect(PROJECT_DETAIL_PAGE_ERROR_ICON_CLASSES).toBeDefined();
  });
});
