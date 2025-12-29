/**
 * Tools Index
 *
 * Provides tool definitions and handles tool execution.
 */

import type { ToolDefinition, ToolResponse } from '../types.js';
import { developmentToolDefinitions, handleDevelopmentTool } from './development.js';
import { handleLifecycleTool, lifecycleToolDefinitions } from './lifecycle.js';
import { handleUiTool, uiToolDefinitions } from './ui.js';

// Re-export individual tools
export * from './lifecycle.js';
export * from './development.js';
export * from './ui.js';

/**
 * Get all registered tool definitions.
 */
export function getToolDefinitions(): ToolDefinition[] {
  return [...lifecycleToolDefinitions, ...developmentToolDefinitions, ...uiToolDefinitions];
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

  // Try UI tools
  if (uiToolDefinitions.some((t) => t.name === name)) {
    return handleUiTool(name, args);
  }

  // Tool not found
  return {
    content: [{ type: 'text', text: `Error: Unknown tool '${name}'` }],
    isError: true,
  };
}
