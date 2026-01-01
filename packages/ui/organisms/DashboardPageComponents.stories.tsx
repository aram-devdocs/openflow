import type { Task } from '@openflow/generated';
import { TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import {
  // Constants for accessibility documentation
  DEFAULT_CREATE_PROJECT_LABEL,
  DEFAULT_ERROR_RETRY_LABEL,
  DEFAULT_ERROR_TITLE,
  DEFAULT_RECENT_TASKS_EMPTY,
  DEFAULT_RECENT_TASKS_LABEL,
  DEFAULT_STATS_LABEL,
  DEFAULT_WELCOME_DESCRIPTION,
  DEFAULT_WELCOME_TITLE,
  DashboardContent,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLayout,
  DashboardLoadingSkeleton,
  DashboardStatsGrid,
  RecentTasksList,
  STATUS_LABELS,
  STAT_CARD_SIZE_CLASSES,
  StatCard,
  StatusBadge,
  // Utility functions
  buildHeaderSubtitle,
  buildStatsAnnouncement,
  buildTaskAccessibleLabel,
  getBaseSize,
  getResponsiveSizeClasses,
} from './DashboardPageComponents';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta = {
  title: 'Organisms/DashboardPageComponents',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Dashboard page components with comprehensive accessibility support.

## Accessibility Features

- **Semantic HTML**: Uses primitives (Heading, Text, VisuallyHidden, Flex) for proper structure
- **ARIA attributes**: role="status", role="alert", aria-live, aria-busy for state announcements
- **Keyboard navigation**: Focus rings with ring-offset for visibility
- **Touch targets**: Minimum 44px height for WCAG 2.5.5 compliance
- **Screen reader support**: VisuallyHidden announcements for state changes
- **List semantics**: Proper role="list" and role="listitem" for task lists

## Responsive Sizing

All components support responsive sizing via the \`size\` prop:
- String: \`'sm' | 'md' | 'lg'\`
- Responsive object: \`{ base: 'sm', md: 'md', lg: 'lg' }\`
        `,
      },
    },
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
  {
    id: 'task-3',
    projectId: 'proj-1',
    title: 'Write unit tests',
    description: 'Add test coverage',
    status: TaskStatus.Done,
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-13T10:00:00Z',
    updatedAt: '2024-01-13T10:00:00Z',
  },
  {
    id: 'task-4',
    projectId: 'proj-1',
    title: 'Code review',
    description: 'Review pull request',
    status: TaskStatus.Inreview,
    actionsRequiredCount: 1,
    autoStartNextStep: false,
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-01-12T10:00:00Z',
  },
  {
    id: 'task-5',
    projectId: 'proj-1',
    title: 'Deploy to staging',
    description: 'Deploy latest changes',
    status: TaskStatus.Todo,
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-11T10:00:00Z',
    updatedAt: '2024-01-11T10:00:00Z',
  },
];

// ============================================================================
// StatCard Stories
// ============================================================================

export const StatCardDefault: StoryObj<typeof StatCard> = {
  name: 'StatCard - Default',
  render: () => <StatCard label="Total Tasks" value={42} data-testid="stat-card-default" />,
  parameters: {
    docs: {
      description: {
        story: 'Default stat card with neutral styling.',
      },
    },
  },
};

export const StatCardInfo: StoryObj<typeof StatCard> = {
  name: 'StatCard - Info',
  render: () => (
    <StatCard label="In Progress" value={5} variant="info" data-testid="stat-card-info" />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Info variant for in-progress or active items.',
      },
    },
  },
};

export const StatCardWarning: StoryObj<typeof StatCard> = {
  name: 'StatCard - Warning',
  render: () => (
    <StatCard label="In Review" value={3} variant="warning" data-testid="stat-card-warning" />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Warning variant for items needing attention.',
      },
    },
  },
};

export const StatCardSuccess: StoryObj<typeof StatCard> = {
  name: 'StatCard - Success',
  render: () => (
    <StatCard label="Completed" value={15} variant="success" data-testid="stat-card-success" />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Success variant for completed items.',
      },
    },
  },
};

export const StatCardSizes: StoryObj<typeof StatCard> = {
  name: 'StatCard - Sizes',
  render: () => (
    <div className="flex flex-wrap gap-4 p-4">
      <StatCard label="Small" value={10} size="sm" data-testid="stat-card-sm" />
      <StatCard label="Medium" value={20} size="md" data-testid="stat-card-md" />
      <StatCard label="Large" value={30} size="lg" data-testid="stat-card-lg" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'StatCard supports three sizes: sm, md (default), and lg.',
      },
    },
  },
};

export const StatCardResponsive: StoryObj<typeof StatCard> = {
  name: 'StatCard - Responsive',
  render: () => (
    <div className="p-4">
      <StatCard
        label="Responsive"
        value={42}
        size={{ base: 'sm', md: 'md', lg: 'lg' }}
        data-testid="stat-card-responsive"
      />
      <p className="mt-4 text-sm text-muted-foreground">
        Resize the viewport to see the card change size at different breakpoints.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'StatCard can use responsive sizing with breakpoint-specific values.',
      },
    },
  },
};

export const StatCardAccessibility: StoryObj<typeof StatCard> = {
  name: 'StatCard - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>aria-label combines label and value for screen readers</li>
        <li>VisuallyHidden provides redundant label for assistive tech</li>
        <li>data-variant and data-size for styling hooks</li>
      </ul>
      <div className="flex gap-4">
        <StatCard
          label="Total Tasks"
          value={42}
          data-testid="stat-card-a11y"
          aria-describedby="stat-help"
        />
      </div>
      <p id="stat-help" className="text-xs text-muted-foreground">
        Screen readers will announce: "Total Tasks: 42"
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'StatCard includes comprehensive accessibility support for screen readers.',
      },
    },
  },
};

// ============================================================================
// StatusBadge Stories
// ============================================================================

export const StatusBadgeTodo: StoryObj<typeof StatusBadge> = {
  name: 'StatusBadge - Todo',
  render: () => <StatusBadge status={TaskStatus.Todo} data-testid="status-todo" />,
};

export const StatusBadgeInProgress: StoryObj<typeof StatusBadge> = {
  name: 'StatusBadge - In Progress',
  render: () => <StatusBadge status={TaskStatus.Inprogress} data-testid="status-inprogress" />,
};

export const StatusBadgeInReview: StoryObj<typeof StatusBadge> = {
  name: 'StatusBadge - In Review',
  render: () => <StatusBadge status={TaskStatus.Inreview} data-testid="status-inreview" />,
};

export const StatusBadgeDone: StoryObj<typeof StatusBadge> = {
  name: 'StatusBadge - Done',
  render: () => <StatusBadge status={TaskStatus.Done} data-testid="status-done" />,
};

export const StatusBadgeCancelled: StoryObj<typeof StatusBadge> = {
  name: 'StatusBadge - Cancelled',
  render: () => <StatusBadge status={TaskStatus.Cancelled} data-testid="status-cancelled" />,
};

export const StatusBadgeAllVariants: StoryObj<typeof StatusBadge> = {
  name: 'StatusBadge - All Variants',
  render: () => (
    <div className="flex flex-wrap gap-2 p-4">
      <StatusBadge status={TaskStatus.Todo} />
      <StatusBadge status={TaskStatus.Inprogress} />
      <StatusBadge status={TaskStatus.Inreview} />
      <StatusBadge status={TaskStatus.Done} />
      <StatusBadge status={TaskStatus.Cancelled} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available status badge variants displayed together.',
      },
    },
  },
};

export const StatusBadgeSizes: StoryObj<typeof StatusBadge> = {
  name: 'StatusBadge - Sizes',
  render: () => (
    <div className="flex flex-wrap items-center gap-4 p-4">
      <StatusBadge status={TaskStatus.Inprogress} size="sm" />
      <StatusBadge status={TaskStatus.Inprogress} size="md" />
      <StatusBadge status={TaskStatus.Inprogress} size="lg" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'StatusBadge supports three sizes: sm, md (default), and lg.',
      },
    },
  },
};

export const StatusBadgeAccessibility: StoryObj<typeof StatusBadge> = {
  name: 'StatusBadge - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>role="status" for live region announcement</li>
        <li>aria-label provides full status name</li>
        <li>Human-readable labels from STATUS_LABELS constant</li>
      </ul>
      <div className="flex gap-2">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="text-center">
            <StatusBadge status={status as TaskStatus} />
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'StatusBadge uses role="status" and aria-label for screen reader support.',
      },
    },
  },
};

// ============================================================================
// DashboardLayout Stories
// ============================================================================

export const Layout: StoryObj<typeof DashboardLayout> = {
  name: 'DashboardLayout',
  render: () => (
    <DashboardLayout
      sidebarCollapsed={false}
      isMobileDrawerOpen={false}
      onMobileDrawerToggle={() => {}}
      sidebar={<div className="p-4 h-full bg-[rgb(var(--card))]">Sidebar</div>}
      header={<div className="h-14 bg-[rgb(var(--card))] border-b border-[rgb(var(--border))]" />}
    >
      <div className="p-8 text-center text-[rgb(var(--muted-foreground))]">Dashboard content</div>
    </DashboardLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Main layout wrapper combining sidebar, header, and content areas.',
      },
    },
  },
};

// ============================================================================
// DashboardEmptyState Stories
// ============================================================================

export const EmptyState: StoryObj<typeof DashboardEmptyState> = {
  name: 'DashboardEmptyState',
  render: () => (
    <div className="h-96 flex">
      <DashboardEmptyState onNewProject={() => console.log('New project')} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state shown when no project is selected.',
      },
    },
  },
};

export const EmptyStateSizes: StoryObj<typeof DashboardEmptyState> = {
  name: 'DashboardEmptyState - Sizes',
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <div className="h-64 border rounded-lg flex">
          <DashboardEmptyState onNewProject={() => {}} size="sm" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium (default)</h3>
        <div className="h-64 border rounded-lg flex">
          <DashboardEmptyState onNewProject={() => {}} size="md" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <div className="h-64 border rounded-lg flex">
          <DashboardEmptyState onNewProject={() => {}} size="lg" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state at different sizes.',
      },
    },
  },
};

export const EmptyStateAccessibility: StoryObj<typeof DashboardEmptyState> = {
  name: 'DashboardEmptyState - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>role="region" with aria-label for landmark navigation</li>
        <li>VisuallyHidden announcement for screen readers</li>
        <li>Button has minimum 44px touch target</li>
        <li>Focus ring with ring-offset for visibility</li>
      </ul>
      <div className="text-sm">
        <strong>Default text:</strong>
        <p className="text-muted-foreground mt-1">{DEFAULT_WELCOME_TITLE}</p>
        <p className="text-muted-foreground">{DEFAULT_WELCOME_DESCRIPTION}</p>
        <p className="text-muted-foreground">Button: "{DEFAULT_CREATE_PROJECT_LABEL}"</p>
      </div>
      <div className="h-64 border rounded-lg flex">
        <DashboardEmptyState onNewProject={() => {}} data-testid="empty-a11y" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state includes comprehensive accessibility support.',
      },
    },
  },
};

// ============================================================================
// DashboardLoadingSkeleton Stories
// ============================================================================

export const Loading: StoryObj<typeof DashboardLoadingSkeleton> = {
  name: 'DashboardLoadingSkeleton',
  render: () => <DashboardLoadingSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton shown while dashboard data is loading.',
      },
    },
  },
};

export const LoadingSizes: StoryObj<typeof DashboardLoadingSkeleton> = {
  name: 'DashboardLoadingSkeleton - Sizes',
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <DashboardLoadingSkeleton size="sm" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <DashboardLoadingSkeleton size="lg" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton at different sizes affects padding.',
      },
    },
  },
};

export const LoadingAccessibility: StoryObj<typeof DashboardLoadingSkeleton> = {
  name: 'DashboardLoadingSkeleton - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>role="status" announces loading state</li>
        <li>aria-busy="true" indicates ongoing operation</li>
        <li>aria-label provides loading message</li>
        <li>VisuallyHidden provides screen reader announcement</li>
        <li>aria-hidden="true" on visual skeleton elements</li>
      </ul>
      <DashboardLoadingSkeleton data-testid="loading-a11y" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton uses ARIA attributes to announce loading state.',
      },
    },
  },
};

// ============================================================================
// DashboardErrorState Stories
// ============================================================================

export const ErrorState: StoryObj<typeof DashboardErrorState> = {
  name: 'DashboardErrorState',
  render: () => (
    <div className="h-96 flex">
      <DashboardErrorState
        message="Unable to connect to the server. Please check your internet connection."
        onRetry={() => console.log('Retry clicked')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state shown when dashboard loading fails.',
      },
    },
  },
};

export const ErrorStateWithoutRetry: StoryObj<typeof DashboardErrorState> = {
  name: 'DashboardErrorState - Without Retry',
  render: () => (
    <div className="h-96 flex">
      <DashboardErrorState message="This error cannot be recovered automatically." />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state without retry button for non-recoverable errors.',
      },
    },
  },
};

export const ErrorStateCustomLabels: StoryObj<typeof DashboardErrorState> = {
  name: 'DashboardErrorState - Custom Labels',
  render: () => (
    <div className="h-96 flex">
      <DashboardErrorState
        errorTitle="Connection Lost"
        message="Your session has expired."
        retryLabel="Reconnect"
        onRetry={() => console.log('Reconnect clicked')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state with customized title and retry button label.',
      },
    },
  },
};

export const ErrorStateAccessibility: StoryObj<typeof DashboardErrorState> = {
  name: 'DashboardErrorState - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>role="alert" for immediate announcement</li>
        <li>aria-live="assertive" for high-priority announcement</li>
        <li>VisuallyHidden provides error announcement</li>
        <li>Retry button has aria-label</li>
        <li>Icon is aria-hidden="true"</li>
      </ul>
      <div className="text-sm">
        <strong>Default labels:</strong>
        <p className="text-muted-foreground mt-1">Title: "{DEFAULT_ERROR_TITLE}"</p>
        <p className="text-muted-foreground">Button: "{DEFAULT_ERROR_RETRY_LABEL}"</p>
      </div>
      <div className="h-64 border rounded-lg flex">
        <DashboardErrorState
          message="Example error message"
          onRetry={() => {}}
          data-testid="error-a11y"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Error state uses role="alert" and aria-live="assertive" for immediate screen reader announcement.',
      },
    },
  },
};

// ============================================================================
// DashboardStatsGrid Stories
// ============================================================================

export const StatsGrid: StoryObj<typeof DashboardStatsGrid> = {
  name: 'DashboardStatsGrid',
  render: () => (
    <div className="p-4">
      <DashboardStatsGrid tasks={mockTasks} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Stats grid showing task counts by status.',
      },
    },
  },
};

export const StatsGridEmpty: StoryObj<typeof DashboardStatsGrid> = {
  name: 'DashboardStatsGrid - Empty',
  render: () => (
    <div className="p-4">
      <DashboardStatsGrid tasks={[]} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Stats grid with no tasks shows all zeros.',
      },
    },
  },
};

export const StatsGridSizes: StoryObj<typeof DashboardStatsGrid> = {
  name: 'DashboardStatsGrid - Sizes',
  render: () => (
    <div className="space-y-8 p-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <DashboardStatsGrid tasks={mockTasks} size="sm" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <DashboardStatsGrid tasks={mockTasks} size="lg" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Stats grid at different sizes.',
      },
    },
  },
};

export const StatsGridAccessibility: StoryObj<typeof DashboardStatsGrid> = {
  name: 'DashboardStatsGrid - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>role="region" with aria-labelledby for landmark</li>
        <li>VisuallyHidden heading for screen readers</li>
        <li>Stats announcement via aria-live="polite"</li>
        <li>Each StatCard has its own accessible label</li>
      </ul>
      <div className="text-sm">
        <strong>Screen reader announcement:</strong>
        <p className="text-muted-foreground mt-1 font-mono text-xs bg-muted p-2 rounded">
          "{buildStatsAnnouncement(mockTasks)}"
        </p>
        <p className="text-muted-foreground mt-2">Default label: "{DEFAULT_STATS_LABEL}"</p>
      </div>
      <DashboardStatsGrid
        tasks={mockTasks}
        statsLabel="Custom stats region label"
        data-testid="stats-a11y"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Stats grid includes region landmark and screen reader announcements.',
      },
    },
  },
};

// ============================================================================
// RecentTasksList Stories
// ============================================================================

export const RecentTasks: StoryObj<typeof RecentTasksList> = {
  name: 'RecentTasksList',
  render: () => (
    <div className="p-4 max-w-md">
      <RecentTasksList
        tasks={mockTasks}
        onSelectTask={(id: string) => console.log('Task selected:', id)}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'List of recent tasks with click-to-navigate functionality.',
      },
    },
  },
};

export const RecentTasksEmpty: StoryObj<typeof RecentTasksList> = {
  name: 'RecentTasksList - Empty',
  render: () => (
    <div className="p-4 max-w-md">
      <RecentTasksList tasks={[]} onSelectTask={() => {}} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no tasks exist.',
      },
    },
  },
};

export const RecentTasksCustomEmpty: StoryObj<typeof RecentTasksList> = {
  name: 'RecentTasksList - Custom Empty Message',
  render: () => (
    <div className="p-4 max-w-md">
      <RecentTasksList
        tasks={[]}
        onSelectTask={() => {}}
        emptyMessage="No recent activity. Start by creating your first task!"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state with custom message.',
      },
    },
  },
};

export const RecentTasksSizes: StoryObj<typeof RecentTasksList> = {
  name: 'RecentTasksList - Sizes',
  render: () => (
    <div className="space-y-8 p-4">
      <div className="max-w-md">
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <RecentTasksList tasks={mockTasks.slice(0, 3)} onSelectTask={() => {}} size="sm" />
      </div>
      <div className="max-w-md">
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <RecentTasksList tasks={mockTasks.slice(0, 3)} onSelectTask={() => {}} size="lg" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Task list at different sizes affects item padding and touch targets.',
      },
    },
  },
};

export const RecentTasksAccessibility: StoryObj<typeof RecentTasksList> = {
  name: 'RecentTasksList - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>role="region" with aria-labelledby heading</li>
        <li>role="list" and role="listitem" for proper semantics</li>
        <li>Each button has aria-label with task title and status</li>
        <li>Minimum 44px touch targets (WCAG 2.5.5)</li>
        <li>Focus visible ring with ring-offset</li>
        <li>Keyboard navigation support</li>
      </ul>
      <div className="text-sm">
        <strong>Example aria-label:</strong>
        <p className="text-muted-foreground mt-1 font-mono text-xs bg-muted p-2 rounded">
          "{mockTasks[0] ? buildTaskAccessibleLabel(mockTasks[0]) : ''}"
        </p>
        <p className="text-muted-foreground mt-2">Default labels:</p>
        <p className="text-muted-foreground text-xs">Heading: "{DEFAULT_RECENT_TASKS_LABEL}"</p>
        <p className="text-muted-foreground text-xs">Empty: "{DEFAULT_RECENT_TASKS_EMPTY}"</p>
      </div>
      <div className="max-w-md">
        <RecentTasksList
          tasks={mockTasks}
          onSelectTask={(id) => console.log('Selected:', id)}
          listLabel="Accessible Recent Tasks"
          data-testid="tasks-a11y"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Task list includes proper list semantics and accessible labels for each item.',
      },
    },
  },
};

// ============================================================================
// DashboardContent Stories
// ============================================================================

export const ContentWithProject: StoryObj<typeof DashboardContent> = {
  name: 'DashboardContent - With Project',
  render: () => (
    <DashboardContent
      isLoadingProjects={false}
      isLoadingTasks={false}
      activeProjectId="proj-1"
      tasks={mockTasks}
      onSelectTask={(id: string) => console.log('Task selected:', id)}
      onNewProject={() => console.log('New project')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dashboard content when a project is selected and loaded.',
      },
    },
  },
};

export const ContentNoProject: StoryObj<typeof DashboardContent> = {
  name: 'DashboardContent - No Project',
  render: () => (
    <div className="h-96 flex">
      <DashboardContent
        isLoadingProjects={false}
        isLoadingTasks={false}
        activeProjectId={undefined}
        tasks={[]}
        onSelectTask={() => {}}
        onNewProject={() => console.log('New project')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dashboard shows empty state when no project is selected.',
      },
    },
  },
};

export const ContentLoading: StoryObj<typeof DashboardContent> = {
  name: 'DashboardContent - Loading',
  render: () => (
    <DashboardContent
      isLoadingProjects={false}
      isLoadingTasks={true}
      activeProjectId="proj-1"
      tasks={[]}
      onSelectTask={() => {}}
      onNewProject={() => {}}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dashboard shows loading skeleton while tasks are loading.',
      },
    },
  },
};

export const ContentError: StoryObj<typeof DashboardContent> = {
  name: 'DashboardContent - Error',
  render: () => (
    <div className="h-96 flex">
      <DashboardContent
        isLoadingProjects={false}
        isLoadingTasks={false}
        activeProjectId="proj-1"
        tasks={[]}
        onSelectTask={() => {}}
        onNewProject={() => {}}
        error="Failed to load tasks. Please try again."
        onRetry={() => console.log('Retry clicked')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dashboard shows error state when loading fails.',
      },
    },
  },
};

export const ContentAllStates: StoryObj<typeof DashboardContent> = {
  name: 'DashboardContent - All States',
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-3 py-2 text-sm font-medium">Empty (No Project)</div>
        <div className="h-64 flex">
          <DashboardContent
            isLoadingProjects={false}
            isLoadingTasks={false}
            activeProjectId={undefined}
            tasks={[]}
            onSelectTask={() => {}}
            onNewProject={() => {}}
          />
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-3 py-2 text-sm font-medium">Loading</div>
        <div className="h-64 overflow-hidden">
          <DashboardContent
            isLoadingProjects={false}
            isLoadingTasks={true}
            activeProjectId="proj-1"
            tasks={[]}
            onSelectTask={() => {}}
            onNewProject={() => {}}
          />
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-3 py-2 text-sm font-medium">Error</div>
        <div className="h-64 flex">
          <DashboardContent
            isLoadingProjects={false}
            isLoadingTasks={false}
            activeProjectId="proj-1"
            tasks={[]}
            onSelectTask={() => {}}
            onNewProject={() => {}}
            error="Connection failed"
            onRetry={() => {}}
          />
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-3 py-2 text-sm font-medium">Loaded</div>
        <div className="h-64 overflow-auto">
          <DashboardContent
            isLoadingProjects={false}
            isLoadingTasks={false}
            activeProjectId="proj-1"
            tasks={mockTasks}
            onSelectTask={() => {}}
            onNewProject={() => {}}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all DashboardContent states side by side.',
      },
    },
  },
};

// ============================================================================
// Utility Functions Stories
// ============================================================================

export const UtilityFunctions: StoryObj = {
  name: 'Utility Functions',
  render: () => (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-semibold">Exported Utility Functions</h2>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">getBaseSize()</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Extracts base size from a responsive value.
          </p>
          <pre className="text-xs bg-muted p-2 rounded">
            {`getBaseSize('lg') → '${getBaseSize('lg')}'
getBaseSize({ base: 'sm', md: 'lg' }) → '${getBaseSize({ base: 'sm', md: 'lg' })}'`}
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">getResponsiveSizeClasses()</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Generates responsive Tailwind classes from size values.
          </p>
          <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">
            {`getResponsiveSizeClasses('md', STAT_CARD_SIZE_CLASSES)
→ '${getResponsiveSizeClasses('md', STAT_CARD_SIZE_CLASSES)}'

getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, STAT_CARD_SIZE_CLASSES)
→ '${getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, STAT_CARD_SIZE_CLASSES)}'`}
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">buildStatsAnnouncement()</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Builds screen reader announcement for stats grid.
          </p>
          <pre className="text-xs bg-muted p-2 rounded">
            {`buildStatsAnnouncement(mockTasks)
→ '${buildStatsAnnouncement(mockTasks)}'`}
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">buildTaskAccessibleLabel()</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Builds accessible label for task items.
          </p>
          <pre className="text-xs bg-muted p-2 rounded">
            {`buildTaskAccessibleLabel(task)
→ '${mockTasks[0] ? buildTaskAccessibleLabel(mockTasks[0]) : ''}'`}
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">buildHeaderSubtitle()</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Builds header subtitle based on task counts.
          </p>
          <pre className="text-xs bg-muted p-2 rounded">
            {`buildHeaderSubtitle(mockTasks, false)
→ '${buildHeaderSubtitle(mockTasks, false)}'

buildHeaderSubtitle([], false)
→ '${buildHeaderSubtitle([], false)}'`}
          </pre>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Utility functions exported for use in consuming components.',
      },
    },
  },
};

// ============================================================================
// Accessibility Overview Story
// ============================================================================

export const AccessibilityOverview: StoryObj = {
  name: 'Accessibility Overview',
  render: () => (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold mb-4">Accessibility Features</h1>
        <p className="text-muted-foreground">
          Dashboard components include comprehensive accessibility support following WCAG 2.1 AA
          guidelines.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Semantic Structure</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>
            <strong>Primitives:</strong> Uses Heading, Text, VisuallyHidden, Flex from
            @openflow/primitives
          </li>
          <li>
            <strong>Landmarks:</strong> role="region" with aria-labelledby for navigation
          </li>
          <li>
            <strong>Lists:</strong> role="list" and role="listitem" for proper semantics
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">ARIA Attributes</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="border rounded p-3">
            <strong className="block mb-1">Loading States</strong>
            <code className="text-xs">role="status" aria-busy="true"</code>
          </div>
          <div className="border rounded p-3">
            <strong className="block mb-1">Error States</strong>
            <code className="text-xs">role="alert" aria-live="assertive"</code>
          </div>
          <div className="border rounded p-3">
            <strong className="block mb-1">Status Badges</strong>
            <code className="text-xs">role="status" aria-label="..."</code>
          </div>
          <div className="border rounded p-3">
            <strong className="block mb-1">Stats Announcements</strong>
            <code className="text-xs">aria-live="polite"</code>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Touch Targets (WCAG 2.5.5)</h2>
        <p className="text-sm text-muted-foreground">
          All interactive elements have minimum 44px touch targets for mobile accessibility.
        </p>
        <div className="flex gap-4 items-center">
          <div className="w-11 h-11 border-2 border-dashed border-muted-foreground flex items-center justify-center text-xs">
            44px
          </div>
          <span className="text-sm">Minimum touch target size</span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Focus Management</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Focus rings with ring-offset for visibility against backgrounds</li>
          <li>Keyboard navigation support for all interactive elements</li>
          <li>Tab order follows visual layout</li>
        </ul>
        <div className="p-4 bg-muted rounded">
          <p className="text-sm mb-2">Example focus style:</p>
          <button
            type="button"
            className="px-4 py-2 bg-primary text-primary-foreground rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Focus me
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Screen Reader Support</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>VisuallyHidden components for screen reader announcements</li>
          <li>Descriptive aria-labels on all interactive elements</li>
          <li>Status announcements via aria-live regions</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Color & Contrast</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>All text meets WCAG AA contrast requirements</li>
          <li>Status colors have sufficient contrast</li>
          <li>Focus indicators visible against all backgrounds</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all accessibility features implemented in DashboardPageComponents.',
      },
    },
  },
};
