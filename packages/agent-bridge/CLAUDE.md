# Agent Bridge Package

## Purpose

Node.js bridge server that connects OpenFlow's Rust backend to the Claude Agent SDK. Since the SDK is only available in TypeScript/Python, this bridge provides an HTTP interface.

## Architecture

```
Rust Backend (TaskExecutor)
       |
  POST /execute
       |
       v
Agent Bridge Server (this package)
       |
  query() from @anthropic-ai/claude-code
       |
       v
Claude Agent SDK
       |
  SSE stream back to Rust
       |
       v
Rust parses events, persists to DB
```

## Endpoints

### `GET /health`
Health check endpoint. Returns server status and uptime.

### `POST /execute`
Execute an agent query. Streams events back via SSE.

Request body:
```json
{
  "prompt": "Fix the bug in auth.py",
  "workingDir": "/path/to/project",
  "sessionId": "optional-session-id-for-resume",
  "allowedTools": ["Read", "Write", "Edit", "Bash"],
  "permissionMode": "acceptEdits"
}
```

Response: SSE stream of events:
```
data: {"type":"init","sessionId":"...","timestamp":"..."}

data: {"type":"message","role":"assistant","content":"...","timestamp":"..."}

data: {"type":"tool_use","toolId":"...","toolName":"Read","input":{...},"timestamp":"..."}

data: {"type":"tool_result","toolId":"...","output":"...","isError":false,"timestamp":"..."}

data: {"type":"complete","status":"success","timestamp":"..."}
```

## Event Types

- `init` - Session started, contains sessionId for resume
- `message` - Text content from assistant
- `tool_use` - Tool invocation (Read, Write, Edit, Bash, etc.)
- `tool_result` - Result of tool execution
- `complete` - Query finished (success or error)
- `error` - Error occurred during execution

## Development

```bash
# Start in development mode (with hot reload)
pnpm --filter @openflow/agent-bridge dev

# Build for production
pnpm --filter @openflow/agent-bridge build

# Start production server
pnpm --filter @openflow/agent-bridge start
```

## Environment Variables

- `AGENT_BRIDGE_PORT` - Server port (default: 3002)
- `ANTHROPIC_API_KEY` - Required for Claude API access (inherited from environment)

## Integration with Rust

The Rust backend calls this server via HTTP and parses the SSE stream. Events are normalized to `UnifiedAgentEvent` and persisted to the database.

```rust
// In TaskExecutor
let response = reqwest::Client::new()
    .post("http://localhost:3002/execute")
    .json(&ExecuteRequest { prompt, working_dir, session_id })
    .send()
    .await?;

// Parse SSE stream
let mut stream = response.bytes_stream();
while let Some(chunk) = stream.next().await {
    // Parse SSE data lines
    // Convert to UnifiedAgentEvent
    // Persist to database
    // Broadcast to clients
}
```

## Session Resumption

The Claude Agent SDK supports session resumption via the `resume` option. When a sessionId is provided in the request, the bridge passes it to the SDK, allowing continuation of previous conversations.

The Rust backend stores the sessionId from `init` events in the `external_session_id` field of `AgentSession` records.

