# Core Crate

## Purpose

Contains all business logic as pure service functions. Shared by both the HTTP server and Tauri desktop app. No transport-specific code lives here.

## Key Services

- **AgentOrchestrator** - Manages agent processes, parses PTY output, persists events to DB
- **TaskExecutor** - Runs tasks autonomously, advances through steps, handles pause/resume/cancel
- **AgentSessionService** - CRUD for agent sessions, events, permissions
- **TaskService** - CRUD for tasks and steps, status management
- **ToolStateService** - Tracks tool lifecycle (running → completed/error)
- **AuditService** - Logs all significant actions to audit_logs table

## Providers

The `providers/` directory contains AgentProvider implementations:

- **ClaudeCodeProvider** - Parses Claude Code's stream-json format
- **GeminiCLIProvider** - Parses Gemini CLI's JSONL format
- **CodexCLIProvider** - Parses Codex CLI's item-based format
- **MockProvider** - Configurable mock for testing

All providers normalize output to `UnifiedAgentEvent` enum.

## Service Function Pattern

Services take dependencies as arguments and return Results. They're pure functions that don't know about HTTP, Tauri, or any transport.

```rust
pub fn create(pool: &DbPool, input: CreateInput) -> ServiceResult<Entity>
```

## Error Handling

Use `ServiceResult<T>` which wraps `Result<T, ServiceError>`. Chain errors with context. Never panic - always return errors gracefully.

## Validation

Validate inputs at the start of service functions. Return validation errors with clear messages. Don't rely on database constraints for validation.

## Database Operations

Use the pool passed as argument. Keep transactions focused. Handle deadlocks and retries at this layer.

## Event Broadcasting

Services don't broadcast events directly. They return results, and the caller (route handler or command) broadcasts. This keeps services transport-agnostic.

## Testing

Services are pure functions, making them easy to test. Use in-memory databases for unit tests. Mock external dependencies.

## Performance Benchmarks

Run benchmarks with: `cargo bench -p openflow-core`

Performance verification tests: `cargo test -p openflow-core --test performance_verification --release`

Key targets:
- Event throughput: >=1000 events/sec
- Full query (5000 events): <100ms
- Incremental query: <50ms
- Session state query: <50ms
