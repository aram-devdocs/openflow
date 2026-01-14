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

## Agent Output Pipeline

The **AgentOutputPipeline** is the unified processing pipeline for all agent output. It replaces the legacy dual-buffering approach with a single, coherent data flow.

### Pipeline Architecture

```
PTY Raw Bytes → LineBuffer → Provider Parser → Normalizer → Database → WebSocket Broadcast
                     ↓              ↓              ↓
                Raw Channel    Permission    Tool State
                              Detector       Tracker
```

### Pipeline Components

- **LineBuffer** - Accumulates raw bytes, handles incomplete lines, strips ANSI codes, manages UTF-8 boundaries
- **Provider Parser** - Transforms lines into `UnifiedAgentEvent` using provider-specific logic
- **EventNormalizer** - Converts events to `NormalizedEntry` with sequence numbers and timestamps
- **PermissionDetector** - Identifies permission prompts using multi-pattern regex matching
- **ToolStateTracker** - Maintains tool lifecycle in database (running → completed/error)

### Data Flow

1. **receive_bytes()** - Adds raw PTY output to line buffer
2. **process_complete_lines()** - Extracts complete lines, strips ANSI escape codes
3. **parse_line()** - Provider parses line to `UnifiedAgentEvent`
4. **detect_permission()** - Checks for permission prompts, creates pending permission if detected
5. **normalize_event()** - Transforms to `NormalizedEntry` with metadata
6. **persist_event()** - Writes normalized entry to database
7. **track_tool_state()** - Updates tool state for ToolUse/ToolResult events
8. **broadcast_events()** - Sends to multiple WebSocket channels (raw, normalized, tool state)

### Dual Streaming

The pipeline broadcasts to separate channels for different use cases:

- **raw-output-{session_id}** - Raw PTY output for terminal display
- **normalized-{session_id}** - Structured events for UI rendering
- **tool-state-{session_id}** - Tool lifecycle updates
- **execution-error-{session_id}** - Structured error events

### Single Source of Truth

All state lives in the database:
- Tool states tracked exclusively in `tool_states` table (no in-memory tracking)
- Permissions tracked in `permissions` table with timeout support
- Normalized events stored in `normalized_events` table with sequence numbers
- Raw output accumulated in memory for terminal display only

### Error Handling

The pipeline produces structured `ExecutionError` types:
- **Spawn** - Process creation failures
- **Parse** - Line parsing errors with context
- **PermissionDenied** - Permission rejections with reason
- **PermissionTimeout** - Expired permission requests
- **ToolExecution** - Tool failures with exit codes and stderr
- **Timeout** - Session or operation timeouts
- **Connection** - PTY connection issues
- **ProviderError** - Provider-specific errors

## Providers

The `providers/` directory contains AgentProvider implementations:

- **ClaudeCodeProvider** - Parses Claude Code's stream-json format
- **GeminiCLIProvider** - Parses Gemini CLI's JSONL format
- **CodexCLIProvider** - Parses Codex CLI's item-based format
- **MockProvider** - Configurable mock for testing

All providers normalize output to `UnifiedAgentEvent` enum, which is then transformed to `NormalizedEntry` by the pipeline.

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
