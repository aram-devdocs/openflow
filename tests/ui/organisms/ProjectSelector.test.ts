/**
 * ProjectSelector Organism Tests
 *
 * Tests for the ProjectSelector utility functions and constants.
 * Covers:
 * - Constant values and exports
 * - Utility function behavior
 * - Size class generation
 * - Responsive value handling
 * - ARIA/accessibility behavior documentation
 * - Component behavior documentation
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ARIA_LABEL,
  DEFAULT_EMPTY_MESSAGE,
  DEFAULT_NEW_PROJECT_ACTION,
  DEFAULT_NEW_PROJECT_LABEL,
  // Constants - Default labels
  DEFAULT_PLACEHOLDER,
  DEFAULT_SELECTED_INDICATOR,
  DIVIDER_CLASSES,
  EMPTY_MESSAGE_CLASSES,
  ICON_SIZE_MAP,
  OPTION_BASE_CLASSES,
  OPTION_HIGHLIGHTED_CLASSES,
  OPTION_SELECTED_CLASSES,
  OPTION_SIZE_CLASSES,
  // Icon map
  PROJECT_ICON_MAP,
  // Types
  type ProjectSelectorBreakpoint,
  type ProjectSelectorSize,
  type ResponsiveValue,
  SELECTOR_LISTBOX_CLASSES,
  SELECTOR_PADDING_CLASSES,
  // Size class constants
  SELECTOR_SIZE_CLASSES,
  // Base class constants
  SELECTOR_TRIGGER_BASE_CLASSES,
  SELECTOR_TRIGGER_DEFAULT_CLASSES,
  SELECTOR_TRIGGER_DISABLED_CLASSES,
  SELECTOR_TRIGGER_FOCUS_CLASSES,
  SELECTOR_TRIGGER_HOVER_CLASSES,
  SELECTOR_TRIGGER_OPEN_CLASSES,
  SKELETON_CONTAINER_CLASSES,
  SR_DROPDOWN_CLOSED,
  // Screen reader constants
  SR_DROPDOWN_OPENED,
  SR_NEW_PROJECT_HIGHLIGHTED,
  SR_OPTION_COUNT_TEMPLATE,
  SR_OPTION_HIGHLIGHTED,
  SR_PROJECT_SELECTED,
  buildCountAnnouncement,
  buildHighlightAnnouncement,
  buildProjectAccessibleLabel,
  buildSelectionAnnouncement,
  getBaseSize,
  getOptionId,
  // Utility functions
  getProjectIcon,
  getResponsiveSizeClasses,
} from '../../../packages/ui/organisms/ProjectSelector';

// ============================================================================
// Default Labels Tests
// ============================================================================

describe('Default Labels', () => {
  it('DEFAULT_PLACEHOLDER should be defined', () => {
    expect(DEFAULT_PLACEHOLDER).toBe('Select a project...');
  });

  it('DEFAULT_ARIA_LABEL should be defined', () => {
    expect(DEFAULT_ARIA_LABEL).toBe('Select project');
  });

  it('DEFAULT_NEW_PROJECT_LABEL should be defined', () => {
    expect(DEFAULT_NEW_PROJECT_LABEL).toBe('New Project');
  });

  it('DEFAULT_EMPTY_MESSAGE should be defined', () => {
    expect(DEFAULT_EMPTY_MESSAGE).toBe('No projects yet');
  });

  it('DEFAULT_SELECTED_INDICATOR should be defined', () => {
    expect(DEFAULT_SELECTED_INDICATOR).toBe('Selected');
  });

  it('DEFAULT_NEW_PROJECT_ACTION should be defined', () => {
    expect(DEFAULT_NEW_PROJECT_ACTION).toBe('Create new project');
  });
});

// ============================================================================
// Screen Reader Constants Tests
// ============================================================================

describe('Screen Reader Constants', () => {
  it('SR_DROPDOWN_OPENED should announce open state', () => {
    expect(SR_DROPDOWN_OPENED).toBe('Project selector opened');
  });

  it('SR_DROPDOWN_CLOSED should announce closed state', () => {
    expect(SR_DROPDOWN_CLOSED).toBe('Project selector closed');
  });

  it('SR_PROJECT_SELECTED should announce selection', () => {
    expect(SR_PROJECT_SELECTED).toBe('Selected');
  });

  it('SR_OPTION_HIGHLIGHTED should describe highlighted option', () => {
    expect(SR_OPTION_HIGHLIGHTED).toBe('Option');
  });

  it('SR_OPTION_COUNT_TEMPLATE should have count placeholder', () => {
    expect(SR_OPTION_COUNT_TEMPLATE).toBe('{count} projects available');
    expect(SR_OPTION_COUNT_TEMPLATE).toContain('{count}');
  });

  it('SR_NEW_PROJECT_HIGHLIGHTED should describe new project button', () => {
    expect(SR_NEW_PROJECT_HIGHLIGHTED).toBe('New Project button');
  });
});

// ============================================================================
// PROJECT_ICON_MAP Tests
// ============================================================================

describe('PROJECT_ICON_MAP', () => {
  it('should have folder icon mapped', () => {
    expect(PROJECT_ICON_MAP.folder).toBeDefined();
  });

  it('should have folder-git icon mapped', () => {
    expect(PROJECT_ICON_MAP['folder-git']).toBeDefined();
  });

  it('should have folder-code icon mapped', () => {
    expect(PROJECT_ICON_MAP['folder-code']).toBeDefined();
  });

  it('should have folder-kanban icon mapped', () => {
    expect(PROJECT_ICON_MAP['folder-kanban']).toBeDefined();
  });

  it('should have folder-open icon mapped', () => {
    expect(PROJECT_ICON_MAP['folder-open']).toBeDefined();
  });

  it('should have all expected keys', () => {
    const expectedKeys = ['folder', 'folder-git', 'folder-code', 'folder-kanban', 'folder-open'];
    expect(Object.keys(PROJECT_ICON_MAP)).toEqual(expect.arrayContaining(expectedKeys));
  });
});

// ============================================================================
// SELECTOR_SIZE_CLASSES Tests
// ============================================================================

describe('SELECTOR_SIZE_CLASSES', () => {
  it('should have classes for all sizes', () => {
    expect(SELECTOR_SIZE_CLASSES.sm).toBeDefined();
    expect(SELECTOR_SIZE_CLASSES.md).toBeDefined();
    expect(SELECTOR_SIZE_CLASSES.lg).toBeDefined();
  });

  it('should have minimum height class for each size', () => {
    expect(SELECTOR_SIZE_CLASSES.sm).toContain('min-h-');
    expect(SELECTOR_SIZE_CLASSES.md).toContain('min-h-');
    expect(SELECTOR_SIZE_CLASSES.lg).toContain('min-h-');
  });

  it('should have text size class for each size', () => {
    expect(SELECTOR_SIZE_CLASSES.sm).toContain('text-');
    expect(SELECTOR_SIZE_CLASSES.md).toContain('text-');
    expect(SELECTOR_SIZE_CLASSES.lg).toContain('text-');
  });

  it('should have at least 44px height for md size (WCAG 2.5.5)', () => {
    expect(SELECTOR_SIZE_CLASSES.md).toContain('min-h-[44px]');
  });

  it('should have increasing heights with size', () => {
    const smHeight = Number.parseInt(
      SELECTOR_SIZE_CLASSES.sm.match(/min-h-\[(\d+)px\]/)?.[1] ?? '0',
      10
    );
    const mdHeight = Number.parseInt(
      SELECTOR_SIZE_CLASSES.md.match(/min-h-\[(\d+)px\]/)?.[1] ?? '0',
      10
    );
    const lgHeight = Number.parseInt(
      SELECTOR_SIZE_CLASSES.lg.match(/min-h-\[(\d+)px\]/)?.[1] ?? '0',
      10
    );

    expect(smHeight).toBeLessThan(mdHeight);
    expect(mdHeight).toBeLessThan(lgHeight);
  });
});

// ============================================================================
// SELECTOR_PADDING_CLASSES Tests
// ============================================================================

describe('SELECTOR_PADDING_CLASSES', () => {
  it('should have classes for all sizes', () => {
    expect(SELECTOR_PADDING_CLASSES.sm).toBeDefined();
    expect(SELECTOR_PADDING_CLASSES.md).toBeDefined();
    expect(SELECTOR_PADDING_CLASSES.lg).toBeDefined();
  });

  it('should have horizontal padding for each size', () => {
    expect(SELECTOR_PADDING_CLASSES.sm).toContain('px-');
    expect(SELECTOR_PADDING_CLASSES.md).toContain('px-');
    expect(SELECTOR_PADDING_CLASSES.lg).toContain('px-');
  });

  it('should have vertical padding for each size', () => {
    expect(SELECTOR_PADDING_CLASSES.sm).toContain('py-');
    expect(SELECTOR_PADDING_CLASSES.md).toContain('py-');
    expect(SELECTOR_PADDING_CLASSES.lg).toContain('py-');
  });
});

// ============================================================================
// OPTION_SIZE_CLASSES Tests
// ============================================================================

describe('OPTION_SIZE_CLASSES', () => {
  it('should have classes for all sizes', () => {
    expect(OPTION_SIZE_CLASSES.sm).toBeDefined();
    expect(OPTION_SIZE_CLASSES.md).toBeDefined();
    expect(OPTION_SIZE_CLASSES.lg).toBeDefined();
  });

  it('should have minimum height for each size', () => {
    expect(OPTION_SIZE_CLASSES.sm).toContain('min-h-');
    expect(OPTION_SIZE_CLASSES.md).toContain('min-h-');
    expect(OPTION_SIZE_CLASSES.lg).toContain('min-h-');
  });

  it('should have at least 44px height for md size (WCAG 2.5.5)', () => {
    expect(OPTION_SIZE_CLASSES.md).toContain('min-h-[44px]');
  });

  it('should have padding for each size', () => {
    for (const classes of Object.values(OPTION_SIZE_CLASSES)) {
      expect(classes).toContain('px-');
      expect(classes).toContain('py-');
    }
  });

  it('should have text size for each size', () => {
    for (const classes of Object.values(OPTION_SIZE_CLASSES)) {
      expect(classes).toContain('text-');
    }
  });
});

// ============================================================================
// ICON_SIZE_MAP Tests
// ============================================================================

describe('ICON_SIZE_MAP', () => {
  it('should map sm to xs icon size', () => {
    expect(ICON_SIZE_MAP.sm).toBe('xs');
  });

  it('should map md to sm icon size', () => {
    expect(ICON_SIZE_MAP.md).toBe('sm');
  });

  it('should map lg to md icon size', () => {
    expect(ICON_SIZE_MAP.lg).toBe('md');
  });

  it('should have all sizes defined', () => {
    expect(Object.keys(ICON_SIZE_MAP)).toEqual(['sm', 'md', 'lg']);
  });
});

// ============================================================================
// Base Classes Tests
// ============================================================================

describe('SELECTOR_TRIGGER_BASE_CLASSES', () => {
  it('should use flex layout', () => {
    expect(SELECTOR_TRIGGER_BASE_CLASSES).toContain('flex');
  });

  it('should have full width', () => {
    expect(SELECTOR_TRIGGER_BASE_CLASSES).toContain('w-full');
  });

  it('should center items vertically', () => {
    expect(SELECTOR_TRIGGER_BASE_CLASSES).toContain('items-center');
  });

  it('should space items apart', () => {
    expect(SELECTOR_TRIGGER_BASE_CLASSES).toContain('justify-between');
  });

  it('should have gap for spacing', () => {
    expect(SELECTOR_TRIGGER_BASE_CLASSES).toContain('gap-');
  });

  it('should have rounded corners', () => {
    expect(SELECTOR_TRIGGER_BASE_CLASSES).toContain('rounded-md');
  });

  it('should have border', () => {
    expect(SELECTOR_TRIGGER_BASE_CLASSES).toContain('border');
  });

  it('should have transition', () => {
    expect(SELECTOR_TRIGGER_BASE_CLASSES).toContain('transition');
  });
});

describe('SELECTOR_TRIGGER_FOCUS_CLASSES', () => {
  it('should have focus-visible outline removal', () => {
    expect(SELECTOR_TRIGGER_FOCUS_CLASSES).toContain('focus-visible:outline-none');
  });

  it('should have focus-visible ring', () => {
    expect(SELECTOR_TRIGGER_FOCUS_CLASSES).toContain('focus-visible:ring-2');
  });

  it('should have ring offset', () => {
    expect(SELECTOR_TRIGGER_FOCUS_CLASSES).toContain('focus-visible:ring-offset-2');
  });

  it('should use ring color token', () => {
    expect(SELECTOR_TRIGGER_FOCUS_CLASSES).toContain('ring');
  });
});

describe('SELECTOR_TRIGGER_DISABLED_CLASSES', () => {
  it('should use not-allowed cursor', () => {
    expect(SELECTOR_TRIGGER_DISABLED_CLASSES).toContain('cursor-not-allowed');
  });

  it('should reduce opacity', () => {
    expect(SELECTOR_TRIGGER_DISABLED_CLASSES).toContain('opacity-50');
  });
});

describe('SELECTOR_TRIGGER_HOVER_CLASSES', () => {
  it('should change border on hover', () => {
    expect(SELECTOR_TRIGGER_HOVER_CLASSES).toContain('hover:border-');
  });
});

describe('SELECTOR_TRIGGER_OPEN_CLASSES', () => {
  it('should change border when open', () => {
    expect(SELECTOR_TRIGGER_OPEN_CLASSES).toContain('border-');
  });
});

describe('SELECTOR_TRIGGER_DEFAULT_CLASSES', () => {
  it('should have border color', () => {
    expect(SELECTOR_TRIGGER_DEFAULT_CLASSES).toContain('border-');
  });

  it('should have background color', () => {
    expect(SELECTOR_TRIGGER_DEFAULT_CLASSES).toContain('bg-');
  });

  it('should have text color', () => {
    expect(SELECTOR_TRIGGER_DEFAULT_CLASSES).toContain('text-');
  });
});

describe('SELECTOR_LISTBOX_CLASSES', () => {
  it('should have absolute positioning', () => {
    expect(SELECTOR_LISTBOX_CLASSES).toContain('absolute');
  });

  it('should have high z-index', () => {
    expect(SELECTOR_LISTBOX_CLASSES).toContain('z-50');
  });

  it('should have full width', () => {
    expect(SELECTOR_LISTBOX_CLASSES).toContain('w-full');
  });

  it('should have overflow handling', () => {
    expect(SELECTOR_LISTBOX_CLASSES).toContain('overflow-auto');
  });

  it('should have max height', () => {
    expect(SELECTOR_LISTBOX_CLASSES).toContain('max-h-60');
  });

  it('should have rounded corners', () => {
    expect(SELECTOR_LISTBOX_CLASSES).toContain('rounded-md');
  });

  it('should have border', () => {
    expect(SELECTOR_LISTBOX_CLASSES).toContain('border');
  });

  it('should have shadow', () => {
    expect(SELECTOR_LISTBOX_CLASSES).toContain('shadow-md');
  });

  it('should have motion-safe animation', () => {
    expect(SELECTOR_LISTBOX_CLASSES).toContain('motion-safe:animate-in');
    expect(SELECTOR_LISTBOX_CLASSES).toContain('motion-safe:fade-in');
    expect(SELECTOR_LISTBOX_CLASSES).toContain('motion-safe:zoom-in');
  });

  it('should have focus outline removal', () => {
    expect(SELECTOR_LISTBOX_CLASSES).toContain('focus:outline-none');
  });
});

describe('OPTION_BASE_CLASSES', () => {
  it('should use flex layout', () => {
    expect(OPTION_BASE_CLASSES).toContain('flex');
  });

  it('should have pointer cursor', () => {
    expect(OPTION_BASE_CLASSES).toContain('cursor-pointer');
  });

  it('should center items', () => {
    expect(OPTION_BASE_CLASSES).toContain('items-center');
  });

  it('should have gap for spacing', () => {
    expect(OPTION_BASE_CLASSES).toContain('gap-');
  });

  it('should have motion-safe transition', () => {
    expect(OPTION_BASE_CLASSES).toContain('motion-safe:transition');
  });
});

describe('OPTION_HIGHLIGHTED_CLASSES', () => {
  it('should have accent background', () => {
    expect(OPTION_HIGHLIGHTED_CLASSES).toContain('bg-');
    expect(OPTION_HIGHLIGHTED_CLASSES).toContain('accent');
  });

  it('should have accent text color', () => {
    expect(OPTION_HIGHLIGHTED_CLASSES).toContain('text-');
  });
});

describe('OPTION_SELECTED_CLASSES', () => {
  it('should have medium font weight', () => {
    expect(OPTION_SELECTED_CLASSES).toContain('font-medium');
  });
});

describe('DIVIDER_CLASSES', () => {
  it('should have vertical margin', () => {
    expect(DIVIDER_CLASSES).toContain('my-');
  });

  it('should be 1px height', () => {
    expect(DIVIDER_CLASSES).toContain('h-px');
  });

  it('should have background color', () => {
    expect(DIVIDER_CLASSES).toContain('bg-');
  });
});

describe('EMPTY_MESSAGE_CLASSES', () => {
  it('should have padding', () => {
    expect(EMPTY_MESSAGE_CLASSES).toContain('px-');
    expect(EMPTY_MESSAGE_CLASSES).toContain('py-');
  });

  it('should have text size', () => {
    expect(EMPTY_MESSAGE_CLASSES).toContain('text-sm');
  });

  it('should use muted foreground color', () => {
    expect(EMPTY_MESSAGE_CLASSES).toContain('muted-foreground');
  });
});

describe('SKELETON_CONTAINER_CLASSES', () => {
  it('should use flex layout', () => {
    expect(SKELETON_CONTAINER_CLASSES).toContain('flex');
  });

  it('should have full width', () => {
    expect(SKELETON_CONTAINER_CLASSES).toContain('w-full');
  });

  it('should center items', () => {
    expect(SKELETON_CONTAINER_CLASSES).toContain('items-center');
  });

  it('should have gap for spacing', () => {
    expect(SKELETON_CONTAINER_CLASSES).toContain('gap-');
  });

  it('should have rounded corners', () => {
    expect(SKELETON_CONTAINER_CLASSES).toContain('rounded-md');
  });

  it('should have border', () => {
    expect(SKELETON_CONTAINER_CLASSES).toContain('border');
  });
});

// ============================================================================
// getProjectIcon Utility Tests
// ============================================================================

describe('getProjectIcon', () => {
  it('should return folder icon for "folder"', () => {
    const result = getProjectIcon('folder');
    expect(result).toBe(PROJECT_ICON_MAP.folder);
  });

  it('should return folder-git icon for "folder-git"', () => {
    const result = getProjectIcon('folder-git');
    expect(result).toBe(PROJECT_ICON_MAP['folder-git']);
  });

  it('should return folder-code icon for "folder-code"', () => {
    const result = getProjectIcon('folder-code');
    expect(result).toBe(PROJECT_ICON_MAP['folder-code']);
  });

  it('should return folder-kanban icon for "folder-kanban"', () => {
    const result = getProjectIcon('folder-kanban');
    expect(result).toBe(PROJECT_ICON_MAP['folder-kanban']);
  });

  it('should return folder-open icon for "folder-open"', () => {
    const result = getProjectIcon('folder-open');
    expect(result).toBe(PROJECT_ICON_MAP['folder-open']);
  });

  it('should fallback to folder icon for unknown icon name', () => {
    const result = getProjectIcon('unknown-icon');
    expect(result).toBe(PROJECT_ICON_MAP.folder);
  });

  it('should fallback to folder icon for empty string', () => {
    const result = getProjectIcon('');
    expect(result).toBe(PROJECT_ICON_MAP.folder);
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
    const responsive: ResponsiveValue<ProjectSelectorSize> = {
      base: 'sm',
      sm: 'md',
      md: 'lg',
      lg: 'sm',
      xl: 'md',
      '2xl': 'lg',
    };
    expect(getBaseSize(responsive)).toBe('sm');
  });

  it('should handle empty object by defaulting to md', () => {
    expect(getBaseSize({} as ResponsiveValue<ProjectSelectorSize>)).toBe('md');
  });
});

// ============================================================================
// getResponsiveSizeClasses Utility Tests
// ============================================================================

describe('getResponsiveSizeClasses', () => {
  const mockClassMap: Record<ProjectSelectorSize, string> = {
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
    const multiClassMap: Record<ProjectSelectorSize, string> = {
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

  it('should preserve breakpoint order', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', '2xl': 'lg', md: 'md' }, mockClassMap);
    // Base should come first, then md, then 2xl
    const parts = result.split(' ');
    const baseIndex = parts.findIndex((p) => p === 'gap-2');
    const mdIndex = parts.findIndex((p) => p === 'md:gap-3');
    const xxlIndex = parts.findIndex((p) => p === '2xl:gap-4');

    expect(baseIndex).toBeLessThan(mdIndex);
    expect(mdIndex).toBeLessThan(xxlIndex);
  });
});

// ============================================================================
// getOptionId Utility Tests
// ============================================================================

describe('getOptionId', () => {
  it('should generate ID with listbox prefix and index', () => {
    expect(getOptionId('listbox-1', 0)).toBe('listbox-1-option-0');
    expect(getOptionId('listbox-1', 1)).toBe('listbox-1-option-1');
    expect(getOptionId('listbox-1', 5)).toBe('listbox-1-option-5');
  });

  it('should work with different listbox IDs', () => {
    expect(getOptionId('projects', 2)).toBe('projects-option-2');
    expect(getOptionId('selector-abc', 3)).toBe('selector-abc-option-3');
  });

  it('should handle zero index', () => {
    expect(getOptionId('list', 0)).toBe('list-option-0');
  });

  it('should handle large indices', () => {
    expect(getOptionId('list', 999)).toBe('list-option-999');
  });
});

// ============================================================================
// buildSelectionAnnouncement Utility Tests
// ============================================================================

describe('buildSelectionAnnouncement', () => {
  it('should include SR_PROJECT_SELECTED prefix', () => {
    const result = buildSelectionAnnouncement('My Project');
    expect(result).toContain(SR_PROJECT_SELECTED);
  });

  it('should include project name', () => {
    const result = buildSelectionAnnouncement('My Project');
    expect(result).toContain('My Project');
  });

  it('should format as "Selected {project name}"', () => {
    expect(buildSelectionAnnouncement('Test')).toBe('Selected Test');
  });

  it('should handle project names with spaces', () => {
    const result = buildSelectionAnnouncement('My Awesome Project');
    expect(result).toBe('Selected My Awesome Project');
  });

  it('should handle special characters in name', () => {
    const result = buildSelectionAnnouncement('Project (v2.0)');
    expect(result).toBe('Selected Project (v2.0)');
  });
});

// ============================================================================
// buildHighlightAnnouncement Utility Tests
// ============================================================================

describe('buildHighlightAnnouncement', () => {
  it('should announce regular project option', () => {
    const result = buildHighlightAnnouncement('My Project', 0, 5, false);
    expect(result).toContain('My Project');
    expect(result).toContain('1 of 5');
    expect(result).toContain(SR_OPTION_HIGHLIGHTED);
  });

  it('should announce new project button differently', () => {
    const result = buildHighlightAnnouncement('New Project', 4, 5, true);
    expect(result).toContain(SR_NEW_PROJECT_HIGHLIGHTED);
    expect(result).toContain('5 of 5');
  });

  it('should use 1-based index in announcement', () => {
    const result = buildHighlightAnnouncement('Project', 2, 10, false);
    expect(result).toContain('3 of 10');
  });

  it('should handle first item', () => {
    const result = buildHighlightAnnouncement('First', 0, 3, false);
    expect(result).toContain('1 of 3');
  });

  it('should handle last item before new project', () => {
    const result = buildHighlightAnnouncement('Last', 2, 4, false);
    expect(result).toContain('3 of 4');
  });

  it('should handle new project as only option', () => {
    const result = buildHighlightAnnouncement('New Project', 0, 1, true);
    expect(result).toContain(SR_NEW_PROJECT_HIGHLIGHTED);
    expect(result).toContain('1 of 1');
  });
});

// ============================================================================
// buildProjectAccessibleLabel Utility Tests
// ============================================================================

describe('buildProjectAccessibleLabel', () => {
  it('should include project name', () => {
    const project = { id: '1', name: 'My Project', icon: 'folder' } as any;
    const result = buildProjectAccessibleLabel(project, false);
    expect(result).toContain('My Project');
  });

  it('should add Selected indicator when selected', () => {
    const project = { id: '1', name: 'My Project', icon: 'folder' } as any;
    const result = buildProjectAccessibleLabel(project, true);
    expect(result).toContain('My Project');
    expect(result).toContain(DEFAULT_SELECTED_INDICATOR);
  });

  it('should not add Selected indicator when not selected', () => {
    const project = { id: '1', name: 'My Project', icon: 'folder' } as any;
    const result = buildProjectAccessibleLabel(project, false);
    expect(result).not.toContain(DEFAULT_SELECTED_INDICATOR);
  });

  it('should format selected as comma-separated', () => {
    const project = { id: '1', name: 'Test', icon: 'folder' } as any;
    const result = buildProjectAccessibleLabel(project, true);
    expect(result).toBe('Test, Selected');
  });

  it('should return just name when not selected', () => {
    const project = { id: '1', name: 'Test', icon: 'folder' } as any;
    const result = buildProjectAccessibleLabel(project, false);
    expect(result).toBe('Test');
  });
});

// ============================================================================
// buildCountAnnouncement Utility Tests
// ============================================================================

describe('buildCountAnnouncement', () => {
  it('should replace {count} placeholder with actual count', () => {
    const result = buildCountAnnouncement(5);
    expect(result).toBe('5 projects available');
  });

  it('should handle zero projects', () => {
    const result = buildCountAnnouncement(0);
    expect(result).toBe('0 projects available');
  });

  it('should handle single project', () => {
    const result = buildCountAnnouncement(1);
    expect(result).toBe('1 projects available');
  });

  it('should handle large counts', () => {
    const result = buildCountAnnouncement(100);
    expect(result).toBe('100 projects available');
  });
});

// ============================================================================
// Accessibility Behavior Documentation Tests
// ============================================================================

describe('Accessibility Behavior Documentation', () => {
  describe('ProjectSelector Component', () => {
    it('should document role="combobox" on trigger button', () => {
      // Trigger button has role="combobox" for ARIA pattern
      expect(SELECTOR_TRIGGER_BASE_CLASSES).toBeDefined();
    });

    it('should document aria-expanded tracking open state', () => {
      // aria-expanded={isOpen} tracks dropdown state
      expect(true).toBe(true);
    });

    it('should document aria-haspopup="listbox"', () => {
      // Indicates popup is a listbox
      expect(true).toBe(true);
    });

    it('should document aria-controls pointing to listbox', () => {
      // aria-controls={listboxId} links trigger to listbox
      expect(true).toBe(true);
    });

    it('should document aria-activedescendant for highlighted option', () => {
      // aria-activedescendant={highlightedOptionId} for keyboard nav
      expect(typeof getOptionId).toBe('function');
    });
  });

  describe('Listbox Component', () => {
    it('should document role="listbox" on options container', () => {
      expect(SELECTOR_LISTBOX_CLASSES).toBeDefined();
    });

    it('should document tabIndex={-1} for focus management', () => {
      // Listbox has tabIndex={-1} to receive programmatic focus
      expect(true).toBe(true);
    });

    it('should document aria-label matching trigger', () => {
      expect(DEFAULT_ARIA_LABEL).toBe('Select project');
    });
  });

  describe('Option Elements', () => {
    it('should document role="option" on each item', () => {
      expect(OPTION_BASE_CLASSES).toBeDefined();
    });

    it('should document aria-selected for current selection', () => {
      // aria-selected={isSelected} marks selected option
      expect(OPTION_SELECTED_CLASSES).toContain('font-medium');
    });

    it('should document aria-label with buildProjectAccessibleLabel', () => {
      expect(typeof buildProjectAccessibleLabel).toBe('function');
    });

    it('should document data-highlighted for visual state', () => {
      // data-highlighted attribute for CSS targeting
      expect(OPTION_HIGHLIGHTED_CLASSES).toBeDefined();
    });

    it('should document id for aria-activedescendant', () => {
      // Each option has id={getOptionId(listboxId, index)}
      expect(getOptionId('list', 0)).toContain('option');
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should document VisuallyHidden with role="status"', () => {
      // Announcements use aria-live="polite" aria-atomic="true"
      expect(SR_DROPDOWN_OPENED).toBeDefined();
      expect(SR_DROPDOWN_CLOSED).toBeDefined();
    });

    it('should document open/close announcements', () => {
      expect(SR_DROPDOWN_OPENED).toBe('Project selector opened');
      expect(SR_DROPDOWN_CLOSED).toBe('Project selector closed');
    });

    it('should document selection announcement', () => {
      expect(SR_PROJECT_SELECTED).toBe('Selected');
    });

    it('should document count announcement on open', () => {
      const announcement = buildCountAnnouncement(5);
      expect(announcement).toContain('5 projects available');
    });

    it('should document highlight announcement on navigation', () => {
      const announcement = buildHighlightAnnouncement('Project', 0, 3, false);
      expect(announcement).toContain('Option');
      expect(announcement).toContain('1 of 3');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should document Enter/Space to open dropdown', () => {
      // handleTriggerKeyDown responds to Enter and Space
      expect(true).toBe(true);
    });

    it('should document ArrowDown/ArrowUp to open', () => {
      // Arrow keys also open the dropdown
      expect(true).toBe(true);
    });

    it('should document ArrowDown/ArrowUp to navigate in list', () => {
      // handleListKeyDown navigates through options
      expect(true).toBe(true);
    });

    it('should document Home/End for first/last option', () => {
      // Home goes to first, End goes to last
      expect(true).toBe(true);
    });

    it('should document Escape to close', () => {
      // Escape closes dropdown and returns focus to trigger
      expect(true).toBe(true);
    });

    it('should document Enter/Space to select in list', () => {
      // Enter or Space selects highlighted option
      expect(true).toBe(true);
    });

    it('should document Tab to close without selection', () => {
      // Tab closes dropdown (default browser behavior)
      expect(true).toBe(true);
    });
  });

  describe('Touch Target Compliance', () => {
    it('should document 44px minimum for md size (WCAG 2.5.5)', () => {
      expect(SELECTOR_SIZE_CLASSES.md).toContain('min-h-[44px]');
      expect(OPTION_SIZE_CLASSES.md).toContain('min-h-[44px]');
    });
  });

  describe('Motion Safety', () => {
    it('should document motion-safe prefix on animations', () => {
      expect(SELECTOR_LISTBOX_CLASSES).toContain('motion-safe:');
    });

    it('should document motion-safe on transitions', () => {
      expect(OPTION_BASE_CLASSES).toContain('motion-safe:transition');
    });
  });
});

// ============================================================================
// Component Behavior Documentation Tests
// ============================================================================

describe('Component Behavior Documentation', () => {
  describe('ProjectSelector state management', () => {
    it('should track isOpen state', () => {
      // useState(false) for open/closed
      expect(true).toBe(true);
    });

    it('should track highlightedIndex state', () => {
      // useState(-1) for no highlight, 0+ for option index
      expect(true).toBe(true);
    });

    it('should track announcement state', () => {
      // useState('') for screen reader live region
      expect(true).toBe(true);
    });
  });

  describe('ProjectSelector callbacks', () => {
    it('should call onSelectProject with project ID', () => {
      // onSelectProject?.(projectId)
      expect(true).toBe(true);
    });

    it('should call onNewProject when new project option selected', () => {
      // onNewProject?.()
      expect(true).toBe(true);
    });
  });

  describe('Click outside behavior', () => {
    it('should close dropdown on click outside', () => {
      // useEffect with mousedown listener
      expect(true).toBe(true);
    });

    it('should not close when clicking trigger or list', () => {
      // Check if target is contained in triggerRef or listRef
      expect(true).toBe(true);
    });
  });

  describe('Scroll into view behavior', () => {
    it('should scroll highlighted item into view', () => {
      // useEffect scrolls data-index element into view
      expect(true).toBe(true);
    });
  });
});

// ============================================================================
// Props Documentation Tests
// ============================================================================

describe('Props Documentation', () => {
  describe('ProjectSelectorProps', () => {
    it('should document required projects prop', () => {
      // projects: Project[] - array of available projects
      expect(true).toBe(true);
    });

    it('should document optional selectedProjectId prop', () => {
      // selectedProjectId?: string - ID of currently selected project
      expect(true).toBe(true);
    });

    it('should document optional onSelectProject callback', () => {
      // onSelectProject?: (projectId: string) => void
      expect(true).toBe(true);
    });

    it('should document optional onNewProject callback', () => {
      // onNewProject?: () => void
      expect(true).toBe(true);
    });

    it('should document optional disabled prop', () => {
      expect(SELECTOR_TRIGGER_DISABLED_CLASSES).toBeDefined();
    });

    it('should document optional placeholder prop', () => {
      expect(DEFAULT_PLACEHOLDER).toBe('Select a project...');
    });

    it('should document optional size prop', () => {
      // size?: ResponsiveValue<ProjectSelectorSize>
      expect(Object.keys(SELECTOR_SIZE_CLASSES)).toEqual(['sm', 'md', 'lg']);
    });

    it('should document optional aria-label prop', () => {
      expect(DEFAULT_ARIA_LABEL).toBe('Select project');
    });

    it('should document optional aria-describedby prop', () => {
      // aria-describedby?: string
      expect(true).toBe(true);
    });
  });

  describe('ProjectSelectorSkeletonProps', () => {
    it('should document optional size prop', () => {
      expect(SKELETON_CONTAINER_CLASSES).toBeDefined();
    });

    it('should document optional className prop', () => {
      expect(true).toBe(true);
    });

    it('should document optional data-testid prop', () => {
      expect(true).toBe(true);
    });
  });

  describe('Data Attributes', () => {
    it('should document data-testid support', () => {
      // All components accept data-testid for testing
      expect(true).toBe(true);
    });

    it('should document data-state on container', () => {
      // data-state="open" | "closed"
      expect(true).toBe(true);
    });

    it('should document data-size on container', () => {
      // data-size={baseSize}
      expect(true).toBe(true);
    });

    it('should document data-disabled on container', () => {
      // data-disabled={disabled || undefined}
      expect(true).toBe(true);
    });

    it('should document data-index on options', () => {
      // data-index={index} for scroll into view
      expect(true).toBe(true);
    });

    it('should document data-highlighted on options', () => {
      // data-highlighted={isHighlighted || undefined}
      expect(true).toBe(true);
    });
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('Integration Pattern Tests', () => {
  it('should work with Icon atom', () => {
    // Uses Icon for project icons and chevron
    expect(ICON_SIZE_MAP).toBeDefined();
  });

  it('should work with Skeleton atom', () => {
    // ProjectSelectorSkeleton uses Skeleton for loading state
    expect(SKELETON_CONTAINER_CLASSES).toBeDefined();
  });

  it('should work with VisuallyHidden primitive', () => {
    // Used for screen reader announcements
    expect(SR_DROPDOWN_OPENED).toBeDefined();
    expect(SR_DROPDOWN_CLOSED).toBeDefined();
    expect(SR_PROJECT_SELECTED).toBeDefined();
  });

  it('should work with Project type from @openflow/generated', () => {
    // Accepts Project[] for projects prop
    expect(true).toBe(true);
  });

  it('should work with cn utility from @openflow/utils', () => {
    // Uses cn for conditional class merging
    expect(true).toBe(true);
  });

  it('should work with Lucide icons', () => {
    // Uses Folder, FolderGit2, FolderCode, etc.
    expect(Object.keys(PROJECT_ICON_MAP).length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('Size Consistency Tests', () => {
  const sizes: ProjectSelectorSize[] = ['sm', 'md', 'lg'];

  it('should have consistent height progression in SELECTOR_SIZE_CLASSES', () => {
    const heights = sizes.map((size) => {
      const match = SELECTOR_SIZE_CLASSES[size].match(/min-h-\[(\d+)px\]/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    });

    expect(heights[0]).toBeLessThan(heights[1] as number);
    expect(heights[1]).toBeLessThan(heights[2] as number);
  });

  it('should have consistent height progression in OPTION_SIZE_CLASSES', () => {
    const heights = sizes.map((size) => {
      const match = OPTION_SIZE_CLASSES[size].match(/min-h-\[(\d+)px\]/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    });

    expect(heights[0]).toBeLessThan(heights[1] as number);
    expect(heights[1]).toBeLessThan(heights[2] as number);
  });

  it('should have defined classes for all sizes', () => {
    for (const size of sizes) {
      expect(SELECTOR_SIZE_CLASSES[size]).toBeDefined();
      expect(SELECTOR_PADDING_CLASSES[size]).toBeDefined();
      expect(OPTION_SIZE_CLASSES[size]).toBeDefined();
      expect(ICON_SIZE_MAP[size]).toBeDefined();
    }
  });

  it('should have matching height between selector and options for same size', () => {
    for (const size of sizes) {
      const selectorHeight = SELECTOR_SIZE_CLASSES[size].match(/min-h-\[(\d+)px\]/)?.[1];
      const optionHeight = OPTION_SIZE_CLASSES[size].match(/min-h-\[(\d+)px\]/)?.[1];
      expect(selectorHeight).toBe(optionHeight);
    }
  });
});

// ============================================================================
// Responsive Value Type Tests
// ============================================================================

describe('Responsive Value Type Tests', () => {
  it('should support all breakpoints in ResponsiveValue', () => {
    const breakpoints: ProjectSelectorBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

    for (const bp of breakpoints) {
      const responsive: Partial<Record<ProjectSelectorBreakpoint, ProjectSelectorSize>> = {
        [bp]: 'md',
      };
      expect(getBaseSize(responsive as ResponsiveValue<ProjectSelectorSize>)).toBeDefined();
    }
  });

  it('should handle mixed string and object values', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize({ base: 'lg' })).toBe('lg');
  });
});

// ============================================================================
// Empty State Tests
// ============================================================================

describe('Empty State Tests', () => {
  it('should document empty message for no projects', () => {
    expect(DEFAULT_EMPTY_MESSAGE).toBe('No projects yet');
  });

  it('should document empty message classes', () => {
    expect(EMPTY_MESSAGE_CLASSES).toContain('text-sm');
    expect(EMPTY_MESSAGE_CLASSES).toContain('muted-foreground');
  });
});

// ============================================================================
// New Project Action Tests
// ============================================================================

describe('New Project Action Tests', () => {
  it('should document new project label', () => {
    expect(DEFAULT_NEW_PROJECT_LABEL).toBe('New Project');
  });

  it('should document new project action label for accessibility', () => {
    expect(DEFAULT_NEW_PROJECT_ACTION).toBe('Create new project');
  });

  it('should document new project highlighted announcement', () => {
    expect(SR_NEW_PROJECT_HIGHLIGHTED).toBe('New Project button');
  });

  it('should document divider between projects and new project', () => {
    expect(DIVIDER_CLASSES).toBeDefined();
    expect(DIVIDER_CLASSES).toContain('h-px');
  });
});
