/**
 * Tools Index
 *
 * Re-exports all tool modules and provides tool registration.
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { registerDevelopmentTools } from './development.js';
import { registerLifecycleTools } from './lifecycle.js';

// Re-export individual tools
export * from './lifecycle.js';
export * from './development.js';

/**
 * Register all tools with the MCP server.
 */
export function registerAllTools(server: Server): void {
  registerLifecycleTools(server);
  registerDevelopmentTools(server);
}
