/**
 * Workflow query functions for Tauri IPC
 *
 * Thin wrappers around Tauri invoke() calls for workflow operations.
 * No business logic - just type-safe IPC calls.
 * Input validation is performed using Zod schemas before invoking Tauri commands.
 */

import type {
  CreateWorkflowTemplateRequest,
  UpdateWorkflowTemplateRequest,
  WorkflowTemplate,
} from '@openflow/generated';
import { createWorkflowTemplateSchema, updateWorkflowTemplateSchema } from '@openflow/validation';
import { invoke } from './utils.js';

/**
 * Workflow queries for communicating with the Rust backend.
 */
export const workflowQueries = {
  /**
   * List all workflow templates for a project.
   * Returns both built-in templates and project-specific templates.
   *
   * @param projectId - Project ID to list templates for
   * @returns Array of workflow templates
   */
  list: (projectId: string): Promise<WorkflowTemplate[]> =>
    invoke('list_workflow_templates', { projectId }),

  /**
   * Get a specific workflow template by ID.
   *
   * @param id - Template ID
   * @returns The workflow template
   */
  get: (id: string): Promise<WorkflowTemplate> => invoke('get_workflow_template', { id }),

  /**
   * Get all built-in workflow templates.
   * These are templates bundled with the application.
   *
   * @returns Array of built-in workflow templates
   */
  getBuiltin: (): Promise<WorkflowTemplate[]> => invoke('get_builtin_workflow_templates'),

  /**
   * Create a new custom workflow template.
   * Input is validated against createWorkflowTemplateSchema before invoking.
   *
   * @param request - Template creation request
   * @returns The created workflow template
   */
  create: (request: CreateWorkflowTemplateRequest): Promise<WorkflowTemplate> => {
    const validated = createWorkflowTemplateSchema.parse(request);
    return invoke('create_workflow_template', { request: validated });
  },

  /**
   * Update an existing workflow template.
   * Input is validated against updateWorkflowTemplateSchema before invoking.
   *
   * @param id - Template ID to update
   * @param request - Update request with fields to modify
   * @returns The updated workflow template
   */
  update: (id: string, request: UpdateWorkflowTemplateRequest): Promise<WorkflowTemplate> => {
    const validated = updateWorkflowTemplateSchema.parse(request);
    return invoke('update_workflow_template', { id, request: validated });
  },

  /**
   * Delete a custom workflow template.
   * Built-in templates cannot be deleted.
   *
   * @param id - Template ID to delete
   */
  delete: (id: string): Promise<void> => invoke('delete_workflow_template', { id }),

  /**
   * Parse workflow content into steps.
   * This is done on the backend to ensure consistent parsing.
   *
   * @param content - Markdown content to parse
   * @returns Parsed workflow template with steps
   */
  parse: (content: string): Promise<WorkflowTemplate> =>
    invoke('parse_workflow_content', { content }),
};
