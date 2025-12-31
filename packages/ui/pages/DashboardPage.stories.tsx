/**
 * Storybook stories for DashboardPage
 *
 * Demonstrates the complete dashboard page in various states:
 * - Default (populated with data)
 * - Loading state
 * - Empty state (no projects)
 * - With dialogs open
 * - Mobile viewport with drawer
 */

import type { Chat, ExecutorProfile, Project, Task } from '@openflow/generated';
import { ChatRole, SearchResultType, TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { Archive, MessageSquare, Plus, Search, Settings, Terminal } from 'lucide-react';
import type { CommandAction, RecentItem } from '../organisms/CommandPalette';
import type { StatusFilter } from '../organisms/Sidebar';
import { DashboardPage, type DashboardPageProps } from './DashboardPage';

const meta: Meta<typeof DashboardPage> = {
  title: 'Pages/DashboardPage',
  component: DashboardPage,
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
type Story = StoryObj<typeof DashboardPage>;

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
    updatedAt: '2024-01-01T00:00:00Z',
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
    updatedAt: '2024-01-02T00:00:00Z',
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
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

const mockTasks: Task[] = [
  {
    id: 'task-1',
    projectId: 'project-1',
    title: 'Implement user authentication',
    description: 'Add login and signup functionality with OAuth support',
    status: TaskStatus.Inprogress,
    actionsRequiredCount: 2,
    autoStartNextStep: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'task-2',
    projectId: 'project-1',
    title: 'Fix sidebar navigation bug',
    description: 'Navigation links not highlighting correctly on route change',
    status: TaskStatus.Todo,
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-14T09:00:00Z',
  },
  {
    id: 'task-3',
    projectId: 'project-1',
    title: 'Add dark mode support',
    description: 'Implement theme switching with system preference detection',
    status: TaskStatus.Done,
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-13T08:00:00Z',
    updatedAt: '2024-01-13T16:00:00Z',
  },
  {
    id: 'task-4',
    projectId: 'project-1',
    title: 'Refactor database layer',
    description: 'Improve query performance and add connection pooling',
    status: TaskStatus.Inreview,
    actionsRequiredCount: 1,
    autoStartNextStep: false,
    createdAt: '2024-01-12T11:00:00Z',
    updatedAt: '2024-01-14T10:00:00Z',
  },
  {
    id: 'task-5',
    projectId: 'project-1',
    title: 'Write unit tests',
    description: 'Add comprehensive test coverage for core modules',
    status: TaskStatus.Todo,
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-11T14:00:00Z',
    updatedAt: '2024-01-11T14:00:00Z',
  },
];

const mockChats: Chat[] = [
  {
    id: 'chat-1',
    projectId: 'project-1',
    title: 'Quick fix discussion',
    chatRole: ChatRole.Main,
    baseBranch: 'main',
    worktreeDeleted: false,
    isPlanContainer: false,
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:30:00Z',
  },
  {
    id: 'chat-2',
    projectId: 'project-1',
    title: 'Architecture review',
    chatRole: ChatRole.Review,
    baseBranch: 'main',
    worktreeDeleted: false,
    isPlanContainer: false,
    createdAt: '2024-01-14T15:00:00Z',
    updatedAt: '2024-01-14T16:00:00Z',
  },
];

const mockExecutorProfiles: ExecutorProfile[] = [
  {
    id: 'profile-1',
    name: 'Claude Code',
    description: 'Default Claude Code executor',
    command: 'claude',
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
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockCommandActions: CommandAction[] = [
  { id: 'search', label: 'Search...', shortcut: '/', icon: Search, onSelect: () => {} },
  { id: 'new-task', label: 'New Task', shortcut: 'n', icon: Plus, onSelect: () => {} },
  { id: 'new-chat', label: 'New Chat', shortcut: 'c', icon: MessageSquare, onSelect: () => {} },
  { id: 'new-terminal', label: 'New Terminal', shortcut: 't', icon: Terminal, onSelect: () => {} },
  { id: 'settings', label: 'Settings', shortcut: ',', icon: Settings, onSelect: () => {} },
  { id: 'archive', label: 'Archive', shortcut: 'a', icon: Archive, onSelect: () => {} },
];

const mockRecentItems: RecentItem[] = [
  {
    id: 'task-1',
    type: SearchResultType.Task,
    title: 'Implement user authentication',
    subtitle: 'OpenFlow',
  },
  {
    id: 'chat-1',
    type: SearchResultType.Chat,
    title: 'Quick fix discussion',
    subtitle: 'OpenFlow',
  },
  {
    id: 'project-1',
    type: SearchResultType.Project,
    title: 'OpenFlow',
    subtitle: '/Users/dev/openflow',
  },
];

// ============================================================================
// Helper functions
// ============================================================================

const noop = () => {};
const noopString = (_s: string) => {};
const noopStatus = (_s: StatusFilter) => {};
const noopTaskStatus = (_id: string, _status: TaskStatus) => {};
const noopBoolean = (_b: boolean) => {};
const noopCreateChat = (_data: {
  projectId: string;
  executorProfileId?: string;
  title?: string;
}) => {};

// ============================================================================
// Default Props Factory
// ============================================================================

function createDefaultProps(overrides?: Partial<DashboardPageProps>): DashboardPageProps {
  return {
    sidebarCollapsed: false,
    isMobileDrawerOpen: false,
    onMobileDrawerToggle: noopBoolean,
    sidebar: {
      projects: mockProjects,
      tasks: mockTasks,
      chats: mockChats,
      selectedProjectId: 'project-1',
      statusFilter: 'all' as StatusFilter,
      onSelectProject: noopString,
      onSelectTask: noopString,
      onSelectChat: noopString,
      onNewTask: noop,
      onNewChat: noop,
      onNewProject: noop,
      onStatusFilter: noopStatus,
      onTaskStatusChange: noopTaskStatus,
      onSettingsClick: noop,
      onArchiveClick: noop,
      isCollapsed: false,
      onToggleCollapse: noop,
    },
    header: {
      title: 'OpenFlow',
      subtitle: '3 tasks in progress',
      onSearch: noop,
      onNewChat: noop,
      onNewTerminal: noop,
    },
    content: {
      isLoadingProjects: false,
      isLoadingTasks: false,
      activeProjectId: 'project-1',
      tasks: mockTasks,
      onSelectTask: noopString,
      onNewProject: noop,
    },
    commandPalette: {
      isOpen: false,
      onClose: noop,
      onSearch: noopString,
      actions: mockCommandActions,
      recentItems: mockRecentItems,
    },
    createProjectDialog: {
      isOpen: false,
      onClose: noop,
      projectName: '',
      onProjectNameChange: noopString,
      projectPath: '',
      onProjectPathChange: noopString,
      onBrowseFolder: noop,
      onCreate: noop,
      isPending: false,
      error: null,
    },
    createTaskDialog: {
      isOpen: false,
      onClose: noop,
      taskTitle: '',
      onTaskTitleChange: noopString,
      taskDescription: '',
      onTaskDescriptionChange: noopString,
      onCreate: noop,
      isPending: false,
      error: null,
    },
    newChatDialog: {
      isOpen: false,
      onClose: noop,
      projects: mockProjects,
      executorProfiles: mockExecutorProfiles,
      selectedProjectId: 'project-1',
      isSubmitting: false,
      onCreate: noopCreateChat,
      onNewProject: noop,
    },
    ...overrides,
  };
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Default dashboard with populated data
 */
export const Default: Story = {
  args: createDefaultProps(),
};

/**
 * Dashboard with collapsed sidebar
 */
export const CollapsedSidebar: Story = {
  args: createDefaultProps({
    sidebarCollapsed: true,
    sidebar: {
      ...createDefaultProps().sidebar,
      isCollapsed: true,
    },
  }),
};

/**
 * Dashboard in loading state - projects are loading
 */
export const LoadingProjects: Story = {
  args: createDefaultProps({
    content: {
      ...createDefaultProps().content,
      isLoadingProjects: true,
      isLoadingTasks: true,
      tasks: [],
    },
  }),
};

/**
 * Dashboard in loading state - tasks are loading
 */
export const LoadingTasks: Story = {
  args: createDefaultProps({
    content: {
      ...createDefaultProps().content,
      isLoadingTasks: true,
      tasks: [],
    },
  }),
};

/**
 * Empty state - no projects exist
 */
export const EmptyNoProjects: Story = {
  args: createDefaultProps({
    sidebar: {
      ...createDefaultProps().sidebar,
      projects: [],
      tasks: [],
      chats: [],
      selectedProjectId: undefined,
    },
    header: {
      ...createDefaultProps().header,
      title: 'OpenFlow',
      subtitle: undefined,
    },
    content: {
      ...createDefaultProps().content,
      activeProjectId: undefined,
      tasks: [],
    },
  }),
};

/**
 * Empty state - project selected but no tasks
 */
export const EmptyNoTasks: Story = {
  args: createDefaultProps({
    sidebar: {
      ...createDefaultProps().sidebar,
      tasks: [],
    },
    header: {
      ...createDefaultProps().header,
      subtitle: 'No tasks yet',
    },
    content: {
      ...createDefaultProps().content,
      tasks: [],
    },
  }),
};

/**
 * Dashboard with filtered tasks - In Progress only
 */
export const FilteredInProgress: Story = {
  args: createDefaultProps({
    sidebar: {
      ...createDefaultProps().sidebar,
      statusFilter: TaskStatus.Inprogress as StatusFilter,
      tasks: mockTasks.filter((t) => t.status === TaskStatus.Inprogress),
    },
    content: {
      ...createDefaultProps().content,
      tasks: mockTasks.filter((t) => t.status === TaskStatus.Inprogress),
    },
  }),
};

/**
 * Dashboard with command palette open
 */
export const WithCommandPaletteOpen: Story = {
  args: createDefaultProps({
    commandPalette: {
      ...createDefaultProps().commandPalette,
      isOpen: true,
    },
  }),
};

/**
 * Dashboard with create project dialog open
 */
export const WithCreateProjectDialogOpen: Story = {
  args: createDefaultProps({
    createProjectDialog: {
      ...createDefaultProps().createProjectDialog,
      isOpen: true,
    },
  }),
};

/**
 * Dashboard with create project dialog - filled form
 */
export const WithCreateProjectDialogFilled: Story = {
  args: createDefaultProps({
    createProjectDialog: {
      ...createDefaultProps().createProjectDialog,
      isOpen: true,
      projectName: 'My New Project',
      projectPath: '/Users/dev/my-new-project',
    },
  }),
};

/**
 * Dashboard with create project dialog - submitting
 */
export const WithCreateProjectDialogPending: Story = {
  args: createDefaultProps({
    createProjectDialog: {
      ...createDefaultProps().createProjectDialog,
      isOpen: true,
      projectName: 'My New Project',
      projectPath: '/Users/dev/my-new-project',
      isPending: true,
    },
  }),
};

/**
 * Dashboard with create project dialog - error state
 */
export const WithCreateProjectDialogError: Story = {
  args: createDefaultProps({
    createProjectDialog: {
      ...createDefaultProps().createProjectDialog,
      isOpen: true,
      projectName: 'My New Project',
      projectPath: '/invalid/path',
      error: 'The specified path is not a valid git repository',
    },
  }),
};

/**
 * Dashboard with create task dialog open
 */
export const WithCreateTaskDialogOpen: Story = {
  args: createDefaultProps({
    createTaskDialog: {
      ...createDefaultProps().createTaskDialog,
      isOpen: true,
    },
  }),
};

/**
 * Dashboard with create task dialog - filled form
 */
export const WithCreateTaskDialogFilled: Story = {
  args: createDefaultProps({
    createTaskDialog: {
      ...createDefaultProps().createTaskDialog,
      isOpen: true,
      taskTitle: 'Implement new feature',
      taskDescription: 'Add the ability to export data to CSV format',
    },
  }),
};

/**
 * Dashboard with new chat dialog open
 */
export const WithNewChatDialogOpen: Story = {
  args: createDefaultProps({
    newChatDialog: {
      ...createDefaultProps().newChatDialog,
      isOpen: true,
    },
  }),
};

/**
 * Dashboard with new chat dialog - submitting
 */
export const WithNewChatDialogSubmitting: Story = {
  args: createDefaultProps({
    newChatDialog: {
      ...createDefaultProps().newChatDialog,
      isOpen: true,
      isSubmitting: true,
    },
  }),
};

/**
 * Mobile viewport with drawer closed
 */
export const MobileDrawerClosed: Story = {
  args: createDefaultProps({
    isMobileDrawerOpen: false,
  }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Mobile viewport with drawer open
 */
export const MobileDrawerOpen: Story = {
  args: createDefaultProps({
    isMobileDrawerOpen: true,
  }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Different project selected
 */
export const DifferentProjectSelected: Story = {
  args: createDefaultProps({
    sidebar: {
      ...createDefaultProps().sidebar,
      selectedProjectId: 'project-2',
      tasks: [], // Different project has no tasks
      chats: [],
    },
    header: {
      title: 'Auth Service',
      subtitle: 'No tasks yet',
      onSearch: noop,
      onNewChat: noop,
      onNewTerminal: noop,
    },
    content: {
      isLoadingProjects: false,
      isLoadingTasks: false,
      activeProjectId: 'project-2',
      tasks: [],
      onSelectTask: noopString,
      onNewProject: noop,
    },
  }),
};

/**
 * Dashboard with many projects (scrollable sidebar)
 */
export const ManyProjects: Story = {
  args: createDefaultProps({
    sidebar: {
      ...createDefaultProps().sidebar,
      projects: [
        ...mockProjects,
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `project-extra-${i}`,
          name: `Project ${i + 4}`,
          gitRepoPath: `/Users/dev/project-${i + 4}`,
          baseBranch: 'main',
          setupScript: 'npm install',
          devScript: 'npm run dev',
          workflowsFolder: '.openflow/workflows',
          icon: 'folder',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        })),
      ],
    },
  }),
};

/**
 * Dashboard with many tasks (scrollable content)
 */
export const ManyTasks: Story = {
  args: (() => {
    const manyTasks: Task[] = [
      ...mockTasks,
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `task-extra-${i}`,
        projectId: 'project-1',
        title: `Additional task ${i + 6}`,
        description: `Description for task ${i + 6}`,
        status: [TaskStatus.Todo, TaskStatus.Inprogress, TaskStatus.Inreview, TaskStatus.Done][
          i % 4
        ] as TaskStatus,
        actionsRequiredCount: i % 3,
        autoStartNextStep: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })),
    ];
    return createDefaultProps({
      sidebar: {
        ...createDefaultProps().sidebar,
        tasks: manyTasks,
      },
      content: {
        ...createDefaultProps().content,
        tasks: manyTasks,
      },
    });
  })(),
};
