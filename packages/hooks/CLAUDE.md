# Hooks Package

## Purpose

React hooks that wrap queries with TanStack Query. Provides loading states, caching, error handling, and cache invalidation. Also includes event subscriptions and UI-only state management.

## Key Hooks

### Task Execution
- **useTaskWithSteps(taskId)** - Query task with all steps
- **useStartTask()**, **usePauseTask()**, **useResumeTask()**, **useCancelTask()** - Task lifecycle mutations
- **useTaskStepEvents(taskId, stepIndex)** - Query events for a step with polling

### Agent Sessions
- **useAgentSessionWithState(sessionId)** - Session with event/tool counts
- **useAgentSessionEvents(sessionId)** - Events with polling
- **useRespondAgentPermission()** - Approve/deny permission

### Event Subscriptions
- **useEventSubscription(channel)** - Core hook that subscribes and invalidates queries
- **useTaskSubscription(taskId)** - Subscribe to all task events
- **useSessionSubscription(sessionId)** - Subscribe to all session events

### UI State (ViewStore)
- **useViewStore()** - Zustand store for UI-only state
- **useSelectedTaskId()**, **useSidebarOpen()**, etc. - Convenience selectors

## Hook Pattern

Hooks wrap query functions with useQuery or useMutation. They handle success/error callbacks, toast notifications, and cache updates.

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
