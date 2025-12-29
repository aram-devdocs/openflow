-- ===========================================
-- OpenFlow Initial Database Schema
-- Version: 001
-- Description: Creates all core tables for the OpenFlow application
-- ===========================================

-- NOTE: Tables are ordered to satisfy foreign key dependencies.
-- executor_profiles is defined early since tasks references it.

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
