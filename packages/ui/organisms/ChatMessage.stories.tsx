import type { Message } from '@openflow/generated';
import { MessageRole } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import {
  AVATAR_SIZE_CLASSES,
  CONTENT_GAP_CLASSES,
  ChatMessage,
  DEFAULT_ASSISTANT_LABEL,
  DEFAULT_STREAMING_LABEL,
  DEFAULT_SYSTEM_LABEL,
  DEFAULT_THINKING_LABEL,
  DEFAULT_TOOL_CALLS_LABEL,
  // Constants - used in ConstantsReference story
  DEFAULT_USER_LABEL,
  MESSAGE_PADDING_CLASSES,
  ROLE_CONFIG,
  SR_ASSISTANT_SAID,
  SR_STREAMING,
  SR_SYSTEM_SAID,
  SR_TOOL_CALLS,
  SR_USER_SAID,
  TEXT_SIZE_CLASSES,
} from './ChatMessage';

const meta: Meta<typeof ChatMessage> = {
  title: 'Organisms/ChatMessage',
  component: ChatMessage,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
ChatMessage displays a single message in a chat conversation with full accessibility support.

## Features
- Role-based styling (user, assistant, system)
- Semantic article structure for messages
- Timestamps with accessible time elements
- Tool calls with list semantics
- Streaming state with aria-live announcements
- Responsive sizing (sm, md, lg)
- Custom labels for internationalization

## Accessibility
- Uses semantic \`<article>\` element for each message
- Role-based ARIA labels for screen readers
- Timestamps use \`<time>\` with datetime attribute
- Tool calls use proper list semantics
- Streaming state announced via aria-live region
- Focus visible on all interactive elements

## Usage
\`\`\`tsx
<ChatMessage message={message} />
<ChatMessage message={message} isStreaming size="lg" />
<ChatMessage message={message} userLabel="Me" assistantLabel="AI" />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isStreaming: {
      control: 'boolean',
      description: 'Whether the message is currently streaming',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant for the message',
    },
    userLabel: {
      control: 'text',
      description: 'Custom label for user role',
    },
    assistantLabel: {
      control: 'text',
      description: 'Custom label for assistant role',
    },
    systemLabel: {
      control: 'text',
      description: 'Custom label for system role',
    },
    streamingLabel: {
      control: 'text',
      description: 'Custom label for streaming state',
    },
    thinkingLabel: {
      control: 'text',
      description: 'Custom label for thinking state',
    },
    toolCallsLabel: {
      control: 'text',
      description: 'Custom label for tool calls section',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatMessage>;

// ============================================================================
// Helper Functions
// ============================================================================

/** Helper to create a message */
function createMessage(
  role: MessageRole,
  content: string,
  overrides: Partial<Message> = {}
): Message {
  return {
    id: `msg-${Math.random().toString(36).slice(2)}`,
    chatId: 'chat-1',
    role,
    content,
    isStreaming: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// Basic Examples
// ============================================================================

/**
 * Default user message
 */
export const UserMessage: Story = {
  args: {
    message: createMessage(
      MessageRole.User,
      'Can you help me refactor this React component to use hooks instead of class components?'
    ),
  },
};

/**
 * Default assistant message
 */
export const AssistantMessage: Story = {
  args: {
    message: createMessage(
      MessageRole.Assistant,
      `I'll help you refactor your React component from a class-based implementation to use hooks. Here's the updated version:

\`\`\`typescript
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
\`\`\`

The key changes are:
1. Replaced \`class\` with a function component
2. Used \`useState\` hook instead of \`this.state\`
3. Removed the constructor and lifecycle methods`,
      {
        model: 'claude-3-opus',
        tokensUsed: 256,
      }
    ),
  },
};

/**
 * System message
 */
export const SystemMessage: Story = {
  args: {
    message: createMessage(
      MessageRole.System,
      'You are a helpful coding assistant. Follow best practices and provide clear explanations.'
    ),
  },
};

// ============================================================================
// Streaming States
// ============================================================================

/**
 * Message that is currently streaming
 */
export const StreamingMessage: Story = {
  args: {
    message: createMessage(MessageRole.Assistant, 'Analyzing the codebase...', {
      isStreaming: true,
    }),
    isStreaming: true,
  },
};

/**
 * Empty streaming message (just started thinking)
 */
export const StreamingEmpty: Story = {
  args: {
    message: createMessage(MessageRole.Assistant, '', {
      isStreaming: true,
    }),
    isStreaming: true,
  },
};

/**
 * Custom streaming labels
 */
export const CustomStreamingLabels: Story = {
  args: {
    message: createMessage(MessageRole.Assistant, '', {
      isStreaming: true,
    }),
    isStreaming: true,
    streamingLabel: 'Processing...',
    thinkingLabel: 'AI is working...',
  },
};

// ============================================================================
// Tool Calls
// ============================================================================

/**
 * Message with a single tool call
 */
export const WithToolCalls: Story = {
  args: {
    message: createMessage(
      MessageRole.Assistant,
      "I'll read the file to understand its structure.",
      {
        toolCalls: JSON.stringify([
          {
            id: 'call-1',
            name: 'read_file',
            arguments: {
              path: 'src/components/Counter.tsx',
            },
          },
        ]),
        model: 'claude-3-sonnet',
      }
    ),
  },
};

/**
 * Message with multiple tool calls
 */
export const WithMultipleToolCalls: Story = {
  args: {
    message: createMessage(
      MessageRole.Assistant,
      'Let me search for and read the relevant files.',
      {
        toolCalls: JSON.stringify([
          {
            id: 'call-1',
            name: 'search_files',
            arguments: {
              pattern: '*.tsx',
              directory: 'src/components',
            },
          },
          {
            id: 'call-2',
            name: 'read_file',
            arguments: {
              path: 'src/components/Button.tsx',
            },
          },
          {
            id: 'call-3',
            name: 'write_file',
            arguments: {
              path: 'src/components/Button.tsx',
              content: '// Updated content...',
            },
          },
        ]),
        model: 'claude-3-opus',
        tokensUsed: 512,
      }
    ),
  },
};

/**
 * Custom tool calls label
 */
export const CustomToolCallsLabel: Story = {
  args: {
    message: createMessage(MessageRole.Assistant, 'Running some tools...', {
      toolCalls: JSON.stringify([
        { id: 'call-1', name: 'execute_command', arguments: { command: 'npm test' } },
      ]),
    }),
    toolCallsLabel: 'Actions',
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size variant
 */
export const SizeSmall: Story = {
  args: {
    message: createMessage(MessageRole.User, 'This is a small message'),
    size: 'sm',
  },
};

/**
 * Medium size variant (default)
 */
export const SizeMedium: Story = {
  args: {
    message: createMessage(MessageRole.User, 'This is a medium message'),
    size: 'md',
  },
};

/**
 * Large size variant
 */
export const SizeLarge: Story = {
  args: {
    message: createMessage(MessageRole.User, 'This is a large message'),
    size: 'lg',
  },
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <ChatMessage message={createMessage(MessageRole.User, 'Small size message')} size="sm" />
      <ChatMessage
        message={createMessage(MessageRole.User, 'Medium size message (default)')}
        size="md"
      />
      <ChatMessage message={createMessage(MessageRole.User, 'Large size message')} size="lg" />
    </div>
  ),
};

/**
 * Responsive sizing
 */
export const ResponsiveSizing: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Resize the viewport to see the message size change: base=sm, md=md, lg=lg
      </p>
      <ChatMessage
        message={createMessage(
          MessageRole.User,
          'This message changes size based on viewport width'
        )}
        size={{ base: 'sm', md: 'md', lg: 'lg' }}
      />
    </div>
  ),
};

// ============================================================================
// Custom Labels
// ============================================================================

/**
 * Custom role labels for internationalization
 */
export const CustomLabels: Story = {
  render: () => (
    <div className="space-y-4">
      <ChatMessage
        message={createMessage(MessageRole.User, 'Hola, necesito ayuda')}
        userLabel="Tú"
      />
      <ChatMessage
        message={createMessage(MessageRole.Assistant, 'Por supuesto, ¿en qué puedo ayudarte?')}
        assistantLabel="Asistente IA"
      />
      <ChatMessage
        message={createMessage(MessageRole.System, 'Eres un asistente útil')}
        systemLabel="Sistema"
      />
    </div>
  ),
};

// ============================================================================
// Long Content
// ============================================================================

/**
 * Long message content
 */
export const LongContent: Story = {
  args: {
    message: createMessage(
      MessageRole.Assistant,
      `# Comprehensive Code Review

## Overview

After reviewing your codebase, I've identified several areas for improvement. Let me walk you through each one in detail.

## 1. Component Structure

Your components are well-organized, but there are a few patterns that could be improved:

- **Prop drilling**: Consider using React Context or a state management library for deeply nested props
- **Large components**: Some components have grown too large and should be split into smaller, focused components
- **Missing error boundaries**: Add error boundaries to catch and handle component errors gracefully

## 2. Performance Optimizations

\`\`\`typescript
// Before: Re-renders on every parent update
function ExpensiveList({ items }) {
  return items.map(item => <ExpensiveItem key={item.id} item={item} />);
}

// After: Only re-renders when items change
const ExpensiveList = memo(function ExpensiveList({ items }) {
  return items.map(item => <ExpensiveItem key={item.id} item={item} />);
});
\`\`\`

## 3. Type Safety

I noticed some areas where TypeScript types could be more strict:

- Use \`unknown\` instead of \`any\` where possible
- Add proper return types to all functions
- Consider using discriminated unions for complex state

## Conclusion

Overall, the codebase is in good shape. Implementing these suggestions will improve maintainability and performance.`
    ),
  },
};

// ============================================================================
// Conversation Flow
// ============================================================================

/**
 * All message roles displayed together
 */
export const AllRoles: Story = {
  render: () => (
    <div className="space-y-4">
      <ChatMessage
        message={createMessage(
          MessageRole.System,
          'You are a helpful coding assistant specialized in TypeScript and React.'
        )}
      />
      <ChatMessage
        message={createMessage(
          MessageRole.User,
          'How do I create a custom hook for fetching data?'
        )}
      />
      <ChatMessage
        message={createMessage(
          MessageRole.Assistant,
          `Here's a custom hook for data fetching:

\`\`\`typescript
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}
\`\`\``,
          {
            model: 'claude-3-sonnet',
            tokensUsed: 189,
          }
        )}
      />
    </div>
  ),
};

/**
 * Conversation flow example with tool calls and streaming
 */
export const ConversationFlow: Story = {
  render: () => (
    <div className="space-y-4">
      <ChatMessage
        message={createMessage(
          MessageRole.User,
          'I need to add dark mode support to my app. Where should I start?'
        )}
      />
      <ChatMessage
        message={createMessage(
          MessageRole.Assistant,
          "I'll help you implement dark mode. Let me first check your current styling setup.",
          {
            toolCalls: JSON.stringify([
              {
                id: 'call-1',
                name: 'read_file',
                arguments: { path: 'tailwind.config.js' },
              },
            ]),
          }
        )}
      />
      <ChatMessage
        message={createMessage(
          MessageRole.Assistant,
          `Based on your Tailwind config, here's my recommendation:

1. Enable dark mode in your Tailwind config:
   \`\`\`js
   darkMode: 'class'
   \`\`\`

2. Add a theme toggle component
3. Use CSS variables for dynamic colors
4. Persist the preference in localStorage`,
          {
            model: 'claude-3-opus',
            tokensUsed: 342,
          }
        )}
      />
      <ChatMessage
        message={createMessage(MessageRole.User, 'Can you implement the theme toggle?')}
      />
      <ChatMessage
        message={createMessage(MessageRole.Assistant, '', { isStreaming: true })}
        isStreaming
      />
    </div>
  ),
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Screen reader accessibility demo
 */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <h3 className="mb-2 font-medium">Screen Reader Features</h3>
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>Each message is an article with aria-label describing the content</li>
          <li>Timestamps have verbose aria-label (e.g., "Monday, January 15, 2024 at 3:30 PM")</li>
          <li>Tool calls section announces count (e.g., "Tool Calls, 3 tools used")</li>
          <li>Streaming state uses aria-live="polite" for announcements</li>
          <li>Avatars are decorative (aria-hidden="true")</li>
        </ul>
      </div>
      <div className="space-y-4">
        <ChatMessage
          message={createMessage(MessageRole.User, 'How do I test accessibility?')}
          data-testid="user-message"
        />
        <ChatMessage
          message={createMessage(
            MessageRole.Assistant,
            'I can help with accessibility testing. Let me check your test setup.',
            {
              toolCalls: JSON.stringify([
                { id: 'call-1', name: 'read_file', arguments: { path: 'vitest.config.ts' } },
                { id: 'call-2', name: 'search_files', arguments: { pattern: '*.test.ts' } },
              ]),
              model: 'claude-3-sonnet',
            }
          )}
          data-testid="assistant-message"
        />
        <ChatMessage
          message={createMessage(MessageRole.Assistant, 'Analyzing your tests...', {
            isStreaming: true,
          })}
          isStreaming
          data-testid="streaming-message"
        />
      </div>
    </div>
  ),
};

/**
 * Keyboard navigation demo
 */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
        <h3 className="mb-2 font-medium">Keyboard Navigation</h3>
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>Tab through messages as articles</li>
          <li>Focus ring visible on focused elements</li>
          <li>Semantic structure allows screen reader navigation (h1, article, section)</li>
        </ul>
      </div>
      <div className="space-y-4">
        <ChatMessage message={createMessage(MessageRole.User, 'First message - tab to navigate')} />
        <ChatMessage
          message={createMessage(MessageRole.Assistant, 'Second message - continue tabbing')}
        />
        <ChatMessage
          message={createMessage(MessageRole.User, 'Third message - semantic structure')}
        />
      </div>
    </div>
  ),
};

/**
 * Focus ring visibility demo
 */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
        <h3 className="mb-2 font-medium">Focus Ring Visibility</h3>
        <p className="text-sm">
          Use Tab key to focus on messages. Focus rings use ring-offset for visibility on all
          backgrounds.
        </p>
      </div>
      <div className="space-y-4" style={{ backgroundColor: 'var(--background)' }}>
        <ChatMessage message={createMessage(MessageRole.User, 'Focus me with Tab key')} />
        <ChatMessage
          message={createMessage(MessageRole.Assistant, 'Focus ring visible on all backgrounds')}
        />
      </div>
    </div>
  ),
};

/**
 * Reduced motion support
 */
export const ReducedMotion: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4">
        <h3 className="mb-2 font-medium">Reduced Motion Support</h3>
        <p className="text-sm">
          The "Thinking..." text animation uses motion-safe: prefix. Users with
          prefers-reduced-motion will see static text instead of the pulse animation.
        </p>
      </div>
      <ChatMessage
        message={createMessage(MessageRole.Assistant, '', {
          isStreaming: true,
        })}
        isStreaming
      />
    </div>
  ),
};

// ============================================================================
// Ref Forwarding and Data Attributes
// ============================================================================

/**
 * Ref forwarding example
 */
export const RefForwarding: Story = {
  render: () => {
    const handleClick = () => {
      const element = document.querySelector('[data-testid="ref-message"]');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (element as HTMLElement).focus();
      }
    };

    return (
      <div className="space-y-4">
        <button
          onClick={handleClick}
          className="rounded bg-primary px-4 py-2 text-primary-foreground"
        >
          Focus and scroll to message
        </button>
        <div className="h-32" />
        <ChatMessage
          message={createMessage(MessageRole.User, 'This message has a ref forwarded')}
          data-testid="ref-message"
        />
        <div className="h-32" />
      </div>
    );
  },
};

/**
 * Data attributes demo
 */
export const DataAttributes: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4">
        <h3 className="mb-2 font-medium">Data Attributes</h3>
        <p className="text-sm">Inspect the messages to see:</p>
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>data-testid - For automated testing</li>
          <li>data-message-id - Message unique ID</li>
          <li>data-role - user | assistant | system</li>
          <li>data-streaming - Present when streaming</li>
          <li>data-tool-name - On tool call items</li>
        </ul>
      </div>
      <ChatMessage
        message={createMessage(MessageRole.User, 'Inspect this message')}
        data-testid="test-user-message"
      />
      <ChatMessage
        message={createMessage(MessageRole.Assistant, 'Check the tool call items', {
          toolCalls: JSON.stringify([{ id: 'call-1', name: 'inspect_element', arguments: {} }]),
        })}
        data-testid="test-assistant-message"
      />
    </div>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

/**
 * Code review conversation
 */
export const CodeReviewConversation: Story = {
  render: () => (
    <div className="space-y-4 max-w-3xl">
      <ChatMessage
        message={createMessage(
          MessageRole.System,
          'You are a senior software engineer conducting a code review. Be thorough but constructive.'
        )}
      />
      <ChatMessage
        message={createMessage(
          MessageRole.User,
          'Please review this pull request: #123 - Add user authentication'
        )}
      />
      <ChatMessage
        message={createMessage(MessageRole.Assistant, "I'll analyze the pull request changes.", {
          toolCalls: JSON.stringify([
            { id: 'call-1', name: 'gh_pr_diff', arguments: { pr_number: 123 } },
            { id: 'call-2', name: 'read_file', arguments: { path: 'src/auth/login.ts' } },
          ]),
        })}
      />
      <ChatMessage
        message={createMessage(
          MessageRole.Assistant,
          `## Code Review Summary

### Overall: Approved with minor changes

**Strengths:**
- Clean separation of concerns
- Good error handling
- Comprehensive test coverage

**Suggestions:**
1. Consider using \`bcrypt\` instead of \`crypto\` for password hashing
2. Add rate limiting to the login endpoint
3. Consider extracting the JWT config to environment variables

\`\`\`typescript
// Recommended change
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET must be defined');
}
\`\`\``,
          {
            model: 'claude-3-opus',
            tokensUsed: 487,
          }
        )}
      />
    </div>
  ),
};

/**
 * Debugging session example
 */
export const DebuggingSession: Story = {
  render: () => (
    <div className="space-y-4 max-w-3xl">
      <ChatMessage
        message={createMessage(
          MessageRole.User,
          "I'm getting a \"TypeError: Cannot read property 'map' of undefined\" error. Can you help?"
        )}
      />
      <ChatMessage
        message={createMessage(
          MessageRole.Assistant,
          "I'll help you debug this. Let me find where this error is occurring.",
          {
            toolCalls: JSON.stringify([
              {
                id: 'call-1',
                name: 'search_files',
                arguments: { pattern: '*.tsx', query: '.map(' },
              },
            ]),
          }
        )}
      />
      <ChatMessage
        message={createMessage(
          MessageRole.Assistant,
          `Found the issue! In \`UserList.tsx\`, you're calling \`.map()\` on \`users\` without checking if it exists.

**Problem:**
\`\`\`tsx
// Line 15
{users.map(user => <UserCard key={user.id} user={user} />)}
\`\`\`

**Fix:**
\`\`\`tsx
// Add optional chaining or nullish check
{users?.map(user => <UserCard key={user.id} user={user} />)}

// Or with a fallback
{(users ?? []).map(user => <UserCard key={user.id} user={user} />)}
\`\`\`

This happens because \`users\` is \`undefined\` before the API response returns. The optional chaining ensures we don't call \`.map()\` on undefined.`,
          {
            model: 'claude-3-sonnet',
            tokensUsed: 312,
          }
        )}
      />
    </div>
  ),
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Constants reference for developers
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-lg font-semibold">Exported Constants Reference</h2>

      <div className="space-y-4">
        <section>
          <h3 className="font-medium mb-2">Default Labels</h3>
          <pre className="rounded bg-muted p-4 text-xs overflow-x-auto">
            {`DEFAULT_USER_LABEL = "${DEFAULT_USER_LABEL}"
DEFAULT_ASSISTANT_LABEL = "${DEFAULT_ASSISTANT_LABEL}"
DEFAULT_SYSTEM_LABEL = "${DEFAULT_SYSTEM_LABEL}"
DEFAULT_STREAMING_LABEL = "${DEFAULT_STREAMING_LABEL}"
DEFAULT_THINKING_LABEL = "${DEFAULT_THINKING_LABEL}"
DEFAULT_TOOL_CALLS_LABEL = "${DEFAULT_TOOL_CALLS_LABEL}"`}
          </pre>
        </section>

        <section>
          <h3 className="font-medium mb-2">Screen Reader Announcements</h3>
          <pre className="rounded bg-muted p-4 text-xs overflow-x-auto">
            {`SR_USER_SAID = "${SR_USER_SAID}"
SR_ASSISTANT_SAID = "${SR_ASSISTANT_SAID}"
SR_SYSTEM_SAID = "${SR_SYSTEM_SAID}"
SR_STREAMING = "${SR_STREAMING}"
SR_TOOL_CALLS = "${SR_TOOL_CALLS}"`}
          </pre>
        </section>

        <section>
          <h3 className="font-medium mb-2">Role Configuration</h3>
          <pre className="rounded bg-muted p-4 text-xs overflow-x-auto">
            {`ROLE_CONFIG = ${JSON.stringify(
              Object.fromEntries(
                Object.entries(ROLE_CONFIG).map(([k, v]) => [
                  k,
                  { label: v.label, srPrefix: v.srPrefix, icon: 'Icon' },
                ])
              ),
              null,
              2
            )}`}
          </pre>
        </section>

        <section>
          <h3 className="font-medium mb-2">Size Classes</h3>
          <pre className="rounded bg-muted p-4 text-xs overflow-x-auto">
            {`MESSAGE_PADDING_CLASSES = ${JSON.stringify(MESSAGE_PADDING_CLASSES, null, 2)}

AVATAR_SIZE_CLASSES = ${JSON.stringify(AVATAR_SIZE_CLASSES, null, 2)}

CONTENT_GAP_CLASSES = ${JSON.stringify(CONTENT_GAP_CLASSES, null, 2)}

TEXT_SIZE_CLASSES = ${JSON.stringify(TEXT_SIZE_CLASSES, null, 2)}`}
          </pre>
        </section>

        <section>
          <h3 className="font-medium mb-2">Utility Functions</h3>
          <pre className="rounded bg-muted p-4 text-xs overflow-x-auto">
            {`// Parse tool calls from JSON string
parseToolCalls(toolCallsJson?: string): ToolCall[]

// Get base size from responsive value
getBaseSize(size: ResponsiveValue<ChatMessageSize>): ChatMessageSize

// Get responsive size classes
getResponsiveSizeClasses(size, classMap): string

// Format timestamp for screen readers
formatTimestampForSR(date: string): string

// Get ISO datetime for time element
getISODateTime(date: string): string

// Get role label with custom override
getRoleLabel(role, userLabel?, assistantLabel?, systemLabel?): string

// Build accessible label for message
buildAccessibleLabel(role, content, isStreaming, hasToolCalls, toolCallCount): string`}
          </pre>
        </section>
      </div>
    </div>
  ),
};
