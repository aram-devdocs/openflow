# Rust Backend Crates

## Crate Hierarchy

Contracts define the API surface (entities, requests, responses, events). Core contains all business logic as pure service functions. Server and Tauri are thin layers that call core services.

**Dependency flow:** Server/Tauri → Core → Contracts, DB, Process

## Service Layer Pattern

Services are pure functions that take dependencies as arguments (database pool, config) and return Result types. They contain all business logic, validation, and orchestration.

**Key principles:**
- No panics in service layer - always return Result
- Services don't know about HTTP or Tauri - they're transport-agnostic
- Use `ServiceError` for domain errors with context
- Log operations at appropriate levels (debug for entry, info for success, error for failures)

## Event Broadcasting

After mutations, broadcast events so all connected clients stay synchronized. Events contain entity type, action, ID, and optionally the full entity data.

## Error Handling

Use `anyhow` for context-rich errors. Chain errors with `.context()` or `.with_context()`. Map to appropriate error types at transport boundaries.

## Adding New Features

1. Define types in contracts with `#[typeshare]` attribute
2. Add request types with validation annotations
3. Implement service functions in core
4. Add route handlers in server that call services
5. Add Tauri commands that call the same services
6. Broadcast events after mutations

See individual crate CLAUDE.md files for crate-specific patterns.
