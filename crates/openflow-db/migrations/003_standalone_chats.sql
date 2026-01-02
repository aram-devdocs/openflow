-- ===========================================
-- OpenFlow Migration: Standalone Chats
-- Version: 003
-- Description: Decouples chats from tasks by making task_id optional
--              and adding project_id for standalone chat support
-- ===========================================

-- Step 1: Create new chats table with updated schema
-- (SQLite doesn't support ALTER COLUMN, so we recreate the table)
CREATE TABLE chats_new (
    id                  TEXT PRIMARY KEY,
    task_id             TEXT REFERENCES tasks(id) ON DELETE CASCADE,  -- Now nullable
    project_id          TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,  -- New required field
    title               TEXT,
    chat_role           TEXT NOT NULL DEFAULT 'main'
                        CHECK (chat_role IN ('main', 'review', 'test', 'terminal')),
    executor_profile_id TEXT REFERENCES executor_profiles(id) ON DELETE SET NULL,
    base_branch         TEXT NOT NULL DEFAULT 'main',
    branch              TEXT,
    worktree_path       TEXT,
    worktree_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    setup_completed_at  DATETIME,
    initial_prompt      TEXT,
    hidden_prompt       TEXT,
    is_plan_container   BOOLEAN NOT NULL DEFAULT FALSE,
    main_chat_id        TEXT REFERENCES chats_new(id) ON DELETE CASCADE,
    workflow_step_index INTEGER,
    created_at          TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

-- Step 2: Copy existing data, deriving project_id from associated task
INSERT INTO chats_new (
    id, task_id, project_id, title, chat_role, executor_profile_id,
    base_branch, branch, worktree_path, worktree_deleted,
    setup_completed_at, initial_prompt, hidden_prompt,
    is_plan_container, main_chat_id, workflow_step_index,
    created_at, updated_at
)
SELECT
    c.id,
    c.task_id,
    t.project_id,  -- Derive from task
    c.title,
    c.chat_role,
    c.executor_profile_id,
    c.base_branch,
    c.branch,
    c.worktree_path,
    c.worktree_deleted,
    c.setup_completed_at,
    c.initial_prompt,
    c.hidden_prompt,
    c.is_plan_container,
    c.main_chat_id,
    c.workflow_step_index,
    c.created_at,
    c.updated_at
FROM chats c
INNER JOIN tasks t ON c.task_id = t.id;

-- Step 3: Drop old table and rename new one
DROP TABLE chats;
ALTER TABLE chats_new RENAME TO chats;

-- Step 4: Recreate indexes
CREATE INDEX idx_chats_task_id ON chats(task_id);
CREATE INDEX idx_chats_project_id ON chats(project_id);
