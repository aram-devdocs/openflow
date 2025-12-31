-- Add archived_at column to projects table for soft-delete functionality
ALTER TABLE projects ADD COLUMN archived_at TEXT;

-- Create index for archived status filtering
CREATE INDEX idx_projects_archived_at ON projects(archived_at);
