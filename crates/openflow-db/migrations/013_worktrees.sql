-- ===========================================
-- OpenFlow Migration: Worktrees Table
-- Version: 013
-- Description: Creates the worktrees table for tracking git worktrees used
--              in parallel task execution. Each worktree provides an isolated
--              working directory with its own branch, allowing multiple agents
--              to work on the same codebase simultaneously without conflicts.
-- ===========================================

-- Git worktrees enable parallel execution of task steps.
-- Each worktree is a separate working directory with its own branch.
-- When parallel steps complete, worktrees are merged back to the main branch.
CREATE TABLE worktrees (
    id           TEXT PRIMARY KEY,
    project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    branch_name  TEXT NOT NULL,              -- Git branch name for this worktree
    path         TEXT NOT NULL,              -- Absolute filesystem path to worktree directory
    status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'merged', 'deleted', 'conflict')),
    -- Lifecycle timestamps
    created_at   TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    merged_at    TEXT,                       -- When worktree was merged to base branch
    deleted_at   TEXT                        -- When worktree directory was removed
);

-- Index for efficient lookup by project (list all worktrees for a project)
CREATE INDEX idx_worktrees_project ON worktrees(project_id);

-- Index for status filtering (find all active worktrees)
CREATE INDEX idx_worktrees_status ON worktrees(status);

-- Ensure branch names are unique within a project
CREATE UNIQUE INDEX idx_worktrees_project_branch ON worktrees(project_id, branch_name);

-- Now that worktrees table exists, we can add the foreign key constraint
-- from tasks.worktree_id to worktrees.id. However, SQLite doesn't support
-- adding foreign keys to existing tables, so this is enforced at application level.
-- The index on tasks.worktree_id was already created in migration 011.
