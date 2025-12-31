/**
 * Executor Profiles Settings Route
 *
 * Manages AI CLI tool configurations (Claude Code, Gemini CLI, Codex CLI, etc.).
 * Users can:
 * - View all executor profiles
 * - Create new profiles
 * - Edit existing profiles
 * - Delete profiles
 * - Set a default profile
 *
 * Follows the orchestration pattern: pure composition of hooks and UI components.
 */

import { useProfilesSession } from '@openflow/hooks';
import {
  ProfileFormDialog,
  ProfilesConfirmDialog,
  ProfilesContent,
  ProfilesLoadingSkeleton,
  ProfilesPageLayout,
} from '@openflow/ui';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/profiles')({
  component: ExecutorProfilesPage,
});

function ExecutorProfilesPage() {
  const session = useProfilesSession();

  // Loading state
  if (session.isLoading) {
    return <ProfilesLoadingSkeleton count={4} />;
  }

  // Determine dialog state
  const isDialogOpen = session.isCreateDialogOpen || session.editingProfile !== null;
  const dialogTitle = session.editingProfile ? 'Edit Executor Profile' : 'Create Executor Profile';
  const submitLabel = session.editingProfile ? 'Update Profile' : 'Create Profile';
  const loadingText = session.editingProfile ? 'Updating...' : 'Creating...';
  const isPending = session.isCreating || session.isUpdating;

  return (
    <ProfilesPageLayout
      description="Executor profiles define which AI CLI tools to use for tasks."
      onCreateClick={session.handleOpenCreateDialog}
    >
      <ProfilesContent
        profiles={session.profiles}
        onCreateClick={session.handleOpenCreateDialog}
        onEdit={session.handleOpenEditDialog}
        onDelete={session.handleDelete}
        onSetDefault={session.handleSetDefault}
      />

      {/* Create/Edit Dialog */}
      <ProfileFormDialog
        isOpen={isDialogOpen}
        onClose={session.handleCloseDialog}
        title={dialogTitle}
        formData={session.formData}
        onFormChange={session.handleFormChange}
        onSubmit={session.editingProfile ? session.handleUpdate : session.handleCreate}
        isPending={isPending}
        error={session.formError}
        submitLabel={submitLabel}
        loadingText={loadingText}
      />

      {/* Confirm delete dialog */}
      <ProfilesConfirmDialog {...session.confirmDialogProps} />
    </ProfilesPageLayout>
  );
}
