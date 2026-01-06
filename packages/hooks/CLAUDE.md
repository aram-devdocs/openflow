# Hooks Package

## Purpose

React hooks that wrap queries with TanStack Query. Provides loading states, caching, error handling, and cache invalidation. Also includes event subscriptions and UI-only state management.

## Key Hooks

### Task Execution
- **useTaskWithSteps(taskId)** - Query task with all steps
- **useStartTask()**, **usePauseTask()**, **useResumeTask()**, **useCancelTask()** - Task lifecycle mutations
- **useTaskStepEvents(taskId, stepIndex)** - Query events for a step with polling

### Agent Sessions

#### Legacy Event Hooks
- **useAgentSessionWithState(sessionId)** - Session with event/tool counts
- **useAgentSessionEvents(sessionId)** - Events with polling (legacy format)
- **useRespondAgentPermission()** - Approve/deny permission

#### New Pipeline Stream Hooks

The new pipeline provides dual streaming for different use cases:

- **useAgentRawStream(sessionId, options)** - Raw PTY output for terminal display
  - Returns accumulated raw output as string
  - Options: `enabled`, `onData` callback
  - Use for terminal emulator components
  - Subscribes to `raw-output-{session_id}` channel

- **useAgentNormalizedEvents(sessionId, options)** - Structured events for UI rendering
  - Returns array of `NormalizedEntry` objects
  - Options: `afterSequence` (for incremental fetching), `enabled`, `refetchInterval`
  - Use for event lists, message displays, structured UI
  - Subscribes to `normalized-{session_id}` channel
  - Supports efficient pagination with sequence-based queries

- **useAgentToolStates(sessionId, options)** - Tool lifecycle tracking
  - Returns array of `ToolState` objects
  - Options: `enabled`, `refetchInterval`
  - Use for tool execution progress, status indicators
  - Subscribes to `tool-state-{session_id}` channel
  - Shows running tools, completed tools, and failures

- **useAgentExecutionErrors(sessionId, options)** - Structured error events
  - Returns array of `ExecutionError` objects
  - Options: `enabled`, `refetchInterval`
  - Use for error displays, debugging panels
  - Subscribes to `execution-error-{session_id}` channel
  - Provides detailed error context for troubleshooting

### Event Subscriptions

#### Core Subscription Hook
- **useEventSubscription(channel)** - Core hook that subscribes and invalidates queries
  - Connects to WebSocket
  - Subscribes to specified channel
  - Automatically invalidates related queries when events arrive
  - Cleans up on unmount

#### Convenience Subscription Hooks
- **useTaskSubscription(taskId)** - Subscribe to all task events
- **useSessionSubscription(sessionId)** - Subscribe to all session events (legacy)

#### New Pipeline Subscriptions

The pipeline uses channel-specific subscriptions for efficient updates:

- **useRawOutputSubscription(sessionId)** - Subscribe to raw output stream
  - Invalidates `useAgentRawStream` query
  - High-frequency updates for terminal display

- **useNormalizedEventsSubscription(sessionId)** - Subscribe to normalized events
  - Invalidates `useAgentNormalizedEvents` query
  - Structured updates for UI components

- **useToolStatesSubscription(sessionId)** - Subscribe to tool state changes
  - Invalidates `useAgentToolStates` query
  - Updates when tools start, complete, or fail

- **useExecutionErrorsSubscription(sessionId)** - Subscribe to execution errors
  - Invalidates `useAgentExecutionErrors` query
  - Real-time error notifications

### UI State (ViewStore)
- **useViewStore()** - Zustand store for UI-only state
- **useSelectedTaskId()**, **useSidebarOpen()**, etc. - Convenience selectors

## Hook Pattern

Hooks wrap query functions with useQuery or useMutation. They handle success/error callbacks, toast notifications, and cache updates.

## Dual Stream Pattern

The new pipeline architecture provides separate streams for different use cases:

### Raw Stream (Terminal Display)
Use `useAgentRawStream` when you need:
- Raw PTY output with ANSI codes preserved
- Terminal emulator display
- Complete output history as a single string
- High-frequency updates

Example:
```typescript
const { data: rawOutput } = useAgentRawStream(sessionId, {
  enabled: isTerminalVisible,
  onData: (chunk) => terminal.write(chunk)
});
```

### Normalized Stream (Structured UI)
Use `useAgentNormalizedEvents` when you need:
- Structured event objects with metadata
- Message lists, event timelines
- Filtering by event type
- Incremental loading with pagination

Example:
```typescript
const { data: events } = useAgentNormalizedEvents(sessionId, {
  afterSequence: lastSequence,
  enabled: true,
  refetchInterval: 1000
});
```

### Tool State Stream (Progress Tracking)
Use `useAgentToolStates` when you need:
- Tool execution status
- Running tool indicators
- Tool duration and exit codes
- Error states for specific tools

Example:
```typescript
const { data: toolStates } = useAgentToolStates(sessionId);
const runningTools = toolStates?.filter(t => t.status === 'running');
```

### Error Stream (Debugging)
Use `useAgentExecutionErrors` when you need:
- Detailed error context
- Error categorization (parse, permission, timeout, etc.)
- Debugging information
- Error recovery actions

Example:
```typescript
const { data: errors } = useAgentExecutionErrors(sessionId);
const criticalErrors = errors?.filter(e => !e.recoverable);
```

## Subscription Pattern

Subscriptions automatically invalidate queries when backend events arrive:

```typescript
// 1. Subscribe to channel (invalidates queries)
useNormalizedEventsSubscription(sessionId);

// 2. Query data (re-fetches when invalidated)
const { data } = useAgentNormalizedEvents(sessionId);

// Result: UI stays in sync with backend without manual refetching
```

### When to Use Each Subscription

- **useRawOutputSubscription** - Always pair with `useAgentRawStream`
- **useNormalizedEventsSubscription** - Always pair with `useAgentNormalizedEvents`
- **useToolStatesSubscription** - Always pair with `useAgentToolStates`
- **useExecutionErrorsSubscription** - Always pair with `useAgentExecutionErrors`

### Subscription Lifecycle

1. Component mounts → subscribe to channel
2. Backend broadcasts event → WebSocket receives
3. Hook invalidates related queries
4. TanStack Query refetches data
5. Component re-renders with new data
6. Component unmounts → unsubscribe from channel

## Query vs Mutation

Use useQuery for reads - it handles caching, refetching, and stale data. Use useMutation for writes - it handles optimistic updates and error rollback.

## Error Handling

Handle errors in onError callbacks. Show user-friendly toast messages. Log detailed errors for debugging.

## Cache Invalidation

Invalidate related queries after mutations succeed. Use query keys consistently for predictable invalidation.

## Logging

Log at debug level on hook entry, info on success, error on failure. Include relevant context like IDs and counts.

## Testing

Mock queries for unit tests. Test loading, success, and error states. Verify cache invalidation behavior.
