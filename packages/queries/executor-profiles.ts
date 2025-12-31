import type {
  CreateExecutorProfileRequest,
  ExecutionProcess,
  ExecutorProfile,
  UpdateExecutorProfileRequest,
} from '@openflow/generated';
import { createExecutorProfileSchema, updateExecutorProfileSchema } from '@openflow/validation';
import { invoke } from './utils.js';

/**
 * Executor profile query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 * Input validation is performed using Zod schemas before invoking Tauri commands.
 */
export const executorProfileQueries = {
  /**
   * List all executor profiles.
   */
  list: (): Promise<ExecutorProfile[]> => invoke('list_executor_profiles'),

  /**
   * Create a new executor profile.
   * Input is validated against createExecutorProfileSchema before invoking.
   */
  create: (request: CreateExecutorProfileRequest): Promise<ExecutorProfile> => {
    const validated = createExecutorProfileSchema.parse(request);
    return invoke('create_executor_profile', { request: validated });
  },

  /**
   * Update an existing executor profile.
   * Input is validated against updateExecutorProfileSchema before invoking.
   */
  update: (id: string, request: UpdateExecutorProfileRequest): Promise<ExecutorProfile> => {
    const validated = updateExecutorProfileSchema.parse(request);
    return invoke('update_executor_profile', { id, request: validated });
  },

  /**
   * Delete an executor profile by ID.
   */
  delete: (id: string): Promise<void> => invoke('delete_executor_profile', { id }),

  /**
   * Run an executor (start a process) for a chat with a given prompt.
   *
   * @param chatId - The chat session to associate the execution with
   * @param prompt - The prompt/instructions to send to the AI agent
   * @param executorProfileId - Optional profile ID; uses default if not specified
   */
  runExecutor: (
    chatId: string,
    prompt: string,
    executorProfileId?: string
  ): Promise<ExecutionProcess> => invoke('run_executor', { chatId, prompt, executorProfileId }),
};
