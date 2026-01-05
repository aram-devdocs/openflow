-- ===========================================
-- OpenFlow Migration: Permissions Table
-- Version: 014
-- Description: Creates the permissions table for tracking permission requests
--              from agents during execution. Agents may request approval for
--              operations like file writes, shell commands, or sensitive actions.
--              This enables async approval workflows where users can approve/deny
--              permissions from the UI while the agent waits.
-- ===========================================

-- Permissions track agent requests for user approval.
-- When an agent needs to perform a sensitive operation, it emits a permission
-- request which creates a pending record. The user can then approve or deny,
-- and the response is sent back to the agent's stdin.
CREATE TABLE permissions (
    id           TEXT PRIMARY KEY,
    session_id   TEXT NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    tool_name    TEXT NOT NULL,              -- Name of the tool requesting permission
    description  TEXT NOT NULL,              -- Human-readable description of the action
    file_path    TEXT,                       -- Optional file path if operation involves a specific file
    status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'denied', 'expired', 'cancelled')),
    -- Lifecycle timestamps
    created_at   TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    responded_at TEXT,                       -- When user approved/denied the permission
    expired_at   TEXT                        -- When permission expired (if applicable)
);

-- Index for querying permissions by session (primary access pattern)
CREATE INDEX idx_permissions_session ON permissions(session_id);

-- Index for finding pending permissions across all sessions
-- Used by UI to show pending approval requests
CREATE INDEX idx_permissions_status ON permissions(status);

-- Index for efficient lookup of pending permissions by session
-- Common query: find the pending permission for a specific session
CREATE INDEX idx_permissions_session_status ON permissions(session_id, status);
