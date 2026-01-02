#!/usr/bin/env tsx
// biome-ignore-all lint/suspicious/noAssignInExpressions: Regex exec loop is idiomatic JS
// biome-ignore-all lint/suspicious/noImplicitAnyLet: Used for regex match results
/**
 * TypeScript Query Generator
 *
 * Generates type-safe query functions from Rust endpoint definitions.
 * Each query function:
 * - Has fully typed request/response
 * - Works with both Tauri IPC and HTTP (via transport abstraction)
 * - Includes Zod validation for request types
 * - Includes comprehensive logging
 * - Follows the project's query patterns
 *
 * This generator is part of the contract-first architecture that ensures:
 * - Endpoints are defined once in Rust with metadata
 * - TypeScript query functions are auto-generated to match
 * - Frontend queries always match backend commands
 *
 * Usage: pnpm generate:queries
 *
 * @see CLAUDE.md - Type Generation Flow section
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// =============================================================================
// Configuration
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');

const ENDPOINTS_FILE = resolve(ROOT_DIR, 'crates/openflow-contracts/src/endpoints/mod.rs');
const OUTPUT_DIR = resolve(ROOT_DIR, 'packages/queries/generated');

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

interface EndpointGroup {
  domain: string;
  endpoints: Endpoint[];
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

/**
 * Group endpoints by domain (first tag)
 */
function groupEndpointsByDomain(endpoints: Endpoint[]): EndpointGroup[] {
  const groups = new Map<string, Endpoint[]>();

  for (const endpoint of endpoints) {
    // Use first tag as domain, or 'misc' if no tags
    const domain = endpoint.tags[0] || 'misc';

    if (!groups.has(domain)) {
      groups.set(domain, []);
    }
    groups.get(domain)?.push(endpoint);
  }

  // Convert to array and sort
  return Array.from(groups.entries())
    .map(([domain, endpoints]) => ({ domain, endpoints }))
    .sort((a, b) => a.domain.localeCompare(b.domain));
}

// =============================================================================
// Code Generation Helpers
// =============================================================================

/**
 * Convert snake_case to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert snake_case to PascalCase
 */
function snakeToPascal(str: string): string {
  const camel = snakeToCamel(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Convert CamelCase to camelCase (for schema names)
 */
function toLowerCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Get TypeScript type from response type string
 */
function getTypeScriptType(rustType: string): string {
  // Handle array types (e.g., "Project[]")
  if (rustType.endsWith('[]')) {
    const baseType = rustType.slice(0, -2);
    return `${baseType}[]`;
  }

  // Handle primitives
  switch (rustType) {
    case 'void':
      return 'void';
    case 'boolean':
      return 'boolean';
    case 'number':
      return 'number';
    case 'string':
      return 'string';
    default:
      return rustType;
  }
}

/**
 * Get Zod schema name from request type
 */
function getSchemaName(requestType: string): string {
  return `${toLowerCamelCase(requestType)}Schema`;
}

/**
 * Determine if a type is a primitive
 */
function isPrimitiveType(type: string): boolean {
  const primitives = ['void', 'boolean', 'number', 'string'];
  return primitives.includes(type);
}

/**
 * Extract base type from array type
 */
function getBaseType(type: string): string {
  if (type.endsWith('[]')) {
    return type.slice(0, -2);
  }
  return type;
}

// =============================================================================
// Query Function Generation
// =============================================================================

/**
 * Generate a single query function
 */
function generateQueryFunction(endpoint: Endpoint): string {
  const funcName = snakeToCamel(endpoint.command);
  const tsResponseType = getTypeScriptType(endpoint.responseType);
  const hasRequestBody = endpoint.requestType !== null;
  const hasPathParams = endpoint.pathParams.length > 0;
  const hasQueryParams = endpoint.queryParams.length > 0;

  // Build function parameters
  const params: string[] = [];

  // Add path parameters first
  for (const param of endpoint.pathParams) {
    params.push(`${snakeToCamel(param)}: string`);
  }

  // Add query parameters
  for (const param of endpoint.queryParams) {
    params.push(`${snakeToCamel(param)}?: string`);
  }

  // Add request body parameter
  if (hasRequestBody) {
    params.push(`request: ${endpoint.requestType}`);
  }

  // Build invoke arguments
  const invokeArgs: string[] = [];

  // Path params
  for (const param of endpoint.pathParams) {
    const camelParam = snakeToCamel(param);
    invokeArgs.push(`${param}: ${camelParam}`);
  }

  // Query params (only include if provided)
  for (const param of endpoint.queryParams) {
    const camelParam = snakeToCamel(param);
    invokeArgs.push(`${param}: ${camelParam}`);
  }

  // Request body
  if (hasRequestBody) {
    invokeArgs.push('request: validated');
  }

  const invokeArgsStr = invokeArgs.length > 0 ? `, { ${invokeArgs.join(', ')} }` : '';

  // Generate JSDoc
  const lines: string[] = [];
  lines.push('/**');
  lines.push(` * ${endpoint.description || endpoint.command}`);
  lines.push(' *');
  lines.push(` * @endpoint ${endpoint.method.toUpperCase()} ${endpoint.path}`);
  lines.push(` * @command ${endpoint.command}`);

  if (hasPathParams) {
    for (const param of endpoint.pathParams) {
      lines.push(` * @param ${snakeToCamel(param)} - Path parameter: ${param}`);
    }
  }

  if (hasQueryParams) {
    for (const param of endpoint.queryParams) {
      lines.push(` * @param ${snakeToCamel(param)} - Query parameter: ${param} (optional)`);
    }
  }

  if (hasRequestBody) {
    lines.push(' * @param request - Request body (validated with Zod)');
  }

  lines.push(` * @returns Promise resolving to ${tsResponseType}`);
  lines.push(' * @throws Error if validation or query fails');
  lines.push(' */');

  // Generate function signature
  const asyncKeyword = 'async';
  const returnType = `Promise<${tsResponseType}>`;
  lines.push(`export ${asyncKeyword} function ${funcName}(${params.join(', ')}): ${returnType} {`);

  // Generate function body
  const logParams: string[] = [];

  if (hasPathParams) {
    for (const param of endpoint.pathParams) {
      logParams.push(snakeToCamel(param));
    }
  }

  const logParamsStr = logParams.length > 0 ? `, { ${logParams.join(', ')} }` : '';

  lines.push(`  logger.debug('Calling ${endpoint.command}'${logParamsStr});`);
  lines.push('');
  lines.push('  try {');

  // Add validation for request body
  if (hasRequestBody) {
    const schemaName = getSchemaName(endpoint.requestType!);
    lines.push(`    const validated = ${schemaName}.parse(request);`);
  }

  // Add invoke call
  if (tsResponseType === 'void') {
    lines.push(`    await invoke<void>('${endpoint.command}'${invokeArgsStr});`);
    lines.push('');
    lines.push(`    logger.info('${endpoint.command} completed successfully');`);
  } else {
    lines.push(
      `    const result = await invoke<${tsResponseType}>('${endpoint.command}'${invokeArgsStr});`
    );
    lines.push('');

    // Add logging based on result type
    if (endpoint.responseType.endsWith('[]')) {
      lines.push(`    logger.info('${endpoint.command} completed', { count: result.length });`);
    } else if (!isPrimitiveType(tsResponseType)) {
      lines.push(
        `    logger.info('${endpoint.command} completed', { id: (result as Record<string, unknown>).id });`
      );
    } else {
      lines.push(`    logger.info('${endpoint.command} completed');`);
    }

    lines.push('');
    lines.push('    return result;');
  }

  lines.push('  } catch (error) {');
  lines.push('    const errorMessage = error instanceof Error ? error.message : String(error);');
  lines.push(`    logger.error('${endpoint.command} failed', { error: errorMessage });`);
  lines.push('    throw error;');
  lines.push('  }');
  lines.push('}');

  return lines.join('\n');
}

/**
 * Collect all types used by endpoints in a group
 */
function collectTypes(endpoints: Endpoint[]): {
  requestTypes: Set<string>;
  responseTypes: Set<string>;
  schemaNames: Set<string>;
} {
  const requestTypes = new Set<string>();
  const responseTypes = new Set<string>();
  const schemaNames = new Set<string>();

  for (const endpoint of endpoints) {
    // Collect request types
    if (endpoint.requestType) {
      requestTypes.add(endpoint.requestType);
      schemaNames.add(getSchemaName(endpoint.requestType));
    }

    // Collect response types (extract base type from arrays)
    const baseType = getBaseType(endpoint.responseType);
    if (!isPrimitiveType(baseType)) {
      responseTypes.add(baseType);
    }
  }

  return { requestTypes, responseTypes, schemaNames };
}

/**
 * Generate a query file for a domain
 */
function generateDomainFile(group: EndpointGroup): string {
  const lines: string[] = [];

  // Header
  lines.push('// =============================================================================');
  lines.push('// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY');
  lines.push('// =============================================================================');
  lines.push('//');
  lines.push('// Generated by: scripts/generate-queries.ts');
  lines.push('// Source: crates/openflow-contracts/src/endpoints/mod.rs');
  lines.push(`// Domain: ${group.domain}`);
  lines.push(`// Generated at: ${new Date().toISOString()}`);
  lines.push('//');
  lines.push(`// This file contains type-safe query functions for the ${group.domain} domain.`);
  lines.push('// Each function wraps a Tauri IPC command with validation and logging.');
  lines.push('//');
  lines.push('// To regenerate: pnpm generate:queries');
  lines.push('//');
  lines.push('// @see CLAUDE.md - Query Layer Patterns section');
  lines.push('// =============================================================================');
  lines.push('');

  // Collect types for imports
  const { requestTypes, responseTypes, schemaNames } = collectTypes(group.endpoints);

  // Generate imports
  const allTypes = new Set([...requestTypes, ...responseTypes]);

  if (allTypes.size > 0) {
    const sortedTypes = Array.from(allTypes).sort();
    lines.push(`import type { ${sortedTypes.join(', ')} } from '@openflow/generated';`);
  }

  if (schemaNames.size > 0) {
    const sortedSchemas = Array.from(schemaNames).sort();
    lines.push(`import { ${sortedSchemas.join(', ')} } from '@openflow/validation';`);
  }

  lines.push(`import { createLogger } from '@openflow/utils';`);
  lines.push(`import { invoke } from '../utils.js';`);
  lines.push('');

  // Logger
  lines.push(`const logger = createLogger('queries:${group.domain}:generated');`);
  lines.push('');

  // Generate functions
  for (const endpoint of group.endpoints.sort((a, b) => a.command.localeCompare(b.command))) {
    lines.push(generateQueryFunction(endpoint));
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate the index file that re-exports all domains
 */
function generateIndexFile(groups: EndpointGroup[]): string {
  const lines: string[] = [];

  lines.push('// =============================================================================');
  lines.push('// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY');
  lines.push('// =============================================================================');
  lines.push('//');
  lines.push('// Generated by: scripts/generate-queries.ts');
  lines.push(`// Generated at: ${new Date().toISOString()}`);
  lines.push('//');
  lines.push('// Re-exports all generated query functions by domain.');
  lines.push('//');
  lines.push('// To regenerate: pnpm generate:queries');
  lines.push('// =============================================================================');
  lines.push('');

  for (const group of groups.sort((a, b) => a.domain.localeCompare(b.domain))) {
    lines.push(`export * from './${group.domain}.js';`);
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Generate the command map for HTTP transport
 */
function generateCommandMap(endpoints: Endpoint[]): string {
  const lines: string[] = [];

  lines.push('// =============================================================================');
  lines.push('// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY');
  lines.push('// =============================================================================');
  lines.push('//');
  lines.push('// Generated by: scripts/generate-queries.ts');
  lines.push('// Source: crates/openflow-contracts/src/endpoints/mod.rs');
  lines.push(`// Generated at: ${new Date().toISOString()}`);
  lines.push('//');
  lines.push('// Maps Tauri command names to HTTP endpoints for the HTTP transport.');
  lines.push('// Used when running in browser mode without Tauri.');
  lines.push('//');
  lines.push('// To regenerate: pnpm generate:queries');
  lines.push('// =============================================================================');
  lines.push('');

  lines.push('export interface EndpointMapping {');
  lines.push(`  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';`);
  lines.push('  path: string;');
  lines.push('  pathParams: string[];');
  lines.push('  queryParams: string[];');
  lines.push('  hasRequestBody: boolean;');
  lines.push('}');
  lines.push('');

  lines.push('/**');
  lines.push(' * Mapping from Tauri command names to HTTP endpoint metadata.');
  lines.push(' * Used by the HTTP transport to convert IPC calls to REST requests.');
  lines.push(' */');
  lines.push('export const COMMAND_MAP: Record<string, EndpointMapping> = {');

  for (const endpoint of endpoints.sort((a, b) => a.command.localeCompare(b.command))) {
    const pathParamsStr =
      endpoint.pathParams.length > 0
        ? `[${endpoint.pathParams.map((p) => `'${p}'`).join(', ')}]`
        : '[]';

    const queryParamsStr =
      endpoint.queryParams.length > 0
        ? `[${endpoint.queryParams.map((p) => `'${p}'`).join(', ')}]`
        : '[]';

    lines.push(`  '${endpoint.command}': {`);
    lines.push(`    method: '${endpoint.method}',`);
    lines.push(`    path: '${endpoint.path}',`);
    lines.push(`    pathParams: ${pathParamsStr},`);
    lines.push(`    queryParams: ${queryParamsStr},`);
    lines.push(`    hasRequestBody: ${endpoint.requestType !== null},`);
    lines.push('  },');
  }

  lines.push('};');
  lines.push('');

  // Add helper functions
  lines.push('/**');
  lines.push(' * Build the URL path with parameter substitution.');
  lines.push(' * @param command - Tauri command name');
  lines.push(' * @param args - Arguments containing path parameter values');
  lines.push(' * @returns The fully resolved URL path');
  lines.push(' */');
  lines.push(
    'export function buildPath(command: string, args: Record<string, unknown> = {}): string {'
  );
  lines.push('  const mapping = COMMAND_MAP[command];');
  lines.push('  if (!mapping) {');
  lines.push('    throw new Error(`Unknown command: ${command}`);');
  lines.push('  }');
  lines.push('');
  lines.push('  let path = mapping.path;');
  lines.push('');
  lines.push('  // Substitute path parameters');
  lines.push('  for (const param of mapping.pathParams) {');
  lines.push('    const value = args[param];');
  lines.push('    if (value !== undefined) {');
  lines.push('      path = path.replace(`:${param}`, encodeURIComponent(String(value)));');
  lines.push('    }');
  lines.push('  }');
  lines.push('');
  lines.push('  // Add query parameters');
  lines.push('  const queryParts: string[] = [];');
  lines.push('  for (const param of mapping.queryParams) {');
  lines.push('    const value = args[param];');
  lines.push('    if (value !== undefined) {');
  lines.push('      queryParts.push(`${param}=${encodeURIComponent(String(value))}`);');
  lines.push('    }');
  lines.push('  }');
  lines.push('');
  lines.push('  if (queryParts.length > 0) {');
  lines.push(`    path += '?' + queryParts.join('&');`);
  lines.push('  }');
  lines.push('');
  lines.push('  return path;');
  lines.push('}');
  lines.push('');

  lines.push('/**');
  lines.push(' * Get the request body from arguments, excluding path/query params.');
  lines.push(' * @param command - Tauri command name');
  lines.push(' * @param args - All arguments');
  lines.push(' * @returns The request body object or undefined');
  lines.push(' */');
  lines.push(
    'export function getRequestBody(command: string, args: Record<string, unknown> = {}): unknown | undefined {'
  );
  lines.push('  const mapping = COMMAND_MAP[command];');
  lines.push('  if (!mapping || !mapping.hasRequestBody) {');
  lines.push('    return undefined;');
  lines.push('  }');
  lines.push('');
  lines.push(`  // The request body is typically in a 'request' field`);
  lines.push(`  if ('request' in args) {`);
  lines.push('    return args.request;');
  lines.push('  }');
  lines.push('');
  lines.push('  // Otherwise, return args minus path/query params');
  lines.push('  const body: Record<string, unknown> = {};');
  lines.push('  const excludeKeys = new Set([...mapping.pathParams, ...mapping.queryParams]);');
  lines.push('');
  lines.push('  for (const [key, value] of Object.entries(args)) {');
  lines.push('    if (!excludeKeys.has(key)) {');
  lines.push('      body[key] = value;');
  lines.push('    }');
  lines.push('  }');
  lines.push('');
  lines.push('  return Object.keys(body).length > 0 ? body : undefined;');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

// =============================================================================
// Main Execution
// =============================================================================

function main(): void {
  console.log('🔧 Generating TypeScript query functions from Rust endpoints...\n');

  // Check if endpoints file exists
  if (!existsSync(ENDPOINTS_FILE)) {
    console.error(`❌ Endpoints file not found: ${ENDPOINTS_FILE}`);
    process.exit(1);
  }

  // Parse endpoints
  const endpoints = parseEndpointsFile();
  console.log(`📁 Parsed ${endpoints.length} endpoints`);

  if (endpoints.length === 0) {
    console.log('⚠️  No endpoints found');
    process.exit(0);
  }

  // Group by domain
  const groups = groupEndpointsByDomain(endpoints);
  console.log(`📦 Grouped into ${groups.length} domains:`);
  for (const group of groups) {
    console.log(`   - ${group.domain}: ${group.endpoints.length} endpoints`);
  }

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate domain files
  for (const group of groups) {
    const content = generateDomainFile(group);
    const filePath = join(OUTPUT_DIR, `${group.domain}.ts`);
    writeFileSync(filePath, content);
    console.log(`   ✅ Generated ${relative(ROOT_DIR, filePath)}`);
  }

  // Generate index file
  const indexContent = generateIndexFile(groups);
  const indexPath = join(OUTPUT_DIR, 'index.ts');
  writeFileSync(indexPath, indexContent);
  console.log(`   ✅ Generated ${relative(ROOT_DIR, indexPath)}`);

  // Generate command map
  const commandMapContent = generateCommandMap(endpoints);
  const commandMapPath = join(OUTPUT_DIR, 'command-map.ts');
  writeFileSync(commandMapPath, commandMapContent);
  console.log(`   ✅ Generated ${relative(ROOT_DIR, commandMapPath)}`);

  console.log('\n✅ Query generation complete!');
  console.log(`   Total endpoints: ${endpoints.length}`);
  console.log(`   Total files: ${groups.length + 2}`);
}

// Run the generator
main();
