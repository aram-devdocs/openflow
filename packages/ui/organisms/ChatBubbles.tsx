/**
 * Chat Components for standalone chat view - CLI-style UI
 *
 * These components render messages in a terminal/CLI-like format,
 * similar to Claude Code's terminal output but as actual UI components.
 * Full-width bordered blocks with clear sender labels.
 * Stateless - receives all data via props.
 *
 * Accessibility:
 * - Proper list semantics for message lists
 * - User vs assistant messages differentiated for screen readers
 * - Timestamps accessible with semantic time elements
 * - Expandable sections have proper ARIA controls
 * - Tool status conveyed beyond color (icons + text)
 */

import { Box, Flex, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import {
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  FileCode,
  Terminal,
  User,
  Wrench,
  X,
} from 'lucide-react';
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
// Constants - CLI Style
// ============================================================================

/** Default labels */
export const DEFAULT_USER_LABEL = 'You';
export const DEFAULT_ASSISTANT_LABEL = 'Claude';
export const DEFAULT_STREAMING_LABEL = 'Thinking...';
export const DEFAULT_EXPAND_LABEL = 'Show details';
export const DEFAULT_COLLAPSE_LABEL = 'Hide details';
export const DEFAULT_TOOL_RUNNING_LABEL = 'Running';
export const DEFAULT_TOOL_ERROR_LABEL = 'Error';
export const DEFAULT_RAW_OUTPUT_LABEL = 'Raw output';

/** Avatar size classes */
export const AVATAR_SIZE_CLASSES = {
  sm: 'h-5 w-5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const;

/** Avatar icon size classes */
export const AVATAR_ICON_SIZE_CLASSES = {
  sm: 'h-3 w-3',
  md: 'h-3 w-3',
  lg: 'h-3.5 w-3.5',
} as const;

/** CLI-style message block classes */
export const MESSAGE_BLOCK_CLASSES = 'rounded-lg border border-border bg-card overflow-hidden';

/** Message header classes - CLI style */
export const MESSAGE_HEADER_CLASSES =
  'flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border';

/** Message content area classes */
export const MESSAGE_CONTENT_CLASSES = 'px-3 py-3';

/** User avatar classes - smaller, inline with header */
export const USER_AVATAR_CLASSES =
  'flex shrink-0 items-center justify-center rounded bg-primary/20';

/** Assistant avatar classes - smaller, inline with header */
export const ASSISTANT_AVATAR_CLASSES =
  'flex shrink-0 items-center justify-center rounded bg-gradient-to-br from-orange-500/20 to-amber-600/20';

/** Timestamp classes */
export const TIMESTAMP_CLASSES = 'text-[10px] text-muted-foreground ml-auto';

/** Tool card classes - CLI style */
export const TOOL_CARD_BASE_CLASSES = 'rounded border overflow-hidden mt-2 first:mt-0';
export const TOOL_CARD_DEFAULT_CLASSES = 'border-border bg-background';
export const TOOL_CARD_ERROR_CLASSES = 'border-destructive/30 bg-destructive/5';
export const TOOL_CARD_RUNNING_CLASSES = 'border-blue-500/30 bg-blue-500/5';

/** Tool header button classes */
export const TOOL_HEADER_CLASSES =
  'flex w-full min-h-[36px] items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Tool icon container classes */
export const TOOL_ICON_CONTAINER_CLASSES = 'flex h-5 w-5 items-center justify-center rounded';
export const TOOL_ICON_DEFAULT_CLASSES = 'bg-primary/10';
export const TOOL_ICON_ERROR_CLASSES = 'bg-destructive/20';
export const TOOL_ICON_RUNNING_CLASSES = 'bg-blue-500/20';

/** Tool content classes */
export const TOOL_CONTENT_CLASSES = 'border-t border-border px-3 py-2 space-y-2';
export const TOOL_SECTION_LABEL_CLASSES =
  'text-[10px] font-medium text-muted-foreground uppercase tracking-wide';
export const TOOL_PRE_CLASSES =
  'overflow-x-auto rounded bg-background p-2 text-xs font-mono text-muted-foreground max-h-48';
export const TOOL_OUTPUT_ERROR_CLASSES =
  'max-h-48 overflow-auto rounded p-2 text-xs font-mono bg-destructive/10 text-destructive';
export const TOOL_OUTPUT_SUCCESS_CLASSES =
  'max-h-48 overflow-auto rounded p-2 text-xs font-mono bg-background text-muted-foreground';

/** Status badge classes */
export const STATUS_BADGE_CLASSES = 'rounded px-1.5 py-0.5 text-[10px] font-medium';
export const STATUS_BADGE_ERROR_CLASSES = 'bg-destructive/20 text-destructive';
export const STATUS_BADGE_RUNNING_CLASSES = 'bg-blue-500/20 text-blue-500';

/** Result indicator classes */
export const RESULT_BASE_CLASSES =
  'flex items-center gap-2 rounded px-3 py-2 text-xs font-medium mt-2';
export const RESULT_SUCCESS_CLASSES = 'bg-green-500/10 text-green-500';
export const RESULT_ERROR_CLASSES = 'bg-destructive/10 text-destructive';
export const RESULT_INFO_CLASSES = 'bg-blue-500/10 text-blue-500';

/** Streaming indicator classes */
export const STREAMING_INDICATOR_CLASSES =
  'flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground';

/** Raw output section classes */
export const RAW_OUTPUT_CONTAINER_CLASSES = 'rounded border border-border bg-card mt-2';
export const RAW_OUTPUT_HEADER_CLASSES =
  'flex w-full min-h-[36px] items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring';
export const RAW_OUTPUT_CONTENT_CLASSES =
  'border-t border-border max-h-64 overflow-auto p-3 font-mono text-xs text-muted-foreground';

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
 * Note: output can be empty string for successful tools (like Write)
 * Only undefined means the tool is still running
 */
export function getToolStatus(tool: ToolInfo): 'running' | 'error' | 'complete' {
  if (tool.isError) return 'error';
  if (tool.output === undefined) return 'running';
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

/**
 * Get tool icon based on tool name
 */
function getToolIcon(toolName: string) {
  const name = toolName.toLowerCase();
  if (name.includes('bash') || name.includes('terminal') || name.includes('exec')) {
    return Terminal;
  }
  if (
    name.includes('file') ||
    name.includes('read') ||
    name.includes('write') ||
    name.includes('edit')
  ) {
    return FileCode;
  }
  return Wrench;
}

// ============================================================================
// User Message Block
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
 * UserMessageBubble displays a user message in a CLI-style block.
 * Full-width container with right-aligned header and text content.
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
      <Box
        as="article"
        ref={ref}
        className={cn(MESSAGE_BLOCK_CLASSES, className)}
        aria-label={`${userLabel} said`}
        data-testid={testId}
        data-sender="user"
      >
        {/* Screen reader announcement */}
        <VisuallyHidden>
          <Text as="span" id={`${messageId}-content`}>
            {userLabel} said: {content}
            {timestamp && `. Sent at ${formatTimestampForSR(timestamp)}`}
          </Text>
        </VisuallyHidden>

        {/* Header - right-aligned for user messages */}
        <Box className={cn(MESSAGE_HEADER_CLASSES, 'justify-end')} aria-hidden={true}>
          {timestamp && (
            <Box as="time" dateTime={timestamp} className={TIMESTAMP_CLASSES}>
              {formatTimestamp(timestamp)}
            </Box>
          )}
          <Text as="span" size="xs" weight="semibold" className="text-foreground">
            {userLabel}
          </Text>
          <Box className={cn(USER_AVATAR_CLASSES, AVATAR_SIZE_CLASSES.md)}>
            <User className={cn(AVATAR_ICON_SIZE_CLASSES.md, 'text-primary')} />
          </Box>
        </Box>

        {/* Content - right-aligned text for user messages */}
        <Box className={MESSAGE_CONTENT_CLASSES} aria-hidden={true}>
          <Text
            as="p"
            size="sm"
            leading="relaxed"
            className="whitespace-pre-wrap text-foreground text-right"
          >
            {content}
          </Text>
        </Box>
      </Box>
    );
  }
);

UserMessageBubble.displayName = 'UserMessageBubble';

// ============================================================================
// Assistant Message Block
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
  /** Label for screen readers (default: "Claude") */
  assistantLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** data-testid attribute */
  'data-testid'?: string;
}

/**
 * AssistantMessageBubble displays a persisted assistant message.
 * Full-width CLI-style block with header showing "Claude".
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
      <Box
        as="article"
        ref={ref}
        className={cn(MESSAGE_BLOCK_CLASSES, className)}
        aria-label={`${assistantLabel} said`}
        data-testid={testId}
        data-sender="assistant"
      >
        {/* Screen reader announcement */}
        <VisuallyHidden>
          <Text as="span" id={`${messageId}-content`}>
            {assistantLabel} said: {content}
            {toolCount > 0 && `. Used ${toolCount} tool${toolCount === 1 ? '' : 's'}`}
            {timestamp && `. Sent at ${formatTimestampForSR(timestamp)}`}
          </Text>
        </VisuallyHidden>

        {/* Header */}
        <Box className={MESSAGE_HEADER_CLASSES} aria-hidden={true}>
          <Box className={cn(ASSISTANT_AVATAR_CLASSES, AVATAR_SIZE_CLASSES.md)}>
            <Bot className={cn(AVATAR_ICON_SIZE_CLASSES.md, 'text-orange-500')} />
          </Box>
          <Text as="span" size="xs" weight="semibold" className="text-foreground">
            {assistantLabel}
          </Text>
          {timestamp && (
            <Box as="time" dateTime={timestamp} className={TIMESTAMP_CLASSES}>
              {formatTimestamp(timestamp)}
            </Box>
          )}
        </Box>

        {/* Content */}
        <Box className={MESSAGE_CONTENT_CLASSES} aria-hidden={true}>
          {/* Text content */}
          {content && (
            <Text
              as="p"
              size="sm"
              leading="relaxed"
              className="whitespace-pre-wrap text-foreground"
            >
              {content}
            </Text>
          )}

          {/* Tool calls */}
          {toolsWithResults.length > 0 && (
            <Box
              role="list"
              aria-label={`${toolCount} tool call${toolCount === 1 ? '' : 's'}`}
              className="mt-3 space-y-2"
            >
              {toolsWithResults.map((tool) => (
                <Box key={tool.id} role="listitem">
                  <ToolCallCard tool={tool} />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
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
  /** Label for screen readers (default: "Claude") */
  assistantLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** data-testid attribute */
  'data-testid'?: string;
}

/**
 * StreamingResponse renders Claude's streaming response with text, tools, and results.
 * CLI-style block with header showing "Claude".
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
      <Box
        as="article"
        ref={ref}
        className={cn(MESSAGE_BLOCK_CLASSES, className)}
        aria-label={isStreaming ? `${assistantLabel} is responding` : `${assistantLabel} response`}
        aria-busy={isStreaming}
        data-testid={testId}
        data-sender="assistant"
        data-streaming={isStreaming}
      >
        {/* Screen reader live region for streaming updates */}
        <VisuallyHidden>
          <Box id={regionId} role="status" aria-live="polite" aria-atomic="false">
            {isStreaming ? streamingLabel : `${assistantLabel} said: ${textContent}`}
          </Box>
        </VisuallyHidden>

        {/* Header */}
        <Box className={MESSAGE_HEADER_CLASSES} aria-hidden={true}>
          <Box className={cn(ASSISTANT_AVATAR_CLASSES, AVATAR_SIZE_CLASSES.md)}>
            <Bot className={cn(AVATAR_ICON_SIZE_CLASSES.md, 'text-orange-500')} />
          </Box>
          <Text as="span" size="xs" weight="semibold" className="text-foreground">
            {assistantLabel}
          </Text>
          {isStreaming && (
            <Flex align="center" gap="1" className="ml-2">
              <Spinner size="sm" announce={false} />
              <Text as="span" size="xs" className="text-muted-foreground">
                {streamingLabel}
              </Text>
            </Flex>
          )}
        </Box>

        {/* Content */}
        <Box className={MESSAGE_CONTENT_CLASSES} aria-hidden={true}>
          {/* Render display items */}
          {displayItems.map((item, index) => {
            if (item.type === 'text') {
              return (
                <Text
                  key={`text-${index}`}
                  as="p"
                  size="sm"
                  leading="relaxed"
                  className="whitespace-pre-wrap text-foreground"
                >
                  {item.content}
                </Text>
              );
            }

            if (item.type === 'tool') {
              return (
                <Box key={`tool-${index}`} className="mt-2">
                  <ToolCallCard tool={item.tool} />
                </Box>
              );
            }

            if (item.type === 'result') {
              const isSuccess = item.subtype === 'success';
              const isError = item.subtype === 'error';

              return (
                <Box
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
                  {isSuccess && <Check className="h-3.5 w-3.5" />}
                  {isError && <X className="h-3.5 w-3.5" />}
                  <Text as="span" aria-hidden={true}>
                    {isSuccess ? 'Completed successfully' : `Result: ${item.subtype}`}
                  </Text>
                </Box>
              );
            }

            return null;
          })}

          {/* Raw output toggle */}
          {showRawOutput && rawOutput.length > 0 && <RawOutputSection output={rawOutput} />}
        </Box>
      </Box>
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
 * CLI-style with tool name prominent and status indicators.
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
    // hasOutput checks if there's non-empty content to display in the expanded section
    const hasOutput = tool.output !== undefined && tool.output.length > 0;
    const hasInput = tool.input && Object.keys(tool.input).length > 0;
    // isInProgress checks if tool is still running (output undefined, not just empty)
    const isInProgress = tool.output === undefined && !tool.isError;
    const hasExpandableContent = hasInput || hasOutput;
    const status = getToolStatus(tool);
    const ToolIcon = getToolIcon(tool.name);

    return (
      <Box
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
        <Box role="status" aria-live="polite">
          <VisuallyHidden>{getToolStatusAnnouncement(tool)}</VisuallyHidden>
        </Box>

        {/* Header */}
        <Box
          as="button"
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={TOOL_HEADER_CLASSES}
          aria-expanded={expanded}
          aria-controls={hasExpandableContent ? contentId : undefined}
          aria-label={`${tool.name}${tool.isError ? ', error' : isInProgress ? ', running' : ''}. ${expanded ? collapseLabel : expandLabel}`}
        >
          <Box
            className={cn(
              TOOL_ICON_CONTAINER_CLASSES,
              tool.isError && TOOL_ICON_ERROR_CLASSES,
              isInProgress && TOOL_ICON_RUNNING_CLASSES,
              !tool.isError && !isInProgress && TOOL_ICON_DEFAULT_CLASSES
            )}
            aria-hidden={true}
          >
            {isInProgress ? (
              <Spinner size="sm" announce={false} />
            ) : (
              <ToolIcon
                className={cn('h-3 w-3', tool.isError ? 'text-destructive' : 'text-primary')}
              />
            )}
          </Box>

          <Box className="min-w-0 flex-1">
            <Flex align="center" gap="2">
              <Box as="code" className="text-xs font-semibold text-foreground font-mono">
                {tool.name}
              </Box>
              {tool.isError && (
                <Text
                  as="span"
                  className={cn(STATUS_BADGE_CLASSES, STATUS_BADGE_ERROR_CLASSES)}
                  aria-hidden={true}
                >
                  {DEFAULT_TOOL_ERROR_LABEL}
                </Text>
              )}
              {isInProgress && (
                <Text
                  as="span"
                  className={cn(STATUS_BADGE_CLASSES, STATUS_BADGE_RUNNING_CLASSES)}
                  aria-hidden={true}
                >
                  {DEFAULT_TOOL_RUNNING_LABEL}
                </Text>
              )}
            </Flex>
          </Box>

          <Icon
            icon={expanded ? ChevronDown : ChevronRight}
            size="sm"
            className="text-muted-foreground"
            aria-hidden={true}
          />
        </Box>

        {/* Expanded content */}
        {expanded && hasExpandableContent && (
          <Box id={contentId} className={TOOL_CONTENT_CLASSES}>
            {hasInput && (
              <Box>
                <Text as="p" className={TOOL_SECTION_LABEL_CLASSES}>
                  Input
                </Text>
                <Box as="pre" className={TOOL_PRE_CLASSES}>
                  {JSON.stringify(tool.input, null, 2)}
                </Box>
              </Box>
            )}

            {hasOutput && (
              <Box>
                <Text as="p" className={TOOL_SECTION_LABEL_CLASSES}>
                  Output
                </Text>
                <Box
                  as="pre"
                  className={tool.isError ? TOOL_OUTPUT_ERROR_CLASSES : TOOL_OUTPUT_SUCCESS_CLASSES}
                >
                  {tool.output}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
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
      <Box
        ref={ref}
        className={cn(RAW_OUTPUT_CONTAINER_CLASSES, className)}
        data-testid={testId}
        data-line-count={lineCount}
      >
        <Box
          as="button"
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={RAW_OUTPUT_HEADER_CLASSES}
          aria-expanded={expanded}
          aria-controls={contentId}
          aria-label={`${label}, ${lineCount} line${lineCount === 1 ? '' : 's'}. ${expanded ? 'Collapse' : 'Expand'}`}
        >
          <Code2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden={true} />
          <Text as="span" size="xs" weight="medium" className="text-muted-foreground">
            {label} ({lineCount} {lineCount === 1 ? 'line' : 'lines'})
          </Text>
          <Icon
            icon={expanded ? ChevronDown : ChevronRight}
            size="sm"
            className="ml-auto text-muted-foreground"
            aria-hidden={true}
          />
        </Box>

        {expanded && (
          <Box id={contentId} className={RAW_OUTPUT_CONTENT_CLASSES}>
            <Box as="pre">{output.join('\n')}</Box>
          </Box>
        )}
      </Box>
    );
  }
);

RawOutputSection.displayName = 'RawOutputSection';

// ============================================================================
// Message List
// ============================================================================

export interface BubbleMessageListProps {
  /** Child message blocks */
  children: ReactNode;
  /** Accessible label for the message list */
  'aria-label'?: string;
  /** Additional CSS classes */
  className?: string;
  /** data-testid attribute */
  'data-testid'?: string;
}

/**
 * BubbleMessageList wraps message blocks in a proper list structure.
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
      <Box
        ref={ref}
        role="list"
        aria-label={ariaLabel}
        className={cn('space-y-3', className)}
        data-testid={testId}
      >
        {children}
      </Box>
    );
  }
);

BubbleMessageList.displayName = 'BubbleMessageList';

// ============================================================================
// Message List Item
// ============================================================================

export interface BubbleMessageListItemProps {
  /** Child message block */
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
      <Box ref={ref} role="listitem" className={className}>
        {children}
      </Box>
    );
  }
);

BubbleMessageListItem.displayName = 'BubbleMessageListItem';
