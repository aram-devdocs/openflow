-- ===========================================
-- OpenFlow Migration: Parallel Steps Support
-- Version: 015
-- Description: Adds parallel_group and worktree_id columns to task_steps
--              to enable parallel execution of steps using git worktrees.
--              Steps with the same parallel_group value will be executed
--              concurrently in separate worktrees.
-- ===========================================

-- Add parallel_group column to task_steps
-- Steps with the same parallel_group will be executed concurrently
-- NULL means the step is sequential (not part of any parallel group)
ALTER TABLE task_steps ADD COLUMN parallel_group TEXT;

-- Add worktree_id column to task_steps
-- Links the step to its dedicated worktree when running in parallel
ALTER TABLE task_steps ADD COLUMN worktree_id TEXT REFERENCES worktrees(id) ON DELETE SET NULL;

-- Index for finding steps in the same parallel group
CREATE INDEX idx_task_steps_parallel_group ON task_steps(task_id, parallel_group)
    WHERE parallel_group IS NOT NULL;

-- Index for worktree lookups
CREATE INDEX idx_task_steps_worktree ON task_steps(worktree_id)
    WHERE worktree_id IS NOT NULL;
