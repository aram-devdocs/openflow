-- ===========================================
-- OpenFlow Migration: Task Steps
-- Version: 012
-- Description: Creates task_steps table for tracking individual steps
--              within a task. Each step represents a discrete unit of
--              work that can be executed by an agent. Steps are ordered
--              by step_index and linked to agent_sessions when running.
-- ===========================================

-- Task steps define the execution plan for a task.
-- Each step contains a prompt that will be sent to an agent.
-- Steps are executed sequentially (or in parallel with worktrees).
CREATE TABLE task_steps (
    id           TEXT PRIMARY KEY,
    task_id      TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    step_index   INTEGER NOT NULL,          -- Order of execution (0-based)
    title        TEXT NOT NULL,             -- Human-readable step name
    prompt       TEXT NOT NULL,             -- The prompt to send to the agent
    provider_id  TEXT NOT NULL,             -- Which agent provider to use ("claude-code", "gemini-cli", etc.)
    status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
    session_id   TEXT REFERENCES agent_sessions(id) ON DELETE SET NULL,  -- Link to active/completed agent session
    started_at   TEXT,                      -- When step execution began
    ended_at     TEXT,                      -- When step execution completed
    created_at   TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    UNIQUE(task_id, step_index)             -- Ensure unique ordering within a task
);

-- Index for efficient step queries by task
CREATE INDEX idx_task_steps_task ON task_steps(task_id);

-- Index for querying steps by status (e.g., find all running steps)
CREATE INDEX idx_task_steps_status ON task_steps(status);

-- Index for querying steps by session (find step for a given session)
CREATE INDEX idx_task_steps_session ON task_steps(session_id);

-- Composite index for common query pattern: get steps for a task ordered by index
CREATE INDEX idx_task_steps_task_order ON task_steps(task_id, step_index);
