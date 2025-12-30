import { z } from 'zod';

// =============================================================================
// Enum Schemas
// =============================================================================

export const taskStatusSchema = z.enum(['todo', 'inprogress', 'inreview', 'done', 'cancelled']);
export type TaskStatusInput = z.infer<typeof taskStatusSchema>;

export const chatRoleSchema = z.enum(['main', 'review', 'test', 'terminal']);
export type ChatRoleInput = z.infer<typeof chatRoleSchema>;

export const messageRoleSchema = z.enum(['user', 'assistant', 'system']);
export type MessageRoleInput = z.infer<typeof messageRoleSchema>;

export const processStatusSchema = z.enum(['running', 'completed', 'failed', 'killed']);
export type ProcessStatusInput = z.infer<typeof processStatusSchema>;

export const runReasonSchema = z.enum([
  'setupscript',
  'cleanupscript',
  'codingagent',
  'devserver',
  'terminal',
  'verification',
]);
export type RunReasonInput = z.infer<typeof runReasonSchema>;

export const workflowStepStatusSchema = z.enum(['pending', 'inprogress', 'completed', 'skipped']);
export type WorkflowStepStatusInput = z.infer<typeof workflowStepStatusSchema>;

export const outputTypeSchema = z.enum(['stdout', 'stderr']);
export type OutputTypeInput = z.infer<typeof outputTypeSchema>;

export const searchResultTypeSchema = z.enum(['task', 'project', 'chat', 'message']);
export type SearchResultTypeInput = z.infer<typeof searchResultTypeSchema>;

// =============================================================================
// Project Schemas
// =============================================================================

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  gitRepoPath: z.string().min(1, 'Git repository path is required'),
  setupScript: z.string().optional(),
  devScript: z.string().optional(),
  cleanupScript: z.string().nullish(),
  copyFiles: z.string().nullish(),
  icon: z.string().optional().default('folder'),
  ruleFolders: z.string().nullish(),
  alwaysIncludedRules: z.string().nullish(),
  workflowsFolder: z.string().optional().default('.openflow/workflows'),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  gitRepoPath: z.string().min(1).optional(),
  setupScript: z.string().optional(),
  devScript: z.string().optional(),
  cleanupScript: z.string().nullish(),
  copyFiles: z.string().nullish(),
  icon: z.string().optional(),
  ruleFolders: z.string().nullish(),
  alwaysIncludedRules: z.string().nullish(),
  workflowsFolder: z.string().optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// =============================================================================
// Task Schemas
// =============================================================================

export const createTaskSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z.string().min(1, 'Task title is required').max(500),
  description: z.string().nullish(),
  status: taskStatusSchema.optional().default('todo'),
  autoStartNextStep: z.boolean().optional().default(false),
  defaultExecutorProfileId: z.string().uuid().nullish(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().nullish(),
  status: taskStatusSchema.optional(),
  actionsRequiredCount: z.number().int().min(0).optional(),
  autoStartNextStep: z.boolean().optional(),
  defaultExecutorProfileId: z.string().uuid().nullish(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// =============================================================================
// Chat Schemas
// =============================================================================

export const createChatSchema = z.object({
  taskId: z.string().uuid('Invalid task ID').optional(),
  projectId: z.string().uuid('Invalid project ID'),
  title: z.string().max(500).optional(),
  executor: z.string().nullish(),
  baseBranch: z.string().optional().default('main'),
  initialPrompt: z.string().nullish(),
  hiddenPrompt: z.string().nullish(),
  isPlanContainer: z.boolean().optional().default(false),
  executorProfileId: z.string().uuid().nullish(),
  mainChatId: z.string().uuid().nullish(),
  chatRole: chatRoleSchema.optional().default('main'),
});
export type CreateChatInput = z.infer<typeof createChatSchema>;

/**
 * Schema specifically for creating standalone chats (no task association).
 */
export const createStandaloneChatSchema = createChatSchema.omit({ taskId: true });
export type CreateStandaloneChatInput = z.infer<typeof createStandaloneChatSchema>;

/**
 * Schema for updating an existing chat.
 * All fields are optional - only provided fields will be updated.
 */
export const updateChatSchema = z.object({
  title: z.string().max(500).optional(),
  executorProfileId: z.string().uuid().nullish(),
  branch: z.string().optional(),
  worktreePath: z.string().optional(),
  worktreeDeleted: z.boolean().optional(),
  setupCompletedAt: z.string().datetime().optional(),
  initialPrompt: z.string().optional(),
  hiddenPrompt: z.string().optional(),
  claudeSessionId: z.string().optional(),
});
export type UpdateChatInput = z.infer<typeof updateChatSchema>;

// =============================================================================
// Message Schemas
// =============================================================================

export const createMessageSchema = z.object({
  chatId: z.string().uuid('Invalid chat ID'),
  role: messageRoleSchema,
  content: z.string().min(1, 'Message content is required'),
  toolCalls: z.string().nullish(),
});
export type CreateMessageInput = z.infer<typeof createMessageSchema>;

// =============================================================================
// Executor Profile Schemas
// =============================================================================

export const createExecutorProfileSchema = z.object({
  name: z.string().min(1, 'Profile name is required').max(255),
  command: z.string().min(1, 'Command is required'),
  args: z.string().optional().default(''),
  isDefault: z.boolean().optional().default(false),
});
export type CreateExecutorProfileInput = z.infer<typeof createExecutorProfileSchema>;

export const updateExecutorProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  command: z.string().min(1).optional(),
  args: z.string().optional(),
  isDefault: z.boolean().optional(),
});
export type UpdateExecutorProfileInput = z.infer<typeof updateExecutorProfileSchema>;

// =============================================================================
// Search Schemas
// =============================================================================

export const searchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  projectId: z.string().uuid().optional(),
  resultTypes: z.array(searchResultTypeSchema).optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
});
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

// =============================================================================
// Settings Schemas
// =============================================================================

export const setSettingSchema = z.object({
  key: z.string().min(1, 'Setting key is required'),
  value: z.string(),
});
export type SetSettingInput = z.infer<typeof setSettingSchema>;

// =============================================================================
// Workflow Template Schemas
// =============================================================================

/**
 * Schema for creating a new workflow template.
 * Templates define sequences of steps for task workflows.
 */
export const createWorkflowTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  description: z.string().optional(),
  content: z.string().min(1, 'Template content is required'),
});
export type CreateWorkflowTemplateInput = z.infer<typeof createWorkflowTemplateSchema>;

/**
 * Schema for updating an existing workflow template.
 * All fields are optional - only provided fields will be updated.
 */
export const updateWorkflowTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  content: z.string().min(1).optional(),
});
export type UpdateWorkflowTemplateInput = z.infer<typeof updateWorkflowTemplateSchema>;

// =============================================================================
// Output Schemas (API Response Types)
// =============================================================================

/**
 * Schema for a workflow step within a workflow template.
 * Steps are parsed from markdown workflow definition files.
 */
export const workflowStepSchema = z.object({
  /** Zero-based index of the step in the workflow */
  index: z.number().int().min(0),
  /** Name of the step (from markdown header) */
  name: z.string(),
  /** Description/instructions for the step (markdown content) */
  description: z.string(),
  /** Current status of the step */
  status: workflowStepStatusSchema,
  /** Associated chat ID if step has been started */
  chatId: z.string().uuid().optional(),
});
export type WorkflowStepOutput = z.infer<typeof workflowStepSchema>;

/**
 * Schema for a workflow template defining a sequence of steps.
 * Templates can be built-in or loaded from markdown files.
 */
export const workflowTemplateSchema = z.object({
  id: z.string(),
  /** Display name of the workflow */
  name: z.string(),
  /** Description of the workflow's purpose */
  description: z.string().optional(),
  /** Raw markdown content of the workflow definition */
  content: z.string(),
  /** Whether this is a built-in workflow template */
  isBuiltin: z.boolean(),
  /** Parsed steps from the workflow content */
  steps: z.array(workflowStepSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type WorkflowTemplateOutput = z.infer<typeof workflowTemplateSchema>;

/**
 * Schema for a git commit.
 * Contains commit metadata and change statistics.
 */
export const commitSchema = z.object({
  /** Full commit hash (40 characters) */
  hash: z.string().length(40),
  /** Short commit hash (7 characters) */
  shortHash: z.string().length(7),
  /** Commit message (first line) */
  message: z.string(),
  /** Author name */
  author: z.string(),
  /** Author email */
  authorEmail: z.string().email(),
  /** Commit date as ISO 8601 string */
  date: z.string().datetime(),
  /** Number of files changed in this commit */
  filesChanged: z.number().int().min(0),
  /** Total lines added across all files */
  additions: z.number().int().min(0),
  /** Total lines deleted across all files */
  deletions: z.number().int().min(0),
});
export type CommitOutput = z.infer<typeof commitSchema>;

/**
 * Schema for a hunk within a file diff.
 * A hunk is a contiguous section of changes in a file.
 */
export const diffHunkSchema = z.object({
  /** Starting line number in the old file */
  oldStart: z.number().int().min(0),
  /** Number of lines in the old file */
  oldLines: z.number().int().min(0),
  /** Starting line number in the new file */
  newStart: z.number().int().min(0),
  /** Number of lines in the new file */
  newLines: z.number().int().min(0),
  /** The actual diff content with +/- prefixes */
  content: z.string(),
});
export type DiffHunkOutput = z.infer<typeof diffHunkSchema>;

/**
 * Schema for a single file diff.
 * Contains metadata about the file change and the actual hunks of changes.
 */
export const fileDiffSchema = z.object({
  /** Current path of the file */
  path: z.string(),
  /** Previous path if file was renamed */
  oldPath: z.string().optional(),
  /** List of change hunks in this file */
  hunks: z.array(diffHunkSchema),
  /** Number of lines added */
  additions: z.number().int().min(0),
  /** Number of lines deleted */
  deletions: z.number().int().min(0),
  /** Whether this is a binary file (diffs not available) */
  isBinary: z.boolean(),
  /** Whether this is a newly created file */
  isNew: z.boolean(),
  /** Whether this file was deleted */
  isDeleted: z.boolean(),
  /** Whether this file was renamed */
  isRenamed: z.boolean(),
});
export type FileDiffOutput = z.infer<typeof fileDiffSchema>;
