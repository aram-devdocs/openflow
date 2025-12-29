import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ChatPanel } from './ChatPanel';
import { MessageRole } from '@openflow/generated';
import type { Message, ExecutorProfile } from '@openflow/generated';

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
      <div className="h-[600px] w-full max-w-3xl border border-[rgb(var(--border))] rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample messages for stories
const sampleMessages: Message[] = [
  {
    id: 'msg-1',
    chatId: 'chat-1',
    role: MessageRole.User,
    content: 'Can you help me create a new React component?',
    isStreaming: false,
    createdAt: '2024-01-15T10:00:00Z',
  },
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
  content: 'Let me analyze your codebase and create the component. I\'ll start by...',
  isStreaming: true,
  createdAt: '2024-01-15T10:02:00Z',
};

const systemMessage: Message = {
  id: 'msg-system',
  chatId: 'chat-1',
  role: MessageRole.System,
  content: 'The assistant is configured to help with React development. All code will follow TypeScript best practices.',
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
 * Chat panel with a single user message
 */
export const SingleMessage: Story = {
  args: {
    messages: [sampleMessages[0]],
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
          "I'll create comprehensive tests for the Card component using Vitest and Testing Library.\n\n```typescript\nimport { render, screen } from '@testing-library/react';\nimport { Card } from './Card';\n\ndescribe('Card', () => {\n  it('renders children content', () => {\n    render(<Card>Test Content</Card>);\n    expect(screen.getByText('Test Content')).toBeInTheDocument();\n  });\n\n  it('renders header when provided', () => {\n    render(<Card header=\"Header Text\">Content</Card>);\n    expect(screen.getByText('Header Text')).toBeInTheDocument();\n  });\n\n  it('renders footer when provided', () => {\n    render(<Card footer=\"Footer Text\">Content</Card>);\n    expect(screen.getByText('Footer Text')).toBeInTheDocument();\n  });\n\n  it('applies outlined variant styles', () => {\n    const { container } = render(<Card variant=\"outlined\">Content</Card>);\n    expect(container.firstChild).toHaveClass('border');\n  });\n\n  it('applies elevated variant styles', () => {\n    const { container } = render(<Card variant=\"elevated\">Content</Card>);\n    expect(container.firstChild).toHaveClass('shadow-lg');\n  });\n});\n```",
        isStreaming: false,
        model: 'claude-3-sonnet',
        tokensUsed: 320,
        toolCalls: JSON.stringify([
          {
            id: 'call-2',
            name: 'write_file',
            arguments: { path: 'packages/ui/molecules/Card.test.tsx' },
          },
        ]),
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
        content:
          "I'll create a Storybook story file with all the variants and use cases.\n\n```typescript\nimport type { Meta, StoryObj } from '@storybook/react';\nimport { Card } from './Card';\n\nconst meta: Meta<typeof Card> = {\n  title: 'Molecules/Card',\n  component: Card,\n  tags: ['autodocs'],\n};\n\nexport default meta;\ntype Story = StoryObj<typeof meta>;\n\nexport const Default: Story = {\n  args: {\n    children: 'This is the card content',\n  },\n};\n\nexport const WithHeader: Story = {\n  args: {\n    header: 'Card Title',\n    children: 'This is the card content with a header',\n  },\n};\n\nexport const WithFooter: Story = {\n  args: {\n    footer: 'Card Footer',\n    children: 'This is the card content with a footer',\n  },\n};\n\nexport const Outlined: Story = {\n  args: {\n    variant: 'outlined',\n    header: 'Outlined Card',\n    children: 'This card has an outlined style',\n  },\n};\n\nexport const Elevated: Story = {\n  args: {\n    variant: 'elevated',\n    header: 'Elevated Card',\n    children: 'This card has an elevated shadow style',\n  },\n};\n```\n\nThe story file includes examples for all variants and optional sections.",
        isStreaming: false,
        model: 'claude-3-sonnet',
        tokensUsed: 285,
        createdAt: '2024-01-15T10:03:30Z',
      },
    ],
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
