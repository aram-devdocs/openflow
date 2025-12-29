import type { Project, Task, TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar, type StatusFilter } from './Sidebar';

const meta: Meta<typeof Sidebar> = {
  title: 'Organisms/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="flex h-[600px] bg-[rgb(var(--background))]">
        <Story />
        <div className="flex-1 p-4">
          <p className="text-[rgb(var(--muted-foreground))]">Main content area</p>
        </div>
      </div>
    ),
  ],
  argTypes: {
    onSelectProject: { action: 'project selected' },
    onSelectTask: { action: 'task selected' },
    onNewTask: { action: 'new task clicked' },
    onNewProject: { action: 'new project clicked' },
    onStatusFilter: { action: 'status filter changed' },
    onTaskStatusChange: { action: 'task status changed' },
    onSettingsClick: { action: 'settings clicked' },
    onArchiveClick: { action: 'archive clicked' },
    onToggleCollapse: { action: 'toggle collapse' },
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

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
];

// Mock task data
const mockTasks: Task[] = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    title: 'Implement user authentication',
    description: 'Add OAuth2 login flow with Google and GitHub providers',
    status: 'inprogress' as TaskStatus,
    actionsRequiredCount: 2,
    autoStartNextStep: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
  },
  {
    id: 'task-2',
    projectId: 'proj-1',
    title: 'Fix database connection pool',
    description: 'Connections are not being released properly',
    status: 'todo' as TaskStatus,
    actionsRequiredCount: 0,
    autoStartNextStep: true,
    createdAt: '2024-01-14T08:00:00Z',
    updatedAt: '2024-01-14T08:00:00Z',
  },
  {
    id: 'task-3',
    projectId: 'proj-1',
    title: 'Add unit tests for auth module',
    description: 'Cover login, logout, and session management',
    status: 'inreview' as TaskStatus,
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-13T12:00:00Z',
    updatedAt: '2024-01-19T10:00:00Z',
  },
  {
    id: 'task-4',
    projectId: 'proj-1',
    title: 'Update documentation',
    description: 'Document the new API endpoints and authentication flow',
    status: 'done' as TaskStatus,
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-12T09:00:00Z',
    updatedAt: '2024-01-18T14:00:00Z',
  },
  {
    id: 'task-5',
    projectId: 'proj-1',
    title: 'Refactor settings page',
    description: 'Old approach using class components',
    status: 'cancelled' as TaskStatus,
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-10T11:00:00Z',
    updatedAt: '2024-01-15T16:00:00Z',
  },
  {
    id: 'task-6',
    projectId: 'proj-1',
    title: 'Optimize bundle size',
    description: 'Reduce initial load time by code splitting',
    status: 'todo' as TaskStatus,
    actionsRequiredCount: 1,
    autoStartNextStep: false,
    createdAt: '2024-01-09T10:00:00Z',
    updatedAt: '2024-01-09T10:00:00Z',
  },
];

/**
 * Default sidebar with projects and tasks.
 */
export const Default: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    selectedProjectId: 'proj-1',
    selectedTaskId: 'task-1',
    statusFilter: 'all',
    isCollapsed: false,
  },
};

/**
 * Collapsed sidebar showing only icons.
 */
export const Collapsed: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    selectedProjectId: 'proj-1',
    selectedTaskId: 'task-1',
    statusFilter: 'all',
    isCollapsed: true,
  },
};

/**
 * Filter set to show only "In Progress" tasks.
 */
export const FilteredInProgress: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    selectedProjectId: 'proj-1',
    statusFilter: 'inprogress' as StatusFilter,
    isCollapsed: false,
  },
};

/**
 * Filter set to show only "To Do" tasks.
 */
export const FilteredTodo: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    selectedProjectId: 'proj-1',
    statusFilter: 'todo' as StatusFilter,
    isCollapsed: false,
  },
};

/**
 * Filter set to show only "Done" tasks.
 */
export const FilteredDone: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    selectedProjectId: 'proj-1',
    statusFilter: 'done' as StatusFilter,
    isCollapsed: false,
  },
};

/**
 * Empty tasks state - no tasks in the project.
 */
export const EmptyTasks: Story = {
  args: {
    projects: mockProjects,
    tasks: [],
    selectedProjectId: 'proj-1',
    statusFilter: 'all',
    isCollapsed: false,
  },
};

/**
 * No project selected.
 */
export const NoProjectSelected: Story = {
  args: {
    projects: mockProjects,
    tasks: [],
    selectedProjectId: undefined,
    statusFilter: 'all',
    isCollapsed: false,
  },
};

/**
 * Empty state - no projects or tasks.
 */
export const EmptyState: Story = {
  args: {
    projects: [],
    tasks: [],
    selectedProjectId: undefined,
    statusFilter: 'all',
    isCollapsed: false,
  },
};

/**
 * Many tasks with scrolling.
 */
export const ManyTasks: Story = {
  args: {
    projects: mockProjects,
    tasks: [
      ...mockTasks,
      {
        id: 'task-7',
        projectId: 'proj-1',
        title: 'Add dark mode support',
        description: 'Implement theme switching with persistence',
        status: 'todo' as TaskStatus,
        actionsRequiredCount: 0,
        autoStartNextStep: false,
        createdAt: '2024-01-08T10:00:00Z',
        updatedAt: '2024-01-08T10:00:00Z',
      },
      {
        id: 'task-8',
        projectId: 'proj-1',
        title: 'Implement keyboard shortcuts',
        description: 'Add common shortcuts for power users',
        status: 'inprogress' as TaskStatus,
        actionsRequiredCount: 0,
        autoStartNextStep: true,
        createdAt: '2024-01-07T10:00:00Z',
        updatedAt: '2024-01-19T11:00:00Z',
      },
      {
        id: 'task-9',
        projectId: 'proj-1',
        title: 'Fix mobile responsive issues',
        description: 'Sidebar overlaps content on small screens',
        status: 'todo' as TaskStatus,
        actionsRequiredCount: 0,
        autoStartNextStep: false,
        createdAt: '2024-01-06T10:00:00Z',
        updatedAt: '2024-01-06T10:00:00Z',
      },
      {
        id: 'task-10',
        projectId: 'proj-1',
        title: 'Add export to PDF feature',
        description: 'Allow users to export reports as PDF',
        status: 'done' as TaskStatus,
        actionsRequiredCount: 0,
        autoStartNextStep: false,
        createdAt: '2024-01-05T10:00:00Z',
        updatedAt: '2024-01-17T14:00:00Z',
      },
      {
        id: 'task-11',
        projectId: 'proj-1',
        title: 'Implement search functionality',
        description: 'Full-text search across tasks and projects',
        status: 'inreview' as TaskStatus,
        actionsRequiredCount: 1,
        autoStartNextStep: false,
        createdAt: '2024-01-04T10:00:00Z',
        updatedAt: '2024-01-18T09:00:00Z',
      },
      {
        id: 'task-12',
        projectId: 'proj-1',
        title: 'Add activity log',
        description: 'Track user actions for audit purposes',
        status: 'todo' as TaskStatus,
        actionsRequiredCount: 0,
        autoStartNextStep: false,
        createdAt: '2024-01-03T10:00:00Z',
        updatedAt: '2024-01-03T10:00:00Z',
      },
    ],
    selectedProjectId: 'proj-1',
    selectedTaskId: 'task-1',
    statusFilter: 'all',
    isCollapsed: false,
  },
};

/**
 * Task with actions required highlighted.
 */
export const TasksWithActions: Story = {
  args: {
    projects: mockProjects,
    tasks: [
      {
        id: 'task-action-1',
        projectId: 'proj-1',
        title: 'Review pull request',
        description: 'PR #42 needs code review before merge',
        status: 'inprogress' as TaskStatus,
        actionsRequiredCount: 3,
        autoStartNextStep: false,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
      },
      {
        id: 'task-action-2',
        projectId: 'proj-1',
        title: 'Deploy to staging',
        description: 'Waiting for approval',
        status: 'inreview' as TaskStatus,
        actionsRequiredCount: 1,
        autoStartNextStep: false,
        createdAt: '2024-01-14T08:00:00Z',
        updatedAt: '2024-01-19T12:00:00Z',
      },
      {
        id: 'task-action-3',
        projectId: 'proj-1',
        title: 'Update dependencies',
        description: 'Security patches available',
        status: 'todo' as TaskStatus,
        actionsRequiredCount: 5,
        autoStartNextStep: false,
        createdAt: '2024-01-13T12:00:00Z',
        updatedAt: '2024-01-13T12:00:00Z',
      },
    ],
    selectedProjectId: 'proj-1',
    statusFilter: 'all',
    isCollapsed: false,
  },
};

/**
 * Filtered view with no matching tasks.
 */
export const FilteredNoResults: Story = {
  args: {
    projects: mockProjects,
    tasks: [
      {
        id: 'task-only-done',
        projectId: 'proj-1',
        title: 'Completed task',
        status: 'done' as TaskStatus,
        actionsRequiredCount: 0,
        autoStartNextStep: false,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
      },
    ],
    selectedProjectId: 'proj-1',
    statusFilter: 'inprogress' as StatusFilter, // No in-progress tasks
    isCollapsed: false,
  },
};

/**
 * Task with long title (tests truncation).
 */
export const LongTaskTitles: Story = {
  args: {
    projects: mockProjects,
    tasks: [
      {
        id: 'task-long-1',
        projectId: 'proj-1',
        title:
          'This is a very long task title that should be truncated when displayed in the sidebar task list',
        description: 'This description is also quite long and should be truncated appropriately',
        status: 'inprogress' as TaskStatus,
        actionsRequiredCount: 0,
        autoStartNextStep: false,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
      },
      {
        id: 'task-long-2',
        projectId: 'proj-1',
        title: 'Another extremely long task title that tests the UI truncation behavior',
        status: 'todo' as TaskStatus,
        actionsRequiredCount: 2,
        autoStartNextStep: false,
        createdAt: '2024-01-14T08:00:00Z',
        updatedAt: '2024-01-14T08:00:00Z',
      },
    ],
    selectedProjectId: 'proj-1',
    statusFilter: 'all',
    isCollapsed: false,
  },
};
