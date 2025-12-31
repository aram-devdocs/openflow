/**
 * ProfilesSettingsPage - Stateless Page Component for Executor Profiles Settings
 *
 * This is a top-level stateless component that composes the executor profiles settings view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * The component composes:
 * - ProfilesPageLayout (header with create button)
 * - ProfilesContent (empty state or profiles list)
 * - ProfilesLoadingSkeleton (loading state)
 * - ProfileFormDialog (create/edit profile dialog)
 * - ProfilesConfirmDialog (delete confirmation)
 */

import type { ExecutorProfile } from '@openflow/generated';
import type { ConfirmDialogProps } from '../organisms/ConfirmDialog';
import {
  type ProfileFormData,
  ProfileFormDialog,
  ProfilesConfirmDialog,
  ProfilesContent,
  ProfilesLoadingSkeleton,
  ProfilesPageLayout,
} from '../organisms/ProfilesPageComponents';

// ============================================================================
// Types
// ============================================================================

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

/**
 * Complete props for the ProfilesSettingsPage component.
 *
 * This interface defines all data and callbacks needed to render the profiles settings.
 * The route component is responsible for providing these props from hooks.
 */
export interface ProfilesSettingsPageProps {
  /** Whether data is loading */
  isLoading: boolean;

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
}

// ============================================================================
// Component
// ============================================================================

/**
 * ProfilesSettingsPage - Complete stateless profiles settings page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
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
export function ProfilesSettingsPage({
  isLoading,
  description,
  onCreateClick,
  content,
  formDialog,
  confirmDialog,
}: ProfilesSettingsPageProps) {
  // Loading state
  if (isLoading) {
    return <ProfilesLoadingSkeleton count={4} />;
  }

  return (
    <ProfilesPageLayout description={description} onCreateClick={onCreateClick}>
      <ProfilesContent
        profiles={content.profiles}
        onCreateClick={content.onCreateClick}
        onEdit={content.onEdit}
        onDelete={content.onDelete}
        onSetDefault={content.onSetDefault}
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
      />

      {/* Confirm delete dialog */}
      <ProfilesConfirmDialog {...confirmDialog} />
    </ProfilesPageLayout>
  );
}

ProfilesSettingsPage.displayName = 'ProfilesSettingsPage';
