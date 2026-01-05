-- ===========================================
-- OpenFlow Migration: Audit Logs
-- Version: 010
-- Description: Creates audit_logs table for comprehensive action logging.
--              Every significant action in the system is recorded here,
--              enabling full audit trails for debugging, compliance, and
--              historical analysis.
-- ===========================================

-- Audit logs provide a complete trail of all significant actions.
-- This table is append-only in normal operation - records are never
-- updated or deleted. Queries typically filter by entity or time range.
CREATE TABLE audit_logs (
    id           TEXT PRIMARY KEY,
    entity_type  TEXT NOT NULL,              -- "task", "step", "session", "event", "permission", "project", "chat"
    entity_id    TEXT NOT NULL,              -- ID of the entity this action relates to
    action       TEXT NOT NULL,              -- "created", "updated", "started", "completed", "failed", "paused", "resumed", "approved", "denied", "killed"
    actor        TEXT NOT NULL,              -- "system", "user", "agent"
    details      TEXT,                       -- JSON blob with action-specific context
    created_at   TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

-- Index for querying audit logs by entity
-- Primary access pattern: "show me all actions on this task/session"
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Index for time-based queries
-- Useful for: "show me all actions in the last hour" or "what happened during this time window"
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Index for querying by actor
-- Useful for: "show me all user actions" or "show me all system actions"
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor);

-- Index for querying by action type
-- Useful for: "show me all failures" or "show me all permission responses"
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
