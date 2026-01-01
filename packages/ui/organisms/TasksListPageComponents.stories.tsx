/**
 * TasksListPageComponents Storybook Stories
 *
 * Comprehensive stories demonstrating:
 * - All component variants and sizes
 * - Responsive sizing behavior
 * - Accessibility features (keyboard navigation, screen readers)
 * - Loading, empty, and error states
 * - Real-world usage examples
 */

import { TaskStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import {
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_TITLE,
  // Constants
  DEFAULT_FILTER_BAR_LABEL,
  DEFAULT_LOADING_LABEL,
  DEFAULT_RETRY_LABEL,
  DEFAULT_SKELETON_COUNT,
  ERROR_PADDING_CLASSES,
  // Class constants
  FILTER_BAR_BASE_CLASSES,
  FILTER_BAR_PADDING_CLASSES,
  FILTER_TAB_SIZE_CLASSES,
  LAYOUT_BASE_CLASSES,
  LAYOUT_CONTENT_PADDING_CLASSES,
  LOADING_BASE_CLASSES,
  LOADING_GAP_CLASSES,
  type StatusFilter,
  type StatusFilterOption,
  TasksFilterBar,
  TasksListContent,
  TasksListEmpty,
  TasksListError,
  TasksListLayout,
  TasksListLoading,
} from './TasksListPageComponents';

const meta: Meta = {
  title: 'Organisms/TasksListPageComponents',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
TasksListPageComponents provides stateless UI components for the tasks list page.

## Features
- **TasksFilterBar**: ARIA tablist pattern with keyboard navigation
- **TasksListLoading**: Skeleton loading placeholders
- **TasksListEmpty**: Empty state with optional create action
- **TasksListError**: Error state with retry option
- **TasksListContent**: State-based content rendering
- **TasksListLayout**: Page layout structure

## Accessibility
- ARIA tablist/tab roles for filter bar
- Keyboard navigation (Arrow keys, Home, End)
- Screen reader announcements for state changes
- Touch targets ≥44px on mobile (WCAG 2.5.5)
- Focus rings with ring-offset for visibility
- role="status" for loading, role="alert" for errors
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

const mockFilters: StatusFilterOption[] = [
  { label: 'All', value: 'all', count: 15 },
  { label: 'To Do', value: TaskStatus.Todo, count: 5 },
  { label: 'In Progress', value: TaskStatus.Inprogress, count: 4 },
  { label: 'In Review', value: TaskStatus.Inreview, count: 3 },
  { label: 'Done', value: TaskStatus.Done, count: 3 },
];

const mockFiltersWithoutCounts: StatusFilterOption[] = [
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
    description: 'Add login and registration functionality',
    status: TaskStatus.Inprogress,
    projectId: 'proj-1',
    actionsRequiredCount: 2,
    autoStartNextStep: false,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: 'task-2',
    title: 'Fix navigation bug',
    description: 'Menu not closing on mobile devices',
    status: TaskStatus.Todo,
    projectId: 'proj-1',
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-14',
    updatedAt: '2024-01-14',
  },
  {
    id: 'task-3',
    title: 'Add dark mode support',
    description: 'Implement light and dark themes',
    status: TaskStatus.Done,
    projectId: 'proj-2',
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-13',
    updatedAt: '2024-01-15',
  },
  {
    id: 'task-4',
    title: 'Database optimization',
    description: 'Improve query performance',
    status: TaskStatus.Inreview,
    projectId: 'proj-1',
    actionsRequiredCount: 1,
    autoStartNextStep: false,
    createdAt: '2024-01-12',
    updatedAt: '2024-01-14',
  },
  {
    id: 'task-5',
    title: 'API documentation',
    description: 'Document all REST endpoints',
    status: TaskStatus.Todo,
    projectId: 'proj-2',
    actionsRequiredCount: 0,
    autoStartNextStep: false,
    createdAt: '2024-01-11',
    updatedAt: '2024-01-11',
  },
];

// ============================================================================
// TasksFilterBar Stories
// ============================================================================

export const FilterBarDefault: StoryObj<typeof TasksFilterBar> = {
  name: 'Filter Bar - Default',
  render: () => (
    <TasksFilterBar
      filters={mockFilters}
      selectedFilter="all"
      onFilterChange={(filter) => console.log('Filter:', filter)}
      data-testid="filter-bar"
    />
  ),
};

export const FilterBarWithCounts: StoryObj<typeof TasksFilterBar> = {
  name: 'Filter Bar - With Counts',
  render: () => (
    <TasksFilterBar
      filters={mockFilters}
      selectedFilter={TaskStatus.Inprogress}
      onFilterChange={(filter) => console.log('Filter:', filter)}
    />
  ),
};

export const FilterBarWithoutCounts: StoryObj<typeof TasksFilterBar> = {
  name: 'Filter Bar - Without Counts',
  render: () => (
    <TasksFilterBar
      filters={mockFiltersWithoutCounts}
      selectedFilter="all"
      onFilterChange={(filter) => console.log('Filter:', filter)}
    />
  ),
};

export const FilterBarSizeSmall: StoryObj<typeof TasksFilterBar> = {
  name: 'Filter Bar - Size Small',
  render: () => (
    <TasksFilterBar
      filters={mockFilters}
      selectedFilter="all"
      onFilterChange={() => {}}
      size="sm"
    />
  ),
};

export const FilterBarSizeLarge: StoryObj<typeof TasksFilterBar> = {
  name: 'Filter Bar - Size Large',
  render: () => (
    <TasksFilterBar
      filters={mockFilters}
      selectedFilter="all"
      onFilterChange={() => {}}
      size="lg"
    />
  ),
};

export const FilterBarResponsive: StoryObj<typeof TasksFilterBar> = {
  name: 'Filter Bar - Responsive Sizing',
  render: () => (
    <div className="space-y-4">
      <p className="px-4 text-sm text-[rgb(var(--muted-foreground))]">
        Resize the viewport to see responsive size changes (sm → md → lg)
      </p>
      <TasksFilterBar
        filters={mockFilters}
        selectedFilter="all"
        onFilterChange={() => {}}
        size={{ base: 'sm', md: 'md', lg: 'lg' }}
      />
    </div>
  ),
};

export const FilterBarInteractive: StoryObj<typeof TasksFilterBar> = {
  name: 'Filter Bar - Interactive',
  render: function InteractiveFilterBar() {
    const [selected, setSelected] = useState<StatusFilter>('all');

    return (
      <div className="space-y-4">
        <TasksFilterBar
          filters={mockFilters}
          selectedFilter={selected}
          onFilterChange={setSelected}
        />
        <p className="px-6 text-sm text-[rgb(var(--muted-foreground))]">
          Selected filter: <strong>{selected}</strong>
        </p>
      </div>
    );
  },
};

export const FilterBarKeyboardNavigation: StoryObj<typeof TasksFilterBar> = {
  name: 'Filter Bar - Keyboard Navigation',
  render: function KeyboardDemo() {
    const [selected, setSelected] = useState<StatusFilter>('all');

    return (
      <div className="space-y-4 p-4">
        <div className="rounded-lg bg-[rgb(var(--muted))] p-4">
          <h3 className="font-medium mb-2">Keyboard Navigation Demo</h3>
          <ul className="text-sm text-[rgb(var(--muted-foreground))] space-y-1">
            <li>
              • <kbd className="px-1 bg-[rgb(var(--background))] rounded">Tab</kbd> to focus the
              filter bar
            </li>
            <li>
              • <kbd className="px-1 bg-[rgb(var(--background))] rounded">←</kbd> /{' '}
              <kbd className="px-1 bg-[rgb(var(--background))] rounded">→</kbd> to navigate between
              filters
            </li>
            <li>
              • <kbd className="px-1 bg-[rgb(var(--background))] rounded">Home</kbd> to jump to
              first filter
            </li>
            <li>
              • <kbd className="px-1 bg-[rgb(var(--background))] rounded">End</kbd> to jump to last
              filter
            </li>
            <li>
              • <kbd className="px-1 bg-[rgb(var(--background))] rounded">Enter</kbd> or{' '}
              <kbd className="px-1 bg-[rgb(var(--background))] rounded">Space</kbd> to select
            </li>
          </ul>
        </div>
        <TasksFilterBar
          filters={mockFilters}
          selectedFilter={selected}
          onFilterChange={setSelected}
        />
      </div>
    );
  },
};

// ============================================================================
// TasksListLoading Stories
// ============================================================================

export const LoadingDefault: StoryObj<typeof TasksListLoading> = {
  name: 'Loading - Default (5 items)',
  render: () => <TasksListLoading data-testid="loading" />,
};

export const LoadingThreeItems: StoryObj<typeof TasksListLoading> = {
  name: 'Loading - 3 Items',
  render: () => <TasksListLoading count={3} />,
};

export const LoadingManyItems: StoryObj<typeof TasksListLoading> = {
  name: 'Loading - 10 Items',
  render: () => <TasksListLoading count={10} />,
};

export const LoadingSizeSmall: StoryObj<typeof TasksListLoading> = {
  name: 'Loading - Size Small',
  render: () => <TasksListLoading size="sm" count={3} />,
};

export const LoadingSizeLarge: StoryObj<typeof TasksListLoading> = {
  name: 'Loading - Size Large',
  render: () => <TasksListLoading size="lg" count={3} />,
};

export const LoadingResponsive: StoryObj<typeof TasksListLoading> = {
  name: 'Loading - Responsive',
  render: () => <TasksListLoading size={{ base: 'sm', md: 'md', lg: 'lg' }} count={4} />,
};

// ============================================================================
// TasksListEmpty Stories
// ============================================================================

export const EmptyAllTasks: StoryObj<typeof TasksListEmpty> = {
  name: 'Empty - All Tasks',
  render: () => (
    <div className="h-96">
      <TasksListEmpty
        filter="all"
        onCreateTask={() => console.log('Create task')}
        data-testid="empty-state"
      />
    </div>
  ),
};

export const EmptyFilteredTodo: StoryObj<typeof TasksListEmpty> = {
  name: 'Empty - Filtered (To Do)',
  render: () => (
    <div className="h-96">
      <TasksListEmpty filter={TaskStatus.Todo} />
    </div>
  ),
};

export const EmptyFilteredInProgress: StoryObj<typeof TasksListEmpty> = {
  name: 'Empty - Filtered (In Progress)',
  render: () => (
    <div className="h-96">
      <TasksListEmpty filter={TaskStatus.Inprogress} />
    </div>
  ),
};

export const EmptyWithoutAction: StoryObj<typeof TasksListEmpty> = {
  name: 'Empty - Without Create Action',
  render: () => (
    <div className="h-96">
      <TasksListEmpty filter="all" />
    </div>
  ),
};

export const EmptySizeSmall: StoryObj<typeof TasksListEmpty> = {
  name: 'Empty - Size Small',
  render: () => (
    <div className="h-64">
      <TasksListEmpty filter="all" size="sm" onCreateTask={() => {}} />
    </div>
  ),
};

// ============================================================================
// TasksListError Stories
// ============================================================================

export const ErrorDefault: StoryObj<typeof TasksListError> = {
  name: 'Error - Default',
  render: () => (
    <div className="p-4">
      <TasksListError onRetry={() => console.log('Retry')} data-testid="error-state" />
    </div>
  ),
};

export const ErrorCustomMessage: StoryObj<typeof TasksListError> = {
  name: 'Error - Custom Message',
  render: () => (
    <div className="p-4">
      <TasksListError
        message="Network error. Please check your connection."
        onRetry={() => console.log('Retry')}
      />
    </div>
  ),
};

export const ErrorWithoutRetry: StoryObj<typeof TasksListError> = {
  name: 'Error - Without Retry',
  render: () => (
    <div className="p-4">
      <TasksListError message="This feature is currently unavailable." />
    </div>
  ),
};

export const ErrorSizeSmall: StoryObj<typeof TasksListError> = {
  name: 'Error - Size Small',
  render: () => (
    <div className="p-4">
      <TasksListError size="sm" onRetry={() => {}} />
    </div>
  ),
};

export const ErrorSizeLarge: StoryObj<typeof TasksListError> = {
  name: 'Error - Size Large',
  render: () => (
    <div className="p-4">
      <TasksListError size="lg" onRetry={() => {}} />
    </div>
  ),
};

export const ErrorResponsive: StoryObj<typeof TasksListError> = {
  name: 'Error - Responsive',
  render: () => (
    <div className="p-4">
      <TasksListError size={{ base: 'sm', md: 'md', lg: 'lg' }} onRetry={() => {}} />
    </div>
  ),
};

// ============================================================================
// TasksListContent Stories
// ============================================================================

export const ContentWithTasks: StoryObj<typeof TasksListContent> = {
  name: 'Content - With Tasks',
  render: () => (
    <TasksListContent
      isLoading={false}
      tasks={mockTasks}
      filter="all"
      onSelectTask={(id) => console.log('Select:', id)}
      onStatusChange={(id, status) => console.log('Status:', id, status)}
      data-testid="content"
    />
  ),
};

export const ContentLoading: StoryObj<typeof TasksListContent> = {
  name: 'Content - Loading',
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

export const ContentEmpty: StoryObj<typeof TasksListContent> = {
  name: 'Content - Empty',
  render: () => (
    <div className="h-96">
      <TasksListContent
        isLoading={false}
        tasks={[]}
        filter="all"
        onSelectTask={() => {}}
        onStatusChange={() => {}}
        onCreateTask={() => console.log('Create')}
      />
    </div>
  ),
};

export const ContentError: StoryObj<typeof TasksListContent> = {
  name: 'Content - Error',
  render: () => (
    <TasksListContent
      isLoading={false}
      tasks={[]}
      filter="all"
      error="Failed to load tasks from the server."
      onSelectTask={() => {}}
      onStatusChange={() => {}}
      onRetry={() => console.log('Retry')}
    />
  ),
};

export const ContentStateTransitions: StoryObj<typeof TasksListContent> = {
  name: 'Content - State Transitions',
  render: function StateTransitions() {
    const [state, setState] = useState<'loading' | 'empty' | 'error' | 'loaded'>('loading');

    const getProps = () => {
      switch (state) {
        case 'loading':
          return { isLoading: true, tasks: [], error: null };
        case 'empty':
          return { isLoading: false, tasks: [], error: null };
        case 'error':
          return { isLoading: false, tasks: [], error: 'Network error' };
        case 'loaded':
          return { isLoading: false, tasks: mockTasks, error: null };
      }
    };

    return (
      <div className="space-y-4 p-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setState('loading')}
            className={`px-3 py-1 rounded ${state === 'loading' ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' : 'bg-[rgb(var(--muted))]'}`}
          >
            Loading
          </button>
          <button
            type="button"
            onClick={() => setState('loaded')}
            className={`px-3 py-1 rounded ${state === 'loaded' ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' : 'bg-[rgb(var(--muted))]'}`}
          >
            Loaded
          </button>
          <button
            type="button"
            onClick={() => setState('empty')}
            className={`px-3 py-1 rounded ${state === 'empty' ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' : 'bg-[rgb(var(--muted))]'}`}
          >
            Empty
          </button>
          <button
            type="button"
            onClick={() => setState('error')}
            className={`px-3 py-1 rounded ${state === 'error' ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' : 'bg-[rgb(var(--muted))]'}`}
          >
            Error
          </button>
        </div>
        <div className="h-96 border rounded-lg overflow-hidden">
          <TasksListContent
            {...getProps()}
            filter="all"
            onSelectTask={() => {}}
            onStatusChange={() => {}}
            onRetry={() => setState('loading')}
            onCreateTask={() => {}}
          />
        </div>
      </div>
    );
  },
};

// ============================================================================
// TasksListLayout Stories
// ============================================================================

export const LayoutDefault: StoryObj<typeof TasksListLayout> = {
  name: 'Layout - Default',
  render: () => (
    <div className="h-screen">
      <TasksListLayout
        filterBar={
          <TasksFilterBar filters={mockFilters} selectedFilter="all" onFilterChange={() => {}} />
        }
        data-testid="layout"
      >
        <TasksListContent
          isLoading={false}
          tasks={mockTasks}
          filter="all"
          onSelectTask={() => {}}
          onStatusChange={() => {}}
        />
      </TasksListLayout>
    </div>
  ),
};

export const LayoutLoading: StoryObj<typeof TasksListLayout> = {
  name: 'Layout - Loading State',
  render: () => (
    <div className="h-screen">
      <TasksListLayout
        filterBar={
          <TasksFilterBar
            filters={mockFiltersWithoutCounts}
            selectedFilter="all"
            onFilterChange={() => {}}
          />
        }
      >
        <TasksListContent
          isLoading={true}
          tasks={[]}
          filter="all"
          onSelectTask={() => {}}
          onStatusChange={() => {}}
        />
      </TasksListLayout>
    </div>
  ),
};

export const LayoutEmpty: StoryObj<typeof TasksListLayout> = {
  name: 'Layout - Empty State',
  render: () => (
    <div className="h-screen">
      <TasksListLayout
        filterBar={
          <TasksFilterBar
            filters={mockFiltersWithoutCounts}
            selectedFilter="all"
            onFilterChange={() => {}}
          />
        }
      >
        <TasksListContent
          isLoading={false}
          tasks={[]}
          filter="all"
          onSelectTask={() => {}}
          onStatusChange={() => {}}
          onCreateTask={() => {}}
        />
      </TasksListLayout>
    </div>
  ),
};

export const LayoutResponsive: StoryObj<typeof TasksListLayout> = {
  name: 'Layout - Responsive',
  render: () => (
    <div className="h-screen">
      <TasksListLayout
        filterBar={
          <TasksFilterBar
            filters={mockFilters}
            selectedFilter="all"
            onFilterChange={() => {}}
            size={{ base: 'sm', md: 'md', lg: 'lg' }}
          />
        }
        size={{ base: 'sm', md: 'md', lg: 'lg' }}
      >
        <TasksListContent
          isLoading={false}
          tasks={mockTasks}
          filter="all"
          onSelectTask={() => {}}
          onStatusChange={() => {}}
          size={{ base: 'sm', md: 'md', lg: 'lg' }}
        />
      </TasksListLayout>
    </div>
  ),
};

export const LayoutInteractive: StoryObj<typeof TasksListLayout> = {
  name: 'Layout - Interactive Demo',
  render: function InteractiveLayout() {
    const [filter, setFilter] = useState<StatusFilter>('all');
    const [tasks, setTasks] = useState(mockTasks);

    const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

    const filtersWithCounts: StatusFilterOption[] = [
      { label: 'All', value: 'all', count: tasks.length },
      {
        label: 'To Do',
        value: TaskStatus.Todo,
        count: tasks.filter((t) => t.status === TaskStatus.Todo).length,
      },
      {
        label: 'In Progress',
        value: TaskStatus.Inprogress,
        count: tasks.filter((t) => t.status === TaskStatus.Inprogress).length,
      },
      {
        label: 'In Review',
        value: TaskStatus.Inreview,
        count: tasks.filter((t) => t.status === TaskStatus.Inreview).length,
      },
      {
        label: 'Done',
        value: TaskStatus.Done,
        count: tasks.filter((t) => t.status === TaskStatus.Done).length,
      },
    ];

    return (
      <div className="h-screen">
        <TasksListLayout
          filterBar={
            <TasksFilterBar
              filters={filtersWithCounts}
              selectedFilter={filter}
              onFilterChange={setFilter}
            />
          }
        >
          <TasksListContent
            isLoading={false}
            tasks={filteredTasks}
            filter={filter}
            onSelectTask={(id) => console.log('Select:', id)}
            onStatusChange={(id, status) => {
              setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
            }}
          />
        </TasksListLayout>
      </div>
    );
  },
};

// ============================================================================
// Accessibility Stories
// ============================================================================

export const AccessibilityFocusRing: StoryObj = {
  name: 'Accessibility - Focus Ring Visibility',
  render: () => (
    <div className="space-y-4 p-4">
      <div className="rounded-lg bg-[rgb(var(--muted))] p-4">
        <h3 className="font-medium mb-2">Focus Ring Visibility Demo</h3>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Tab through the filter buttons to see focus rings with ring-offset for visibility on any
          background.
        </p>
      </div>
      <TasksFilterBar filters={mockFilters} selectedFilter="all" onFilterChange={() => {}} />
    </div>
  ),
};

export const AccessibilityTouchTarget: StoryObj = {
  name: 'Accessibility - Touch Targets (44px)',
  render: () => (
    <div className="space-y-4 p-4">
      <div className="rounded-lg bg-[rgb(var(--muted))] p-4">
        <h3 className="font-medium mb-2">Touch Target Demo (WCAG 2.5.5)</h3>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          On mobile viewports, all interactive elements have a minimum touch target of 44×44px.
          Resize to mobile width to see the larger touch targets.
        </p>
      </div>
      <TasksFilterBar
        filters={mockFilters}
        selectedFilter="all"
        onFilterChange={() => {}}
        size="md"
      />
    </div>
  ),
};

export const AccessibilityScreenReader: StoryObj = {
  name: 'Accessibility - Screen Reader Demo',
  render: function ScreenReaderDemo() {
    const [filter, setFilter] = useState<StatusFilter>('all');

    return (
      <div className="space-y-4 p-4">
        <div className="rounded-lg bg-[rgb(var(--muted))] p-4">
          <h3 className="font-medium mb-2">Screen Reader Announcements</h3>
          <ul className="text-sm text-[rgb(var(--muted-foreground))] space-y-1">
            <li>• Filter bar has role="tablist" with aria-label</li>
            <li>• Each filter has role="tab" with aria-selected</li>
            <li>• Filter changes are announced via aria-live region</li>
            <li>• Loading state uses role="status" with aria-busy</li>
            <li>• Error state uses role="alert" with aria-live="assertive"</li>
          </ul>
        </div>
        <TasksFilterBar
          filters={mockFilters}
          selectedFilter={filter}
          onFilterChange={setFilter}
          aria-label="Filter tasks by status"
        />
      </div>
    );
  },
};

export const AccessibilityReducedMotion: StoryObj = {
  name: 'Accessibility - Reduced Motion',
  render: () => (
    <div className="space-y-4 p-4">
      <div className="rounded-lg bg-[rgb(var(--muted))] p-4">
        <h3 className="font-medium mb-2">Reduced Motion Support</h3>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          All animations use the motion-safe: prefix to respect the user's prefers-reduced-motion
          setting. Loading skeletons use motion-safe:animate-pulse.
        </p>
      </div>
      <TasksListLoading count={3} />
    </div>
  ),
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

export const RefForwarding: StoryObj = {
  name: 'Ref Forwarding',
  render: function RefDemo() {
    const filterBarRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef<HTMLDivElement>(null);
    const emptyRef = useRef<HTMLDivElement>(null);
    const errorRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const layoutRef = useRef<HTMLDivElement>(null);

    const logRefs = () => {
      console.log('FilterBar ref:', filterBarRef.current);
      console.log('Loading ref:', loadingRef.current);
      console.log('Empty ref:', emptyRef.current);
      console.log('Error ref:', errorRef.current);
      console.log('Content ref:', contentRef.current);
      console.log('Layout ref:', layoutRef.current);
    };

    return (
      <div className="space-y-4 p-4">
        <button
          type="button"
          onClick={logRefs}
          className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded"
        >
          Log All Refs to Console
        </button>
        <div className="grid gap-4">
          <TasksFilterBar
            ref={filterBarRef}
            filters={mockFilters}
            selectedFilter="all"
            onFilterChange={() => {}}
          />
        </div>
      </div>
    );
  },
};

export const DataAttributes: StoryObj = {
  name: 'Data Attributes',
  render: () => (
    <div className="space-y-4 p-4">
      <div className="rounded-lg bg-[rgb(var(--muted))] p-4">
        <h3 className="font-medium mb-2">Data Attributes for Testing</h3>
        <ul className="text-sm text-[rgb(var(--muted-foreground))] space-y-1">
          <li>
            • <code>data-testid</code>: For test selectors
          </li>
          <li>
            • <code>data-size</code>: Current base size
          </li>
          <li>
            • <code>data-selected-filter</code>: Current filter value
          </li>
          <li>
            • <code>data-selected</code>: On individual tabs
          </li>
          <li>
            • <code>data-count</code>: Skeleton item count
          </li>
          <li>
            • <code>data-filter</code>: Current filter for empty state
          </li>
        </ul>
      </div>
      <TasksFilterBar
        filters={mockFilters}
        selectedFilter={TaskStatus.Inprogress}
        onFilterChange={() => {}}
        size="md"
        data-testid="filter-bar-demo"
      />
      <TasksListLoading count={3} size="md" data-testid="loading-demo" />
    </div>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

export const RealWorldTasksPage: StoryObj = {
  name: 'Real World - Tasks Page',
  render: function TasksPage() {
    const [filter, setFilter] = useState<StatusFilter>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [tasks, setTasks] = useState<typeof mockTasks>([]);

    // Simulate initial load
    useState(() => {
      const timer = setTimeout(() => {
        setTasks(mockTasks);
        setIsLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    });

    const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

    const filtersWithCounts: StatusFilterOption[] = [
      { label: 'All', value: 'all', count: tasks.length },
      {
        label: 'To Do',
        value: TaskStatus.Todo,
        count: tasks.filter((t) => t.status === TaskStatus.Todo).length,
      },
      {
        label: 'In Progress',
        value: TaskStatus.Inprogress,
        count: tasks.filter((t) => t.status === TaskStatus.Inprogress).length,
      },
      {
        label: 'In Review',
        value: TaskStatus.Inreview,
        count: tasks.filter((t) => t.status === TaskStatus.Inreview).length,
      },
      {
        label: 'Done',
        value: TaskStatus.Done,
        count: tasks.filter((t) => t.status === TaskStatus.Done).length,
      },
    ];

    return (
      <div className="h-screen">
        <TasksListLayout
          filterBar={
            <TasksFilterBar
              filters={filtersWithCounts}
              selectedFilter={filter}
              onFilterChange={setFilter}
            />
          }
        >
          <TasksListContent
            isLoading={isLoading}
            tasks={filteredTasks}
            filter={filter}
            onSelectTask={(id) => console.log('Select task:', id)}
            onStatusChange={(id, status) => {
              setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
            }}
            onCreateTask={() => console.log('Create task')}
          />
        </TasksListLayout>
      </div>
    );
  },
};

export const RealWorldMobileView: StoryObj = {
  name: 'Real World - Mobile View',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  render: function MobileView() {
    const [filter, setFilter] = useState<StatusFilter>('all');

    return (
      <div className="h-screen">
        <TasksListLayout
          filterBar={
            <TasksFilterBar
              filters={mockFilters}
              selectedFilter={filter}
              onFilterChange={setFilter}
              size="sm"
            />
          }
          size="sm"
        >
          <TasksListContent
            isLoading={false}
            tasks={mockTasks.slice(0, 3)}
            filter={filter}
            onSelectTask={() => {}}
            onStatusChange={() => {}}
            size="sm"
          />
        </TasksListLayout>
      </div>
    );
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

export const ConstantsReference: StoryObj = {
  name: 'Constants Reference',
  render: () => (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-3">Default Labels</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Constant</th>
              <th className="text-left py-2">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-mono text-xs">DEFAULT_FILTER_BAR_LABEL</td>
              <td className="py-2">{DEFAULT_FILTER_BAR_LABEL}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono text-xs">DEFAULT_LOADING_LABEL</td>
              <td className="py-2">{DEFAULT_LOADING_LABEL}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono text-xs">DEFAULT_EMPTY_TITLE</td>
              <td className="py-2">{DEFAULT_EMPTY_TITLE}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono text-xs">DEFAULT_ERROR_TITLE</td>
              <td className="py-2">{DEFAULT_ERROR_TITLE}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono text-xs">DEFAULT_RETRY_LABEL</td>
              <td className="py-2">{DEFAULT_RETRY_LABEL}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono text-xs">DEFAULT_SKELETON_COUNT</td>
              <td className="py-2">{DEFAULT_SKELETON_COUNT}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">CSS Class Constants</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Constant</th>
              <th className="text-left py-2">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-mono text-xs">FILTER_BAR_BASE_CLASSES</td>
              <td className="py-2 font-mono text-xs">{FILTER_BAR_BASE_CLASSES}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono text-xs">LOADING_BASE_CLASSES</td>
              <td className="py-2 font-mono text-xs">{LOADING_BASE_CLASSES}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono text-xs">LAYOUT_BASE_CLASSES</td>
              <td className="py-2 font-mono text-xs">{LAYOUT_BASE_CLASSES}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Size Mappings</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">FILTER_BAR_PADDING_CLASSES</h3>
            <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs">
              {JSON.stringify(FILTER_BAR_PADDING_CLASSES, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="font-medium mb-2">FILTER_TAB_SIZE_CLASSES</h3>
            <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs">
              {JSON.stringify(FILTER_TAB_SIZE_CLASSES, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="font-medium mb-2">LOADING_GAP_CLASSES</h3>
            <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs">
              {JSON.stringify(LOADING_GAP_CLASSES, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="font-medium mb-2">ERROR_PADDING_CLASSES</h3>
            <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs">
              {JSON.stringify(ERROR_PADDING_CLASSES, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="font-medium mb-2">LAYOUT_CONTENT_PADDING_CLASSES</h3>
            <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs">
              {JSON.stringify(LAYOUT_CONTENT_PADDING_CLASSES, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  ),
};
