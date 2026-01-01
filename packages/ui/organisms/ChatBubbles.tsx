/**
 * Chat Bubble Components for standalone chat view
 *
 * These components render messages in a conversational bubble format,
 * with user messages right-aligned and assistant messages left-aligned.
 * Stateless - receives all data via props.
 *
 * Accessibility:
 * - Proper list semantics for message lists
 * - User vs assistant messages differentiated for screen readers
 * - Timestamps accessible with semantic time elements
 * - Expandable sections have proper ARIA controls
 * - Tool status conveyed beyond color (icons + text)
 */

import { Flex, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { Bot, ChevronDown, ChevronRight, Code2, User, Wrench } from 'lucide-react';
import { type ReactNode, forwardRef, useId, useState } from 'react';
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

/** Responsive size values */
export type ChatBubblesBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ResponsiveValue<T> = T | Partial<Record<ChatBubblesBreakpoint, T>>;
export type ChatBubblesSize = 'sm' | 'md' | 'lg';

// ============================================================================
// Constants
// ============================================================================

/** Default labels */
export const DEFAULT_USER_LABEL = 'You';
export const DEFAULT_ASSISTANT_LABEL = 'Assistant';
export const DEFAULT_STREAMING_LABEL = 'Assistant is thinking...';
export const DEFAULT_EXPAND_LABEL = 'Show details';
export const DEFAULT_COLLAPSE_LABEL = 'Hide details';
export const DEFAULT_TOOL_RUNNING_LABEL = 'Running';
export const DEFAULT_TOOL_ERROR_LABEL = 'Error';
export const DEFAULT_RAW_OUTPUT_LABEL = 'Raw output';

/** Avatar size classes */
export const AVATAR_SIZE_CLASSES = {
  sm: 'h-6 w-6 md:h-7 md:w-7',
  md: 'h-7 w-7 md:h-8 md:w-8',
  lg: 'h-8 w-8 md:h-9 md:w-9',
} as const;

/** Avatar icon size classes */
export const AVATAR_ICON_SIZE_CLASSES = {
  sm: 'h-3 w-3 md:h-3.5 md:w-3.5',
  md: 'h-3.5 w-3.5 md:h-4 md:w-4',
  lg: 'h-4 w-4 md:h-4.5 md:w-4.5',
} as const;

/** Message bubble classes */
export const USER_BUBBLE_CLASSES =
  'rounded-2xl rounded-tr-sm bg-[rgb(var(--primary))] px-3 py-2 text-[rgb(var(--primary-foreground))] md:px-4 md:py-3';
export const ASSISTANT_BUBBLE_CLASSES =
  'rounded-2xl rounded-tl-sm bg-[rgb(var(--muted))] px-3 py-2 md:px-4 md:py-3';

/** User avatar classes */
export const USER_AVATAR_CLASSES =
  'flex shrink-0 items-center justify-center rounded-full bg-[rgb(var(--primary))]';

/** Assistant avatar classes */
export const ASSISTANT_AVATAR_CLASSES =
  'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600';

/** Timestamp classes */
export const TIMESTAMP_CLASSES = 'mt-1 text-[10px] text-[rgb(var(--muted-foreground))]';

/** Tool card classes */
export const TOOL_CARD_BASE_CLASSES = 'overflow-hidden rounded-xl border';
export const TOOL_CARD_DEFAULT_CLASSES = 'border-border bg-card';
export const TOOL_CARD_ERROR_CLASSES = 'border-error/30 bg-error/5';
export const TOOL_CARD_RUNNING_CLASSES = 'border-info/30 bg-info/5';

/** Tool header button classes */
export const TOOL_HEADER_CLASSES =
  'flex w-full min-h-[44px] items-center gap-3 px-4 py-3 text-left hover:bg-[rgb(var(--muted))]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/** Tool icon container classes */
export const TOOL_ICON_CONTAINER_CLASSES = 'flex h-7 w-7 items-center justify-center rounded-lg';
export const TOOL_ICON_DEFAULT_CLASSES = 'bg-primary/10';
export const TOOL_ICON_ERROR_CLASSES = 'bg-error/20';
export const TOOL_ICON_RUNNING_CLASSES = 'bg-info/20';

/** Tool content classes */
export const TOOL_CONTENT_CLASSES = 'border-t border-[rgb(var(--border))] px-4 py-3 space-y-3';
export const TOOL_SECTION_LABEL_CLASSES =
  'mb-1.5 text-xs font-medium text-[rgb(var(--muted-foreground))]';
export const TOOL_PRE_CLASSES =
  'overflow-x-auto rounded-lg bg-[rgb(var(--background))] p-3 text-xs text-[rgb(var(--muted-foreground))]';
export const TOOL_OUTPUT_ERROR_CLASSES =
  'max-h-48 overflow-auto rounded-lg p-3 text-xs bg-error/10 text-error';
export const TOOL_OUTPUT_SUCCESS_CLASSES =
  'max-h-48 overflow-auto rounded-lg p-3 text-xs bg-background text-muted-foreground';

/** Status badge classes */
export const STATUS_BADGE_CLASSES = 'rounded px-1.5 py-0.5 text-[10px] font-medium';
export const STATUS_BADGE_ERROR_CLASSES = 'bg-error/20 text-error';
export const STATUS_BADGE_RUNNING_CLASSES = 'bg-info/20 text-info';

/** Result indicator classes */
export const RESULT_BASE_CLASSES = 'rounded-lg px-3 py-2 text-xs font-medium';
export const RESULT_SUCCESS_CLASSES = 'bg-success/10 text-success';
export const RESULT_ERROR_CLASSES = 'bg-error/10 text-error';
export const RESULT_INFO_CLASSES = 'bg-info/10 text-info';

/** Streaming indicator classes */
export const STREAMING_INDICATOR_CLASSES =
  'flex items-center gap-2 px-1 text-sm text-[rgb(var(--muted-foreground))]';

/** Raw output section classes */
export const RAW_OUTPUT_CONTAINER_CLASSES =
  'rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]';
export const RAW_OUTPUT_HEADER_CLASSES =
  'flex w-full min-h-[44px] items-center gap-3 px-4 py-3 text-left hover:bg-[rgb(var(--muted))]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
export const RAW_OUTPUT_CONTENT_CLASSES =
  'border-t border-[rgb(var(--border))] max-h-64 overflow-auto p-4 font-mono text-xs text-[rgb(var(--muted-foreground))]';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format timestamp for screen readers
 */
export function formatTimestampForSR(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get tool status for accessibility
 */
export function getToolStatus(tool: ToolInfo): 'running' | 'error' | 'complete' {
  if (tool.isError) return 'error';
  if (!tool.output || tool.output.length === 0) return 'running';
  return 'complete';
}

/**
 * Get tool status announcement for screen readers
 */
export function getToolStatusAnnouncement(tool: ToolInfo): string {
  const status = getToolStatus(tool);
  switch (status) {
    case 'running':
      return `Tool ${tool.name} is running`;
    case 'error':
      return `Tool ${tool.name} failed with error`;
    case 'complete':
      return `Tool ${tool.name} completed successfully`;
  }
}

/**
 * Get result announcement for screen readers
 */
export function getResultAnnouncement(subtype: string): string {
  if (subtype === 'success') return 'Completed successfully';
  if (subtype === 'error') return `Error: ${subtype}`;
  return `Result: ${subtype}`;
}

/**
 * Parse tool data from JSON strings safely
 */
export function parseToolData<T>(jsonString: string | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}

// ============================================================================
// User Message Bubble
// ============================================================================

export interface UserMessageBubbleProps {
  /** Message content */
  content: string;
  /** Message timestamp (ISO string) */
  timestamp?: string;
  /** Label for screen readers (default: "You") */
  userLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** data-testid attribute */
  'data-testid'?: string;
}

/**
 * UserMessageBubble displays a user message in a chat bubble format.
 * Right-aligned with primary color background.
 *
 * @accessibility
 * - Uses article role with aria-label for message context
 * - Time element with proper datetime attribute
 * - Screen reader announces "You said: [message]"
 */
export const UserMessageBubble = forwardRef<HTMLElement, UserMessageBubbleProps>(
  (
    { content, timestamp, userLabel = DEFAULT_USER_LABEL, className, 'data-testid': testId },
    ref
  ) => {
    const messageId = useId();

    return (
      <article
        ref={ref}
        className={cn('flex justify-end', className)}
        aria-label={`${userLabel} said`}
        data-testid={testId}
        data-sender="user"
      >
        {/* Screen reader announcement */}
        <VisuallyHidden>
          <span id={`${messageId}-content`}>
            {userLabel} said: {content}
            {timestamp && `. Sent at ${formatTimestampForSR(timestamp)}`}
          </span>
        </VisuallyHidden>

        {/* Wider on mobile (90%) to maximize space, narrower on desktop (80%) */}
        <Flex className="max-w-[90%] gap-2 md:max-w-[80%] md:gap-3" aria-hidden={true}>
          <div className={cn(USER_AVATAR_CLASSES, AVATAR_SIZE_CLASSES.md, 'order-2')}>
            <User
              className={cn(AVATAR_ICON_SIZE_CLASSES.md, 'text-[rgb(var(--primary-foreground))]')}
            />
          </div>
          <div className="order-1 min-w-0">
            <div className={USER_BUBBLE_CLASSES}>
              <Text as="p" size="sm" leading="relaxed" className="whitespace-pre-wrap break-words">
                {content}
              </Text>
            </div>
            {timestamp && (
              <time dateTime={timestamp} className={cn(TIMESTAMP_CLASSES, 'block text-right')}>
                {formatTimestamp(timestamp)}
              </time>
            )}
          </div>
        </Flex>
      </article>
    );
  }
);

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
  /** Label for screen readers (default: "Assistant") */
  assistantLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** data-testid attribute */
  'data-testid'?: string;
}

/**
 * AssistantMessageBubble displays a persisted assistant message.
 * Left-aligned with muted background, shows tool calls if present.
 *
 * @accessibility
 * - Uses article role with aria-label for message context
 * - Tool calls are properly announced with status
 * - Time element with proper datetime attribute
 */
export const AssistantMessageBubble = forwardRef<HTMLElement, AssistantMessageBubbleProps>(
  (
    {
      content,
      toolCalls,
      toolResults,
      timestamp,
      assistantLabel = DEFAULT_ASSISTANT_LABEL,
      className,
      'data-testid': testId,
    },
    ref
  ) => {
    const messageId = useId();

    // Parse tool data from JSON strings
    const parsedToolCalls = parseToolData<
      Array<{ id: string; name: string; input: Record<string, unknown> }>
    >(toolCalls, []);
    const parsedToolResults = parseToolData<
      Array<{ toolUseId: string; content: string; isError?: boolean }>
    >(toolResults, []);

    // Match tool calls with their results
    const toolsWithResults: ToolInfo[] = parsedToolCalls.map((call) => {
      const result = parsedToolResults.find((r) => r.toolUseId === call.id);
      return {
        id: call.id,
        name: call.name,
        input: call.input,
        output: result?.content,
        isError: result?.isError,
      };
    });

    const toolCount = toolsWithResults.length;

    return (
      <article
        ref={ref}
        className={cn('flex gap-3', className)}
        aria-label={`${assistantLabel} said`}
        data-testid={testId}
        data-sender="assistant"
      >
        {/* Screen reader announcement */}
        <VisuallyHidden>
          <span id={`${messageId}-content`}>
            {assistantLabel} said: {content}
            {toolCount > 0 && `. Used ${toolCount} tool${toolCount === 1 ? '' : 's'}`}
            {timestamp && `. Sent at ${formatTimestampForSR(timestamp)}`}
          </span>
        </VisuallyHidden>

        <div className={cn(ASSISTANT_AVATAR_CLASSES, AVATAR_SIZE_CLASSES.md)} aria-hidden="true">
          <Bot className={cn(AVATAR_ICON_SIZE_CLASSES.md, 'text-white')} />
        </div>

        <div className="min-w-0 flex-1 space-y-3" aria-hidden="true">
          {/* Text content */}
          {content && (
            <div className={ASSISTANT_BUBBLE_CLASSES}>
              <Text
                as="p"
                size="sm"
                leading="relaxed"
                className="whitespace-pre-wrap text-[rgb(var(--foreground))]"
              >
                {content}
              </Text>
            </div>
          )}

          {/* Tool calls */}
          {toolsWithResults.length > 0 && (
            <div role="list" aria-label={`${toolCount} tool call${toolCount === 1 ? '' : 's'}`}>
              {toolsWithResults.map((tool) => (
                <div key={tool.id} role="listitem">
                  <ToolCallCard tool={tool} />
                </div>
              ))}
            </div>
          )}

          {/* Timestamp */}
          {timestamp && (
            <time dateTime={timestamp} className={TIMESTAMP_CLASSES}>
              {formatTimestamp(timestamp)}
            </time>
          )}
        </div>
      </article>
    );
  }
);

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
  /** Label for streaming indicator */
  streamingLabel?: string;
  /** Label for screen readers (default: "Assistant") */
  assistantLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** data-testid attribute */
  'data-testid'?: string;
}

/**
 * StreamingResponse renders Claude's streaming response with text, tools, and results.
 * Left-aligned with assistant avatar.
 *
 * @accessibility
 * - Uses article role with aria-label for streaming context
 * - aria-busy indicates active streaming
 * - aria-live region for new content
 * - Tool and result items have proper status announcements
 */
export const StreamingResponse = forwardRef<HTMLElement, StreamingResponseProps>(
  (
    {
      displayItems,
      isStreaming = false,
      showRawOutput = false,
      rawOutput = [],
      streamingLabel = DEFAULT_STREAMING_LABEL,
      assistantLabel = DEFAULT_ASSISTANT_LABEL,
      className,
      'data-testid': testId,
    },
    ref
  ) => {
    const regionId = useId();
    const textContent = displayItems
      .filter((item): item is Extract<DisplayItem, { type: 'text' }> => item.type === 'text')
      .map((item) => item.content)
      .join('');

    return (
      <article
        ref={ref}
        className={cn('flex gap-3', className)}
        aria-label={isStreaming ? `${assistantLabel} is responding` : `${assistantLabel} response`}
        aria-busy={isStreaming}
        data-testid={testId}
        data-sender="assistant"
        data-streaming={isStreaming}
      >
        {/* Screen reader live region for streaming updates */}
        <VisuallyHidden>
          <div id={regionId} role="status" aria-live="polite" aria-atomic="false">
            {isStreaming ? streamingLabel : `${assistantLabel} said: ${textContent}`}
          </div>
        </VisuallyHidden>

        <div className={cn(ASSISTANT_AVATAR_CLASSES, AVATAR_SIZE_CLASSES.md)} aria-hidden="true">
          <Bot className={cn(AVATAR_ICON_SIZE_CLASSES.md, 'text-white')} />
        </div>

        <div className="min-w-0 flex-1 space-y-3" aria-hidden="true">
          {/* Render display items */}
          {displayItems.map((item, index) => {
            if (item.type === 'text') {
              return (
                <div key={`text-${index}`} className={ASSISTANT_BUBBLE_CLASSES}>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <Text
                      as="p"
                      size="sm"
                      leading="relaxed"
                      className="whitespace-pre-wrap text-[rgb(var(--foreground))]"
                    >
                      {item.content}
                    </Text>
                  </div>
                </div>
              );
            }

            if (item.type === 'tool') {
              return <ToolCallCard key={`tool-${index}`} tool={item.tool} />;
            }

            if (item.type === 'result') {
              const isSuccess = item.subtype === 'success';
              const isError = item.subtype === 'error';

              return (
                <div
                  key={`result-${index}`}
                  className={cn(
                    RESULT_BASE_CLASSES,
                    isSuccess && RESULT_SUCCESS_CLASSES,
                    isError && RESULT_ERROR_CLASSES,
                    !isSuccess && !isError && RESULT_INFO_CLASSES
                  )}
                  role="status"
                >
                  <VisuallyHidden>{getResultAnnouncement(item.subtype)}</VisuallyHidden>
                  <span aria-hidden="true">
                    {isSuccess ? '✓ Completed successfully' : `Result: ${item.subtype}`}
                  </span>
                </div>
              );
            }

            return null;
          })}

          {/* Streaming indicator */}
          {isStreaming && (
            <div className={STREAMING_INDICATOR_CLASSES} role="status">
              <Spinner size="sm" announce={false} aria-hidden="true" />
              <span>{streamingLabel}</span>
            </div>
          )}

          {/* Raw output toggle */}
          {showRawOutput && rawOutput.length > 0 && <RawOutputSection output={rawOutput} />}
        </div>
      </article>
    );
  }
);

StreamingResponse.displayName = 'StreamingResponse';

// ============================================================================
// Tool Call Card
// ============================================================================

export interface ToolCallCardProps {
  /** Tool information to display */
  tool: ToolInfo;
  /** Label for expand button */
  expandLabel?: string;
  /** Label for collapse button */
  collapseLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** data-testid attribute */
  'data-testid'?: string;
}

/**
 * ToolCallCard displays a tool call with expandable input/output sections.
 *
 * @accessibility
 * - Button has aria-expanded state
 * - aria-controls links to expandable content
 * - Tool status announced beyond color (icon + text badge)
 * - Focus ring visible on all backgrounds
 * - Touch target ≥44px
 */
export const ToolCallCard = forwardRef<HTMLDivElement, ToolCallCardProps>(
  (
    {
      tool,
      expandLabel = DEFAULT_EXPAND_LABEL,
      collapseLabel = DEFAULT_COLLAPSE_LABEL,
      className,
      'data-testid': testId,
    },
    ref
  ) => {
    const [expanded, setExpanded] = useState(false);
    const contentId = useId();
    const hasOutput = tool.output && tool.output.length > 0;
    const hasInput = tool.input && Object.keys(tool.input).length > 0;
    const isInProgress = !hasOutput && !tool.isError;
    const hasExpandableContent = hasInput || hasOutput;
    const status = getToolStatus(tool);

    return (
      <div
        ref={ref}
        className={cn(
          TOOL_CARD_BASE_CLASSES,
          tool.isError && TOOL_CARD_ERROR_CLASSES,
          isInProgress && TOOL_CARD_RUNNING_CLASSES,
          !tool.isError && !isInProgress && TOOL_CARD_DEFAULT_CLASSES,
          className
        )}
        data-testid={testId}
        data-tool-name={tool.name}
        data-tool-status={status}
      >
        {/* Screen reader announcement */}
        <div role="status" aria-live="polite">
          <VisuallyHidden>{getToolStatusAnnouncement(tool)}</VisuallyHidden>
        </div>

        {/* Header */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={TOOL_HEADER_CLASSES}
          aria-expanded={expanded}
          aria-controls={hasExpandableContent ? contentId : undefined}
          aria-label={`${tool.name}${tool.isError ? ', error' : isInProgress ? ', running' : ''}. ${expanded ? collapseLabel : expandLabel}`}
        >
          <div
            className={cn(
              TOOL_ICON_CONTAINER_CLASSES,
              tool.isError && TOOL_ICON_ERROR_CLASSES,
              isInProgress && TOOL_ICON_RUNNING_CLASSES,
              !tool.isError && !isInProgress && TOOL_ICON_DEFAULT_CLASSES
            )}
            aria-hidden="true"
          >
            {isInProgress ? (
              <Spinner size="sm" announce={false} />
            ) : (
              <Wrench className={cn('h-3.5 w-3.5', tool.isError ? 'text-error' : 'text-primary')} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <Flex align="center" gap="2">
              <code className="text-sm font-semibold text-foreground">{tool.name}</code>
              {tool.isError && (
                <span
                  className={cn(STATUS_BADGE_CLASSES, STATUS_BADGE_ERROR_CLASSES)}
                  aria-hidden="true"
                >
                  {DEFAULT_TOOL_ERROR_LABEL}
                </span>
              )}
              {isInProgress && (
                <span
                  className={cn(STATUS_BADGE_CLASSES, STATUS_BADGE_RUNNING_CLASSES)}
                  aria-hidden="true"
                >
                  {DEFAULT_TOOL_RUNNING_LABEL}
                </span>
              )}
            </Flex>
          </div>

          <Icon
            icon={expanded ? ChevronDown : ChevronRight}
            size="sm"
            className="text-[rgb(var(--muted-foreground))]"
            aria-hidden="true"
          />
        </button>

        {/* Expanded content */}
        {expanded && hasExpandableContent && (
          <div id={contentId} className={TOOL_CONTENT_CLASSES}>
            {hasInput && (
              <div>
                <Text as="p" size="xs" weight="medium" className={TOOL_SECTION_LABEL_CLASSES}>
                  Input
                </Text>
                <pre className={TOOL_PRE_CLASSES}>{JSON.stringify(tool.input, null, 2)}</pre>
              </div>
            )}

            {hasOutput && (
              <div>
                <Text as="p" size="xs" weight="medium" className={TOOL_SECTION_LABEL_CLASSES}>
                  Output
                </Text>
                <pre
                  className={tool.isError ? TOOL_OUTPUT_ERROR_CLASSES : TOOL_OUTPUT_SUCCESS_CLASSES}
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
);

ToolCallCard.displayName = 'ToolCallCard';

// ============================================================================
// Raw Output Section
// ============================================================================

export interface RawOutputSectionProps {
  /** Raw output lines to display */
  output: string[];
  /** Label for the section */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** data-testid attribute */
  'data-testid'?: string;
}

/**
 * RawOutputSection displays collapsible raw terminal output for debugging.
 *
 * @accessibility
 * - Button has aria-expanded state
 * - aria-controls links to content region
 * - Focus ring visible on all backgrounds
 * - Touch target ≥44px
 */
export const RawOutputSection = forwardRef<HTMLDivElement, RawOutputSectionProps>(
  ({ output, label = DEFAULT_RAW_OUTPUT_LABEL, className, 'data-testid': testId }, ref) => {
    const [expanded, setExpanded] = useState(false);
    const contentId = useId();
    const lineCount = output.length;

    if (lineCount === 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(RAW_OUTPUT_CONTAINER_CLASSES, className)}
        data-testid={testId}
        data-line-count={lineCount}
      >
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={RAW_OUTPUT_HEADER_CLASSES}
          aria-expanded={expanded}
          aria-controls={contentId}
          aria-label={`${label}, ${lineCount} line${lineCount === 1 ? '' : 's'}. ${expanded ? 'Collapse' : 'Expand'}`}
        >
          <Code2 className="h-4 w-4 text-[rgb(var(--muted-foreground))]" aria-hidden="true" />
          <Text as="span" size="xs" weight="medium" className="text-[rgb(var(--muted-foreground))]">
            {label} ({lineCount} {lineCount === 1 ? 'line' : 'lines'})
          </Text>
          <Icon
            icon={expanded ? ChevronDown : ChevronRight}
            size="sm"
            className="ml-auto text-[rgb(var(--muted-foreground))]"
            aria-hidden="true"
          />
        </button>

        {expanded && (
          <div id={contentId} className={RAW_OUTPUT_CONTENT_CLASSES}>
            <pre>{output.join('\n')}</pre>
          </div>
        )}
      </div>
    );
  }
);

RawOutputSection.displayName = 'RawOutputSection';

// ============================================================================
// Bubble Message List
// ============================================================================

export interface BubbleMessageListProps {
  /** Child message bubbles */
  children: ReactNode;
  /** Accessible label for the message list */
  'aria-label'?: string;
  /** Additional CSS classes */
  className?: string;
  /** data-testid attribute */
  'data-testid'?: string;
}

/**
 * BubbleMessageList wraps message bubbles in a proper list structure.
 *
 * @accessibility
 * - Uses role="list" for proper semantics
 * - aria-label describes the message list
 */
export const BubbleMessageList = forwardRef<HTMLDivElement, BubbleMessageListProps>(
  (
    { children, 'aria-label': ariaLabel = 'Chat messages', className, 'data-testid': testId },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="list"
        aria-label={ariaLabel}
        className={cn('space-y-4', className)}
        data-testid={testId}
      >
        {children}
      </div>
    );
  }
);

BubbleMessageList.displayName = 'BubbleMessageList';

// ============================================================================
// Bubble Message List Item
// ============================================================================

export interface BubbleMessageListItemProps {
  /** Child message bubble */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * BubbleMessageListItem wraps individual messages for proper list semantics.
 */
export const BubbleMessageListItem = forwardRef<HTMLDivElement, BubbleMessageListItemProps>(
  ({ children, className }, ref) => {
    return (
      <div ref={ref} role="listitem" className={className}>
        {children}
      </div>
    );
  }
);

BubbleMessageListItem.displayName = 'BubbleMessageListItem';
