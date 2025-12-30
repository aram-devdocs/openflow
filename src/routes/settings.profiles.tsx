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
 * Follows the orchestration pattern: connects hooks to UI components.
 */

import type {
  CreateExecutorProfileRequest,
  ExecutorProfile,
  UpdateExecutorProfileRequest,
} from '@openflow/generated';
import {
  useConfirmDialog,
  useCreateExecutorProfile,
  useDeleteExecutorProfile,
  useExecutorProfiles,
  useKeyboardShortcuts,
  useUpdateExecutorProfile,
} from '@openflow/hooks';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  FormField,
  Input,
  SkeletonCard,
  Textarea,
} from '@openflow/ui';
import { createFileRoute } from '@tanstack/react-router';
import { Check, Pencil, Plus, Star, Terminal, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

export const Route = createFileRoute('/settings/profiles')({
  component: ExecutorProfilesPage,
});

function ExecutorProfilesPage() {
  // UI state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ExecutorProfile | null>(null);
  const [formData, setFormData] = useState<FormData>(getEmptyFormData());
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

  // Form handlers
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
    setFormData({
      name: profile.name,
      command: profile.command,
      args: profile.args ?? '',
      env: profile.env ?? '',
      description: profile.description ?? '',
      isDefault: profile.isDefault,
    });
    setFormError(null);
    setEditingProfile(profile);
  }, []);

  const handleFormChange = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    },
    []
  );

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
      onSuccess: () => {
        handleCloseDialog();
      },
      onError: (error) => {
        setFormError(error.message);
      },
    });
  }, [formData, createProfile, handleCloseDialog]);

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
        },
        onError: (error) => {
          setFormError(error.message);
        },
      }
    );
  }, [editingProfile, formData, updateProfile, handleCloseDialog]);

  const handleDelete = useCallback(
    (profile: ExecutorProfile) => {
      confirm({
        title: 'Delete Executor Profile',
        description: `Are you sure you want to delete "${profile.name}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: async () => {
          await deleteProfile.mutateAsync(profile.id);
        },
      });
    },
    [confirm, deleteProfile]
  );

  const handleSetDefault = useCallback(
    (profile: ExecutorProfile) => {
      if (profile.isDefault) return;

      updateProfile.mutate({
        id: profile.id,
        request: { isDefault: true },
      });
    },
    [updateProfile]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={`skeleton-profile-${i}`} showActions />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Executor profiles define which AI CLI tools to use for tasks.
        </p>
        <Button variant="primary" onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Profile
        </Button>
      </div>

      {/* Empty state */}
      {profiles.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgb(var(--border))] py-12">
          <Terminal className="mb-4 h-12 w-12 text-[rgb(var(--muted-foreground))]" />
          <h3 className="text-lg font-medium text-[rgb(var(--foreground))]">
            No executor profiles
          </h3>
          <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
            Create your first profile to start using AI CLI tools.
          </p>
          <Button variant="primary" className="mt-4" onClick={handleOpenCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create Profile
          </Button>
        </div>
      )}

      {/* Profiles list */}
      {profiles.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onEdit={() => handleOpenEditDialog(profile)}
              onDelete={() => handleDelete(profile)}
              onSetDefault={() => handleSetDefault(profile)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        isOpen={isCreateDialogOpen || editingProfile !== null}
        onClose={handleCloseDialog}
        title={editingProfile ? 'Edit Executor Profile' : 'Create Executor Profile'}
      >
        <div className="space-y-4">
          <FormField
            label="Profile Name"
            required
            {...(!formData.name.trim() && formError ? { error: 'Required' } : {})}
          >
            <Input
              value={formData.name}
              onChange={handleFormChange('name')}
              placeholder="Claude Code"
              autoFocus
            />
          </FormField>

          <FormField
            label="Command"
            required
            {...(!formData.command.trim() && formError ? { error: 'Required' } : {})}
          >
            <Input
              value={formData.command}
              onChange={handleFormChange('command')}
              placeholder="claude"
            />
          </FormField>

          <FormField label="Arguments (JSON array)">
            <Input
              value={formData.args}
              onChange={handleFormChange('args')}
              placeholder='["--dangerously-skip-permissions"]'
            />
          </FormField>

          <FormField label="Environment Variables (JSON object)">
            <Input
              value={formData.env}
              onChange={handleFormChange('env')}
              placeholder='{"ANTHROPIC_API_KEY": "sk-..."}'
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={formData.description}
              onChange={handleFormChange('description')}
              placeholder="Describe what this profile is used for..."
              rows={3}
            />
          </FormField>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))}
              className="h-4 w-4 rounded border-[rgb(var(--border))] bg-[rgb(var(--background))] text-[rgb(var(--primary))] focus:ring-[rgb(var(--primary))]"
            />
            <span className="text-sm text-[rgb(var(--foreground))]">Set as default profile</span>
          </label>

          {formError && <p className="text-sm text-error">{formError}</p>}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={handleCloseDialog}
              disabled={createProfile.isPending || updateProfile.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={editingProfile ? handleUpdate : handleCreate}
              loading={createProfile.isPending || updateProfile.isPending}
              loadingText={editingProfile ? 'Updating...' : 'Creating...'}
            >
              {editingProfile ? 'Update Profile' : 'Create Profile'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirm delete dialog */}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

// Form data type
interface FormData {
  name: string;
  command: string;
  args: string;
  env: string;
  description: string;
  isDefault: boolean;
}

function getEmptyFormData(): FormData {
  return {
    name: '',
    command: '',
    args: '',
    env: '',
    description: '',
    isDefault: false,
  };
}

// Profile card component
interface ProfileCardProps {
  profile: ExecutorProfile;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

function ProfileCard({ profile, onEdit, onDelete, onSetDefault }: ProfileCardProps) {
  return (
    <Card className="relative">
      <div className="flex items-start justify-between p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[rgb(var(--primary))]" />
            <h3 className="font-medium text-[rgb(var(--foreground))]">{profile.name}</h3>
            {profile.isDefault && (
              <Badge variant="success" className="ml-1">
                <Star className="mr-1 h-3 w-3" />
                Default
              </Badge>
            )}
          </div>

          <code className="mt-1 block text-xs text-[rgb(var(--muted-foreground))]">
            {profile.command}
            {profile.args && ` ${profile.args}`}
          </code>

          {profile.description && (
            <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
              {profile.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {!profile.isDefault && (
            <button
              type="button"
              onClick={onSetDefault}
              className="rounded p-1.5 text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
              title="Set as default"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="rounded p-1.5 text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
            title="Edit profile"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1.5 text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--destructive))]/10 hover:text-[rgb(var(--destructive))]"
            title="Delete profile"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
