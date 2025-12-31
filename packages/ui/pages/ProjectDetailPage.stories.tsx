/**
 * Storybook stories for ProjectDetailPage
 *
 * Demonstrates the complete project detail page in various states:
 * - Loading state
 * - Not found state
 * - Ready state with tasks
 * - Different status filters
 * - With create task dialog
 * - Collapsed sidebar
 * - Mobile viewport
 */

import type {
  Project,
  Task,
  TaskStatus,
  WorkflowStep,
  WorkflowTemplate,
} from '@openflow/generated';
import { TaskStatus as TaskStatusEnum, WorkflowStepStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import type { StatusFilter } from '../organisms/Sidebar';
import { ProjectDetailPage, type ProjectDetailPageProps } from './ProjectDetailPage';

const meta: Meta<typeof ProjectDetailPage> = {
  title: 'Pages/ProjectDetailPage',
  component: ProjectDetailPage,
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
type Story = StoryObj<typeof ProjectDetailPage>;

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
];

const mockTasks: Task[] = [
  {
    id: 'task-1',
    projectId: 'project-1',
    title: 'Implement user authentication',
    description: 'Add login and signup functionality with OAuth support',
    status: TaskStatusEnum.Inprogress,
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
    status: TaskStatusEnum.Todo,
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
    status: TaskStatusEnum.Done,
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
    status: TaskStatusEnum.Inreview,
    actionsRequiredCount: 1,
    autoStartNextStep: false,
    createdAt: '2024-01-12T11:00:00Z',
    updatedAt: '2024-01-14T10:00:00Z',
  },
];

const mockWorkflowSteps: WorkflowStep[] = [
  {
    index: 0,
    name: 'Requirements',
    description: 'Analyze requirements and create specification',
    status: WorkflowStepStatus.Pending,
  },
  {
    index: 1,
    name: 'Implementation',
    description: 'Implement the feature',
    status: WorkflowStepStatus.Pending,
  },
  {
    index: 2,
    name: 'Testing',
    description: 'Write tests',
    status: WorkflowStepStatus.Pending,
  },
];

const mockWorkflowTemplates: WorkflowTemplate[] = [
  {
    id: 'workflow-1',
    name: 'Standard Development',
    description: 'Full development workflow with requirements, implementation, testing, and review',
    content:
      '# Standard Development Workflow\n\n### [ ] Step: Requirements\n\n### [ ] Step: Implementation\n\n### [ ] Step: Testing',
    isBuiltin: true,
    steps: mockWorkflowSteps,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workflow-2',
    name: 'Quick Fix',
    description: 'Simplified workflow for small fixes',
    content: '# Quick Fix Workflow\n\n### [ ] Step: Fix\n\n### [ ] Step: Verify',
    isBuiltin: true,
    steps: [
      { index: 0, name: 'Fix', description: 'Apply the fix', status: WorkflowStepStatus.Pending },
      {
        index: 1,
        name: 'Verify',
        description: 'Verify the fix',
        status: WorkflowStepStatus.Pending,
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// ============================================================================
// Helper functions
// ============================================================================

const noop = () => {};
const noopString = (_s: string) => {};
const noopStatus = (_s: StatusFilter) => {};
const noopTaskStatus = (_id: string, _status: TaskStatus) => {};
const noopWorkflow = (_w: WorkflowTemplate | null) => {};

// ============================================================================
// Default Props Factory
// ============================================================================

// Default sub-props extracted for reuse without non-null assertions
const defaultSidebar = {
  projects: mockProjects,
  tasks: mockTasks,
  projectId: 'project-1',
  statusFilter: 'all' as StatusFilter,
  isCollapsed: false,
  onSelectProject: noopString,
  onSelectTask: noopString,
  onNewTask: noop,
  onNewProject: noop,
  onStatusFilter: noopStatus,
  onTaskStatusChange: noopTaskStatus,
  onSettingsClick: noop,
  onArchiveClick: noop,
  onToggleCollapse: noop,
};

const defaultContent = {
  isLoading: false,
  tasks: mockTasks,
  onSelectTask: noopString,
  onTaskStatusChange: noopTaskStatus,
  onNewTask: noop,
};

const defaultCreateTaskDialog = {
  isOpen: false,
  taskTitle: '',
  taskDescription: '',
  selectedWorkflow: null as WorkflowTemplate | null,
  workflows: mockWorkflowTemplates,
  isLoadingWorkflows: false,
  isCreating: false,
  error: null as string | null,
  onClose: noop,
  onCreate: noop,
  onTitleChange: noopString,
  onDescriptionChange: noopString,
  onWorkflowSelect: noopWorkflow,
};

function createDefaultProps(overrides?: Partial<ProjectDetailPageProps>): ProjectDetailPageProps {
  return {
    state: 'ready',
    project: mockProjects[0],
    sidebarCollapsed: false,
    sidebar: defaultSidebar,
    header: {
      onSearch: noop,
      onNewTask: noop,
    },
    infoBar: {
      onBack: noop,
      onSettings: noop,
      onNewTask: noop,
    },
    content: defaultContent,
    createTaskDialog: defaultCreateTaskDialog,
    ...overrides,
  };
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Default project detail page with tasks
 */
export const Default: Story = {
  args: createDefaultProps(),
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    state: 'loading',
    onSearch: noop,
  },
};

/**
 * Not found state
 */
export const NotFound: Story = {
  args: {
    state: 'not-found',
    onNotFoundBack: noop,
    onSearch: noop,
  },
};

/**
 * Loading tasks
 */
export const LoadingTasks: Story = {
  args: createDefaultProps({
    content: {
      ...defaultContent,
      isLoading: true,
      tasks: [],
    },
  }),
};

/**
 * Empty project (no tasks)
 */
export const EmptyProject: Story = {
  args: createDefaultProps({
    sidebar: {
      ...defaultSidebar,
      tasks: [],
    },
    content: {
      ...defaultContent,
      tasks: [],
    },
  }),
};

/**
 * Filtered by in progress status
 */
export const FilteredInProgress: Story = {
  args: createDefaultProps({
    sidebar: {
      ...defaultSidebar,
      statusFilter: TaskStatusEnum.Inprogress as StatusFilter,
      tasks: mockTasks.filter((t) => t.status === TaskStatusEnum.Inprogress),
    },
    content: {
      ...defaultContent,
      tasks: mockTasks.filter((t) => t.status === TaskStatusEnum.Inprogress),
    },
  }),
};

/**
 * Filtered by todo status
 */
export const FilteredTodo: Story = {
  args: createDefaultProps({
    sidebar: {
      ...defaultSidebar,
      statusFilter: TaskStatusEnum.Todo as StatusFilter,
      tasks: mockTasks.filter((t) => t.status === TaskStatusEnum.Todo),
    },
    content: {
      ...defaultContent,
      tasks: mockTasks.filter((t) => t.status === TaskStatusEnum.Todo),
    },
  }),
};

/**
 * Sidebar collapsed
 */
export const SidebarCollapsed: Story = {
  args: createDefaultProps({
    sidebarCollapsed: true,
    sidebar: {
      ...defaultSidebar,
      isCollapsed: true,
    },
  }),
};

/**
 * Create task dialog open
 */
export const CreateTaskDialogOpen: Story = {
  args: createDefaultProps({
    createTaskDialog: {
      ...defaultCreateTaskDialog,
      isOpen: true,
    },
  }),
};

/**
 * Create task dialog with values
 */
export const CreateTaskDialogFilled: Story = {
  args: createDefaultProps({
    createTaskDialog: {
      ...defaultCreateTaskDialog,
      isOpen: true,
      taskTitle: 'Implement payment integration',
      taskDescription: 'Add Stripe payment processing for subscriptions',
      selectedWorkflow: mockWorkflowTemplates[0] ?? null,
    },
  }),
};

/**
 * Create task dialog loading workflows
 */
export const CreateTaskDialogLoadingWorkflows: Story = {
  args: createDefaultProps({
    createTaskDialog: {
      ...defaultCreateTaskDialog,
      isOpen: true,
      isLoadingWorkflows: true,
      workflows: [],
    },
  }),
};

/**
 * Create task dialog creating
 */
export const CreateTaskDialogCreating: Story = {
  args: createDefaultProps({
    createTaskDialog: {
      ...defaultCreateTaskDialog,
      isOpen: true,
      taskTitle: 'Implement payment integration',
      taskDescription: 'Add Stripe payment processing for subscriptions',
      selectedWorkflow: mockWorkflowTemplates[0] ?? null,
      isCreating: true,
    },
  }),
};

/**
 * Create task dialog with error
 */
export const CreateTaskDialogError: Story = {
  args: createDefaultProps({
    createTaskDialog: {
      ...defaultCreateTaskDialog,
      isOpen: true,
      taskTitle: 'Implement payment integration',
      error: 'Failed to create task. Please try again.',
    },
  }),
};

/**
 * Many tasks (scrollable)
 */
export const ManyTasks: Story = {
  args: (() => {
    const manyTasks: Task[] = [
      ...mockTasks,
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `task-extra-${i}`,
        projectId: 'project-1',
        title: `Task ${i + 5}`,
        description: `Description for task ${i + 5}`,
        status: [
          TaskStatusEnum.Todo,
          TaskStatusEnum.Inprogress,
          TaskStatusEnum.Inreview,
          TaskStatusEnum.Done,
        ][i % 4] as TaskStatus,
        actionsRequiredCount: i % 3,
        autoStartNextStep: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })),
    ];
    return createDefaultProps({
      sidebar: {
        ...defaultSidebar,
        tasks: manyTasks,
      },
      content: {
        ...defaultContent,
        tasks: manyTasks,
      },
    });
  })(),
};

/**
 * Different project selected
 */
export const DifferentProject: Story = {
  args: createDefaultProps({
    project: mockProjects[1],
    sidebar: {
      ...defaultSidebar,
      projectId: 'project-2',
      tasks: [],
    },
    content: {
      ...defaultContent,
      tasks: [],
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
