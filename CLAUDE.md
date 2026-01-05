# OpenFlow

AI Task Orchestration Desktop Application - wraps AI coding CLI tools to build reliable software through spec-driven workflows, parallel execution, and automated verification.

## Architecture Overview

**Backend-Owned State Machine:** All execution and state lives in Rust/SQLite. Frontend is a pure view layer that queries backend state.

**Multi-Provider Support:** AgentProvider trait normalizes CLI outputs from Claude Code, Gemini CLI, Codex CLI, and others into a unified event format.

**Autonomous Execution:** TaskExecutor runs tasks from start to finish without frontend interaction. Backend continues even if all frontends disconnect.

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (React) - Pure View Layer                             │
│  - Queries backend for current state (TanStack Query)          │
│  - Subscribes to events that invalidate queries                │
│  - Sends commands to backend (start task, approve permission)  │
│  - NO business state (UI-only: selectedTaskId, theme, etc.)    │
└─────────────────────────────────────────────────────────────────┘
                                    │
                    Tauri IPC  /    │    \  WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND (Rust) - Source of Truth                               │
│                                                                 │
│  TaskExecutor         - Autonomous task execution engine       │
│  AgentOrchestrator    - Manages agent processes                │
│  AgentProvider trait  - Normalizes CLI outputs                 │
│  SQLite               - Persistent state, audit trail          │
└─────────────────────────────────────────────────────────────────┘
```

**Deployment Modes:** Desktop app (Tauri with embedded server), standalone server, or web frontend connecting to remote server.

## Development Philosophy

### Contract-First Development
Types are defined in Rust with typeshare annotations, then generated to TypeScript. Never manually edit generated types - modify Rust source and regenerate.

### Layered Architecture
Both backend and frontend follow strict layering. Higher layers depend on lower layers, never the reverse. Validators enforce these boundaries.

### Stateless UI
UI components are pure functions of props. They receive data and callbacks, render UI, never fetch data or contain business logic. Frontend state is UI-only (selected items, panel visibility).

### Service Layer Pattern
Business logic lives in service functions that take dependencies as arguments and return Results. Command/route handlers are thin wrappers.

### Backend-Owned State
All business state lives in the backend (SQLite). Frontend queries backend via TanStack Query and subscribes to events that invalidate queries. No business state accumulation in frontend.

## Essential Commands

```bash
pnpm dev              # Desktop app with embedded server
pnpm dev:server       # Standalone server only
pnpm dev:all          # Server + web frontend

pnpm generate:all     # Regenerate types from Rust
pnpm validate:all     # Run all validators
pnpm lint             # Biome lint/format
pnpm test             # Vitest tests
```

## Code Quality

- Validators enforce architecture rules in pre-push hooks
- Pre-commit runs lint-staged for formatting
- Generated types must stay in sync with Rust source
- All UI components must be testable in Storybook isolation

## Commit Guidelines

- Make atomic commits with clear messages
- Never skip pre-commit/pre-push hooks unless explicitly needed
- Use conventional commit format
- Include `Co-Authored-By` for AI-assisted commits

## Adding New Features

1. Define contracts in Rust (entities, requests)
2. Implement service layer with proper error handling
3. Add route handlers that call services and broadcast events
4. Generate TypeScript types
5. Create hooks that wrap queries
6. Build stateless UI components
7. Compose in route pages

## Adding New Agent Providers

1. Create provider in `crates/openflow-core/src/providers/`
2. Implement `AgentProvider` trait (build_command, parse_line, etc.)
3. Register in `ProviderRegistry`
4. Add provider ID constant
5. Test with mock output samples

See `providers/claude_code.rs` as reference implementation.

## Where to Find More

Subdirectory CLAUDE.md files contain patterns specific to each layer:
- `crates/` - Rust backend patterns
- `packages/` - Frontend package hierarchy
- `src/` - Application layer patterns
- `src-tauri/` - Tauri integration patterns
- `scripts/` - Validator and generator patterns

Each package and crate has its own CLAUDE.md with layer-specific guidance.
