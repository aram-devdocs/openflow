#!/usr/bin/env tsx
// biome-ignore-all lint/suspicious/noAssignInExpressions: Regex exec loop is idiomatic JS
// biome-ignore-all lint/suspicious/noImplicitAnyLet: Used for regex match results
/**
 * Command-to-Endpoint Mapping Generator
 *
 * Generates a TypeScript mapping file that allows the HTTP transport to convert
 * Tauri IPC commands to HTTP REST endpoints. This enables the frontend to work
 * seamlessly in both Tauri (IPC) and browser (HTTP/WebSocket) contexts.
 *
 * The generated mapping includes:
 * - HTTP method for each command
 * - URL path with placeholder syntax
 * - Path parameter names (e.g., :id, :task_id)
 * - Query parameter names
 * - Whether the endpoint has a request body
 * - Response type information
 *
 * This script parses the Rust endpoint definitions from:
 *   crates/openflow-contracts/src/endpoints/mod.rs
 *
 * And outputs to:
 *   packages/queries/transport/command-map.generated.ts
 *
 * Usage: pnpm generate:command-map
 *
 * @see CLAUDE.md - Type Generation Flow section
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// =============================================================================
// Configuration
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');

const ENDPOINTS_FILE = resolve(ROOT_DIR, 'crates/openflow-contracts/src/endpoints/mod.rs');
const OUTPUT_DIR = resolve(ROOT_DIR, 'packages/queries/transport');
const OUTPUT_FILE = resolve(OUTPUT_DIR, 'command-map.generated.ts');

// =============================================================================
// Types
// =============================================================================

interface Endpoint {
  command: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  requestType: string | null;
  responseType: string;
  pathParams: string[];
  queryParams: string[];
  description: string;
  tags: string[];
}

// =============================================================================
// Parser Functions
// =============================================================================

/**
 * Parse the Rust endpoints file to extract endpoint definitions
 */
function parseEndpointsFile(): Endpoint[] {
  const content = readFileSync(ENDPOINTS_FILE, 'utf-8');
  const endpoints: Endpoint[] = [];

  // Match individual Endpoint blocks
  const endpointRegex = /Endpoint\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/gs;

  let match: RegExpExecArray | null;
  while ((match = endpointRegex.exec(content)) !== null) {
    const block = match[1];
    const endpoint = parseEndpointBlock(block);
    if (endpoint) {
      endpoints.push(endpoint);
    }
  }

  return endpoints;
}

/**
 * Parse a single Endpoint block
 */
function parseEndpointBlock(block: string): Endpoint | null {
  const getStringField = (name: string): string | null => {
    // Match: field: "value" or field: Some("value")
    const patterns = [
      new RegExp(`${name}:\\s*Some\\("([^"]+)"\\)`, 's'),
      new RegExp(`${name}:\\s*"([^"]+)"`, 's'),
    ];

    for (const pattern of patterns) {
      const match = block.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Check for None
    if (block.match(new RegExp(`${name}:\\s*None`, 's'))) {
      return null;
    }

    return null;
  };

  const getArrayField = (name: string): string[] => {
    // Match: field: &["a", "b", "c"] or field: &[]
    const match = block.match(new RegExp(`${name}:\\s*&\\[([^\\]]*)\\]`, 's'));
    if (!match) return [];

    const arrayContent = match[1].trim();
    if (!arrayContent) return [];

    // Extract quoted strings
    const items: string[] = [];
    const itemRegex = /"([^"]+)"/g;
    let itemMatch: RegExpExecArray | null;
    while ((itemMatch = itemRegex.exec(arrayContent)) !== null) {
      items.push(itemMatch[1]);
    }

    return items;
  };

  const getMethodField = (): 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' => {
    const match = block.match(/method:\s*HttpMethod::(\w+)/);
    if (match) {
      // Convert from Rust-style (Post) to HTTP-style (POST)
      return match[1].toUpperCase() as 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    }
    return 'GET';
  };

  const command = getStringField('command');
  if (!command) return null;

  const path = getStringField('path');
  if (!path) return null;

  const responseType = getStringField('response_type');
  if (!responseType) return null;

  return {
    command,
    method: getMethodField(),
    path,
    requestType: getStringField('request_type'),
    responseType,
    pathParams: getArrayField('path_params'),
    queryParams: getArrayField('query_params'),
    description: getStringField('description') || '',
    tags: getArrayField('tags'),
  };
}

// =============================================================================
// Code Generation
// =============================================================================

/**
 * Generate the command map TypeScript file
 */
function generateCommandMap(endpoints: Endpoint[]): string {
  const lines: string[] = [];
  const timestamp = new Date().toISOString();

  // Header
  lines.push('// =============================================================================');
  lines.push('// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY');
  lines.push('// =============================================================================');
  lines.push('//');
  lines.push('// Generated by: scripts/generate-command-map.ts');
  lines.push('// Source: crates/openflow-contracts/src/endpoints/mod.rs');
  lines.push(`// Generated at: ${timestamp}`);
  lines.push('//');
  lines.push('// This file maps Tauri IPC command names to HTTP endpoint metadata.');
  lines.push('// Used by the HTTP transport layer when running in browser mode.');
  lines.push('//');
  lines.push('// The mapping enables seamless switching between:');
  lines.push('// - Tauri IPC (desktop app with built-in backend)');
  lines.push('// - HTTP REST API (browser connecting to standalone server)');
  lines.push('//');
  lines.push('// To regenerate: pnpm generate:command-map');
  lines.push('//');
  lines.push('// @see CLAUDE.md - Flexible Backend Architecture section');
  lines.push('// =============================================================================');
  lines.push('');

  // Type definitions
  lines.push('/**');
  lines.push(' * HTTP method for REST endpoints');
  lines.push(' */');
  lines.push(`export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';`);
  lines.push('');

  lines.push('/**');
  lines.push(' * Metadata for mapping a Tauri command to an HTTP endpoint.');
  lines.push(' */');
  lines.push('export interface EndpointMapping {');
  lines.push('  /** HTTP method for the request */');
  lines.push('  method: HttpMethod;');
  lines.push(`  /** URL path with :param placeholders (e.g., "/api/projects/:id") */`);
  lines.push('  path: string;');
  lines.push('  /** Names of path parameters that need substitution */');
  lines.push('  pathParams: readonly string[];');
  lines.push('  /** Names of query parameters to include in URL */');
  lines.push('  queryParams: readonly string[];');
  lines.push('  /** Whether the endpoint expects a request body */');
  lines.push('  hasRequestBody: boolean;');
  lines.push('  /** Response type hint for documentation */');
  lines.push('  responseType: string;');
  lines.push('}');
  lines.push('');

  // Command map
  lines.push('/**');
  lines.push(' * Mapping from Tauri command names to HTTP endpoint metadata.');
  lines.push(' *');
  lines.push(' * This map is used by the HTTP transport to convert IPC-style calls');
  lines.push(' * to REST API requests when running in browser mode.');
  lines.push(' *');
  lines.push(' * @example');
  lines.push(' * ```ts');
  lines.push(` * const mapping = COMMAND_MAP['get_project'];`);
  lines.push(` * // { method: 'GET', path: '/api/projects/:id', pathParams: ['id'], ... }`);
  lines.push(' * ```');
  lines.push(' */');
  lines.push('export const COMMAND_MAP: Readonly<Record<string, EndpointMapping>> = {');

  // Sort endpoints alphabetically by command name
  const sortedEndpoints = [...endpoints].sort((a, b) => a.command.localeCompare(b.command));

  for (const endpoint of sortedEndpoints) {
    const pathParamsStr =
      endpoint.pathParams.length > 0
        ? `[${endpoint.pathParams.map((p) => `'${p}'`).join(', ')}] as const`
        : '[] as const';

    const queryParamsStr =
      endpoint.queryParams.length > 0
        ? `[${endpoint.queryParams.map((p) => `'${p}'`).join(', ')}] as const`
        : '[] as const';

    lines.push(`  /** ${endpoint.description || endpoint.command} */`);
    lines.push(`  '${endpoint.command}': {`);
    lines.push(`    method: '${endpoint.method}',`);
    lines.push(`    path: '${endpoint.path}',`);
    lines.push(`    pathParams: ${pathParamsStr},`);
    lines.push(`    queryParams: ${queryParamsStr},`);
    lines.push(`    hasRequestBody: ${endpoint.requestType !== null},`);
    lines.push(`    responseType: '${endpoint.responseType}',`);
    lines.push('  },');
  }

  lines.push('} as const;');
  lines.push('');

  // Type for command names
  lines.push('/**');
  lines.push(' * Union type of all valid command names.');
  lines.push(' */');
  lines.push('export type CommandName = keyof typeof COMMAND_MAP;');
  lines.push('');

  // Helper functions
  lines.push('/**');
  lines.push(' * Get the endpoint mapping for a command.');
  lines.push(' *');
  lines.push(' * @param command - Tauri command name');
  lines.push(' * @returns The endpoint mapping or undefined if not found');
  lines.push(' */');
  lines.push('export function getMapping(command: string): EndpointMapping | undefined {');
  lines.push('  return COMMAND_MAP[command as CommandName];');
  lines.push('}');
  lines.push('');

  lines.push('/**');
  lines.push(' * Check if a command is known and has a mapping.');
  lines.push(' *');
  lines.push(' * @param command - Tauri command name');
  lines.push(' * @returns True if the command has a mapping');
  lines.push(' */');
  lines.push('export function isKnownCommand(command: string): command is CommandName {');
  lines.push('  return command in COMMAND_MAP;');
  lines.push('}');
  lines.push('');

  lines.push('/**');
  lines.push(' * Build the full URL path with parameter substitution.');
  lines.push(' *');
  lines.push(' * Substitutes path parameters (e.g., :id) with values from args,');
  lines.push(' * and appends query parameters as a query string.');
  lines.push(' *');
  lines.push(' * @param command - Tauri command name');
  lines.push(' * @param args - Arguments containing parameter values');
  lines.push(' * @returns The fully resolved URL path');
  lines.push(' * @throws Error if command is unknown');
  lines.push(' *');
  lines.push(' * @example');
  lines.push(' * ```ts');
  lines.push(` * buildPath('get_project', { id: 'abc123' })`);
  lines.push(` * // Returns: '/api/projects/abc123'`);
  lines.push(' *');
  lines.push(` * buildPath('list_tasks', { project_id: 'proj1', include_archived: 'true' })`);
  lines.push(` * // Returns: '/api/tasks?project_id=proj1&include_archived=true'`);
  lines.push(' * ```');
  lines.push(' */');
  lines.push(
    'export function buildPath(command: string, args: Record<string, unknown> = {}): string {'
  );
  lines.push('  const mapping = getMapping(command);');
  lines.push('  if (!mapping) {');
  lines.push(
    `    throw new Error(\`Unknown command: \${command}. Ensure it's defined in openflow-contracts.\`);`
  );
  lines.push('  }');
  lines.push('');
  lines.push('  let path = mapping.path;');
  lines.push('');
  lines.push('  // Substitute path parameters');
  lines.push('  for (const param of mapping.pathParams) {');
  lines.push('    const value = args[param];');
  lines.push('    if (value !== undefined && value !== null) {');
  lines.push('      path = path.replace(`:${param}`, encodeURIComponent(String(value)));');
  lines.push('    } else {');
  lines.push(
    `      console.warn(\`Missing path parameter '\${param}' for command '\${command}'\`);`
  );
  lines.push('    }');
  lines.push('  }');
  lines.push('');
  lines.push('  // Build query string from query parameters');
  lines.push('  const queryParts: string[] = [];');
  lines.push('  for (const param of mapping.queryParams) {');
  lines.push('    const value = args[param];');
  lines.push('    if (value !== undefined && value !== null) {');
  lines.push(
    '      queryParts.push(`${encodeURIComponent(param)}=${encodeURIComponent(String(value))}`);'
  );
  lines.push('    }');
  lines.push('  }');
  lines.push('');
  lines.push('  if (queryParts.length > 0) {');
  lines.push("    path += `?${queryParts.join('&')}`;");
  lines.push('  }');
  lines.push('');
  lines.push('  return path;');
  lines.push('}');
  lines.push('');

  lines.push('/**');
  lines.push(' * Extract the request body from arguments.');
  lines.push(' *');
  lines.push(' * For endpoints with request bodies, this extracts the body payload');
  lines.push(` * by looking for a 'request' field or by excluding path/query params.`);
  lines.push(' *');
  lines.push(' * @param command - Tauri command name');
  lines.push(' * @param args - All command arguments');
  lines.push(' * @returns The request body object or undefined');
  lines.push(' *');
  lines.push(' * @example');
  lines.push(' * ```ts');
  lines.push(' * // With explicit request field');
  lines.push(` * getRequestBody('create_project', { request: { name: 'My Project' } })`);
  lines.push(` * // Returns: { name: 'My Project' }`);
  lines.push(' *');
  lines.push(' * // Without request field');
  lines.push(` * getRequestBody('update_project', { id: 'abc', name: 'Updated' })`);
  lines.push(` * // Returns: { name: 'Updated' } (id is excluded as a path param)`);
  lines.push(' * ```');
  lines.push(' */');
  lines.push('export function getRequestBody(');
  lines.push('  command: string,');
  lines.push('  args: Record<string, unknown> = {}');
  lines.push('): unknown | undefined {');
  lines.push('  const mapping = getMapping(command);');
  lines.push('  if (!mapping || !mapping.hasRequestBody) {');
  lines.push('    return undefined;');
  lines.push('  }');
  lines.push('');
  lines.push(`  // Check for explicit 'request' field first`);
  lines.push(`  if ('request' in args && args.request !== undefined) {`);
  lines.push('    return args.request;');
  lines.push('  }');
  lines.push('');
  lines.push('  // Otherwise, return args minus path/query params');
  lines.push('  const excludeKeys = new Set<string>([');
  lines.push('    ...mapping.pathParams,');
  lines.push('    ...mapping.queryParams,');
  lines.push('  ]);');
  lines.push('');
  lines.push('  const body: Record<string, unknown> = {};');
  lines.push('  for (const [key, value] of Object.entries(args)) {');
  lines.push('    if (!excludeKeys.has(key) && value !== undefined) {');
  lines.push('      body[key] = value;');
  lines.push('    }');
  lines.push('  }');
  lines.push('');
  lines.push('  return Object.keys(body).length > 0 ? body : undefined;');
  lines.push('}');
  lines.push('');

  // Statistics comment
  lines.push('// =============================================================================');
  lines.push('// Statistics');
  lines.push('// =============================================================================');
  lines.push(`// Total commands: ${endpoints.length}`);

  // Count by method
  const methodCounts = new Map<string, number>();
  for (const ep of endpoints) {
    methodCounts.set(ep.method, (methodCounts.get(ep.method) || 0) + 1);
  }
  const sortedMethods = Array.from(methodCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [method, count] of sortedMethods) {
    lines.push(`// - ${method}: ${count}`);
  }

  lines.push('// =============================================================================');
  lines.push('');

  return lines.join('\n');
}

// =============================================================================
// Main Execution
// =============================================================================

function main(): void {
  console.log('Generating command-to-endpoint mapping...\n');

  // Check if endpoints file exists
  if (!existsSync(ENDPOINTS_FILE)) {
    console.error(`Error: Endpoints file not found: ${ENDPOINTS_FILE}`);
    console.error('Make sure the openflow-contracts crate is properly set up.');
    process.exit(1);
  }

  // Parse endpoints
  const endpoints = parseEndpointsFile();
  console.log(`Parsed ${endpoints.length} endpoints from Rust contracts`);

  if (endpoints.length === 0) {
    console.log('Warning: No endpoints found. Check the Rust file format.');
    process.exit(0);
  }

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${relative(ROOT_DIR, OUTPUT_DIR)}`);
  }

  // Generate the command map file
  const content = generateCommandMap(endpoints);
  writeFileSync(OUTPUT_FILE, content);

  // Summary
  console.log(`\nGenerated: ${relative(ROOT_DIR, OUTPUT_FILE)}`);
  console.log('\nCommand breakdown:');

  // Count by method
  const methodCounts = new Map<string, number>();
  for (const ep of endpoints) {
    methodCounts.set(ep.method, (methodCounts.get(ep.method) || 0) + 1);
  }
  const sortedMethods = Array.from(methodCounts.entries()).sort((a, b) => b[1] - a[1]);
  for (const [method, count] of sortedMethods) {
    console.log(`  ${method.padEnd(7)} ${count}`);
  }

  // Count endpoints with path/query params
  const withPathParams = endpoints.filter((e) => e.pathParams.length > 0).length;
  const withQueryParams = endpoints.filter((e) => e.queryParams.length > 0).length;
  const withRequestBody = endpoints.filter((e) => e.requestType !== null).length;

  console.log('\nParameter usage:');
  console.log(`  Path params:    ${withPathParams}`);
  console.log(`  Query params:   ${withQueryParams}`);
  console.log(`  Request body:   ${withRequestBody}`);

  console.log('\nCommand map generation complete!');
}

// Run the generator
main();
