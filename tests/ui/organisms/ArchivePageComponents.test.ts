/**
 * ArchivePageComponents Tests
 *
 * Tests for utility functions and exported constants from ArchivePageComponents.
 * These tests verify the behavior of class generation, announcement text,
 * and responsive sizing utilities.
 */

import { describe, expect, it } from 'vitest';
import {
  ARCHIVE_ACTIONS_CLASSES,
  ARCHIVE_BACK_BUTTON_CLASSES,
  ARCHIVE_CONTENT_CLASSES,
  ARCHIVE_ERROR_CLASSES,
  ARCHIVE_ITEM_BASE_CLASSES,
  ARCHIVE_ITEM_CONTENT_CLASSES,
  ARCHIVE_ITEM_SELECTED_CLASSES,
  ARCHIVE_ITEM_SIZE_CLASSES,
  ARCHIVE_ITEM_UNSELECTED_CLASSES,
  ARCHIVE_LAYOUT_CLASSES,
  ARCHIVE_LIST_CLASSES,
  // Constants
  ARCHIVE_TABS,
  ARCHIVE_TAB_ACTIVE_CLASSES,
  ARCHIVE_TAB_BAR_CLASSES,
  ARCHIVE_TAB_BASE_CLASSES,
  ARCHIVE_TAB_CONTAINER_CLASSES,
  ARCHIVE_TAB_INACTIVE_CLASSES,
  DEFAULT_BACK_LABEL,
  DEFAULT_ITEM_SIZE,
  getArchiveSubtitle,
  getBaseSize,
  getEntityName,
  getResponsiveSizeClasses,
  getRestoreAnnouncement,
  getSelectedAnnouncement,
  getTabChangeAnnouncement,
  // Utility functions
  getTabLabel,
} from '../../../packages/ui/organisms/ArchivePageComponents';

// ============================================================================
// ARCHIVE_TABS Tests
// ============================================================================

describe('ARCHIVE_TABS', () => {
  it('should have 3 tabs', () => {
    expect(ARCHIVE_TABS).toHaveLength(3);
  });

  it('should include tasks tab', () => {
    const tasksTab = ARCHIVE_TABS.find((t) => t.id === 'tasks');
    expect(tasksTab).toBeDefined();
    expect(tasksTab?.label).toBe('Tasks');
  });

  it('should include chats tab', () => {
    const chatsTab = ARCHIVE_TABS.find((t) => t.id === 'chats');
    expect(chatsTab).toBeDefined();
    expect(chatsTab?.label).toBe('Chats');
  });

  it('should include projects tab', () => {
    const projectsTab = ARCHIVE_TABS.find((t) => t.id === 'projects');
    expect(projectsTab).toBeDefined();
    expect(projectsTab?.label).toBe('Projects');
  });

  it('should have tabs in correct order', () => {
    expect(ARCHIVE_TABS[0]?.id).toBe('tasks');
    expect(ARCHIVE_TABS[1]?.id).toBe('chats');
    expect(ARCHIVE_TABS[2]?.id).toBe('projects');
  });
});

// ============================================================================
// Default Constants Tests
// ============================================================================

describe('Default constants', () => {
  it('DEFAULT_ITEM_SIZE should be md', () => {
    expect(DEFAULT_ITEM_SIZE).toBe('md');
  });

  it('DEFAULT_BACK_LABEL should be meaningful', () => {
    expect(DEFAULT_BACK_LABEL).toBe('Back to Dashboard');
  });
});

// ============================================================================
// Layout Classes Tests
// ============================================================================

describe('ARCHIVE_LAYOUT_CLASSES', () => {
  it('should include flex', () => {
    expect(ARCHIVE_LAYOUT_CLASSES).toContain('flex');
  });

  it('should include full height', () => {
    expect(ARCHIVE_LAYOUT_CLASSES).toContain('h-full');
  });

  it('should include flex column', () => {
    expect(ARCHIVE_LAYOUT_CLASSES).toContain('flex-col');
  });
});

describe('ARCHIVE_TAB_BAR_CLASSES', () => {
  it('should include border styling', () => {
    expect(ARCHIVE_TAB_BAR_CLASSES).toContain('border-b');
  });

  it('should include responsive padding', () => {
    expect(ARCHIVE_TAB_BAR_CLASSES).toContain('px-4');
    expect(ARCHIVE_TAB_BAR_CLASSES).toContain('md:px-6');
  });
});

describe('ARCHIVE_TAB_CONTAINER_CLASSES', () => {
  it('should include flex', () => {
    expect(ARCHIVE_TAB_CONTAINER_CLASSES).toContain('flex');
  });

  it('should include rounded styling', () => {
    expect(ARCHIVE_TAB_CONTAINER_CLASSES).toContain('rounded-lg');
  });

  it('should include background', () => {
    expect(ARCHIVE_TAB_CONTAINER_CLASSES).toContain('bg-[rgb(var(--muted))]');
  });
});

describe('ARCHIVE_TAB_BASE_CLASSES', () => {
  it('should include rounded styling', () => {
    expect(ARCHIVE_TAB_BASE_CLASSES).toContain('rounded-md');
  });

  it('should include focus ring styling', () => {
    expect(ARCHIVE_TAB_BASE_CLASSES).toContain('focus-visible:ring-2');
    expect(ARCHIVE_TAB_BASE_CLASSES).toContain('focus-visible:ring-offset-2');
  });

  it('should include motion-safe transitions', () => {
    expect(ARCHIVE_TAB_BASE_CLASSES).toContain('motion-safe:transition-colors');
  });

  it('should include touch target sizing for mobile', () => {
    expect(ARCHIVE_TAB_BASE_CLASSES).toContain('min-h-[44px]');
    expect(ARCHIVE_TAB_BASE_CLASSES).toContain('sm:min-h-8');
  });
});

describe('ARCHIVE_TAB_ACTIVE_CLASSES', () => {
  it('should include background', () => {
    expect(ARCHIVE_TAB_ACTIVE_CLASSES).toContain('bg-[rgb(var(--background))]');
  });

  it('should include foreground text', () => {
    expect(ARCHIVE_TAB_ACTIVE_CLASSES).toContain('text-[rgb(var(--foreground))]');
  });

  it('should include shadow', () => {
    expect(ARCHIVE_TAB_ACTIVE_CLASSES).toContain('shadow-sm');
  });
});

describe('ARCHIVE_TAB_INACTIVE_CLASSES', () => {
  it('should include muted foreground text', () => {
    expect(ARCHIVE_TAB_INACTIVE_CLASSES).toContain('text-[rgb(var(--muted-foreground))]');
  });

  it('should include hover state', () => {
    expect(ARCHIVE_TAB_INACTIVE_CLASSES).toContain('hover:text-[rgb(var(--foreground))]');
  });
});

describe('ARCHIVE_BACK_BUTTON_CLASSES', () => {
  it('should include inline-flex', () => {
    expect(ARCHIVE_BACK_BUTTON_CLASSES).toContain('inline-flex');
  });

  it('should include focus ring styling', () => {
    expect(ARCHIVE_BACK_BUTTON_CLASSES).toContain('focus-visible:ring-2');
  });

  it('should include touch target sizing', () => {
    expect(ARCHIVE_BACK_BUTTON_CLASSES).toContain('min-h-[44px]');
  });
});

// ============================================================================
// Item Classes Tests
// ============================================================================

describe('ARCHIVE_ITEM_BASE_CLASSES', () => {
  it('should include group', () => {
    expect(ARCHIVE_ITEM_BASE_CLASSES).toContain('group');
  });

  it('should include flex', () => {
    expect(ARCHIVE_ITEM_BASE_CLASSES).toContain('flex');
  });

  it('should include rounded styling', () => {
    expect(ARCHIVE_ITEM_BASE_CLASSES).toContain('rounded-lg');
  });

  it('should include border', () => {
    expect(ARCHIVE_ITEM_BASE_CLASSES).toContain('border');
  });

  it('should include motion-safe transitions', () => {
    expect(ARCHIVE_ITEM_BASE_CLASSES).toContain('motion-safe:transition-colors');
  });
});

describe('ARCHIVE_ITEM_SELECTED_CLASSES', () => {
  it('should include primary border', () => {
    expect(ARCHIVE_ITEM_SELECTED_CLASSES).toContain('border-[rgb(var(--primary))]');
  });

  it('should include primary background', () => {
    expect(ARCHIVE_ITEM_SELECTED_CLASSES).toContain('bg-[rgb(var(--primary))]/5');
  });
});

describe('ARCHIVE_ITEM_UNSELECTED_CLASSES', () => {
  it('should include border color', () => {
    expect(ARCHIVE_ITEM_UNSELECTED_CLASSES).toContain('border-[rgb(var(--border))]');
  });

  it('should include card background', () => {
    expect(ARCHIVE_ITEM_UNSELECTED_CLASSES).toContain('bg-[rgb(var(--card))]');
  });

  it('should include hover state', () => {
    expect(ARCHIVE_ITEM_UNSELECTED_CLASSES).toContain('hover:bg-[rgb(var(--muted))]');
  });
});

describe('ARCHIVE_ITEM_CONTENT_CLASSES', () => {
  it('should include flex-1', () => {
    expect(ARCHIVE_ITEM_CONTENT_CLASSES).toContain('flex-1');
  });

  it('should include text-left', () => {
    expect(ARCHIVE_ITEM_CONTENT_CLASSES).toContain('text-left');
  });

  it('should include focus ring styling', () => {
    expect(ARCHIVE_ITEM_CONTENT_CLASSES).toContain('focus-visible:ring-2');
  });

  it('should include touch target sizing', () => {
    expect(ARCHIVE_ITEM_CONTENT_CLASSES).toContain('min-h-[44px]');
  });
});

describe('ARCHIVE_ACTIONS_CLASSES', () => {
  it('should include flex', () => {
    expect(ARCHIVE_ACTIONS_CLASSES).toContain('flex');
  });

  it('should include opacity-0 by default', () => {
    expect(ARCHIVE_ACTIONS_CLASSES).toContain('opacity-0');
  });

  it('should include group-hover visibility', () => {
    expect(ARCHIVE_ACTIONS_CLASSES).toContain('group-hover:opacity-100');
  });

  it('should include group-focus-within visibility', () => {
    expect(ARCHIVE_ACTIONS_CLASSES).toContain('group-focus-within:opacity-100');
  });

  it('should include motion-safe transition', () => {
    expect(ARCHIVE_ACTIONS_CLASSES).toContain('motion-safe:transition-opacity');
  });
});

describe('ARCHIVE_CONTENT_CLASSES', () => {
  it('should include flex-1', () => {
    expect(ARCHIVE_CONTENT_CLASSES).toContain('flex-1');
  });

  it('should include overflow-auto', () => {
    expect(ARCHIVE_CONTENT_CLASSES).toContain('overflow-auto');
  });

  it('should include responsive padding', () => {
    expect(ARCHIVE_CONTENT_CLASSES).toContain('p-4');
    expect(ARCHIVE_CONTENT_CLASSES).toContain('md:p-6');
  });
});

describe('ARCHIVE_LIST_CLASSES', () => {
  it('should include spacing', () => {
    expect(ARCHIVE_LIST_CLASSES).toContain('space-y-2');
  });
});

describe('ARCHIVE_ERROR_CLASSES', () => {
  it('should include flex', () => {
    expect(ARCHIVE_ERROR_CLASSES).toContain('flex');
  });

  it('should include centering', () => {
    expect(ARCHIVE_ERROR_CLASSES).toContain('items-center');
    expect(ARCHIVE_ERROR_CLASSES).toContain('justify-center');
  });

  it('should include full height', () => {
    expect(ARCHIVE_ERROR_CLASSES).toContain('h-full');
  });
});

// ============================================================================
// ARCHIVE_ITEM_SIZE_CLASSES Tests
// ============================================================================

describe('ARCHIVE_ITEM_SIZE_CLASSES', () => {
  it('should have sm size classes', () => {
    expect(ARCHIVE_ITEM_SIZE_CLASSES.sm).toContain('p-3');
    expect(ARCHIVE_ITEM_SIZE_CLASSES.sm).toContain('gap-1');
  });

  it('should have md size classes', () => {
    expect(ARCHIVE_ITEM_SIZE_CLASSES.md).toContain('p-4');
    expect(ARCHIVE_ITEM_SIZE_CLASSES.md).toContain('gap-2');
  });

  it('should have lg size classes', () => {
    expect(ARCHIVE_ITEM_SIZE_CLASSES.lg).toContain('p-5');
    expect(ARCHIVE_ITEM_SIZE_CLASSES.lg).toContain('gap-3');
  });

  it('should have progressively larger padding', () => {
    // Extract padding values
    const smPadding = ARCHIVE_ITEM_SIZE_CLASSES.sm.match(/p-(\d)/)?.[1];
    const mdPadding = ARCHIVE_ITEM_SIZE_CLASSES.md.match(/p-(\d)/)?.[1];
    const lgPadding = ARCHIVE_ITEM_SIZE_CLASSES.lg.match(/p-(\d)/)?.[1];

    expect(Number(smPadding)).toBeLessThan(Number(mdPadding));
    expect(Number(mdPadding)).toBeLessThan(Number(lgPadding));
  });
});

// ============================================================================
// getTabLabel Tests
// ============================================================================

describe('getTabLabel', () => {
  it('should return "Tasks" for tasks tab', () => {
    expect(getTabLabel('tasks')).toBe('Tasks');
  });

  it('should return "Chats" for chats tab', () => {
    expect(getTabLabel('chats')).toBe('Chats');
  });

  it('should return "Projects" for projects tab', () => {
    expect(getTabLabel('projects')).toBe('Projects');
  });
});

// ============================================================================
// getEntityName Tests
// ============================================================================

describe('getEntityName', () => {
  it('should return singular for count of 1', () => {
    expect(getEntityName('tasks', 1)).toBe('task');
    expect(getEntityName('chats', 1)).toBe('chat');
    expect(getEntityName('projects', 1)).toBe('project');
  });

  it('should return plural for count of 0', () => {
    expect(getEntityName('tasks', 0)).toBe('tasks');
    expect(getEntityName('chats', 0)).toBe('chats');
    expect(getEntityName('projects', 0)).toBe('projects');
  });

  it('should return plural for count > 1', () => {
    expect(getEntityName('tasks', 5)).toBe('tasks');
    expect(getEntityName('chats', 10)).toBe('chats');
    expect(getEntityName('projects', 100)).toBe('projects');
  });
});

// ============================================================================
// getArchiveSubtitle Tests
// ============================================================================

describe('getArchiveSubtitle', () => {
  it('should format subtitle for tasks', () => {
    expect(getArchiveSubtitle(5, 'tasks')).toBe('5 archived tasks');
    expect(getArchiveSubtitle(1, 'tasks')).toBe('1 archived task');
  });

  it('should format subtitle for chats', () => {
    expect(getArchiveSubtitle(3, 'chats')).toBe('3 archived chats');
    expect(getArchiveSubtitle(1, 'chats')).toBe('1 archived chat');
  });

  it('should format subtitle for projects', () => {
    expect(getArchiveSubtitle(2, 'projects')).toBe('2 archived projects');
    expect(getArchiveSubtitle(1, 'projects')).toBe('1 archived project');
  });

  it('should handle zero count', () => {
    expect(getArchiveSubtitle(0, 'tasks')).toBe('0 archived tasks');
  });
});

// ============================================================================
// getBaseSize Tests
// ============================================================================

describe('getBaseSize', () => {
  it('should return DEFAULT_ITEM_SIZE when undefined', () => {
    expect(getBaseSize(undefined)).toBe(DEFAULT_ITEM_SIZE);
  });

  it('should return the size when string', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('should return base size from responsive object', () => {
    expect(getBaseSize({ base: 'sm' })).toBe('sm');
    expect(getBaseSize({ base: 'lg', md: 'md' })).toBe('lg');
  });

  it('should return DEFAULT_ITEM_SIZE when responsive object has no base', () => {
    expect(getBaseSize({ md: 'lg' })).toBe(DEFAULT_ITEM_SIZE);
  });
});

// ============================================================================
// getResponsiveSizeClasses Tests
// ============================================================================

describe('getResponsiveSizeClasses', () => {
  it('should return md classes when undefined', () => {
    const classes = getResponsiveSizeClasses(undefined);
    expect(classes).toBe(ARCHIVE_ITEM_SIZE_CLASSES.md);
  });

  it('should return size classes for string value', () => {
    expect(getResponsiveSizeClasses('sm')).toBe(ARCHIVE_ITEM_SIZE_CLASSES.sm);
    expect(getResponsiveSizeClasses('md')).toBe(ARCHIVE_ITEM_SIZE_CLASSES.md);
    expect(getResponsiveSizeClasses('lg')).toBe(ARCHIVE_ITEM_SIZE_CLASSES.lg);
  });

  it('should return base classes for responsive object with base only', () => {
    const classes = getResponsiveSizeClasses({ base: 'sm' });
    expect(classes).toContain('p-3');
    expect(classes).toContain('gap-1');
  });

  it('should add breakpoint prefixes for responsive values', () => {
    const classes = getResponsiveSizeClasses({ base: 'sm', md: 'md', lg: 'lg' });
    expect(classes).toContain('p-3'); // base
    expect(classes).toContain('md:p-4'); // md
    expect(classes).toContain('lg:p-5'); // lg
  });

  it('should handle responsive object without base', () => {
    const classes = getResponsiveSizeClasses({ md: 'lg' });
    expect(classes).toContain(ARCHIVE_ITEM_SIZE_CLASSES.md); // default base
    expect(classes).toContain('md:p-5'); // lg at md breakpoint
  });

  it('should handle all breakpoints', () => {
    const classes = getResponsiveSizeClasses({
      base: 'sm',
      sm: 'md',
      md: 'lg',
      lg: 'sm',
      xl: 'md',
      '2xl': 'lg',
    });
    expect(classes).toContain('p-3'); // base sm
    expect(classes).toContain('sm:p-4'); // sm md
    expect(classes).toContain('md:p-5'); // md lg
    expect(classes).toContain('lg:p-3'); // lg sm
    expect(classes).toContain('xl:p-4'); // xl md
    expect(classes).toContain('2xl:p-5'); // 2xl lg
  });
});

// ============================================================================
// getTabChangeAnnouncement Tests
// ============================================================================

describe('getTabChangeAnnouncement', () => {
  it('should announce tasks tab with count', () => {
    expect(getTabChangeAnnouncement('tasks', 5)).toBe('Tasks tab selected. 5 tasks in archive.');
  });

  it('should announce chats tab with singular', () => {
    expect(getTabChangeAnnouncement('chats', 1)).toBe('Chats tab selected. 1 chat in archive.');
  });

  it('should announce projects tab', () => {
    expect(getTabChangeAnnouncement('projects', 0)).toBe(
      'Projects tab selected. 0 projects in archive.'
    );
  });
});

// ============================================================================
// getRestoreAnnouncement Tests
// ============================================================================

describe('getRestoreAnnouncement', () => {
  it('should announce task restoration', () => {
    expect(getRestoreAnnouncement('task', 'My Task')).toBe('Restoring task: My Task');
  });

  it('should announce chat restoration', () => {
    expect(getRestoreAnnouncement('chat', 'My Chat')).toBe('Restoring chat: My Chat');
  });

  it('should announce project restoration', () => {
    expect(getRestoreAnnouncement('project', 'My Project')).toBe('Restoring project: My Project');
  });
});

// ============================================================================
// getSelectedAnnouncement Tests
// ============================================================================

describe('getSelectedAnnouncement', () => {
  it('should announce selected task', () => {
    expect(getSelectedAnnouncement('task', 'My Task', true)).toBe('My Task task selected');
  });

  it('should announce unselected task', () => {
    expect(getSelectedAnnouncement('task', 'My Task', false)).toBe('My Task task');
  });

  it('should announce selected chat', () => {
    expect(getSelectedAnnouncement('chat', 'My Chat', true)).toBe('My Chat chat selected');
  });

  it('should announce selected project', () => {
    expect(getSelectedAnnouncement('project', 'My Project', true)).toBe(
      'My Project project selected'
    );
  });
});

// ============================================================================
// Accessibility Pattern Tests
// ============================================================================

describe('Accessibility patterns', () => {
  it('all tab classes should have focus ring styling', () => {
    expect(ARCHIVE_TAB_BASE_CLASSES).toContain('focus-visible:ring-2');
    expect(ARCHIVE_TAB_BASE_CLASSES).toContain('focus-visible:ring-offset-2');
    expect(ARCHIVE_TAB_BASE_CLASSES).toContain('focus-visible:outline-none');
  });

  it('all interactive element classes should have touch targets', () => {
    expect(ARCHIVE_TAB_BASE_CLASSES).toContain('min-h-[44px]');
    expect(ARCHIVE_BACK_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(ARCHIVE_ITEM_CONTENT_CLASSES).toContain('min-h-[44px]');
  });

  it('all transitions should be motion-safe', () => {
    expect(ARCHIVE_TAB_BASE_CLASSES).toContain('motion-safe:');
    expect(ARCHIVE_ITEM_BASE_CLASSES).toContain('motion-safe:');
    expect(ARCHIVE_ACTIONS_CLASSES).toContain('motion-safe:');
    expect(ARCHIVE_BACK_BUTTON_CLASSES).toContain('motion-safe:');
  });
});

// ============================================================================
// Responsive Pattern Tests
// ============================================================================

describe('Responsive patterns', () => {
  it('tab bar should have responsive padding', () => {
    expect(ARCHIVE_TAB_BAR_CLASSES).toContain('px-4');
    expect(ARCHIVE_TAB_BAR_CLASSES).toContain('md:px-6');
  });

  it('content should have responsive padding', () => {
    expect(ARCHIVE_CONTENT_CLASSES).toContain('p-4');
    expect(ARCHIVE_CONTENT_CLASSES).toContain('md:p-6');
  });

  it('touch targets should relax on larger screens', () => {
    expect(ARCHIVE_TAB_BASE_CLASSES).toContain('sm:min-h-8');
    expect(ARCHIVE_BACK_BUTTON_CLASSES).toContain('sm:min-h-8');
  });
});

// ============================================================================
// Type Safety Tests
// ============================================================================

describe('Type safety', () => {
  it('ARCHIVE_ITEM_SIZE_CLASSES should have all size keys', () => {
    expect(ARCHIVE_ITEM_SIZE_CLASSES).toHaveProperty('sm');
    expect(ARCHIVE_ITEM_SIZE_CLASSES).toHaveProperty('md');
    expect(ARCHIVE_ITEM_SIZE_CLASSES).toHaveProperty('lg');
  });

  it('all size values should be strings', () => {
    expect(typeof ARCHIVE_ITEM_SIZE_CLASSES.sm).toBe('string');
    expect(typeof ARCHIVE_ITEM_SIZE_CLASSES.md).toBe('string');
    expect(typeof ARCHIVE_ITEM_SIZE_CLASSES.lg).toBe('string');
  });
});
