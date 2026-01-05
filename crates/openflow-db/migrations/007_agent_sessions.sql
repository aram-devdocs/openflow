-- ===========================================
-- OpenFlow Migration: Agent Sessions
-- Version: 007
-- Description: Creates agent_sessions table for tracking agent process
--              lifecycle. This is the foundation for the new
--              backend-owned state machine architecture.
-- ===========================================

-- Agent sessions track individual agent process runs.
-- Each session is linked to an execution_process and captures
-- provider-specific session IDs for resumption support.
CREATE TABLE agent_sessions (
    id                   TEXT PRIMARY KEY,
    process_id           TEXT NOT NULL REFERENCES execution_processes(id) ON DELETE CASCADE,
    provider_id          TEXT NOT NULL,           -- "claude-code", "gemini-cli", "codex-cli", "mock"
    external_session_id  TEXT,                    -- Provider's session ID for resume (e.g., Claude's session ID)
    status               TEXT NOT NULL DEFAULT 'running'
                         CHECK (status IN ('running', 'completed', 'failed', 'killed')),
    exit_code            INTEGER,                 -- Process exit code when completed
    started_at           TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    ended_at             TEXT,                    -- When the session ended
    created_at           TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at           TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

-- Index for querying sessions by process
CREATE INDEX idx_agent_sessions_process ON agent_sessions(process_id);

-- Index for querying sessions by status (e.g., find all running sessions)
CREATE INDEX idx_agent_sessions_status ON agent_sessions(status);

-- Index for querying sessions by provider (useful for provider-specific operations)
CREATE INDEX idx_agent_sessions_provider ON agent_sessions(provider_id);
