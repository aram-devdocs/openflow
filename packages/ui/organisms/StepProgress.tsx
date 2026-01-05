/**
 * StepProgress - Live agent event and tool state display for task steps
 *
 * This component displays real-time progress for a task step including:
 * - Agent events (messages, tool calls, errors)
 * - Tool states (running, completed, error)
 * - Optional terminal output
 *
 * Architecture:
 * - Pure view layer - receives all data via props
 * - No direct data fetching - uses hooks from parent component
 * - Works with UnifiedAgentEvent and ToolState types
 *
 * @module StepProgress
 */

import type {
  AgentEventRecord,
  StepStatus,
  ToolStateSummary,
  ToolStatus,
} from '@openflow/generated';
import type {
  ContentBlock,
  UnifiedAgentEvent,
  UnifiedAgentEventComplete,
  UnifiedAgentEventError,
  UnifiedAgentEventInit,
  UnifiedAgentEventMessage,
  UnifiedAgentEventToolResult,
  UnifiedAgentEventToolUse,
} from '@openflow/generated/types-manual';
import { Box, Flex, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import {
  AlertCircle,
  Bot,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  Loader2,
  Terminal,
  Wrench,
  XCircle,
} from 'lucide-react';
import { type HTMLAttributes, forwardRef, useId, useMemo, useState } from 'react';
import { Icon } from '../atoms/Icon';
import { Spinner } from '../atoms/Spinner';

// ============================================================================
// Types
// ============================================================================

/** Props for StepProgress */
export interface StepProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Agent events for this step */
  events: AgentEventRecord[];
  /** Tool states for running/completed tools */
  toolStates?: ToolStateSummary[];
  /** Step status for overall state indication */
  stepStatus?: StepStatus;
  /** Whether to show the raw terminal output section */
  showTerminalOutput?: boolean;
  /** Raw terminal output (for debug/advanced view) */
  terminalOutput?: string;
  /** Whether events are currently streaming */
  isStreaming?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Test ID */
  'data-testid'?: string;
}

/** Props for EventList */
export interface EventListProps {
  events: AgentEventRecord[];
  size: 'sm' | 'md' | 'lg';
  'data-testid'?: string;
}

/** Props for ToolStateList */
export interface ToolStateListProps {
  toolStates: ToolStateSummary[];
  size: 'sm' | 'md' | 'lg';
  defaultExpanded?: boolean;
  'data-testid'?: string;
}

/** Props for TerminalOutput */
export interface TerminalOutputProps {
  output: string;
  size: 'sm' | 'md' | 'lg';
  defaultExpanded?: boolean;
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

const SIZE_CLASSES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const GAP_CLASSES = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

const PADDING_CLASSES = {
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
};

const TOOL_STATUS_ICONS: Record<ToolStatus, typeof Circle> = {
  running: Loader2,
  completed: CheckCircle,
  error: XCircle,
};

const TOOL_STATUS_COLORS: Record<ToolStatus, string> = {
  running: 'text-primary',
  completed: 'text-success',
  error: 'text-destructive',
};

const TOOL_STATUS_LABELS: Record<ToolStatus, string> = {
  running: 'Running',
  completed: 'Completed',
  error: 'Error',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse an AgentEventRecord payload into a typed UnifiedAgentEvent
 */
function parseEventPayload(event: AgentEventRecord): UnifiedAgentEvent | null {
  try {
    const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;
    if (payload && typeof payload === 'object' && 'type' in payload) {
      return payload as UnifiedAgentEvent;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract text content from content blocks
 */
function extractTextContent(content: ContentBlock[]): string {
  return content
    .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

/**
 * Get event type display info
 */
function getEventTypeInfo(eventType: string): {
  icon: typeof Circle;
  color: string;
  label: string;
} {
  switch (eventType) {
    case 'init':
      return { icon: Circle, color: 'text-primary', label: 'Session Started' };
    case 'message':
      return { icon: Bot, color: 'text-foreground', label: 'Message' };
    case 'tool_use':
      return { icon: Wrench, color: 'text-primary', label: 'Tool Call' };
    case 'tool_result':
      return { icon: CheckCircle, color: 'text-success', label: 'Tool Result' };
    case 'complete':
      return { icon: CheckCircle, color: 'text-success', label: 'Complete' };
    case 'error':
      return { icon: AlertCircle, color: 'text-destructive', label: 'Error' };
    case 'permission':
      return { icon: AlertCircle, color: 'text-warning', label: 'Permission Request' };
    default:
      return { icon: Circle, color: 'text-muted-foreground', label: eventType };
  }
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Single event item display
 */
const EventItem = forwardRef<
  HTMLDivElement,
  {
    event: AgentEventRecord;
    size: 'sm' | 'md' | 'lg';
    'data-testid'?: string;
  }
>(({ event, size, 'data-testid': testId }, ref) => {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const parsedEvent = parseEventPayload(event);
  const { icon: EventIcon, color, label } = getEventTypeInfo(event.eventType);

  // Determine content preview
  let preview = '';
  let hasDetails = false;

  if (parsedEvent) {
    switch (parsedEvent.type) {
      case 'init': {
        const initEvent = parsedEvent as UnifiedAgentEventInit;
        preview = `Model: ${initEvent.model}`;
        hasDetails = initEvent.tools.length > 0;
        break;
      }
      case 'message': {
        const msgEvent = parsedEvent as UnifiedAgentEventMessage;
        preview = extractTextContent(msgEvent.content).slice(0, 100);
        if (preview.length >= 100) preview += '...';
        hasDetails = msgEvent.content.length > 0;
        break;
      }
      case 'tool_use': {
        const toolEvent = parsedEvent as UnifiedAgentEventToolUse;
        preview = toolEvent.tool_name;
        hasDetails = toolEvent.input !== undefined;
        break;
      }
      case 'tool_result': {
        const resultEvent = parsedEvent as UnifiedAgentEventToolResult;
        preview = `${resultEvent.status}: ${resultEvent.output.slice(0, 50)}`;
        if (resultEvent.output.length > 50) preview += '...';
        hasDetails = resultEvent.output.length > 0;
        break;
      }
      case 'complete': {
        const completeEvent = parsedEvent as UnifiedAgentEventComplete;
        preview = completeEvent.status;
        hasDetails = completeEvent.stats !== undefined;
        break;
      }
      case 'error': {
        const errorEvent = parsedEvent as UnifiedAgentEventError;
        preview = errorEvent.message;
        hasDetails = true;
        break;
      }
    }
  }

  return (
    <Box
      ref={ref}
      className={cn('rounded-md border border-border bg-card', SIZE_CLASSES[size])}
      data-testid={testId}
      data-event-type={event.eventType}
      data-sequence={event.sequence}
    >
      {/* Event header - always visible */}
      <button
        type="button"
        onClick={() => hasDetails && setExpanded(!expanded)}
        disabled={!hasDetails}
        className={cn(
          'flex w-full items-center gap-2 text-left',
          PADDING_CLASSES[size],
          hasDetails && 'cursor-pointer hover:bg-accent/50',
          !hasDetails && 'cursor-default'
        )}
        aria-expanded={hasDetails ? expanded : undefined}
        aria-controls={hasDetails ? contentId : undefined}
      >
        {hasDetails && (
          <Icon
            icon={expanded ? ChevronDown : ChevronRight}
            className="h-3 w-3 text-muted-foreground flex-shrink-0"
          />
        )}
        {!hasDetails && <span className="w-3" />}
        <Icon icon={EventIcon} className={cn('h-4 w-4 flex-shrink-0', color)} />
        <Text className="font-medium flex-shrink-0">{label}</Text>
        {preview && <Text className="truncate text-muted-foreground">{preview}</Text>}
        <Text className="ml-auto text-xs text-muted-foreground flex-shrink-0">
          #{event.sequence}
        </Text>
      </button>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <Box
          id={contentId}
          className={cn('border-t border-border bg-muted/30', PADDING_CLASSES[size])}
        >
          <pre className="whitespace-pre-wrap break-words font-mono text-xs overflow-auto max-h-60">
            {JSON.stringify(parsedEvent, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  );
});

EventItem.displayName = 'EventItem';

/**
 * List of agent events
 */
export const EventList = forwardRef<HTMLDivElement, EventListProps>(
  ({ events, size, 'data-testid': testId }, ref) => {
    if (events.length === 0) {
      return (
        <Box
          ref={ref}
          className={cn(
            'flex items-center justify-center py-8 text-muted-foreground',
            SIZE_CLASSES[size]
          )}
          role="status"
          data-testid={testId}
        >
          <Icon icon={Bot} className="mr-2 h-4 w-4" />
          <Text>No events yet</Text>
        </Box>
      );
    }

    return (
      <Flex
        ref={ref}
        direction="column"
        className={GAP_CLASSES[size]}
        role="log"
        aria-label="Agent events"
        data-testid={testId}
        data-event-count={events.length}
      >
        {events.map((event, index) => (
          <EventItem
            key={event.id || `event-${index}`}
            event={event}
            size={size}
            data-testid={testId ? `${testId}-event-${index}` : undefined}
          />
        ))}
      </Flex>
    );
  }
);

EventList.displayName = 'EventList';

/**
 * Single tool state item
 */
const ToolStateItem = forwardRef<
  HTMLDivElement,
  {
    toolState: ToolStateSummary;
    size: 'sm' | 'md' | 'lg';
    'data-testid'?: string;
  }
>(({ toolState, size, 'data-testid': testId }, ref) => {
  const StatusIcon = TOOL_STATUS_ICONS[toolState.status];
  const statusColor = TOOL_STATUS_COLORS[toolState.status];
  const isRunning = toolState.status === 'running';

  return (
    <Flex
      ref={ref}
      align="center"
      className={cn(
        'rounded-md border border-border bg-card',
        PADDING_CLASSES[size],
        GAP_CLASSES[size]
      )}
      data-testid={testId}
      data-tool-name={toolState.toolName}
      data-status={toolState.status}
    >
      <Icon
        icon={StatusIcon}
        className={cn('h-4 w-4 flex-shrink-0', statusColor, isRunning && 'animate-spin')}
      />
      <code className={cn('font-medium', SIZE_CLASSES[size])}>{toolState.toolName}</code>
      <Text className={cn('text-muted-foreground', SIZE_CLASSES[size])}>
        {TOOL_STATUS_LABELS[toolState.status]}
      </Text>
      {toolState.isError && (
        <Icon icon={AlertCircle} className="h-4 w-4 text-destructive ml-auto" />
      )}
    </Flex>
  );
});

ToolStateItem.displayName = 'ToolStateItem';

/**
 * Collapsible list of tool states
 */
export const ToolStateList = forwardRef<HTMLDivElement, ToolStateListProps>(
  ({ toolStates, size, defaultExpanded = true, 'data-testid': testId }, ref) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const contentId = useId();

    const runningCount = useMemo(
      () => toolStates.filter((t) => t.status === 'running').length,
      [toolStates]
    );
    const errorCount = useMemo(
      () => toolStates.filter((t) => t.status === 'error' || t.isError).length,
      [toolStates]
    );

    if (toolStates.length === 0) {
      return null;
    }

    return (
      <Box
        ref={ref}
        className="rounded-lg border border-border bg-card/50"
        data-testid={testId}
        data-tool-count={toolStates.length}
        data-running-count={runningCount}
        data-error-count={errorCount}
      >
        {/* Header */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex w-full items-center gap-2 text-left hover:bg-accent/50 rounded-t-lg',
            PADDING_CLASSES[size]
          )}
          aria-expanded={expanded}
          aria-controls={contentId}
        >
          <Icon
            icon={expanded ? ChevronDown : ChevronRight}
            className="h-4 w-4 text-muted-foreground"
          />
          <Icon icon={Wrench} className="h-4 w-4 text-primary" />
          <Text className={cn('font-medium', SIZE_CLASSES[size])}>
            {toolStates.length} {toolStates.length === 1 ? 'tool' : 'tools'}
          </Text>
          {runningCount > 0 && (
            <Flex align="center" className="gap-1 ml-auto">
              <Spinner size="xs" announce={false} />
              <Text className="text-xs text-muted-foreground">{runningCount} running</Text>
            </Flex>
          )}
          {errorCount > 0 && (
            <Text className="text-xs text-destructive ml-auto">
              {errorCount} error{errorCount !== 1 && 's'}
            </Text>
          )}
        </button>

        {/* Expanded content */}
        {expanded && (
          <Flex
            id={contentId}
            direction="column"
            className={cn('border-t border-border', PADDING_CLASSES[size], GAP_CLASSES[size])}
            role="list"
            aria-label="Tool states"
          >
            {toolStates.map((toolState, index) => (
              <ToolStateItem
                key={toolState.id || `tool-${index}`}
                toolState={toolState}
                size={size}
                data-testid={testId ? `${testId}-tool-${index}` : undefined}
              />
            ))}
          </Flex>
        )}
      </Box>
    );
  }
);

ToolStateList.displayName = 'ToolStateList';

/**
 * Collapsible terminal output display
 */
export const TerminalOutput = forwardRef<HTMLDivElement, TerminalOutputProps>(
  ({ output, size, defaultExpanded = false, 'data-testid': testId }, ref) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const contentId = useId();
    const lineCount = useMemo(() => output.split('\n').length, [output]);

    if (!output) {
      return null;
    }

    return (
      <Box
        ref={ref}
        className="rounded-lg border border-border bg-muted/30"
        data-testid={testId}
        data-line-count={lineCount}
      >
        {/* Header */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex w-full items-center gap-2 text-left hover:bg-muted/50 rounded-t-lg',
            PADDING_CLASSES[size]
          )}
          aria-expanded={expanded}
          aria-controls={contentId}
        >
          <Icon
            icon={expanded ? ChevronDown : ChevronRight}
            className="h-4 w-4 text-muted-foreground"
          />
          <Icon icon={Terminal} className="h-4 w-4 text-muted-foreground" />
          <Text className={cn('font-medium text-muted-foreground', SIZE_CLASSES[size])}>
            Raw output ({lineCount} lines)
          </Text>
        </button>

        {/* Expanded content */}
        {expanded && (
          <Box
            id={contentId}
            className="border-t border-border bg-background overflow-auto max-h-60"
          >
            <pre className={cn('font-mono p-3 whitespace-pre-wrap', SIZE_CLASSES[size])}>
              {output}
            </pre>
          </Box>
        )}
      </Box>
    );
  }
);

TerminalOutput.displayName = 'TerminalOutput';

/**
 * Empty state when no events yet
 */
const StepProgressEmpty = forwardRef<
  HTMLDivElement,
  { stepStatus?: StepStatus; size: 'sm' | 'md' | 'lg' }
>(({ stepStatus, size }, ref) => {
  const getMessage = () => {
    switch (stepStatus) {
      case 'pending':
        return 'Waiting to start...';
      case 'running':
        return 'Starting execution...';
      case 'completed':
        return 'Step completed';
      case 'failed':
        return 'Step failed';
      case 'skipped':
        return 'Step was skipped';
      default:
        return 'No activity yet';
    }
  };

  return (
    <Flex
      ref={ref}
      direction="column"
      align="center"
      justify="center"
      className={cn('py-12 text-muted-foreground', SIZE_CLASSES[size])}
      role="status"
    >
      {stepStatus === 'running' ? (
        <Spinner size="md" label={getMessage()} />
      ) : (
        <>
          <Icon icon={Bot} className="h-8 w-8 mb-2" />
          <Text>{getMessage()}</Text>
        </>
      )}
    </Flex>
  );
});

StepProgressEmpty.displayName = 'StepProgressEmpty';

/**
 * Streaming indicator
 */
const StreamingIndicator = forwardRef<HTMLDivElement, { size: 'sm' | 'md' | 'lg' }>(
  ({ size }, ref) => {
    return (
      <Flex
        ref={ref}
        align="center"
        className={cn('text-muted-foreground', GAP_CLASSES[size])}
        role="status"
        aria-live="polite"
      >
        <Spinner size="sm" announce={false} />
        <Text className={SIZE_CLASSES[size]}>Agent is working...</Text>
      </Flex>
    );
  }
);

StreamingIndicator.displayName = 'StreamingIndicator';

// ============================================================================
// Main Component
// ============================================================================

/**
 * StepProgress - Display live agent events and tool states for a task step
 *
 * @example
 * ```tsx
 * function TaskStepDetail({ taskId, stepIndex }: Props) {
 *   const { data: events, isLoading } = useTaskStepEvents(taskId, stepIndex, {
 *     refetchInterval: isRunning ? 500 : false,
 *   });
 *
 *   return (
 *     <StepProgress
 *       events={events ?? []}
 *       stepStatus="running"
 *       isStreaming={isRunning}
 *     />
 *   );
 * }
 * ```
 */
export const StepProgress = forwardRef<HTMLDivElement, StepProgressProps>(
  (
    {
      events,
      toolStates = [],
      stepStatus,
      showTerminalOutput = false,
      terminalOutput = '',
      isStreaming = false,
      size = 'md',
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const hasContent = events.length > 0 || toolStates.length > 0;

    return (
      <Flex
        ref={ref}
        direction="column"
        className={cn('min-h-0 flex-1', GAP_CLASSES[size], className)}
        data-testid={testId}
        data-event-count={events.length}
        data-tool-count={toolStates.length}
        data-streaming={isStreaming}
        data-step-status={stepStatus}
        {...props}
      >
        {/* Screen reader announcement */}
        <VisuallyHidden>
          <Box as="span" role="status" aria-live="polite">
            {isStreaming
              ? 'Agent is processing'
              : hasContent
                ? `${events.length} events, ${toolStates.length} tools`
                : 'No activity yet'}
          </Box>
        </VisuallyHidden>

        {/* Tool states summary */}
        {toolStates.length > 0 && (
          <ToolStateList
            toolStates={toolStates}
            size={size}
            data-testid={testId ? `${testId}-tools` : undefined}
          />
        )}

        {/* Events list */}
        {hasContent ? (
          <Box className="min-h-0 flex-1 overflow-y-auto">
            <EventList
              events={events}
              size={size}
              data-testid={testId ? `${testId}-events` : undefined}
            />
          </Box>
        ) : (
          <StepProgressEmpty stepStatus={stepStatus} size={size} />
        )}

        {/* Streaming indicator */}
        {isStreaming && <StreamingIndicator size={size} />}

        {/* Terminal output (debug view) */}
        {showTerminalOutput && terminalOutput && (
          <TerminalOutput
            output={terminalOutput}
            size={size}
            data-testid={testId ? `${testId}-terminal` : undefined}
          />
        )}
      </Flex>
    );
  }
);

StepProgress.displayName = 'StepProgress';

// Export all sub-components
export { EventItem, ToolStateItem };
