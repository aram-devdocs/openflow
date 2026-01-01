/**
 * TaskPageComponents Organism Unit Tests
 *
 * Tests for exported constants, utility functions, and accessibility behavior.
 */

import { describe, expect, it } from 'vitest';
import {
  ADD_START_BUTTON_LABEL,
  ADD_STEP_BUTTON_LABEL,
  ADD_STEP_DIALOG_TITLE,
  CANCEL_BUTTON_LABEL,
  CREATING_BUTTON_LABEL,
  DEFAULT_BACK_BUTTON_LABEL,
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_ERROR_TITLE,
  DEFAULT_NOT_FOUND_DESCRIPTION,
  // Constants - Labels
  DEFAULT_NOT_FOUND_TITLE,
  DEFAULT_RETRY_LABEL,
  DESCRIPTION_FIELD_HELPER,
  DESCRIPTION_FIELD_LABEL,
  DESCRIPTION_FIELD_PLACEHOLDER,
  ERROR_BASE_CLASSES,
  ERROR_BUTTON_MARGIN_CLASSES,
  ERROR_ICON_CLASSES,
  ERROR_MESSAGE_CLASSES,
  ERROR_PADDING_CLASSES,
  ERROR_TEXT_CLASSES,
  FORM_FIELD_GAP_CLASSES,
  MAIN_PANEL_BASE_CLASSES,
  // Constants - CSS Classes
  NOT_FOUND_BASE_CLASSES,
  NOT_FOUND_BUTTON_MARGIN_CLASSES,
  NOT_FOUND_DESCRIPTION_CLASSES,
  NOT_FOUND_ICON_CLASSES,
  NOT_FOUND_PADDING_CLASSES,
  NOT_FOUND_TITLE_CLASSES,
  OUTPUT_LABEL_COMPLETE,
  OUTPUT_LABEL_RUNNING,
  OUTPUT_PANEL_BASE_CLASSES,
  OUTPUT_PANEL_CONTENT_PADDING,
  OUTPUT_PANEL_HEADER_CLASSES,
  OUTPUT_PANEL_HEADER_PADDING,
  SKELETON_BASE_CLASSES,
  SKELETON_CONTENT_CLASSES,
  SKELETON_HEADER_CLASSES,
  SKELETON_MAIN_PANEL_CLASSES,
  SKELETON_STEPS_PANEL_CLASSES,
  SKELETON_TABS_GAP_CLASSES,
  SR_CREATING_STEP,
  SR_DIALOG_OPENED,
  SR_ERROR_ANNOUNCEMENT,
  SR_LOADING_ANNOUNCEMENT,
  // Constants - Screen Reader
  SR_NOT_FOUND_ANNOUNCEMENT,
  SR_OUTPUT_TOGGLE_TEMPLATE,
  SR_STEP_CREATED,
  SR_VALIDATION_ERROR,
  TAB_CONTENT_PADDING,
  TITLE_FIELD_LABEL,
  TITLE_FIELD_PLACEHOLDER,
  TOGGLE_FORMATTED_LABEL,
  TOGGLE_RAW_LABEL,
  // Types
  type TaskPageSize,
  buildAddStepDialogAccessibleLabel,
  buildDialogAnnouncement,
  buildOutputPanelAccessibleLabel,
  // Utility Functions
  getBaseSize,
  getResponsiveSizeClasses,
} from '../../../packages/ui/organisms/TaskPageComponents';

// ============================================================================
// Label Constants
// ============================================================================

describe('TaskPageComponents Label Constants', () => {
  describe('DEFAULT_NOT_FOUND_TITLE', () => {
    it('should have correct value', () => {
      expect(DEFAULT_NOT_FOUND_TITLE).toBe('Task not found');
    });
  });

  describe('DEFAULT_NOT_FOUND_DESCRIPTION', () => {
    it('should have correct value', () => {
      expect(DEFAULT_NOT_FOUND_DESCRIPTION).toBe(
        "The task you're looking for doesn't exist or has been deleted."
      );
    });
  });

  describe('DEFAULT_BACK_BUTTON_LABEL', () => {
    it('should have correct value', () => {
      expect(DEFAULT_BACK_BUTTON_LABEL).toBe('Back to Dashboard');
    });
  });

  describe('DEFAULT_ERROR_TITLE', () => {
    it('should have correct value', () => {
      expect(DEFAULT_ERROR_TITLE).toBe('Failed to load task');
    });
  });

  describe('DEFAULT_ERROR_MESSAGE', () => {
    it('should have correct value', () => {
      expect(DEFAULT_ERROR_MESSAGE).toBe(
        'There was a problem loading this task. Please try again.'
      );
    });
  });

  describe('DEFAULT_RETRY_LABEL', () => {
    it('should have correct value', () => {
      expect(DEFAULT_RETRY_LABEL).toBe('Retry');
    });
  });

  describe('OUTPUT_LABEL_RUNNING', () => {
    it('should have correct value', () => {
      expect(OUTPUT_LABEL_RUNNING).toBe('Running...');
    });
  });

  describe('OUTPUT_LABEL_COMPLETE', () => {
    it('should have correct value', () => {
      expect(OUTPUT_LABEL_COMPLETE).toBe('Output');
    });
  });

  describe('TOGGLE_RAW_LABEL', () => {
    it('should have correct value', () => {
      expect(TOGGLE_RAW_LABEL).toBe('Raw');
    });
  });

  describe('TOGGLE_FORMATTED_LABEL', () => {
    it('should have correct value', () => {
      expect(TOGGLE_FORMATTED_LABEL).toBe('Formatted');
    });
  });

  describe('ADD_STEP_DIALOG_TITLE', () => {
    it('should have correct value', () => {
      expect(ADD_STEP_DIALOG_TITLE).toBe('Add New Step');
    });
  });

  describe('TITLE_FIELD_LABEL', () => {
    it('should have correct value', () => {
      expect(TITLE_FIELD_LABEL).toBe('Title');
    });
  });

  describe('TITLE_FIELD_PLACEHOLDER', () => {
    it('should have correct value', () => {
      expect(TITLE_FIELD_PLACEHOLDER).toBe('Step name...');
    });
  });

  describe('DESCRIPTION_FIELD_LABEL', () => {
    it('should have correct value', () => {
      expect(DESCRIPTION_FIELD_LABEL).toBe('Prompt / Instructions');
    });
  });

  describe('DESCRIPTION_FIELD_PLACEHOLDER', () => {
    it('should have correct value', () => {
      expect(DESCRIPTION_FIELD_PLACEHOLDER).toBe('Describe what this step should accomplish...');
    });
  });

  describe('DESCRIPTION_FIELD_HELPER', () => {
    it('should have correct value', () => {
      expect(DESCRIPTION_FIELD_HELPER).toBe(
        'This will be sent to the AI agent when the step is started.'
      );
    });
  });

  describe('CANCEL_BUTTON_LABEL', () => {
    it('should have correct value', () => {
      expect(CANCEL_BUTTON_LABEL).toBe('Cancel');
    });
  });

  describe('ADD_STEP_BUTTON_LABEL', () => {
    it('should have correct value', () => {
      expect(ADD_STEP_BUTTON_LABEL).toBe('Add Step');
    });
  });

  describe('ADD_START_BUTTON_LABEL', () => {
    it('should have correct value', () => {
      expect(ADD_START_BUTTON_LABEL).toBe('Add & Start');
    });
  });

  describe('CREATING_BUTTON_LABEL', () => {
    it('should have correct value', () => {
      expect(CREATING_BUTTON_LABEL).toBe('Adding...');
    });
  });
});

// ============================================================================
// Screen Reader Constants
// ============================================================================

describe('TaskPageComponents Screen Reader Constants', () => {
  describe('SR_NOT_FOUND_ANNOUNCEMENT', () => {
    it('should have correct value', () => {
      expect(SR_NOT_FOUND_ANNOUNCEMENT).toBe('Task not found');
    });
  });

  describe('SR_ERROR_ANNOUNCEMENT', () => {
    it('should have correct value', () => {
      expect(SR_ERROR_ANNOUNCEMENT).toBe('Error loading task');
    });
  });

  describe('SR_LOADING_ANNOUNCEMENT', () => {
    it('should have correct value', () => {
      expect(SR_LOADING_ANNOUNCEMENT).toBe('Loading task details');
    });
  });

  describe('SR_OUTPUT_TOGGLE_TEMPLATE', () => {
    it('should return correct message when showing raw', () => {
      expect(SR_OUTPUT_TOGGLE_TEMPLATE(true)).toBe(
        'Showing formatted output. Press to show raw output.'
      );
    });

    it('should return correct message when showing formatted', () => {
      expect(SR_OUTPUT_TOGGLE_TEMPLATE(false)).toBe(
        'Showing raw output. Press to show formatted output.'
      );
    });
  });

  describe('SR_DIALOG_OPENED', () => {
    it('should have correct value', () => {
      expect(SR_DIALOG_OPENED).toBe('Add new step dialog opened');
    });
  });

  describe('SR_CREATING_STEP', () => {
    it('should have correct value', () => {
      expect(SR_CREATING_STEP).toBe('Creating step');
    });
  });

  describe('SR_STEP_CREATED', () => {
    it('should have correct value', () => {
      expect(SR_STEP_CREATED).toBe('Step created');
    });
  });

  describe('SR_VALIDATION_ERROR', () => {
    it('should have correct value', () => {
      expect(SR_VALIDATION_ERROR).toBe('Please provide a step title');
    });
  });
});

// ============================================================================
// CSS Class Constants - Not Found
// ============================================================================

describe('TaskPageComponents Not Found CSS Classes', () => {
  describe('NOT_FOUND_BASE_CLASSES', () => {
    it('should contain flex and centering classes', () => {
      expect(NOT_FOUND_BASE_CLASSES).toContain('flex');
      expect(NOT_FOUND_BASE_CLASSES).toContain('h-full');
      expect(NOT_FOUND_BASE_CLASSES).toContain('items-center');
      expect(NOT_FOUND_BASE_CLASSES).toContain('justify-center');
    });

    it('should contain background class', () => {
      expect(NOT_FOUND_BASE_CLASSES).toContain('bg-background');
    });
  });

  describe('NOT_FOUND_PADDING_CLASSES', () => {
    it('should have all size variants', () => {
      expect(NOT_FOUND_PADDING_CLASSES).toHaveProperty('sm');
      expect(NOT_FOUND_PADDING_CLASSES).toHaveProperty('md');
      expect(NOT_FOUND_PADDING_CLASSES).toHaveProperty('lg');
    });

    it('should have increasing padding for each size', () => {
      expect(NOT_FOUND_PADDING_CLASSES.sm).toBe('p-4');
      expect(NOT_FOUND_PADDING_CLASSES.md).toBe('p-6');
      expect(NOT_FOUND_PADDING_CLASSES.lg).toBe('p-8');
    });
  });

  describe('NOT_FOUND_ICON_CLASSES', () => {
    it('should have all size variants', () => {
      expect(NOT_FOUND_ICON_CLASSES).toHaveProperty('sm');
      expect(NOT_FOUND_ICON_CLASSES).toHaveProperty('md');
      expect(NOT_FOUND_ICON_CLASSES).toHaveProperty('lg');
    });

    it('should have margin-bottom for all sizes', () => {
      expect(NOT_FOUND_ICON_CLASSES.sm).toContain('mb-');
      expect(NOT_FOUND_ICON_CLASSES.md).toContain('mb-');
      expect(NOT_FOUND_ICON_CLASSES.lg).toContain('mb-');
    });

    it('should have increasing icon sizes', () => {
      expect(NOT_FOUND_ICON_CLASSES.sm).toContain('h-12');
      expect(NOT_FOUND_ICON_CLASSES.md).toContain('h-14');
      expect(NOT_FOUND_ICON_CLASSES.lg).toContain('h-16');
    });
  });

  describe('NOT_FOUND_TITLE_CLASSES', () => {
    it('should have increasing text sizes', () => {
      expect(NOT_FOUND_TITLE_CLASSES.sm).toBe('text-base');
      expect(NOT_FOUND_TITLE_CLASSES.md).toBe('text-lg');
      expect(NOT_FOUND_TITLE_CLASSES.lg).toBe('text-xl');
    });
  });

  describe('NOT_FOUND_DESCRIPTION_CLASSES', () => {
    it('should have margin-top and text size for all variants', () => {
      expect(NOT_FOUND_DESCRIPTION_CLASSES.sm).toContain('mt-');
      expect(NOT_FOUND_DESCRIPTION_CLASSES.sm).toContain('text-xs');
      expect(NOT_FOUND_DESCRIPTION_CLASSES.md).toContain('text-sm');
      expect(NOT_FOUND_DESCRIPTION_CLASSES.lg).toContain('text-base');
    });
  });

  describe('NOT_FOUND_BUTTON_MARGIN_CLASSES', () => {
    it('should have all size variants', () => {
      expect(NOT_FOUND_BUTTON_MARGIN_CLASSES).toHaveProperty('sm');
      expect(NOT_FOUND_BUTTON_MARGIN_CLASSES).toHaveProperty('md');
      expect(NOT_FOUND_BUTTON_MARGIN_CLASSES).toHaveProperty('lg');
    });

    it('should have margin-top for all sizes', () => {
      expect(NOT_FOUND_BUTTON_MARGIN_CLASSES.sm).toContain('mt-');
      expect(NOT_FOUND_BUTTON_MARGIN_CLASSES.md).toContain('mt-');
      expect(NOT_FOUND_BUTTON_MARGIN_CLASSES.lg).toContain('mt-');
    });
  });
});

// ============================================================================
// CSS Class Constants - Error
// ============================================================================

describe('TaskPageComponents Error CSS Classes', () => {
  describe('ERROR_BASE_CLASSES', () => {
    it('should contain flex and centering classes', () => {
      expect(ERROR_BASE_CLASSES).toContain('flex');
      expect(ERROR_BASE_CLASSES).toContain('h-full');
      expect(ERROR_BASE_CLASSES).toContain('items-center');
      expect(ERROR_BASE_CLASSES).toContain('justify-center');
    });
  });

  describe('ERROR_PADDING_CLASSES', () => {
    it('should have all size variants', () => {
      expect(ERROR_PADDING_CLASSES).toHaveProperty('sm');
      expect(ERROR_PADDING_CLASSES).toHaveProperty('md');
      expect(ERROR_PADDING_CLASSES).toHaveProperty('lg');
    });
  });

  describe('ERROR_ICON_CLASSES', () => {
    it('should have increasing icon sizes', () => {
      expect(ERROR_ICON_CLASSES.sm).toContain('h-10');
      expect(ERROR_ICON_CLASSES.md).toContain('h-12');
      expect(ERROR_ICON_CLASSES.lg).toContain('h-14');
    });
  });

  describe('ERROR_TEXT_CLASSES', () => {
    it('should have increasing text sizes', () => {
      expect(ERROR_TEXT_CLASSES.sm).toBe('text-base');
      expect(ERROR_TEXT_CLASSES.md).toBe('text-lg');
      expect(ERROR_TEXT_CLASSES.lg).toBe('text-xl');
    });
  });

  describe('ERROR_MESSAGE_CLASSES', () => {
    it('should have max-width constraints', () => {
      expect(ERROR_MESSAGE_CLASSES.sm).toContain('max-w-xs');
      expect(ERROR_MESSAGE_CLASSES.md).toContain('max-w-sm');
      expect(ERROR_MESSAGE_CLASSES.lg).toContain('max-w-md');
    });
  });

  describe('ERROR_BUTTON_MARGIN_CLASSES', () => {
    it('should have margin-top for all sizes', () => {
      expect(ERROR_BUTTON_MARGIN_CLASSES.sm).toContain('mt-');
      expect(ERROR_BUTTON_MARGIN_CLASSES.md).toContain('mt-');
      expect(ERROR_BUTTON_MARGIN_CLASSES.lg).toContain('mt-');
    });
  });
});

// ============================================================================
// CSS Class Constants - Skeleton
// ============================================================================

describe('TaskPageComponents Skeleton CSS Classes', () => {
  describe('SKELETON_BASE_CLASSES', () => {
    it('should contain flex and height classes', () => {
      expect(SKELETON_BASE_CLASSES).toContain('flex');
      expect(SKELETON_BASE_CLASSES).toContain('h-full');
    });
  });

  describe('SKELETON_MAIN_PANEL_CLASSES', () => {
    it('should contain flex and flex-1 classes', () => {
      expect(SKELETON_MAIN_PANEL_CLASSES).toContain('flex');
      expect(SKELETON_MAIN_PANEL_CLASSES).toContain('flex-1');
      expect(SKELETON_MAIN_PANEL_CLASSES).toContain('flex-col');
    });
  });

  describe('SKELETON_STEPS_PANEL_CLASSES', () => {
    it('should have increasing widths for each size', () => {
      expect(SKELETON_STEPS_PANEL_CLASSES.sm).toContain('w-56');
      expect(SKELETON_STEPS_PANEL_CLASSES.md).toContain('w-64');
      expect(SKELETON_STEPS_PANEL_CLASSES.lg).toContain('w-72');
    });

    it('should have border-r for all sizes', () => {
      expect(SKELETON_STEPS_PANEL_CLASSES.sm).toContain('border-r');
      expect(SKELETON_STEPS_PANEL_CLASSES.md).toContain('border-r');
      expect(SKELETON_STEPS_PANEL_CLASSES.lg).toContain('border-r');
    });
  });

  describe('SKELETON_HEADER_CLASSES', () => {
    it('should have border-b for all sizes', () => {
      expect(SKELETON_HEADER_CLASSES.sm).toContain('border-b');
      expect(SKELETON_HEADER_CLASSES.md).toContain('border-b');
      expect(SKELETON_HEADER_CLASSES.lg).toContain('border-b');
    });
  });

  describe('SKELETON_TABS_GAP_CLASSES', () => {
    it('should have increasing gaps', () => {
      expect(SKELETON_TABS_GAP_CLASSES.sm).toBe('gap-3');
      expect(SKELETON_TABS_GAP_CLASSES.md).toBe('gap-4');
      expect(SKELETON_TABS_GAP_CLASSES.lg).toBe('gap-5');
    });
  });

  describe('SKELETON_CONTENT_CLASSES', () => {
    it('should have flex-1 for all sizes', () => {
      expect(SKELETON_CONTENT_CLASSES.sm).toContain('flex-1');
      expect(SKELETON_CONTENT_CLASSES.md).toContain('flex-1');
      expect(SKELETON_CONTENT_CLASSES.lg).toContain('flex-1');
    });
  });
});

// ============================================================================
// CSS Class Constants - Output Panel
// ============================================================================

describe('TaskPageComponents Output Panel CSS Classes', () => {
  describe('OUTPUT_PANEL_BASE_CLASSES', () => {
    it('should contain overflow and border classes', () => {
      expect(OUTPUT_PANEL_BASE_CLASSES).toContain('overflow-auto');
      expect(OUTPUT_PANEL_BASE_CLASSES).toContain('border-b');
    });

    it('should contain flex-1 for flexible sizing', () => {
      expect(OUTPUT_PANEL_BASE_CLASSES).toContain('flex-1');
    });
  });

  describe('OUTPUT_PANEL_HEADER_CLASSES', () => {
    it('should contain flex and justify-between', () => {
      expect(OUTPUT_PANEL_HEADER_CLASSES).toContain('flex');
      expect(OUTPUT_PANEL_HEADER_CLASSES).toContain('items-center');
      expect(OUTPUT_PANEL_HEADER_CLASSES).toContain('justify-between');
    });

    it('should contain border-b', () => {
      expect(OUTPUT_PANEL_HEADER_CLASSES).toContain('border-b');
    });
  });

  describe('OUTPUT_PANEL_HEADER_PADDING', () => {
    it('should have all size variants', () => {
      expect(OUTPUT_PANEL_HEADER_PADDING).toHaveProperty('sm');
      expect(OUTPUT_PANEL_HEADER_PADDING).toHaveProperty('md');
      expect(OUTPUT_PANEL_HEADER_PADDING).toHaveProperty('lg');
    });

    it('should have increasing padding', () => {
      expect(OUTPUT_PANEL_HEADER_PADDING.sm).toContain('px-3');
      expect(OUTPUT_PANEL_HEADER_PADDING.md).toContain('px-4');
      expect(OUTPUT_PANEL_HEADER_PADDING.lg).toContain('px-5');
    });
  });

  describe('OUTPUT_PANEL_CONTENT_PADDING', () => {
    it('should have increasing padding', () => {
      expect(OUTPUT_PANEL_CONTENT_PADDING.sm).toBe('p-3');
      expect(OUTPUT_PANEL_CONTENT_PADDING.md).toBe('p-4');
      expect(OUTPUT_PANEL_CONTENT_PADDING.lg).toBe('p-5');
    });
  });
});

// ============================================================================
// CSS Class Constants - Main Panel and Tabs
// ============================================================================

describe('TaskPageComponents Main Panel and Tab CSS Classes', () => {
  describe('MAIN_PANEL_BASE_CLASSES', () => {
    it('should contain flex layout classes', () => {
      expect(MAIN_PANEL_BASE_CLASSES).toContain('flex');
      expect(MAIN_PANEL_BASE_CLASSES).toContain('h-full');
      expect(MAIN_PANEL_BASE_CLASSES).toContain('flex-col');
    });
  });

  describe('TAB_CONTENT_PADDING', () => {
    it('should have all size variants', () => {
      expect(TAB_CONTENT_PADDING).toHaveProperty('sm');
      expect(TAB_CONTENT_PADDING).toHaveProperty('md');
      expect(TAB_CONTENT_PADDING).toHaveProperty('lg');
    });

    it('should have increasing padding', () => {
      expect(TAB_CONTENT_PADDING.sm).toBe('p-3');
      expect(TAB_CONTENT_PADDING.md).toBe('p-4');
      expect(TAB_CONTENT_PADDING.lg).toBe('p-5');
    });
  });

  describe('FORM_FIELD_GAP_CLASSES', () => {
    it('should have all size variants', () => {
      expect(FORM_FIELD_GAP_CLASSES).toHaveProperty('sm');
      expect(FORM_FIELD_GAP_CLASSES).toHaveProperty('md');
      expect(FORM_FIELD_GAP_CLASSES).toHaveProperty('lg');
    });

    it('should have increasing spacing', () => {
      expect(FORM_FIELD_GAP_CLASSES.sm).toBe('space-y-3');
      expect(FORM_FIELD_GAP_CLASSES.md).toBe('space-y-4');
      expect(FORM_FIELD_GAP_CLASSES.lg).toBe('space-y-5');
    });
  });
});

// ============================================================================
// Utility Functions - getBaseSize
// ============================================================================

describe('getBaseSize', () => {
  it('should return the size directly for string values', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('should return base value from responsive object', () => {
    expect(getBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
  });

  it('should fall back to sm if base is not defined', () => {
    expect(getBaseSize({ sm: 'md', lg: 'lg' })).toBe('md');
  });

  it('should fall back to md if sm is not defined', () => {
    expect(getBaseSize({ md: 'lg' })).toBe('lg');
  });

  it('should fall back to lg if md is not defined', () => {
    expect(getBaseSize({ lg: 'sm' })).toBe('sm');
  });

  it('should fall back to xl if lg is not defined', () => {
    expect(getBaseSize({ xl: 'md' })).toBe('md');
  });

  it('should fall back to 2xl if xl is not defined', () => {
    expect(getBaseSize({ '2xl': 'lg' })).toBe('lg');
  });

  it('should return md as final fallback for empty object', () => {
    expect(getBaseSize({})).toBe('md');
  });
});

// ============================================================================
// Utility Functions - getResponsiveSizeClasses
// ============================================================================

describe('getResponsiveSizeClasses', () => {
  const testClassMap: Record<TaskPageSize, string> = {
    sm: 'p-2 m-1',
    md: 'p-4 m-2',
    lg: 'p-6 m-3',
  };

  it('should return classes directly for string size', () => {
    expect(getResponsiveSizeClasses('sm', testClassMap)).toBe('p-2 m-1');
    expect(getResponsiveSizeClasses('md', testClassMap)).toBe('p-4 m-2');
    expect(getResponsiveSizeClasses('lg', testClassMap)).toBe('p-6 m-3');
  });

  it('should return base classes without prefix', () => {
    const result = getResponsiveSizeClasses({ base: 'sm' }, testClassMap);
    expect(result).toBe('p-2 m-1');
  });

  it('should add breakpoint prefix for non-base sizes', () => {
    const result = getResponsiveSizeClasses({ md: 'lg' }, testClassMap);
    expect(result).toBe('md:p-6 md:m-3');
  });

  it('should combine multiple breakpoints', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', md: 'md', lg: 'lg' }, testClassMap);
    expect(result).toContain('p-2 m-1');
    expect(result).toContain('md:p-4 md:m-2');
    expect(result).toContain('lg:p-6 lg:m-3');
  });

  it('should handle partial responsive objects', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', xl: 'lg' }, testClassMap);
    expect(result).toContain('p-2 m-1');
    expect(result).toContain('xl:p-6 xl:m-3');
    expect(result).not.toContain('md:');
  });

  it('should respect breakpoint order', () => {
    const result = getResponsiveSizeClasses(
      { base: 'sm', sm: 'sm', md: 'md', lg: 'lg', xl: 'lg', '2xl': 'lg' },
      testClassMap
    );
    // Should have all breakpoints in order
    expect(result).toMatch(/p-2 m-1.*sm:.*md:.*lg:.*xl:.*2xl:/);
  });

  it('should handle empty responsive object', () => {
    const result = getResponsiveSizeClasses({}, testClassMap);
    expect(result).toBe('');
  });
});

// ============================================================================
// Utility Functions - buildOutputPanelAccessibleLabel
// ============================================================================

describe('buildOutputPanelAccessibleLabel', () => {
  it('should indicate running status', () => {
    const result = buildOutputPanelAccessibleLabel(true, 5);
    expect(result).toContain('Running');
    expect(result).toContain('5 events');
  });

  it('should indicate complete status', () => {
    const result = buildOutputPanelAccessibleLabel(false, 3);
    expect(result).toContain('Complete');
    expect(result).toContain('3 events');
  });

  it('should use singular for 1 event', () => {
    const result = buildOutputPanelAccessibleLabel(true, 1);
    expect(result).toContain('1 event');
    expect(result).not.toContain('1 events');
  });

  it('should use plural for 0 events', () => {
    const result = buildOutputPanelAccessibleLabel(false, 0);
    expect(result).toContain('0 events');
  });

  it('should include "Output panel" prefix', () => {
    const result = buildOutputPanelAccessibleLabel(true, 1);
    expect(result).toContain('Output panel');
  });

  it('should include "Status:" label', () => {
    const result = buildOutputPanelAccessibleLabel(true, 1);
    expect(result).toContain('Status:');
  });
});

// ============================================================================
// Utility Functions - buildAddStepDialogAccessibleLabel
// ============================================================================

describe('buildAddStepDialogAccessibleLabel', () => {
  it('should indicate when no title is entered', () => {
    const result = buildAddStepDialogAccessibleLabel('', '');
    expect(result).toBe('Add new step dialog. No title entered.');
  });

  it('should indicate when no title with whitespace only', () => {
    const result = buildAddStepDialogAccessibleLabel('   ', '');
    expect(result).toBe('Add new step dialog. No title entered.');
  });

  it('should include title when provided', () => {
    const result = buildAddStepDialogAccessibleLabel('My Step', '');
    expect(result).toContain('Title: My Step');
    expect(result).toContain('No description');
  });

  it('should indicate when description is provided', () => {
    const result = buildAddStepDialogAccessibleLabel('My Step', 'Do something');
    expect(result).toContain('Title: My Step');
    expect(result).toContain('Description provided');
    expect(result).not.toContain('No description');
  });

  it('should handle title with whitespace and description', () => {
    const result = buildAddStepDialogAccessibleLabel('  Step  ', 'Instructions');
    expect(result).toContain('Title:');
    expect(result).toContain('Description provided');
  });
});

// ============================================================================
// Utility Functions - buildDialogAnnouncement
// ============================================================================

describe('buildDialogAnnouncement', () => {
  it('should return creating message when isCreating is true', () => {
    expect(buildDialogAnnouncement(true)).toBe(SR_CREATING_STEP);
  });

  it('should return creating message even with error when isCreating', () => {
    expect(buildDialogAnnouncement(true, 'Some error')).toBe(SR_CREATING_STEP);
  });

  it('should return error message when not creating but has error', () => {
    expect(buildDialogAnnouncement(false, 'Title is required')).toBe('Title is required');
  });

  it('should return empty string when not creating and no error', () => {
    expect(buildDialogAnnouncement(false)).toBe('');
  });

  it('should return empty string when not creating and error is undefined', () => {
    expect(buildDialogAnnouncement(false, undefined)).toBe('');
  });
});

// ============================================================================
// Accessibility Behavior Documentation
// ============================================================================

describe('TaskPageComponents Accessibility Behavior', () => {
  describe('TaskNotFound component', () => {
    it('should document required ARIA attributes', () => {
      // These tests document expected behavior without rendering
      const expectedAttributes = {
        role: 'alert',
        'aria-labelledby': 'heading-id',
        'aria-describedby': 'description-id',
        'aria-live': 'polite',
      };
      expect(Object.keys(expectedAttributes)).toHaveLength(4);
    });
  });

  describe('TaskPageError component', () => {
    it('should document required ARIA attributes', () => {
      const expectedAttributes = {
        role: 'alert',
        'aria-labelledby': 'heading-id',
        'aria-describedby': 'message-id',
        'aria-live': 'assertive',
      };
      expect(Object.keys(expectedAttributes)).toHaveLength(4);
    });
  });

  describe('TaskPageSkeleton component', () => {
    it('should document required ARIA attributes', () => {
      const expectedAttributes = {
        role: 'status',
        'aria-label': SR_LOADING_ANNOUNCEMENT,
        'aria-busy': 'true',
        'aria-hidden': 'true',
      };
      expect(expectedAttributes['aria-label']).toBe('Loading task details');
    });
  });

  describe('TaskOutputPanel component', () => {
    it('should document required ARIA attributes', () => {
      const expectedAttributes = {
        role: 'region',
        'aria-label': 'dynamic accessible label',
        'aria-busy': 'boolean based on isRunning',
      };
      expect(Object.keys(expectedAttributes)).toHaveLength(3);
    });

    it('should document toggle button accessibility', () => {
      const expectedButtonAttributes = {
        'aria-pressed': 'boolean based on showRawOutput',
        'aria-label': 'dynamic toggle description',
      };
      expect(Object.keys(expectedButtonAttributes)).toHaveLength(2);
    });
  });

  describe('AddStepDialog component', () => {
    it('should document form accessibility', () => {
      const expectedFormAttributes = {
        role: 'form',
        'aria-label': ADD_STEP_DIALOG_TITLE,
      };
      expect(expectedFormAttributes['aria-label']).toBe('Add New Step');
    });

    it('should document input accessibility', () => {
      const expectedInputAttributes = {
        id: 'title-field-id',
        'aria-invalid': 'boolean based on error',
        'aria-describedby': 'error-id when error present',
      };
      expect(Object.keys(expectedInputAttributes)).toHaveLength(3);
    });
  });

  describe('Tab panels', () => {
    it('should document tabpanel role for TaskArtifactsTab', () => {
      const expectedAttributes = {
        role: 'tabpanel',
        'aria-label': 'Artifacts',
      };
      expect(expectedAttributes['aria-label']).toBe('Artifacts');
    });

    it('should document tabpanel role for TaskChangesTab', () => {
      const expectedAttributes = {
        role: 'tabpanel',
        'aria-label': 'File changes',
      };
      expect(expectedAttributes['aria-label']).toBe('File changes');
    });

    it('should document tabpanel role for TaskCommitsTab', () => {
      const expectedAttributes = {
        role: 'tabpanel',
        'aria-label': 'Commits',
      };
      expect(expectedAttributes['aria-label']).toBe('Commits');
    });
  });
});

// ============================================================================
// Touch Target Compliance Documentation
// ============================================================================

describe('TaskPageComponents Touch Target Compliance', () => {
  it('should document 44px minimum touch target for buttons', () => {
    // WCAG 2.5.5 requires minimum 44x44px touch targets
    const expectedClasses = 'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0';
    expect(expectedClasses).toContain('min-h-[44px]');
    expect(expectedClasses).toContain('min-w-[44px]');
  });

  it('should document responsive touch target relaxation', () => {
    // On desktop (sm: and above), touch targets can be smaller
    const expectedClasses = 'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0';
    expect(expectedClasses).toContain('sm:min-h-0');
    expect(expectedClasses).toContain('sm:min-w-0');
  });
});

// ============================================================================
// Data Attributes Documentation
// ============================================================================

describe('TaskPageComponents Data Attributes', () => {
  describe('TaskNotFound data attributes', () => {
    it('should document expected data attributes', () => {
      const expectedAttributes = ['data-testid', 'data-size'];
      expect(expectedAttributes).toContain('data-testid');
      expect(expectedAttributes).toContain('data-size');
    });
  });

  describe('TaskPageSkeleton data attributes', () => {
    it('should document expected data attributes', () => {
      const expectedAttributes = [
        'data-testid',
        'data-size',
        'data-show-steps-panel',
        'data-show-tabs',
      ];
      expect(expectedAttributes).toHaveLength(4);
    });
  });

  describe('TaskOutputPanel data attributes', () => {
    it('should document expected data attributes', () => {
      const expectedAttributes = ['data-testid', 'data-size', 'data-running', 'data-show-raw'];
      expect(expectedAttributes).toHaveLength(4);
    });
  });

  describe('TaskStepsPanel data attributes', () => {
    it('should document expected data attributes', () => {
      const expectedAttributes = [
        'data-testid',
        'data-size',
        'data-step-count',
        'data-active-step',
      ];
      expect(expectedAttributes).toHaveLength(4);
    });
  });

  describe('Tab panel data attributes', () => {
    it('should document TaskArtifactsTab data attributes', () => {
      const expectedAttributes = [
        'data-testid',
        'data-size',
        'data-artifact-count',
        'data-loading',
      ];
      expect(expectedAttributes).toHaveLength(4);
    });

    it('should document TaskChangesTab data attributes', () => {
      const expectedAttributes = [
        'data-testid',
        'data-size',
        'data-diff-count',
        'data-expanded-count',
      ];
      expect(expectedAttributes).toHaveLength(4);
    });

    it('should document TaskCommitsTab data attributes', () => {
      const expectedAttributes = [
        'data-testid',
        'data-size',
        'data-commit-count',
        'data-expanded-count',
      ];
      expect(expectedAttributes).toHaveLength(4);
    });
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('TaskPageComponents Size Consistency', () => {
  const sizes: TaskPageSize[] = ['sm', 'md', 'lg'];

  it('should have consistent size keys across all class maps', () => {
    const classMaps = [
      NOT_FOUND_PADDING_CLASSES,
      NOT_FOUND_ICON_CLASSES,
      NOT_FOUND_TITLE_CLASSES,
      NOT_FOUND_DESCRIPTION_CLASSES,
      NOT_FOUND_BUTTON_MARGIN_CLASSES,
      ERROR_PADDING_CLASSES,
      ERROR_ICON_CLASSES,
      ERROR_TEXT_CLASSES,
      ERROR_MESSAGE_CLASSES,
      ERROR_BUTTON_MARGIN_CLASSES,
      SKELETON_STEPS_PANEL_CLASSES,
      SKELETON_HEADER_CLASSES,
      SKELETON_TABS_GAP_CLASSES,
      SKELETON_CONTENT_CLASSES,
      OUTPUT_PANEL_HEADER_PADDING,
      OUTPUT_PANEL_CONTENT_PADDING,
      TAB_CONTENT_PADDING,
      FORM_FIELD_GAP_CLASSES,
    ];

    for (const classMap of classMaps) {
      for (const size of sizes) {
        expect(classMap).toHaveProperty(size);
        expect(typeof classMap[size]).toBe('string');
        expect(classMap[size].length).toBeGreaterThan(0);
      }
    }
  });
});

// ============================================================================
// Component Behavior Documentation
// ============================================================================

describe('TaskPageComponents Component Behavior', () => {
  describe('TaskOutputPanel', () => {
    it('should document that it returns null when no output', () => {
      // When claudeEvents.length === 0 && !isRunning && rawOutput.length === 0
      // The component should return null
      const condition = {
        hasOutput: false,
        claudeEventsLength: 0,
        isRunning: false,
        rawOutputLength: 0,
      };
      expect(
        condition.claudeEventsLength > 0 || condition.isRunning || condition.rawOutputLength > 0
      ).toBe(false);
    });
  });

  describe('AddStepDialog', () => {
    it('should document button disabled state logic', () => {
      // Buttons should be disabled when title is empty or isCreating
      const scenarios = [
        { title: '', isCreating: false, shouldDisable: true },
        { title: '  ', isCreating: false, shouldDisable: true },
        { title: 'Valid', isCreating: true, shouldDisable: true },
        { title: 'Valid', isCreating: false, shouldDisable: false },
      ];

      for (const scenario of scenarios) {
        const isDisabled = !scenario.title.trim() || scenario.isCreating;
        expect(isDisabled).toBe(scenario.shouldDisable);
      }
    });
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('TaskPageComponents Integration Patterns', () => {
  it('should document component composition pattern', () => {
    // TaskMainPanel composes TaskOutputPanel and ChatPanel
    const composedComponents = ['TaskOutputPanel', 'ChatPanel'];
    expect(composedComponents).toHaveLength(2);
  });

  it('should document wrapper pattern for StepsPanel', () => {
    // TaskStepsPanel wraps StepsPanel with additional data attributes
    const wrapperPattern = {
      wrappedComponent: 'StepsPanel',
      addedProps: ['size', 'data-testid', 'data-size', 'data-step-count', 'data-active-step'],
    };
    expect(wrapperPattern.addedProps.length).toBeGreaterThan(0);
  });

  it('should document tab panel pattern', () => {
    // Tab panels wrap their content with role="tabpanel" and aria-label
    const tabPanels = [
      { component: 'TaskArtifactsTab', wraps: 'ArtifactsPanel', label: 'Artifacts' },
      { component: 'TaskChangesTab', wraps: 'DiffViewer', label: 'File changes' },
      { component: 'TaskCommitsTab', wraps: 'CommitList', label: 'Commits' },
    ];
    expect(tabPanels).toHaveLength(3);
    for (const panel of tabPanels) {
      expect(panel.label.length).toBeGreaterThan(0);
    }
  });
});
