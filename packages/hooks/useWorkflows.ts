/**
 * Workflow hooks for TanStack Query integration
 *
 * Provides React hooks for workflow template operations
 * with caching, invalidation, and loading states.
 */

import type {
  CreateWorkflowTemplateRequest,
  UpdateWorkflowTemplateRequest,
  WorkflowContext,
  WorkflowStep,
  WorkflowTemplate,
} from '@openflow/generated';
import { workflowQueries } from '@openflow/queries';
import {
  type ParsedWorkflow,
  extractVariables,
  parseWorkflowSteps,
  substituteVariables,
} from '@openflow/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Query keys factory for workflow-related queries.
 * Provides consistent cache key structure.
 */
export const workflowKeys = {
  all: ['workflows'] as const,
  lists: () => [...workflowKeys.all, 'list'] as const,
  list: (projectId: string) => [...workflowKeys.lists(), projectId] as const,
  builtin: () => [...workflowKeys.all, 'builtin'] as const,
  details: () => [...workflowKeys.all, 'detail'] as const,
  detail: (id: string) => [...workflowKeys.details(), id] as const,
};

/**
 * Hook to fetch workflow templates for a project.
 * Returns both built-in and project-specific templates.
 *
 * @param projectId - Project ID to fetch templates for
 * @returns Query result with workflow templates
 *
 * @example
 * const { data: templates, isLoading } = useWorkflowTemplates('project-123');
 */
export function useWorkflowTemplates(projectId: string) {
  return useQuery({
    queryKey: workflowKeys.list(projectId),
    queryFn: () => workflowQueries.list(projectId),
    enabled: !!projectId,
  });
}

/**
 * Hook to fetch built-in workflow templates.
 * These are templates bundled with the application.
 *
 * @returns Query result with built-in workflow templates
 *
 * @example
 * const { data: builtinTemplates } = useBuiltinWorkflowTemplates();
 */
export function useBuiltinWorkflowTemplates() {
  return useQuery({
    queryKey: workflowKeys.builtin(),
    queryFn: () => workflowQueries.getBuiltin(),
    staleTime: Number.POSITIVE_INFINITY, // Built-in templates don't change
  });
}

/**
 * Hook to fetch a single workflow template by ID.
 *
 * @param id - Template ID to fetch
 * @returns Query result with the workflow template
 *
 * @example
 * const { data: template } = useWorkflowTemplate('template-123');
 */
export function useWorkflowTemplate(id: string) {
  return useQuery({
    queryKey: workflowKeys.detail(id),
    queryFn: () => workflowQueries.get(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new workflow template.
 * Invalidates the templates list on success.
 *
 * @returns Mutation result for creating templates
 *
 * @example
 * const createTemplate = useCreateWorkflowTemplate();
 * createTemplate.mutate({ name: 'My Template', content: '...' });
 */
export function useCreateWorkflowTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateWorkflowTemplateRequest) => workflowQueries.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

/**
 * Hook to update an existing workflow template.
 * Invalidates both the detail and list caches on success.
 *
 * @returns Mutation result for updating templates
 *
 * @example
 * const updateTemplate = useUpdateWorkflowTemplate();
 * updateTemplate.mutate({ id: 'template-123', request: { name: 'Updated' } });
 */
export function useUpdateWorkflowTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: string;
      request: UpdateWorkflowTemplateRequest;
    }) => workflowQueries.update(id, request),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

/**
 * Hook to delete a workflow template.
 * Invalidates the templates list on success.
 *
 * @returns Mutation result for deleting templates
 *
 * @example
 * const deleteTemplate = useDeleteWorkflowTemplate();
 * deleteTemplate.mutate('template-123');
 */
export function useDeleteWorkflowTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workflowQueries.delete(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: workflowKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

/**
 * Hook to parse workflow content client-side.
 * Uses the utils package parseWorkflowSteps function for local parsing.
 *
 * @param content - Markdown content to parse (can be undefined)
 * @returns Parsed workflow with memoized result
 *
 * @example
 * const parsed = useParseWorkflow(markdownContent);
 * console.log(parsed?.steps); // Array of workflow steps
 */
export function useParseWorkflow(content: string | undefined): ParsedWorkflow | null {
  return useMemo(() => {
    if (!content) return null;
    return parseWorkflowSteps(content);
  }, [content]);
}

/**
 * Hook to substitute variables in workflow content.
 * Replaces {@variable_name} placeholders with context values.
 *
 * @param content - Content with variable placeholders
 * @param context - Workflow context with variable values
 * @returns Content with variables substituted
 *
 * @example
 * const substituted = useSubstituteVariables(
 *   'Save to {@artifacts_path}/output.md',
 *   { artifactsPath: '.zenflow/tasks/abc' }
 * );
 */
export function useSubstituteVariables(
  content: string | undefined,
  context: WorkflowContext | undefined
): string | null {
  return useMemo(() => {
    if (!content) return null;
    if (!context) return content;

    // Convert WorkflowContext to a Record<string, string> for substitution
    // Using object literal with computed keys for variable naming convention
    const variables: Record<string, string> = {
      ...(context.artifactsPath && { artifacts_path: context.artifactsPath }),
      ...(context.projectRoot && { project_root: context.projectRoot }),
      ...(context.worktreePath && { worktree_path: context.worktreePath }),
      ...(context.taskId && { task_id: context.taskId }),
      ...(context.taskTitle && { task_title: context.taskTitle }),
      ...(context.projectName && { project_name: context.projectName }),
    };

    return substituteVariables(content, variables);
  }, [content, context]);
}

/**
 * Hook to extract variable placeholders from content.
 * Returns an array of variable names found in the content.
 *
 * @param content - Content to scan for variables
 * @returns Array of unique variable names
 *
 * @example
 * const variables = useExtractVariables('Use {@project_path} and {@artifacts_path}');
 * // => ['project_path', 'artifacts_path']
 */
export function useExtractVariables(content: string | undefined): string[] {
  return useMemo(() => {
    if (!content) return [];
    return extractVariables(content);
  }, [content]);
}

/**
 * Get a workflow step by index from a template.
 * Utility function for accessing steps safely.
 *
 * @param template - Workflow template
 * @param index - Step index
 * @returns The step at the given index or undefined
 */
export function getWorkflowStep(
  template: WorkflowTemplate | undefined,
  index: number
): WorkflowStep | undefined {
  return template?.steps[index];
}

/**
 * Get the next pending step in a workflow.
 * Useful for auto-advancing through workflow steps.
 *
 * @param template - Workflow template
 * @returns The next pending step or undefined if all complete
 */
export function getNextPendingStep(
  template: WorkflowTemplate | undefined
): WorkflowStep | undefined {
  if (!template) return undefined;
  return template.steps.find((step) => step.status === 'pending');
}

/**
 * Check if all steps in a workflow are completed.
 *
 * @param template - Workflow template
 * @returns true if all steps are completed
 */
export function isWorkflowComplete(template: WorkflowTemplate | undefined): boolean {
  if (!template) return false;
  return template.steps.every((step) => step.status === 'completed');
}

/**
 * Calculate workflow progress as a percentage.
 *
 * @param template - Workflow template
 * @returns Progress percentage (0-100)
 */
export function getWorkflowProgress(template: WorkflowTemplate | undefined): number {
  if (!template || template.steps.length === 0) return 0;

  const completedCount = template.steps.filter((step) => step.status === 'completed').length;

  return Math.round((completedCount / template.steps.length) * 100);
}
