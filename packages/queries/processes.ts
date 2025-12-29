import { invoke } from '@tauri-apps/api/core';
import type { ExecutionProcess } from '@openflow/generated';

/**
 * Process query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 */
export const processQueries = {
  /**
   * Get a single execution process by ID.
   */
  get: (id: string): Promise<ExecutionProcess> =>
    invoke('get_process', { id }),

  /**
   * Kill a running process.
   */
  kill: (id: string): Promise<ExecutionProcess> =>
    invoke('kill_process', { id }),

  /**
   * Send input to a running process.
   */
  sendInput: (processId: string, input: string): Promise<void> =>
    invoke('send_process_input', { processId, input }),
};
