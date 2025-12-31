import { ChatRole } from '@openflow/generated';
import type { Chat } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ChatCard } from './ChatCard';

const meta: Meta<typeof ChatCard> = {
  title: 'Organisms/ChatCard',
  component: ChatCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    chat: {
      control: false,
      description: 'Chat data to display',
    },
    projectName: {
      control: 'text',
      description: 'Optional project name to display',
    },
    taskTitle: {
      control: 'text',
      description: 'Optional task title (if chat is linked to a task)',
    },
    isSelected: {
      control: 'boolean',
      description: 'Whether the card is in a selected state',
    },
  },
  args: {
    onSelect: fn(),
    onMoreClick: fn(),
    onContextMenu: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatCard>;

/** Helper to create a chat with required fields */
function createChat(id: string, title: string, options?: Partial<Chat>): Chat {
  const now = new Date().toISOString();
  return {
    id,
    title,
    projectId: 'proj-1',
    chatRole: ChatRole.Main,
    baseBranch: 'main',
    worktreeDeleted: false,
    isPlanContainer: false,
    createdAt: now,
    updatedAt: now,
    ...options,
  };
}

/** Standalone chat (no task) */
const standaloneChat = createChat('chat-standalone', 'Quick coding question');

/** Task-linked chat */
const taskLinkedChat = createChat('chat-task', 'Implement user authentication', {
  taskId: 'task-1',
});

/** Completed chat with setup done */
const completedChat = createChat('chat-completed', 'Feature implementation complete', {
  taskId: 'task-2',
  setupCompletedAt: new Date().toISOString(),
});

/** Default standalone chat card */
export const Standalone: Story = {
  args: {
    chat: standaloneChat,
    projectName: 'OpenFlow App',
  },
};

/** Task-linked chat card */
export const TaskLinked: Story = {
  args: {
    chat: taskLinkedChat,
    projectName: 'OpenFlow App',
    taskTitle: 'User Auth Feature',
  },
};

/** Completed chat with setup done */
export const Completed: Story = {
  args: {
    chat: completedChat,
    projectName: 'OpenFlow App',
    taskTitle: 'Feature Development',
  },
};

/** Selected state */
export const Selected: Story = {
  args: {
    chat: standaloneChat,
    projectName: 'OpenFlow App',
    isSelected: true,
  },
};

/** Without project name */
export const WithoutProjectName: Story = {
  args: {
    chat: standaloneChat,
  },
};

/** With only project name (no task) */
export const OnlyProjectName: Story = {
  args: {
    chat: standaloneChat,
    projectName: 'Marketing Website',
  },
};

/** With only task title */
export const OnlyTaskTitle: Story = {
  args: {
    chat: taskLinkedChat,
    taskTitle: 'Bug Fix Sprint',
  },
};

/** Untitled chat (no title) */
export const Untitled: Story = {
  args: {
    chat: createChat('chat-untitled', undefined as unknown as string),
    projectName: 'OpenFlow App',
  },
};

/** Long title that should truncate */
export const LongTitle: Story = {
  args: {
    chat: createChat(
      'chat-long',
      'This is a very long chat title that should be truncated because it is too long to fit in the card header'
    ),
    projectName: 'OpenFlow App',
    taskTitle: 'Feature Development Sprint Q4 2024',
  },
};

/** Without interaction handlers (display only) */
export const DisplayOnly: Story = {
  args: {
    chat: standaloneChat,
    projectName: 'OpenFlow App',
    onSelect: undefined,
    onMoreClick: undefined,
    onContextMenu: undefined,
  },
};

/** Different chat roles */
export const ReviewRole: Story = {
  args: {
    chat: createChat('chat-review', 'Code review session', {
      taskId: 'task-1',
      chatRole: ChatRole.Review,
    }),
    projectName: 'OpenFlow App',
    taskTitle: 'Feature Implementation',
  },
};

export const TestRole: Story = {
  args: {
    chat: createChat('chat-test', 'Test development', {
      taskId: 'task-1',
      chatRole: ChatRole.Test,
    }),
    projectName: 'OpenFlow App',
    taskTitle: 'Feature Implementation',
  },
};

/** Older chat (different date format) */
export const OlderChat: Story = {
  args: {
    chat: createChat('chat-old', 'Legacy discussion', {
      createdAt: '2024-01-15T10:00:00Z',
    }),
    projectName: 'Old Project',
  },
};

/** Interactive hover state demo */
export const HoverDemo: Story = {
  args: {
    chat: standaloneChat,
    projectName: 'OpenFlow App',
  },
  parameters: {
    docs: {
      description: {
        story: 'Hover over the card to see the more options button appear.',
      },
    },
  },
};
