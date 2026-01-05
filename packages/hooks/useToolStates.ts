import type { ToolState, ToolStateEvent } from '@openflow/generated';
import { getTransport } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import { useCallback, useEffect, useState } from 'react';

// Create logger for this hook
const logger = createLogger('useToolStates');

/**
 * State returned by the useToolStates hook.
 */
export interface ToolStatesState {
  /** Map of tool ID to tool state */
  toolStates: Map<string, ToolState>;
  /** Array of all tool states (for iteration) */
  toolStatesArray: ToolState[];
  /** Get a specific tool state by ID */
  getToolState: (toolId: string) => ToolState | undefined;
  /** Count of tools in each status */
  statusCounts: {
    pending: number;
    running: number;
    complete: number;
    error: number;
  };
  /** Whether any tools are currently running */
  hasRunningTools: boolean;
  /** Clear all tool states */
  clearToolStates: () => void;
}

/**
 * Hook to subscribe to tool state changes for a process.
 *
 * This hook subscribes to the `tool-state-{processId}` channel
 * and maintains a map of tool states keyed by tool ID.
 *
 * Tool states track the lifecycle of Claude Code tool calls:
 * - Pending: Tool call initiated
 * - Running: Tool is executing
 * - Complete: Tool finished successfully
 * - Error: Tool failed with an error
 *
 * @param processId - The ID of the process to subscribe to (null to skip)
 * @returns ToolStatesState with tool states and utilities
 */
export function useToolStates(processId: string | null): ToolStatesState {
  const [toolStates, setToolStates] = useState<Map<string, ToolState>>(new Map());

  // Update a tool state in the map
  const updateToolState = useCallback((toolState: ToolState) => {
    setToolStates((prev) => {
      const next = new Map(prev);
      next.set(toolState.id, toolState);
      return next;
    });
  }, []);

  // Clear all tool states
  const clearToolStates = useCallback(() => {
    setToolStates(new Map());
  }, []);

  // Get a specific tool state
  const getToolState = useCallback(
    (toolId: string): ToolState | undefined => {
      return toolStates.get(toolId);
    },
    [toolStates]
  );

  // Subscribe to tool state updates
  useEffect(() => {
    if (!processId) return;

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const setup = async () => {
      try {
        const transport = await getTransport();

        // Subscribe to tool state events
        const channel = `tool-state-${processId}`;
        logger.debug('Subscribing to tool state events', { channel });

        unsubscribe = transport.subscribe(channel, (event: unknown) => {
          if (!isMounted) return;

          const toolStateEvent = event as ToolStateEvent;
          const toolState = toolStateEvent.toolState;

          logger.debug('Tool state update received', {
            processId,
            toolId: toolState.id,
            toolName: toolState.toolName,
            status: toolState.status,
          });

          updateToolState(toolState);
        });

        logger.info('Subscribed to tool state events', { channel });
      } catch (error) {
        logger.error('Failed to subscribe to tool state events', {
          processId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        logger.debug('Cleaning up tool state subscription', { processId });
        unsubscribe();
      }
    };
  }, [processId, updateToolState]);

  // Clear states when process changes
  useEffect(() => {
    if (processId) {
      clearToolStates();
    }
  }, [processId, clearToolStates]);

  // Convert map to array for iteration
  const toolStatesArray = Array.from(toolStates.values()).sort((a, b) => {
    const aTime = new Date(a.startedAt).getTime();
    const bTime = new Date(b.startedAt).getTime();
    return aTime - bTime;
  });

  // Calculate status counts
  const statusCounts = {
    pending: 0,
    running: 0,
    complete: 0,
    error: 0,
  };

  for (const tool of toolStatesArray) {
    const status = tool.status.toLowerCase() as keyof typeof statusCounts;
    if (status in statusCounts) {
      statusCounts[status]++;
    }
  }

  const hasRunningTools = statusCounts.running > 0;

  return {
    toolStates,
    toolStatesArray,
    getToolState,
    statusCounts,
    hasRunningTools,
    clearToolStates,
  };
}
