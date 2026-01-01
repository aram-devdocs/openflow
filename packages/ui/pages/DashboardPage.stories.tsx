/**
 * Storybook stories for DashboardPage
 *
 * Demonstrates the complete dashboard page in various states:
 * - Default (populated with data)
 * - Loading state with skeleton
 * - Error state with retry
 * - Empty state (no projects)
 * - With dialogs open
 * - Mobile viewport with drawer
 * - Accessibility demos (screen reader, keyboard, focus)
 *
 * @module pages/DashboardPage.stories
 */

import type { Chat, ExecutorProfile, Project, Task } from '@openflow/generated';
import { ChatRole, SearchResultType, TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { Archive, MessageSquare, Plus, Search, Settings, Terminal } from 'lucide-react';
import { useRef, useState } from 'react';
import type { CommandAction, RecentItem } from '../organisms/CommandPalette';
import type { StatusFilter } from '../organisms/Sidebar';
import {
  // Constants
  DASHBOARD_PAGE_BASE_CLASSES,
  DASHBOARD_PAGE_ERROR_CLASSES,
  DASHBOARD_PAGE_SKELETON_CLASSES,
  DASHBOARD_PAGE_SKELETON_HEADER_CLASSES,
  DASHBOARD_PAGE_SKELETON_MAIN_CLASSES,
  DASHBOARD_PAGE_SKELETON_SIDEBAR_CLASSES,
  DEFAULT_ERROR_DESCRIPTION,
  DEFAULT_ERROR_TITLE,
  DEFAULT_PAGE_LABEL,
  DEFAULT_PAGE_SIZE,
  DEFAULT_RETRY_LABEL,
  DEFAULT_SKELETON_PROJECT_COUNT,
  DEFAULT_SKELETON_TASK_COUNT,
  // Main component
  DashboardPage,
  // Sub-components
  DashboardPageError,
  // Props types
  type DashboardPageProps,
  DashboardPageSkeleton,
  PAGE_SIZE_GAP,
  PAGE_SIZE_PADDING,
  SR_EMPTY,
  SR_ERROR_PREFIX,
  SR_LOADED_PREFIX,
  SR_LOADING,
  // Utility functions
  buildLoadedAnnouncement,
  buildPageAccessibleLabel,
  getBaseSize,
  getResponsiveSizeClasses,
} from './DashboardPage';

const meta: Meta<typeof DashboardPage> = {
  title: 'Pages/DashboardPage',
  component: DashboardPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
DashboardPage is a stateless page component that composes the complete dashboard view.
It receives all data and callbacks via props, making it fully testable in Storybook.

## Accessibility Features

- **Page Structure**: Proper landmark structure with main and region roles
- **Heading Hierarchy**: h1 for page title with proper hierarchy
- **Screen Reader Announcements**: Loading, error, and empty states are announced
- **Focus Management**: forwardRef support for programmatic focus control
- **Responsive Layout**: Adapts to all screen sizes (sm, md, lg)
- **Error Handling**: Error state with retry button and proper ARIA

## States

- **Loading**: Shows skeleton placeholders with loading announcement
- **Error**: Shows error message with retry button and assertive announcement
- **Empty**: Shows empty state when no projects exist
- **Loaded**: Shows full dashboard with content announcement
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-screen w-screen">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    isLoading: {
      control: 'boolean',
      description: 'Whether the page is in loading state',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Responsive size variant',
    },
    'aria-label': {
      control: 'text',
      description: 'Custom accessible label for the page',
    },
    'data-testid': {
      control: 'text',
      description: 'Data test ID for automated testing',
    },
  },
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
    isLoading: false,
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
// Basic Stories
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

// ============================================================================
// Loading States
// ============================================================================

/**
 * Dashboard in page-level loading state with skeleton
 */
export const Loading: Story = {
  args: createDefaultProps({
    isLoading: true,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Shows the loading skeleton while the page data is being fetched. Screen readers announce "Loading dashboard. Please wait."',
      },
    },
  },
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

// ============================================================================
// Error States
// ============================================================================

/**
 * Dashboard in error state with retry button
 */
export const ErrorState: Story = {
  args: createDefaultProps({
    error: new Error('Failed to connect to the server. Please check your network connection.'),
    onRetry: () => alert('Retry clicked!'),
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Shows the error state with a retry button. Screen readers announce the error assertively.',
      },
    },
  },
};

/**
 * Dashboard error with generic message
 */
export const ErrorGeneric: Story = {
  args: createDefaultProps({
    error: new Error(''),
    onRetry: () => alert('Retry clicked!'),
  }),
  parameters: {
    docs: {
      description: {
        story: 'Shows error with default description when no specific error message is provided.',
      },
    },
  },
};

// ============================================================================
// Empty States
// ============================================================================

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

// ============================================================================
// Filtered Views
// ============================================================================

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

// ============================================================================
// Dialog States
// ============================================================================

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

// ============================================================================
// Mobile Views
// ============================================================================

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

// ============================================================================
// Project Variations
// ============================================================================

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

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size variant
 */
export const SizeSmall: Story = {
  args: createDefaultProps({
    size: 'sm',
  }),
};

/**
 * Medium size variant (default)
 */
export const SizeMedium: Story = {
  args: createDefaultProps({
    size: 'md',
  }),
};

/**
 * Large size variant
 */
export const SizeLarge: Story = {
  args: createDefaultProps({
    size: 'lg',
  }),
};

/**
 * Responsive size (changes at breakpoints)
 */
export const ResponsiveSizing: Story = {
  args: createDefaultProps({
    size: { base: 'sm', md: 'md', lg: 'lg' },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Size changes based on viewport: sm on mobile, md on tablet, lg on desktop.',
      },
    },
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Skeleton component demo - for loading state
 */
export const SkeletonDemo: Story = {
  render: () => (
    <div className="p-6">
      <h2 className="mb-4 text-xl font-bold">Loading Skeleton</h2>
      <p className="mb-4 text-sm text-[rgb(var(--muted-foreground))]">
        This skeleton is shown during page loading. It has aria-hidden="true" and
        role="presentation" to hide from screen readers. A separate VisuallyHidden component
        announces "Loading dashboard. Please wait." to screen readers.
      </p>
      <div className="h-[600px] overflow-hidden rounded-lg border">
        <DashboardPageSkeleton taskCount={5} projectCount={3} data-testid="skeleton-demo" />
      </div>
    </div>
  ),
};

/**
 * Error component demo - for error state
 */
export const ErrorDemo: Story = {
  render: () => (
    <div className="p-6">
      <h2 className="mb-4 text-xl font-bold">Error State</h2>
      <p className="mb-4 text-sm text-[rgb(var(--muted-foreground))]">
        This error state is shown when data loading fails. It uses role="alert" with
        aria-live="assertive" to immediately announce the error to screen readers. The retry button
        meets WCAG 2.5.5 touch target size requirements (minimum 44x44px).
      </p>
      <div className="flex items-center justify-center rounded-lg border p-8">
        <DashboardPageError
          error={
            new Error('Failed to connect to the server. Please check your network connection.')
          }
          onRetry={() => alert('Retry clicked!')}
          data-testid="error-demo"
        />
      </div>
    </div>
  ),
};

/**
 * Focus management demo with ref forwarding
 */
export const RefForwardingDemo: Story = {
  render: function RefDemo() {
    const pageRef = useRef<HTMLDivElement>(null);

    const handleFocusPage = () => {
      pageRef.current?.focus();
    };

    return (
      <div className="flex h-screen flex-col">
        <div className="border-b bg-[rgb(var(--muted))] p-4">
          <button
            onClick={handleFocusPage}
            className="rounded bg-[rgb(var(--primary))] px-4 py-2 text-[rgb(var(--primary-foreground))]"
          >
            Focus Page Container
          </button>
          <span className="ml-4 text-sm text-[rgb(var(--muted-foreground))]">
            Click to programmatically focus the page (useful for skip links)
          </span>
        </div>
        <div className="flex-1">
          <DashboardPage ref={pageRef} {...createDefaultProps()} />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates ref forwarding for programmatic focus management. Useful for skip links and focus restoration.',
      },
    },
  },
};

/**
 * Data attributes demo for testing
 */
export const DataAttributesDemo: Story = {
  render: () => (
    <div className="p-6">
      <h2 className="mb-4 text-xl font-bold">Data Attributes</h2>
      <p className="mb-4 text-sm text-[rgb(var(--muted-foreground))]">
        The component exposes data attributes for testing and state inspection:
      </p>
      <ul className="mb-4 list-inside list-disc text-sm">
        <li>
          <code>data-testid</code> - For automated testing
        </li>
        <li>
          <code>data-state</code> - Current page state (loading, error, empty, loaded)
        </li>
        <li>
          <code>data-project-count</code> - Number of projects
        </li>
        <li>
          <code>data-task-count</code> - Number of tasks
        </li>
        <li>
          <code>data-sidebar-collapsed</code> - Whether sidebar is collapsed
        </li>
        <li>
          <code>data-mobile-drawer-open</code> - Whether mobile drawer is open
        </li>
      </ul>
      <div className="h-[600px] overflow-hidden rounded-lg border">
        <DashboardPage {...createDefaultProps()} data-testid="dashboard-test" />
      </div>
    </div>
  ),
};

/**
 * Screen reader announcements demo
 */
export const ScreenReaderDemo: Story = {
  render: function SRDemo() {
    const [state, setState] = useState<'loading' | 'error' | 'empty' | 'loaded'>('loaded');

    const props = createDefaultProps();

    const modifiedProps = { ...props };
    if (state === 'loading') {
      modifiedProps.isLoading = true;
    } else if (state === 'error') {
      modifiedProps.error = new Error('Connection failed');
      modifiedProps.onRetry = () => setState('loaded');
    } else if (state === 'empty') {
      modifiedProps.sidebar.projects = [];
      modifiedProps.sidebar.tasks = [];
      modifiedProps.content.tasks = [];
      modifiedProps.content.activeProjectId = undefined;
    }

    return (
      <div className="flex h-screen flex-col">
        <div className="border-b bg-[rgb(var(--muted))] p-4">
          <span className="mr-4 font-medium">State:</span>
          {(['loading', 'error', 'empty', 'loaded'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setState(s)}
              className={`mr-2 rounded px-3 py-1 text-sm ${
                state === s
                  ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
                  : 'bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-foreground))]'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <span className="ml-4 text-sm text-[rgb(var(--muted-foreground))]">
            Switch states to hear screen reader announcements
          </span>
        </div>
        <div className="flex-1">
          <DashboardPage {...modifiedProps} />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates screen reader announcements for different page states:
- **Loading**: "Loading dashboard. Please wait."
- **Error**: "Error loading dashboard: [error message]" (assertive)
- **Empty**: "No projects found. Create your first project to get started."
- **Loaded**: "Dashboard loaded. X projects available. Y tasks in current project."
        `,
      },
    },
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Constants reference - shows all exported constants and their values
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="max-h-screen overflow-auto p-6">
      <h2 className="mb-6 text-2xl font-bold">Exported Constants Reference</h2>

      <section className="mb-8">
        <h3 className="mb-3 text-lg font-semibold">Default Values</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Constant</th>
              <th className="p-2 text-left">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-mono">DEFAULT_PAGE_SIZE</td>
              <td className="p-2">"{DEFAULT_PAGE_SIZE}"</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">DEFAULT_PAGE_LABEL</td>
              <td className="p-2">"{DEFAULT_PAGE_LABEL}"</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">DEFAULT_SKELETON_TASK_COUNT</td>
              <td className="p-2">{DEFAULT_SKELETON_TASK_COUNT}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">DEFAULT_SKELETON_PROJECT_COUNT</td>
              <td className="p-2">{DEFAULT_SKELETON_PROJECT_COUNT}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">DEFAULT_ERROR_TITLE</td>
              <td className="p-2">"{DEFAULT_ERROR_TITLE}"</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">DEFAULT_ERROR_DESCRIPTION</td>
              <td className="p-2">"{DEFAULT_ERROR_DESCRIPTION}"</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">DEFAULT_RETRY_LABEL</td>
              <td className="p-2">"{DEFAULT_RETRY_LABEL}"</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-lg font-semibold">Screen Reader Announcements</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Constant</th>
              <th className="p-2 text-left">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-mono">SR_LOADING</td>
              <td className="p-2">"{SR_LOADING}"</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">SR_ERROR_PREFIX</td>
              <td className="p-2">"{SR_ERROR_PREFIX}"</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">SR_EMPTY</td>
              <td className="p-2">"{SR_EMPTY}"</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">SR_LOADED_PREFIX</td>
              <td className="p-2">"{SR_LOADED_PREFIX}"</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-lg font-semibold">CSS Class Constants</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Constant</th>
              <th className="p-2 text-left">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-mono">DASHBOARD_PAGE_BASE_CLASSES</td>
              <td className="p-2 font-mono text-xs">{DASHBOARD_PAGE_BASE_CLASSES}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">DASHBOARD_PAGE_ERROR_CLASSES</td>
              <td className="p-2 font-mono text-xs">{DASHBOARD_PAGE_ERROR_CLASSES}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">DASHBOARD_PAGE_SKELETON_CLASSES</td>
              <td className="p-2 font-mono text-xs">{DASHBOARD_PAGE_SKELETON_CLASSES}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">DASHBOARD_PAGE_SKELETON_HEADER_CLASSES</td>
              <td className="p-2 font-mono text-xs">{DASHBOARD_PAGE_SKELETON_HEADER_CLASSES}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">DASHBOARD_PAGE_SKELETON_SIDEBAR_CLASSES</td>
              <td className="p-2 font-mono text-xs">{DASHBOARD_PAGE_SKELETON_SIDEBAR_CLASSES}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">DASHBOARD_PAGE_SKELETON_MAIN_CLASSES</td>
              <td className="p-2 font-mono text-xs">{DASHBOARD_PAGE_SKELETON_MAIN_CLASSES}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-lg font-semibold">Size Maps</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Size</th>
              <th className="p-2 text-left">Padding</th>
              <th className="p-2 text-left">Gap</th>
            </tr>
          </thead>
          <tbody>
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <tr key={size} className="border-b">
                <td className="p-2 font-mono">{size}</td>
                <td className="p-2 font-mono">{PAGE_SIZE_PADDING[size]}</td>
                <td className="p-2 font-mono">{PAGE_SIZE_GAP[size]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-lg font-semibold">Utility Functions</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Function</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Example</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-mono">getBaseSize(size)</td>
              <td className="p-2">Resolves ResponsiveValue to base size</td>
              <td className="p-2 font-mono text-xs">
                {getBaseSize({ base: 'sm', md: 'lg' })} → "sm"
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">getResponsiveSizeClasses(size, classMap)</td>
              <td className="p-2">Generates responsive Tailwind classes</td>
              <td className="p-2 font-mono text-xs">
                {getResponsiveSizeClasses('md', PAGE_SIZE_PADDING)}
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">buildLoadedAnnouncement(projects, tasks, hasActive)</td>
              <td className="p-2">Builds screen reader announcement</td>
              <td className="p-2 font-mono text-xs">{buildLoadedAnnouncement(3, 5, true)}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">buildPageAccessibleLabel(loading, error, name)</td>
              <td className="p-2">Builds accessible page label</td>
              <td className="p-2 font-mono text-xs">
                {buildPageAccessibleLabel(false, false, 'OpenFlow')}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Reference for all exported constants and utility functions from DashboardPage.',
      },
    },
  },
};
