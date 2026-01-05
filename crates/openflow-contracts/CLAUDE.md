# Contracts Crate

## Purpose

Defines the API surface - all types shared between backend and frontend. This is the single source of truth for domain entities, request/response types, and events.

## Key Types

### Agent Events
- **UnifiedAgentEvent** - Provider-agnostic event enum (Init, Message, ToolUse, ToolResult, Complete, Error, Permission)
- **EventEnvelope** - Wrapper with session_id, sequence, timestamp, payload
- **AgentEventRecord** - Flattened form for database storage

### Task Execution
- **Task** - Task entity with status (Pending, Running, Paused, Completed, Failed, Cancelled)
- **TaskStep** - Individual step with prompt, provider_id, session_id
- **TaskWithSteps** - Task with all steps for execution view

### Sessions
- **AgentSession** - Session entity with process_id, provider_id, status, exit_code
- **Permission** - Permission request from agent with tool_name, description

### Channels
- **channels.rs** - Constants for all event channels (task-progress, agent-event, etc.)
- Helper functions: `task_channel()`, `session_channel()`, `agent_event_channel()`

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
