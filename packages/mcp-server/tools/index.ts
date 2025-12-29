/**
 * Tools Index
 *
 * Provides tool definitions and handles tool execution.
 */

import type { ToolDefinition, ToolResponse } from '../types.js';
import { developmentToolDefinitions, handleDevelopmentTool } from './development.js';
import { handleLifecycleTool, lifecycleToolDefinitions } from './lifecycle.js';

// Re-export individual tools
export * from './lifecycle.js';
export * from './development.js';

/**
 * Get all registered tool definitions.
 */
export function getToolDefinitions(): ToolDefinition[] {
  return [...lifecycleToolDefinitions, ...developmentToolDefinitions];
}

/**
 * Handle a tool call by routing to the appropriate handler.
 */
export async function handleToolCall(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<ToolResponse> {
  // Try lifecycle tools first
  if (lifecycleToolDefinitions.some((t) => t.name === name)) {
    return handleLifecycleTool(name, args);
  }

  // Try development tools
  if (developmentToolDefinitions.some((t) => t.name === name)) {
    return handleDevelopmentTool(name, args);
  }

  // Tool not found
  return {
    content: [{ type: 'text', text: `Error: Unknown tool '${name}'` }],
    isError: true,
  };
}
