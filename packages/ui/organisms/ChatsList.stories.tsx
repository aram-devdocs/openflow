import { ChatRole } from '@openflow/generated';
import type { Chat } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { type ChatFilter, ChatsList } from './ChatsList';

const meta: Meta<typeof ChatsList> = {
  title: 'Organisms/ChatsList',
  component: ChatsList,
  parameters: {
    layout: 'padded',
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
    isLoading: {
      control: 'boolean',
      description: 'Whether the list is loading',
    },
  },
  args: {
    onFilterChange: fn(),
    onSelectChat: fn(),
    onMoreClick: fn(),
    onContextMenu: fn(),
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

/** Default list with all chats */
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

/** Loading state */
export const Loading: Story = {
  args: {
    chats: [],
    isLoading: true,
  },
};

/** Empty state - no chats */
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
