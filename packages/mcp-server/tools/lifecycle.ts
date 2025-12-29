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
    description:
      'Start the OpenFlow app in development mode with MCP GUI plugin enabled for UI automation. Returns PID and socket path when successful.',
    inputSchema: {
      type: 'object',
      properties: {
        timeout_seconds: {
          type: 'number',
          description: 'Maximum time to wait for startup in seconds',
          default: 120,
        },
        enable_mcp_gui: {
          type: 'boolean',
          description: 'Enable MCP GUI plugin for UI automation via socket',
          default: true,
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
        const enableMcpGui = (args?.enable_mcp_gui as boolean) ?? true;
        const result = await startApp({
          timeout: ((args?.timeout_seconds as number) ?? 120) * 1000,
          waitForReady: true,
          enableMcpGui,
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

/** MCP GUI socket path when enabled */
const MCP_GUI_SOCKET_PATH = '/tmp/openflow-mcp.sock';

/**
 * Start the application.
 */
export async function startApp(options: {
  waitForReady?: boolean;
  timeout?: number;
  enableMcpGui?: boolean;
}): Promise<ToolResult> {
  const enableMcpGui = options.enableMcpGui ?? true;
  const manager = getAppManager();
  const result = await manager.start({
    waitForReady: options.waitForReady ?? true,
    timeout: options.timeout,
    enableMcpGui,
  });

  if (result.success) {
    return {
      success: true,
      data: {
        pid: result.pid,
        devServerUrl: result.devServerUrl,
        mcpSocketPath: enableMcpGui ? MCP_GUI_SOCKET_PATH : null,
        message: `App started successfully with PID ${result.pid}${enableMcpGui ? ` (MCP GUI at ${MCP_GUI_SOCKET_PATH})` : ''}`,
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
 * Stops the app if running, then starts it fresh.
 */
export async function restartApp(options: {
  waitForReady?: boolean;
  timeout?: number;
  enableMcpGui?: boolean;
}): Promise<ToolResult> {
  const enableMcpGui = options.enableMcpGui ?? true;
  const manager = getAppManager();
  const currentStatus = manager.getStatus();

  // Stop if currently running
  if (currentStatus.state === 'running' || currentStatus.state === 'starting') {
    const stopResult = await manager.stop();
    if (!stopResult.success) {
      return {
        success: false,
        error: `Failed to stop app before restart: ${stopResult.error}`,
      };
    }
  }

  // Start the app
  const startResult = await manager.start({
    waitForReady: options.waitForReady ?? true,
    timeout: options.timeout,
    enableMcpGui,
  });

  if (startResult.success) {
    return {
      success: true,
      data: {
        pid: startResult.pid,
        devServerUrl: startResult.devServerUrl,
        mcpSocketPath: enableMcpGui ? MCP_GUI_SOCKET_PATH : null,
        message: `App restarted successfully${enableMcpGui ? ` (MCP GUI at ${MCP_GUI_SOCKET_PATH})` : ''}`,
      },
    };
  }

  return {
    success: false,
    error: startResult.error ?? 'Failed to start app during restart',
  };
}

/**
 * Wait for the application to be ready.
 * Polls the dev server until it responds or timeout is reached.
 */
export async function waitForReady(timeout = 60000): Promise<ToolResult> {
  const manager = getAppManager();
  const status = manager.getStatus();

  // Check if the app is even running or starting
  if (status.state === 'stopped') {
    return {
      success: false,
      error: 'App is not running. Start the app first with openflow_start.',
    };
  }

  if (status.state === 'error') {
    return {
      success: false,
      error: `App is in error state: ${status.error}`,
    };
  }

  // Wait for the dev server to be ready
  const ready = await manager.waitForReady(timeout);

  if (ready) {
    const updatedStatus = manager.getStatus();
    return {
      success: true,
      data: {
        message: 'App is ready',
        devServerUrl: updatedStatus.devServerUrl,
        uptime: updatedStatus.uptime,
      },
    };
  }

  return {
    success: false,
    error: `Dev server did not become ready within ${timeout}ms`,
  };
}

/**
 * Get application logs.
 * Returns buffered stdout/stderr from the dev server process.
 */
export async function getLogs(options: {
  level?: 'debug' | 'info' | 'warn' | 'error';
  limit?: number;
}): Promise<ToolResult> {
  const manager = getAppManager();
  const status = manager.getStatus();
  const logs = manager.getLogs(options);

  // Format logs for better readability
  const formattedLogs = logs.map((entry) => ({
    timestamp: entry.timestamp.toISOString(),
    level: entry.level,
    message: entry.message,
  }));

  return {
    success: true,
    data: {
      appState: status.state,
      logCount: logs.length,
      filter: {
        level: options.level ?? 'info',
        limit: options.limit ?? 50,
      },
      logs: formattedLogs,
    },
  };
}
