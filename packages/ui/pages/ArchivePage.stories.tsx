/**
 * Storybook stories for ArchivePage
 *
 * Demonstrates the complete archive page in various states:
 * - Default (with archived items)
 * - Loading state
 * - Empty states (no items per tab)
 * - With confirm dialog open
 * - Different tabs selected
 * - Mobile viewport
 */

import type { Chat, Project, Task } from '@openflow/generated';
import { ChatRole, TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import type { ArchiveTab } from '../organisms/ArchivePageComponents';
import { ArchivePage, type ArchivePageProps } from './ArchivePage';

const meta: Meta<typeof ArchivePage> = {
  title: 'Pages/ArchivePage',
  component: ArchivePage,
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
type Story = StoryObj<typeof ArchivePage>;

// ============================================================================
// Mock Data
// ============================================================================

const mockArchivedTasks: Task[] = [
  {
    id: 'task-1',
    projectId: 'project-1',
    title: 'Implement user authentication',
    description: 'Add login and signup functionality with OAuth support',
    status: TaskStatus.Done,
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    archivedAt: '2024-01-20T10:00:00Z',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'task-2',
    projectId: 'project-1',
    title: 'Fix sidebar navigation bug',
    description: 'Navigation links not highlighting correctly on route change',
    status: TaskStatus.Done,
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    archivedAt: '2024-01-19T09:00:00Z',
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-19T09:00:00Z',
  },
  {
    id: 'task-3',
    projectId: 'project-2',
    title: 'Add dark mode support',
    description: 'Implement theme switching with system preference detection',
    status: TaskStatus.Done,
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    archivedAt: '2024-01-18T16:00:00Z',
    createdAt: '2024-01-13T08:00:00Z',
    updatedAt: '2024-01-18T16:00:00Z',
  },
];

const mockArchivedChats: Chat[] = [
  {
    id: 'chat-1',
    projectId: 'project-1',
    title: 'Feature discussion - Auth flow',
    chatRole: ChatRole.Main,
    baseBranch: 'main',
    worktreeDeleted: true,
    isPlanContainer: false,
    archivedAt: '2024-01-20T11:00:00Z',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-20T11:00:00Z',
  },
  {
    id: 'chat-2',
    projectId: 'project-1',
    title: 'Bug fix session',
    chatRole: ChatRole.Review,
    baseBranch: 'main',
    worktreeDeleted: true,
    isPlanContainer: false,
    archivedAt: '2024-01-19T14:00:00Z',
    createdAt: '2024-01-14T15:00:00Z',
    updatedAt: '2024-01-19T14:00:00Z',
  },
];

const mockArchivedProjects: Project[] = [
  {
    id: 'project-archived-1',
    name: 'Legacy API',
    gitRepoPath: '/Users/dev/legacy-api',
    baseBranch: 'main',
    setupScript: 'npm install',
    devScript: 'npm run dev',
    workflowsFolder: '.openflow/workflows',
    icon: 'folder',
    archivedAt: '2024-01-18T12:00:00Z',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-01-18T12:00:00Z',
  },
];

const mockProjectsMap: Record<string, string> = {
  'project-1': 'OpenFlow',
  'project-2': 'Auth Service',
  'project-archived-1': 'Legacy API',
};

// ============================================================================
// Helper functions
// ============================================================================

const noop = () => {};
const noopTab = (_tab: ArchiveTab) => {};
const noopTask = (_task: Task) => {};
const noopChat = (_chat: Chat) => {};
const noopProject = (_project: Project) => {};

// ============================================================================
// Default Props Factory
// ============================================================================

function createDefaultProps(overrides?: Partial<ArchivePageProps>): ArchivePageProps {
  return {
    isLoading: false,
    header: {
      archivedCount: mockArchivedTasks.length,
      activeTab: 'tasks' as ArchiveTab,
      onSearch: noop,
    },
    tabBar: {
      activeTab: 'tasks' as ArchiveTab,
      onTabChange: noopTab,
      taskCount: mockArchivedTasks.length,
      chatCount: mockArchivedChats.length,
      projectCount: mockArchivedProjects.length,
      onBack: noop,
    },
    tasks: {
      archivedTasks: mockArchivedTasks,
      selectedTask: null,
      isRestoringTask: false,
      onSelectTask: noopTask,
      onRestoreTask: noopTask,
      onDeleteTask: noopTask,
    },
    chats: {
      archivedChats: mockArchivedChats,
      selectedChat: null,
      isRestoringChat: false,
      onSelectChat: noopChat,
      onRestoreChat: noopChat,
      onDeleteChat: noopChat,
    },
    projects: {
      archivedProjects: mockArchivedProjects,
      selectedProject: null,
      isRestoringProject: false,
      onSelectProject: noopProject,
      onRestoreProject: noopProject,
      onDeleteProject: noopProject,
    },
    helpers: {
      getProjectName: (projectId: string) => mockProjectsMap[projectId] ?? 'Unknown Project',
      getTaskTitle: (_taskId: string | null | undefined) => null,
      formatDate: (dateString: string | null | undefined) => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleDateString();
      },
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
 * Default archive page with tasks tab active
 */
export const Default: Story = {
  args: createDefaultProps(),
};

/**
 * Archive page in loading state
 */
export const Loading: Story = {
  args: createDefaultProps({
    isLoading: true,
  }),
};

/**
 * Archive page with chats tab active
 */
export const ChatsTab: Story = {
  args: createDefaultProps({
    header: {
      archivedCount: mockArchivedChats.length,
      activeTab: 'chats' as ArchiveTab,
      onSearch: noop,
    },
    tabBar: {
      ...createDefaultProps().tabBar,
      activeTab: 'chats' as ArchiveTab,
    },
  }),
};

/**
 * Archive page with projects tab active
 */
export const ProjectsTab: Story = {
  args: createDefaultProps({
    header: {
      archivedCount: mockArchivedProjects.length,
      activeTab: 'projects' as ArchiveTab,
      onSearch: noop,
    },
    tabBar: {
      ...createDefaultProps().tabBar,
      activeTab: 'projects' as ArchiveTab,
    },
  }),
};

/**
 * Empty tasks tab
 */
export const EmptyTasksTab: Story = {
  args: createDefaultProps({
    header: {
      archivedCount: 0,
      activeTab: 'tasks' as ArchiveTab,
      onSearch: noop,
    },
    tabBar: {
      ...createDefaultProps().tabBar,
      taskCount: 0,
    },
    tasks: {
      ...createDefaultProps().tasks,
      archivedTasks: [],
    },
  }),
};

/**
 * Empty chats tab
 */
export const EmptyChatsTab: Story = {
  args: createDefaultProps({
    header: {
      archivedCount: 0,
      activeTab: 'chats' as ArchiveTab,
      onSearch: noop,
    },
    tabBar: {
      ...createDefaultProps().tabBar,
      activeTab: 'chats' as ArchiveTab,
      chatCount: 0,
    },
    chats: {
      ...createDefaultProps().chats,
      archivedChats: [],
    },
  }),
};

/**
 * Empty projects tab
 */
export const EmptyProjectsTab: Story = {
  args: createDefaultProps({
    header: {
      archivedCount: 0,
      activeTab: 'projects' as ArchiveTab,
      onSearch: noop,
    },
    tabBar: {
      ...createDefaultProps().tabBar,
      activeTab: 'projects' as ArchiveTab,
      projectCount: 0,
    },
    projects: {
      ...createDefaultProps().projects,
      archivedProjects: [],
    },
  }),
};

/**
 * All tabs empty
 */
export const CompletelyEmpty: Story = {
  args: createDefaultProps({
    header: {
      archivedCount: 0,
      activeTab: 'tasks' as ArchiveTab,
      onSearch: noop,
    },
    tabBar: {
      ...createDefaultProps().tabBar,
      taskCount: 0,
      chatCount: 0,
      projectCount: 0,
    },
    tasks: {
      ...createDefaultProps().tasks,
      archivedTasks: [],
    },
    chats: {
      ...createDefaultProps().chats,
      archivedChats: [],
    },
    projects: {
      ...createDefaultProps().projects,
      archivedProjects: [],
    },
  }),
};

/**
 * Task selected in list
 */
export const TaskSelected: Story = {
  args: createDefaultProps({
    tasks: {
      ...createDefaultProps().tasks,
      selectedTask: mockArchivedTasks[0] ?? null,
    },
  }),
};

/**
 * Restoring a task
 */
export const RestoringTask: Story = {
  args: createDefaultProps({
    tasks: {
      ...createDefaultProps().tasks,
      selectedTask: mockArchivedTasks[0] ?? null,
      isRestoringTask: true,
    },
  }),
};

/**
 * Confirm dialog open for delete
 */
export const WithConfirmDialogOpen: Story = {
  args: createDefaultProps({
    tasks: {
      ...createDefaultProps().tasks,
      selectedTask: mockArchivedTasks[0] ?? null,
    },
    confirmDialog: {
      isOpen: true,
      onClose: noop,
      onConfirm: noop,
      title: 'Delete Task',
      description:
        'Are you sure you want to permanently delete "Implement user authentication"? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    },
  }),
};

/**
 * Confirm dialog with loading state
 */
export const ConfirmDialogLoading: Story = {
  args: createDefaultProps({
    confirmDialog: {
      isOpen: true,
      onClose: noop,
      onConfirm: noop,
      title: 'Delete Task',
      description:
        'Are you sure you want to permanently delete "Implement user authentication"? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
      loading: true,
    },
  }),
};

/**
 * Many archived tasks (scrollable list)
 */
export const ManyArchivedTasks: Story = {
  args: (() => {
    const manyTasks: Task[] = [
      ...mockArchivedTasks,
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `task-extra-${i}`,
        projectId: 'project-1',
        title: `Archived task ${i + 4}`,
        description: `Description for archived task ${i + 4}`,
        status: TaskStatus.Done,
        actionsRequiredCount: 0,
        autoStartNextStep: false,
        archivedAt: '2024-01-15T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      })),
    ];
    return createDefaultProps({
      header: {
        archivedCount: manyTasks.length,
        activeTab: 'tasks' as ArchiveTab,
        onSearch: noop,
      },
      tabBar: {
        ...createDefaultProps().tabBar,
        taskCount: manyTasks.length,
      },
      tasks: {
        ...createDefaultProps().tasks,
        archivedTasks: manyTasks,
      },
    });
  })(),
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
