#!/usr/bin/env node
/**
 * OpenFlow MCP Server
 *
 * Entry point for the MCP server that enables AI agents to interact
 * with the OpenFlow application.
 */

import { startServer } from './server.js';

// Re-export types and utilities for programmatic use
export * from './types.js';
export * from './utils.js';
export * from './services/index.js';
export * from './tools/index.js';
export { createServer, startServer } from './server.js';

// Start the server when run directly
startServer().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
