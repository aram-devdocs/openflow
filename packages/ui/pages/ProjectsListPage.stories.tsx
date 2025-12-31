/**
 * Storybook stories for ProjectsListPage
 *
 * Demonstrates the complete projects list page in various states:
 * - Default with projects
 * - Loading state
 * - Empty state
 * - With create dialog open
 * - With confirm dialog open
 * - Mobile viewport
 */

import type { Project } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { ProjectsListPage, type ProjectsListPageProps } from './ProjectsListPage';

const meta: Meta<typeof ProjectsListPage> = {
  title: 'Pages/ProjectsListPage',
  component: ProjectsListPage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-screen w-screen">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProjectsListPage>;

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
    workflowsFolder: '.openflow/workflows',
    icon: 'folder',
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
    workflowsFolder: '.openflow/workflows',
    icon: 'lock',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-14T09:00:00Z',
  },
  {
    id: 'project-3',
    name: 'API Gateway',
    gitRepoPath: '/Users/dev/api-gateway',
    baseBranch: 'develop',
    setupScript: 'cargo build',
    devScript: 'cargo watch -x run',
    workflowsFolder: '.openflow/workflows',
    icon: 'server',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-13T16:00:00Z',
  },
  {
    id: 'project-4',
    name: 'Web Dashboard',
    gitRepoPath: '/Users/dev/web-dashboard',
    baseBranch: 'main',
    setupScript: 'yarn install',
    devScript: 'yarn dev',
    workflowsFolder: '.openflow/workflows',
    icon: 'layout',
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-12T14:00:00Z',
  },
];

// ============================================================================
// Helper functions
// ============================================================================

const noop = () => {};
const noopString = (_s: string) => {};
const noopAsync = async () => {};
const noopDelete = (_id: string, _name: string) => {};

// ============================================================================
// Default Props Factory
// ============================================================================

function createDefaultProps(overrides?: Partial<ProjectsListPageProps>): ProjectsListPageProps {
  return {
    projectCount: mockProjects.length,
    onSearch: noop,
    header: {
      onCreateProject: noop,
    },
    content: {
      isLoading: false,
      projects: mockProjects,
      onCreateProject: noop,
      onSelectProject: noopString,
      onProjectSettings: noopString,
      onDeleteProject: noopDelete,
    },
    createDialog: {
      isOpen: false,
      onClose: noop,
      projectName: '',
      onProjectNameChange: noopString,
      projectPath: '',
      onProjectPathChange: noopString,
      onBrowseFolder: noopAsync,
      onCreate: noop,
      isPending: false,
      error: null,
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
 * Default projects list with multiple projects
 */
export const Default: Story = {
  args: createDefaultProps(),
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: createDefaultProps({
    content: {
      ...createDefaultProps().content,
      isLoading: true,
      projects: [],
    },
    projectCount: 0,
  }),
};

/**
 * Empty state (no projects)
 */
export const Empty: Story = {
  args: createDefaultProps({
    content: {
      ...createDefaultProps().content,
      projects: [],
    },
    projectCount: 0,
  }),
};

/**
 * Single project
 */
export const SingleProject: Story = {
  args: createDefaultProps({
    content: {
      ...createDefaultProps().content,
      projects: mockProjects[0] ? [mockProjects[0]] : [],
    },
    projectCount: 1,
  }),
};

/**
 * Many projects (scrollable grid)
 */
export const ManyProjects: Story = {
  args: (() => {
    const manyProjects: Project[] = [
      ...mockProjects,
      ...Array.from({ length: 12 }, (_, i) => ({
        id: `project-extra-${i}`,
        name: `Project ${i + 5}`,
        gitRepoPath: `/Users/dev/project-${i + 5}`,
        baseBranch: 'main',
        setupScript: 'npm install',
        devScript: 'npm run dev',
        workflowsFolder: '.openflow/workflows',
        icon: 'folder',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })),
    ];
    return createDefaultProps({
      content: {
        ...createDefaultProps().content,
        projects: manyProjects,
      },
      projectCount: manyProjects.length,
    });
  })(),
};

/**
 * Create dialog open
 */
export const CreateDialogOpen: Story = {
  args: createDefaultProps({
    createDialog: {
      ...createDefaultProps().createDialog,
      isOpen: true,
    },
  }),
};

/**
 * Create dialog with values
 */
export const CreateDialogFilled: Story = {
  args: createDefaultProps({
    createDialog: {
      ...createDefaultProps().createDialog,
      isOpen: true,
      projectName: 'New Feature App',
      projectPath: '/Users/dev/new-feature-app',
    },
  }),
};

/**
 * Create dialog pending
 */
export const CreateDialogPending: Story = {
  args: createDefaultProps({
    createDialog: {
      ...createDefaultProps().createDialog,
      isOpen: true,
      projectName: 'New Feature App',
      projectPath: '/Users/dev/new-feature-app',
      isPending: true,
    },
  }),
};

/**
 * Create dialog with error
 */
export const CreateDialogError: Story = {
  args: createDefaultProps({
    createDialog: {
      ...createDefaultProps().createDialog,
      isOpen: true,
      projectName: 'New Feature App',
      projectPath: '/invalid/path',
      error: 'The specified path is not a valid git repository',
    },
  }),
};

/**
 * Delete confirmation dialog open
 */
export const ConfirmDeleteOpen: Story = {
  args: createDefaultProps({
    confirmDialog: {
      isOpen: true,
      onClose: noop,
      onConfirm: noop,
      title: 'Delete Project',
      description:
        'Are you sure you want to delete "OpenFlow"? This will archive all associated tasks and chats.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    },
  }),
};

/**
 * Delete confirmation dialog loading
 */
export const ConfirmDeleteLoading: Story = {
  args: createDefaultProps({
    confirmDialog: {
      isOpen: true,
      onClose: noop,
      onConfirm: noop,
      title: 'Delete Project',
      description:
        'Are you sure you want to delete "OpenFlow"? This will archive all associated tasks and chats.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
      loading: true,
    },
  }),
};

/**
 * Mobile viewport
 */
export const Mobile: Story = {
  args: createDefaultProps(),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet viewport
 */
export const Tablet: Story = {
  args: createDefaultProps(),
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
