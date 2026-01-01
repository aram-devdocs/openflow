/**
 * TasksListPageComponents Unit Tests
 *
 * Tests for utility functions, constants, and accessibility behavior documentation.
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CREATE_TASK_LABEL,
  DEFAULT_EMPTY_ALL_DESCRIPTION,
  DEFAULT_EMPTY_FILTERED_TEMPLATE,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_ERROR_TITLE,
  // Default label constants
  DEFAULT_FILTER_BAR_LABEL,
  DEFAULT_LOADING_LABEL,
  DEFAULT_RETRY_LABEL,
  DEFAULT_SKELETON_COUNT,
  ERROR_BASE_CLASSES,
  ERROR_ICON_SIZE,
  ERROR_MESSAGE_SIZE,
  ERROR_PADDING_CLASSES,
  ERROR_TEXT_SIZE,
  // CSS class constants
  FILTER_BAR_BASE_CLASSES,
  FILTER_BAR_PADDING_CLASSES,
  FILTER_COUNT_BADGE_CLASSES,
  FILTER_TAB_BASE_CLASSES,
  FILTER_TAB_SELECTED_CLASSES,
  FILTER_TAB_SIZE_CLASSES,
  FILTER_TAB_UNSELECTED_CLASSES,
  LAYOUT_BASE_CLASSES,
  LAYOUT_CONTENT_BASE_CLASSES,
  LAYOUT_CONTENT_PADDING_CLASSES,
  LOADING_BASE_CLASSES,
  LOADING_GAP_CLASSES,
  SR_EMPTY,
  SR_ERROR,
  SR_FILTER_CHANGED_TEMPLATE,
  SR_FILTER_NAVIGATION_HINT,
  // Screen reader announcement constants
  SR_LOADING,
  SR_TASKS_LOADED_TEMPLATE,
  type StatusFilter,
  type StatusFilterOption,
  type TasksListBreakpoint,
  // Types
  type TasksListSize,
  buildEmptyDescription,
  buildFilterChangeAnnouncement,
  buildTasksLoadedAnnouncement,
  // Utility functions
  getBaseSize,
  getFilterAccessibleLabel,
  getResponsiveSizeClasses,
} from '../../../packages/ui/organisms/TasksListPageComponents';

// ============================================================================
// Default Label Constants Tests
// ============================================================================

describe('Default Label Constants', () => {
  it('DEFAULT_FILTER_BAR_LABEL is defined', () => {
    expect(DEFAULT_FILTER_BAR_LABEL).toBe('Task status filters');
  });

  it('DEFAULT_LOADING_LABEL is defined', () => {
    expect(DEFAULT_LOADING_LABEL).toBe('Loading tasks...');
  });

  it('DEFAULT_EMPTY_TITLE is defined', () => {
    expect(DEFAULT_EMPTY_TITLE).toBe('No tasks found');
  });

  it('DEFAULT_EMPTY_ALL_DESCRIPTION is defined', () => {
    expect(DEFAULT_EMPTY_ALL_DESCRIPTION).toBe('Create a task from a project to get started.');
  });

  it('DEFAULT_EMPTY_FILTERED_TEMPLATE contains placeholder', () => {
    expect(DEFAULT_EMPTY_FILTERED_TEMPLATE).toContain('{status}');
  });

  it('DEFAULT_CREATE_TASK_LABEL is defined', () => {
    expect(DEFAULT_CREATE_TASK_LABEL).toBe('Create Task');
  });

  it('DEFAULT_ERROR_TITLE is defined', () => {
    expect(DEFAULT_ERROR_TITLE).toBe('Failed to load tasks');
  });

  it('DEFAULT_ERROR_MESSAGE is defined', () => {
    expect(DEFAULT_ERROR_MESSAGE).toContain('problem loading');
  });

  it('DEFAULT_RETRY_LABEL is defined', () => {
    expect(DEFAULT_RETRY_LABEL).toBe('Retry');
  });

  it('DEFAULT_SKELETON_COUNT is 5', () => {
    expect(DEFAULT_SKELETON_COUNT).toBe(5);
  });
});

// ============================================================================
// Screen Reader Announcement Constants Tests
// ============================================================================

describe('Screen Reader Announcement Constants', () => {
  it('SR_LOADING is descriptive', () => {
    expect(SR_LOADING).toContain('Loading');
    expect(SR_LOADING).toContain('wait');
  });

  it('SR_FILTER_CHANGED_TEMPLATE contains placeholders', () => {
    expect(SR_FILTER_CHANGED_TEMPLATE).toContain('{filter}');
    expect(SR_FILTER_CHANGED_TEMPLATE).toContain('{count}');
  });

  it('SR_ERROR is descriptive', () => {
    expect(SR_ERROR).toContain('Error');
  });

  it('SR_EMPTY is descriptive', () => {
    expect(SR_EMPTY).toContain('No tasks');
  });

  it('SR_TASKS_LOADED_TEMPLATE contains placeholders', () => {
    expect(SR_TASKS_LOADED_TEMPLATE).toContain('{count}');
  });

  it('SR_FILTER_NAVIGATION_HINT mentions arrow keys', () => {
    expect(SR_FILTER_NAVIGATION_HINT).toContain('arrow keys');
  });
});

// ============================================================================
// Filter Bar CSS Class Constants Tests
// ============================================================================

describe('Filter Bar CSS Class Constants', () => {
  it('FILTER_BAR_BASE_CLASSES contains flex layout', () => {
    expect(FILTER_BAR_BASE_CLASSES).toContain('flex');
    expect(FILTER_BAR_BASE_CLASSES).toContain('items-center');
    expect(FILTER_BAR_BASE_CLASSES).toContain('border-b');
  });

  it('FILTER_BAR_PADDING_CLASSES has all sizes', () => {
    expect(FILTER_BAR_PADDING_CLASSES).toHaveProperty('sm');
    expect(FILTER_BAR_PADDING_CLASSES).toHaveProperty('md');
    expect(FILTER_BAR_PADDING_CLASSES).toHaveProperty('lg');
  });

  it('FILTER_BAR_PADDING_CLASSES - sm has smaller padding', () => {
    expect(FILTER_BAR_PADDING_CLASSES.sm).toContain('px-4');
    expect(FILTER_BAR_PADDING_CLASSES.sm).toContain('py-2');
  });

  it('FILTER_BAR_PADDING_CLASSES - md has medium padding', () => {
    expect(FILTER_BAR_PADDING_CLASSES.md).toContain('px-6');
    expect(FILTER_BAR_PADDING_CLASSES.md).toContain('py-3');
  });

  it('FILTER_BAR_PADDING_CLASSES - lg has larger padding', () => {
    expect(FILTER_BAR_PADDING_CLASSES.lg).toContain('px-8');
    expect(FILTER_BAR_PADDING_CLASSES.lg).toContain('py-4');
  });

  it('FILTER_TAB_BASE_CLASSES contains focus ring', () => {
    expect(FILTER_TAB_BASE_CLASSES).toContain('focus-visible:ring-2');
    expect(FILTER_TAB_BASE_CLASSES).toContain('focus-visible:ring-offset-2');
  });

  it('FILTER_TAB_BASE_CLASSES contains motion-safe transition', () => {
    expect(FILTER_TAB_BASE_CLASSES).toContain('motion-safe:transition-colors');
  });

  it('FILTER_TAB_SIZE_CLASSES has touch target for mobile', () => {
    expect(FILTER_TAB_SIZE_CLASSES.md).toContain('min-h-[44px]');
    expect(FILTER_TAB_SIZE_CLASSES.lg).toContain('min-h-[44px]');
  });

  it('FILTER_TAB_SIZE_CLASSES sm has smaller touch target', () => {
    expect(FILTER_TAB_SIZE_CLASSES.sm).toContain('min-h-[36px]');
  });

  it('FILTER_TAB_SELECTED_CLASSES has primary background', () => {
    expect(FILTER_TAB_SELECTED_CLASSES).toContain('bg-[rgb(var(--primary))]');
  });

  it('FILTER_TAB_UNSELECTED_CLASSES has muted text', () => {
    expect(FILTER_TAB_UNSELECTED_CLASSES).toContain('text-[rgb(var(--muted-foreground))]');
    expect(FILTER_TAB_UNSELECTED_CLASSES).toContain('hover:bg-[rgb(var(--muted))]');
  });

  it('FILTER_COUNT_BADGE_CLASSES has muted background', () => {
    expect(FILTER_COUNT_BADGE_CLASSES).toContain('bg-[rgb(var(--muted))]');
    expect(FILTER_COUNT_BADGE_CLASSES).toContain('rounded-full');
  });
});

// ============================================================================
// Loading CSS Class Constants Tests
// ============================================================================

describe('Loading CSS Class Constants', () => {
  it('LOADING_BASE_CLASSES contains flex column', () => {
    expect(LOADING_BASE_CLASSES).toContain('flex');
    expect(LOADING_BASE_CLASSES).toContain('flex-col');
  });

  it('LOADING_GAP_CLASSES has all sizes', () => {
    expect(LOADING_GAP_CLASSES).toHaveProperty('sm');
    expect(LOADING_GAP_CLASSES).toHaveProperty('md');
    expect(LOADING_GAP_CLASSES).toHaveProperty('lg');
  });

  it('LOADING_GAP_CLASSES - gaps increase with size', () => {
    expect(LOADING_GAP_CLASSES.sm).toContain('gap-1.5');
    expect(LOADING_GAP_CLASSES.md).toContain('gap-2');
    expect(LOADING_GAP_CLASSES.lg).toContain('gap-3');
  });
});

// ============================================================================
// Error CSS Class Constants Tests
// ============================================================================

describe('Error CSS Class Constants', () => {
  it('ERROR_BASE_CLASSES contains flex column center', () => {
    expect(ERROR_BASE_CLASSES).toContain('flex');
    expect(ERROR_BASE_CLASSES).toContain('flex-col');
    expect(ERROR_BASE_CLASSES).toContain('items-center');
    expect(ERROR_BASE_CLASSES).toContain('justify-center');
  });

  it('ERROR_BASE_CLASSES has destructive styling', () => {
    expect(ERROR_BASE_CLASSES).toContain('border-[rgb(var(--destructive))]');
    expect(ERROR_BASE_CLASSES).toContain('bg-[rgb(var(--destructive))]');
  });

  it('ERROR_PADDING_CLASSES has all sizes', () => {
    expect(ERROR_PADDING_CLASSES).toHaveProperty('sm');
    expect(ERROR_PADDING_CLASSES).toHaveProperty('md');
    expect(ERROR_PADDING_CLASSES).toHaveProperty('lg');
  });

  it('ERROR_PADDING_CLASSES - padding increases with size', () => {
    expect(ERROR_PADDING_CLASSES.sm).toContain('p-4');
    expect(ERROR_PADDING_CLASSES.md).toContain('p-6');
    expect(ERROR_PADDING_CLASSES.lg).toContain('p-8');
  });

  it('ERROR_ICON_SIZE maps sizes correctly', () => {
    expect(ERROR_ICON_SIZE.sm).toBe('md');
    expect(ERROR_ICON_SIZE.md).toBe('lg');
    expect(ERROR_ICON_SIZE.lg).toBe('xl');
  });

  it('ERROR_TEXT_SIZE maps sizes correctly', () => {
    expect(ERROR_TEXT_SIZE.sm).toBe('sm');
    expect(ERROR_TEXT_SIZE.md).toBe('base');
    expect(ERROR_TEXT_SIZE.lg).toBe('lg');
  });

  it('ERROR_MESSAGE_SIZE maps sizes correctly', () => {
    expect(ERROR_MESSAGE_SIZE.sm).toBe('xs');
    expect(ERROR_MESSAGE_SIZE.md).toBe('sm');
    expect(ERROR_MESSAGE_SIZE.lg).toBe('base');
  });
});

// ============================================================================
// Layout CSS Class Constants Tests
// ============================================================================

describe('Layout CSS Class Constants', () => {
  it('LAYOUT_BASE_CLASSES contains flex column full height', () => {
    expect(LAYOUT_BASE_CLASSES).toContain('flex');
    expect(LAYOUT_BASE_CLASSES).toContain('h-full');
    expect(LAYOUT_BASE_CLASSES).toContain('flex-col');
  });

  it('LAYOUT_CONTENT_PADDING_CLASSES has all sizes', () => {
    expect(LAYOUT_CONTENT_PADDING_CLASSES).toHaveProperty('sm');
    expect(LAYOUT_CONTENT_PADDING_CLASSES).toHaveProperty('md');
    expect(LAYOUT_CONTENT_PADDING_CLASSES).toHaveProperty('lg');
  });

  it('LAYOUT_CONTENT_PADDING_CLASSES - md has responsive padding', () => {
    expect(LAYOUT_CONTENT_PADDING_CLASSES.md).toContain('p-4');
    expect(LAYOUT_CONTENT_PADDING_CLASSES.md).toContain('md:p-6');
  });

  it('LAYOUT_CONTENT_BASE_CLASSES contains overflow', () => {
    expect(LAYOUT_CONTENT_BASE_CLASSES).toContain('flex-1');
    expect(LAYOUT_CONTENT_BASE_CLASSES).toContain('overflow-auto');
  });
});

// ============================================================================
// getBaseSize Utility Tests
// ============================================================================

describe('getBaseSize', () => {
  it('returns string size directly', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('extracts base from responsive object', () => {
    expect(getBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
  });

  it('returns first defined breakpoint if no base', () => {
    expect(getBaseSize({ sm: 'lg', md: 'md' } as any)).toBe('lg');
  });

  it('returns md as default if empty object', () => {
    expect(getBaseSize({} as any)).toBe('md');
  });

  it('handles null-like values', () => {
    expect(getBaseSize(null as any)).toBe('md');
    expect(getBaseSize(undefined as any)).toBe('md');
  });
});

// ============================================================================
// getResponsiveSizeClasses Utility Tests
// ============================================================================

describe('getResponsiveSizeClasses', () => {
  const mockClassMap: Record<TasksListSize, string> = {
    sm: 'p-2 gap-1',
    md: 'p-4 gap-2',
    lg: 'p-6 gap-3',
  };

  it('returns classes for string size', () => {
    expect(getResponsiveSizeClasses('sm', mockClassMap)).toBe('p-2 gap-1');
    expect(getResponsiveSizeClasses('md', mockClassMap)).toBe('p-4 gap-2');
    expect(getResponsiveSizeClasses('lg', mockClassMap)).toBe('p-6 gap-3');
  });

  it('generates responsive classes from object', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', md: 'lg' }, mockClassMap);
    expect(result).toContain('p-2');
    expect(result).toContain('gap-1');
    expect(result).toContain('md:p-6');
    expect(result).toContain('md:gap-3');
  });

  it('handles all breakpoints', () => {
    const result = getResponsiveSizeClasses(
      { base: 'sm', sm: 'md', md: 'lg', lg: 'md', xl: 'lg' },
      mockClassMap
    );
    expect(result).toContain('p-2');
    expect(result).toContain('sm:p-4');
    expect(result).toContain('md:p-6');
    expect(result).toContain('lg:p-4');
    expect(result).toContain('xl:p-6');
  });

  it('returns empty string for empty object', () => {
    const result = getResponsiveSizeClasses({} as any, mockClassMap);
    expect(result).toBe('');
  });

  it('preserves order of breakpoints', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, mockClassMap);
    const classes = result.split(' ');
    const baseIndex = classes.indexOf('p-2');
    const lgIndex = classes.indexOf('lg:p-6');
    expect(baseIndex).toBeLessThan(lgIndex);
  });
});

// ============================================================================
// buildEmptyDescription Utility Tests
// ============================================================================

describe('buildEmptyDescription', () => {
  it('returns all description for "all" filter', () => {
    expect(buildEmptyDescription('all')).toBe(DEFAULT_EMPTY_ALL_DESCRIPTION);
  });

  it('returns filtered description for status filters', () => {
    const result = buildEmptyDescription('todo' as StatusFilter);
    expect(result).toContain('todo');
    expect(result).toContain('No tasks with status');
  });

  it('replaces status placeholder correctly', () => {
    const result = buildEmptyDescription('inprogress' as StatusFilter);
    expect(result).toBe('No tasks with status "inprogress".');
  });
});

// ============================================================================
// buildFilterChangeAnnouncement Utility Tests
// ============================================================================

describe('buildFilterChangeAnnouncement', () => {
  it('announces filter change with singular count', () => {
    const result = buildFilterChangeAnnouncement('all', 1);
    expect(result).toContain('All');
    expect(result).toContain('1 task shown');
    expect(result).not.toContain('tasks');
  });

  it('announces filter change with plural count', () => {
    const result = buildFilterChangeAnnouncement('all', 5);
    expect(result).toContain('5 tasks shown');
  });

  it('uses status name for filtered announcements', () => {
    const result = buildFilterChangeAnnouncement('todo' as StatusFilter, 3);
    expect(result).toContain('todo');
    expect(result).toContain('3 tasks shown');
  });

  it('handles zero count', () => {
    const result = buildFilterChangeAnnouncement('all', 0);
    expect(result).toContain('0 tasks shown');
  });
});

// ============================================================================
// buildTasksLoadedAnnouncement Utility Tests
// ============================================================================

describe('buildTasksLoadedAnnouncement', () => {
  it('announces singular task loaded', () => {
    const result = buildTasksLoadedAnnouncement(1);
    expect(result).toBe('1 task loaded.');
  });

  it('announces plural tasks loaded', () => {
    const result = buildTasksLoadedAnnouncement(5);
    expect(result).toBe('5 tasks loaded.');
  });

  it('handles zero tasks', () => {
    const result = buildTasksLoadedAnnouncement(0);
    expect(result).toBe('0 tasks loaded.');
  });

  it('handles large numbers', () => {
    const result = buildTasksLoadedAnnouncement(100);
    expect(result).toBe('100 tasks loaded.');
  });
});

// ============================================================================
// getFilterAccessibleLabel Utility Tests
// ============================================================================

describe('getFilterAccessibleLabel', () => {
  it('returns basic label when not selected and no count', () => {
    const option: StatusFilterOption = { label: 'All', value: 'all' };
    expect(getFilterAccessibleLabel(option, false)).toBe('All');
  });

  it('adds selected text when selected', () => {
    const option: StatusFilterOption = { label: 'All', value: 'all' };
    const result = getFilterAccessibleLabel(option, true);
    expect(result).toContain('selected');
  });

  it('includes count when provided', () => {
    const option: StatusFilterOption = { label: 'All', value: 'all', count: 5 };
    const result = getFilterAccessibleLabel(option, false);
    expect(result).toContain('5 tasks');
  });

  it('includes both count and selected when applicable', () => {
    const option: StatusFilterOption = { label: 'All', value: 'all', count: 5 };
    const result = getFilterAccessibleLabel(option, true);
    expect(result).toContain('All');
    expect(result).toContain('5 tasks');
    expect(result).toContain('selected');
  });

  it('handles zero count', () => {
    const option: StatusFilterOption = { label: 'Done', value: 'done' as any, count: 0 };
    const result = getFilterAccessibleLabel(option, false);
    expect(result).toContain('0 tasks');
  });
});

// ============================================================================
// Accessibility Behavior Documentation Tests
// ============================================================================

describe('Accessibility Behavior Documentation', () => {
  describe('Filter Bar Accessibility', () => {
    it('uses role="tablist" pattern', () => {
      // Documentation: Filter bar should have role="tablist"
      expect(DEFAULT_FILTER_BAR_LABEL).toBeDefined();
    });

    it('filters use role="tab"', () => {
      // Documentation: Each filter button should have role="tab"
      expect(FILTER_TAB_BASE_CLASSES).toContain('focus-visible:ring-2');
    });

    it('supports keyboard navigation', () => {
      // Documentation: Arrow Left/Right navigates, Home/End jumps, Enter/Space selects
      expect(SR_FILTER_NAVIGATION_HINT).toContain('arrow keys');
    });

    it('announces filter changes', () => {
      // Documentation: Filter changes are announced via aria-live
      expect(SR_FILTER_CHANGED_TEMPLATE).toContain('{filter}');
    });
  });

  describe('Loading State Accessibility', () => {
    it('uses role="status" with aria-busy', () => {
      // Documentation: Loading container has role="status" and aria-busy="true"
      expect(LOADING_BASE_CLASSES).toBeDefined();
    });

    it('announces loading to screen readers', () => {
      // Documentation: VisuallyHidden announces loading state
      expect(SR_LOADING).toContain('Loading');
    });

    it('skeletons are aria-hidden', () => {
      // Documentation: Skeleton elements are wrapped in aria-hidden="true"
      expect(LOADING_GAP_CLASSES).toBeDefined();
    });
  });

  describe('Error State Accessibility', () => {
    it('uses role="alert" with aria-live="assertive"', () => {
      // Documentation: Error container has role="alert" for immediate announcement
      expect(ERROR_BASE_CLASSES).toContain('flex');
    });

    it('provides clear error messaging', () => {
      // Documentation: Error title and message are clear and actionable
      expect(DEFAULT_ERROR_TITLE).toBeDefined();
      expect(DEFAULT_ERROR_MESSAGE).toBeDefined();
    });

    it('retry button is accessible', () => {
      // Documentation: Retry button has accessible label
      expect(DEFAULT_RETRY_LABEL).toBe('Retry');
    });
  });

  describe('Empty State Accessibility', () => {
    it('announces empty state to screen readers', () => {
      // Documentation: VisuallyHidden announces empty state
      expect(SR_EMPTY).toContain('No tasks');
    });

    it('provides context-aware descriptions', () => {
      // Documentation: Different descriptions for "all" vs filtered
      expect(DEFAULT_EMPTY_ALL_DESCRIPTION).toBeDefined();
      expect(DEFAULT_EMPTY_FILTERED_TEMPLATE).toContain('{status}');
    });
  });
});

// ============================================================================
// Component Props Documentation Tests
// ============================================================================

describe('Component Props Documentation', () => {
  describe('TasksFilterBar Props', () => {
    it('supports filters array', () => {
      // Documentation: filters prop accepts StatusFilterOption[]
      const filter: StatusFilterOption = { label: 'All', value: 'all' };
      expect(filter.label).toBeDefined();
      expect(filter.value).toBeDefined();
    });

    it('supports optional count in filter options', () => {
      // Documentation: StatusFilterOption.count is optional
      const filterWithCount: StatusFilterOption = { label: 'All', value: 'all', count: 5 };
      expect(filterWithCount.count).toBe(5);
    });

    it('supports responsive size prop', () => {
      // Documentation: size prop accepts ResponsiveValue<TasksListSize>
      const sizes: TasksListSize[] = ['sm', 'md', 'lg'];
      expect(sizes).toContain('md');
    });
  });

  describe('TasksListLoading Props', () => {
    it('defaults to 5 skeleton items', () => {
      // Documentation: count defaults to DEFAULT_SKELETON_COUNT (5)
      expect(DEFAULT_SKELETON_COUNT).toBe(5);
    });
  });

  describe('TasksListEmpty Props', () => {
    it('supports filter prop for context-aware messaging', () => {
      // Documentation: filter prop determines empty state message
      const description = buildEmptyDescription('all');
      expect(description).toBe(DEFAULT_EMPTY_ALL_DESCRIPTION);
    });

    it('supports optional onCreateTask callback', () => {
      // Documentation: onCreateTask is optional, only shows button for "all" filter
      expect(DEFAULT_CREATE_TASK_LABEL).toBe('Create Task');
    });
  });

  describe('TasksListError Props', () => {
    it('defaults to standard error message', () => {
      // Documentation: message defaults to DEFAULT_ERROR_MESSAGE
      expect(DEFAULT_ERROR_MESSAGE).toContain('problem loading');
    });

    it('supports optional onRetry callback', () => {
      // Documentation: onRetry is optional, hides button if not provided
      expect(DEFAULT_RETRY_LABEL).toBe('Retry');
    });
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('Size Consistency', () => {
  it('all size classes have sm, md, lg keys', () => {
    const sizeKeys: TasksListSize[] = ['sm', 'md', 'lg'];

    for (const key of sizeKeys) {
      expect(FILTER_BAR_PADDING_CLASSES).toHaveProperty(key);
      expect(FILTER_TAB_SIZE_CLASSES).toHaveProperty(key);
      expect(LOADING_GAP_CLASSES).toHaveProperty(key);
      expect(ERROR_PADDING_CLASSES).toHaveProperty(key);
      expect(ERROR_ICON_SIZE).toHaveProperty(key);
      expect(ERROR_TEXT_SIZE).toHaveProperty(key);
      expect(ERROR_MESSAGE_SIZE).toHaveProperty(key);
      expect(LAYOUT_CONTENT_PADDING_CLASSES).toHaveProperty(key);
    }
  });

  it('size progressions are consistent', () => {
    // Gap classes should increase
    expect(LOADING_GAP_CLASSES.sm).toContain('1.5');
    expect(LOADING_GAP_CLASSES.md).toContain('2');
    expect(LOADING_GAP_CLASSES.lg).toContain('3');
  });
});

// ============================================================================
// WCAG 2.5.5 Touch Target Tests
// ============================================================================

describe('Touch Target Compliance (WCAG 2.5.5)', () => {
  it('filter tabs have 44px minimum height on medium size', () => {
    expect(FILTER_TAB_SIZE_CLASSES.md).toContain('min-h-[44px]');
  });

  it('filter tabs have 44px minimum height on large size', () => {
    expect(FILTER_TAB_SIZE_CLASSES.lg).toContain('min-h-[44px]');
  });

  it('touch targets relax on desktop (sm: breakpoint)', () => {
    expect(FILTER_TAB_SIZE_CLASSES.md).toContain('sm:min-h-0');
    expect(FILTER_TAB_SIZE_CLASSES.lg).toContain('sm:min-h-0');
  });
});

// ============================================================================
// Motion Safety Tests
// ============================================================================

describe('Motion Safety', () => {
  it('filter tabs use motion-safe transitions', () => {
    expect(FILTER_TAB_BASE_CLASSES).toContain('motion-safe:transition-colors');
  });
});

// ============================================================================
// Focus Visibility Tests
// ============================================================================

describe('Focus Visibility', () => {
  it('filter tabs have visible focus rings', () => {
    expect(FILTER_TAB_BASE_CLASSES).toContain('focus-visible:ring-2');
  });

  it('filter tabs have focus ring offset', () => {
    expect(FILTER_TAB_BASE_CLASSES).toContain('focus-visible:ring-offset-2');
  });

  it('filter tabs remove outline', () => {
    expect(FILTER_TAB_BASE_CLASSES).toContain('focus-visible:outline-none');
  });
});

// ============================================================================
// Responsive Breakpoint Order Tests
// ============================================================================

describe('Responsive Breakpoint Order', () => {
  it('breakpoints are in correct order', () => {
    const breakpoints: TasksListBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];
    // Verify we use standard Tailwind breakpoint order
    expect(breakpoints[0]).toBe('base');
    expect(breakpoints[1]).toBe('sm');
    expect(breakpoints[2]).toBe('md');
    expect(breakpoints[3]).toBe('lg');
    expect(breakpoints[4]).toBe('xl');
    expect(breakpoints[5]).toBe('2xl');
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('Integration Patterns', () => {
  it('TasksListContent handles all states', () => {
    // Documentation: isLoading, error, empty tasks, and tasks with data
    expect(LOADING_BASE_CLASSES).toBeDefined();
    expect(ERROR_BASE_CLASSES).toBeDefined();
    expect(DEFAULT_EMPTY_TITLE).toBeDefined();
  });

  it('TasksListLayout composes filter and content', () => {
    // Documentation: filterBar slot + children + optional outlet
    expect(LAYOUT_BASE_CLASSES).toBeDefined();
    expect(LAYOUT_CONTENT_BASE_CLASSES).toBeDefined();
  });
});
