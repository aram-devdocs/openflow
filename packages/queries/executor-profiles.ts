import type {
  CreateExecutorProfileRequest,
  ExecutionProcess,
  ExecutorProfile,
  UpdateExecutorProfileRequest,
} from '@openflow/generated';
import { invoke } from './utils.js';

/**
 * Executor profile query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 */
export const executorProfileQueries = {
  /**
   * List all executor profiles.
   */
  list: (): Promise<ExecutorProfile[]> => invoke('list_executor_profiles'),

  /**
   * Create a new executor profile.
   */
  create: (request: CreateExecutorProfileRequest): Promise<ExecutorProfile> =>
    invoke('create_executor_profile', { request }),

  /**
   * Update an existing executor profile.
   */
  update: (id: string, request: UpdateExecutorProfileRequest): Promise<ExecutorProfile> =>
    invoke('update_executor_profile', { id, request }),

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
