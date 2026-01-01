import { createLogger } from '@openflow/utils';
import { setSettingSchema } from '@openflow/validation';
import { invoke } from './utils.js';

/**
 * Logger for settings query operations.
 * Logs at DEBUG level for query calls, INFO for successes, ERROR for failures.
 *
 * Note: Setting values are intentionally not logged to protect potentially
 * sensitive configuration data. Only key names and value lengths are logged.
 */
const logger = createLogger('queries:settings');

/**
 * Settings query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 *
 * All functions include:
 * - Try/catch error handling with re-throw for React Query
 * - Logging at appropriate levels (DEBUG on call, INFO on success, ERROR on failure)
 * - Security-conscious logging (values not logged, only key names and value lengths)
 *
 * Input validation is performed using Zod schemas before invoking Tauri commands.
 *
 * @example
 * ```ts
 * // Get a single setting
 * const theme = await settingsQueries.get('theme');
 *
 * // Set a setting value
 * await settingsQueries.set('theme', 'dark');
 *
 * // Get all settings
 * const allSettings = await settingsQueries.getAll();
 * ```
 */
export const settingsQueries = {
  /**
   * Get a setting value by key.
   * @param key - The setting key to retrieve
   * @returns Promise resolving to the setting value, or null if not found
   * @throws Error if the query fails (re-thrown for React Query)
   */
  get: async (key: string): Promise<string | null> => {
    logger.debug('Getting setting', { key });

    try {
      const value = await invoke<string | null>('get_setting', { key });

      logger.info('Setting retrieved successfully', {
        key,
        hasValue: value !== null,
        valueLength: value?.length ?? 0,
      });

      return value;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get setting', {
        key,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Set a setting value.
   * Input is validated against setSettingSchema before invoking.
   * @param key - The setting key to set
   * @param value - The value to set
   * @returns Promise resolving when the setting is saved
   * @throws Error if validation fails or the mutation fails (re-thrown for React Query)
   */
  set: async (key: string, value: string): Promise<void> => {
    logger.debug('Setting value', {
      key,
      valueLength: value.length,
    });

    try {
      const validated = setSettingSchema.parse({ key, value });
      await invoke('set_setting', validated);

      logger.info('Setting saved successfully', {
        key,
        valueLength: value.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to set setting', {
        key,
        valueLength: value.length,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Get all settings as a key-value map.
   * @returns Promise resolving to a record of all settings
   * @throws Error if the query fails (re-thrown for React Query)
   */
  getAll: async (): Promise<Record<string, string>> => {
    logger.debug('Getting all settings');

    try {
      const settings = await invoke<Record<string, string>>('get_all_settings');

      const keys = Object.keys(settings);
      logger.info('All settings retrieved successfully', {
        count: keys.length,
        keys: keys.slice(0, 10),
        hasMore: keys.length > 10,
      });

      return settings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get all settings', {
        error: errorMessage,
      });
      throw error;
    }
  },
};
