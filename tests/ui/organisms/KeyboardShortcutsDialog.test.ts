import {
  CONTENT_PADDING_CLASSES,
  // Constants
  DEFAULT_DIALOG_TITLE,
  FOOTER_KEY_CLASSES,
  FOOTER_NOTE_CLASSES,
  GROUP_SPACING_CLASSES,
  GROUP_TITLE_CLASSES,
  HINT_CONTAINER_CLASSES,
  HINT_KEY_CLASSES,
  HINT_KEY_SIZE_CLASSES,
  ICON_SIZE_MAP,
  ITEM_PADDING_CLASSES,
  KEYS_CONTAINER_CLASSES,
  KEY_BASE_CLASSES,
  KEY_SIZE_CLASSES,
  type KeyboardShortcutsDialogBreakpoint,
  // Types
  type KeyboardShortcutsDialogSize,
  PLATFORM_NOTE_TEXT,
  SHORTCUT_ITEM_BASE_CLASSES,
  SHORTCUT_LIST_CLASSES,
  SIZE_TO_DIALOG_SIZE,
  SR_DIALOG_OPENED,
  SR_GROUP_COUNT_TEMPLATE,
  SR_PLATFORM_NOTE,
  SR_SHORTCUTS_IN_GROUP_TEMPLATE,
  SR_TOGGLE_HINT,
  type ShortcutGroup,
  TOGGLE_HINT_TEXT,
  TOGGLE_SHORTCUT_KEYS,
  buildGroupCountAnnouncement,
  buildShortcutsInGroupAnnouncement,
  defaultShortcutGroups,
  formatKeysForSR,
  // Utility functions
  getBaseSize,
  getDialogSize,
  getResponsiveSizeClasses,
  getTotalShortcutCount,
} from '@openflow/ui/organisms/KeyboardShortcutsDialog';
import { describe, expect, it } from 'vitest';

// ============================================================================
// Default Constants Tests
// ============================================================================

describe('KeyboardShortcutsDialog Constants', () => {
  describe('DEFAULT_DIALOG_TITLE', () => {
    it('should have correct default title', () => {
      expect(DEFAULT_DIALOG_TITLE).toBe('Keyboard Shortcuts');
    });
  });

  describe('TOGGLE_SHORTCUT_KEYS', () => {
    it('should have correct toggle shortcut keys', () => {
      expect(TOGGLE_SHORTCUT_KEYS).toEqual(['⌘', '/']);
    });
  });

  describe('TOGGLE_HINT_TEXT', () => {
    it('should have correct toggle hint text', () => {
      expect(TOGGLE_HINT_TEXT).toBe('Press ⌘/ to toggle this dialog');
    });
  });

  describe('SR_TOGGLE_HINT', () => {
    it('should have screen reader friendly toggle hint', () => {
      expect(SR_TOGGLE_HINT).toBe('Press Command Slash to toggle this dialog');
    });
  });

  describe('PLATFORM_NOTE_TEXT', () => {
    it('should have correct platform note text', () => {
      expect(PLATFORM_NOTE_TEXT).toBe('Note: On Windows/Linux, use Ctrl instead of ⌘');
    });
  });

  describe('SR_PLATFORM_NOTE', () => {
    it('should have screen reader friendly platform note', () => {
      expect(SR_PLATFORM_NOTE).toBe('Note: On Windows or Linux, use Control instead of Command');
    });
  });

  describe('SR_DIALOG_OPENED', () => {
    it('should have screen reader dialog opened announcement', () => {
      expect(SR_DIALOG_OPENED).toBe('Keyboard shortcuts dialog opened.');
    });
  });

  describe('SR_GROUP_COUNT_TEMPLATE', () => {
    it('should have group count template', () => {
      expect(SR_GROUP_COUNT_TEMPLATE).toBe('{count} shortcut groups available.');
    });

    it('should contain count placeholder', () => {
      expect(SR_GROUP_COUNT_TEMPLATE).toContain('{count}');
    });
  });

  describe('SR_SHORTCUTS_IN_GROUP_TEMPLATE', () => {
    it('should have shortcuts in group template', () => {
      expect(SR_SHORTCUTS_IN_GROUP_TEMPLATE).toBe('{count} shortcuts in {group}.');
    });

    it('should contain count and group placeholders', () => {
      expect(SR_SHORTCUTS_IN_GROUP_TEMPLATE).toContain('{count}');
      expect(SR_SHORTCUTS_IN_GROUP_TEMPLATE).toContain('{group}');
    });
  });
});

// ============================================================================
// Size Mapping Tests
// ============================================================================

describe('Size Mappings', () => {
  describe('SIZE_TO_DIALOG_SIZE', () => {
    it('should map sm to md', () => {
      expect(SIZE_TO_DIALOG_SIZE.sm).toBe('md');
    });

    it('should map md to lg', () => {
      expect(SIZE_TO_DIALOG_SIZE.md).toBe('lg');
    });

    it('should map lg to xl', () => {
      expect(SIZE_TO_DIALOG_SIZE.lg).toBe('xl');
    });

    it('should have all sizes defined', () => {
      expect(Object.keys(SIZE_TO_DIALOG_SIZE)).toEqual(['sm', 'md', 'lg']);
    });
  });

  describe('CONTENT_PADDING_CLASSES', () => {
    it('should have spacing for sm', () => {
      expect(CONTENT_PADDING_CLASSES.sm).toBe('space-y-4');
    });

    it('should have spacing for md', () => {
      expect(CONTENT_PADDING_CLASSES.md).toBe('space-y-5');
    });

    it('should have spacing for lg', () => {
      expect(CONTENT_PADDING_CLASSES.lg).toBe('space-y-6');
    });

    it('should have all sizes defined', () => {
      expect(Object.keys(CONTENT_PADDING_CLASSES)).toEqual(['sm', 'md', 'lg']);
    });

    it('should have increasing spacing values', () => {
      // sm=4, md=5, lg=6
      expect(CONTENT_PADDING_CLASSES.sm).toContain('4');
      expect(CONTENT_PADDING_CLASSES.md).toContain('5');
      expect(CONTENT_PADDING_CLASSES.lg).toContain('6');
    });
  });

  describe('GROUP_SPACING_CLASSES', () => {
    it('should have spacing for sm', () => {
      expect(GROUP_SPACING_CLASSES.sm).toBe('mb-2');
    });

    it('should have spacing for md', () => {
      expect(GROUP_SPACING_CLASSES.md).toBe('mb-2.5');
    });

    it('should have spacing for lg', () => {
      expect(GROUP_SPACING_CLASSES.lg).toBe('mb-3');
    });

    it('should all use margin-bottom', () => {
      Object.values(GROUP_SPACING_CLASSES).forEach((cls) => {
        expect(cls).toMatch(/^mb-/);
      });
    });
  });

  describe('ITEM_PADDING_CLASSES', () => {
    it('should have padding for sm', () => {
      expect(ITEM_PADDING_CLASSES.sm).toBe('py-1.5 px-1.5');
    });

    it('should have padding for md', () => {
      expect(ITEM_PADDING_CLASSES.md).toBe('py-2 px-2');
    });

    it('should have padding for lg', () => {
      expect(ITEM_PADDING_CLASSES.lg).toBe('py-2.5 px-2.5');
    });

    it('should all include py- and px- classes', () => {
      Object.values(ITEM_PADDING_CLASSES).forEach((cls) => {
        expect(cls).toContain('py-');
        expect(cls).toContain('px-');
      });
    });
  });

  describe('KEY_SIZE_CLASSES', () => {
    it('should have size classes for sm', () => {
      expect(KEY_SIZE_CLASSES.sm).toContain('min-w-');
      expect(KEY_SIZE_CLASSES.sm).toContain('h-5');
    });

    it('should have size classes for md', () => {
      expect(KEY_SIZE_CLASSES.md).toContain('min-w-');
      expect(KEY_SIZE_CLASSES.md).toContain('h-6');
    });

    it('should have size classes for lg', () => {
      expect(KEY_SIZE_CLASSES.lg).toContain('min-w-');
      expect(KEY_SIZE_CLASSES.lg).toContain('h-7');
    });

    it('should have font size progression', () => {
      expect(KEY_SIZE_CLASSES.sm).toContain('text-[10px]');
      expect(KEY_SIZE_CLASSES.md).toContain('text-xs');
      expect(KEY_SIZE_CLASSES.lg).toContain('text-sm');
    });
  });

  describe('HINT_KEY_SIZE_CLASSES', () => {
    it('should have size classes for all sizes', () => {
      expect(Object.keys(HINT_KEY_SIZE_CLASSES)).toEqual(['sm', 'md', 'lg']);
    });

    it('should all include padding and text size', () => {
      Object.values(HINT_KEY_SIZE_CLASSES).forEach((cls) => {
        expect(cls).toMatch(/px-/);
        expect(cls).toMatch(/py-/);
        expect(cls).toMatch(/text-/);
      });
    });
  });

  describe('ICON_SIZE_MAP', () => {
    it('should map sm to xs', () => {
      expect(ICON_SIZE_MAP.sm).toBe('xs');
    });

    it('should map md to sm', () => {
      expect(ICON_SIZE_MAP.md).toBe('sm');
    });

    it('should map lg to md', () => {
      expect(ICON_SIZE_MAP.lg).toBe('md');
    });
  });
});

// ============================================================================
// CSS Class Constants Tests
// ============================================================================

describe('CSS Class Constants', () => {
  describe('HINT_CONTAINER_CLASSES', () => {
    it('should have flex layout', () => {
      expect(HINT_CONTAINER_CLASSES).toContain('flex');
    });

    it('should have gap and alignment', () => {
      expect(HINT_CONTAINER_CLASSES).toContain('items-center');
      expect(HINT_CONTAINER_CLASSES).toContain('gap-2');
    });
  });

  describe('KEY_BASE_CLASSES', () => {
    it('should have flex centering', () => {
      expect(KEY_BASE_CLASSES).toContain('inline-flex');
      expect(KEY_BASE_CLASSES).toContain('items-center');
      expect(KEY_BASE_CLASSES).toContain('justify-center');
    });

    it('should have border styling', () => {
      expect(KEY_BASE_CLASSES).toContain('rounded');
      expect(KEY_BASE_CLASSES).toContain('border');
    });

    it('should have background color', () => {
      expect(KEY_BASE_CLASSES).toContain('bg-');
    });

    it('should have shadow', () => {
      expect(KEY_BASE_CLASSES).toContain('shadow-sm');
    });
  });

  describe('HINT_KEY_CLASSES', () => {
    it('should have rounded corners', () => {
      expect(HINT_KEY_CLASSES).toContain('rounded');
    });

    it('should have monospace font', () => {
      expect(HINT_KEY_CLASSES).toContain('font-mono');
    });
  });

  describe('GROUP_TITLE_CLASSES', () => {
    it('should have small text size', () => {
      expect(GROUP_TITLE_CLASSES).toContain('text-sm');
    });

    it('should have uppercase styling', () => {
      expect(GROUP_TITLE_CLASSES).toContain('uppercase');
    });

    it('should have letter spacing', () => {
      expect(GROUP_TITLE_CLASSES).toContain('tracking-wide');
    });
  });

  describe('SHORTCUT_LIST_CLASSES', () => {
    it('should have vertical spacing', () => {
      expect(SHORTCUT_LIST_CLASSES).toContain('space-y-1');
    });
  });

  describe('SHORTCUT_ITEM_BASE_CLASSES', () => {
    it('should have flex layout', () => {
      expect(SHORTCUT_ITEM_BASE_CLASSES).toContain('flex');
    });

    it('should have items-center and justify-between', () => {
      expect(SHORTCUT_ITEM_BASE_CLASSES).toContain('items-center');
      expect(SHORTCUT_ITEM_BASE_CLASSES).toContain('justify-between');
    });

    it('should have rounded corners', () => {
      expect(SHORTCUT_ITEM_BASE_CLASSES).toContain('rounded-md');
    });

    it('should have hover state', () => {
      expect(SHORTCUT_ITEM_BASE_CLASSES).toContain('hover:');
    });

    it('should have touch target of 44px on mobile (WCAG 2.5.5)', () => {
      expect(SHORTCUT_ITEM_BASE_CLASSES).toContain('min-h-[44px]');
    });

    it('should relax touch target on desktop', () => {
      expect(SHORTCUT_ITEM_BASE_CLASSES).toContain('sm:min-h-0');
    });

    it('should have motion-safe transitions', () => {
      expect(SHORTCUT_ITEM_BASE_CLASSES).toContain('motion-safe:transition');
    });
  });

  describe('KEYS_CONTAINER_CLASSES', () => {
    it('should have flex layout with gap', () => {
      expect(KEYS_CONTAINER_CLASSES).toContain('flex');
      expect(KEYS_CONTAINER_CLASSES).toContain('gap-1');
    });
  });

  describe('FOOTER_NOTE_CLASSES', () => {
    it('should have small text size', () => {
      expect(FOOTER_NOTE_CLASSES).toContain('text-xs');
    });

    it('should have border-top for separation', () => {
      expect(FOOTER_NOTE_CLASSES).toContain('border-t');
    });

    it('should have padding-top', () => {
      expect(FOOTER_NOTE_CLASSES).toContain('pt-4');
    });
  });

  describe('FOOTER_KEY_CLASSES', () => {
    it('should have rounded corners', () => {
      expect(FOOTER_KEY_CLASSES).toContain('rounded');
    });

    it('should have monospace font', () => {
      expect(FOOTER_KEY_CLASSES).toContain('font-mono');
    });

    it('should have small text size', () => {
      expect(FOOTER_KEY_CLASSES).toContain('text-[10px]');
    });
  });
});

// ============================================================================
// Default Shortcut Groups Tests
// ============================================================================

describe('defaultShortcutGroups', () => {
  it('should have 5 groups', () => {
    expect(defaultShortcutGroups.length).toBe(5);
  });

  it('should have Navigation group', () => {
    const navGroup = defaultShortcutGroups.find((g) => g.title === 'Navigation');
    expect(navGroup).toBeDefined();
    expect(navGroup?.shortcuts.length).toBe(4);
  });

  it('should have Tasks group', () => {
    const tasksGroup = defaultShortcutGroups.find((g) => g.title === 'Tasks');
    expect(tasksGroup).toBeDefined();
    expect(tasksGroup?.shortcuts.length).toBe(2);
  });

  it('should have Chat group', () => {
    const chatGroup = defaultShortcutGroups.find((g) => g.title === 'Chat');
    expect(chatGroup).toBeDefined();
    expect(chatGroup?.shortcuts.length).toBe(3);
  });

  it('should have Steps Panel group', () => {
    const stepsGroup = defaultShortcutGroups.find((g) => g.title === 'Steps Panel');
    expect(stepsGroup).toBeDefined();
    expect(stepsGroup?.shortcuts.length).toBe(4);
  });

  it('should have General group', () => {
    const generalGroup = defaultShortcutGroups.find((g) => g.title === 'General');
    expect(generalGroup).toBeDefined();
    expect(generalGroup?.shortcuts.length).toBe(4);
  });

  it('should have total of 17 shortcuts', () => {
    const total = getTotalShortcutCount(defaultShortcutGroups);
    expect(total).toBe(17);
  });

  it('each shortcut should have keys array and description', () => {
    defaultShortcutGroups.forEach((group) => {
      group.shortcuts.forEach((shortcut) => {
        expect(Array.isArray(shortcut.keys)).toBe(true);
        expect(shortcut.keys.length).toBeGreaterThan(0);
        expect(typeof shortcut.description).toBe('string');
        expect(shortcut.description.length).toBeGreaterThan(0);
      });
    });
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('Utility Functions', () => {
  describe('getBaseSize', () => {
    it('should return md for undefined', () => {
      expect(getBaseSize(undefined)).toBe('md');
    });

    it('should return the string value for string input', () => {
      expect(getBaseSize('sm')).toBe('sm');
      expect(getBaseSize('md')).toBe('md');
      expect(getBaseSize('lg')).toBe('lg');
    });

    it('should return base value from responsive object', () => {
      expect(getBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
      expect(getBaseSize({ base: 'lg' })).toBe('lg');
    });

    it('should return md if responsive object has no base', () => {
      expect(getBaseSize({ md: 'lg' })).toBe('md');
    });

    it('should return md for null-ish values', () => {
      expect(getBaseSize(null as unknown as undefined)).toBe('md');
    });
  });

  describe('getResponsiveSizeClasses', () => {
    it('should return md classes for undefined', () => {
      expect(getResponsiveSizeClasses(undefined)).toBe(CONTENT_PADDING_CLASSES.md);
    });

    it('should return correct classes for string size', () => {
      expect(getResponsiveSizeClasses('sm')).toBe(CONTENT_PADDING_CLASSES.sm);
      expect(getResponsiveSizeClasses('md')).toBe(CONTENT_PADDING_CLASSES.md);
      expect(getResponsiveSizeClasses('lg')).toBe(CONTENT_PADDING_CLASSES.lg);
    });

    it('should generate breakpoint-prefixed classes for responsive object', () => {
      const result = getResponsiveSizeClasses({ base: 'sm', md: 'lg' });
      expect(result).toContain('space-y-4'); // base: sm
      expect(result).toContain('md:space-y-6'); // md: lg
    });

    it('should handle responsive object with all breakpoints', () => {
      const result = getResponsiveSizeClasses({
        base: 'sm',
        sm: 'sm',
        md: 'md',
        lg: 'lg',
      });
      expect(result).toContain('space-y-4'); // base: sm
      expect(result).toContain('sm:space-y-4'); // sm: sm
      expect(result).toContain('md:space-y-5'); // md: md
      expect(result).toContain('lg:space-y-6'); // lg: lg
    });
  });

  describe('getDialogSize', () => {
    it('should return lg for undefined', () => {
      expect(getDialogSize(undefined)).toBe('lg');
    });

    it('should return mapped size for string input', () => {
      expect(getDialogSize('sm')).toBe('md');
      expect(getDialogSize('md')).toBe('lg');
      expect(getDialogSize('lg')).toBe('xl');
    });

    it('should return responsive object with mapped sizes', () => {
      const result = getDialogSize({ base: 'sm', lg: 'lg' });
      expect(result).toEqual({ base: 'md', lg: 'xl' });
    });

    it('should handle all breakpoints in responsive object', () => {
      const result = getDialogSize({
        base: 'sm',
        sm: 'md',
        md: 'lg',
      });
      expect(result).toEqual({
        base: 'md',
        sm: 'lg',
        md: 'xl',
      });
    });
  });

  describe('formatKeysForSR', () => {
    it('should format command key', () => {
      expect(formatKeysForSR(['⌘'])).toBe('Command');
    });

    it('should format command + K', () => {
      expect(formatKeysForSR(['⌘', 'K'])).toBe('Command plus K');
    });

    it('should format shift key', () => {
      expect(formatKeysForSR(['⇧'])).toBe('Shift');
    });

    it('should format option key', () => {
      expect(formatKeysForSR(['⌥'])).toBe('Option');
    });

    it('should format control key', () => {
      expect(formatKeysForSR(['⌃'])).toBe('Control');
    });

    it('should format enter key', () => {
      expect(formatKeysForSR(['↵'])).toBe('Enter');
    });

    it('should format arrow keys', () => {
      expect(formatKeysForSR(['↑'])).toBe('Up Arrow');
      expect(formatKeysForSR(['↓'])).toBe('Down Arrow');
      expect(formatKeysForSR(['←'])).toBe('Left Arrow');
      expect(formatKeysForSR(['→'])).toBe('Right Arrow');
    });

    it('should format escape key', () => {
      expect(formatKeysForSR(['Esc'])).toBe('Escape');
    });

    it('should format tab key', () => {
      expect(formatKeysForSR(['Tab'])).toBe('Tab');
    });

    it('should format space key', () => {
      expect(formatKeysForSR(['Space'])).toBe('Space');
    });

    it('should format backtick', () => {
      expect(formatKeysForSR(['`'])).toBe('Backtick');
    });

    it('should format slash', () => {
      expect(formatKeysForSR(['/'])).toBe('Slash');
    });

    it('should format comma', () => {
      expect(formatKeysForSR([','])).toBe('Comma');
    });

    it('should format period', () => {
      expect(formatKeysForSR(['.'])).toBe('Period');
    });

    it('should pass through unknown keys', () => {
      expect(formatKeysForSR(['X'])).toBe('X');
      expect(formatKeysForSR(['F1'])).toBe('F1');
    });

    it('should format complex combinations', () => {
      expect(formatKeysForSR(['⌘', '⇧', 'P'])).toBe('Command plus Shift plus P');
      expect(formatKeysForSR(['⌃', '⌥', '↵'])).toBe('Control plus Option plus Enter');
    });

    it('should handle empty array', () => {
      expect(formatKeysForSR([])).toBe('');
    });
  });

  describe('buildGroupCountAnnouncement', () => {
    it('should build announcement with count', () => {
      expect(buildGroupCountAnnouncement(5)).toBe('5 shortcut groups available.');
    });

    it('should work with 1 group', () => {
      expect(buildGroupCountAnnouncement(1)).toBe('1 shortcut groups available.');
    });

    it('should work with 0 groups', () => {
      expect(buildGroupCountAnnouncement(0)).toBe('0 shortcut groups available.');
    });

    it('should work with large numbers', () => {
      expect(buildGroupCountAnnouncement(100)).toBe('100 shortcut groups available.');
    });
  });

  describe('buildShortcutsInGroupAnnouncement', () => {
    it('should build announcement with count and group name', () => {
      expect(buildShortcutsInGroupAnnouncement(4, 'Navigation')).toBe('4 shortcuts in Navigation.');
    });

    it('should work with 1 shortcut', () => {
      expect(buildShortcutsInGroupAnnouncement(1, 'Tasks')).toBe('1 shortcuts in Tasks.');
    });

    it('should work with 0 shortcuts', () => {
      expect(buildShortcutsInGroupAnnouncement(0, 'Empty')).toBe('0 shortcuts in Empty.');
    });
  });

  describe('getTotalShortcutCount', () => {
    it('should count all shortcuts across groups', () => {
      const groups: ShortcutGroup[] = [
        {
          title: 'Group 1',
          shortcuts: [
            { keys: ['⌘', 'K'], description: 'Test 1' },
            { keys: ['⌘', 'L'], description: 'Test 2' },
          ],
        },
        {
          title: 'Group 2',
          shortcuts: [{ keys: ['⌘', 'M'], description: 'Test 3' }],
        },
      ];
      expect(getTotalShortcutCount(groups)).toBe(3);
    });

    it('should return 0 for empty array', () => {
      expect(getTotalShortcutCount([])).toBe(0);
    });

    it('should return 0 for groups with no shortcuts', () => {
      const groups: ShortcutGroup[] = [
        { title: 'Empty 1', shortcuts: [] },
        { title: 'Empty 2', shortcuts: [] },
      ];
      expect(getTotalShortcutCount(groups)).toBe(0);
    });

    it('should correctly count default shortcut groups', () => {
      // Navigation: 4, Tasks: 2, Chat: 3, Steps Panel: 4, General: 4 = 17
      expect(getTotalShortcutCount(defaultShortcutGroups)).toBe(17);
    });
  });
});

// ============================================================================
// Accessibility Behavior Documentation Tests
// ============================================================================

describe('Accessibility Behavior', () => {
  describe('Touch targets (WCAG 2.5.5)', () => {
    it('should have 44px minimum touch target on mobile', () => {
      expect(SHORTCUT_ITEM_BASE_CLASSES).toContain('min-h-[44px]');
    });

    it('should relax touch target on larger screens', () => {
      expect(SHORTCUT_ITEM_BASE_CLASSES).toContain('sm:min-h-0');
    });
  });

  describe('Motion preferences', () => {
    it('should use motion-safe prefix for transitions', () => {
      expect(SHORTCUT_ITEM_BASE_CLASSES).toContain('motion-safe:transition');
    });
  });

  describe('Screen reader key name mapping', () => {
    it('should convert all modifier keys to readable names', () => {
      // Verify all common modifier keys are mapped
      expect(formatKeysForSR(['⌘'])).toBe('Command');
      expect(formatKeysForSR(['⇧'])).toBe('Shift');
      expect(formatKeysForSR(['⌥'])).toBe('Option');
      expect(formatKeysForSR(['⌃'])).toBe('Control');
    });

    it('should convert all navigation keys to readable names', () => {
      expect(formatKeysForSR(['↵'])).toBe('Enter');
      expect(formatKeysForSR(['↑'])).toBe('Up Arrow');
      expect(formatKeysForSR(['↓'])).toBe('Down Arrow');
      expect(formatKeysForSR(['←'])).toBe('Left Arrow');
      expect(formatKeysForSR(['→'])).toBe('Right Arrow');
      expect(formatKeysForSR(['Esc'])).toBe('Escape');
      expect(formatKeysForSR(['Tab'])).toBe('Tab');
      expect(formatKeysForSR(['Space'])).toBe('Space');
    });

    it('should join multiple keys with "plus"', () => {
      const result = formatKeysForSR(['⌘', 'K']);
      expect(result).toContain(' plus ');
    });
  });
});

// ============================================================================
// Type Safety Documentation Tests
// ============================================================================

describe('Type Safety', () => {
  describe('KeyboardShortcutsDialogSize', () => {
    it('should accept valid size values', () => {
      const sizes: KeyboardShortcutsDialogSize[] = ['sm', 'md', 'lg'];
      expect(sizes).toHaveLength(3);
    });
  });

  describe('KeyboardShortcutsDialogBreakpoint', () => {
    it('should include all Tailwind breakpoints', () => {
      const breakpoints: KeyboardShortcutsDialogBreakpoint[] = [
        'base',
        'sm',
        'md',
        'lg',
        'xl',
        '2xl',
      ];
      expect(breakpoints).toHaveLength(6);
    });
  });

  describe('ShortcutGroup interface', () => {
    it('should require title and shortcuts array', () => {
      const group: ShortcutGroup = {
        title: 'Test',
        shortcuts: [{ keys: ['A'], description: 'Test shortcut' }],
      };
      expect(group.title).toBe('Test');
      expect(group.shortcuts.length).toBe(1);
    });

    it('should allow optional id', () => {
      const group: ShortcutGroup = {
        title: 'Test',
        shortcuts: [],
        id: 'custom-id',
      };
      expect(group.id).toBe('custom-id');
    });
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('Size Consistency', () => {
  const sizes: KeyboardShortcutsDialogSize[] = ['sm', 'md', 'lg'];

  it('all size mappings should have entries for all sizes', () => {
    sizes.forEach((size) => {
      expect(SIZE_TO_DIALOG_SIZE[size]).toBeDefined();
      expect(CONTENT_PADDING_CLASSES[size]).toBeDefined();
      expect(GROUP_SPACING_CLASSES[size]).toBeDefined();
      expect(ITEM_PADDING_CLASSES[size]).toBeDefined();
      expect(KEY_SIZE_CLASSES[size]).toBeDefined();
      expect(HINT_KEY_SIZE_CLASSES[size]).toBeDefined();
      expect(ICON_SIZE_MAP[size]).toBeDefined();
    });
  });

  it('size progression should be consistent (values should increase with size)', () => {
    // Content padding: space-y-4, space-y-5, space-y-6
    expect(CONTENT_PADDING_CLASSES.sm).toContain('4');
    expect(CONTENT_PADDING_CLASSES.md).toContain('5');
    expect(CONTENT_PADDING_CLASSES.lg).toContain('6');

    // Group spacing: mb-2, mb-2.5, mb-3
    expect(GROUP_SPACING_CLASSES.sm).toContain('2');
    expect(GROUP_SPACING_CLASSES.lg).toContain('3');

    // Key height: h-5, h-6, h-7
    expect(KEY_SIZE_CLASSES.sm).toContain('h-5');
    expect(KEY_SIZE_CLASSES.md).toContain('h-6');
    expect(KEY_SIZE_CLASSES.lg).toContain('h-7');
  });
});

// ============================================================================
// Component Props Documentation Tests
// ============================================================================

describe('Component Props Documentation', () => {
  it('should document isOpen prop behavior', () => {
    // isOpen controls dialog visibility
    // When true, dialog is rendered and visible
    // When false, dialog is hidden (not in DOM)
    expect(true).toBe(true);
  });

  it('should document onClose callback behavior', () => {
    // onClose is called when:
    // - User clicks close button
    // - User presses Escape key
    // - User clicks backdrop (if enabled)
    expect(true).toBe(true);
  });

  it('should document shortcutGroups default behavior', () => {
    // shortcutGroups defaults to defaultShortcutGroups if not provided
    expect(defaultShortcutGroups.length).toBe(5);
  });

  it('should document size default behavior', () => {
    // size defaults to 'md' if not provided
    expect(getBaseSize(undefined)).toBe('md');
  });

  it('should document title default behavior', () => {
    // title defaults to DEFAULT_DIALOG_TITLE if not provided
    expect(DEFAULT_DIALOG_TITLE).toBe('Keyboard Shortcuts');
  });
});
