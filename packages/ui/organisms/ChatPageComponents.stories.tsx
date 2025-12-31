import { MessageRole } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import {
  ChatContent,
  ChatEmptyState,
  ChatHeader,
  ChatInputArea,
  ChatLoadingSkeleton,
  type ChatMessageData,
  ChatMessageList,
  ChatNotFound,
  ChatPageLayout,
} from './ChatPageComponents';

const meta: Meta = {
  title: 'Organisms/ChatPageComponents',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-screen bg-[rgb(var(--background))]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

// ============================================================================
// Mock Data
// ============================================================================

const mockMessages: ChatMessageData[] = [
  {
    id: 'msg-1',
    role: MessageRole.User,
    content: 'Can you help me implement a login form with validation?',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'msg-2',
    role: MessageRole.Assistant,
    content:
      "I'll help you implement a login form. Let me start by creating the form component with proper validation.",
    createdAt: '2024-01-15T10:31:00Z',
  },
];

// ============================================================================
// ChatPageLayout Stories
// ============================================================================

export const Layout: StoryObj<typeof ChatPageLayout> = {
  render: () => (
    <ChatPageLayout
      header={
        <div className="h-14 bg-[rgb(var(--card))] border-b border-[rgb(var(--border))]">
          Header
        </div>
      }
      inputArea={
        <div className="h-20 bg-[rgb(var(--card))] border-t border-[rgb(var(--border))]">Input</div>
      }
    >
      <div className="p-4">Chat content goes here</div>
    </ChatPageLayout>
  ),
};

// ============================================================================
// ChatLoadingSkeleton Stories
// ============================================================================

export const Loading: StoryObj<typeof ChatLoadingSkeleton> = {
  render: () => <ChatLoadingSkeleton />,
};

// ============================================================================
// ChatNotFound Stories
// ============================================================================

export const NotFound: StoryObj<typeof ChatNotFound> = {
  render: () => <ChatNotFound onBack={() => console.log('Back')} />,
};

// ============================================================================
// ChatHeader Stories
// ============================================================================

export const Header: StoryObj<typeof ChatHeader> = {
  render: () => (
    <ChatHeader
      title="Authentication Implementation"
      projectName="OpenFlow"
      showRawOutput={false}
      onToggleRawOutput={() => console.log('Toggle raw')}
      onBack={() => console.log('Back')}
    />
  ),
};

export const HeaderRawMode: StoryObj<typeof ChatHeader> = {
  render: () => (
    <ChatHeader
      title="Authentication Implementation"
      projectName="OpenFlow"
      showRawOutput={true}
      onToggleRawOutput={() => console.log('Toggle raw')}
      onBack={() => console.log('Back')}
    />
  ),
};

// ============================================================================
// ChatEmptyState Stories
// ============================================================================

export const EmptyState: StoryObj<typeof ChatEmptyState> = {
  render: () => <ChatEmptyState />,
};

// ============================================================================
// ChatMessageList Stories
// ============================================================================

export const MessageList: StoryObj<typeof ChatMessageList> = {
  render: () => (
    <div className="p-4">
      <ChatMessageList
        messages={mockMessages}
        displayItems={[]}
        activeProcessId={null}
        isRunning={false}
        showRawOutput={false}
        rawOutput={[]}
      />
    </div>
  ),
};

export const MessageListStreaming: StoryObj<typeof ChatMessageList> = {
  render: () => (
    <div className="p-4">
      <ChatMessageList
        messages={mockMessages}
        displayItems={[{ type: 'text', content: 'Let me analyze your code...' }]}
        activeProcessId="proc-1"
        isRunning={true}
        showRawOutput={false}
        rawOutput={[]}
      />
    </div>
  ),
};

// ============================================================================
// ChatInputArea Stories
// ============================================================================

export const InputArea: StoryObj<typeof ChatInputArea> = {
  render: () => (
    <ChatInputArea
      inputValue=""
      isProcessing={false}
      onInputChange={(value) => console.log('Input:', value)}
      onKeyDown={() => {}}
      onSend={() => console.log('Send')}
      onStop={() => console.log('Stop')}
    />
  ),
};

export const InputAreaWithText: StoryObj<typeof ChatInputArea> = {
  render: () => (
    <ChatInputArea
      inputValue="Help me with authentication"
      isProcessing={false}
      onInputChange={(value) => console.log('Input:', value)}
      onKeyDown={() => {}}
      onSend={() => console.log('Send')}
      onStop={() => console.log('Stop')}
    />
  ),
};

export const InputAreaProcessing: StoryObj<typeof ChatInputArea> = {
  render: () => (
    <ChatInputArea
      inputValue=""
      isProcessing={true}
      onInputChange={(value) => console.log('Input:', value)}
      onKeyDown={() => {}}
      onSend={() => console.log('Send')}
      onStop={() => console.log('Stop')}
    />
  ),
};

// ============================================================================
// ChatContent Stories
// ============================================================================

export const ContentWithMessages: StoryObj<typeof ChatContent> = {
  render: () => (
    <div className="p-4">
      <ChatContent
        hasContent={true}
        isProcessing={false}
        messages={mockMessages}
        displayItems={[]}
        activeProcessId={null}
        isRunning={false}
        showRawOutput={false}
        rawOutput={[]}
      />
    </div>
  ),
};

export const ContentEmpty: StoryObj<typeof ChatContent> = {
  render: () => (
    <div className="p-4">
      <ChatContent
        hasContent={false}
        isProcessing={false}
        messages={[]}
        displayItems={[]}
        activeProcessId={null}
        isRunning={false}
        showRawOutput={false}
        rawOutput={[]}
      />
    </div>
  ),
};
