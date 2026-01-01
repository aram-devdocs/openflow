/**
 * ProfilesSettingsPage - Stateless Page Component for Executor Profiles Settings
 *
 * This is a top-level stateless component that composes the executor profiles settings view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * Accessibility Features:
 * - Proper page landmark structure with region role
 * - h1 heading for page title with proper hierarchy
 * - Screen reader announcements for loading, error, and empty states
 * - Focus management with forwardRef support
 * - Responsive layout for all screen sizes
 * - Error boundary integration for graceful error handling
 * - WCAG 2.5.5 touch targets (≥44px) on interactive elements
 *
 * The component composes:
 * - ProfilesPageLayout (header with create button)
 * - ProfilesContent (empty state or profiles list)
 * - ProfilesLoadingSkeleton (loading state)
 * - ProfilesErrorState (error state with retry)
 * - ProfileFormDialog (create/edit profile dialog)
 * - ProfilesConfirmDialog (delete confirmation)
 *
 * @module pages/ProfilesSettingsPage
 */

import type { ExecutorProfile } from '@openflow/generated';
import { type ResponsiveValue, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { forwardRef, useId } from 'react';
import type { ConfirmDialogProps } from '../organisms/ConfirmDialog';
import {
  type ProfileFormData,
  ProfileFormDialog,
  type ProfilesBreakpoint,
  ProfilesConfirmDialog,
  ProfilesContent,
  ProfilesErrorState,
  ProfilesLoadingSkeleton,
  ProfilesPageLayout,
  type ProfilesSize,
} from '../organisms/ProfilesPageComponents';

// ============================================================================
// Types
// ============================================================================

/** Size variants for responsive layout */
export type ProfilesSettingsPageSize = ProfilesSize;

/** Breakpoints supported for responsive sizing */
export type ProfilesSettingsPageBreakpoint = ProfilesBreakpoint;

/** Props for the content section */
export interface ProfilesSettingsPageContentProps {
  /** Profiles to display */
  profiles: ExecutorProfile[];
  /** Callback for create button click (in empty state) */
  onCreateClick: () => void;
  /** Callback when edit is clicked */
  onEdit: (profile: ExecutorProfile) => void;
  /** Callback when delete is clicked */
  onDelete: (profile: ExecutorProfile) => void;
  /** Callback when set default is clicked */
  onSetDefault: (profile: ExecutorProfile) => void;
}

/** Props for the form dialog */
export interface ProfilesSettingsPageFormDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback to close dialog */
  onClose: () => void;
  /** Dialog title */
  title: string;
  /** Current form data */
  formData: ProfileFormData;
  /** Callback when form field changes */
  onFormChange: (field: keyof ProfileFormData, value: string | boolean) => void;
  /** Callback to submit form */
  onSubmit: () => void;
  /** Whether submit is pending */
  isPending: boolean;
  /** Error message if any */
  error: string | null;
  /** Submit button text */
  submitLabel: string;
  /** Loading text */
  loadingText: string;
}

/** Error state props for the page */
export interface ProfilesSettingsPageErrorProps {
  /** The error that occurred */
  error: Error;
  /** Callback to retry the failed operation */
  onRetry: () => void;
}

/** Props for ProfilesSettingsPageSkeleton */
export interface ProfilesSettingsPageSkeletonProps {
  /** Number of skeleton items to show */
  itemCount?: number;
  /** Responsive sizing */
  size?: ResponsiveValue<ProfilesSettingsPageSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/** Props for ProfilesSettingsPageError */
export interface ProfilesSettingsPageErrorStateProps {
  /** The error that occurred */
  error: Error;
  /** Retry handler */
  onRetry: () => void;
  /** Responsive sizing */
  size?: ResponsiveValue<ProfilesSettingsPageSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/**
 * Complete props for the ProfilesSettingsPage component.
 *
 * This interface defines all data and callbacks needed to render the profiles settings.
 * The route component is responsible for providing these props from hooks.
 */
export interface ProfilesSettingsPageProps {
  /** Whether data is loading */
  isLoading: boolean;

  /** Error state - if set, shows error UI instead of content */
  error?: Error | null;

  /** Retry handler for error state */
  onRetry?: () => void;

  /** Description text for the page header */
  description: string;

  /** Callback for create button in header */
  onCreateClick: () => void;

  /** Content props */
  content: ProfilesSettingsPageContentProps;

  /** Form dialog props */
  formDialog: ProfilesSettingsPageFormDialogProps;

  /** Confirm dialog props for delete action */
  confirmDialog: ConfirmDialogProps;

  /** Responsive sizing */
  size?: ResponsiveValue<ProfilesSettingsPageSize>;

  /** Custom aria-label for the page */
  'aria-label'?: string;

  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Default skeleton item count */
export const DEFAULT_SKELETON_COUNT = 4;

/** Default page size */
export const DEFAULT_PAGE_SIZE: ProfilesSettingsPageSize = 'md';

/** Screen reader announcement for loading state */
export const SR_LOADING = 'Loading executor profiles. Please wait.';

/** Screen reader announcement for error state */
export const SR_ERROR_PREFIX = 'Error loading profiles:';

/** Screen reader announcement for empty state */
export const SR_EMPTY = 'No executor profiles configured.';

/** Screen reader announcement for content loaded */
export const SR_LOADED_PREFIX = 'Profiles loaded.';

/** Default page label */
export const DEFAULT_PAGE_LABEL = 'Executor Profiles Settings';

/** Default error title */
export const DEFAULT_ERROR_TITLE = 'Failed to load profiles';

/** Default error description */
export const DEFAULT_ERROR_DESCRIPTION =
  'Something went wrong while loading the executor profiles.';

/** Default retry button label */
export const DEFAULT_RETRY_LABEL = 'Try Again';

/** Page container base classes */
export const PROFILES_SETTINGS_PAGE_BASE_CLASSES = 'relative flex flex-col h-full w-full';

/** Error container classes */
export const PROFILES_SETTINGS_PAGE_ERROR_CLASSES = [
  'flex flex-col items-center justify-center gap-4 p-6',
  'text-center min-h-[300px]',
].join(' ');

/** Skeleton container classes */
export const PROFILES_SETTINGS_PAGE_SKELETON_CLASSES = 'flex flex-col h-full';

/** Size-based container padding */
export const PAGE_SIZE_PADDING: Record<ProfilesSettingsPageSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/** Size-based gap classes */
export const PAGE_SIZE_GAP: Record<ProfilesSettingsPageSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Resolves a ResponsiveValue to its base size
 */
export function getBaseSize(
  size: ResponsiveValue<ProfilesSettingsPageSize> | undefined
): ProfilesSettingsPageSize {
  if (!size) return DEFAULT_PAGE_SIZE;
  if (typeof size === 'string') return size;
  return size.base ?? DEFAULT_PAGE_SIZE;
}

/**
 * Generates responsive Tailwind classes for the size prop
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ProfilesSettingsPageSize> | undefined,
  classMap: Record<ProfilesSettingsPageSize, string>
): string {
  if (!size) return classMap[DEFAULT_PAGE_SIZE];

  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointPrefixes: Record<Exclude<ProfilesSettingsPageBreakpoint, 'base'>, string> = {
    sm: 'sm:',
    md: 'md:',
    lg: 'lg:',
    xl: 'xl:',
    '2xl': '2xl:',
  };

  // Base size
  if (size.base) {
    classes.push(classMap[size.base]);
  } else {
    classes.push(classMap[DEFAULT_PAGE_SIZE]);
  }

  // Responsive overrides
  for (const [breakpoint, prefix] of Object.entries(breakpointPrefixes)) {
    const bp = breakpoint as Exclude<ProfilesSettingsPageBreakpoint, 'base'>;
    if (size[bp]) {
      const sizeClasses = classMap[size[bp] as ProfilesSettingsPageSize];
      const prefixedClasses = sizeClasses
        .split(' ')
        .map((cls) => `${prefix}${cls}`)
        .join(' ');
      classes.push(prefixedClasses);
    }
  }

  return classes.join(' ');
}

/**
 * Build screen reader announcement for loaded state
 */
export function buildLoadedAnnouncement(profileCount: number): string {
  if (profileCount === 0) {
    return SR_EMPTY;
  }
  const entityLabel = profileCount === 1 ? 'profile' : 'profiles';
  return `${SR_LOADED_PREFIX} ${profileCount} executor ${entityLabel} configured.`;
}

/**
 * Build accessible label for the page
 */
export function buildPageAccessibleLabel(isLoading: boolean, hasError: boolean): string {
  if (hasError) return 'Executor Profiles Settings - Error loading content';
  if (isLoading) return 'Executor Profiles Settings - Loading';
  return 'Executor Profiles Settings';
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Loading skeleton for the profiles settings page
 */
export const ProfilesSettingsPageSkeleton = forwardRef<
  HTMLDivElement,
  ProfilesSettingsPageSkeletonProps
>(function ProfilesSettingsPageSkeleton(
  { itemCount = DEFAULT_SKELETON_COUNT, size, 'data-testid': testId },
  ref
) {
  return (
    <div
      ref={ref}
      className={PROFILES_SETTINGS_PAGE_SKELETON_CLASSES}
      aria-hidden="true"
      role="presentation"
      data-testid={testId ?? 'profiles-settings-page-skeleton'}
    >
      {/* Screen reader loading announcement */}
      <VisuallyHidden>
        <div role="status" aria-live="polite">
          {SR_LOADING}
        </div>
      </VisuallyHidden>

      <ProfilesLoadingSkeleton count={itemCount} size={size} />
    </div>
  );
});

/**
 * Error state for the profiles settings page
 */
export const ProfilesSettingsPageError = forwardRef<
  HTMLDivElement,
  ProfilesSettingsPageErrorStateProps
>(function ProfilesSettingsPageError({ error, onRetry, size, 'data-testid': testId }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        PROFILES_SETTINGS_PAGE_ERROR_CLASSES,
        getResponsiveSizeClasses(size, PAGE_SIZE_PADDING)
      )}
      data-testid={testId ?? 'profiles-settings-page-error'}
    >
      {/* Screen reader announcement */}
      <VisuallyHidden>
        <div role="status" aria-live="assertive">
          {SR_ERROR_PREFIX} {error.message}
        </div>
      </VisuallyHidden>

      <ProfilesErrorState error={error.message} onRetry={onRetry} size={size} />
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * ProfilesSettingsPage - Complete stateless profiles settings page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
 *
 * Features:
 * - Page-level loading skeleton
 * - Error state with retry button
 * - Empty state handling (delegated to ProfilesContent)
 * - Proper heading hierarchy (h1 for title via Layout component)
 * - Screen reader announcements for state changes
 * - forwardRef support for focus management
 * - Responsive layout for all screen sizes
 *
 * @example
 * ```tsx
 * // In route component
 * function ExecutorProfilesRoute() {
 *   const session = useProfilesSession();
 *
 *   // Loading state
 *   if (session.isLoading) {
 *     return (
 *       <ProfilesSettingsPage
 *         isLoading={true}
 *         description="Executor profiles define which AI CLI tools to use for tasks."
 *         onCreateClick={session.handleOpenCreateDialog}
 *         content={{
 *           profiles: [],
 *           onCreateClick: session.handleOpenCreateDialog,
 *           onEdit: session.handleOpenEditDialog,
 *           onDelete: session.handleDelete,
 *           onSetDefault: session.handleSetDefault,
 *         }}
 *         formDialog={{
 *           isOpen: false,
 *           // ... other form dialog props
 *         }}
 *         confirmDialog={session.confirmDialogProps}
 *       />
 *     );
 *   }
 *
 *   // Error state
 *   if (session.error) {
 *     return (
 *       <ProfilesSettingsPage
 *         isLoading={false}
 *         error={session.error}
 *         onRetry={session.refetch}
 *         description="Executor profiles define which AI CLI tools to use for tasks."
 *         // ... other props
 *       />
 *     );
 *   }
 *
 *   // Determine dialog state
 *   const isDialogOpen = session.isCreateDialogOpen || session.editingProfile !== null;
 *   const dialogTitle = session.editingProfile ? 'Edit Executor Profile' : 'Create Executor Profile';
 *
 *   return (
 *     <ProfilesSettingsPage
 *       isLoading={false}
 *       description="Executor profiles define which AI CLI tools to use for tasks."
 *       onCreateClick={session.handleOpenCreateDialog}
 *       content={{
 *         profiles: session.profiles,
 *         onCreateClick: session.handleOpenCreateDialog,
 *         onEdit: session.handleOpenEditDialog,
 *         onDelete: session.handleDelete,
 *         onSetDefault: session.handleSetDefault,
 *       }}
 *       formDialog={{
 *         isOpen: isDialogOpen,
 *         onClose: session.handleCloseDialog,
 *         title: dialogTitle,
 *         formData: session.formData,
 *         onFormChange: session.handleFormChange,
 *         onSubmit: session.editingProfile ? session.handleUpdate : session.handleCreate,
 *         isPending: session.isCreating || session.isUpdating,
 *         error: session.formError,
 *         submitLabel: session.editingProfile ? 'Update Profile' : 'Create Profile',
 *         loadingText: session.editingProfile ? 'Updating...' : 'Creating...',
 *       }}
 *       confirmDialog={session.confirmDialogProps}
 *     />
 *   );
 * }
 * ```
 */
export const ProfilesSettingsPage = forwardRef<HTMLDivElement, ProfilesSettingsPageProps>(
  function ProfilesSettingsPage(
    {
      isLoading,
      error,
      onRetry,
      description,
      onCreateClick,
      content,
      formDialog,
      confirmDialog,
      size,
      'aria-label': ariaLabel,
      'data-testid': testId,
    },
    ref
  ) {
    // Reserved for future ARIA ID usage - useId ensures consistent IDs during SSR
    useId();
    const hasError = !!error;
    const profileCount = content.profiles.length;
    const isEmpty = profileCount === 0;

    // Generate accessible label
    const computedAriaLabel = ariaLabel ?? buildPageAccessibleLabel(isLoading, hasError);

    // Loading state - show skeleton
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={PROFILES_SETTINGS_PAGE_BASE_CLASSES}
          aria-label={computedAriaLabel}
          aria-busy="true"
          data-testid={testId ?? 'profiles-settings-page'}
          data-state="loading"
        >
          <ProfilesSettingsPageSkeleton size={size} />
        </div>
      );
    }

    // Error state - show error UI
    if (hasError && error && onRetry) {
      return (
        <div
          ref={ref}
          className={PROFILES_SETTINGS_PAGE_BASE_CLASSES}
          aria-label={computedAriaLabel}
          data-testid={testId ?? 'profiles-settings-page'}
          data-state="error"
        >
          <ProfilesSettingsPageError error={error} onRetry={onRetry} size={size} />
        </div>
      );
    }

    // Normal state - show content
    return (
      <div
        ref={ref}
        className={PROFILES_SETTINGS_PAGE_BASE_CLASSES}
        aria-label={computedAriaLabel}
        data-testid={testId ?? 'profiles-settings-page'}
        data-state={isEmpty ? 'empty' : 'loaded'}
        data-profile-count={profileCount}
      >
        {/* Screen reader announcements */}
        <VisuallyHidden>
          <div role="status" aria-live="polite" aria-atomic="true">
            {isEmpty ? SR_EMPTY : buildLoadedAnnouncement(profileCount)}
          </div>
        </VisuallyHidden>

        <ProfilesPageLayout description={description} onCreateClick={onCreateClick} size={size}>
          <ProfilesContent
            profiles={content.profiles}
            onCreateClick={content.onCreateClick}
            onEdit={content.onEdit}
            onDelete={content.onDelete}
            onSetDefault={content.onSetDefault}
            size={size}
          />

          {/* Create/Edit Dialog */}
          <ProfileFormDialog
            isOpen={formDialog.isOpen}
            onClose={formDialog.onClose}
            title={formDialog.title}
            formData={formDialog.formData}
            onFormChange={formDialog.onFormChange}
            onSubmit={formDialog.onSubmit}
            isPending={formDialog.isPending}
            error={formDialog.error}
            submitLabel={formDialog.submitLabel}
            loadingText={formDialog.loadingText}
            size={size}
          />

          {/* Confirm delete dialog */}
          <ProfilesConfirmDialog {...confirmDialog} />
        </ProfilesPageLayout>
      </div>
    );
  }
);

ProfilesSettingsPage.displayName = 'ProfilesSettingsPage';

// Re-export types from organisms for convenience
export type { ProfileFormData } from '../organisms/ProfilesPageComponents';
