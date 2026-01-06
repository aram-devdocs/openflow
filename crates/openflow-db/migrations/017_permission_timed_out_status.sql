-- ===========================================
-- OpenFlow Migration: Permission TimedOut Status
-- Version: 017
-- Description: Updates the permissions table CHECK constraint to include
--              'timed_out' status. This enables automatic timeout of pending
--              permissions that haven't been responded to within the timeout
--              window (default 5 minutes).
-- ===========================================

-- SQLite doesn't support ALTER TABLE to modify CHECK constraints,
-- so we need to recreate the table with the updated constraint.

-- Create new permissions table with updated constraint
CREATE TABLE permissions_new (
    id           TEXT PRIMARY KEY,
    session_id   TEXT NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    tool_name    TEXT NOT NULL,
    description  TEXT NOT NULL,
    file_path    TEXT,
    status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'denied', 'expired', 'cancelled', 'timed_out')),
    -- Lifecycle timestamps
    created_at   TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    detected_at  TEXT,
    responded_at TEXT,
    expired_at   TEXT,
    timeout_at   TEXT,
    timeout_seconds INTEGER DEFAULT 300
);

-- Copy data from old table
-- Handle both old and new schema (with or without enhanced fields)
INSERT INTO permissions_new (id, session_id, tool_name, description, file_path, status,
                              created_at, detected_at, responded_at, expired_at, timeout_at, timeout_seconds)
SELECT id, session_id, tool_name, description, file_path, status,
       created_at, 
       COALESCE(detected_at, created_at) as detected_at, 
       responded_at, 
       expired_at, 
       timeout_at, 
       COALESCE(timeout_seconds, 300) as timeout_seconds
FROM permissions;

-- Drop old table
DROP TABLE permissions;

-- Rename new table to permissions
ALTER TABLE permissions_new RENAME TO permissions;

-- Recreate indexes
CREATE INDEX idx_permissions_session ON permissions(session_id);
CREATE INDEX idx_permissions_status ON permissions(status);
CREATE INDEX idx_permissions_session_status ON permissions(session_id, status);

