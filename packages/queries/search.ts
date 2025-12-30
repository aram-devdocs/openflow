import type { SearchResult, SearchResultType } from '@openflow/generated';
import { searchQuerySchema } from '@openflow/validation';
import { invoke } from './utils.js';

/**
 * Search query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls for full-text search operations.
 * Input validation is performed using Zod schemas before invoking Tauri commands.
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
   */
  search: (
    query: string,
    projectId?: string,
    resultTypes?: SearchResultType[],
    limit?: number
  ): Promise<SearchResult[]> => {
    const validated = searchQuerySchema.parse({ query, projectId, resultTypes, limit });
    return invoke('search', validated);
  },
};
