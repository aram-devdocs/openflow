/**
 * Lifecycle Tools
 *
 * MCP tools for managing the application lifecycle:
 * - openflow_start: Start the application
 * - openflow_stop: Stop the application
 * - openflow_status: Get current status
 * - openflow_restart: Restart the application
 * - openflow_wait_ready: Wait for the app to be ready
 * - openflow_logs: Get application logs
 */

import { getAppManager } from '../services/app-manager.js';
import type { ToolDefinition, ToolResponse, ToolResult } from '../types.js';

/**
 * Lifecycle tool definitions for MCP registration.
 */
export const lifecycleToolDefinitions: ToolDefinition[] = [
  {
    name: 'openflow_start',
    description: 'Start the OpenFlow app in development mode. Returns PID when successful.',
    inputSchema: {
      type: 'object',
      properties: {
        timeout_seconds: {
          type: 'number',
          description: 'Maximum time to wait for startup in seconds',
          default: 120,
        },
      },
    },
  },
  {
    name: 'openflow_stop',
    description: 'Stop the running OpenFlow app.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'openflow_status',
    description: 'Check if the OpenFlow app is currently running and get status info.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'openflow_restart',
    description: 'Restart the OpenFlow app. Stops if running, then starts fresh.',
    inputSchema: {
      type: 'object',
      properties: {
        timeout_seconds: {
          type: 'number',
          description: 'Maximum time to wait for startup in seconds',
          default: 120,
        },
      },
    },
  },
  {
    name: 'openflow_wait_ready',
    description: 'Wait for the OpenFlow app to be fully ready and responding.',
    inputSchema: {
      type: 'object',
      properties: {
        timeout_seconds: {
          type: 'number',
          description: 'Maximum time to wait in seconds',
          default: 60,
        },
      },
    },
  },
  {
    name: 'openflow_logs',
    description: 'Get recent dev server logs from the running app.',
    inputSchema: {
      type: 'object',
      properties: {
        lines: {
          type: 'number',
          description: 'Number of log lines to return (max 500)',
          default: 50,
        },
        level: {
          type: 'string',
          enum: ['debug', 'info', 'warn', 'error'],
          description: 'Minimum log level to include',
          default: 'info',
        },
      },
    },
  },
];

/**
 * Handle a lifecycle tool call.
 */
export async function handleLifecycleTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<ToolResponse> {
  try {
    switch (name) {
      case 'openflow_start': {
        const result = await startApp({
          timeout: ((args?.timeout_seconds as number) ?? 120) * 1000,
          waitForReady: true,
        });
        return formatToolResponse(result);
      }
      case 'openflow_stop': {
        const result = await stopApp();
        return formatToolResponse(result);
      }
      case 'openflow_status': {
        const result = await getStatus();
        return formatToolResponse(result);
      }
      case 'openflow_restart': {
        const result = await restartApp({
          timeout: ((args?.timeout_seconds as number) ?? 120) * 1000,
          waitForReady: true,
        });
        return formatToolResponse(result);
      }
      case 'openflow_wait_ready': {
        const result = await waitForReady(((args?.timeout_seconds as number) ?? 60) * 1000);
        return formatToolResponse(result);
      }
      case 'openflow_logs': {
        const result = await getLogs({
          limit: Math.min((args?.lines as number) ?? 50, 500),
          level: args?.level as 'debug' | 'info' | 'warn' | 'error' | undefined,
        });
        return formatToolResponse(result);
      }
      default:
        return {
          content: [{ type: 'text', text: `Unknown lifecycle tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
}

/**
 * Format a ToolResult as an MCP response.
 */
function formatToolResponse(result: ToolResult): ToolResponse {
  if (result.success) {
    const text = result.data
      ? JSON.stringify(result.data, null, 2)
      : 'Operation completed successfully';
    return {
      content: [{ type: 'text', text }],
    };
  }
  return {
    content: [{ type: 'text', text: `Error: ${result.error ?? 'Unknown error'}` }],
    isError: true,
  };
}

/**
 * Start the application.
 */
export async function startApp(options: {
  waitForReady?: boolean;
  timeout?: number;
}): Promise<ToolResult> {
  const manager = getAppManager();
  const result = await manager.start({
    waitForReady: options.waitForReady ?? true,
    timeout: options.timeout,
  });

  if (result.success) {
    return {
      success: true,
      data: {
        pid: result.pid,
        devServerUrl: result.devServerUrl,
        message: `App started successfully with PID ${result.pid}`,
      },
    };
  }

  return {
    success: false,
    error: result.error ?? 'Failed to start app',
  };
}

/**
 * Stop the application.
 */
export async function stopApp(): Promise<ToolResult> {
  const manager = getAppManager();
  const status = manager.getStatus();

  // Check if already stopped
  if (status.state === 'stopped') {
    return {
      success: true,
      data: {
        message: 'App is not running',
      },
    };
  }

  const result = await manager.stop();

  if (result.success) {
    return {
      success: true,
      data: {
        message: 'App stopped successfully',
      },
    };
  }

  return {
    success: false,
    error: result.error ?? 'Failed to stop app',
  };
}

/**
 * Get the current application status.
 */
export async function getStatus(): Promise<ToolResult> {
  const manager = getAppManager();
  const status = manager.getStatus();
  return {
    success: true,
    data: status,
  };
}

/**
 * Restart the application.
 */
export async function restartApp(_options: {
  waitForReady?: boolean;
  timeout?: number;
}): Promise<ToolResult> {
  // TODO: Implement in Phase 3
  return {
    success: false,
    error: 'Not implemented - will be completed in Phase 3',
  };
}

/**
 * Wait for the application to be ready.
 */
export async function waitForReady(_timeout?: number): Promise<ToolResult> {
  // TODO: Implement in Phase 3
  return {
    success: false,
    error: 'Not implemented - will be completed in Phase 3',
  };
}

/**
 * Get application logs.
 */
export async function getLogs(options: {
  level?: 'debug' | 'info' | 'warn' | 'error';
  limit?: number;
}): Promise<ToolResult> {
  const manager = getAppManager();
  const logs = manager.getLogs(options);
  return {
    success: true,
    data: logs,
  };
}
