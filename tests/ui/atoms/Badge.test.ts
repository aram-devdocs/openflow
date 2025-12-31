/**
 * Badge Component Utility Function Tests
 *
 * Tests for the Badge atom utility functions and class generation.
 * Component rendering is tested via Storybook.
 */

import { TaskStatus } from '@openflow/generated';
import { taskStatusToLabel, taskStatusToVariant } from '@openflow/ui';
import { describe, expect, it } from 'vitest';

// =============================================================================
// Re-implement utility functions for testing
// (mirrors the logic in Badge.tsx)
// =============================================================================

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type BadgeSize = 'sm' | 'md' | 'lg';
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'todo'
  | 'inprogress'
  | 'inreview'
  | 'done'
  | 'cancelled';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  error: 'bg-error/20 text-error',
  info: 'bg-info/20 text-info',
  todo: 'bg-status-todo/20 text-status-todo',
  inprogress: 'bg-status-inprogress/20 text-status-inprogress',
  inreview: 'bg-status-inreview/20 text-status-inreview',
  done: 'bg-status-done/20 text-status-done',
  cancelled: 'bg-status-cancelled/20 text-status-cancelled',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs gap-1',
  md: 'px-2 py-0.5 text-xs gap-1.5',
  lg: 'px-2.5 py-1 text-sm gap-1.5',
};

const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

function getResponsiveSizeClasses(size: ResponsiveValue<BadgeSize>): string[] {
  const classes: string[] = [];

  if (typeof size === 'string') {
    classes.push(sizeClasses[size]);
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, BadgeSize>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const sizeClass = sizeClasses[breakpointValue];
        const individualClasses = sizeClass.split(' ');
        for (const cls of individualClasses) {
          if (breakpoint === 'base') {
            classes.push(cls);
          } else {
            classes.push(`${breakpoint}:${cls}`);
          }
        }
      }
    }
  }

  return classes;
}

// =============================================================================
// Tests
// =============================================================================

describe('ui/atoms/Badge - Utility Functions', () => {
  // ===========================================================================
  // Variant Classes
  // ===========================================================================

  describe('variantClasses', () => {
    it('default variant has correct classes', () => {
      expect(variantClasses.default).toBe('bg-muted text-muted-foreground');
    });

    it('success variant has correct classes', () => {
      expect(variantClasses.success).toBe('bg-success/20 text-success');
    });

    it('warning variant has correct classes', () => {
      expect(variantClasses.warning).toBe('bg-warning/20 text-warning');
    });

    it('error variant has correct classes', () => {
      expect(variantClasses.error).toBe('bg-error/20 text-error');
    });

    it('info variant has correct classes', () => {
      expect(variantClasses.info).toBe('bg-info/20 text-info');
    });

    it('todo status variant has correct classes', () => {
      expect(variantClasses.todo).toBe('bg-status-todo/20 text-status-todo');
    });

    it('inprogress status variant has correct classes', () => {
      expect(variantClasses.inprogress).toBe('bg-status-inprogress/20 text-status-inprogress');
    });

    it('inreview status variant has correct classes', () => {
      expect(variantClasses.inreview).toBe('bg-status-inreview/20 text-status-inreview');
    });

    it('done status variant has correct classes', () => {
      expect(variantClasses.done).toBe('bg-status-done/20 text-status-done');
    });

    it('cancelled status variant has correct classes', () => {
      expect(variantClasses.cancelled).toBe('bg-status-cancelled/20 text-status-cancelled');
    });
  });

  // ===========================================================================
  // Size Classes
  // ===========================================================================

  describe('sizeClasses', () => {
    it('sm size has correct classes', () => {
      expect(sizeClasses.sm).toBe('px-1.5 py-0.5 text-xs gap-1');
    });

    it('md size has correct classes', () => {
      expect(sizeClasses.md).toBe('px-2 py-0.5 text-xs gap-1.5');
    });

    it('lg size has correct classes', () => {
      expect(sizeClasses.lg).toBe('px-2.5 py-1 text-sm gap-1.5');
    });
  });

  // ===========================================================================
  // Responsive Size Classes
  // ===========================================================================

  describe('getResponsiveSizeClasses', () => {
    it('handles simple string size', () => {
      const classes = getResponsiveSizeClasses('sm');
      expect(classes).toEqual(['px-1.5 py-0.5 text-xs gap-1']);
    });

    it('handles simple md size', () => {
      const classes = getResponsiveSizeClasses('md');
      expect(classes).toEqual(['px-2 py-0.5 text-xs gap-1.5']);
    });

    it('handles simple lg size', () => {
      const classes = getResponsiveSizeClasses('lg');
      expect(classes).toEqual(['px-2.5 py-1 text-sm gap-1.5']);
    });

    it('handles responsive size with base only', () => {
      const classes = getResponsiveSizeClasses({ base: 'sm' });
      expect(classes).toEqual(['px-1.5', 'py-0.5', 'text-xs', 'gap-1']);
    });

    it('handles responsive size with base and md', () => {
      const classes = getResponsiveSizeClasses({ base: 'sm', md: 'md' });
      expect(classes).toContain('px-1.5');
      expect(classes).toContain('py-0.5');
      expect(classes).toContain('text-xs');
      expect(classes).toContain('gap-1');
      expect(classes).toContain('md:px-2');
      expect(classes).toContain('md:py-0.5');
      expect(classes).toContain('md:text-xs');
      expect(classes).toContain('md:gap-1.5');
    });

    it('handles responsive size with all breakpoints', () => {
      const classes = getResponsiveSizeClasses({ base: 'sm', md: 'md', lg: 'lg' });

      // Base classes
      expect(classes).toContain('px-1.5');
      expect(classes).toContain('py-0.5');
      expect(classes).toContain('text-xs');
      expect(classes).toContain('gap-1');

      // MD classes
      expect(classes).toContain('md:px-2');
      expect(classes).toContain('md:py-0.5');
      expect(classes).toContain('md:text-xs');
      expect(classes).toContain('md:gap-1.5');

      // LG classes
      expect(classes).toContain('lg:px-2.5');
      expect(classes).toContain('lg:py-1');
      expect(classes).toContain('lg:text-sm');
      expect(classes).toContain('lg:gap-1.5');
    });

    it('handles responsive size with non-sequential breakpoints', () => {
      const classes = getResponsiveSizeClasses({ base: 'sm', lg: 'lg' });

      // Base classes
      expect(classes).toContain('px-1.5');

      // LG classes (skip md)
      expect(classes).toContain('lg:px-2.5');

      // MD should not be present
      expect(classes.filter((c) => c.startsWith('md:'))).toHaveLength(0);
    });
  });

  // ===========================================================================
  // taskStatusToVariant
  // ===========================================================================

  describe('taskStatusToVariant', () => {
    it('maps todo status to todo variant', () => {
      expect(taskStatusToVariant(TaskStatus.Todo)).toBe('todo');
    });

    it('maps inprogress status to inprogress variant', () => {
      expect(taskStatusToVariant(TaskStatus.Inprogress)).toBe('inprogress');
    });

    it('maps inreview status to inreview variant', () => {
      expect(taskStatusToVariant(TaskStatus.Inreview)).toBe('inreview');
    });

    it('maps done status to done variant', () => {
      expect(taskStatusToVariant(TaskStatus.Done)).toBe('done');
    });

    it('maps cancelled status to cancelled variant', () => {
      expect(taskStatusToVariant(TaskStatus.Cancelled)).toBe('cancelled');
    });

    it('maps all TaskStatus values correctly', () => {
      const statusToVariant: Record<TaskStatus, string> = {
        [TaskStatus.Todo]: 'todo',
        [TaskStatus.Inprogress]: 'inprogress',
        [TaskStatus.Inreview]: 'inreview',
        [TaskStatus.Done]: 'done',
        [TaskStatus.Cancelled]: 'cancelled',
      };

      for (const [status, expectedVariant] of Object.entries(statusToVariant)) {
        expect(taskStatusToVariant(status as TaskStatus)).toBe(expectedVariant);
      }
    });
  });

  // ===========================================================================
  // taskStatusToLabel
  // ===========================================================================

  describe('taskStatusToLabel', () => {
    it('maps todo status to "To Do" label', () => {
      expect(taskStatusToLabel(TaskStatus.Todo)).toBe('To Do');
    });

    it('maps inprogress status to "In Progress" label', () => {
      expect(taskStatusToLabel(TaskStatus.Inprogress)).toBe('In Progress');
    });

    it('maps inreview status to "In Review" label', () => {
      expect(taskStatusToLabel(TaskStatus.Inreview)).toBe('In Review');
    });

    it('maps done status to "Done" label', () => {
      expect(taskStatusToLabel(TaskStatus.Done)).toBe('Done');
    });

    it('maps cancelled status to "Cancelled" label', () => {
      expect(taskStatusToLabel(TaskStatus.Cancelled)).toBe('Cancelled');
    });

    it('maps all TaskStatus values correctly', () => {
      const statusToLabel: Record<TaskStatus, string> = {
        [TaskStatus.Todo]: 'To Do',
        [TaskStatus.Inprogress]: 'In Progress',
        [TaskStatus.Inreview]: 'In Review',
        [TaskStatus.Done]: 'Done',
        [TaskStatus.Cancelled]: 'Cancelled',
      };

      for (const [status, expectedLabel] of Object.entries(statusToLabel)) {
        expect(taskStatusToLabel(status as TaskStatus)).toBe(expectedLabel);
      }
    });
  });

  // ===========================================================================
  // Variant Color Accessibility
  // ===========================================================================

  describe('variant color accessibility', () => {
    it('all variants use 20% opacity backgrounds for proper contrast', () => {
      const colorVariants: BadgeVariant[] = ['success', 'warning', 'error', 'info'];
      for (const variant of colorVariants) {
        expect(variantClasses[variant]).toMatch(/bg-[a-z-]+\/20/);
      }
    });

    it('all task status variants use 20% opacity backgrounds', () => {
      const statusVariants: BadgeVariant[] = [
        'todo',
        'inprogress',
        'inreview',
        'done',
        'cancelled',
      ];
      for (const variant of statusVariants) {
        expect(variantClasses[variant]).toMatch(/bg-status-[a-z-]+\/20/);
      }
    });

    it('all variants have both bg and text classes', () => {
      for (const [_variant, classes] of Object.entries(variantClasses)) {
        expect(classes).toMatch(/bg-/);
        expect(classes).toMatch(/text-/);
      }
    });
  });

  // ===========================================================================
  // Size Consistency
  // ===========================================================================

  describe('size consistency', () => {
    it('all sizes include padding-x', () => {
      for (const sizeClass of Object.values(sizeClasses)) {
        expect(sizeClass).toMatch(/px-\d+\.?\d*/);
      }
    });

    it('all sizes include padding-y', () => {
      for (const sizeClass of Object.values(sizeClasses)) {
        expect(sizeClass).toMatch(/py-\d+\.?\d*/);
      }
    });

    it('all sizes include text size', () => {
      for (const sizeClass of Object.values(sizeClasses)) {
        expect(sizeClass).toMatch(/text-(xs|sm|base|lg)/);
      }
    });

    it('all sizes include gap for icon spacing', () => {
      for (const sizeClass of Object.values(sizeClasses)) {
        expect(sizeClass).toMatch(/gap-\d+\.?\d*/);
      }
    });

    it('larger sizes have larger padding', () => {
      // Extract px values
      const pxSm = sizeClasses.sm.match(/px-(\d+\.?\d*)/)?.[1];
      const pxMd = sizeClasses.md.match(/px-(\d+\.?\d*)/)?.[1];
      const pxLg = sizeClasses.lg.match(/px-(\d+\.?\d*)/)?.[1];

      // Verify values exist before comparing
      expect(pxSm).toBeDefined();
      expect(pxMd).toBeDefined();
      expect(pxLg).toBeDefined();

      // Compare padding values - larger sizes should have larger padding
      if (pxSm && pxMd && pxLg) {
        expect(Number.parseFloat(pxSm)).toBeLessThan(Number.parseFloat(pxMd));
        expect(Number.parseFloat(pxMd)).toBeLessThan(Number.parseFloat(pxLg));
      }
    });
  });
});
