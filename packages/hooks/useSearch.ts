import type { SearchResult, SearchResultType } from '@openflow/generated';
import { searchQueries } from '@openflow/queries';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';

/**
 * Query key factory for search.
 * Provides structured keys for cache management.
 */
export const searchKeys = {
  all: ['search'] as const,
  searches: () => [...searchKeys.all, 'results'] as const,
  search: (query: string, projectId?: string, resultTypes?: SearchResultType[]) =>
    [...searchKeys.searches(), { query, projectId, resultTypes }] as const,
};

/**
 * Search hook options.
 */
export interface UseSearchOptions {
  /** Optional project ID to scope search results */
  projectId?: string;
  /** Optional array of result types to filter by */
  resultTypes?: SearchResultType[];
  /** Optional maximum number of results (default: 20) */
  limit?: number;
  /** Minimum query length before search executes (default: 1) */
  minQueryLength?: number;
  /** Stale time in milliseconds (default: 1000) */
  staleTime?: number;
}

/**
 * Search across tasks, projects, chats, and messages using full-text search.
 *
 * @param query - The search query string
 * @param options - Optional search configuration
 * @returns Query result with search results sorted by relevance
 *
 * @example
 * ```tsx
 * const { data: results, isLoading } = useSearch(query);
 *
 * // With project scoping
 * const { data: results } = useSearch(query, { projectId: 'proj-123' });
 *
 * // With type filtering
 * const { data: results } = useSearch(query, {
 *   resultTypes: [SearchResultType.Task, SearchResultType.Chat],
 * });
 * ```
 */
export function useSearch(
  query: string,
  options: UseSearchOptions = {}
): UseQueryResult<SearchResult[]> {
  const { projectId, resultTypes, limit, minQueryLength = 1, staleTime = 1000 } = options;

  return useQuery({
    queryKey: searchKeys.search(query, projectId, resultTypes),
    queryFn: () => searchQueries.search(query, projectId, resultTypes, limit),
    enabled: query.length >= minQueryLength,
    staleTime,
  });
}
