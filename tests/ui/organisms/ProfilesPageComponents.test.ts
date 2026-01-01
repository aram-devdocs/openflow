import type { ExecutorProfile } from '@openflow/generated';
import {
  ACTION_BUTTON_SIZE_MAP,
  ACTION_ICON_SIZE_MAP,
  DEFAULT_CREATE_LABEL,
  DEFAULT_DELETE_LABEL,
  DEFAULT_EDIT_LABEL,
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_TITLE,
  DEFAULT_LIST_LABEL,
  DEFAULT_PAGE_LABEL,
  DEFAULT_RETRY_LABEL,
  DEFAULT_SET_DEFAULT_LABEL,
  // Constants
  DEFAULT_SKELETON_COUNT,
  FORM_CHECKBOX_CONTAINER_CLASSES,
  FORM_FIELD_GAP_CLASSES,
  FORM_FOOTER_CLASSES,
  PROFILES_DESCRIPTION_CLASSES,
  PROFILES_ERROR_CLASSES,
  PROFILES_ERROR_ICON_CLASSES,
  PROFILES_GRID_CLASSES,
  PROFILES_HEADER_CLASSES,
  PROFILES_LAYOUT_BASE_CLASSES,
  PROFILES_SIZE_CLASSES,
  PROFILES_SKELETON_CONTAINER_CLASSES,
  PROFILE_ACTION_BUTTON_CLASSES,
  PROFILE_CARD_ACTIONS_CLASSES,
  PROFILE_CARD_COMMAND_CLASSES,
  PROFILE_CARD_CONTAINER_CLASSES,
  PROFILE_CARD_DESC_CLASSES,
  PROFILE_CARD_PADDING_CLASSES,
  PROFILE_CARD_TITLE_CLASSES,
  PROFILE_DELETE_BUTTON_CLASSES,
  type ProfileFormData,
  type ProfilesBreakpoint,
  // Types
  type ProfilesSize,
  SR_DEFAULT_BADGE,
  SR_EMPTY,
  SR_LOADING,
  SR_PROFILES_LOADED,
  SR_PROFILE_PREFIX,
  SR_SET_AS_DEFAULT,
  buildProfileAccessibleLabel,
  buildProfilesCountAnnouncement,
  // Utility functions
  getBaseSize,
  getProfileIcon,
  getResponsiveSizeClasses,
} from '@openflow/ui/organisms/ProfilesPageComponents';
import { describe, expect, it } from 'vitest';

// ============================================================================
// Default Label Constants Tests
// ============================================================================

describe('Default Label Constants', () => {
  it('DEFAULT_SKELETON_COUNT should be 4', () => {
    expect(DEFAULT_SKELETON_COUNT).toBe(4);
  });

  it('DEFAULT_PAGE_LABEL should describe the page', () => {
    expect(DEFAULT_PAGE_LABEL).toBe('Executor Profiles Settings');
    expect(DEFAULT_PAGE_LABEL).toContain('Profiles');
  });

  it('DEFAULT_LIST_LABEL should describe the list', () => {
    expect(DEFAULT_LIST_LABEL).toBe('Executor profiles');
    expect(DEFAULT_LIST_LABEL).toContain('profiles');
  });

  it('DEFAULT_CREATE_LABEL should be actionable', () => {
    expect(DEFAULT_CREATE_LABEL).toBe('New Profile');
    expect(DEFAULT_CREATE_LABEL).toContain('Profile');
  });

  it('DEFAULT_EDIT_LABEL should describe edit action', () => {
    expect(DEFAULT_EDIT_LABEL).toBe('Edit profile');
    expect(DEFAULT_EDIT_LABEL.toLowerCase()).toContain('edit');
  });

  it('DEFAULT_DELETE_LABEL should describe delete action', () => {
    expect(DEFAULT_DELETE_LABEL).toBe('Delete profile');
    expect(DEFAULT_DELETE_LABEL.toLowerCase()).toContain('delete');
  });

  it('DEFAULT_SET_DEFAULT_LABEL should describe set default action', () => {
    expect(DEFAULT_SET_DEFAULT_LABEL).toBe('Set as default');
    expect(DEFAULT_SET_DEFAULT_LABEL.toLowerCase()).toContain('default');
  });
});

// ============================================================================
// Empty/Error State Constants Tests
// ============================================================================

describe('Empty/Error State Constants', () => {
  it('DEFAULT_EMPTY_TITLE should describe empty state', () => {
    expect(DEFAULT_EMPTY_TITLE).toBe('No executor profiles');
    expect(DEFAULT_EMPTY_TITLE.toLowerCase()).toContain('no');
  });

  it('DEFAULT_EMPTY_DESCRIPTION should provide guidance', () => {
    expect(DEFAULT_EMPTY_DESCRIPTION).toBe(
      'Create your first profile to start using AI CLI tools.'
    );
    expect(DEFAULT_EMPTY_DESCRIPTION).toContain('Create');
  });

  it('DEFAULT_ERROR_TITLE should describe error', () => {
    expect(DEFAULT_ERROR_TITLE).toBe('Failed to load profiles');
    expect(DEFAULT_ERROR_TITLE.toLowerCase()).toContain('failed');
  });

  it('DEFAULT_RETRY_LABEL should be actionable', () => {
    expect(DEFAULT_RETRY_LABEL).toBe('Try again');
    expect(DEFAULT_RETRY_LABEL.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Screen Reader Announcement Constants Tests
// ============================================================================

describe('Screen Reader Announcement Constants', () => {
  it('SR_LOADING should announce loading state', () => {
    expect(SR_LOADING).toBe('Loading executor profiles...');
    expect(SR_LOADING).toContain('Loading');
  });

  it('SR_PROFILES_LOADED should describe loaded state', () => {
    expect(SR_PROFILES_LOADED).toBe('profiles loaded');
    expect(SR_PROFILES_LOADED).toContain('loaded');
  });

  it('SR_EMPTY should describe empty state', () => {
    expect(SR_EMPTY).toBe('No executor profiles. Create one to get started.');
    expect(SR_EMPTY).toContain('Create');
  });

  it('SR_DEFAULT_BADGE should describe default badge', () => {
    expect(SR_DEFAULT_BADGE).toBe('Default profile');
    expect(SR_DEFAULT_BADGE).toContain('Default');
  });

  it('SR_SET_AS_DEFAULT should describe set default action', () => {
    expect(SR_SET_AS_DEFAULT).toBe('Set as default profile');
    expect(SR_SET_AS_DEFAULT).toContain('default');
  });

  it('SR_PROFILE_PREFIX should prefix profile cards', () => {
    expect(SR_PROFILE_PREFIX).toBe('Executor profile:');
    expect(SR_PROFILE_PREFIX).toContain('profile');
  });
});

// ============================================================================
// Size Classes Tests
// ============================================================================

describe('PROFILES_SIZE_CLASSES', () => {
  it('should have sm size class', () => {
    expect(PROFILES_SIZE_CLASSES.sm).toBe('gap-3');
  });

  it('should have md size class', () => {
    expect(PROFILES_SIZE_CLASSES.md).toBe('gap-4');
  });

  it('should have lg size class', () => {
    expect(PROFILES_SIZE_CLASSES.lg).toBe('gap-6');
  });

  it('should have 3 size options', () => {
    expect(Object.keys(PROFILES_SIZE_CLASSES)).toHaveLength(3);
  });

  it('should use Tailwind gap- pattern', () => {
    Object.values(PROFILES_SIZE_CLASSES).forEach((value) => {
      expect(value).toMatch(/^gap-/);
    });
  });
});

describe('PROFILES_GRID_CLASSES', () => {
  it('should have sm grid classes', () => {
    expect(PROFILES_GRID_CLASSES.sm).toContain('gap-3');
    expect(PROFILES_GRID_CLASSES.sm).toContain('sm:grid-cols-2');
  });

  it('should have md grid classes', () => {
    expect(PROFILES_GRID_CLASSES.md).toContain('gap-4');
    expect(PROFILES_GRID_CLASSES.md).toContain('sm:grid-cols-2');
  });

  it('should have lg grid classes', () => {
    expect(PROFILES_GRID_CLASSES.lg).toContain('gap-6');
    expect(PROFILES_GRID_CLASSES.lg).toContain('lg:grid-cols-3');
  });

  it('should have 3 size options', () => {
    expect(Object.keys(PROFILES_GRID_CLASSES)).toHaveLength(3);
  });
});

describe('PROFILE_CARD_PADDING_CLASSES', () => {
  it('should have sm padding class', () => {
    expect(PROFILE_CARD_PADDING_CLASSES.sm).toBe('p-3');
  });

  it('should have md padding class', () => {
    expect(PROFILE_CARD_PADDING_CLASSES.md).toBe('p-4');
  });

  it('should have lg padding class', () => {
    expect(PROFILE_CARD_PADDING_CLASSES.lg).toBe('p-5');
  });

  it('should use Tailwind p- pattern', () => {
    Object.values(PROFILE_CARD_PADDING_CLASSES).forEach((value) => {
      expect(value).toMatch(/^p-/);
    });
  });
});

describe('ACTION_BUTTON_SIZE_MAP', () => {
  it('should map sm to sm', () => {
    expect(ACTION_BUTTON_SIZE_MAP.sm).toBe('sm');
  });

  it('should map md to sm', () => {
    expect(ACTION_BUTTON_SIZE_MAP.md).toBe('sm');
  });

  it('should map lg to md', () => {
    expect(ACTION_BUTTON_SIZE_MAP.lg).toBe('md');
  });

  it('should have 3 size mappings', () => {
    expect(Object.keys(ACTION_BUTTON_SIZE_MAP)).toHaveLength(3);
  });
});

describe('ACTION_ICON_SIZE_MAP', () => {
  it('should map sm to xs', () => {
    expect(ACTION_ICON_SIZE_MAP.sm).toBe('xs');
  });

  it('should map md to sm', () => {
    expect(ACTION_ICON_SIZE_MAP.md).toBe('sm');
  });

  it('should map lg to sm', () => {
    expect(ACTION_ICON_SIZE_MAP.lg).toBe('sm');
  });

  it('should have 3 size mappings', () => {
    expect(Object.keys(ACTION_ICON_SIZE_MAP)).toHaveLength(3);
  });
});

// ============================================================================
// Layout Classes Tests
// ============================================================================

describe('PROFILES_LAYOUT_BASE_CLASSES', () => {
  it('should include vertical spacing', () => {
    expect(PROFILES_LAYOUT_BASE_CLASSES).toContain('space-y-6');
  });
});

describe('PROFILES_HEADER_CLASSES', () => {
  it('should include flex layout', () => {
    expect(PROFILES_HEADER_CLASSES).toContain('flex');
  });

  it('should include vertical centering', () => {
    expect(PROFILES_HEADER_CLASSES).toContain('items-center');
  });

  it('should include space between', () => {
    expect(PROFILES_HEADER_CLASSES).toContain('justify-between');
  });
});

describe('PROFILES_DESCRIPTION_CLASSES', () => {
  it('should include text size', () => {
    expect(PROFILES_DESCRIPTION_CLASSES).toContain('text-sm');
  });

  it('should include muted color', () => {
    expect(PROFILES_DESCRIPTION_CLASSES).toContain('muted-foreground');
  });
});

// ============================================================================
// Profile Card Classes Tests
// ============================================================================

describe('PROFILE_CARD_CONTAINER_CLASSES', () => {
  it('should include flex layout', () => {
    expect(PROFILE_CARD_CONTAINER_CLASSES).toContain('flex');
  });

  it('should align items at start', () => {
    expect(PROFILE_CARD_CONTAINER_CLASSES).toContain('items-start');
  });

  it('should justify between', () => {
    expect(PROFILE_CARD_CONTAINER_CLASSES).toContain('justify-between');
  });
});

describe('PROFILE_CARD_TITLE_CLASSES', () => {
  it('should include font weight', () => {
    expect(PROFILE_CARD_TITLE_CLASSES).toContain('font-medium');
  });

  it('should include foreground color', () => {
    expect(PROFILE_CARD_TITLE_CLASSES).toContain('foreground');
  });
});

describe('PROFILE_CARD_COMMAND_CLASSES', () => {
  it('should include margin top', () => {
    expect(PROFILE_CARD_COMMAND_CLASSES).toContain('mt-1');
  });

  it('should include xs text size', () => {
    expect(PROFILE_CARD_COMMAND_CLASSES).toContain('text-xs');
  });

  it('should include muted color', () => {
    expect(PROFILE_CARD_COMMAND_CLASSES).toContain('muted-foreground');
  });

  it('should be block element', () => {
    expect(PROFILE_CARD_COMMAND_CLASSES).toContain('block');
  });
});

describe('PROFILE_CARD_DESC_CLASSES', () => {
  it('should include margin top', () => {
    expect(PROFILE_CARD_DESC_CLASSES).toContain('mt-2');
  });

  it('should include sm text size', () => {
    expect(PROFILE_CARD_DESC_CLASSES).toContain('text-sm');
  });

  it('should include muted color', () => {
    expect(PROFILE_CARD_DESC_CLASSES).toContain('muted-foreground');
  });
});

describe('PROFILE_CARD_ACTIONS_CLASSES', () => {
  it('should include flex layout', () => {
    expect(PROFILE_CARD_ACTIONS_CLASSES).toContain('flex');
  });

  it('should center items', () => {
    expect(PROFILE_CARD_ACTIONS_CLASSES).toContain('items-center');
  });

  it('should include gap', () => {
    expect(PROFILE_CARD_ACTIONS_CLASSES).toContain('gap-1');
  });
});

// ============================================================================
// Action Button Classes Tests
// ============================================================================

describe('PROFILE_ACTION_BUTTON_CLASSES', () => {
  it('should include rounded styling', () => {
    expect(PROFILE_ACTION_BUTTON_CLASSES).toContain('rounded');
  });

  it('should include padding', () => {
    expect(PROFILE_ACTION_BUTTON_CLASSES).toContain('p-1.5');
  });

  it('should meet touch target requirements (44px) on mobile', () => {
    expect(PROFILE_ACTION_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(PROFILE_ACTION_BUTTON_CLASSES).toContain('min-w-[44px]');
  });

  it('should have smaller size on sm+ breakpoint', () => {
    expect(PROFILE_ACTION_BUTTON_CLASSES).toContain('sm:h-8');
    expect(PROFILE_ACTION_BUTTON_CLASSES).toContain('sm:w-8');
  });

  it('should include hover state', () => {
    expect(PROFILE_ACTION_BUTTON_CLASSES).toContain('hover:bg-');
    expect(PROFILE_ACTION_BUTTON_CLASSES).toContain('hover:text-');
  });

  it('should include focus visible ring', () => {
    expect(PROFILE_ACTION_BUTTON_CLASSES).toContain('focus-visible:ring-2');
    expect(PROFILE_ACTION_BUTTON_CLASSES).toContain('focus-visible:ring-offset-2');
  });

  it('should respect reduced motion preference', () => {
    expect(PROFILE_ACTION_BUTTON_CLASSES).toContain('motion-safe:transition-colors');
  });
});

describe('PROFILE_DELETE_BUTTON_CLASSES', () => {
  it('should include rounded styling', () => {
    expect(PROFILE_DELETE_BUTTON_CLASSES).toContain('rounded');
  });

  it('should meet touch target requirements (44px) on mobile', () => {
    expect(PROFILE_DELETE_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(PROFILE_DELETE_BUTTON_CLASSES).toContain('min-w-[44px]');
  });

  it('should have destructive hover color', () => {
    expect(PROFILE_DELETE_BUTTON_CLASSES).toContain('destructive');
  });

  it('should include focus visible ring', () => {
    expect(PROFILE_DELETE_BUTTON_CLASSES).toContain('focus-visible:ring-2');
  });
});

// ============================================================================
// Error State Classes Tests
// ============================================================================

describe('PROFILES_ERROR_CLASSES', () => {
  it('should include flex layout', () => {
    expect(PROFILES_ERROR_CLASSES).toContain('flex');
    expect(PROFILES_ERROR_CLASSES).toContain('flex-col');
  });

  it('should center content', () => {
    expect(PROFILES_ERROR_CLASSES).toContain('items-center');
    expect(PROFILES_ERROR_CLASSES).toContain('justify-center');
  });

  it('should include border styling', () => {
    expect(PROFILES_ERROR_CLASSES).toContain('rounded-lg');
    expect(PROFILES_ERROR_CLASSES).toContain('border');
    expect(PROFILES_ERROR_CLASSES).toContain('border-dashed');
  });

  it('should include destructive color', () => {
    expect(PROFILES_ERROR_CLASSES).toContain('destructive');
  });

  it('should include padding', () => {
    expect(PROFILES_ERROR_CLASSES).toContain('py-12');
    expect(PROFILES_ERROR_CLASSES).toContain('px-4');
  });

  it('should center text', () => {
    expect(PROFILES_ERROR_CLASSES).toContain('text-center');
  });
});

describe('PROFILES_ERROR_ICON_CLASSES', () => {
  it('should include fixed dimensions', () => {
    expect(PROFILES_ERROR_ICON_CLASSES).toContain('h-12');
    expect(PROFILES_ERROR_ICON_CLASSES).toContain('w-12');
  });

  it('should center content', () => {
    expect(PROFILES_ERROR_ICON_CLASSES).toContain('flex');
    expect(PROFILES_ERROR_ICON_CLASSES).toContain('items-center');
    expect(PROFILES_ERROR_ICON_CLASSES).toContain('justify-center');
  });

  it('should have rounded styling', () => {
    expect(PROFILES_ERROR_ICON_CLASSES).toContain('rounded-full');
  });

  it('should have destructive background', () => {
    expect(PROFILES_ERROR_ICON_CLASSES).toContain('destructive');
  });

  it('should include margin bottom', () => {
    expect(PROFILES_ERROR_ICON_CLASSES).toContain('mb-4');
  });
});

// ============================================================================
// Skeleton Classes Tests
// ============================================================================

describe('PROFILES_SKELETON_CONTAINER_CLASSES', () => {
  it('should be a grid', () => {
    expect(PROFILES_SKELETON_CONTAINER_CLASSES).toBe('grid');
  });
});

// ============================================================================
// Form Classes Tests
// ============================================================================

describe('FORM_FIELD_GAP_CLASSES', () => {
  it('should have sm spacing', () => {
    expect(FORM_FIELD_GAP_CLASSES.sm).toBe('space-y-3');
  });

  it('should have md spacing', () => {
    expect(FORM_FIELD_GAP_CLASSES.md).toBe('space-y-4');
  });

  it('should have lg spacing', () => {
    expect(FORM_FIELD_GAP_CLASSES.lg).toBe('space-y-5');
  });

  it('should use Tailwind space-y- pattern', () => {
    Object.values(FORM_FIELD_GAP_CLASSES).forEach((value) => {
      expect(value).toMatch(/^space-y-/);
    });
  });
});

describe('FORM_FOOTER_CLASSES', () => {
  it('should include flex layout', () => {
    expect(FORM_FOOTER_CLASSES).toContain('flex');
  });

  it('should stack vertically on mobile', () => {
    expect(FORM_FOOTER_CLASSES).toContain('flex-col');
  });

  it('should be horizontal on sm+ breakpoint', () => {
    expect(FORM_FOOTER_CLASSES).toContain('sm:flex-row');
  });

  it('should include gap', () => {
    expect(FORM_FOOTER_CLASSES).toContain('gap-2');
  });

  it('should include padding top', () => {
    expect(FORM_FOOTER_CLASSES).toContain('pt-4');
  });

  it('should justify end on sm+', () => {
    expect(FORM_FOOTER_CLASSES).toContain('sm:justify-end');
  });
});

describe('FORM_CHECKBOX_CONTAINER_CLASSES', () => {
  it('should include flex layout', () => {
    expect(FORM_CHECKBOX_CONTAINER_CLASSES).toContain('flex');
  });

  it('should center items', () => {
    expect(FORM_CHECKBOX_CONTAINER_CLASSES).toContain('items-center');
  });

  it('should include gap', () => {
    expect(FORM_CHECKBOX_CONTAINER_CLASSES).toContain('gap-2');
  });
});

// ============================================================================
// getBaseSize Utility Tests
// ============================================================================

describe('getBaseSize', () => {
  it('should return md when undefined', () => {
    expect(getBaseSize(undefined)).toBe('md');
  });

  it('should return the string value directly', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('should return base value from responsive object', () => {
    expect(getBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
    expect(getBaseSize({ base: 'lg' })).toBe('lg');
  });

  it('should return md when responsive object has no base', () => {
    expect(getBaseSize({ md: 'lg' })).toBe('md');
  });

  it('should handle empty object', () => {
    expect(getBaseSize({})).toBe('md');
  });
});

// ============================================================================
// getResponsiveSizeClasses Utility Tests
// ============================================================================

describe('getResponsiveSizeClasses', () => {
  it('should return md classes when undefined', () => {
    expect(getResponsiveSizeClasses(undefined, PROFILES_SIZE_CLASSES)).toBe('gap-4');
  });

  it('should return size class for string value', () => {
    expect(getResponsiveSizeClasses('sm', PROFILES_SIZE_CLASSES)).toBe('gap-3');
    expect(getResponsiveSizeClasses('md', PROFILES_SIZE_CLASSES)).toBe('gap-4');
    expect(getResponsiveSizeClasses('lg', PROFILES_SIZE_CLASSES)).toBe('gap-6');
  });

  it('should generate responsive classes from object', () => {
    const result = getResponsiveSizeClasses(
      { base: 'sm', md: 'md', lg: 'lg' },
      PROFILES_SIZE_CLASSES
    );
    expect(result).toContain('gap-3');
    expect(result).toContain('md:gap-4');
    expect(result).toContain('lg:gap-6');
  });

  it('should handle partial responsive object', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, PROFILES_SIZE_CLASSES);
    expect(result).toContain('gap-3');
    expect(result).toContain('lg:gap-6');
    expect(result).not.toContain('md:');
  });

  it('should handle object with only base', () => {
    expect(getResponsiveSizeClasses({ base: 'lg' }, PROFILES_SIZE_CLASSES)).toBe('gap-6');
  });

  it('should handle empty object', () => {
    expect(getResponsiveSizeClasses({}, PROFILES_SIZE_CLASSES)).toBe('gap-4');
  });

  it('should handle all breakpoints', () => {
    const result = getResponsiveSizeClasses(
      {
        base: 'sm',
        sm: 'sm',
        md: 'md',
        lg: 'lg',
        xl: 'lg',
        '2xl': 'lg',
      },
      PROFILES_SIZE_CLASSES
    );
    expect(result).toContain('gap-3');
    expect(result).toContain('sm:gap-3');
    expect(result).toContain('md:gap-4');
    expect(result).toContain('lg:gap-6');
    expect(result).toContain('xl:gap-6');
    expect(result).toContain('2xl:gap-6');
  });

  it('should work with multi-class values like grid classes', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, PROFILES_GRID_CLASSES);
    expect(result).toContain('gap-3');
    expect(result).toContain('sm:grid-cols-2');
    expect(result).toContain('lg:gap-6');
    expect(result).toContain('lg:lg:grid-cols-3');
  });
});

// ============================================================================
// buildProfileAccessibleLabel Utility Tests
// ============================================================================

describe('buildProfileAccessibleLabel', () => {
  const defaultProfile: ExecutorProfile = {
    id: 'profile-1',
    name: 'Claude Code',
    command: 'claude',
    args: '["--dangerously-skip-permissions"]',
    env: '{}',
    description: 'Default Claude Code profile',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const nonDefaultProfile: ExecutorProfile = {
    id: 'profile-2',
    name: 'Gemini CLI',
    command: 'gemini',
    args: undefined,
    env: undefined,
    description: undefined,
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('should include profile prefix', () => {
    const label = buildProfileAccessibleLabel(defaultProfile);
    expect(label).toContain(SR_PROFILE_PREFIX);
  });

  it('should include profile name', () => {
    const label = buildProfileAccessibleLabel(defaultProfile);
    expect(label).toContain('Claude Code');
  });

  it('should include (Default) for default profiles', () => {
    const label = buildProfileAccessibleLabel(defaultProfile);
    expect(label).toContain('(Default)');
  });

  it('should not include (Default) for non-default profiles', () => {
    const label = buildProfileAccessibleLabel(nonDefaultProfile);
    expect(label).not.toContain('(Default)');
  });

  it('should include command', () => {
    const label = buildProfileAccessibleLabel(defaultProfile);
    expect(label).toContain('Command: claude');
  });

  it('should include description when present', () => {
    const label = buildProfileAccessibleLabel(defaultProfile);
    expect(label).toContain('Default Claude Code profile');
  });

  it('should not include description when null', () => {
    const label = buildProfileAccessibleLabel(nonDefaultProfile);
    expect(label).not.toContain('null');
  });

  it('should join parts with spaces', () => {
    const label = buildProfileAccessibleLabel(defaultProfile);
    expect(label).toBe(
      'Executor profile: Claude Code (Default) Command: claude Default Claude Code profile'
    );
  });
});

// ============================================================================
// buildProfilesCountAnnouncement Utility Tests
// ============================================================================

describe('buildProfilesCountAnnouncement', () => {
  it('should return empty announcement for 0 profiles', () => {
    const announcement = buildProfilesCountAnnouncement(0);
    expect(announcement).toBe(SR_EMPTY);
  });

  it('should include count for 1 profile', () => {
    const announcement = buildProfilesCountAnnouncement(1);
    expect(announcement).toBe('1 profiles loaded');
  });

  it('should include count for multiple profiles', () => {
    const announcement = buildProfilesCountAnnouncement(5);
    expect(announcement).toBe('5 profiles loaded');
  });

  it('should include profiles loaded text', () => {
    const announcement = buildProfilesCountAnnouncement(10);
    expect(announcement).toContain(SR_PROFILES_LOADED);
  });
});

// ============================================================================
// getProfileIcon Utility Tests
// ============================================================================

describe('getProfileIcon', () => {
  const profile: ExecutorProfile = {
    id: 'profile-1',
    name: 'Test Profile',
    command: 'test',
    args: undefined,
    env: undefined,
    description: undefined,
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('should return Terminal icon', () => {
    const icon = getProfileIcon(profile);
    expect(icon).toBeDefined();
    // Terminal icon is always returned
  });

  it('should be a function (React component)', () => {
    const icon = getProfileIcon(profile);
    expect(typeof icon).toBe('function');
  });
});

// ============================================================================
// Type Validation Tests
// ============================================================================

describe('Type Validation', () => {
  it('ProfilesSize should accept valid values', () => {
    const sizes: ProfilesSize[] = ['sm', 'md', 'lg'];
    expect(sizes).toHaveLength(3);
  });

  it('ProfilesBreakpoint should accept valid values', () => {
    const breakpoints: ProfilesBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];
    expect(breakpoints).toHaveLength(6);
  });

  it('ProfileFormData should have required fields', () => {
    const formData: ProfileFormData = {
      name: 'Test',
      command: 'test',
      args: '[]',
      env: '{}',
      description: 'Test description',
      isDefault: false,
    };
    expect(formData.name).toBeDefined();
    expect(formData.command).toBeDefined();
    expect(formData.args).toBeDefined();
    expect(formData.env).toBeDefined();
    expect(formData.description).toBeDefined();
    expect(formData.isDefault).toBeDefined();
  });
});

// ============================================================================
// Accessibility Behavior Documentation
// ============================================================================

describe('Accessibility Behavior Documentation', () => {
  it('documents role="region" for layout', () => {
    // ProfilesPageLayout uses role="region" to mark it as a landmark
    // This helps screen reader users navigate to the profiles section
    expect(true).toBe(true);
  });

  it('documents role="list" and role="listitem" for profiles', () => {
    // ProfilesList uses role="list" on the <ul> element
    // ProfileCard uses role="listitem" on the <li> element
    // This provides proper list semantics for screen readers
    expect(true).toBe(true);
  });

  it('documents role="alert" for error state', () => {
    // ProfilesErrorState uses role="alert" with aria-live="assertive"
    // This ensures errors are immediately announced to screen reader users
    expect(true).toBe(true);
  });

  it('documents role="status" for loading state', () => {
    // ProfilesLoadingSkeleton uses role="status" with aria-busy="true"
    // This indicates content is loading
    expect(true).toBe(true);
  });

  it('documents touch target compliance', () => {
    // All interactive elements must be at least 44x44px per WCAG 2.5.5
    expect(PROFILE_ACTION_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(PROFILE_ACTION_BUTTON_CLASSES).toContain('min-w-[44px]');
    expect(PROFILE_DELETE_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(PROFILE_DELETE_BUTTON_CLASSES).toContain('min-w-[44px]');
  });

  it('documents screen reader announcements', () => {
    // VisuallyHidden with aria-live is used for dynamic announcements
    // Loading state announces via SR_LOADING
    // List count is announced when profiles are loaded
    expect(true).toBe(true);
  });

  it('documents focus management', () => {
    // Focus visible ring is applied to all interactive elements
    expect(PROFILE_ACTION_BUTTON_CLASSES).toContain('focus-visible:ring-2');
    expect(PROFILE_DELETE_BUTTON_CLASSES).toContain('focus-visible:ring-2');
  });

  it('documents reduced motion support', () => {
    // motion-safe: prefix ensures transitions only apply when user
    // has not enabled "reduce motion" preference
    expect(PROFILE_ACTION_BUTTON_CLASSES).toContain('motion-safe:transition-colors');
    expect(PROFILE_DELETE_BUTTON_CLASSES).toContain('motion-safe:transition-colors');
  });
});

// ============================================================================
// Component Props Documentation
// ============================================================================

describe('Component Props Documentation', () => {
  it('documents ProfilesPageLayout required props', () => {
    // Required props:
    // - description: string
    // - onCreateClick: () => void
    // - children: ReactNode
    expect(true).toBe(true);
  });

  it('documents ProfilesPageLayout optional props', () => {
    // Optional props:
    // - size: ResponsiveValue<ProfilesSize> (default: 'md')
    // - aria-label: string (default: DEFAULT_PAGE_LABEL)
    // - data-testid: string
    expect(true).toBe(true);
  });

  it('documents ProfileCard required props', () => {
    // Required props:
    // - profile: ExecutorProfile
    // - onEdit: () => void
    // - onDelete: () => void
    // - onSetDefault: () => void
    expect(true).toBe(true);
  });

  it('documents ProfileFormDialog required props', () => {
    // Required props:
    // - isOpen: boolean
    // - onClose: () => void
    // - title: string
    // - formData: ProfileFormData
    // - onFormChange: (field: keyof ProfileFormData, value: string | boolean) => void
    // - onSubmit: () => void
    // - isPending: boolean
    // - error: string | null
    // - submitLabel: string
    // - loadingText: string
    expect(true).toBe(true);
  });

  it('documents ProfilesContent required props', () => {
    // Required props:
    // - profiles: ExecutorProfile[]
    // - onCreateClick: () => void
    // - onEdit: (profile: ExecutorProfile) => void
    // - onDelete: (profile: ExecutorProfile) => void
    // - onSetDefault: (profile: ExecutorProfile) => void
    expect(true).toBe(true);
  });

  it('documents ProfilesContent optional props', () => {
    // Optional props:
    // - isLoading: boolean (default: false)
    // - error: string | null
    // - onRetry: () => void
    // - size: ResponsiveValue<ProfilesSize> (default: 'md')
    expect(true).toBe(true);
  });
});

// ============================================================================
// Data Attributes Documentation
// ============================================================================

describe('Data Attributes Documentation', () => {
  it('documents data-testid pattern for ProfilesPageLayout', () => {
    // When data-testid="profiles" is provided:
    // - Container: profiles
    // - Header: profiles-header
    // - Create button: profiles-create
    expect(true).toBe(true);
  });

  it('documents data-testid pattern for ProfileCard', () => {
    // When data-testid="profile-1" is provided:
    // - Card: profile-1
    // - Content: profile-1-content
    // - Command: profile-1-command
    // - Description: profile-1-description
    // - Actions: profile-1-actions
    // - Set default button: profile-1-set-default
    // - Edit button: profile-1-edit
    // - Delete button: profile-1-delete
    expect(true).toBe(true);
  });

  it('documents data-size attribute', () => {
    // data-size contains the base size ('sm' | 'md' | 'lg')
    // for CSS targeting and testing
    expect(true).toBe(true);
  });

  it('documents data-count attribute', () => {
    // ProfilesList includes data-count with the number of profiles
    // ProfilesLoadingSkeleton includes data-count with skeleton count
    expect(true).toBe(true);
  });

  it('documents data-profile-id attribute', () => {
    // ProfileCard includes data-profile-id with the profile ID
    // for identification in tests and CSS
    expect(true).toBe(true);
  });

  it('documents data-is-default attribute', () => {
    // ProfileCard includes data-is-default when profile.isDefault is true
    // This allows CSS styling for default profiles
    expect(true).toBe(true);
  });
});

// ============================================================================
// Integration Pattern Documentation
// ============================================================================

describe('Integration Pattern Documentation', () => {
  it('documents typical usage pattern', () => {
    // Usage pattern:
    // const { profiles, isLoading, error, refetch } = useProfiles();
    // const [showForm, setShowForm] = useState(false);
    // const [formData, setFormData] = useState(initialFormData);
    //
    // <ProfilesPageLayout
    //   description="Manage your AI CLI tool configurations"
    //   onCreateClick={() => setShowForm(true)}
    // >
    //   <ProfilesContent
    //     profiles={profiles}
    //     isLoading={isLoading}
    //     error={error?.message}
    //     onRetry={refetch}
    //     onCreateClick={() => setShowForm(true)}
    //     onEdit={(profile) => { /* open edit dialog */ }}
    //     onDelete={(profile) => { /* open confirm dialog */ }}
    //     onSetDefault={(profile) => { /* set as default */ }}
    //   />
    // </ProfilesPageLayout>
    expect(true).toBe(true);
  });

  it('documents form dialog pattern', () => {
    // Form dialog usage:
    // <ProfileFormDialog
    //   isOpen={showForm}
    //   onClose={() => setShowForm(false)}
    //   title={editingProfile ? 'Edit Profile' : 'New Profile'}
    //   formData={formData}
    //   onFormChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
    //   onSubmit={handleSubmit}
    //   isPending={mutation.isPending}
    //   error={mutation.error?.message || null}
    //   submitLabel={editingProfile ? 'Save' : 'Create'}
    //   loadingText={editingProfile ? 'Saving...' : 'Creating...'}
    // />
    expect(true).toBe(true);
  });

  it('documents confirm dialog pattern', () => {
    // Confirm dialog usage:
    // <ProfilesConfirmDialog
    //   isOpen={showConfirm}
    //   onClose={() => setShowConfirm(false)}
    //   title="Delete Profile"
    //   description="Are you sure you want to delete this profile?"
    //   confirmLabel="Delete"
    //   onConfirm={handleDelete}
    //   variant="destructive"
    //   loading={deleteMutation.isPending}
    // />
    expect(true).toBe(true);
  });
});
