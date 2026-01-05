-- ===========================================
-- OpenFlow Migration: Agent Events
-- Version: 008
-- Description: Creates agent_events table for storing all events
--              emitted by agent sessions. Each event is persisted
--              with a monotonic sequence number for ordering and
--              deduplication.
-- ===========================================

-- Agent events store the full history of events from agent sessions.
-- Events are normalized from provider-specific formats into a unified
-- schema and persisted as JSON payloads for flexibility.
CREATE TABLE agent_events (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    sequence    INTEGER NOT NULL,           -- Monotonic sequence number per session
    event_type  TEXT NOT NULL               -- "init", "message", "tool_use", "tool_result", "complete", "error", "permission"
                CHECK (event_type IN ('init', 'message', 'tool_use', 'tool_result', 'complete', 'error', 'permission')),
    payload     TEXT NOT NULL,              -- JSON blob containing event-specific data
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),

    -- Ensure unique sequence per session for ordering guarantees
    UNIQUE(session_id, sequence)
);

-- Index for querying events by session (most common access pattern)
CREATE INDEX idx_agent_events_session ON agent_events(session_id);

-- Composite index for efficient range queries on events within a session
-- Supports queries like "get events after sequence N for session S"
CREATE INDEX idx_agent_events_session_seq ON agent_events(session_id, sequence);

-- Index for querying events by type across all sessions
-- Useful for analytics and debugging specific event types
CREATE INDEX idx_agent_events_type ON agent_events(event_type);
