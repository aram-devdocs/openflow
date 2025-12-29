import { type Project, type Task, TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { Header } from '../organisms/Header';
import { Sidebar } from '../organisms/Sidebar';
import { AppLayout } from './AppLayout';

const meta: Meta<typeof AppLayout> = {
  title: 'Templates/AppLayout',
  component: AppLayout,
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
type Story = StoryObj<typeof AppLayout>;

// Sample data for stories
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

// Create a sample sidebar component for stories
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

// Create a sample header component for stories
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

// Sample main content
function SampleContent() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-[rgb(var(--foreground))]">Welcome to OpenFlow</h1>
      <p className="mb-4 text-[rgb(var(--muted-foreground))]">
        This is the main content area of the application. It displays whatever page or view is
        currently active.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
          >
            <h3 className="mb-2 font-semibold text-[rgb(var(--card-foreground))]">Card {i}</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This is sample content for card {i}. It demonstrates how content flows in the main
              area.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Default layout with expanded sidebar
 */
export const Default: Story = {
  args: {
    sidebar: <StorySidebar isCollapsed={false} />,
    header: <StoryHeader />,
    children: <SampleContent />,
    sidebarCollapsed: false,
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
  },
};

/**
 * Layout with minimal content
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
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="mb-4 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
          >
            <h3 className="mb-2 font-semibold text-[rgb(var(--card-foreground))]">
              Section {i + 1}
            </h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              This is content section {i + 1}. It demonstrates how the layout handles scrolling
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
 * Layout with custom content class
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

/**
 * Empty state layout
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
