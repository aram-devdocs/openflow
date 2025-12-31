import { setSettingSchema } from '@openflow/validation';
import { invoke } from './utils.js';

/**
 * Settings query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 * Input validation is performed using Zod schemas before invoking Tauri commands.
 */
export const settingsQueries = {
  /**
   * Get a setting value by key.
   */
  get: (key: string): Promise<string | null> => invoke('get_setting', { key }),

  /**
   * Set a setting value.
   * Input is validated against setSettingSchema before invoking.
   */
  set: (key: string, value: string): Promise<void> => {
    const validated = setSettingSchema.parse({ key, value });
    return invoke('set_setting', validated);
  },

  /**
   * Get all settings as a key-value map.
   */
  getAll: (): Promise<Record<string, string>> => invoke('get_all_settings'),
};
