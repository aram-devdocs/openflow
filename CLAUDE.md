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


