# OpenFlow - Technical Specification

> **Version:** 1.0
> **Date:** 2025-12-28
> **Status:** Draft

---

## 1. Technical Context

### 1.1 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Desktop Framework | Tauri | 2.x | Cross-platform native app shell |
| Backend Runtime | Rust | 2021 edition | Core business logic, IPC, process management |
| Database | SQLite + SQLx | 0.8.x | Local data persistence with compile-time SQL checking |
| Frontend Framework | React | 18.x | UI component rendering |
| Language | TypeScript | 5.5+ | Type-safe frontend code |
| Build Tool | Vite | 6.x | Fast frontend bundling |
| Styling | Tailwind CSS | 3.4.x | Utility-first CSS framework |
| State Management | TanStack Query | 5.x | Server state caching and synchronization |
| Routing | TanStack Router | 1.x | Type-safe file-based routing |
| Type Generation | typeshare | 1.x | Rust → TypeScript type generation |
| Validation | Zod | 3.x | Runtime schema validation |
| Linting/Formatting | Biome | 2.x | Fast unified linting and formatting |
| Testing | Vitest | 2.x | Unit and integration testing |
| Component Dev | Storybook | 8.4+ | Isolated UI component development |

### 1.2 Development Environment Requirements

- **Node.js:** 20.x LTS
- **pnpm:** 9.x
- **Rust:** 1.75+ (stable)
- **Git:** 2.40+
- **Platform:** macOS 12+, Windows 10+, or Linux (Ubuntu 22.04+)

### 1.3 External Dependencies

| Dependency | Purpose | Optional |
|------------|---------|----------|
| Claude Code CLI | AI coding agent | Yes (one of) |
| Gemini CLI | AI coding agent | Yes (one of) |
| Codex CLI | AI coding agent | Yes (one of) |
| Cursor CLI | AI coding agent | Yes (one of) |
| Git | Version control operations | Required |

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        OpenFlow App                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    React Frontend                        │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │    │
│  │  │ Routes  │ │  Hooks  │ │   UI    │ │  Queries    │   │    │
│  │  │ (pages) │ │ (state) │ │(atoms/  │ │ (invoke     │   │    │
│  │  │         │ │         │ │ mol/org)│ │  wrappers)  │   │    │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └──────┬──────┘   │    │
│  │       │           │           │              │          │    │
│  │       └───────────┴───────────┴──────────────┘          │    │
│  │                         │                                │    │
│  │                    Tauri IPC                             │    │
│  └─────────────────────────┼───────────────────────────────┘    │
│                            │                                     │
├────────────────────────────┼────────────────────────────────────┤
│  ┌─────────────────────────┼───────────────────────────────┐    │
│  │                    Rust Backend                          │    │
│  │  ┌──────────┐  ┌───────┴──────┐  ┌──────────────────┐  │    │
│  │  │ Commands │──│   Services   │──│     Database     │  │    │
│  │  │  (IPC)   │  │   (logic)    │  │    (SQLite)      │  │    │
│  │  └──────────┘  └──────────────┘  └──────────────────┘  │    │
│  │                      │                                   │    │
│  │  ┌──────────────────┴───────────────────────────────┐  │    │
│  │  │              Process Manager                      │  │    │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐   │  │    │
│  │  │  │   PTY   │  │ Spawned │  │   Git Worktree  │   │  │    │
│  │  │  │ Manager │  │ Procs   │  │    Manager      │   │  │    │
│  │  │  └─────────┘  └─────────┘  └─────────────────┘   │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
Rust Types (#[typeshare])
         │
         ▼
   typeshare CLI
         │
         ▼
packages/generated/types.ts (AUTO-GENERATED, DO NOT EDIT)
         │
         ├──────────────────────────────────┐
         ▼                                  ▼
packages/validation/schemas.ts    packages/queries/*.ts
(Zod schemas derived from types)  (invoke wrappers)
         │                                  │
         ▼                                  ▼
packages/hooks/*.ts ◄───────────────────────┘
(TanStack Query + local state)
         │
         ▼
packages/ui/**/*.tsx
(Stateless components - props only)
         │
         ▼
src/routes/*.tsx
(Page orchestration - <200 lines)
```

### 2.3 Dependency Hierarchy (Enforced)

```
Level 5: src/routes/         → Can import: all packages
Level 4: packages/ui/        → Can import: validation, generated, utils
Level 3: packages/hooks/     → Can import: queries, validation, generated, utils
Level 2: packages/queries/   → Can import: generated, utils
Level 1: packages/validation/→ Can import: generated, utils
Level 0: packages/generated/ → No imports (auto-generated)
         packages/utils/     → No internal imports
```

**Enforcement:** Architecture validation script runs on pre-push.

---

## 3. Source Code Structure

### 3.1 Complete Directory Structure

```
openflow/
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI/CD pipeline
├── .storybook/
│   ├── main.ts                       # Storybook configuration
│   └── preview.ts                    # Global decorators
├── packages/
│   ├── generated/
│   │   ├── package.json
│   │   ├── index.ts                  # Re-exports types.ts
│   │   └── types.ts                  # AUTO-GENERATED from Rust
│   ├── hooks/
│   │   ├── package.json
│   │   ├── index.ts
│   │   ├── useProjects.ts
│   │   ├── useTasks.ts
│   │   ├── useChats.ts
│   │   ├── useMessages.ts
│   │   ├── useExecutorProfiles.ts
│   │   └── useProcesses.ts
│   ├── queries/
│   │   ├── package.json
│   │   ├── index.ts
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   ├── chats.ts
│   │   ├── messages.ts
│   │   ├── executor-profiles.ts
│   │   └── processes.ts
│   ├── ui/
│   │   ├── package.json
│   │   ├── index.ts
│   │   ├── atoms/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Icon.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── index.ts
│   │   ├── molecules/
│   │   │   ├── FormField.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── index.ts
│   │   ├── organisms/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskList.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── StepsPanel.tsx
│   │   │   ├── ProjectSelector.tsx
│   │   │   ├── DiffViewer.tsx
│   │   │   ├── CommitList.tsx
│   │   │   └── index.ts
│   │   └── templates/
│   │       ├── AppLayout.tsx
│   │       ├── TaskLayout.tsx
│   │       ├── SettingsLayout.tsx
│   │       └── index.ts
│   ├── utils/
│   │   ├── package.json
│   │   ├── index.ts
│   │   ├── cn.ts                     # Class name utility
│   │   ├── date.ts                   # Date formatting
│   │   └── markdown.ts               # Markdown parsing
│   └── validation/
│       ├── package.json
│       ├── index.ts
│       └── schemas.ts                # Zod schemas
├── scripts/
│   ├── generate-types.sh             # Run typeshare
│   └── validate-architecture.ts      # Check import rules
├── src/
│   ├── routes/
│   │   ├── __root.tsx                # Root layout
│   │   ├── index.tsx                 # Home/dashboard
│   │   ├── projects.tsx              # Project list
│   │   ├── projects.$projectId.tsx   # Project detail
│   │   ├── tasks.tsx                 # Task board
│   │   ├── tasks.$taskId.tsx         # Task detail with chat
│   │   ├── settings.tsx              # Settings layout
│   │   ├── settings.profiles.tsx     # Executor profiles
│   │   ├── settings.projects.tsx     # Project settings
│   │   └── archive.tsx               # Archived tasks
│   ├── routeTree.gen.ts              # Auto-generated routes
│   ├── main.tsx                      # App entry point
│   └── styles/
│       └── globals.css               # Tailwind imports
├── src-tauri/
│   ├── migrations/
│   │   ├── 001_initial.sql
│   │   ├── 002_messages.sql
│   │   └── 003_executor_profiles.sql
│   ├── src/
│   │   ├── main.rs                   # Tauri entry point
│   │   ├── lib.rs                    # Command registration
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── projects.rs
│   │   │   ├── tasks.rs
│   │   │   ├── chats.rs
│   │   │   ├── messages.rs
│   │   │   ├── processes.rs
│   │   │   ├── git.rs
│   │   │   ├── executor.rs
│   │   │   ├── search.rs
│   │   │   └── settings.rs
│   │   ├── db/
│   │   │   ├── mod.rs
│   │   │   └── pool.rs
│   │   ├── services/
│   │   │   ├── mod.rs
│   │   │   ├── project_service.rs
│   │   │   ├── task_service.rs
│   │   │   ├── chat_service.rs
│   │   │   ├── message_service.rs
│   │   │   ├── process_service.rs
│   │   │   ├── git_service.rs
│   │   │   ├── executor_service.rs
│   │   │   ├── workflow_service.rs
│   │   │   ├── search_service.rs
│   │   │   └── settings_service.rs
│   │   ├── types/
│   │   │   ├── mod.rs
│   │   │   ├── project.rs
│   │   │   ├── task.rs
│   │   │   ├── chat.rs
│   │   │   ├── message.rs
│   │   │   ├── process.rs
│   │   │   ├── executor.rs
│   │   │   └── workflow.rs
│   │   └── process/
│   │       ├── mod.rs
│   │       ├── pty.rs                # PTY management
│   │       ├── spawn.rs              # Process spawning
│   │       └── output.rs             # Output streaming
│   ├── tauri.conf.json
│   ├── build.rs
│   └── Cargo.toml
├── .gitignore
├── biome.json
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── vite.config.ts
└── CLAUDE.md
```

---

## 4. Data Model

### 4.1 Complete Database Schema

```sql
-- ===========================================
-- NOTE: Tables are ordered to satisfy foreign key dependencies.
-- executor_profiles is defined early since tasks references it.
-- ===========================================

-- ===========================================
-- EXECUTOR TABLES (defined first due to FK dependencies)
-- ===========================================

-- Executor profiles (CLI tool configurations)
CREATE TABLE executor_profiles (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    command         TEXT NOT NULL,  -- CLI command: claude, gemini, codex, cursor
    args            TEXT,           -- JSON array of default arguments
    env             TEXT,           -- JSON object of environment variables
    model           TEXT,           -- Model identifier if applicable
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

-- ===========================================
-- CORE TABLES
-- ===========================================

-- Projects table
CREATE TABLE projects (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    git_repo_path   TEXT NOT NULL UNIQUE,
    base_branch     TEXT NOT NULL DEFAULT 'main',
    setup_script    TEXT DEFAULT '',
    dev_script      TEXT DEFAULT '',
    cleanup_script  TEXT,
    copy_files      TEXT,  -- JSON array of file paths
    icon            TEXT NOT NULL DEFAULT 'folder',
    rule_folders    TEXT,  -- JSON array of folder paths
    always_included_rules TEXT,  -- JSON array of rule file paths
    workflows_folder TEXT DEFAULT '.openflow/workflows',
    verification_config TEXT,  -- JSON: {"test": "pnpm test", "lint": "pnpm lint", ...}
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

-- Tasks table
CREATE TABLE tasks (
    id                          TEXT PRIMARY KEY,
    project_id                  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title                       TEXT NOT NULL,
    description                 TEXT,
    status                      TEXT NOT NULL DEFAULT 'todo'
                                CHECK (status IN ('todo','inprogress','inreview','done','cancelled')),
    workflow_template           TEXT,  -- Reference to workflow file or builtin
    actions_required_count      INTEGER NOT NULL DEFAULT 0,
    parent_task_id              TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    auto_start_next_step        BOOLEAN NOT NULL DEFAULT FALSE,
    default_executor_profile_id TEXT REFERENCES executor_profiles(id) ON DELETE SET NULL,
    base_branch                 TEXT,  -- Override project default
    archived_at                 TEXT,
    created_at                  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at                  TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);

-- Chats table (one per workflow step or agent role)
CREATE TABLE chats (
    id                  TEXT PRIMARY KEY,
    task_id             TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title               TEXT,  -- Step name or role description
    chat_role           TEXT NOT NULL DEFAULT 'main'
                        CHECK (chat_role IN ('main', 'review', 'test', 'terminal')),
    executor_profile_id TEXT REFERENCES executor_profiles(id) ON DELETE SET NULL,
    base_branch         TEXT NOT NULL DEFAULT 'main',
    branch              TEXT,  -- Created worktree branch
    worktree_path       TEXT,  -- Path to worktree directory
    worktree_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    setup_completed_at  DATETIME,
    initial_prompt      TEXT,  -- From workflow step definition
    hidden_prompt       TEXT,  -- System context injected
    is_plan_container   BOOLEAN NOT NULL DEFAULT FALSE,
    main_chat_id        TEXT REFERENCES chats(id) ON DELETE CASCADE,
    workflow_step_index INTEGER,  -- Position in workflow
    created_at          TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);
CREATE INDEX idx_chats_task_id ON chats(task_id);

-- ===========================================
-- MESSAGING TABLES
-- ===========================================

-- Messages table for chat content
CREATE TABLE messages (
    id              TEXT PRIMARY KEY,
    chat_id         TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content         TEXT NOT NULL,
    tool_calls      TEXT,  -- JSON array of tool call objects
    tool_results    TEXT,  -- JSON array of tool result objects
    is_streaming    BOOLEAN NOT NULL DEFAULT FALSE,
    tokens_used     INTEGER,
    model           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created ON messages(chat_id, created_at);

-- ===========================================
-- EXECUTION TABLES
-- ===========================================

-- Execution processes (tracking CLI runs)
CREATE TABLE execution_processes (
    id                  TEXT PRIMARY KEY,
    chat_id             TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    executor_profile_id TEXT REFERENCES executor_profiles(id) ON DELETE SET NULL,
    status              TEXT NOT NULL DEFAULT 'running'
                        CHECK (status IN ('running','completed','failed','killed')),
    exit_code           INTEGER,
    executor_action     TEXT NOT NULL DEFAULT '',  -- What action triggered this
    run_reason          TEXT NOT NULL DEFAULT 'codingagent'
                        CHECK (run_reason IN ('setupscript','cleanupscript','codingagent','devserver','terminal','verification')),
    before_head_commit  TEXT,  -- Git HEAD before execution
    after_head_commit   TEXT,  -- Git HEAD after execution
    pid                 INTEGER,  -- OS process ID
    started_at          TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    completed_at        TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);
CREATE INDEX idx_execution_processes_chat_id ON execution_processes(chat_id);
CREATE INDEX idx_execution_processes_status ON execution_processes(status);

-- ===========================================
-- WORKFLOW TABLES
-- ===========================================

-- Workflow templates (optional DB storage, can also be file-based)
CREATE TABLE workflow_templates (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    content         TEXT NOT NULL,  -- Markdown workflow definition
    is_builtin      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

-- ===========================================
-- SETTINGS TABLES
-- ===========================================

-- App settings (key-value store for global config)
CREATE TABLE app_settings (
    key             TEXT PRIMARY KEY,
    value           TEXT NOT NULL,
    updated_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);
```

### 4.2 Rust Type Definitions (with typeshare)

```rust
// src-tauri/src/types/mod.rs
pub mod project;
pub mod task;
pub mod chat;
pub mod message;
pub mod process;
pub mod executor;
pub mod workflow;

pub use project::*;
pub use task::*;
pub use chat::*;
pub use message::*;
pub use process::*;
pub use executor::*;
pub use workflow::*;
```

```rust
// src-tauri/src/types/task.rs
use serde::{Deserialize, Serialize};
use typeshare::typeshare;

#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Todo,
    Inprogress,
    Inreview,
    Done,
    Cancelled,
}

#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub workflow_template: Option<String>,
    pub actions_required_count: i32,
    pub parent_task_id: Option<String>,
    pub auto_start_next_step: bool,
    pub default_executor_profile_id: Option<String>,
    pub base_branch: Option<String>,
    pub archived_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTaskRequest {
    pub project_id: String,
    pub title: String,
    pub description: Option<String>,
    pub workflow_template: Option<String>,
    pub parent_task_id: Option<String>,
    pub base_branch: Option<String>,
}

#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTaskRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<TaskStatus>,
    pub auto_start_next_step: Option<bool>,
    pub default_executor_profile_id: Option<String>,
}
```

```rust
// src-tauri/src/types/chat.rs
use serde::{Deserialize, Serialize};
use typeshare::typeshare;

#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ChatRole {
    Main,
    Review,
    Test,
    Terminal,
}

#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chat {
    pub id: String,
    pub task_id: String,
    pub title: Option<String>,
    pub chat_role: ChatRole,
    pub executor_profile_id: Option<String>,
    pub base_branch: String,
    pub branch: Option<String>,
    pub worktree_path: Option<String>,
    pub worktree_deleted: bool,
    pub setup_completed_at: Option<String>,
    pub initial_prompt: Option<String>,
    pub hidden_prompt: Option<String>,
    pub is_plan_container: bool,
    pub main_chat_id: Option<String>,
    pub workflow_step_index: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
}
```

```rust
// src-tauri/src/types/process.rs
use serde::{Deserialize, Serialize};
use typeshare::typeshare;

#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ProcessStatus {
    Running,
    Completed,
    Failed,
    Killed,
}

#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum RunReason {
    Setupscript,
    Cleanupscript,
    Codingagent,
    Devserver,
    Terminal,
    Verification,
}

#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum OutputType {
    Stdout,
    Stderr,
}

#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionProcess {
    pub id: String,
    pub chat_id: String,
    pub executor_profile_id: Option<String>,
    pub status: ProcessStatus,
    pub exit_code: Option<i32>,
    pub executor_action: String,
    pub run_reason: RunReason,
    pub before_head_commit: Option<String>,
    pub after_head_commit: Option<String>,
    pub pid: Option<i32>,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
```

---

## 5. API / Interface Design

### 5.1 Tauri Commands

All IPC is handled via Tauri commands. Commands are grouped by domain.

#### 5.1.1 Project Commands

```rust
// src-tauri/src/commands/projects.rs

#[tauri::command]
pub async fn list_projects(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Project>, String>;

#[tauri::command]
pub async fn get_project(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<Project, String>;

#[tauri::command]
pub async fn create_project(
    state: tauri::State<'_, AppState>,
    request: CreateProjectRequest,
) -> Result<Project, String>;

#[tauri::command]
pub async fn update_project(
    state: tauri::State<'_, AppState>,
    id: String,
    request: UpdateProjectRequest,
) -> Result<Project, String>;

#[tauri::command]
pub async fn delete_project(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<(), String>;
```

#### 5.1.2 Task Commands

```rust
// src-tauri/src/commands/tasks.rs

#[tauri::command]
pub async fn list_tasks(
    state: tauri::State<'_, AppState>,
    project_id: String,
    status: Option<TaskStatus>,
    include_archived: Option<bool>,
) -> Result<Vec<Task>, String>;

#[tauri::command]
pub async fn get_task(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<TaskWithChats, String>;  // Includes related chats

#[tauri::command]
pub async fn create_task(
    state: tauri::State<'_, AppState>,
    request: CreateTaskRequest,
) -> Result<Task, String>;

#[tauri::command]
pub async fn update_task(
    state: tauri::State<'_, AppState>,
    id: String,
    request: UpdateTaskRequest,
) -> Result<Task, String>;

#[tauri::command]
pub async fn archive_task(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<Task, String>;

#[tauri::command]
pub async fn delete_task(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<(), String>;
```

#### 5.1.3 Chat Commands

```rust
// src-tauri/src/commands/chats.rs

#[tauri::command]
pub async fn list_chats(
    state: tauri::State<'_, AppState>,
    task_id: String,
) -> Result<Vec<Chat>, String>;

#[tauri::command]
pub async fn get_chat(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<ChatWithMessages, String>;  // Includes messages

#[tauri::command]
pub async fn create_chat(
    state: tauri::State<'_, AppState>,
    request: CreateChatRequest,
) -> Result<Chat, String>;

#[tauri::command]
pub async fn start_workflow_step(
    state: tauri::State<'_, AppState>,
    chat_id: String,
) -> Result<ExecutionProcess, String>;
```

#### 5.1.4 Process Commands

```rust
// src-tauri/src/commands/processes.rs

#[tauri::command]
pub async fn get_process(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<ExecutionProcess, String>;

#[tauri::command]
pub async fn kill_process(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<ExecutionProcess, String>;

#[tauri::command]
pub async fn send_input(
    state: tauri::State<'_, AppState>,
    process_id: String,
    input: String,
) -> Result<(), String>;
```

#### 5.1.5 Git Commands

```rust
// src-tauri/src/commands/git.rs

#[tauri::command]
pub async fn create_worktree(
    state: tauri::State<'_, AppState>,
    chat_id: String,
    branch_name: String,
    base_branch: String,
) -> Result<String, String>;  // Returns worktree path

#[tauri::command]
pub async fn delete_worktree(
    state: tauri::State<'_, AppState>,
    chat_id: String,
) -> Result<(), String>;

#[tauri::command]
pub async fn get_diff(
    state: tauri::State<'_, AppState>,
    chat_id: String,
) -> Result<Vec<FileDiff>, String>;

#[tauri::command]
pub async fn get_commits(
    state: tauri::State<'_, AppState>,
    chat_id: String,
    limit: Option<i32>,
) -> Result<Vec<Commit>, String>;

#[tauri::command]
pub async fn push_branch(
    state: tauri::State<'_, AppState>,
    chat_id: String,
) -> Result<(), String>;
```

#### 5.1.6 Executor Commands

```rust
// src-tauri/src/commands/executor.rs

#[tauri::command]
pub async fn list_executor_profiles(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<ExecutorProfile>, String>;

#[tauri::command]
pub async fn create_executor_profile(
    state: tauri::State<'_, AppState>,
    request: CreateExecutorProfileRequest,
) -> Result<ExecutorProfile, String>;

#[tauri::command]
pub async fn update_executor_profile(
    state: tauri::State<'_, AppState>,
    id: String,
    request: UpdateExecutorProfileRequest,
) -> Result<ExecutorProfile, String>;

#[tauri::command]
pub async fn delete_executor_profile(
    state: tauri::State<'_, AppState>,
    id: String,
) -> Result<(), String>;

#[tauri::command]
pub async fn run_executor(
    state: tauri::State<'_, AppState>,
    chat_id: String,
    prompt: String,
) -> Result<ExecutionProcess, String>;
```

### 5.2 Tauri Events (Real-time Updates)

```rust
// Event types for frontend subscription

/// Process output streaming
#[derive(Clone, Serialize)]
pub struct ProcessOutputEvent {
    pub process_id: String,
    pub output_type: OutputType,  // Stdout | Stderr
    pub content: String,
    pub timestamp: String,
}

/// Process status change
#[derive(Clone, Serialize)]
pub struct ProcessStatusEvent {
    pub process_id: String,
    pub status: ProcessStatus,
    pub exit_code: Option<i32>,
}

/// Task status change
#[derive(Clone, Serialize)]
pub struct TaskStatusEvent {
    pub task_id: String,
    pub status: TaskStatus,
    pub actions_required_count: i32,
}

/// Message received from agent
#[derive(Clone, Serialize)]
pub struct MessageEvent {
    pub chat_id: String,
    pub message: Message,
}
```

### 5.3 Frontend Query Layer

```typescript
// packages/queries/tasks.ts
import { invoke } from '@tauri-apps/api/core';
import type {
  Task,
  TaskWithChats,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStatus
} from '@openflow/generated';

export const taskQueries = {
  list: (projectId: string, status?: TaskStatus, includeArchived?: boolean): Promise<Task[]> =>
    invoke('list_tasks', { projectId, status, includeArchived }),

  get: (id: string): Promise<TaskWithChats> =>
    invoke('get_task', { id }),

  create: (request: CreateTaskRequest): Promise<Task> =>
    invoke('create_task', { request }),

  update: (id: string, request: UpdateTaskRequest): Promise<Task> =>
    invoke('update_task', { id, request }),

  archive: (id: string): Promise<Task> =>
    invoke('archive_task', { id }),

  delete: (id: string): Promise<void> =>
    invoke('delete_task', { id }),
};
```

### 5.4 Frontend Hooks Layer

```typescript
// packages/hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskQueries } from '@openflow/queries';
import type { CreateTaskRequest, UpdateTaskRequest, TaskStatus } from '@openflow/generated';

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (projectId: string, status?: TaskStatus) =>
    [...taskKeys.lists(), projectId, status] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

export function useTasks(projectId: string, status?: TaskStatus) {
  return useQuery({
    queryKey: taskKeys.list(projectId, status),
    queryFn: () => taskQueries.list(projectId, status),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => taskQueries.get(id),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateTaskRequest) => taskQueries.create(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.list(variables.project_id)
      });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateTaskRequest }) =>
      taskQueries.update(id, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
```

---

## 6. Implementation Phases

### Phase 1: Foundation (Core Infrastructure)

**Goal:** Working Tauri app with type-safe IPC and database.

**Deliverables:**
1. Tauri project initialization with React frontend
2. pnpm workspace with all packages configured
3. Biome + TypeScript strict mode configuration
4. SQLite database with initial migrations (projects, tasks)
5. typeshare generation pipeline working
6. Basic CRUD for projects and tasks
7. Husky + lint-staged git hooks

**Verification:**
- `pnpm generate:types` produces valid TypeScript
- `pnpm typecheck` passes
- `pnpm lint` passes
- `cargo check` and `cargo test` pass
- App launches and can create/list projects

### Phase 2: UI Foundation

**Goal:** Stateless UI component library with Storybook.

**Deliverables:**
1. Tailwind CSS configuration with dark theme
2. Storybook setup with all atoms, molecules
3. Core organisms: TaskCard, TaskList, ProjectSelector
4. Templates: AppLayout, TaskLayout
5. Architecture validation script enforcing rules

**Verification:**
- All UI components have Storybook stories
- No UI component imports from hooks or queries
- `pnpm storybook` runs successfully
- `pnpm validate:arch` passes

### Phase 3: Task Management

**Goal:** Full task board with kanban and routing.

**Deliverables:**
1. TanStack Router setup with file-based routes
2. Project and task list pages
3. Task detail page with tabs (Steps, Changes, Commits)
4. Task status updates and drag-drop (optional)
5. Task creation/editing forms with Zod validation

**Verification:**
- Navigation between routes works
- Tasks can be created, updated, archived
- Status changes persist correctly
- Route type safety verified

### Phase 4: Chat & Workflow System

**Goal:** Workflow parsing and chat interface.

**Deliverables:**
1. Workflow markdown parser
2. Built-in workflow templates (Feature, Bug Fix, Refactor)
3. Chat table and message storage
4. Chat panel UI component
5. Steps panel with workflow step display
6. Workflow step execution trigger

**Verification:**
- Workflows parse correctly from markdown
- Chat messages persist and display
- Steps panel shows workflow progress
- Step start triggers chat creation

### Phase 5: Process Execution

**Goal:** Spawn and manage CLI tool processes.

**Deliverables:**
1. Executor profile management (CRUD)
2. Process spawning with PTY support
3. Stdout/stderr streaming via Tauri events
4. Process lifecycle management (kill, status)
5. Output display in chat panel
6. Input handling for interactive processes

**Verification:**
- Executor profiles can be created/edited
- CLI tools spawn and output streams to UI
- Processes can be killed
- Interactive input works

### Phase 6: Git Integration

**Goal:** Full git worktree lifecycle management.

**Deliverables:**
1. Worktree creation/deletion
2. Branch management (create, switch)
3. Diff viewer component
4. Commit list component
5. Push to remote functionality
6. Setup/cleanup script execution

**Verification:**
- Worktrees create in correct location
- Branches follow naming convention
- Diff displays correctly
- Push works to remote

### Phase 7: Multi-Agent & Verification

**Goal:** Complete agent orchestration and verification.

**Deliverables:**
1. Multiple chat roles per task
2. Agent-to-agent context sharing
3. Verification command execution
4. Auto-start next step functionality
5. Action required state management
6. PR creation integration

**Verification:**
- Multiple agents can work on same task
- Verification commands run and report results
- Auto-start chains steps correctly
- Action required badges display correctly

---

## 7. Verification Approach

### 7.1 Pre-commit (Fast, Staged Files Only)

```bash
# .husky/pre-commit
pnpm lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["biome check --write"],
    "*.rs": ["cargo fmt --check"]
  }
}
```

### 7.2 Pre-push (Comprehensive)

```bash
#!/bin/bash
# .husky/pre-push
set -e

echo "Running pre-push checks..."

# Generate types from Rust
pnpm generate:types

# TypeScript type check
pnpm typecheck

# Lint all files
pnpm lint

# Run tests
pnpm test

# Architecture validation
pnpm validate:arch

# Rust checks
cd src-tauri
cargo check
cargo test
cargo clippy -- -D warnings
```

### 7.3 Architecture Validation Script

```typescript
// scripts/validate-architecture.ts
import { globSync } from 'glob';
import { readFileSync } from 'fs';

const RULES = [
  {
    name: 'UI cannot import hooks',
    pattern: 'packages/ui/**/*.{ts,tsx}',
    forbidden: ['@openflow/hooks', '../hooks', './hooks'],
  },
  {
    name: 'UI cannot import queries',
    pattern: 'packages/ui/**/*.{ts,tsx}',
    forbidden: ['@openflow/queries', '../queries', './queries'],
  },
  {
    name: 'Packages cannot import from src/',
    pattern: 'packages/**/*.{ts,tsx}',
    forbidden: ['../../src/', '../../../src/'],
  },
  {
    name: 'Queries cannot import hooks',
    pattern: 'packages/queries/**/*.{ts,tsx}',
    forbidden: ['@openflow/hooks'],
  },
];

function validate(): boolean {
  let hasErrors = false;

  for (const rule of RULES) {
    const files = globSync(rule.pattern);
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      for (const forbidden of rule.forbidden) {
        if (content.includes(`from '${forbidden}`) ||
            content.includes(`from "${forbidden}`)) {
          console.error(`❌ ${rule.name}: ${file} imports ${forbidden}`);
          hasErrors = true;
        }
      }
    }
  }

  if (!hasErrors) {
    console.log('✅ Architecture validation passed');
  }

  return !hasErrors;
}

process.exit(validate() ? 0 : 1);
```

### 7.4 CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Generate types
        run: pnpm generate:types

      - name: TypeScript check
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test

      - name: Architecture validation
        run: pnpm validate:arch

      - name: Rust check
        run: cd src-tauri && cargo check

      - name: Rust test
        run: cd src-tauri && cargo test

      - name: Rust clippy
        run: cd src-tauri && cargo clippy -- -D warnings
```

---

## 8. Key Implementation Patterns

### 8.1 Stateless UI Components

```tsx
// packages/ui/organisms/TaskCard.tsx
interface TaskCardProps {
  task: Task;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onStatusChange?: (id: string, status: TaskStatus) => void;
}

export function TaskCard({
  task,
  isSelected = false,
  onSelect,
  onStatusChange
}: TaskCardProps) {
  // NO hooks, NO invoke calls, NO business logic
  // Just render based on props, call callbacks on interaction

  return (
    <div
      className={cn('task-card', isSelected && 'selected')}
      onClick={() => onSelect?.(task.id)}
    >
      <h3>{task.title}</h3>
      <StatusBadge
        status={task.status}
        onChange={(s) => onStatusChange?.(task.id, s)}
      />
      {task.actions_required_count > 0 && (
        <Badge variant="warning">{task.actions_required_count}</Badge>
      )}
    </div>
  );
}
```

### 8.2 Page Orchestration Pattern

```tsx
// src/routes/tasks.$taskId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { TaskLayout } from '@openflow/ui';
import { useTask, useUpdateTask, useChats } from '@openflow/hooks';

export const Route = createFileRoute('/tasks/$taskId')({
  component: TaskDetailPage,
});

function TaskDetailPage() {
  const { taskId } = Route.useParams();
  const { data: task, isLoading } = useTask(taskId);
  const { data: chats } = useChats(taskId);
  const updateTask = useUpdateTask();

  // Orchestration: connect hooks to UI components
  return (
    <TaskLayout
      task={task}
      chats={chats ?? []}
      isLoading={isLoading}
      onStatusChange={(status) =>
        updateTask.mutate({ id: taskId, request: { status } })
      }
      onTitleChange={(title) =>
        updateTask.mutate({ id: taskId, request: { title } })
      }
    />
  );
}
```

### 8.3 Event Subscription Pattern

```typescript
// packages/hooks/useProcessOutput.ts
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { ProcessOutputEvent } from '@openflow/generated';

export function useProcessOutput(processId: string) {
  const [output, setOutput] = useState<string[]>([]);

  useEffect(() => {
    const unlisten = listen<ProcessOutputEvent>(
      `process-output-${processId}`,
      (event) => {
        setOutput((prev) => [...prev, event.payload.content]);
      }
    );

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [processId]);

  return output;
}
```

### 8.4 Rust Service Pattern

```rust
// src-tauri/src/services/task_service.rs
use crate::db::DbPool;
use crate::types::{Task, CreateTaskRequest, UpdateTaskRequest, TaskStatus};
use sqlx::SqlitePool;
use uuid::Uuid;

pub struct TaskService;

impl TaskService {
    pub async fn list(
        pool: &SqlitePool,
        project_id: &str,
        status: Option<TaskStatus>,
    ) -> Result<Vec<Task>, sqlx::Error> {
        let status_filter = status.map(|s| s.to_string());

        sqlx::query_as!(
            Task,
            r#"
            SELECT
                id, project_id, title, description,
                status as "status: TaskStatus",
                workflow_template, actions_required_count,
                parent_task_id, auto_start_next_step,
                default_executor_profile_id, base_branch,
                archived_at, created_at, updated_at
            FROM tasks
            WHERE project_id = ?
            AND (? IS NULL OR status = ?)
            AND archived_at IS NULL
            ORDER BY created_at DESC
            "#,
            project_id,
            status_filter,
            status_filter
        )
        .fetch_all(pool)
        .await
    }

    pub async fn create(
        pool: &SqlitePool,
        request: CreateTaskRequest,
    ) -> Result<Task, sqlx::Error> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query!(
            r#"
            INSERT INTO tasks (
                id, project_id, title, description,
                workflow_template, parent_task_id, base_branch,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            id,
            request.project_id,
            request.title,
            request.description,
            request.workflow_template,
            request.parent_task_id,
            request.base_branch,
            now,
            now
        )
        .execute(pool)
        .await?;

        Self::get(pool, &id).await
    }

    pub async fn get(pool: &SqlitePool, id: &str) -> Result<Task, sqlx::Error> {
        sqlx::query_as!(
            Task,
            r#"
            SELECT
                id, project_id, title, description,
                status as "status: TaskStatus",
                workflow_template, actions_required_count,
                parent_task_id, auto_start_next_step,
                default_executor_profile_id, base_branch,
                archived_at, created_at, updated_at
            FROM tasks
            WHERE id = ?
            "#,
            id
        )
        .fetch_one(pool)
        .await
    }
}
```

---

## 9. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| CLI tool API changes | Abstract executor interface, version pin CLI tools |
| PTY complexity on Windows | Use `portable-pty` crate, test early on Windows |
| Type generation drift | Pre-push hook regenerates and fails on diff |
| Git worktree conflicts | Strict naming convention, cleanup on app exit |
| Large codebase performance | Virtual lists, pagination, lazy loading |
| Process zombie leaks | Track PIDs, cleanup on app exit via Tauri lifecycle |

---

## 10. Configuration Files Reference

### 10.1 biome.json

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5"
    }
  }
}
```

### 10.2 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@openflow/generated": ["./packages/generated"],
      "@openflow/hooks": ["./packages/hooks"],
      "@openflow/queries": ["./packages/queries"],
      "@openflow/ui": ["./packages/ui"],
      "@openflow/utils": ["./packages/utils"],
      "@openflow/validation": ["./packages/validation"]
    }
  },
  "include": ["src", "packages"],
  "exclude": ["node_modules", "dist"]
}
```

### 10.3 tauri.conf.json (key sections)

```json
{
  "productName": "OpenFlow",
  "version": "0.1.0",
  "identifier": "com.openflow.app",
  "build": {
    "beforeDevCommand": "pnpm dev:frontend",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "pnpm build:frontend",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "OpenFlow",
        "width": 1280,
        "height": 800,
        "minWidth": 1024,
        "minHeight": 768,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "plugins": {}
}
```

---

## 11. Keyboard Shortcuts

### 11.1 Global Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Cmd/Ctrl + K` | Open command palette / search | Global |
| `Cmd/Ctrl + N` | Create new task | Global |
| `Cmd/Ctrl + ,` | Open settings | Global |
| `Cmd/Ctrl + \`` | Toggle terminal | Task view |
| `Escape` | Close modal / cancel action | Global |

### 11.2 Task View Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Cmd/Ctrl + Enter` | Send message | Chat input focused |
| `Cmd/Ctrl + Shift + Enter` | Send and start next step | Chat input focused |
| `Cmd/Ctrl + S` | Save current step | Task view |
| `Cmd/Ctrl + .` | Quick actions menu | Task view |
| `Up/Down` | Navigate steps | Steps panel focused |
| `Enter` | Start selected step | Step selected |

### 11.3 Implementation Approach

Keyboard shortcuts are implemented using a centralized hook:

```typescript
// packages/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

interface ShortcutConfig {
  key: string;
  meta?: boolean;  // Cmd on Mac, Ctrl on Windows/Linux
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  when?: () => boolean;  // Condition for shortcut to be active
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta
          ? (e.metaKey || e.ctrlKey)
          : (!e.metaKey && !e.ctrlKey);
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (metaMatch && shiftMatch && altMatch && keyMatch) {
          if (!shortcut.when || shortcut.when()) {
            e.preventDefault();
            shortcut.action();
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
```

---

## 12. Search Functionality

### 12.1 Search API

```rust
// src-tauri/src/commands/search.rs

#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub result_type: SearchResultType,
    pub id: String,
    pub title: String,
    pub subtitle: Option<String>,
    pub project_id: Option<String>,
}

#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SearchResultType {
    Task,
    Project,
    Chat,
    WorkflowTemplate,
}

#[tauri::command]
pub async fn search(
    state: tauri::State<'_, AppState>,
    query: String,
    project_id: Option<String>,  // Scope to project if provided
    result_types: Option<Vec<SearchResultType>>,  // Filter result types
    limit: Option<i32>,  // Default 20
) -> Result<Vec<SearchResult>, String>;
```

### 12.2 Search Implementation

Search uses SQLite FTS5 (Full-Text Search) for efficient querying:

```sql
-- FTS virtual table for search
CREATE VIRTUAL TABLE search_index USING fts5(
    id,
    type,
    title,
    description,
    project_id,
    content='',  -- External content (we manage manually)
    tokenize='porter unicode61'
);

-- Trigger to update search index on task changes
CREATE TRIGGER tasks_search_insert AFTER INSERT ON tasks BEGIN
    INSERT INTO search_index(id, type, title, description, project_id)
    VALUES (NEW.id, 'task', NEW.title, NEW.description, NEW.project_id);
END;

CREATE TRIGGER tasks_search_update AFTER UPDATE ON tasks BEGIN
    DELETE FROM search_index WHERE id = OLD.id;
    INSERT INTO search_index(id, type, title, description, project_id)
    VALUES (NEW.id, 'task', NEW.title, NEW.description, NEW.project_id);
END;

CREATE TRIGGER tasks_search_delete AFTER DELETE ON tasks BEGIN
    DELETE FROM search_index WHERE id = OLD.id;
END;
```

### 12.3 Command Palette UI

The command palette (`Cmd+K`) provides:
1. **Quick search** - Find tasks, projects, workflows
2. **Actions** - Create task, open settings, switch project
3. **Recent items** - Recently viewed tasks and chats

---

## 13. Git Worktree Conventions

### 13.1 Branch Naming

All branches created by OpenFlow follow this pattern:

```
openflow/{task_id}/{chat_role}
```

Examples:
- `openflow/abc123/main` - Main implementation branch
- `openflow/abc123/review` - Review agent branch
- `openflow/abc123/test` - Test agent branch

### 13.2 Worktree Directory Structure

Worktrees are stored in a dedicated directory outside the main repo:

```
~/.openflow/worktrees/
├── {project_id}/
│   ├── {task_id}-main/      # Main agent worktree
│   ├── {task_id}-review/    # Review agent worktree
│   └── {task_id}-test/      # Test agent worktree
```

### 13.3 Worktree Lifecycle Commands

```rust
// Create worktree
git worktree add -b openflow/{task_id}/{role} {worktree_path} {base_branch}

// List worktrees
git worktree list

// Remove worktree
git worktree remove {worktree_path}

// Prune stale worktrees
git worktree prune
```

---

## 14. App Settings Keys

### 14.1 Expected Settings

The `app_settings` table stores global configuration as key-value pairs:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `default_executor_profile_id` | string | null | Default CLI tool for new tasks |
| `theme` | string | "dark" | UI theme ("dark", "light", "system") |
| `worktrees_base_path` | string | "~/.openflow/worktrees" | Base directory for worktrees |
| `auto_start_steps` | boolean | false | Global default for auto-start |
| `telemetry_enabled` | boolean | true | Anonymous usage analytics |
| `last_project_id` | string | null | Last opened project (for restore) |
| `sidebar_collapsed` | boolean | false | Sidebar state |
| `chat_font_size` | number | 14 | Chat panel font size in pixels |

### 14.2 Settings API

```rust
#[tauri::command]
pub async fn get_setting(
    state: tauri::State<'_, AppState>,
    key: String,
) -> Result<Option<String>, String>;

#[tauri::command]
pub async fn set_setting(
    state: tauri::State<'_, AppState>,
    key: String,
    value: String,
) -> Result<(), String>;

#[tauri::command]
pub async fn get_all_settings(
    state: tauri::State<'_, AppState>,
) -> Result<HashMap<String, String>, String>;
```
