import type { CreateProjectRequest, Project, UpdateProjectRequest } from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { createProjectSchema, updateProjectSchema } from '@openflow/validation';
import { invoke } from './utils.js';

/**
 * Logger for project query operations.
 * Logs at DEBUG level for query calls, INFO for successes, ERROR for failures.
 */
const logger = createLogger('queries:projects');

/**
 * Project query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 * Input validation is performed using Zod schemas before invoking Tauri commands.
 *
 * All functions include:
 * - Try/catch error handling with re-throw for React Query
 * - Logging at appropriate levels (DEBUG on call, INFO on success, ERROR on failure)
 * - Input validation via Zod schemas for mutations
 *
 * @example
 * ```ts
 * // List all projects
 * const projects = await projectQueries.list();
 *
 * // Get a single project
 * const project = await projectQueries.get('project-123');
 *
 * // Create a new project
 * const newProject = await projectQueries.create({
 *   name: 'My Project',
 *   gitRepoPath: '/path/to/project',
 * });
 *
 * // Update a project
 * const updated = await projectQueries.update('project-123', {
 *   name: 'Updated Name',
 * });
 *
 * // Archive a project
 * const archived = await projectQueries.archive('project-123');
 *
 * // List archived projects
 * const archivedProjects = await projectQueries.listArchived();
 * ```
 */
export const projectQueries = {
  /**
   * List all active (non-archived) projects.
   * @returns Promise resolving to array of projects
   * @throws Error if the query fails (re-thrown for React Query)
   */
  list: async (): Promise<Project[]> => {
    logger.debug('Listing projects');

    try {
      const projects = await invoke<Project[]>('list_projects');

      logger.info('Projects listed successfully', {
        count: projects.length,
        names: projects.slice(0, 3).map((p) => p.name),
        hasMore: projects.length > 3,
      });

      return projects;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list projects', {
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Get a single project by ID.
   * @param id - Project ID
   * @returns Promise resolving to the project
   * @throws Error if the query fails (re-thrown for React Query)
   */
  get: async (id: string): Promise<Project> => {
    logger.debug('Getting project', { id });

    try {
      const project = await invoke<Project>('get_project', { id });

      logger.info('Project retrieved successfully', {
        id: project.id,
        name: project.name,
        gitRepoPath: project.gitRepoPath,
      });

      return project;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get project', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Create a new project.
   * Input is validated against createProjectSchema before invoking.
   * @param request - Project creation request with name and path
   * @returns Promise resolving to the created project
   * @throws Error if validation or query fails (re-thrown for React Query)
   */
  create: async (request: CreateProjectRequest): Promise<Project> => {
    logger.debug('Creating project', {
      name: request.name,
      gitRepoPath: request.gitRepoPath,
    });

    try {
      const validated = createProjectSchema.parse(request);
      const project = await invoke<Project>('create_project', { request: validated });

      logger.info('Project created successfully', {
        id: project.id,
        name: project.name,
        gitRepoPath: project.gitRepoPath,
      });

      return project;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create project', {
        name: request.name,
        gitRepoPath: request.gitRepoPath,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Update an existing project.
   * Input is validated against updateProjectSchema before invoking.
   * @param id - Project ID to update
   * @param request - Update request with fields to change
   * @returns Promise resolving to the updated project
   * @throws Error if validation or query fails (re-thrown for React Query)
   */
  update: async (id: string, request: UpdateProjectRequest): Promise<Project> => {
    logger.debug('Updating project', {
      id,
      hasName: 'name' in request,
      hasSetupScript: 'setupScript' in request,
      hasCleanupScript: 'cleanupScript' in request,
      hasDevServerScript: 'devServerScript' in request,
      hasRules: 'rules' in request,
    });

    try {
      const validated = updateProjectSchema.parse(request);
      const project = await invoke<Project>('update_project', { id, request: validated });

      logger.info('Project updated successfully', {
        id: project.id,
        name: project.name,
      });

      return project;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update project', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Delete a project by ID.
   * This will cascade delete all associated tasks, chats, and messages.
   * @param id - Project ID to delete
   * @returns Promise resolving when deletion is complete
   * @throws Error if the query fails (re-thrown for React Query)
   */
  delete: async (id: string): Promise<void> => {
    logger.debug('Deleting project', { id });

    try {
      await invoke<void>('delete_project', { id });

      logger.info('Project deleted successfully', { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete project', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Archive a project by ID.
   * Cascades to archive all tasks in the project.
   * Archived projects are hidden from list queries.
   * @param id - Project ID to archive
   * @returns Promise resolving to the archived project
   * @throws Error if the query fails (re-thrown for React Query)
   */
  archive: async (id: string): Promise<Project> => {
    logger.debug('Archiving project', { id });

    try {
      const project = await invoke<Project>('archive_project', { id });

      logger.info('Project archived successfully', {
        id: project.id,
        name: project.name,
      });

      return project;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to archive project', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Unarchive a project by ID.
   * Makes the project visible in list queries again.
   * Note: Tasks remain archived and must be restored individually.
   * @param id - Project ID to unarchive
   * @returns Promise resolving to the unarchived project
   * @throws Error if the query fails (re-thrown for React Query)
   */
  unarchive: async (id: string): Promise<Project> => {
    logger.debug('Unarchiving project', { id });

    try {
      const project = await invoke<Project>('unarchive_project', { id });

      logger.info('Project unarchived successfully', {
        id: project.id,
        name: project.name,
      });

      return project;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to unarchive project', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * List all archived projects.
   * @returns Promise resolving to array of archived projects
   * @throws Error if the query fails (re-thrown for React Query)
   */
  listArchived: async (): Promise<Project[]> => {
    logger.debug('Listing archived projects');

    try {
      const projects = await invoke<Project[]>('list_archived_projects');

      logger.info('Archived projects listed successfully', {
        count: projects.length,
        names: projects.slice(0, 3).map((p) => p.name),
        hasMore: projects.length > 3,
      });

      return projects;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list archived projects', {
        error: errorMessage,
      });
      throw error;
    }
  },
};
