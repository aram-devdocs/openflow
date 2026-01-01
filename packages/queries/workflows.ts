/**
 * Workflow query functions for Tauri IPC
 *
 * Thin wrappers around Tauri invoke() calls for workflow operations.
 * No business logic - just type-safe IPC calls with logging and error handling.
 * Input validation is performed using Zod schemas before invoking Tauri commands.
 *
 * All functions include:
 * - Try/catch error handling with re-throw for React Query
 * - Logging at appropriate levels (DEBUG on call, INFO on success, ERROR on failure)
 *
 * @example
 * ```ts
 * // List all workflow templates for a project
 * const templates = await workflowQueries.list('project-123');
 *
 * // Get a specific template
 * const template = await workflowQueries.get('template-456');
 *
 * // Create a new custom template
 * const newTemplate = await workflowQueries.create({
 *   name: 'My Workflow',
 *   projectId: 'project-123',
 *   content: '### [ ] Step: First Step\nDo something...',
 * });
 *
 * // Update a template
 * const updated = await workflowQueries.update('template-456', {
 *   name: 'Updated Name',
 * });
 *
 * // Delete a template
 * await workflowQueries.delete('template-456');
 * ```
 */

import type {
  CreateWorkflowTemplateRequest,
  UpdateWorkflowTemplateRequest,
  WorkflowTemplate,
} from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { createWorkflowTemplateSchema, updateWorkflowTemplateSchema } from '@openflow/validation';
import { invoke } from './utils.js';

/**
 * Logger for workflow query operations.
 * Logs at DEBUG level for query calls, INFO for successes, ERROR for failures.
 */
const logger = createLogger('queries:workflows');

/**
 * Workflow queries for communicating with the Rust backend.
 * Provides functions for managing workflow templates, including listing,
 * creating, updating, deleting, and parsing workflows.
 */
export const workflowQueries = {
  /**
   * List all workflow templates for a project.
   * Returns both built-in templates and project-specific templates.
   *
   * @param projectId - Project ID to list templates for
   * @returns Array of workflow templates
   * @throws Error if the list operation fails (re-thrown for React Query)
   *
   * @example
   * ```ts
   * const templates = await workflowQueries.list('project-123');
   * console.log(`Found ${templates.length} templates`);
   * ```
   */
  list: async (projectId: string): Promise<WorkflowTemplate[]> => {
    logger.debug('Listing workflow templates', { projectId });

    try {
      const templates = await invoke<WorkflowTemplate[]>('list_workflow_templates', { projectId });

      logger.info('Workflow templates listed successfully', {
        projectId,
        count: templates.length,
        names: templates.map((t) => t.name),
      });

      return templates;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list workflow templates', {
        projectId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Get a specific workflow template by ID.
   *
   * @param id - Template ID
   * @returns The workflow template
   * @throws Error if the template is not found or fetch fails (re-thrown for React Query)
   *
   * @example
   * ```ts
   * const template = await workflowQueries.get('template-456');
   * console.log(`Template: ${template.name} with ${template.steps?.length ?? 0} steps`);
   * ```
   */
  get: async (id: string): Promise<WorkflowTemplate> => {
    logger.debug('Getting workflow template', { id });

    try {
      const template = await invoke<WorkflowTemplate>('get_workflow_template', { id });

      logger.info('Workflow template retrieved successfully', {
        id,
        name: template.name,
        stepCount: template.steps?.length ?? 0,
        isBuiltin: template.isBuiltin,
      });

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get workflow template', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Get all built-in workflow templates.
   * These are templates bundled with the application.
   *
   * @returns Array of built-in workflow templates
   * @throws Error if the fetch fails (re-thrown for React Query)
   *
   * @example
   * ```ts
   * const builtinTemplates = await workflowQueries.getBuiltin();
   * console.log(`Found ${builtinTemplates.length} built-in templates`);
   * ```
   */
  getBuiltin: async (): Promise<WorkflowTemplate[]> => {
    logger.debug('Getting built-in workflow templates');

    try {
      const templates = await invoke<WorkflowTemplate[]>('get_builtin_workflow_templates');

      logger.info('Built-in workflow templates retrieved successfully', {
        count: templates.length,
        names: templates.map((t) => t.name),
      });

      return templates;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get built-in workflow templates', {
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Create a new custom workflow template.
   * Input is validated against createWorkflowTemplateSchema before invoking.
   *
   * @param request - Template creation request
   * @returns The created workflow template
   * @throws Error if validation or creation fails (re-thrown for React Query)
   *
   * @example
   * ```ts
   * const template = await workflowQueries.create({
   *   name: 'My Custom Workflow',
   *   projectId: 'project-123',
   *   content: '### [ ] Step: Step 1\nDo something...',
   * });
   * console.log(`Created template: ${template.id}`);
   * ```
   */
  create: async (request: CreateWorkflowTemplateRequest): Promise<WorkflowTemplate> => {
    logger.debug('Creating workflow template', {
      name: request.name,
      contentLength: request.content?.length ?? 0,
    });

    try {
      const validated = createWorkflowTemplateSchema.parse(request);
      const template = await invoke<WorkflowTemplate>('create_workflow_template', {
        request: validated,
      });

      logger.info('Workflow template created successfully', {
        id: template.id,
        name: template.name,
        stepCount: template.steps?.length ?? 0,
      });

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create workflow template', {
        name: request.name,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Update an existing workflow template.
   * Input is validated against updateWorkflowTemplateSchema before invoking.
   *
   * @param id - Template ID to update
   * @param request - Update request with fields to modify
   * @returns The updated workflow template
   * @throws Error if validation or update fails (re-thrown for React Query)
   *
   * @example
   * ```ts
   * const updated = await workflowQueries.update('template-456', {
   *   name: 'Updated Name',
   *   content: '### [ ] Step: Updated Step\nNew content...',
   * });
   * console.log(`Updated template: ${updated.name}`);
   * ```
   */
  update: async (id: string, request: UpdateWorkflowTemplateRequest): Promise<WorkflowTemplate> => {
    logger.debug('Updating workflow template', {
      id,
      hasName: !!request.name,
      hasContent: !!request.content,
      contentLength: request.content?.length ?? 0,
    });

    try {
      const validated = updateWorkflowTemplateSchema.parse(request);
      const template = await invoke<WorkflowTemplate>('update_workflow_template', {
        id,
        request: validated,
      });

      logger.info('Workflow template updated successfully', {
        id,
        name: template.name,
        stepCount: template.steps?.length ?? 0,
      });

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update workflow template', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Delete a custom workflow template.
   * Built-in templates cannot be deleted.
   *
   * @param id - Template ID to delete
   * @throws Error if deletion fails (re-thrown for React Query)
   *
   * @example
   * ```ts
   * await workflowQueries.delete('template-456');
   * console.log('Template deleted');
   * ```
   */
  delete: async (id: string): Promise<void> => {
    logger.debug('Deleting workflow template', { id });

    try {
      await invoke<void>('delete_workflow_template', { id });

      logger.info('Workflow template deleted successfully', { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete workflow template', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Parse workflow content into steps.
   * This is done on the backend to ensure consistent parsing.
   *
   * @param content - Markdown content to parse
   * @returns Parsed workflow template with steps
   * @throws Error if parsing fails (re-thrown for React Query)
   *
   * @example
   * ```ts
   * const parsed = await workflowQueries.parse(`
   * ### [ ] Step: First Step
   * Do the first thing...
   *
   * ### [ ] Step: Second Step
   * Do the second thing...
   * `);
   * console.log(`Parsed ${parsed.steps?.length ?? 0} steps`);
   * ```
   */
  parse: async (content: string): Promise<WorkflowTemplate> => {
    logger.debug('Parsing workflow content', {
      contentLength: content.length,
    });

    try {
      const template = await invoke<WorkflowTemplate>('parse_workflow_content', { content });

      logger.info('Workflow content parsed successfully', {
        stepCount: template.steps?.length ?? 0,
        stepNames: template.steps?.map((s) => s.name) ?? [],
      });

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to parse workflow content', {
        contentLength: content.length,
        error: errorMessage,
      });
      throw error;
    }
  },
};
