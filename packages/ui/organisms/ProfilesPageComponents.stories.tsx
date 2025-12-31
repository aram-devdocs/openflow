import type { ExecutorProfile } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import {
  ProfileCard,
  type ProfileFormData,
  ProfileFormDialog,
  ProfilesContent,
  ProfilesEmptyState,
  ProfilesList,
  ProfilesLoadingSkeleton,
  ProfilesPageLayout,
} from './ProfilesPageComponents';

const meta: Meta = {
  title: 'Organisms/ProfilesPageComponents',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-[400px] bg-[rgb(var(--background))]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

// ============================================================================
// Mock Data
// ============================================================================

const mockProfile: ExecutorProfile = {
  id: 'profile-1',
  name: 'Claude Code',
  command: 'claude',
  args: '["--dangerously-skip-permissions"]',
  description: 'Default Claude Code profile',
  isDefault: true,
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-10T10:00:00Z',
};

const mockProfileSecondary: ExecutorProfile = {
  id: 'profile-2',
  name: 'Gemini CLI',
  command: 'gemini',
  description: 'Google Gemini CLI',
  isDefault: false,
  createdAt: '2024-01-11T10:00:00Z',
  updatedAt: '2024-01-11T10:00:00Z',
};

const mockProfiles: ExecutorProfile[] = [mockProfile, mockProfileSecondary];

const mockFormData: ProfileFormData = {
  name: 'Claude Code',
  command: 'claude',
  args: '["--dangerously-skip-permissions"]',
  env: '',
  description: 'Default Claude Code profile',
  isDefault: true,
};

// ============================================================================
// ProfilesPageLayout Stories
// ============================================================================

export const Layout: StoryObj<typeof ProfilesPageLayout> = {
  render: () => (
    <ProfilesPageLayout
      description="Configure CLI tools for AI code execution"
      onCreateClick={() => console.log('Create')}
    >
      <div className="p-8 text-center text-[rgb(var(--muted-foreground))]">Content area</div>
    </ProfilesPageLayout>
  ),
};

// ============================================================================
// ProfilesLoadingSkeleton Stories
// ============================================================================

export const Loading: StoryObj<typeof ProfilesLoadingSkeleton> = {
  render: () => <ProfilesLoadingSkeleton count={4} />,
};

// ============================================================================
// ProfilesEmptyState Stories
// ============================================================================

export const EmptyState: StoryObj<typeof ProfilesEmptyState> = {
  render: () => <ProfilesEmptyState onCreateClick={() => console.log('Create')} />,
};

// ============================================================================
// ProfileCard Stories
// ============================================================================

export const Card: StoryObj<typeof ProfileCard> = {
  render: () => (
    <div className="w-80">
      <ProfileCard
        profile={mockProfile}
        onEdit={() => console.log('Edit')}
        onDelete={() => console.log('Delete')}
        onSetDefault={() => console.log('Set default')}
      />
    </div>
  ),
};

export const CardNotDefault: StoryObj<typeof ProfileCard> = {
  render: () => (
    <div className="w-80">
      <ProfileCard
        profile={mockProfileSecondary}
        onEdit={() => console.log('Edit')}
        onDelete={() => console.log('Delete')}
        onSetDefault={() => console.log('Set default')}
      />
    </div>
  ),
};

// ============================================================================
// ProfilesList Stories
// ============================================================================

export const List: StoryObj<typeof ProfilesList> = {
  render: () => (
    <ProfilesList
      profiles={mockProfiles}
      onEdit={(profile) => console.log('Edit:', profile.name)}
      onDelete={(profile) => console.log('Delete:', profile.name)}
      onSetDefault={(profile) => console.log('Set default:', profile.name)}
    />
  ),
};

// ============================================================================
// ProfileFormDialog Stories
// ============================================================================

export const FormDialogCreate: StoryObj<typeof ProfileFormDialog> = {
  render: () => (
    <ProfileFormDialog
      isOpen={true}
      onClose={() => console.log('Close')}
      title="Create Profile"
      formData={mockFormData}
      onFormChange={(field, value) => console.log('Change:', field, value)}
      onSubmit={() => console.log('Submit')}
      isPending={false}
      error={null}
      submitLabel="Create Profile"
      loadingText="Creating..."
    />
  ),
};

export const FormDialogWithError: StoryObj<typeof ProfileFormDialog> = {
  render: () => (
    <ProfileFormDialog
      isOpen={true}
      onClose={() => console.log('Close')}
      title="Create Profile"
      formData={{ ...mockFormData, name: '' }}
      onFormChange={(field, value) => console.log('Change:', field, value)}
      onSubmit={() => console.log('Submit')}
      isPending={false}
      error="Name is required"
      submitLabel="Create Profile"
      loadingText="Creating..."
    />
  ),
};

// ============================================================================
// ProfilesContent Stories
// ============================================================================

export const ContentWithProfiles: StoryObj<typeof ProfilesContent> = {
  render: () => (
    <ProfilesContent
      profiles={mockProfiles}
      onCreateClick={() => console.log('Create')}
      onEdit={(profile) => console.log('Edit:', profile.name)}
      onDelete={(profile) => console.log('Delete:', profile.name)}
      onSetDefault={(profile) => console.log('Set default:', profile.name)}
    />
  ),
};

export const ContentEmpty: StoryObj<typeof ProfilesContent> = {
  render: () => (
    <ProfilesContent
      profiles={[]}
      onCreateClick={() => console.log('Create')}
      onEdit={() => {}}
      onDelete={() => {}}
      onSetDefault={() => {}}
    />
  ),
};
