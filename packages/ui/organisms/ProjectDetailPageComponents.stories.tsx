import type { Project, Task } from '@openflow/generated';
import { TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import {
  ProjectDetailContent,
  ProjectDetailHeader,
  ProjectDetailInfoBar,
  ProjectDetailLayout,
  ProjectDetailLoadingSkeleton,
  ProjectNotFound,
} from './ProjectDetailPageComponents';

const meta: Meta = {
  title: 'Organisms/ProjectDetailPageComponents',
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

const mockProject: Project = {
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
};

const mockTasks: Task[] = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    title: 'Implement authentication',
    description: 'Add login and registration',
    status: TaskStatus.Inprogress,
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'task-2',
    projectId: 'proj-1',
    title: 'Add dark mode',
    description: 'Support light and dark themes',
    status: TaskStatus.Todo,
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-14T10:00:00Z',
    updatedAt: '2024-01-14T10:00:00Z',
  },
];

// ============================================================================
// ProjectDetailLayout Stories
// ============================================================================

export const Layout: StoryObj<typeof ProjectDetailLayout> = {
  render: () => (
    <ProjectDetailLayout
      sidebarCollapsed={false}
      sidebar={<div className="p-4 h-full bg-[rgb(var(--card))]">Sidebar</div>}
      header={<div className="h-14 bg-[rgb(var(--card))] border-b" />}
    >
      <div className="p-8 text-center text-[rgb(var(--muted-foreground))]">Project content</div>
    </ProjectDetailLayout>
  ),
};

// ============================================================================
// ProjectDetailHeader Stories
// ============================================================================

export const Header: StoryObj<typeof ProjectDetailHeader> = {
  render: () => (
    <ProjectDetailHeader
      project={mockProject}
      onSearch={() => console.log('Search')}
      onNewTask={() => console.log('New task')}
    />
  ),
};

// ============================================================================
// ProjectDetailLoadingSkeleton Stories
// ============================================================================

export const Loading: StoryObj<typeof ProjectDetailLoadingSkeleton> = {
  render: () => <ProjectDetailLoadingSkeleton />,
};

// ============================================================================
// ProjectNotFound Stories
// ============================================================================

export const NotFound: StoryObj<typeof ProjectNotFound> = {
  render: () => (
    <ProjectNotFound onBack={() => console.log('Back')} onSearch={() => console.log('Search')} />
  ),
};

// ============================================================================
// ProjectDetailInfoBar Stories
// ============================================================================

export const InfoBar: StoryObj<typeof ProjectDetailInfoBar> = {
  render: () => (
    <ProjectDetailInfoBar
      project={mockProject}
      onBack={() => console.log('Back')}
      onSettings={() => console.log('Settings')}
      onNewTask={() => console.log('New task')}
    />
  ),
};

// ============================================================================
// ProjectDetailContent Stories
// ============================================================================

export const ContentWithTasks: StoryObj<typeof ProjectDetailContent> = {
  render: () => (
    <ProjectDetailContent
      tasks={mockTasks}
      isLoading={false}
      onSelectTask={(id: string) => console.log('Task selected:', id)}
      onTaskStatusChange={(id: string, status: TaskStatus) =>
        console.log('Status change:', id, status)
      }
      onNewTask={() => console.log('New task')}
    />
  ),
};

export const ContentEmpty: StoryObj<typeof ProjectDetailContent> = {
  render: () => (
    <ProjectDetailContent
      tasks={[]}
      isLoading={false}
      onSelectTask={() => {}}
      onTaskStatusChange={() => {}}
      onNewTask={() => console.log('New task')}
    />
  ),
};

export const ContentLoading: StoryObj<typeof ProjectDetailContent> = {
  render: () => (
    <ProjectDetailContent
      tasks={[]}
      isLoading={true}
      onSelectTask={() => {}}
      onTaskStatusChange={() => {}}
      onNewTask={() => {}}
    />
  ),
};
