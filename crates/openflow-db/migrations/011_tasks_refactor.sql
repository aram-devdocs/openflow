-- ===========================================
-- OpenFlow Migration: Tasks Table Refactor
-- Version: 011
-- Description: Refactors the tasks table for the new agent orchestration
--              architecture. Adds new columns for autonomous task execution,
--              step tracking, and worktree integration. Updates status values
--              to support pause/resume workflow.
-- ===========================================

-- SQLite doesn't support modifying CHECK constraints or dropping columns directly.
-- We need to recreate the table with the new schema and migrate data.

-- Step 1: Create the new tasks table with updated schema
CREATE TABLE tasks_new (
    id                          TEXT PRIMARY KEY,
    project_id                  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title                       TEXT NOT NULL,
    description                 TEXT,
    status                      TEXT NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')),
    auto_run                    INTEGER NOT NULL DEFAULT 0,  -- Boolean: 0=manual, 1=autonomous execution
    current_step_index          INTEGER NOT NULL DEFAULT 0,  -- Index of current/next step to execute
    worktree_id                 TEXT,                        -- Will be FK to worktrees table once created
    -- Preserved columns from original schema
    workflow_template           TEXT,                        -- Reference to workflow file or builtin
    parent_task_id              TEXT,                        -- Self-reference for subtasks
    default_executor_profile_id TEXT REFERENCES executor_profiles(id) ON DELETE SET NULL,
    base_branch                 TEXT,                        -- Override project default
    archived_at                 TEXT,
    -- Timing columns
    started_at                  TEXT,                        -- When task execution began
    ended_at                    TEXT,                        -- When task execution finished
    created_at                  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at                  TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

-- Step 2: Migrate existing data with status mapping
-- Map old statuses to new statuses:
--   'todo'       -> 'pending'
--   'inprogress' -> 'running'
--   'inreview'   -> 'running' (closest equivalent)
--   'done'       -> 'completed'
--   'cancelled'  -> 'cancelled'
INSERT INTO tasks_new (
    id, project_id, title, description, status, auto_run, current_step_index,
    worktree_id, workflow_template, parent_task_id, default_executor_profile_id,
    base_branch, archived_at, started_at, ended_at, created_at, updated_at
)
SELECT
    id,
    project_id,
    title,
    description,
    CASE status
        WHEN 'todo' THEN 'pending'
        WHEN 'inprogress' THEN 'running'
        WHEN 'inreview' THEN 'running'
        WHEN 'done' THEN 'completed'
        WHEN 'cancelled' THEN 'cancelled'
        ELSE 'pending'
    END,
    COALESCE(auto_start_next_step, 0),  -- Map auto_start_next_step to auto_run
    0,                                   -- Initialize step index to 0
    NULL,                                -- No worktree initially
    workflow_template,
    parent_task_id,
    default_executor_profile_id,
    base_branch,
    archived_at,
    NULL,                                -- started_at not tracked before
    NULL,                                -- ended_at not tracked before
    created_at,
    updated_at
FROM tasks;

-- Step 3: Drop the old table
DROP TABLE tasks;

-- Step 4: Rename new table to tasks
ALTER TABLE tasks_new RENAME TO tasks;

-- Step 5: Recreate indexes
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);

-- Step 6: Add new self-referential foreign key constraint
-- Note: SQLite foreign key enforcement happens at runtime, so this is just documentation
-- The actual constraint is enforced by application logic since we can't add FK after table creation

-- Step 7: Add index for worktree queries (once worktrees table is created)
CREATE INDEX idx_tasks_worktree ON tasks(worktree_id);

-- Step 8: Recreate search triggers (lost when table was dropped/recreated)
-- Insert task into search index when created
CREATE TRIGGER tasks_search_insert AFTER INSERT ON tasks BEGIN
    INSERT INTO search_index(id, type, title, description, project_id)
    VALUES (NEW.id, 'task', NEW.title, NEW.description, NEW.project_id);
END;

-- Update search index when task is modified
CREATE TRIGGER tasks_search_update AFTER UPDATE ON tasks BEGIN
    DELETE FROM search_index WHERE id = OLD.id AND type = 'task';
    INSERT INTO search_index(id, type, title, description, project_id)
    VALUES (NEW.id, 'task', NEW.title, NEW.description, NEW.project_id);
END;

-- Remove from search index when task is deleted
CREATE TRIGGER tasks_search_delete AFTER DELETE ON tasks BEGIN
    DELETE FROM search_index WHERE id = OLD.id AND type = 'task';
END;
