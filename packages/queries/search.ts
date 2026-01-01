import type { SearchResult, SearchResultType } from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { searchQuerySchema } from '@openflow/validation';
import { invoke } from './utils.js';

/**
 * Logger for search query operations.
 * Logs at DEBUG level for query calls, INFO for successes, ERROR for failures.
 */
const logger = createLogger('queries:search');

/**
 * Search query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls for full-text search operations.
 * Input validation is performed using Zod schemas before invoking Tauri commands.
 *
 * All functions include:
 * - Try/catch error handling with re-throw for React Query
 * - Logging at appropriate levels (DEBUG on call, INFO on success, ERROR on failure)
 * - Zod schema validation for input parameters
 *
 * @example
 * ```ts
 * // Basic search across all result types
 * const results = await searchQueries.search('authentication');
 *
 * // Search within a specific project
 * const projectResults = await searchQueries.search('login', 'project-123');
 *
 * // Search only tasks and chats with a limit
 * const filtered = await searchQueries.search('api', undefined, ['Task', 'Chat'], 10);
 * ```
 */
export const searchQueries = {
  /**
   * Search across tasks, projects, chats, and messages.
   * Input is validated against searchQuerySchema before invoking.
   * @param query - The search query string
   * @param projectId - Optional project ID to scope the search
   * @param resultTypes - Optional array of result types to filter by
   * @param limit - Optional maximum number of results to return
   * @returns Array of search results sorted by relevance score
   * @throws Error if validation fails or the query fails (re-thrown for React Query)
   */
  search: async (
    query: string,
    projectId?: string,
    resultTypes?: SearchResultType[],
    limit?: number
  ): Promise<SearchResult[]> => {
    logger.debug('Executing search', {
      query,
      projectId,
      resultTypes,
      limit,
    });

    try {
      const validated = searchQuerySchema.parse({ query, projectId, resultTypes, limit });
      const results = await invoke<SearchResult[]>('search', validated);

      // Group results by type for logging
      const resultsByType: Record<string, number> = {};
      for (const result of results) {
        resultsByType[result.resultType] = (resultsByType[result.resultType] || 0) + 1;
      }

      logger.info('Search completed successfully', {
        query,
        projectId,
        totalResults: results.length,
        resultsByType,
        topResults: results.slice(0, 3).map((r) => ({
          resultType: r.resultType,
          title: r.title,
          score: r.score,
        })),
        hasMore: results.length > 3,
      });

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Search failed', {
        query,
        projectId,
        resultTypes,
        limit,
        error: errorMessage,
      });
      throw error;
    }
  },
};
