import { MessageRole } from '@openflow/generated';
import type { ExecutorProfile, Message } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import {
  ChatPanel,
  ChatPanelError,
  ChatPanelSkeleton,
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_RETRY_LABEL,
  DEFAULT_ERROR_TITLE,
  DEFAULT_INPUT_LABEL,
  // Constants (used in stories documentation)
  DEFAULT_MESSAGES_LABEL,
  DEFAULT_PROCESSING_LABEL,
  DEFAULT_SCROLL_LABEL,
  DEFAULT_SEND_LABEL,
  DEFAULT_SKELETON_MESSAGE_COUNT,
  DEFAULT_STOP_LABEL,
  SR_MESSAGE_SENT,
  SR_NEW_MESSAGE,
} from './ChatPanel';

const meta = {
  title: 'Organisms/ChatPanel',
  component: ChatPanel,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onSendMessage: fn(),
    onStopProcess: fn(),
    onExecutorProfileChange: fn(),
  },
  decorators: [
    (Story) => (
      <div className="h-[600px] w-full max-w-3xl border border-[rgb(var(--border))] rounded-lg overflow-hidden relative">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data for stories
const firstMessage: Message = {
  id: 'msg-1',
  chatId: 'chat-1',
  role: MessageRole.User,
  content: 'Can you help me create a new React component?',
  isStreaming: false,
  createdAt: '2024-01-15T10:00:00Z',
};

const sampleMessages: Message[] = [
  firstMessage,
  {
    id: 'msg-2',
    chatId: 'chat-1',
    role: MessageRole.Assistant,
    content:
      "Of course! I'd be happy to help you create a new React component. What kind of component would you like to create? Please describe:\n\n1. The purpose of the component\n2. What props it should accept\n3. Any specific styling or behavior requirements",
    isStreaming: false,
    model: 'claude-3-sonnet',
    tokensUsed: 85,
    createdAt: '2024-01-15T10:00:15Z',
  },
  {
    id: 'msg-3',
    chatId: 'chat-1',
    role: MessageRole.User,
    content:
      'I want to create a Card component with a header, content area, and optional footer. It should support different variants like default, outlined, and elevated.',
    isStreaming: false,
    createdAt: '2024-01-15T10:01:00Z',
  },
  {
    id: 'msg-4',
    chatId: 'chat-1',
    role: MessageRole.Assistant,
    content:
      "Great! I'll create a Card component with those specifications. Here's the implementation:\n\n```typescript\nimport { cn } from '@openflow/utils';\nimport type { ReactNode } from 'react';\n\ntype CardVariant = 'default' | 'outlined' | 'elevated';\n\ninterface CardProps {\n  variant?: CardVariant;\n  header?: ReactNode;\n  footer?: ReactNode;\n  children: ReactNode;\n}\n\nexport function Card({ variant = 'default', header, footer, children }: CardProps) {\n  return (\n    <div className={cn('rounded-lg', variantStyles[variant])}>\n      {header && <div className=\"border-b px-4 py-3\">{header}</div>}\n      <div className=\"px-4 py-3\">{children}</div>\n      {footer && <div className=\"border-t px-4 py-3\">{footer}</div>}\n    </div>\n  );\n}\n```\n\nThis component includes:\n- Three variant styles (default, outlined, elevated)\n- Optional header and footer sections\n- Flexible content area",
    isStreaming: false,
    model: 'claude-3-sonnet',
    tokensUsed: 245,
    toolCalls: JSON.stringify([
      {
        id: 'call-1',
        name: 'write_file',
        arguments: { path: 'packages/ui/molecules/Card.tsx' },
      },
    ]),
    createdAt: '2024-01-15T10:01:30Z',
  },
];

const streamingMessage: Message = {
  id: 'msg-streaming',
  chatId: 'chat-1',
  role: MessageRole.Assistant,
  content: "Let me analyze your codebase and create the component. I'll start by...",
  isStreaming: true,
  createdAt: '2024-01-15T10:02:00Z',
};

const systemMessage: Message = {
  id: 'msg-system',
  chatId: 'chat-1',
  role: MessageRole.System,
  content:
    'The assistant is configured to help with React development. All code will follow TypeScript best practices.',
  isStreaming: false,
  createdAt: '2024-01-15T09:59:00Z',
};

const sampleProfiles: ExecutorProfile[] = [
  {
    id: 'profile-1',
    name: 'Claude Code',
    command: 'claude',
    description: 'Claude Code CLI for AI-powered development',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'profile-2',
    name: 'Gemini CLI',
    command: 'gemini',
    description: 'Google Gemini CLI',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'profile-3',
    name: 'Codex CLI',
    command: 'codex',
    description: 'OpenAI Codex CLI',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// ============================================================================
// Basic Stories
// ============================================================================

/**
 * Default chat panel with a conversation
 */
export const Default: Story = {
  args: {
    messages: sampleMessages,
  },
};

/**
 * Empty chat panel with no messages
 */
export const Empty: Story = {
  args: {
    messages: [],
  },
};

/**
 * Chat panel with a streaming message in progress
 */
export const Streaming: Story = {
  args: {
    messages: [...sampleMessages.slice(0, 3), streamingMessage],
    isProcessing: true,
  },
};

/**
 * Chat panel in processing state (waiting for response)
 */
export const Processing: Story = {
  args: {
    messages: sampleMessages.slice(0, 3),
    isProcessing: true,
  },
};

/**
 * Chat panel with a single user message
 */
export const SingleMessage: Story = {
  args: {
    messages: [firstMessage],
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size variant - compact padding and spacing
 */
export const SizeSmall: Story = {
  args: {
    messages: sampleMessages.slice(0, 2),
    size: 'sm',
  },
};

/**
 * Medium size variant - default padding and spacing
 */
export const SizeMedium: Story = {
  args: {
    messages: sampleMessages.slice(0, 2),
    size: 'md',
  },
};

/**
 * Large size variant - expanded padding and spacing
 */
export const SizeLarge: Story = {
  args: {
    messages: sampleMessages.slice(0, 2),
    size: 'lg',
  },
};

/**
 * Responsive sizing - adapts to viewport
 */
export const ResponsiveSizing: Story = {
  args: {
    messages: sampleMessages.slice(0, 2),
    size: { base: 'sm', md: 'md', lg: 'lg' },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates responsive sizing that adapts to viewport width. Small on mobile, medium on tablet, large on desktop.',
      },
    },
  },
};

// ============================================================================
// Feature Variations
// ============================================================================

/**
 * Chat panel with executor profile selector
 */
export const WithExecutorSelector: Story = {
  args: {
    messages: sampleMessages.slice(0, 2),
    showExecutorSelector: true,
    executorProfiles: sampleProfiles,
    selectedExecutorProfileId: 'profile-1',
  },
};

/**
 * Chat panel with system message
 */
export const WithSystemMessage: Story = {
  args: {
    messages: [systemMessage, ...sampleMessages],
  },
};

/**
 * Chat panel with custom placeholder text
 */
export const CustomPlaceholder: Story = {
  args: {
    messages: [],
    placeholder: 'Describe your task or ask a question...',
  },
};

/**
 * Chat panel with custom empty state
 */
export const CustomEmptyState: Story = {
  args: {
    messages: [],
    emptyTitle: 'Start a conversation',
    emptyDescription: 'Type your question below to get started with AI-powered development.',
  },
};

/**
 * Chat panel showing all features together
 */
export const FullFeatured: Story = {
  args: {
    messages: [systemMessage, ...sampleMessages],
    showExecutorSelector: true,
    executorProfiles: sampleProfiles,
    selectedExecutorProfileId: 'profile-1',
    placeholder: 'Ask me anything about your code...',
  },
};

// ============================================================================
// Long Conversation (Scroll Testing)
// ============================================================================

/**
 * Chat panel with long conversation (for scroll testing)
 */
export const LongConversation: Story = {
  args: {
    messages: [
      ...sampleMessages,
      {
        id: 'msg-5',
        chatId: 'chat-1',
        role: MessageRole.User,
        content: 'Can you add some tests for the Card component?',
        isStreaming: false,
        createdAt: '2024-01-15T10:02:00Z',
      },
      {
        id: 'msg-6',
        chatId: 'chat-1',
        role: MessageRole.Assistant,
        content:
          "I'll create comprehensive tests for the Card component using Vitest and Testing Library.\n\n```typescript\nimport { render, screen } from '@testing-library/react';\nimport { Card } from './Card';\n\ndescribe('Card', () => {\n  it('renders children content', () => {\n    render(<Card>Test Content</Card>);\n    expect(screen.getByText('Test Content')).toBeInTheDocument();\n  });\n\n  it('renders header when provided', () => {\n    render(<Card header=\"Header Text\">Content</Card>);\n    expect(screen.getByText('Header Text')).toBeInTheDocument();\n  });\n});\n```",
        isStreaming: false,
        model: 'claude-3-sonnet',
        tokensUsed: 320,
        createdAt: '2024-01-15T10:02:30Z',
      },
      {
        id: 'msg-7',
        chatId: 'chat-1',
        role: MessageRole.User,
        content: 'Great! Now can you add a Storybook story for the Card?',
        isStreaming: false,
        createdAt: '2024-01-15T10:03:00Z',
      },
      {
        id: 'msg-8',
        chatId: 'chat-1',
        role: MessageRole.Assistant,
        content: "I'll create a Storybook story file with all the variants and use cases.",
        isStreaming: false,
        model: 'claude-3-sonnet',
        tokensUsed: 285,
        createdAt: '2024-01-15T10:03:30Z',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'A long conversation to test scroll behavior and the scroll-to-bottom button.',
      },
    },
  },
};

// ============================================================================
// Loading State Stories
// ============================================================================

type SkeletonStory = StoryObj<typeof ChatPanelSkeleton>;

/**
 * Loading state with skeleton
 */
export const Loading: SkeletonStory = {
  render: (args) => <ChatPanelSkeleton {...args} />,
  args: {
    messageCount: 4,
    size: 'md',
    'data-testid': 'chat-panel-skeleton',
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton that displays while chat messages are being fetched.',
      },
    },
  },
};

/**
 * Loading state with fewer messages
 */
export const LoadingFewMessages: SkeletonStory = {
  render: (args) => <ChatPanelSkeleton {...args} />,
  args: {
    messageCount: 2,
    size: 'md',
  },
};

/**
 * Loading state with small size
 */
export const LoadingSmall: SkeletonStory = {
  render: (args) => <ChatPanelSkeleton {...args} />,
  args: {
    messageCount: 3,
    size: 'sm',
  },
};

/**
 * Loading state with large size
 */
export const LoadingLarge: SkeletonStory = {
  render: (args) => <ChatPanelSkeleton {...args} />,
  args: {
    messageCount: 3,
    size: 'lg',
  },
};

/**
 * Loading state with responsive sizing
 */
export const LoadingResponsive: SkeletonStory = {
  render: (args) => <ChatPanelSkeleton {...args} />,
  args: {
    messageCount: 3,
    size: { base: 'sm', md: 'md', lg: 'lg' },
  },
};

// ============================================================================
// Error State Stories
// ============================================================================

type ErrorStory = StoryObj<typeof ChatPanelError>;

/**
 * Error state with retry option
 */
export const ErrorState: ErrorStory = {
  render: (args) => <ChatPanelError {...args} />,
  args: {
    message: 'Unable to connect to the server. Please check your connection and try again.',
    onRetry: fn(),
    'data-testid': 'chat-panel-error',
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state displayed when chat loading fails, with a retry button.',
      },
    },
  },
};

/**
 * Error state without message
 */
export const ErrorStateNoMessage: ErrorStory = {
  render: (args) => <ChatPanelError {...args} />,
  args: {
    onRetry: fn(),
  },
};

/**
 * Error state without retry
 */
export const ErrorStateNoRetry: ErrorStory = {
  render: (args) => <ChatPanelError {...args} />,
  args: {
    message: 'An unexpected error occurred.',
  },
};

/**
 * Error state with custom labels
 */
export const ErrorStateCustomLabels: ErrorStory = {
  render: (args) => <ChatPanelError {...args} />,
  args: {
    errorTitle: 'Connection Lost',
    message: 'The chat session has been disconnected.',
    retryLabel: 'Reconnect',
    onRetry: fn(),
  },
};

// ============================================================================
// Accessibility Stories
// ============================================================================

/**
 * Demonstrates keyboard navigation and focus management
 */
export const KeyboardNavigation: Story = {
  args: {
    messages: sampleMessages.slice(0, 2),
    'data-testid': 'chat-panel-keyboard',
  },
  parameters: {
    docs: {
      description: {
        story: `
Keyboard navigation support:
- **Tab**: Navigate between messages area, input, and buttons
- **Enter**: Send message (when input is focused)
- **Shift+Enter**: New line in input
- **Escape**: Can be used to close dropdowns

Focus management:
- Input automatically receives focus after sending a message
- Messages area is scrollable with keyboard (tabIndex=0)
        `,
      },
    },
  },
};

/**
 * Screen reader accessibility demo
 */
export const ScreenReaderAccessibility: Story = {
  args: {
    messages: sampleMessages,
    messagesLabel: 'Conversation history',
    inputLabel: 'Type your message here',
    sendLabel: 'Send your message',
    'data-testid': 'chat-panel-a11y',
  },
  parameters: {
    docs: {
      description: {
        story: `
Screen reader features:
- Messages area has role="log" with aria-live="polite" for new message announcements
- Input area has role="region" with descriptive label
- Send/Stop buttons have aria-labels
- Empty state is announced as a status region
- New messages are announced automatically
        `,
      },
    },
  },
};

/**
 * Focus ring visibility demo
 */
export const FocusRingVisibility: Story = {
  args: {
    messages: sampleMessages.slice(0, 1),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use Tab to navigate and verify focus rings are visible on all interactive elements.',
      },
    },
  },
};

/**
 * Touch target accessibility (44px minimum)
 */
export const TouchTargetAccessibility: Story = {
  args: {
    messages: sampleMessages.slice(0, 1),
  },
  parameters: {
    docs: {
      description: {
        story: `
Touch targets meet WCAG 2.5.5 requirements:
- Send button: 44px × 44px minimum
- Stop button: 44px × 44px minimum
- Input has 44px minimum height
        `,
      },
    },
  },
};

// ============================================================================
// Ref Forwarding and Data Attributes
// ============================================================================

/**
 * Demonstrates ref forwarding
 */
export const RefForwarding: Story = {
  args: {
    messages: sampleMessages.slice(0, 2),
  },
  parameters: {
    docs: {
      description: {
        story:
          'ChatPanel, ChatPanelSkeleton, and ChatPanelError all support ref forwarding for programmatic access.',
      },
    },
  },
};

/**
 * Data test ID support
 */
export const DataTestId: Story = {
  args: {
    messages: sampleMessages.slice(0, 2),
    'data-testid': 'my-chat-panel',
  },
  parameters: {
    docs: {
      description: {
        story: `
Data test IDs are automatically generated:
- Container: \`my-chat-panel\`
- Messages: \`my-chat-panel-message-0\`, \`my-chat-panel-message-1\`, etc.
- Empty state: \`my-chat-panel-empty\`
- Input: \`my-chat-panel-input\`
- Send button: \`my-chat-panel-send-button\`
- Stop button: \`my-chat-panel-stop-button\`
- Executor dropdown: \`my-chat-panel-executor-dropdown\`
        `,
      },
    },
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/**
 * AI coding assistant conversation
 */
export const CodingAssistant: Story = {
  args: {
    messages: sampleMessages,
    showExecutorSelector: true,
    executorProfiles: sampleProfiles,
    selectedExecutorProfileId: 'profile-1',
    placeholder: 'Describe the code you want to generate...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Typical AI coding assistant interface with executor profile selection.',
      },
    },
  },
};

/**
 * Customer support chat
 */
export const CustomerSupport: Story = {
  args: {
    messages: [
      {
        id: 'support-1',
        chatId: 'support-chat',
        role: MessageRole.System,
        content: 'You are connected to customer support.',
        isStreaming: false,
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'support-2',
        chatId: 'support-chat',
        role: MessageRole.User,
        content: "Hi, I'm having trouble with my subscription.",
        isStreaming: false,
        createdAt: '2024-01-15T10:00:30Z',
      },
      {
        id: 'support-3',
        chatId: 'support-chat',
        role: MessageRole.Assistant,
        content:
          "Hello! I'm sorry to hear you're having issues with your subscription. I'd be happy to help. Could you please tell me more about what's happening?",
        isStreaming: false,
        createdAt: '2024-01-15T10:01:00Z',
      },
    ],
    placeholder: 'Describe your issue...',
    emptyTitle: 'Welcome to Support',
    emptyDescription: 'How can we help you today? Type your question to get started.',
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Reference for all exported constants and utilities
 */
export const ConstantsReference: Story = {
  args: {
    messages: [],
  },
  parameters: {
    docs: {
      description: {
        story: `
## Exported Constants

### Default Labels
- \`DEFAULT_MESSAGES_LABEL\`: "${DEFAULT_MESSAGES_LABEL}"
- \`DEFAULT_INPUT_LABEL\`: "${DEFAULT_INPUT_LABEL}"
- \`DEFAULT_SEND_LABEL\`: "${DEFAULT_SEND_LABEL}"
- \`DEFAULT_STOP_LABEL\`: "${DEFAULT_STOP_LABEL}"
- \`DEFAULT_SCROLL_LABEL\`: "${DEFAULT_SCROLL_LABEL}"
- \`DEFAULT_EMPTY_TITLE\`: "${DEFAULT_EMPTY_TITLE}"
- \`DEFAULT_EMPTY_DESCRIPTION\`: "${DEFAULT_EMPTY_DESCRIPTION}"
- \`DEFAULT_PROCESSING_LABEL\`: "${DEFAULT_PROCESSING_LABEL}"
- \`DEFAULT_ERROR_TITLE\`: "${DEFAULT_ERROR_TITLE}"
- \`DEFAULT_ERROR_RETRY_LABEL\`: "${DEFAULT_ERROR_RETRY_LABEL}"
- \`DEFAULT_SKELETON_MESSAGE_COUNT\`: ${DEFAULT_SKELETON_MESSAGE_COUNT}

### Screen Reader Announcements
- \`SR_NEW_MESSAGE\`: "${SR_NEW_MESSAGE}"
- \`SR_MESSAGE_SENT\`: "${SR_MESSAGE_SENT}"

### Class Constants
- \`CHAT_PANEL_BASE_CLASSES\`: Base container styling
- \`CHAT_PANEL_PADDING_CLASSES\`: Size-specific padding
- \`CHAT_PANEL_GAP_CLASSES\`: Size-specific gaps
- \`MESSAGES_CONTAINER_CLASSES\`: Scrollable messages area
- \`INPUT_AREA_CONTAINER_CLASSES\`: Input section styling
- \`SKELETON_AVATAR_SIZE\`: Avatar dimensions by size
- \`ERROR_STATE_CLASSES\`: Error state layout

### Utility Functions
- \`getBaseSize(size)\`: Extract base size from ResponsiveValue
- \`getResponsiveSizeClasses(size, classMap)\`: Generate responsive classes
- \`getSkeletonAvatarDimensions(size)\`: Get avatar dimensions
- \`buildNewMessageAnnouncement(count, hasUnread)\`: Build screen reader announcement
        `,
      },
    },
  },
};
