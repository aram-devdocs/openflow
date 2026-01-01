/**
 * @fileoverview Executor profile query wrappers for Tauri IPC.
 *
 * Provides type-safe wrappers around Tauri invoke() calls for executor profile
 * CRUD operations and executor process management. All functions include:
 * - Input validation via Zod schemas (where applicable)
 * - Structured logging at DEBUG (call), INFO (success), ERROR (failure) levels
 * - Try/catch error handling with re-throw for React Query integration
 *
 * @example
 * ```typescript
 * import { executorProfileQueries } from '@openflow/queries';
 *
 * // List all profiles
 * const profiles = await executorProfileQueries.list();
 *
 * // Create a new profile
 * const newProfile = await executorProfileQueries.create({
 *   name: 'Claude Code',
 *   command: 'claude',
 *   isDefault: true,
 * });
 *
 * // Run executor for a chat
 * const process = await executorProfileQueries.runExecutor(
 *   chatId,
 *   'Help me refactor this code',
 *   profileId
 * );
 * ```
 */

import type {
  CreateExecutorProfileRequest,
  ExecutionProcess,
  ExecutorProfile,
  UpdateExecutorProfileRequest,
} from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { createExecutorProfileSchema, updateExecutorProfileSchema } from '@openflow/validation';
import { invoke } from './utils.js';

const logger = createLogger('queries:executor-profiles');

/**
 * Executor profile query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 * Input validation is performed using Zod schemas before invoking Tauri commands.
 */
export const executorProfileQueries = {
  /**
   * List all executor profiles.
   *
   * @returns Promise resolving to array of executor profiles
   * @throws Error if Tauri invoke fails
   *
   * @example
   * ```typescript
   * const profiles = await executorProfileQueries.list();
   * console.log(`Found ${profiles.length} profiles`);
   * ```
   */
  list: async (): Promise<ExecutorProfile[]> => {
    logger.debug('Listing executor profiles');

    try {
      const profiles = await invoke<ExecutorProfile[]>('list_executor_profiles');
      const defaultProfile = profiles.find((p) => p.isDefault);

      logger.info('Executor profiles listed', {
        count: profiles.length,
        names: profiles.map((p) => p.name),
        defaultProfile: defaultProfile?.name ?? 'none',
      });

      return profiles;
    } catch (error) {
      logger.error('Failed to list executor profiles', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  /**
   * Create a new executor profile.
   * Input is validated against createExecutorProfileSchema before invoking.
   *
   * @param request - Profile creation request with name, command, etc.
   * @returns Promise resolving to the created profile
   * @throws Error if validation fails or Tauri invoke fails
   *
   * @example
   * ```typescript
   * const profile = await executorProfileQueries.create({
   *   name: 'Claude Code',
   *   command: 'claude',
   *   args: ['--dangerously-skip-permissions'],
   *   isDefault: true,
   * });
   * ```
   */
  create: async (request: CreateExecutorProfileRequest): Promise<ExecutorProfile> => {
    logger.debug('Creating executor profile', {
      name: request.name,
      command: request.command,
      isDefault: request.isDefault,
    });

    try {
      const validated = createExecutorProfileSchema.parse(request);
      const profile = await invoke<ExecutorProfile>('create_executor_profile', {
        request: validated,
      });

      logger.info('Executor profile created', {
        profileId: profile.id,
        name: profile.name,
        command: profile.command,
        isDefault: profile.isDefault,
      });

      return profile;
    } catch (error) {
      logger.error('Failed to create executor profile', {
        name: request.name,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  /**
   * Update an existing executor profile.
   * Input is validated against updateExecutorProfileSchema before invoking.
   *
   * @param id - Profile ID to update
   * @param request - Partial update request with fields to change
   * @returns Promise resolving to the updated profile
   * @throws Error if validation fails or Tauri invoke fails
   *
   * @example
   * ```typescript
   * const updated = await executorProfileQueries.update(profileId, {
   *   name: 'Claude Code Pro',
   *   isDefault: true,
   * });
   * ```
   */
  update: async (id: string, request: UpdateExecutorProfileRequest): Promise<ExecutorProfile> => {
    logger.debug('Updating executor profile', {
      profileId: id,
      updates: Object.keys(request),
    });

    try {
      const validated = updateExecutorProfileSchema.parse(request);
      const profile = await invoke<ExecutorProfile>('update_executor_profile', {
        id,
        request: validated,
      });

      logger.info('Executor profile updated', {
        profileId: profile.id,
        name: profile.name,
        isDefault: profile.isDefault,
      });

      return profile;
    } catch (error) {
      logger.error('Failed to update executor profile', {
        profileId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  /**
   * Delete an executor profile by ID.
   *
   * @param id - Profile ID to delete
   * @returns Promise resolving when deletion is complete
   * @throws Error if Tauri invoke fails
   *
   * @example
   * ```typescript
   * await executorProfileQueries.delete(profileId);
   * ```
   */
  delete: async (id: string): Promise<void> => {
    logger.debug('Deleting executor profile', { profileId: id });

    try {
      await invoke<void>('delete_executor_profile', { id });

      logger.info('Executor profile deleted', { profileId: id });
    } catch (error) {
      logger.error('Failed to delete executor profile', {
        profileId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  /**
   * Run an executor (start a process) for a chat with a given prompt.
   *
   * @param chatId - The chat session to associate the execution with
   * @param prompt - The prompt/instructions to send to the AI agent
   * @param executorProfileId - Optional profile ID; uses default if not specified
   * @returns Promise resolving to the execution process details
   * @throws Error if Tauri invoke fails
   *
   * @example
   * ```typescript
   * const process = await executorProfileQueries.runExecutor(
   *   chatId,
   *   'Refactor the useAuth hook to use React Query',
   *   profileId
   * );
   * console.log(`Started process ${process.id} with PID ${process.pid}`);
   * ```
   */
  runExecutor: async (
    chatId: string,
    prompt: string,
    executorProfileId?: string
  ): Promise<ExecutionProcess> => {
    logger.debug('Running executor', {
      chatId,
      promptLength: prompt.length,
      executorProfileId: executorProfileId ?? 'default',
    });

    try {
      const process = await invoke<ExecutionProcess>('run_executor', {
        chatId,
        prompt,
        executorProfileId,
      });

      logger.info('Executor started', {
        processId: process.id,
        chatId,
        pid: process.pid,
        status: process.status,
        executorProfileId: executorProfileId ?? 'default',
      });

      return process;
    } catch (error) {
      logger.error('Failed to run executor', {
        chatId,
        executorProfileId: executorProfileId ?? 'default',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
};
