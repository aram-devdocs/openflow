/**
 * MCP Server Implementation
 *
 * Sets up the MCP server with stdio transport and registers all tools.
 */

import { unlinkSync } from 'node:fs';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getAppManager } from './services/app-manager.js';
import { DEFAULT_SOCKET_PATH, getTauriBridge } from './services/tauri-bridge.js';
import { getToolDefinitions, handleToolCall } from './tools/index.js';

/**
 * Create and configure the MCP server.
 */
export function createServer(): Server {
  const server = new Server(
    {
      name: 'openflow-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool listing handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: getToolDefinitions(),
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const result = await handleToolCall(name, args);

    // Return as CallToolResult format
    return {
      content: result.content,
      isError: result.isError,
    } satisfies CallToolResult;
  });

  return server;
}

/**
 * Clean up all resources managed by the MCP server.
 * This ensures no orphaned processes or socket files are left behind.
 */
async function cleanup(): Promise<void> {
  // Stop the Tauri app if running
  const appManager = getAppManager();
  const status = appManager.getStatus();
  if (status.state === 'running' || status.state === 'starting') {
    try {
      await appManager.stop();
    } catch {
      // Ignore errors during cleanup
    }
  }

  // Disconnect the Tauri bridge
  try {
    const bridge = getTauriBridge();
    bridge.disconnect();
  } catch {
    // Ignore errors during cleanup
  }

  // Clean up orphaned socket files
  try {
    unlinkSync(DEFAULT_SOCKET_PATH);
  } catch {
    // Socket file may not exist, ignore
  }
}

/**
 * Start the MCP server with stdio transport.
 */
export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  // Handle graceful shutdown with cleanup
  const handleShutdown = async () => {
    try {
      await cleanup();
      await server.close();
    } catch {
      // Ignore errors during shutdown
    }
    process.exit(0);
  };

  process.on('SIGINT', () => handleShutdown());
  process.on('SIGTERM', () => handleShutdown());

  // Also handle uncaught exceptions to ensure cleanup
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception:', error);
    await cleanup();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason) => {
    console.error('Unhandled rejection:', reason);
    await cleanup();
    process.exit(1);
  });

  // Connect to transport
  await server.connect(transport);
}

// Export cleanup for external use
export { cleanup };
