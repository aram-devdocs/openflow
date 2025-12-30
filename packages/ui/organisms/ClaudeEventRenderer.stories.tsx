import type { Meta, StoryObj } from '@storybook/react';
import type { ClaudeEvent } from './ClaudeEventRenderer';
import { ClaudeEventRenderer } from './ClaudeEventRenderer';

const meta: Meta<typeof ClaudeEventRenderer> = {
  title: 'Organisms/ClaudeEventRenderer',
  component: ClaudeEventRenderer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    events: {
      control: false,
      description: 'Array of Claude events to render',
    },
    isStreaming: {
      control: 'boolean',
      description: 'Whether output is currently streaming',
    },
    showRawOutput: {
      control: 'boolean',
      description: 'Whether to show raw output section',
    },
    rawOutput: {
      control: false,
      description: 'Raw output lines (unparsed)',
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto p-4 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--background))]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ClaudeEventRenderer>;

/** Simple text response from Claude */
const textEvents: ClaudeEvent[] = [
  {
    type: 'assistant',
    message: {
      content: [
        {
          type: 'text',
          text: "I'll help you create a new React component. Let me analyze your codebase structure first.",
        },
      ],
    },
  },
];

/** Events with tool calls and results */
const toolCallEvents: ClaudeEvent[] = [
  {
    type: 'assistant',
    message: {
      content: [
        {
          type: 'text',
          text: "I'll read the existing Button component to understand the patterns used in your codebase.",
        },
        {
          type: 'tool_use',
          id: 'tool-1',
          name: 'Read',
          input: { path: 'packages/ui/atoms/Button.tsx' },
        },
      ],
    },
  },
  {
    type: 'user',
    message: {
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'tool-1',
          content:
            'import { cn } from "@openflow/utils";\n\nexport interface ButtonProps {\n  variant?: "primary" | "secondary";\n  children: React.ReactNode;\n}\n\nexport function Button({ variant = "primary", children }: ButtonProps) {\n  return (\n    <button className={cn("px-4 py-2 rounded", variantStyles[variant])}>\n      {children}\n    </button>\n  );\n}',
        },
      ],
    },
  },
  {
    type: 'assistant',
    message: {
      content: [
        {
          type: 'text',
          text: 'I can see the pattern. Now let me create a new Card component following the same conventions.',
        },
        {
          type: 'tool_use',
          id: 'tool-2',
          name: 'Write',
          input: {
            path: 'packages/ui/molecules/Card.tsx',
            content: 'export function Card() { return <div>Card</div>; }',
          },
        },
      ],
    },
  },
  {
    type: 'user',
    message: {
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'tool-2',
          content: 'File written successfully',
        },
      ],
    },
  },
];

/** Events with error tool result */
const errorEvents: ClaudeEvent[] = [
  {
    type: 'assistant',
    message: {
      content: [
        {
          type: 'text',
          text: 'Let me try to read the configuration file.',
        },
        {
          type: 'tool_use',
          id: 'tool-err',
          name: 'Read',
          input: { path: '/etc/config/secret.json' },
        },
      ],
    },
  },
  {
    type: 'user',
    message: {
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'tool-err',
          content: 'Error: Permission denied. Cannot read file: /etc/config/secret.json',
          is_error: true,
        },
      ],
    },
  },
  {
    type: 'assistant',
    message: {
      content: [
        {
          type: 'text',
          text: "I don't have permission to read that file. Let me try an alternative approach.",
        },
      ],
    },
  },
];

/** System event */
const systemEvents: ClaudeEvent[] = [
  {
    type: 'system',
    subtype: 'init',
    data: { version: '1.0.0', model: 'claude-3-sonnet' },
  },
  {
    type: 'assistant',
    message: {
      content: [
        {
          type: 'text',
          text: 'Hello! I am ready to help you with your coding tasks.',
        },
      ],
    },
  },
];

/** Result event (task completion) */
const resultEvents: ClaudeEvent[] = [
  {
    type: 'assistant',
    message: {
      content: [
        {
          type: 'text',
          text: 'I have completed the refactoring. All tests pass.',
        },
      ],
    },
  },
  {
    type: 'result',
    subtype: 'success',
    data: { duration: '45s', changes: 12 },
  },
];

/** Sample raw output */
const sampleRawOutput = [
  '{"type":"system","subtype":"init"}',
  '{"type":"assistant","message":{"content":[{"type":"text","text":"Processing..."}]}}',
  '{"type":"tool_use","name":"Read","id":"123"}',
  '{"type":"tool_result","tool_use_id":"123","content":"..."}',
];

/** Default empty state */
export const Empty: Story = {
  args: {
    events: [],
    isStreaming: false,
  },
};

/** Simple text response */
export const TextResponse: Story = {
  args: {
    events: textEvents,
    isStreaming: false,
  },
};

/** Streaming in progress */
export const Streaming: Story = {
  args: {
    events: textEvents,
    isStreaming: true,
  },
};

/** Tool calls with results */
export const WithToolCalls: Story = {
  args: {
    events: toolCallEvents,
    isStreaming: false,
  },
};

/** Tool call with error result */
export const WithError: Story = {
  args: {
    events: errorEvents,
    isStreaming: false,
  },
};

/** System initialization event */
export const WithSystemEvent: Story = {
  args: {
    events: systemEvents,
    isStreaming: false,
  },
};

/** Result/completion event */
export const WithResultEvent: Story = {
  args: {
    events: resultEvents,
    isStreaming: false,
  },
};

/** With raw output display */
export const WithRawOutput: Story = {
  args: {
    events: toolCallEvents,
    isStreaming: false,
    showRawOutput: true,
    rawOutput: sampleRawOutput,
  },
};

/** Complex conversation with multiple tool calls */
export const ComplexConversation: Story = {
  args: {
    events: [
      ...systemEvents,
      {
        type: 'assistant',
        message: {
          content: [
            {
              type: 'text',
              text: "I'll analyze your project structure and create the requested component.",
            },
            {
              type: 'tool_use',
              id: 'tool-glob',
              name: 'Glob',
              input: { pattern: 'packages/ui/**/*.tsx' },
            },
          ],
        },
      },
      {
        type: 'user',
        message: {
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'tool-glob',
              content:
                'packages/ui/atoms/Button.tsx\npackages/ui/atoms/Icon.tsx\npackages/ui/molecules/Card.tsx',
            },
          ],
        },
      },
      ...toolCallEvents,
      ...resultEvents,
    ] as ClaudeEvent[],
    isStreaming: false,
  },
};

/** In-progress tool call (no result yet) */
export const PendingToolCall: Story = {
  args: {
    events: [
      {
        type: 'assistant',
        message: {
          content: [
            {
              type: 'text',
              text: 'Running the test suite...',
            },
            {
              type: 'tool_use',
              id: 'tool-pending',
              name: 'Bash',
              input: { command: 'npm test' },
            },
          ],
        },
      },
    ],
    isStreaming: true,
  },
};
