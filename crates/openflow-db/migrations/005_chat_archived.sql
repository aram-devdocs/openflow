-- ===========================================
-- OpenFlow Migration: Chat Archived At
-- Version: 005
-- Description: Adds archived_at column to chats table for
--              soft-delete/archiving functionality
-- ===========================================

-- Add archived_at column to support archiving chats
-- When set, the chat is considered archived and hidden from default lists
ALTER TABLE chats ADD COLUMN archived_at TEXT;
