/**
 * @openflow/validation
 *
 * Zod schemas for form validation derived from generated types.
 * Used for validating user input before sending to Tauri commands.
 *
 * Exports:
 * - Manual schemas (shorter names like createProjectSchema)
 * - Generated schemas (full names like createProjectRequestSchema)
 */

// Re-export all generated schemas (with full names like createProjectRequestSchema)
export * from './schemas-generated.js';

// Re-export manual schemas (with preferred shorter names for backward compatibility)
export {
  // Enum schemas
  taskStatusSchema,
  chatRoleSchema,
  messageRoleSchema,
  processStatusSchema,
  runReasonSchema,
  outputTypeSchema,
  searchResultTypeSchema,
  workflowStepStatusSchema,
  // Project schemas
  createProjectSchema,
  updateProjectSchema,
  // Task schemas
  createTaskSchema,
  updateTaskSchema,
  // Chat schemas
  createChatSchema,
  createStandaloneChatSchema,
  updateChatSchema,
  // Message schemas
  createMessageSchema,
  // Executor profile schemas
  createExecutorProfileSchema,
  updateExecutorProfileSchema,
  // Search schemas
  searchQuerySchema,
  // Settings schemas
  setSettingSchema,
  // Workflow template schemas
  createWorkflowTemplateSchema,
  updateWorkflowTemplateSchema,
  // Output schemas (API response types)
  workflowStepSchema,
  workflowTemplateSchema,
  commitSchema,
  diffHunkSchema,
  fileDiffSchema,
  pullRequestResultSchema,
  // Inferred types - Input types
  type TaskStatusInput,
  type ChatRoleInput,
  type MessageRoleInput,
  type ProcessStatusInput,
  type RunReasonInput,
  type OutputTypeInput,
  type SearchResultTypeInput,
  type WorkflowStepStatusInput,
  type CreateProjectInput,
  type UpdateProjectInput,
  type CreateTaskInput,
  type UpdateTaskInput,
  type CreateChatInput,
  type CreateStandaloneChatInput,
  type UpdateChatInput,
  type CreateMessageInput,
  type CreateExecutorProfileInput,
  type UpdateExecutorProfileInput,
  type SearchQueryInput,
  type SetSettingInput,
  type CreateWorkflowTemplateInput,
  type UpdateWorkflowTemplateInput,
  // Inferred types - Output types
  type WorkflowStepOutput,
  type WorkflowTemplateOutput,
  type CommitOutput,
  type DiffHunkOutput,
  type FileDiffOutput,
  type PullRequestResultOutput,
} from './schemas';
