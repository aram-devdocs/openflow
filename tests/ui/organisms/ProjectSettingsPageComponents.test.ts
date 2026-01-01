import { FileCode, FolderGit2, GitBranch, Settings, Terminal } from 'lucide-react';
/**
 * Unit tests for ProjectSettingsPageComponents utility functions and constants
 */
import { describe, expect, it } from 'vitest';
import {
  BADGE_SIZE_MAP,
  BUTTON_SIZE_MAP,
  DEFAULT_DROPDOWN_LABEL,
  DEFAULT_DROPDOWN_PLACEHOLDER,
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_TITLE,
  DEFAULT_PAGE_LABEL,
  DEFAULT_RETRY_LABEL,
  DEFAULT_SAVE_LABEL,
  DEFAULT_SAVING_TEXT,
  DEFAULT_SKELETON_FIELDS_PER_SECTION,
  // Constants
  DEFAULT_SKELETON_SECTION_COUNT,
  EMPTY_STATE_CLASSES,
  ERROR_STATE_CLASSES,
  FOOTER_CONTAINER_CLASSES,
  FOOTER_PADDING_CLASSES,
  FORM_GRID_CLASSES,
  ICON_SIZE_MAP,
  PROJECT_SETTINGS_LAYOUT_CLASSES,
  PROJECT_SETTINGS_SIZE_CLASSES,
  SAVE_SUCCESS_TEXT,
  SECTION_CARD_CLASSES,
  SECTION_CONTENT_GAP_CLASSES,
  SECTION_CONTENT_PADDING_CLASSES,
  SECTION_DESCRIPTIONS,
  SECTION_HEADER_CLASSES,
  SECTION_HEADER_PADDING_CLASSES,
  SECTION_ICONS,
  SECTION_TITLES,
  SELECTOR_CONTAINER_CLASSES,
  SELECTOR_DROPDOWN_WIDTH_CLASSES,
  SELECTOR_GAP_CLASSES,
  SR_EMPTY,
  SR_FORM_LABEL,
  SR_LOADING,
  SR_PROJECT_SELECTED,
  SR_SAVE_SUCCESS,
  SR_SAVING,
  SR_UNSAVED_CHANGES,
  UNSAVED_CHANGES_TEXT,
  buildSectionAccessibleLabel,
  buildSelectorAnnouncement,
  buildStatusAnnouncement,
  // Utility functions
  getBaseSize,
  getResponsiveSizeClasses,
} from '../../../packages/ui/organisms/ProjectSettingsPageComponents';

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('getBaseSize', () => {
  it('returns "md" for undefined', () => {
    expect(getBaseSize(undefined)).toBe('md');
  });

  it('returns the size string for string input', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('returns base value for responsive object', () => {
    expect(getBaseSize({ base: 'sm', md: 'md', lg: 'lg' })).toBe('sm');
    expect(getBaseSize({ base: 'lg' })).toBe('lg');
  });

  it('returns "md" if responsive object has no base', () => {
    expect(getBaseSize({ sm: 'lg', md: 'md' })).toBe('md');
  });
});

describe('getResponsiveSizeClasses', () => {
  it('returns md classes for undefined', () => {
    expect(getResponsiveSizeClasses(undefined, PROJECT_SETTINGS_SIZE_CLASSES)).toBe('space-y-6');
  });

  it('returns correct classes for string size', () => {
    expect(getResponsiveSizeClasses('sm', PROJECT_SETTINGS_SIZE_CLASSES)).toBe('space-y-4');
    expect(getResponsiveSizeClasses('md', PROJECT_SETTINGS_SIZE_CLASSES)).toBe('space-y-6');
    expect(getResponsiveSizeClasses('lg', PROJECT_SETTINGS_SIZE_CLASSES)).toBe('space-y-8');
  });

  it('generates responsive classes for object input', () => {
    const result = getResponsiveSizeClasses(
      { base: 'sm', md: 'md', lg: 'lg' },
      PROJECT_SETTINGS_SIZE_CLASSES
    );
    expect(result).toContain('space-y-4');
    expect(result).toContain('md:space-y-6');
    expect(result).toContain('lg:space-y-8');
  });

  it('returns default when responsive object is empty', () => {
    expect(getResponsiveSizeClasses({}, PROJECT_SETTINGS_SIZE_CLASSES)).toBe('space-y-6');
  });
});

describe('buildSectionAccessibleLabel', () => {
  it('combines title and description', () => {
    const result = buildSectionAccessibleLabel('Basic Information', 'General project details');
    expect(result).toBe('Basic Information. General project details');
  });

  it('handles empty strings', () => {
    expect(buildSectionAccessibleLabel('', '')).toBe('. ');
    expect(buildSectionAccessibleLabel('Title', '')).toBe('Title. ');
    expect(buildSectionAccessibleLabel('', 'Description')).toBe('. Description');
  });
});

describe('buildStatusAnnouncement', () => {
  it('returns empty string when no state is active', () => {
    expect(buildStatusAnnouncement(false, false, false)).toBe('');
  });

  it('returns saving message when isSaving is true', () => {
    expect(buildStatusAnnouncement(true, false, true)).toBe(SR_SAVING);
    expect(buildStatusAnnouncement(false, true, true)).toBe(SR_SAVING);
  });

  it('returns success message when saveSuccess is true and not saving', () => {
    expect(buildStatusAnnouncement(false, true, false)).toBe(SR_SAVE_SUCCESS);
  });

  it('returns unsaved changes message when hasChanges is true and not saving/success', () => {
    expect(buildStatusAnnouncement(true, false, false)).toBe(SR_UNSAVED_CHANGES);
  });

  it('prioritizes isSaving over other states', () => {
    expect(buildStatusAnnouncement(true, true, true)).toBe(SR_SAVING);
  });
});

describe('buildSelectorAnnouncement', () => {
  it('returns empty string when no project and no states', () => {
    expect(buildSelectorAnnouncement(null, false, false)).toBe('');
  });

  it('announces project selection', () => {
    const result = buildSelectorAnnouncement('OpenFlow', false, false);
    expect(result).toBe(`${SR_PROJECT_SELECTED} OpenFlow`);
  });

  it('announces unsaved changes', () => {
    const result = buildSelectorAnnouncement(null, true, false);
    expect(result).toBe(SR_UNSAVED_CHANGES);
  });

  it('announces save success', () => {
    const result = buildSelectorAnnouncement(null, false, true);
    expect(result).toBe(SR_SAVE_SUCCESS);
  });

  it('combines multiple announcements', () => {
    const result = buildSelectorAnnouncement('OpenFlow', true, true);
    expect(result).toContain(`${SR_PROJECT_SELECTED} OpenFlow`);
    expect(result).toContain(SR_UNSAVED_CHANGES);
    expect(result).toContain(SR_SAVE_SUCCESS);
    expect(result).toBe(
      `${SR_PROJECT_SELECTED} OpenFlow. ${SR_UNSAVED_CHANGES}. ${SR_SAVE_SUCCESS}`
    );
  });
});

// ============================================================================
// Constants Tests
// ============================================================================

describe('Default Constants', () => {
  it('has correct skeleton defaults', () => {
    expect(DEFAULT_SKELETON_SECTION_COUNT).toBe(4);
    expect(DEFAULT_SKELETON_FIELDS_PER_SECTION).toBe(3);
  });

  it('has correct label defaults', () => {
    expect(DEFAULT_PAGE_LABEL).toBe('Project Settings');
    expect(DEFAULT_DROPDOWN_LABEL).toBe('Select a project to configure');
    expect(DEFAULT_DROPDOWN_PLACEHOLDER).toBe('Select a project');
    expect(DEFAULT_EMPTY_TITLE).toBe('No projects');
    expect(DEFAULT_EMPTY_DESCRIPTION).toBe('Create a project first to configure its settings.');
    expect(DEFAULT_ERROR_TITLE).toBe('Failed to load project settings');
    expect(DEFAULT_RETRY_LABEL).toBe('Try again');
    expect(DEFAULT_SAVE_LABEL).toBe('Save Changes');
    expect(DEFAULT_SAVING_TEXT).toBe('Saving...');
    expect(UNSAVED_CHANGES_TEXT).toBe('Unsaved changes');
    expect(SAVE_SUCCESS_TEXT).toBe('Saved successfully');
  });

  it('has correct screen reader announcements', () => {
    expect(SR_LOADING).toBe('Loading project settings...');
    expect(SR_EMPTY).toBe('No projects available. Create one to configure settings.');
    expect(SR_UNSAVED_CHANGES).toBe('You have unsaved changes');
    expect(SR_SAVE_SUCCESS).toBe('Settings saved successfully');
    expect(SR_SAVING).toBe('Saving project settings...');
    expect(SR_PROJECT_SELECTED).toBe('Project selected:');
    expect(SR_FORM_LABEL).toBe('Project settings form');
  });
});

describe('Section Configuration', () => {
  it('has all required section titles', () => {
    expect(SECTION_TITLES.basicInfo).toBe('Basic Information');
    expect(SECTION_TITLES.scripts).toBe('Scripts');
    expect(SECTION_TITLES.workflows).toBe('Workflows');
    expect(SECTION_TITLES.rules).toBe('Rules & Context');
    expect(SECTION_TITLES.verification).toBe('Verification');
  });

  it('has all required section descriptions', () => {
    expect(SECTION_DESCRIPTIONS.basicInfo).toBe('General project details');
    expect(SECTION_DESCRIPTIONS.scripts).toBe('Commands to run during task lifecycle');
    expect(SECTION_DESCRIPTIONS.workflows).toBe('Workflow template configuration');
    expect(SECTION_DESCRIPTIONS.rules).toBe('AI context and instruction files');
    expect(SECTION_DESCRIPTIONS.verification).toBe('Automated verification commands');
  });

  it('has all required section icons', () => {
    expect(SECTION_ICONS.basicInfo).toBe(FolderGit2);
    expect(SECTION_ICONS.scripts).toBe(Terminal);
    expect(SECTION_ICONS.workflows).toBe(GitBranch);
    expect(SECTION_ICONS.rules).toBe(FileCode);
    expect(SECTION_ICONS.verification).toBe(Settings);
  });
});

describe('Size Class Mappings', () => {
  it('has all size classes for PROJECT_SETTINGS_SIZE_CLASSES', () => {
    expect(PROJECT_SETTINGS_SIZE_CLASSES.sm).toBe('space-y-4');
    expect(PROJECT_SETTINGS_SIZE_CLASSES.md).toBe('space-y-6');
    expect(PROJECT_SETTINGS_SIZE_CLASSES.lg).toBe('space-y-8');
  });

  it('has all size classes for SELECTOR_GAP_CLASSES', () => {
    expect(SELECTOR_GAP_CLASSES.sm).toBe('gap-2');
    expect(SELECTOR_GAP_CLASSES.md).toBe('gap-4');
    expect(SELECTOR_GAP_CLASSES.lg).toBe('gap-6');
  });

  it('has all size classes for SELECTOR_DROPDOWN_WIDTH_CLASSES', () => {
    expect(SELECTOR_DROPDOWN_WIDTH_CLASSES.sm).toBe('w-48');
    expect(SELECTOR_DROPDOWN_WIDTH_CLASSES.md).toBe('w-64');
    expect(SELECTOR_DROPDOWN_WIDTH_CLASSES.lg).toBe('w-80');
  });

  it('has all size classes for section headers', () => {
    expect(SECTION_HEADER_PADDING_CLASSES.sm).toBe('px-3 py-2');
    expect(SECTION_HEADER_PADDING_CLASSES.md).toBe('px-4 py-3');
    expect(SECTION_HEADER_PADDING_CLASSES.lg).toBe('px-5 py-4');
  });

  it('has all size classes for section content', () => {
    expect(SECTION_CONTENT_PADDING_CLASSES.sm).toBe('p-3');
    expect(SECTION_CONTENT_PADDING_CLASSES.md).toBe('p-4');
    expect(SECTION_CONTENT_PADDING_CLASSES.lg).toBe('p-5');
    expect(SECTION_CONTENT_GAP_CLASSES.sm).toBe('space-y-3');
    expect(SECTION_CONTENT_GAP_CLASSES.md).toBe('space-y-4');
    expect(SECTION_CONTENT_GAP_CLASSES.lg).toBe('space-y-5');
  });

  it('has all size classes for footer', () => {
    expect(FOOTER_PADDING_CLASSES.sm).toBe('pt-4');
    expect(FOOTER_PADDING_CLASSES.md).toBe('pt-6');
    expect(FOOTER_PADDING_CLASSES.lg).toBe('pt-8');
  });
});

describe('Component Size Mappings', () => {
  it('has correct button size mappings', () => {
    expect(BUTTON_SIZE_MAP.sm).toBe('sm');
    expect(BUTTON_SIZE_MAP.md).toBe('md');
    expect(BUTTON_SIZE_MAP.lg).toBe('lg');
  });

  it('has correct icon size mappings', () => {
    expect(ICON_SIZE_MAP.sm).toBe('xs');
    expect(ICON_SIZE_MAP.md).toBe('sm');
    expect(ICON_SIZE_MAP.lg).toBe('md');
  });

  it('has correct badge size mappings', () => {
    expect(BADGE_SIZE_MAP.sm).toBe('sm');
    expect(BADGE_SIZE_MAP.md).toBe('sm');
    expect(BADGE_SIZE_MAP.lg).toBe('md');
  });
});

describe('Base Class Constants', () => {
  it('has layout base classes', () => {
    expect(PROJECT_SETTINGS_LAYOUT_CLASSES).toBe('relative');
  });

  it('has selector container classes', () => {
    expect(SELECTOR_CONTAINER_CLASSES).toBe('flex items-center flex-wrap');
  });

  it('has section card classes', () => {
    expect(SECTION_CARD_CLASSES).toBe('overflow-hidden');
  });

  it('has section header classes', () => {
    expect(SECTION_HEADER_CLASSES).toContain('border-b');
    expect(SECTION_HEADER_CLASSES).toContain('bg-');
  });

  it('has empty state classes', () => {
    expect(EMPTY_STATE_CLASSES).toContain('flex');
    expect(EMPTY_STATE_CLASSES).toContain('items-center');
    expect(EMPTY_STATE_CLASSES).toContain('justify-center');
    expect(EMPTY_STATE_CLASSES).toContain('border-dashed');
  });

  it('has error state classes', () => {
    expect(ERROR_STATE_CLASSES).toContain('flex');
    expect(ERROR_STATE_CLASSES).toContain('items-center');
    expect(ERROR_STATE_CLASSES).toContain('justify-center');
    expect(ERROR_STATE_CLASSES).toContain('destructive');
  });

  it('has footer container classes', () => {
    expect(FOOTER_CONTAINER_CLASSES).toContain('flex');
    expect(FOOTER_CONTAINER_CLASSES).toContain('items-center');
    expect(FOOTER_CONTAINER_CLASSES).toContain('border-t');
  });

  it('has form grid classes', () => {
    expect(FORM_GRID_CLASSES).toContain('grid');
    expect(FORM_GRID_CLASSES).toContain('gap-4');
  });
});
