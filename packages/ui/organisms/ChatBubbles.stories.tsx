import type { Meta, StoryObj } from '@storybook/react';
import {
  AssistantMessageBubble,
  RawOutputSection,
  StreamingResponse,
  ToolCallCard,
  type ToolInfo,
  UserMessageBubble,
} from './ChatBubbles';

const meta: Meta = {
  title: 'Organisms/ChatBubbles',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[600px] p-4 bg-[rgb(var(--background))]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

// ============================================================================
// UserMessageBubble Stories
// ============================================================================

export const UserMessage: StoryObj<typeof UserMessageBubble> = {
  render: () => (
    <UserMessageBubble
      content="Can you help me implement a login form with validation?"
      timestamp="2024-01-15T10:30:00Z"
    />
  ),
};

export const UserMessageLong: StoryObj<typeof UserMessageBubble> = {
  render: () => (
    <UserMessageBubble
      content={`I need help with several things:

1. First, can you review my authentication implementation?
2. Then, I'd like to add rate limiting to prevent brute force attacks
3. Finally, we should add proper error handling and user feedback

Please start with the authentication review.`}
      timestamp="2024-01-15T10:30:00Z"
    />
  ),
};

// ============================================================================
// AssistantMessageBubble Stories
// ============================================================================

export const AssistantMessage: StoryObj<typeof AssistantMessageBubble> = {
  render: () => (
    <AssistantMessageBubble
      content="I'll help you implement a login form. Let me start by creating the form component with proper validation."
      timestamp="2024-01-15T10:31:00Z"
    />
  ),
};

export const AssistantWithToolCalls: StoryObj<typeof AssistantMessageBubble> = {
  render: () => (
    <AssistantMessageBubble
      content="I've created the login form component. Here's what I did:"
      toolCalls={JSON.stringify([
        {
          name: 'write_file',
          arguments: { path: 'src/components/LoginForm.tsx' },
        },
      ])}
      toolResults={JSON.stringify([
        {
          result: 'File written successfully',
        },
      ])}
      timestamp="2024-01-15T10:31:00Z"
    />
  ),
};

// ============================================================================
// StreamingResponse Stories
// ============================================================================

export const Streaming: StoryObj<typeof StreamingResponse> = {
  render: () => (
    <StreamingResponse
      displayItems={[
        { type: 'text', content: 'Let me analyze your code...\n\n' },
        { type: 'text', content: 'I found the authentication file. ' },
      ]}
      isStreaming={true}
      showRawOutput={false}
      rawOutput={[]}
    />
  ),
};

export const StreamingWithRawOutput: StoryObj<typeof StreamingResponse> = {
  render: () => (
    <StreamingResponse
      displayItems={[{ type: 'text', content: 'Processing...' }]}
      isStreaming={true}
      showRawOutput={true}
      rawOutput={[
        'claude: Starting analysis...',
        'claude: Reading file src/auth.ts',
        'claude: File contents loaded',
      ]}
    />
  ),
};

export const StreamingComplete: StoryObj<typeof StreamingResponse> = {
  render: () => (
    <StreamingResponse
      displayItems={[
        { type: 'text', content: 'Analysis complete. Your authentication looks good!' },
      ]}
      isStreaming={false}
      showRawOutput={false}
      rawOutput={[]}
    />
  ),
};

// ============================================================================
// ToolCallCard Stories
// ============================================================================

const mockToolInfo: ToolInfo = {
  name: 'write_file',
  input: { path: 'src/components/Button.tsx', content: '...' },
  output: 'File written successfully',
  isError: false,
};

export const ToolCall: StoryObj<typeof ToolCallCard> = {
  render: () => <ToolCallCard tool={mockToolInfo} />,
};

export const ToolCallError: StoryObj<typeof ToolCallCard> = {
  render: () => (
    <ToolCallCard
      tool={{
        ...mockToolInfo,
        isError: true,
        output: 'Error: File not found',
      }}
    />
  ),
};

export const ToolCallInProgress: StoryObj<typeof ToolCallCard> = {
  render: () => (
    <ToolCallCard
      tool={{
        name: 'execute_command',
        input: { command: 'npm install lodash' },
        isError: false,
      }}
    />
  ),
};

// ============================================================================
// RawOutputSection Stories
// ============================================================================

export const RawOutput: StoryObj<typeof RawOutputSection> = {
  render: () => (
    <RawOutputSection
      output={[
        '> npm run build',
        '',
        'Building project...',
        'Compiled successfully in 2.3s',
        '',
        '> Done!',
      ]}
    />
  ),
};

export const RawOutputEmpty: StoryObj<typeof RawOutputSection> = {
  render: () => <RawOutputSection output={[]} />,
};
