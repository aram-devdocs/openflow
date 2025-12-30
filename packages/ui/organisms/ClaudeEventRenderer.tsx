import { cn } from '@openflow/utils';
import { Bot, ChevronDown, ChevronRight, Terminal, Wrench } from 'lucide-react';
import { useState } from 'react';
import { Icon } from '../atoms/Icon';
import { Spinner } from '../atoms/Spinner';

/**
 * Claude Code stream-json event types.
 * These mirror the types from useClaudeEvents hook.
 */
export type ClaudeEvent =
  | ClaudeSystemEvent
  | ClaudeAssistantEvent
  | ClaudeUserEvent
  | ClaudeResultEvent;

export interface ClaudeSystemEvent {
  type: 'system';
  subtype: string;
  data?: Record<string, unknown>;
}

export interface ClaudeAssistantEvent {
  type: 'assistant';
  message: {
    content?: string;
    tool_use?: unknown;
  };
}

export interface ClaudeUserEvent {
  type: 'user';
  message: {
    content?: string;
    tool_result?: unknown;
  };
}

export interface ClaudeResultEvent {
  type: 'result';
  subtype: string;
  data?: Record<string, unknown>;
}

/**
 * Grouped event for rendering.
 * Groups consecutive tool calls together for collapsible display.
 */
type GroupedEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_group'; tools: ToolInfo[] }
  | { type: 'system'; subtype: string; data: Record<string, unknown> }
  | { type: 'result'; subtype: string; data: Record<string, unknown> };

interface ToolInfo {
  id?: string;
  name: string;
  input?: Record<string, unknown>;
  output?: string;
  isError?: boolean;
}

export interface ClaudeEventRendererProps {
  /** Array of Claude events to render */
  events: ClaudeEvent[];
  /** Whether output is currently streaming */
  isStreaming?: boolean;
  /** Whether to show raw output section */
  showRawOutput?: boolean;
  /** Raw output lines (unparsed) */
  rawOutput?: string[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Group events into renderable chunks.
 * Groups consecutive tool_use + user (tool_result) events together.
 */
function groupEvents(events: ClaudeEvent[]): GroupedEvent[] {
  const groups: GroupedEvent[] = [];
  let currentToolGroup: ToolInfo[] = [];
  let pendingTool: Partial<ToolInfo> | null = null;

  const flushToolGroup = () => {
    if (currentToolGroup.length > 0) {
      groups.push({ type: 'tool_group', tools: [...currentToolGroup] });
      currentToolGroup = [];
    }
  };

  for (const event of events) {
    if (event.type === 'assistant') {
      const { message } = event;

      if (message.content) {
        flushToolGroup();
        groups.push({ type: 'text', content: message.content });
      }

      if (message.tool_use) {
        // Start a new tool
        const toolUse = message.tool_use as {
          id?: string;
          name?: string;
          input?: Record<string, unknown>;
        };
        pendingTool = {
          id: toolUse.id,
          name: toolUse.name ?? 'unknown_tool',
          input: toolUse.input,
        };
      }
    } else if (event.type === 'user') {
      const { message } = event;

      if (message.tool_result && pendingTool) {
        // Complete the pending tool with its result
        const toolResult = message.tool_result as { output?: string; is_error?: boolean };
        currentToolGroup.push({
          ...pendingTool,
          name: pendingTool.name ?? 'unknown_tool',
          output: toolResult.output,
          isError: toolResult.is_error,
        });
        pendingTool = null;
      }
    } else if (event.type === 'system') {
      flushToolGroup();
      groups.push({ type: 'system', subtype: event.subtype, data: event.data ?? {} });
    } else if (event.type === 'result') {
      flushToolGroup();
      groups.push({ type: 'result', subtype: event.subtype, data: event.data ?? {} });
    }
  }

  // Flush any remaining pending tool
  if (pendingTool) {
    currentToolGroup.push({
      ...pendingTool,
      name: pendingTool.name ?? 'unknown_tool',
    });
  }

  flushToolGroup();

  return groups;
}

/**
 * ClaudeEventRenderer component for displaying streaming Claude Code output.
 * Stateless - receives all data via props, no hooks or data fetching.
 *
 * Features:
 * - Groups tool calls into collapsible sections (like Zenflow)
 * - Renders text content with formatting
 * - Shows streaming indicator when generating
 * - Optional raw output display for debugging
 *
 * @example
 * ```tsx
 * const { events, isStreaming, rawOutput } = useClaudeEvents(processId);
 *
 * <ClaudeEventRenderer
 *   events={events}
 *   isStreaming={isStreaming}
 *   rawOutput={rawOutput}
 * />
 * ```
 */
export function ClaudeEventRenderer({
  events,
  isStreaming = false,
  showRawOutput = false,
  rawOutput = [],
  className,
}: ClaudeEventRendererProps) {
  const groupedEvents = groupEvents(events);
  const hasContent = groupedEvents.length > 0 || rawOutput.length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Grouped events */}
      {groupedEvents.map((group, index) => {
        const key = `group-${index}`;

        if (group.type === 'text') {
          return <TextBlock key={key} content={group.content} />;
        }

        if (group.type === 'tool_group') {
          return <ToolCallGroup key={key} tools={group.tools} />;
        }

        if (group.type === 'system') {
          return <SystemEventBlock key={key} subtype={group.subtype} data={group.data} />;
        }

        if (group.type === 'result') {
          return <ResultEventBlock key={key} subtype={group.subtype} data={group.data} />;
        }

        return null;
      })}

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))]">
          <Spinner size="sm" />
          <span>Claude is thinking...</span>
        </div>
      )}

      {/* Empty state */}
      {!hasContent && !isStreaming && (
        <div className="flex items-center gap-2 py-4 text-sm text-[rgb(var(--muted-foreground))]">
          <Icon icon={Bot} size="sm" />
          <span>No output yet. Send a message to start.</span>
        </div>
      )}

      {/* Raw output (debug view) */}
      {showRawOutput && rawOutput.length > 0 && <RawOutputBlock output={rawOutput} />}
    </div>
  );
}

ClaudeEventRenderer.displayName = 'ClaudeEventRenderer';

/** Text content block */
interface TextBlockProps {
  content: string;
}

function TextBlock({ content }: TextBlockProps) {
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none dark:prose-invert',
        'prose-p:my-2 prose-p:leading-relaxed',
        'prose-pre:bg-[rgb(var(--muted))] prose-pre:border prose-pre:border-[rgb(var(--border))]',
        'prose-code:text-[rgb(var(--primary))] prose-code:before:content-none prose-code:after:content-none',
        'text-[rgb(var(--foreground))]'
      )}
    >
      <div className="whitespace-pre-wrap">{content}</div>
    </div>
  );
}

TextBlock.displayName = 'TextBlock';

/** Collapsible tool call group */
interface ToolCallGroupProps {
  tools: ToolInfo[];
  defaultExpanded?: boolean;
}

function ToolCallGroup({ tools, defaultExpanded = false }: ToolCallGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasErrors = tools.some((t) => t.isError);

  return (
    <div
      className={cn(
        'rounded-lg border',
        hasErrors
          ? 'border-red-500/30 bg-red-500/10'
          : 'border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50'
      )}
    >
      {/* Header - always visible */}
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2 text-left',
          'hover:bg-[rgb(var(--muted))]/50 transition-colors',
          'rounded-lg'
        )}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <Icon
          icon={expanded ? ChevronDown : ChevronRight}
          size="sm"
          className="text-[rgb(var(--muted-foreground))]"
        />
        <Icon
          icon={Wrench}
          size="sm"
          className={hasErrors ? 'text-red-400' : 'text-[rgb(var(--primary))]'}
        />
        <span className="text-sm font-medium text-[rgb(var(--foreground))]">
          {tools.length} {tools.length === 1 ? 'tool' : 'tools'} used
        </span>
        {hasErrors && (
          <span className="ml-auto text-xs text-red-400">
            {tools.filter((t) => t.isError).length} error(s)
          </span>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="space-y-2 border-t border-[rgb(var(--border))] px-3 py-2">
          {tools.map((tool, index) => (
            <ToolCallItem key={tool.id ?? `tool-${index}`} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}

ToolCallGroup.displayName = 'ToolCallGroup';

/** Single tool call item */
interface ToolCallItemProps {
  tool: ToolInfo;
}

function ToolCallItem({ tool }: ToolCallItemProps) {
  const [showInput, setShowInput] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const hasInput = tool.input && Object.keys(tool.input).length > 0;
  const hasOutput = tool.output && tool.output.length > 0;

  return (
    <div
      className={cn(
        'rounded border p-2',
        tool.isError
          ? 'border-red-500/30 bg-red-500/5'
          : 'border-[rgb(var(--border))] bg-[rgb(var(--background))]'
      )}
    >
      {/* Tool name */}
      <div className="flex items-center gap-2">
        <code
          className={cn(
            'text-xs font-medium',
            tool.isError ? 'text-red-400' : 'text-[rgb(var(--primary))]'
          )}
        >
          {tool.name}
        </code>
        {tool.isError && <span className="text-xs text-red-400">Error</span>}
      </div>

      {/* Input toggle */}
      {hasInput && (
        <div className="mt-2">
          <button
            type="button"
            className="text-xs text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
            onClick={() => setShowInput(!showInput)}
          >
            {showInput ? 'Hide' : 'Show'} input
          </button>
          {showInput && (
            <pre className="mt-1 overflow-x-auto rounded bg-[rgb(var(--muted))] p-2 text-xs text-[rgb(var(--muted-foreground))]">
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Output */}
      {hasOutput && (
        <div className="mt-2">
          <button
            type="button"
            className="text-xs text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
            onClick={() => setShowOutput(!showOutput)}
          >
            {showOutput ? 'Hide' : 'Show'} output
          </button>
          {showOutput && (
            <pre
              className={cn(
                'mt-1 max-h-40 overflow-auto rounded p-2 text-xs',
                tool.isError
                  ? 'bg-red-500/10 text-red-300'
                  : 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]'
              )}
            >
              {tool.output}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

ToolCallItem.displayName = 'ToolCallItem';

/** System event display */
interface SystemEventBlockProps {
  subtype: string;
  data: Record<string, unknown>;
}

function SystemEventBlock({ subtype, data }: SystemEventBlockProps) {
  return (
    <div className="rounded border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs">
      <span className="font-medium text-yellow-400">System: {subtype}</span>
      {Object.keys(data).length > 0 && (
        <pre className="mt-1 text-yellow-300/70">{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}

SystemEventBlock.displayName = 'SystemEventBlock';

/** Result event display */
interface ResultEventBlockProps {
  subtype: string;
  data: Record<string, unknown>;
}

function ResultEventBlock({ subtype, data }: ResultEventBlockProps) {
  return (
    <div className="rounded border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs">
      <span className="font-medium text-green-400">Result: {subtype}</span>
      {Object.keys(data).length > 0 && (
        <pre className="mt-1 text-green-300/70">{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}

ResultEventBlock.displayName = 'ResultEventBlock';

/** Raw output block for debugging */
interface RawOutputBlockProps {
  output: string[];
}

function RawOutputBlock({ output }: RawOutputBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--muted))]/30">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[rgb(var(--muted))]/50"
        onClick={() => setExpanded(!expanded)}
      >
        <Icon
          icon={expanded ? ChevronDown : ChevronRight}
          size="sm"
          className="text-[rgb(var(--muted-foreground))]"
        />
        <Icon icon={Terminal} size="sm" className="text-[rgb(var(--muted-foreground))]" />
        <span className="text-xs font-medium text-[rgb(var(--muted-foreground))]">
          Raw output ({output.length} lines)
        </span>
      </button>
      {expanded && (
        <pre className="max-h-60 overflow-auto border-t border-[rgb(var(--border))] bg-[rgb(var(--background))] p-3 font-mono text-xs text-[rgb(var(--muted-foreground))]">
          {output.join('\n')}
        </pre>
      )}
    </div>
  );
}

RawOutputBlock.displayName = 'RawOutputBlock';
