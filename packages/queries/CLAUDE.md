# Queries Package

## Purpose

Thin wrappers around backend calls. Handles transport abstraction between Tauri IPC and HTTP.

## Query Pattern

Queries are async functions that call the backend and return typed results. No state, no hooks, no business logic.

```typescript
export async function list(): Promise<Entity[]> {
  return invoke('list_entities');
}
```

## Transport Abstraction

The invoke function auto-detects context (Tauri vs browser) and uses appropriate transport. Queries don't care which transport is used.

## Error Handling

Wrap calls in try/catch. Log errors with context. Re-throw for the caller (hooks) to handle.

## No React

This package has no React dependencies. Queries are pure async functions usable anywhere.

## Testing

Mock invoke for unit tests. Test both success and error paths. Verify correct command names and parameters.
