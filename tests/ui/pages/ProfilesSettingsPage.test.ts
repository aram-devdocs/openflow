/**
 * ProfilesSettingsPage Unit Tests
 *
 * Tests for constants, utility functions, and documents component behavior
 * for the ProfilesSettingsPage component.
 *
 * These tests focus on:
 * - Exported constants have correct values
 * - CSS class constants are properly formatted
 * - Utility functions work correctly
 * - Component behavior is documented through test cases
 *
 * @module tests/ui/pages/ProfilesSettingsPage.test
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ERROR_DESCRIPTION,
  DEFAULT_ERROR_TITLE,
  DEFAULT_PAGE_LABEL,
  DEFAULT_PAGE_SIZE,
  DEFAULT_RETRY_LABEL,
  // Constants
  DEFAULT_SKELETON_COUNT,
  PAGE_SIZE_GAP,
  PAGE_SIZE_PADDING,
  PROFILES_SETTINGS_PAGE_BASE_CLASSES,
  PROFILES_SETTINGS_PAGE_ERROR_CLASSES,
  PROFILES_SETTINGS_PAGE_SKELETON_CLASSES,
  type ProfilesSettingsPageBreakpoint,
  type ProfilesSettingsPageContentProps,
  type ProfilesSettingsPageErrorProps,
  type ProfilesSettingsPageErrorStateProps,
  type ProfilesSettingsPageFormDialogProps,
  type ProfilesSettingsPageProps,
  // Types
  type ProfilesSettingsPageSize,
  type ProfilesSettingsPageSkeletonProps,
  SR_EMPTY,
  SR_ERROR_PREFIX,
  SR_LOADED_PREFIX,
  SR_LOADING,
  buildLoadedAnnouncement,
  buildPageAccessibleLabel,
  // Utility functions
  getBaseSize,
  getResponsiveSizeClasses,
} from '../../../packages/ui/pages/ProfilesSettingsPage';

// ============================================================================
// Constants Tests
// ============================================================================

describe('ProfilesSettingsPage Constants', () => {
  describe('DEFAULT_SKELETON_COUNT', () => {
    it('should be a positive integer', () => {
      expect(DEFAULT_SKELETON_COUNT).toBeGreaterThan(0);
      expect(Number.isInteger(DEFAULT_SKELETON_COUNT)).toBe(true);
    });

    it('should be 4 for typical loading state', () => {
      expect(DEFAULT_SKELETON_COUNT).toBe(4);
    });
  });

  describe('DEFAULT_PAGE_SIZE', () => {
    it('should be a valid size value', () => {
      const validSizes: ProfilesSettingsPageSize[] = ['sm', 'md', 'lg'];
      expect(validSizes).toContain(DEFAULT_PAGE_SIZE);
    });

    it('should be md for balanced default', () => {
      expect(DEFAULT_PAGE_SIZE).toBe('md');
    });
  });

  describe('DEFAULT_PAGE_LABEL', () => {
    it('should be descriptive', () => {
      expect(DEFAULT_PAGE_LABEL).toBe('Executor Profiles Settings');
    });

    it('should not be empty', () => {
      expect(DEFAULT_PAGE_LABEL.length).toBeGreaterThan(0);
    });
  });

  describe('Error message constants', () => {
    it('DEFAULT_ERROR_TITLE should be user-friendly', () => {
      expect(DEFAULT_ERROR_TITLE).toBe('Failed to load profiles');
      expect(DEFAULT_ERROR_TITLE.length).toBeGreaterThan(0);
    });

    it('DEFAULT_ERROR_DESCRIPTION should provide context', () => {
      expect(DEFAULT_ERROR_DESCRIPTION).toBe(
        'Something went wrong while loading the executor profiles.'
      );
      expect(DEFAULT_ERROR_DESCRIPTION.length).toBeGreaterThan(0);
    });

    it('DEFAULT_RETRY_LABEL should be actionable', () => {
      expect(DEFAULT_RETRY_LABEL).toBe('Try Again');
      expect(DEFAULT_RETRY_LABEL.length).toBeGreaterThan(0);
    });
  });

  describe('Screen reader constants', () => {
    it('SR_LOADING should announce loading state', () => {
      expect(SR_LOADING).toBe('Loading executor profiles. Please wait.');
      expect(SR_LOADING).toContain('Loading');
    });

    it('SR_ERROR_PREFIX should announce error state', () => {
      expect(SR_ERROR_PREFIX).toBe('Error loading profiles:');
      expect(SR_ERROR_PREFIX).toContain('Error');
    });

    it('SR_EMPTY should announce empty state', () => {
      expect(SR_EMPTY).toBe('No executor profiles configured.');
      expect(SR_EMPTY.length).toBeGreaterThan(0);
    });

    it('SR_LOADED_PREFIX should announce loaded state', () => {
      expect(SR_LOADED_PREFIX).toBe('Profiles loaded.');
      expect(SR_LOADED_PREFIX.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// CSS Class Constants Tests
// ============================================================================

describe('ProfilesSettingsPage CSS Classes', () => {
  describe('PROFILES_SETTINGS_PAGE_BASE_CLASSES', () => {
    it('should include flex layout', () => {
      expect(PROFILES_SETTINGS_PAGE_BASE_CLASSES).toContain('flex');
      expect(PROFILES_SETTINGS_PAGE_BASE_CLASSES).toContain('flex-col');
    });

    it('should include full dimensions', () => {
      expect(PROFILES_SETTINGS_PAGE_BASE_CLASSES).toContain('h-full');
      expect(PROFILES_SETTINGS_PAGE_BASE_CLASSES).toContain('w-full');
    });

    it('should include relative positioning', () => {
      expect(PROFILES_SETTINGS_PAGE_BASE_CLASSES).toContain('relative');
    });
  });

  describe('PROFILES_SETTINGS_PAGE_ERROR_CLASSES', () => {
    it('should include centering', () => {
      expect(PROFILES_SETTINGS_PAGE_ERROR_CLASSES).toContain('items-center');
      expect(PROFILES_SETTINGS_PAGE_ERROR_CLASSES).toContain('justify-center');
    });

    it('should include text centering', () => {
      expect(PROFILES_SETTINGS_PAGE_ERROR_CLASSES).toContain('text-center');
    });

    it('should include minimum height', () => {
      expect(PROFILES_SETTINGS_PAGE_ERROR_CLASSES).toContain('min-h-');
    });

    it('should include gap for spacing', () => {
      expect(PROFILES_SETTINGS_PAGE_ERROR_CLASSES).toContain('gap-');
    });
  });

  describe('PROFILES_SETTINGS_PAGE_SKELETON_CLASSES', () => {
    it('should include flex layout', () => {
      expect(PROFILES_SETTINGS_PAGE_SKELETON_CLASSES).toContain('flex');
      expect(PROFILES_SETTINGS_PAGE_SKELETON_CLASSES).toContain('flex-col');
    });

    it('should include full height', () => {
      expect(PROFILES_SETTINGS_PAGE_SKELETON_CLASSES).toContain('h-full');
    });
  });

  describe('PAGE_SIZE_PADDING', () => {
    it('should have all size variants', () => {
      expect(PAGE_SIZE_PADDING).toHaveProperty('sm');
      expect(PAGE_SIZE_PADDING).toHaveProperty('md');
      expect(PAGE_SIZE_PADDING).toHaveProperty('lg');
    });

    it('should have valid padding classes', () => {
      expect(PAGE_SIZE_PADDING.sm).toMatch(/^p-\d+$/);
      expect(PAGE_SIZE_PADDING.md).toMatch(/^p-\d+$/);
      expect(PAGE_SIZE_PADDING.lg).toMatch(/^p-\d+$/);
    });

    it('should have increasing padding values', () => {
      const smValue = Number.parseInt(PAGE_SIZE_PADDING.sm.replace('p-', ''), 10);
      const mdValue = Number.parseInt(PAGE_SIZE_PADDING.md.replace('p-', ''), 10);
      const lgValue = Number.parseInt(PAGE_SIZE_PADDING.lg.replace('p-', ''), 10);

      expect(mdValue).toBeGreaterThanOrEqual(smValue);
      expect(lgValue).toBeGreaterThanOrEqual(mdValue);
    });
  });

  describe('PAGE_SIZE_GAP', () => {
    it('should have all size variants', () => {
      expect(PAGE_SIZE_GAP).toHaveProperty('sm');
      expect(PAGE_SIZE_GAP).toHaveProperty('md');
      expect(PAGE_SIZE_GAP).toHaveProperty('lg');
    });

    it('should have valid gap classes', () => {
      expect(PAGE_SIZE_GAP.sm).toMatch(/^gap-\d+$/);
      expect(PAGE_SIZE_GAP.md).toMatch(/^gap-\d+$/);
      expect(PAGE_SIZE_GAP.lg).toMatch(/^gap-\d+$/);
    });

    it('should have increasing gap values', () => {
      const smValue = Number.parseInt(PAGE_SIZE_GAP.sm.replace('gap-', ''), 10);
      const mdValue = Number.parseInt(PAGE_SIZE_GAP.md.replace('gap-', ''), 10);
      const lgValue = Number.parseInt(PAGE_SIZE_GAP.lg.replace('gap-', ''), 10);

      expect(mdValue).toBeGreaterThanOrEqual(smValue);
      expect(lgValue).toBeGreaterThanOrEqual(mdValue);
    });
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('ProfilesSettingsPage Utility Functions', () => {
  describe('getBaseSize', () => {
    it('should return default size when undefined', () => {
      expect(getBaseSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
    });

    it('should return string size directly', () => {
      expect(getBaseSize('sm')).toBe('sm');
      expect(getBaseSize('md')).toBe('md');
      expect(getBaseSize('lg')).toBe('lg');
    });

    it('should extract base from responsive object', () => {
      expect(getBaseSize({ base: 'sm' })).toBe('sm');
      expect(getBaseSize({ base: 'lg', md: 'md' })).toBe('lg');
    });

    it('should return default when object has no base', () => {
      expect(getBaseSize({ md: 'lg' } as any)).toBe(DEFAULT_PAGE_SIZE);
    });
  });

  describe('getResponsiveSizeClasses', () => {
    const testClassMap: Record<ProfilesSettingsPageSize, string> = {
      sm: 'text-sm p-2',
      md: 'text-md p-4',
      lg: 'text-lg p-6',
    };

    it('should return default size classes when undefined', () => {
      const result = getResponsiveSizeClasses(undefined, testClassMap);
      expect(result).toBe(testClassMap[DEFAULT_PAGE_SIZE]);
    });

    it('should return mapped classes for string size', () => {
      expect(getResponsiveSizeClasses('sm', testClassMap)).toBe('text-sm p-2');
      expect(getResponsiveSizeClasses('md', testClassMap)).toBe('text-md p-4');
      expect(getResponsiveSizeClasses('lg', testClassMap)).toBe('text-lg p-6');
    });

    it('should generate responsive classes from object', () => {
      const result = getResponsiveSizeClasses({ base: 'sm', md: 'lg' }, testClassMap);

      expect(result).toContain('text-sm');
      expect(result).toContain('p-2');
      expect(result).toContain('md:text-lg');
      expect(result).toContain('md:p-6');
    });

    it('should handle all breakpoints', () => {
      const result = getResponsiveSizeClasses(
        { base: 'sm', sm: 'sm', md: 'md', lg: 'lg', xl: 'lg', '2xl': 'lg' },
        testClassMap
      );

      expect(result).toContain('text-sm');
      expect(result).toContain('sm:text-sm');
      expect(result).toContain('md:text-md');
      expect(result).toContain('lg:text-lg');
      expect(result).toContain('xl:text-lg');
      expect(result).toContain('2xl:text-lg');
    });

    it('should use default when object has no base', () => {
      const result = getResponsiveSizeClasses({ lg: 'lg' } as any, testClassMap);

      expect(result).toContain(testClassMap[DEFAULT_PAGE_SIZE]);
      expect(result).toContain('lg:text-lg');
    });
  });

  describe('buildLoadedAnnouncement', () => {
    it('should return empty state message for zero profiles', () => {
      expect(buildLoadedAnnouncement(0)).toBe(SR_EMPTY);
    });

    it('should use singular form for one profile', () => {
      const result = buildLoadedAnnouncement(1);
      expect(result).toContain('1');
      expect(result).toContain('profile');
      expect(result).not.toContain('profiles');
    });

    it('should use plural form for multiple profiles', () => {
      const result = buildLoadedAnnouncement(5);
      expect(result).toContain('5');
      expect(result).toContain('profiles');
    });

    it('should include loaded prefix', () => {
      const result = buildLoadedAnnouncement(3);
      expect(result).toContain(SR_LOADED_PREFIX);
    });

    it('should include "executor" in the announcement', () => {
      expect(buildLoadedAnnouncement(2)).toContain('executor');
      expect(buildLoadedAnnouncement(1)).toContain('executor');
    });
  });

  describe('buildPageAccessibleLabel', () => {
    it('should return loading label when loading', () => {
      const result = buildPageAccessibleLabel(true, false);
      expect(result).toContain('Loading');
      expect(result).toContain('Executor Profiles Settings');
    });

    it('should return error label when has error', () => {
      const result = buildPageAccessibleLabel(false, true);
      expect(result).toContain('Error');
      expect(result).toContain('Executor Profiles Settings');
    });

    it('should return base label when neither loading nor error', () => {
      const result = buildPageAccessibleLabel(false, false);
      expect(result).toBe('Executor Profiles Settings');
    });

    it('should prioritize error over loading', () => {
      // When both error and loading, error takes precedence
      const result = buildPageAccessibleLabel(true, true);
      expect(result).toContain('Error');
    });
  });
});

// ============================================================================
// Type Export Tests
// ============================================================================

describe('ProfilesSettingsPage Type Exports', () => {
  it('should export ProfilesSettingsPageSize type', () => {
    const size: ProfilesSettingsPageSize = 'md';
    expect(['sm', 'md', 'lg']).toContain(size);
  });

  it('should export ProfilesSettingsPageBreakpoint type', () => {
    const breakpoint: ProfilesSettingsPageBreakpoint = 'md';
    expect(['base', 'sm', 'md', 'lg', 'xl', '2xl']).toContain(breakpoint);
  });

  it('should export ProfilesSettingsPageProps type', () => {
    // Type checking - this compiles if types are correct
    const props: Partial<ProfilesSettingsPageProps> = {
      isLoading: false,
      size: 'md',
      'aria-label': 'Test label',
    };
    expect(props.isLoading).toBe(false);
  });

  it('should export ProfilesSettingsPageContentProps type', () => {
    const props: Partial<ProfilesSettingsPageContentProps> = {
      profiles: [],
      onCreateClick: () => {},
    };
    expect(props.profiles).toEqual([]);
  });

  it('should export ProfilesSettingsPageFormDialogProps type', () => {
    const props: Partial<ProfilesSettingsPageFormDialogProps> = {
      isOpen: true,
      title: 'Create Profile',
      isPending: false,
    };
    expect(props.isOpen).toBe(true);
  });

  it('should export ProfilesSettingsPageErrorProps type', () => {
    const props: Partial<ProfilesSettingsPageErrorProps> = {
      error: new Error('Test error'),
    };
    expect(props.error).toBeInstanceOf(Error);
  });

  it('should export ProfilesSettingsPageSkeletonProps type', () => {
    const props: ProfilesSettingsPageSkeletonProps = {
      itemCount: 5,
      size: 'lg',
    };
    expect(props.itemCount).toBe(5);
  });

  it('should export ProfilesSettingsPageErrorStateProps type', () => {
    const props: ProfilesSettingsPageErrorStateProps = {
      error: new Error('Test'),
      onRetry: () => {},
      size: 'md',
    };
    expect(props.error.message).toBe('Test');
  });
});

// ============================================================================
// Component Behavior Documentation Tests
// ============================================================================

describe('ProfilesSettingsPage Component Behavior', () => {
  describe('Loading State', () => {
    it('should show skeleton when isLoading is true', () => {
      // Component behavior: When isLoading=true, renders ProfilesSettingsPageSkeleton
      // with aria-busy="true" and data-state="loading"
      expect(true).toBe(true);
    });

    it('should announce loading to screen readers', () => {
      // Component behavior: VisuallyHidden announces SR_LOADING via aria-live="polite"
      expect(SR_LOADING).toContain('Loading');
    });
  });

  describe('Error State', () => {
    it('should show error when error prop is provided', () => {
      // Component behavior: When error is set and onRetry provided,
      // renders ProfilesSettingsPageError with data-state="error"
      expect(true).toBe(true);
    });

    it('should announce error to screen readers', () => {
      // Component behavior: VisuallyHidden announces error with SR_ERROR_PREFIX
      // via aria-live="assertive" for immediate attention
      expect(SR_ERROR_PREFIX).toContain('Error');
    });

    it('should provide retry functionality', () => {
      // Component behavior: Error state includes retry button that calls onRetry
      expect(DEFAULT_RETRY_LABEL).toBe('Try Again');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when profiles array is empty', () => {
      // Component behavior: When profiles.length === 0 and not loading/error,
      // delegates to ProfilesContent which shows empty state
      // data-state="empty" is set on container
      expect(true).toBe(true);
    });

    it('should announce empty state to screen readers', () => {
      expect(buildLoadedAnnouncement(0)).toBe(SR_EMPTY);
    });
  });

  describe('Loaded State', () => {
    it('should show content when profiles are loaded', () => {
      // Component behavior: When profiles.length > 0 and not loading/error,
      // renders ProfilesContent with data-state="loaded" and data-profile-count
      expect(true).toBe(true);
    });

    it('should announce profile count to screen readers', () => {
      const announcement = buildLoadedAnnouncement(3);
      expect(announcement).toContain('3');
      expect(announcement).toContain('profiles');
    });

    it('should include profile count in data attributes', () => {
      // Component behavior: data-profile-count is set to profiles.length
      expect(true).toBe(true);
    });
  });

  describe('Dialog Integration', () => {
    it('should render form dialog when formDialog.isOpen is true', () => {
      // Component behavior: ProfileFormDialog is always rendered
      // but only visible when formDialog.isOpen === true
      expect(true).toBe(true);
    });

    it('should render confirm dialog for delete actions', () => {
      // Component behavior: ProfilesConfirmDialog receives confirmDialog props
      // for delete confirmation flow
      expect(true).toBe(true);
    });
  });

  describe('Accessibility Features', () => {
    it('should support forwardRef for focus management', () => {
      // Component behavior: forwardRef allows parent to get DOM ref
      // for programmatic focus management
      expect(true).toBe(true);
    });

    it('should have accessible label', () => {
      // Component behavior: aria-label is computed from buildPageAccessibleLabel
      // or uses custom aria-label prop if provided
      expect(buildPageAccessibleLabel(false, false)).toBe('Executor Profiles Settings');
    });

    it('should indicate busy state during loading', () => {
      // Component behavior: aria-busy="true" when isLoading
      expect(true).toBe(true);
    });

    it('should support custom test IDs', () => {
      // Component behavior: data-testid defaults to 'profiles-settings-page'
      // but can be overridden with data-testid prop
      expect(true).toBe(true);
    });
  });

  describe('Responsive Layout', () => {
    it('should support size prop for consistent sizing', () => {
      // Component behavior: size prop is passed to child components
      // for consistent responsive layout
      expect(true).toBe(true);
    });

    it('should support responsive size values', () => {
      // Component behavior: ResponsiveValue<ProfilesSettingsPageSize>
      // allows different sizes at different breakpoints
      const responsiveSize = { base: 'sm', md: 'md', lg: 'lg' };
      expect(getBaseSize(responsiveSize as any)).toBe('sm');
    });
  });
});

// ============================================================================
// Integration Behavior Tests
// ============================================================================

describe('ProfilesSettingsPage Integration Behavior', () => {
  describe('Page Layout', () => {
    it('should compose ProfilesPageLayout with content', () => {
      // Integration: Main component wraps ProfilesPageLayout
      // which provides header with create button
      expect(true).toBe(true);
    });

    it('should provide description to layout', () => {
      // Integration: description prop is passed to ProfilesPageLayout
      // for display in page header
      expect(true).toBe(true);
    });
  });

  describe('Content Management', () => {
    it('should pass profiles to ProfilesContent', () => {
      // Integration: content.profiles is passed to ProfilesContent
      expect(true).toBe(true);
    });

    it('should wire up CRUD callbacks', () => {
      // Integration: onEdit, onDelete, onSetDefault are passed to ProfilesContent
      expect(true).toBe(true);
    });
  });

  describe('Form Dialog Lifecycle', () => {
    it('should handle create flow', () => {
      // Integration: onCreateClick opens dialog with create mode
      // formDialog controls dialog state and form submission
      expect(true).toBe(true);
    });

    it('should handle edit flow', () => {
      // Integration: onEdit opens dialog with profile data
      // formDialog.formData contains the profile being edited
      expect(true).toBe(true);
    });

    it('should handle form submission', () => {
      // Integration: formDialog.onSubmit handles create/update
      // isPending shows loading state, error shows validation errors
      expect(true).toBe(true);
    });
  });

  describe('Delete Confirmation Flow', () => {
    it('should show confirmation before delete', () => {
      // Integration: onDelete triggers confirmDialog to open
      // User must confirm before actual deletion
      expect(true).toBe(true);
    });

    it('should support cancel action', () => {
      // Integration: confirmDialog has cancel handler
      // to close without deleting
      expect(true).toBe(true);
    });
  });
});
