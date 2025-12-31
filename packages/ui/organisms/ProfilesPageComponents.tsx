/**
 * ProfilesPageComponents - Stateless UI components for the Executor Profiles Settings page
 *
 * These components are pure functions of their props, receiving data and callbacks
 * from the useProfilesSession hook. They render UI and call callbacks on user interaction.
 */

import type { ExecutorProfile } from '@openflow/generated';
import { Check, Pencil, Plus, Star, Terminal, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Textarea } from '../atoms/Textarea';
import { Card } from '../molecules/Card';
import { Dialog } from '../molecules/Dialog';
import { FormField } from '../molecules/FormField';
import { SkeletonCard } from '../molecules/SkeletonCard';
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';

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

/** Props for ProfilesPageLayout component */
export interface ProfilesPageLayoutProps {
  /** Description text for the page */
  description: string;
  /** Callback for create button click */
  onCreateClick: () => void;
  /** Main content */
  children: ReactNode;
}

/** Props for ProfilesLoadingSkeleton component */
export interface ProfilesLoadingSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
}

/** Props for ProfilesEmptyState component */
export interface ProfilesEmptyStateProps {
  /** Callback for create button click */
  onCreateClick: () => void;
}

/** Props for ProfilesList component */
export interface ProfilesListProps {
  /** Profiles to display */
  profiles: ExecutorProfile[];
  /** Callback when edit is clicked */
  onEdit: (profile: ExecutorProfile) => void;
  /** Callback when delete is clicked */
  onDelete: (profile: ExecutorProfile) => void;
  /** Callback when set default is clicked */
  onSetDefault: (profile: ExecutorProfile) => void;
}

/** Props for ProfileCard component */
export interface ProfileCardProps {
  /** Profile data */
  profile: ExecutorProfile;
  /** Callback when edit is clicked */
  onEdit: () => void;
  /** Callback when delete is clicked */
  onDelete: () => void;
  /** Callback when set default is clicked */
  onSetDefault: () => void;
}

/** Props for ProfileFormDialog component */
export interface ProfileFormDialogProps {
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

/** Props for ProfilesConfirmDialog component */
export interface ProfilesConfirmDialogProps extends ConfirmDialogProps {}

// ============================================================================
// Layout Components
// ============================================================================

/**
 * ProfilesPageLayout - Main layout for the profiles settings page
 */
export function ProfilesPageLayout({
  description,
  onCreateClick,
  children,
}: ProfilesPageLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">{description}</p>
        <Button variant="primary" onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          New Profile
        </Button>
      </div>

      {children}
    </div>
  );
}

// ============================================================================
// State Components
// ============================================================================

/**
 * ProfilesLoadingSkeleton - Loading state for profiles list
 */
export function ProfilesLoadingSkeleton({ count = 4 }: ProfilesLoadingSkeletonProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={`skeleton-profile-${i}`} showActions />
      ))}
    </div>
  );
}

/**
 * ProfilesEmptyState - Empty state when no profiles exist
 */
export function ProfilesEmptyState({ onCreateClick }: ProfilesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgb(var(--border))] py-12">
      <Terminal className="mb-4 h-12 w-12 text-[rgb(var(--muted-foreground))]" />
      <h3 className="text-lg font-medium text-[rgb(var(--foreground))]">No executor profiles</h3>
      <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
        Create your first profile to start using AI CLI tools.
      </p>
      <Button variant="primary" className="mt-4" onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" />
        Create Profile
      </Button>
    </div>
  );
}

// ============================================================================
// Content Components
// ============================================================================

/**
 * ProfilesList - Grid of profile cards
 */
export function ProfilesList({ profiles, onEdit, onDelete, onSetDefault }: ProfilesListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {profiles.map((profile) => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          onEdit={() => onEdit(profile)}
          onDelete={() => onDelete(profile)}
          onSetDefault={() => onSetDefault(profile)}
        />
      ))}
    </div>
  );
}

/**
 * ProfileCard - Individual profile card with actions
 */
export function ProfileCard({ profile, onEdit, onDelete, onSetDefault }: ProfileCardProps) {
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

// ============================================================================
// Dialog Components
// ============================================================================

/**
 * ProfileFormDialog - Dialog for creating/editing profiles
 */
export function ProfileFormDialog({
  isOpen,
  onClose,
  title,
  formData,
  onFormChange,
  onSubmit,
  isPending,
  error,
  submitLabel,
  loadingText,
}: ProfileFormDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <FormField
          label="Profile Name"
          required
          {...(!formData.name.trim() && error ? { error: 'Required' } : {})}
        >
          <Input
            value={formData.name}
            onChange={(e) => onFormChange('name', e.target.value)}
            placeholder="Claude Code"
            autoFocus
          />
        </FormField>

        <FormField
          label="Command"
          required
          {...(!formData.command.trim() && error ? { error: 'Required' } : {})}
        >
          <Input
            value={formData.command}
            onChange={(e) => onFormChange('command', e.target.value)}
            placeholder="claude"
          />
        </FormField>

        <FormField label="Arguments (JSON array)">
          <Input
            value={formData.args}
            onChange={(e) => onFormChange('args', e.target.value)}
            placeholder='["--dangerously-skip-permissions"]'
          />
        </FormField>

        <FormField label="Environment Variables (JSON object)">
          <Input
            value={formData.env}
            onChange={(e) => onFormChange('env', e.target.value)}
            placeholder='{"ANTHROPIC_API_KEY": "sk-..."}'
          />
        </FormField>

        <FormField label="Description">
          <Textarea
            value={formData.description}
            onChange={(e) => onFormChange('description', e.target.value)}
            placeholder="Describe what this profile is used for..."
            rows={3}
          />
        </FormField>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isDefault}
            onChange={(e) => onFormChange('isDefault', e.target.checked)}
            className="h-4 w-4 rounded border-[rgb(var(--border))] bg-[rgb(var(--background))] text-[rgb(var(--primary))] focus:ring-[rgb(var(--primary))]"
          />
          <span className="text-sm text-[rgb(var(--foreground))]">Set as default profile</span>
        </label>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onSubmit}
            loading={isPending}
            loadingText={loadingText}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * ProfilesConfirmDialog - Confirm dialog for delete action
 */
export function ProfilesConfirmDialog(props: ProfilesConfirmDialogProps) {
  return <ConfirmDialog {...props} />;
}

// ============================================================================
// Profiles Content (handles empty vs list state)
// ============================================================================

/** Props for ProfilesContent component */
export interface ProfilesContentProps {
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

/**
 * ProfilesContent - Handles empty vs list state switching
 */
export function ProfilesContent({
  profiles,
  onCreateClick,
  onEdit,
  onDelete,
  onSetDefault,
}: ProfilesContentProps) {
  if (profiles.length === 0) {
    return <ProfilesEmptyState onCreateClick={onCreateClick} />;
  }

  return (
    <ProfilesList
      profiles={profiles}
      onEdit={onEdit}
      onDelete={onDelete}
      onSetDefault={onSetDefault}
    />
  );
}
