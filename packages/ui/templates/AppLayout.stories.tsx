import { type Project, type Task, TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { Header } from '../organisms/Header';
import { Sidebar } from '../organisms/Sidebar';
import {
  APP_LAYOUT_CONTAINER_CLASSES,
  APP_LAYOUT_HEADER_CONTAINER_CLASSES,
  APP_LAYOUT_MAIN_AREA_CLASSES,
  APP_LAYOUT_MAIN_CONTENT_CLASSES,
  APP_LAYOUT_SIDEBAR_BASE_CLASSES,
  AppLayout,
  DEFAULT_HEADER_LABEL,
  DEFAULT_MAIN_LABEL,
  DEFAULT_MOBILE_DRAWER_LABEL,
  DEFAULT_SIDEBAR_LABEL,
  DEFAULT_SKIP_LINK_TEXT,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH_CLASSES,
  SR_DRAWER_CLOSED,
  SR_DRAWER_OPENED,
  SR_SIDEBAR_COLLAPSED,
  SR_SIDEBAR_EXPANDED,
  buildDrawerAnnouncement,
  buildSidebarAnnouncement,
  getBaseSize,
  getResponsiveSidebarClasses,
} from './AppLayout';

const meta: Meta<typeof AppLayout> = {
  title: 'Templates/AppLayout',
  component: AppLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
AppLayout is the main application layout template providing the overall structure with:
- Skip link for keyboard navigation
- Collapsible sidebar on the left (drawer on mobile)
- Header bar at the top with mobile hamburger menu
- Main content area that fills remaining space

## Accessibility Features
- **Skip link** - First focusable element targets main content
- **Landmark structure** - Uses proper semantic landmarks (banner, navigation, main)
- **Focus management** - Mobile drawer traps focus and returns on close
- **Responsive** - Sidebar collapses on mobile with drawer alternative
- **Screen reader announcements** - State changes announced via aria-live regions
- **Reduced motion** - Respects prefers-reduced-motion for transitions
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
};

export default meta;
type Story = StoryObj<typeof AppLayout>;

// ============================================================================
// Sample Data
// ============================================================================

const sampleProjects: Project[] = [
  {
    id: 'project-1',
    name: 'OpenFlow',
    gitRepoPath: '/Users/dev/openflow',
    baseBranch: 'main',
    setupScript: '',
    devScript: '',
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
    setupScript: '',
    devScript: '',
    workflowsFolder: '.openflow/workflows',
    icon: 'lock',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

const sampleTasks: Task[] = [
  {
    id: 'task-1',
    projectId: 'project-1',
    title: 'Implement user authentication',
    description: 'Add login and signup functionality',
    status: TaskStatus.Inprogress,
    actionsRequiredCount: 2,
    autoStartNextStep: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'task-2',
    projectId: 'project-1',
    title: 'Fix sidebar navigation bug',
    description: 'Navigation links not highlighting correctly',
    status: TaskStatus.Todo,
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'task-3',
    projectId: 'project-1',
    title: 'Add dark mode support',
    description: 'Implement theme switching',
    status: TaskStatus.Done,
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
  {
    id: 'task-4',
    projectId: 'project-1',
    title: 'Refactor database layer',
    description: 'Improve query performance',
    status: TaskStatus.Inreview,
    actionsRequiredCount: 1,
    autoStartNextStep: false,
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
  },
];

// Noop action handlers for stories (with proper signatures)
const noopString = (_id: string) => {};
const noopVoid = () => {};
const noopStatus = (_status: 'all' | TaskStatus) => {};
const noopTaskStatus = (_id: string, _status: TaskStatus) => {};

// ============================================================================
// Helper Components
// ============================================================================

function StorySidebar({ isCollapsed }: { isCollapsed?: boolean }) {
  return (
    <Sidebar
      projects={sampleProjects}
      tasks={sampleTasks}
      selectedProjectId="project-1"
      selectedTaskId="task-1"
      statusFilter="all"
      onSelectProject={noopString}
      onSelectTask={noopString}
      onNewTask={noopVoid}
      onNewProject={noopVoid}
      onStatusFilter={noopStatus}
      onTaskStatusChange={noopTaskStatus}
      onSettingsClick={noopVoid}
      onArchiveClick={noopVoid}
      isCollapsed={isCollapsed}
      onToggleCollapse={noopVoid}
    />
  );
}

function StoryHeader() {
  return (
    <Header
      title="OpenFlow"
      subtitle="3 tasks in progress"
      onSearch={noopVoid}
      onNewChat={noopVoid}
      onNewTerminal={noopVoid}
    />
  );
}

function SampleContent() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-[rgb(var(--foreground))]">Welcome to OpenFlow</h1>
      <p className="mb-4 text-[rgb(var(--muted-foreground))]">
        This is the main content area of the application. It displays whatever page or view is
        currently active.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((cardNum) => (
          <div
            key={`sample-card-${cardNum}`}
            className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
          >
            <h3 className="mb-2 font-semibold text-[rgb(var(--card-foreground))]">
              Card {cardNum}
            </h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This is sample content for card {cardNum}. It demonstrates how content flows in the
              main area.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Basic Examples
// ============================================================================

/**
 * Default layout with expanded sidebar
 */
export const Default: Story = {
  args: {
    sidebar: <StorySidebar isCollapsed={false} />,
    header: <StoryHeader />,
    children: <SampleContent />,
    sidebarCollapsed: false,
    'data-testid': 'app-layout',
  },
};

/**
 * Layout with collapsed sidebar
 */
export const CollapsedSidebar: Story = {
  args: {
    sidebar: <StorySidebar isCollapsed />,
    header: <StoryHeader />,
    children: <SampleContent />,
    sidebarCollapsed: true,
    'data-testid': 'app-layout',
  },
};

/**
 * Layout with minimal content (empty state)
 */
export const MinimalContent: Story = {
  args: {
    sidebar: <StorySidebar isCollapsed={false} />,
    header: <StoryHeader />,
    children: (
      <div className="flex h-full items-center justify-center">
        <p className="text-[rgb(var(--muted-foreground))]">Select a task to view details</p>
      </div>
    ),
    sidebarCollapsed: false,
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small sidebar width (240px)
 */
export const SizeSmall: Story = {
  args: {
    ...Default.args,
    size: 'sm',
  },
};

/**
 * Medium sidebar width (288px) - default
 */
export const SizeMedium: Story = {
  args: {
    ...Default.args,
    size: 'md',
  },
};

/**
 * Large sidebar width (320px)
 */
export const SizeLarge: Story = {
  args: {
    ...Default.args,
    size: 'lg',
  },
};

/**
 * Responsive sidebar width that changes at breakpoints
 */
export const ResponsiveSizing: Story = {
  args: {
    ...Default.args,
    size: { base: 'sm', lg: 'md', xl: 'lg' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar width changes at different breakpoints: sm at base, md at lg, lg at xl.',
      },
    },
  },
};

// ============================================================================
// Scrolling Content
// ============================================================================

/**
 * Layout with long scrolling content
 */
export const ScrollingContent: Story = {
  args: {
    sidebar: <StorySidebar isCollapsed={false} />,
    header: <StoryHeader />,
    children: (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-bold text-[rgb(var(--foreground))]">Long Content Page</h1>
        {Array.from({ length: 20 }).map((_, idx) => (
          <div
            key={`scroll-section-${idx}`}
            className="mb-4 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
          >
            <h3 className="mb-2 font-semibold text-[rgb(var(--card-foreground))]">
              Section {idx + 1}
            </h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This is content section {idx + 1}. It demonstrates how the layout handles scrolling
              content in the main area while keeping the sidebar and header fixed.
            </p>
          </div>
        ))}
      </div>
    ),
    sidebarCollapsed: false,
  },
};

/**
 * Layout with custom content class (additional padding)
 */
export const WithContentPadding: Story = {
  args: {
    sidebar: <StorySidebar isCollapsed={false} />,
    header: <StoryHeader />,
    children: (
      <div className="h-full bg-[rgb(var(--muted))]">
        <p className="text-[rgb(var(--foreground))]">
          Content with custom background from contentClassName
        </p>
      </div>
    ),
    sidebarCollapsed: false,
    contentClassName: 'p-8',
  },
};

// ============================================================================
// Empty State
// ============================================================================

/**
 * Empty state layout (no tasks)
 */
export const EmptyState: Story = {
  args: {
    sidebar: (
      <Sidebar
        projects={sampleProjects}
        tasks={[]}
        selectedProjectId="project-1"
        statusFilter="all"
        onSelectProject={noopString}
        onSelectTask={noopString}
        onNewTask={noopVoid}
        onNewProject={noopVoid}
        onStatusFilter={noopStatus}
        onSettingsClick={noopVoid}
        onArchiveClick={noopVoid}
        isCollapsed={false}
        onToggleCollapse={noopVoid}
      />
    ),
    header: (
      <Header
        title="OpenFlow"
        subtitle="No tasks yet"
        onSearch={noopVoid}
        onNewChat={noopVoid}
        onNewTerminal={noopVoid}
      />
    ),
    children: (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-[rgb(var(--muted))] p-6">
          <svg
            className="h-12 w-12 text-[rgb(var(--muted-foreground))]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden={true}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">No tasks yet</h2>
        <p className="max-w-md text-center text-[rgb(var(--muted-foreground))]">
          Create your first task to start organizing your work with AI-powered workflows.
        </p>
      </div>
    ),
    sidebarCollapsed: false,
  },
};

// ============================================================================
// Interactive Examples
// ============================================================================

/**
 * Interactive example with sidebar toggle
 */
export const InteractiveSidebarToggle: Story = {
  render: () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
      <AppLayout
        sidebar={
          <Sidebar
            projects={sampleProjects}
            tasks={sampleTasks}
            selectedProjectId="project-1"
            selectedTaskId="task-1"
            statusFilter="all"
            onSelectProject={noopString}
            onSelectTask={noopString}
            onNewTask={noopVoid}
            onNewProject={noopVoid}
            onStatusFilter={noopStatus}
            onTaskStatusChange={noopTaskStatus}
            onSettingsClick={noopVoid}
            onArchiveClick={noopVoid}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        }
        header={<StoryHeader />}
        sidebarCollapsed={sidebarCollapsed}
        data-testid="app-layout"
      >
        <SampleContent />
      </AppLayout>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Click the collapse button in the sidebar to toggle sidebar state.',
      },
    },
  },
};

/**
 * Interactive example with mobile drawer
 */
export const InteractiveMobileDrawer: Story = {
  render: () => {
    const [isMobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    return (
      <AppLayout
        sidebar={<StorySidebar isCollapsed={false} />}
        header={<StoryHeader />}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onMobileDrawerToggle={setMobileDrawerOpen}
        data-testid="app-layout"
      >
        <div className="p-6">
          <h1 className="mb-4 text-2xl font-bold">Mobile Drawer Demo</h1>
          <p className="mb-4 text-[rgb(var(--muted-foreground))]">
            On mobile viewports, click the hamburger menu to open the drawer. On desktop, the
            sidebar is always visible.
          </p>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Drawer state: {isMobileDrawerOpen ? 'Open' : 'Closed'}
          </p>
        </div>
      </AppLayout>
    );
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Resize viewport to mobile size and click hamburger menu to open drawer. Focus trapping is active when drawer is open.',
      },
    },
  },
};

// ============================================================================
// Custom Labels
// ============================================================================

/**
 * Layout with custom accessible labels
 */
export const CustomLabels: Story = {
  args: {
    ...Default.args,
    skipLinkText: 'Skip to dashboard content',
    sidebarLabel: 'Project navigation',
    headerLabel: 'Dashboard header',
    mainLabel: 'Dashboard content',
    mobileDrawerLabel: 'Project navigation drawer',
  },
  parameters: {
    docs: {
      description: {
        story:
          'All landmark regions can have custom aria-labels for better screen reader experience.',
      },
    },
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Demo: Skip link becomes visible on focus
 */
export const SkipLinkDemo: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Press Tab to see the skip link appear. Activate it to jump directly to main content.',
      },
    },
  },
};

/**
 * Demo: Keyboard navigation through the layout
 */
export const KeyboardNavigationDemo: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    docs: {
      description: {
        story: `
### Keyboard Navigation

1. **Tab** - Navigate through interactive elements
2. **Skip Link** - Press Tab first to reveal, then Enter to skip to main
3. **Sidebar** - Arrow keys navigate task list
4. **Mobile Drawer** - Escape key closes drawer, Tab cycles within
        `,
      },
    },
  },
};

/**
 * Demo: Screen reader announcements
 */
export const ScreenReaderDemo: Story = {
  render: () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    return (
      <AppLayout
        sidebar={
          <Sidebar
            projects={sampleProjects}
            tasks={sampleTasks}
            selectedProjectId="project-1"
            selectedTaskId="task-1"
            statusFilter="all"
            onSelectProject={noopString}
            onSelectTask={noopString}
            onNewTask={noopVoid}
            onNewProject={noopVoid}
            onStatusFilter={noopStatus}
            onTaskStatusChange={noopTaskStatus}
            onSettingsClick={noopVoid}
            onArchiveClick={noopVoid}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        }
        header={<StoryHeader />}
        sidebarCollapsed={sidebarCollapsed}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onMobileDrawerToggle={setMobileDrawerOpen}
        data-testid="app-layout"
      >
        <div className="p-6">
          <h1 className="mb-4 text-2xl font-bold">Screen Reader Demo</h1>
          <p className="mb-4 text-[rgb(var(--muted-foreground))]">
            Toggle sidebar or drawer to hear announcements via screen reader.
          </p>
          <div className="mb-4 flex gap-4">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="rounded bg-[rgb(var(--primary))] px-4 py-2 text-white"
            >
              Toggle Sidebar ({sidebarCollapsed ? 'Collapsed' : 'Expanded'})
            </button>
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(!isMobileDrawerOpen)}
              className="rounded bg-[rgb(var(--primary))] px-4 py-2 text-white"
            >
              Toggle Drawer ({isMobileDrawerOpen ? 'Open' : 'Closed'})
            </button>
          </div>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Screen readers will announce: "{buildSidebarAnnouncement(sidebarCollapsed)}" or "
            {buildDrawerAnnouncement(isMobileDrawerOpen, 'Navigation menu')}"
          </p>
        </div>
      </AppLayout>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'State changes are announced via aria-live regions. Toggle sidebar or drawer to trigger announcements.',
      },
    },
  },
};

/**
 * Demo: Focus ring visibility on all backgrounds
 */
export const FocusRingDemo: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tab through the interface to see focus rings. All interactive elements have visible focus indicators.',
      },
    },
  },
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

/**
 * Demo: Ref forwarding for programmatic access
 */
export const RefForwarding: Story = {
  render: () => {
    const layoutRef = useRef<HTMLDivElement>(null);

    return (
      <AppLayout
        ref={layoutRef}
        sidebar={<StorySidebar isCollapsed={false} />}
        header={<StoryHeader />}
        data-testid="app-layout"
      >
        <div className="p-6">
          <h1 className="mb-4 text-2xl font-bold">Ref Forwarding Demo</h1>
          <button
            type="button"
            onClick={() => {
              if (layoutRef.current) {
                // biome-ignore lint/suspicious/noConsole: demo purposes
                console.log('Layout dimensions:', layoutRef.current.getBoundingClientRect());
              }
            }}
            className="rounded bg-[rgb(var(--primary))] px-4 py-2 text-white"
          >
            Log Layout Dimensions
          </button>
        </div>
      </AppLayout>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Use ref forwarding for programmatic access to the layout container.',
      },
    },
  },
};

/**
 * Demo: Data attributes for testing
 */
export const DataAttributes: Story = {
  args: {
    sidebar: <StorySidebar isCollapsed={false} />,
    header: <StoryHeader />,
    children: (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-bold">Data Attributes Demo</h1>
        <p className="text-[rgb(var(--muted-foreground))]">
          Open browser DevTools to inspect data-testid, data-sidebar-collapsed, data-drawer-open,
          and data-size attributes.
        </p>
      </div>
    ),
    sidebarCollapsed: false,
    isMobileDrawerOpen: false,
    size: 'md',
    'data-testid': 'app-layout',
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/**
 * Dashboard page layout
 */
export const DashboardLayout: Story = {
  args: {
    sidebar: <StorySidebar isCollapsed={false} />,
    header: (
      <Header
        title="Dashboard"
        subtitle="Overview of all projects"
        onSearch={noopVoid}
        onNewChat={noopVoid}
        onNewTerminal={noopVoid}
      />
    ),
    children: (
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {['Active Tasks', 'Completed', 'In Review', 'Projects'].map((stat) => (
            <div
              key={stat}
              className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6"
            >
              <h3 className="text-sm font-medium text-[rgb(var(--muted-foreground))]">{stat}</h3>
              <p className="mt-2 text-3xl font-bold">{Math.floor(Math.random() * 50)}</p>
            </div>
          ))}
        </div>
      </div>
    ),
    sidebarCollapsed: false,
    'data-testid': 'dashboard-layout',
  },
};

/**
 * Task detail page layout
 */
export const TaskDetailLayout: Story = {
  args: {
    sidebar: <StorySidebar isCollapsed />,
    header: (
      <Header
        title="Implement user authentication"
        subtitle="OpenFlow / Task #1"
        onSearch={noopVoid}
        onNewChat={noopVoid}
        onNewTerminal={noopVoid}
      />
    ),
    children: (
      <div className="flex h-full">
        <div className="flex-1 overflow-auto p-6">
          <h1 className="mb-4 text-xl font-bold">Task: Implement user authentication</h1>
          <div className="space-y-4">
            <p className="text-[rgb(var(--muted-foreground))]">
              Add login and signup functionality with OAuth support.
            </p>
            <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
              <h3 className="font-semibold">Progress</h3>
              <div className="mt-2 h-2 w-full rounded-full bg-[rgb(var(--muted))]">
                <div className="h-2 w-3/4 rounded-full bg-[rgb(var(--primary))]" />
              </div>
            </div>
          </div>
        </div>
        <div className="w-80 border-l border-[rgb(var(--border))] bg-[rgb(var(--muted))] p-4">
          <h2 className="mb-4 font-semibold">Chat</h2>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">AI assistant messages...</p>
        </div>
      </div>
    ),
    sidebarCollapsed: true,
    'data-testid': 'task-layout',
  },
};

/**
 * Settings page layout
 */
export const SettingsLayout: Story = {
  args: {
    sidebar: <StorySidebar isCollapsed={false} />,
    header: (
      <Header
        title="Settings"
        subtitle="Configure your preferences"
        onSearch={noopVoid}
        onNewChat={noopVoid}
        onNewTerminal={noopVoid}
      />
    ),
    children: (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="mb-6 text-2xl font-bold">Settings</h1>
        <div className="space-y-6">
          {['General', 'Appearance', 'Notifications', 'Integrations'].map((section) => (
            <div
              key={section}
              className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6"
            >
              <h2 className="text-lg font-semibold">{section}</h2>
              <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
                Configure {section.toLowerCase()} settings...
              </p>
            </div>
          ))}
        </div>
      </div>
    ),
    sidebarCollapsed: false,
    'data-testid': 'settings-layout',
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Reference: All exported constants
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="p-6 font-mono text-sm">
      <h2 className="mb-4 text-lg font-bold">Exported Constants</h2>

      <h3 className="mb-2 mt-6 font-semibold">Default Labels</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>DEFAULT_SKIP_LINK_TEXT: "{DEFAULT_SKIP_LINK_TEXT}"</li>
        <li>DEFAULT_SIDEBAR_LABEL: "{DEFAULT_SIDEBAR_LABEL}"</li>
        <li>DEFAULT_HEADER_LABEL: "{DEFAULT_HEADER_LABEL}"</li>
        <li>DEFAULT_MAIN_LABEL: "{DEFAULT_MAIN_LABEL}"</li>
        <li>DEFAULT_MOBILE_DRAWER_LABEL: "{DEFAULT_MOBILE_DRAWER_LABEL}"</li>
      </ul>

      <h3 className="mb-2 mt-6 font-semibold">Screen Reader Announcements</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>SR_SIDEBAR_COLLAPSED: "{SR_SIDEBAR_COLLAPSED}"</li>
        <li>SR_SIDEBAR_EXPANDED: "{SR_SIDEBAR_EXPANDED}"</li>
        <li>SR_DRAWER_OPENED: "{SR_DRAWER_OPENED}"</li>
        <li>SR_DRAWER_CLOSED: "{SR_DRAWER_CLOSED}"</li>
      </ul>

      <h3 className="mb-2 mt-6 font-semibold">CSS Class Constants</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>APP_LAYOUT_CONTAINER_CLASSES: "{APP_LAYOUT_CONTAINER_CLASSES}"</li>
        <li>APP_LAYOUT_SIDEBAR_BASE_CLASSES: "{APP_LAYOUT_SIDEBAR_BASE_CLASSES}"</li>
        <li>APP_LAYOUT_MAIN_AREA_CLASSES: "{APP_LAYOUT_MAIN_AREA_CLASSES}"</li>
        <li>APP_LAYOUT_HEADER_CONTAINER_CLASSES: "{APP_LAYOUT_HEADER_CONTAINER_CLASSES}"</li>
        <li>APP_LAYOUT_MAIN_CONTENT_CLASSES: "{APP_LAYOUT_MAIN_CONTENT_CLASSES}"</li>
      </ul>

      <h3 className="mb-2 mt-6 font-semibold">Size Classes</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>SIDEBAR_EXPANDED_WIDTH_CLASSES.sm: "{SIDEBAR_EXPANDED_WIDTH_CLASSES.sm}"</li>
        <li>SIDEBAR_EXPANDED_WIDTH_CLASSES.md: "{SIDEBAR_EXPANDED_WIDTH_CLASSES.md}"</li>
        <li>SIDEBAR_EXPANDED_WIDTH_CLASSES.lg: "{SIDEBAR_EXPANDED_WIDTH_CLASSES.lg}"</li>
        <li>SIDEBAR_COLLAPSED_WIDTH: "{SIDEBAR_COLLAPSED_WIDTH}"</li>
      </ul>

      <h3 className="mb-2 mt-6 font-semibold">Utility Functions</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>getBaseSize(undefined) → "{getBaseSize(undefined)}"</li>
        <li>getBaseSize('lg') → "{getBaseSize('lg')}"</li>
        <li>
          getBaseSize({'{base: "sm", lg: "lg"}'}) → "{getBaseSize({ base: 'sm', lg: 'lg' })}"
        </li>
        <li>
          getResponsiveSidebarClasses('md', false) → "{getResponsiveSidebarClasses('md', false)}"
        </li>
        <li>
          getResponsiveSidebarClasses('md', true) → "{getResponsiveSidebarClasses('md', true)}"
        </li>
        <li>buildSidebarAnnouncement(true) → "{buildSidebarAnnouncement(true)}"</li>
        <li>buildSidebarAnnouncement(false) → "{buildSidebarAnnouncement(false)}"</li>
        <li>buildDrawerAnnouncement(true, 'Menu') → "{buildDrawerAnnouncement(true, 'Menu')}"</li>
      </ul>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Reference of all exported constants and utility functions for testing and reuse.',
      },
    },
  },
};
