import type {
  AgentEventRecord,
  StepStatus,
  ToolStateSummary,
  ToolStatus,
} from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../atoms/Button';
import { EventList, StepProgress, TerminalOutput, ToolStateList } from './StepProgress';

const meta: Meta<typeof StepProgress> = {
  title: 'Organisms/StepProgress',
  component: StepProgress,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays live agent events and tool states for a task step. Shows events chronologically with expandable details, tool progress, and optional terminal output.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    events: {
      control: false,
      description: 'Array of agent event records',
    },
    toolStates: {
      control: false,
      description: 'Array of tool state summaries',
    },
    stepStatus: {
      control: 'select',
      options: ['pending', 'running', 'completed', 'failed', 'skipped'] as StepStatus[],
      description: 'Current step status',
    },
    showTerminalOutput: {
      control: 'boolean',
      description: 'Whether to show raw terminal output',
    },
    terminalOutput: {
      control: 'text',
      description: 'Raw terminal output string',
    },
    isStreaming: {
      control: 'boolean',
      description: 'Whether events are currently streaming',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant',
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for automated testing',
    },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-3xl rounded-lg border border-border bg-background p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StepProgress>;

// ============================================================================
// Sample Data
// ============================================================================

/** Helper to create event records */
function createEvent(sequence: number, eventType: string, payload: unknown): AgentEventRecord {
  return {
    id: `evt-${sequence}`,
    sessionId: 'sess-123',
    sequence,
    eventType,
    payload,
    createdAt: new Date(Date.now() - (10 - sequence) * 1000).toISOString(),
  };
}

/** Init event */
const initEvent = createEvent(1, 'init', {
  type: 'init',
  session_id: 'sess-123',
  model: 'claude-sonnet-4-20250514',
  tools: ['Read', 'Write', 'Bash', 'Glob', 'Grep'],
});

/** Message events */
const messageEvents: AgentEventRecord[] = [
  createEvent(2, 'message', {
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: "I'll analyze the codebase structure and find the relevant files.",
      },
    ],
  }),
  createEvent(4, 'message', {
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: 'Found the configuration. Now implementing the changes.',
      },
    ],
  }),
];

/** Tool use events */
const toolUseEvents: AgentEventRecord[] = [
  createEvent(3, 'tool_use', {
    type: 'tool_use',
    tool_id: 'tool-1',
    tool_name: 'Glob',
    input: { pattern: 'src/**/*.ts' },
  }),
  createEvent(5, 'tool_use', {
    type: 'tool_use',
    tool_id: 'tool-2',
    tool_name: 'Read',
    input: { file_path: 'src/config.ts' },
  }),
  createEvent(7, 'tool_use', {
    type: 'tool_use',
    tool_id: 'tool-3',
    tool_name: 'Write',
    input: { file_path: 'src/config.ts', content: '...' },
  }),
];

/** Tool result events */
const toolResultEvents: AgentEventRecord[] = [
  createEvent(4, 'tool_result', {
    type: 'tool_result',
    tool_id: 'tool-1',
    status: 'success',
    output: 'Found 15 files matching pattern',
  }),
  createEvent(6, 'tool_result', {
    type: 'tool_result',
    tool_id: 'tool-2',
    status: 'success',
    output: 'export const config = { ... }',
  }),
  createEvent(8, 'tool_result', {
    type: 'tool_result',
    tool_id: 'tool-3',
    status: 'success',
    output: 'File written successfully',
  }),
];

/** Complete event */
const completeEvent = createEvent(9, 'complete', {
  type: 'complete',
  status: 'success',
  stats: {
    input_tokens: 1234,
    output_tokens: 567,
    total_tokens: 1801,
    duration_ms: 5000,
  },
});

/** Error event */
const errorEvent = createEvent(5, 'error', {
  type: 'error',
  code: 'rate_limit',
  message: 'Rate limit exceeded. Please wait before retrying.',
});

/** All events combined for complete flow */
const allEvents: AgentEventRecord[] = [
  initEvent,
  ...messageEvents,
  ...toolUseEvents.slice(0, 2),
  ...toolResultEvents.slice(0, 2),
  toolUseEvents[2],
  toolResultEvents[2],
  messageEvents[1],
  completeEvent,
];

/** Tool states */
const runningToolStates: ToolStateSummary[] = [
  {
    id: 'ts-1',
    sessionId: 'sess-123',
    toolUseId: 'tool-1',
    toolName: 'Glob',
    status: 'completed' as ToolStatus,
    isError: false,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
  {
    id: 'ts-2',
    sessionId: 'sess-123',
    toolUseId: 'tool-2',
    toolName: 'Read',
    status: 'running' as ToolStatus,
    isError: false,
    startedAt: new Date().toISOString(),
  },
];

const completedToolStates: ToolStateSummary[] = [
  {
    id: 'ts-1',
    sessionId: 'sess-123',
    toolUseId: 'tool-1',
    toolName: 'Glob',
    status: 'completed' as ToolStatus,
    isError: false,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
  {
    id: 'ts-2',
    sessionId: 'sess-123',
    toolUseId: 'tool-2',
    toolName: 'Read',
    status: 'completed' as ToolStatus,
    isError: false,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
  {
    id: 'ts-3',
    sessionId: 'sess-123',
    toolUseId: 'tool-3',
    toolName: 'Write',
    status: 'completed' as ToolStatus,
    isError: false,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
];

const errorToolStates: ToolStateSummary[] = [
  {
    id: 'ts-1',
    sessionId: 'sess-123',
    toolUseId: 'tool-1',
    toolName: 'Bash',
    status: 'error' as ToolStatus,
    isError: true,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
];

/** Sample terminal output */
const sampleTerminalOutput = `{"type":"init","session_id":"sess-123","model":"claude-sonnet-4"}
{"type":"message","role":"assistant","content":[{"type":"text","text":"Analyzing..."}]}
{"type":"tool_use","tool_id":"tool-1","tool_name":"Glob","input":{"pattern":"**/*.ts"}}
{"type":"tool_result","tool_id":"tool-1","status":"success","output":"Found 15 files"}
{"type":"message","role":"assistant","content":[{"type":"text","text":"Done!"}]}
{"type":"complete","status":"success","stats":{"total_tokens":1801}}`;

// ============================================================================
// Basic Stories
// ============================================================================

/** Default empty state */
export const Empty: Story = {
  args: {
    events: [],
    stepStatus: 'pending',
    'data-testid': 'step-progress',
  },
};

/** Pending step */
export const Pending: Story = {
  args: {
    events: [],
    stepStatus: 'pending',
  },
};

/** Running step with no events yet */
export const RunningNoEvents: Story = {
  args: {
    events: [],
    stepStatus: 'running',
    isStreaming: true,
  },
};

/** Running step with events */
export const Running: Story = {
  args: {
    events: allEvents.slice(0, 5),
    toolStates: runningToolStates,
    stepStatus: 'running',
    isStreaming: true,
  },
};

/** Completed step */
export const Completed: Story = {
  args: {
    events: allEvents,
    toolStates: completedToolStates,
    stepStatus: 'completed',
    isStreaming: false,
  },
};

/** Failed step */
export const Failed: Story = {
  args: {
    events: [...allEvents.slice(0, 3), errorEvent],
    toolStates: errorToolStates,
    stepStatus: 'failed',
    isStreaming: false,
  },
};

/** Skipped step */
export const Skipped: Story = {
  args: {
    events: [],
    stepStatus: 'skipped',
  },
};

// ============================================================================
// With Terminal Output
// ============================================================================

/** With terminal output */
export const WithTerminalOutput: Story = {
  args: {
    events: allEvents,
    toolStates: completedToolStates,
    stepStatus: 'completed',
    showTerminalOutput: true,
    terminalOutput: sampleTerminalOutput,
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/** Small size */
export const SizeSmall: Story = {
  args: {
    events: allEvents.slice(0, 5),
    toolStates: runningToolStates,
    stepStatus: 'running',
    size: 'sm',
    isStreaming: true,
  },
};

/** Medium size (default) */
export const SizeMedium: Story = {
  args: {
    events: allEvents.slice(0, 5),
    toolStates: runningToolStates,
    stepStatus: 'running',
    size: 'md',
    isStreaming: true,
  },
};

/** Large size */
export const SizeLarge: Story = {
  args: {
    events: allEvents.slice(0, 5),
    toolStates: runningToolStates,
    stepStatus: 'running',
    size: 'lg',
    isStreaming: true,
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-8">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size}>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground capitalize">
            Size: {size}
          </h3>
          <StepProgress
            events={allEvents.slice(0, 3)}
            toolStates={runningToolStates}
            stepStatus="running"
            size={size}
            isStreaming={true}
          />
        </div>
      ))}
    </div>
  ),
};

// ============================================================================
// Sub-component Stories
// ============================================================================

/** EventList only */
export const EventListOnly: Story = {
  render: () => <EventList events={allEvents} size="md" data-testid="event-list" />,
};

/** ToolStateList only */
export const ToolStateListOnly: Story = {
  render: () => (
    <ToolStateList
      toolStates={[...completedToolStates, ...runningToolStates.slice(1)]}
      size="md"
      data-testid="tool-state-list"
    />
  ),
};

/** ToolStateList with errors */
export const ToolStateListWithErrors: Story = {
  render: () => (
    <ToolStateList
      toolStates={[...completedToolStates.slice(0, 1), ...errorToolStates]}
      size="md"
    />
  ),
};

/** TerminalOutput only */
export const TerminalOutputOnly: Story = {
  render: () => (
    <TerminalOutput
      output={sampleTerminalOutput}
      size="md"
      defaultExpanded={true}
      data-testid="terminal-output"
    />
  ),
};

// ============================================================================
// Interactive Demos
// ============================================================================

/** Interactive streaming demo */
export const InteractiveStreamingDemo: Story = {
  render: function StreamingDemo() {
    const [events, setEvents] = useState<AgentEventRecord[]>([]);
    const [toolStates, setToolStates] = useState<ToolStateSummary[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [stepStatus, setStepStatus] = useState<StepStatus>('pending');

    const simulateExecution = () => {
      setEvents([]);
      setToolStates([]);
      setIsStreaming(true);
      setStepStatus('running');

      // Init event
      setTimeout(() => {
        setEvents([initEvent]);
      }, 300);

      // First message
      setTimeout(() => {
        setEvents((prev) => [...prev, messageEvents[0]]);
      }, 800);

      // First tool use
      setTimeout(() => {
        setEvents((prev) => [...prev, toolUseEvents[0]]);
        setToolStates([
          {
            id: 'ts-1',
            sessionId: 'sess-123',
            toolUseId: 'tool-1',
            toolName: 'Glob',
            status: 'running' as ToolStatus,
            isError: false,
            startedAt: new Date().toISOString(),
          },
        ]);
      }, 1300);

      // First tool result
      setTimeout(() => {
        setEvents((prev) => [...prev, toolResultEvents[0]]);
        setToolStates([
          {
            id: 'ts-1',
            sessionId: 'sess-123',
            toolUseId: 'tool-1',
            toolName: 'Glob',
            status: 'completed' as ToolStatus,
            isError: false,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          },
        ]);
      }, 2000);

      // Second tool use
      setTimeout(() => {
        setEvents((prev) => [...prev, toolUseEvents[1]]);
        setToolStates((prev) => [
          ...prev,
          {
            id: 'ts-2',
            sessionId: 'sess-123',
            toolUseId: 'tool-2',
            toolName: 'Read',
            status: 'running' as ToolStatus,
            isError: false,
            startedAt: new Date().toISOString(),
          },
        ]);
      }, 2500);

      // Second tool result
      setTimeout(() => {
        setEvents((prev) => [...prev, toolResultEvents[1]]);
        setToolStates((prev) =>
          prev.map((ts) =>
            ts.toolUseId === 'tool-2'
              ? { ...ts, status: 'completed' as ToolStatus, completedAt: new Date().toISOString() }
              : ts
          )
        );
      }, 3200);

      // Complete
      setTimeout(() => {
        setEvents((prev) => [...prev, messageEvents[1], completeEvent]);
        setIsStreaming(false);
        setStepStatus('completed');
      }, 3800);
    };

    const reset = () => {
      setEvents([]);
      setToolStates([]);
      setIsStreaming(false);
      setStepStatus('pending');
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={simulateExecution} disabled={isStreaming}>
            {isStreaming ? 'Running...' : 'Simulate Execution'}
          </Button>
          <Button variant="secondary" onClick={reset} disabled={isStreaming}>
            Reset
          </Button>
        </div>
        <StepProgress
          events={events}
          toolStates={toolStates}
          stepStatus={stepStatus}
          isStreaming={isStreaming}
        />
      </div>
    );
  },
};

// ============================================================================
// Edge Cases
// ============================================================================

/** Many events (scrolling) */
export const ManyEvents: Story = {
  args: {
    events: Array.from({ length: 50 }, (_, i) =>
      createEvent(i + 1, i % 3 === 0 ? 'tool_use' : i % 3 === 1 ? 'tool_result' : 'message', {
        type: i % 3 === 0 ? 'tool_use' : i % 3 === 1 ? 'tool_result' : 'message',
        ...(i % 3 === 0 && { tool_id: `tool-${i}`, tool_name: 'Read', input: {} }),
        ...(i % 3 === 1 && { tool_id: `tool-${i - 1}`, status: 'success', output: 'Done' }),
        ...(i % 3 === 2 && {
          role: 'assistant',
          content: [{ type: 'text', text: `Message ${i}` }],
        }),
      })
    ),
    stepStatus: 'completed',
  },
  decorators: [
    (Story) => (
      <div className="h-96">
        <Story />
      </div>
    ),
  ],
};

/** Long event content */
export const LongEventContent: Story = {
  args: {
    events: [
      createEvent(1, 'message', {
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: `This is a very long message that demonstrates how the component handles lengthy content. ${'Lorem ipsum dolor sit amet. '.repeat(20)}`,
          },
        ],
      }),
      createEvent(2, 'tool_result', {
        type: 'tool_result',
        tool_id: 'tool-1',
        status: 'success',
        output: `${'const x = 1;\n'.repeat(50)}`,
      }),
    ],
    stepStatus: 'completed',
  },
};

// ============================================================================
// Accessibility Stories
// ============================================================================

/** Keyboard navigation */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded bg-muted p-3 text-sm">
        <strong>Keyboard Navigation:</strong>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <kbd className="rounded bg-background px-1">Tab</kbd> to focus interactive elements
          </li>
          <li>
            <kbd className="rounded bg-background px-1">Enter</kbd> to expand/collapse details
          </li>
          <li>Events with details are expandable</li>
        </ul>
      </div>
      <StepProgress
        events={allEvents}
        toolStates={completedToolStates}
        stepStatus="completed"
        data-testid="keyboard-demo"
      />
    </div>
  ),
};

/** Screen reader features */
export const ScreenReaderFeatures: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded bg-muted p-3 text-sm">
        <strong>Screen Reader Features:</strong>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Event list has <code>role="log"</code> for live region
          </li>
          <li>Tool states announce running/completed/error status</li>
          <li>Streaming state is announced</li>
          <li>Expandable sections have proper ARIA attributes</li>
        </ul>
      </div>
      <StepProgress
        events={allEvents}
        toolStates={runningToolStates}
        stepStatus="running"
        isStreaming={true}
      />
    </div>
  ),
};

// ============================================================================
// Integration Examples
// ============================================================================

/** In task execution context */
export const InTaskExecutionContext: Story = {
  render: () => (
    <div className="flex flex-col rounded-lg border border-border bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold">Step 1: Implement Feature</h2>
        <p className="text-sm text-muted-foreground">Provider: claude-code</p>
      </div>

      {/* Prompt */}
      <div className="border-b border-border bg-muted/30 p-4">
        <p className="text-xs font-medium text-muted-foreground">Prompt:</p>
        <p className="mt-1 text-sm">
          Create a new Button component with primary and secondary variants.
        </p>
      </div>

      {/* Step Progress */}
      <div className="flex-1 p-4">
        <StepProgress
          events={allEvents}
          toolStates={completedToolStates}
          stepStatus="completed"
          showTerminalOutput={true}
          terminalOutput={sampleTerminalOutput}
        />
      </div>
    </div>
  ),
};
