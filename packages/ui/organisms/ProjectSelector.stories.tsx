import type { Meta, StoryObj } from '@storybook/react';
import type { Project } from '@openflow/generated';
import { ProjectSelector } from './ProjectSelector';

const meta: Meta<typeof ProjectSelector> = {
  title: 'Organisms/ProjectSelector',
  component: ProjectSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onSelectProject: { action: 'project selected' },
    onNewProject: { action: 'new project clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectSelector>;

// Mock project data
const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'OpenFlow',
    gitRepoPath: '/Users/dev/openflow',
    baseBranch: 'main',
    setupScript: 'pnpm install',
    devScript: 'pnpm dev',
    icon: 'folder-git',
    workflowsFolder: '.openflow/workflows',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
  },
  {
    id: 'proj-2',
    name: 'My API Backend',
    gitRepoPath: '/Users/dev/my-api',
    baseBranch: 'main',
    setupScript: 'cargo build',
    devScript: 'cargo watch -x run',
    icon: 'folder-code',
    workflowsFolder: '.openflow/workflows',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-18T12:00:00Z',
  },
  {
    id: 'proj-3',
    name: 'Dashboard UI',
    gitRepoPath: '/Users/dev/dashboard',
    baseBranch: 'develop',
    setupScript: 'npm install',
    devScript: 'npm run dev',
    icon: 'folder-kanban',
    workflowsFolder: '.openflow/workflows',
    createdAt: '2024-01-05T14:00:00Z',
    updatedAt: '2024-01-19T09:00:00Z',
  },
  {
    id: 'proj-4',
    name: 'Data Pipeline',
    gitRepoPath: '/Users/dev/data-pipeline',
    baseBranch: 'main',
    setupScript: 'pip install -r requirements.txt',
    devScript: 'python main.py',
    icon: 'folder',
    workflowsFolder: '.openflow/workflows',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-17T16:00:00Z',
  },
];

/**
 * Default state with a selected project.
 */
export const Default: Story = {
  args: {
    projects: mockProjects,
    selectedProjectId: 'proj-1',
  },
};

/**
 * No project selected - shows placeholder.
 */
export const NoSelection: Story = {
  args: {
    projects: mockProjects,
    selectedProjectId: undefined,
  },
};

/**
 * Empty state with no projects.
 */
export const EmptyProjects: Story = {
  args: {
    projects: [],
    selectedProjectId: undefined,
  },
};

/**
 * Single project in the list.
 */
export const SingleProject: Story = {
  args: {
    projects: [mockProjects[0]],
    selectedProjectId: 'proj-1',
  },
};

/**
 * Many projects with scrolling.
 */
export const ManyProjects: Story = {
  args: {
    projects: [
      ...mockProjects,
      {
        id: 'proj-5',
        name: 'Mobile App',
        gitRepoPath: '/Users/dev/mobile-app',
        baseBranch: 'main',
        setupScript: 'flutter pub get',
        devScript: 'flutter run',
        icon: 'folder',
        workflowsFolder: '.openflow/workflows',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-17T16:00:00Z',
      },
      {
        id: 'proj-6',
        name: 'ML Models',
        gitRepoPath: '/Users/dev/ml-models',
        baseBranch: 'main',
        setupScript: 'conda env create',
        devScript: 'jupyter notebook',
        icon: 'folder-code',
        workflowsFolder: '.openflow/workflows',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-17T16:00:00Z',
      },
      {
        id: 'proj-7',
        name: 'Infrastructure',
        gitRepoPath: '/Users/dev/infra',
        baseBranch: 'main',
        setupScript: 'terraform init',
        devScript: 'terraform plan',
        icon: 'folder-git',
        workflowsFolder: '.openflow/workflows',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-17T16:00:00Z',
      },
      {
        id: 'proj-8',
        name: 'Documentation Site',
        gitRepoPath: '/Users/dev/docs',
        baseBranch: 'main',
        setupScript: 'pnpm install',
        devScript: 'pnpm docs:dev',
        icon: 'folder-open',
        workflowsFolder: '.openflow/workflows',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-17T16:00:00Z',
      },
    ],
    selectedProjectId: 'proj-2',
  },
};

/**
 * Disabled state.
 */
export const Disabled: Story = {
  args: {
    projects: mockProjects,
    selectedProjectId: 'proj-1',
    disabled: true,
  },
};

/**
 * Custom placeholder text.
 */
export const CustomPlaceholder: Story = {
  args: {
    projects: mockProjects,
    selectedProjectId: undefined,
    placeholder: 'Choose a project to work on...',
  },
};

/**
 * Project with long name (tests truncation).
 */
export const LongProjectName: Story = {
  args: {
    projects: [
      {
        id: 'proj-long',
        name: 'A Very Long Project Name That Should Be Truncated In The Display',
        gitRepoPath: '/Users/dev/long-project',
        baseBranch: 'main',
        setupScript: 'pnpm install',
        devScript: 'pnpm dev',
        icon: 'folder-git',
        workflowsFolder: '.openflow/workflows',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-17T16:00:00Z',
      },
      ...mockProjects,
    ],
    selectedProjectId: 'proj-long',
  },
};

/**
 * Different icon types.
 */
export const DifferentIcons: Story = {
  args: {
    projects: [
      {
        ...mockProjects[0],
        id: 'icon-1',
        name: 'Default Folder',
        icon: 'folder',
      },
      {
        ...mockProjects[0],
        id: 'icon-2',
        name: 'Git Repository',
        icon: 'folder-git',
      },
      {
        ...mockProjects[0],
        id: 'icon-3',
        name: 'Code Project',
        icon: 'folder-code',
      },
      {
        ...mockProjects[0],
        id: 'icon-4',
        name: 'Kanban Board',
        icon: 'folder-kanban',
      },
      {
        ...mockProjects[0],
        id: 'icon-5',
        name: 'Open Folder',
        icon: 'folder-open',
      },
      {
        ...mockProjects[0],
        id: 'icon-6',
        name: 'Unknown Icon (fallback)',
        icon: 'unknown-icon-name',
      },
    ],
    selectedProjectId: 'icon-2',
  },
};
