-- ===========================================
-- OpenFlow Search Index Migration
-- Version: 002
-- Description: Creates FTS5 full-text search index with triggers
-- ===========================================

-- ===========================================
-- FTS5 VIRTUAL TABLE
-- ===========================================

-- Full-text search virtual table for tasks and projects
-- Uses Porter stemming and Unicode61 tokenizer for natural language search
-- Note: This stores content directly (no external content table) for simpler querying
CREATE VIRTUAL TABLE search_index USING fts5(
    id,           -- Entity ID (task or project)
    type,         -- Entity type: 'task' or 'project'
    title,        -- Title for search
    description,  -- Description/content for search
    project_id,   -- Project ID for filtering (NULL for projects themselves)
    tokenize='porter unicode61'
);

-- ===========================================
-- TASK TRIGGERS
-- ===========================================

-- Insert task into search index when created
CREATE TRIGGER tasks_search_insert AFTER INSERT ON tasks BEGIN
    INSERT INTO search_index(id, type, title, description, project_id)
    VALUES (NEW.id, 'task', NEW.title, NEW.description, NEW.project_id);
END;

-- Update search index when task is modified
CREATE TRIGGER tasks_search_update AFTER UPDATE ON tasks BEGIN
    DELETE FROM search_index WHERE id = OLD.id AND type = 'task';
    INSERT INTO search_index(id, type, title, description, project_id)
    VALUES (NEW.id, 'task', NEW.title, NEW.description, NEW.project_id);
END;

-- Remove from search index when task is deleted
CREATE TRIGGER tasks_search_delete AFTER DELETE ON tasks BEGIN
    DELETE FROM search_index WHERE id = OLD.id AND type = 'task';
END;

-- ===========================================
-- PROJECT TRIGGERS
-- ===========================================

-- Insert project into search index when created
CREATE TRIGGER projects_search_insert AFTER INSERT ON projects BEGIN
    INSERT INTO search_index(id, type, title, description, project_id)
    VALUES (NEW.id, 'project', NEW.name, NULL, NULL);
END;

-- Update search index when project is modified
CREATE TRIGGER projects_search_update AFTER UPDATE ON projects BEGIN
    DELETE FROM search_index WHERE id = OLD.id AND type = 'project';
    INSERT INTO search_index(id, type, title, description, project_id)
    VALUES (NEW.id, 'project', NEW.name, NULL, NULL);
END;

-- Remove from search index when project is deleted
CREATE TRIGGER projects_search_delete AFTER DELETE ON projects BEGIN
    DELETE FROM search_index WHERE id = OLD.id AND type = 'project';
END;

-- ===========================================
-- INITIAL DATA POPULATION
-- ===========================================

-- Populate search index with existing tasks
INSERT INTO search_index(id, type, title, description, project_id)
SELECT id, 'task', title, description, project_id
FROM tasks;

-- Populate search index with existing projects
INSERT INTO search_index(id, type, title, description, project_id)
SELECT id, 'project', name, NULL, NULL
FROM projects;
