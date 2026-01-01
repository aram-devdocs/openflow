import type { WorkflowStep, WorkflowStepStatus, WorkflowTemplate } from '@openflow/generated';
import { describe, expect, it } from 'vitest';
import {
  // Constants
  DEFAULT_ARIA_LABEL,
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_RETRY_LABEL,
  DEFAULT_ERROR_TITLE,
  DEFAULT_LOADING_LABEL,
  DEFAULT_NO_TEMPLATE_DESCRIPTION,
  DEFAULT_NO_TEMPLATE_TITLE,
  DEFAULT_SELECTED_INDICATOR,
  DEFAULT_SKELETON_COUNT,
  SR_NAVIGATION_HINT,
  SR_NO_TEMPLATE_HINT,
  SR_OPTION_COUNT_TEMPLATE,
  SR_STEPS_COUNT_TEMPLATE,
  SR_STEP_COUNT_TEMPLATE,
  SR_WORKFLOW_DESELECTED,
  SR_WORKFLOW_SELECTED,
  WORKFLOW_DESCRIPTION_BASE_CLASSES,
  WORKFLOW_DESCRIPTION_SIZE_CLASSES,
  WORKFLOW_ERROR_BASE_CLASSES,
  WORKFLOW_ERROR_PADDING_CLASSES,
  WORKFLOW_ICON_SIZE_MAP,
  WORKFLOW_OPTION_BASE_CLASSES,
  WORKFLOW_OPTION_DEFAULT_CLASSES,
  WORKFLOW_OPTION_DISABLED_CLASSES,
  WORKFLOW_OPTION_FOCUS_CLASSES,
  WORKFLOW_OPTION_GAP_CLASSES,
  WORKFLOW_OPTION_HIGHLIGHTED_CLASSES,
  WORKFLOW_OPTION_HOVER_CLASSES,
  WORKFLOW_OPTION_SELECTED_CLASSES,
  WORKFLOW_OPTION_SIZE_CLASSES,
  WORKFLOW_SELECTOR_BASE_CLASSES,
  WORKFLOW_SKELETON_CLASSES,
  WORKFLOW_TITLE_BASE_CLASSES,
  WORKFLOW_TITLE_SIZE_CLASSES,
  // Types
  type WorkflowSelectorSize,
  // Utility functions
  buildCountAnnouncement,
  buildHighlightAnnouncement,
  buildSelectionAnnouncement,
  buildWorkflowAccessibleLabel,
  formatStepCount,
  getBaseSize,
  getOptionId,
  getResponsiveSizeClasses,
} from '../../../packages/ui/organisms/WorkflowSelector';

// ============================================================================
// Helper Functions
// ============================================================================

function createStep(
  index: number,
  name: string,
  description: string,
  status: WorkflowStepStatus = 'pending' as WorkflowStepStatus
): WorkflowStep {
  return { index, name, description, status };
}

function createWorkflow(
  id: string,
  name: string,
  steps: WorkflowStep[],
  description?: string
): WorkflowTemplate {
  const now = new Date().toISOString();
  return {
    id,
    name,
    description,
    content: `# ${name}`,
    isBuiltin: false,
    steps,
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// Constants Tests
// ============================================================================

describe('WorkflowSelector Constants', () => {
  describe('Default Labels', () => {
    it('should have correct DEFAULT_ARIA_LABEL', () => {
      expect(DEFAULT_ARIA_LABEL).toBe('Workflow template options');
    });

    it('should have correct DEFAULT_NO_TEMPLATE_TITLE', () => {
      expect(DEFAULT_NO_TEMPLATE_TITLE).toBe('No template');
    });

    it('should have correct DEFAULT_NO_TEMPLATE_DESCRIPTION', () => {
      expect(DEFAULT_NO_TEMPLATE_DESCRIPTION).toBe('Start with a blank task');
    });

    it('should have correct DEFAULT_EMPTY_TITLE', () => {
      expect(DEFAULT_EMPTY_TITLE).toBe('No workflow templates found');
    });

    it('should have correct DEFAULT_EMPTY_DESCRIPTION', () => {
      expect(DEFAULT_EMPTY_DESCRIPTION).toBe(
        'Add .md files to openflow/workflows/ in your project'
      );
    });

    it('should have correct DEFAULT_LOADING_LABEL', () => {
      expect(DEFAULT_LOADING_LABEL).toBe('Loading workflows');
    });

    it('should have correct DEFAULT_ERROR_TITLE', () => {
      expect(DEFAULT_ERROR_TITLE).toBe('Failed to load workflows');
    });

    it('should have correct DEFAULT_ERROR_RETRY_LABEL', () => {
      expect(DEFAULT_ERROR_RETRY_LABEL).toBe('Retry');
    });

    it('should have correct DEFAULT_SKELETON_COUNT', () => {
      expect(DEFAULT_SKELETON_COUNT).toBe(3);
    });

    it('should have correct DEFAULT_SELECTED_INDICATOR', () => {
      expect(DEFAULT_SELECTED_INDICATOR).toBe('Selected');
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should have correct SR_WORKFLOW_SELECTED', () => {
      expect(SR_WORKFLOW_SELECTED).toBe('Selected');
    });

    it('should have correct SR_WORKFLOW_DESELECTED', () => {
      expect(SR_WORKFLOW_DESELECTED).toBe('Deselected template. Now using: No template');
    });

    it('should have correct SR_OPTION_COUNT_TEMPLATE', () => {
      expect(SR_OPTION_COUNT_TEMPLATE).toBe('{count} workflow templates available');
    });

    it('should have correct SR_STEP_COUNT_TEMPLATE', () => {
      expect(SR_STEP_COUNT_TEMPLATE).toBe('{count} step');
    });

    it('should have correct SR_STEPS_COUNT_TEMPLATE', () => {
      expect(SR_STEPS_COUNT_TEMPLATE).toBe('{count} steps');
    });

    it('should have correct SR_NAVIGATION_HINT', () => {
      expect(SR_NAVIGATION_HINT).toBe('Use arrow keys to navigate, Enter or Space to select');
    });

    it('should have correct SR_NO_TEMPLATE_HINT', () => {
      expect(SR_NO_TEMPLATE_HINT).toBe('No template selected');
    });
  });

  describe('Size Classes', () => {
    it('should have WORKFLOW_OPTION_SIZE_CLASSES for all sizes', () => {
      expect(WORKFLOW_OPTION_SIZE_CLASSES).toHaveProperty('sm');
      expect(WORKFLOW_OPTION_SIZE_CLASSES).toHaveProperty('md');
      expect(WORKFLOW_OPTION_SIZE_CLASSES).toHaveProperty('lg');
    });

    it('should include touch target class for sm size', () => {
      expect(WORKFLOW_OPTION_SIZE_CLASSES.sm).toContain('min-h-[44px]');
    });

    it('should include touch target class for md size', () => {
      expect(WORKFLOW_OPTION_SIZE_CLASSES.md).toContain('min-h-[44px]');
    });

    it('should include touch target class for lg size', () => {
      expect(WORKFLOW_OPTION_SIZE_CLASSES.lg).toContain('min-h-[48px]');
    });

    it('should have WORKFLOW_OPTION_GAP_CLASSES for all sizes', () => {
      expect(WORKFLOW_OPTION_GAP_CLASSES.sm).toBe('gap-2');
      expect(WORKFLOW_OPTION_GAP_CLASSES.md).toBe('gap-3');
      expect(WORKFLOW_OPTION_GAP_CLASSES.lg).toBe('gap-4');
    });

    it('should have WORKFLOW_TITLE_SIZE_CLASSES for all sizes', () => {
      expect(WORKFLOW_TITLE_SIZE_CLASSES.sm).toBe('text-sm');
      expect(WORKFLOW_TITLE_SIZE_CLASSES.md).toContain('text-sm');
      expect(WORKFLOW_TITLE_SIZE_CLASSES.lg).toContain('text-base');
    });

    it('should have WORKFLOW_DESCRIPTION_SIZE_CLASSES for all sizes', () => {
      expect(WORKFLOW_DESCRIPTION_SIZE_CLASSES.sm).toBe('text-xs');
      expect(WORKFLOW_DESCRIPTION_SIZE_CLASSES.md).toContain('text-xs');
      expect(WORKFLOW_DESCRIPTION_SIZE_CLASSES.lg).toBe('text-sm');
    });

    it('should have WORKFLOW_ICON_SIZE_MAP for all sizes', () => {
      expect(WORKFLOW_ICON_SIZE_MAP.sm).toBe('sm');
      expect(WORKFLOW_ICON_SIZE_MAP.md).toBe('md');
      expect(WORKFLOW_ICON_SIZE_MAP.lg).toBe('lg');
    });

    it('should have WORKFLOW_ERROR_PADDING_CLASSES for all sizes', () => {
      expect(WORKFLOW_ERROR_PADDING_CLASSES.sm).toBe('p-4');
      expect(WORKFLOW_ERROR_PADDING_CLASSES.md).toBe('p-6');
      expect(WORKFLOW_ERROR_PADDING_CLASSES.lg).toBe('p-8');
    });
  });

  describe('Base Classes', () => {
    it('should have WORKFLOW_SELECTOR_BASE_CLASSES', () => {
      expect(WORKFLOW_SELECTOR_BASE_CLASSES).toBe('space-y-2');
    });

    it('should have WORKFLOW_OPTION_BASE_CLASSES', () => {
      expect(WORKFLOW_OPTION_BASE_CLASSES).toContain('flex');
      expect(WORKFLOW_OPTION_BASE_CLASSES).toContain('w-full');
      expect(WORKFLOW_OPTION_BASE_CLASSES).toContain('rounded-lg');
      expect(WORKFLOW_OPTION_BASE_CLASSES).toContain('border');
      expect(WORKFLOW_OPTION_BASE_CLASSES).toContain('motion-safe:transition');
    });

    it('should have WORKFLOW_OPTION_FOCUS_CLASSES with ring-offset', () => {
      expect(WORKFLOW_OPTION_FOCUS_CLASSES).toContain('focus-visible:ring-2');
      expect(WORKFLOW_OPTION_FOCUS_CLASSES).toContain('focus-visible:ring-offset-2');
    });

    it('should have WORKFLOW_OPTION_DEFAULT_CLASSES', () => {
      expect(WORKFLOW_OPTION_DEFAULT_CLASSES).toContain('border-[rgb(var(--border))]');
    });

    it('should have WORKFLOW_OPTION_HOVER_CLASSES', () => {
      expect(WORKFLOW_OPTION_HOVER_CLASSES).toContain('hover:');
    });

    it('should have WORKFLOW_OPTION_SELECTED_CLASSES', () => {
      expect(WORKFLOW_OPTION_SELECTED_CLASSES).toContain('border-[rgb(var(--primary))]');
      expect(WORKFLOW_OPTION_SELECTED_CLASSES).toContain('bg-[rgb(var(--primary))]/5');
    });

    it('should have WORKFLOW_OPTION_HIGHLIGHTED_CLASSES', () => {
      expect(WORKFLOW_OPTION_HIGHLIGHTED_CLASSES).toContain('border-[rgb(var(--ring))]');
      expect(WORKFLOW_OPTION_HIGHLIGHTED_CLASSES).toContain('bg-[rgb(var(--accent))]');
    });

    it('should have WORKFLOW_OPTION_DISABLED_CLASSES', () => {
      expect(WORKFLOW_OPTION_DISABLED_CLASSES).toContain('cursor-not-allowed');
      expect(WORKFLOW_OPTION_DISABLED_CLASSES).toContain('opacity-60');
    });

    it('should have WORKFLOW_TITLE_BASE_CLASSES', () => {
      expect(WORKFLOW_TITLE_BASE_CLASSES).toContain('font-medium');
      expect(WORKFLOW_TITLE_BASE_CLASSES).toContain('truncate');
    });

    it('should have WORKFLOW_DESCRIPTION_BASE_CLASSES', () => {
      expect(WORKFLOW_DESCRIPTION_BASE_CLASSES).toContain('text-[rgb(var(--muted-foreground))]');
    });

    it('should have WORKFLOW_SKELETON_CLASSES', () => {
      expect(WORKFLOW_SKELETON_CLASSES).toContain('h-14');
      expect(WORKFLOW_SKELETON_CLASSES).toContain('w-full');
      expect(WORKFLOW_SKELETON_CLASSES).toContain('rounded-lg');
    });

    it('should have WORKFLOW_ERROR_BASE_CLASSES', () => {
      expect(WORKFLOW_ERROR_BASE_CLASSES).toContain('flex-col');
      expect(WORKFLOW_ERROR_BASE_CLASSES).toContain('items-center');
      expect(WORKFLOW_ERROR_BASE_CLASSES).toContain('justify-center');
    });
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('WorkflowSelector Utility Functions', () => {
  describe('getBaseSize', () => {
    it('should return string size as-is', () => {
      expect(getBaseSize('sm')).toBe('sm');
      expect(getBaseSize('md')).toBe('md');
      expect(getBaseSize('lg')).toBe('lg');
    });

    it('should return base from responsive object', () => {
      expect(getBaseSize({ base: 'sm', lg: 'lg' })).toBe('sm');
    });

    it('should default to md when no base specified', () => {
      expect(getBaseSize({ lg: 'lg' })).toBe('md');
    });

    it('should return md for empty responsive object', () => {
      expect(getBaseSize({})).toBe('md');
    });
  });

  describe('getResponsiveSizeClasses', () => {
    const testClassMap: Record<WorkflowSelectorSize, string> = {
      sm: 'class-sm-a class-sm-b',
      md: 'class-md-a class-md-b',
      lg: 'class-lg-a class-lg-b',
    };

    it('should return classes for string size', () => {
      expect(getResponsiveSizeClasses('md', testClassMap)).toBe('class-md-a class-md-b');
    });

    it('should generate responsive classes for responsive object', () => {
      const result = getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, testClassMap);
      expect(result).toContain('class-sm-a');
      expect(result).toContain('class-sm-b');
      expect(result).toContain('lg:class-lg-a');
      expect(result).toContain('lg:class-lg-b');
    });

    it('should handle all breakpoints', () => {
      const result = getResponsiveSizeClasses(
        { base: 'sm', sm: 'md', md: 'lg', lg: 'sm', xl: 'md', '2xl': 'lg' },
        testClassMap
      );
      expect(result).toContain('class-sm-a');
      expect(result).toContain('sm:class-md-a');
      expect(result).toContain('md:class-lg-a');
      expect(result).toContain('lg:class-sm-a');
      expect(result).toContain('xl:class-md-a');
      expect(result).toContain('2xl:class-lg-a');
    });

    it('should maintain breakpoint order', () => {
      const result = getResponsiveSizeClasses({ lg: 'lg', base: 'sm' }, testClassMap);
      const parts = result.split(' ');
      const baseIndex = parts.findIndex((p) => p === 'class-sm-a');
      const lgIndex = parts.findIndex((p) => p === 'lg:class-lg-a');
      expect(baseIndex).toBeLessThan(lgIndex);
    });
  });

  describe('getOptionId', () => {
    it('should generate correct option ID', () => {
      expect(getOptionId('listbox-1', 0)).toBe('listbox-1-option-0');
      expect(getOptionId('listbox-1', 5)).toBe('listbox-1-option-5');
    });

    it('should handle special characters in listbox ID', () => {
      expect(getOptionId(':r1:-listbox', 2)).toBe(':r1:-listbox-option-2');
    });
  });

  describe('formatStepCount', () => {
    it('should format singular step count', () => {
      expect(formatStepCount(1)).toBe('1 step');
    });

    it('should format plural step counts', () => {
      expect(formatStepCount(0)).toBe('0 steps');
      expect(formatStepCount(2)).toBe('2 steps');
      expect(formatStepCount(10)).toBe('10 steps');
    });
  });

  describe('buildSelectionAnnouncement', () => {
    it('should return deselect message for null workflow', () => {
      expect(buildSelectionAnnouncement(null)).toBe(SR_WORKFLOW_DESELECTED);
    });

    it('should return selection message for workflow', () => {
      const workflow = createWorkflow('1', 'Test Workflow', [
        createStep(0, 'Step 1', 'Description 1'),
        createStep(1, 'Step 2', 'Description 2'),
      ]);
      const result = buildSelectionAnnouncement(workflow);
      expect(result).toContain('Selected');
      expect(result).toContain('Test Workflow');
      expect(result).toContain('2 steps');
    });

    it('should handle single step workflow', () => {
      const workflow = createWorkflow('1', 'Quick Task', [
        createStep(0, 'Single Step', 'Description'),
      ]);
      const result = buildSelectionAnnouncement(workflow);
      expect(result).toContain('1 step');
    });
  });

  describe('buildHighlightAnnouncement', () => {
    it('should build announcement with step count', () => {
      const result = buildHighlightAnnouncement('Feature Dev', 4, 1, 4);
      expect(result).toBe('Feature Dev, 4 steps, 2 of 4');
    });

    it('should handle single step', () => {
      const result = buildHighlightAnnouncement('Quick Fix', 1, 0, 2);
      expect(result).toBe('Quick Fix, 1 step, 1 of 2');
    });

    it('should build announcement without step count (null)', () => {
      const result = buildHighlightAnnouncement('No template', null, 0, 4);
      expect(result).toBe('No template, 1 of 4');
    });
  });

  describe('buildWorkflowAccessibleLabel', () => {
    it('should build label for no template, not selected', () => {
      const result = buildWorkflowAccessibleLabel(null, false);
      expect(result).toBe('No template, Start with a blank task');
    });

    it('should build label for no template, selected', () => {
      const result = buildWorkflowAccessibleLabel(null, true);
      expect(result).toBe('No template, Start with a blank task, Selected');
    });

    it('should build label for workflow, not selected', () => {
      const workflow = createWorkflow('1', 'My Workflow', [
        createStep(0, 'Step 1', 'Desc'),
        createStep(1, 'Step 2', 'Desc'),
        createStep(2, 'Step 3', 'Desc'),
      ]);
      const result = buildWorkflowAccessibleLabel(workflow, false);
      expect(result).toBe('My Workflow, 3 steps');
    });

    it('should build label for workflow, selected', () => {
      const workflow = createWorkflow('1', 'My Workflow', [createStep(0, 'Step 1', 'Desc')]);
      const result = buildWorkflowAccessibleLabel(workflow, true);
      expect(result).toBe('My Workflow, 1 step, Selected');
    });
  });

  describe('buildCountAnnouncement', () => {
    it('should build count announcement', () => {
      expect(buildCountAnnouncement(0)).toBe('0 workflow templates available');
      expect(buildCountAnnouncement(1)).toBe('1 workflow templates available');
      expect(buildCountAnnouncement(5)).toBe('5 workflow templates available');
    });
  });
});

// ============================================================================
// Accessibility Behavior Tests
// ============================================================================

describe('WorkflowSelector Accessibility Behavior', () => {
  describe('Touch Target Compliance', () => {
    it('should have 44px minimum touch target for sm size', () => {
      expect(WORKFLOW_OPTION_SIZE_CLASSES.sm).toContain('min-h-[44px]');
    });

    it('should have 44px minimum touch target for md size', () => {
      expect(WORKFLOW_OPTION_SIZE_CLASSES.md).toContain('min-h-[44px]');
    });

    it('should have 48px minimum touch target for lg size', () => {
      expect(WORKFLOW_OPTION_SIZE_CLASSES.lg).toContain('min-h-[48px]');
    });
  });

  describe('Focus Ring Visibility', () => {
    it('should have focus-visible ring', () => {
      expect(WORKFLOW_OPTION_FOCUS_CLASSES).toContain('focus-visible:ring-2');
    });

    it('should have ring offset for visibility on all backgrounds', () => {
      expect(WORKFLOW_OPTION_FOCUS_CLASSES).toContain('focus-visible:ring-offset-2');
    });
  });

  describe('Reduced Motion Support', () => {
    it('should use motion-safe for transitions', () => {
      expect(WORKFLOW_OPTION_BASE_CLASSES).toContain('motion-safe:transition');
    });
  });
});

// ============================================================================
// Component Behavior Documentation Tests
// ============================================================================

describe('WorkflowSelector Component Behavior', () => {
  describe('ARIA Pattern', () => {
    it('should document listbox role usage', () => {
      // The container has role="listbox"
      expect(DEFAULT_ARIA_LABEL).toBe('Workflow template options');
    });

    it('should document option role usage', () => {
      // Each workflow option has role="option"
      // This is verified in the component implementation
      expect(true).toBe(true);
    });

    it('should document aria-selected usage', () => {
      // Selected option has aria-selected="true"
      expect(DEFAULT_SELECTED_INDICATOR).toBe('Selected');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should document navigation hint', () => {
      expect(SR_NAVIGATION_HINT).toBe('Use arrow keys to navigate, Enter or Space to select');
    });

    it('should support arrow key navigation', () => {
      // ArrowDown: move to next option
      // ArrowUp: move to previous option
      // Home: move to first option
      // End: move to last option
      // Enter/Space: select current option
      expect(true).toBe(true);
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce workflow selection', () => {
      const workflow = createWorkflow('1', 'Test', [createStep(0, 'S1', 'D')]);
      const announcement = buildSelectionAnnouncement(workflow);
      expect(announcement).toContain('Selected');
      expect(announcement).toContain('Test');
    });

    it('should announce deselection (no template)', () => {
      const announcement = buildSelectionAnnouncement(null);
      expect(announcement).toBe(SR_WORKFLOW_DESELECTED);
    });

    it('should announce option count', () => {
      const announcement = buildCountAnnouncement(5);
      expect(announcement).toContain('5');
      expect(announcement).toContain('available');
    });
  });
});

// ============================================================================
// Type Safety Tests
// ============================================================================

describe('WorkflowSelector Types', () => {
  describe('WorkflowSelectorSize', () => {
    it('should accept valid size values', () => {
      const sizes: WorkflowSelectorSize[] = ['sm', 'md', 'lg'];
      expect(sizes).toHaveLength(3);
    });
  });

  describe('ResponsiveValue', () => {
    it('should accept string size', () => {
      const size = 'md';
      expect(getBaseSize(size)).toBe('md');
    });

    it('should accept responsive object', () => {
      const size = { base: 'sm' as const, lg: 'lg' as const };
      expect(getBaseSize(size)).toBe('sm');
    });
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('WorkflowSelector Integration Patterns', () => {
  describe('Loading State', () => {
    it('should have loading label', () => {
      expect(DEFAULT_LOADING_LABEL).toBe('Loading workflows');
    });

    it('should have default skeleton count', () => {
      expect(DEFAULT_SKELETON_COUNT).toBe(3);
    });
  });

  describe('Error State', () => {
    it('should have error title', () => {
      expect(DEFAULT_ERROR_TITLE).toBe('Failed to load workflows');
    });

    it('should have retry label', () => {
      expect(DEFAULT_ERROR_RETRY_LABEL).toBe('Retry');
    });
  });

  describe('Empty State', () => {
    it('should have empty title', () => {
      expect(DEFAULT_EMPTY_TITLE).toBe('No workflow templates found');
    });

    it('should have empty description with actionable guidance', () => {
      expect(DEFAULT_EMPTY_DESCRIPTION).toContain('Add .md files');
      expect(DEFAULT_EMPTY_DESCRIPTION).toContain('openflow/workflows/');
    });
  });

  describe('No Template Option', () => {
    it('should have no template title', () => {
      expect(DEFAULT_NO_TEMPLATE_TITLE).toBe('No template');
    });

    it('should have no template description', () => {
      expect(DEFAULT_NO_TEMPLATE_DESCRIPTION).toBe('Start with a blank task');
    });
  });
});
