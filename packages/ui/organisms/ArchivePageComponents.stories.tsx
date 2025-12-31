import type { Chat, Project, Task } from '@openflow/generated';
import { ChatRole, TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import {
  ArchiveContent,
  ArchiveHeader,
  ArchiveLayout,
  ArchiveTabBar,
} from './ArchivePageComponents';

const meta: Meta = {
  title: 'Organisms/ArchivePageComponents',
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

const mockTask: Task = {
  id: 'task-1',
  projectId: 'proj-1',
  title: 'Test Task',
  description: 'A test task',
  status: TaskStatus.Todo,
  actionsRequiredCount: 0,
  autoStartNextStep: false,
  archivedAt: '2024-01-15T10:00:00Z',
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockChat: Chat = {
  id: 'chat-1',
  projectId: 'proj-1',
  title: 'Test Chat',
  taskId: 'task-1',
  chatRole: ChatRole.Main,
  baseBranch: 'main',
  worktreeDeleted: false,
  isPlanContainer: false,
  archivedAt: '2024-01-15T10:00:00Z',
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockProject: Project = {
  id: 'proj-1',
  name: 'Test Project',
  icon: '📦',
  gitRepoPath: '/path/to/project',
  baseBranch: 'main',
  workflowsFolder: '.workflows',
  setupScript: '',
  devScript: '',
  archivedAt: '2024-01-15T10:00:00Z',
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

// ============================================================================
// Layout Stories
// ============================================================================

export const Layout: StoryObj<typeof ArchiveLayout> = {
  render: () => (
    <ArchiveLayout
      header={<div className="h-14 bg-[rgb(var(--card))] border-b border-[rgb(var(--border))]" />}
    >
      <div className="p-8 text-center text-[rgb(var(--muted-foreground))]">Archive content</div>
    </ArchiveLayout>
  ),
};

// ============================================================================
// Header Stories
// ============================================================================

export const Header: StoryObj<typeof ArchiveHeader> = {
  render: () => (
    <ArchiveHeader archivedCount={15} activeTab="tasks" onSearch={() => console.log('Search')} />
  ),
};

// ============================================================================
// TabBar Stories
// ============================================================================

export const TabBar: StoryObj<typeof ArchiveTabBar> = {
  render: () => (
    <ArchiveTabBar
      activeTab="tasks"
      onTabChange={(tab) => console.log('Tab:', tab)}
      taskCount={5}
      chatCount={3}
      projectCount={2}
      onBack={() => console.log('Back')}
    />
  ),
};

// ============================================================================
// Content Stories
// ============================================================================

export const ContentWithTasks: StoryObj<typeof ArchiveContent> = {
  render: () => (
    <ArchiveContent
      activeTab="tasks"
      isLoading={false}
      archivedTasks={[mockTask]}
      selectedTask={null}
      isRestoringTask={false}
      archivedChats={[mockChat]}
      selectedChat={null}
      isRestoringChat={false}
      archivedProjects={[mockProject]}
      selectedProject={null}
      isRestoringProject={false}
      getProjectName={() => 'Project Alpha'}
      getTaskTitle={() => null}
      formatDate={() => 'Jan 15, 2024'}
      onSelectTask={() => {}}
      onSelectChat={() => {}}
      onSelectProject={() => {}}
      onRestoreTask={() => console.log('Restore task')}
      onRestoreChat={() => console.log('Restore chat')}
      onRestoreProject={() => console.log('Restore project')}
      onDeleteTask={() => console.log('Delete task')}
      onDeleteChat={() => console.log('Delete chat')}
      onDeleteProject={() => console.log('Delete project')}
    />
  ),
};

export const ContentEmpty: StoryObj<typeof ArchiveContent> = {
  render: () => (
    <ArchiveContent
      activeTab="tasks"
      isLoading={false}
      archivedTasks={[]}
      selectedTask={null}
      isRestoringTask={false}
      archivedChats={[]}
      selectedChat={null}
      isRestoringChat={false}
      archivedProjects={[]}
      selectedProject={null}
      isRestoringProject={false}
      getProjectName={() => ''}
      getTaskTitle={() => null}
      formatDate={() => ''}
      onSelectTask={() => {}}
      onSelectChat={() => {}}
      onSelectProject={() => {}}
      onRestoreTask={() => {}}
      onRestoreChat={() => {}}
      onRestoreProject={() => {}}
      onDeleteTask={() => {}}
      onDeleteChat={() => {}}
      onDeleteProject={() => {}}
    />
  ),
};

export const ContentLoading: StoryObj<typeof ArchiveContent> = {
  render: () => (
    <ArchiveContent
      activeTab="tasks"
      isLoading={true}
      archivedTasks={[]}
      selectedTask={null}
      isRestoringTask={false}
      archivedChats={[]}
      selectedChat={null}
      isRestoringChat={false}
      archivedProjects={[]}
      selectedProject={null}
      isRestoringProject={false}
      getProjectName={() => ''}
      getTaskTitle={() => null}
      formatDate={() => ''}
      onSelectTask={() => {}}
      onSelectChat={() => {}}
      onSelectProject={() => {}}
      onRestoreTask={() => {}}
      onRestoreChat={() => {}}
      onRestoreProject={() => {}}
      onDeleteTask={() => {}}
      onDeleteChat={() => {}}
      onDeleteProject={() => {}}
    />
  ),
};
