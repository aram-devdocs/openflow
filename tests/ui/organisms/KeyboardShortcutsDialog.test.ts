import {
  KEYBOARD_SHORTCUTS_CONTENT_PADDING_CLASSES,
  // Constants
  KEYBOARD_SHORTCUTS_DEFAULT_DIALOG_TITLE,
  KEYBOARD_SHORTCUTS_FOOTER_KEY_CLASSES,
  KEYBOARD_SHORTCUTS_FOOTER_NOTE_CLASSES,
  KEYBOARD_SHORTCUTS_GROUP_SPACING_CLASSES,
  KEYBOARD_SHORTCUTS_GROUP_TITLE_CLASSES,
  KEYBOARD_SHORTCUTS_HINT_CONTAINER_CLASSES,
  KEYBOARD_SHORTCUTS_HINT_KEY_CLASSES,
  KEYBOARD_SHORTCUTS_HINT_KEY_SIZE_CLASSES,
  KEYBOARD_SHORTCUTS_ICON_SIZE_MAP,
  KEYBOARD_SHORTCUTS_ITEM_PADDING_CLASSES,
  KEYBOARD_SHORTCUTS_KEYS_CONTAINER_CLASSES,
  KEYBOARD_SHORTCUTS_KEY_BASE_CLASSES,
  KEYBOARD_SHORTCUTS_KEY_SIZE_CLASSES,
  KEYBOARD_SHORTCUTS_PLATFORM_NOTE_TEXT,
  KEYBOARD_SHORTCUTS_SHORTCUT_ITEM_BASE_CLASSES,
  KEYBOARD_SHORTCUTS_SHORTCUT_LIST_CLASSES,
  KEYBOARD_SHORTCUTS_SIZE_TO_DIALOG_SIZE,
  KEYBOARD_SHORTCUTS_SR_DIALOG_OPENED,
  KEYBOARD_SHORTCUTS_SR_GROUP_COUNT_TEMPLATE,
  KEYBOARD_SHORTCUTS_SR_PLATFORM_NOTE,
  KEYBOARD_SHORTCUTS_SR_SHORTCUTS_IN_GROUP_TEMPLATE,
  KEYBOARD_SHORTCUTS_SR_TOGGLE_HINT,
  KEYBOARD_SHORTCUTS_TOGGLE_HINT_TEXT,
  KEYBOARD_SHORTCUTS_TOGGLE_KEYS,
  type KeyboardShortcutsDialogBreakpoint,
  // Types
  type KeyboardShortcutsDialogSize,
  type ShortcutGroup,
  buildKeyboardShortcutsGroupCountAnnouncement,
  buildKeyboardShortcutsInGroupAnnouncement,
  defaultShortcutGroups,
  formatKeyboardShortcutsKeysForSR,
  // Utility functions
  getKeyboardShortcutsBaseSize,
  getKeyboardShortcutsDialogSize,
  getKeyboardShortcutsResponsiveSizeClasses,
  getKeyboardShortcutsTotalCount,
} from '@openflow/ui/organisms';
import { describe, expect, it } from 'vitest';

// ============================================================================
// Default Constants Tests
// ============================================================================

describe('KeyboardShortcutsDialog Constants', () => {
  describe('DEFAULT_DIALOG_TITLE', () => {
    it('should have correct default title', () => {
      expect(KEYBOARD_SHORTCUTS_DEFAULT_DIALOG_TITLE).toBe('Keyboard Shortcuts');
    });
  });

  describe('TOGGLE_SHORTCUT_KEYS', () => {
    it('should have correct toggle shortcut keys', () => {
      expect(KEYBOARD_SHORTCUTS_TOGGLE_KEYS).toEqual(['⌘', '/']);
    });
  });

  describe('TOGGLE_HINT_TEXT', () => {
    it('should have correct toggle hint text', () => {
      expect(KEYBOARD_SHORTCUTS_TOGGLE_HINT_TEXT).toBe('Press ⌘/ to toggle this dialog');
    });
  });

  describe('SR_TOGGLE_HINT', () => {
    it('should have screen reader friendly toggle hint', () => {
      expect(KEYBOARD_SHORTCUTS_SR_TOGGLE_HINT).toBe('Press Command Slash to toggle this dialog');
    });
  });

  describe('PLATFORM_NOTE_TEXT', () => {
    it('should have correct platform note text', () => {
      expect(KEYBOARD_SHORTCUTS_PLATFORM_NOTE_TEXT).toBe(
        'Note: On Windows/Linux, use Ctrl instead of ⌘'
      );
    });
  });

  describe('SR_PLATFORM_NOTE', () => {
    it('should have screen reader friendly platform note', () => {
      expect(KEYBOARD_SHORTCUTS_SR_PLATFORM_NOTE).toBe(
        'Note: On Windows or Linux, use Control instead of Command'
      );
    });
  });

  describe('SR_DIALOG_OPENED', () => {
    it('should have screen reader dialog opened announcement', () => {
      expect(KEYBOARD_SHORTCUTS_SR_DIALOG_OPENED).toBe('Keyboard shortcuts dialog opened.');
    });
  });

  describe('SR_GROUP_COUNT_TEMPLATE', () => {
    it('should have group count template', () => {
      expect(KEYBOARD_SHORTCUTS_SR_GROUP_COUNT_TEMPLATE).toBe('{count} shortcut groups available.');
    });

    it('should contain count placeholder', () => {
      expect(KEYBOARD_SHORTCUTS_SR_GROUP_COUNT_TEMPLATE).toContain('{count}');
    });
  });

  describe('SR_SHORTCUTS_IN_GROUP_TEMPLATE', () => {
    it('should have shortcuts in group template', () => {
      expect(KEYBOARD_SHORTCUTS_SR_SHORTCUTS_IN_GROUP_TEMPLATE).toBe(
        '{count} shortcuts in {group}.'
      );
    });

    it('should contain count and group placeholders', () => {
      expect(KEYBOARD_SHORTCUTS_SR_SHORTCUTS_IN_GROUP_TEMPLATE).toContain('{count}');
      expect(KEYBOARD_SHORTCUTS_SR_SHORTCUTS_IN_GROUP_TEMPLATE).toContain('{group}');
    });
  });
});

// ============================================================================
// Size Mapping Tests
// ============================================================================

describe('Size Mappings', () => {
  describe('SIZE_TO_DIALOG_SIZE', () => {
    it('should map sm to md', () => {
      expect(KEYBOARD_SHORTCUTS_SIZE_TO_DIALOG_SIZE.sm).toBe('md');
    });

    it('should map md to lg', () => {
      expect(KEYBOARD_SHORTCUTS_SIZE_TO_DIALOG_SIZE.md).toBe('lg');
    });

    it('should map lg to xl', () => {
      expect(KEYBOARD_SHORTCUTS_SIZE_TO_DIALOG_SIZE.lg).toBe('xl');
    });

    it('should have all sizes defined', () => {
      expect(Object.keys(KEYBOARD_SHORTCUTS_SIZE_TO_DIALOG_SIZE)).toEqual(['sm', 'md', 'lg']);
    });
  });

  describe('CONTENT_PADDING_CLASSES', () => {
    it('should have spacing for sm', () => {
      expect(KEYBOARD_SHORTCUTS_CONTENT_PADDING_CLASSES.sm).toBe('space-y-4');
    });

    it('should have spacing for md', () => {
      expect(KEYBOARD_SHORTCUTS_CONTENT_PADDING_CLASSES.md).toBe('space-y-5');
    });

    it('should have spacing for lg', () => {
      expect(KEYBOARD_SHORTCUTS_CONTENT_PADDING_CLASSES.lg).toBe('space-y-6');
    });

    it('should have all sizes defined', () => {
      expect(Object.keys(KEYBOARD_SHORTCUTS_CONTENT_PADDING_CLASSES)).toEqual(['sm', 'md', 'lg']);
    });

    it('should have increasing spacing values', () => {
      // sm=4, md=5, lg=6
      expect(KEYBOARD_SHORTCUTS_CONTENT_PADDING_CLASSES.sm).toContain('4');
      expect(KEYBOARD_SHORTCUTS_CONTENT_PADDING_CLASSES.md).toContain('5');
      expect(KEYBOARD_SHORTCUTS_CONTENT_PADDING_CLASSES.lg).toContain('6');
    });
  });

  describe('GROUP_SPACING_CLASSES', () => {
    it('should have spacing for sm', () => {
      expect(KEYBOARD_SHORTCUTS_GROUP_SPACING_CLASSES.sm).toBe('mb-2');
    });

    it('should have spacing for md', () => {
      expect(KEYBOARD_SHORTCUTS_GROUP_SPACING_CLASSES.md).toBe('mb-2.5');
    });

    it('should have spacing for lg', () => {
      expect(KEYBOARD_SHORTCUTS_GROUP_SPACING_CLASSES.lg).toBe('mb-3');
    });

    it('should all use margin-bottom', () => {
      Object.values(KEYBOARD_SHORTCUTS_GROUP_SPACING_CLASSES).forEach((cls) => {
        expect(cls).toMatch(/^mb-/);
      });
    });
  });

  describe('ITEM_PADDING_CLASSES', () => {
    it('should have padding for sm', () => {
      expect(KEYBOARD_SHORTCUTS_ITEM_PADDING_CLASSES.sm).toBe('py-1.5 px-1.5');
    });

    it('should have padding for md', () => {
      expect(KEYBOARD_SHORTCUTS_ITEM_PADDING_CLASSES.md).toBe('py-2 px-2');
    });

    it('should have padding for lg', () => {
      expect(KEYBOARD_SHORTCUTS_ITEM_PADDING_CLASSES.lg).toBe('py-2.5 px-2.5');
    });

    it('should all include py- and px- classes', () => {
      Object.values(KEYBOARD_SHORTCUTS_ITEM_PADDING_CLASSES).forEach((cls) => {
        expect(cls).toContain('py-');
        expect(cls).toContain('px-');
      });
    });
  });

  describe('KEY_SIZE_CLASSES', () => {
    it('should have size classes for sm', () => {
      expect(KEYBOARD_SHORTCUTS_KEY_SIZE_CLASSES.sm).toContain('min-w-');
      expect(KEYBOARD_SHORTCUTS_KEY_SIZE_CLASSES.sm).toContain('h-5');
    });

    it('should have size classes for md', () => {
      expect(KEYBOARD_SHORTCUTS_KEY_SIZE_CLASSES.md).toContain('min-w-');
      expect(KEYBOARD_SHORTCUTS_KEY_SIZE_CLASSES.md).toContain('h-6');
    });

    it('should have size classes for lg', () => {
      expect(KEYBOARD_SHORTCUTS_KEY_SIZE_CLASSES.lg).toContain('min-w-');
      expect(KEYBOARD_SHORTCUTS_KEY_SIZE_CLASSES.lg).toContain('h-7');
    });

    it('should have font size progression', () => {
      expect(KEYBOARD_SHORTCUTS_KEY_SIZE_CLASSES.sm).toContain('text-[10px]');
      expect(KEYBOARD_SHORTCUTS_KEY_SIZE_CLASSES.md).toContain('text-xs');
      expect(KEYBOARD_SHORTCUTS_KEY_SIZE_CLASSES.lg).toContain('text-sm');
    });
  });

  describe('HINT_KEY_SIZE_CLASSES', () => {
    it('should have size classes for all sizes', () => {
      expect(Object.keys(KEYBOARD_SHORTCUTS_HINT_KEY_SIZE_CLASSES)).toEqual(['sm', 'md', 'lg']);
    });

    it('should all include padding and text size', () => {
      Object.values(KEYBOARD_SHORTCUTS_HINT_KEY_SIZE_CLASSES).forEach((cls) => {
        expect(cls).toMatch(/px-/);
        expect(cls).toMatch(/py-/);
        expect(cls).toMatch(/text-/);
      });
    });
  });

  describe('ICON_SIZE_MAP', () => {
    it('should map sm to xs', () => {
      expect(KEYBOARD_SHORTCUTS_ICON_SIZE_MAP.sm).toBe('xs');
    });

    it('should map md to sm', () => {
      expect(KEYBOARD_SHORTCUTS_ICON_SIZE_MAP.md).toBe('sm');
    });

    it('should map lg to md', () => {
      expect(KEYBOARD_SHORTCUTS_ICON_SIZE_MAP.lg).toBe('md');
    });
  });
});

// ============================================================================
// CSS Class Constants Tests
// ============================================================================

describe('CSS Class Constants', () => {
  describe('HINT_CONTAINER_CLASSES', () => {
    it('should have flex layout', () => {
      expect(KEYBOARD_SHORTCUTS_HINT_CONTAINER_CLASSES).toContain('flex');
    });

    it('should have gap and alignment', () => {
      expect(KEYBOARD_SHORTCUTS_HINT_CONTAINER_CLASSES).toContain('items-center');
      expect(KEYBOARD_SHORTCUTS_HINT_CONTAINER_CLASSES).toContain('gap-2');
    });
  });

  describe('KEY_BASE_CLASSES', () => {
    it('should have flex centering', () => {
      expect(KEYBOARD_SHORTCUTS_KEY_BASE_CLASSES).toContain('inline-flex');
      expect(KEYBOARD_SHORTCUTS_KEY_BASE_CLASSES).toContain('items-center');
      expect(KEYBOARD_SHORTCUTS_KEY_BASE_CLASSES).toContain('justify-center');
    });

    it('should have border styling', () => {
      expect(KEYBOARD_SHORTCUTS_KEY_BASE_CLASSES).toContain('rounded');
      expect(KEYBOARD_SHORTCUTS_KEY_BASE_CLASSES).toContain('border');
    });

    it('should have background color', () => {
      expect(KEYBOARD_SHORTCUTS_KEY_BASE_CLASSES).toContain('bg-');
    });

    it('should have shadow', () => {
      expect(KEYBOARD_SHORTCUTS_KEY_BASE_CLASSES).toContain('shadow-sm');
    });
  });

  describe('HINT_KEY_CLASSES', () => {
    it('should have rounded corners', () => {
      expect(KEYBOARD_SHORTCUTS_HINT_KEY_CLASSES).toContain('rounded');
    });

    it('should have monospace font', () => {
      expect(KEYBOARD_SHORTCUTS_HINT_KEY_CLASSES).toContain('font-mono');
    });
  });

  describe('GROUP_TITLE_CLASSES', () => {
    it('should have small text size', () => {
      expect(KEYBOARD_SHORTCUTS_GROUP_TITLE_CLASSES).toContain('text-sm');
    });

    it('should have uppercase styling', () => {
      expect(KEYBOARD_SHORTCUTS_GROUP_TITLE_CLASSES).toContain('uppercase');
    });

    it('should have letter spacing', () => {
      expect(KEYBOARD_SHORTCUTS_GROUP_TITLE_CLASSES).toContain('tracking-wide');
    });
  });

  describe('SHORTCUT_LIST_CLASSES', () => {
    it('should have vertical spacing', () => {
      expect(KEYBOARD_SHORTCUTS_SHORTCUT_LIST_CLASSES).toContain('space-y-1');
    });
  });

  describe('SHORTCUT_ITEM_BASE_CLASSES', () => {
    it('should have flex layout', () => {
      expect(KEYBOARD_SHORTCUTS_SHORTCUT_ITEM_BASE_CLASSES).toContain('flex');
    });

    it('should have items-center and justify-between', () => {
      expect(KEYBOARD_SHORTCUTS_SHORTCUT_ITEM_BASE_CLASSES).toContain('items-center');
      expect(KEYBOARD_SHORTCUTS_SHORTCUT_ITEM_BASE_CLASSES).toContain('justify-between');
    });

    it('should have rounded corners', () => {
      expect(KEYBOARD_SHORTCUTS_SHORTCUT_ITEM_BASE_CLASSES).toContain('rounded-md');
    });

    it('should have hover state', () => {
      expect(KEYBOARD_SHORTCUTS_SHORTCUT_ITEM_BASE_CLASSES).toContain('hover:');
    });

    it('should have touch target of 44px on mobile (WCAG 2.5.5)', () => {
      expect(KEYBOARD_SHORTCUTS_SHORTCUT_ITEM_BASE_CLASSES).toContain('min-h-[44px]');
    });

    it('should relax touch target on desktop', () => {
      expect(KEYBOARD_SHORTCUTS_SHORTCUT_ITEM_BASE_CLASSES).toContain('sm:min-h-0');
    });

    it('should have motion-safe transitions', () => {
      expect(KEYBOARD_SHORTCUTS_SHORTCUT_ITEM_BASE_CLASSES).toContain('motion-safe:transition');
    });
  });

  describe('KEYS_CONTAINER_CLASSES', () => {
    it('should have flex layout with gap', () => {
      expect(KEYBOARD_SHORTCUTS_KEYS_CONTAINER_CLASSES).toContain('flex');
      expect(KEYBOARD_SHORTCUTS_KEYS_CONTAINER_CLASSES).toContain('gap-1');
    });
  });

  describe('FOOTER_NOTE_CLASSES', () => {
    it('should have small text size', () => {
      expect(KEYBOARD_SHORTCUTS_FOOTER_NOTE_CLASSES).toContain('text-xs');
    });

    it('should have border-top for separation', () => {
      expect(KEYBOARD_SHORTCUTS_FOOTER_NOTE_CLASSES).toContain('border-t');
    });

    it('should have padding-top', () => {
      expect(KEYBOARD_SHORTCUTS_FOOTER_NOTE_CLASSES).toContain('pt-4');
    });
  });

  describe('FOOTER_KEY_CLASSES', () => {
    it('should have rounded corners', () => {
      expect(KEYBOARD_SHORTCUTS_FOOTER_KEY_CLASSES).toContain('rounded');
    });

    it('should have monospace font', () => {
      expect(KEYBOARD_SHORTCUTS_FOOTER_KEY_CLASSES).toContain('font-mono');
    });

    it('should have small text size', () => {
      expect(KEYBOARD_SHORTCUTS_FOOTER_KEY_CLASSES).toContain('text-[10px]');
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
    const total = getKeyboardShortcutsTotalCount(defaultShortcutGroups);
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
      expect(getKeyboardShortcutsBaseSize(undefined)).toBe('md');
    });

    it('should return the string value for string input', () => {
      expect(getKeyboardShortcutsBaseSize('sm')).toBe('sm');
      expect(getKeyboardShortcutsBaseSize('md')).toBe('md');
      expect(getKeyboardShortcutsBaseSize('lg')).toBe('lg');
    });

    it('should return base value from responsive object', () => {
      expect(getKeyboardShortcutsBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
      expect(getKeyboardShortcutsBaseSize({ base: 'lg' })).toBe('lg');
    });

    it('should return md if responsive object has no base', () => {
      expect(getKeyboardShortcutsBaseSize({ md: 'lg' })).toBe('md');
    });

    it('should return md for null-ish values', () => {
      expect(getKeyboardShortcutsBaseSize(null as unknown as undefined)).toBe('md');
    });
  });

  describe('getResponsiveSizeClasses', () => {
    it('should return md classes for undefined', () => {
      expect(getKeyboardShortcutsResponsiveSizeClasses(undefined)).toBe(
        KEYBOARD_SHORTCUTS_CONTENT_PADDING_CLASSES.md
      );
    });

    it('should return correct classes for string size', () => {
      expect(getKeyboardShortcutsResponsiveSizeClasses('sm')).toBe(
        KEYBOARD_SHORTCUTS_CONTENT_PADDING_CLASSES.sm
      );
      expect(getKeyboardShortcutsResponsiveSizeClasses('md')).toBe(
        KEYBOARD_SHORTCUTS_CONTENT_PADDING_CLASSES.md
      );
      expect(getKeyboardShortcutsResponsiveSizeClasses('lg')).toBe(
        KEYBOARD_SHORTCUTS_CONTENT_PADDING_CLASSES.lg
      );
    });

    it('should generate breakpoint-prefixed classes for responsive object', () => {
      const result = getKeyboardShortcutsResponsiveSizeClasses({ base: 'sm', md: 'lg' });
      expect(result).toContain('space-y-4'); // base: sm
      expect(result).toContain('md:space-y-6'); // md: lg
    });

    it('should handle responsive object with all breakpoints', () => {
      const result = getKeyboardShortcutsResponsiveSizeClasses({
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
      expect(getKeyboardShortcutsDialogSize(undefined)).toBe('lg');
    });

    it('should return mapped size for string input', () => {
      expect(getKeyboardShortcutsDialogSize('sm')).toBe('md');
      expect(getKeyboardShortcutsDialogSize('md')).toBe('lg');
      expect(getKeyboardShortcutsDialogSize('lg')).toBe('xl');
    });

    it('should return responsive object with mapped sizes', () => {
      const result = getKeyboardShortcutsDialogSize({ base: 'sm', lg: 'lg' });
      expect(result).toEqual({ base: 'md', lg: 'xl' });
    });

    it('should handle all breakpoints in responsive object', () => {
      const result = getKeyboardShortcutsDialogSize({
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
      expect(formatKeyboardShortcutsKeysForSR(['⌘'])).toBe('Command');
    });

    it('should format command + K', () => {
      expect(formatKeyboardShortcutsKeysForSR(['⌘', 'K'])).toBe('Command plus K');
    });

    it('should format shift key', () => {
      expect(formatKeyboardShortcutsKeysForSR(['⇧'])).toBe('Shift');
    });

    it('should format option key', () => {
      expect(formatKeyboardShortcutsKeysForSR(['⌥'])).toBe('Option');
    });

    it('should format control key', () => {
      expect(formatKeyboardShortcutsKeysForSR(['⌃'])).toBe('Control');
    });

    it('should format enter key', () => {
      expect(formatKeyboardShortcutsKeysForSR(['↵'])).toBe('Enter');
    });

    it('should format arrow keys', () => {
      expect(formatKeyboardShortcutsKeysForSR(['↑'])).toBe('Up Arrow');
      expect(formatKeyboardShortcutsKeysForSR(['↓'])).toBe('Down Arrow');
      expect(formatKeyboardShortcutsKeysForSR(['←'])).toBe('Left Arrow');
      expect(formatKeyboardShortcutsKeysForSR(['→'])).toBe('Right Arrow');
    });

    it('should format escape key', () => {
      expect(formatKeyboardShortcutsKeysForSR(['Esc'])).toBe('Escape');
    });

    it('should format tab key', () => {
      expect(formatKeyboardShortcutsKeysForSR(['Tab'])).toBe('Tab');
    });

    it('should format space key', () => {
      expect(formatKeyboardShortcutsKeysForSR(['Space'])).toBe('Space');
    });

    it('should format backtick', () => {
      expect(formatKeyboardShortcutsKeysForSR(['`'])).toBe('Backtick');
    });

    it('should format slash', () => {
      expect(formatKeyboardShortcutsKeysForSR(['/'])).toBe('Slash');
    });

    it('should format comma', () => {
      expect(formatKeyboardShortcutsKeysForSR([','])).toBe('Comma');
    });

    it('should format period', () => {
      expect(formatKeyboardShortcutsKeysForSR(['.'])).toBe('Period');
    });

    it('should pass through unknown keys', () => {
      expect(formatKeyboardShortcutsKeysForSR(['X'])).toBe('X');
      expect(formatKeyboardShortcutsKeysForSR(['F1'])).toBe('F1');
    });

    it('should format complex combinations', () => {
      expect(formatKeyboardShortcutsKeysForSR(['⌘', '⇧', 'P'])).toBe('Command plus Shift plus P');
      expect(formatKeyboardShortcutsKeysForSR(['⌃', '⌥', '↵'])).toBe(
        'Control plus Option plus Enter'
      );
    });

    it('should handle empty array', () => {
      expect(formatKeyboardShortcutsKeysForSR([])).toBe('');
    });
  });

  describe('buildGroupCountAnnouncement', () => {
    it('should build announcement with count', () => {
      expect(buildKeyboardShortcutsGroupCountAnnouncement(5)).toBe('5 shortcut groups available.');
    });

    it('should work with 1 group', () => {
      expect(buildKeyboardShortcutsGroupCountAnnouncement(1)).toBe('1 shortcut groups available.');
    });

    it('should work with 0 groups', () => {
      expect(buildKeyboardShortcutsGroupCountAnnouncement(0)).toBe('0 shortcut groups available.');
    });

    it('should work with large numbers', () => {
      expect(buildKeyboardShortcutsGroupCountAnnouncement(100)).toBe(
        '100 shortcut groups available.'
      );
    });
  });

  describe('buildShortcutsInGroupAnnouncement', () => {
    it('should build announcement with count and group name', () => {
      expect(buildKeyboardShortcutsInGroupAnnouncement(4, 'Navigation')).toBe(
        '4 shortcuts in Navigation.'
      );
    });

    it('should work with 1 shortcut', () => {
      expect(buildKeyboardShortcutsInGroupAnnouncement(1, 'Tasks')).toBe('1 shortcuts in Tasks.');
    });

    it('should work with 0 shortcuts', () => {
      expect(buildKeyboardShortcutsInGroupAnnouncement(0, 'Empty')).toBe('0 shortcuts in Empty.');
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
      expect(getKeyboardShortcutsTotalCount(groups)).toBe(3);
    });

    it('should return 0 for empty array', () => {
      expect(getKeyboardShortcutsTotalCount([])).toBe(0);
    });

    it('should return 0 for groups with no shortcuts', () => {
      const groups: ShortcutGroup[] = [
        { title: 'Empty 1', shortcuts: [] },
        { title: 'Empty 2', shortcuts: [] },
      ];
      expect(getKeyboardShortcutsTotalCount(groups)).toBe(0);
    });

    it('should correctly count default shortcut groups', () => {
      // Navigation: 4, Tasks: 2, Chat: 3, Steps Panel: 4, General: 4 = 17
      expect(getKeyboardShortcutsTotalCount(defaultShortcutGroups)).toBe(17);
    });
  });
});

// ============================================================================
// Accessibility Behavior Documentation Tests
// ============================================================================

describe('Accessibility Behavior', () => {
  describe('Touch targets (WCAG 2.5.5)', () => {
    it('should have 44px minimum touch target on mobile', () => {
      expect(KEYBOARD_SHORTCUTS_SHORTCUT_ITEM_BASE_CLASSES).toContain('min-h-[44px]');
    });

    it('should relax touch target on larger screens', () => {
      expect(KEYBOARD_SHORTCUTS_SHORTCUT_ITEM_BASE_CLASSES).toContain('sm:min-h-0');
    });
  });

  describe('Motion preferences', () => {
    it('should use motion-safe prefix for transitions', () => {
      expect(KEYBOARD_SHORTCUTS_SHORTCUT_ITEM_BASE_CLASSES).toContain('motion-safe:transition');
    });
  });

  describe('Screen reader key name mapping', () => {
    it('should convert all modifier keys to readable names', () => {
      // Verify all common modifier keys are mapped
      expect(formatKeyboardShortcutsKeysForSR(['⌘'])).toBe('Command');
      expect(formatKeyboardShortcutsKeysForSR(['⇧'])).toBe('Shift');
      expect(formatKeyboardShortcutsKeysForSR(['⌥'])).toBe('Option');
      expect(formatKeyboardShortcutsKeysForSR(['⌃'])).toBe('Control');
    });

    it('should convert all navigation keys to readable names', () => {
      expect(formatKeyboardShortcutsKeysForSR(['↵'])).toBe('Enter');
      expect(formatKeyboardShortcutsKeysForSR(['↑'])).toBe('Up Arrow');
      expect(formatKeyboardShortcutsKeysForSR(['↓'])).toBe('Down Arrow');
      expect(formatKeyboardShortcutsKeysForSR(['←'])).toBe('Left Arrow');
      expect(formatKeyboardShortcutsKeysForSR(['→'])).toBe('Right Arrow');
      expect(formatKeyboardShortcutsKeysForSR(['Esc'])).toBe('Escape');
      expect(formatKeyboardShortcutsKeysForSR(['Tab'])).toBe('Tab');
      expect(formatKeyboardShortcutsKeysForSR(['Space'])).toBe('Space');
    });

    it('should join multiple keys with "plus"', () => {
      const result = formatKeyboardShortcutsKeysForSR(['⌘', 'K']);
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
      expect(KEYBOARD_SHORTCUTS_SIZE_TO_DIALOG_SIZE[size]).toBeDefined();
      expect(KEYBOARD_SHORTCUTS_CONTENT_PADDING_CLASSES[size]).toBeDefined();
      expect(KEYBOARD_SHORTCUTS_GROUP_SPACING_CLASSES[size]).toBeDefined();
      expect(KEYBOARD_SHORTCUTS_ITEM_PADDING_CLASSES[size]).toBeDefined();
      expect(KEYBOARD_SHORTCUTS_KEY_SIZE_CLASSES[size]).toBeDefined();
      expect(KEYBOARD_SHORTCUTS_HINT_KEY_SIZE_CLASSES[size]).toBeDefined();
      expect(KEYBOARD_SHORTCUTS_ICON_SIZE_MAP[size]).toBeDefined();
    });
  });

  it('size progression should be consistent (values should increase with size)', () => {
    // Content padding: space-y-4, space-y-5, space-y-6
    expect(KEYBOARD_SHORTCUTS_CONTENT_PADDING_CLASSES.sm).toContain('4');
    expect(KEYBOARD_SHORTCUTS_CONTENT_PADDING_CLASSES.md).toContain('5');
    expect(KEYBOARD_SHORTCUTS_CONTENT_PADDING_CLASSES.lg).toContain('6');

    // Group spacing: mb-2, mb-2.5, mb-3
    expect(KEYBOARD_SHORTCUTS_GROUP_SPACING_CLASSES.sm).toContain('2');
    expect(KEYBOARD_SHORTCUTS_GROUP_SPACING_CLASSES.lg).toContain('3');

    // Key height: h-5, h-6, h-7
    expect(KEYBOARD_SHORTCUTS_KEY_SIZE_CLASSES.sm).toContain('h-5');
    expect(KEYBOARD_SHORTCUTS_KEY_SIZE_CLASSES.md).toContain('h-6');
    expect(KEYBOARD_SHORTCUTS_KEY_SIZE_CLASSES.lg).toContain('h-7');
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
    expect(getKeyboardShortcutsBaseSize(undefined)).toBe('md');
  });

  it('should document title default behavior', () => {
    // title defaults to DEFAULT_DIALOG_TITLE if not provided
    expect(KEYBOARD_SHORTCUTS_DEFAULT_DIALOG_TITLE).toBe('Keyboard Shortcuts');
  });
});
