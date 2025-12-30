# OpenFlow

AI Task Orchestration Desktop Application

## Overview

OpenFlow orchestrates AI coding CLI tools (Claude Code, Gemini CLI, Codex CLI, Cursor CLI) to build reliable software through spec-driven workflows, parallel execution, and automated verification. It wraps existing CLI tools developers already use and provides coordination through isolated git worktrees, multi-agent workflows, and built-in quality gates.

## Architecture

### System Design

OpenFlow follows a Tauri 2 architecture with a Rust backend and React TypeScript frontend. The system is divided into two main layers:

**Backend (Rust):** Handles IPC commands, database operations, process management (PTY/spawning), git worktree lifecycle, and CLI tool execution. Business logic lives in services that are called by thin command handlers.

**Frontend (React/TypeScript):** Stateless UI components composed into pages. Data flows one direction from Rust types through generated TypeScript to validation schemas to query wrappers to hooks to UI.

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
# Development
pnpm dev              # Start Tauri dev mode
pnpm storybook        # Component development

# Type generation
pnpm generate:types   # Regenerate TS from Rust

# Route generation
pnpm tsr generate     # Regenerate TanStack Router routes after adding/modifying route files

# Validation
pnpm typecheck        # TypeScript check
pnpm lint             # Biome lint/format
pnpm test             # Vitest tests
pnpm validate:arch    # Check dependency rules

# Rust
cd src-tauri && cargo check
cd src-tauri && cargo test
cd src-tauri && cargo clippy -- -D warnings
```

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

When implementing new features:

1. Start with Rust types marked `#[typeshare]`
2. Run type generation to update TypeScript
3. Add Zod schemas if needed for validation
4. Create query wrappers for new commands
5. Add hooks for React integration
6. Build UI components (stateless, props-only)
7. Compose in route pages

When modifying existing code:

1. Read the file first to understand context
2. Follow existing patterns in the codebase
3. Update types at the source (Rust) first
4. Run verification before committing


