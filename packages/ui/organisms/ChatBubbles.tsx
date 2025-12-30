/**
 * Chat Bubble Components for standalone chat view
 *
 * These components render messages in a conversational bubble format,
 * with user messages right-aligned and assistant messages left-aligned.
 * Stateless - receives all data via props.
 */

import { cn } from '@openflow/utils';
import { Bot, ChevronDown, ChevronRight, Code2, User, Wrench } from 'lucide-react';
import { useState } from 'react';
import { Icon } from '../atoms/Icon';
import { Spinner } from '../atoms/Spinner';

// ============================================================================
// Types
// ============================================================================

/** Tool information for display */
export interface ToolInfo {
  id?: string;
  name: string;
  input?: Record<string, unknown>;
  output?: string;
  isError?: boolean;
}

/** Claude event types (subset of full event types for UI purposes) */
export type ClaudeEventType = 'system' | 'assistant' | 'user' | 'result';

/** Claude event for UI rendering */
export interface ClaudeEventForUI {
  type: ClaudeEventType;
  subtype?: string;
  message?: {
    content?: Array<{
      type: string;
      text?: string;
      id?: string;
      name?: string;
      input?: Record<string, unknown>;
      tool_use_id?: string;
      content?: string;
      is_error?: boolean;
    }>;
  };
  data?: Record<string, unknown>;
}

/** Display item types for rendering */
export type DisplayItem =
  | { type: 'text'; content: string }
  | { type: 'tool'; tool: ToolInfo }
  | { type: 'result'; subtype: string };

// ============================================================================
// User Message Bubble
// ============================================================================

export interface UserMessageBubbleProps {
  /** Message content */
  content: string;
  /** Message timestamp (ISO string) */
  timestamp?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * UserMessageBubble displays a user message in a chat bubble format.
 * Right-aligned with primary color background.
 */
export function UserMessageBubble({ content, timestamp, className }: UserMessageBubbleProps) {
  return (
    <div className={cn('flex justify-end', className)}>
      {/* Wider on mobile (90%) to maximize space, narrower on desktop (80%) */}
      <div className="flex max-w-[90%] gap-2 md:max-w-[80%] md:gap-3">
        <div className="order-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--primary))] md:h-8 md:w-8">
          <User className="h-3.5 w-3.5 text-[rgb(var(--primary-foreground))] md:h-4 md:w-4" />
        </div>
        <div className="order-1 min-w-0">
          <div className="rounded-2xl rounded-tr-sm bg-[rgb(var(--primary))] px-3 py-2 text-[rgb(var(--primary-foreground))] md:px-4 md:py-3">
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{content}</p>
          </div>
          {timestamp && (
            <p className="mt-1 text-right text-[10px] text-[rgb(var(--muted-foreground))]">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

UserMessageBubble.displayName = 'UserMessageBubble';

// ============================================================================
// Assistant Message Bubble
// ============================================================================

export interface AssistantMessageBubbleProps {
  /** Message content */
  content: string;
  /** JSON string of tool calls */
  toolCalls?: string;
  /** JSON string of tool results */
  toolResults?: string;
  /** Message timestamp (ISO string) */
  timestamp?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AssistantMessageBubble displays a persisted assistant message.
 * Left-aligned with muted background, shows tool calls if present.
 */
export function AssistantMessageBubble({
  content,
  toolCalls,
  toolResults,
  timestamp,
  className,
}: AssistantMessageBubbleProps) {
  // Parse tool data from JSON strings
  const parsedToolCalls = toolCalls ? JSON.parse(toolCalls) : [];
  const parsedToolResults = toolResults ? JSON.parse(toolResults) : [];

  // Match tool calls with their results
  const toolsWithResults: ToolInfo[] = parsedToolCalls.map(
    (call: { id: string; name: string; input: Record<string, unknown> }) => {
      const result = parsedToolResults.find((r: { toolUseId: string }) => r.toolUseId === call.id);
      return {
        id: call.id,
        name: call.name,
        input: call.input,
        output: result?.content,
        isError: result?.isError,
      };
    }
  );

  return (
    <div className={cn('flex gap-3', className)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        {/* Text content */}
        {content && (
          <div className="rounded-2xl rounded-tl-sm bg-[rgb(var(--muted))] px-4 py-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[rgb(var(--foreground))]">
              {content}
            </p>
          </div>
        )}

        {/* Tool calls */}
        {toolsWithResults.map((tool: ToolInfo) => (
          <ToolCallCard key={tool.id} tool={tool} />
        ))}

        {/* Timestamp */}
        {timestamp && (
          <p className="mt-1 text-[10px] text-[rgb(var(--muted-foreground))]">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}

AssistantMessageBubble.displayName = 'AssistantMessageBubble';

// ============================================================================
// Streaming Response
// ============================================================================

export interface StreamingResponseProps {
  /** Display items to render (processed from events) */
  displayItems: DisplayItem[];
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
 * StreamingResponse renders Claude's streaming response with text, tools, and results.
 * Left-aligned with assistant avatar.
 */
export function StreamingResponse({
  displayItems,
  isStreaming = false,
  showRawOutput = false,
  rawOutput = [],
  className,
}: StreamingResponseProps) {
  return (
    <div className={cn('flex gap-3', className)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        {/* Render display items */}
        {displayItems.map((item, index) => {
          if (item.type === 'text') {
            return (
              <div
                key={`text-${index}`}
                className="rounded-2xl rounded-tl-sm bg-[rgb(var(--muted))] px-4 py-3"
              >
                <div className="prose prose-sm prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[rgb(var(--foreground))]">
                    {item.content}
                  </p>
                </div>
              </div>
            );
          }

          if (item.type === 'tool') {
            return <ToolCallCard key={`tool-${index}`} tool={item.tool} />;
          }

          if (item.type === 'result') {
            return (
              <div
                key={`result-${index}`}
                className={cn(
                  'rounded-lg px-3 py-2 text-xs font-medium',
                  item.subtype === 'success'
                    ? 'bg-success/10 text-success'
                    : item.subtype === 'error'
                      ? 'bg-error/10 text-error'
                      : 'bg-info/10 text-info'
                )}
              >
                {item.subtype === 'success'
                  ? '✓ Completed successfully'
                  : `Result: ${item.subtype}`}
              </div>
            );
          }

          return null;
        })}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex items-center gap-2 px-1 text-sm text-[rgb(var(--muted-foreground))]">
            <Spinner size="sm" />
            <span>Claude is thinking...</span>
          </div>
        )}

        {/* Raw output toggle */}
        {showRawOutput && rawOutput.length > 0 && <RawOutputSection output={rawOutput} />}
      </div>
    </div>
  );
}

StreamingResponse.displayName = 'StreamingResponse';

// ============================================================================
// Tool Call Card
// ============================================================================

export interface ToolCallCardProps {
  /** Tool information to display */
  tool: ToolInfo;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ToolCallCard displays a tool call with expandable input/output sections.
 */
export function ToolCallCard({ tool, className }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasOutput = tool.output && tool.output.length > 0;
  const hasInput = tool.input && Object.keys(tool.input).length > 0;
  const isInProgress = !hasOutput && !tool.isError;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border',
        tool.isError
          ? 'border-error/30 bg-error/5'
          : isInProgress
            ? 'border-info/30 bg-info/5'
            : 'border-border bg-card',
        className
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-3 text-left',
          'hover:bg-[rgb(var(--muted))]/50 transition-colors'
        )}
      >
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg',
            tool.isError ? 'bg-error/20' : isInProgress ? 'bg-info/20' : 'bg-primary/10'
          )}
        >
          {isInProgress ? (
            <Spinner size="sm" />
          ) : (
            <Wrench className={cn('h-3.5 w-3.5', tool.isError ? 'text-error' : 'text-primary')} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <code className="text-sm font-semibold text-foreground">{tool.name}</code>
            {tool.isError && (
              <span className="rounded bg-error/20 px-1.5 py-0.5 text-[10px] font-medium text-error">
                Error
              </span>
            )}
            {isInProgress && (
              <span className="rounded bg-info/20 px-1.5 py-0.5 text-[10px] font-medium text-info">
                Running
              </span>
            )}
          </div>
        </div>

        <Icon
          icon={expanded ? ChevronDown : ChevronRight}
          size="sm"
          className="text-[rgb(var(--muted-foreground))]"
        />
      </button>

      {/* Expanded content */}
      {expanded && (hasInput || hasOutput) && (
        <div className="border-t border-[rgb(var(--border))] px-4 py-3 space-y-3">
          {hasInput && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-[rgb(var(--muted-foreground))]">
                Input
              </p>
              <pre className="overflow-x-auto rounded-lg bg-[rgb(var(--background))] p-3 text-xs text-[rgb(var(--muted-foreground))]">
                {JSON.stringify(tool.input, null, 2)}
              </pre>
            </div>
          )}

          {hasOutput && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-[rgb(var(--muted-foreground))]">
                Output
              </p>
              <pre
                className={cn(
                  'max-h-48 overflow-auto rounded-lg p-3 text-xs',
                  tool.isError ? 'bg-error/10 text-error' : 'bg-background text-muted-foreground'
                )}
              >
                {tool.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

ToolCallCard.displayName = 'ToolCallCard';

// ============================================================================
// Raw Output Section
// ============================================================================

export interface RawOutputSectionProps {
  /** Raw output lines to display */
  output: string[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * RawOutputSection displays collapsible raw terminal output for debugging.
 */
export function RawOutputSection({ output, className }: RawOutputSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[rgb(var(--muted))]/50"
      >
        <Code2 className="h-4 w-4 text-[rgb(var(--muted-foreground))]" />
        <span className="text-xs font-medium text-[rgb(var(--muted-foreground))]">
          Raw output ({output.length} lines)
        </span>
        <Icon
          icon={expanded ? ChevronDown : ChevronRight}
          size="sm"
          className="ml-auto text-[rgb(var(--muted-foreground))]"
        />
      </button>

      {expanded && (
        <div className="border-t border-[rgb(var(--border))]">
          <pre className="max-h-64 overflow-auto p-4 font-mono text-xs text-[rgb(var(--muted-foreground))]">
            {output.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
}

RawOutputSection.displayName = 'RawOutputSection';
