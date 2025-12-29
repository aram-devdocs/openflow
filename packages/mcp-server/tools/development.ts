/**
 * Development Tools
 *
 * MCP tools for running development commands:
 * - openflow_lint: Run linting
 * - openflow_typecheck: Run TypeScript type checking
 * - openflow_test: Run tests
 * - openflow_build: Build the application
 * - openflow_generate_types: Generate TypeScript types from Rust
 * - openflow_rust_check: Run cargo check
 */

import {
  parseCargoOutput,
  parseLintOutput,
  parseTestOutput,
  parseTypecheckOutput,
  runCargoCommand,
  runPnpmScript,
} from '../services/command-runner.js';
import type { ToolDefinition, ToolResponse, ToolResult } from '../types.js';

/**
 * Development tool definitions for MCP registration.
 */
export const developmentToolDefinitions: ToolDefinition[] = [
  {
    name: 'openflow_lint',
    description: 'Run Biome linting on the codebase. Optionally auto-fix issues.',
    inputSchema: {
      type: 'object',
      properties: {
        fix: {
          type: 'boolean',
          description: 'Auto-fix linting issues',
          default: false,
        },
      },
    },
  },
  {
    name: 'openflow_typecheck',
    description: 'Run TypeScript type checking across the project.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'openflow_test',
    description: 'Run Vitest tests. Optionally filter by test name.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description: 'Test name pattern to filter',
        },
      },
    },
  },
  {
    name: 'openflow_build',
    description: 'Build the OpenFlow application.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'openflow_generate_types',
    description: 'Regenerate TypeScript types from Rust type definitions.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'openflow_rust_check',
    description: 'Run cargo check on the Rust backend code.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Handle a development tool call.
 */
export async function handleDevelopmentTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<ToolResponse> {
  try {
    switch (name) {
      case 'openflow_lint': {
        const result = await runLint({ fix: args?.fix as boolean });
        return formatToolResponse(result);
      }
      case 'openflow_typecheck': {
        const result = await runTypecheck();
        return formatToolResponse(result);
      }
      case 'openflow_test': {
        const result = await runTest({ filter: args?.filter as string });
        return formatToolResponse(result);
      }
      case 'openflow_build': {
        const result = await runBuild();
        return formatToolResponse(result);
      }
      case 'openflow_generate_types': {
        const result = await generateTypes();
        return formatToolResponse(result);
      }
      case 'openflow_rust_check': {
        const result = await runRustCheck();
        return formatToolResponse(result);
      }
      default:
        return {
          content: [{ type: 'text', text: `Unknown development tool: ${name}` }],
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
 * Run linting.
 */
export async function runLint(options: { fix?: boolean }): Promise<ToolResult> {
  const script = options.fix ? 'lint:fix' : 'lint';
  const result = await runPnpmScript(script);

  const output = result.stdout + result.stderr;
  const parsed = parseLintOutput(output);

  return {
    success: result.success,
    data: {
      exitCode: result.exitCode,
      errors: parsed.errors,
      warnings: parsed.warnings,
      fixed: parsed.fixed,
      output: output.slice(0, 5000), // Limit output size
    },
    error: result.success ? undefined : (result.error ?? 'Linting failed'),
  };
}

/**
 * Run TypeScript type checking.
 */
export async function runTypecheck(): Promise<ToolResult> {
  const result = await runPnpmScript('typecheck');

  const output = result.stdout + result.stderr;
  const parsed = parseTypecheckOutput(output);

  return {
    success: result.success,
    data: {
      exitCode: result.exitCode,
      errors: parsed.errors,
      filesWithErrors: parsed.files,
      output: output.slice(0, 5000), // Limit output size
    },
    error: result.success ? undefined : (result.error ?? 'Type checking failed'),
  };
}

/**
 * Run tests.
 */
export async function runTest(options: {
  filter?: string;
  watch?: boolean;
}): Promise<ToolResult> {
  const args: string[] = [];

  // Add filter if provided
  if (options.filter) {
    args.push('-t', options.filter);
  }

  // Run tests in run mode (not watch)
  args.push('--run');

  const result = await runPnpmScript('test', args);

  const output = result.stdout + result.stderr;
  const parsed = parseTestOutput(output);

  return {
    success: result.success,
    data: {
      exitCode: result.exitCode,
      passed: parsed.passed,
      failed: parsed.failed,
      skipped: parsed.skipped,
      total: parsed.total,
      output: output.slice(0, 5000), // Limit output size
    },
    error: result.success ? undefined : (result.error ?? 'Tests failed'),
  };
}

/**
 * Build the application.
 */
export async function runBuild(): Promise<ToolResult> {
  // Build has a longer timeout (10 minutes)
  const result = await runPnpmScript('build', [], { timeout: 600000 });

  const output = result.stdout + result.stderr;

  return {
    success: result.success,
    data: {
      exitCode: result.exitCode,
      output: output.slice(0, 5000), // Limit output size
    },
    error: result.success ? undefined : (result.error ?? 'Build failed'),
  };
}

/**
 * Generate TypeScript types from Rust.
 */
export async function generateTypes(): Promise<ToolResult> {
  const result = await runPnpmScript('generate:types');

  const output = result.stdout + result.stderr;

  return {
    success: result.success,
    data: {
      exitCode: result.exitCode,
      output: output.slice(0, 5000), // Limit output size
    },
    error: result.success ? undefined : (result.error ?? 'Type generation failed'),
  };
}

/**
 * Run cargo check on the Rust code.
 */
export async function runRustCheck(): Promise<ToolResult> {
  const result = await runCargoCommand('check', ['--message-format=short']);

  const output = result.stdout + result.stderr;
  const parsed = parseCargoOutput(output);

  return {
    success: result.success,
    data: {
      exitCode: result.exitCode,
      errors: parsed.errors,
      warnings: parsed.warnings,
      filesWithErrors: parsed.files,
      output: output.slice(0, 5000), // Limit output size
    },
    error: result.success ? undefined : (result.error ?? 'Cargo check failed'),
  };
}
