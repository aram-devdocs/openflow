/**
 * Storybook stories for ProfilesSettingsPage
 *
 * Demonstrates the executor profiles settings page in various states:
 * - Default with profiles
 * - Loading state
 * - Empty state
 * - With create dialog open
 * - With edit dialog open
 * - With delete confirmation
 */

import type { ExecutorProfile } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import type { ProfileFormData } from '../organisms/ProfilesPageComponents';
import { ProfilesSettingsPage, type ProfilesSettingsPageProps } from './ProfilesSettingsPage';

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
// Stories
// ============================================================================

/**
 * Default profiles settings page with multiple profiles
 */
export const Default: Story = {
  args: createDefaultProps(),
};

/**
 * Loading state
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
