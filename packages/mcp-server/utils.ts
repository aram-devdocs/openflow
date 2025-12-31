/**
 * MCP Server Utilities
 *
 * Helper functions for the OpenFlow MCP server.
 */

import type { LogEntry } from './types.js';

/**
 * Creates a circular buffer for storing log entries with a maximum size.
 */
export function createLogBuffer(maxSize: number) {
  const entries: LogEntry[] = [];

  return {
    /** Add an entry to the buffer */
    push(entry: LogEntry) {
      entries.push(entry);
      if (entries.length > maxSize) {
        entries.shift();
      }
    },

    /** Get all entries, optionally filtered by level */
    getEntries(level?: LogEntry['level'], limit?: number): LogEntry[] {
      const levelPriority: Record<LogEntry['level'], number> = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
      };

      let filtered = entries;

      if (level) {
        const minPriority = levelPriority[level];
        filtered = entries.filter((e) => levelPriority[e.level] >= minPriority);
      }

      if (limit && limit > 0) {
        return filtered.slice(-limit);
      }

      return [...filtered];
    },

    /** Clear all entries */
    clear() {
      entries.length = 0;
    },

    /** Get the current number of entries */
    get size() {
      return entries.length;
    },
  };
}

/**
 * Parse a line of output and determine its log level.
 */
export function parseLogLevel(line: string): LogEntry['level'] {
  const lowerLine = line.toLowerCase();

  if (lowerLine.includes('error') || lowerLine.includes('failed')) {
    return 'error';
  }
  if (lowerLine.includes('warn')) {
    return 'warn';
  }
  if (lowerLine.includes('debug')) {
    return 'debug';
  }
  return 'info';
}

/**
 * Format a duration in milliseconds to a human-readable string.
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Wait for a specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function until it succeeds or times out.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    timeout?: number;
  } = {}
): Promise<T> {
  const { maxAttempts = 10, delay = 1000, timeout = 30000 } = options;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Retry timed out after ${timeout}ms`);
    }

    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await sleep(delay);
    }
  }

  throw new Error('Retry failed');
}
