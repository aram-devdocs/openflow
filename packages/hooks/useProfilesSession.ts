/**
 * useProfilesSession - Hook for managing Executor Profiles Settings page state
 *
 * This hook encapsulates all the state management, data fetching, and
 * callbacks for the Executor Profiles Settings page, keeping the route component pure.
 *
 * Features:
 * - Full logging at DEBUG/INFO/WARN/ERROR levels
 * - Toast notifications for user feedback on all CRUD actions
 * - Proper error handling with try/catch patterns
 * - Form validation with error state management
 */

import type {
  CreateExecutorProfileRequest,
  ExecutorProfile,
  UpdateExecutorProfileRequest,
} from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { useCallback, useRef, useState } from 'react';

import { useConfirmDialog } from './useConfirmDialog';
import {
  useCreateExecutorProfile,
  useDeleteExecutorProfile,
  useExecutorProfiles,
  useUpdateExecutorProfile,
} from './useExecutorProfiles';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useToast } from './useToast';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useProfilesSession');

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
  /**
   * Callback for showing success messages
   * @deprecated Use built-in toast notifications instead. This prop is maintained for backward compatibility.
   */
  onSuccess?: (title: string, message: string) => void;
  /**
   * Callback for showing error messages
   * @deprecated Use built-in toast notifications instead. This prop is maintained for backward compatibility.
   */
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
  // Track initialization for logging
  const isInitializedRef = useRef(false);
  if (!isInitializedRef.current) {
    logger.debug('Initializing useProfilesSession hook');
    isInitializedRef.current = true;
  }

  // Toast integration for user feedback
  const toast = useToast();

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
      action: () => {
        logger.info('Keyboard shortcut activated: Cmd+N (new profile)');
        handleOpenCreateDialog();
      },
    },
    {
      key: 'Escape',
      action: () => {
        logger.debug('Keyboard shortcut activated: Escape (close dialog)');
        setIsCreateDialogOpen(false);
        setEditingProfile(null);
      },
    },
  ]);

  // ============================================================================
  // Dialog Actions
  // ============================================================================

  const handleOpenCreateDialog = useCallback(() => {
    logger.debug('Opening create profile dialog');
    setFormData(getEmptyFormData());
    setFormError(null);
    setIsCreateDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    logger.debug('Closing dialog', {
      wasCreating: isCreateDialogOpen,
      wasEditing: editingProfile?.name ?? null,
    });
    setIsCreateDialogOpen(false);
    setEditingProfile(null);
    setFormError(null);
  }, [isCreateDialogOpen, editingProfile]);

  const handleOpenEditDialog = useCallback((profile: ExecutorProfile) => {
    logger.debug('Opening edit dialog for profile', {
      profileId: profile.id,
      profileName: profile.name,
    });
    setFormData(profileToFormData(profile));
    setFormError(null);
    setEditingProfile(profile);
  }, []);

  // ============================================================================
  // Form Actions
  // ============================================================================

  const handleFormChange = useCallback((field: keyof ProfileFormData, value: string | boolean) => {
    logger.debug('Form field changed', {
      field,
      value: typeof value === 'boolean' ? value : '[string]',
    });
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleCreate = useCallback(() => {
    logger.debug('Create profile triggered', { name: formData.name });
    setFormError(null);

    // Validation
    if (!formData.name.trim()) {
      const errorMsg = 'Profile name is required';
      logger.warn('Create profile validation failed: missing name');
      setFormError(errorMsg);
      return;
    }

    if (!formData.command.trim()) {
      const errorMsg = 'Command is required';
      logger.warn('Create profile validation failed: missing command');
      setFormError(errorMsg);
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

    logger.debug('Creating profile', {
      name: request.name,
      command: request.command,
      isDefault: request.isDefault,
    });

    createProfile.mutate(request, {
      onSuccess: (profile) => {
        logger.info('Profile created successfully', {
          profileId: profile.id,
          profileName: profile.name,
        });
        handleCloseDialog();
        toast.success('Profile created', `"${profile.name}" has been created successfully.`);
        // Backward compatibility
        onSuccess?.('Profile created', `"${profile.name}" has been created successfully.`);
      },
      onError: (error) => {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('Failed to create profile', { name: request.name, error: errorMsg });
        setFormError(errorMsg);
        toast.error('Failed to create profile', errorMsg);
        // Backward compatibility
        onError?.('Failed to create profile', errorMsg);
      },
    });
  }, [formData, createProfile, handleCloseDialog, toast, onSuccess, onError]);

  const handleUpdate = useCallback(() => {
    if (!editingProfile) {
      logger.warn('handleUpdate called without editingProfile');
      return;
    }

    logger.debug('Update profile triggered', { profileId: editingProfile.id, name: formData.name });
    setFormError(null);

    // Validation
    if (!formData.name.trim()) {
      const errorMsg = 'Profile name is required';
      logger.warn('Update profile validation failed: missing name', {
        profileId: editingProfile.id,
      });
      setFormError(errorMsg);
      return;
    }

    if (!formData.command.trim()) {
      const errorMsg = 'Command is required';
      logger.warn('Update profile validation failed: missing command', {
        profileId: editingProfile.id,
      });
      setFormError(errorMsg);
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

    logger.debug('Updating profile', { profileId: editingProfile.id, changes: request });

    updateProfile.mutate(
      { id: editingProfile.id, request, name: editingProfile.name },
      {
        onSuccess: () => {
          logger.info('Profile updated successfully', {
            profileId: editingProfile.id,
            profileName: formData.name,
          });
          handleCloseDialog();
          toast.success('Profile updated', `"${formData.name}" has been updated successfully.`);
          // Backward compatibility
          onSuccess?.('Profile updated', `"${formData.name}" has been updated successfully.`);
        },
        onError: (error) => {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.error('Failed to update profile', {
            profileId: editingProfile.id,
            error: errorMsg,
          });
          setFormError(errorMsg);
          toast.error('Failed to update profile', errorMsg);
          // Backward compatibility
          onError?.('Failed to update profile', errorMsg);
        },
      }
    );
  }, [editingProfile, formData, updateProfile, handleCloseDialog, toast, onSuccess, onError]);

  // ============================================================================
  // Profile Actions
  // ============================================================================

  const handleDelete = useCallback(
    (profile: ExecutorProfile) => {
      logger.debug('Delete profile requested', {
        profileId: profile.id,
        profileName: profile.name,
      });

      confirm({
        title: 'Delete Executor Profile',
        description: `Are you sure you want to delete "${profile.name}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: async () => {
          try {
            logger.debug('Deleting profile', { profileId: profile.id, profileName: profile.name });
            await deleteProfile.mutateAsync({ id: profile.id, name: profile.name });
            logger.info('Profile deleted successfully', {
              profileId: profile.id,
              profileName: profile.name,
            });
            toast.success('Profile deleted', `"${profile.name}" has been deleted.`);
            // Backward compatibility
            onSuccess?.('Profile deleted', `"${profile.name}" has been deleted.`);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.error('Failed to delete profile', {
              profileId: profile.id,
              profileName: profile.name,
              error: errorMsg,
            });
            toast.error('Failed to delete profile', errorMsg);
            // Backward compatibility
            onError?.('Failed to delete profile', errorMsg);
            // Re-throw so confirm dialog can handle the error state
            throw error;
          }
        },
      });
    },
    [confirm, deleteProfile, toast, onSuccess, onError]
  );

  const handleSetDefault = useCallback(
    (profile: ExecutorProfile) => {
      if (profile.isDefault) {
        logger.debug('Profile is already default, skipping', {
          profileId: profile.id,
          profileName: profile.name,
        });
        return;
      }

      logger.debug('Setting profile as default', {
        profileId: profile.id,
        profileName: profile.name,
      });

      updateProfile.mutate(
        {
          id: profile.id,
          request: { isDefault: true },
          name: profile.name,
        },
        {
          onSuccess: () => {
            logger.info('Default profile updated', {
              profileId: profile.id,
              profileName: profile.name,
            });
            toast.success(
              'Default profile updated',
              `"${profile.name}" is now the default profile.`
            );
            // Backward compatibility
            onSuccess?.('Default profile updated', `"${profile.name}" is now the default profile.`);
          },
          onError: (error) => {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.error('Failed to set default profile', {
              profileId: profile.id,
              profileName: profile.name,
              error: errorMsg,
            });
            toast.error('Failed to update default', errorMsg);
            // Backward compatibility
            onError?.('Failed to update default', errorMsg);
          },
        }
      );
    },
    [updateProfile, toast, onSuccess, onError]
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
