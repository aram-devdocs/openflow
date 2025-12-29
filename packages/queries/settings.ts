import { invoke } from '@tauri-apps/api/core';

/**
 * Settings query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 */
export const settingsQueries = {
  /**
   * Get a setting value by key.
   */
  get: (key: string): Promise<string | null> =>
    invoke('get_setting', { key }),

  /**
   * Set a setting value.
   */
  set: (key: string, value: string): Promise<void> =>
    invoke('set_setting', { key, value }),

  /**
   * Get all settings as a key-value map.
   */
  getAll: (): Promise<Record<string, string>> => invoke('get_all_settings'),
};
