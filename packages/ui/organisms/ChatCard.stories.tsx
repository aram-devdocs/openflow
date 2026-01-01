import { ChatRole } from '@openflow/generated';
import type { Chat } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { createRef, useState } from 'react';
import {
  CHAT_CARD_BADGE_SIZE_MAP,
  CHAT_CARD_FOOTER_MARGIN_CLASSES,
  CHAT_CARD_ICON_CONTAINER_CLASSES,
  CHAT_CARD_METADATA_SIZE_CLASSES,
  CHAT_CARD_SIZE_CLASSES,
  CHAT_CARD_TITLE_SIZE_CLASSES,
  ChatCard,
  DEFAULT_COMPLETED_LABEL,
  DEFAULT_MORE_OPTIONS_LABEL,
  DEFAULT_SELECTED_LABEL,
  DEFAULT_STANDALONE_LABEL,
  DEFAULT_TASK_LABEL,
  // Constants
  DEFAULT_UNTITLED_LABEL,
  buildAccessibleLabel,
  // Utility functions
  formatTimestamp,
  formatTimestampForSR,
} from './ChatCard';

const meta: Meta<typeof ChatCard> = {
  title: 'Organisms/ChatCard',
  component: ChatCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
ChatCard displays chat information with full accessibility and responsiveness support.

## Features
- **Accessibility**: Screen reader announcements, semantic time elements, ARIA labels
- **Responsiveness**: 3 size variants (sm, md, lg) with responsive breakpoint support
- **Keyboard Navigation**: Enter/Space activation via Card molecule
- **Touch Targets**: ≥44px on mobile for more button (WCAG 2.5.5)
- **Focus Management**: Visible focus rings with offset for all backgrounds

## Accessibility Highlights
- Interactive cards use role="button" with keyboard support
- Selected state announced via VisuallyHidden with aria-live
- Semantic \`<time>\` element with datetime attribute
- Badge list uses role="list" with accessible labels
- Custom aria-label prop for screen reader context
        `,
      },
    },
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
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Card size (affects padding and typography)',
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

// ============================================================================
// Basic Examples
// ============================================================================

/** Default standalone chat card */
export const Default: Story = {
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

// ============================================================================
// Size Variants
// ============================================================================

/** Small size */
export const SizeSmall: Story = {
  args: {
    chat: standaloneChat,
    projectName: 'OpenFlow App',
    size: 'sm',
  },
};

/** Medium size (default) */
export const SizeMedium: Story = {
  args: {
    chat: standaloneChat,
    projectName: 'OpenFlow App',
    size: 'md',
  },
};

/** Large size */
export const SizeLarge: Story = {
  args: {
    chat: standaloneChat,
    projectName: 'OpenFlow App',
    size: 'lg',
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  decorators: [
    () => (
      <div className="flex flex-col gap-4 w-80">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Small</p>
          <ChatCard
            chat={standaloneChat}
            projectName="OpenFlow App"
            size="sm"
            onSelect={fn()}
            onMoreClick={fn()}
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Medium (default)</p>
          <ChatCard
            chat={standaloneChat}
            projectName="OpenFlow App"
            size="md"
            onSelect={fn()}
            onMoreClick={fn()}
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Large</p>
          <ChatCard
            chat={standaloneChat}
            projectName="OpenFlow App"
            size="lg"
            onSelect={fn()}
            onMoreClick={fn()}
          />
        </div>
      </div>
    ),
  ],
};

/** Responsive sizing */
export const ResponsiveSizing: Story = {
  args: {
    chat: standaloneChat,
    projectName: 'OpenFlow App',
    size: { base: 'sm', md: 'md', lg: 'lg' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Resize the viewport to see the card change size at different breakpoints.',
      },
    },
  },
};

// ============================================================================
// Interaction States
// ============================================================================

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

/** Interactive toggle demo */
export const InteractiveToggle: Story = {
  decorators: [
    () => {
      const [selectedId, setSelectedId] = useState<string | null>(null);
      const chats = [
        createChat('chat-1', 'First Chat'),
        createChat('chat-2', 'Second Chat'),
        createChat('chat-3', 'Third Chat'),
      ];

      return (
        <div className="flex flex-col gap-2 w-80">
          <p className="text-xs text-muted-foreground mb-2">Click to select a chat:</p>
          {chats.map((chat) => (
            <ChatCard
              key={chat.id}
              chat={chat}
              projectName="Demo Project"
              isSelected={selectedId === chat.id}
              onSelect={(id) => setSelectedId(id)}
              onMoreClick={fn()}
            />
          ))}
          <p className="text-xs text-muted-foreground mt-2">Selected: {selectedId || 'None'}</p>
        </div>
      );
    },
  ],
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/** Focus ring visibility */
export const FocusRingVisibility: Story = {
  args: {
    chat: standaloneChat,
    projectName: 'OpenFlow App',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tab to focus the card to see the focus ring. The more button also has a visible focus ring with offset.',
      },
    },
  },
};

/** Touch target accessibility */
export const TouchTargetAccessibility: Story = {
  args: {
    chat: standaloneChat,
    projectName: 'OpenFlow App',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'On mobile, the more button has a minimum 44x44px touch target for WCAG 2.5.5 compliance.',
      },
    },
  },
};

/** Screen reader accessibility */
export const ScreenReaderAccessibility: Story = {
  args: {
    chat: completedChat,
    projectName: 'OpenFlow App',
    taskTitle: 'Feature Development',
    isSelected: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Screen reader experience:
- Card has aria-label with full context
- Selected state announced via aria-live region
- Badges have aria-labels (e.g., "Type: Task", "Status: Completed")
- Time element has accessible datetime and aria-label
        `,
      },
    },
  },
};

/** Keyboard navigation */
export const KeyboardNavigation: Story = {
  decorators: [
    () => {
      const [selectedId, setSelectedId] = useState<string | null>(null);
      const chats = [
        createChat('chat-1', 'Press Tab to navigate'),
        createChat('chat-2', 'Press Enter or Space to select'),
        createChat('chat-3', 'More button is also keyboard accessible'),
      ];

      return (
        <div className="flex flex-col gap-2 w-80">
          <p className="text-xs text-muted-foreground mb-2">Use keyboard to navigate:</p>
          {chats.map((chat) => (
            <ChatCard
              key={chat.id}
              chat={chat}
              projectName="Demo"
              isSelected={selectedId === chat.id}
              onSelect={(id) => setSelectedId(id)}
              onMoreClick={fn()}
            />
          ))}
        </div>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Tab to navigate between cards. Press Enter or Space to select a card.',
      },
    },
  },
};

/** Custom aria-label */
export const CustomAriaLabel: Story = {
  args: {
    chat: standaloneChat,
    projectName: 'OpenFlow App',
    'aria-label': 'Custom accessible label for this chat card',
  },
  parameters: {
    docs: {
      description: {
        story:
          'You can provide a custom aria-label to override the automatically built accessible label.',
      },
    },
  },
};

// ============================================================================
// Chat Roles
// ============================================================================

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

// ============================================================================
// Date Variants
// ============================================================================

/** Older chat (different date format) */
export const OlderChat: Story = {
  args: {
    chat: createChat('chat-old', 'Legacy discussion', {
      createdAt: '2024-01-15T10:00:00Z',
    }),
    projectName: 'Old Project',
  },
};

// ============================================================================
// Ref Forwarding and Data Attributes
// ============================================================================

/** Ref forwarding demo */
export const RefForwarding: Story = {
  decorators: [
    () => {
      const ref = createRef<HTMLDivElement>();
      const handleFocus = () => {
        ref.current?.focus();
      };

      return (
        <div className="flex flex-col gap-4 w-80">
          <button
            type="button"
            onClick={handleFocus}
            className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded"
          >
            Focus the chat card
          </button>
          <ChatCard ref={ref} chat={standaloneChat} projectName="OpenFlow App" onSelect={fn()} />
        </div>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'ChatCard uses forwardRef for programmatic focus management.',
      },
    },
  },
};

/** Data-testid support */
export const DataTestId: Story = {
  args: {
    chat: standaloneChat,
    projectName: 'OpenFlow App',
    'data-testid': 'chat-card-demo',
  },
  parameters: {
    docs: {
      description: {
        story: `
Data attributes added:
- data-testid="chat-card-demo" on card
- data-testid="chat-card-demo-content" on content
- data-testid="chat-card-demo-more-button" on more button
- data-chat-id="chat-standalone" for identification
- data-standalone="true" for standalone chats
- data-completed="true" for completed chats
        `,
      },
    },
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** Chat list example */
export const ChatListExample: Story = {
  decorators: [
    () => {
      const [selectedId, setSelectedId] = useState<string | null>('chat-2');
      const chats = [
        createChat('chat-1', 'Quick question about API'),
        { ...createChat('chat-2', 'Implementing auth flow'), taskId: 'task-1' },
        {
          ...createChat('chat-3', 'Feature complete'),
          taskId: 'task-2',
          setupCompletedAt: new Date().toISOString(),
        },
        createChat('chat-4', 'Bug investigation'),
      ];

      return (
        <div className="flex flex-col gap-2 w-96" role="list" aria-label="Chat list">
          {chats.map((chat) => (
            <div key={chat.id} role="listitem">
              <ChatCard
                chat={chat}
                projectName="OpenFlow App"
                taskTitle={chat.taskId ? 'Active Task' : undefined}
                isSelected={selectedId === chat.id}
                onSelect={setSelectedId}
                onMoreClick={fn()}
                onContextMenu={fn()}
              />
            </div>
          ))}
        </div>
      );
    },
  ],
};

/** Mobile view */
export const MobileView: Story = {
  args: {
    chat: taskLinkedChat,
    projectName: 'OpenFlow App',
    taskTitle: 'User Auth Feature',
    size: 'sm',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Mobile-optimized view with smaller padding and touch-friendly more button.',
      },
    },
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/** Constants reference */
export const ConstantsReference: Story = {
  decorators: [
    () => (
      <div className="p-4 space-y-4 max-w-2xl text-sm">
        <h3 className="font-bold text-lg">ChatCard Exported Constants</h3>

        <div>
          <h4 className="font-semibold mb-2">Default Labels</h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>DEFAULT_UNTITLED_LABEL: "{DEFAULT_UNTITLED_LABEL}"</li>
            <li>DEFAULT_STANDALONE_LABEL: "{DEFAULT_STANDALONE_LABEL}"</li>
            <li>DEFAULT_TASK_LABEL: "{DEFAULT_TASK_LABEL}"</li>
            <li>DEFAULT_COMPLETED_LABEL: "{DEFAULT_COMPLETED_LABEL}"</li>
            <li>DEFAULT_MORE_OPTIONS_LABEL: "{DEFAULT_MORE_OPTIONS_LABEL}"</li>
            <li>DEFAULT_SELECTED_LABEL: "{DEFAULT_SELECTED_LABEL}"</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Size Classes</h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>CHAT_CARD_SIZE_CLASSES: {JSON.stringify(CHAT_CARD_SIZE_CLASSES)}</li>
            <li>
              CHAT_CARD_ICON_CONTAINER_CLASSES: {JSON.stringify(CHAT_CARD_ICON_CONTAINER_CLASSES)}
            </li>
            <li>CHAT_CARD_TITLE_SIZE_CLASSES: {JSON.stringify(CHAT_CARD_TITLE_SIZE_CLASSES)}</li>
            <li>
              CHAT_CARD_METADATA_SIZE_CLASSES: {JSON.stringify(CHAT_CARD_METADATA_SIZE_CLASSES)}
            </li>
            <li>
              CHAT_CARD_FOOTER_MARGIN_CLASSES: {JSON.stringify(CHAT_CARD_FOOTER_MARGIN_CLASSES)}
            </li>
            <li>CHAT_CARD_BADGE_SIZE_MAP: {JSON.stringify(CHAT_CARD_BADGE_SIZE_MAP)}</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Utility Functions</h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>getBaseSize(size) - Extract base size from ResponsiveValue</li>
            <li>getResponsiveSizeClasses(size, classMap) - Generate responsive classes</li>
            <li>formatTimestamp(dateString) - Format date for display</li>
            <li>formatTimestampForSR(dateString) - Verbose date for screen readers</li>
            <li>buildAccessibleLabel(title, project, task, standalone, completed)</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Example: buildAccessibleLabel</h4>
          <code className="block bg-muted p-2 rounded text-xs">
            {buildAccessibleLabel('My Chat', 'Project', 'Task', false, true)}
          </code>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Example: formatTimestamp</h4>
          <code className="block bg-muted p-2 rounded text-xs">
            Display: {formatTimestamp('2024-06-15T10:30:00Z')}
            <br />
            Screen Reader: {formatTimestampForSR('2024-06-15T10:30:00Z')}
          </code>
        </div>
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Reference for all exported constants and utility functions.',
      },
    },
  },
};
