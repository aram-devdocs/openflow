import { invoke as tauriInvoke } from '@tauri-apps/api/core';

/**
 * Error thrown when Tauri context is not available.
 * This happens when running in browser mode instead of the desktop app.
 */
export class TauriContextError extends Error {
  constructor() {
    super(
      'Tauri context is not available. This feature requires the desktop app. Please run with `pnpm dev:mcp` instead of viewing in the browser.'
    );
    this.name = 'TauriContextError';
  }
}

/**
 * Check if we're running in a Tauri context.
 * Uses __TAURI_INTERNALS__ which is always present in Tauri 2,
 * regardless of the withGlobalTauri setting.
 */
export function isTauriContext(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * Safe invoke wrapper that provides a helpful error message when
 * Tauri context is not available (e.g., when running in browser).
 *
 * @param cmd - The Tauri command to invoke
 * @param args - Optional arguments for the command
 * @returns Promise resolving to the command result
 * @throws TauriContextError if Tauri context is not available
 */
export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriContext()) {
    throw new TauriContextError();
  }
  return tauriInvoke<T>(cmd, args);
}
