import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Plus, Settings, Archive, FileText, GitBranch } from 'lucide-react';
import { CommandPalette, type CommandAction, type RecentItem } from './CommandPalette';
import { SearchResultType, type SearchResult } from '@openflow/generated';

const meta = {
  title: 'Organisms/CommandPalette',
  component: CommandPalette,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    isOpen: true,
    onClose: fn(),
    onSearch: fn(),
    onSelectResult: fn(),
    onSelectRecent: fn(),
  },
  decorators: [
    (Story) => (
      <div className="h-screen w-full bg-[rgb(var(--background))]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample recent items
const sampleRecentItems: RecentItem[] = [
  {
    id: 'task-1',
    type: SearchResultType.Task,
    title: 'Implement user authentication',
    subtitle: 'OpenFlow Project',
  },
  {
    id: 'task-2',
    type: SearchResultType.Task,
    title: 'Fix sidebar navigation bug',
    subtitle: 'OpenFlow Project',
  },
  {
    id: 'project-1',
    type: SearchResultType.Project,
    title: 'OpenFlow',
    subtitle: '/Users/dev/openflow',
  },
  {
    id: 'chat-1',
    type: SearchResultType.Chat,
    title: 'Feature: Add dark mode toggle',
    subtitle: 'Step: Implementation',
  },
];

// Sample search results
const sampleSearchResults: SearchResult[] = [
  {
    id: 'task-1',
    resultType: SearchResultType.Task,
    title: 'Add authentication middleware',
    subtitle: 'OpenFlow Project',
    score: 0.95,
  },
  {
    id: 'task-2',
    resultType: SearchResultType.Task,
    title: 'Create auth provider component',
    subtitle: 'OpenFlow Project',
    score: 0.88,
  },
  {
    id: 'project-1',
    resultType: SearchResultType.Project,
    title: 'Auth Service',
    subtitle: '/Users/dev/auth-service',
    score: 0.75,
  },
  {
    id: 'message-1',
    resultType: SearchResultType.Message,
    title: 'Discussion about auth flow',
    subtitle: 'Task: Implement user authentication',
    score: 0.65,
  },
];

// Sample actions
const sampleActions: CommandAction[] = [
  {
    id: 'new-task',
    label: 'Create New Task',
    shortcut: '⌘N',
    icon: Plus,
    onSelect: fn(),
  },
  {
    id: 'settings',
    label: 'Open Settings',
    shortcut: '⌘,',
    icon: Settings,
    onSelect: fn(),
  },
  {
    id: 'archive',
    label: 'View Archive',
    icon: Archive,
    onSelect: fn(),
  },
  {
    id: 'new-project',
    label: 'Add New Project',
    icon: FileText,
    onSelect: fn(),
  },
  {
    id: 'branches',
    label: 'View Branches',
    icon: GitBranch,
    onSelect: fn(),
  },
];

/**
 * Default command palette with recent items and actions
 */
export const Default: Story = {
  args: {
    recentItems: sampleRecentItems,
    actions: sampleActions,
  },
};

/**
 * Command palette with search results
 */
export const WithSearchResults: Story = {
  args: {
    query: 'auth',
    searchResults: sampleSearchResults,
  },
};

/**
 * Command palette while searching (loading state)
 */
export const Searching: Story = {
  args: {
    query: 'authentication',
    isSearching: true,
    searchResults: [],
  },
};

/**
 * Command palette with no search results
 */
export const NoResults: Story = {
  args: {
    query: 'xyznonexistent',
    searchResults: [],
  },
};

/**
 * Command palette with only recent items
 */
export const RecentItemsOnly: Story = {
  args: {
    recentItems: sampleRecentItems,
    actions: [],
  },
};

/**
 * Command palette with only actions
 */
export const ActionsOnly: Story = {
  args: {
    recentItems: [],
    actions: sampleActions,
  },
};

/**
 * Empty command palette (no recent items or actions)
 */
export const Empty: Story = {
  args: {
    recentItems: [],
    actions: [],
  },
};

/**
 * Command palette with many search results (for scroll testing)
 */
export const ManyResults: Story = {
  args: {
    query: 'component',
    searchResults: [
      {
        id: 'task-1',
        resultType: SearchResultType.Task,
        title: 'Create Button component',
        subtitle: 'UI Library',
        score: 0.95,
      },
      {
        id: 'task-2',
        resultType: SearchResultType.Task,
        title: 'Create Input component',
        subtitle: 'UI Library',
        score: 0.92,
      },
      {
        id: 'task-3',
        resultType: SearchResultType.Task,
        title: 'Create Card component',
        subtitle: 'UI Library',
        score: 0.9,
      },
      {
        id: 'task-4',
        resultType: SearchResultType.Task,
        title: 'Create Dialog component',
        subtitle: 'UI Library',
        score: 0.88,
      },
      {
        id: 'task-5',
        resultType: SearchResultType.Task,
        title: 'Create Dropdown component',
        subtitle: 'UI Library',
        score: 0.85,
      },
      {
        id: 'task-6',
        resultType: SearchResultType.Task,
        title: 'Create Tabs component',
        subtitle: 'UI Library',
        score: 0.83,
      },
      {
        id: 'task-7',
        resultType: SearchResultType.Task,
        title: 'Create Tooltip component',
        subtitle: 'UI Library',
        score: 0.8,
      },
      {
        id: 'task-8',
        resultType: SearchResultType.Task,
        title: 'Create Menu component',
        subtitle: 'UI Library',
        score: 0.78,
      },
      {
        id: 'project-1',
        resultType: SearchResultType.Project,
        title: 'Component Library',
        subtitle: '/Users/dev/component-lib',
        score: 0.75,
      },
      {
        id: 'message-1',
        resultType: SearchResultType.Message,
        title: 'Discussion about component architecture',
        subtitle: 'Task: Create Button component',
        score: 0.7,
      },
      {
        id: 'message-2',
        resultType: SearchResultType.Message,
        title: 'Review of component patterns',
        subtitle: 'Task: Create Input component',
        score: 0.68,
      },
      {
        id: 'chat-1',
        resultType: SearchResultType.Chat,
        title: 'Component implementation chat',
        subtitle: 'Step: Development',
        score: 0.65,
      },
    ],
  },
};

/**
 * Command palette with custom placeholder
 */
export const CustomPlaceholder: Story = {
  args: {
    recentItems: sampleRecentItems,
    actions: sampleActions,
    placeholder: 'What would you like to do?',
  },
};

/**
 * Command palette closed (should render nothing)
 */
export const Closed: Story = {
  args: {
    isOpen: false,
    recentItems: sampleRecentItems,
    actions: sampleActions,
  },
};

/**
 * Command palette with mixed result types
 */
export const MixedResults: Story = {
  args: {
    query: 'flow',
    searchResults: [
      {
        id: 'project-1',
        resultType: SearchResultType.Project,
        title: 'OpenFlow',
        subtitle: '/Users/dev/openflow',
        score: 0.98,
      },
      {
        id: 'task-1',
        resultType: SearchResultType.Task,
        title: 'Implement workflow system',
        subtitle: 'OpenFlow Project',
        score: 0.92,
      },
      {
        id: 'task-2',
        resultType: SearchResultType.Task,
        title: 'Add workflow templates',
        subtitle: 'OpenFlow Project',
        score: 0.88,
      },
      {
        id: 'chat-1',
        resultType: SearchResultType.Chat,
        title: 'Workflow design discussion',
        subtitle: 'Step: Planning',
        score: 0.75,
      },
      {
        id: 'message-1',
        resultType: SearchResultType.Message,
        title: 'Workflow state machine implementation details',
        subtitle: 'Task: Implement workflow system',
        score: 0.7,
      },
    ],
  },
};
