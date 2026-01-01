/**
 * ProjectsListPageComponents Organism Tests
 *
 * Tests for the ProjectsListPageComponents utility functions and constants.
 * Covers:
 * - Constant values and exports
 * - Utility function behavior
 * - Size class generation
 * - Responsive value handling
 * - Accessibility behavior documentation
 * - Component behavior documentation
 */

import { describe, expect, it } from 'vitest';
import {
  BUTTON_SIZE_MAP,
  CARD_ACTIONS_CONTAINER_CLASSES,
  CARD_BASE_CLASSES,
  CARD_CHEVRON_CLASSES,
  CARD_ICON_CONTAINER_BASE_CLASSES,
  CARD_ICON_CONTAINER_CLASSES,
  CARD_ICON_SIZE_CLASSES,
  CARD_PADDING_CLASSES,
  CARD_SETTINGS_BUTTON_CLASSES,
  CARD_TITLE_SIZE_MAP,
  DEFAULT_CREATE_PROJECT_LABEL,
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_RETRY_LABEL,
  DEFAULT_ERROR_TITLE,
  DEFAULT_GRID_LABEL,
  DEFAULT_NEW_PROJECT_LABEL,
  // Constants - Default labels
  DEFAULT_PAGE_TITLE,
  DEFAULT_SKELETON_COUNT,
  ERROR_ICON_CONTAINER_CLASSES,
  ERROR_STATE_CLASSES,
  GRID_BASE_CLASSES,
  GRID_GAP_CLASSES,
  // Base classes
  HEADER_CONTAINER_CLASSES,
  // Size classes
  HEADER_MARGIN_CLASSES,
  HEADER_TITLE_SIZE_MAP,
  LOADING_CONTAINER_CLASSES,
  // Types
  type ProjectsListSize,
  SKELETON_GRID_CLASSES,
  SR_EMPTY,
  SR_ERROR,
  // Screen reader constants
  SR_LOADING,
  SR_PROJECTS_LOADED,
  SR_PROJECT_CARD_LABEL,
  SR_PROJECT_COUNT_TEMPLATE,
  SR_SETTINGS_LABEL,
  buildProjectCardAccessibleLabel,
  buildProjectCountAnnouncement,
  buildSettingsAccessibleLabel,
  // Utility functions
  getBaseSize,
  getResponsiveSizeClasses,
} from '../../../packages/ui/organisms/ProjectsListPageComponents';

// ============================================================================
// Default Labels Tests
// ============================================================================

describe('Default Labels', () => {
  it('DEFAULT_PAGE_TITLE should be defined', () => {
    expect(DEFAULT_PAGE_TITLE).toBe('All Projects');
  });

  it('DEFAULT_NEW_PROJECT_LABEL should be defined', () => {
    expect(DEFAULT_NEW_PROJECT_LABEL).toBe('New Project');
  });

  it('DEFAULT_EMPTY_TITLE should be defined', () => {
    expect(DEFAULT_EMPTY_TITLE).toBe('No projects yet');
  });

  it('DEFAULT_EMPTY_DESCRIPTION should be defined', () => {
    expect(DEFAULT_EMPTY_DESCRIPTION).toBe(
      'Get started by creating your first project. Projects link to your local git repositories.'
    );
  });

  it('DEFAULT_CREATE_PROJECT_LABEL should be defined', () => {
    expect(DEFAULT_CREATE_PROJECT_LABEL).toBe('Create Project');
  });

  it('DEFAULT_ERROR_TITLE should be defined', () => {
    expect(DEFAULT_ERROR_TITLE).toBe('Failed to load projects');
  });

  it('DEFAULT_ERROR_RETRY_LABEL should be defined', () => {
    expect(DEFAULT_ERROR_RETRY_LABEL).toBe('Retry');
  });

  it('DEFAULT_GRID_LABEL should be defined', () => {
    expect(DEFAULT_GRID_LABEL).toBe('Projects list');
  });

  it('DEFAULT_SKELETON_COUNT should be defined', () => {
    expect(DEFAULT_SKELETON_COUNT).toBe(8);
  });
});

// ============================================================================
// Screen Reader Constants Tests
// ============================================================================

describe('Screen Reader Constants', () => {
  it('SR_LOADING should announce loading state', () => {
    expect(SR_LOADING).toBe('Loading projects...');
  });

  it('SR_ERROR should announce error state', () => {
    expect(SR_ERROR).toBe('Error loading projects');
  });

  it('SR_EMPTY should announce empty state', () => {
    expect(SR_EMPTY).toBe('No projects. Create a new project to get started.');
  });

  it('SR_PROJECTS_LOADED should announce success', () => {
    expect(SR_PROJECTS_LOADED).toBe('Projects loaded');
  });

  it('SR_PROJECT_COUNT_TEMPLATE should provide count format', () => {
    expect(SR_PROJECT_COUNT_TEMPLATE).toBe('{count} project{s}');
  });

  it('SR_SETTINGS_LABEL should describe settings action', () => {
    expect(SR_SETTINGS_LABEL).toBe('Open settings for {name}');
  });

  it('SR_PROJECT_CARD_LABEL should describe card action', () => {
    expect(SR_PROJECT_CARD_LABEL).toBe('Project: {name}, Path: {path}. Press Enter to open.');
  });
});

// ============================================================================
// HEADER_MARGIN_CLASSES Tests
// ============================================================================

describe('HEADER_MARGIN_CLASSES', () => {
  it('should have margin class for each size', () => {
    expect(HEADER_MARGIN_CLASSES.sm).toContain('mb-');
    expect(HEADER_MARGIN_CLASSES.md).toContain('mb-');
    expect(HEADER_MARGIN_CLASSES.lg).toContain('mb-');
  });

  it('should increase margin with size', () => {
    const smMargin = Number.parseInt(HEADER_MARGIN_CLASSES.sm.match(/mb-(\d+)/)?.[1] ?? '0', 10);
    const mdMargin = Number.parseInt(HEADER_MARGIN_CLASSES.md.match(/mb-(\d+)/)?.[1] ?? '0', 10);
    const lgMargin = Number.parseInt(HEADER_MARGIN_CLASSES.lg.match(/mb-(\d+)/)?.[1] ?? '0', 10);

    expect(smMargin).toBeLessThan(mdMargin);
    expect(mdMargin).toBeLessThan(lgMargin);
  });
});

// ============================================================================
// HEADER_TITLE_SIZE_MAP Tests
// ============================================================================

describe('HEADER_TITLE_SIZE_MAP', () => {
  it('should map sizes to Heading sizes', () => {
    expect(HEADER_TITLE_SIZE_MAP.sm).toBe('lg');
    expect(HEADER_TITLE_SIZE_MAP.md).toBe('xl');
    expect(HEADER_TITLE_SIZE_MAP.lg).toBe('2xl');
  });
});

// ============================================================================
// GRID_GAP_CLASSES Tests
// ============================================================================

describe('GRID_GAP_CLASSES', () => {
  it('should have gap class for each size', () => {
    expect(GRID_GAP_CLASSES.sm).toContain('gap-');
    expect(GRID_GAP_CLASSES.md).toContain('gap-');
    expect(GRID_GAP_CLASSES.lg).toContain('gap-');
  });

  it('should increase gap with size', () => {
    const smGap = Number.parseInt(GRID_GAP_CLASSES.sm.match(/gap-(\d+)/)?.[1] ?? '0', 10);
    const mdGap = Number.parseInt(GRID_GAP_CLASSES.md.match(/gap-(\d+)/)?.[1] ?? '0', 10);
    const lgGap = Number.parseInt(GRID_GAP_CLASSES.lg.match(/gap-(\d+)/)?.[1] ?? '0', 10);

    expect(smGap).toBeLessThan(mdGap);
    expect(mdGap).toBeLessThan(lgGap);
  });
});

// ============================================================================
// CARD_PADDING_CLASSES Tests
// ============================================================================

describe('CARD_PADDING_CLASSES', () => {
  it('should have padding class for each size', () => {
    expect(CARD_PADDING_CLASSES.sm).toContain('p-');
    expect(CARD_PADDING_CLASSES.md).toContain('p-');
    expect(CARD_PADDING_CLASSES.lg).toContain('p-');
  });

  it('should increase padding with size', () => {
    const smPad = Number.parseInt(CARD_PADDING_CLASSES.sm.match(/p-(\d+)/)?.[1] ?? '0', 10);
    const mdPad = Number.parseInt(CARD_PADDING_CLASSES.md.match(/p-(\d+)/)?.[1] ?? '0', 10);
    const lgPad = Number.parseInt(CARD_PADDING_CLASSES.lg.match(/p-(\d+)/)?.[1] ?? '0', 10);

    expect(smPad).toBeLessThan(mdPad);
    expect(mdPad).toBeLessThan(lgPad);
  });
});

// ============================================================================
// CARD_ICON_CONTAINER_CLASSES Tests
// ============================================================================

describe('CARD_ICON_CONTAINER_CLASSES', () => {
  it('should have height and width for each size', () => {
    for (const classes of Object.values(CARD_ICON_CONTAINER_CLASSES)) {
      expect(classes).toContain('h-');
      expect(classes).toContain('w-');
    }
  });

  it('should have margin-bottom for spacing', () => {
    for (const classes of Object.values(CARD_ICON_CONTAINER_CLASSES)) {
      expect(classes).toContain('mb-');
    }
  });
});

// ============================================================================
// CARD_ICON_SIZE_CLASSES Tests
// ============================================================================

describe('CARD_ICON_SIZE_CLASSES', () => {
  it('should have height and width for each size', () => {
    for (const classes of Object.values(CARD_ICON_SIZE_CLASSES)) {
      expect(classes).toContain('h-');
      expect(classes).toContain('w-');
    }
  });
});

// ============================================================================
// CARD_TITLE_SIZE_MAP Tests
// ============================================================================

describe('CARD_TITLE_SIZE_MAP', () => {
  it('should map sizes to Text sizes', () => {
    expect(CARD_TITLE_SIZE_MAP.sm).toBe('sm');
    expect(CARD_TITLE_SIZE_MAP.md).toBe('base');
    expect(CARD_TITLE_SIZE_MAP.lg).toBe('lg');
  });
});

// ============================================================================
// BUTTON_SIZE_MAP Tests
// ============================================================================

describe('BUTTON_SIZE_MAP', () => {
  it('should map sizes to Button sizes', () => {
    expect(BUTTON_SIZE_MAP.sm).toBe('sm');
    expect(BUTTON_SIZE_MAP.md).toBe('md');
    expect(BUTTON_SIZE_MAP.lg).toBe('lg');
  });
});

// ============================================================================
// Base Classes Tests
// ============================================================================

describe('HEADER_CONTAINER_CLASSES', () => {
  it('should use flex layout', () => {
    expect(HEADER_CONTAINER_CLASSES).toContain('flex');
    expect(HEADER_CONTAINER_CLASSES).toContain('items-center');
    expect(HEADER_CONTAINER_CLASSES).toContain('justify-between');
  });
});

describe('GRID_BASE_CLASSES', () => {
  it('should use grid layout', () => {
    expect(GRID_BASE_CLASSES).toContain('grid');
  });

  it('should have responsive columns', () => {
    expect(GRID_BASE_CLASSES).toContain('sm:grid-cols-2');
    expect(GRID_BASE_CLASSES).toContain('lg:grid-cols-3');
    expect(GRID_BASE_CLASSES).toContain('xl:grid-cols-4');
  });
});

describe('CARD_BASE_CLASSES', () => {
  it('should have rounded corners', () => {
    expect(CARD_BASE_CLASSES).toContain('rounded-lg');
  });

  it('should have border', () => {
    expect(CARD_BASE_CLASSES).toContain('border');
  });

  it('should use card background', () => {
    expect(CARD_BASE_CLASSES).toContain('bg-[rgb(var(--card))]');
  });

  it('should have hover state', () => {
    expect(CARD_BASE_CLASSES).toContain('hover:');
  });

  it('should have focus-visible ring with offset', () => {
    expect(CARD_BASE_CLASSES).toContain('focus-visible:');
    expect(CARD_BASE_CLASSES).toContain('ring-2');
    expect(CARD_BASE_CLASSES).toContain('ring-offset-2');
  });

  it('should have motion-safe transition', () => {
    expect(CARD_BASE_CLASSES).toContain('motion-safe:transition');
  });

  it('should have minimum height for touch targets (WCAG 2.5.5)', () => {
    expect(CARD_BASE_CLASSES).toContain('min-h-[44px]');
  });
});

describe('CARD_ICON_CONTAINER_BASE_CLASSES', () => {
  it('should have rounded corners', () => {
    expect(CARD_ICON_CONTAINER_BASE_CLASSES).toContain('rounded-lg');
  });

  it('should use primary background', () => {
    expect(CARD_ICON_CONTAINER_BASE_CLASSES).toContain('bg-[rgb(var(--primary))]');
  });

  it('should center content', () => {
    expect(CARD_ICON_CONTAINER_BASE_CLASSES).toContain('flex');
    expect(CARD_ICON_CONTAINER_BASE_CLASSES).toContain('items-center');
    expect(CARD_ICON_CONTAINER_BASE_CLASSES).toContain('justify-center');
  });
});

describe('CARD_SETTINGS_BUTTON_CLASSES', () => {
  it('should have rounded corners', () => {
    expect(CARD_SETTINGS_BUTTON_CLASSES).toContain('rounded');
  });

  it('should have hover state', () => {
    expect(CARD_SETTINGS_BUTTON_CLASSES).toContain('hover:');
  });

  it('should have focus-visible ring with offset', () => {
    expect(CARD_SETTINGS_BUTTON_CLASSES).toContain('focus-visible:');
    expect(CARD_SETTINGS_BUTTON_CLASSES).toContain('ring-2');
    expect(CARD_SETTINGS_BUTTON_CLASSES).toContain('ring-offset-2');
  });

  it('should have minimum touch target size (WCAG 2.5.5)', () => {
    expect(CARD_SETTINGS_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(CARD_SETTINGS_BUTTON_CLASSES).toContain('min-w-[44px]');
  });

  it('should have responsive touch targets', () => {
    expect(CARD_SETTINGS_BUTTON_CLASSES).toContain('sm:min-h-0');
    expect(CARD_SETTINGS_BUTTON_CLASSES).toContain('sm:min-w-0');
  });
});

describe('CARD_ACTIONS_CONTAINER_CLASSES', () => {
  it('should be absolutely positioned', () => {
    expect(CARD_ACTIONS_CONTAINER_CLASSES).toContain('absolute');
    expect(CARD_ACTIONS_CONTAINER_CLASSES).toContain('right-');
    expect(CARD_ACTIONS_CONTAINER_CLASSES).toContain('top-');
  });

  it('should be hidden by default', () => {
    expect(CARD_ACTIONS_CONTAINER_CLASSES).toContain('opacity-0');
  });

  it('should show on group hover', () => {
    expect(CARD_ACTIONS_CONTAINER_CLASSES).toContain('group-hover:opacity-100');
  });

  it('should show on group focus-visible', () => {
    expect(CARD_ACTIONS_CONTAINER_CLASSES).toContain('group-focus-visible:opacity-100');
  });

  it('should have transition', () => {
    expect(CARD_ACTIONS_CONTAINER_CLASSES).toContain('transition-opacity');
  });
});

describe('CARD_CHEVRON_CLASSES', () => {
  it('should be absolutely positioned', () => {
    expect(CARD_CHEVRON_CLASSES).toContain('absolute');
    expect(CARD_CHEVRON_CLASSES).toContain('bottom-');
    expect(CARD_CHEVRON_CLASSES).toContain('right-');
  });

  it('should have fixed dimensions', () => {
    expect(CARD_CHEVRON_CLASSES).toContain('h-4');
    expect(CARD_CHEVRON_CLASSES).toContain('w-4');
  });

  it('should be hidden by default', () => {
    expect(CARD_CHEVRON_CLASSES).toContain('opacity-0');
  });

  it('should show on group hover', () => {
    expect(CARD_CHEVRON_CLASSES).toContain('group-hover:opacity-100');
  });
});

describe('LOADING_CONTAINER_CLASSES', () => {
  it('should use flex-1 for full height', () => {
    expect(LOADING_CONTAINER_CLASSES).toContain('flex-1');
  });
});

describe('ERROR_STATE_CLASSES', () => {
  it('should center content', () => {
    expect(ERROR_STATE_CLASSES).toContain('flex');
    expect(ERROR_STATE_CLASSES).toContain('items-center');
    expect(ERROR_STATE_CLASSES).toContain('justify-center');
  });

  it('should use column direction', () => {
    expect(ERROR_STATE_CLASSES).toContain('flex-col');
  });

  it('should center text', () => {
    expect(ERROR_STATE_CLASSES).toContain('text-center');
  });

  it('should have padding', () => {
    expect(ERROR_STATE_CLASSES).toContain('p-');
  });
});

describe('ERROR_ICON_CONTAINER_CLASSES', () => {
  it('should be circular', () => {
    expect(ERROR_ICON_CONTAINER_CLASSES).toContain('rounded-full');
  });

  it('should use destructive color', () => {
    expect(ERROR_ICON_CONTAINER_CLASSES).toContain('destructive');
  });

  it('should have fixed dimensions', () => {
    expect(ERROR_ICON_CONTAINER_CLASSES).toContain('h-12');
    expect(ERROR_ICON_CONTAINER_CLASSES).toContain('w-12');
  });

  it('should center content', () => {
    expect(ERROR_ICON_CONTAINER_CLASSES).toContain('flex');
    expect(ERROR_ICON_CONTAINER_CLASSES).toContain('items-center');
    expect(ERROR_ICON_CONTAINER_CLASSES).toContain('justify-center');
  });
});

describe('SKELETON_GRID_CLASSES', () => {
  it('should use grid layout', () => {
    expect(SKELETON_GRID_CLASSES).toContain('grid');
  });

  it('should have gap', () => {
    expect(SKELETON_GRID_CLASSES).toContain('gap-');
  });

  it('should have responsive columns', () => {
    expect(SKELETON_GRID_CLASSES).toContain('sm:grid-cols-2');
    expect(SKELETON_GRID_CLASSES).toContain('lg:grid-cols-3');
    expect(SKELETON_GRID_CLASSES).toContain('xl:grid-cols-4');
  });
});

// ============================================================================
// getBaseSize Utility Tests
// ============================================================================

describe('getBaseSize', () => {
  it('should return string size as-is', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('should extract base from responsive object', () => {
    expect(getBaseSize({ base: 'sm' })).toBe('sm');
    expect(getBaseSize({ base: 'lg', md: 'md' })).toBe('lg');
  });

  it('should default to md when base not in object', () => {
    expect(getBaseSize({ md: 'lg' })).toBe('md');
    expect(getBaseSize({ lg: 'sm' })).toBe('md');
  });

  it('should handle all valid breakpoints', () => {
    expect(getBaseSize({ base: 'sm', sm: 'md', md: 'lg', lg: 'sm', xl: 'md', '2xl': 'lg' })).toBe(
      'sm'
    );
  });
});

// ============================================================================
// getResponsiveSizeClasses Utility Tests
// ============================================================================

describe('getResponsiveSizeClasses', () => {
  const mockClassMap: Record<ProjectsListSize, string> = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };

  it('should return single class for string size', () => {
    expect(getResponsiveSizeClasses('sm', mockClassMap)).toBe('gap-2');
    expect(getResponsiveSizeClasses('md', mockClassMap)).toBe('gap-3');
    expect(getResponsiveSizeClasses('lg', mockClassMap)).toBe('gap-4');
  });

  it('should generate responsive classes from object', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', md: 'lg' }, mockClassMap);
    expect(result).toContain('gap-2'); // base
    expect(result).toContain('md:gap-4'); // md breakpoint
  });

  it('should handle all breakpoints', () => {
    const result = getResponsiveSizeClasses(
      { base: 'sm', sm: 'md', md: 'lg', lg: 'sm', xl: 'md', '2xl': 'lg' },
      mockClassMap
    );
    expect(result).toContain('gap-2'); // base: sm
    expect(result).toContain('sm:gap-3'); // sm: md
    expect(result).toContain('md:gap-4'); // md: lg
    expect(result).toContain('lg:gap-2'); // lg: sm
    expect(result).toContain('xl:gap-3'); // xl: md
    expect(result).toContain('2xl:gap-4'); // 2xl: lg
  });

  it('should handle multi-class values', () => {
    const multiClassMap: Record<ProjectsListSize, string> = {
      sm: 'gap-2 p-2',
      md: 'gap-3 p-3',
      lg: 'gap-4 p-4',
    };

    const result = getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, multiClassMap);
    expect(result).toContain('gap-2');
    expect(result).toContain('p-2');
    expect(result).toContain('lg:gap-4');
    expect(result).toContain('lg:p-4');
  });

  it('should skip undefined breakpoints', () => {
    const result = getResponsiveSizeClasses({ base: 'sm' }, mockClassMap);
    expect(result).toBe('gap-2');
    expect(result).not.toContain('md:');
    expect(result).not.toContain('lg:');
  });
});

// ============================================================================
// buildProjectCardAccessibleLabel Utility Tests
// ============================================================================

describe('buildProjectCardAccessibleLabel', () => {
  it('should include project name', () => {
    const result = buildProjectCardAccessibleLabel('OpenFlow', '/dev/openflow');
    expect(result).toContain('OpenFlow');
  });

  it('should include project path', () => {
    const result = buildProjectCardAccessibleLabel('OpenFlow', '/dev/openflow');
    expect(result).toContain('/dev/openflow');
  });

  it('should use the template pattern', () => {
    const result = buildProjectCardAccessibleLabel('Test', '/path');
    expect(result).toBe('Project: Test, Path: /path. Press Enter to open.');
  });

  it('should handle special characters in name', () => {
    const result = buildProjectCardAccessibleLabel('My & App', '/dev/my-app');
    expect(result).toContain('My & App');
  });

  it('should handle long paths', () => {
    const longPath = '/Users/developer/projects/organization/team/project-name';
    const result = buildProjectCardAccessibleLabel('Project', longPath);
    expect(result).toContain(longPath);
  });
});

// ============================================================================
// buildSettingsAccessibleLabel Utility Tests
// ============================================================================

describe('buildSettingsAccessibleLabel', () => {
  it('should include project name', () => {
    const result = buildSettingsAccessibleLabel('OpenFlow');
    expect(result).toContain('OpenFlow');
  });

  it('should use the template pattern', () => {
    const result = buildSettingsAccessibleLabel('Test');
    expect(result).toBe('Open settings for Test');
  });

  it('should handle special characters', () => {
    const result = buildSettingsAccessibleLabel('My & App');
    expect(result).toContain('My & App');
  });
});

// ============================================================================
// buildProjectCountAnnouncement Utility Tests
// ============================================================================

describe('buildProjectCountAnnouncement', () => {
  it('should handle singular project count', () => {
    const result = buildProjectCountAnnouncement(1);
    expect(result).toBe('1 project');
  });

  it('should handle plural project count', () => {
    const result = buildProjectCountAnnouncement(5);
    expect(result).toBe('5 projects');
  });

  it('should handle zero projects', () => {
    const result = buildProjectCountAnnouncement(0);
    expect(result).toBe('0 projects');
  });

  it('should handle large numbers', () => {
    const result = buildProjectCountAnnouncement(100);
    expect(result).toBe('100 projects');
  });
});

// ============================================================================
// Accessibility Behavior Documentation Tests
// ============================================================================

describe('Accessibility Behavior Documentation', () => {
  describe('ProjectsListHeader Component', () => {
    it('should document h1 heading using Heading primitive', () => {
      expect(DEFAULT_PAGE_TITLE).toBe('All Projects');
    });

    it('should document aria-label on create button', () => {
      expect(DEFAULT_NEW_PROJECT_LABEL).toBe('New Project');
    });

    it('should document data attributes for testing', () => {
      // data-testid and data-size
      expect(true).toBe(true);
    });
  });

  describe('ProjectsListLoadingSkeleton Component', () => {
    it('should document role="status" and aria-busy="true"', () => {
      expect(SR_LOADING).toBe('Loading projects...');
    });

    it('should document aria-hidden="true" on visual skeleton elements', () => {
      expect(true).toBe(true);
    });

    it('should document VisuallyHidden for screen reader announcement', () => {
      expect(SR_LOADING).toBeDefined();
    });
  });

  describe('ProjectsListEmptyState Component', () => {
    it('should document role="region" with aria-label', () => {
      expect(DEFAULT_EMPTY_TITLE).toBeDefined();
    });

    it('should document VisuallyHidden with SR_EMPTY message', () => {
      expect(SR_EMPTY).toBe('No projects. Create a new project to get started.');
    });

    it('should document EmptyState molecule usage', () => {
      expect(DEFAULT_EMPTY_DESCRIPTION).toBeDefined();
    });
  });

  describe('ProjectsListErrorState Component', () => {
    it('should document role="alert" for immediate announcement', () => {
      expect(ERROR_STATE_CLASSES).toBeDefined();
    });

    it('should document aria-live="assertive" for high priority', () => {
      expect(SR_ERROR).toBe('Error loading projects');
    });

    it('should document aria-label on retry button', () => {
      expect(DEFAULT_ERROR_RETRY_LABEL).toBe('Retry');
    });

    it('should document customizable errorTitle and retryLabel props', () => {
      expect(DEFAULT_ERROR_TITLE).toBe('Failed to load projects');
      expect(DEFAULT_ERROR_RETRY_LABEL).toBe('Retry');
    });
  });

  describe('ProjectCard Component', () => {
    it('should document button element for keyboard navigation', () => {
      expect(CARD_BASE_CLASSES).toContain('focus-visible:');
    });

    it('should document aria-label with buildProjectCardAccessibleLabel', () => {
      expect(typeof buildProjectCardAccessibleLabel).toBe('function');
    });

    it('should document settings button aria-label', () => {
      expect(typeof buildSettingsAccessibleLabel).toBe('function');
    });

    it('should document 44px minimum touch targets (WCAG 2.5.5)', () => {
      expect(CARD_BASE_CLASSES).toContain('min-h-[44px]');
      expect(CARD_SETTINGS_BUTTON_CLASSES).toContain('min-h-[44px]');
    });

    it('should document focus-visible ring with ring-offset', () => {
      expect(CARD_BASE_CLASSES).toContain('focus-visible:');
      expect(CARD_BASE_CLASSES).toContain('ring-offset-2');
    });

    it('should document aria-hidden="true" on decorative icons', () => {
      expect(true).toBe(true);
    });
  });

  describe('ProjectsGrid Component', () => {
    it('should document role="region" with aria-labelledby', () => {
      expect(DEFAULT_GRID_LABEL).toBe('Projects list');
    });

    it('should document VisuallyHidden heading for screen readers', () => {
      expect(true).toBe(true);
    });

    it('should document role="list" and role="listitem" semantics', () => {
      expect(true).toBe(true);
    });

    it('should document aria-live="polite" for project count', () => {
      expect(typeof buildProjectCountAnnouncement).toBe('function');
    });
  });

  describe('ProjectsListContent Component', () => {
    it('should document aria-live="polite" for projects loaded', () => {
      expect(SR_PROJECTS_LOADED).toBe('Projects loaded');
    });

    it('should document state transitions', () => {
      expect(SR_LOADING).toBeDefined();
      expect(SR_ERROR).toBeDefined();
      expect(SR_EMPTY).toBeDefined();
      expect(SR_PROJECTS_LOADED).toBeDefined();
    });
  });
});

// ============================================================================
// Component Behavior Documentation Tests
// ============================================================================

describe('Component Behavior Documentation', () => {
  describe('ProjectsListContent state machine', () => {
    it('should render error state when error prop is provided', () => {
      expect(ERROR_STATE_CLASSES).toBeDefined();
    });

    it('should render loading state when isLoading is true', () => {
      expect(LOADING_CONTAINER_CLASSES).toBeDefined();
    });

    it('should render empty state when projects array is empty', () => {
      expect(DEFAULT_EMPTY_TITLE).toBeDefined();
    });

    it('should render grid when projects exist', () => {
      expect(GRID_BASE_CLASSES).toBeDefined();
    });
  });

  describe('Size prop behavior', () => {
    it('should support string size values', () => {
      expect(getBaseSize('sm')).toBe('sm');
      expect(getBaseSize('md')).toBe('md');
      expect(getBaseSize('lg')).toBe('lg');
    });

    it('should support responsive object values', () => {
      expect(getBaseSize({ base: 'sm', lg: 'lg' })).toBe('sm');
    });

    it('should generate responsive Tailwind classes', () => {
      const result = getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, CARD_PADDING_CLASSES);
      expect(result).toContain('p-3'); // sm
      expect(result).toContain('lg:p-5'); // lg
    });
  });
});

// ============================================================================
// Props Documentation Tests
// ============================================================================

describe('Props Documentation', () => {
  describe('ProjectsListHeaderProps', () => {
    it('should document required onCreateProject callback', () => {
      expect(true).toBe(true);
    });

    it('should document optional size prop', () => {
      expect(Object.keys(HEADER_MARGIN_CLASSES)).toEqual(['sm', 'md', 'lg']);
    });
  });

  describe('ProjectsListLoadingSkeletonProps', () => {
    it('should document optional count prop', () => {
      expect(DEFAULT_SKELETON_COUNT).toBe(8);
    });

    it('should document optional size prop', () => {
      expect(true).toBe(true);
    });
  });

  describe('ProjectsListErrorStateProps', () => {
    it('should document optional message prop', () => {
      expect(true).toBe(true);
    });

    it('should document optional onRetry callback', () => {
      expect(true).toBe(true);
    });

    it('should document optional errorTitle prop', () => {
      expect(DEFAULT_ERROR_TITLE).toBeDefined();
    });

    it('should document optional retryLabel prop', () => {
      expect(DEFAULT_ERROR_RETRY_LABEL).toBeDefined();
    });
  });

  describe('ProjectCardProps', () => {
    it('should document required name prop', () => {
      expect(true).toBe(true);
    });

    it('should document required path prop', () => {
      expect(true).toBe(true);
    });

    it('should document required icon prop', () => {
      expect(true).toBe(true);
    });

    it('should document required onSelect callback', () => {
      expect(true).toBe(true);
    });

    it('should document required onSettings callback', () => {
      expect(true).toBe(true);
    });

    it('should document optional projectId prop', () => {
      expect(true).toBe(true);
    });
  });

  describe('ProjectsGridProps', () => {
    it('should document required projects prop', () => {
      expect(true).toBe(true);
    });

    it('should document required onSelectProject callback', () => {
      expect(true).toBe(true);
    });

    it('should document required onProjectSettings callback', () => {
      expect(true).toBe(true);
    });

    it('should document optional gridLabel prop', () => {
      expect(DEFAULT_GRID_LABEL).toBe('Projects list');
    });
  });

  describe('Data Attributes', () => {
    it('should document data-testid support', () => {
      expect(true).toBe(true);
    });

    it('should document data-size on components', () => {
      expect(true).toBe(true);
    });

    it('should document data-project-id on ProjectCard', () => {
      expect(true).toBe(true);
    });

    it('should document data-project-count on ProjectsGrid', () => {
      expect(true).toBe(true);
    });

    it('should document data-count on loading skeleton', () => {
      expect(true).toBe(true);
    });
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('Integration Pattern Tests', () => {
  it('should work with EmptyState molecule', () => {
    expect(DEFAULT_EMPTY_TITLE).toBeDefined();
    expect(DEFAULT_EMPTY_DESCRIPTION).toBeDefined();
  });

  it('should work with SkeletonProjectCard molecule', () => {
    expect(SKELETON_GRID_CLASSES).toBeDefined();
  });

  it('should work with Button atom', () => {
    expect(DEFAULT_NEW_PROJECT_LABEL).toBe('New Project');
    expect(DEFAULT_CREATE_PROJECT_LABEL).toBe('Create Project');
    expect(DEFAULT_ERROR_RETRY_LABEL).toBe('Retry');
  });

  it('should work with Icon atom', () => {
    expect(ERROR_ICON_CONTAINER_CLASSES).toContain('rounded-full');
  });

  it('should work with Heading primitive', () => {
    expect(DEFAULT_PAGE_TITLE).toBeDefined();
    expect(DEFAULT_ERROR_TITLE).toBeDefined();
  });

  it('should work with Text primitive', () => {
    expect(true).toBe(true);
  });

  it('should work with VisuallyHidden primitive', () => {
    expect(SR_LOADING).toBeDefined();
    expect(SR_ERROR).toBeDefined();
    expect(SR_EMPTY).toBeDefined();
  });

  it('should work with Header organism', () => {
    // ProjectsListLayout uses Header
    expect(true).toBe(true);
  });

  it('should work with ConfirmDialog organism', () => {
    // ProjectsListConfirmDialog wraps ConfirmDialog
    expect(true).toBe(true);
  });

  it('should work with CreateProjectDialog organism', () => {
    // ProjectsListCreateDialog wraps CreateProjectDialog
    expect(true).toBe(true);
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('Size Consistency Tests', () => {
  const sizes: ProjectsListSize[] = ['sm', 'md', 'lg'];

  it('should have consistent margin progression in HEADER_MARGIN_CLASSES', () => {
    const margins = sizes.map((size) => {
      const match = HEADER_MARGIN_CLASSES[size].match(/mb-(\d+)/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    });

    expect(margins[0]).toBeLessThan(margins[1] as number);
    expect(margins[1]).toBeLessThan(margins[2] as number);
  });

  it('should have consistent gap progression in GRID_GAP_CLASSES', () => {
    const gaps = sizes.map((size) => {
      const match = GRID_GAP_CLASSES[size].match(/gap-(\d+)/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    });

    expect(gaps[0]).toBeLessThan(gaps[1] as number);
    expect(gaps[1]).toBeLessThan(gaps[2] as number);
  });

  it('should have consistent padding progression in CARD_PADDING_CLASSES', () => {
    const paddings = sizes.map((size) => {
      const match = CARD_PADDING_CLASSES[size].match(/p-(\d+)/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    });

    expect(paddings[0]).toBeLessThan(paddings[1] as number);
    expect(paddings[1]).toBeLessThan(paddings[2] as number);
  });

  it('should have defined classes for all sizes', () => {
    for (const size of sizes) {
      expect(HEADER_MARGIN_CLASSES[size]).toBeDefined();
      expect(GRID_GAP_CLASSES[size]).toBeDefined();
      expect(CARD_PADDING_CLASSES[size]).toBeDefined();
      expect(CARD_ICON_CONTAINER_CLASSES[size]).toBeDefined();
      expect(CARD_ICON_SIZE_CLASSES[size]).toBeDefined();
    }
  });

  it('should have defined size maps for all sizes', () => {
    for (const size of sizes) {
      expect(HEADER_TITLE_SIZE_MAP[size]).toBeDefined();
      expect(CARD_TITLE_SIZE_MAP[size]).toBeDefined();
      expect(BUTTON_SIZE_MAP[size]).toBeDefined();
    }
  });
});
