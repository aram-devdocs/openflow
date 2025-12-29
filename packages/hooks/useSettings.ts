import { settingsQueries } from '@openflow/queries';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

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

/**
 * Fetch a single setting value by key.
 *
 * @param key - Setting key to fetch
 * @returns Query result with setting value or null
 */
export function useSetting(key: string): UseQueryResult<string | null> {
  return useQuery({
    queryKey: settingsKeys.detail(key),
    queryFn: () => settingsQueries.get(key),
    enabled: Boolean(key),
  });
}

/**
 * Fetch all settings as a key-value map.
 *
 * @returns Query result with all settings
 */
export function useAllSettings(): UseQueryResult<Record<string, string>> {
  return useQuery({
    queryKey: settingsKeys.list(),
    queryFn: () => settingsQueries.getAll(),
  });
}

/**
 * Set a setting value.
 *
 * @returns Mutation for setting a value
 */
export function useSetSetting(): UseMutationResult<void, Error, { key: string; value: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }) => settingsQueries.set(key, value),
    onSuccess: (_data, { key }) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.detail(key) });
      queryClient.invalidateQueries({ queryKey: settingsKeys.lists() });
    },
  });
}
