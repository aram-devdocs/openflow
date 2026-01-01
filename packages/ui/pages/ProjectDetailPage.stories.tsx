/**
 * Storybook stories for ProjectDetailPage
 *
 * Demonstrates the complete project detail page in various states:
 * - Loading state
 * - Not found state
 * - Error state with retry
 * - Ready state with tasks
 * - Different status filters
 * - With create task dialog
 * - Collapsed sidebar
 * - Mobile viewport
 * - Accessibility demos
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
import { useRef, useState } from 'react';
import type { StatusFilter } from '../organisms/Sidebar';
import {
  DEFAULT_BACK_LABEL,
  DEFAULT_ERROR_TITLE,
  DEFAULT_PAGE_LABEL,
  DEFAULT_PAGE_SIZE,
  DEFAULT_RETRY_LABEL,
  // Constants
  DEFAULT_SKELETON_TASK_COUNT,
  PAGE_SIZE_GAP,
  PAGE_SIZE_PADDING,
  PROJECT_DETAIL_PAGE_BASE_CLASSES,
  PROJECT_DETAIL_PAGE_ERROR_CLASSES,
  PROJECT_DETAIL_PAGE_SKELETON_CLASSES,
  ProjectDetailPage,
  ProjectDetailPageError,
  type ProjectDetailPageProps,
  ProjectDetailPageSkeleton,
  SR_EMPTY,
  SR_ERROR_PREFIX,
  SR_LOADED_PREFIX,
  SR_LOADING,
  SR_NOT_FOUND,
} from './ProjectDetailPage';

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
const noopBoolean = (_b: boolean) => {};

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
// Basic Examples
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
 * Error state with retry
 */
export const ErrorState: Story = {
  args: {
    state: 'error',
    errorMessage: 'Failed to connect to database. Connection timeout after 30 seconds.',
    onErrorRetry: noop,
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

// ============================================================================
// Status Filters
// ============================================================================

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
 * Responsive sizing - sm on mobile, md on tablet, lg on desktop
 */
export const ResponsiveSizing: Story = {
  args: createDefaultProps({
    size: { base: 'sm', md: 'md', lg: 'lg' },
  }),
};

// ============================================================================
// Layout Variants
// ============================================================================

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
 * Mobile drawer open
 */
export const MobileDrawerOpen: Story = {
  args: createDefaultProps({
    isMobileDrawerOpen: true,
    onMobileDrawerToggle: noopBoolean,
  }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// ============================================================================
// Dialog States
// ============================================================================

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

// ============================================================================
// Content Variants
// ============================================================================

/**
 * Content error state
 */
export const ContentError: Story = {
  args: createDefaultProps({
    content: {
      ...defaultContent,
      isLoading: false,
      tasks: [],
      error: 'Failed to load tasks. Network timeout.',
      onRetry: noop,
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
  args: (() => {
    const secondProject = mockProjects[1];
    if (!secondProject) return createDefaultProps();
    return createDefaultProps({
      project: secondProject,
      sidebar: {
        ...defaultSidebar,
        projectId: 'project-2',
        tasks: [],
      },
      content: {
        ...defaultContent,
        tasks: [],
      },
    });
  })(),
};

// ============================================================================
// Viewport Variants
// ============================================================================

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

// ============================================================================
// Sub-Component Stories
// ============================================================================

/**
 * Skeleton sub-component demo
 */
export const SkeletonDemo: Story = {
  render: () => (
    <div className="h-screen">
      <ProjectDetailPageSkeleton
        onSearch={noop}
        skeletonCount={5}
        size="md"
        data-testid="skeleton-demo"
      />
    </div>
  ),
};

/**
 * Error sub-component demo
 */
export const ErrorDemo: Story = {
  render: () => (
    <div className="h-screen">
      <ProjectDetailPageError
        message="Database connection failed. Please check your network settings."
        onRetry={noop}
        onBack={noop}
        onSearch={noop}
        size="md"
        data-testid="error-demo"
      />
    </div>
  ),
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Focus ring visibility demo
 */
export const FocusRingVisibility: Story = {
  args: createDefaultProps(),
  parameters: {
    docs: {
      description: {
        story: 'Tab through the page to see focus rings on all interactive elements.',
      },
    },
  },
};

/**
 * Touch target accessibility demo
 */
export const TouchTargetAccessibility: Story = {
  args: createDefaultProps(),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'All interactive elements have minimum 44x44px touch targets on mobile (WCAG 2.5.5).',
      },
    },
  },
};

/**
 * Screen reader accessibility demo
 */
export const ScreenReaderAccessibility: Story = {
  args: createDefaultProps(),
  parameters: {
    docs: {
      description: {
        story: `
Screen reader announcements:
- Loading: "${SR_LOADING}"
- Not found: "${SR_NOT_FOUND}"
- Error: "${SR_ERROR_PREFIX} [error message]"
- Ready: "Project loaded: [name] with [count] task(s)"
        `,
      },
    },
  },
};

/**
 * Keyboard navigation demo
 */
export const KeyboardNavigation: Story = {
  args: createDefaultProps(),
  parameters: {
    docs: {
      description: {
        story: `
Keyboard navigation:
- Tab: Move between interactive elements
- Enter/Space: Activate buttons
- Escape: Close dialogs
- Arrow keys: Navigate sidebar items
        `,
      },
    },
  },
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

/**
 * Ref forwarding demo
 */
export const RefForwardingDemo: Story = {
  render: () => {
    const ref = useRef<HTMLDivElement>(null);

    return (
      <div className="h-screen">
        <ProjectDetailPage {...createDefaultProps()} ref={ref} data-testid="ref-demo" />
        <div className="absolute bottom-4 left-4 rounded bg-black/80 px-4 py-2 text-white">
          Ref attached: {ref.current ? 'Yes' : 'Mounting...'}
        </div>
      </div>
    );
  },
};

/**
 * Data attributes demo
 */
export const DataAttributesDemo: Story = {
  args: createDefaultProps({
    'data-testid': 'data-attrs-demo',
  }),
  parameters: {
    docs: {
      description: {
        story: `
Data attributes available:
- data-testid: Custom test ID
- data-state: "loading" | "not-found" | "error" | "ready"
- data-size: Current size variant
- data-task-count: Number of tasks (when ready)
- data-sidebar-collapsed: Whether sidebar is collapsed
- data-mobile-drawer-open: Whether mobile drawer is open
        `,
      },
    },
  },
};

// ============================================================================
// Interactive Examples
// ============================================================================

/**
 * Interactive state toggle demo
 */
export const InteractiveStateDemo: Story = {
  render: () => {
    const [state, setState] = useState<ProjectDetailPageProps['state']>('ready');
    const errorMessage = 'Connection failed';

    return (
      <div className="flex h-screen flex-col">
        <div className="flex gap-2 border-b p-4">
          <button
            type="button"
            className="rounded bg-blue-500 px-3 py-1 text-white"
            onClick={() => setState('loading')}
          >
            Loading
          </button>
          <button
            type="button"
            className="rounded bg-blue-500 px-3 py-1 text-white"
            onClick={() => setState('not-found')}
          >
            Not Found
          </button>
          <button
            type="button"
            className="rounded bg-blue-500 px-3 py-1 text-white"
            onClick={() => setState('error')}
          >
            Error
          </button>
          <button
            type="button"
            className="rounded bg-blue-500 px-3 py-1 text-white"
            onClick={() => setState('ready')}
          >
            Ready
          </button>
        </div>
        <div className="flex-1">
          <ProjectDetailPage
            {...createDefaultProps({
              state,
              errorMessage,
              onErrorRetry: () => {
                setState('loading');
                setTimeout(() => setState('ready'), 1500);
              },
              onNotFoundBack: () => setState('ready'),
            })}
          />
        </div>
      </div>
    );
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Constants reference
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <section>
        <h2 className="mb-4 text-xl font-bold">Default Values</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Constant</th>
              <th className="p-2 text-left">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-mono">DEFAULT_SKELETON_TASK_COUNT</td>
              <td className="p-2">{DEFAULT_SKELETON_TASK_COUNT}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">DEFAULT_PAGE_SIZE</td>
              <td className="p-2">{DEFAULT_PAGE_SIZE}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">DEFAULT_PAGE_LABEL</td>
              <td className="p-2">{DEFAULT_PAGE_LABEL}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">DEFAULT_ERROR_TITLE</td>
              <td className="p-2">{DEFAULT_ERROR_TITLE}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">DEFAULT_RETRY_LABEL</td>
              <td className="p-2">{DEFAULT_RETRY_LABEL}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">DEFAULT_BACK_LABEL</td>
              <td className="p-2">{DEFAULT_BACK_LABEL}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Screen Reader Announcements</h2>
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
              <td className="p-2">{SR_LOADING}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">SR_NOT_FOUND</td>
              <td className="p-2">{SR_NOT_FOUND}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">SR_ERROR_PREFIX</td>
              <td className="p-2">{SR_ERROR_PREFIX}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">SR_EMPTY</td>
              <td className="p-2">{SR_EMPTY}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">SR_LOADED_PREFIX</td>
              <td className="p-2">{SR_LOADED_PREFIX}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">CSS Classes</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Constant</th>
              <th className="p-2 text-left">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-mono">PROJECT_DETAIL_PAGE_BASE_CLASSES</td>
              <td className="p-2 font-mono text-xs">{PROJECT_DETAIL_PAGE_BASE_CLASSES}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">PROJECT_DETAIL_PAGE_ERROR_CLASSES</td>
              <td className="p-2 font-mono text-xs">{PROJECT_DETAIL_PAGE_ERROR_CLASSES}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">PROJECT_DETAIL_PAGE_SKELETON_CLASSES</td>
              <td className="p-2 font-mono text-xs">{PROJECT_DETAIL_PAGE_SKELETON_CLASSES}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Size Classes</h2>
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
                <td className="p-2 font-mono text-xs">{PAGE_SIZE_PADDING[size]}</td>
                <td className="p-2 font-mono text-xs">{PAGE_SIZE_GAP[size]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Utility Functions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">getBaseSize(size)</h3>
            <p className="text-sm text-gray-600">Extracts the base size from a responsive value.</p>
            <pre className="mt-1 rounded bg-gray-100 p-2 text-xs">
              getBaseSize('lg') → 'lg'{'\n'}
              getBaseSize({'{'} base: 'sm', md: 'lg' {'}'}) → 'sm'
            </pre>
          </div>
          <div>
            <h3 className="font-semibold">getResponsiveSizeClasses(size, classMap)</h3>
            <p className="text-sm text-gray-600">
              Generates responsive Tailwind classes from a size value.
            </p>
            <pre className="mt-1 rounded bg-gray-100 p-2 text-xs">
              getResponsiveSizeClasses('md', PAGE_SIZE_PADDING) → 'p-4 md:p-6'
            </pre>
          </div>
          <div>
            <h3 className="font-semibold">buildLoadedAnnouncement(project, taskCount)</h3>
            <p className="text-sm text-gray-600">
              Builds screen reader announcement for loaded state.
            </p>
            <pre className="mt-1 rounded bg-gray-100 p-2 text-xs">
              buildLoadedAnnouncement(project, 5) → 'Project loaded: MyApp with 5 tasks'
            </pre>
          </div>
          <div>
            <h3 className="font-semibold">buildPageAccessibleLabel(state, project?)</h3>
            <p className="text-sm text-gray-600">Builds accessible label based on page state.</p>
            <pre className="mt-1 rounded bg-gray-100 p-2 text-xs">
              buildPageAccessibleLabel('loading') → 'Loading project details...'{'\n'}
              buildPageAccessibleLabel('ready', project) → 'Project Details: MyApp'
            </pre>
          </div>
        </div>
      </section>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
