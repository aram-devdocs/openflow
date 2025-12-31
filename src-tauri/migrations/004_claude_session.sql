-- ===========================================
-- OpenFlow Migration: Claude Session ID
-- Version: 004
-- Description: Adds claude_session_id to chats table for
--              session resumption across messages
-- ===========================================

-- Add claude_session_id column to track Claude Code CLI sessions
-- This allows resuming the same conversation context when sending
-- subsequent messages using --resume <session_id>
ALTER TABLE chats ADD COLUMN claude_session_id TEXT;
