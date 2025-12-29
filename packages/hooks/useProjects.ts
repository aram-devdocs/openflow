import type { CreateProjectRequest, Project, UpdateProjectRequest } from '@openflow/generated';
import { projectQueries } from '@openflow/queries';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

/**
 * Query key factory for projects.
 * Provides structured, hierarchical keys for cache management.
 */
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: () => [...projectKeys.lists()] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

/**
 * Fetch all projects.
 *
 * @returns Query result with array of projects
 */
export function useProjects(): UseQueryResult<Project[]> {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: () => projectQueries.list(),
  });
}

/**
 * Fetch a single project by ID.
 *
 * @param id - Project ID to fetch
 * @returns Query result with project data
 */
export function useProject(id: string): UseQueryResult<Project> {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectQueries.get(id),
    enabled: Boolean(id),
  });
}

/**
 * Create a new project.
 *
 * @returns Mutation for creating a project
 */
export function useCreateProject(): UseMutationResult<Project, Error, CreateProjectRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateProjectRequest) => projectQueries.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
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
  { id: string; request: UpdateProjectRequest }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) => projectQueries.update(id, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
    },
  });
}

/**
 * Delete a project.
 *
 * @returns Mutation for deleting a project
 */
export function useDeleteProject(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectQueries.delete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
    },
  });
}
