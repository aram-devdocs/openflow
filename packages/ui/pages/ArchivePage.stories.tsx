/**
 * Storybook stories for ArchivePage
 *
 * Demonstrates the complete archive page in various states:
 * - Default (with archived items)
 * - Loading state with skeleton
 * - Error state with retry button
 * - Empty states (no items per tab)
 * - With confirm dialog open
 * - Different tabs selected
 * - Mobile viewport
 * - Accessibility demos
 */

import type { Chat, Project, Task } from '@openflow/generated';
import { ChatRole, TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useRef, useState } from 'react';
import type { ArchiveTab } from '../organisms/ArchivePageComponents';
import {
  ArchivePage,
  ArchivePageError,
  type ArchivePageProps,
  ArchivePageSkeleton,
  DEFAULT_ERROR_TITLE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_RETRY_LABEL,
  DEFAULT_SKELETON_COUNT,
  SR_EMPTY,
  SR_ERROR_PREFIX,
  SR_LOADED_PREFIX,
  SR_LOADING,
} from './ArchivePage';

const meta: Meta<typeof ArchivePage> = {
  title: 'Pages/ArchivePage',
  component: ArchivePage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Archive page component with comprehensive accessibility support.

## Features
- **Page-level loading skeleton** - Shows skeleton UI during data loading
- **Error state with retry** - Graceful error handling with retry option
- **Empty state** - Contextual empty states for each tab
- **Screen reader announcements** - Live regions for state changes
- **Proper heading hierarchy** - h1 for page title
- **Responsive layout** - Works on all screen sizes
- **forwardRef support** - For focus management

## Accessibility
- ARIA live regions announce loading, error, and content states
- Proper landmark structure
- Touch targets ≥44px for WCAG 2.5.5
- Focus management with forwardRef
- Screen reader optimized state announcements
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
      description: 'Whether data is loading',
    },
    error: {
      control: 'object',
      description: 'Error object if an error occurred',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant for responsive layout',
    },
    'aria-label': {
      control: 'text',
      description: 'Custom aria-label for the page',
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for automated testing',
    },
  },
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

// Unused variables are prefixed with underscore to indicate they are intentionally unused
// in these story mock functions

// ============================================================================
// Default Props Factory
// ============================================================================

function createDefaultProps(overrides?: Partial<ArchivePageProps>): ArchivePageProps {
  return {
    isLoading: false,
    header: {
      archivedCount: mockArchivedTasks.length,
      activeTab: 'tasks' as ArchiveTab,
      onSearch: fn(),
    },
    tabBar: {
      activeTab: 'tasks' as ArchiveTab,
      onTabChange: fn(),
      taskCount: mockArchivedTasks.length,
      chatCount: mockArchivedChats.length,
      projectCount: mockArchivedProjects.length,
      onBack: fn(),
    },
    tasks: {
      archivedTasks: mockArchivedTasks,
      selectedTask: null,
      isRestoringTask: false,
      onSelectTask: fn(),
      onRestoreTask: fn(),
      onDeleteTask: fn(),
    },
    chats: {
      archivedChats: mockArchivedChats,
      selectedChat: null,
      isRestoringChat: false,
      onSelectChat: fn(),
      onRestoreChat: fn(),
      onDeleteChat: fn(),
    },
    projects: {
      archivedProjects: mockArchivedProjects,
      selectedProject: null,
      isRestoringProject: false,
      onSelectProject: fn(),
      onRestoreProject: fn(),
      onDeleteProject: fn(),
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
      onClose: fn(),
      onConfirm: fn(),
      title: '',
      description: '',
    },
    ...overrides,
  };
}

// ============================================================================
// Basic Examples
// ============================================================================

/**
 * Default archive page with tasks tab active
 */
export const Default: Story = {
  args: createDefaultProps(),
};

/**
 * Archive page in loading state with skeleton
 */
export const Loading: Story = {
  args: createDefaultProps({
    isLoading: true,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Shows a skeleton loading state while data is being fetched. Screen readers announce "Loading archive. Please wait."',
      },
    },
  },
};

/**
 * Archive page with error state
 */
export const ErrorState: Story = {
  args: createDefaultProps({
    error: new Error('Failed to connect to server. Please check your network connection.'),
    onRetry: fn(),
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Shows an error state with a retry button. The error message is announced to screen readers with role="alert".',
      },
    },
  },
};

/**
 * Archive page with chats tab active
 */
export const ChatsTab: Story = {
  args: createDefaultProps({
    header: {
      archivedCount: mockArchivedChats.length,
      activeTab: 'chats' as ArchiveTab,
      onSearch: fn(),
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
      onSearch: fn(),
    },
    tabBar: {
      ...createDefaultProps().tabBar,
      activeTab: 'projects' as ArchiveTab,
    },
  }),
};

// ============================================================================
// Empty States
// ============================================================================

/**
 * Empty tasks tab
 */
export const EmptyTasksTab: Story = {
  args: createDefaultProps({
    header: {
      archivedCount: 0,
      activeTab: 'tasks' as ArchiveTab,
      onSearch: fn(),
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
      onSearch: fn(),
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
      onSearch: fn(),
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
      onSearch: fn(),
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

// ============================================================================
// Selection States
// ============================================================================

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

// ============================================================================
// Dialog States
// ============================================================================

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
      onClose: fn(),
      onConfirm: fn(),
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
      onClose: fn(),
      onConfirm: fn(),
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

// ============================================================================
// Content Variations
// ============================================================================

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
        onSearch: fn(),
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

// ============================================================================
// Viewport Variations
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
 * Skeleton component standalone
 */
export const SkeletonStandalone: Story = {
  render: () => (
    <div className="h-screen w-screen">
      <ArchivePageSkeleton itemCount={5} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The skeleton component shown during loading state.',
      },
    },
  },
};

/**
 * Error component standalone
 */
export const ErrorStandalone: Story = {
  render: () => (
    <div className="h-screen w-screen">
      <ArchivePageError
        error={new Error('Network connection lost')}
        onRetry={() => console.log('Retry clicked')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The error component shown when data loading fails. Has role="alert" for screen reader announcement.',
      },
    },
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Screen reader accessibility demo
 */
export const ScreenReaderAccessibility: Story = {
  render: () => {
    const [state, setState] = useState<'loading' | 'error' | 'loaded'>('loaded');
    const [activeTab, setActiveTab] = useState<ArchiveTab>('tasks');

    return (
      <div className="flex h-screen w-screen flex-col">
        <div className="bg-muted p-4 border-b">
          <p className="text-sm mb-2">
            <strong>Screen Reader Demo:</strong> Use a screen reader to hear announcements for
            different states.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setState('loading')}
              className="px-3 py-1 border rounded text-sm"
            >
              Simulate Loading
            </button>
            <button
              type="button"
              onClick={() => setState('error')}
              className="px-3 py-1 border rounded text-sm"
            >
              Simulate Error
            </button>
            <button
              type="button"
              onClick={() => setState('loaded')}
              className="px-3 py-1 border rounded text-sm"
            >
              Show Content
            </button>
          </div>
        </div>
        <div className="flex-1">
          <ArchivePage
            {...createDefaultProps()}
            isLoading={state === 'loading'}
            error={state === 'error' ? new Error('Demo error for testing') : null}
            onRetry={() => setState('loaded')}
            header={{ ...createDefaultProps().header, activeTab }}
            tabBar={{
              ...createDefaultProps().tabBar,
              activeTab,
              onTabChange: setActiveTab,
            }}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates screen reader announcements:
- **Loading**: "${SR_LOADING}"
- **Error**: "${SR_ERROR_PREFIX} [error message]"
- **Empty**: "${SR_EMPTY}"
- **Loaded**: "${SR_LOADED_PREFIX} Showing X archived items in [tab] tab."
        `,
      },
    },
  },
};

/**
 * Focus ring visibility demo
 */
export const FocusRingVisibility: Story = {
  args: createDefaultProps(),
  parameters: {
    docs: {
      description: {
        story:
          'Tab through the interface to see focus rings on all interactive elements. Focus rings have a 2px offset for visibility on all backgrounds.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Focus the first focusable element
    const firstButton = canvasElement.querySelector('button');
    if (firstButton) {
      firstButton.focus();
    }
  },
};

/**
 * Keyboard navigation demo
 */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="flex h-screen w-screen flex-col">
      <div className="bg-muted p-4 border-b">
        <p className="text-sm">
          <strong>Keyboard Navigation:</strong>
        </p>
        <ul className="text-sm mt-2 list-disc list-inside">
          <li>
            <kbd className="px-1 border rounded">Tab</kbd> - Move between interactive elements
          </li>
          <li>
            <kbd className="px-1 border rounded">Arrow Left/Right</kbd> - Navigate tabs
          </li>
          <li>
            <kbd className="px-1 border rounded">Home/End</kbd> - Jump to first/last tab
          </li>
          <li>
            <kbd className="px-1 border rounded">Enter/Space</kbd> - Activate selection
          </li>
        </ul>
      </div>
      <div className="flex-1">
        <ArchivePage {...createDefaultProps()} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates keyboard navigation patterns for the archive page.',
      },
    },
  },
};

/**
 * Ref forwarding demo
 */
export const RefForwarding: Story = {
  render: () => {
    const ref = useRef<HTMLDivElement>(null);

    return (
      <div className="flex h-screen w-screen flex-col">
        <div className="bg-muted p-4 border-b flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (ref.current) {
                ref.current.focus();
                console.log('Page focused via ref');
              }
            }}
            className="px-3 py-1 border rounded text-sm"
          >
            Focus Page via Ref
          </button>
          <button
            type="button"
            onClick={() => {
              if (ref.current) {
                console.log('Ref element:', ref.current);
                console.log('data-state:', ref.current.dataset.state);
                console.log('data-active-tab:', ref.current.dataset.activeTab);
              }
            }}
            className="px-3 py-1 border rounded text-sm"
          >
            Log Ref Data
          </button>
        </div>
        <div className="flex-1">
          <ArchivePage ref={ref} {...createDefaultProps()} />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates ref forwarding for programmatic focus management and DOM access. Check console for logged data.',
      },
    },
  },
};

/**
 * Data attributes demo
 */
export const DataAttributes: Story = {
  render: () => (
    <div className="flex h-screen w-screen flex-col">
      <div className="bg-muted p-4 border-b">
        <p className="text-sm">
          <strong>Data Attributes:</strong> Inspect the DOM to see these attributes on the page
          container:
        </p>
        <ul className="text-sm mt-2 list-disc list-inside">
          <li>
            <code>data-testid="archive-page"</code> - For automated testing
          </li>
          <li>
            <code>data-state="loading|error|empty|loaded"</code> - Current page state
          </li>
          <li>
            <code>data-active-tab="tasks|chats|projects"</code> - Currently active tab
          </li>
          <li>
            <code>data-total-items="6"</code> - Total items across all tabs
          </li>
        </ul>
      </div>
      <div className="flex-1">
        <ArchivePage {...createDefaultProps()} data-testid="demo-archive-page" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows the data attributes available for testing and CSS styling.',
      },
    },
  },
};

// ============================================================================
// Interactive Demo
// ============================================================================

/**
 * Interactive demo with full state management
 */
export const InteractiveDemo: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<ArchiveTab>('tasks');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Task | null>(null);

    const handleDeleteTask = (task: Task) => {
      setItemToDelete(task);
      setConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
      console.log('Deleting task:', itemToDelete?.title);
      setConfirmOpen(false);
      setItemToDelete(null);
      setSelectedTask(null);
    };

    return (
      <div className="h-screen w-screen">
        <ArchivePage
          isLoading={false}
          header={{
            archivedCount:
              activeTab === 'tasks'
                ? mockArchivedTasks.length
                : activeTab === 'chats'
                  ? mockArchivedChats.length
                  : mockArchivedProjects.length,
            activeTab,
            onSearch: () => console.log('Search clicked'),
          }}
          tabBar={{
            activeTab,
            onTabChange: setActiveTab,
            taskCount: mockArchivedTasks.length,
            chatCount: mockArchivedChats.length,
            projectCount: mockArchivedProjects.length,
            onBack: () => console.log('Back clicked'),
          }}
          tasks={{
            archivedTasks: mockArchivedTasks,
            selectedTask,
            isRestoringTask: false,
            onSelectTask: setSelectedTask,
            onRestoreTask: (task) => console.log('Restore task:', task.title),
            onDeleteTask: handleDeleteTask,
          }}
          chats={{
            archivedChats: mockArchivedChats,
            selectedChat: null,
            isRestoringChat: false,
            onSelectChat: () => {},
            onRestoreChat: (chat) => console.log('Restore chat:', chat.title),
            onDeleteChat: () => {},
          }}
          projects={{
            archivedProjects: mockArchivedProjects,
            selectedProject: null,
            isRestoringProject: false,
            onSelectProject: () => {},
            onRestoreProject: (project) => console.log('Restore project:', project.name),
            onDeleteProject: () => {},
          }}
          helpers={{
            getProjectName: (projectId) => mockProjectsMap[projectId] ?? 'Unknown Project',
            getTaskTitle: () => null,
            formatDate: (dateString) => {
              if (!dateString) return 'Unknown';
              return new Date(dateString).toLocaleDateString();
            },
          }}
          confirmDialog={{
            isOpen: confirmOpen,
            onClose: () => setConfirmOpen(false),
            onConfirm: handleConfirmDelete,
            title: 'Delete Task',
            description: itemToDelete
              ? `Are you sure you want to permanently delete "${itemToDelete.title}"? This action cannot be undone.`
              : '',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            variant: 'destructive',
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fully interactive demo with tab switching, item selection, and delete confirmation. Check console for action logs.',
      },
    },
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Constants reference for testing
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">ArchivePage Constants Reference</h2>

      <div className="space-y-2">
        <h3 className="font-semibold">Defaults</h3>
        <ul className="list-disc list-inside text-sm">
          <li>DEFAULT_SKELETON_COUNT: {DEFAULT_SKELETON_COUNT}</li>
          <li>DEFAULT_PAGE_SIZE: {DEFAULT_PAGE_SIZE}</li>
          <li>DEFAULT_ERROR_TITLE: {DEFAULT_ERROR_TITLE}</li>
          <li>DEFAULT_RETRY_LABEL: {DEFAULT_RETRY_LABEL}</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Screen Reader Announcements</h3>
        <ul className="list-disc list-inside text-sm">
          <li>SR_LOADING: "{SR_LOADING}"</li>
          <li>SR_ERROR_PREFIX: "{SR_ERROR_PREFIX}"</li>
          <li>SR_EMPTY: "{SR_EMPTY}"</li>
          <li>SR_LOADED_PREFIX: "{SR_LOADED_PREFIX}"</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Reference of all exported constants from ArchivePage for testing and verification.',
      },
    },
  },
};
