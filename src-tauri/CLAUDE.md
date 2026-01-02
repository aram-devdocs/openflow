# Tauri Desktop Integration

## Command Handler Pattern

Commands are thin wrappers that extract state, call core services, and return results. All business logic lives in the core crate.

**Command structure:**
1. Extract app state (database pool, config)
2. Call service function from core
3. Broadcast event if mutation occurred
4. Return result or map error

## State Management

Use Tauri's managed state for shared resources (database pool, event channels). Access via command parameters with State extractor.

## Event Broadcasting

After successful mutations, emit events using the event channel. Events notify all connected frontends (webview and browser clients) of state changes.

## Error Mapping

Map service errors to appropriate responses. Use descriptive error messages that help debugging without exposing internals.

## Command Registration

All commands must be registered in the invoke handler. The validator checks that every `#[tauri::command]` function is properly registered.

## Security

Commands run with full system access. Validate inputs, sanitize paths, and follow principle of least privilege. Security capabilities are defined separately.
