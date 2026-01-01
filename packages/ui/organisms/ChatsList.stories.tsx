import { ChatRole } from '@openflow/generated';
import type { Chat } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import {
  // Constants
  CHATS_LIST_BASE_CLASSES,
  CHATS_LIST_GAP_CLASSES,
  CHATS_LIST_ITEMS_GAP_CLASSES,
  type ChatFilter,
  ChatsList,
  ChatsListError,
  ChatsListSkeleton,
  DEFAULT_EMPTY_DESCRIPTION_ALL,
  DEFAULT_EMPTY_TITLE_ALL,
  DEFAULT_EMPTY_TITLE_STANDALONE,
  DEFAULT_EMPTY_TITLE_TASK_LINKED,
  DEFAULT_ERROR_RETRY_LABEL,
  DEFAULT_ERROR_TITLE,
  DEFAULT_FILTER_LABEL,
  DEFAULT_LIST_LABEL,
  DEFAULT_SKELETON_COUNT,
  FILTER_OPTIONS,
  FILTER_TABS_CONTAINER_CLASSES,
  FILTER_TAB_BASE_CLASSES,
  SKELETON_CARD_HEIGHT_CLASSES,
  SR_CHATS_COUNT,
  SR_FILTER_CHANGED,
  SR_LOADING,
  SR_NO_RESULTS,
  // Utility functions
  buildListAccessibleLabel,
  getBaseSize,
  getEmptyStateContent,
  getFilterAnnouncement,
} from './ChatsList';

const meta: Meta<typeof ChatsList> = {
  title: 'Organisms/ChatsList',
  component: ChatsList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
ChatsList is a filterable list of chat sessions with full accessibility support.

## Features
- **Filter tabs** for all/standalone/task-linked chats with ARIA tablist pattern
- **Loading skeleton state** for data fetching
- **Error state** with retry functionality
- **Empty state** with context-specific messaging per filter
- **Keyboard navigation** (Arrow keys, Home, End for tab navigation)
- **Screen reader announcements** for filter changes
- **Touch targets ≥44px** on mobile (WCAG 2.5.5)
- **Responsive sizing** support (sm/md/lg)

## Accessibility
- ARIA tablist/tab pattern for filter buttons
- Proper list semantics (role="list", role="listitem")
- aria-live region for dynamic content updates
- Roving tabindex for keyboard navigation
- Focus rings with ring-offset for visibility

## Exported Constants
- \`DEFAULT_LIST_LABEL\`, \`DEFAULT_FILTER_LABEL\`, \`DEFAULT_ERROR_TITLE\`, \`DEFAULT_ERROR_RETRY_LABEL\`
- \`DEFAULT_EMPTY_TITLE_ALL\`, \`DEFAULT_EMPTY_DESCRIPTION_ALL\`
- \`DEFAULT_EMPTY_TITLE_STANDALONE\`, \`DEFAULT_EMPTY_DESCRIPTION_STANDALONE\`
- \`DEFAULT_EMPTY_TITLE_TASK_LINKED\`, \`DEFAULT_EMPTY_DESCRIPTION_TASK_LINKED\`
- \`SR_FILTER_CHANGED\`, \`SR_CHATS_COUNT\`, \`SR_NO_RESULTS\`, \`SR_LOADING\`
- \`FILTER_OPTIONS\`, \`CHATS_LIST_BASE_CLASSES\`, \`CHATS_LIST_GAP_CLASSES\`
- \`FILTER_TABS_CONTAINER_CLASSES\`, \`FILTER_TAB_BASE_CLASSES\`, etc.

## Exported Utility Functions
- \`getBaseSize(size)\` - Extract base size from responsive value
- \`getResponsiveSizeClasses(size, classMap)\` - Generate responsive Tailwind classes
- \`getEmptyStateContent(filter)\` - Get empty state title/description for filter
- \`getFilterAnnouncement(filter, count)\` - Get screen reader announcement text
- \`buildListAccessibleLabel(filter, count)\` - Build accessible list label
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    chats: {
      control: false,
      description: 'Chats to display',
    },
    filter: {
      control: 'select',
      options: ['all', 'standalone', 'task-linked'],
      description: 'Current filter',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant for responsive sizing',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the list is loading',
    },
  },
  args: {
    onFilterChange: fn(),
    onSelectChat: fn(),
    onMoreClick: fn(),
    onChatContextMenu: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-md mx-auto">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatsList>;

/** Helper to create a chat with required fields */
function createChat(
  id: string,
  title: string,
  projectId: string,
  taskId?: string,
  options?: Partial<Chat>
): Chat {
  const now = new Date().toISOString();
  return {
    id,
    title,
    projectId,
    taskId,
    chatRole: ChatRole.Main,
    baseBranch: 'main',
    worktreeDeleted: false,
    isPlanContainer: false,
    createdAt: now,
    updatedAt: now,
    ...options,
  };
}

/** Sample chats with mix of standalone and task-linked */
const sampleChats: Chat[] = [
  createChat('chat-1', 'Implement user authentication', 'proj-1', 'task-1', {
    setupCompletedAt: new Date().toISOString(),
  }),
  createChat('chat-2', 'Quick question about React hooks', 'proj-1'),
  createChat('chat-3', 'Fix button styling issue', 'proj-2', 'task-2'),
  createChat('chat-4', 'Brainstorming session', 'proj-1'),
  createChat('chat-5', 'API integration help', 'proj-2', 'task-3'),
];

/** Project and task lookup maps */
const projectNames: Record<string, string> = {
  'proj-1': 'OpenFlow App',
  'proj-2': 'Marketing Website',
};

const taskTitles: Record<string, string> = {
  'task-1': 'User Auth Feature',
  'task-2': 'UI Polish Sprint',
  'task-3': 'Backend Integration',
};

/** Interactive demo with filter state */
function ChatsListDemo({
  chats = sampleChats,
  initialFilter = 'all' as ChatFilter,
  ...props
}: Partial<React.ComponentProps<typeof ChatsList>> & { initialFilter?: ChatFilter }) {
  const [filter, setFilter] = useState<ChatFilter>(initialFilter);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  return (
    <ChatsList
      chats={chats}
      projectNames={projectNames}
      taskTitles={taskTitles}
      filter={filter}
      onFilterChange={setFilter}
      selectedChatId={selectedId}
      onSelectChat={setSelectedId}
      {...props}
    />
  );
}

// =============================================================================
// Basic Examples
// =============================================================================

/** Default list with all chats and interactive filter */
export const Default: Story = {
  render: () => <ChatsListDemo />,
};

/** Pre-filtered to standalone chats */
export const StandaloneFilter: Story = {
  render: () => <ChatsListDemo initialFilter="standalone" />,
};

/** Pre-filtered to task-linked chats */
export const TaskLinkedFilter: Story = {
  render: () => <ChatsListDemo initialFilter="task-linked" />,
};

/** With a chat selected */
export const WithSelection: Story = {
  args: {
    chats: sampleChats,
    projectNames,
    taskTitles,
    selectedChatId: 'chat-1',
    filter: 'all',
  },
};

// =============================================================================
// Loading States
// =============================================================================

/** Loading state with skeleton */
export const Loading: Story = {
  args: {
    chats: [],
    isLoading: true,
  },
};

/** Loading state without filter tabs */
export const LoadingNoFilters: Story = {
  args: {
    chats: [],
    isLoading: true,
    onFilterChange: undefined,
  },
};

/** ChatsListSkeleton component directly */
export const SkeletonComponent: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Default (3 items)</h3>
        <ChatsListSkeleton />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">5 items, no filter skeleton</h3>
        <ChatsListSkeleton count={5} showFilterSkeleton={false} />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Size variants</h3>
        <div className="space-y-4">
          <ChatsListSkeleton count={2} size="sm" />
          <ChatsListSkeleton count={2} size="md" />
          <ChatsListSkeleton count={2} size="lg" />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// Error States
// =============================================================================

/** Error state with retry */
export const ErrorState: Story = {
  render: () => (
    <ChatsListError
      message="Unable to connect to the server. Please check your connection."
      onRetry={() => console.log('Retry clicked')}
    />
  ),
};

/** Error state without retry */
export const ErrorNoRetry: Story = {
  render: () => <ChatsListError message="Something went wrong while loading chats." />,
};

/** Error state with custom labels */
export const ErrorCustomLabels: Story = {
  render: () => (
    <ChatsListError
      errorTitle="Connection Failed"
      message="Please try again later."
      retryLabel="Try Again"
      onRetry={() => console.log('Retry clicked')}
    />
  ),
};

// =============================================================================
// Empty States
// =============================================================================

/** Empty state - no chats at all */
export const Empty: Story = {
  args: {
    chats: [],
    filter: 'all',
  },
};

/** Empty state - standalone filter with no matches */
export const EmptyStandalone: Story = {
  args: {
    chats: sampleChats.filter((c) => c.taskId), // Only task-linked
    filter: 'standalone',
  },
};

/** Empty state - task-linked filter with no matches */
export const EmptyTaskLinked: Story = {
  args: {
    chats: sampleChats.filter((c) => !c.taskId), // Only standalone
    filter: 'task-linked',
  },
};

// =============================================================================
// Size Variants
// =============================================================================

/** Small size */
export const SizeSmall: Story = {
  args: {
    chats: sampleChats.slice(0, 3),
    projectNames,
    taskTitles,
    filter: 'all',
    size: 'sm',
  },
};

/** Medium size (default) */
export const SizeMedium: Story = {
  args: {
    chats: sampleChats.slice(0, 3),
    projectNames,
    taskTitles,
    filter: 'all',
    size: 'md',
  },
};

/** Large size */
export const SizeLarge: Story = {
  args: {
    chats: sampleChats.slice(0, 3),
    projectNames,
    taskTitles,
    filter: 'all',
    size: 'lg',
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-8">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <h3 className="text-sm font-medium mb-2">Size: {size}</h3>
          <ChatsList
            chats={sampleChats.slice(0, 2)}
            projectNames={projectNames}
            taskTitles={taskTitles}
            filter="all"
            size={size}
          />
        </div>
      ))}
    </div>
  ),
};

/** Responsive sizing */
export const ResponsiveSizing: Story = {
  args: {
    chats: sampleChats.slice(0, 3),
    projectNames,
    taskTitles,
    filter: 'all',
    size: { base: 'sm', md: 'md', lg: 'lg' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Responsive sizing: small on mobile, medium on tablet, large on desktop.',
      },
    },
  },
};

// =============================================================================
// Without Filter Tabs
// =============================================================================

/** Without filter tabs (no onFilterChange) */
export const WithoutFilterTabs: Story = {
  args: {
    chats: sampleChats,
    projectNames,
    taskTitles,
    filter: 'all',
    onFilterChange: undefined,
  },
};

// =============================================================================
// Content Variations
// =============================================================================

/** Single chat */
export const SingleChat: Story = {
  args: {
    chats: sampleChats.slice(0, 1),
    projectNames,
    taskTitles,
    filter: 'all',
  },
};

/** Many chats for scroll testing */
export const ManyChats: Story = {
  render: () => {
    const manyChats: Chat[] = Array.from({ length: 20 }, (_, i) =>
      createChat(
        `chat-${i + 1}`,
        `Chat session ${i + 1}`,
        i % 2 === 0 ? 'proj-1' : 'proj-2',
        i % 3 === 0 ? `task-${i + 1}` : undefined
      )
    );

    return (
      <div className="h-[400px] overflow-auto">
        <ChatsListDemo chats={manyChats} />
      </div>
    );
  },
};

// =============================================================================
// Accessibility Demos
// =============================================================================

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg text-sm">
        <p className="font-medium mb-2">Keyboard Navigation:</p>
        <ul className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>
            <kbd className="px-1 rounded border bg-[rgb(var(--background))]">Tab</kbd> - Move to
            filter tabs
          </li>
          <li>
            <kbd className="px-1 rounded border bg-[rgb(var(--background))]">Arrow Left/Right</kbd>{' '}
            - Navigate between tabs
          </li>
          <li>
            <kbd className="px-1 rounded border bg-[rgb(var(--background))]">Arrow Up/Down</kbd> -
            Also navigate tabs
          </li>
          <li>
            <kbd className="px-1 rounded border bg-[rgb(var(--background))]">Home</kbd> - Jump to
            first tab
          </li>
          <li>
            <kbd className="px-1 rounded border bg-[rgb(var(--background))]">End</kbd> - Jump to
            last tab
          </li>
          <li>
            <kbd className="px-1 rounded border bg-[rgb(var(--background))]">Enter/Space</kbd> -
            Activate chat card
          </li>
        </ul>
      </div>
      <ChatsListDemo />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full keyboard navigation support with ARIA tablist pattern.',
      },
    },
  },
};

/** Screen reader accessibility demo */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg text-sm">
        <p className="font-medium mb-2">Screen Reader Features:</p>
        <ul className="space-y-1 text-[rgb(var(--muted-foreground))]">
          <li>Filter tabs use role="tablist" with aria-selected</li>
          <li>Each tab has aria-label describing the action</li>
          <li>Filter changes are announced via aria-live region</li>
          <li>List uses role="list" with role="listitem" for each card</li>
          <li>List has aria-label with filter and count info</li>
          <li>Empty states are announced with context</li>
        </ul>
      </div>
      <ChatsListDemo />
    </div>
  ),
};

/** Focus ring visibility demo */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Tab through to see focus rings with ring-offset for visibility on all backgrounds.
      </p>
      <ChatsListDemo />
    </div>
  ),
};

/** Touch target accessibility demo */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg text-sm">
        <p className="font-medium mb-2">Touch Target Compliance (WCAG 2.5.5):</p>
        <p className="text-[rgb(var(--muted-foreground))]">
          Filter tabs have minimum 44px height on mobile (min-h-[44px]) and relax to 36px on desktop
          (sm:min-h-[36px]).
        </p>
      </div>
      <ChatsList
        chats={sampleChats.slice(0, 2)}
        projectNames={projectNames}
        taskTitles={taskTitles}
        filter="all"
        onFilterChange={() => {}}
      />
    </div>
  ),
};

// =============================================================================
// Ref and Data Attributes
// =============================================================================

/** forwardRef demo */
export const RefForwarding: Story = {
  render: () => {
    const ref = { current: null as HTMLDivElement | null };
    return (
      <div className="space-y-4">
        <button
          type="button"
          className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded"
          onClick={() => {
            if (ref.current) {
              console.log('ChatsList element:', ref.current);
              console.log('data-filter:', ref.current.dataset.filter);
              console.log('data-chat-count:', ref.current.dataset.chatCount);
            }
          }}
        >
          Log ref info
        </button>
        <ChatsList
          ref={(el) => {
            ref.current = el;
          }}
          chats={sampleChats}
          projectNames={projectNames}
          taskTitles={taskTitles}
          filter="all"
          data-testid="demo-chats-list"
        />
      </div>
    );
  },
};

/** data-testid demo */
export const DataTestId: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-[rgb(var(--muted))] rounded-lg text-sm">
        <p className="font-medium mb-2">Test IDs generated:</p>
        <ul className="space-y-1 text-[rgb(var(--muted-foreground))] font-mono text-xs">
          <li>demo-list (container)</li>
          <li>demo-list-tab-all, demo-list-tab-standalone, demo-list-tab-task-linked (tabs)</li>
          <li>demo-list-list (list container)</li>
          <li>demo-list-item-[chat-id] (list items)</li>
          <li>demo-list-empty (empty state when shown)</li>
          <li>demo-list-skeleton (when loading)</li>
        </ul>
      </div>
      <ChatsList
        chats={sampleChats}
        projectNames={projectNames}
        taskTitles={taskTitles}
        filter="all"
        onFilterChange={() => {}}
        data-testid="demo-list"
      />
    </div>
  ),
};

// =============================================================================
// Real-World Examples
// =============================================================================

/** Sidebar chat list */
export const SidebarChatList: Story = {
  render: () => (
    <div className="w-72 h-[500px] border border-[rgb(var(--border))] rounded-lg overflow-hidden">
      <div className="p-3 border-b border-[rgb(var(--border))]">
        <h2 className="font-semibold">Recent Chats</h2>
      </div>
      <div className="p-3 h-[calc(100%-52px)] overflow-auto">
        <ChatsListDemo />
      </div>
    </div>
  ),
};

/** Dashboard chat panel */
export const DashboardChatPanel: Story = {
  render: () => (
    <div className="p-6 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Active Chats</h2>
        <button
          type="button"
          className="px-3 py-1.5 text-sm bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-md"
        >
          New Chat
        </button>
      </div>
      <ChatsListDemo />
    </div>
  ),
};

/** Mobile view with filter */
export const MobileView: Story = {
  render: () => (
    <div className="w-[320px] mx-auto">
      <ChatsListDemo />
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/** Loading to content transition */
export const LoadingTransition: Story = {
  render: () => {
    const [isLoading, setIsLoading] = useState(true);

    return (
      <div className="space-y-4">
        <button
          type="button"
          className="px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded"
          onClick={() => setIsLoading(!isLoading)}
        >
          Toggle Loading: {isLoading ? 'ON' : 'OFF'}
        </button>
        <ChatsList
          chats={sampleChats}
          projectNames={projectNames}
          taskTitles={taskTitles}
          filter="all"
          onFilterChange={() => {}}
          isLoading={isLoading}
        />
      </div>
    );
  },
};

// =============================================================================
// Constants Reference
// =============================================================================

/** Constants reference story */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-6 text-sm">
      <section>
        <h3 className="font-semibold mb-2">Default Labels</h3>
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">DEFAULT_LIST_LABEL</dt>
          <dd>"{DEFAULT_LIST_LABEL}"</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">DEFAULT_FILTER_LABEL</dt>
          <dd>"{DEFAULT_FILTER_LABEL}"</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">DEFAULT_ERROR_TITLE</dt>
          <dd>"{DEFAULT_ERROR_TITLE}"</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">
            DEFAULT_ERROR_RETRY_LABEL
          </dt>
          <dd>"{DEFAULT_ERROR_RETRY_LABEL}"</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">DEFAULT_SKELETON_COUNT</dt>
          <dd>{DEFAULT_SKELETON_COUNT}</dd>
        </dl>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Empty State Labels</h3>
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">DEFAULT_EMPTY_TITLE_ALL</dt>
          <dd>"{DEFAULT_EMPTY_TITLE_ALL}"</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">
            DEFAULT_EMPTY_DESCRIPTION_ALL
          </dt>
          <dd>"{DEFAULT_EMPTY_DESCRIPTION_ALL}"</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">
            DEFAULT_EMPTY_TITLE_STANDALONE
          </dt>
          <dd>"{DEFAULT_EMPTY_TITLE_STANDALONE}"</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">
            DEFAULT_EMPTY_TITLE_TASK_LINKED
          </dt>
          <dd>"{DEFAULT_EMPTY_TITLE_TASK_LINKED}"</dd>
        </dl>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Screen Reader Constants</h3>
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">SR_FILTER_CHANGED</dt>
          <dd>"{SR_FILTER_CHANGED}"</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">SR_CHATS_COUNT</dt>
          <dd>"{SR_CHATS_COUNT}"</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">SR_NO_RESULTS</dt>
          <dd>"{SR_NO_RESULTS}"</dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">SR_LOADING</dt>
          <dd>"{SR_LOADING}"</dd>
        </dl>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Filter Options</h3>
        <pre className="bg-[rgb(var(--muted))] p-2 rounded text-xs overflow-auto">
          {JSON.stringify(FILTER_OPTIONS, null, 2)}
        </pre>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Class Constants</h3>
        <dl className="space-y-2 text-xs">
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">CHATS_LIST_BASE_CLASSES</dt>
          <dd className="font-mono bg-[rgb(var(--muted))] p-1 rounded">
            {CHATS_LIST_BASE_CLASSES}
          </dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">
            FILTER_TABS_CONTAINER_CLASSES
          </dt>
          <dd className="font-mono bg-[rgb(var(--muted))] p-1 rounded">
            {FILTER_TABS_CONTAINER_CLASSES}
          </dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">FILTER_TAB_BASE_CLASSES</dt>
          <dd className="font-mono bg-[rgb(var(--muted))] p-1 rounded break-all">
            {FILTER_TAB_BASE_CLASSES}
          </dd>
        </dl>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Size Classes</h3>
        <dl className="space-y-2 text-xs">
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">CHATS_LIST_GAP_CLASSES</dt>
          <dd className="font-mono bg-[rgb(var(--muted))] p-1 rounded">
            {JSON.stringify(CHATS_LIST_GAP_CLASSES)}
          </dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">
            CHATS_LIST_ITEMS_GAP_CLASSES
          </dt>
          <dd className="font-mono bg-[rgb(var(--muted))] p-1 rounded">
            {JSON.stringify(CHATS_LIST_ITEMS_GAP_CLASSES)}
          </dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">
            SKELETON_CARD_HEIGHT_CLASSES
          </dt>
          <dd className="font-mono bg-[rgb(var(--muted))] p-1 rounded">
            {JSON.stringify(SKELETON_CARD_HEIGHT_CLASSES)}
          </dd>
        </dl>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Utility Functions</h3>
        <dl className="space-y-2 text-xs">
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">
            getBaseSize({JSON.stringify({ base: 'sm', md: 'lg' })})
          </dt>
          <dd className="font-mono bg-[rgb(var(--muted))] p-1 rounded">
            "{getBaseSize({ base: 'sm', md: 'lg' })}"
          </dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">
            getEmptyStateContent('standalone')
          </dt>
          <dd className="font-mono bg-[rgb(var(--muted))] p-1 rounded">
            {JSON.stringify(getEmptyStateContent('standalone'))}
          </dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">
            getFilterAnnouncement('all', 5)
          </dt>
          <dd className="font-mono bg-[rgb(var(--muted))] p-1 rounded">
            "{getFilterAnnouncement('all', 5)}"
          </dd>
          <dt className="font-mono text-[rgb(var(--muted-foreground))]">
            buildListAccessibleLabel('standalone', 3)
          </dt>
          <dd className="font-mono bg-[rgb(var(--muted))] p-1 rounded">
            "{buildListAccessibleLabel('standalone', 3)}"
          </dd>
        </dl>
      </section>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Reference for all exported constants and utility functions.',
      },
    },
  },
};
