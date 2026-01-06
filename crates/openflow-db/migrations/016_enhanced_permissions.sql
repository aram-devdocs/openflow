-- ===========================================
-- OpenFlow Migration: Enhanced Permissions
-- Version: 016
-- Description: Adds enhanced permission tracking with detection timestamps,
--              automatic timeouts, and configurable timeout durations.
--              This enables better UX around permission prompts by detecting
--              when they were first seen and automatically timing them out
--              if not responded to within a configurable window.
-- ===========================================

-- Add timestamp for when permission was first detected in agent output
ALTER TABLE permissions ADD COLUMN detected_at TEXT;

-- Add timestamp for when permission will/did timeout
ALTER TABLE permissions ADD COLUMN timeout_at TEXT;

-- Add configurable timeout duration in seconds (default: 5 minutes)
ALTER TABLE permissions ADD COLUMN timeout_seconds INTEGER DEFAULT 300;

