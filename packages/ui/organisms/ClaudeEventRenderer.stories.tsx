import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import type { ClaudeEvent, ClaudeEventRendererSize, ResponsiveValue } from './ClaudeEventRenderer';
import {
  CLAUDE_EVENT_AVATAR_BASE_CLASSES,
  CLAUDE_EVENT_AVATAR_CLASSES,
  CLAUDE_EVENT_BASE_CLASSES,
  CLAUDE_EVENT_BUBBLE_PADDING_CLASSES,
  CLAUDE_EVENT_CODE_BLOCK_CLASSES,
  CLAUDE_EVENT_EMPTY_CLASSES,
  CLAUDE_EVENT_GAP_CLASSES,
  CLAUDE_EVENT_RAW_OUTPUT_CLASSES,
  CLAUDE_EVENT_RESULT_ERROR_CLASSES,
  CLAUDE_EVENT_RESULT_SUCCESS_CLASSES,
  // Constants
  CLAUDE_EVENT_SIZE_CLASSES,
  CLAUDE_EVENT_STREAMING_CLASSES,
  CLAUDE_EVENT_SYSTEM_CLASSES,
  CLAUDE_EVENT_TEXT_BUBBLE_CLASSES,
  CLAUDE_EVENT_TOGGLE_BUTTON_CLASSES,
  CLAUDE_EVENT_TOOL_GROUP_CLASSES,
  CLAUDE_EVENT_TOOL_GROUP_DEFAULT_CLASSES,
  CLAUDE_EVENT_TOOL_GROUP_ERROR_CLASSES,
  CLAUDE_EVENT_TOOL_HEADER_CLASSES,
  CLAUDE_EVENT_TOOL_ITEM_CLASSES,
  CLAUDE_EVENT_TOOL_ITEM_DEFAULT_CLASSES,
  CLAUDE_EVENT_TOOL_ITEM_ERROR_CLASSES,
  CLAUDE_EVENT_TOOL_PADDING_CLASSES,
  ClaudeEventRenderer,
  DEFAULT_EMPTY_LABEL,
  DEFAULT_OUTPUT_LABEL,
  DEFAULT_STREAMING_LABEL,
} from './ClaudeEventRenderer';

const meta: Meta<typeof ClaudeEventRenderer> = {
  title: 'Organisms/ClaudeEventRenderer',
  component: ClaudeEventRenderer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Renders streaming Claude Code output with tool calls, text messages, system events, and results. Fully accessible with ARIA roles, keyboard navigation, and screen reader support.',
      },
    },
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
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant for text and spacing',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessible label for the output region',
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for automated testing',
    },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ClaudeEventRenderer>;

// ============================================================================
// Sample Events
// ============================================================================

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

/** Result event with error */
const resultErrorEvents: ClaudeEvent[] = [
  {
    type: 'assistant',
    message: {
      content: [
        {
          type: 'text',
          text: 'I encountered an issue during the build process.',
        },
      ],
    },
  },
  {
    type: 'result',
    subtype: 'error',
    data: { message: 'Build failed with 3 errors', exitCode: 1 },
  },
];

/** Sample raw output */
const sampleRawOutput = [
  '{"type":"system","subtype":"init"}',
  '{"type":"assistant","message":{"content":[{"type":"text","text":"Processing..."}]}}',
  '{"type":"tool_use","name":"Read","id":"123"}',
  '{"type":"tool_result","tool_use_id":"123","content":"..."}',
];

/** In-progress tool call */
const pendingToolEvents: ClaudeEvent[] = [
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
];

// ============================================================================
// Basic Stories
// ============================================================================

/** Default empty state */
export const Empty: Story = {
  args: {
    events: [],
    isStreaming: false,
    'data-testid': 'claude-output',
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

/** Result/completion event (success) */
export const WithResultEvent: Story = {
  args: {
    events: resultEvents,
    isStreaming: false,
  },
};

/** Result/completion event (error) */
export const WithResultError: Story = {
  args: {
    events: resultErrorEvents,
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

// ============================================================================
// Size Variants
// ============================================================================

/** Small size */
export const SizeSmall: Story = {
  args: {
    events: toolCallEvents,
    size: 'sm',
    isStreaming: false,
  },
};

/** Medium size (default) */
export const SizeMedium: Story = {
  args: {
    events: toolCallEvents,
    size: 'md',
    isStreaming: false,
  },
};

/** Large size */
export const SizeLarge: Story = {
  args: {
    events: toolCallEvents,
    size: 'lg',
    isStreaming: false,
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-8">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <h3 className="mb-2 text-sm font-medium capitalize text-[rgb(var(--muted-foreground))]">
            Size: {size}
          </h3>
          <ClaudeEventRenderer events={textEvents} size={size} isStreaming={false} />
        </div>
      ))}
    </div>
  ),
};

/** Responsive sizing */
export const ResponsiveSizing: Story = {
  args: {
    events: toolCallEvents,
    size: { base: 'sm', md: 'md', lg: 'lg' } as ResponsiveValue<ClaudeEventRendererSize>,
    isStreaming: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The component supports responsive sizing using breakpoint objects. Resize the viewport to see size changes.',
      },
    },
  },
};

// ============================================================================
// Tool States
// ============================================================================

/** In-progress tool call (no result yet) */
export const PendingToolCall: Story = {
  args: {
    events: pendingToolEvents,
    isStreaming: true,
  },
};

/** Multiple tool calls */
export const MultipleTools: Story = {
  args: {
    events: [
      {
        type: 'assistant',
        message: {
          content: [
            {
              type: 'text',
              text: 'Let me check multiple files...',
            },
            { type: 'tool_use', id: 't1', name: 'Read', input: { path: 'file1.ts' } },
            { type: 'tool_use', id: 't2', name: 'Read', input: { path: 'file2.ts' } },
            { type: 'tool_use', id: 't3', name: 'Read', input: { path: 'file3.ts' } },
          ],
        },
      },
      {
        type: 'user',
        message: {
          content: [
            { type: 'tool_result', tool_use_id: 't1', content: 'Content of file1' },
            { type: 'tool_result', tool_use_id: 't2', content: 'Content of file2' },
            { type: 'tool_result', tool_use_id: 't3', content: 'Content of file3' },
          ],
        },
      },
    ],
    isStreaming: false,
  },
};

// ============================================================================
// Complex Scenarios
// ============================================================================

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

// ============================================================================
// Accessibility Demos
// ============================================================================

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded bg-[rgb(var(--muted))] p-3 text-sm">
        <strong>Keyboard Navigation:</strong>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <kbd className="rounded bg-[rgb(var(--background))] px-1">Tab</kbd> to focus on
            interactive elements
          </li>
          <li>
            <kbd className="rounded bg-[rgb(var(--background))] px-1">Enter</kbd> or{' '}
            <kbd className="rounded bg-[rgb(var(--background))] px-1">Space</kbd> to toggle tool
            details
          </li>
          <li>
            Focus on a tool group and press{' '}
            <kbd className="rounded bg-[rgb(var(--background))] px-1">Enter</kbd> to expand
          </li>
        </ul>
      </div>
      <ClaudeEventRenderer
        events={toolCallEvents}
        isStreaming={false}
        data-testid="keyboard-demo"
      />
    </div>
  ),
};

/** Screen reader accessibility */
export const ScreenReaderAccessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded bg-[rgb(var(--muted))] p-3 text-sm">
        <strong>Screen Reader Features:</strong>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Container has <code>role="log"</code> for live region updates
          </li>
          <li>
            <code>aria-live="polite"</code> for non-intrusive announcements
          </li>
          <li>Tool groups announce their status (running, completed, errors)</li>
          <li>Result events announce success or failure</li>
          <li>Streaming state is announced when started</li>
        </ul>
      </div>
      <ClaudeEventRenderer
        events={toolCallEvents}
        isStreaming={false}
        aria-label="Claude Code output log"
        data-testid="sr-demo"
      />
    </div>
  ),
};

/** Focus ring visibility */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded bg-[rgb(var(--muted))] p-3 text-sm">
        <strong>Focus Ring Visibility:</strong>
        <p className="mt-1">
          Tab through the interactive elements to see focus rings. All buttons have visible focus
          indicators with ring-offset for visibility on any background.
        </p>
      </div>
      <ClaudeEventRenderer
        events={toolCallEvents}
        showRawOutput
        rawOutput={sampleRawOutput}
        isStreaming={false}
      />
    </div>
  ),
};

/** Touch target accessibility (44px minimum) */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded bg-[rgb(var(--muted))] p-3 text-sm">
        <strong>Touch Target Accessibility (WCAG 2.5.5):</strong>
        <p className="mt-1">
          All interactive elements have a minimum touch target of 44×44px on mobile. Resize to
          mobile viewport to see the larger touch targets.
        </p>
      </div>
      <ClaudeEventRenderer events={toolCallEvents} size="sm" isStreaming={false} />
    </div>
  ),
};

/** Reduced motion support */
export const ReducedMotionDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded bg-[rgb(var(--muted))] p-3 text-sm">
        <strong>Reduced Motion Support:</strong>
        <p className="mt-1">
          All animations use <code>motion-safe:</code> prefix. Users with{' '}
          <code>prefers-reduced-motion</code> will see no transitions or animations.
        </p>
      </div>
      <ClaudeEventRenderer events={toolCallEvents} isStreaming={false} />
    </div>
  ),
};

// ============================================================================
// Interactive Demos
// ============================================================================

/** Interactive streaming demo */
export const InteractiveStreamingDemo: Story = {
  render: function InteractiveDemo() {
    const [isStreaming, setIsStreaming] = useState(false);
    const [events, setEvents] = useState<ClaudeEvent[]>([]);

    const simulateStreaming = () => {
      setEvents([]);
      setIsStreaming(true);

      // Simulate text message
      setTimeout(() => {
        setEvents([
          {
            type: 'assistant',
            message: {
              content: [{ type: 'text', text: "I'll check the file for you..." }],
            },
          },
        ]);
      }, 500);

      // Simulate tool call
      setTimeout(() => {
        setEvents((prev) => [
          ...prev,
          {
            type: 'assistant',
            message: {
              content: [
                { type: 'tool_use', id: 'sim-1', name: 'Read', input: { path: 'example.ts' } },
              ],
            },
          },
        ]);
      }, 1500);

      // Simulate tool result
      setTimeout(() => {
        setEvents((prev) => [
          ...prev,
          {
            type: 'user',
            message: {
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: 'sim-1',
                  content: 'export const example = "hello";',
                },
              ],
            },
          },
        ]);
      }, 2500);

      // Simulate completion
      setTimeout(() => {
        setEvents((prev) => [
          ...prev,
          {
            type: 'assistant',
            message: {
              content: [{ type: 'text', text: 'Found the content!' }],
            },
          },
          {
            type: 'result',
            subtype: 'success',
            data: { message: 'Task completed' },
          },
        ]);
        setIsStreaming(false);
      }, 3500);
    };

    return (
      <div className="space-y-4">
        <Button onClick={simulateStreaming} disabled={isStreaming}>
          {isStreaming ? 'Streaming...' : 'Simulate Streaming'}
        </Button>
        <ClaudeEventRenderer events={events} isStreaming={isStreaming} />
      </div>
    );
  },
};

/** Ref forwarding demo */
export const RefForwardingDemo: Story = {
  render: function RefDemo() {
    const ref = useRef<HTMLDivElement>(null);

    const focusContainer = () => {
      if (ref.current) {
        ref.current.focus();
        ref.current.scrollIntoView({ behavior: 'smooth' });
      }
    };

    return (
      <div className="space-y-4">
        <Button onClick={focusContainer}>Focus Container</Button>
        <ClaudeEventRenderer
          ref={ref}
          events={toolCallEvents}
          isStreaming={false}
          data-testid="ref-demo"
        />
      </div>
    );
  },
};

/** Data attributes demo */
export const DataAttributesDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded bg-[rgb(var(--muted))] p-3 text-sm">
        <strong>Data Attributes:</strong>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <code>data-testid</code> - Test automation ID
          </li>
          <li>
            <code>data-streaming</code> - Current streaming state
          </li>
          <li>
            <code>data-size</code> - Current size variant
          </li>
          <li>
            <code>data-event-count</code> - Number of events
          </li>
          <li>
            <code>data-has-errors</code> - Tool group error state
          </li>
          <li>
            <code>data-expanded</code> - Collapsible section state
          </li>
          <li>
            <code>data-tool-name</code> - Individual tool name
          </li>
          <li>
            <code>data-tool-status</code> - Tool status (running, completed, error)
          </li>
        </ul>
      </div>
      <ClaudeEventRenderer
        events={toolCallEvents}
        isStreaming={false}
        size="md"
        data-testid="data-attrs-demo"
      />
    </div>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** Chat panel integration */
export const InChatPanel: Story = {
  render: () => (
    <div className="flex h-[400px] flex-col rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <div className="border-b border-[rgb(var(--border))] px-4 py-3">
        <h2 className="font-semibold">Claude Code Assistant</h2>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <ClaudeEventRenderer events={toolCallEvents} isStreaming={false} />
      </div>
      <div className="border-t border-[rgb(var(--border))] p-4">
        <input
          type="text"
          placeholder="Ask Claude..."
          className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-4 py-2"
        />
      </div>
    </div>
  ),
};

/** Mobile view */
export const MobileView: Story = {
  args: {
    events: toolCallEvents,
    size: 'sm',
    isStreaming: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/** Tablet view */
export const TabletView: Story = {
  args: {
    events: toolCallEvents,
    size: { base: 'sm', md: 'md' },
    isStreaming: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/** Constants and utilities reference */
export const ConstantsReference: Story = {
  render: () => (
    <div className="space-y-6 text-sm">
      <div>
        <h3 className="mb-2 font-semibold">Size Class Mappings</h3>
        <pre className="rounded bg-[rgb(var(--muted))] p-3 text-xs">
          {JSON.stringify(
            {
              CLAUDE_EVENT_SIZE_CLASSES,
              CLAUDE_EVENT_GAP_CLASSES,
              CLAUDE_EVENT_AVATAR_CLASSES,
              CLAUDE_EVENT_BUBBLE_PADDING_CLASSES,
              CLAUDE_EVENT_TOOL_PADDING_CLASSES,
            },
            null,
            2
          )}
        </pre>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Default Labels</h3>
        <pre className="rounded bg-[rgb(var(--muted))] p-3 text-xs">
          {JSON.stringify(
            {
              DEFAULT_OUTPUT_LABEL,
              DEFAULT_STREAMING_LABEL,
              DEFAULT_EMPTY_LABEL,
            },
            null,
            2
          )}
        </pre>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Base Classes</h3>
        <pre className="max-h-60 overflow-auto rounded bg-[rgb(var(--muted))] p-3 text-xs">
          {JSON.stringify(
            {
              CLAUDE_EVENT_BASE_CLASSES,
              CLAUDE_EVENT_TEXT_BUBBLE_CLASSES,
              CLAUDE_EVENT_AVATAR_BASE_CLASSES,
              CLAUDE_EVENT_TOOL_GROUP_CLASSES,
              CLAUDE_EVENT_TOOL_GROUP_DEFAULT_CLASSES,
              CLAUDE_EVENT_TOOL_GROUP_ERROR_CLASSES,
              CLAUDE_EVENT_TOOL_HEADER_CLASSES,
              CLAUDE_EVENT_TOOL_ITEM_CLASSES,
              CLAUDE_EVENT_TOOL_ITEM_DEFAULT_CLASSES,
              CLAUDE_EVENT_TOOL_ITEM_ERROR_CLASSES,
              CLAUDE_EVENT_SYSTEM_CLASSES,
              CLAUDE_EVENT_RESULT_SUCCESS_CLASSES,
              CLAUDE_EVENT_RESULT_ERROR_CLASSES,
              CLAUDE_EVENT_RAW_OUTPUT_CLASSES,
              CLAUDE_EVENT_CODE_BLOCK_CLASSES,
              CLAUDE_EVENT_TOGGLE_BUTTON_CLASSES,
              CLAUDE_EVENT_STREAMING_CLASSES,
              CLAUDE_EVENT_EMPTY_CLASSES,
            },
            null,
            2
          )}
        </pre>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Utility Functions</h3>
        <div className="space-y-3">
          <div className="rounded bg-[rgb(var(--muted))] p-3">
            <code className="font-semibold">getBaseSize(size)</code>
            <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
              Extracts base size from responsive value. Returns 'md' as default.
            </p>
            <pre className="mt-2 text-xs">
              getBaseSize('lg') → 'lg'{'\n'}
              getBaseSize({'{'} base: 'sm', md: 'lg' {'}'}) → 'sm'
            </pre>
          </div>

          <div className="rounded bg-[rgb(var(--muted))] p-3">
            <code className="font-semibold">getResponsiveSizeClasses(size, classMap)</code>
            <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
              Generates responsive Tailwind classes from a size value and class map.
            </p>
          </div>

          <div className="rounded bg-[rgb(var(--muted))] p-3">
            <code className="font-semibold">groupEvents(events)</code>
            <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
              Groups Claude events into renderable chunks (text, tool_group, system, result).
            </p>
          </div>

          <div className="rounded bg-[rgb(var(--muted))] p-3">
            <code className="font-semibold">getToolAnnouncement(tool)</code>
            <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
              Returns screen reader announcement for a tool event.
            </p>
          </div>

          <div className="rounded bg-[rgb(var(--muted))] p-3">
            <code className="font-semibold">getResultType(subtype)</code>
            <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
              Returns 'success', 'error', or 'info' based on result subtype.
            </p>
          </div>

          <div className="rounded bg-[rgb(var(--muted))] p-3">
            <code className="font-semibold">getResultAnnouncement(subtype)</code>
            <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
              Returns screen reader announcement for a result event.
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
};
