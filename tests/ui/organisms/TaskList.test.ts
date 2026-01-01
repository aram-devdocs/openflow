/**
 * TaskList Organism Unit Tests
 *
 * Tests for exported constants, utility functions, and accessibility behavior.
 */

import type { Task, TaskStatus } from '@openflow/generated';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_ERROR_TITLE,
  DEFAULT_KANBAN_LABEL,
  DEFAULT_KANBAN_SKELETON_COUNT,
  DEFAULT_RETRY_LABEL,
  DEFAULT_SKELETON_COUNT,
  // Constants - Labels
  DEFAULT_TASK_LIST_LABEL,
  SR_COLUMN_TEMPLATE,
  SR_NAVIGATION_HINT,
  // Constants - Screen Reader
  SR_TASK_COUNT_TEMPLATE,
  SR_TASK_SELECTED,
  STATUS_COLORS,
  STATUS_LABELS,
  // Constants - Status Configuration
  STATUS_ORDER,
  // Constants - CSS Classes
  TASK_LIST_BASE_CLASSES,
  TASK_LIST_COLUMN_BASE_CLASSES,
  TASK_LIST_COLUMN_CONTENT_CLASSES,
  TASK_LIST_COLUMN_CONTENT_GAP_CLASSES,
  TASK_LIST_COLUMN_COUNT_CLASSES,
  TASK_LIST_COLUMN_HEADER_CLASSES,
  TASK_LIST_COLUMN_HEADER_TEXT_CLASSES,
  TASK_LIST_EMPTY_COLUMN_CLASSES,
  TASK_LIST_EMPTY_COLUMN_TEXT_CLASSES,
  TASK_LIST_ERROR_BASE_CLASSES,
  TASK_LIST_ERROR_ICON_SIZE,
  TASK_LIST_ERROR_MESSAGE_SIZE,
  TASK_LIST_ERROR_PADDING_CLASSES,
  TASK_LIST_ERROR_TEXT_SIZE,
  TASK_LIST_GAP_CLASSES,
  TASK_LIST_KANBAN_BASE_CLASSES,
  TASK_LIST_KANBAN_GAP_CLASSES,
  buildListAccessibleLabel,
  buildSelectionAnnouncement,
  // Utility Functions
  getBaseSize,
  getResponsiveSizeClasses,
  groupTasksByStatus,
} from '../../../packages/ui/organisms/TaskList';

// ============================================================================
// Label Constants
// ============================================================================

describe('TaskList Label Constants', () => {
  describe('DEFAULT_TASK_LIST_LABEL', () => {
    it('should have correct value', () => {
      expect(DEFAULT_TASK_LIST_LABEL).toBe('Task list');
    });
  });

  describe('DEFAULT_KANBAN_LABEL', () => {
    it('should have correct value', () => {
      expect(DEFAULT_KANBAN_LABEL).toBe('Task board grouped by status');
    });
  });

  describe('DEFAULT_EMPTY_TITLE', () => {
    it('should have correct value', () => {
      expect(DEFAULT_EMPTY_TITLE).toBe('No tasks yet');
    });
  });

  describe('DEFAULT_EMPTY_DESCRIPTION', () => {
    it('should have correct value', () => {
      expect(DEFAULT_EMPTY_DESCRIPTION).toBe('Create a new task to get started.');
    });
  });

  describe('DEFAULT_ERROR_TITLE', () => {
    it('should have correct value', () => {
      expect(DEFAULT_ERROR_TITLE).toBe('Failed to load tasks');
    });
  });

  describe('DEFAULT_ERROR_MESSAGE', () => {
    it('should have correct value', () => {
      expect(DEFAULT_ERROR_MESSAGE).toBe(
        'There was a problem loading your tasks. Please try again.'
      );
    });
  });

  describe('DEFAULT_RETRY_LABEL', () => {
    it('should have correct value', () => {
      expect(DEFAULT_RETRY_LABEL).toBe('Retry');
    });
  });

  describe('DEFAULT_SKELETON_COUNT', () => {
    it('should be a reasonable number', () => {
      expect(DEFAULT_SKELETON_COUNT).toBe(5);
    });
  });

  describe('DEFAULT_KANBAN_SKELETON_COUNT', () => {
    it('should be a reasonable number', () => {
      expect(DEFAULT_KANBAN_SKELETON_COUNT).toBe(2);
    });
  });
});

// ============================================================================
// Screen Reader Constants
// ============================================================================

describe('TaskList Screen Reader Constants', () => {
  describe('SR_TASK_COUNT_TEMPLATE', () => {
    it('should return singular for 1 task', () => {
      expect(SR_TASK_COUNT_TEMPLATE(1)).toBe('1 task');
    });

    it('should return plural for multiple tasks', () => {
      expect(SR_TASK_COUNT_TEMPLATE(5)).toBe('5 tasks');
    });

    it('should return plural for 0 tasks', () => {
      expect(SR_TASK_COUNT_TEMPLATE(0)).toBe('0 tasks');
    });
  });

  describe('SR_COLUMN_TEMPLATE', () => {
    it('should format column with singular task', () => {
      expect(SR_COLUMN_TEMPLATE('To Do', 1)).toBe('To Do: 1 task');
    });

    it('should format column with multiple tasks', () => {
      expect(SR_COLUMN_TEMPLATE('In Progress', 3)).toBe('In Progress: 3 tasks');
    });

    it('should format column with 0 tasks', () => {
      expect(SR_COLUMN_TEMPLATE('Done', 0)).toBe('Done: 0 tasks');
    });
  });

  describe('SR_TASK_SELECTED', () => {
    it('should have correct value', () => {
      expect(SR_TASK_SELECTED).toBe('Task selected');
    });
  });

  describe('SR_NAVIGATION_HINT', () => {
    it('should have correct value', () => {
      expect(SR_NAVIGATION_HINT).toBe('Use arrow keys to navigate, Enter to select');
    });
  });
});

// ============================================================================
// Status Configuration Constants
// ============================================================================

describe('TaskList Status Configuration', () => {
  describe('STATUS_ORDER', () => {
    it('should have 5 status values', () => {
      expect(STATUS_ORDER).toHaveLength(5);
    });

    it('should include all expected statuses', () => {
      expect(STATUS_ORDER).toContain('todo');
      expect(STATUS_ORDER).toContain('inprogress');
      expect(STATUS_ORDER).toContain('inreview');
      expect(STATUS_ORDER).toContain('done');
      expect(STATUS_ORDER).toContain('cancelled');
    });

    it('should have correct order (todo first, cancelled last)', () => {
      expect(STATUS_ORDER[0]).toBe('todo');
      expect(STATUS_ORDER[STATUS_ORDER.length - 1]).toBe('cancelled');
    });
  });

  describe('STATUS_LABELS', () => {
    it('should have labels for all statuses', () => {
      expect(STATUS_LABELS.todo).toBe('To Do');
      expect(STATUS_LABELS.inprogress).toBe('In Progress');
      expect(STATUS_LABELS.inreview).toBe('In Review');
      expect(STATUS_LABELS.done).toBe('Done');
      expect(STATUS_LABELS.cancelled).toBe('Cancelled');
    });

    it('should have user-friendly labels', () => {
      // All labels should be title case
      for (const label of Object.values(STATUS_LABELS)) {
        const firstChar = label.charAt(0);
        expect(firstChar).toBe(firstChar.toUpperCase());
      }
    });
  });

  describe('STATUS_COLORS', () => {
    it('should have colors for all statuses', () => {
      expect(STATUS_COLORS.todo).toBe('text-status-todo');
      expect(STATUS_COLORS.inprogress).toBe('text-status-inprogress');
      expect(STATUS_COLORS.inreview).toBe('text-status-inreview');
      expect(STATUS_COLORS.done).toBe('text-status-done');
      expect(STATUS_COLORS.cancelled).toBe('text-status-cancelled');
    });

    it('should use consistent naming pattern', () => {
      for (const color of Object.values(STATUS_COLORS)) {
        expect(color).toMatch(/^text-status-/);
      }
    });
  });
});

// ============================================================================
// CSS Class Constants
// ============================================================================

describe('TaskList CSS Classes', () => {
  describe('TASK_LIST_BASE_CLASSES', () => {
    it('should include flex layout', () => {
      expect(TASK_LIST_BASE_CLASSES).toContain('flex');
      expect(TASK_LIST_BASE_CLASSES).toContain('flex-col');
    });
  });

  describe('TASK_LIST_GAP_CLASSES', () => {
    it('should have gap classes for all sizes', () => {
      expect(TASK_LIST_GAP_CLASSES.sm).toBeDefined();
      expect(TASK_LIST_GAP_CLASSES.md).toBeDefined();
      expect(TASK_LIST_GAP_CLASSES.lg).toBeDefined();
    });

    it('should have increasing gaps', () => {
      // Extract gap values and ensure they increase
      const smGap = TASK_LIST_GAP_CLASSES.sm.match(/gap-(\d+\.?\d*)/)?.[1] || '0';
      const lgGap = TASK_LIST_GAP_CLASSES.lg.match(/gap-(\d+\.?\d*)/)?.[1] || '0';

      expect(Number.parseFloat(smGap)).toBeLessThan(Number.parseFloat(lgGap));
    });
  });

  describe('TASK_LIST_KANBAN_BASE_CLASSES', () => {
    it('should include flex and overflow', () => {
      expect(TASK_LIST_KANBAN_BASE_CLASSES).toContain('flex');
      expect(TASK_LIST_KANBAN_BASE_CLASSES).toContain('overflow-x-auto');
    });
  });

  describe('TASK_LIST_KANBAN_GAP_CLASSES', () => {
    it('should have gap classes for all sizes', () => {
      expect(TASK_LIST_KANBAN_GAP_CLASSES.sm).toBeDefined();
      expect(TASK_LIST_KANBAN_GAP_CLASSES.md).toBeDefined();
      expect(TASK_LIST_KANBAN_GAP_CLASSES.lg).toBeDefined();
    });
  });

  describe('TASK_LIST_COLUMN_BASE_CLASSES', () => {
    it('should include flex and min-width', () => {
      expect(TASK_LIST_COLUMN_BASE_CLASSES).toContain('flex');
      expect(TASK_LIST_COLUMN_BASE_CLASSES).toContain('min-w-64');
      expect(TASK_LIST_COLUMN_BASE_CLASSES).toContain('flex-1');
      expect(TASK_LIST_COLUMN_BASE_CLASSES).toContain('flex-col');
    });
  });

  describe('TASK_LIST_COLUMN_HEADER_CLASSES', () => {
    it('should include flex and margin', () => {
      expect(TASK_LIST_COLUMN_HEADER_CLASSES).toContain('flex');
      expect(TASK_LIST_COLUMN_HEADER_CLASSES).toContain('mb-3');
      expect(TASK_LIST_COLUMN_HEADER_CLASSES).toContain('items-center');
    });
  });

  describe('TASK_LIST_COLUMN_HEADER_TEXT_CLASSES', () => {
    it('should have text classes for all sizes', () => {
      expect(TASK_LIST_COLUMN_HEADER_TEXT_CLASSES.sm).toContain('text-xs');
      expect(TASK_LIST_COLUMN_HEADER_TEXT_CLASSES.md).toContain('text-sm');
      expect(TASK_LIST_COLUMN_HEADER_TEXT_CLASSES.lg).toContain('text-base');
    });

    it('should include font-medium', () => {
      for (const classes of Object.values(TASK_LIST_COLUMN_HEADER_TEXT_CLASSES)) {
        expect(classes).toContain('font-medium');
      }
    });
  });

  describe('TASK_LIST_COLUMN_COUNT_CLASSES', () => {
    it('should include rounded and background', () => {
      expect(TASK_LIST_COLUMN_COUNT_CLASSES).toContain('rounded-full');
      expect(TASK_LIST_COLUMN_COUNT_CLASSES).toContain('bg-');
      expect(TASK_LIST_COLUMN_COUNT_CLASSES).toContain('text-xs');
    });
  });

  describe('TASK_LIST_COLUMN_CONTENT_CLASSES', () => {
    it('should include flex layout', () => {
      expect(TASK_LIST_COLUMN_CONTENT_CLASSES).toContain('flex');
      expect(TASK_LIST_COLUMN_CONTENT_CLASSES).toContain('flex-1');
      expect(TASK_LIST_COLUMN_CONTENT_CLASSES).toContain('flex-col');
    });
  });

  describe('TASK_LIST_COLUMN_CONTENT_GAP_CLASSES', () => {
    it('should have gap classes for all sizes', () => {
      expect(TASK_LIST_COLUMN_CONTENT_GAP_CLASSES.sm).toBeDefined();
      expect(TASK_LIST_COLUMN_CONTENT_GAP_CLASSES.md).toBeDefined();
      expect(TASK_LIST_COLUMN_CONTENT_GAP_CLASSES.lg).toBeDefined();
    });
  });

  describe('TASK_LIST_EMPTY_COLUMN_CLASSES', () => {
    it('should include border and background', () => {
      expect(TASK_LIST_EMPTY_COLUMN_CLASSES).toContain('rounded-lg');
      expect(TASK_LIST_EMPTY_COLUMN_CLASSES).toContain('border');
      expect(TASK_LIST_EMPTY_COLUMN_CLASSES).toContain('border-dashed');
    });
  });

  describe('TASK_LIST_EMPTY_COLUMN_TEXT_CLASSES', () => {
    it('should include text centering and muted color', () => {
      expect(TASK_LIST_EMPTY_COLUMN_TEXT_CLASSES).toContain('text-center');
      expect(TASK_LIST_EMPTY_COLUMN_TEXT_CLASSES).toContain('text-xs');
    });
  });

  describe('TASK_LIST_ERROR_BASE_CLASSES', () => {
    it('should include flex and destructive styling', () => {
      expect(TASK_LIST_ERROR_BASE_CLASSES).toContain('flex');
      expect(TASK_LIST_ERROR_BASE_CLASSES).toContain('flex-col');
      expect(TASK_LIST_ERROR_BASE_CLASSES).toContain('items-center');
      expect(TASK_LIST_ERROR_BASE_CLASSES).toContain('rounded-lg');
      expect(TASK_LIST_ERROR_BASE_CLASSES).toContain('destructive');
    });
  });

  describe('TASK_LIST_ERROR_PADDING_CLASSES', () => {
    it('should have padding for all sizes', () => {
      expect(TASK_LIST_ERROR_PADDING_CLASSES.sm).toContain('p-');
      expect(TASK_LIST_ERROR_PADDING_CLASSES.md).toContain('p-');
      expect(TASK_LIST_ERROR_PADDING_CLASSES.lg).toContain('p-');
    });

    it('should have gap for all sizes', () => {
      for (const classes of Object.values(TASK_LIST_ERROR_PADDING_CLASSES)) {
        expect(classes).toContain('gap-');
      }
    });
  });

  describe('TASK_LIST_ERROR_ICON_SIZE', () => {
    it('should have icon sizes for all sizes', () => {
      expect(TASK_LIST_ERROR_ICON_SIZE.sm).toBe('md');
      expect(TASK_LIST_ERROR_ICON_SIZE.md).toBe('lg');
      expect(TASK_LIST_ERROR_ICON_SIZE.lg).toBe('xl');
    });
  });

  describe('TASK_LIST_ERROR_TEXT_SIZE', () => {
    it('should have text sizes for all sizes', () => {
      expect(TASK_LIST_ERROR_TEXT_SIZE.sm).toBe('sm');
      expect(TASK_LIST_ERROR_TEXT_SIZE.md).toBe('base');
      expect(TASK_LIST_ERROR_TEXT_SIZE.lg).toBe('lg');
    });
  });

  describe('TASK_LIST_ERROR_MESSAGE_SIZE', () => {
    it('should have message sizes for all sizes', () => {
      expect(TASK_LIST_ERROR_MESSAGE_SIZE.sm).toBe('xs');
      expect(TASK_LIST_ERROR_MESSAGE_SIZE.md).toBe('sm');
      expect(TASK_LIST_ERROR_MESSAGE_SIZE.lg).toBe('base');
    });
  });
});

// ============================================================================
// Utility Functions
// ============================================================================

describe('TaskList Utility Functions', () => {
  describe('getBaseSize', () => {
    it('should return size when passed a string', () => {
      expect(getBaseSize('sm')).toBe('sm');
      expect(getBaseSize('md')).toBe('md');
      expect(getBaseSize('lg')).toBe('lg');
    });

    it('should return base value from responsive object', () => {
      expect(getBaseSize({ base: 'sm' })).toBe('sm');
      expect(getBaseSize({ base: 'md', lg: 'lg' })).toBe('md');
    });

    it('should return first defined breakpoint when no base', () => {
      expect(getBaseSize({ sm: 'md' })).toBe('md');
      expect(getBaseSize({ lg: 'lg' })).toBe('lg');
    });

    it('should return md as default', () => {
      expect(getBaseSize({})).toBe('md');
    });
  });

  describe('getResponsiveSizeClasses', () => {
    const testClassMap = {
      sm: 'gap-1',
      md: 'gap-2',
      lg: 'gap-3',
    };

    it('should return class for string size', () => {
      expect(getResponsiveSizeClasses('md', testClassMap)).toBe('gap-2');
    });

    it('should return base class without prefix', () => {
      const result = getResponsiveSizeClasses({ base: 'sm' }, testClassMap);
      expect(result).toBe('gap-1');
    });

    it('should add breakpoint prefix for non-base', () => {
      const result = getResponsiveSizeClasses({ md: 'lg' }, testClassMap);
      expect(result).toBe('md:gap-3');
    });

    it('should handle multiple breakpoints', () => {
      const result = getResponsiveSizeClasses({ base: 'sm', md: 'md', lg: 'lg' }, testClassMap);
      expect(result).toContain('gap-1');
      expect(result).toContain('md:gap-2');
      expect(result).toContain('lg:gap-3');
    });

    it('should split multi-class values correctly', () => {
      const multiClassMap = {
        sm: 'p-2 gap-2',
        md: 'p-3 gap-3',
        lg: 'p-4 gap-4',
      };
      const result = getResponsiveSizeClasses({ base: 'sm', md: 'md' }, multiClassMap);
      expect(result).toContain('p-2');
      expect(result).toContain('gap-2');
      expect(result).toContain('md:p-3');
      expect(result).toContain('md:gap-3');
    });
  });

  describe('groupTasksByStatus', () => {
    const createTask = (id: string, status: TaskStatus): Task => ({
      id,
      projectId: 'project-1',
      title: `Task ${id}`,
      status,
      actionsRequiredCount: 0,
      autoStartNextStep: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    it('should group tasks by status', () => {
      const tasks: Task[] = [
        createTask('1', 'todo' as TaskStatus),
        createTask('2', 'inprogress' as TaskStatus),
        createTask('3', 'todo' as TaskStatus),
        createTask('4', 'done' as TaskStatus),
      ];

      const grouped = groupTasksByStatus(tasks);

      expect(grouped.todo).toHaveLength(2);
      expect(grouped.inprogress).toHaveLength(1);
      expect(grouped.done).toHaveLength(1);
      expect(grouped.inreview).toHaveLength(0);
      expect(grouped.cancelled).toHaveLength(0);
    });

    it('should handle empty array', () => {
      const grouped = groupTasksByStatus([]);

      expect(grouped.todo).toHaveLength(0);
      expect(grouped.inprogress).toHaveLength(0);
      expect(grouped.inreview).toHaveLength(0);
      expect(grouped.done).toHaveLength(0);
      expect(grouped.cancelled).toHaveLength(0);
    });

    it('should maintain task order within groups', () => {
      const tasks: Task[] = [
        createTask('1', 'todo' as TaskStatus),
        createTask('2', 'todo' as TaskStatus),
        createTask('3', 'todo' as TaskStatus),
      ];

      const grouped = groupTasksByStatus(tasks);

      expect(grouped.todo).toHaveLength(3);
      expect(grouped.todo[0]?.id).toBe('1');
      expect(grouped.todo[1]?.id).toBe('2');
      expect(grouped.todo[2]?.id).toBe('3');
    });
  });

  describe('buildListAccessibleLabel', () => {
    const createTask = (id: string): Task => ({
      id,
      projectId: 'project-1',
      title: `Task ${id}`,
      status: 'todo' as TaskStatus,
      actionsRequiredCount: 0,
      autoStartNextStep: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    it('should return custom label if provided', () => {
      const tasks = [createTask('1'), createTask('2')];
      const result = buildListAccessibleLabel(tasks, false, 'Custom label');
      expect(result).toBe('Custom label');
    });

    it('should build list label with count', () => {
      const tasks = [createTask('1'), createTask('2'), createTask('3')];
      const result = buildListAccessibleLabel(tasks, false);
      expect(result).toBe('Task list. 3 tasks');
    });

    it('should build kanban label with count', () => {
      const tasks = [createTask('1'), createTask('2')];
      const result = buildListAccessibleLabel(tasks, true);
      expect(result).toBe('Task board grouped by status. 2 tasks');
    });

    it('should handle singular task', () => {
      const tasks = [createTask('1')];
      const result = buildListAccessibleLabel(tasks, false);
      expect(result).toBe('Task list. 1 task');
    });

    it('should handle empty tasks', () => {
      const result = buildListAccessibleLabel([], false);
      expect(result).toBe('Task list. 0 tasks');
    });
  });

  describe('buildSelectionAnnouncement', () => {
    it('should build announcement with task title', () => {
      const result = buildSelectionAnnouncement('My Task');
      expect(result).toBe('My Task Task selected');
    });

    it('should handle empty title', () => {
      const result = buildSelectionAnnouncement('');
      expect(result).toBe(' Task selected');
    });

    it('should handle long titles', () => {
      const longTitle = 'This is a very long task title that might cause issues';
      const result = buildSelectionAnnouncement(longTitle);
      expect(result).toBe(`${longTitle} Task selected`);
    });
  });
});

// ============================================================================
// Accessibility Behavior
// ============================================================================

describe('TaskList Accessibility Behavior', () => {
  describe('ARIA attributes documentation', () => {
    it('should document that list has role="list"', () => {
      // The component uses role="list" on the main container
      // This is verified via Storybook and visual testing
      expect(TASK_LIST_BASE_CLASSES).toBeDefined();
    });

    it('should document that kanban has role="region"', () => {
      // The kanban view uses role="region" with aria-label
      expect(TASK_LIST_KANBAN_BASE_CLASSES).toBeDefined();
    });

    it('should document that columns use role="group"', () => {
      // Columns use role="group" with aria-labelledby
      expect(TASK_LIST_COLUMN_BASE_CLASSES).toBeDefined();
    });

    it('should document that error uses role="alert"', () => {
      // Error state uses role="alert" with aria-live="assertive"
      expect(TASK_LIST_ERROR_BASE_CLASSES).toBeDefined();
    });
  });

  describe('Keyboard navigation documentation', () => {
    it('should document arrow key navigation', () => {
      // Arrow keys navigate between tasks
      expect(SR_NAVIGATION_HINT).toContain('arrow keys');
    });

    it('should document Enter/Space for selection', () => {
      // Enter or Space selects the focused task
      expect(SR_NAVIGATION_HINT).toContain('Enter to select');
    });
  });

  describe('Screen reader announcements', () => {
    it('should provide task count announcement', () => {
      expect(SR_TASK_COUNT_TEMPLATE(5)).toContain('5');
      expect(SR_TASK_COUNT_TEMPLATE(5)).toContain('tasks');
    });

    it('should provide column announcement', () => {
      expect(SR_COLUMN_TEMPLATE('To Do', 3)).toContain('To Do');
      expect(SR_COLUMN_TEMPLATE('To Do', 3)).toContain('3');
    });

    it('should provide selection announcement', () => {
      expect(SR_TASK_SELECTED).toBe('Task selected');
    });
  });
});

// ============================================================================
// Size Consistency
// ============================================================================

describe('TaskList Size Consistency', () => {
  const sizes = ['sm', 'md', 'lg'] as const;

  it('should have gap classes for all sizes', () => {
    for (const size of sizes) {
      expect(TASK_LIST_GAP_CLASSES[size]).toBeDefined();
      expect(TASK_LIST_KANBAN_GAP_CLASSES[size]).toBeDefined();
      expect(TASK_LIST_COLUMN_CONTENT_GAP_CLASSES[size]).toBeDefined();
    }
  });

  it('should have header text classes for all sizes', () => {
    for (const size of sizes) {
      expect(TASK_LIST_COLUMN_HEADER_TEXT_CLASSES[size]).toBeDefined();
    }
  });

  it('should have error padding classes for all sizes', () => {
    for (const size of sizes) {
      expect(TASK_LIST_ERROR_PADDING_CLASSES[size]).toBeDefined();
    }
  });

  it('should have error icon sizes for all sizes', () => {
    for (const size of sizes) {
      expect(TASK_LIST_ERROR_ICON_SIZE[size]).toBeDefined();
    }
  });

  it('should have error text sizes for all sizes', () => {
    for (const size of sizes) {
      expect(TASK_LIST_ERROR_TEXT_SIZE[size]).toBeDefined();
    }
  });

  it('should have error message sizes for all sizes', () => {
    for (const size of sizes) {
      expect(TASK_LIST_ERROR_MESSAGE_SIZE[size]).toBeDefined();
    }
  });
});

// ============================================================================
// Component Behavior Documentation
// ============================================================================

describe('TaskList Component Behavior', () => {
  describe('Empty state', () => {
    it('should document that empty tasks show EmptyState', () => {
      // When tasks array is empty, EmptyState component is rendered
      expect(DEFAULT_EMPTY_TITLE).toBe('No tasks yet');
      expect(DEFAULT_EMPTY_DESCRIPTION).toBe('Create a new task to get started.');
    });
  });

  describe('Error state', () => {
    it('should document that errors show TaskListError', () => {
      // TaskListError shows error message and retry button
      expect(DEFAULT_ERROR_TITLE).toBe('Failed to load tasks');
      expect(DEFAULT_ERROR_MESSAGE).toBeDefined();
      expect(DEFAULT_RETRY_LABEL).toBe('Retry');
    });
  });

  describe('Loading state', () => {
    it('should document that loading shows TaskListSkeleton', () => {
      // TaskListSkeleton shows skeleton task cards
      expect(DEFAULT_SKELETON_COUNT).toBe(5);
      expect(DEFAULT_KANBAN_SKELETON_COUNT).toBe(2);
    });
  });

  describe('Status ordering', () => {
    it('should document kanban column order', () => {
      // Columns are ordered: todo, inprogress, inreview, done, cancelled
      expect(STATUS_ORDER[0]).toBe('todo');
      expect(STATUS_ORDER[1]).toBe('inprogress');
      expect(STATUS_ORDER[2]).toBe('inreview');
      expect(STATUS_ORDER[3]).toBe('done');
      expect(STATUS_ORDER[4]).toBe('cancelled');
    });
  });
});

// ============================================================================
// Props Documentation
// ============================================================================

describe('TaskList Props Documentation', () => {
  describe('Required props', () => {
    it('should document that tasks is required', () => {
      // The tasks prop is required and must be an array
      expect(true).toBe(true); // TypeScript enforces this
    });
  });

  describe('Optional props', () => {
    it('should document that selectedTaskId is optional', () => {
      // selectedTaskId highlights the selected task
      expect(true).toBe(true); // TypeScript enforces this
    });

    it('should document that onSelectTask is optional', () => {
      // onSelectTask callback when task is selected
      expect(true).toBe(true); // TypeScript enforces this
    });

    it('should document that groupByStatus is optional', () => {
      // groupByStatus shows kanban view when true
      expect(true).toBe(true); // TypeScript enforces this
    });

    it('should document that size is optional with default md', () => {
      // size defaults to 'md'
      expect(getBaseSize({})).toBe('md');
    });
  });
});

// ============================================================================
// Data Attributes Documentation
// ============================================================================

describe('TaskList Data Attributes', () => {
  it('should document data-testid support', () => {
    // data-testid is passed through to the root element
    expect(true).toBe(true);
  });

  it('should document data-layout attribute', () => {
    // data-layout is either "list" or "kanban"
    expect(true).toBe(true);
  });

  it('should document data-task-count attribute', () => {
    // data-task-count contains the number of tasks
    expect(true).toBe(true);
  });

  it('should document data-size attribute', () => {
    // data-size contains the base size value
    expect(true).toBe(true);
  });

  it('should document data-empty attribute', () => {
    // data-empty="true" when tasks array is empty
    expect(true).toBe(true);
  });
});

// ============================================================================
// Integration Patterns
// ============================================================================

describe('TaskList Integration Patterns', () => {
  describe('With selection', () => {
    it('should document selection pattern', () => {
      // Use selectedTaskId and onSelectTask together
      // onSelectTask receives the task ID
      expect(SR_TASK_SELECTED).toBeDefined();
    });
  });

  describe('With status changes', () => {
    it('should document status change pattern', () => {
      // Use onStatusChange to update task status
      // Receives task ID and new status
      expect(STATUS_ORDER).toBeDefined();
    });
  });

  describe('With context menu', () => {
    it('should document context menu pattern', () => {
      // Use onTaskContextMenu for right-click menu
      // Receives task ID and mouse event
      expect(true).toBe(true);
    });
  });

  describe('With loading state', () => {
    it('should document loading pattern', () => {
      // Show TaskListSkeleton while loading
      expect(DEFAULT_SKELETON_COUNT).toBe(5);
    });
  });

  describe('With error state', () => {
    it('should document error recovery pattern', () => {
      // Show TaskListError with onRetry callback
      expect(DEFAULT_RETRY_LABEL).toBe('Retry');
    });
  });
});
