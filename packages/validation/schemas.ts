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
]);
export type RunReasonInput = z.infer<typeof runReasonSchema>;

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
