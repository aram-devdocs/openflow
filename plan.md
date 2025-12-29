# OpenFlow Project Plan

>  AI task orchestration app using **Tauri + Rust + React/TypeScript**


---

## Architecture Overview

```
~/dev/openflow/
├── src-tauri/                    # Rust backend (embedded in Tauri)
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── types/                # #[typeshare] structs (SOURCE OF TRUTH)
│   │   ├── commands/             # Tauri IPC handlers (replaces HTTP routes)
│   │   ├── services/             # Business logic
│   │   ├── db/                   # SQLite + SQLx
│   │   └── ai/                   # Claude integration
│   ├── migrations/
│   └── Cargo.toml
├── packages/                     # pnpm workspace packages
│   ├── generated/                # Auto-generated from Rust via typeshare
│   │   └── types.ts
│   ├── ui/                       # Stateless UI components (atomic design)
│   │   ├── atoms/
│   │   ├── molecules/
│   │   ├── organisms/
│   │   └── templates/
│   ├── hooks/                    # React hooks (state, data fetching)
│   ├── queries/                  # Tauri invoke wrappers
│   ├── validation/               # Zod schemas (derived from generated types)
│   └── utils/                    # Pure utilities
├── src/                          # React app (thin orchestration layer)
│   ├── routes/                   # Page components (<200 lines each)
│   └── main.tsx
├── scripts/
│   ├── generate-types.sh
│   └── validate-architecture.ts
├── CLAUDE.md
└── package.json
```

---

## Technology Choices

| Category | Choice | Rationale |
|----------|--------|-----------|
| Desktop framework | Tauri 2 | Small bundle (~10MB), embedded Rust, native CLI access |
| Backend | Rust | Type safety, performance, typeshare integration |
| Frontend | React 18 | Familiar, scalable component model |
| Routing | TanStack Router | Type-safe, file-based routing |
| Server state | TanStack Query | Caching, invalidation, loading states |
| Client state | useState/useReducer | KISS - add Zustand only if needed |
| Component dev | Storybook | Enforce stateless UI, visual testing |
| Styling | Tailwind CSS | Utility-first, design tokens |
| Validation | Zod | Type inference, shared schemas |
| Linting/Format | Biome | Fast, unified tool |
| Testing | Vitest | Fast, Vite-native |

---

## Sources of Truth (Single Direction Flow)

| Source | Generates | Used By |
|--------|-----------|---------|
| `src-tauri/src/types/*.rs` | TypeScript types via typeshare | Frontend types |
| `src-tauri/migrations/*.sql` | Database schema | Rust SQLx |
| Generated TS types | Zod schemas in `packages/validation/` | Form validation |
| Tailwind config | Design tokens | UI components |

**Key Rule:** Types flow ONE direction: `Rust → TypeShare → TypeScript → Zod`

---

## Dependency Hierarchy (One-Way Only)

```
Level 5: src/routes/              (app layer - orchestration only)
Level 4: packages/ui/             (stateless components - props only)
Level 3: packages/hooks/          (React hooks, state management)
Level 2: packages/queries/        (Tauri invoke wrappers)
Level 1: packages/validation/     (Zod schemas)
Level 0: packages/generated/      (TypeShare output - DO NOT EDIT)
         packages/utils/          (pure utilities)
```

**Absolute Rules:**
- UI components CANNOT import hooks or queries
- Hooks import from queries (not vice versa)
- No package imports from `src/` (app layer)
- `packages/generated/` is read-only (auto-generated)

---

## Tauri Commands (Replaces HTTP API)

```rust
// src-tauri/src/commands/tasks.rs
use crate::types::{Task, CreateTaskRequest};
use crate::services::TaskService;

#[tauri::command]
pub async fn list_tasks(
    state: tauri::State<'_, AppState>,
    project_id: Option<String>,
) -> Result<Vec<Task>, String> {
    TaskService::list(&state.db, project_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_task(
    state: tauri::State<'_, AppState>,
    request: CreateTaskRequest,
) -> Result<Task, String> {
    TaskService::create(&state.db, request)
        .await
        .map_err(|e| e.to_string())
}
```

```typescript
// packages/queries/tasks.ts
import { invoke } from '@tauri-apps/api/core';
import type { Task, CreateTaskRequest } from '@openflow/generated';

export const taskQueries = {
  list: (projectId?: string): Promise<Task[]> =>
    invoke('list_tasks', { projectId }),

  create: (request: CreateTaskRequest): Promise<Task> =>
    invoke('create_task', { request }),
};
```

---

## Stateless UI Architecture

**Components receive everything via props, emit actions via callbacks:**

```tsx
// packages/ui/organisms/TaskList.tsx
interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onTaskClick?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TaskList({ tasks, isLoading, onTaskClick, onDelete }: TaskListProps) {
  // UI ONLY - no hooks, no data fetching, no invoke calls
  if (isLoading) return <TaskListSkeleton />;
  return (/* render tasks */);
}
```

**Forbidden in UI components:**
- `invoke()` calls
- `useQuery` / `useMutation`
- Business logic
- Global state access

**Storybook test:** Every component must render in Storybook with just props.

---

## Hooks Layer (Data + State)

```tsx
// packages/hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskQueries } from '@openflow/queries';
import type { CreateTaskRequest } from '@openflow/generated';

export function useTasks(projectId?: string) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => taskQueries.list(projectId),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateTaskRequest) => taskQueries.create(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
```

---

## App Layer (Thin Orchestration with TanStack Router)

```tsx
// src/routes/tasks.tsx (<200 lines)
import { createFileRoute } from '@tanstack/react-router';
import { TaskList } from '@openflow/ui';
import { useTasks, useCreateTask } from '@openflow/hooks';

export const Route = createFileRoute('/tasks')({
  component: TasksPage,
});

function TasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const createTask = useCreateTask();

  // Orchestration: connect data to UI, handle mutations
  return (
    <TaskList
      tasks={tasks ?? []}
      isLoading={isLoading}
      onDelete={(id) => /* handle delete */}
    />
  );
}
```

---

## Tripwire Validation (Safety Net)

### Pre-commit (Fast, Staged Files Only)
```bash
pnpm lint-staged  # Biome lint + format
```

### Pre-push (Comprehensive)
```bash
pnpm generate:types      # Regenerate TS from Rust
pnpm typecheck           # Full TypeScript check
pnpm lint                # Full Biome check
pnpm test                # Unit tests
pnpm validate:arch       # Architecture rules
cd src-tauri && cargo check && cargo test
```

### Architecture Validation Rules
- No `packages/ui/*` importing from `packages/hooks/` or `packages/queries/`
- No `packages/*` importing from `src/`
- All Tauri types from `packages/generated/`
- Generated files not manually edited

---

## Type Generation Flow

```
Rust structs (#[typeshare])  →  typeshare CLI  →  packages/generated/types.ts
                                                          ↓
                                              Frontend imports types
                                                          ↓
                                              Zod schemas for validation
```

### scripts/generate-types.sh
```bash
#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "Generating TypeScript types from Rust..."
cd src-tauri
typeshare --lang=typescript --output-file=../packages/generated/types.ts ./src

echo "Types generated successfully!"
```

---

## Database Schema

### Projects Table
```sql
CREATE TABLE projects (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    git_repo_path   TEXT NOT NULL DEFAULT '' UNIQUE,
    setup_script    TEXT DEFAULT '',
    dev_script      TEXT DEFAULT '',
    cleanup_script  TEXT,
    copy_files      TEXT,
    icon            TEXT NOT NULL DEFAULT 'folder',
    rule_folders    TEXT,
    always_included_rules TEXT,
    workflows_folder TEXT DEFAULT '.openflow/workflows',
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
    id                          TEXT PRIMARY KEY,
    project_id                  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title                       TEXT NOT NULL,
    description                 TEXT,
    status                      TEXT NOT NULL DEFAULT 'todo'
                                CHECK (status IN ('todo','inprogress','inreview','done','cancelled')),
    actions_required_count      INTEGER NOT NULL DEFAULT 0,
    parent_chat_id              TEXT REFERENCES chats(id) ON DELETE SET NULL,
    auto_start_next_step        BOOLEAN NOT NULL DEFAULT FALSE,
    default_executor_profile_id TEXT,
    archived_at                 TEXT,
    created_at                  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at                  TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
```

### Chats Table
```sql
CREATE TABLE chats (
    id                  TEXT PRIMARY KEY,
    task_id             TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    executor            TEXT,
    base_branch         TEXT NOT NULL DEFAULT 'main',
    branch              TEXT,
    worktree_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    setup_completed_at  DATETIME,
    container_ref       TEXT,
    initial_prompt      TEXT,
    hidden_prompt       TEXT,
    is_plan_container   BOOLEAN NOT NULL DEFAULT FALSE,
    executor_profile_id TEXT,
    main_chat_id        TEXT REFERENCES chats(id) ON DELETE CASCADE,
    chat_role           TEXT NOT NULL DEFAULT 'main',
    created_at          TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);
CREATE INDEX idx_chats_task_id ON chats(task_id);
```

### Execution Processes Table
```sql
CREATE TABLE execution_processes (
    id                  TEXT PRIMARY KEY,
    chat_id             TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    status              TEXT NOT NULL DEFAULT 'running'
                        CHECK (status IN ('running','completed','failed','killed')),
    exit_code           INTEGER,
    executor_action     TEXT NOT NULL DEFAULT '',
    dropped             BOOLEAN NOT NULL DEFAULT 0,
    after_head_commit   TEXT,
    before_head_commit  TEXT,
    run_reason          TEXT NOT NULL DEFAULT 'codingagent'
                        CHECK (run_reason IN ('setupscript','cleanupscript','codingagent','devserver','terminal')),
    started_at          TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    completed_at        TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);
CREATE INDEX idx_execution_processes_chat_id ON execution_processes(chat_id);
CREATE INDEX idx_execution_processes_status ON execution_processes(status);
```

---

## Key Dependencies

### Root package.json
```json
{
  "name": "openflow",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tauri dev",
    "build": "tauri build",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "test": "vitest",
    "storybook": "storybook dev -p 6006",
    "generate:types": "./scripts/generate-types.sh",
    "validate:arch": "tsx scripts/validate-architecture.ts"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.0.0",
    "@tauri-apps/cli": "^2.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "storybook": "^8.4.0",
    "typescript": "^5.5.0",
    "tsx": "^4.0.0",
    "vitest": "^2.0.0"
  }
}
```

### pnpm-workspace.yaml
```yaml
packages:
  - packages/*
```

### src-tauri/Cargo.toml
```toml
[package]
name = "openflow"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sqlx = { version = "0.8", features = ["runtime-tokio", "sqlite"] }
typeshare = "1.0"
tokio = { version = "1", features = ["full"] }
uuid = { version = "1", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
reqwest = { version = "0.12", features = ["json"] }
anyhow = "1"
thiserror = "2"
tracing = "0.1"
tracing-subscriber = "0.3"

[build-dependencies]
tauri-build = { version = "2", features = [] }
```

---

## Implementation Phases

### Phase 1: Foundation
1. Initialize Tauri project with `pnpm create tauri-app`
2. Set up pnpm workspace with package structure
3. Configure Biome, TypeScript strict mode
4. Add Husky + lint-staged hooks
5. Set up typeshare generation script

**Deliverable:** `pnpm generate:types` produces valid TypeScript from Rust

### Phase 2: Core Types & Database
1. Define all domain types in `src-tauri/src/types/` with `#[typeshare]`
2. Implement SQLite + SQLx with migrations
3. Create Rust services: ProjectService, TaskService, ChatService
4. Implement Tauri commands for CRUD operations

**Deliverable:** Working Tauri commands with type-safe IPC

### Phase 3: Frontend Foundation
1. Create `packages/queries/` with Tauri invoke wrappers
2. Create `packages/hooks/` with TanStack Query integration
3. Build atomic UI components in `packages/ui/` (atoms → molecules → organisms)
4. Add Zod schemas in `packages/validation/`
5. Set up Storybook with Tailwind + dark mode support
6. Write stories for each UI component (enforces stateless design)

**Deliverable:** Frontend consuming type-safe Tauri commands, all UI testable in Storybook

### Phase 4: App Layer
1. Set up TanStack Router with file-based routing
2. Create page components in `src/routes/` (<200 lines each)
3. Connect hooks to UI via composition pattern
4. Add architecture validation script
5. Configure route code-splitting for performance

**Deliverable:** Working app with tripwire validation

### Phase 5: AI & Execution
1. Claude API integration in Rust
2. Process spawning for CLI tool execution
3. PTY support for terminal emulation
4. Event streaming via Tauri events

**Deliverable:** AI-powered task execution

### Phase 6: Git & Polish
1. Git worktree management
2. Workflow system
3. Auto-updates via tauri-plugin-updater

---

## Critical Files to Create

```
src-tauri/
├── src/
│   ├── main.rs                 # Tauri entry point
│   ├── lib.rs                  # Command registration
│   ├── types/mod.rs            # Type definitions (#[typeshare])
│   ├── commands/mod.rs         # IPC handlers
│   ├── services/mod.rs         # Business logic
│   └── db/mod.rs               # Database layer
├── tauri.conf.json             # Tauri config
└── Cargo.toml

packages/
├── generated/
│   ├── package.json
│   └── types.ts                # Auto-generated (DO NOT EDIT)
├── queries/
│   ├── package.json
│   ├── index.ts
│   ├── tasks.ts
│   ├── projects.ts
│   └── chats.ts
├── hooks/
│   ├── package.json
│   ├── index.ts
│   ├── useTasks.ts
│   ├── useProjects.ts
│   └── useChats.ts
├── ui/
│   ├── package.json
│   ├── index.ts
│   ├── atoms/                  # Button, Input, Badge, etc.
│   ├── molecules/              # FormField, Card, etc.
│   ├── organisms/              # TaskList, ProjectCard, etc.
│   └── templates/              # PageLayout, SidebarLayout, etc.
├── validation/
│   ├── package.json
│   ├── index.ts
│   └── schemas.ts              # Zod schemas derived from generated types
└── utils/
    ├── package.json
    └── index.ts

src/                            # TanStack Router file-based routing
├── routes/
│   ├── __root.tsx              # Root layout
│   ├── index.tsx               # Home page
│   ├── projects.tsx            # Projects list
│   ├── projects.$projectId.tsx # Single project
│   ├── tasks.tsx               # Tasks list
│   └── tasks.$taskId.tsx       # Single task
├── routeTree.gen.ts            # Auto-generated route tree
└── main.tsx

.storybook/
├── main.ts                     # Storybook config
└── preview.ts                  # Global decorators

scripts/
├── generate-types.sh
└── validate-architecture.ts

biome.json
tsconfig.json
pnpm-workspace.yaml
package.json
CLAUDE.md
```
