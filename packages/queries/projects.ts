import type { CreateProjectRequest, Project, UpdateProjectRequest } from '@openflow/generated';
import { invoke } from './utils.js';

/**
 * Project query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 */
export const projectQueries = {
  /**
   * List all projects.
   */
  list: (): Promise<Project[]> => invoke('list_projects'),

  /**
   * Get a single project by ID.
   */
  get: (id: string): Promise<Project> => invoke('get_project', { id }),

  /**
   * Create a new project.
   */
  create: (request: CreateProjectRequest): Promise<Project> =>
    invoke('create_project', { request }),

  /**
   * Update an existing project.
   */
  update: (id: string, request: UpdateProjectRequest): Promise<Project> =>
    invoke('update_project', { id, request }),

  /**
   * Delete a project by ID.
   */
  delete: (id: string): Promise<void> => invoke('delete_project', { id }),

  /**
   * Archive a project by ID.
   * Cascades to archive all tasks in the project.
   */
  archive: (id: string): Promise<Project> => invoke('archive_project', { id }),

  /**
   * Unarchive a project by ID.
   * Makes the project visible in list queries again.
   * Note: Tasks remain archived and must be restored individually.
   */
  unarchive: (id: string): Promise<Project> => invoke('unarchive_project', { id }),

  /**
   * List all archived projects.
   */
  listArchived: (): Promise<Project[]> => invoke('list_archived_projects'),
};
