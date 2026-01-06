-- ===========================================
-- OpenFlow Migration: Enhanced Tool States
-- Version: 018
-- Description: Adds execution context fields to tool_states table including
--              command strings, file paths, exit codes, execution duration,
--              and stderr output. This enables comprehensive tracking of tool
--              execution lifecycle and better error diagnostics.
-- ===========================================

-- Add command string for Bash/terminal tools
ALTER TABLE tool_states ADD COLUMN command TEXT;

-- Add file path for Read/Write/Edit file operations
ALTER TABLE tool_states ADD COLUMN file_path TEXT;

-- Add exit code for process-based tool executions
ALTER TABLE tool_states ADD COLUMN exit_code INTEGER;

-- Add execution duration in milliseconds
ALTER TABLE tool_states ADD COLUMN duration_ms INTEGER;

-- Add stderr output for capturing error messages
ALTER TABLE tool_states ADD COLUMN stderr TEXT;

-- Create composite index for efficient querying of tool states by session and status
-- This is the primary access pattern for fetching running/pending tools
CREATE INDEX idx_tool_states_session_status ON tool_states(session_id, status);

