# Contracts Crate

## Purpose

Defines the API surface - all types shared between backend and frontend. This is the single source of truth for domain entities, request/response types, and events.

## Key Types

### Agent Events

#### Raw Events (Provider Output)
- **UnifiedAgentEvent** - Provider-agnostic event enum (Init, Message, ToolUse, ToolResult, Complete, Error, Permission)
- **EventEnvelope** - Wrapper with session_id, sequence, timestamp, payload
- **AgentEventRecord** - Flattened form for database storage

#### Normalized Events (Canonical Format)
- **NormalizedEntry** - The canonical format for all agent events after pipeline processing
  - `id`: Unique identifier for the entry
  - `session_id`: Associated agent session
  - `sequence`: Monotonic sequence number (per session)
  - `entry_type`: Discriminated union of entry types
  - `content`: Human-readable content
  - `timestamp`: When the event occurred
  - `metadata`: Optional structured metadata

- **EntryType** - Discriminated union of all entry types:
  - `Init` - Session initialization with model and tools
  - `Message` - Agent or user message with role
  - `ToolUse` - Tool invocation with tool_id, tool_name, and input JSON
  - `ToolResult` - Tool completion with status, output, and duration
  - `Error` - Error with code and recoverability flag
  - `System` - System messages with subtype
  - `Complete` - Session completion with status and stats

- **EntryMetadata** - Structured metadata extracted from events:
  - `file_path`: File being read/written (for file operations)
  - `command`: Shell command (for bash tool)
  - `exit_code`: Process exit code (for completed tools)
  - `parent_tool_id`: Parent tool for nested operations

#### Execution Errors (Structured Error Types)
- **ExecutionError** - Discriminated union of all execution error types:
  - `Spawn` - Process creation failure with command and cwd
  - `Parse` - Line parsing error with line content and context
  - `PermissionDenied` - Permission rejection with tool and reason
  - `PermissionTimeout` - Expired permission request with timeout duration
  - `ToolExecution` - Tool failure with exit code and stderr
  - `Timeout` - Session or operation timeout with duration
  - `Connection` - PTY connection issue with recoverability flag
  - `ProviderError` - Provider-specific error with code and message

- **PermissionDeniedReason** - Why a permission was denied:
  - `UserDenied` - User explicitly denied
  - `Timeout` - Permission request timed out
  - `SessionEnded` - Session ended before response
  - `PolicyViolation` - Violated security policy

### Task Execution
- **Task** - Task entity with status (Pending, Running, Paused, Completed, Failed, Cancelled)
- **TaskStep** - Individual step with prompt, provider_id, session_id
- **TaskWithSteps** - Task with all steps for execution view

### Sessions
- **AgentSession** - Session entity with process_id, provider_id, status, exit_code
- **Permission** - Permission request from agent with tool_name, description, timeout tracking

### Channels
- **channels.rs** - Constants for all event channels
- Legacy channels: `task-progress`, `agent-event`, etc.
- New pipeline channels:
  - `raw-output-{session_id}` - Raw PTY output for terminal display
  - `normalized-{session_id}` - Structured normalized events
  - `tool-state-{session_id}` - Tool lifecycle updates
  - `execution-error-{session_id}` - Structured error events
- Helper functions: `raw_output_channel()`, `normalized_channel()`, `execution_error_channel()`

## Type Definition Pattern

All types use `#[typeshare]` for TypeScript generation. Use `#[serde(rename_all = "camelCase")]` for JavaScript conventions.

## Entities

Domain entities represent persisted data. Include ID, timestamps, and relationships. Keep entities focused - split large entities into related types.

## Request Types

Request types define what clients send. Use doc comments with `@validate:` annotations for validation rules. Keep requests minimal - only include fields needed for the operation.

## Response Types

Most responses return entities directly. For complex responses, create dedicated types. Include enough data for the client to update its cache.

## Events

Events notify clients of state changes. Include entity type, action, ID, and optionally the full entity. Keep events small and focused.

## Validation Annotations

Document validation rules in comments for generator to extract:
- `@validate: required` - Field must be present
- `@validate: min_length=N` - Minimum string length
- `@validate: max_length=N` - Maximum string length
- `@validate: format=X` - Expected format (email, url, path)
