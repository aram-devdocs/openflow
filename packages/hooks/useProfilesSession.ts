/**
 * useProfilesSession - Hook for managing Executor Profiles Settings page state
 *
 * This hook encapsulates all the state management, data fetching, and
 * callbacks for the Executor Profiles Settings page, keeping the route component pure.
 */

import type {
  CreateExecutorProfileRequest,
  ExecutorProfile,
  UpdateExecutorProfileRequest,
} from '@openflow/generated';
import { useCallback, useState } from 'react';

import { useConfirmDialog } from './useConfirmDialog';
import {
  useCreateExecutorProfile,
  useDeleteExecutorProfile,
  useExecutorProfiles,
  useUpdateExecutorProfile,
} from './useExecutorProfiles';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

// ============================================================================
// Types
// ============================================================================

/** Form data for creating/editing executor profiles */
export interface ProfileFormData {
  name: string;
  command: string;
  args: string;
  env: string;
  description: string;
  isDefault: boolean;
}

export interface UseProfilesSessionOptions {
  /** Callback for showing success messages */
  onSuccess?: (title: string, message: string) => void;
  /** Callback for showing error messages */
  onError?: (title: string, message: string) => void;
}

export interface ProfilesSessionState {
  // Data
  profiles: ExecutorProfile[];
  isLoading: boolean;

  // Dialog state
  isCreateDialogOpen: boolean;
  editingProfile: ExecutorProfile | null;
  formData: ProfileFormData;
  formError: string | null;

  // Pending states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Confirm dialog (matches ConfirmDialogProps from @openflow/ui)
  confirmDialogProps: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'destructive' | 'warning';
    loading: boolean;
  };

  // Dialog actions
  handleOpenCreateDialog: () => void;
  handleCloseDialog: () => void;
  handleOpenEditDialog: (profile: ExecutorProfile) => void;

  // Form actions
  handleFormChange: (field: keyof ProfileFormData, value: string | boolean) => void;
  handleCreate: () => void;
  handleUpdate: () => void;

  // Profile actions
  handleDelete: (profile: ExecutorProfile) => void;
  handleSetDefault: (profile: ExecutorProfile) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getEmptyFormData(): ProfileFormData {
  return {
    name: '',
    command: '',
    args: '',
    env: '',
    description: '',
    isDefault: false,
  };
}

function profileToFormData(profile: ExecutorProfile): ProfileFormData {
  return {
    name: profile.name,
    command: profile.command,
    args: profile.args ?? '',
    env: profile.env ?? '',
    description: profile.description ?? '',
    isDefault: profile.isDefault,
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useProfilesSession hook for managing Executor Profiles Settings page state.
 *
 * Encapsulates:
 * - Data fetching (executor profiles)
 * - UI state (dialogs, form data)
 * - All user interaction callbacks
 * - Form validation and error handling
 *
 * @example
 * ```tsx
 * function ExecutorProfilesPage() {
 *   const session = useProfilesSession({
 *     onSuccess: (title, message) => toast.success(title, message),
 *     onError: (title, message) => toast.error(title, message),
 *   });
 *
 *   if (session.isLoading) {
 *     return <ProfilesLoadingSkeleton />;
 *   }
 *
 *   return (
 *     <ProfilesPageLayout
 *       profiles={session.profiles}
 *       onCreateClick={session.handleOpenCreateDialog}
 *     >
 *       <ProfilesList
 *         profiles={session.profiles}
 *         onEdit={session.handleOpenEditDialog}
 *         onDelete={session.handleDelete}
 *         onSetDefault={session.handleSetDefault}
 *       />
 *       <ProfileFormDialog {...session} />
 *       <ConfirmDialog {...session.confirmDialogProps} />
 *     </ProfilesPageLayout>
 *   );
 * }
 * ```
 */
export function useProfilesSession({
  onSuccess,
  onError,
}: UseProfilesSessionOptions = {}): ProfilesSessionState {
  // UI state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ExecutorProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>(getEmptyFormData());
  const [formError, setFormError] = useState<string | null>(null);

  // Confirm dialog
  const { dialogProps, confirm } = useConfirmDialog();

  // Data fetching
  const { data: profiles = [], isLoading } = useExecutorProfiles();
  const createProfile = useCreateExecutorProfile();
  const updateProfile = useUpdateExecutorProfile();
  const deleteProfile = useDeleteExecutorProfile();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      meta: true,
      action: () => handleOpenCreateDialog(),
    },
    {
      key: 'Escape',
      action: () => {
        setIsCreateDialogOpen(false);
        setEditingProfile(null);
      },
    },
  ]);

  // ============================================================================
  // Dialog Actions
  // ============================================================================

  const handleOpenCreateDialog = useCallback(() => {
    setFormData(getEmptyFormData());
    setFormError(null);
    setIsCreateDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
    setEditingProfile(null);
    setFormError(null);
  }, []);

  const handleOpenEditDialog = useCallback((profile: ExecutorProfile) => {
    setFormData(profileToFormData(profile));
    setFormError(null);
    setEditingProfile(profile);
  }, []);

  // ============================================================================
  // Form Actions
  // ============================================================================

  const handleFormChange = useCallback((field: keyof ProfileFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleCreate = useCallback(() => {
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Profile name is required');
      return;
    }

    if (!formData.command.trim()) {
      setFormError('Command is required');
      return;
    }

    const request: CreateExecutorProfileRequest = {
      name: formData.name.trim(),
      command: formData.command.trim(),
      isDefault: formData.isDefault,
      ...(formData.args.trim() && { args: formData.args.trim() }),
      ...(formData.env.trim() && { env: formData.env.trim() }),
      ...(formData.description.trim() && { description: formData.description.trim() }),
    };

    createProfile.mutate(request, {
      onSuccess: (profile) => {
        handleCloseDialog();
        onSuccess?.('Profile created', `"${profile.name}" has been created successfully.`);
      },
      onError: (error) => {
        setFormError(error.message);
        onError?.('Failed to create profile', error.message);
      },
    });
  }, [formData, createProfile, handleCloseDialog, onSuccess, onError]);

  const handleUpdate = useCallback(() => {
    if (!editingProfile) return;
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Profile name is required');
      return;
    }

    if (!formData.command.trim()) {
      setFormError('Command is required');
      return;
    }

    const request: UpdateExecutorProfileRequest = {
      name: formData.name.trim(),
      command: formData.command.trim(),
      isDefault: formData.isDefault,
      ...(formData.args.trim() && { args: formData.args.trim() }),
      ...(formData.env.trim() && { env: formData.env.trim() }),
      ...(formData.description.trim() && { description: formData.description.trim() }),
    };

    updateProfile.mutate(
      { id: editingProfile.id, request },
      {
        onSuccess: () => {
          handleCloseDialog();
          onSuccess?.('Profile updated', `"${formData.name}" has been updated successfully.`);
        },
        onError: (error) => {
          setFormError(error.message);
          onError?.('Failed to update profile', error.message);
        },
      }
    );
  }, [editingProfile, formData, updateProfile, handleCloseDialog, onSuccess, onError]);

  // ============================================================================
  // Profile Actions
  // ============================================================================

  const handleDelete = useCallback(
    (profile: ExecutorProfile) => {
      confirm({
        title: 'Delete Executor Profile',
        description: `Are you sure you want to delete "${profile.name}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: async () => {
          await deleteProfile.mutateAsync(profile.id);
          onSuccess?.('Profile deleted', `"${profile.name}" has been deleted.`);
        },
      });
    },
    [confirm, deleteProfile, onSuccess]
  );

  const handleSetDefault = useCallback(
    (profile: ExecutorProfile) => {
      if (profile.isDefault) return;

      updateProfile.mutate(
        {
          id: profile.id,
          request: { isDefault: true },
        },
        {
          onSuccess: () => {
            onSuccess?.('Default profile updated', `"${profile.name}" is now the default profile.`);
          },
          onError: (error) => {
            onError?.('Failed to update default', error.message);
          },
        }
      );
    },
    [updateProfile, onSuccess, onError]
  );

  return {
    // Data
    profiles,
    isLoading,

    // Dialog state
    isCreateDialogOpen,
    editingProfile,
    formData,
    formError,

    // Pending states
    isCreating: createProfile.isPending,
    isUpdating: updateProfile.isPending,
    isDeleting: deleteProfile.isPending,

    // Confirm dialog
    confirmDialogProps: dialogProps,

    // Dialog actions
    handleOpenCreateDialog,
    handleCloseDialog,
    handleOpenEditDialog,

    // Form actions
    handleFormChange,
    handleCreate,
    handleUpdate,

    // Profile actions
    handleDelete,
    handleSetDefault,
  };
}
