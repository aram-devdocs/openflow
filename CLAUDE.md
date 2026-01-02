# OpenFlow

AI Task Orchestration Desktop Application

## Overview

OpenFlow orchestrates AI coding CLI tools (Claude Code, Gemini CLI, Codex CLI, Cursor CLI) to build reliable software through spec-driven workflows, parallel execution, and automated verification. It wraps existing CLI tools developers already use and provides coordination through isolated git worktrees, multi-agent workflows, and built-in quality gates.

## Architecture

### System Design

OpenFlow follows a flexible backend architecture that supports multiple deployment modes:

1. **Desktop App (Default):** Tauri 2 application with embedded HTTP/WebSocket server
2. **Standalone Server:** HTTP/WebSocket server for cloud or multi-client deployments
3. **Web Frontend:** React app that can connect to any backend via HTTP/WebSocket

**Backend (Rust):** Modular crate architecture with business logic in `openflow-core`, shared by both Tauri commands and HTTP routes. Supports database operations, process management (PTY/spawning), git worktree lifecycle, and CLI tool execution.

**Frontend (React/TypeScript):** Stateless UI components with transport abstraction that automatically detects runtime context (Tauri IPC vs HTTP) and uses the appropriate communication method.

### Flexible Backend Modes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT MODES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Mode 1: Desktop App (pnpm dev)                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Tauri Desktop App                                                      ││
│  │  ├── React Frontend (webview)     ←─── Tauri IPC ───┐                   ││
│  │  ├── Embedded HTTP Server (:3001) ←─── HTTP/WS ─────┼── Browser Clients ││
│  │  └── Shared Database & Services   ←─────────────────┘                   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Mode 2: Standalone Server (pnpm dev:server)                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  openflow-server binary                                                 ││
│  │  └── HTTP/WS Server (:3001) ←─── HTTP/WS ─── Multiple Browser Clients   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Mode 3: Full Web Stack (pnpm dev:all)                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Standalone Server + Vite Frontend                                      ││
│  │  ├── openflow-server (:3001)                                            ││
│  │  └── Vite dev server (:5173) ←─── HTTP/WS ─── Server                    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Crate Architecture

The Rust backend is organized into modular crates:

```
crates/
├── openflow-contracts/  # API contracts (single source of truth)
│   ├── entities/        # Domain entities (Project, Task, Chat, etc.)
│   ├── requests/        # Request types with validation annotations
│   ├── events/          # WebSocket/Tauri event types
│   └── endpoints/       # Endpoint metadata for code generation
│
├── openflow-db/         # Database layer
│   ├── config.rs        # Database configuration
│   ├── pool.rs          # Connection pool initialization
│   └── migrations/      # SQL migration files
│
├── openflow-process/    # Process management
│   ├── pty.rs           # PTY execution (portable-pty)
│   ├── spawn.rs         # Process spawning
│   ├── executor.rs      # ProcessExecutor trait
│   └── output.rs        # Output streaming
│
├── openflow-core/       # Business logic (shared)
│   ├── services/        # Service layer (CRUD, workflows, git)
│   └── events/          # Event broadcaster trait
│
└── openflow-server/     # HTTP/WebSocket server
    ├── routes/          # Axum route handlers
    ├── ws/              # WebSocket handler + client manager
    └── main.rs          # Standalone binary entry point
```

**Dependency Flow:**
```
openflow-server ──┐
                  ├──▶ openflow-core ──▶ openflow-contracts
src-tauri (Tauri) ┘                   ├──▶ openflow-db
                                      └──▶ openflow-process
```

### Data Flow Architecture

The following diagram shows how data flows through the system for a typical CRUD operation:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW (CREATE PROJECT)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐     ┌───────────────┐     ┌─────────────────┐                 │
│  │   Frontend   │     │   Transport   │     │     Backend     │                 │
│  │   (React)    │     │   Abstraction │     │     (Rust)      │                 │
│  └──────┬───────┘     └───────┬───────┘     └────────┬────────┘                 │
│         │                     │                      │                           │
│         │  1. User Action     │                      │                           │
│         │  (click "Create")   │                      │                           │
│         ▼                     │                      │                           │
│  ┌──────────────┐             │                      │                           │
│  │  useMutation │             │                      │                           │
│  │  (TanStack)  │             │                      │                           │
│  └──────┬───────┘             │                      │                           │
│         │                     │                      │                           │
│         │  2. invoke('create_project', {...})        │                           │
│         ├────────────────────►│                      │                           │
│         │                     │                      │                           │
│         │        ┌────────────┴────────────┐         │                           │
│         │        │  Tauri IPC or HTTP POST │         │                           │
│         │        └────────────┬────────────┘         │                           │
│         │                     │                      │                           │
│         │                     │  3. Request arrives  │                           │
│         │                     ├─────────────────────►│                           │
│         │                     │                      │                           │
│         │                     │               ┌──────┴──────┐                    │
│         │                     │               │   Command/  │                    │
│         │                     │               │   Route     │                    │
│         │                     │               │   Handler   │                    │
│         │                     │               └──────┬──────┘                    │
│         │                     │                      │                           │
│         │                     │               ┌──────▼──────┐                    │
│         │                     │               │   Service   │                    │
│         │                     │               │   Layer     │                    │
│         │                     │               │ (openflow-  │                    │
│         │                     │               │   core)     │                    │
│         │                     │               └──────┬──────┘                    │
│         │                     │                      │                           │
│         │                     │               ┌──────▼──────┐                    │
│         │                     │               │  Database   │                    │
│         │                     │               │  (SQLite)   │                    │
│         │                     │               └──────┬──────┘                    │
│         │                     │                      │                           │
│         │                     │  4. Entity created   │                           │
│         │                     │◄─────────────────────┤                           │
│         │                     │                      │                           │
│         │  5. Return project  │                      │                           │
│         │◄────────────────────┤                      │                           │
│         │                     │                      │                           │
│         │                     │               ┌──────┴──────┐                    │
│         │                     │               │  Broadcast  │                    │
│         │                     │               │   Event     │                    │
│         │                     │               └──────┬──────┘                    │
│         │                     │                      │                           │
│         │                     │  6. data-changed     │                           │
│         │                     │     event via WS     │                           │
│  ┌──────┴───────┐             │◄─────────────────────┤                           │
│  │ useDataSync  │◄────────────┤                      │                           │
│  │   (hook)     │             │                      │                           │
│  └──────┬───────┘             │                      │                           │
│         │                     │                      │                           │
│         │  7. Invalidate      │                      │                           │
│         │     query cache     │                      │                           │
│         ▼                     │                      │                           │
│  ┌──────────────┐             │                      │                           │
│  │    UI        │             │                      │                           │
│  │  Re-renders  │             │                      │                           │
│  └──────────────┘             │                      │                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Real-Time Synchronization Flow

Shows how changes propagate to all connected clients:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        REAL-TIME SYNC (MULTI-CLIENT)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       ┌─────────────────┐    │
│  │   Tauri     │  │   Browser   │  │   Browser   │       │     Backend     │    │
│  │   Desktop   │  │   Client 1  │  │   Client 2  │       │                 │    │
│  │   (IPC)     │  │   (HTTP)    │  │   (HTTP)    │       │                 │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       └────────┬────────┘    │
│         │                │                │                       │             │
│         │                │                │    WebSocket Connect  │             │
│         │                ├────────────────┼──────────────────────►│             │
│         │                │                │◄──────────────────────┤             │
│         │                │                │    { type: connected } │             │
│         │                │                │                       │             │
│         │                │    Subscribe   │                       │             │
│         │                ├────────────────┼──────────────────────►│             │
│         │                │                │    data-changed       │             │
│         │                │                │                       │             │
│         │                │                │    Subscribe          │             │
│         │                │                ├──────────────────────►│             │
│         │                │                │    data-changed       │             │
│         │                │                │                       │             │
│         │  HTTP POST /api/projects        │                       │             │
│         ├────────────────────────────────────────────────────────►│             │
│         │                │                │                       │             │
│         │                │                │              ┌────────┴────────┐    │
│         │                │                │              │ Create Project  │    │
│         │                │                │              │ in Database     │    │
│         │                │                │              └────────┬────────┘    │
│         │                │                │                       │             │
│         │◄───────────────┼────────────────┼───────────────────────┤             │
│         │   JSON Response│                │                       │             │
│         │                │                │                       │             │
│         │                │                │              ┌────────┴────────┐    │
│         │                │                │              │ Broadcast Event │    │
│         │                │                │              │ to Subscribers  │    │
│         │                │                │              └────────┬────────┘    │
│         │                │                │                       │             │
│         │                │◄───────────────┼───────────────────────┤             │
│         │                │   data-changed │                       │             │
│         │                │   { entity: "project", action: "created", id, data } │
│         │                │                │                       │             │
│         │                │                │◄──────────────────────┤             │
│         │                │                │   data-changed        │             │
│         │                │                │   (same event)        │             │
│         │                │                │                       │             │
│   ┌─────┴─────┐    ┌─────┴─────┐    ┌─────┴─────┐                 │             │
│   │ Cache     │    │ Cache     │    │ Cache     │                 │             │
│   │ Invalidate│    │ Invalidate│    │ Invalidate│                 │             │
│   └─────┬─────┘    └─────┬─────┘    └─────┬─────┘                 │             │
│         │                │                │                       │             │
│   ┌─────┴─────┐    ┌─────┴─────┐    ┌─────┴─────┐                 │             │
│   │ UI        │    │ UI        │    │ UI        │                 │             │
│   │ Updates   │    │ Updates   │    │ Updates   │                 │             │
│   │ (instant) │    │ (instant) │    │ (instant) │                 │             │
│   └───────────┘    └───────────┘    └───────────┘                 │             │
│                                                                                  │
│   All clients see the new project at the same time!                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Domain Entity Relationships

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ENTITY RELATIONSHIP DIAGRAM                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────┐                                                             │
│  │ ExecutorProfile │                                                             │
│  ├─────────────────┤         ┌────────────────┐                                 │
│  │ id              │         │     Project    │                                 │
│  │ name            │         ├────────────────┤                                 │
│  │ cli_tool        │         │ id             │                                 │
│  │ command         │         │ name           │                                 │
│  │ args            │         │ git_repo_path  │                                 │
│  │ env             │         │ setup_script   │                                 │
│  │ model           │         │ cleanup_script │                                 │
│  │ is_default      │         │ rules          │                                 │
│  └─────────────────┘         │ is_archived    │                                 │
│         │                    │ created_at     │                                 │
│         │ used by            │ updated_at     │                                 │
│         │                    └───────┬────────┘                                 │
│         │                            │                                           │
│         │                            │ has many                                  │
│         ▼                            ▼                                           │
│  ┌──────────────────┐         ┌────────────────┐                                │
│  │ExecutionProcess  │         │      Task      │◄──────────┐                    │
│  ├──────────────────┤         ├────────────────┤           │                    │
│  │ id               │         │ id             │           │ parent_task_id     │
│  │ chat_id          │◄────────│ project_id     │           │ (self-reference    │
│  │ executor_profile │         │ parent_task_id ├───────────┘  for subtasks)     │
│  │ status           │         │ title          │                                │
│  │ exit_code        │         │ description    │                                │
│  │ working_dir      │         │ status         │                                │
│  │ command          │         │ workflow_name  │                                │
│  │ started_at       │         │ artifacts_path │                                │
│  │ completed_at     │         │ is_archived    │                                │
│  └──────────────────┘         │ created_at     │                                │
│                               │ updated_at     │                                │
│                               └───────┬────────┘                                │
│                                       │                                          │
│                                       │ has many                                 │
│                                       ▼                                          │
│                               ┌────────────────┐                                │
│                               │      Chat      │                                │
│  ┌──────────────────┐         ├────────────────┤                                │
│  │     Setting      │         │ id             │                                │
│  ├──────────────────┤         │ task_id        │ (nullable for standalone)      │
│  │ key (PK)         │         │ project_id     │ (nullable)                     │
│  │ value            │         │ title          │                                │
│  │ updated_at       │         │ role           │ (requirements/spec/impl/etc)   │
│  └──────────────────┘         │ branch_name    │                                │
│                               │ worktree_path  │                                │
│                               │ worktree_status│                                │
│                               │ is_archived    │                                │
│                               │ claude_session │                                │
│                               │ created_at     │                                │
│                               │ updated_at     │                                │
│                               └───────┬────────┘                                │
│                                       │                                          │
│                                       │ has many                                 │
│                                       ▼                                          │
│                               ┌────────────────┐                                │
│                               │    Message     │                                │
│                               ├────────────────┤                                │
│                               │ id             │                                │
│                               │ chat_id        │                                │
│                               │ role           │ (user/assistant/system)        │
│                               │ content        │                                │
│                               │ tool_calls     │ (JSON)                         │
│                               │ tokens_used    │                                │
│                               │ is_streaming   │                                │
│                               │ created_at     │                                │
│                               │ updated_at     │                                │
│                               └────────────────┘                                │
│                                                                                  │
│  Legend:                                                                         │
│  ───────► : Foreign key relationship (one-to-many)                              │
│  ◄──────  : References (belongs to)                                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Process Management Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          PROCESS OUTPUT STREAMING                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                        openflow-process Crate                               │ │
│  │                                                                              │ │
│  │  ┌─────────────────┐                                                        │ │
│  │  │   PtyManager    │ ◄─── Manages all PTY processes                         │ │
│  │  │   (executor)    │                                                        │ │
│  │  └────────┬────────┘                                                        │ │
│  │           │                                                                  │ │
│  │           │ spawn()                                                          │ │
│  │           ▼                                                                  │ │
│  │  ┌─────────────────┐     ┌──────────────────────────────────────────────┐   │ │
│  │  │  PTY Process    │────►│  Background Task                              │   │ │
│  │  │  (child proc)   │     │  (reads output continuously)                  │   │ │
│  │  └─────────────────┘     └────────────────────┬─────────────────────────┘   │ │
│  │                                               │                              │ │
│  └───────────────────────────────────────────────┼──────────────────────────────┘ │
│                                                  │                                │
│                                                  │ OutputChunk { type, content }  │
│                                                  ▼                                │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                        openflow-core Crate                                  │ │
│  │                                                                              │ │
│  │  ┌─────────────────┐                                                        │ │
│  │  │ ProcessService  │ ◄─── Wraps PTY, adds DB tracking                       │ │
│  │  │                 │                                                        │ │
│  │  └────────┬────────┘                                                        │ │
│  │           │                                                                  │ │
│  │           │ broadcast(ProcessOutput event)                                   │ │
│  │           ▼                                                                  │ │
│  │  ┌─────────────────┐                                                        │ │
│  │  │EventBroadcaster │ ◄─── Trait implemented by:                             │ │
│  │  │    (trait)      │      - TauriBroadcaster (emits Tauri events)           │ │
│  │  │                 │      - WsBroadcaster (sends to WebSocket)              │ │
│  │  └────────┬────────┘                                                        │ │
│  │           │                                                                  │ │
│  └───────────┼──────────────────────────────────────────────────────────────────┘ │
│              │                                                                    │
│              │ Event: process-output-{id}                                         │
│              │ { processId, outputType, content, timestamp }                      │
│              │                                                                    │
│    ┌─────────┴─────────┬──────────────────────────────────────┐                  │
│    │                   │                                      │                  │
│    ▼                   ▼                                      ▼                  │
│  ┌───────────┐   ┌──────────────┐                      ┌──────────────┐          │
│  │  Tauri    │   │  WebSocket   │                      │  WebSocket   │          │
│  │  Event    │   │  Client 1    │                      │  Client 2    │          │
│  │  (IPC)    │   │              │                      │              │          │
│  └─────┬─────┘   └──────┬───────┘                      └──────┬───────┘          │
│        │                │                                     │                  │
│        ▼                ▼                                     ▼                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                         Frontend (React)                                   │  │
│  │                                                                            │  │
│  │  ┌──────────────────┐     ┌──────────────────┐     ┌────────────────────┐ │  │
│  │  │ useProcessOutput │────►│ Output State     │────►│ Terminal UI        │ │  │
│  │  │ (hook)           │     │ [line1, line2..] │     │ <ProcessOutput />  │ │  │
│  │  └──────────────────┘     └──────────────────┘     └────────────────────┘ │  │
│  │                                                                            │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Transport Abstraction

The frontend uses a transport abstraction that automatically detects the runtime context:

```typescript
// packages/queries/transport/index.ts
export interface Transport {
  invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T>;
  subscribe(channel: string, handler: (event: unknown) => void): () => void;
}

// Automatic detection
export function isTauriContext(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}
```

**Tauri Transport:** Uses `@tauri-apps/api/core` invoke and `@tauri-apps/api/event` listen.

**HTTP Transport:** Uses `fetch()` for REST API calls and WebSocket for real-time events. Commands are mapped to HTTP endpoints via the generated command map.

### Real-Time Synchronization

All data mutations broadcast events to connected clients via WebSocket:

```typescript
// Event types
interface DataChangedEvent {
  entity: 'project' | 'task' | 'chat' | 'message' | 'setting';
  action: 'created' | 'updated' | 'deleted';
  id: string;
  data?: unknown;  // Full entity for create/update
}

interface ProcessOutputEvent {
  processId: string;
  outputType: 'stdout' | 'stderr';
  content: string;
  timestamp: string;
}
```

**Event Channels:**
- `data-changed` - All entity CRUD operations
- `process-output-{id}` - Process stdout/stderr streaming
- `process-status-{id}` - Process lifecycle events

The `useDataSync` hook subscribes to `data-changed` and automatically invalidates TanStack Query caches.

### API Contract System

Types are defined once in Rust with `#[typeshare]` and validation annotations, then generated to TypeScript:

```rust
// crates/openflow-contracts/src/requests/project.rs

/// Request to create a new project
///
/// @endpoint: POST /api/projects
/// @command: create_project
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectRequest {
    /// Project name (required, 1-255 chars)
    /// @validate: required, min_length=1, max_length=255
    pub name: String,

    /// Path to git repository (required)
    /// @validate: required, format=path
    pub git_repo_path: String,
}
```

**Generation Pipeline:**
```
Rust Contracts ──▶ typeshare ──▶ TypeScript Types
                └──▶ generate-zod.ts ──▶ Zod Schemas
                └──▶ generate-queries.ts ──▶ Query Functions
                └──▶ generate-command-map.ts ──▶ HTTP Mapping
```

Run `pnpm generate:all` to regenerate all TypeScript from Rust sources.

### Dependency Hierarchy

The frontend follows a strict one-way dependency hierarchy. Higher levels may import from lower levels, never the reverse:

```
Level 5: Routes (page orchestration)
Level 4: UI Components (stateless, props-only)
Level 3: Hooks (TanStack Query, state management)
Level 2: Queries (Tauri invoke wrappers)
Level 1: Validation (Zod schemas)
Level 0: Generated Types, Utilities (no internal imports)
```

This hierarchy is enforced by the architecture validation script in pre-push hooks.

### Type Generation Flow

Types are defined once in Rust with `#[typeshare]` attributes and automatically generate TypeScript. The flow is unidirectional:

Rust Types -> typeshare CLI -> Generated TypeScript -> Zod Schemas -> Frontend

Never manually edit generated types. When types need to change, modify the Rust source.

## Core Patterns

### Stateless UI Components

All UI components are pure functions of their props. They receive data and callback functions, render UI, and call callbacks on user interaction. They never:

- Call Tauri invoke directly
- Use TanStack Query hooks
- Contain business logic
- Access global state

This makes components testable in Storybook with just props.

### Service Layer Pattern (Rust)

Business logic lives in service modules that operate on the database pool. Services are pure functions that take dependencies as arguments and return Results. Commands are thin wrappers that extract state, call services, and map errors.

### Query/Hook Separation

Queries are thin wrappers around Tauri invoke calls that handle serialization. Hooks wrap queries with TanStack Query for caching, invalidation, and loading states. This separation allows queries to be used outside React when needed.

### Event-Driven Process Output

Long-running processes (CLI tools, dev servers) stream output via Tauri events. The frontend subscribes to process-specific event channels and aggregates output in local state.

## Primitives System

OpenFlow uses a primitives package (`@openflow/primitives`) to enforce semantic HTML usage and accessibility compliance across the UI.

### What Are Primitives?

Primitives are React components that wrap raw HTML elements with:
- Accessibility defaults (ARIA attributes, roles, focus management)
- Responsive prop support via `ResponsiveValue<T>`
- Consistent styling through Tailwind classes
- TypeScript enforcement (e.g., `alt` required on Image, `aria-label` required on Section)

### Available Primitives

| Category | Components |
|----------|------------|
| Layout | `Box`, `Flex`, `Grid`, `Stack` |
| Typography | `Text`, `Heading`, `Paragraph` |
| Lists | `List`, `ListItem` |
| Interactive | `Link`, `Image` |
| Accessibility | `VisuallyHidden` |
| Landmarks | `Section`, `Article`, `Nav`, `Main`, `Aside`, `Header`, `Footer` |

### Import Rules

**CRITICAL:** These rules are enforced by the `validate:primitives` validator.

1. **Only `@openflow/primitives` may use raw HTML tags** (`<div>`, `<span>`, `<p>`, etc.)
2. **Only `@openflow/ui/atoms` may import from `@openflow/primitives`**
3. **All other UI packages must use atoms or higher-level components**

```typescript
// ❌ WRONG - Raw HTML in atoms/molecules/organisms
const Card = () => <div className="p-4">...</div>;

// ✅ CORRECT - Use primitives in atoms
import { Box } from '@openflow/primitives';
const Card = () => <Box p="4">...</Box>;

// ❌ WRONG - Importing primitives in molecules
import { Flex } from '@openflow/primitives'; // Only atoms can do this

// ✅ CORRECT - Molecules use atoms
import { Card } from '@openflow/ui/atoms';
```

### ResponsiveValue Pattern

All primitives support breakpoint-aware props:

```typescript
type ResponsiveValue<T> = T | {
  base?: T;  // Default (mobile-first)
  sm?: T;    // 640px+
  md?: T;    // 768px+
  lg?: T;    // 1024px+
  xl?: T;    // 1280px+
  '2xl'?: T; // 1536px+
};

// Example: Responsive padding
<Box p={{ base: '2', md: '4', lg: '6' }}>
  Content adapts to screen size
</Box>

// Example: Responsive flex direction
<Flex direction={{ base: 'column', md: 'row' }}>
  Stacks on mobile, horizontal on desktop
</Flex>
```

### Key Enforcement Points

- **Image**: `alt` prop is required (TypeScript error if missing)
- **Section**: `aria-label` prop is required for landmark identification
- **Link**: External links automatically get `rel="noopener noreferrer"`
- **VisuallyHidden**: For screen-reader-only content (skip links, announcements)

## Logging Conventions

OpenFlow uses structured logging throughout the codebase with consistent patterns for debugging, monitoring, and error tracking.

### Logger Setup

All hooks, queries, and Rust services use contextual loggers:

```typescript
// TypeScript (hooks/queries)
import { createLogger } from '@openflow/utils';

const logger = createLogger('useProjects');
// Creates logger with context tag for filtering

// Child loggers for sub-contexts
const validatorLogger = logger.child('validator');
// Logs as "useProjects:validator"
```

```rust
// Rust (services)
use log::{debug, info, warn, error};

// Context is the module name, set at module level
```

### Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `debug` | Detailed info for development/debugging | Function entry, intermediate steps, state changes |
| `info` | Successful operations worth noting | "Created project", "Fetched 42 tasks" |
| `warn` | Non-fatal issues, deprecated usage | "Profile not found, using default", "Validation failed" |
| `error` | Failures requiring attention | "Failed to save", "Database connection lost" |

### Hook Logging Pattern

All hooks follow this pattern:

```typescript
const logger = createLogger('useProjects');

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      logger.debug('Fetching projects');
      try {
        const result = await projectQueries.list();
        logger.info('Projects fetched', {
          count: result.length,
          names: result.slice(0, 3).map(p => p.name)
        });
        return result;
      } catch (error) {
        logger.error('Failed to fetch projects', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    },
  });
}
```

**Key points:**
- `debug` on function entry with parameters
- `info` on success with summary data (counts, names)
- `error` on failure with error message
- Re-throw errors for React Query to handle

### Query Logging Pattern

```typescript
const logger = createLogger('queries:projects');

export async function list(): Promise<Project[]> {
  logger.debug('Fetching project list');
  try {
    const result = await invoke<Project[]>('list_projects');
    logger.info('Projects fetched', {
      count: result.length
    });
    return result;
  } catch (error) {
    logger.error('Failed to fetch projects', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
```

### Rust Service Logging Pattern

```rust
pub fn create(pool: &DbPool, input: CreateProjectInput) -> ServiceResult<Project> {
    debug!("Creating project: name={}, path={}", input.name, input.git_repo_path);

    // ... implementation ...

    info!("Created project: id={}, name={}", project.id, project.name);
    Ok(project)
}
```

### Backend Logging Configuration

The Rust backend uses `tracing` for structured logging. Configure logging via environment variables or CLI flags.

**Environment Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `RUST_LOG` | Log level filter | `debug`, `info`, `warn`, `error` |
| `OPENFLOW_VERBOSE` | Enable debug logging | `1` |
| `OPENFLOW_JSON_LOGS` | Enable JSON log format | `1` |

**RUST_LOG Filter Syntax:**

```bash
# Set global log level
RUST_LOG=debug cargo run -p openflow-server

# Set per-crate log levels
RUST_LOG=openflow_server=debug,openflow_core=info cargo run -p openflow-server

# Filter to specific targets
RUST_LOG=openflow_server::routes=debug cargo run -p openflow-server
```

**JSON Log Format:**

For production/log aggregation, enable JSON output:

```bash
# Via CLI flag
cargo run -p openflow-server -- --json

# Via environment variable
OPENFLOW_JSON_LOGS=1 cargo run -p openflow-server
```

JSON output includes structured fields:
```json
{"timestamp":"2024-01-15T10:30:00Z","level":"INFO","target":"openflow_server","message":"Server starting","version":"0.1.0","host":"127.0.0.1","port":3001}
```

**Default Log Levels:**

- Development (`pnpm dev`): `info` for all OpenFlow crates
- Verbose (`--verbose`): `debug` for all OpenFlow crates
- Production: Configure via `RUST_LOG` as needed

### What NOT to Log

- **Sensitive data**: Passwords, tokens, API keys, setting values
- **Large payloads**: Full file contents, base64 blobs
- **High-frequency events**: Every keystroke, every scroll event

Instead, log metadata:
```typescript
// ❌ Don't log the actual value
logger.info('Setting saved', { value: settingValue });

// ✅ Log metadata only
logger.info('Setting saved', { key: 'theme', valueLength: 12 });
```

## Error Handling Conventions

OpenFlow uses consistent error handling patterns across the frontend and backend.

### Frontend Error Handling

#### Queries: Try/Catch with Re-throw

```typescript
// All queries wrap invoke in try/catch
export async function create(input: CreateInput): Promise<Entity> {
  try {
    const result = await invoke<Entity>('create_entity', { input });
    return result;
  } catch (error) {
    logger.error('Failed to create entity', { error: ... });
    throw error; // Re-throw for React Query
  }
}
```

#### Hooks: onSuccess/onError Callbacks with Toast

```typescript
export function useCreateProject() {
  const toast = useToast();

  return useMutation({
    mutationFn: projectQueries.create,
    onSuccess: (project) => {
      toast.success(`Created "${project.name}"`);
      logger.info('Project created', { id: project.id });
    },
    onError: (error) => {
      toast.error('Failed to create project', {
        description: error.message
      });
      logger.error('Failed to create project', { error: ... });
    },
  });
}
```

#### Session Hooks: Validation Before Operations

```typescript
const handleSubmit = async () => {
  // 1. Validate
  if (!title.trim()) {
    logger.warn('Validation failed: empty title');
    setError('Title is required');
    return;
  }

  // 2. Call mutation
  try {
    await createMutation.mutateAsync({ title });
  } catch (error) {
    // Error already handled by mutation's onError
  }
};
```

### Backend Error Handling (Rust)

#### Services Return Result Types

```rust
// All service functions return ServiceResult<T>
pub fn get(pool: &DbPool, id: &str) -> ServiceResult<Project> {
    let project = projects::table
        .find(id)
        .first::<Project>(&mut conn)
        .map_err(|e| ServiceError::NotFound(format!("Project {id}")))?;

    Ok(project)
}
```

#### Use anyhow Context

```rust
use anyhow::Context;

let file = std::fs::read_to_string(&path)
    .with_context(|| format!("Failed to read workflow file: {}", path))?;
```

#### No Panics in Service Layer

```rust
// ❌ Never do this in services
let value = map.get("key").unwrap();

// ✅ Return errors gracefully
let value = map.get("key")
    .ok_or_else(|| ServiceError::InvalidInput("Missing key".into()))?;
```

## Accessibility Patterns

OpenFlow follows WCAG 2.1 Level AA compliance with these patterns enforced throughout the UI.

### Required ARIA Patterns

| Pattern | Implementation |
|---------|---------------|
| Touch targets | Minimum 44x44px on mobile (`min-h-[44px] min-w-[44px]`) |
| Focus rings | `focus-visible:ring-2 focus-visible:ring-offset-2` |
| Color independence | Status conveyed via icon + text, not color alone |
| Reduced motion | `motion-safe:` prefix on all animations |
| Screen reader announcements | `VisuallyHidden` with `aria-live` regions |

### Component Accessibility Checklist

All UI components must implement:

1. **Keyboard navigation** - Arrow keys, Enter/Space, Escape, Tab
2. **Focus management** - Focus trap in dialogs, focus restoration on close
3. **ARIA roles** - Proper role attributes (`button`, `listbox`, `dialog`, etc.)
4. **Labels** - `aria-label` or `aria-labelledby` on interactive elements
5. **States** - `aria-expanded`, `aria-selected`, `aria-pressed`, `aria-disabled`
6. **Announcements** - Live regions for dynamic content changes

### Loading/Error/Empty States

Every data-fetching component must handle:

```typescript
// Skeleton components for loading
<ComponentSkeleton count={5} />

// Error states with retry
<ComponentError
  message="Failed to load"
  onRetry={refetch}
/>

// Empty states with action
<EmptyState
  icon={InboxIcon}
  title="No items yet"
  description="Create your first item to get started"
  action={{ label: "Create item", onClick: handleCreate }}
/>
```

### Screen Reader Announcements

Use `VisuallyHidden` for dynamic announcements:

```typescript
<VisuallyHidden>
  <span role="status" aria-live="polite">
    {isLoading ? 'Loading...' : `Loaded ${items.length} items`}
  </span>
</VisuallyHidden>
```

### forwardRef Pattern

All components support ref forwarding for focus management:

```typescript
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => (
    <button ref={ref} {...props}>{children}</button>
  )
);
```

### Data Attributes for Testing

All components include testability attributes:

```typescript
<Component
  data-testid="project-card"
  data-project-id={project.id}
  data-state={isSelected ? 'selected' : 'default'}
/>
```

## Data Model

### Core Entities

- **Project:** Links to a local git repository with configuration for scripts, rules, and workflows
- **Task:** A unit of work following a workflow, with status and optional parent task
- **Chat:** A conversation session for a workflow step, with its own git worktree branch
- **Message:** Content within a chat (user, assistant, system roles)
- **ExecutionProcess:** Tracks CLI process lifecycle with status and output
- **ExecutorProfile:** Configuration for which CLI tool to use

### Git Worktree Convention

Each chat gets an isolated worktree with branch naming: `openflow/{task_id}/{chat_role}`. Worktrees live outside the main repo in a dedicated directory. The lifecycle is: create worktree -> run setup script -> execute agent work -> run cleanup script -> delete worktree.

## Workflow System

Workflows are markdown files defining sequential steps. Each step becomes a chat session. Steps are parsed from markdown with this format:

```
### [ ] Step: Step Name
Step instructions here
```

Variables like `{@artifacts_path}` are substituted at runtime.

## Testing Approach

- Rust services use unit tests with test databases
- Frontend hooks mock Tauri invoke
- UI components test in Storybook isolation
- Architecture rules validated in pre-push

## Commands Reference

```bash
# Development Modes
pnpm dev              # Start Tauri desktop app with embedded HTTP server on port 3001
pnpm dev:server       # Start standalone HTTP server only (no Tauri, no GUI)
pnpm dev:web          # Start Vite frontend only (expects backend at localhost:3001)
pnpm dev:all          # Start standalone server + frontend (no Tauri desktop app)
pnpm storybook        # Component development

# Build Commands
pnpm build            # Build Tauri desktop app
pnpm build:server     # Build standalone server binary (target/release/openflow-server)

# Type generation
pnpm generate:types   # Regenerate TS from Rust
pnpm generate:all     # Run all generators (types, zod, queries, command-map, routes)

# Route generation
pnpm tsr generate     # Regenerate TanStack Router routes after adding/modifying route files

# Validation
pnpm typecheck        # TypeScript check
pnpm lint             # Biome lint/format
pnpm test             # Vitest tests
pnpm validate:arch    # Check dependency rules
pnpm validate:all     # Run all validators
pnpm validate:blocking # Run blocking validators only

# Rust
cd src-tauri && cargo check
cd src-tauri && cargo test
cd src-tauri && cargo clippy -- -D warnings
cargo run -p openflow-server -- --help  # Run standalone server with CLI options

# Docker
docker compose up                    # Start server with Docker Compose
docker compose -f docker-compose.prod.yml up  # Production mode with resource limits
docker build -t openflow-server .    # Build server image
```

### Development Modes Explained

OpenFlow supports flexible deployment through multiple development modes:

| Mode | Command | Description | Use Case |
|------|---------|-------------|----------|
| **Desktop (Default)** | `pnpm dev` | Tauri app with embedded HTTP server | Local desktop development |
| **Server Only** | `pnpm dev:server` | Standalone HTTP/WS server | Cloud deployment, testing |
| **Web Only** | `pnpm dev:web` | Vite frontend only | Frontend development |
| **Full Web Stack** | `pnpm dev:all` | Server + Frontend (no Tauri) | Browser-based development |

**Embedded Server Behavior:**
- When running `pnpm dev`, an HTTP/WebSocket server starts on port 3001
- Browser clients can connect to `http://localhost:3001` for REST API
- WebSocket available at `ws://localhost:3001/ws` for real-time updates
- Both Tauri IPC and HTTP clients share the same database and state
- Data changes in Tauri app instantly sync to browser clients and vice versa

## REST API Reference

The HTTP server exposes a REST API at `http://localhost:3001/api/`.

All request and response bodies use JSON with `camelCase` field names. All endpoints return JSON responses.

### Common Response Patterns

**Success (200 OK):**
```json
{ "id": "uuid", "name": "Example", ... }
```

**Not Found (404):**
```json
{ "error": "Not found: Project abc123" }
```

**Validation Error (400):**
```json
{ "error": "Name is required" }
```

---

### Health

#### GET /api/health
Check server and database status.

**Response:**
```json
{
  "status": "ok",
  "version": "0.1.0",
  "database": "connected"
}
```

---

### Projects

#### GET /api/projects
List all non-archived projects (ordered by name).

**Response:**
```json
[
  {
    "id": "proj_abc123",
    "name": "My Project",
    "gitRepoPath": "/path/to/repo",
    "baseBranch": "main",
    "setupScript": "npm install",
    "devScript": "npm run dev",
    "cleanupScript": null,
    "copyFiles": null,
    "icon": "folder",
    "ruleFolders": null,
    "alwaysIncludedRules": null,
    "workflowsFolder": ".workflows",
    "verificationConfig": null,
    "archivedAt": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### GET /api/projects/archived
List all archived projects (ordered by archived_at).

#### GET /api/projects/:id
Get a project by ID.

**Response:** Single project object (same structure as above)

#### POST /api/projects
Create a new project.

**Request:**
```json
{
  "name": "My Project",
  "gitRepoPath": "/path/to/repo",
  "baseBranch": "main",
  "setupScript": "npm install",
  "devScript": "npm run dev",
  "cleanupScript": "npm run clean",
  "copyFiles": "[\"config.json\"]",
  "icon": "rocket",
  "ruleFolders": "[\".rules\"]",
  "alwaysIncludedRules": "[\"base.md\"]",
  "workflowsFolder": ".workflows",
  "verificationConfig": "{\"test\": \"npm test\"}"
}
```

Required fields: `name`, `gitRepoPath`

#### PATCH /api/projects/:id
Update a project (partial update).

**Request:**
```json
{
  "name": "Updated Name",
  "setupScript": "pnpm install"
}
```

#### DELETE /api/projects/:id
Delete a project permanently.

#### POST /api/projects/:id/archive
Archive a project (sets `archivedAt` timestamp).

#### POST /api/projects/:id/unarchive
Unarchive a project (clears `archivedAt`).

---

### Tasks

#### GET /api/tasks
List tasks with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `projectId` | string | Filter by project (required) |
| `status` | string | Filter by status: `pending`, `in_progress`, `completed`, `archived` |
| `includeArchived` | boolean | Include archived tasks (default: false) |

**Example:** `GET /api/tasks?projectId=proj_abc&status=in_progress`

**Response:**
```json
[
  {
    "id": "task_xyz789",
    "projectId": "proj_abc123",
    "parentTaskId": null,
    "title": "Implement feature X",
    "description": "Detailed description here",
    "status": "in_progress",
    "workflowTemplate": "builtin:feature",
    "artifactsPath": "/path/to/artifacts",
    "baseBranch": "main",
    "isArchived": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### GET /api/tasks/archived?projectId=xxx
List archived tasks for a project.

#### GET /api/tasks/:id
Get a task by ID.

#### GET /api/tasks/:id/children
Get child tasks (subtasks) of a task.

#### POST /api/tasks
Create a new task.

**Request:**
```json
{
  "projectId": "proj_abc123",
  "title": "Implement feature X",
  "description": "Detailed description",
  "workflowTemplate": "builtin:feature",
  "parentTaskId": null,
  "baseBranch": "develop"
}
```

Required fields: `projectId`, `title`

#### PATCH /api/tasks/:id
Update a task (partial update).

**Request:**
```json
{
  "title": "Updated title",
  "status": "completed"
}
```

#### DELETE /api/tasks/:id
Delete a task permanently.

#### POST /api/tasks/:id/archive
Archive a task.

#### POST /api/tasks/:id/unarchive
Unarchive a task.

#### POST /api/tasks/:id/duplicate
Duplicate a task (creates a copy with "(copy)" suffix).

**Response:** The newly created duplicate task.

---

### Chats

#### GET /api/chats
List chats with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `taskId` | string | Filter by task ID |

**Response:**
```json
[
  {
    "id": "chat_def456",
    "projectId": "proj_abc123",
    "taskId": "task_xyz789",
    "title": "Requirements Discussion",
    "chatRole": "requirements",
    "executorProfileId": null,
    "branchName": "openflow/task_xyz/requirements",
    "worktreePath": "/worktrees/chat_def456",
    "worktreeStatus": "active",
    "claudeSession": null,
    "initialPrompt": null,
    "hiddenPrompt": null,
    "isPlanContainer": false,
    "mainChatId": null,
    "workflowStepIndex": 0,
    "isArchived": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### GET /api/chats/standalone
List standalone chats (not associated with any task).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `projectId` | string | Filter by project (optional) |

#### GET /api/chats/by-project?projectId=xxx
List all chats for a project (across all tasks).

#### GET /api/chats/archived
List archived chats.

#### GET /api/chats/:id
Get a chat by ID.

#### POST /api/chats
Create a new chat.

**Request:**
```json
{
  "projectId": "proj_abc123",
  "taskId": "task_xyz789",
  "title": "Implementation Chat",
  "chatRole": "implementation",
  "executorProfileId": "profile_123",
  "baseBranch": "develop",
  "initialPrompt": "Let's implement the feature",
  "hiddenPrompt": "Follow TDD practices",
  "isPlanContainer": false,
  "mainChatId": null,
  "workflowStepIndex": 2
}
```

Required fields: `projectId`

**Chat Roles:** `requirements`, `spec`, `implementation`, `review`, `testing`, `general`

#### PATCH /api/chats/:id
Update a chat.

#### DELETE /api/chats/:id
Delete a chat.

#### POST /api/chats/:id/archive
Archive a chat.

#### POST /api/chats/:id/unarchive
Unarchive a chat.

---

### Messages

#### GET /api/messages?chatId=xxx
List messages for a chat (ordered by created_at).

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chatId` | string | Yes | Chat ID to list messages for |

**Response:**
```json
[
  {
    "id": "msg_123",
    "chatId": "chat_def456",
    "role": "user",
    "content": "Please implement the login feature",
    "model": null,
    "toolCalls": null,
    "tokensUsed": null,
    "isStreaming": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "msg_124",
    "chatId": "chat_def456",
    "role": "assistant",
    "content": "I'll implement the login feature...",
    "model": "claude-3-opus",
    "toolCalls": "[{\"name\":\"write_file\",\"arguments\":{...}}]",
    "tokensUsed": 1500,
    "isStreaming": false,
    "createdAt": "2024-01-15T10:31:00Z",
    "updatedAt": "2024-01-15T10:31:00Z"
  }
]
```

**Message Roles:** `user`, `assistant`, `system`

#### GET /api/messages/:id
Get a message by ID.

#### GET /api/messages/count?chatId=xxx
Get message count for a chat.

**Response:**
```json
{ "count": 42 }
```

#### GET /api/messages/latest?chatId=xxx
Get the latest message for a chat.

**Response:** Single message object or `null`

#### POST /api/messages
Create a new message.

**Request:**
```json
{
  "chatId": "chat_def456",
  "role": "user",
  "content": "Hello, please help me with...",
  "model": null,
  "toolCalls": null,
  "isStreaming": false
}
```

Required fields: `chatId`, `role`, `content`

#### PATCH /api/messages/:id
Update a message.

**Request:**
```json
{
  "content": "Updated content",
  "tokensUsed": 500
}
```

#### DELETE /api/messages/:id
Delete a message.

#### DELETE /api/messages/by-chat?chatId=xxx
Delete all messages for a chat.

**Response:**
```json
5
```
(Number of deleted messages)

#### PATCH /api/messages/:id/streaming
Set streaming status of a message.

**Request:**
```json
{ "isStreaming": false }
```

#### POST /api/messages/:id/append
Append content to a streaming message.

**Request:**
```json
{ "content": " more text here" }
```

#### PATCH /api/messages/:id/tokens
Set token usage for a message.

**Request:**
```json
{ "tokensUsed": 1500 }
```

---

### Processes

#### GET /api/processes
List execution processes with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `chatId` | string | Filter by chat ID |
| `runningOnly` | boolean | Only return running processes |

**Response:**
```json
[
  {
    "id": "proc_789",
    "chatId": "chat_def456",
    "executorProfileId": "profile_123",
    "status": "running",
    "exitCode": null,
    "workingDir": "/path/to/worktree",
    "command": "claude",
    "args": "[\"--verbose\"]",
    "startedAt": "2024-01-15T10:30:00Z",
    "completedAt": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

**Process Status:** `pending`, `running`, `completed`, `failed`, `killed`

#### GET /api/processes/:id
Get a process by ID.

#### POST /api/processes/:id/kill
Kill a running process.

**Response:** Updated process object with `status: "killed"`

#### POST /api/processes/:id/input
Send input to a running process (PTY).

**Request:**
```json
{ "input": "yes\n" }
```

#### POST /api/processes/:id/resize
Resize the PTY terminal.

**Request:**
```json
{ "cols": 120, "rows": 40 }
```

---

### Git Operations

#### GET /api/git/worktrees?repoPath=xxx
List all git worktrees for a repository.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repoPath` | string | Yes | Path to the git repository |

**Response:**
```json
[
  {
    "path": "/worktrees/feature-branch",
    "branch": "feature/login",
    "head": "abc123def456",
    "isMainWorktree": false,
    "isLocked": false,
    "isBare": false
  }
]
```

#### POST /api/git/worktrees
Create a new worktree.

**Request:**
```json
{
  "repoPath": "/path/to/repo",
  "path": "/worktrees/new-feature",
  "branch": "feature/new-feature",
  "baseBranch": "main"
}
```

#### DELETE /api/git/worktrees
Delete a worktree.

**Request:**
```json
{
  "repoPath": "/path/to/repo",
  "path": "/worktrees/old-feature"
}
```

#### GET /api/git/diff?repoPath=xxx
Get the diff for a repository.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `repoPath` | string | Path to the repository (required) |
| `worktreePath` | string | Worktree path (optional) |
| `staged` | boolean | Get staged changes only |

**Response:**
```json
{
  "diff": "diff --git a/file.rs b/file.rs\n...",
  "stats": { "filesChanged": 3, "insertions": 42, "deletions": 10 }
}
```

#### GET /api/git/commits?repoPath=xxx
Get recent commits.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `repoPath` | string | Required |
| `limit` | number | Max commits (default: 10) |
| `branch` | string | Branch name (optional) |

#### GET /api/git/branches?repoPath=xxx
List branches.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `repoPath` | string | Required |
| `remote` | boolean | Include remote branches |

#### GET /api/git/current-branch?repoPath=xxx
Get the current branch name.

---

### Executor Profiles

#### GET /api/executor/profiles
List all executor profiles (ordered by name).

**Response:**
```json
[
  {
    "id": "profile_123",
    "name": "Claude Code",
    "description": "Default Claude Code profile",
    "command": "claude",
    "args": "[\"--verbose\", \"--no-confirm\"]",
    "env": "{\"ANTHROPIC_API_KEY\": \"...\"}",
    "model": "claude-3-opus",
    "isDefault": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### GET /api/executor/profiles/default
Get the default executor profile.

**Response:** Single profile object or `null`

#### GET /api/executor/profiles/:id
Get a profile by ID.

#### POST /api/executor/profiles
Create a new executor profile.

**Request:**
```json
{
  "name": "Gemini CLI",
  "description": "Google Gemini CLI",
  "command": "gemini",
  "args": "[\"--model\", \"gemini-pro\"]",
  "env": "{\"GOOGLE_API_KEY\": \"...\"}",
  "model": "gemini-pro",
  "isDefault": false
}
```

Required fields: `name`, `command`

#### PATCH /api/executor/profiles/:id
Update an executor profile.

#### DELETE /api/executor/profiles/:id
Delete an executor profile.

#### POST /api/executor/run
Run an executor (AI agent) in a chat.

**Request:**
```json
{
  "chatId": "chat_def456",
  "prompt": "Please implement the login feature",
  "executorProfileId": "profile_123"
}
```

**Response:** ExecutionProcess object (see Processes section)

---

### Settings

#### GET /api/settings
Get all settings.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `prefix` | string | Filter by key prefix (e.g., `app.`) |

**Response:**
```json
{
  "app.theme": "dark",
  "app.language": "en",
  "user.name": "John"
}
```

#### GET /api/settings/:key
Get a setting value by key.

**Response:**
```json
"dark"
```
(Returns `null` if not found)

#### GET /api/settings/:key/full
Get full setting with metadata.

**Response:**
```json
{
  "key": "app.theme",
  "value": "dark",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### GET /api/settings/:key/exists
Check if a setting exists.

**Response:**
```json
true
```

#### GET /api/settings/:key/or-default?default=xxx
Get a setting with fallback.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `default` | string | Default value if key doesn't exist |

#### PUT /api/settings/:key
Set a setting value.

**Request:**
```json
{ "value": "dark" }
```

**Response:** Full setting object

#### PUT /api/settings/batch
Set multiple settings atomically.

**Request:**
```json
{
  "app.theme": "dark",
  "app.language": "en",
  "app.fontSize": "14"
}
```

#### DELETE /api/settings/:key
Delete a setting.

#### DELETE /api/settings/all
Delete all settings (requires confirmation).

**Request:**
```json
{ "confirm": true }
```

**Response:**
```json
{ "deletedCount": 42 }
```

---

### Search

#### GET /api/search
Full-text search across all entities.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (required) |
| `projectId` | string | Filter by project |
| `types` | string | Comma-separated types: `task,project,chat,message` |
| `limit` | number | Maximum results |

**Example:** `GET /api/search?q=login&types=task,chat&limit=20`

**Response:**
```json
[
  {
    "id": "task_xyz",
    "type": "task",
    "title": "Implement login",
    "snippet": "...user login feature...",
    "projectId": "proj_abc",
    "score": 0.95
  }
]
```

#### GET /api/search/tasks?q=xxx
Search tasks only.

#### GET /api/search/projects?q=xxx
Search projects only.

---

### Terminal

#### POST /api/terminal/spawn
Spawn a new terminal session.

**Request:**
```json
{
  "workingDir": "/path/to/directory",
  "command": "/bin/bash",
  "args": [],
  "env": {}
}
```

**Response:** ExecutionProcess object

#### GET /api/terminal/shell
Get the default shell path.

**Response:**
```json
"/bin/zsh"
```

#### GET /api/terminal/shell/details
Get detailed shell information.

**Response:**
```json
{
  "shell": "/bin/zsh",
  "name": "zsh",
  "args": []
}
```

---

### Workflows

#### GET /api/workflows/templates
List workflow templates.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `folder` | string | Path to custom templates folder |
| `includeBuiltin` | boolean | Include built-in templates |

Without `folder`, returns built-in templates only.

**Response:**
```json
[
  {
    "id": "builtin:feature",
    "name": "Feature",
    "description": "Standard feature development workflow",
    "isBuiltin": true,
    "content": "# Feature Workflow\n...",
    "steps": [
      {
        "name": "Requirements",
        "description": "Gather requirements...",
        "status": "pending",
        "chatId": null
      },
      {
        "name": "Technical Specification",
        "description": "Create tech spec...",
        "status": "pending",
        "chatId": null
      }
    ]
  }
]
```

**Built-in Templates:** `builtin:feature`, `builtin:bugfix`, `builtin:refactor`

#### GET /api/workflows/templates/builtin
Get all built-in workflow templates.

#### GET /api/workflows/templates/builtin/:id
Get a specific built-in template.

#### GET /api/workflows/templates/:id
Get a template by ID.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `folder` | string | Required for file-based templates (`file:*`) |

#### POST /api/workflows/parse
Parse workflow markdown into steps.

**Request:**
```json
{
  "content": "# Workflow\n\n### [ ] Step: First\nDo first thing.\n\n### [-] Step: Second\nIn progress.\n\n### [x] Step: Third\nCompleted."
}
```

**Response:**
```json
[
  { "name": "First", "description": "Do first thing.", "status": "pending", "chatId": null },
  { "name": "Second", "description": "In progress.", "status": "in_progress", "chatId": null },
  { "name": "Third", "description": "Completed.", "status": "completed", "chatId": null }
]
```

**Step Markers:**
- `[ ]` - Pending
- `[-]` - In Progress
- `[x]` - Completed

#### POST /api/workflows/substitute
Substitute variables in content.

**Request:**
```json
{
  "content": "Save to {@artifacts_path}/spec.md",
  "variables": {
    "artifacts_path": "/tasks/123"
  }
}
```

**Response:**
```json
"Save to /tasks/123/spec.md"
```

#### POST /api/workflows/substitute/context
Substitute using WorkflowContext.

**Request:**
```json
{
  "content": "{@artifacts_path} in {@project_root}",
  "context": {
    "artifactsPath": "/tasks/123",
    "projectRoot": "/home/project",
    "worktreePath": "/worktrees/chat_abc",
    "taskId": "task_xyz",
    "taskTitle": "My Task",
    "projectName": "My Project"
  }
}
```

---

### WebSocket Protocol

Connect to `ws://localhost:3001/ws` for real-time events.

#### Client Messages

**Subscribe to a channel:**
```json
{ "type": "subscribe", "content": { "channel": "data-changed" } }
```

**Unsubscribe from a channel:**
```json
{ "type": "unsubscribe", "content": { "channel": "data-changed" } }
```

**Ping (keepalive):**
```json
{ "type": "ping" }
```

#### Server Messages

**Connection established:**
```json
{ "type": "connected", "content": { "clientId": "uuid-here" } }
```

**Subscription confirmed:**
```json
{ "type": "subscribed", "content": { "channel": "data-changed" } }
```

**Event received:**
```json
{
  "type": "event",
  "content": {
    "channel": "data-changed",
    "payload": {
      "entity": "project",
      "action": "created",
      "id": "proj_abc123",
      "data": { "id": "proj_abc123", "name": "New Project", ... }
    }
  }
}
```

**Pong response:**
```json
{ "type": "pong" }
```

#### Event Channels

| Channel | Description |
|---------|-------------|
| `data-changed` | All entity CRUD operations |
| `process-output-{id}` | Process stdout/stderr streaming |
| `process-status-{id}` | Process lifecycle events |

#### Data Changed Event Payload

```json
{
  "entity": "project",
  "action": "created",
  "id": "proj_abc123",
  "data": { ... }
}
```

**Entities:** `project`, `task`, `chat`, `message`, `setting`, `executor_profile`, `process`

**Actions:** `created`, `updated`, `deleted`

## Environment Variables

OpenFlow supports environment variables for configuration in all deployment modes. Copy `.env.example` to `.env` or `.env.local` to set values.

### Backend Server

These variables configure the standalone server (`pnpm dev:server`) or the embedded server in Tauri.

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENFLOW_HOST` | Server bind address. Use `0.0.0.0` to listen on all interfaces. | `127.0.0.1` |
| `OPENFLOW_PORT` | Server port for HTTP/WebSocket | `3001` |
| `DATABASE_PATH` | SQLite database file path | `./openflow.db` |
| `DATABASE_URL` | SQLite connection URL (e.g., `sqlite:/path/to/db`) | - |
| `OPENFLOW_DATA_DIR` | Directory for database (appends `openflow.db`) | - |
| `DATABASE_MAX_CONNECTIONS` | Maximum database connection pool size | `5` |
| `OPENFLOW_VERBOSE` | Enable debug logging (`1`, `true`, `yes`) | - |
| `OPENFLOW_JSON_LOGS` | Enable JSON log format for log aggregation (`1`) | - |
| `RUST_LOG` | Log level filter (see Logging section) | `info` |
| `OPENFLOW_CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `localhost:5173,localhost:1420` |

**Database Path Priority:**
1. `DATABASE_URL` (if set, parsed as SQLite URL)
2. `DATABASE_PATH` (direct file path)
3. `OPENFLOW_DATA_DIR` (directory, appends `openflow.db`)
4. Default: `./openflow.db`

**Example Usage:**
```bash
# Start server on custom port with verbose logging
OPENFLOW_PORT=8080 OPENFLOW_VERBOSE=1 pnpm dev:server

# Start server listening on all interfaces (for Docker/remote access)
OPENFLOW_HOST=0.0.0.0 pnpm dev:server

# Production with JSON logs
OPENFLOW_JSON_LOGS=1 RUST_LOG=info pnpm dev:server

# Custom database location
DATABASE_PATH=/var/lib/openflow/data.db pnpm dev:server
```

### Frontend

These variables configure the web frontend (`pnpm dev:web`).

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend server URL for HTTP/WebSocket | `http://localhost:3001` |

**Note:** `VITE_BACKEND_URL` is only used when running in browser mode (outside Tauri). When running in Tauri (`pnpm dev`), the app uses IPC and ignores this variable.

**Example Usage:**
```bash
# Connect to a remote server
VITE_BACKEND_URL=https://api.openflow.example.com pnpm dev:web

# Connect to custom local port
VITE_BACKEND_URL=http://localhost:8080 pnpm dev:web
```

### Docker

These variables are used by `docker-compose.yml`.

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENFLOW_PORT` | Host port to expose (maps to container port 3001) | `3001` |

All `OPENFLOW_*` backend variables are also used inside the container.

**Example Usage:**
```bash
# Run on custom port
OPENFLOW_PORT=8080 docker compose up

# Run with production settings
OPENFLOW_JSON_LOGS=1 docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

### Variable Reference by Deployment Mode

| Variable | Desktop (`pnpm dev`) | Server (`pnpm dev:server`) | Web (`pnpm dev:web`) | Docker |
|----------|:-------------------:|:--------------------------:|:--------------------:|:------:|
| `OPENFLOW_HOST` | - | ✓ | - | ✓ |
| `OPENFLOW_PORT` | - | ✓ | - | ✓ |
| `DATABASE_PATH` | ✓ | ✓ | - | ✓ |
| `DATABASE_URL` | ✓ | ✓ | - | ✓ |
| `OPENFLOW_DATA_DIR` | ✓ | ✓ | - | ✓ |
| `DATABASE_MAX_CONNECTIONS` | ✓ | ✓ | - | ✓ |
| `OPENFLOW_VERBOSE` | ✓ | ✓ | - | ✓ |
| `OPENFLOW_JSON_LOGS` | - | ✓ | - | ✓ |
| `RUST_LOG` | ✓ | ✓ | - | ✓ |
| `OPENFLOW_CORS_ORIGINS` | ✓ | ✓ | - | ✓ |
| `VITE_BACKEND_URL` | - | - | ✓ | - |

## Docker Deployment

### Quick Start

```bash
# Development with Docker Compose
docker compose up

# Production mode (with resource limits and JSON logs)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Build image only
docker build -t openflow-server .

# Run standalone container
docker run -p 3001:3001 -v openflow-data:/app/data openflow-server
```

### Configuration

**docker-compose.yml:**
```yaml
services:
  server:
    build: .
    ports:
      - "${OPENFLOW_PORT:-3001}:3001"
    volumes:
      - openflow-data:/app/data
    environment:
      - RUST_LOG=info
      - DATABASE_PATH=/app/data/openflow.db
```

**Production Overrides (docker-compose.prod.yml):**
- JSON logging enabled for log aggregation
- Resource limits: 2 CPU, 1GB memory
- Log rotation: 10MB max, 5 files
- Restart policy: `always`

### Health Check

```bash
curl http://localhost:3001/api/health
# {"status":"ok","version":"0.1.0","database":"connected"}
```

## Validation Suite

OpenFlow includes a comprehensive validation suite that enforces architectural patterns, detects code quality issues, and prevents regressions. Validators run in pre-push hooks and GitHub Actions CI.

### Quick Reference

```bash
# Run all validators
pnpm validate:all

# Run only blocking validators (must pass)
pnpm validate:blocking

# Run with JSON reports
pnpm validate:all --report

# Run in parallel (faster)
pnpm validate:all --parallel

# Run specific validator
pnpm validate:arch
pnpm validate:ui
pnpm validate:queries
pnpm validate:hooks
pnpm validate:zod
pnpm validate:circular
pnpm validate:routes
pnpm validate:dead-code
pnpm validate:type-staleness
pnpm validate:storybook
pnpm validate:coverage
pnpm validate:tauri
pnpm validate:rust
```

### Validator Categories

Validators are divided into two categories based on their severity:

**Blocking Validators** (must pass for push/CI):
| Validator | Script | Description |
|-----------|--------|-------------|
| Architecture | `validate:arch` | Enforces dependency hierarchy between packages |
| UI Stateless | `validate:ui` | Ensures UI components don't use hooks/queries directly |
| Query Layer | `validate:queries` | Validates queries are thin invoke wrappers |
| Hook Layer | `validate:hooks` | Ensures hooks use queries, not direct invoke |
| Circular Deps | `validate:circular` | Detects circular dependencies |
| Type Staleness | `validate:type-staleness` | Ensures generated types are fresh |
| Tauri Commands | `validate:tauri` | Validates all Rust commands are registered |
| Dead Code | `validate:dead-code` | Identifies unused exports/dependencies |

**Non-Blocking Validators** (warnings only):
| Validator | Script | Description |
|-----------|--------|-------------|
| Zod Coverage | `validate:zod` | Reports types missing Zod schemas |
| Route Validator | `validate:routes` | Checks route file patterns and size |
| Storybook | `validate:storybook` | Reports components missing stories |
| Test Coverage | `validate:coverage` | Checks test coverage thresholds |
| Rust Services | `validate:rust` | Validates Rust service layer pattern |
| Primitives | `validate:primitives` | Flags raw HTML tags outside primitives package |
| Accessibility | `validate:a11y` | Static accessibility checks (alt text, button names, etc.) |

### Validation Rules

#### Architecture Validator (`validate:arch`)
Enforces the dependency hierarchy defined in the Architecture section.

| Rule | Severity | Description |
|------|----------|-------------|
| `arch/level-violation` | error | Package imports from higher-level package |
| `arch/circular-import` | error | Circular dependency between packages |

#### UI Stateless Validator (`validate:ui`)
Ensures UI components remain pure functions of props.

| Rule | Severity | Description |
|------|----------|-------------|
| `ui/no-tauri-invoke` | error | No imports from @tauri-apps/api/core |
| `ui/no-tanstack-query` | error | No imports from @tanstack/react-query |
| `ui/no-hooks-package` | error | No imports from @openflow/hooks |
| `ui/no-queries-package` | error | No imports from @openflow/queries |

#### Query Layer Validator (`validate:queries`)
Validates queries are thin wrappers around Tauri invoke.

| Rule | Severity | Description |
|------|----------|-------------|
| `query/must-use-invoke` | error | Exported functions must call invoke |
| `query/no-react-hooks` | error | No React hook definitions (use* functions) |
| `query/must-return-promise` | warning | Functions should return Promise |

#### Hook Layer Validator (`validate:hooks`)
Ensures hooks use the query layer for data fetching.

| Rule | Severity | Description |
|------|----------|-------------|
| `hook/no-direct-invoke` | error | No imports from @tauri-apps/api/core |
| `hook/must-use-queries` | warning | Data hooks should import from queries |

Exceptions: Event subscription hooks (`use*Events`, `use*Output`) and local state hooks.

#### Circular Dependency Validator (`validate:circular`)
Detects dependency cycles at package and module levels.

| Rule | Severity | Description |
|------|----------|-------------|
| `circular/package-level` | error | Cycle between @openflow/* packages |
| `circular/module-level` | warning | Cycle between modules within a package |

#### Type Staleness Validator (`validate:type-staleness`)
Ensures generated TypeScript types match Rust source.

| Rule | Severity | Description |
|------|----------|-------------|
| `types/stale-generation` | error | Generated types older than Rust source |
| `types/manual-edits` | error | Manual edits detected in generated file |

Fix: Run `pnpm generate:types` to regenerate.

#### Zod Coverage Validator (`validate:zod`)
Tracks Zod schema coverage for API types.

| Rule | Severity | Description |
|------|----------|-------------|
| `zod/missing-input-schema` | error | Input type needs Zod schema |
| `zod/missing-output-schema` | warning | Output type needs Zod schema |
| `zod/unused-schema` | info | Schema defined but not used |

#### Route Validator (`validate:routes`)
Checks route files follow architecture patterns.

| Rule | Severity | Description |
|------|----------|-------------|
| `route/no-queries-import` | warning | Routes should use hooks, not queries |
| `route/no-direct-invoke` | error | No direct Tauri invoke in routes |
| `route/max-lines` | warning | Route file exceeds 300 lines |

#### Dead Code Validator (`validate:dead-code`)
Identifies unused code for cleanup.

| Rule | Severity | Description |
|------|----------|-------------|
| `dead/unused-export` | info | Export not imported anywhere |
| `dead/unused-dependency` | warning | Package.json dependency not used |
| `dead/orphan-file` | info | File has no importers |

#### Storybook Validator (`validate:storybook`)
Ensures UI components have Storybook stories.

| Rule | Severity | Description |
|------|----------|-------------|
| `storybook/missing-story` | warning | Component has no story file |
| `storybook/orphan-story` | info | Story for non-existent component |

#### Test Coverage Validator (`validate:coverage`)
Enforces minimum test coverage thresholds.

| Package | Minimum Coverage |
|---------|-----------------|
| hooks | 40% |
| queries | 60% |
| validation | 80% |
| overall | 30% |

Requires: Run `pnpm test --coverage` first to generate coverage data.

#### Tauri Command Validator (`validate:tauri`)
Validates Rust command registration.

| Rule | Severity | Description |
|------|----------|-------------|
| `tauri/unregistered-command` | error | #[tauri::command] not registered |
| `tauri/orphan-registration` | warning | Registered but no handler exists |
| `tauri/naming-convention` | info | Command name not snake_case |

#### Rust Service Validator (`validate:rust`)
Enforces Rust service layer patterns.

| Rule | Severity | Description |
|------|----------|-------------|
| `rust/business-in-command` | warning | Complex logic in command handler |
| `rust/service-not-result` | error | Service must return Result type |
| `rust/command-complexity` | info | Command exceeds 20 lines |

### Bypass Mechanisms

**Skip pre-push validation entirely:**
```bash
SKIP_VALIDATION=1 git push
```

**Skip specific validators:**
```bash
pnpm validate:all --validators arch,ui,queries
```

**Run only non-blocking validators:**
```bash
pnpm validate:all --non-blocking
```

### JSON Reports

All validators support JSON output for CI integration:

```bash
# Generate individual report
pnpm validate:arch --report
# Output: reports/architecture.json

# Generate all reports
pnpm validate:all --report
# Output: reports/all.json (aggregated)
```

**Report Schema:**
```typescript
interface ValidationReport {
  validator: string;
  timestamp: string;
  status: 'pass' | 'fail' | 'warn';
  counts: {
    errors: number;
    warnings: number;
    info: number;
  };
  violations: Violation[];
  executionTimeMs: number;
  metadata?: Record<string, unknown>;
}

interface Violation {
  file: string;
  line?: number;
  column?: number;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}
```

### Pre-Push Hook Phases

The pre-push hook runs validation in phases:

1. **Generation** - Regenerate types and routes if needed
2. **Type Checking** - TypeScript compilation
3. **Linting** - Biome lint/format check
4. **Blocking Validators** - Must pass (architecture, UI, queries, hooks, etc.)
5. **Unit Tests** - Vitest test suite
6. **Rust Validation** - cargo check, test, clippy
7. **Non-Blocking Validators** - Warnings only, doesn't fail push

### CI Integration

GitHub Actions runs validation on every PR:

- Blocking validators must pass for merge
- Non-blocking validators report as warnings
- JSON reports uploaded as artifacts
- PR comments show validation summary

### Adding New Validators

1. Create `scripts/validate-<name>.ts`
2. Import shared libraries from `scripts/lib/`
3. Use `Reporter` class for output
4. Add script to `package.json`
5. Add to `VALIDATOR_CONFIGS` in `scripts/lib/config.ts`
6. Update `scripts/validate-all.ts` with new validator
7. Document in this section

## Commit Guidelines

- Make atomic commits with clear messages
- Pre-commit runs lint-staged (Biome + cargo fmt)
- Pre-push runs full verification suite
- Never skip hooks unless explicitly needed

## MCP Server for AI Agents

OpenFlow includes a Model Context Protocol (MCP) server that enables AI agents to start, stop, and interact with the application. This creates a feedback loop for AI-assisted development.

### MCP Server Configuration

Configure Claude Code or other MCP clients to use the OpenFlow MCP server:

```json
{
  "mcpServers": {
    "openflow": {
      "command": "npx",
      "args": ["tsx", "packages/mcp-server/index.ts"],
      "cwd": "/path/to/openflow"
    }
  }
}
```

### Available MCP Tools

**Lifecycle Tools:**
- `openflow_start` - Start the Tauri dev server (includes MCP GUI plugin)
- `openflow_stop` - Stop the running application
- `openflow_status` - Get current app state (running, stopped, uptime, etc.)
- `openflow_restart` - Restart the application
- `openflow_logs` - Get recent dev server output
- `openflow_wait_ready` - Wait for dev server to be ready

**Development Tools:**
- `openflow_lint` - Run Biome linting (with optional fix mode)
- `openflow_typecheck` - Run TypeScript type checking
- `openflow_test` - Run Vitest tests (with optional filter)
- `openflow_build` - Build the application
- `openflow_generate_types` - Regenerate TypeScript types from Rust
- `openflow_rust_check` - Run cargo check on the Rust backend

**UI Tools (require visible window):**
- `openflow_screenshot` - Take a screenshot of the app window
- `openflow_inspect` - Get DOM/HTML content
- `openflow_click` - Click an element or coordinates
- `openflow_type` - Type text into an element
- `openflow_key` - Send keyboard shortcuts
- `openflow_evaluate` - Execute JavaScript in the webview
- `openflow_console` - Get browser console messages
- `openflow_wait_for_element` - Wait for a DOM element to appear

### AI Agent Workflow

Typical development cycle using MCP tools:

1. Make code changes
2. Run `openflow_typecheck` to verify types
3. Run `openflow_lint` to check code style
4. Run `openflow_start` to launch the app
5. Use `openflow_screenshot` / `openflow_inspect` to verify UI
6. Run `openflow_test` to ensure tests pass
7. Run `openflow_stop` when done

### Process Cleanup

If orphaned processes are left running after a session:

```bash
# Run the cleanup script
pnpm mcp:cleanup

# Manual cleanup if needed
pkill -f "pnpm.*dev.*openflow"
pkill -f "vite.*openflow"
pkill -f "tauri.*openflow"
rm -f /tmp/openflow-mcp.sock
```

The MCP server automatically cleans up on graceful shutdown (SIGINT/SIGTERM). Always use `openflow_stop` before ending a session to ensure proper cleanup.

### Troubleshooting

**App won't start:**
- Check if another instance is already running: `pnpm mcp:cleanup`
- Check port conflicts: `lsof -i :5173` or `lsof -i :1420`

**UI tools not working:**
- UI tools require the app window to be visible on the desktop
- The tauri-plugin-mcp-gui socket must be active (`/tmp/openflow-mcp.sock`)
- If window is minimized/hidden, stop and guide the user to start the app and bring it to focus, then retry the UI tool.


**Socket connection failures:**
- Ensure the app was started with `openflow_start` (not `pnpm dev`)
- Check socket exists: `ls -la /tmp/openflow-mcp.sock`
- Run cleanup and restart: `pnpm mcp:cleanup && openflow_start`

## Implementation Notes

### Adding New Features (Contract-First)

1. **Define contracts in Rust** (`crates/openflow-contracts/`)
   - Add entity types in `src/entities/`
   - Add request types in `src/requests/` with `@validate:` annotations
   - Add to `src/endpoints/mod.rs` for code generation metadata

2. **Implement service layer** (`crates/openflow-core/src/services/`)
   - Create service module with CRUD functions
   - Use `ServiceResult<T>` for error handling
   - Add unit tests with in-memory database

3. **Add HTTP routes** (`crates/openflow-server/src/routes/`)
   - Create route handlers using openflow-core services
   - Broadcast `DataChanged` events for mutations
   - Add to router in `routes/mod.rs`

4. **Add Tauri commands** (`src-tauri/src/commands/`)
   - Create thin command handlers calling openflow-core services
   - Register in `src-tauri/src/lib.rs`

5. **Generate TypeScript**
   ```bash
   pnpm generate:all  # Types, Zod, queries, command map
   ```

6. **Add frontend integration**
   - Create hooks in `packages/hooks/`
   - Build UI components (stateless, props-only)
   - Compose in route pages

### Modifying Existing Code

1. Read the file first to understand context
2. Follow existing patterns in the codebase
3. Update types at the source (Rust contracts) first
4. Run `pnpm generate:all` after Rust changes
5. Run `cargo test --workspace` to verify backend
6. Run `pnpm validate:all` before committing

### Service Layer Guidelines

```rust
// crates/openflow-core/src/services/example.rs

pub async fn create(pool: &SqlitePool, request: CreateRequest) -> ServiceResult<Entity> {
    // 1. Validate input
    if request.name.is_empty() {
        return Err(ServiceError::validation("Name is required"));
    }

    // 2. Perform operation
    let entity = sqlx::query_as!(...)
        .fetch_one(pool)
        .await
        .map_err(ServiceError::from)?;

    // 3. Return result (caller handles events)
    Ok(entity)
}
```

### Route Handler Guidelines

```rust
// crates/openflow-server/src/routes/example.rs

pub async fn create(
    State(state): State<AppState>,
    Json(request): Json<CreateRequest>,
) -> Result<Json<Entity>, ServerError> {
    // 1. Call service
    let entity = example::create(&state.pool, request).await?;

    // 2. Broadcast event
    state.broadcast(Event::created(EntityType::Example, &entity.id, &entity));

    // 3. Return response
    Ok(Json(entity))
}
```


