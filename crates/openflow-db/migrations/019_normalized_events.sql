-- Create normalized_events table
-- Migration 019: Add normalized events table for storing canonical event format
--
-- This table stores all agent events in a normalized format, providing:
-- - Single source of truth for agent execution events
-- - Monotonic sequence numbers per session
-- - Rich metadata for debugging and UI display
-- - Type-safe event variants stored as JSON

CREATE TABLE normalized_events (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    entry_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT, -- JSON serialized EntryMetadata
    timestamp TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    
    FOREIGN KEY (session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE
);

-- Unique index on session_id and sequence for efficient incremental fetching
CREATE UNIQUE INDEX idx_normalized_events_session_sequence 
    ON normalized_events(session_id, sequence);

-- Index on session_id and entry_type for filtering by event type
CREATE INDEX idx_normalized_events_session_type 
    ON normalized_events(session_id, entry_type);

-- Index on timestamp for time-based queries
CREATE INDEX idx_normalized_events_timestamp 
    ON normalized_events(timestamp);

