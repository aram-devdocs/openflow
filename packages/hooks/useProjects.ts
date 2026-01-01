/**
 * useProjects - Hooks for managing projects
 *
 * This module provides React Query hooks for CRUD operations on projects,
 * including archiving and restoring projects.
 *
 * Features:
 * - Full logging at DEBUG/INFO/ERROR levels
 * - Toast notifications for user feedback on mutations
 * - Proper error handling with try/catch patterns
 *
 * @example
 * ```tsx
 * // List all projects
 * const { data: projects, isLoading, error } = useProjects();
 *
 * // Get a single project
 * const { data: project } = useProject('project-id');
 *
 * // Create a new project
 * const createProject = useCreateProject();
 * await createProject.mutateAsync({ name: 'My Project', path: '/path/to/project' });
 *
 * // Update a project
 * const updateProject = useUpdateProject();
 * await updateProject.mutateAsync({ id: 'project-id', request: { name: 'Updated Name' } });
 *
 * // Delete a project
 * const deleteProject = useDeleteProject();
 * await deleteProject.mutateAsync({ id: 'project-id', name: 'My Project' });
 *
 * // Archive/Unarchive
 * const archiveProject = useArchiveProject();
 * const unarchiveProject = useUnarchiveProject();
 * await archiveProject.mutateAsync({ id: 'project-id', name: 'My Project' });
 * await unarchiveProject.mutateAsync({ id: 'project-id', name: 'My Project' });
 * ```
 */

import type { CreateProjectRequest, Project, UpdateProjectRequest } from '@openflow/generated';
import { projectQueries } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useToast } from './useToast';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useProjects');

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query key factory for projects.
 * Provides structured, hierarchical keys for cache management.
 */
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: () => [...projectKeys.lists()] as const,
  archived: () => [...projectKeys.lists(), 'archived'] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all projects.
 *
 * @returns Query result with array of projects
 */
export function useProjects(): UseQueryResult<Project[]> {
  logger.debug('useProjects hook called');

  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: async () => {
      logger.debug('Fetching projects');
      try {
        const projects = await projectQueries.list();
        logger.info('Projects fetched successfully', {
          count: projects.length,
          projectNames: projects.map((p) => p.name),
        });
        return projects;
      } catch (error) {
        logger.error('Failed to fetch projects', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  });
}

/**
 * Fetch a single project by ID.
 *
 * @param id - Project ID to fetch
 * @returns Query result with project data
 */
export function useProject(id: string): UseQueryResult<Project> {
  logger.debug('useProject hook called', { id, enabled: Boolean(id) });

  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      logger.debug('Fetching project detail', { id });
      try {
        const project = await projectQueries.get(id);
        logger.info('Project detail fetched successfully', {
          id: project.id,
          name: project.name,
          gitRepoPath: project.gitRepoPath,
        });
        return project;
      } catch (error) {
        logger.error('Failed to fetch project detail', {
          id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    enabled: Boolean(id),
  });
}

/**
 * Fetch all archived projects.
 *
 * @returns Query result with array of archived projects
 */
export function useArchivedProjects(): UseQueryResult<Project[]> {
  logger.debug('useArchivedProjects hook called');

  return useQuery({
    queryKey: projectKeys.archived(),
    queryFn: async () => {
      logger.debug('Fetching archived projects');
      try {
        const projects = await projectQueries.listArchived();
        logger.info('Archived projects fetched successfully', {
          count: projects.length,
          projectNames: projects.map((p) => p.name),
        });
        return projects;
      } catch (error) {
        logger.error('Failed to fetch archived projects', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new project.
 *
 * @returns Mutation for creating a project
 */
export function useCreateProject(): UseMutationResult<Project, Error, CreateProjectRequest> {
  const queryClient = useQueryClient();
  const toast = useToast();

  logger.debug('useCreateProject hook initialized');

  return useMutation({
    mutationFn: async (request: CreateProjectRequest) => {
      logger.debug('Creating project', {
        name: request.name,
        gitRepoPath: request.gitRepoPath,
      });
      try {
        const project = await projectQueries.create(request);
        logger.info('Project created successfully', {
          id: project.id,
          name: project.name,
          gitRepoPath: project.gitRepoPath,
        });
        return project;
      } catch (error) {
        logger.error('Failed to create project', {
          name: request.name,
          gitRepoPath: request.gitRepoPath,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success('Project Created', `"${data.name}" has been created.`);
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
    onError: (error, variables) => {
      toast.error(
        'Failed to Create Project',
        `Could not create "${variables.name}". ${error instanceof Error ? error.message : 'Please try again.'}`
      );
    },
  });
}

/**
 * Update an existing project.
 *
 * @returns Mutation for updating a project
 */
export function useUpdateProject(): UseMutationResult<
  Project,
  Error,
  { id: string; request: UpdateProjectRequest; name?: string }
> {
  const queryClient = useQueryClient();
  const toast = useToast();

  logger.debug('useUpdateProject hook initialized');

  return useMutation({
    mutationFn: async ({ id, request }) => {
      logger.debug('Updating project', { id, request });
      try {
        const project = await projectQueries.update(id, request);
        logger.info('Project updated successfully', {
          id: project.id,
          name: project.name,
        });
        return project;
      } catch (error) {
        logger.error('Failed to update project', {
          id,
          request,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success('Project Updated', `"${data.name}" has been updated.`);
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
    },
    onError: (error, variables) => {
      toast.error(
        'Failed to Update Project',
        `Could not update "${variables.name || 'project'}". ${error instanceof Error ? error.message : 'Please try again.'}`
      );
    },
  });
}

/**
 * Delete a project.
 *
 * @returns Mutation for deleting a project
 */
export function useDeleteProject(): UseMutationResult<void, Error, { id: string; name?: string }> {
  const queryClient = useQueryClient();
  const toast = useToast();

  logger.debug('useDeleteProject hook initialized');

  return useMutation({
    mutationFn: async ({ id }) => {
      logger.debug('Deleting project', { id });
      try {
        await projectQueries.delete(id);
        logger.info('Project deleted successfully', { id });
      } catch (error) {
        logger.error('Failed to delete project', {
          id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      toast.success('Project Deleted', `"${variables.name || 'Project'}" has been deleted.`);
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.removeQueries({ queryKey: projectKeys.detail(variables.id) });
    },
    onError: (error, variables) => {
      toast.error(
        'Failed to Delete Project',
        `Could not delete "${variables.name || 'project'}". ${error instanceof Error ? error.message : 'Please try again.'}`
      );
    },
  });
}

/**
 * Archive a project.
 * Cascades to archive all tasks in the project.
 *
 * @returns Mutation for archiving a project
 */
export function useArchiveProject(): UseMutationResult<
  Project,
  Error,
  { id: string; name?: string }
> {
  const queryClient = useQueryClient();
  const toast = useToast();

  logger.debug('useArchiveProject hook initialized');

  return useMutation({
    mutationFn: async ({ id }) => {
      logger.debug('Archiving project', { id });
      try {
        const project = await projectQueries.archive(id);
        logger.info('Project archived successfully', {
          id: project.id,
          name: project.name,
        });
        return project;
      } catch (error) {
        logger.error('Failed to archive project', {
          id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success('Project Archived', `"${data.name}" has been archived.`);
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.archived() });
    },
    onError: (error, variables) => {
      toast.error(
        'Failed to Archive Project',
        `Could not archive "${variables.name || 'project'}". ${error instanceof Error ? error.message : 'Please try again.'}`
      );
    },
  });
}

/**
 * Unarchive a project.
 * Makes the project visible in list queries again.
 * Note: Tasks remain archived and must be restored individually.
 *
 * @returns Mutation for unarchiving a project
 */
export function useUnarchiveProject(): UseMutationResult<
  Project,
  Error,
  { id: string; name?: string }
> {
  const queryClient = useQueryClient();
  const toast = useToast();

  logger.debug('useUnarchiveProject hook initialized');

  return useMutation({
    mutationFn: async ({ id }) => {
      logger.debug('Unarchiving project', { id });
      try {
        const project = await projectQueries.unarchive(id);
        logger.info('Project unarchived successfully', {
          id: project.id,
          name: project.name,
        });
        return project;
      } catch (error) {
        logger.error('Failed to unarchive project', {
          id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success('Project Restored', `"${data.name}" has been restored from archive.`);
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.archived() });
    },
    onError: (error, variables) => {
      toast.error(
        'Failed to Restore Project',
        `Could not restore "${variables.name || 'project'}". ${error instanceof Error ? error.message : 'Please try again.'}`
      );
    },
  });
}
