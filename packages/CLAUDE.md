# Frontend Packages

## Architecture: Pure View Layer

Frontend is a pure view layer. All business state lives in the backend. Frontend queries backend via TanStack Query and subscribes to events that invalidate queries.

**Key Principle:** No business state accumulation in frontend. Events trigger query invalidation, not state updates.

## Package Hierarchy

Packages follow a strict one-way dependency hierarchy. Higher levels may import from lower levels, never the reverse.

**Levels (high to low):**
- Routes (application pages, orchestration)
- UI (stateless components)
- Hooks (TanStack Query, event subscriptions, UI-only Zustand stores)
- Queries (transport wrappers)
- Validation (Zod schemas)
- Generated/Utils (foundation, no internal imports)

## Import Rules

These rules are enforced by validators:
- UI cannot import hooks, queries, or call backend directly
- Hooks must use queries, not direct invoke
- Queries are thin wrappers around backend calls
- Generated types are read-only, never edit manually

## Type Generation

Rust is the source of truth for types. The generation flow:
1. Define types in Rust with typeshare
2. Run generators to create TypeScript
3. Zod schemas generated from type annotations
4. Query functions generated from endpoint metadata

Never manually edit generated files. If types need to change, modify Rust and regenerate.

## Package Responsibilities

- **generated:** Auto-generated types from Rust
- **validation:** Zod schemas for runtime validation
- **queries:** Thin wrappers for backend calls (taskExecution, agentSession)
- **hooks:** React hooks with TanStack Query, event subscriptions, ViewStore (UI-only Zustand)
- **primitives:** Accessible HTML element wrappers
- **ui:** Stateless React components (TaskExecutionView, StepProgress)
- **utils:** Pure utility functions

## Key Hooks

- **useTaskExecution** - Task lifecycle (start, pause, resume, cancel)
- **useAgentSession** - Session queries and terminal control
- **useEventSubscription** - Subscribe to backend events, invalidate queries
- **ViewStore** - UI-only state (selectedTaskId, sidebarOpen, etc.)

## Event Subscription Pattern

```typescript
// Subscribe to task events - invalidates queries when events arrive
useTaskSubscription(taskId);

// Query task data - re-fetches when subscription invalidates
const { data } = useTaskWithSteps(taskId);
```

See individual package CLAUDE.md files for package-specific patterns.
