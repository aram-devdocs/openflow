-- ===========================================
-- OpenFlow Migration: Tool States
-- Version: 009
-- Description: Creates tool_states table for tracking tool execution
--              lifecycle within agent sessions. Each tool invocation
--              is tracked from use to result, enabling UI display
--              of pending, running, and completed tools.
-- ===========================================

-- Tool states track the lifecycle of individual tool invocations.
-- When an agent emits a tool_use event, a record is created.
-- When the corresponding tool_result arrives, the record is updated.
-- This enables querying for pending tools and displaying tool status in the UI.
CREATE TABLE tool_states (
    id           TEXT PRIMARY KEY,
    session_id   TEXT NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    tool_use_id  TEXT NOT NULL,              -- Tool invocation ID from agent event
    tool_name    TEXT NOT NULL,              -- Name of the tool being executed
    input        TEXT,                       -- JSON blob of tool input parameters
    status       TEXT NOT NULL DEFAULT 'running'
                 CHECK (status IN ('running', 'completed', 'error')),
    output       TEXT,                       -- Tool output (populated on completion)
    is_error     INTEGER NOT NULL DEFAULT 0, -- 1 if tool execution resulted in error
    started_at   TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    completed_at TEXT,                       -- When the tool completed execution

    -- Ensure unique tool_use_id per session (a tool can only run once per invocation)
    UNIQUE(session_id, tool_use_id)
);

-- Index for querying tool states by session (primary access pattern)
CREATE INDEX idx_tool_states_session ON tool_states(session_id);

-- Index for querying pending/running tools across sessions
-- Useful for finding tools awaiting results or monitoring active tools
CREATE INDEX idx_tool_states_status ON tool_states(status);

-- Index for querying by tool name across sessions
-- Useful for analytics on tool usage patterns
CREATE INDEX idx_tool_states_tool_name ON tool_states(tool_name);
