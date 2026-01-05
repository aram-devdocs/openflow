# Tauri Desktop Integration

## Command Handler Pattern

Commands are thin wrappers that extract state, call core services, and return results. All business logic lives in the core crate.

**Command structure:**
1. Extract app state (database pool, config)
2. Call service function from core
3. Broadcast event if mutation occurred
4. Return result or map error

## AppState Components

AppState contains shared resources managed by Tauri:

- **SqlitePool** - Database connection pool
- **AgentOrchestrator** - Manages agent processes and sessions
- **TaskExecutor** - Autonomous task execution engine
- **Broadcaster** - Event broadcasting to all connected clients

Access via `state.get_pool()`, `state.get_agent_orchestrator()`, etc.

## Key Command Groups

### Task Execution (`commands/tasks.rs`)
- `start_task`, `pause_task`, `resume_task`, `cancel_task` - Task lifecycle
- `get_task_with_steps`, `list_task_steps` - Task queries
- `respond_to_task_permission` - Permission handling

### Agent Sessions (`commands/agents.rs`)
- `get_agent_session_with_state` - Session with event/tool counts
- `get_agent_session_events` - Events with sequence filtering
- `respond_agent_permission` - Permission approval/denial
- `kill_agent_session`, `write_agent_input`, `resize_agent_terminal` - Session control

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
