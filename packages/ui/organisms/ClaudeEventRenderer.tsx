import { Box, Flex, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import {
  AlertCircle,
  Bot,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Terminal,
  Wrench,
} from 'lucide-react';
import { forwardRef, useId, useState } from 'react';
import { Icon } from '../atoms/Icon';
import { Spinner } from '../atoms/Spinner';

// ============================================================================
// Types
// ============================================================================

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

/** Content block in an assistant message */
interface AssistantContentBlock {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

/** Content block in a user message (tool results) */
interface UserContentBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface ClaudeAssistantEvent {
  type: 'assistant';
  message: {
    content?: AssistantContentBlock[];
  };
}

export interface ClaudeUserEvent {
  type: 'user';
  message: {
    content?: UserContentBlock[];
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
export type GroupedEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_group'; tools: ToolInfo[] }
  | { type: 'system'; subtype: string; data: Record<string, unknown> }
  | { type: 'result'; subtype: string; data: Record<string, unknown> };

export interface ToolInfo {
  id?: string;
  name: string;
  input?: Record<string, unknown>;
  output?: string;
  isError?: boolean;
}

/** Responsive size values */
export type ClaudeEventRendererSize = 'sm' | 'md' | 'lg';

/** Breakpoint keys for responsive values */
export type ClaudeEventRendererBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Responsive value type */
export type ResponsiveValue<T> = T | Partial<Record<ClaudeEventRendererBreakpoint, T>>;

export interface ClaudeEventRendererProps {
  /** Array of Claude events to render */
  events: ClaudeEvent[];
  /** Whether output is currently streaming */
  isStreaming?: boolean;
  /** Whether to show raw output section */
  showRawOutput?: boolean;
  /** Raw output lines (unparsed) */
  rawOutput?: string[];
  /** Responsive size variant */
  size?: ResponsiveValue<ClaudeEventRendererSize>;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the output region */
  'aria-label'?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Default accessible labels */
export const DEFAULT_OUTPUT_LABEL = 'Claude output';
export const DEFAULT_STREAMING_LABEL = 'Claude is thinking...';
export const DEFAULT_EMPTY_LABEL = 'No output yet. Send a message to start.';
export const DEFAULT_TOOL_EXPAND_LABEL = 'Expand tool details';
export const DEFAULT_TOOL_COLLAPSE_LABEL = 'Collapse tool details';
export const DEFAULT_SHOW_INPUT_LABEL = 'Show input';
export const DEFAULT_HIDE_INPUT_LABEL = 'Hide input';
export const DEFAULT_SHOW_OUTPUT_LABEL = 'Show output';
export const DEFAULT_HIDE_OUTPUT_LABEL = 'Hide output';
export const DEFAULT_RAW_EXPAND_LABEL = 'Expand raw output';
export const DEFAULT_RAW_COLLAPSE_LABEL = 'Collapse raw output';

/** Screen reader announcements */
export const SR_STREAMING_START = 'Claude is generating a response';
export const SR_STREAMING_COMPLETE = 'Claude finished responding';
export const SR_TOOL_STARTED = 'Tool started:';
export const SR_TOOL_COMPLETED = 'Tool completed:';
export const SR_TOOL_ERROR = 'Tool error:';
export const SR_SYSTEM_EVENT = 'System event:';
export const SR_RESULT_EVENT = 'Result:';

/** Size class mappings */
export const CLAUDE_EVENT_SIZE_CLASSES: Record<ClaudeEventRendererSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export const CLAUDE_EVENT_GAP_CLASSES: Record<ClaudeEventRendererSize, string> = {
  sm: 'space-y-3',
  md: 'space-y-4',
  lg: 'space-y-5',
};

export const CLAUDE_EVENT_AVATAR_CLASSES: Record<ClaudeEventRendererSize, string> = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

export const CLAUDE_EVENT_BUBBLE_PADDING_CLASSES: Record<ClaudeEventRendererSize, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-5 py-4',
};

export const CLAUDE_EVENT_TOOL_PADDING_CLASSES: Record<ClaudeEventRendererSize, string> = {
  sm: 'px-2 py-1.5',
  md: 'px-3 py-2',
  lg: 'px-4 py-3',
};

/** Base classes */
export const CLAUDE_EVENT_BASE_CLASSES = 'w-full';
export const CLAUDE_EVENT_TEXT_BUBBLE_CLASSES =
  'rounded-2xl rounded-tl-sm bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]';
export const CLAUDE_EVENT_AVATAR_BASE_CLASSES =
  'shrink-0 flex items-center justify-center rounded-full bg-[rgb(var(--primary))]';
export const CLAUDE_EVENT_TOOL_GROUP_CLASSES = 'rounded-lg border motion-safe:transition-colors';
export const CLAUDE_EVENT_TOOL_GROUP_DEFAULT_CLASSES =
  'border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50';
export const CLAUDE_EVENT_TOOL_GROUP_ERROR_CLASSES =
  'border-[rgb(var(--destructive))]/30 bg-[rgb(var(--destructive))]/10';
export const CLAUDE_EVENT_TOOL_HEADER_CLASSES =
  'flex w-full items-center gap-2 text-left hover:bg-[rgb(var(--muted))]/50 motion-safe:transition-colors rounded-lg min-h-[44px]';
export const CLAUDE_EVENT_TOOL_ITEM_CLASSES = 'rounded border motion-safe:transition-colors';
export const CLAUDE_EVENT_TOOL_ITEM_DEFAULT_CLASSES =
  'border-[rgb(var(--border))] bg-[rgb(var(--background))]';
export const CLAUDE_EVENT_TOOL_ITEM_ERROR_CLASSES =
  'border-[rgb(var(--destructive))]/30 bg-[rgb(var(--destructive))]/5';
export const CLAUDE_EVENT_SYSTEM_CLASSES =
  'rounded border border-[rgb(var(--warning))]/20 bg-[rgb(var(--warning))]/10';
export const CLAUDE_EVENT_RESULT_SUCCESS_CLASSES =
  'rounded border border-[rgb(var(--success))]/20 bg-[rgb(var(--success))]/10';
export const CLAUDE_EVENT_RESULT_ERROR_CLASSES =
  'rounded border border-[rgb(var(--destructive))]/20 bg-[rgb(var(--destructive))]/10';
export const CLAUDE_EVENT_RAW_OUTPUT_CLASSES =
  'rounded border border-[rgb(var(--border))] bg-[rgb(var(--muted))]/30';
export const CLAUDE_EVENT_CODE_BLOCK_CLASSES =
  'overflow-x-auto rounded bg-[rgb(var(--muted))] p-2 font-mono';
export const CLAUDE_EVENT_TOGGLE_BUTTON_CLASSES =
  'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-xs text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2';
export const CLAUDE_EVENT_STREAMING_CLASSES =
  'flex items-center gap-2 text-[rgb(var(--muted-foreground))]';
export const CLAUDE_EVENT_EMPTY_CLASSES =
  'flex items-center gap-2 py-4 text-[rgb(var(--muted-foreground))]';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size from a responsive value
 */
export function getBaseSize(
  size: ResponsiveValue<ClaudeEventRendererSize>
): ClaudeEventRendererSize {
  if (typeof size === 'string') {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Get responsive size classes from a responsive value
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ClaudeEventRendererSize>,
  classMap: Record<ClaudeEventRendererSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointOrder: ClaudeEventRendererBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

  for (const breakpoint of breakpointOrder) {
    const value = size[breakpoint];
    if (value) {
      const sizeClass = classMap[value];
      if (breakpoint === 'base') {
        classes.push(sizeClass);
      } else {
        // Add breakpoint prefix to each class
        const prefixedClasses = sizeClass
          .split(' ')
          .map((c) => `${breakpoint}:${c}`)
          .join(' ');
        classes.push(prefixedClasses);
      }
    }
  }

  return classes.join(' ');
}

/**
 * Group events into renderable chunks.
 * Shows events inline in conversation order - each tool call appears where it happens.
 */
export function groupEvents(events: ClaudeEvent[]): GroupedEvent[] {
  const groups: GroupedEvent[] = [];
  // Map of pending tools by their ID, waiting for results
  const pendingTools = new Map<string, Partial<ToolInfo>>();

  for (const event of events) {
    if (event.type === 'assistant') {
      const { message } = event;

      if (message.content && Array.isArray(message.content)) {
        for (const block of message.content) {
          if (block.type === 'text' && block.text) {
            groups.push({ type: 'text', content: block.text });
          } else if (block.type === 'tool_use' && block.name && block.id) {
            // Store pending tool by its ID
            pendingTools.set(block.id, {
              id: block.id,
              name: block.name,
              input: block.input,
            });
          }
        }
      }
    } else if (event.type === 'user') {
      const { message } = event;

      // User message content is an array of tool_result blocks
      if (message.content && Array.isArray(message.content)) {
        for (const block of message.content) {
          if (block.type === 'tool_result' && block.tool_use_id) {
            const pendingTool = pendingTools.get(block.tool_use_id);
            if (pendingTool) {
              // Complete the tool with its result and add as single-tool group (inline)
              const completedTool: ToolInfo = {
                ...pendingTool,
                name: pendingTool.name ?? 'unknown_tool',
                output: block.content,
                isError: block.is_error,
              };
              groups.push({ type: 'tool_group', tools: [completedTool] });
              pendingTools.delete(block.tool_use_id);
            }
          }
        }
      }
    } else if (event.type === 'system') {
      groups.push({ type: 'system', subtype: event.subtype, data: event.data ?? {} });
    } else if (event.type === 'result') {
      groups.push({ type: 'result', subtype: event.subtype, data: event.data ?? {} });
    }
  }

  // Add any remaining pending tools (tools without results yet - still in progress)
  for (const pendingTool of pendingTools.values()) {
    const inProgressTool: ToolInfo = {
      ...pendingTool,
      name: pendingTool.name ?? 'unknown_tool',
    };
    groups.push({ type: 'tool_group', tools: [inProgressTool] });
  }

  return groups;
}

/**
 * Get a screen reader announcement for a tool event
 */
export function getToolAnnouncement(tool: ToolInfo): string {
  if (tool.output === undefined) {
    return `${SR_TOOL_STARTED} ${tool.name}`;
  }
  if (tool.isError) {
    return `${SR_TOOL_ERROR} ${tool.name}`;
  }
  return `${SR_TOOL_COMPLETED} ${tool.name}`;
}

/**
 * Get result type from subtype
 */
export function getResultType(subtype: string): 'success' | 'error' | 'info' {
  if (subtype === 'success') return 'success';
  if (subtype === 'error' || subtype === 'failure') return 'error';
  return 'info';
}

/**
 * Get result announcement for screen readers
 */
export function getResultAnnouncement(subtype: string): string {
  const type = getResultType(subtype);
  if (type === 'success') return 'Task completed successfully';
  if (type === 'error') return 'Task encountered an error';
  return `Task ${subtype}`;
}

// ============================================================================
// Sub-Components
// ============================================================================

/** Props for TextBlock */
interface TextBlockProps {
  content: string;
  size: ClaudeEventRendererSize;
  'data-testid'?: string;
}

/** Assistant message block - renders as a chat bubble */
const TextBlock = forwardRef<HTMLDivElement, TextBlockProps>(
  ({ content, size, 'data-testid': testId }, ref) => {
    const avatarClasses = CLAUDE_EVENT_AVATAR_CLASSES[size];
    const paddingClasses = CLAUDE_EVENT_BUBBLE_PADDING_CLASSES[size];

    return (
      <Flex
        ref={ref}
        className="justify-start"
        data-testid={testId}
        role="article"
        aria-label="Assistant message"
      >
        <Flex className="max-w-[85%] gap-3">
          <Box className={cn(CLAUDE_EVENT_AVATAR_BASE_CLASSES, avatarClasses)} aria-hidden={true}>
            <Icon icon={Bot} size="sm" className="text-[rgb(var(--primary-foreground))]" />
          </Box>
          <Box className={cn(CLAUDE_EVENT_TEXT_BUBBLE_CLASSES, paddingClasses)}>
            <Text
              as="p"
              size={size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'base'}
              leading="relaxed"
              className="whitespace-pre-wrap"
            >
              {content}
            </Text>
          </Box>
        </Flex>
      </Flex>
    );
  }
);

TextBlock.displayName = 'TextBlock';

/** Props for ToolCallGroup */
interface ToolCallGroupProps {
  tools: ToolInfo[];
  size: ClaudeEventRendererSize;
  defaultExpanded?: boolean;
  'data-testid'?: string;
}

/** Collapsible tool call group */
const ToolCallGroup = forwardRef<HTMLDivElement, ToolCallGroupProps>(
  ({ tools, size, defaultExpanded = false, 'data-testid': testId }, ref) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const hasErrors = tools.some((t) => t.isError);
    const contentId = useId();
    const paddingClasses = CLAUDE_EVENT_TOOL_PADDING_CLASSES[size];
    const textSize = size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'base';

    // Count in-progress, completed, and error tools
    const inProgress = tools.filter((t) => t.output === undefined).length;
    const errors = tools.filter((t) => t.isError).length;

    // Build accessible label
    const toolSummary = `${tools.length} ${tools.length === 1 ? 'tool' : 'tools'} used`;
    const statusParts: string[] = [];
    if (inProgress > 0) statusParts.push(`${inProgress} in progress`);
    if (errors > 0) statusParts.push(`${errors} ${errors === 1 ? 'error' : 'errors'}`);
    const accessibleLabel =
      statusParts.length > 0 ? `${toolSummary}, ${statusParts.join(', ')}` : toolSummary;

    return (
      <Box
        ref={ref}
        className={cn(
          CLAUDE_EVENT_TOOL_GROUP_CLASSES,
          hasErrors
            ? CLAUDE_EVENT_TOOL_GROUP_ERROR_CLASSES
            : CLAUDE_EVENT_TOOL_GROUP_DEFAULT_CLASSES
        )}
        data-testid={testId}
        data-has-errors={hasErrors}
        data-expanded={expanded}
      >
        {/* Header - always visible */}
        <Box
          as="button"
          type="button"
          className={cn(CLAUDE_EVENT_TOOL_HEADER_CLASSES, paddingClasses)}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls={contentId}
          aria-label={expanded ? DEFAULT_TOOL_COLLAPSE_LABEL : DEFAULT_TOOL_EXPAND_LABEL}
        >
          <Icon
            icon={expanded ? ChevronDown : ChevronRight}
            size="sm"
            className="text-[rgb(var(--muted-foreground))]"
          />
          <Icon
            icon={Wrench}
            size="sm"
            className={hasErrors ? 'text-[rgb(var(--destructive))]' : 'text-[rgb(var(--primary))]'}
          />
          <Text as="span" size={textSize} weight="medium">
            {tools.length} {tools.length === 1 ? 'tool' : 'tools'} used
          </Text>
          {/* Screen reader accessible summary */}
          <VisuallyHidden>{accessibleLabel}</VisuallyHidden>
          {hasErrors && (
            <Text
              as="span"
              size="xs"
              className="ml-auto text-[rgb(var(--destructive))]"
              aria-hidden={true}
            >
              {errors} error{errors !== 1 ? 's' : ''}
            </Text>
          )}
          {inProgress > 0 && !hasErrors && (
            <Flex className="ml-auto items-center gap-1">
              <Spinner size="xs" announce={false} />
              <Text as="span" size="xs" className="text-[rgb(var(--muted-foreground))]">
                {inProgress} running
              </Text>
            </Flex>
          )}
        </Box>

        {/* Expanded content */}
        {expanded && (
          <Box
            id={contentId}
            className="space-y-2 border-t border-[rgb(var(--border))] px-3 py-2"
            role="list"
            aria-label="Tool calls"
          >
            {tools.map((tool, index) => (
              <ToolCallItem
                key={tool.id ?? `tool-${index}`}
                tool={tool}
                size={size}
                data-testid={testId ? `${testId}-tool-${index}` : undefined}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  }
);

ToolCallGroup.displayName = 'ToolCallGroup';

/** Props for ToolCallItem */
interface ToolCallItemProps {
  tool: ToolInfo;
  size: ClaudeEventRendererSize;
  'data-testid'?: string;
}

/** Single tool call item */
const ToolCallItem = forwardRef<HTMLDivElement, ToolCallItemProps>(
  ({ tool, size, 'data-testid': testId }, ref) => {
    const [showInput, setShowInput] = useState(false);
    const [showOutput, setShowOutput] = useState(false);
    const hasInput = tool.input && Object.keys(tool.input).length > 0;
    const hasOutput = tool.output && tool.output.length > 0;
    const isInProgress = tool.output === undefined;
    const inputId = useId();
    const outputId = useId();
    const textSize = size === 'sm' ? 'xs' : size === 'md' ? 'xs' : 'sm';

    // Build status announcement
    const status = isInProgress ? 'running' : tool.isError ? 'error' : 'completed';

    return (
      <Box
        ref={ref}
        className={cn(
          CLAUDE_EVENT_TOOL_ITEM_CLASSES,
          'p-2',
          tool.isError
            ? CLAUDE_EVENT_TOOL_ITEM_ERROR_CLASSES
            : CLAUDE_EVENT_TOOL_ITEM_DEFAULT_CLASSES
        )}
        role="listitem"
        data-testid={testId}
        data-tool-name={tool.name}
        data-tool-status={status}
      >
        {/* Tool name and status */}
        <Flex className="items-center gap-2">
          <Box
            as="code"
            className={cn(
              'text-xs font-medium',
              tool.isError ? 'text-[rgb(var(--destructive))]' : 'text-[rgb(var(--primary))]'
            )}
          >
            {tool.name}
          </Box>
          {tool.isError && (
            <>
              <Icon
                icon={AlertCircle}
                size="xs"
                className="text-[rgb(var(--destructive))]"
                aria-label="Error"
              />
              <Text as="span" size="xs" className="text-[rgb(var(--destructive))]">
                Error
              </Text>
            </>
          )}
          {isInProgress && (
            <>
              <Spinner size="xs" announce={false} />
              <Text as="span" size="xs" className="text-[rgb(var(--muted-foreground))]">
                Running...
              </Text>
            </>
          )}
          {!isInProgress && !tool.isError && (
            <Icon
              icon={CheckCircle}
              size="xs"
              className="text-[rgb(var(--success))]"
              aria-label="Completed"
            />
          )}
        </Flex>

        {/* Input toggle */}
        {hasInput && (
          <Box className="mt-2">
            <Box
              as="button"
              type="button"
              className={CLAUDE_EVENT_TOGGLE_BUTTON_CLASSES}
              onClick={() => setShowInput(!showInput)}
              aria-expanded={showInput}
              aria-controls={inputId}
            >
              {showInput ? DEFAULT_HIDE_INPUT_LABEL : DEFAULT_SHOW_INPUT_LABEL}
            </Box>
            {showInput && (
              <Box
                as="pre"
                id={inputId}
                className={cn(CLAUDE_EVENT_CODE_BLOCK_CLASSES, 'mt-1', `text-${textSize}`)}
              >
                {JSON.stringify(tool.input, null, 2)}
              </Box>
            )}
          </Box>
        )}

        {/* Output */}
        {hasOutput && (
          <Box className="mt-2">
            <Box
              as="button"
              type="button"
              className={CLAUDE_EVENT_TOGGLE_BUTTON_CLASSES}
              onClick={() => setShowOutput(!showOutput)}
              aria-expanded={showOutput}
              aria-controls={outputId}
            >
              {showOutput ? DEFAULT_HIDE_OUTPUT_LABEL : DEFAULT_SHOW_OUTPUT_LABEL}
            </Box>
            {showOutput && (
              <Box
                as="pre"
                id={outputId}
                className={cn(
                  'mt-1 max-h-40 overflow-auto rounded p-2 font-mono',
                  `text-${textSize}`,
                  tool.isError
                    ? 'bg-[rgb(var(--destructive))]/10 text-[rgb(var(--destructive))]'
                    : 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]'
                )}
              >
                {tool.output}
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  }
);

ToolCallItem.displayName = 'ToolCallItem';

/** Props for SystemEventBlock */
interface SystemEventBlockProps {
  subtype: string;
  data: Record<string, unknown>;
  size: ClaudeEventRendererSize;
  'data-testid'?: string;
}

/** System event display */
const SystemEventBlock = forwardRef<HTMLDivElement, SystemEventBlockProps>(
  ({ subtype, data, size, 'data-testid': testId }, ref) => {
    const textSize = size === 'sm' ? 'xs' : size === 'md' ? 'xs' : 'sm';
    const hasData = Object.keys(data).length > 0;

    return (
      <Box
        ref={ref}
        className={cn(CLAUDE_EVENT_SYSTEM_CLASSES, CLAUDE_EVENT_TOOL_PADDING_CLASSES[size])}
        role="status"
        aria-label={`${SR_SYSTEM_EVENT} ${subtype}`}
        data-testid={testId}
        data-subtype={subtype}
      >
        <Text as="span" size={textSize} weight="medium" className="text-[rgb(var(--warning))]">
          System: {subtype}
        </Text>
        {hasData && (
          <Box
            as="pre"
            className={cn('mt-1 font-mono text-[rgb(var(--warning))]/70', `text-${textSize}`)}
          >
            {JSON.stringify(data, null, 2)}
          </Box>
        )}
      </Box>
    );
  }
);

SystemEventBlock.displayName = 'SystemEventBlock';

/** Props for ResultEventBlock */
interface ResultEventBlockProps {
  subtype: string;
  data: Record<string, unknown>;
  size: ClaudeEventRendererSize;
  'data-testid'?: string;
}

/** Result event display */
const ResultEventBlock = forwardRef<HTMLDivElement, ResultEventBlockProps>(
  ({ subtype, data, size, 'data-testid': testId }, ref) => {
    const textSize = size === 'sm' ? 'xs' : size === 'md' ? 'xs' : 'sm';
    const hasData = Object.keys(data).length > 0;
    const resultType = getResultType(subtype);
    const isError = resultType === 'error';
    const announcement = getResultAnnouncement(subtype);

    return (
      <Box
        ref={ref}
        className={cn(
          isError ? CLAUDE_EVENT_RESULT_ERROR_CLASSES : CLAUDE_EVENT_RESULT_SUCCESS_CLASSES,
          CLAUDE_EVENT_TOOL_PADDING_CLASSES[size]
        )}
        role="status"
        aria-label={announcement}
        data-testid={testId}
        data-subtype={subtype}
        data-result-type={resultType}
      >
        <Flex className="items-center gap-2">
          <Icon
            icon={isError ? AlertCircle : CheckCircle}
            size="sm"
            className={isError ? 'text-[rgb(var(--destructive))]' : 'text-[rgb(var(--success))]'}
          />
          <Text
            as="span"
            size={textSize}
            weight="medium"
            className={isError ? 'text-[rgb(var(--destructive))]' : 'text-[rgb(var(--success))]'}
          >
            Result: {subtype}
          </Text>
        </Flex>
        {hasData && (
          <Box
            as="pre"
            className={cn(
              'mt-1 font-mono',
              `text-${textSize}`,
              isError ? 'text-[rgb(var(--destructive))]/70' : 'text-[rgb(var(--success))]/70'
            )}
          >
            {JSON.stringify(data, null, 2)}
          </Box>
        )}
      </Box>
    );
  }
);

ResultEventBlock.displayName = 'ResultEventBlock';

/** Props for RawOutputBlock */
interface RawOutputBlockProps {
  output: string[];
  size: ClaudeEventRendererSize;
  'data-testid'?: string;
}

/** Raw output block for debugging */
const RawOutputBlock = forwardRef<HTMLDivElement, RawOutputBlockProps>(
  ({ output, size, 'data-testid': testId }, ref) => {
    const [expanded, setExpanded] = useState(false);
    const contentId = useId();
    const paddingClasses = CLAUDE_EVENT_TOOL_PADDING_CLASSES[size];

    return (
      <Box
        ref={ref}
        className={CLAUDE_EVENT_RAW_OUTPUT_CLASSES}
        data-testid={testId}
        data-expanded={expanded}
        data-line-count={output.length}
      >
        <Box
          as="button"
          type="button"
          className={cn(
            'flex w-full items-center gap-2 text-left',
            'hover:bg-[rgb(var(--muted))]/50 motion-safe:transition-colors',
            'min-h-[44px]',
            paddingClasses
          )}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls={contentId}
          aria-label={expanded ? DEFAULT_RAW_COLLAPSE_LABEL : DEFAULT_RAW_EXPAND_LABEL}
        >
          <Icon
            icon={expanded ? ChevronDown : ChevronRight}
            size="sm"
            className="text-[rgb(var(--muted-foreground))]"
          />
          <Icon icon={Terminal} size="sm" className="text-[rgb(var(--muted-foreground))]" />
          <Text as="span" size="xs" weight="medium" className="text-[rgb(var(--muted-foreground))]">
            Raw output ({output.length} lines)
          </Text>
        </Box>
        {expanded && (
          <Box
            as="pre"
            id={contentId}
            className="max-h-60 overflow-auto border-t border-[rgb(var(--border))] bg-[rgb(var(--background))] p-3 font-mono text-xs text-[rgb(var(--muted-foreground))]"
          >
            {output.join('\n')}
          </Box>
        )}
      </Box>
    );
  }
);

RawOutputBlock.displayName = 'RawOutputBlock';

// ============================================================================
// Main Component
// ============================================================================

/**
 * ClaudeEventRenderer component for displaying streaming Claude Code output.
 * Stateless - receives all data via props, no hooks or data fetching.
 *
 * Features:
 * - Groups tool calls into collapsible sections
 * - Renders text content with formatting
 * - Shows streaming indicator when generating
 * - Optional raw output display for debugging
 * - Full accessibility with ARIA roles and screen reader announcements
 * - Responsive sizing support
 *
 * @example
 * ```tsx
 * const { events, isStreaming, rawOutput } = useClaudeEvents(processId);
 *
 * <ClaudeEventRenderer
 *   events={events}
 *   isStreaming={isStreaming}
 *   rawOutput={rawOutput}
 *   size={{ base: 'sm', md: 'md' }}
 * />
 * ```
 */
export const ClaudeEventRenderer = forwardRef<HTMLDivElement, ClaudeEventRendererProps>(
  (
    {
      events,
      isStreaming = false,
      showRawOutput = false,
      rawOutput = [],
      size = 'md',
      className,
      'aria-label': ariaLabel = DEFAULT_OUTPUT_LABEL,
      'data-testid': testId,
    },
    ref
  ) => {
    const groupedEvents = groupEvents(events);
    const hasContent = groupedEvents.length > 0 || rawOutput.length > 0;
    const baseSize = getBaseSize(size);
    const gapClasses = getResponsiveSizeClasses(size, CLAUDE_EVENT_GAP_CLASSES);
    const textClasses = getResponsiveSizeClasses(size, CLAUDE_EVENT_SIZE_CLASSES);

    return (
      <Box
        ref={ref}
        className={cn(CLAUDE_EVENT_BASE_CLASSES, gapClasses, textClasses, className)}
        role="log"
        aria-label={ariaLabel}
        aria-live="polite"
        aria-atomic="false"
        data-testid={testId}
        data-streaming={isStreaming}
        data-size={baseSize}
        data-event-count={events.length}
      >
        {/* Screen reader announcements for streaming state */}
        {isStreaming && (
          <Text as="span" role="status" aria-live="polite" className="sr-only">
            {SR_STREAMING_START}
          </Text>
        )}

        {/* Grouped events */}
        {groupedEvents.map((group, index) => {
          const key = `group-${index}`;

          if (group.type === 'text') {
            return (
              <TextBlock
                key={key}
                content={group.content}
                size={baseSize}
                data-testid={testId ? `${testId}-text-${index}` : undefined}
              />
            );
          }

          if (group.type === 'tool_group') {
            return (
              <ToolCallGroup
                key={key}
                tools={group.tools}
                size={baseSize}
                data-testid={testId ? `${testId}-tools-${index}` : undefined}
              />
            );
          }

          if (group.type === 'system') {
            return (
              <SystemEventBlock
                key={key}
                subtype={group.subtype}
                data={group.data}
                size={baseSize}
                data-testid={testId ? `${testId}-system-${index}` : undefined}
              />
            );
          }

          if (group.type === 'result') {
            return (
              <ResultEventBlock
                key={key}
                subtype={group.subtype}
                data={group.data}
                size={baseSize}
                data-testid={testId ? `${testId}-result-${index}` : undefined}
              />
            );
          }

          return null;
        })}

        {/* Streaming indicator */}
        {isStreaming && (
          <Flex
            className={cn(CLAUDE_EVENT_STREAMING_CLASSES, textClasses)}
            role="status"
            aria-label={DEFAULT_STREAMING_LABEL}
          >
            <Spinner size="sm" announce={false} />
            <Text as="span" size={baseSize === 'sm' ? 'xs' : 'sm'}>
              Claude is thinking...
            </Text>
          </Flex>
        )}

        {/* Empty state */}
        {!hasContent && !isStreaming && (
          <Flex
            className={cn(CLAUDE_EVENT_EMPTY_CLASSES, textClasses)}
            role="status"
            aria-label={DEFAULT_EMPTY_LABEL}
          >
            <Icon icon={Bot} size="sm" />
            <Text as="span" size={baseSize === 'sm' ? 'xs' : 'sm'}>
              No output yet. Send a message to start.
            </Text>
          </Flex>
        )}

        {/* Raw output (debug view) */}
        {showRawOutput && rawOutput.length > 0 && (
          <RawOutputBlock
            output={rawOutput}
            size={baseSize}
            data-testid={testId ? `${testId}-raw` : undefined}
          />
        )}
      </Box>
    );
  }
);

ClaudeEventRenderer.displayName = 'ClaudeEventRenderer';

// Export sub-components for direct usage if needed
export {
  TextBlock,
  ToolCallGroup,
  ToolCallItem,
  SystemEventBlock,
  ResultEventBlock,
  RawOutputBlock,
};
export type {
  TextBlockProps,
  ToolCallGroupProps,
  ToolCallItemProps,
  SystemEventBlockProps,
  ResultEventBlockProps,
  RawOutputBlockProps,
};
