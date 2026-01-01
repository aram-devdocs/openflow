import type { Chat, Project, Task } from '@openflow/generated';
import { ChatRole, TaskStatus as TaskStatusEnum } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  DEFAULT_ARCHIVE_LABEL,
  DEFAULT_COLLAPSE_LABEL,
  DEFAULT_EMPTY_CHATS_TITLE,
  DEFAULT_EMPTY_TASKS_DESCRIPTION,
  DEFAULT_EMPTY_TASKS_TITLE,
  DEFAULT_EXPAND_LABEL,
  DEFAULT_FILTER_LABEL,
  DEFAULT_NEW_CHAT_LABEL,
  DEFAULT_NEW_TASK_LABEL,
  DEFAULT_SETTINGS_LABEL,
  // Constants reference
  DEFAULT_SIDEBAR_LABEL,
  DEFAULT_SKELETON_CHAT_COUNT,
  DEFAULT_SKELETON_TASK_COUNT,
  DEFAULT_VIEW_ALL_CHATS_LABEL,
  // Class constants
  SIDEBAR_BASE_CLASSES,
  SIDEBAR_CONTENT_CLASSES,
  SIDEBAR_FILTER_GAP_CLASSES,
  SIDEBAR_FOOTER_CLASSES,
  SIDEBAR_HEADER_CLASSES,
  SIDEBAR_PADDING_CLASSES,
  SIDEBAR_WIDTH_CLASSES,
  SR_CHATS_SECTION_COLLAPSED,
  SR_CHATS_SECTION_EXPANDED,
  SR_FILTER_CHANGED,
  SR_SIDEBAR_COLLAPSED,
  SR_SIDEBAR_EXPANDED,
  STATUS_FILTER_OPTIONS,
  Sidebar,
  SidebarSkeleton,
  type StatusFilter,
  buildChatAccessibleLabel,
  buildChatsSectionAnnouncement,
  buildFilterAnnouncement,
  filterTasksByStatus,
  // Utility functions
  getBaseSize,
  getIconSize,
  getResponsiveSizeClasses,
  getStatusFilterLabel,
  getTaskCounts,
} from './Sidebar';

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
    onSelectChat: { action: 'chat selected' },
    onNewTask: { action: 'new task clicked' },
    onNewChat: { action: 'new chat clicked' },
    onNewProject: { action: 'new project clicked' },
    onStatusFilter: { action: 'status filter changed' },
    onTaskStatusChange: { action: 'task status changed' },
    onTaskContextMenu: { action: 'task context menu' },
    onChatContextMenu: { action: 'chat context menu' },
    onViewAllChats: { action: 'view all chats' },
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
    status: TaskStatusEnum.Inprogress,
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
    status: TaskStatusEnum.Todo,
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
    status: TaskStatusEnum.Inreview,
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
    status: TaskStatusEnum.Done,
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
    status: TaskStatusEnum.Cancelled,
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
    status: TaskStatusEnum.Todo,
    actionsRequiredCount: 1,
    autoStartNextStep: false,
    createdAt: '2024-01-09T10:00:00Z',
    updatedAt: '2024-01-09T10:00:00Z',
  },
];

// Mock chat data
const mockChats: Chat[] = [
  {
    id: 'chat-1',
    projectId: 'proj-1',
    title: 'Authentication implementation discussion',
    chatRole: ChatRole.Main,
    baseBranch: 'main',
    worktreeDeleted: false,
    isPlanContainer: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
  },
  {
    id: 'chat-2',
    projectId: 'proj-1',
    title: 'Database connection debugging',
    chatRole: ChatRole.Review,
    baseBranch: 'main',
    worktreeDeleted: false,
    isPlanContainer: false,
    createdAt: '2024-01-14T08:00:00Z',
    updatedAt: '2024-01-14T08:00:00Z',
  },
  {
    id: 'chat-3',
    projectId: 'proj-1',
    title: undefined, // Untitled chat
    chatRole: ChatRole.Main,
    baseBranch: 'main',
    worktreeDeleted: false,
    isPlanContainer: false,
    createdAt: '2024-01-13T12:00:00Z',
    updatedAt: '2024-01-13T12:00:00Z',
  },
];

// ============================================================================
// Basic Examples
// ============================================================================

/**
 * Default sidebar with projects, tasks, and chats.
 */
export const Default: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    chats: mockChats,
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
    chats: mockChats,
    selectedProjectId: 'proj-1',
    selectedTaskId: 'task-1',
    statusFilter: 'all',
    isCollapsed: true,
  },
};

/**
 * Interactive toggle example with state management.
 */
export const InteractiveToggle: Story = {
  render: function InteractiveToggleStory() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [selectedTaskId, setSelectedTaskId] = useState<string>('task-1');
    const [selectedChatId, setSelectedChatId] = useState<string | undefined>();

    return (
      <Sidebar
        projects={mockProjects}
        tasks={mockTasks}
        chats={mockChats}
        selectedProjectId="proj-1"
        selectedTaskId={selectedTaskId}
        selectedChatId={selectedChatId}
        statusFilter={statusFilter}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onStatusFilter={setStatusFilter}
        onSelectTask={setSelectedTaskId}
        onSelectChat={setSelectedChatId}
        onNewTask={() => console.log('New task')}
        onNewChat={() => console.log('New chat')}
        onSettingsClick={() => console.log('Settings')}
        onArchiveClick={() => console.log('Archive')}
        onViewAllChats={() => console.log('View all chats')}
        data-testid="sidebar"
      />
    );
  },
};

// ============================================================================
// Filter States
// ============================================================================

/**
 * Filter set to show only "In Progress" tasks.
 */
export const FilteredInProgress: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    chats: mockChats,
    selectedProjectId: 'proj-1',
    statusFilter: TaskStatusEnum.Inprogress as StatusFilter,
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
    chats: mockChats,
    selectedProjectId: 'proj-1',
    statusFilter: TaskStatusEnum.Todo as StatusFilter,
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
    chats: mockChats,
    selectedProjectId: 'proj-1',
    statusFilter: TaskStatusEnum.Done as StatusFilter,
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
        status: TaskStatusEnum.Done,
        actionsRequiredCount: 0,
        autoStartNextStep: false,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
      },
    ],
    chats: mockChats,
    selectedProjectId: 'proj-1',
    statusFilter: TaskStatusEnum.Inprogress as StatusFilter, // No in-progress tasks
    isCollapsed: false,
  },
};

// ============================================================================
// Empty States
// ============================================================================

/**
 * Empty tasks state - no tasks in the project.
 */
export const EmptyTasks: Story = {
  args: {
    projects: mockProjects,
    tasks: [],
    chats: mockChats,
    selectedProjectId: 'proj-1',
    statusFilter: 'all',
    isCollapsed: false,
  },
};

/**
 * Empty chats state - no chats in the project.
 */
export const EmptyChats: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    chats: [],
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
    chats: [],
    selectedProjectId: undefined,
    statusFilter: 'all',
    isCollapsed: false,
  },
};

/**
 * Empty state - no projects, tasks, or chats.
 */
export const EmptyState: Story = {
  args: {
    projects: [],
    tasks: [],
    chats: [],
    selectedProjectId: undefined,
    statusFilter: 'all',
    isCollapsed: false,
  },
};

// ============================================================================
// Content Variations
// ============================================================================

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
        status: TaskStatusEnum.Todo,
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
        status: TaskStatusEnum.Inprogress,
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
        status: TaskStatusEnum.Todo,
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
        status: TaskStatusEnum.Done,
        actionsRequiredCount: 0,
        autoStartNextStep: false,
        createdAt: '2024-01-05T10:00:00Z',
        updatedAt: '2024-01-17T14:00:00Z',
      },
    ],
    chats: mockChats,
    selectedProjectId: 'proj-1',
    selectedTaskId: 'task-1',
    statusFilter: 'all',
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
        status: TaskStatusEnum.Inprogress,
        actionsRequiredCount: 0,
        autoStartNextStep: false,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
      },
      {
        id: 'task-long-2',
        projectId: 'proj-1',
        title: 'Another extremely long task title that tests the UI truncation behavior',
        status: TaskStatusEnum.Todo,
        actionsRequiredCount: 2,
        autoStartNextStep: false,
        createdAt: '2024-01-14T08:00:00Z',
        updatedAt: '2024-01-14T08:00:00Z',
      },
    ],
    chats: mockChats,
    selectedProjectId: 'proj-1',
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
        status: TaskStatusEnum.Inprogress,
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
        status: TaskStatusEnum.Inreview,
        actionsRequiredCount: 1,
        autoStartNextStep: false,
        createdAt: '2024-01-14T08:00:00Z',
        updatedAt: '2024-01-19T12:00:00Z',
      },
    ],
    chats: mockChats,
    selectedProjectId: 'proj-1',
    statusFilter: 'all',
    isCollapsed: false,
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size variant.
 */
export const SizeSmall: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    chats: mockChats,
    selectedProjectId: 'proj-1',
    statusFilter: 'all',
    size: 'sm',
    isCollapsed: false,
  },
};

/**
 * Large size variant.
 */
export const SizeLarge: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    chats: mockChats,
    selectedProjectId: 'proj-1',
    statusFilter: 'all',
    size: 'lg',
    isCollapsed: false,
  },
};

/**
 * Responsive sizing across breakpoints.
 */
export const ResponsiveSizing: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    chats: mockChats,
    selectedProjectId: 'proj-1',
    statusFilter: 'all',
    size: { base: 'sm', md: 'md', lg: 'lg' },
    isCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Resize the viewport to see how the sidebar adapts. Uses small padding on mobile, medium on tablet, and large on desktop.',
      },
    },
  },
};

// ============================================================================
// Skeleton Loading States
// ============================================================================

/**
 * Sidebar skeleton for loading state.
 */
export const LoadingSkeleton: Story = {
  render: () => (
    <SidebarSkeleton
      taskCount={4}
      chatCount={3}
      isCollapsed={false}
      data-testid="sidebar-skeleton"
    />
  ),
};

/**
 * Collapsed sidebar skeleton.
 */
export const CollapsedSkeleton: Story = {
  render: () => <SidebarSkeleton isCollapsed={true} data-testid="sidebar-skeleton" />,
};

/**
 * Skeleton with custom counts.
 */
export const SkeletonCustomCounts: Story = {
  render: () => (
    <SidebarSkeleton
      taskCount={8}
      chatCount={5}
      isCollapsed={false}
      data-testid="sidebar-skeleton"
    />
  ),
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Demonstrates keyboard navigation through filter tabs.
 * Use Arrow Up/Down to navigate, Home/End to jump.
 */
export const KeyboardNavigation: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    chats: mockChats,
    selectedProjectId: 'proj-1',
    statusFilter: 'all',
    isCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Focus on the status filter tabs and use Arrow Up/Down to navigate, Home/End to jump to first/last option.',
      },
    },
  },
};

/**
 * Screen reader accessibility demonstration.
 */
export const ScreenReaderAccessibility: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    chats: mockChats,
    selectedProjectId: 'proj-1',
    selectedChatId: 'chat-1',
    statusFilter: 'all',
    isCollapsed: false,
    'aria-label': 'Project navigation sidebar',
  },
  parameters: {
    docs: {
      description: {
        story: `
The sidebar provides comprehensive screen reader support:
- role="navigation" landmark with aria-label
- Status filter tabs use tablist/tab pattern with aria-selected
- Tasks and chats use list semantics with aria-label
- Selected chat has aria-current="true"
- Filter counts have aria-label for context
- State changes announced via aria-live regions
        `,
      },
    },
  },
};

/**
 * Touch target accessibility - all interactive elements are at least 44x44px on mobile.
 */
export const TouchTargetAccessibility: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    chats: mockChats,
    selectedProjectId: 'proj-1',
    statusFilter: 'all',
    isCollapsed: false,
    'data-testid': 'sidebar',
  },
  parameters: {
    docs: {
      description: {
        story:
          'All interactive elements meet the WCAG 2.5.5 minimum touch target size of 44x44px on mobile viewports.',
      },
    },
  },
};

/**
 * Focus ring visibility on all backgrounds.
 */
export const FocusRingVisibility: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    chats: mockChats,
    selectedProjectId: 'proj-1',
    statusFilter: 'all',
    isCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tab through the sidebar to see focus rings. Focus rings use ring-offset for visibility on all backgrounds.',
      },
    },
  },
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

/**
 * Demonstrates ref forwarding for programmatic access.
 */
export const RefForwarding: Story = {
  render: function RefForwardingStory() {
    const sidebarRef = (el: HTMLElement | null) => {
      if (el) {
        console.log('Sidebar element:', el);
        console.log('Data-collapsed:', el.dataset.collapsed);
        console.log('Data-size:', el.dataset.size);
        console.log('Data-filter:', el.dataset.filter);
      }
    };

    return (
      <Sidebar
        ref={sidebarRef}
        projects={mockProjects}
        tasks={mockTasks}
        chats={mockChats}
        selectedProjectId="proj-1"
        statusFilter="all"
        isCollapsed={false}
        data-testid="sidebar"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'The sidebar forwards refs for programmatic access. Check the console for logged element info.',
      },
    },
  },
};

/**
 * Shows all available data attributes.
 */
export const DataAttributes: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    chats: mockChats,
    selectedProjectId: 'proj-1',
    selectedTaskId: 'task-1',
    selectedChatId: 'chat-1',
    statusFilter: TaskStatusEnum.Inprogress as StatusFilter,
    isCollapsed: false,
    'data-testid': 'sidebar',
  },
  parameters: {
    docs: {
      description: {
        story: `
Available data attributes:
- data-testid: For testing (propagates to nested elements)
- data-collapsed: "true" | "false"
- data-size: Current size ("sm" | "md" | "lg")
- data-filter: Current status filter
- data-task-count: Number of tasks
- data-chat-count: Number of chats
        `,
      },
    },
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/**
 * Full-featured sidebar as it would appear in the application.
 */
export const RealWorldExample: Story = {
  render: function RealWorldStory() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [selectedProjectId, setSelectedProjectId] = useState('proj-1');
    const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>('task-1');
    const [selectedChatId, setSelectedChatId] = useState<string | undefined>();

    return (
      <Sidebar
        projects={mockProjects}
        tasks={mockTasks}
        chats={mockChats}
        selectedProjectId={selectedProjectId}
        selectedTaskId={selectedTaskId}
        selectedChatId={selectedChatId}
        statusFilter={statusFilter}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onSelectProject={setSelectedProjectId}
        onSelectTask={(id) => {
          setSelectedTaskId(id);
          setSelectedChatId(undefined);
        }}
        onSelectChat={(id) => {
          setSelectedChatId(id);
          setSelectedTaskId(undefined);
        }}
        onStatusFilter={setStatusFilter}
        onNewTask={() => alert('Open new task dialog')}
        onNewChat={() => alert('Open new chat dialog')}
        onNewProject={() => alert('Open new project dialog')}
        onSettingsClick={() => alert('Navigate to settings')}
        onArchiveClick={() => alert('Navigate to archive')}
        onViewAllChats={() => alert('Navigate to all chats')}
        onTaskContextMenu={(taskId, event) => {
          event.preventDefault();
          alert(`Context menu for task: ${taskId}`);
        }}
        onChatContextMenu={(chatId, event) => {
          event.preventDefault();
          alert(`Context menu for chat: ${chatId}`);
        }}
        data-testid="sidebar"
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'A fully interactive sidebar demonstrating all features including selection, filtering, context menus, and navigation.',
      },
    },
  },
};

/**
 * Mobile-first collapsed sidebar for smaller screens.
 */
export const MobileView: Story = {
  args: {
    projects: mockProjects,
    tasks: mockTasks,
    chats: mockChats,
    selectedProjectId: 'proj-1',
    statusFilter: 'all',
    isCollapsed: true,
    size: 'sm',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'On mobile, the sidebar is typically collapsed to maximize content area.',
      },
    },
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Reference story showing all exported constants.
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="max-h-[600px] w-[800px] overflow-auto bg-[rgb(var(--background))] p-4">
      <h2 className="mb-4 text-lg font-semibold text-[rgb(var(--foreground))]">
        Exported Constants Reference
      </h2>

      <section className="mb-6">
        <h3 className="mb-2 font-medium text-[rgb(var(--foreground))]">Default Labels</h3>
        <div className="space-y-1 text-sm">
          <p>
            <code>DEFAULT_SIDEBAR_LABEL:</code> "{DEFAULT_SIDEBAR_LABEL}"
          </p>
          <p>
            <code>DEFAULT_EXPAND_LABEL:</code> "{DEFAULT_EXPAND_LABEL}"
          </p>
          <p>
            <code>DEFAULT_COLLAPSE_LABEL:</code> "{DEFAULT_COLLAPSE_LABEL}"
          </p>
          <p>
            <code>DEFAULT_NEW_TASK_LABEL:</code> "{DEFAULT_NEW_TASK_LABEL}"
          </p>
          <p>
            <code>DEFAULT_NEW_CHAT_LABEL:</code> "{DEFAULT_NEW_CHAT_LABEL}"
          </p>
          <p>
            <code>DEFAULT_ARCHIVE_LABEL:</code> "{DEFAULT_ARCHIVE_LABEL}"
          </p>
          <p>
            <code>DEFAULT_SETTINGS_LABEL:</code> "{DEFAULT_SETTINGS_LABEL}"
          </p>
          <p>
            <code>DEFAULT_VIEW_ALL_CHATS_LABEL:</code> "{DEFAULT_VIEW_ALL_CHATS_LABEL}"
          </p>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 font-medium text-[rgb(var(--foreground))]">Empty State Labels</h3>
        <div className="space-y-1 text-sm">
          <p>
            <code>DEFAULT_EMPTY_TASKS_TITLE:</code> "{DEFAULT_EMPTY_TASKS_TITLE}"
          </p>
          <p>
            <code>DEFAULT_EMPTY_TASKS_DESCRIPTION:</code> "{DEFAULT_EMPTY_TASKS_DESCRIPTION}"
          </p>
          <p>
            <code>DEFAULT_EMPTY_CHATS_TITLE:</code> "{DEFAULT_EMPTY_CHATS_TITLE}"
          </p>
          <p>
            <code>DEFAULT_FILTER_LABEL:</code> "{DEFAULT_FILTER_LABEL}"
          </p>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 font-medium text-[rgb(var(--foreground))]">Skeleton Defaults</h3>
        <div className="space-y-1 text-sm">
          <p>
            <code>DEFAULT_SKELETON_TASK_COUNT:</code> {DEFAULT_SKELETON_TASK_COUNT}
          </p>
          <p>
            <code>DEFAULT_SKELETON_CHAT_COUNT:</code> {DEFAULT_SKELETON_CHAT_COUNT}
          </p>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 font-medium text-[rgb(var(--foreground))]">
          Screen Reader Announcements
        </h3>
        <div className="space-y-1 text-sm">
          <p>
            <code>SR_SIDEBAR_EXPANDED:</code> "{SR_SIDEBAR_EXPANDED}"
          </p>
          <p>
            <code>SR_SIDEBAR_COLLAPSED:</code> "{SR_SIDEBAR_COLLAPSED}"
          </p>
          <p>
            <code>SR_FILTER_CHANGED:</code> "{SR_FILTER_CHANGED}"
          </p>
          <p>
            <code>SR_CHATS_SECTION_EXPANDED:</code> "{SR_CHATS_SECTION_EXPANDED}"
          </p>
          <p>
            <code>SR_CHATS_SECTION_COLLAPSED:</code> "{SR_CHATS_SECTION_COLLAPSED}"
          </p>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 font-medium text-[rgb(var(--foreground))]">Status Filter Options</h3>
        <div className="space-y-1 text-sm">
          {STATUS_FILTER_OPTIONS.map((option) => (
            <p key={option.value}>
              <code>{option.value}:</code> "{option.label}"
            </p>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 font-medium text-[rgb(var(--foreground))]">Width Classes</h3>
        <div className="space-y-1 text-sm">
          <p>
            <code>SIDEBAR_WIDTH_CLASSES.expanded:</code> "{SIDEBAR_WIDTH_CLASSES.expanded}"
          </p>
          <p>
            <code>SIDEBAR_WIDTH_CLASSES.collapsed:</code> "{SIDEBAR_WIDTH_CLASSES.collapsed}"
          </p>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 font-medium text-[rgb(var(--foreground))]">Padding Classes by Size</h3>
        <div className="space-y-1 text-sm">
          {Object.entries(SIDEBAR_PADDING_CLASSES).map(([size, classes]) => (
            <p key={size}>
              <code>{size}:</code> "{classes}"
            </p>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 font-medium text-[rgb(var(--foreground))]">Base Classes</h3>
        <div className="space-y-1 text-sm">
          <p>
            <code>SIDEBAR_BASE_CLASSES:</code> "{SIDEBAR_BASE_CLASSES}"
          </p>
          <p>
            <code>SIDEBAR_FILTER_GAP_CLASSES:</code> "{SIDEBAR_FILTER_GAP_CLASSES}"
          </p>
          <p>
            <code>SIDEBAR_HEADER_CLASSES:</code> "{SIDEBAR_HEADER_CLASSES}"
          </p>
          <p>
            <code>SIDEBAR_FOOTER_CLASSES:</code> "{SIDEBAR_FOOTER_CLASSES}"
          </p>
          <p>
            <code>SIDEBAR_CONTENT_CLASSES:</code> "{SIDEBAR_CONTENT_CLASSES}"
          </p>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 font-medium text-[rgb(var(--foreground))]">Utility Functions</h3>
        <div className="space-y-2 text-sm">
          <div>
            <code>getBaseSize(undefined)</code> = "{getBaseSize(undefined)}"
          </div>
          <div>
            <code>getBaseSize('lg')</code> = "{getBaseSize('lg')}"
          </div>
          <div>
            <code>getBaseSize({`{ base: 'sm', md: 'lg' }`})</code> = "
            {getBaseSize({ base: 'sm', md: 'lg' })}"
          </div>
          <div>
            <code>getResponsiveSizeClasses('sm', SIDEBAR_PADDING_CLASSES)</code> = "
            {getResponsiveSizeClasses('sm', SIDEBAR_PADDING_CLASSES)}"
          </div>
          <div>
            <code>getStatusFilterLabel(TaskStatus.Inprogress)</code> = "
            {getStatusFilterLabel(TaskStatusEnum.Inprogress)}"
          </div>
          <div>
            <code>buildFilterAnnouncement(TaskStatus.Todo, 3)</code> = "
            {buildFilterAnnouncement(TaskStatusEnum.Todo, 3)}"
          </div>
          <div>
            <code>buildChatsSectionAnnouncement(true, 5)</code> = "
            {buildChatsSectionAnnouncement(true, 5)}"
          </div>
          <div>
            <code>buildChatAccessibleLabel('My Chat', true)</code> = "
            {buildChatAccessibleLabel('My Chat', true)}"
          </div>
          <div>
            <code>getIconSize('lg')</code> = "{getIconSize('lg')}"
          </div>
          <div>
            <code>getTaskCounts(mockTasks)</code> = {JSON.stringify(getTaskCounts(mockTasks))}
          </div>
          <div>
            <code>filterTasksByStatus(mockTasks, TaskStatus.Todo).length</code> ={' '}
            {filterTasksByStatus(mockTasks, TaskStatusEnum.Todo).length}
          </div>
        </div>
      </section>
    </div>
  ),
  decorators: [(Story) => <Story />],
};
