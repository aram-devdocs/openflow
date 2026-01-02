/**
 * useDataSync Hook
 *
 * Subscribes to data-changed events and invalidates relevant TanStack Query
 * caches for real-time synchronization between multiple clients.
 *
 * This hook enables the "flexible backend" architecture where:
 * - Multiple Tauri windows share the same data
 * - Browser clients see updates from Tauri
 * - Browser clients see updates from other browser clients
 *
 * ## Usage
 *
 * Add this hook to your app root (e.g., App.tsx) to enable real-time sync:
 *
 * ```tsx
 * function App() {
 *   // Enable real-time data sync
 *   useDataSync();
 *
 *   return <RouterProvider router={router} />;
 * }
 * ```
 *
 * @see CLAUDE.md - Flexible Backend Architecture section
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribe, type DataChangedEvent } from '@openflow/queries';
import { createLogger } from '@openflow/utils';

const logger = createLogger('useDataSync');

/**
 * Map entity types to their query key prefixes.
 *
 * This mapping determines which TanStack Query caches to invalidate
 * when a data-changed event is received.
 */
const ENTITY_QUERY_KEY_MAP: Record<string, string[]> = {
  project: ['projects', 'project'],
  task: ['tasks', 'task'],
  chat: ['chats', 'chat'],
  message: ['messages', 'message'],
  executorProfile: ['executorProfiles', 'executorProfile'],
  setting: ['settings', 'setting'],
  process: ['processes', 'process'],
  worktree: ['worktrees', 'worktree', 'git'],
};

/**
 * Get the query keys to invalidate for a given entity type.
 */
function getQueryKeysForEntity(entity: string): string[] {
  return ENTITY_QUERY_KEY_MAP[entity] || [entity];
}

/**
 * Options for the useDataSync hook.
 */
export interface UseDataSyncOptions {
  /**
   * Whether the sync subscription is enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback when a data change is received.
   * Useful for custom handling beyond cache invalidation.
   */
  onDataChange?: (event: DataChangedEvent) => void;

  /**
   * Whether to also update the cache with the new data (optimistic update).
   * Only applies to 'created' and 'updated' actions when data is included.
   * @default true
   */
  optimisticUpdate?: boolean;
}

/**
 * Hook that subscribes to real-time data changes and invalidates
 * relevant TanStack Query caches.
 *
 * Add this hook to your app root to enable real-time sync across
 * all clients (Tauri windows and browser tabs).
 *
 * ## How It Works
 *
 * 1. Subscribes to the 'data-changed' event channel
 * 2. When an event is received:
 *    - Invalidates list queries for the entity type (e.g., ['projects'])
 *    - For creates/updates with data, optimistically updates the cache
 *    - For deletes, removes the entity from cache
 * 3. Cleans up subscription on unmount
 *
 * ## Event Format
 *
 * Events have the following structure:
 * ```ts
 * {
 *   entity: 'project' | 'task' | 'chat' | 'message' | ...
 *   action: 'created' | 'updated' | 'deleted'
 *   id: string
 *   data?: unknown  // Full entity data for creates/updates
 * }
 * ```
 *
 * @param options - Optional configuration
 *
 * @example
 * ```tsx
 * // Basic usage - enable sync for the entire app
 * function App() {
 *   useDataSync();
 *   return <RouterProvider router={router} />;
 * }
 *
 * // With custom callback for notifications
 * function App() {
 *   const { toast } = useToast();
 *
 *   useDataSync({
 *     onDataChange: (event) => {
 *       if (event.action === 'created' && event.entity === 'task') {
 *         toast.info('New task created');
 *       }
 *     }
 *   });
 *
 *   return <RouterProvider router={router} />;
 * }
 *
 * // Conditionally enable sync
 * function App() {
 *   const [syncEnabled, setSyncEnabled] = useState(true);
 *
 *   useDataSync({ enabled: syncEnabled });
 *
 *   return <RouterProvider router={router} />;
 * }
 * ```
 */
export function useDataSync(options: UseDataSyncOptions = {}): void {
  const { enabled = true, onDataChange, optimisticUpdate = true } = options;

  const queryClient = useQueryClient();

  // Track initialization for logging
  const initializedRef = useRef(false);
  // Track event counts for debugging
  const eventCountRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      logger.debug('Data sync disabled');
      return;
    }

    // Log initialization only once
    if (!initializedRef.current) {
      logger.info('Setting up data sync subscription');
      initializedRef.current = true;
    }

    const unsubscribe = subscribe('data-changed', (rawEvent) => {
      const event = rawEvent as DataChangedEvent;
      const { entity, action, id, data } = event;

      eventCountRef.current += 1;

      logger.debug('Data changed event received', {
        entity,
        action,
        id,
        hasData: !!data,
        eventCount: eventCountRef.current,
      });

      // Call custom callback if provided
      if (onDataChange) {
        try {
          onDataChange(event);
        } catch (error) {
          logger.error('Error in onDataChange callback', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Get the query keys to invalidate for this entity
      const queryKeys = getQueryKeysForEntity(entity);

      // Invalidate list queries for this entity type
      // This will trigger a refetch of any active list queries
      for (const key of queryKeys) {
        logger.debug('Invalidating queries', { queryKey: key, entity, action });
        queryClient.invalidateQueries({ queryKey: [key] });
      }

      // Handle specific actions for optimistic updates
      if (optimisticUpdate && action !== 'deleted' && data) {
        // For creates and updates with data, optimistically update the cache
        // This provides immediate feedback without waiting for refetch
        queryClient.setQueryData([entity, id], data);

        logger.debug('Optimistically updated cache', { entity, id });
      }

      if (action === 'deleted') {
        // For deletes, remove the entity from cache
        queryClient.removeQueries({ queryKey: [entity, id] });

        logger.debug('Removed from cache', { entity, id });
      }

      // Log summary periodically
      if (eventCountRef.current === 1 || eventCountRef.current % 100 === 0) {
        logger.info('Data sync event processed', {
          totalEvents: eventCountRef.current,
          latestEntity: entity,
          latestAction: action,
        });
      }
    });

    return () => {
      logger.info('Cleaning up data sync subscription', {
        totalEventsReceived: eventCountRef.current,
      });
      initializedRef.current = false;
      unsubscribe();
    };
  }, [enabled, queryClient, onDataChange, optimisticUpdate]);
}

/**
 * Hook that subscribes to specific entity changes.
 *
 * Use this for more targeted subscriptions when you only care about
 * certain entity types.
 *
 * @param entityType - The entity type to listen for
 * @param onEvent - Callback when an event for this entity is received
 *
 * @example
 * ```tsx
 * function TaskList() {
 *   useEntitySync('task', (event) => {
 *     console.log('Task changed:', event.id, event.action);
 *   });
 *
 *   // ...
 * }
 * ```
 */
export function useEntitySync(
  entityType: string,
  onEvent: (event: DataChangedEvent) => void
): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    logger.debug('Setting up entity sync subscription', { entityType });

    const unsubscribe = subscribe('data-changed', (rawEvent) => {
      const event = rawEvent as DataChangedEvent;

      // Only process events for the specified entity type
      if (event.entity !== entityType) {
        return;
      }

      logger.debug('Entity sync event received', {
        entityType,
        action: event.action,
        id: event.id,
      });

      // Call the callback
      onEvent(event);

      // Invalidate queries for this entity type
      const queryKeys = getQueryKeysForEntity(entityType);
      for (const key of queryKeys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    });

    return () => {
      logger.debug('Cleaning up entity sync subscription', { entityType });
      unsubscribe();
    };
  }, [entityType, onEvent, queryClient]);
}
