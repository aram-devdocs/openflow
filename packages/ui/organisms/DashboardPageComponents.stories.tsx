import type { Task } from '@openflow/generated';
import { TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import {
  DashboardContent,
  DashboardEmptyState,
  DashboardLayout,
  DashboardLoadingSkeleton,
  DashboardStatsGrid,
  RecentTasksList,
  StatCard,
  StatusBadge,
} from './DashboardPageComponents';

const meta: Meta = {
  title: 'Organisms/DashboardPageComponents',
  parameters: {
    layout: 'fullscreen',
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
];

// ============================================================================
// StatCard Stories
// ============================================================================

export const StatCardDefault: StoryObj<typeof StatCard> = {
  render: () => <StatCard label="Total Tasks" value={42} />,
};

export const StatCardInfo: StoryObj<typeof StatCard> = {
  render: () => <StatCard label="In Progress" value={5} variant="info" />,
};

export const StatCardWarning: StoryObj<typeof StatCard> = {
  render: () => <StatCard label="In Review" value={3} variant="warning" />,
};

export const StatCardSuccess: StoryObj<typeof StatCard> = {
  render: () => <StatCard label="Completed" value={15} variant="success" />,
};

// ============================================================================
// StatusBadge Stories
// ============================================================================

export const StatusBadgeTodo: StoryObj<typeof StatusBadge> = {
  render: () => <StatusBadge status={TaskStatus.Todo} />,
};

export const StatusBadgeInProgress: StoryObj<typeof StatusBadge> = {
  render: () => <StatusBadge status={TaskStatus.Inprogress} />,
};

export const StatusBadgeDone: StoryObj<typeof StatusBadge> = {
  render: () => <StatusBadge status={TaskStatus.Done} />,
};

// ============================================================================
// DashboardLayout Stories
// ============================================================================

export const Layout: StoryObj<typeof DashboardLayout> = {
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
};

// ============================================================================
// DashboardEmptyState Stories
// ============================================================================

export const EmptyState: StoryObj<typeof DashboardEmptyState> = {
  render: () => <DashboardEmptyState onNewProject={() => console.log('New project')} />,
};

// ============================================================================
// DashboardLoadingSkeleton Stories
// ============================================================================

export const Loading: StoryObj<typeof DashboardLoadingSkeleton> = {
  render: () => <DashboardLoadingSkeleton />,
};

// ============================================================================
// DashboardStatsGrid Stories
// ============================================================================

export const StatsGrid: StoryObj<typeof DashboardStatsGrid> = {
  render: () => <DashboardStatsGrid tasks={mockTasks} />,
};

export const StatsGridEmpty: StoryObj<typeof DashboardStatsGrid> = {
  render: () => <DashboardStatsGrid tasks={[]} />,
};

// ============================================================================
// RecentTasksList Stories
// ============================================================================

export const RecentTasks: StoryObj<typeof RecentTasksList> = {
  render: () => (
    <RecentTasksList
      tasks={mockTasks}
      onSelectTask={(id: string) => console.log('Task selected:', id)}
    />
  ),
};

export const RecentTasksEmpty: StoryObj<typeof RecentTasksList> = {
  render: () => <RecentTasksList tasks={[]} onSelectTask={() => {}} />,
};

// ============================================================================
// DashboardContent Stories
// ============================================================================

export const ContentWithProject: StoryObj<typeof DashboardContent> = {
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
};

export const ContentNoProject: StoryObj<typeof DashboardContent> = {
  render: () => (
    <DashboardContent
      isLoadingProjects={false}
      isLoadingTasks={false}
      activeProjectId={undefined}
      tasks={[]}
      onSelectTask={() => {}}
      onNewProject={() => console.log('New project')}
    />
  ),
};

export const ContentLoading: StoryObj<typeof DashboardContent> = {
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
};
