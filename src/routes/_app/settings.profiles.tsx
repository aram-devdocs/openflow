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
import { ProfilesSettingsPage } from '@openflow/ui';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/settings/profiles')({
  component: ExecutorProfilesRoute,
});

function ExecutorProfilesRoute() {
  const session = useProfilesSession();

  // Determine dialog state
  const isDialogOpen = session.isCreateDialogOpen || session.editingProfile !== null;
  const dialogTitle = session.editingProfile ? 'Edit Executor Profile' : 'Create Executor Profile';
  const submitLabel = session.editingProfile ? 'Update Profile' : 'Create Profile';
  const loadingText = session.editingProfile ? 'Updating...' : 'Creating...';
  const isPending = session.isCreating || session.isUpdating;

  return (
    <ProfilesSettingsPage
      isLoading={session.isLoading}
      description="Executor profiles define which AI CLI tools to use for tasks."
      onCreateClick={session.handleOpenCreateDialog}
      content={{
        profiles: session.profiles,
        onCreateClick: session.handleOpenCreateDialog,
        onEdit: session.handleOpenEditDialog,
        onDelete: session.handleDelete,
        onSetDefault: session.handleSetDefault,
      }}
      formDialog={{
        isOpen: isDialogOpen,
        onClose: session.handleCloseDialog,
        title: dialogTitle,
        formData: session.formData,
        onFormChange: session.handleFormChange,
        onSubmit: session.editingProfile ? session.handleUpdate : session.handleCreate,
        isPending,
        error: session.formError,
        submitLabel,
        loadingText,
      }}
      confirmDialog={session.confirmDialogProps}
    />
  );
}
