/**
 * Storybook stories for ProfilesSettingsPage
 *
 * Demonstrates the executor profiles settings page in various states:
 * - Default with profiles
 * - Loading state (skeleton)
 * - Empty state
 * - Error state with retry
 * - With create dialog open
 * - With edit dialog open
 * - With delete confirmation
 * - Accessibility demos (screen reader, keyboard, focus ring)
 * - Responsive sizing (sm, md, lg)
 */

import type { ExecutorProfile } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import type { ProfileFormData } from '../organisms/ProfilesPageComponents';
import {
  DEFAULT_ERROR_TITLE,
  DEFAULT_PAGE_LABEL,
  DEFAULT_PAGE_SIZE,
  DEFAULT_RETRY_LABEL,
  // Constants
  DEFAULT_SKELETON_COUNT,
  PAGE_SIZE_GAP,
  PAGE_SIZE_PADDING,
  ProfilesSettingsPage,
  ProfilesSettingsPageError,
  type ProfilesSettingsPageProps,
  ProfilesSettingsPageSkeleton,
  SR_EMPTY,
  SR_ERROR_PREFIX,
  SR_LOADED_PREFIX,
  SR_LOADING,
  buildLoadedAnnouncement,
  buildPageAccessibleLabel,
  // Utility functions
  getBaseSize,
} from './ProfilesSettingsPage';

const meta: Meta<typeof ProfilesSettingsPage> = {
  title: 'Pages/ProfilesSettingsPage',
  component: ProfilesSettingsPage,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-3xl mx-auto p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProfilesSettingsPage>;

// ============================================================================
// Mock Data
// ============================================================================

const mockProfiles: ExecutorProfile[] = [
  {
    id: 'profile-1',
    name: 'Claude Code',
    description: 'Default Claude Code executor with all permissions',
    command: 'claude',
    args: '["--dangerously-skip-permissions"]',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'profile-2',
    name: 'Gemini CLI',
    description: 'Google Gemini CLI executor',
    command: 'gemini',
    isDefault: false,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'profile-3',
    name: 'Codex CLI',
    description: 'OpenAI Codex CLI for code generation',
    command: 'codex',
    args: '["--model", "gpt-4"]',
    isDefault: false,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

const emptyFormData: ProfileFormData = {
  name: '',
  command: '',
  args: '',
  env: '',
  description: '',
  isDefault: false,
};

const filledFormData: ProfileFormData = {
  name: 'Custom Executor',
  command: 'my-executor',
  args: '["--verbose"]',
  env: '{"DEBUG": "true"}',
  description: 'A custom AI executor for specialized tasks',
  isDefault: false,
};

// ============================================================================
// Helper functions
// ============================================================================

const noop = () => {};
const noopProfile = (_p: ExecutorProfile) => {};
const noopFormChange = (_field: keyof ProfileFormData, _value: string | boolean) => {};

// ============================================================================
// Default Props Factory
// ============================================================================

function createDefaultProps(
  overrides?: Partial<ProfilesSettingsPageProps>
): ProfilesSettingsPageProps {
  return {
    isLoading: false,
    description: 'Executor profiles define which AI CLI tools to use for tasks and chats.',
    onCreateClick: noop,
    content: {
      profiles: mockProfiles,
      onCreateClick: noop,
      onEdit: noopProfile,
      onDelete: noopProfile,
      onSetDefault: noopProfile,
    },
    formDialog: {
      isOpen: false,
      onClose: noop,
      title: 'Create Executor Profile',
      formData: emptyFormData,
      onFormChange: noopFormChange,
      onSubmit: noop,
      isPending: false,
      error: null,
      submitLabel: 'Create Profile',
      loadingText: 'Creating...',
    },
    confirmDialog: {
      isOpen: false,
      onClose: noop,
      onConfirm: noop,
      title: '',
      description: '',
    },
    ...overrides,
  };
}

// ============================================================================
// Basic Stories
// ============================================================================

/**
 * Default profiles settings page with multiple profiles
 */
export const Default: Story = {
  args: createDefaultProps(),
};

/**
 * Loading state with skeleton
 */
export const Loading: Story = {
  args: createDefaultProps({
    isLoading: true,
  }),
};

/**
 * Empty state (no profiles)
 */
export const Empty: Story = {
  args: createDefaultProps({
    content: {
      ...createDefaultProps().content,
      profiles: [],
    },
  }),
};

/**
 * Error state with retry button
 */
export const ErrorState: Story = {
  args: createDefaultProps({
    error: new Error('Failed to fetch executor profiles from database.'),
    onRetry: noop,
  }),
};

/**
 * Single profile
 */
export const SingleProfile: Story = {
  args: createDefaultProps({
    content: {
      ...createDefaultProps().content,
      profiles: mockProfiles[0] ? [mockProfiles[0]] : [],
    },
  }),
};

// ============================================================================
// Dialog Stories
// ============================================================================

/**
 * Create dialog open
 */
export const CreateDialogOpen: Story = {
  args: createDefaultProps({
    formDialog: {
      ...createDefaultProps().formDialog,
      isOpen: true,
      title: 'Create Executor Profile',
      formData: emptyFormData,
      submitLabel: 'Create Profile',
      loadingText: 'Creating...',
    },
  }),
};

/**
 * Create dialog with values
 */
export const CreateDialogFilled: Story = {
  args: createDefaultProps({
    formDialog: {
      ...createDefaultProps().formDialog,
      isOpen: true,
      title: 'Create Executor Profile',
      formData: filledFormData,
      submitLabel: 'Create Profile',
      loadingText: 'Creating...',
    },
  }),
};

/**
 * Create dialog submitting
 */
export const CreateDialogSubmitting: Story = {
  args: createDefaultProps({
    formDialog: {
      ...createDefaultProps().formDialog,
      isOpen: true,
      title: 'Create Executor Profile',
      formData: filledFormData,
      isPending: true,
      submitLabel: 'Create Profile',
      loadingText: 'Creating...',
    },
  }),
};

/**
 * Create dialog with error
 */
export const CreateDialogError: Story = {
  args: createDefaultProps({
    formDialog: {
      ...createDefaultProps().formDialog,
      isOpen: true,
      title: 'Create Executor Profile',
      formData: {
        ...filledFormData,
        command: '',
      },
      error: 'Command is required',
      submitLabel: 'Create Profile',
      loadingText: 'Creating...',
    },
  }),
};

// Helper to get first profile - guaranteed to exist from mock data
// biome-ignore lint/style/noNonNullAssertion: Mock data is guaranteed
const firstProfile = mockProfiles[0]!;

/**
 * Edit dialog open
 */
export const EditDialogOpen: Story = {
  args: createDefaultProps({
    formDialog: {
      ...createDefaultProps().formDialog,
      isOpen: true,
      title: 'Edit Executor Profile',
      formData: {
        name: firstProfile.name,
        command: firstProfile.command,
        args: firstProfile.args ?? '',
        env: firstProfile.env ?? '',
        description: firstProfile.description ?? '',
        isDefault: firstProfile.isDefault,
      },
      submitLabel: 'Update Profile',
      loadingText: 'Updating...',
    },
  }),
};

/**
 * Edit dialog submitting
 */
export const EditDialogSubmitting: Story = {
  args: createDefaultProps({
    formDialog: {
      ...createDefaultProps().formDialog,
      isOpen: true,
      title: 'Edit Executor Profile',
      formData: {
        name: firstProfile.name,
        command: firstProfile.command,
        args: firstProfile.args ?? '',
        env: firstProfile.env ?? '',
        description: firstProfile.description ?? '',
        isDefault: firstProfile.isDefault,
      },
      isPending: true,
      submitLabel: 'Update Profile',
      loadingText: 'Updating...',
    },
  }),
};

/**
 * Delete confirmation dialog open
 */
export const DeleteConfirmOpen: Story = {
  args: createDefaultProps({
    confirmDialog: {
      isOpen: true,
      onClose: noop,
      onConfirm: noop,
      title: 'Delete Executor Profile',
      description: 'Are you sure you want to delete "Gemini CLI"? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    },
  }),
};

/**
 * Delete confirmation loading
 */
export const DeleteConfirmLoading: Story = {
  args: createDefaultProps({
    confirmDialog: {
      isOpen: true,
      onClose: noop,
      onConfirm: noop,
      title: 'Delete Executor Profile',
      description: 'Are you sure you want to delete "Gemini CLI"? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
      loading: true,
    },
  }),
};

/**
 * Many profiles (scrollable)
 */
export const ManyProfiles: Story = {
  args: (() => {
    const manyProfiles: ExecutorProfile[] = [
      ...mockProfiles,
      ...Array.from({ length: 7 }, (_, i) => ({
        id: `profile-extra-${i}`,
        name: `Executor ${i + 4}`,
        description: `Description for executor ${i + 4}`,
        command: `executor-${i + 4}`,
        isDefault: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })),
    ];
    return createDefaultProps({
      content: {
        ...createDefaultProps().content,
        profiles: manyProfiles,
      },
    });
  })(),
};

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size variant
 */
export const SizeSmall: Story = {
  args: createDefaultProps({
    size: 'sm',
  }),
};

/**
 * Medium size variant (default)
 */
export const SizeMedium: Story = {
  args: createDefaultProps({
    size: 'md',
  }),
};

/**
 * Large size variant
 */
export const SizeLarge: Story = {
  args: createDefaultProps({
    size: 'lg',
  }),
};

/**
 * Responsive sizing demonstration
 */
export const ResponsiveSizing: Story = {
  args: createDefaultProps({
    size: { base: 'sm', md: 'md', lg: 'lg' },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Uses `sm` size on mobile, `md` on tablet, and `lg` on desktop. Resize the viewport to see changes.',
      },
    },
  },
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small (sm)</h3>
        <ProfilesSettingsPage {...createDefaultProps({ size: 'sm' })} />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium (md)</h3>
        <ProfilesSettingsPage {...createDefaultProps({ size: 'md' })} />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large (lg)</h3>
        <ProfilesSettingsPage {...createDefaultProps({ size: 'lg' })} />
      </div>
    </div>
  ),
};

// ============================================================================
// Sub-Component Stories
// ============================================================================

/**
 * Skeleton component standalone
 */
export const SkeletonDemo: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Default (4 items)</h3>
        <ProfilesSettingsPageSkeleton />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Custom count (2 items)</h3>
        <ProfilesSettingsPageSkeleton itemCount={2} />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large size</h3>
        <ProfilesSettingsPageSkeleton size="lg" />
      </div>
    </div>
  ),
};

/**
 * Error component standalone
 */
export const ErrorDemo: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Default error</h3>
        <ProfilesSettingsPageError
          error={new Error('Failed to load profiles')}
          onRetry={() => alert('Retry clicked!')}
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Network error</h3>
        <ProfilesSettingsPageError
          error={new Error('Network connection lost. Please check your internet connection.')}
          onRetry={() => alert('Retry clicked!')}
        />
      </div>
    </div>
  ),
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Keyboard navigation demo
 */
export const KeyboardNavigation: Story = {
  args: createDefaultProps(),
  parameters: {
    docs: {
      description: {
        story: `
**Keyboard Navigation:**
- **Tab**: Navigate through interactive elements (buttons, inputs)
- **Enter/Space**: Activate buttons, open dialogs
- **Escape**: Close dialogs
- **Arrow keys**: Navigate within form fields and lists

Try using only the keyboard to navigate this page.
        `,
      },
    },
  },
};

/**
 * Screen reader accessibility demo
 */
export const ScreenReaderAccessibility: Story = {
  args: createDefaultProps(),
  parameters: {
    docs: {
      description: {
        story: `
**Screen Reader Support:**
- Page has \`aria-label\` describing its purpose
- Loading state announces "Loading executor profiles. Please wait."
- Error state announces the error message with \`aria-live="assertive"\`
- Empty state announces "No executor profiles configured."
- Loaded state announces profile count
- All buttons have accessible labels
- Form fields are properly labeled

Screen reader announcements are made via VisuallyHidden with \`aria-live\` regions.
        `,
      },
    },
  },
};

/**
 * Focus ring visibility demo
 */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Tab through the page to see focus rings. All interactive elements have visible focus
        indicators with <code>ring-offset-2</code> for visibility on any background.
      </p>
      <ProfilesSettingsPage {...createDefaultProps()} />
    </div>
  ),
};

/**
 * Touch target accessibility demo
 */
export const TouchTargetAccessibility: Story = {
  args: createDefaultProps(),
  parameters: {
    docs: {
      description: {
        story: `
**WCAG 2.5.5 Touch Target Compliance:**
- All buttons have minimum 44×44px touch targets on mobile
- Touch targets relax on desktop for more compact UI
- Uses \`min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0\` pattern

This ensures the page is usable on touch devices with sufficient tap targets.
        `,
      },
    },
  },
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

/**
 * Ref forwarding demonstration
 */
export const RefForwarding: Story = {
  render: () => {
    function RefDemo() {
      const pageRef = useRef<HTMLDivElement>(null);
      const [info, setInfo] = useState<string>('Click button to get ref info');

      const handleClick = () => {
        if (pageRef.current) {
          setInfo(
            `Element: ${pageRef.current.tagName}, Class: ${pageRef.current.className.substring(0, 50)}...`
          );
        }
      };

      return (
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleClick}
            className="px-3 py-2 text-sm bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded"
          >
            Get Ref Info
          </button>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">{info}</p>
          <ProfilesSettingsPage ref={pageRef} {...createDefaultProps()} />
        </div>
      );
    }
    return <RefDemo />;
  },
};

/**
 * Data attributes demonstration
 */
export const DataAttributes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Loading State</h3>
        <p className="text-xs text-[rgb(var(--muted-foreground))] mb-2">
          data-state="loading", aria-busy="true"
        </p>
        <ProfilesSettingsPage
          {...createDefaultProps({ isLoading: true })}
          data-testid="profiles-loading"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Empty State</h3>
        <p className="text-xs text-[rgb(var(--muted-foreground))] mb-2">
          data-state="empty", data-profile-count="0"
        </p>
        <ProfilesSettingsPage
          {...createDefaultProps({
            content: { ...createDefaultProps().content, profiles: [] },
          })}
          data-testid="profiles-empty"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Loaded State</h3>
        <p className="text-xs text-[rgb(var(--muted-foreground))] mb-2">
          data-state="loaded", data-profile-count="3"
        </p>
        <ProfilesSettingsPage {...createDefaultProps()} data-testid="profiles-loaded" />
      </div>
    </div>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

/**
 * Interactive demo with state management
 */
export const InteractiveDemo: Story = {
  render: () => {
    function InteractiveExample() {
      const [profiles, setProfiles] = useState<ExecutorProfile[]>(mockProfiles);
      const [isDialogOpen, setIsDialogOpen] = useState(false);
      const [editingProfile, setEditingProfile] = useState<ExecutorProfile | null>(null);
      const [formData, setFormData] = useState<ProfileFormData>(emptyFormData);
      const [isPending, setIsPending] = useState(false);

      const handleOpenCreate = () => {
        setFormData(emptyFormData);
        setEditingProfile(null);
        setIsDialogOpen(true);
      };

      const handleOpenEdit = (profile: ExecutorProfile) => {
        setFormData({
          name: profile.name,
          command: profile.command,
          args: profile.args ?? '',
          env: profile.env ?? '',
          description: profile.description ?? '',
          isDefault: profile.isDefault,
        });
        setEditingProfile(profile);
        setIsDialogOpen(true);
      };

      const handleFormChange = (field: keyof ProfileFormData, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
      };

      const handleSubmit = () => {
        setIsPending(true);
        setTimeout(() => {
          if (editingProfile) {
            setProfiles((prev) =>
              prev.map((p) =>
                p.id === editingProfile.id
                  ? { ...p, ...formData, updatedAt: new Date().toISOString() }
                  : p
              )
            );
          } else {
            const newProfile: ExecutorProfile = {
              id: `profile-${Date.now()}`,
              ...formData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setProfiles((prev) => [...prev, newProfile]);
          }
          setIsPending(false);
          setIsDialogOpen(false);
        }, 1000);
      };

      const handleDelete = (profile: ExecutorProfile) => {
        setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
      };

      const handleSetDefault = (profile: ExecutorProfile) => {
        setProfiles((prev) =>
          prev.map((p) => ({
            ...p,
            isDefault: p.id === profile.id,
          }))
        );
      };

      return (
        <ProfilesSettingsPage
          isLoading={false}
          description="Executor profiles define which AI CLI tools to use for tasks and chats."
          onCreateClick={handleOpenCreate}
          content={{
            profiles,
            onCreateClick: handleOpenCreate,
            onEdit: handleOpenEdit,
            onDelete: handleDelete,
            onSetDefault: handleSetDefault,
          }}
          formDialog={{
            isOpen: isDialogOpen,
            onClose: () => setIsDialogOpen(false),
            title: editingProfile ? 'Edit Executor Profile' : 'Create Executor Profile',
            formData,
            onFormChange: handleFormChange,
            onSubmit: handleSubmit,
            isPending,
            error: null,
            submitLabel: editingProfile ? 'Update Profile' : 'Create Profile',
            loadingText: editingProfile ? 'Updating...' : 'Creating...',
          }}
          confirmDialog={{
            isOpen: false,
            onClose: noop,
            onConfirm: noop,
            title: '',
            description: '',
          }}
        />
      );
    }
    return <InteractiveExample />;
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Constants reference for testing and documentation
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-6 text-sm">
      <section>
        <h3 className="font-medium mb-2">Default Values</h3>
        <dl className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <div className="flex">
            <dt className="font-mono w-64">DEFAULT_SKELETON_COUNT:</dt>
            <dd>{DEFAULT_SKELETON_COUNT}</dd>
          </div>
          <div className="flex">
            <dt className="font-mono w-64">DEFAULT_PAGE_SIZE:</dt>
            <dd>"{DEFAULT_PAGE_SIZE}"</dd>
          </div>
          <div className="flex">
            <dt className="font-mono w-64">DEFAULT_PAGE_LABEL:</dt>
            <dd>"{DEFAULT_PAGE_LABEL}"</dd>
          </div>
          <div className="flex">
            <dt className="font-mono w-64">DEFAULT_ERROR_TITLE:</dt>
            <dd>"{DEFAULT_ERROR_TITLE}"</dd>
          </div>
          <div className="flex">
            <dt className="font-mono w-64">DEFAULT_RETRY_LABEL:</dt>
            <dd>"{DEFAULT_RETRY_LABEL}"</dd>
          </div>
        </dl>
      </section>

      <section>
        <h3 className="font-medium mb-2">Screen Reader Announcements</h3>
        <dl className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <div className="flex">
            <dt className="font-mono w-64">SR_LOADING:</dt>
            <dd>"{SR_LOADING}"</dd>
          </div>
          <div className="flex">
            <dt className="font-mono w-64">SR_ERROR_PREFIX:</dt>
            <dd>"{SR_ERROR_PREFIX}"</dd>
          </div>
          <div className="flex">
            <dt className="font-mono w-64">SR_EMPTY:</dt>
            <dd>"{SR_EMPTY}"</dd>
          </div>
          <div className="flex">
            <dt className="font-mono w-64">SR_LOADED_PREFIX:</dt>
            <dd>"{SR_LOADED_PREFIX}"</dd>
          </div>
        </dl>
      </section>

      <section>
        <h3 className="font-medium mb-2">Utility Functions</h3>
        <dl className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <div className="flex">
            <dt className="font-mono w-64">getBaseSize(undefined):</dt>
            <dd>"{getBaseSize(undefined)}"</dd>
          </div>
          <div className="flex">
            <dt className="font-mono w-64">getBaseSize("lg"):</dt>
            <dd>"{getBaseSize('lg')}"</dd>
          </div>
          <div className="flex">
            <dt className="font-mono w-64">buildLoadedAnnouncement(3):</dt>
            <dd>"{buildLoadedAnnouncement(3)}"</dd>
          </div>
          <div className="flex">
            <dt className="font-mono w-64">buildLoadedAnnouncement(1):</dt>
            <dd>"{buildLoadedAnnouncement(1)}"</dd>
          </div>
          <div className="flex">
            <dt className="font-mono w-64">buildLoadedAnnouncement(0):</dt>
            <dd>"{buildLoadedAnnouncement(0)}"</dd>
          </div>
          <div className="flex flex-col">
            <dt className="font-mono">buildPageAccessibleLabel(true, false):</dt>
            <dd className="ml-4">"{buildPageAccessibleLabel(true, false)}"</dd>
          </div>
          <div className="flex flex-col">
            <dt className="font-mono">buildPageAccessibleLabel(false, true):</dt>
            <dd className="ml-4">"{buildPageAccessibleLabel(false, true)}"</dd>
          </div>
        </dl>
      </section>

      <section>
        <h3 className="font-medium mb-2">Size Class Maps</h3>
        <dl className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <div className="flex flex-col">
            <dt className="font-mono">PAGE_SIZE_PADDING:</dt>
            <dd className="ml-4 font-mono text-xs">{JSON.stringify(PAGE_SIZE_PADDING, null, 2)}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="font-mono">PAGE_SIZE_GAP:</dt>
            <dd className="ml-4 font-mono text-xs">{JSON.stringify(PAGE_SIZE_GAP, null, 2)}</dd>
          </div>
        </dl>
      </section>
    </div>
  ),
};
