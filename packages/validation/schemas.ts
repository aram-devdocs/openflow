import { z } from 'zod';

// =============================================================================
// Enum Schemas
// =============================================================================

/**
 * Task status schema.
 * Supports both new status values (pending, running, paused, completed, failed, cancelled)
 * and legacy values (todo, inprogress, inreview, done) for backward compatibility.
 */
export const taskStatusSchema = z.enum([
  // New status values (from migration 011)
  'pending',
  'running',
  'paused',
  'completed',
  'failed',
  'cancelled',
  // Legacy values (for backward compatibility)
  'todo',
  'inprogress',
  'inreview',
  'done',
]);
export type TaskStatusInput = z.infer<typeof taskStatusSchema>;

/**
 * Step status schema for task steps.
 * Matches CHECK constraint in task_steps table (migration 012).
 */
export const stepStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'skipped']);
export type StepStatusInput = z.infer<typeof stepStatusSchema>;

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

/**
 * Schema for GitHub pull request result.
 * Contains the result of creating a pull request via the GitHub CLI.
 */
export const pullRequestResultSchema = z.object({
  /** URL of the created pull request */
  url: z.string().url(),
  /** Pull request number */
  number: z.number().int().positive(),
  /** Branch name used for the pull request */
  branch: z.string().min(1),
});
export type PullRequestResultOutput = z.infer<typeof pullRequestResultSchema>;

// =============================================================================
// Task Step Schemas (Agent Orchestration)
// =============================================================================

/**
 * Valid provider IDs for agent execution.
 * These must match the providers registered in the backend.
 */
export const providerIdSchema = z.enum(['claude-code', 'gemini-cli', 'codex-cli', 'mock']);
export type ProviderIdInput = z.infer<typeof providerIdSchema>;

/**
 * Schema for creating a task step.
 * Steps define the execution sequence for a task's agent workflow.
 *
 * @example
 * ```ts
 * const step = createStepSchema.parse({
 *   stepIndex: 0,
 *   title: 'Implement feature',
 *   prompt: 'Create a new React component for user profiles',
 *   providerId: 'claude-code',
 * });
 * ```
 */
export const createStepSchema = z.object({
  /** Order of execution (0-based) */
  stepIndex: z.number().int().min(0, 'Step index must be non-negative'),
  /** Human-readable step name */
  title: z.string().min(1, 'Step title is required').max(500),
  /** The prompt to send to the agent */
  prompt: z.string().min(1, 'Prompt is required'),
  /** Which agent provider to use */
  providerId: z.string().min(1, 'Provider ID is required').max(100),
});
export type CreateStepInput = z.infer<typeof createStepSchema>;

/**
 * Schema for updating a task step (if needed).
 * All fields are optional - only provided fields will be updated.
 */
export const updateStepSchema = z.object({
  /** Updated step title */
  title: z.string().min(1).max(500).optional(),
  /** Updated prompt */
  prompt: z.string().min(1).optional(),
  /** Updated provider ID */
  providerId: z.string().min(1).max(100).optional(),
  /** Updated status */
  status: stepStatusSchema.optional(),
});
export type UpdateStepInput = z.infer<typeof updateStepSchema>;

// =============================================================================
// Agent Session Schemas
// =============================================================================

/**
 * Schema for writing input to an agent session
 */
export const writeAgentInputRequestSchema = z.object({
  /** The input string to send to the agent's stdin */
  input: z.string(),
});
export type WriteAgentInputRequestInput = z.infer<typeof writeAgentInputRequestSchema>;

/**
 * Schema for resizing an agent session terminal
 */
export const resizeAgentSessionRequestSchema = z.object({
  /** Number of terminal columns */
  cols: z.number().int().positive(),
  /** Number of terminal rows */
  rows: z.number().int().positive(),
});
export type ResizeAgentSessionRequestInput = z.infer<typeof resizeAgentSessionRequestSchema>;

/**
 * Schema for responding to a permission prompt
 */
export const respondPermissionRequestSchema = z.object({
  /** The permission ID to respond to */
  permissionId: z.string().min(1),
  /** Whether to approve (true) or deny (false) the permission */
  approved: z.boolean(),
});
export type RespondPermissionRequestInput = z.infer<typeof respondPermissionRequestSchema>;

/**
 * Schema for session summary
 */
export const sessionSummarySchema = z.object({
  /** Session ID */
  id: z.string(),
  /** Process ID */
  processId: z.string(),
  /** Provider ID (e.g., "claude-code") */
  providerId: z.string(),
  /** Session status */
  status: z.string(),
  /** When the session started (ISO 8601) */
  startedAt: z.string(),
  /** When the session ended (ISO 8601), null if still running */
  endedAt: z.string().optional(),
  /** Number of events in this session */
  eventCount: z.number().int().nonnegative(),
  /** Number of tool invocations */
  toolCount: z.number().int().nonnegative(),
  /** Whether there's a pending permission request */
  hasPendingPermission: z.boolean(),
});
export type SessionSummaryInput = z.infer<typeof sessionSummarySchema>;

/**
 * Schema for entry metadata
 */
export const entryMetadataSchema = z.object({
  /** File path if the operation involves a specific file */
  filePath: z.string().optional(),
  /** Command being executed (for Bash/shell operations) */
  command: z.string().optional(),
  /** Exit code for completed operations */
  exitCode: z.number().int().optional(),
  /** Parent tool ID for nested operations */
  parentToolId: z.string().optional(),
});

/**
 * Schema for entry types (discriminated union)
 */
const entryTypeInitSchema = z.object({
  type: z.literal('init'),
  sessionId: z.string(),
  model: z.string(),
  tools: z.array(z.string()),
});

const entryTypeMessageSchema = z.object({
  type: z.literal('message'),
  role: z.enum(['user', 'assistant', 'system']),
});

const entryTypeToolUseSchema = z.object({
  type: z.literal('toolUse'),
  toolId: z.string(),
  toolName: z.string(),
  input: z.unknown(),
});

const entryTypeToolResultSchema = z.object({
  type: z.literal('toolResult'),
  toolId: z.string(),
  status: z.enum(['success', 'error', 'cancelled']),
  output: z.string(),
  durationMs: z.number().int().nonnegative().optional(),
});

const entryTypeErrorSchema = z.object({
  type: z.literal('error'),
  code: z.string(),
  recoverable: z.boolean(),
});

const entryTypeSystemSchema = z.object({
  type: z.literal('system'),
  subtype: z.string(),
});

const entryTypeCompleteSchema = z.object({
  type: z.literal('complete'),
  status: z.enum(['success', 'error', 'cancelled', 'interrupted']),
  stats: z
    .object({
      inputTokens: z.number().int().nonnegative().optional(),
      outputTokens: z.number().int().nonnegative().optional(),
      cacheReadTokens: z.number().int().nonnegative().optional(),
      cacheWriteTokens: z.number().int().nonnegative().optional(),
      durationMs: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

const entryTypeSchema = z.discriminatedUnion('type', [
  entryTypeInitSchema,
  entryTypeMessageSchema,
  entryTypeToolUseSchema,
  entryTypeToolResultSchema,
  entryTypeErrorSchema,
  entryTypeSystemSchema,
  entryTypeCompleteSchema,
]);

/**
 * Schema for normalized entry
 */
export const normalizedEntrySchema = z.object({
  /** Unique identifier (UUID v4) */
  id: z.string(),
  /** Session ID this entry belongs to */
  sessionId: z.string(),
  /** Monotonic sequence number within the session */
  sequence: z.number().int().nonnegative(),
  /** Type of entry with associated data */
  entryType: entryTypeSchema,
  /** Human-readable content for display */
  content: z.string(),
  /** When this entry was created (ISO 8601) */
  timestamp: z.string(),
  /** Optional metadata for additional context */
  metadata: entryMetadataSchema.optional(),
});
export type NormalizedEntryInput = z.infer<typeof normalizedEntrySchema>;
