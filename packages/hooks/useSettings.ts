/**
 * useSettings - Hooks for managing application settings
 *
 * This module provides React Query hooks for reading and writing
 * application settings with full logging and error handling.
 *
 * Features:
 * - Full logging at DEBUG/INFO/ERROR levels
 * - Toast notifications for user feedback on mutations
 * - Proper error handling with try/catch patterns
 * - Structured query keys for cache management
 *
 * @example
 * ```tsx
 * // Get a single setting
 * const { data: theme } = useSetting('theme');
 *
 * // Get all settings
 * const { data: settings } = useAllSettings();
 *
 * // Set a setting value
 * const setSetting = useSetSetting();
 * await setSetting.mutateAsync({ key: 'theme', value: 'dark' });
 * ```
 */

import { settingsQueries } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useToast } from './useToast';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useSettings');

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query key factory for settings.
 * Provides structured, hierarchical keys for cache management.
 */
export const settingsKeys = {
  all: ['settings'] as const,
  lists: () => [...settingsKeys.all, 'list'] as const,
  list: () => [...settingsKeys.lists()] as const,
  details: () => [...settingsKeys.all, 'detail'] as const,
  detail: (key: string) => [...settingsKeys.details(), key] as const,
};

// ============================================================================
// Hook Options
// ============================================================================

/**
 * Options for useSetting hook.
 */
export interface UseSettingOptions {
  /** Whether the query is enabled (default: true when key is provided) */
  enabled?: boolean;
  /** Stale time in milliseconds (default: Infinity - settings rarely change externally) */
  staleTime?: number;
}

/**
 * Options for useAllSettings hook.
 */
export interface UseAllSettingsOptions {
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
  /** Stale time in milliseconds (default: Infinity) */
  staleTime?: number;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch a single setting value by key.
 *
 * @param key - Setting key to fetch
 * @param options - Optional query configuration
 * @returns Query result with setting value or null
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data: theme, isLoading } = useSetting('theme');
 *
 * // With options
 * const { data: theme } = useSetting('theme', { staleTime: 60000 });
 *
 * // Conditional fetch
 * const { data } = useSetting(settingKey, { enabled: Boolean(settingKey) });
 * ```
 */
export function useSetting(
  key: string,
  options: UseSettingOptions = {}
): UseQueryResult<string | null> {
  const { enabled = Boolean(key), staleTime = Number.POSITIVE_INFINITY } = options;

  logger.debug('useSetting hook called', { key, enabled });

  return useQuery({
    queryKey: settingsKeys.detail(key),
    queryFn: async () => {
      logger.debug('Fetching setting value', { key });

      try {
        const value = await settingsQueries.get(key);

        logger.info('Setting fetched successfully', {
          key,
          hasValue: value !== null,
          // Don't log actual value for security (could contain sensitive data)
          valueLength: value?.length,
        });

        return value;
      } catch (error) {
        logger.error('Failed to fetch setting', {
          key,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    enabled,
    staleTime,
  });
}

/**
 * Fetch all settings as a key-value map.
 *
 * @param options - Optional query configuration
 * @returns Query result with all settings
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data: settings, isLoading } = useAllSettings();
 *
 * // Access specific setting
 * const theme = settings?.theme;
 *
 * // With options
 * const { data: settings } = useAllSettings({ staleTime: 60000 });
 * ```
 */
export function useAllSettings(
  options: UseAllSettingsOptions = {}
): UseQueryResult<Record<string, string>> {
  const { enabled = true, staleTime = Number.POSITIVE_INFINITY } = options;

  logger.debug('useAllSettings hook called', { enabled });

  return useQuery({
    queryKey: settingsKeys.list(),
    queryFn: async () => {
      logger.debug('Fetching all settings');

      try {
        const settings = await settingsQueries.getAll();

        logger.info('All settings fetched successfully', {
          count: Object.keys(settings).length,
          keys: Object.keys(settings),
        });

        return settings;
      } catch (error) {
        logger.error('Failed to fetch all settings', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    enabled,
    staleTime,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Set a setting value.
 *
 * Provides toast notifications for success and error states.
 *
 * @returns Mutation for setting a value
 *
 * @example
 * ```tsx
 * const setSetting = useSetSetting();
 *
 * // Set a theme
 * await setSetting.mutateAsync({ key: 'theme', value: 'dark' });
 *
 * // With loading state
 * <button
 *   onClick={() => setSetting.mutate({ key: 'autoSave', value: 'true' })}
 *   disabled={setSetting.isPending}
 * >
 *   {setSetting.isPending ? 'Saving...' : 'Save Setting'}
 * </button>
 * ```
 */
export function useSetSetting(): UseMutationResult<void, Error, { key: string; value: string }> {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ key, value }) => {
      logger.debug('Setting value mutation triggered', {
        key,
        // Don't log actual value for security
        valueLength: value.length,
      });

      try {
        await settingsQueries.set(key, value);

        logger.info('Setting updated successfully', {
          key,
          valueLength: value.length,
        });
      } catch (error) {
        logger.error('Failed to update setting', {
          key,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (_data, { key }) => {
      // Invalidate both the specific setting and the list
      queryClient.invalidateQueries({ queryKey: settingsKeys.detail(key) });
      queryClient.invalidateQueries({ queryKey: settingsKeys.lists() });

      toast.success('Setting saved successfully');
    },
    onError: (error, { key }) => {
      toast.error(`Failed to save setting: ${error.message}`);

      logger.error('Setting mutation failed (onError handler)', {
        key,
        error: error.message,
      });
    },
  });
}
