/**
 * Storybook stories for ProjectsSettingsPage
 *
 * Demonstrates the project settings page in various states:
 * - Loading state
 * - Empty state (no projects)
 * - Loading project state
 * - Ready state with form
 * - Unsaved changes
 * - Saving state
 * - Error state
 */

import type { Project } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import type { ProjectSettingsFormData } from '../organisms/ProjectSettingsPageComponents';
import { ProjectsSettingsPage, type ProjectsSettingsPageProps } from './ProjectsSettingsPage';

const meta: Meta<typeof ProjectsSettingsPage> = {
  title: 'Pages/ProjectsSettingsPage',
  component: ProjectsSettingsPage,
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
type Story = StoryObj<typeof ProjectsSettingsPage>;

// ============================================================================
// Mock Data
// ============================================================================

const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'OpenFlow',
    gitRepoPath: '/Users/dev/openflow',
    baseBranch: 'main',
    setupScript: 'pnpm install',
    devScript: 'pnpm dev',
    cleanupScript: 'pnpm clean',
    workflowsFolder: '.openflow/workflows',
    icon: 'folder',
    ruleFolders: '[".openflow/rules"]',
    alwaysIncludedRules: '["CLAUDE.md"]',
    verificationConfig: '{"typecheck": "pnpm typecheck", "lint": "pnpm lint"}',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'project-2',
    name: 'Auth Service',
    gitRepoPath: '/Users/dev/auth-service',
    baseBranch: 'main',
    setupScript: 'npm install',
    devScript: 'npm run dev',
    workflowsFolder: '.workflows',
    icon: 'lock',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-14T09:00:00Z',
  },
];

const mockFormData: ProjectSettingsFormData = {
  name: 'OpenFlow',
  icon: 'folder',
  baseBranch: 'main',
  workflowsFolder: '.openflow/workflows',
  setupScript: 'pnpm install',
  devScript: 'pnpm dev',
  cleanupScript: 'pnpm clean',
  ruleFolders: '[".openflow/rules"]',
  alwaysIncludedRules: '["CLAUDE.md"]',
  verificationConfig: '{"typecheck": "pnpm typecheck", "lint": "pnpm lint"}',
};

const mockSelectorOptions = mockProjects.map((p) => ({
  value: p.id,
  label: p.name,
}));

// ============================================================================
// Helper functions
// ============================================================================

const noop = () => {};
const noopString = (_s: string) => {};
const noopFormChange =
  (_field: keyof ProjectSettingsFormData) =>
  (_e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {};

// ============================================================================
// Default Props Factory
// ============================================================================

// Default sub-props extracted for reuse without non-null assertions
const defaultSelector = {
  options: mockSelectorOptions,
  selectedProjectId: 'project-1',
  onSelect: noopString,
  hasChanges: false,
  saveSuccess: false,
};

const defaultForm = {
  formData: mockFormData,
  onFormChange: noopFormChange,
  isSaving: false,
  hasChanges: false,
  saveError: null as string | null,
  onSave: noop,
};

function createDefaultProps(
  overrides?: Partial<ProjectsSettingsPageProps>
): ProjectsSettingsPageProps {
  return {
    state: 'ready',
    selector: defaultSelector,
    project: mockProjects[0],
    form: defaultForm,
    ...overrides,
  };
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Default project settings page
 */
export const Default: Story = {
  args: createDefaultProps(),
};

/**
 * Loading projects state
 */
export const Loading: Story = {
  args: {
    state: 'loading',
  },
};

/**
 * Empty state (no projects)
 */
export const Empty: Story = {
  args: {
    state: 'empty',
  },
};

/**
 * Loading selected project state
 */
export const LoadingProject: Story = {
  args: {
    state: 'loading-project',
    selector: {
      options: mockSelectorOptions,
      selectedProjectId: 'project-1',
      onSelect: noopString,
      hasChanges: false,
      saveSuccess: false,
    },
  },
};

/**
 * With unsaved changes
 */
export const UnsavedChanges: Story = {
  args: createDefaultProps({
    selector: {
      ...defaultSelector,
      hasChanges: true,
    },
    form: {
      ...defaultForm,
      formData: {
        ...mockFormData,
        name: 'OpenFlow Updated',
      },
      hasChanges: true,
    },
  }),
};

/**
 * Save success state
 */
export const SaveSuccess: Story = {
  args: createDefaultProps({
    selector: {
      ...defaultSelector,
      saveSuccess: true,
    },
  }),
};

/**
 * Saving in progress
 */
export const Saving: Story = {
  args: createDefaultProps({
    selector: {
      ...defaultSelector,
      hasChanges: true,
    },
    form: {
      ...defaultForm,
      hasChanges: true,
      isSaving: true,
    },
  }),
};

/**
 * Save error state
 */
export const SaveError: Story = {
  args: createDefaultProps({
    selector: {
      ...defaultSelector,
      hasChanges: true,
    },
    form: {
      ...defaultForm,
      hasChanges: true,
      saveError: 'Failed to save project settings. Please try again.',
    },
  }),
};

/**
 * Different project selected
 */
export const DifferentProject: Story = {
  args: createDefaultProps({
    selector: {
      ...defaultSelector,
      selectedProjectId: 'project-2',
    },
    project: mockProjects[1],
    form: {
      ...defaultForm,
      formData: {
        name: 'Auth Service',
        icon: 'lock',
        baseBranch: 'main',
        workflowsFolder: '.workflows',
        setupScript: 'npm install',
        devScript: 'npm run dev',
        cleanupScript: '',
        ruleFolders: '',
        alwaysIncludedRules: '',
        verificationConfig: '',
      },
    },
  }),
};

/**
 * Single project
 */
export const SingleProject: Story = {
  args: createDefaultProps({
    selector: {
      options: mockSelectorOptions[0] ? [mockSelectorOptions[0]] : [],
      selectedProjectId: 'project-1',
      onSelect: noopString,
      hasChanges: false,
      saveSuccess: false,
    },
  }),
};

/**
 * Many projects in selector
 */
export const ManyProjects: Story = {
  args: createDefaultProps({
    selector: {
      options: [
        ...mockSelectorOptions,
        ...Array.from({ length: 10 }, (_, i) => ({
          value: `project-extra-${i}`,
          label: `Project ${i + 3}`,
        })),
      ],
      selectedProjectId: 'project-1',
      onSelect: noopString,
      hasChanges: false,
      saveSuccess: false,
    },
  }),
};

/**
 * Minimal project config
 */
export const MinimalConfig: Story = {
  args: createDefaultProps({
    form: {
      ...defaultForm,
      formData: {
        name: 'Simple Project',
        icon: '',
        baseBranch: 'main',
        workflowsFolder: '.workflows',
        setupScript: '',
        devScript: '',
        cleanupScript: '',
        ruleFolders: '',
        alwaysIncludedRules: '',
        verificationConfig: '',
      },
    },
  }),
};

/**
 * Full project config
 */
export const FullConfig: Story = {
  args: createDefaultProps({
    form: {
      ...defaultForm,
      formData: {
        name: 'Enterprise App',
        icon: 'building',
        baseBranch: 'develop',
        workflowsFolder: '.openflow/workflows',
        setupScript: 'pnpm install && pnpm prisma generate && pnpm db:migrate',
        devScript: 'pnpm dev',
        cleanupScript: 'pnpm clean && rm -rf node_modules/.cache',
        ruleFolders: '[".openflow/rules", ".openflow/guidelines"]',
        alwaysIncludedRules: '["CLAUDE.md", "SECURITY.md", "ARCHITECTURE.md"]',
        verificationConfig:
          '{"typecheck": "pnpm typecheck", "lint": "pnpm lint", "test": "pnpm test", "build": "pnpm build"}',
      },
    },
  }),
};
