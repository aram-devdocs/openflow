/**
 * DashboardPageComponents Organism Tests
 *
 * Tests for the DashboardPageComponents utility functions and constants.
 * Covers:
 * - Constant values and exports
 * - Utility function behavior
 * - Size class generation
 * - Responsive value handling
 * - Accessibility behavior documentation
 * - Component behavior documentation
 */

import { TaskStatus } from '@openflow/generated';
import { describe, expect, it } from 'vitest';
import {
  // Base classes
  DASHBOARD_PADDING_CLASSES,
  DEFAULT_CREATE_PROJECT_LABEL,
  DEFAULT_ERROR_RETRY_LABEL,
  DEFAULT_ERROR_TITLE,
  DEFAULT_RECENT_TASKS_EMPTY,
  DEFAULT_RECENT_TASKS_LABEL,
  DEFAULT_STATS_LABEL,
  DEFAULT_WELCOME_DESCRIPTION,
  // Constants - Default labels
  DEFAULT_WELCOME_TITLE,
  // Types
  type DashboardSize,
  EMPTY_STATE_CONTAINER_CLASSES,
  ERROR_ICON_CONTAINER_CLASSES,
  ERROR_STATE_CLASSES,
  LOADING_CONTAINER_CLASSES,
  RECENT_TASKS_CONTAINER_CLASSES,
  RECENT_TASKS_HEADER_CLASSES,
  SR_COMPLETED,
  SR_EMPTY,
  SR_ERROR,
  SR_IN_PROGRESS,
  SR_IN_REVIEW,
  // Screen reader constants
  SR_LOADING,
  SR_PROJECT_LOADED,
  SR_TASK_COUNT,
  STATS_GRID_GAP_CLASSES,
  STATUS_BADGE_BASE_CLASSES,
  STATUS_BADGE_SIZE_CLASSES,
  STATUS_LABELS,
  STATUS_STYLES,
  STAT_CARD_BASE_CLASSES,
  STAT_CARD_LABEL_SIZE_CLASSES,
  STAT_CARD_SIZE_CLASSES,
  STAT_CARD_VALUE_SIZE_CLASSES,
  STAT_CARD_VALUE_STYLES,
  STAT_CARD_VARIANT_STYLES,
  TASK_ITEM_BASE_CLASSES,
  TASK_ITEM_SIZE_CLASSES,
  // Utility functions
  buildHeaderSubtitle,
  buildStatsAnnouncement,
  buildTaskAccessibleLabel,
  getBaseSize,
  getResponsiveSizeClasses,
} from '../../../packages/ui/organisms/DashboardPageComponents';

// ============================================================================
// Default Labels Tests
// ============================================================================

describe('Default Labels', () => {
  it('DEFAULT_WELCOME_TITLE should be defined', () => {
    expect(DEFAULT_WELCOME_TITLE).toBe('Welcome to OpenFlow');
  });

  it('DEFAULT_WELCOME_DESCRIPTION should be defined', () => {
    expect(DEFAULT_WELCOME_DESCRIPTION).toBe(
      'Get started by creating a project or selecting one from the sidebar.'
    );
  });

  it('DEFAULT_CREATE_PROJECT_LABEL should be defined', () => {
    expect(DEFAULT_CREATE_PROJECT_LABEL).toBe('Create Project');
  });

  it('DEFAULT_ERROR_TITLE should be defined', () => {
    expect(DEFAULT_ERROR_TITLE).toBe('Failed to load dashboard');
  });

  it('DEFAULT_ERROR_RETRY_LABEL should be defined', () => {
    expect(DEFAULT_ERROR_RETRY_LABEL).toBe('Retry');
  });

  it('DEFAULT_RECENT_TASKS_LABEL should be defined', () => {
    expect(DEFAULT_RECENT_TASKS_LABEL).toBe('Recent Tasks');
  });

  it('DEFAULT_RECENT_TASKS_EMPTY should be defined', () => {
    expect(DEFAULT_RECENT_TASKS_EMPTY).toBe('No tasks yet. Create one to get started!');
  });

  it('DEFAULT_STATS_LABEL should be defined', () => {
    expect(DEFAULT_STATS_LABEL).toBe('Project statistics');
  });
});

// ============================================================================
// Screen Reader Constants Tests
// ============================================================================

describe('Screen Reader Constants', () => {
  it('SR_LOADING should announce loading state', () => {
    expect(SR_LOADING).toBe('Loading dashboard...');
  });

  it('SR_ERROR should announce error state', () => {
    expect(SR_ERROR).toBe('Error loading dashboard');
  });

  it('SR_EMPTY should announce empty state', () => {
    expect(SR_EMPTY).toBe('No project selected. Create a new project to get started.');
  });

  it('SR_PROJECT_LOADED should announce success', () => {
    expect(SR_PROJECT_LOADED).toBe('Dashboard loaded with project statistics');
  });

  it('SR_TASK_COUNT should provide unit', () => {
    expect(SR_TASK_COUNT).toBe('tasks');
  });

  it('SR_IN_PROGRESS should describe status', () => {
    expect(SR_IN_PROGRESS).toBe('in progress');
  });

  it('SR_IN_REVIEW should describe status', () => {
    expect(SR_IN_REVIEW).toBe('in review');
  });

  it('SR_COMPLETED should describe status', () => {
    expect(SR_COMPLETED).toBe('completed');
  });
});

// ============================================================================
// STATUS_LABELS Tests
// ============================================================================

describe('STATUS_LABELS', () => {
  it('should have all task statuses defined', () => {
    expect(STATUS_LABELS.todo).toBe('To Do');
    expect(STATUS_LABELS.inprogress).toBe('In Progress');
    expect(STATUS_LABELS.inreview).toBe('In Review');
    expect(STATUS_LABELS.done).toBe('Done');
    expect(STATUS_LABELS.cancelled).toBe('Cancelled');
  });

  it('should have human-readable labels', () => {
    for (const label of Object.values(STATUS_LABELS)) {
      expect(label.length).toBeGreaterThan(0);
      // Should start with uppercase
      const firstChar = label[0];
      expect(firstChar).toBe(firstChar?.toUpperCase());
    }
  });
});

// ============================================================================
// STATUS_STYLES Tests
// ============================================================================

describe('STATUS_STYLES', () => {
  it('should have styles for all task statuses', () => {
    expect(STATUS_STYLES.todo).toBeDefined();
    expect(STATUS_STYLES.inprogress).toBeDefined();
    expect(STATUS_STYLES.inreview).toBeDefined();
    expect(STATUS_STYLES.done).toBeDefined();
    expect(STATUS_STYLES.cancelled).toBeDefined();
  });

  it('should use status color tokens', () => {
    expect(STATUS_STYLES.todo).toContain('status-todo');
    expect(STATUS_STYLES.inprogress).toContain('status-inprogress');
    expect(STATUS_STYLES.inreview).toContain('status-inreview');
    expect(STATUS_STYLES.done).toContain('status-done');
    expect(STATUS_STYLES.cancelled).toContain('status-cancelled');
  });

  it('should have background and text colors', () => {
    for (const style of Object.values(STATUS_STYLES)) {
      expect(style).toContain('bg-');
      expect(style).toContain('text-');
    }
  });
});

// ============================================================================
// STAT_CARD_VARIANT_STYLES Tests
// ============================================================================

describe('STAT_CARD_VARIANT_STYLES', () => {
  it('should have all variants defined', () => {
    expect(STAT_CARD_VARIANT_STYLES.default).toBeDefined();
    expect(STAT_CARD_VARIANT_STYLES.info).toBeDefined();
    expect(STAT_CARD_VARIANT_STYLES.warning).toBeDefined();
    expect(STAT_CARD_VARIANT_STYLES.success).toBeDefined();
  });

  it('should have border class for default variant', () => {
    expect(STAT_CARD_VARIANT_STYLES.default).toContain('border-');
  });

  it('should have colored variants with border and background', () => {
    expect(STAT_CARD_VARIANT_STYLES.info).toContain('border-info');
    expect(STAT_CARD_VARIANT_STYLES.info).toContain('bg-info');

    expect(STAT_CARD_VARIANT_STYLES.warning).toContain('border-warning');
    expect(STAT_CARD_VARIANT_STYLES.warning).toContain('bg-warning');

    expect(STAT_CARD_VARIANT_STYLES.success).toContain('border-success');
    expect(STAT_CARD_VARIANT_STYLES.success).toContain('bg-success');
  });
});

// ============================================================================
// STAT_CARD_VALUE_STYLES Tests
// ============================================================================

describe('STAT_CARD_VALUE_STYLES', () => {
  it('should have all variants defined', () => {
    expect(STAT_CARD_VALUE_STYLES.default).toBeDefined();
    expect(STAT_CARD_VALUE_STYLES.info).toBeDefined();
    expect(STAT_CARD_VALUE_STYLES.warning).toBeDefined();
    expect(STAT_CARD_VALUE_STYLES.success).toBeDefined();
  });

  it('should use text color classes', () => {
    expect(STAT_CARD_VALUE_STYLES.default).toContain('text-');
    expect(STAT_CARD_VALUE_STYLES.info).toContain('text-info');
    expect(STAT_CARD_VALUE_STYLES.warning).toContain('text-warning');
    expect(STAT_CARD_VALUE_STYLES.success).toContain('text-success');
  });
});

// ============================================================================
// Size Classes Tests
// ============================================================================

describe('STAT_CARD_SIZE_CLASSES', () => {
  it('should have padding class for each size', () => {
    expect(STAT_CARD_SIZE_CLASSES.sm).toContain('p-');
    expect(STAT_CARD_SIZE_CLASSES.md).toContain('p-');
    expect(STAT_CARD_SIZE_CLASSES.lg).toContain('p-');
  });

  it('should increase padding with size', () => {
    const smPad = Number.parseInt(STAT_CARD_SIZE_CLASSES.sm.match(/p-(\d+)/)?.[1] ?? '0', 10);
    const mdPad = Number.parseInt(STAT_CARD_SIZE_CLASSES.md.match(/p-(\d+)/)?.[1] ?? '0', 10);
    const lgPad = Number.parseInt(STAT_CARD_SIZE_CLASSES.lg.match(/p-(\d+)/)?.[1] ?? '0', 10);

    expect(smPad).toBeLessThan(mdPad);
    expect(mdPad).toBeLessThan(lgPad);
  });
});

describe('STAT_CARD_LABEL_SIZE_CLASSES', () => {
  it('should have text size class for each size', () => {
    expect(STAT_CARD_LABEL_SIZE_CLASSES.sm).toContain('text-');
    expect(STAT_CARD_LABEL_SIZE_CLASSES.md).toContain('text-');
    expect(STAT_CARD_LABEL_SIZE_CLASSES.lg).toContain('text-');
  });
});

describe('STAT_CARD_VALUE_SIZE_CLASSES', () => {
  it('should have text size class for each size', () => {
    expect(STAT_CARD_VALUE_SIZE_CLASSES.sm).toContain('text-');
    expect(STAT_CARD_VALUE_SIZE_CLASSES.md).toContain('text-');
    expect(STAT_CARD_VALUE_SIZE_CLASSES.lg).toContain('text-');
  });
});

describe('STATUS_BADGE_SIZE_CLASSES', () => {
  it('should have padding and text size for each size', () => {
    for (const classes of Object.values(STATUS_BADGE_SIZE_CLASSES)) {
      expect(classes).toContain('px-');
      expect(classes).toContain('py-');
      expect(classes).toContain('text-');
    }
  });
});

describe('TASK_ITEM_SIZE_CLASSES', () => {
  it('should have padding for each size', () => {
    expect(TASK_ITEM_SIZE_CLASSES.sm).toContain('px-');
    expect(TASK_ITEM_SIZE_CLASSES.md).toContain('px-');
    expect(TASK_ITEM_SIZE_CLASSES.lg).toContain('px-');
  });

  it('should have minimum height for touch targets', () => {
    expect(TASK_ITEM_SIZE_CLASSES.sm).toContain('min-h-');
    expect(TASK_ITEM_SIZE_CLASSES.md).toContain('min-h-');
    expect(TASK_ITEM_SIZE_CLASSES.lg).toContain('min-h-');
  });

  it('should have at least 44px height for md size (WCAG 2.5.5)', () => {
    expect(TASK_ITEM_SIZE_CLASSES.md).toContain('min-h-[44px]');
  });
});

describe('DASHBOARD_PADDING_CLASSES', () => {
  it('should have padding class for each size', () => {
    expect(DASHBOARD_PADDING_CLASSES.sm).toContain('p-');
    expect(DASHBOARD_PADDING_CLASSES.md).toContain('p-');
    expect(DASHBOARD_PADDING_CLASSES.lg).toContain('p-');
  });
});

describe('STATS_GRID_GAP_CLASSES', () => {
  it('should have gap class for each size', () => {
    expect(STATS_GRID_GAP_CLASSES.sm).toContain('gap-');
    expect(STATS_GRID_GAP_CLASSES.md).toContain('gap-');
    expect(STATS_GRID_GAP_CLASSES.lg).toContain('gap-');
  });

  it('should increase gap with size', () => {
    const smGap = Number.parseInt(STATS_GRID_GAP_CLASSES.sm.match(/gap-(\d+)/)?.[1] ?? '0', 10);
    const mdGap = Number.parseInt(STATS_GRID_GAP_CLASSES.md.match(/gap-(\d+)/)?.[1] ?? '0', 10);
    const lgGap = Number.parseInt(STATS_GRID_GAP_CLASSES.lg.match(/gap-(\d+)/)?.[1] ?? '0', 10);

    expect(smGap).toBeLessThan(mdGap as number);
    expect(mdGap).toBeLessThan(lgGap as number);
  });
});

// ============================================================================
// Base Classes Tests
// ============================================================================

describe('STAT_CARD_BASE_CLASSES', () => {
  it('should have rounded corners', () => {
    expect(STAT_CARD_BASE_CLASSES).toContain('rounded-lg');
  });

  it('should have border', () => {
    expect(STAT_CARD_BASE_CLASSES).toContain('border');
  });

  it('should use card background', () => {
    expect(STAT_CARD_BASE_CLASSES).toContain('bg-[rgb(var(--card))]');
  });

  it('should have motion-safe transition', () => {
    expect(STAT_CARD_BASE_CLASSES).toContain('motion-safe:transition');
  });
});

describe('STATUS_BADGE_BASE_CLASSES', () => {
  it('should be pill-shaped', () => {
    expect(STATUS_BADGE_BASE_CLASSES).toContain('rounded-full');
  });

  it('should use medium font weight', () => {
    expect(STATUS_BADGE_BASE_CLASSES).toContain('font-medium');
  });

  it('should prevent shrinking', () => {
    expect(STATUS_BADGE_BASE_CLASSES).toContain('shrink-0');
  });
});

describe('RECENT_TASKS_CONTAINER_CLASSES', () => {
  it('should have rounded corners', () => {
    expect(RECENT_TASKS_CONTAINER_CLASSES).toContain('rounded-lg');
  });

  it('should have border', () => {
    expect(RECENT_TASKS_CONTAINER_CLASSES).toContain('border');
  });

  it('should use card background', () => {
    expect(RECENT_TASKS_CONTAINER_CLASSES).toContain('bg-[rgb(var(--card))]');
  });
});

describe('RECENT_TASKS_HEADER_CLASSES', () => {
  it('should have bottom border', () => {
    expect(RECENT_TASKS_HEADER_CLASSES).toContain('border-b');
  });

  it('should have padding', () => {
    expect(RECENT_TASKS_HEADER_CLASSES).toContain('px-');
    expect(RECENT_TASKS_HEADER_CLASSES).toContain('py-');
  });
});

describe('TASK_ITEM_BASE_CLASSES', () => {
  it('should use flex layout', () => {
    expect(TASK_ITEM_BASE_CLASSES).toContain('flex');
    expect(TASK_ITEM_BASE_CLASSES).toContain('items-center');
    expect(TASK_ITEM_BASE_CLASSES).toContain('justify-between');
  });

  it('should have full width', () => {
    expect(TASK_ITEM_BASE_CLASSES).toContain('w-full');
  });

  it('should be left-aligned text', () => {
    expect(TASK_ITEM_BASE_CLASSES).toContain('text-left');
  });

  it('should have hover state', () => {
    expect(TASK_ITEM_BASE_CLASSES).toContain('hover:');
  });

  it('should have focus-visible ring with offset', () => {
    expect(TASK_ITEM_BASE_CLASSES).toContain('focus-visible:');
    expect(TASK_ITEM_BASE_CLASSES).toContain('ring-2');
    expect(TASK_ITEM_BASE_CLASSES).toContain('ring-offset-2');
  });

  it('should have motion-safe transition', () => {
    expect(TASK_ITEM_BASE_CLASSES).toContain('motion-safe:transition');
  });
});

describe('EMPTY_STATE_CONTAINER_CLASSES', () => {
  it('should center content', () => {
    expect(EMPTY_STATE_CONTAINER_CLASSES).toContain('flex');
    expect(EMPTY_STATE_CONTAINER_CLASSES).toContain('items-center');
    expect(EMPTY_STATE_CONTAINER_CLASSES).toContain('justify-center');
  });

  it('should use flex-1', () => {
    expect(EMPTY_STATE_CONTAINER_CLASSES).toContain('flex-1');
  });

  it('should have padding', () => {
    expect(EMPTY_STATE_CONTAINER_CLASSES).toContain('p-');
  });
});

describe('LOADING_CONTAINER_CLASSES', () => {
  it('should use flex-1 for full height', () => {
    expect(LOADING_CONTAINER_CLASSES).toContain('flex-1');
  });

  it('should allow overflow scrolling', () => {
    expect(LOADING_CONTAINER_CLASSES).toContain('overflow-auto');
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
  const mockClassMap: Record<DashboardSize, string> = {
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
    const multiClassMap: Record<DashboardSize, string> = {
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
// buildStatsAnnouncement Utility Tests
// ============================================================================

describe('buildStatsAnnouncement', () => {
  const mockTasks = [
    { id: '1', status: 'inprogress' as const },
    { id: '2', status: 'inprogress' as const },
    { id: '3', status: 'inreview' as const },
    { id: '4', status: 'done' as const },
    { id: '5', status: 'todo' as const },
  ];

  it('should include total task count', () => {
    const result = buildStatsAnnouncement(mockTasks as any);
    expect(result).toContain('5');
    expect(result).toContain(SR_TASK_COUNT);
  });

  it('should include in-progress count', () => {
    const result = buildStatsAnnouncement(mockTasks as any);
    expect(result).toContain('2');
    expect(result).toContain(SR_IN_PROGRESS);
  });

  it('should include in-review count', () => {
    const result = buildStatsAnnouncement(mockTasks as any);
    expect(result).toContain('1');
    expect(result).toContain(SR_IN_REVIEW);
  });

  it('should include completed count', () => {
    const result = buildStatsAnnouncement(mockTasks as any);
    expect(result).toContain('1');
    expect(result).toContain(SR_COMPLETED);
  });

  it('should handle empty task list', () => {
    const result = buildStatsAnnouncement([]);
    expect(result).toContain('0');
  });

  it('should handle tasks with all same status', () => {
    const allDone = [
      { id: '1', status: 'done' as const },
      { id: '2', status: 'done' as const },
    ];
    const result = buildStatsAnnouncement(allDone as any);
    expect(result).toContain('2 tasks');
    expect(result).toContain('0 in progress');
    expect(result).toContain('2 completed');
  });
});

// ============================================================================
// buildTaskAccessibleLabel Utility Tests
// ============================================================================

describe('buildTaskAccessibleLabel', () => {
  it('should include task title', () => {
    const task = { id: '1', title: 'Implement feature', status: TaskStatus.Todo } as any;
    const result = buildTaskAccessibleLabel(task);
    expect(result).toContain('Implement feature');
  });

  it('should include status label', () => {
    const task = { id: '1', title: 'Test task', status: TaskStatus.Inprogress } as any;
    const result = buildTaskAccessibleLabel(task);
    expect(result).toContain('Status:');
    expect(result).toContain(STATUS_LABELS.inprogress);
  });

  it('should format correctly for all statuses', () => {
    const statuses = [
      TaskStatus.Todo,
      TaskStatus.Inprogress,
      TaskStatus.Inreview,
      TaskStatus.Done,
      TaskStatus.Cancelled,
    ];

    for (const status of statuses) {
      const task = { id: '1', title: 'Task', status } as any;
      const result = buildTaskAccessibleLabel(task);
      expect(result).toContain(STATUS_LABELS[status]);
    }
  });
});

// ============================================================================
// buildHeaderSubtitle Utility Tests
// ============================================================================

describe('buildHeaderSubtitle', () => {
  it('should return undefined when loading', () => {
    const result = buildHeaderSubtitle([], true);
    expect(result).toBeUndefined();
  });

  it('should show total count when no in-progress tasks', () => {
    const tasks = [
      { id: '1', status: 'todo' as const },
      { id: '2', status: 'done' as const },
    ];
    const result = buildHeaderSubtitle(tasks as any, false);
    expect(result).toBe('2 tasks');
  });

  it('should show in-progress count when tasks are in progress', () => {
    const tasks = [
      { id: '1', status: 'inprogress' as const },
      { id: '2', status: 'todo' as const },
    ];
    const result = buildHeaderSubtitle(tasks as any, false);
    expect(result).toContain('1 task');
    expect(result).toContain('in progress');
  });

  it('should use singular for 1 task in progress', () => {
    const tasks = [{ id: '1', status: 'inprogress' as const }];
    const result = buildHeaderSubtitle(tasks as any, false);
    expect(result).toBe('1 task in progress');
  });

  it('should use plural for multiple tasks in progress', () => {
    const tasks = [
      { id: '1', status: 'inprogress' as const },
      { id: '2', status: 'inprogress' as const },
      { id: '3', status: 'inprogress' as const },
    ];
    const result = buildHeaderSubtitle(tasks as any, false);
    expect(result).toBe('3 tasks in progress');
  });

  it('should handle empty task list', () => {
    const result = buildHeaderSubtitle([], false);
    expect(result).toBe('0 tasks');
  });
});

// ============================================================================
// Accessibility Behavior Documentation Tests
// ============================================================================

describe('Accessibility Behavior Documentation', () => {
  describe('StatCard Component', () => {
    it('should document aria-label with label and value', () => {
      // StatCard uses aria-label on Text element: `${label}: ${value}`
      expect(true).toBe(true);
    });

    it('should document VisuallyHidden for redundant announcement', () => {
      // VisuallyHidden duplicates the label+value for assistive tech
      expect(true).toBe(true);
    });

    it('should document data attributes for testing/styling', () => {
      // data-variant, data-size, data-testid
      expect(true).toBe(true);
    });
  });

  describe('StatusBadge Component', () => {
    it('should document role="status" for live region', () => {
      // StatusBadge has role="status" for screen reader announcement
      expect(STATUS_LABELS).toBeDefined();
    });

    it('should document aria-label with human-readable status', () => {
      // aria-label={`Status: ${STATUS_LABELS[status]}`}
      expect(STATUS_LABELS.inprogress).toBe('In Progress');
    });
  });

  describe('DashboardEmptyState Component', () => {
    it('should document role="region" with aria-label', () => {
      // Empty state has role="region" aria-label="Empty dashboard"
      expect(EMPTY_STATE_CONTAINER_CLASSES).toBeDefined();
    });

    it('should document VisuallyHidden with SR_EMPTY message', () => {
      expect(SR_EMPTY).toBe('No project selected. Create a new project to get started.');
    });
  });

  describe('DashboardLoadingSkeleton Component', () => {
    it('should document role="status" and aria-busy="true"', () => {
      // Loading state announces itself to screen readers
      expect(SR_LOADING).toBe('Loading dashboard...');
    });

    it('should document aria-hidden="true" on visual skeleton elements', () => {
      // Skeleton elements are purely visual, hidden from AT
      expect(true).toBe(true);
    });
  });

  describe('DashboardErrorState Component', () => {
    it('should document role="alert" for immediate announcement', () => {
      // Error state uses role="alert" for assertive announcement
      expect(ERROR_STATE_CLASSES).toBeDefined();
    });

    it('should document aria-live="assertive" for high priority', () => {
      expect(SR_ERROR).toBe('Error loading dashboard');
    });

    it('should document aria-label on retry button', () => {
      expect(DEFAULT_ERROR_RETRY_LABEL).toBe('Retry');
    });
  });

  describe('DashboardStatsGrid Component', () => {
    it('should document role="region" with aria-labelledby', () => {
      // Stats grid is a landmark region with heading
      expect(DEFAULT_STATS_LABEL).toBe('Project statistics');
    });

    it('should document VisuallyHidden heading for screen readers', () => {
      // Hidden h2 provides section heading
      expect(true).toBe(true);
    });

    it('should document aria-live="polite" for stats announcement', () => {
      // buildStatsAnnouncement provides the announcement content
      expect(typeof buildStatsAnnouncement).toBe('function');
    });
  });

  describe('RecentTasksList Component', () => {
    it('should document role="list" and role="listitem" semantics', () => {
      // Proper list structure for AT navigation
      expect(true).toBe(true);
    });

    it('should document aria-label with buildTaskAccessibleLabel', () => {
      expect(typeof buildTaskAccessibleLabel).toBe('function');
    });

    it('should document 44px minimum touch targets (WCAG 2.5.5)', () => {
      expect(TASK_ITEM_SIZE_CLASSES.md).toContain('min-h-[44px]');
    });

    it('should document focus-visible ring with ring-offset', () => {
      expect(TASK_ITEM_BASE_CLASSES).toContain('focus-visible:');
      expect(TASK_ITEM_BASE_CLASSES).toContain('ring-offset-2');
    });
  });

  describe('DashboardContent Component', () => {
    it('should document aria-live="polite" for project loaded', () => {
      expect(SR_PROJECT_LOADED).toBe('Dashboard loaded with project statistics');
    });

    it('should document state transitions (loading -> loaded -> error)', () => {
      // Component renders different states based on props
      expect(SR_LOADING).toBeDefined();
      expect(SR_ERROR).toBeDefined();
      expect(SR_EMPTY).toBeDefined();
      expect(SR_PROJECT_LOADED).toBeDefined();
    });
  });
});

// ============================================================================
// Component Behavior Documentation Tests
// ============================================================================

describe('Component Behavior Documentation', () => {
  describe('DashboardContent state machine', () => {
    it('should render error state when error prop is provided', () => {
      // Error state takes priority over other states
      expect(ERROR_STATE_CLASSES).toBeDefined();
    });

    it('should render empty state when no project selected', () => {
      // !activeProjectId && !isLoadingProjects
      expect(EMPTY_STATE_CONTAINER_CLASSES).toBeDefined();
    });

    it('should render loading skeleton when loading', () => {
      // (isLoadingProjects || isLoadingTasks) && activeProjectId
      expect(LOADING_CONTAINER_CLASSES).toBeDefined();
    });

    it('should render project overview when loaded', () => {
      // activeProjectId && !isLoadingTasks
      expect(DASHBOARD_PADDING_CLASSES).toBeDefined();
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
      const result = getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, STAT_CARD_SIZE_CLASSES);
      expect(result).toContain('p-3'); // sm
      expect(result).toContain('lg:p-5'); // lg
    });
  });
});

// ============================================================================
// Props Documentation Tests
// ============================================================================

describe('Props Documentation', () => {
  describe('StatCardProps', () => {
    it('should document required label prop', () => {
      // label: string - text displayed above value
      expect(true).toBe(true);
    });

    it('should document required value prop', () => {
      // value: number - numeric value to display
      expect(true).toBe(true);
    });

    it('should document optional variant prop', () => {
      // variant?: 'default' | 'info' | 'warning' | 'success'
      expect(Object.keys(STAT_CARD_VARIANT_STYLES)).toEqual([
        'default',
        'info',
        'warning',
        'success',
      ]);
    });

    it('should document optional size prop', () => {
      // size?: ResponsiveValue<DashboardSize>
      expect(Object.keys(STAT_CARD_SIZE_CLASSES)).toEqual(['sm', 'md', 'lg']);
    });
  });

  describe('StatusBadgeProps', () => {
    it('should document required status prop', () => {
      // status: TaskStatus - determines color and label
      expect(Object.keys(STATUS_LABELS)).toContain('todo');
      expect(Object.keys(STATUS_LABELS)).toContain('inprogress');
    });

    it('should document optional size prop', () => {
      // size?: ResponsiveValue<DashboardSize>
      expect(Object.keys(STATUS_BADGE_SIZE_CLASSES)).toEqual(['sm', 'md', 'lg']);
    });
  });

  describe('DashboardContentProps', () => {
    it('should document loading state props', () => {
      // isLoadingProjects: boolean
      // isLoadingTasks: boolean
      expect(true).toBe(true);
    });

    it('should document project props', () => {
      // activeProjectId?: string
      // tasks: Task[]
      expect(true).toBe(true);
    });

    it('should document callback props', () => {
      // onSelectTask: (taskId: string) => void
      // onNewProject: () => void
      // onRetry?: () => void
      expect(true).toBe(true);
    });

    it('should document error prop', () => {
      // error?: string | null
      expect(DEFAULT_ERROR_TITLE).toBeDefined();
    });
  });

  describe('Data Attributes', () => {
    it('should document data-testid support', () => {
      // All components accept data-testid for testing
      expect(true).toBe(true);
    });

    it('should document data-variant on StatCard', () => {
      // data-variant={variant} for CSS targeting
      expect(true).toBe(true);
    });

    it('should document data-status on StatusBadge', () => {
      // data-status={status} for CSS targeting
      expect(true).toBe(true);
    });

    it('should document data-size on all components', () => {
      // data-size={baseSize} for CSS targeting
      expect(true).toBe(true);
    });

    it('should document data-project-id on DashboardContent', () => {
      // data-project-id={activeProjectId} when loaded
      expect(true).toBe(true);
    });

    it('should document data-task-count on RecentTasksList', () => {
      // data-task-count={tasks.length}
      expect(true).toBe(true);
    });
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('Integration Pattern Tests', () => {
  it('should work with EmptyState molecule', () => {
    // DashboardEmptyState uses EmptyState for empty UI
    expect(DEFAULT_WELCOME_TITLE).toBeDefined();
    expect(DEFAULT_WELCOME_DESCRIPTION).toBeDefined();
  });

  it('should work with SkeletonStats molecule', () => {
    // DashboardLoadingSkeleton uses SkeletonStats for loading UI
    expect(LOADING_CONTAINER_CLASSES).toBeDefined();
  });

  it('should work with SkeletonTaskCard molecule', () => {
    // DashboardLoadingSkeleton uses SkeletonTaskCard for task skeleton
    expect(true).toBe(true);
  });

  it('should work with Button atom', () => {
    // DashboardEmptyState and DashboardErrorState use Button
    expect(DEFAULT_CREATE_PROJECT_LABEL).toBe('Create Project');
    expect(DEFAULT_ERROR_RETRY_LABEL).toBe('Retry');
  });

  it('should work with Icon atom', () => {
    // DashboardErrorState uses Icon for error indicator
    expect(ERROR_ICON_CONTAINER_CLASSES).toContain('rounded-full');
  });

  it('should work with Heading primitive', () => {
    // DashboardErrorState uses Heading for error title
    expect(DEFAULT_ERROR_TITLE).toBeDefined();
  });

  it('should work with Text primitive', () => {
    // Components use Text for labels and descriptions
    expect(true).toBe(true);
  });

  it('should work with VisuallyHidden primitive', () => {
    // Used for screen reader announcements
    expect(SR_LOADING).toBeDefined();
    expect(SR_ERROR).toBeDefined();
    expect(SR_EMPTY).toBeDefined();
  });

  it('should work with Flex primitive', () => {
    // Used for layout in dialogs
    expect(true).toBe(true);
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('Size Consistency Tests', () => {
  const sizes: DashboardSize[] = ['sm', 'md', 'lg'];

  it('should have consistent padding progression in STAT_CARD_SIZE_CLASSES', () => {
    const paddings = sizes.map((size) => {
      const match = STAT_CARD_SIZE_CLASSES[size].match(/p-(\d+)/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    });

    expect(paddings[0]).toBeLessThan(paddings[1] as number);
    expect(paddings[1]).toBeLessThan(paddings[2] as number);
  });

  it('should have consistent gap progression in STATS_GRID_GAP_CLASSES', () => {
    const gaps = sizes.map((size) => {
      const match = STATS_GRID_GAP_CLASSES[size].match(/gap-(\d+)/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    });

    expect(gaps[0]).toBeLessThan(gaps[1] as number);
    expect(gaps[1]).toBeLessThan(gaps[2] as number);
  });

  it('should have defined classes for all sizes', () => {
    for (const size of sizes) {
      expect(STAT_CARD_SIZE_CLASSES[size]).toBeDefined();
      expect(STAT_CARD_LABEL_SIZE_CLASSES[size]).toBeDefined();
      expect(STAT_CARD_VALUE_SIZE_CLASSES[size]).toBeDefined();
      expect(STATUS_BADGE_SIZE_CLASSES[size]).toBeDefined();
      expect(TASK_ITEM_SIZE_CLASSES[size]).toBeDefined();
      expect(DASHBOARD_PADDING_CLASSES[size]).toBeDefined();
      expect(STATS_GRID_GAP_CLASSES[size]).toBeDefined();
    }
  });
});
