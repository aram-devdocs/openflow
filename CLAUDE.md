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
pnpm validate:all     # Run all validators
pnpm validate:blocking # Run blocking validators only

# Rust
cd src-tauri && cargo check
cd src-tauri && cargo test
cd src-tauri && cargo clippy -- -D warnings
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


