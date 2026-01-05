# Rust Backend Crates

## Crate Hierarchy

Contracts define the API surface (entities, requests, responses, events). Core contains all business logic including the AgentOrchestrator, TaskExecutor, and AgentProvider implementations. Server and Tauri are thin layers that call core services.

**Dependency flow:** Server/Tauri → Core → Contracts, DB, Process

## Key Components

- **AgentOrchestrator** (`core/services/agent_orchestrator.rs`) - Manages agent processes, parses output, persists events
- **TaskExecutor** (`core/services/task_executor.rs`) - Autonomous task runner, executes steps sequentially
- **AgentProvider trait** (`core/providers/mod.rs`) - Normalizes CLI outputs to UnifiedAgentEvent
- **Providers** (`core/providers/`) - Claude Code, Gemini CLI, Codex CLI, Mock implementations

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

## Adding New Agent Providers

1. Create `crates/openflow-core/src/providers/my_provider.rs`
2. Implement `AgentProvider` trait methods:
   - `provider_id()` - Unique identifier (e.g., "my-cli")
   - `build_command()` - Convert AgentConfig to PtyConfig
   - `parse_line()` - Parse output to UnifiedAgentEvent
   - `is_permission_prompt()` - Detect permission prompts
3. Add to `PROVIDER_IDS` array in `registry.rs`
4. Register in `ProviderRegistry::new()` match statement
5. Add tests with sample CLI output

See `claude_code.rs` as reference.

See individual crate CLAUDE.md files for crate-specific patterns.
