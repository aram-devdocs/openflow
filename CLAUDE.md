# OpenFlow

AI Task Orchestration Desktop Application - wraps AI coding CLI tools to build reliable software through spec-driven workflows, parallel execution, and automated verification.

## Architecture Overview

**Backend (Rust):** Modular crates with shared business logic. The core crate contains all services, shared by both Tauri desktop commands and HTTP server routes.

**Frontend (React/TypeScript):** Layered packages with strict one-way dependencies. Transport abstraction auto-detects Tauri IPC vs HTTP context.

**Deployment Modes:** Desktop app (Tauri with embedded server), standalone server, or web frontend connecting to remote server.

## Development Philosophy

### Contract-First Development
Types are defined in Rust with typeshare annotations, then generated to TypeScript. Never manually edit generated types - modify Rust source and regenerate.

### Layered Architecture
Both backend and frontend follow strict layering. Higher layers depend on lower layers, never the reverse. Validators enforce these boundaries.

### Stateless UI
UI components are pure functions of props. They receive data and callbacks, render UI, never fetch data or contain business logic.

### Service Layer Pattern
Business logic lives in service functions that take dependencies as arguments and return Results. Command/route handlers are thin wrappers.

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

## Where to Find More

Subdirectory CLAUDE.md files contain patterns specific to each layer:
- `crates/` - Rust backend patterns
- `packages/` - Frontend package hierarchy
- `src/` - Application layer patterns
- `src-tauri/` - Tauri integration patterns
- `scripts/` - Validator and generator patterns

Each package and crate has its own CLAUDE.md with layer-specific guidance.
