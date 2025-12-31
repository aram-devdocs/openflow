import type { Project } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import {
  ProjectCard,
  ProjectsGrid,
  ProjectsListContent,
  ProjectsListEmptyState,
  ProjectsListHeader,
  ProjectsListLayout,
  ProjectsListLoadingSkeleton,
} from './ProjectsListPageComponents';

const meta: Meta = {
  title: 'Organisms/ProjectsListPageComponents',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[rgb(var(--background))]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

// ============================================================================
// Mock Data
// ============================================================================

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'OpenFlow',
    icon: '🚀',
    gitRepoPath: '/Users/dev/openflow',
    baseBranch: 'main',
    setupScript: 'pnpm install',
    devScript: 'pnpm dev',
    workflowsFolder: '.workflows',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'proj-2',
    name: 'MyApp',
    icon: '📱',
    gitRepoPath: '/Users/dev/myapp',
    baseBranch: 'develop',
    setupScript: 'npm install',
    devScript: 'npm run dev',
    workflowsFolder: '.workflows',
    createdAt: '2024-01-11T10:00:00Z',
    updatedAt: '2024-01-11T10:00:00Z',
  },
  {
    id: 'proj-3',
    name: 'Backend API',
    icon: '🔧',
    gitRepoPath: '/Users/dev/backend',
    baseBranch: 'main',
    setupScript: '',
    devScript: '',
    workflowsFolder: '.workflows',
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-01-12T10:00:00Z',
  },
];

// ============================================================================
// ProjectsListLayout Stories
// ============================================================================

export const Layout: StoryObj<typeof ProjectsListLayout> = {
  render: () => (
    <ProjectsListLayout projectCount={3} onSearch={() => console.log('Search')}>
      <div className="p-8 text-center text-[rgb(var(--muted-foreground))]">Projects content</div>
    </ProjectsListLayout>
  ),
};

// ============================================================================
// ProjectsListHeader Stories
// ============================================================================

export const Header: StoryObj<typeof ProjectsListHeader> = {
  render: () => <ProjectsListHeader onCreateProject={() => console.log('Create project')} />,
};

// ============================================================================
// ProjectsListLoadingSkeleton Stories
// ============================================================================

export const Loading: StoryObj<typeof ProjectsListLoadingSkeleton> = {
  render: () => <ProjectsListLoadingSkeleton count={6} />,
};

// ============================================================================
// ProjectsListEmptyState Stories
// ============================================================================

export const EmptyState: StoryObj<typeof ProjectsListEmptyState> = {
  render: () => <ProjectsListEmptyState onCreateProject={() => console.log('Create project')} />,
};

// ============================================================================
// ProjectCard Stories
// ============================================================================

export const Card: StoryObj<typeof ProjectCard> = {
  render: () => (
    <div className="w-80">
      <ProjectCard
        name="OpenFlow"
        path="/Users/dev/openflow"
        icon="🚀"
        onSelect={() => console.log('Select')}
        onSettings={() => console.log('Settings')}
      />
    </div>
  ),
};

export const CardWithLongPath: StoryObj<typeof ProjectCard> = {
  render: () => (
    <div className="w-80">
      <ProjectCard
        name="Very Long Project Name That Might Overflow"
        path="/Users/developer/projects/very/long/nested/path/to/project"
        icon="📦"
        onSelect={() => console.log('Select')}
        onSettings={() => console.log('Settings')}
      />
    </div>
  ),
};

// ============================================================================
// ProjectsGrid Stories
// ============================================================================

export const Grid: StoryObj<typeof ProjectsGrid> = {
  render: () => (
    <ProjectsGrid
      projects={mockProjects}
      onSelectProject={(id: string) => console.log('Project selected:', id)}
      onProjectSettings={(id: string) => console.log('Project settings:', id)}
      onDeleteProject={(id: string, name: string) => console.log('Delete project:', id, name)}
    />
  ),
};

// ============================================================================
// ProjectsListContent Stories
// ============================================================================

export const ContentWithProjects: StoryObj<typeof ProjectsListContent> = {
  render: () => (
    <ProjectsListContent
      projects={mockProjects}
      isLoading={false}
      onSelectProject={(id: string) => console.log('Project selected:', id)}
      onProjectSettings={(id: string) => console.log('Project settings:', id)}
      onDeleteProject={(id: string, name: string) => console.log('Delete project:', id, name)}
      onCreateProject={() => console.log('Create')}
    />
  ),
};

export const ContentEmpty: StoryObj<typeof ProjectsListContent> = {
  render: () => (
    <ProjectsListContent
      projects={[]}
      isLoading={false}
      onSelectProject={() => {}}
      onProjectSettings={() => {}}
      onDeleteProject={() => {}}
      onCreateProject={() => console.log('Create')}
    />
  ),
};

export const ContentLoading: StoryObj<typeof ProjectsListContent> = {
  render: () => (
    <ProjectsListContent
      projects={[]}
      isLoading={true}
      onSelectProject={() => {}}
      onProjectSettings={() => {}}
      onDeleteProject={() => {}}
      onCreateProject={() => {}}
    />
  ),
};
