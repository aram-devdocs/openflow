import { TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import {
  type StatusFilterOption,
  TasksFilterBar,
  TasksListContent,
  TasksListEmpty,
  TasksListLayout,
  TasksListLoading,
} from './TasksListPageComponents';

const meta: Meta = {
  title: 'Organisms/TasksListPageComponents',
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

const mockFilters: StatusFilterOption[] = [
  { label: 'All', value: 'all' },
  { label: 'To Do', value: TaskStatus.Todo },
  { label: 'In Progress', value: TaskStatus.Inprogress },
  { label: 'In Review', value: TaskStatus.Inreview },
  { label: 'Done', value: TaskStatus.Done },
];

const mockTasks = [
  {
    id: 'task-1',
    title: 'Implement user authentication',
    description: 'Add login and registration',
    status: TaskStatus.Inprogress,
    projectId: 'proj-1',
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: 'task-2',
    title: 'Fix navigation bug',
    description: 'Menu not closing on mobile',
    status: TaskStatus.Todo,
    projectId: 'proj-1',
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-14',
    updatedAt: '2024-01-14',
  },
  {
    id: 'task-3',
    title: 'Add dark mode',
    description: 'Support light and dark themes',
    status: TaskStatus.Done,
    projectId: 'proj-2',
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-13',
    updatedAt: '2024-01-15',
  },
];

// ============================================================================
// TasksFilterBar Stories
// ============================================================================

export const FilterBar: StoryObj<typeof TasksFilterBar> = {
  render: () => (
    <TasksFilterBar
      filters={mockFilters}
      selectedFilter="all"
      onFilterChange={(filter) => console.log('Filter:', filter)}
    />
  ),
};

export const FilterBarInProgress: StoryObj<typeof TasksFilterBar> = {
  render: () => (
    <TasksFilterBar
      filters={mockFilters}
      selectedFilter={TaskStatus.Inprogress}
      onFilterChange={(filter) => console.log('Filter:', filter)}
    />
  ),
};

// ============================================================================
// TasksListLoading Stories
// ============================================================================

export const Loading: StoryObj<typeof TasksListLoading> = {
  render: () => <TasksListLoading count={5} />,
};

// ============================================================================
// TasksListEmpty Stories
// ============================================================================

export const EmptyAll: StoryObj<typeof TasksListEmpty> = {
  render: () => <TasksListEmpty filter="all" />,
};

export const EmptyFiltered: StoryObj<typeof TasksListEmpty> = {
  render: () => <TasksListEmpty filter={TaskStatus.Inreview} />,
};

// ============================================================================
// TasksListContent Stories
// ============================================================================

export const ContentWithTasks: StoryObj<typeof TasksListContent> = {
  render: () => (
    <TasksListContent
      isLoading={false}
      tasks={mockTasks}
      filter="all"
      onSelectTask={(id) => console.log('Select:', id)}
      onStatusChange={(id, status) => console.log('Status:', id, status)}
    />
  ),
};

export const ContentEmpty: StoryObj<typeof TasksListContent> = {
  render: () => (
    <TasksListContent
      isLoading={false}
      tasks={[]}
      filter="all"
      onSelectTask={() => {}}
      onStatusChange={() => {}}
    />
  ),
};

export const ContentLoading: StoryObj<typeof TasksListContent> = {
  render: () => (
    <TasksListContent
      isLoading={true}
      tasks={[]}
      filter="all"
      onSelectTask={() => {}}
      onStatusChange={() => {}}
    />
  ),
};

// ============================================================================
// TasksListLayout Stories
// ============================================================================

export const Layout: StoryObj<typeof TasksListLayout> = {
  render: () => (
    <TasksListLayout
      filterBar={
        <TasksFilterBar filters={mockFilters} selectedFilter="all" onFilterChange={() => {}} />
      }
    >
      <TasksListContent
        isLoading={false}
        tasks={mockTasks}
        filter="all"
        onSelectTask={() => {}}
        onStatusChange={() => {}}
      />
    </TasksListLayout>
  ),
};
