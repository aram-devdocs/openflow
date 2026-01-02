import type { ExecutorProfile } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  DEFAULT_CREATE_LABEL,
  DEFAULT_DELETE_LABEL,
  DEFAULT_EDIT_LABEL,
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_TITLE,
  DEFAULT_LIST_LABEL,
  DEFAULT_PAGE_LABEL,
  DEFAULT_RETRY_LABEL,
  DEFAULT_SET_DEFAULT_LABEL,
  // Constants
  DEFAULT_SKELETON_COUNT,
  PROFILES_SIZE_CLASSES,
  PROFILE_ACTION_BUTTON_CLASSES,
  ProfileCard,
  type ProfileFormData,
  ProfileFormDialog,
  ProfilesConfirmDialog,
  ProfilesContent,
  ProfilesEmptyState,
  ProfilesErrorState,
  ProfilesList,
  ProfilesLoadingSkeleton,
  ProfilesPageLayout,
  SR_DEFAULT_BADGE,
  SR_EMPTY,
  SR_LOADING,
  SR_PROFILES_LOADED,
  SR_PROFILE_PREFIX,
  buildProfileAccessibleLabel,
  buildProfilesCountAnnouncement,
  // Utility functions
  getBaseSize,
} from './ProfilesPageComponents';

const meta: Meta = {
  title: 'Organisms/ProfilesPageComponents',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-[400px] bg-[rgb(var(--background))] p-4">
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
  description: 'Default Claude Code profile for AI-assisted development',
  isDefault: true,
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-10T10:00:00Z',
};

const mockProfileSecondary: ExecutorProfile = {
  id: 'profile-2',
  name: 'Gemini CLI',
  command: 'gemini',
  description: 'Google Gemini CLI for code generation',
  isDefault: false,
  createdAt: '2024-01-11T10:00:00Z',
  updatedAt: '2024-01-11T10:00:00Z',
};

const mockProfileTertiary: ExecutorProfile = {
  id: 'profile-3',
  name: 'Codex CLI',
  command: 'codex',
  args: '["--model", "code-davinci-002"]',
  description: 'OpenAI Codex CLI',
  isDefault: false,
  createdAt: '2024-01-12T10:00:00Z',
  updatedAt: '2024-01-12T10:00:00Z',
};

const mockProfiles: ExecutorProfile[] = [mockProfile, mockProfileSecondary, mockProfileTertiary];

const mockFormData: ProfileFormData = {
  name: 'Claude Code',
  command: 'claude',
  args: '["--dangerously-skip-permissions"]',
  env: '',
  description: 'Default Claude Code profile',
  isDefault: true,
};

const emptyFormData: ProfileFormData = {
  name: '',
  command: '',
  args: '',
  env: '',
  description: '',
  isDefault: false,
};

// ============================================================================
// ProfilesPageLayout Stories
// ============================================================================

export const Layout: StoryObj<typeof ProfilesPageLayout> = {
  render: () => (
    <ProfilesPageLayout
      description="Configure CLI tools for AI code execution"
      onCreateClick={() => console.log('Create clicked')}
      data-testid="profiles-layout"
    >
      <div className="rounded-lg border border-dashed border-[rgb(var(--border))] p-8 text-center text-[rgb(var(--muted-foreground))]">
        Content area
      </div>
    </ProfilesPageLayout>
  ),
};

export const LayoutSizeSmall: StoryObj<typeof ProfilesPageLayout> = {
  render: () => (
    <ProfilesPageLayout
      description="Configure CLI tools"
      onCreateClick={() => console.log('Create clicked')}
      size="sm"
      data-testid="profiles-layout-sm"
    >
      <div className="rounded-lg border border-dashed p-4 text-center text-sm">Small layout</div>
    </ProfilesPageLayout>
  ),
};

export const LayoutSizeLarge: StoryObj<typeof ProfilesPageLayout> = {
  render: () => (
    <ProfilesPageLayout
      description="Configure AI CLI tools for your development workflow"
      onCreateClick={() => console.log('Create clicked')}
      size="lg"
      data-testid="profiles-layout-lg"
    >
      <div className="rounded-lg border border-dashed p-12 text-center text-lg">Large layout</div>
    </ProfilesPageLayout>
  ),
};

export const LayoutResponsive: StoryObj<typeof ProfilesPageLayout> = {
  render: () => (
    <ProfilesPageLayout
      description="Configure CLI tools for AI code execution"
      onCreateClick={() => console.log('Create clicked')}
      size={{ base: 'sm', md: 'md', lg: 'lg' }}
      data-testid="profiles-layout-responsive"
    >
      <div className="rounded-lg border border-dashed p-8 text-center">
        Responsive layout (sm → md → lg)
      </div>
    </ProfilesPageLayout>
  ),
};

// ============================================================================
// ProfilesLoadingSkeleton Stories
// ============================================================================

export const Loading: StoryObj<typeof ProfilesLoadingSkeleton> = {
  render: () => <ProfilesLoadingSkeleton count={4} data-testid="profiles-loading" />,
};

export const LoadingTwoItems: StoryObj<typeof ProfilesLoadingSkeleton> = {
  render: () => <ProfilesLoadingSkeleton count={2} />,
};

export const LoadingSizeSmall: StoryObj<typeof ProfilesLoadingSkeleton> = {
  render: () => <ProfilesLoadingSkeleton count={4} size="sm" />,
};

export const LoadingSizeLarge: StoryObj<typeof ProfilesLoadingSkeleton> = {
  render: () => <ProfilesLoadingSkeleton count={4} size="lg" />,
};

export const LoadingResponsive: StoryObj<typeof ProfilesLoadingSkeleton> = {
  render: () => <ProfilesLoadingSkeleton count={4} size={{ base: 'sm', md: 'md', lg: 'lg' }} />,
};

// ============================================================================
// ProfilesEmptyState Stories
// ============================================================================

export const EmptyState: StoryObj<typeof ProfilesEmptyState> = {
  render: () => (
    <ProfilesEmptyState
      onCreateClick={() => console.log('Create clicked')}
      data-testid="profiles-empty"
    />
  ),
};

export const EmptyStateSizeSmall: StoryObj<typeof ProfilesEmptyState> = {
  render: () => <ProfilesEmptyState onCreateClick={() => console.log('Create')} size="sm" />,
};

export const EmptyStateSizeLarge: StoryObj<typeof ProfilesEmptyState> = {
  render: () => <ProfilesEmptyState onCreateClick={() => console.log('Create')} size="lg" />,
};

// ============================================================================
// ProfilesErrorState Stories
// ============================================================================

export const ErrorState: StoryObj<typeof ProfilesErrorState> = {
  render: () => (
    <ProfilesErrorState
      error="Failed to load profiles. Please check your network connection."
      onRetry={() => console.log('Retry clicked')}
      data-testid="profiles-error"
    />
  ),
};

export const ErrorStateNoRetry: StoryObj<typeof ProfilesErrorState> = {
  render: () => (
    <ProfilesErrorState
      error="Permission denied. Contact your administrator."
      data-testid="profiles-error-no-retry"
    />
  ),
};

export const ErrorStateSizeSmall: StoryObj<typeof ProfilesErrorState> = {
  render: () => (
    <ProfilesErrorState error="Connection timeout" onRetry={() => console.log('Retry')} size="sm" />
  ),
};

// ============================================================================
// ProfileCard Stories
// ============================================================================

export const Card: StoryObj<typeof ProfileCard> = {
  render: () => (
    <div className="w-80">
      <ul className="space-y-4">
        <ProfileCard
          profile={mockProfile}
          onEdit={() => console.log('Edit')}
          onDelete={() => console.log('Delete')}
          onSetDefault={() => console.log('Set default')}
          data-testid="profile-card"
        />
      </ul>
    </div>
  ),
};

export const CardNotDefault: StoryObj<typeof ProfileCard> = {
  render: () => (
    <div className="w-80">
      <ul className="space-y-4">
        <ProfileCard
          profile={mockProfileSecondary}
          onEdit={() => console.log('Edit')}
          onDelete={() => console.log('Delete')}
          onSetDefault={() => console.log('Set default')}
          data-testid="profile-card-not-default"
        />
      </ul>
    </div>
  ),
};

export const CardNoDescription: StoryObj<typeof ProfileCard> = {
  render: () => (
    <div className="w-80">
      <ul className="space-y-4">
        <ProfileCard
          profile={{ ...mockProfileSecondary, description: undefined }}
          onEdit={() => console.log('Edit')}
          onDelete={() => console.log('Delete')}
          onSetDefault={() => console.log('Set default')}
        />
      </ul>
    </div>
  ),
};

export const CardSizeSmall: StoryObj<typeof ProfileCard> = {
  render: () => (
    <div className="w-72">
      <ul className="space-y-4">
        <ProfileCard
          profile={mockProfile}
          onEdit={() => console.log('Edit')}
          onDelete={() => console.log('Delete')}
          onSetDefault={() => console.log('Set default')}
          size="sm"
        />
      </ul>
    </div>
  ),
};

export const CardSizeLarge: StoryObj<typeof ProfileCard> = {
  render: () => (
    <div className="w-96">
      <ul className="space-y-4">
        <ProfileCard
          profile={mockProfile}
          onEdit={() => console.log('Edit')}
          onDelete={() => console.log('Delete')}
          onSetDefault={() => console.log('Set default')}
          size="lg"
        />
      </ul>
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
      data-testid="profiles-list"
    />
  ),
};

export const ListSingleProfile: StoryObj<typeof ProfilesList> = {
  render: () => (
    <ProfilesList
      profiles={[mockProfile]}
      onEdit={(profile) => console.log('Edit:', profile.name)}
      onDelete={(profile) => console.log('Delete:', profile.name)}
      onSetDefault={(profile) => console.log('Set default:', profile.name)}
    />
  ),
};

export const ListManyProfiles: StoryObj<typeof ProfilesList> = {
  render: () => (
    <ProfilesList
      profiles={[
        ...mockProfiles,
        { ...mockProfile, id: 'profile-4', name: 'GPT-4 CLI', isDefault: false },
        { ...mockProfile, id: 'profile-5', name: 'Copilot CLI', isDefault: false },
        { ...mockProfile, id: 'profile-6', name: 'Tabnine CLI', isDefault: false },
      ]}
      onEdit={(profile) => console.log('Edit:', profile.name)}
      onDelete={(profile) => console.log('Delete:', profile.name)}
      onSetDefault={(profile) => console.log('Set default:', profile.name)}
    />
  ),
};

export const ListSizeSmall: StoryObj<typeof ProfilesList> = {
  render: () => (
    <ProfilesList
      profiles={mockProfiles}
      onEdit={(profile) => console.log('Edit:', profile.name)}
      onDelete={(profile) => console.log('Delete:', profile.name)}
      onSetDefault={(profile) => console.log('Set default:', profile.name)}
      size="sm"
    />
  ),
};

export const ListSizeLarge: StoryObj<typeof ProfilesList> = {
  render: () => (
    <ProfilesList
      profiles={mockProfiles}
      onEdit={(profile) => console.log('Edit:', profile.name)}
      onDelete={(profile) => console.log('Delete:', profile.name)}
      onSetDefault={(profile) => console.log('Set default:', profile.name)}
      size="lg"
    />
  ),
};

export const ListResponsive: StoryObj<typeof ProfilesList> = {
  render: () => (
    <ProfilesList
      profiles={mockProfiles}
      onEdit={(profile) => console.log('Edit:', profile.name)}
      onDelete={(profile) => console.log('Delete:', profile.name)}
      onSetDefault={(profile) => console.log('Set default:', profile.name)}
      size={{ base: 'sm', md: 'md', lg: 'lg' }}
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
      formData={emptyFormData}
      onFormChange={(field, value) => console.log('Change:', field, value)}
      onSubmit={() => console.log('Submit')}
      isPending={false}
      error={null}
      submitLabel="Create Profile"
      loadingText="Creating..."
      data-testid="profile-form-create"
    />
  ),
};

export const FormDialogEdit: StoryObj<typeof ProfileFormDialog> = {
  render: () => (
    <ProfileFormDialog
      isOpen={true}
      onClose={() => console.log('Close')}
      title="Edit Profile"
      formData={mockFormData}
      onFormChange={(field, value) => console.log('Change:', field, value)}
      onSubmit={() => console.log('Submit')}
      isPending={false}
      error={null}
      submitLabel="Save Changes"
      loadingText="Saving..."
      data-testid="profile-form-edit"
    />
  ),
};

export const FormDialogWithError: StoryObj<typeof ProfileFormDialog> = {
  render: () => (
    <ProfileFormDialog
      isOpen={true}
      onClose={() => console.log('Close')}
      title="Create Profile"
      formData={{ ...emptyFormData }}
      onFormChange={(field, value) => console.log('Change:', field, value)}
      onSubmit={() => console.log('Submit')}
      isPending={false}
      error="Name and command are required"
      submitLabel="Create Profile"
      loadingText="Creating..."
    />
  ),
};

export const FormDialogPending: StoryObj<typeof ProfileFormDialog> = {
  render: () => (
    <ProfileFormDialog
      isOpen={true}
      onClose={() => console.log('Close')}
      title="Create Profile"
      formData={mockFormData}
      onFormChange={(field, value) => console.log('Change:', field, value)}
      onSubmit={() => console.log('Submit')}
      isPending={true}
      error={null}
      submitLabel="Create Profile"
      loadingText="Creating..."
    />
  ),
};

export const FormDialogInteractive: StoryObj<typeof ProfileFormDialog> = {
  render: function InteractiveFormDialog() {
    const [formData, setFormData] = useState<ProfileFormData>(emptyFormData);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFormChange = (field: keyof ProfileFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setError(null);
    };

    const handleSubmit = () => {
      if (!formData.name.trim() || !formData.command.trim()) {
        setError('Name and command are required');
        return;
      }
      setIsPending(true);
      setTimeout(() => {
        setIsPending(false);
        console.log('Submitted:', formData);
      }, 2000);
    };

    return (
      <ProfileFormDialog
        isOpen={true}
        onClose={() => console.log('Close')}
        title="Create Profile"
        formData={formData}
        onFormChange={handleFormChange}
        onSubmit={handleSubmit}
        isPending={isPending}
        error={error}
        submitLabel="Create Profile"
        loadingText="Creating..."
      />
    );
  },
};

// ============================================================================
// ProfilesConfirmDialog Stories
// ============================================================================

export const ConfirmDialogDelete: StoryObj<typeof ProfilesConfirmDialog> = {
  render: () => (
    <ProfilesConfirmDialog
      isOpen={true}
      onClose={() => console.log('Close')}
      onConfirm={() => console.log('Confirm delete')}
      title="Delete Profile"
      description="Are you sure you want to delete this profile? This action cannot be undone."
      variant="destructive"
      confirmLabel="Delete"
      data-testid="profiles-confirm-delete"
    />
  ),
};

export const ConfirmDialogSetDefault: StoryObj<typeof ProfilesConfirmDialog> = {
  render: () => (
    <ProfilesConfirmDialog
      isOpen={true}
      onClose={() => console.log('Close')}
      onConfirm={() => console.log('Confirm set default')}
      title="Set as Default"
      description="This will make this profile the default for all new chats."
      variant="default"
      confirmLabel="Set Default"
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
      data-testid="profiles-content"
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
      data-testid="profiles-content-empty"
    />
  ),
};

export const ContentLoading: StoryObj<typeof ProfilesContent> = {
  render: () => (
    <ProfilesContent
      profiles={[]}
      isLoading={true}
      onCreateClick={() => console.log('Create')}
      onEdit={() => {}}
      onDelete={() => {}}
      onSetDefault={() => {}}
      data-testid="profiles-content-loading"
    />
  ),
};

export const ContentError: StoryObj<typeof ProfilesContent> = {
  render: () => (
    <ProfilesContent
      profiles={[]}
      error="Failed to load profiles"
      onRetry={() => console.log('Retry')}
      onCreateClick={() => console.log('Create')}
      onEdit={() => {}}
      onDelete={() => {}}
      onSetDefault={() => {}}
      data-testid="profiles-content-error"
    />
  ),
};

export const ContentResponsive: StoryObj<typeof ProfilesContent> = {
  render: () => (
    <ProfilesContent
      profiles={mockProfiles}
      onCreateClick={() => console.log('Create')}
      onEdit={(profile) => console.log('Edit:', profile.name)}
      onDelete={(profile) => console.log('Delete:', profile.name)}
      onSetDefault={(profile) => console.log('Set default:', profile.name)}
      size={{ base: 'sm', md: 'md', lg: 'lg' }}
    />
  ),
};

// ============================================================================
// Accessibility Demos
// ============================================================================

export const AccessibilityFocusRing: StoryObj = {
  name: 'Accessibility: Focus Ring',
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Tab through the action buttons to see focus rings with ring-offset
      </p>
      <div className="w-80">
        <ul>
          <ProfileCard
            profile={mockProfileSecondary}
            onEdit={() => console.log('Edit')}
            onDelete={() => console.log('Delete')}
            onSetDefault={() => console.log('Set default')}
          />
        </ul>
      </div>
    </div>
  ),
};

export const AccessibilityTouchTargets: StoryObj = {
  name: 'Accessibility: Touch Targets',
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        On mobile (base size), action buttons have 44px minimum touch targets (WCAG 2.5.5)
      </p>
      <div className="max-w-xs border rounded-lg p-4 bg-[rgb(var(--card))]">
        <p className="text-xs text-[rgb(var(--muted-foreground))] mb-2">
          Action button classes include: min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0
        </p>
        <button
          type="button"
          className={PROFILE_ACTION_BUTTON_CLASSES}
          aria-label="Example touch target"
        >
          Touch
        </button>
      </div>
    </div>
  ),
};

export const AccessibilityScreenReader: StoryObj = {
  name: 'Accessibility: Screen Reader',
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Screen reader announcements via VisuallyHidden and aria-live regions
      </p>
      <ul className="space-y-2 text-sm">
        <li>
          <strong>Loading:</strong> {SR_LOADING}
        </li>
        <li>
          <strong>Loaded:</strong> 3 {SR_PROFILES_LOADED}
        </li>
        <li>
          <strong>Empty:</strong> {SR_EMPTY}
        </li>
        <li>
          <strong>Profile:</strong> {SR_PROFILE_PREFIX} Claude Code (Default)
        </li>
        <li>
          <strong>Default Badge:</strong> {SR_DEFAULT_BADGE}
        </li>
      </ul>
    </div>
  ),
};

export const AccessibilityKeyboardNavigation: StoryObj = {
  name: 'Accessibility: Keyboard Navigation',
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Use Tab to navigate between action buttons. Each button has a descriptive aria-label.
      </p>
      <ProfilesList
        profiles={mockProfiles.slice(0, 2)}
        onEdit={(profile) => console.log('Edit:', profile.name)}
        onDelete={(profile) => console.log('Delete:', profile.name)}
        onSetDefault={(profile) => console.log('Set default:', profile.name)}
      />
    </div>
  ),
};

// ============================================================================
// Real-world Examples
// ============================================================================

export const RealWorldSettingsPage: StoryObj = {
  name: 'Real-world: Settings Page',
  render: function SettingsPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<ExecutorProfile | null>(null);
    const [formData, setFormData] = useState<ProfileFormData>(emptyFormData);

    const handleEdit = (profile: ExecutorProfile) => {
      setFormData({
        name: profile.name,
        command: profile.command,
        args: profile.args || '',
        env: '',
        description: profile.description || '',
        isDefault: profile.isDefault,
      });
      setIsCreateOpen(true);
    };

    const handleDelete = (profile: ExecutorProfile) => {
      setSelectedProfile(profile);
      setIsDeleteOpen(true);
    };

    return (
      <>
        <ProfilesPageLayout
          description="Configure CLI tools for AI code execution"
          onCreateClick={() => {
            setFormData(emptyFormData);
            setIsCreateOpen(true);
          }}
        >
          <ProfilesContent
            profiles={mockProfiles}
            onCreateClick={() => {
              setFormData(emptyFormData);
              setIsCreateOpen(true);
            }}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSetDefault={(profile) => console.log('Set default:', profile.name)}
          />
        </ProfilesPageLayout>

        <ProfileFormDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title={formData.name ? 'Edit Profile' : 'Create Profile'}
          formData={formData}
          onFormChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
          onSubmit={() => {
            console.log('Submit:', formData);
            setIsCreateOpen(false);
          }}
          isPending={false}
          error={null}
          submitLabel={formData.name ? 'Save Changes' : 'Create Profile'}
          loadingText="Saving..."
        />

        <ProfilesConfirmDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={() => {
            console.log('Delete:', selectedProfile?.name);
            setIsDeleteOpen(false);
          }}
          title="Delete Profile"
          description={`Are you sure you want to delete "${selectedProfile?.name}"? This action cannot be undone.`}
          variant="destructive"
          confirmLabel="Delete"
        />
      </>
    );
  },
};

export const RealWorldLoadingTransition: StoryObj = {
  name: 'Real-world: Loading Transition',
  render: function LoadingTransition() {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsLoading(true);
              setHasError(false);
              setTimeout(() => setIsLoading(false), 2000);
            }}
            className="px-3 py-1 rounded bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] text-sm"
          >
            Simulate Load
          </button>
          <button
            onClick={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            className="px-3 py-1 rounded bg-[rgb(var(--destructive))] text-white text-sm"
          >
            Simulate Error
          </button>
        </div>

        <ProfilesContent
          profiles={mockProfiles}
          isLoading={isLoading}
          error={hasError ? 'Failed to fetch profiles' : null}
          onRetry={() => {
            setHasError(false);
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 1000);
          }}
          onCreateClick={() => console.log('Create')}
          onEdit={(profile) => console.log('Edit:', profile.name)}
          onDelete={(profile) => console.log('Delete:', profile.name)}
          onSetDefault={(profile) => console.log('Set default:', profile.name)}
        />
      </div>
    );
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

export const ConstantsReference: StoryObj = {
  name: 'Constants Reference',
  render: () => (
    <div className="space-y-6 text-sm">
      <div>
        <h3 className="font-semibold mb-2">Default Values</h3>
        <ul className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>DEFAULT_SKELETON_COUNT: {DEFAULT_SKELETON_COUNT}</li>
          <li>DEFAULT_PAGE_LABEL: {DEFAULT_PAGE_LABEL}</li>
          <li>DEFAULT_LIST_LABEL: {DEFAULT_LIST_LABEL}</li>
          <li>DEFAULT_CREATE_LABEL: {DEFAULT_CREATE_LABEL}</li>
          <li>DEFAULT_EDIT_LABEL: {DEFAULT_EDIT_LABEL}</li>
          <li>DEFAULT_DELETE_LABEL: {DEFAULT_DELETE_LABEL}</li>
          <li>DEFAULT_SET_DEFAULT_LABEL: {DEFAULT_SET_DEFAULT_LABEL}</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Empty/Error States</h3>
        <ul className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>DEFAULT_EMPTY_TITLE: {DEFAULT_EMPTY_TITLE}</li>
          <li>DEFAULT_EMPTY_DESCRIPTION: {DEFAULT_EMPTY_DESCRIPTION}</li>
          <li>DEFAULT_ERROR_TITLE: {DEFAULT_ERROR_TITLE}</li>
          <li>DEFAULT_RETRY_LABEL: {DEFAULT_RETRY_LABEL}</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Size Classes</h3>
        <ul className="space-y-1 text-[rgb(var(--muted-foreground))]">
          {(Object.entries(PROFILES_SIZE_CLASSES) as [string, string][]).map(([size, classes]) => (
            <li key={size}>
              {size}: {classes}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Utility Functions</h3>
        <ul className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>getBaseSize(undefined): {getBaseSize(undefined)}</li>
          <li>getBaseSize('lg'): {getBaseSize('lg')}</li>
          <li>buildProfilesCountAnnouncement(3): {buildProfilesCountAnnouncement(3)}</li>
          <li>buildProfilesCountAnnouncement(0): {buildProfilesCountAnnouncement(0)}</li>
          <li>
            buildProfileAccessibleLabel (Claude Code): {buildProfileAccessibleLabel(mockProfile)}
          </li>
        </ul>
      </div>
    </div>
  ),
};
