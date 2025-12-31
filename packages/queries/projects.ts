import type { CreateProjectRequest, Project, UpdateProjectRequest } from '@openflow/generated';
import { createProjectSchema, updateProjectSchema } from '@openflow/validation';
import { invoke } from './utils.js';

/**
 * Project query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 * Input validation is performed using Zod schemas before invoking Tauri commands.
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
   * Input is validated against createProjectSchema before invoking.
   */
  create: (request: CreateProjectRequest): Promise<Project> => {
    const validated = createProjectSchema.parse(request);
    return invoke('create_project', { request: validated });
  },

  /**
   * Update an existing project.
   * Input is validated against updateProjectSchema before invoking.
   */
  update: (id: string, request: UpdateProjectRequest): Promise<Project> => {
    const validated = updateProjectSchema.parse(request);
    return invoke('update_project', { id, request: validated });
  },

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
