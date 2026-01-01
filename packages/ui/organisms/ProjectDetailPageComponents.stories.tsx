import type { Project, Task, WorkflowTemplate } from '@openflow/generated';
import { TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import {
  BUTTON_SIZE_MAP,
  // Constants for accessibility documentation
  DEFAULT_BACK_LABEL,
  DEFAULT_BREADCRUMB_SEPARATOR,
  DEFAULT_CREATE_TASK_LABEL,
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_RETRY_LABEL,
  DEFAULT_ERROR_TITLE,
  DEFAULT_NEW_TASK_LABEL,
  DEFAULT_NOT_FOUND_DESCRIPTION,
  DEFAULT_NOT_FOUND_TITLE,
  DEFAULT_PROJECTS_LABEL,
  DEFAULT_SETTINGS_LABEL,
  DEFAULT_SKELETON_COUNT,
  ICON_SIZE_MAP,
  INFO_BAR_PADDING_CLASSES,
  PROJECT_DETAIL_PADDING_CLASSES,
  ProjectCreateTaskDialog,
  ProjectDetailContent,
  ProjectDetailErrorState,
  ProjectDetailHeader,
  ProjectDetailInfoBar,
  ProjectDetailLayout,
  ProjectDetailLoadingSkeleton,
  ProjectNotFound,
  SR_CREATING_TASK,
  SR_EMPTY,
  SR_ERROR,
  SR_LOADING,
  SR_NOT_FOUND,
  SR_PROJECT_LOADED,
  SR_TASKS_LOADED,
  SR_TASK_CREATED,
  // Utility functions
  buildBreadcrumbAccessibleLabel,
  buildHeaderAccessibleLabel,
  buildTaskCountAnnouncement,
  getBaseSize,
  getResponsiveSizeClasses,
} from './ProjectDetailPageComponents';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta = {
  title: 'Organisms/ProjectDetailPageComponents',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Project detail page components with comprehensive accessibility support.

## Accessibility Features

- **Semantic HTML**: Uses primitives (Heading, Text, VisuallyHidden, Flex) for proper structure
- **ARIA attributes**: role="status", role="alert", aria-live, aria-busy for state announcements
- **Keyboard navigation**: Focus rings with ring-offset for visibility
- **Touch targets**: Minimum 44px height for WCAG 2.5.5 compliance
- **Screen reader support**: VisuallyHidden announcements for state changes
- **Breadcrumb navigation**: aria-label for accessible navigation
- **Form accessibility**: Proper labels, error states, and ARIA attributes

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

const mockProject: Project = {
  id: 'proj-1',
  name: 'OpenFlow',
  icon: '🚀',
  gitRepoPath: '/Users/dev/openflow',
  baseBranch: 'main',
  setupScript: 'pnpm install',
  devScript: 'pnpm dev',
  workflowsFolder: '.workflows',
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-10T10:00:00Z',
};

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
    description: 'Add test coverage for core modules',
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
    description: 'Review pull request #42',
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
    description: 'Deploy latest changes to staging environment',
    status: TaskStatus.Todo,
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-11T10:00:00Z',
    updatedAt: '2024-01-11T10:00:00Z',
  },
];

const mockWorkflows: WorkflowTemplate[] = [
  {
    id: 'workflow-1',
    name: 'Standard Development',
    description: 'Standard workflow for new features',
    content: '### [ ] Step: Research\nAnalyze requirements\n\n### [ ] Step: Implement\nWrite code',
    isBuiltin: true,
    steps: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workflow-2',
    name: 'Bug Fix',
    description: 'Quick workflow for bug fixes',
    content: '### [ ] Step: Investigate\nFind root cause\n\n### [ ] Step: Fix\nApply fix',
    isBuiltin: true,
    steps: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// ============================================================================
// ProjectDetailLayout Stories
// ============================================================================

export const Layout: StoryObj<typeof ProjectDetailLayout> = {
  name: 'ProjectDetailLayout',
  render: () => (
    <ProjectDetailLayout
      sidebarCollapsed={false}
      isMobileDrawerOpen={false}
      onMobileDrawerToggle={() => {}}
      sidebar={<div className="p-4 h-full bg-[rgb(var(--card))]">Sidebar Content</div>}
      header={<div className="h-14 bg-[rgb(var(--card))] border-b border-[rgb(var(--border))]" />}
    >
      <div className="p-8 text-center text-[rgb(var(--muted-foreground))]">
        Project content area
      </div>
    </ProjectDetailLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Main layout wrapper combining sidebar, header, and content areas.',
      },
    },
  },
};

export const LayoutCollapsed: StoryObj<typeof ProjectDetailLayout> = {
  name: 'ProjectDetailLayout - Collapsed Sidebar',
  render: () => (
    <ProjectDetailLayout
      sidebarCollapsed={true}
      isMobileDrawerOpen={false}
      onMobileDrawerToggle={() => {}}
      sidebar={null}
      header={<div className="h-14 bg-[rgb(var(--card))] border-b border-[rgb(var(--border))]" />}
    >
      <div className="p-8 text-center text-[rgb(var(--muted-foreground))]">
        Content with collapsed sidebar
      </div>
    </ProjectDetailLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Layout with sidebar collapsed for more content space.',
      },
    },
  },
};

// ============================================================================
// ProjectDetailHeader Stories
// ============================================================================

export const Header: StoryObj<typeof ProjectDetailHeader> = {
  name: 'ProjectDetailHeader',
  render: () => (
    <ProjectDetailHeader
      project={mockProject}
      onSearch={() => console.log('Search')}
      onNewTask={() => console.log('New task')}
      data-testid="header-default"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Header component showing project name and branch.',
      },
    },
  },
};

export const HeaderSizes: StoryObj<typeof ProjectDetailHeader> = {
  name: 'ProjectDetailHeader - Sizes',
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <ProjectDetailHeader
          project={mockProject}
          onSearch={() => {}}
          onNewTask={() => {}}
          size="sm"
          data-testid="header-sm"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium (default)</h3>
        <ProjectDetailHeader
          project={mockProject}
          onSearch={() => {}}
          onNewTask={() => {}}
          size="md"
          data-testid="header-md"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <ProjectDetailHeader
          project={mockProject}
          onSearch={() => {}}
          onNewTask={() => {}}
          size="lg"
          data-testid="header-lg"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Header at different sizes.',
      },
    },
  },
};

export const HeaderAccessibility: StoryObj<typeof ProjectDetailHeader> = {
  name: 'ProjectDetailHeader - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>VisuallyHidden announcement for screen readers</li>
        <li>Announces project name and branch</li>
        <li>data-size attribute for styling hooks</li>
      </ul>
      <div className="text-sm">
        <strong>Screen reader announcement:</strong>
        <p className="text-muted-foreground mt-1 font-mono text-xs bg-muted p-2 rounded">
          "{buildHeaderAccessibleLabel(mockProject)}"
        </p>
      </div>
      <ProjectDetailHeader
        project={mockProject}
        onSearch={() => {}}
        onNewTask={() => {}}
        data-testid="header-a11y"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Header includes screen reader announcements for project context.',
      },
    },
  },
};

// ============================================================================
// ProjectDetailLoadingSkeleton Stories
// ============================================================================

export const Loading: StoryObj<typeof ProjectDetailLoadingSkeleton> = {
  name: 'ProjectDetailLoadingSkeleton',
  render: () => <ProjectDetailLoadingSkeleton data-testid="loading-default" />,
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton shown while project data is loading.',
      },
    },
  },
};

export const LoadingCustomCount: StoryObj<typeof ProjectDetailLoadingSkeleton> = {
  name: 'ProjectDetailLoadingSkeleton - Custom Count',
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">3 skeleton items</h3>
        <ProjectDetailLoadingSkeleton skeletonCount={3} data-testid="loading-3" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">10 skeleton items</h3>
        <ProjectDetailLoadingSkeleton skeletonCount={10} data-testid="loading-10" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `Loading skeleton with custom skeleton count. Default is ${DEFAULT_SKELETON_COUNT}.`,
      },
    },
  },
};

export const LoadingSizes: StoryObj<typeof ProjectDetailLoadingSkeleton> = {
  name: 'ProjectDetailLoadingSkeleton - Sizes',
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <ProjectDetailLoadingSkeleton size="sm" skeletonCount={3} data-testid="loading-sm" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <ProjectDetailLoadingSkeleton size="lg" skeletonCount={3} data-testid="loading-lg" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton at different sizes affects padding and gap.',
      },
    },
  },
};

export const LoadingAccessibility: StoryObj<typeof ProjectDetailLoadingSkeleton> = {
  name: 'ProjectDetailLoadingSkeleton - Accessibility',
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
      <div className="text-sm">
        <strong>Screen reader announcement:</strong>
        <p className="text-muted-foreground mt-1 font-mono text-xs bg-muted p-2 rounded">
          "{SR_LOADING}"
        </p>
      </div>
      <ProjectDetailLoadingSkeleton skeletonCount={3} data-testid="loading-a11y" />
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
// ProjectNotFound Stories
// ============================================================================

export const NotFound: StoryObj<typeof ProjectNotFound> = {
  name: 'ProjectNotFound',
  render: () => (
    <ProjectNotFound
      onBack={() => console.log('Back')}
      onSearch={() => console.log('Search')}
      data-testid="not-found-default"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Not found state when project does not exist.',
      },
    },
  },
};

export const NotFoundSizes: StoryObj<typeof ProjectNotFound> = {
  name: 'ProjectNotFound - Sizes',
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <div className="h-64 border rounded-lg">
          <ProjectNotFound
            onBack={() => {}}
            onSearch={() => {}}
            size="sm"
            data-testid="not-found-sm"
          />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <div className="h-64 border rounded-lg">
          <ProjectNotFound
            onBack={() => {}}
            onSearch={() => {}}
            size="lg"
            data-testid="not-found-lg"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Not found state at different sizes.',
      },
    },
  },
};

export const NotFoundAccessibility: StoryObj<typeof ProjectNotFound> = {
  name: 'ProjectNotFound - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>role="region" with aria-label for landmark navigation</li>
        <li>VisuallyHidden announcement for screen readers</li>
        <li>Button has minimum 44px touch target</li>
        <li>aria-label on back button</li>
        <li>Icon is aria-hidden="true"</li>
      </ul>
      <div className="text-sm">
        <strong>Default text:</strong>
        <p className="text-muted-foreground mt-1">Title: "{DEFAULT_NOT_FOUND_TITLE}"</p>
        <p className="text-muted-foreground">Description: "{DEFAULT_NOT_FOUND_DESCRIPTION}"</p>
        <p className="text-muted-foreground">Button: "{DEFAULT_BACK_LABEL}"</p>
      </div>
      <div className="text-sm mt-4">
        <strong>Screen reader announcement:</strong>
        <p className="text-muted-foreground mt-1 font-mono text-xs bg-muted p-2 rounded">
          "{SR_NOT_FOUND}. {DEFAULT_NOT_FOUND_DESCRIPTION}"
        </p>
      </div>
      <div className="h-64 border rounded-lg">
        <ProjectNotFound onBack={() => {}} onSearch={() => {}} data-testid="not-found-a11y" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Not found state includes comprehensive accessibility support.',
      },
    },
  },
};

// ============================================================================
// ProjectDetailErrorState Stories
// ============================================================================

export const ErrorState: StoryObj<typeof ProjectDetailErrorState> = {
  name: 'ProjectDetailErrorState',
  render: () => (
    <div className="h-96">
      <ProjectDetailErrorState
        message="Unable to connect to the server. Please check your internet connection."
        onRetry={() => console.log('Retry clicked')}
        onBack={() => console.log('Back clicked')}
        onSearch={() => console.log('Search clicked')}
        data-testid="error-default"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state shown when project loading fails.',
      },
    },
  },
};

export const ErrorStateWithoutRetry: StoryObj<typeof ProjectDetailErrorState> = {
  name: 'ProjectDetailErrorState - Without Retry',
  render: () => (
    <div className="h-96">
      <ProjectDetailErrorState
        message="This error cannot be recovered automatically."
        onBack={() => console.log('Back clicked')}
        data-testid="error-no-retry"
      />
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

export const ErrorStateCustomLabels: StoryObj<typeof ProjectDetailErrorState> = {
  name: 'ProjectDetailErrorState - Custom Labels',
  render: () => (
    <div className="h-96">
      <ProjectDetailErrorState
        errorTitle="Connection Lost"
        message="Your session has expired."
        retryLabel="Reconnect"
        onRetry={() => console.log('Reconnect clicked')}
        onBack={() => console.log('Back clicked')}
        data-testid="error-custom"
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

export const ErrorStateSizes: StoryObj<typeof ProjectDetailErrorState> = {
  name: 'ProjectDetailErrorState - Sizes',
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <div className="h-64 border rounded-lg">
          <ProjectDetailErrorState
            message="Error message"
            onRetry={() => {}}
            size="sm"
            data-testid="error-sm"
          />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <div className="h-64 border rounded-lg">
          <ProjectDetailErrorState
            message="Error message"
            onRetry={() => {}}
            size="lg"
            data-testid="error-lg"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state at different sizes.',
      },
    },
  },
};

export const ErrorStateAccessibility: StoryObj<typeof ProjectDetailErrorState> = {
  name: 'ProjectDetailErrorState - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>role="alert" for immediate announcement</li>
        <li>aria-live="assertive" for high-priority announcement</li>
        <li>VisuallyHidden provides error announcement</li>
        <li>Retry button has aria-label</li>
        <li>Icon is aria-hidden="true"</li>
        <li>Minimum 44px touch targets on mobile</li>
      </ul>
      <div className="text-sm">
        <strong>Default labels:</strong>
        <p className="text-muted-foreground mt-1">Title: "{DEFAULT_ERROR_TITLE}"</p>
        <p className="text-muted-foreground">Button: "{DEFAULT_ERROR_RETRY_LABEL}"</p>
      </div>
      <div className="text-sm mt-4">
        <strong>Screen reader announcement:</strong>
        <p className="text-muted-foreground mt-1 font-mono text-xs bg-muted p-2 rounded">
          "{SR_ERROR}. [error message]"
        </p>
      </div>
      <div className="h-64 border rounded-lg">
        <ProjectDetailErrorState
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
// ProjectDetailInfoBar Stories
// ============================================================================

export const InfoBar: StoryObj<typeof ProjectDetailInfoBar> = {
  name: 'ProjectDetailInfoBar',
  render: () => (
    <ProjectDetailInfoBar
      project={mockProject}
      onBack={() => console.log('Back')}
      onSettings={() => console.log('Settings')}
      onNewTask={() => console.log('New task')}
      data-testid="infobar-default"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Info bar showing breadcrumb navigation and project actions.',
      },
    },
  },
};

export const InfoBarSizes: StoryObj<typeof ProjectDetailInfoBar> = {
  name: 'ProjectDetailInfoBar - Sizes',
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <ProjectDetailInfoBar
          project={mockProject}
          onBack={() => {}}
          onSettings={() => {}}
          onNewTask={() => {}}
          size="sm"
          data-testid="infobar-sm"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium (default)</h3>
        <ProjectDetailInfoBar
          project={mockProject}
          onBack={() => {}}
          onSettings={() => {}}
          onNewTask={() => {}}
          size="md"
          data-testid="infobar-md"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <ProjectDetailInfoBar
          project={mockProject}
          onBack={() => {}}
          onSettings={() => {}}
          onNewTask={() => {}}
          size="lg"
          data-testid="infobar-lg"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Info bar at different sizes affects padding and button sizes.',
      },
    },
  },
};

export const InfoBarResponsive: StoryObj<typeof ProjectDetailInfoBar> = {
  name: 'ProjectDetailInfoBar - Responsive',
  render: () => (
    <div className="p-4">
      <ProjectDetailInfoBar
        project={mockProject}
        onBack={() => {}}
        onSettings={() => {}}
        onNewTask={() => {}}
        size={{ base: 'sm', md: 'md', lg: 'lg' }}
        data-testid="infobar-responsive"
      />
      <p className="mt-4 text-sm text-muted-foreground">
        Resize the viewport to see the info bar change size at different breakpoints.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Info bar can use responsive sizing with breakpoint-specific values.',
      },
    },
  },
};

export const InfoBarAccessibility: StoryObj<typeof ProjectDetailInfoBar> = {
  name: 'ProjectDetailInfoBar - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>nav element with aria-label="Breadcrumb navigation"</li>
        <li>aria-current="page" on current location</li>
        <li>Breadcrumb separator is aria-hidden="true"</li>
        <li>Back button has descriptive aria-label</li>
        <li>Settings button has aria-label</li>
        <li>Minimum 44px touch targets on mobile</li>
      </ul>
      <div className="text-sm">
        <strong>Breadcrumb accessible label:</strong>
        <p className="text-muted-foreground mt-1 font-mono text-xs bg-muted p-2 rounded">
          "{buildBreadcrumbAccessibleLabel(mockProject.name)}"
        </p>
        <p className="text-muted-foreground mt-2">Settings label: "{DEFAULT_SETTINGS_LABEL}"</p>
        <p className="text-muted-foreground">Separator: "{DEFAULT_BREADCRUMB_SEPARATOR}"</p>
      </div>
      <ProjectDetailInfoBar
        project={mockProject}
        onBack={() => {}}
        onSettings={() => {}}
        onNewTask={() => {}}
        data-testid="infobar-a11y"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Info bar includes breadcrumb navigation with proper ARIA attributes.',
      },
    },
  },
};

// ============================================================================
// ProjectDetailContent Stories
// ============================================================================

export const ContentWithTasks: StoryObj<typeof ProjectDetailContent> = {
  name: 'ProjectDetailContent - With Tasks',
  render: () => (
    <ProjectDetailContent
      tasks={mockTasks}
      isLoading={false}
      onSelectTask={(id: string) => console.log('Task selected:', id)}
      onTaskStatusChange={(id: string, status: TaskStatus) =>
        console.log('Status change:', id, status)
      }
      onNewTask={() => console.log('New task')}
      data-testid="content-tasks"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Content area showing a list of tasks.',
      },
    },
  },
};

export const ContentEmpty: StoryObj<typeof ProjectDetailContent> = {
  name: 'ProjectDetailContent - Empty',
  render: () => (
    <div className="h-96">
      <ProjectDetailContent
        tasks={[]}
        isLoading={false}
        onSelectTask={() => {}}
        onTaskStatusChange={() => {}}
        onNewTask={() => console.log('New task')}
        data-testid="content-empty"
      />
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

export const ContentLoading: StoryObj<typeof ProjectDetailContent> = {
  name: 'ProjectDetailContent - Loading',
  render: () => (
    <ProjectDetailContent
      tasks={[]}
      isLoading={true}
      onSelectTask={() => {}}
      onTaskStatusChange={() => {}}
      onNewTask={() => {}}
      data-testid="content-loading"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading state while tasks are being fetched.',
      },
    },
  },
};

export const ContentError: StoryObj<typeof ProjectDetailContent> = {
  name: 'ProjectDetailContent - Error',
  render: () => (
    <div className="h-96">
      <ProjectDetailContent
        tasks={[]}
        isLoading={false}
        error="Failed to load tasks. Please try again."
        onSelectTask={() => {}}
        onTaskStatusChange={() => {}}
        onNewTask={() => {}}
        onRetry={() => console.log('Retry clicked')}
        data-testid="content-error"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state when task loading fails.',
      },
    },
  },
};

export const ContentSizes: StoryObj<typeof ProjectDetailContent> = {
  name: 'ProjectDetailContent - Sizes',
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <ProjectDetailContent
          tasks={mockTasks.slice(0, 2)}
          isLoading={false}
          onSelectTask={() => {}}
          onTaskStatusChange={() => {}}
          onNewTask={() => {}}
          size="sm"
          data-testid="content-sm"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <ProjectDetailContent
          tasks={mockTasks.slice(0, 2)}
          isLoading={false}
          onSelectTask={() => {}}
          onTaskStatusChange={() => {}}
          onNewTask={() => {}}
          size="lg"
          data-testid="content-lg"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Content at different sizes affects padding.',
      },
    },
  },
};

export const ContentAllStates: StoryObj<typeof ProjectDetailContent> = {
  name: 'ProjectDetailContent - All States',
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-3 py-2 text-sm font-medium">Empty</div>
        <div className="h-64 flex">
          <ProjectDetailContent
            tasks={[]}
            isLoading={false}
            onSelectTask={() => {}}
            onTaskStatusChange={() => {}}
            onNewTask={() => {}}
          />
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-3 py-2 text-sm font-medium">Loading</div>
        <div className="h-64 overflow-hidden">
          <ProjectDetailContent
            tasks={[]}
            isLoading={true}
            onSelectTask={() => {}}
            onTaskStatusChange={() => {}}
            onNewTask={() => {}}
          />
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-3 py-2 text-sm font-medium">Error</div>
        <div className="h-64 flex">
          <ProjectDetailContent
            tasks={[]}
            isLoading={false}
            error="Connection failed"
            onSelectTask={() => {}}
            onTaskStatusChange={() => {}}
            onNewTask={() => {}}
            onRetry={() => {}}
          />
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-3 py-2 text-sm font-medium">With Tasks</div>
        <div className="h-64 overflow-auto">
          <ProjectDetailContent
            tasks={mockTasks}
            isLoading={false}
            onSelectTask={() => {}}
            onTaskStatusChange={() => {}}
            onNewTask={() => {}}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all ProjectDetailContent states side by side.',
      },
    },
  },
};

export const ContentAccessibility: StoryObj<typeof ProjectDetailContent> = {
  name: 'ProjectDetailContent - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>role="region" with aria-labelledby for task list</li>
        <li>VisuallyHidden heading for screen readers</li>
        <li>Task count announcement via aria-live="polite"</li>
        <li>Loading state uses role="status" aria-busy="true"</li>
        <li>Error state uses role="alert" aria-live="assertive"</li>
        <li>Empty state has screen reader announcement</li>
      </ul>
      <div className="text-sm">
        <strong>Task count announcement:</strong>
        <p className="text-muted-foreground mt-1 font-mono text-xs bg-muted p-2 rounded">
          "{buildTaskCountAnnouncement(mockTasks.length)}"
        </p>
        <p className="text-muted-foreground mt-2">Empty title: "{DEFAULT_EMPTY_TITLE}"</p>
        <p className="text-muted-foreground">Empty description: "{DEFAULT_EMPTY_DESCRIPTION}"</p>
      </div>
      <ProjectDetailContent
        tasks={mockTasks}
        isLoading={false}
        onSelectTask={() => {}}
        onTaskStatusChange={() => {}}
        onNewTask={() => {}}
        data-testid="content-a11y"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Content area includes proper landmarks and screen reader announcements.',
      },
    },
  },
};

// ============================================================================
// ProjectCreateTaskDialog Stories
// ============================================================================

export const CreateTaskDialog: StoryObj<typeof ProjectCreateTaskDialog> = {
  name: 'ProjectCreateTaskDialog',
  render: () => (
    <ProjectCreateTaskDialog
      isOpen={true}
      taskTitle=""
      taskDescription=""
      selectedWorkflow={null}
      workflows={mockWorkflows}
      isLoadingWorkflows={false}
      isCreating={false}
      error={null}
      onClose={() => console.log('Close')}
      onCreate={() => console.log('Create')}
      onTitleChange={(title) => console.log('Title:', title)}
      onDescriptionChange={(desc) => console.log('Description:', desc)}
      onWorkflowSelect={(workflow) => console.log('Workflow:', workflow)}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dialog for creating a new task with workflow template selection.',
      },
    },
  },
};

export const CreateTaskDialogFilled: StoryObj<typeof ProjectCreateTaskDialog> = {
  name: 'ProjectCreateTaskDialog - Filled',
  render: () => (
    <ProjectCreateTaskDialog
      isOpen={true}
      taskTitle="Implement user authentication"
      taskDescription="Add login and registration forms with OAuth support"
      selectedWorkflow={mockWorkflows[0] ?? null}
      workflows={mockWorkflows}
      isLoadingWorkflows={false}
      isCreating={false}
      error={null}
      onClose={() => console.log('Close')}
      onCreate={() => console.log('Create')}
      onTitleChange={(title) => console.log('Title:', title)}
      onDescriptionChange={(desc) => console.log('Description:', desc)}
      onWorkflowSelect={(workflow) => console.log('Workflow:', workflow)}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dialog with filled form and selected workflow.',
      },
    },
  },
};

export const CreateTaskDialogCreating: StoryObj<typeof ProjectCreateTaskDialog> = {
  name: 'ProjectCreateTaskDialog - Creating',
  render: () => (
    <ProjectCreateTaskDialog
      isOpen={true}
      taskTitle="Implement user authentication"
      taskDescription="Add login and registration forms"
      selectedWorkflow={mockWorkflows[0] ?? null}
      workflows={mockWorkflows}
      isLoadingWorkflows={false}
      isCreating={true}
      error={null}
      onClose={() => {}}
      onCreate={() => {}}
      onTitleChange={() => {}}
      onDescriptionChange={() => {}}
      onWorkflowSelect={() => {}}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dialog in creating state with loading button.',
      },
    },
  },
};

export const CreateTaskDialogError: StoryObj<typeof ProjectCreateTaskDialog> = {
  name: 'ProjectCreateTaskDialog - Error',
  render: () => (
    <ProjectCreateTaskDialog
      isOpen={true}
      taskTitle=""
      taskDescription=""
      selectedWorkflow={null}
      workflows={mockWorkflows}
      isLoadingWorkflows={false}
      isCreating={false}
      error="Task title is required"
      onClose={() => {}}
      onCreate={() => {}}
      onTitleChange={() => {}}
      onDescriptionChange={() => {}}
      onWorkflowSelect={() => {}}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dialog showing validation error.',
      },
    },
  },
};

export const CreateTaskDialogLoadingWorkflows: StoryObj<typeof ProjectCreateTaskDialog> = {
  name: 'ProjectCreateTaskDialog - Loading Workflows',
  render: () => (
    <ProjectCreateTaskDialog
      isOpen={true}
      taskTitle=""
      taskDescription=""
      selectedWorkflow={null}
      workflows={[]}
      isLoadingWorkflows={true}
      isCreating={false}
      error={null}
      onClose={() => {}}
      onCreate={() => {}}
      onTitleChange={() => {}}
      onDescriptionChange={() => {}}
      onWorkflowSelect={() => {}}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dialog while workflow templates are loading.',
      },
    },
  },
};

export const CreateTaskDialogAccessibility: StoryObj<typeof ProjectCreateTaskDialog> = {
  name: 'ProjectCreateTaskDialog - Accessibility',
  render: () => (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
        <li>form role="form" with aria-label</li>
        <li>VisuallyHidden status announcements</li>
        <li>FormField provides proper label associations</li>
        <li>aria-required="true" on required fields</li>
        <li>Error messages have role="alert" and aria-live="assertive"</li>
        <li>Submit button has aria-busy during creation</li>
        <li>Minimum 44px touch targets on buttons</li>
        <li>autoFocus on first input for keyboard users</li>
      </ul>
      <div className="text-sm">
        <strong>Screen reader announcements:</strong>
        <p className="text-muted-foreground mt-1">Creating: "{SR_CREATING_TASK}"</p>
        <p className="text-muted-foreground">Created: "{SR_TASK_CREATED}"</p>
      </div>
      <ProjectCreateTaskDialog
        isOpen={true}
        taskTitle="Test task"
        taskDescription=""
        selectedWorkflow={null}
        workflows={mockWorkflows}
        isLoadingWorkflows={false}
        isCreating={false}
        error={null}
        onClose={() => {}}
        onCreate={() => {}}
        onTitleChange={() => {}}
        onDescriptionChange={() => {}}
        onWorkflowSelect={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dialog includes comprehensive form accessibility support.',
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
            {`getResponsiveSizeClasses('md', PROJECT_DETAIL_PADDING_CLASSES)
→ '${getResponsiveSizeClasses('md', PROJECT_DETAIL_PADDING_CLASSES)}'

getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, PROJECT_DETAIL_PADDING_CLASSES)
→ '${getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, PROJECT_DETAIL_PADDING_CLASSES)}'`}
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">buildBreadcrumbAccessibleLabel()</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Builds accessible label for breadcrumb navigation.
          </p>
          <pre className="text-xs bg-muted p-2 rounded">
            {`buildBreadcrumbAccessibleLabel('OpenFlow')
→ '${buildBreadcrumbAccessibleLabel('OpenFlow')}'`}
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">buildHeaderAccessibleLabel()</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Builds accessible label for project header.
          </p>
          <pre className="text-xs bg-muted p-2 rounded">
            {`buildHeaderAccessibleLabel(project)
→ '${buildHeaderAccessibleLabel(mockProject)}'`}
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">buildTaskCountAnnouncement()</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Builds task count announcement for screen readers.
          </p>
          <pre className="text-xs bg-muted p-2 rounded">
            {`buildTaskCountAnnouncement(5)
→ '${buildTaskCountAnnouncement(5)}'

buildTaskCountAnnouncement(1)
→ '${buildTaskCountAnnouncement(1)}'`}
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
// Constants Overview Story
// ============================================================================

export const ConstantsOverview: StoryObj = {
  name: 'Constants Overview',
  render: () => (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-semibold">Exported Constants</h2>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Default Labels</h3>
          <div className="text-xs font-mono bg-muted p-2 rounded space-y-1">
            <div>DEFAULT_SKELETON_COUNT = {DEFAULT_SKELETON_COUNT}</div>
            <div>DEFAULT_NOT_FOUND_TITLE = "{DEFAULT_NOT_FOUND_TITLE}"</div>
            <div>DEFAULT_BACK_LABEL = "{DEFAULT_BACK_LABEL}"</div>
            <div>DEFAULT_ERROR_TITLE = "{DEFAULT_ERROR_TITLE}"</div>
            <div>DEFAULT_ERROR_RETRY_LABEL = "{DEFAULT_ERROR_RETRY_LABEL}"</div>
            <div>DEFAULT_EMPTY_TITLE = "{DEFAULT_EMPTY_TITLE}"</div>
            <div>DEFAULT_CREATE_TASK_LABEL = "{DEFAULT_CREATE_TASK_LABEL}"</div>
            <div>DEFAULT_NEW_TASK_LABEL = "{DEFAULT_NEW_TASK_LABEL}"</div>
            <div>DEFAULT_SETTINGS_LABEL = "{DEFAULT_SETTINGS_LABEL}"</div>
            <div>DEFAULT_PROJECTS_LABEL = "{DEFAULT_PROJECTS_LABEL}"</div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Screen Reader Announcements</h3>
          <div className="text-xs font-mono bg-muted p-2 rounded space-y-1">
            <div>SR_LOADING = "{SR_LOADING}"</div>
            <div>SR_NOT_FOUND = "{SR_NOT_FOUND}"</div>
            <div>SR_ERROR = "{SR_ERROR}"</div>
            <div>SR_PROJECT_LOADED = "{SR_PROJECT_LOADED}"</div>
            <div>SR_TASKS_LOADED = "{SR_TASKS_LOADED}"</div>
            <div>SR_EMPTY = "{SR_EMPTY}"</div>
            <div>SR_CREATING_TASK = "{SR_CREATING_TASK}"</div>
            <div>SR_TASK_CREATED = "{SR_TASK_CREATED}"</div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Size Class Maps</h3>
          <div className="text-xs font-mono bg-muted p-2 rounded space-y-2">
            <div>
              <strong>PROJECT_DETAIL_PADDING_CLASSES:</strong>
              <div className="ml-2">sm: "{PROJECT_DETAIL_PADDING_CLASSES.sm}"</div>
              <div className="ml-2">md: "{PROJECT_DETAIL_PADDING_CLASSES.md}"</div>
              <div className="ml-2">lg: "{PROJECT_DETAIL_PADDING_CLASSES.lg}"</div>
            </div>
            <div>
              <strong>INFO_BAR_PADDING_CLASSES:</strong>
              <div className="ml-2">sm: "{INFO_BAR_PADDING_CLASSES.sm}"</div>
              <div className="ml-2">md: "{INFO_BAR_PADDING_CLASSES.md}"</div>
              <div className="ml-2">lg: "{INFO_BAR_PADDING_CLASSES.lg}"</div>
            </div>
            <div>
              <strong>BUTTON_SIZE_MAP:</strong>
              <div className="ml-2">sm: "{BUTTON_SIZE_MAP.sm}"</div>
              <div className="ml-2">md: "{BUTTON_SIZE_MAP.md}"</div>
              <div className="ml-2">lg: "{BUTTON_SIZE_MAP.lg}"</div>
            </div>
            <div>
              <strong>ICON_SIZE_MAP:</strong>
              <div className="ml-2">sm: "{ICON_SIZE_MAP.sm}"</div>
              <div className="ml-2">md: "{ICON_SIZE_MAP.md}"</div>
              <div className="ml-2">lg: "{ICON_SIZE_MAP.lg}"</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Constants exported for customization and testing.',
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
          Project detail components include comprehensive accessibility support following WCAG 2.1
          AA guidelines.
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
            <strong>Navigation:</strong> nav element with aria-label for breadcrumbs
          </li>
          <li>
            <strong>Forms:</strong> Proper label associations with aria-required
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
            <strong className="block mb-1">Breadcrumbs</strong>
            <code className="text-xs">aria-current="page" aria-label="..."</code>
          </div>
          <div className="border rounded p-3">
            <strong className="block mb-1">Task Announcements</strong>
            <code className="text-xs">aria-live="polite"</code>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Touch Targets (WCAG 2.5.5)</h2>
        <p className="text-sm text-muted-foreground">
          All interactive elements have minimum 44px touch targets on mobile for accessibility.
        </p>
        <div className="flex gap-4 items-center">
          <div className="w-11 h-11 border-2 border-dashed border-muted-foreground flex items-center justify-center text-xs">
            44px
          </div>
          <span className="text-sm">Minimum touch target size on mobile</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Classes like <code className="bg-muted px-1 rounded">min-h-[44px] sm:min-h-0</code> ensure
          proper touch targets on mobile while maintaining compact sizing on desktop.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Focus Management</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Focus rings with ring-offset for visibility against backgrounds</li>
          <li>Keyboard navigation support for all interactive elements</li>
          <li>Tab order follows visual layout</li>
          <li>autoFocus on first input in dialogs</li>
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
          <li>Task count announcements when list updates</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">forwardRef Support</h2>
        <p className="text-sm text-muted-foreground">
          Components with forwardRef for focus management and integration:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>ProjectDetailHeader</li>
          <li>ProjectDetailLoadingSkeleton</li>
          <li>ProjectNotFound</li>
          <li>ProjectDetailErrorState</li>
          <li>ProjectDetailInfoBar</li>
          <li>ProjectDetailContent</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Responsive Sizing</h2>
        <p className="text-sm text-muted-foreground">
          All components support responsive sizing through the size prop:
        </p>
        <pre className="text-xs bg-muted p-3 rounded">
          {`// Simple string
<Component size="md" />

// Responsive object
<Component size={{ base: 'sm', md: 'md', lg: 'lg' }} />`}
        </pre>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all accessibility features implemented in ProjectDetailPageComponents.',
      },
    },
  },
};
