# Hooks Package

## Purpose

React hooks that wrap queries with TanStack Query. Provides loading states, caching, error handling, and cache invalidation.

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
