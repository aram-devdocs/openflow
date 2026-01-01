/**
 * useSearch - Hook for full-text search across the application
 *
 * This module provides a React Query hook for searching tasks, projects,
 * chats, and messages with full-text search capabilities.
 *
 * Features:
 * - Full logging at DEBUG/INFO/ERROR levels
 * - Proper error handling with try/catch patterns
 * - Structured query keys for cache management
 * - Project scoping and result type filtering
 * - Configurable minimum query length and result limits
 */

import type { SearchResult, SearchResultType } from '@openflow/generated';
import { searchQueries } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useSearch');

// ============================================================================
// Query Keys
// ============================================================================

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

// ============================================================================
// Hook Options
// ============================================================================

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

// ============================================================================
// Hooks
// ============================================================================

/**
 * Search across tasks, projects, chats, and messages using full-text search.
 *
 * Provides comprehensive search capabilities with optional scoping by project
 * and filtering by result type. Queries are debounced by React Query's
 * natural behavior (no duplicate in-flight requests for the same key).
 *
 * @param query - The search query string
 * @param options - Optional search configuration
 * @returns Query result with search results sorted by relevance
 *
 * @example
 * ```tsx
 * // Basic search
 * const { data: results, isLoading } = useSearch(query);
 *
 * // With project scoping
 * const { data: results } = useSearch(query, { projectId: 'proj-123' });
 *
 * // With type filtering
 * const { data: results } = useSearch(query, {
 *   resultTypes: [SearchResultType.Task, SearchResultType.Chat],
 * });
 *
 * // With custom minimum query length (search only after 3 characters)
 * const { data: results } = useSearch(query, { minQueryLength: 3 });
 *
 * // With custom limit
 * const { data: results } = useSearch(query, { limit: 50 });
 * ```
 */
export function useSearch(
  query: string,
  options: UseSearchOptions = {}
): UseQueryResult<SearchResult[]> {
  const { projectId, resultTypes, limit, minQueryLength = 1, staleTime = 1000 } = options;

  const isEnabled = query.length >= minQueryLength;

  logger.debug('useSearch hook called', {
    query: query.substring(0, 50), // Truncate for logging
    queryLength: query.length,
    projectId,
    resultTypes,
    limit,
    minQueryLength,
    enabled: isEnabled,
  });

  return useQuery({
    queryKey: searchKeys.search(query, projectId, resultTypes),
    queryFn: async () => {
      logger.debug('Executing search query', {
        query: query.substring(0, 50),
        projectId,
        resultTypes,
        limit,
      });

      try {
        const results = await searchQueries.search(query, projectId, resultTypes, limit);

        // Group results by type for informative logging
        const resultsByType = results.reduce(
          (acc, result) => {
            acc[result.resultType] = (acc[result.resultType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        logger.info('Search completed successfully', {
          query: query.substring(0, 50),
          projectId,
          totalResults: results.length,
          resultsByType,
          // Log top results for debugging (truncate titles)
          topResults: results.slice(0, 3).map((r) => ({
            type: r.resultType,
            title: r.title?.substring(0, 30),
            score: r.score,
          })),
        });

        return results;
      } catch (error) {
        logger.error('Search query failed', {
          query: query.substring(0, 50),
          projectId,
          resultTypes,
          limit,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error; // Re-throw for React Query to handle
      }
    },
    enabled: isEnabled,
    staleTime,
  });
}
