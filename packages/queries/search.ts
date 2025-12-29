import type { SearchResult, SearchResultType } from '@openflow/generated';
import { invoke } from '@tauri-apps/api/core';

/**
 * Search query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls for full-text search operations.
 */
export const searchQueries = {
  /**
   * Search across tasks, projects, chats, and messages.
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
  ): Promise<SearchResult[]> => invoke('search', { query, projectId, resultTypes, limit }),
};
