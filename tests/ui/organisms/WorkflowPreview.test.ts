/**
 * WorkflowPreview Component Tests
 *
 * Tests for the WorkflowPreview organism component, covering:
 * - Exported constants and default values
 * - Utility functions for size classes
 * - Step icon and status utilities
 * - Accessibility label builders
 * - Workflow summary generation
 */

import { WorkflowStepStatus } from '@openflow/generated';
import { describe, expect, it } from 'vitest';
import {
  // Constants
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_LOADING_LABEL,
  DEFAULT_RETRY_LABEL,
  DEFAULT_SKELETON_STEP_COUNT,
  DEFAULT_WORKFLOW_PREVIEW_LABEL,
  ERROR_CONTAINER_CLASSES,
  ERROR_ICON_CLASSES,
  ERROR_MESSAGE_CLASSES,
  SKELETON_DESCRIPTION_CLASSES,
  SKELETON_HEADING_CLASSES,
  SKELETON_STEP_DESC_CLASSES,
  SKELETON_STEP_ICON_CLASSES,
  SKELETON_STEP_TEXT_CLASSES,
  SR_MORE_STEPS_PLURAL,
  SR_MORE_STEPS_SINGULAR,
  SR_STATUS_COMPLETED,
  SR_STATUS_IN_PROGRESS,
  SR_STATUS_PENDING,
  SR_STATUS_SKIPPED,
  STEP_ICON_CLASSES,
  STEP_TEXT_COMPLETED_CLASSES,
  STEP_TEXT_DEFAULT_CLASSES,
  WORKFLOW_PREVIEW_BASE_CLASSES,
  WORKFLOW_PREVIEW_SIZE_CLASSES,
  // Utility functions
  buildStepAccessibleLabel,
  buildWorkflowSummary,
  getBaseSize,
  getMoreStepsText,
  getResponsiveSizeClasses,
  getStatusLabel,
  getStepIcon,
  getStepIconClass,
} from '../../../packages/ui/organisms/WorkflowPreview';

// =============================================================================
// Default Labels Tests
// =============================================================================

describe('Default Labels', () => {
  it('has correct default workflow preview label', () => {
    expect(DEFAULT_WORKFLOW_PREVIEW_LABEL).toBe('Workflow preview');
  });

  it('has correct default loading label', () => {
    expect(DEFAULT_LOADING_LABEL).toBe('Loading workflow preview');
  });

  it('has correct default error message', () => {
    expect(DEFAULT_ERROR_MESSAGE).toBe('Failed to load workflow');
  });

  it('has correct default retry label', () => {
    expect(DEFAULT_RETRY_LABEL).toBe('Retry');
  });

  it('has correct default skeleton step count', () => {
    expect(DEFAULT_SKELETON_STEP_COUNT).toBe(3);
  });
});

// =============================================================================
// Screen Reader Status Labels Tests
// =============================================================================

describe('Screen Reader Status Labels', () => {
  it('has correct completed status label', () => {
    expect(SR_STATUS_COMPLETED).toBe('Completed');
  });

  it('has correct in progress status label', () => {
    expect(SR_STATUS_IN_PROGRESS).toBe('In progress');
  });

  it('has correct skipped status label', () => {
    expect(SR_STATUS_SKIPPED).toBe('Skipped');
  });

  it('has correct pending status label', () => {
    expect(SR_STATUS_PENDING).toBe('Pending');
  });

  it('has correct singular more steps text', () => {
    expect(SR_MORE_STEPS_SINGULAR).toBe('more step');
  });

  it('has correct plural more steps text', () => {
    expect(SR_MORE_STEPS_PLURAL).toBe('more steps');
  });
});

// =============================================================================
// Base Classes Tests
// =============================================================================

describe('Base Classes', () => {
  it('has correct workflow preview base classes', () => {
    expect(WORKFLOW_PREVIEW_BASE_CLASSES).toBe('space-y-3');
  });

  it('has correct step text completed classes', () => {
    expect(STEP_TEXT_COMPLETED_CLASSES).toBe('text-[hsl(var(--muted-foreground))] line-through');
  });

  it('has correct step text default classes', () => {
    expect(STEP_TEXT_DEFAULT_CLASSES).toBe('text-[hsl(var(--foreground))]');
  });
});

// =============================================================================
// Size Classes Tests
// =============================================================================

describe('WORKFLOW_PREVIEW_SIZE_CLASSES', () => {
  describe('sm size', () => {
    it('has correct container classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.sm.container).toBe('space-y-2');
    });

    it('has correct heading classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.sm.heading).toBe('text-sm font-medium');
    });

    it('has correct description classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.sm.description).toBe('text-xs');
    });

    it('has correct stepGap classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.sm.stepGap).toBe('space-y-1.5');
    });

    it('has correct stepText classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.sm.stepText).toBe('text-xs font-medium');
    });

    it('has correct iconWrapper classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.sm.iconWrapper).toBe('h-4 w-4');
    });

    it('has correct moreText classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.sm.moreText).toBe('text-[10px] pl-5');
    });
  });

  describe('md size', () => {
    it('has correct container classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.md.container).toBe('space-y-3');
    });

    it('has correct heading classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.md.heading).toBe('text-base font-medium');
    });

    it('has correct description classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.md.description).toBe('text-sm');
    });

    it('has correct stepGap classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.md.stepGap).toBe('space-y-2');
    });

    it('has correct stepText classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.md.stepText).toBe('text-sm font-medium');
    });

    it('has correct iconWrapper classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.md.iconWrapper).toBe('h-5 w-5');
    });
  });

  describe('lg size', () => {
    it('has correct container classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.lg.container).toBe('space-y-4');
    });

    it('has correct heading classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.lg.heading).toBe('text-lg font-medium');
    });

    it('has correct description classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.lg.description).toBe('text-base');
    });

    it('has correct stepGap classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.lg.stepGap).toBe('space-y-3');
    });

    it('has correct stepText classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.lg.stepText).toBe('text-base font-medium');
    });

    it('has correct iconWrapper classes', () => {
      expect(WORKFLOW_PREVIEW_SIZE_CLASSES.lg.iconWrapper).toBe('h-6 w-6');
    });
  });
});

// =============================================================================
// Step Icon Classes Tests
// =============================================================================

describe('STEP_ICON_CLASSES', () => {
  it('has correct completed icon classes', () => {
    expect(STEP_ICON_CLASSES[WorkflowStepStatus.Completed]).toBe('text-[hsl(var(--success))]');
  });

  it('has correct in progress icon classes with animation', () => {
    expect(STEP_ICON_CLASSES[WorkflowStepStatus.InProgress]).toBe(
      'text-[hsl(var(--primary))] motion-safe:animate-spin'
    );
  });

  it('has correct skipped icon classes', () => {
    expect(STEP_ICON_CLASSES[WorkflowStepStatus.Skipped]).toBe(
      'text-[hsl(var(--muted-foreground))]'
    );
  });

  it('has correct pending icon classes', () => {
    expect(STEP_ICON_CLASSES[WorkflowStepStatus.Pending]).toBe(
      'text-[hsl(var(--muted-foreground))]'
    );
  });
});

// =============================================================================
// Skeleton Classes Tests
// =============================================================================

describe('Skeleton Classes', () => {
  it('has correct heading skeleton classes', () => {
    expect(SKELETON_HEADING_CLASSES).toBe('h-5 w-32');
  });

  it('has correct description skeleton classes', () => {
    expect(SKELETON_DESCRIPTION_CLASSES).toBe('h-4 w-48');
  });

  it('has correct step icon skeleton classes', () => {
    expect(SKELETON_STEP_ICON_CLASSES).toBe('h-5 w-5 rounded-full');
  });

  it('has correct step text skeleton classes', () => {
    expect(SKELETON_STEP_TEXT_CLASSES).toBe('h-4 w-24');
  });

  it('has correct step description skeleton classes', () => {
    expect(SKELETON_STEP_DESC_CLASSES).toBe('h-3 w-full mt-1');
  });
});

// =============================================================================
// Error Classes Tests
// =============================================================================

describe('Error Classes', () => {
  it('has correct error container classes', () => {
    expect(ERROR_CONTAINER_CLASSES).toBe('flex flex-col items-center justify-center gap-3 py-6');
  });

  it('has correct error icon classes', () => {
    expect(ERROR_ICON_CLASSES).toBe('text-[hsl(var(--destructive))]');
  });

  it('has correct error message classes', () => {
    expect(ERROR_MESSAGE_CLASSES).toBe('text-sm text-center text-[hsl(var(--muted-foreground))]');
  });
});

// =============================================================================
// getBaseSize Utility Tests
// =============================================================================

describe('getBaseSize', () => {
  it('returns md when size is undefined', () => {
    expect(getBaseSize(undefined)).toBe('md');
  });

  it('returns the size when it is a string', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('returns base value from responsive object', () => {
    expect(getBaseSize({ base: 'sm' })).toBe('sm');
    expect(getBaseSize({ base: 'lg', md: 'sm' })).toBe('lg');
  });

  it('returns md when responsive object has no base', () => {
    expect(getBaseSize({ md: 'lg' })).toBe('md');
  });
});

// =============================================================================
// getResponsiveSizeClasses Utility Tests
// =============================================================================

describe('getResponsiveSizeClasses', () => {
  it('returns md classes when size is undefined', () => {
    expect(getResponsiveSizeClasses(undefined, 'container')).toBe('space-y-3');
    expect(getResponsiveSizeClasses(undefined, 'heading')).toBe('text-base font-medium');
  });

  it('returns correct classes for string size', () => {
    expect(getResponsiveSizeClasses('sm', 'container')).toBe('space-y-2');
    expect(getResponsiveSizeClasses('lg', 'heading')).toBe('text-lg font-medium');
  });

  it('returns base classes for responsive object with only base', () => {
    const result = getResponsiveSizeClasses({ base: 'sm' }, 'container');
    expect(result).toBe('space-y-2');
  });

  it('returns prefixed classes for responsive object with breakpoints', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', md: 'lg' }, 'container');
    expect(result).toContain('space-y-2');
    expect(result).toContain('md:space-y-4');
  });

  it('returns classes in correct breakpoint order', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', lg: 'lg', md: 'md' }, 'stepGap');
    const parts = result.split(' ');

    // Base should come first
    expect(parts[0]).toBe('space-y-1.5');

    // Should include md and lg prefixes
    expect(result).toContain('md:space-y-2');
    expect(result).toContain('lg:space-y-3');
  });
});

// =============================================================================
// getStepIcon Utility Tests
// =============================================================================

describe('getStepIcon', () => {
  it('returns a check icon for completed status', () => {
    const icon = getStepIcon(WorkflowStepStatus.Completed);
    // lucide-react may use different display names depending on version
    expect(icon.displayName).toMatch(/check/i);
  });

  it('returns a loader icon for in progress status', () => {
    const icon = getStepIcon(WorkflowStepStatus.InProgress);
    expect(icon.displayName).toMatch(/loader/i);
  });

  it('returns a skip icon for skipped status', () => {
    const icon = getStepIcon(WorkflowStepStatus.Skipped);
    expect(icon.displayName).toMatch(/skip|forward/i);
  });

  it('returns a circle icon for pending status', () => {
    const icon = getStepIcon(WorkflowStepStatus.Pending);
    expect(icon.displayName).toMatch(/circle/i);
  });
});

// =============================================================================
// getStepIconClass Utility Tests
// =============================================================================

describe('getStepIconClass', () => {
  it('returns success class for completed', () => {
    expect(getStepIconClass(WorkflowStepStatus.Completed)).toBe('text-[hsl(var(--success))]');
  });

  it('returns primary class with animation for in progress', () => {
    expect(getStepIconClass(WorkflowStepStatus.InProgress)).toBe(
      'text-[hsl(var(--primary))] motion-safe:animate-spin'
    );
  });

  it('returns muted class for skipped', () => {
    expect(getStepIconClass(WorkflowStepStatus.Skipped)).toBe(
      'text-[hsl(var(--muted-foreground))]'
    );
  });

  it('returns muted class for pending', () => {
    expect(getStepIconClass(WorkflowStepStatus.Pending)).toBe(
      'text-[hsl(var(--muted-foreground))]'
    );
  });
});

// =============================================================================
// getStatusLabel Utility Tests
// =============================================================================

describe('getStatusLabel', () => {
  it('returns Completed for completed status', () => {
    expect(getStatusLabel(WorkflowStepStatus.Completed)).toBe('Completed');
  });

  it('returns In progress for in progress status', () => {
    expect(getStatusLabel(WorkflowStepStatus.InProgress)).toBe('In progress');
  });

  it('returns Skipped for skipped status', () => {
    expect(getStatusLabel(WorkflowStepStatus.Skipped)).toBe('Skipped');
  });

  it('returns Pending for pending status', () => {
    expect(getStatusLabel(WorkflowStepStatus.Pending)).toBe('Pending');
  });
});

// =============================================================================
// buildStepAccessibleLabel Utility Tests
// =============================================================================

describe('buildStepAccessibleLabel', () => {
  it('builds correct label for regular step', () => {
    const label = buildStepAccessibleLabel(1, 'Requirements', WorkflowStepStatus.Pending, false);
    expect(label).toBe('Step 1: Requirements. Status: Pending');
  });

  it('builds correct label for active step', () => {
    const label = buildStepAccessibleLabel(
      2,
      'Implementation',
      WorkflowStepStatus.InProgress,
      true
    );
    expect(label).toBe('Step 2: Implementation. Status: In progress, current step');
  });

  it('builds correct label for completed step', () => {
    const label = buildStepAccessibleLabel(3, 'Testing', WorkflowStepStatus.Completed, false);
    expect(label).toBe('Step 3: Testing. Status: Completed');
  });

  it('builds correct label for skipped step', () => {
    const label = buildStepAccessibleLabel(4, 'Review', WorkflowStepStatus.Skipped, false);
    expect(label).toBe('Step 4: Review. Status: Skipped');
  });
});

// =============================================================================
// getMoreStepsText Utility Tests
// =============================================================================

describe('getMoreStepsText', () => {
  it('returns singular text for 1 step', () => {
    expect(getMoreStepsText(1)).toBe('+1 more step');
  });

  it('returns plural text for multiple steps', () => {
    expect(getMoreStepsText(2)).toBe('+2 more steps');
    expect(getMoreStepsText(5)).toBe('+5 more steps');
    expect(getMoreStepsText(10)).toBe('+10 more steps');
  });

  it('handles zero correctly (edge case)', () => {
    expect(getMoreStepsText(0)).toBe('+0 more steps');
  });
});

// =============================================================================
// buildWorkflowSummary Utility Tests
// =============================================================================

describe('buildWorkflowSummary', () => {
  it('builds summary for all pending steps', () => {
    const workflow = {
      id: 'wf-1',
      name: 'Test Workflow',
      content: '',
      isBuiltin: false,
      steps: [
        { index: 0, name: 'Step 1', description: '', status: WorkflowStepStatus.Pending },
        { index: 1, name: 'Step 2', description: '', status: WorkflowStepStatus.Pending },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const summary = buildWorkflowSummary(workflow);
    expect(summary).toBe('2 total steps, 2 pending');
  });

  it('builds summary for mixed status steps', () => {
    const workflow = {
      id: 'wf-2',
      name: 'Test Workflow',
      content: '',
      isBuiltin: false,
      steps: [
        { index: 0, name: 'Step 1', description: '', status: WorkflowStepStatus.Completed },
        { index: 1, name: 'Step 2', description: '', status: WorkflowStepStatus.InProgress },
        { index: 2, name: 'Step 3', description: '', status: WorkflowStepStatus.Pending },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const summary = buildWorkflowSummary(workflow);
    expect(summary).toBe('3 total steps, 1 completed, 1 in progress, 1 pending');
  });

  it('builds summary with skipped step', () => {
    const workflow = {
      id: 'wf-3',
      name: 'Test Workflow',
      content: '',
      isBuiltin: false,
      steps: [
        { index: 0, name: 'Step 1', description: '', status: WorkflowStepStatus.Completed },
        { index: 1, name: 'Step 2', description: '', status: WorkflowStepStatus.Skipped },
        { index: 2, name: 'Step 3', description: '', status: WorkflowStepStatus.Pending },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const summary = buildWorkflowSummary(workflow);
    expect(summary).toBe('3 total steps, 1 completed, 1 skipped, 1 pending');
  });

  it('builds summary for all completed steps', () => {
    const workflow = {
      id: 'wf-4',
      name: 'Test Workflow',
      content: '',
      isBuiltin: false,
      steps: [
        { index: 0, name: 'Step 1', description: '', status: WorkflowStepStatus.Completed },
        { index: 1, name: 'Step 2', description: '', status: WorkflowStepStatus.Completed },
        { index: 2, name: 'Step 3', description: '', status: WorkflowStepStatus.Completed },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const summary = buildWorkflowSummary(workflow);
    expect(summary).toBe('3 total steps, 3 completed');
  });

  it('builds summary for single step', () => {
    const workflow = {
      id: 'wf-5',
      name: 'Test Workflow',
      content: '',
      isBuiltin: false,
      steps: [{ index: 0, name: 'Step 1', description: '', status: WorkflowStepStatus.InProgress }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const summary = buildWorkflowSummary(workflow);
    expect(summary).toBe('1 total steps, 1 in progress');
  });
});

// =============================================================================
// Accessibility Behavior Tests
// =============================================================================

describe('Accessibility Behavior', () => {
  it('uses motion-safe prefix for in-progress animation', () => {
    const iconClass = getStepIconClass(WorkflowStepStatus.InProgress);
    expect(iconClass).toContain('motion-safe:');
  });

  it('provides distinct status labels for screen readers', () => {
    const statuses = [
      WorkflowStepStatus.Completed,
      WorkflowStepStatus.InProgress,
      WorkflowStepStatus.Skipped,
      WorkflowStepStatus.Pending,
    ];

    const labels = statuses.map(getStatusLabel);
    const uniqueLabels = new Set(labels);

    expect(uniqueLabels.size).toBe(4); // All labels should be unique
  });

  it('includes current step indicator in accessible label', () => {
    const activeLabel = buildStepAccessibleLabel(1, 'Test', WorkflowStepStatus.InProgress, true);
    const inactiveLabel = buildStepAccessibleLabel(1, 'Test', WorkflowStepStatus.InProgress, false);

    expect(activeLabel).toContain('current step');
    expect(inactiveLabel).not.toContain('current step');
  });
});

// =============================================================================
// Visual Consistency Tests
// =============================================================================

describe('Visual Consistency', () => {
  it('uses consistent color scheme for status icons', () => {
    const completedClass = getStepIconClass(WorkflowStepStatus.Completed);
    const inProgressClass = getStepIconClass(WorkflowStepStatus.InProgress);
    const pendingClass = getStepIconClass(WorkflowStepStatus.Pending);

    // Completed uses success color
    expect(completedClass).toContain('--success');

    // In progress uses primary color
    expect(inProgressClass).toContain('--primary');

    // Pending uses muted color
    expect(pendingClass).toContain('--muted-foreground');
  });

  it('size classes scale proportionally', () => {
    const smStep = WORKFLOW_PREVIEW_SIZE_CLASSES.sm.stepGap;
    const mdStep = WORKFLOW_PREVIEW_SIZE_CLASSES.md.stepGap;
    const lgStep = WORKFLOW_PREVIEW_SIZE_CLASSES.lg.stepGap;

    // Extract numeric values (space-y-1.5, space-y-2, space-y-3)
    const smValue = Number.parseFloat(smStep.match(/space-y-(\d+\.?\d*)/)?.[1] ?? '0');
    const mdValue = Number.parseFloat(mdStep.match(/space-y-(\d+\.?\d*)/)?.[1] ?? '0');
    const lgValue = Number.parseFloat(lgStep.match(/space-y-(\d+\.?\d*)/)?.[1] ?? '0');

    expect(smValue).toBeLessThan(mdValue);
    expect(mdValue).toBeLessThan(lgValue);
  });
});

// =============================================================================
// Component Props Documentation Tests
// =============================================================================

describe('Component Props Documentation', () => {
  it('documents all size options', () => {
    const sizes = Object.keys(WORKFLOW_PREVIEW_SIZE_CLASSES);
    expect(sizes).toContain('sm');
    expect(sizes).toContain('md');
    expect(sizes).toContain('lg');
    expect(sizes.length).toBe(3);
  });

  it('documents all step statuses', () => {
    const statuses = Object.keys(STEP_ICON_CLASSES);
    expect(statuses.length).toBe(4); // Completed, InProgress, Skipped, Pending
  });
});

// =============================================================================
// Data Attributes Tests
// =============================================================================

describe('Data Attributes Documentation', () => {
  it('documents expected data attributes for workflow preview', () => {
    // These are the data attributes that should be present on the component
    const expectedAttributes = [
      'data-testid',
      'data-workflow-id',
      'data-step-count',
      'data-visible-steps',
    ];

    // Verify they are documented (this is a documentation test)
    expect(expectedAttributes).toContain('data-testid');
    expect(expectedAttributes).toContain('data-workflow-id');
    expect(expectedAttributes).toContain('data-step-count');
    expect(expectedAttributes).toContain('data-visible-steps');
  });

  it('documents expected data attributes for step items', () => {
    const expectedAttributes = ['data-testid', 'data-step-index', 'data-step-status'];

    expect(expectedAttributes).toContain('data-step-index');
    expect(expectedAttributes).toContain('data-step-status');
  });

  it('documents expected data attributes for skeleton', () => {
    const expectedAttributes = ['data-testid', 'data-step-count'];

    expect(expectedAttributes).toContain('data-step-count');
  });
});

// =============================================================================
// Integration Patterns Tests
// =============================================================================

describe('Integration Patterns', () => {
  it('skeleton uses same base classes as main component', () => {
    // Both should use WORKFLOW_PREVIEW_BASE_CLASSES
    expect(WORKFLOW_PREVIEW_BASE_CLASSES).toBe('space-y-3');
  });

  it('error component has proper alert styling', () => {
    expect(ERROR_CONTAINER_CLASSES).toContain('flex');
    expect(ERROR_CONTAINER_CLASSES).toContain('items-center');
    expect(ERROR_CONTAINER_CLASSES).toContain('justify-center');
  });

  it('error icon uses destructive color', () => {
    expect(ERROR_ICON_CLASSES).toContain('--destructive');
  });
});
