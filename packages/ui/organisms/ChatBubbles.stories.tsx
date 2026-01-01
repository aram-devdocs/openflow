import type { Meta, StoryObj } from '@storybook/react';
import {
  ASSISTANT_AVATAR_CLASSES,
  ASSISTANT_BUBBLE_CLASSES,
  AVATAR_ICON_SIZE_CLASSES,
  // Constants
  AVATAR_SIZE_CLASSES,
  AssistantMessageBubble,
  BubbleMessageList,
  BubbleMessageListItem,
  DEFAULT_ASSISTANT_LABEL,
  DEFAULT_STREAMING_LABEL,
  DEFAULT_USER_LABEL,
  RAW_OUTPUT_CONTAINER_CLASSES,
  RawOutputSection,
  StreamingResponse,
  TIMESTAMP_CLASSES,
  TOOL_CARD_BASE_CLASSES,
  TOOL_HEADER_CLASSES,
  ToolCallCard,
  // Types
  type ToolInfo,
  USER_AVATAR_CLASSES,
  USER_BUBBLE_CLASSES,
  UserMessageBubble,
  // Utility functions
  formatTimestamp,
  formatTimestampForSR,
  getResultAnnouncement,
  getToolStatus,
  getToolStatusAnnouncement,
} from './ChatBubbles';

const meta: Meta = {
  title: 'Organisms/ChatBubbles',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[600px] max-w-full p-4 bg-[rgb(var(--background))]">
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
  name: 'User Message',
  render: () => (
    <UserMessageBubble
      content="Can you help me implement a login form with validation?"
      timestamp="2024-01-15T10:30:00Z"
      data-testid="user-message"
    />
  ),
};

export const UserMessageLong: StoryObj<typeof UserMessageBubble> = {
  name: 'User Message (Long)',
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

export const UserMessageNoTimestamp: StoryObj<typeof UserMessageBubble> = {
  name: 'User Message (No Timestamp)',
  render: () => <UserMessageBubble content="A simple message without timestamp." />,
};

export const UserMessageCustomLabel: StoryObj<typeof UserMessageBubble> = {
  name: 'User Message (Custom Label)',
  render: () => (
    <UserMessageBubble
      content="This message uses a custom user label for screen readers."
      timestamp="2024-01-15T10:30:00Z"
      userLabel="John Doe"
    />
  ),
};

// ============================================================================
// AssistantMessageBubble Stories
// ============================================================================

export const AssistantMessage: StoryObj<typeof AssistantMessageBubble> = {
  name: 'Assistant Message',
  render: () => (
    <AssistantMessageBubble
      content="I'll help you implement a login form. Let me start by creating the form component with proper validation."
      timestamp="2024-01-15T10:31:00Z"
      data-testid="assistant-message"
    />
  ),
};

export const AssistantWithToolCalls: StoryObj<typeof AssistantMessageBubble> = {
  name: 'Assistant with Tool Calls',
  render: () => (
    <AssistantMessageBubble
      content="I've created the login form component. Here's what I did:"
      toolCalls={JSON.stringify([
        {
          id: 'tool_1',
          name: 'write_file',
          input: { path: 'src/components/LoginForm.tsx', content: '// LoginForm component...' },
        },
      ])}
      toolResults={JSON.stringify([
        {
          toolUseId: 'tool_1',
          content: 'File written successfully',
        },
      ])}
      timestamp="2024-01-15T10:31:00Z"
    />
  ),
};

export const AssistantWithMultipleTools: StoryObj<typeof AssistantMessageBubble> = {
  name: 'Assistant with Multiple Tools',
  render: () => (
    <AssistantMessageBubble
      content="I've set up the authentication flow with multiple file changes:"
      toolCalls={JSON.stringify([
        {
          id: 'tool_1',
          name: 'write_file',
          input: { path: 'src/auth/login.tsx' },
        },
        {
          id: 'tool_2',
          name: 'write_file',
          input: { path: 'src/auth/register.tsx' },
        },
        {
          id: 'tool_3',
          name: 'execute_command',
          input: { command: 'npm install bcrypt' },
        },
      ])}
      toolResults={JSON.stringify([
        { toolUseId: 'tool_1', content: 'File written successfully' },
        { toolUseId: 'tool_2', content: 'File written successfully' },
        { toolUseId: 'tool_3', content: 'Package installed successfully' },
      ])}
      timestamp="2024-01-15T10:31:00Z"
    />
  ),
};

export const AssistantWithToolError: StoryObj<typeof AssistantMessageBubble> = {
  name: 'Assistant with Tool Error',
  render: () => (
    <AssistantMessageBubble
      content="I tried to update the configuration, but encountered an error:"
      toolCalls={JSON.stringify([
        {
          id: 'tool_1',
          name: 'write_file',
          input: { path: '/etc/system/config.json' },
        },
      ])}
      toolResults={JSON.stringify([
        {
          toolUseId: 'tool_1',
          content: 'Error: Permission denied. Cannot write to system directory.',
          isError: true,
        },
      ])}
      timestamp="2024-01-15T10:31:00Z"
    />
  ),
};

export const AssistantMessageCustomLabel: StoryObj<typeof AssistantMessageBubble> = {
  name: 'Assistant Message (Custom Label)',
  render: () => (
    <AssistantMessageBubble
      content="I'm Claude, your AI assistant."
      timestamp="2024-01-15T10:31:00Z"
      assistantLabel="Claude"
    />
  ),
};

// ============================================================================
// StreamingResponse Stories
// ============================================================================

export const Streaming: StoryObj<typeof StreamingResponse> = {
  name: 'Streaming Response',
  render: () => (
    <StreamingResponse
      displayItems={[
        { type: 'text', content: 'Let me analyze your code...\n\n' },
        { type: 'text', content: 'I found the authentication file. ' },
      ]}
      isStreaming={true}
      data-testid="streaming-response"
    />
  ),
};

export const StreamingWithTools: StoryObj<typeof StreamingResponse> = {
  name: 'Streaming with Tools',
  render: () => (
    <StreamingResponse
      displayItems={[
        { type: 'text', content: 'Let me check your file structure...' },
        { type: 'tool', tool: { name: 'list_files', input: { path: 'src/' } } },
      ]}
      isStreaming={true}
    />
  ),
};

export const StreamingWithRawOutput: StoryObj<typeof StreamingResponse> = {
  name: 'Streaming with Raw Output',
  render: () => (
    <StreamingResponse
      displayItems={[{ type: 'text', content: 'Processing...' }]}
      isStreaming={true}
      showRawOutput={true}
      rawOutput={[
        'claude: Starting analysis...',
        'claude: Reading file src/auth.ts',
        'claude: File contents loaded',
        'claude: Analyzing code structure...',
      ]}
    />
  ),
};

export const StreamingComplete: StoryObj<typeof StreamingResponse> = {
  name: 'Streaming Complete',
  render: () => (
    <StreamingResponse
      displayItems={[
        { type: 'text', content: 'Analysis complete. Your authentication looks good!' },
        { type: 'result', subtype: 'success' },
      ]}
      isStreaming={false}
    />
  ),
};

export const StreamingWithError: StoryObj<typeof StreamingResponse> = {
  name: 'Streaming with Error Result',
  render: () => (
    <StreamingResponse
      displayItems={[
        { type: 'text', content: 'I encountered an issue while processing your request.' },
        { type: 'result', subtype: 'error' },
      ]}
      isStreaming={false}
    />
  ),
};

export const StreamingCustomLabels: StoryObj<typeof StreamingResponse> = {
  name: 'Streaming with Custom Labels',
  render: () => (
    <StreamingResponse
      displayItems={[{ type: 'text', content: 'Working on your request...' }]}
      isStreaming={true}
      streamingLabel="Claude is processing..."
      assistantLabel="Claude"
    />
  ),
};

// ============================================================================
// ToolCallCard Stories
// ============================================================================

const mockToolComplete: ToolInfo = {
  id: 'tool_1',
  name: 'write_file',
  input: { path: 'src/components/Button.tsx', content: '// Button component code...' },
  output: 'File written successfully',
  isError: false,
};

const mockToolRunning: ToolInfo = {
  id: 'tool_2',
  name: 'execute_command',
  input: { command: 'npm install lodash' },
};

const mockToolError: ToolInfo = {
  id: 'tool_3',
  name: 'write_file',
  input: { path: '/etc/config.json' },
  output: 'Error: Permission denied. Cannot write to system directory.',
  isError: true,
};

export const ToolCallComplete: StoryObj<typeof ToolCallCard> = {
  name: 'Tool Call (Complete)',
  render: () => <ToolCallCard tool={mockToolComplete} data-testid="tool-card" />,
};

export const ToolCallRunning: StoryObj<typeof ToolCallCard> = {
  name: 'Tool Call (Running)',
  render: () => <ToolCallCard tool={mockToolRunning} />,
};

export const ToolCallError: StoryObj<typeof ToolCallCard> = {
  name: 'Tool Call (Error)',
  render: () => <ToolCallCard tool={mockToolError} />,
};

export const ToolCallInputOnly: StoryObj<typeof ToolCallCard> = {
  name: 'Tool Call (Input Only)',
  render: () => (
    <ToolCallCard
      tool={{
        id: 'tool_4',
        name: 'read_file',
        input: { path: 'package.json' },
        output: '',
      }}
    />
  ),
};

export const ToolCallCustomLabels: StoryObj<typeof ToolCallCard> = {
  name: 'Tool Call (Custom Labels)',
  render: () => (
    <ToolCallCard
      tool={mockToolComplete}
      expandLabel="View details"
      collapseLabel="Close details"
    />
  ),
};

// ============================================================================
// RawOutputSection Stories
// ============================================================================

export const RawOutput: StoryObj<typeof RawOutputSection> = {
  name: 'Raw Output',
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
      data-testid="raw-output"
    />
  ),
};

export const RawOutputCustomLabel: StoryObj<typeof RawOutputSection> = {
  name: 'Raw Output (Custom Label)',
  render: () => (
    <RawOutputSection output={['Line 1', 'Line 2', 'Line 3']} label="Terminal output" />
  ),
};

export const RawOutputSingleLine: StoryObj<typeof RawOutputSection> = {
  name: 'Raw Output (Single Line)',
  render: () => <RawOutputSection output={['Single line of output']} />,
};

export const RawOutputManyLines: StoryObj<typeof RawOutputSection> = {
  name: 'Raw Output (Many Lines)',
  render: () => (
    <RawOutputSection
      output={Array.from({ length: 50 }, (_, i) => `Log line ${i + 1}: Processing data...`)}
    />
  ),
};

// ============================================================================
// BubbleMessageList Stories
// ============================================================================

export const MessageList: StoryObj<typeof BubbleMessageList> = {
  name: 'Message List',
  render: () => (
    <BubbleMessageList aria-label="Conversation" data-testid="message-list">
      <BubbleMessageListItem>
        <UserMessageBubble
          content="Can you help me with my React app?"
          timestamp="2024-01-15T10:30:00Z"
        />
      </BubbleMessageListItem>
      <BubbleMessageListItem>
        <AssistantMessageBubble
          content="Of course! I'd be happy to help. What specific aspect of your React app would you like assistance with?"
          timestamp="2024-01-15T10:31:00Z"
        />
      </BubbleMessageListItem>
      <BubbleMessageListItem>
        <UserMessageBubble
          content="I'm having trouble with state management."
          timestamp="2024-01-15T10:32:00Z"
        />
      </BubbleMessageListItem>
      <BubbleMessageListItem>
        <AssistantMessageBubble
          content="State management is a common challenge in React. Let me help you understand your options. You could use React's built-in useState and useContext, or consider libraries like Redux, Zustand, or Jotai depending on your needs."
          timestamp="2024-01-15T10:33:00Z"
        />
      </BubbleMessageListItem>
    </BubbleMessageList>
  ),
};

export const MessageListWithStreaming: StoryObj<typeof BubbleMessageList> = {
  name: 'Message List with Streaming',
  render: () => (
    <BubbleMessageList aria-label="Conversation with active response">
      <BubbleMessageListItem>
        <UserMessageBubble
          content="Analyze my code for security vulnerabilities."
          timestamp="2024-01-15T10:30:00Z"
        />
      </BubbleMessageListItem>
      <BubbleMessageListItem>
        <StreamingResponse
          displayItems={[
            { type: 'text', content: "I'm analyzing your codebase for security issues...\n\n" },
            { type: 'tool', tool: { name: 'read_file', input: { path: 'src/auth.ts' } } },
          ]}
          isStreaming={true}
        />
      </BubbleMessageListItem>
    </BubbleMessageList>
  ),
};

// ============================================================================
// Accessibility Stories
// ============================================================================

export const AccessibilityDemo: StoryObj = {
  name: 'Accessibility Demo',
  render: () => (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4">
        <p>This demo showcases accessibility features:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            Each message uses <code>article</code> role with <code>aria-label</code>
          </li>
          <li>User/assistant differentiated for screen readers via VisuallyHidden content</li>
          <li>
            Timestamps use semantic <code>time</code> elements with <code>datetime</code>
          </li>
          <li>
            Tool cards have <code>aria-expanded</code> and <code>aria-controls</code>
          </li>
          <li>Tool status conveyed beyond color (icons + text badges)</li>
          <li>Touch targets ≥44px for interactive elements</li>
        </ul>
      </div>

      <BubbleMessageList aria-label="Accessibility demonstration">
        <BubbleMessageListItem>
          <UserMessageBubble
            content="Check my code for issues"
            timestamp="2024-01-15T10:30:00Z"
            data-testid="accessible-user-message"
          />
        </BubbleMessageListItem>
        <BubbleMessageListItem>
          <AssistantMessageBubble
            content="I found a potential issue in your authentication code."
            toolCalls={JSON.stringify([
              { id: 'tool_1', name: 'read_file', input: { path: 'src/auth.ts' } },
            ])}
            toolResults={JSON.stringify([{ toolUseId: 'tool_1', content: '// Auth code here...' }])}
            timestamp="2024-01-15T10:31:00Z"
            data-testid="accessible-assistant-message"
          />
        </BubbleMessageListItem>
      </BubbleMessageList>
    </div>
  ),
};

export const KeyboardNavigation: StoryObj = {
  name: 'Keyboard Navigation',
  render: () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p>Use Tab to navigate through interactive elements:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Tool cards are expandable via Enter/Space</li>
          <li>Raw output sections are expandable</li>
          <li>Focus rings visible on all backgrounds</li>
        </ul>
      </div>

      <div className="space-y-4">
        <ToolCallCard tool={mockToolComplete} />
        <ToolCallCard tool={mockToolRunning} />
        <ToolCallCard tool={mockToolError} />
        <RawOutputSection output={['Line 1', 'Line 2', 'Line 3']} />
      </div>
    </div>
  ),
};

export const ScreenReaderAnnouncements: StoryObj = {
  name: 'Screen Reader Announcements',
  render: () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p>Screen reader announcements include:</p>
        <ul className="list-disc list-inside mt-2">
          <li>"You said: [message]. Sent at [time]"</li>
          <li>"Assistant said: [message]. Used N tools. Sent at [time]"</li>
          <li>Tool status: "Tool [name] is running/completed/failed"</li>
          <li>Streaming: "Assistant is thinking..."</li>
        </ul>
      </div>

      <BubbleMessageList>
        <BubbleMessageListItem>
          <UserMessageBubble content="Hello!" timestamp="2024-01-15T10:30:00Z" />
        </BubbleMessageListItem>
        <BubbleMessageListItem>
          <AssistantMessageBubble
            content="Hello! How can I help you today?"
            timestamp="2024-01-15T10:31:00Z"
          />
        </BubbleMessageListItem>
      </BubbleMessageList>
    </div>
  ),
};

export const FocusRingVisibility: StoryObj = {
  name: 'Focus Ring Visibility',
  render: () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p>Focus rings are visible on all backgrounds. Tab through to test:</p>
      </div>

      <div className="space-y-4">
        <div className="bg-background p-4 rounded">
          <ToolCallCard tool={mockToolComplete} />
        </div>
        <div className="bg-muted p-4 rounded">
          <ToolCallCard tool={mockToolComplete} />
        </div>
        <div className="bg-card p-4 rounded border">
          <RawOutputSection output={['Line 1', 'Line 2']} />
        </div>
      </div>
    </div>
  ),
};

export const TouchTargetAccessibility: StoryObj = {
  name: 'Touch Target Accessibility',
  render: () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p>All interactive elements have touch targets ≥44px (WCAG 2.5.5):</p>
        <ul className="list-disc list-inside mt-2">
          <li>Tool card headers: min-h-[44px]</li>
          <li>Raw output section headers: min-h-[44px]</li>
        </ul>
      </div>

      <ToolCallCard tool={mockToolComplete} />
      <RawOutputSection output={['Terminal output line']} />
    </div>
  ),
};

// ============================================================================
// Responsive Layout Stories
// ============================================================================

export const ResponsiveLayout: StoryObj = {
  name: 'Responsive Layout',
  render: () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p>Messages adapt to screen size:</p>
        <ul className="list-disc list-inside mt-2">
          <li>User bubbles: 90% width on mobile, 80% on desktop</li>
          <li>Avatar sizes adjust on breakpoints</li>
          <li>Padding scales with screen size</li>
        </ul>
      </div>

      <BubbleMessageList>
        <BubbleMessageListItem>
          <UserMessageBubble
            content="This message will be wider on mobile (90%) and narrower on desktop (80%)."
            timestamp="2024-01-15T10:30:00Z"
          />
        </BubbleMessageListItem>
        <BubbleMessageListItem>
          <AssistantMessageBubble
            content="Assistant messages take full available width with responsive padding."
            timestamp="2024-01-15T10:31:00Z"
          />
        </BubbleMessageListItem>
      </BubbleMessageList>
    </div>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

export const RealWorldConversation: StoryObj = {
  name: 'Real-World: Conversation',
  render: () => (
    <BubbleMessageList aria-label="Code review conversation">
      <BubbleMessageListItem>
        <UserMessageBubble
          content="Can you review my React component for accessibility issues?"
          timestamp="2024-01-15T10:30:00Z"
        />
      </BubbleMessageListItem>
      <BubbleMessageListItem>
        <AssistantMessageBubble
          content="I'll analyze your component for accessibility issues. Let me read the file first."
          toolCalls={JSON.stringify([
            { id: 'read_1', name: 'read_file', input: { path: 'src/Button.tsx' } },
          ])}
          toolResults={JSON.stringify([
            {
              toolUseId: 'read_1',
              content:
                'export function Button({ onClick, label }) { return <button onClick={onClick}>{label}</button> }',
            },
          ])}
          timestamp="2024-01-15T10:31:00Z"
        />
      </BubbleMessageListItem>
      <BubbleMessageListItem>
        <AssistantMessageBubble
          content="I found a few accessibility issues:\n\n1. The button should have a `type` attribute\n2. Consider adding `aria-label` for icon-only buttons\n3. Add focus styles for keyboard navigation\n\nLet me fix these:"
          toolCalls={JSON.stringify([
            { id: 'write_1', name: 'write_file', input: { path: 'src/Button.tsx' } },
          ])}
          toolResults={JSON.stringify([
            { toolUseId: 'write_1', content: 'File updated successfully' },
          ])}
          timestamp="2024-01-15T10:32:00Z"
        />
      </BubbleMessageListItem>
      <BubbleMessageListItem>
        <UserMessageBubble
          content="Thanks! Can you also add TypeScript types?"
          timestamp="2024-01-15T10:33:00Z"
        />
      </BubbleMessageListItem>
    </BubbleMessageList>
  ),
};

export const RealWorldWithErrors: StoryObj = {
  name: 'Real-World: With Errors',
  render: () => (
    <BubbleMessageList aria-label="Build with error">
      <BubbleMessageListItem>
        <UserMessageBubble content="Deploy my app to production" timestamp="2024-01-15T10:30:00Z" />
      </BubbleMessageListItem>
      <BubbleMessageListItem>
        <AssistantMessageBubble
          content="I'll start the deployment process."
          toolCalls={JSON.stringify([
            { id: 'cmd_1', name: 'execute_command', input: { command: 'npm run build' } },
          ])}
          toolResults={JSON.stringify([
            {
              toolUseId: 'cmd_1',
              content: 'Build failed: TypeScript error in src/app.ts:42',
              isError: true,
            },
          ])}
          timestamp="2024-01-15T10:31:00Z"
        />
      </BubbleMessageListItem>
      <BubbleMessageListItem>
        <AssistantMessageBubble
          content="The build failed due to a TypeScript error. Let me check the file and fix it."
          timestamp="2024-01-15T10:32:00Z"
        />
      </BubbleMessageListItem>
    </BubbleMessageList>
  ),
};

// ============================================================================
// Constants Reference Story
// ============================================================================

export const ConstantsReference: StoryObj = {
  name: 'Constants Reference',
  render: () => (
    <div className="space-y-4 text-sm">
      <h3 className="font-semibold">Exported Constants</h3>
      <div className="bg-muted rounded p-4 font-mono text-xs overflow-auto">
        <pre>{`// Default Labels
DEFAULT_USER_LABEL = "${DEFAULT_USER_LABEL}"
DEFAULT_ASSISTANT_LABEL = "${DEFAULT_ASSISTANT_LABEL}"
DEFAULT_STREAMING_LABEL = "${DEFAULT_STREAMING_LABEL}"

// Avatar Size Classes
AVATAR_SIZE_CLASSES = ${JSON.stringify(AVATAR_SIZE_CLASSES, null, 2)}

// Avatar Icon Size Classes
AVATAR_ICON_SIZE_CLASSES = ${JSON.stringify(AVATAR_ICON_SIZE_CLASSES, null, 2)}

// Message Bubble Classes
USER_BUBBLE_CLASSES = "${USER_BUBBLE_CLASSES}"
ASSISTANT_BUBBLE_CLASSES = "${ASSISTANT_BUBBLE_CLASSES}"

// Avatar Classes
USER_AVATAR_CLASSES = "${USER_AVATAR_CLASSES}"
ASSISTANT_AVATAR_CLASSES = "${ASSISTANT_AVATAR_CLASSES}"

// Timestamp Classes
TIMESTAMP_CLASSES = "${TIMESTAMP_CLASSES}"

// Tool Card Classes
TOOL_CARD_BASE_CLASSES = "${TOOL_CARD_BASE_CLASSES}"
TOOL_HEADER_CLASSES = "${TOOL_HEADER_CLASSES}"

// Raw Output Classes
RAW_OUTPUT_CONTAINER_CLASSES = "${RAW_OUTPUT_CONTAINER_CLASSES}"`}</pre>
      </div>

      <h3 className="font-semibold mt-6">Utility Functions</h3>
      <div className="bg-muted rounded p-4 font-mono text-xs overflow-auto">
        <pre>{`// formatTimestamp(timestamp: string): string
formatTimestamp("2024-01-15T10:30:00Z") // "${formatTimestamp('2024-01-15T10:30:00Z')}"

// formatTimestampForSR(timestamp: string): string
formatTimestampForSR("2024-01-15T10:30:00Z") // "${formatTimestampForSR('2024-01-15T10:30:00Z')}"

// getToolStatus(tool: ToolInfo): 'running' | 'error' | 'complete'
getToolStatus({ name: 'test' }) // "${getToolStatus({ name: 'test' })}"
getToolStatus({ name: 'test', isError: true }) // "${getToolStatus({ name: 'test', isError: true })}"
getToolStatus({ name: 'test', output: 'done' }) // "${getToolStatus({ name: 'test', output: 'done' })}"

// getToolStatusAnnouncement(tool: ToolInfo): string
getToolStatusAnnouncement({ name: 'write_file' }) // "${getToolStatusAnnouncement({ name: 'write_file' })}"

// getResultAnnouncement(subtype: string): string
getResultAnnouncement("success") // "${getResultAnnouncement('success')}"
getResultAnnouncement("error") // "${getResultAnnouncement('error')}"

// parseToolData<T>(jsonString: string | undefined, fallback: T): T
parseToolData('{"key": "value"}', {}) // { key: "value" }
parseToolData(undefined, []) // []
parseToolData('invalid', { default: true }) // { default: true }`}</pre>
      </div>
    </div>
  ),
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

export const RefForwarding: StoryObj = {
  name: 'Ref Forwarding',
  render: () => {
    const logRef = (name: string) => (el: HTMLElement | null) => {
      if (el) console.log(`${name} ref:`, el.tagName, el.dataset);
    };

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>All components support ref forwarding. Check console for refs.</p>
        </div>

        <UserMessageBubble
          ref={logRef('UserMessageBubble')}
          content="User message with ref"
          data-testid="ref-user"
        />

        <AssistantMessageBubble
          ref={logRef('AssistantMessageBubble')}
          content="Assistant message with ref"
          data-testid="ref-assistant"
        />

        <ToolCallCard ref={logRef('ToolCallCard')} tool={mockToolComplete} data-testid="ref-tool" />

        <RawOutputSection
          ref={logRef('RawOutputSection')}
          output={['Line 1', 'Line 2']}
          data-testid="ref-raw"
        />

        <BubbleMessageList ref={logRef('BubbleMessageList')} data-testid="ref-list">
          <BubbleMessageListItem ref={logRef('BubbleMessageListItem')}>
            <UserMessageBubble content="Item in list" />
          </BubbleMessageListItem>
        </BubbleMessageList>
      </div>
    );
  },
};

export const DataAttributes: StoryObj = {
  name: 'Data Attributes',
  render: () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p>Components expose data attributes for testing and CSS:</p>
        <ul className="list-disc list-inside mt-2">
          <li>
            <code>data-testid</code> - Testing identification
          </li>
          <li>
            <code>data-sender</code> - "user" or "assistant"
          </li>
          <li>
            <code>data-streaming</code> - true/false for streaming state
          </li>
          <li>
            <code>data-tool-name</code> - Tool name for cards
          </li>
          <li>
            <code>data-tool-status</code> - running/complete/error
          </li>
          <li>
            <code>data-line-count</code> - Number of lines in raw output
          </li>
        </ul>
      </div>

      <UserMessageBubble content="data-sender='user'" data-testid="data-user" />

      <StreamingResponse
        displayItems={[{ type: 'text', content: "data-streaming='true'" }]}
        isStreaming={true}
        data-testid="data-streaming"
      />

      <ToolCallCard tool={mockToolComplete} data-testid="data-tool" />

      <RawOutputSection output={['Line 1', 'Line 2', 'Line 3']} data-testid="data-raw" />
    </div>
  ),
};
