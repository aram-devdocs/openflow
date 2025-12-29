import type { Meta, StoryObj } from '@storybook/react';
import type { Message } from '@openflow/generated';
import { MessageRole } from '@openflow/generated';
import { ChatMessage } from './ChatMessage';

const meta: Meta<typeof ChatMessage> = {
  title: 'Organisms/ChatMessage',
  component: ChatMessage,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    isStreaming: {
      control: 'boolean',
      description: 'Whether the message is currently streaming',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatMessage>;

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
 * Empty streaming message (just started)
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
 * Message with tool calls
 */
export const WithToolCalls: Story = {
  args: {
    message: createMessage(
      MessageRole.Assistant,
      'I\'ll read the file to understand its structure.',
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
 * Conversation flow example
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
