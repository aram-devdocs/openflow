// biome-ignore-all lint/suspicious/noAssignInExpressions: Regex exec loop is idiomatic JS
// biome-ignore-all lint/suspicious/noImplicitAnyLet: Used for regex match results
/**
 * Contract Validation Script
 *
 * Validates that all contracts are in sync:
 * - Every Rust type with @validate has a corresponding Zod schema
 * - Every endpoint has a generated query function
 * - Command-to-endpoint mapping is complete
 * - Generated files match their sources
 *
 * Run: pnpm validate:contracts
 * Run with report: pnpm validate:contracts --report
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { globSync } from 'glob';

import { ROOT_DIR } from './lib/config';
import { Reporter, parseValidatorArgs } from './lib/reporter';
import type { Violation } from './lib/types';

// =============================================================================
// Types
// =============================================================================

interface RustType {
  name: string;
  file: string;
  hasValidation: boolean;
  isRequest: boolean;
  isEnum: boolean;
}

interface Endpoint {
  command: string;
  method: string;
  path: string;
  requestType: string | null;
  responseType: string;
}

interface GeneratedFile {
  path: string;
  type: 'zod' | 'queries' | 'command-map';
  timestamp?: Date;
}

// =============================================================================
// Parsing Functions
// =============================================================================

/**
 * Extract Rust types from contract files
 */
function extractRustTypes(contractsDir: string): RustType[] {
  const types: RustType[] = [];
  const files = globSync('**/*.rs', { cwd: contractsDir });

  for (const file of files) {
    const fullPath = resolve(contractsDir, file);
    const content = readFileSync(fullPath, 'utf-8');

    // Match struct definitions with #[typeshare]
    const structRegex =
      /(?:\/\/\/[^\n]*\n)*\s*#\[typeshare\]\s*(?:#\[[^\]]+\]\s*)*pub\s+struct\s+(\w+)/g;
    let match;
    while ((match = structRegex.exec(content)) !== null) {
      const typeName = match[1];
      const docBlock = content.slice(Math.max(0, match.index - 500), match.index);
      const hasValidation = docBlock.includes('@validate');
      const isRequest = typeName.endsWith('Request');

      types.push({
        name: typeName,
        file,
        hasValidation,
        isRequest,
        isEnum: false,
      });
    }

    // Match enum definitions with #[typeshare]
    const enumRegex =
      /(?:\/\/\/[^\n]*\n)*\s*#\[typeshare\]\s*(?:#\[[^\]]+\]\s*)*pub\s+enum\s+(\w+)/g;
    while ((match = enumRegex.exec(content)) !== null) {
      const typeName = match[1];

      types.push({
        name: typeName,
        file,
        hasValidation: false,
        isRequest: false,
        isEnum: true,
      });
    }
  }

  return types;
}

/**
 * Extract endpoint definitions from Rust
 */
function extractEndpoints(contractsDir: string): Endpoint[] {
  const endpoints: Endpoint[] = [];
  const endpointFile = resolve(contractsDir, 'src/endpoints/mod.rs');

  if (!existsSync(endpointFile)) {
    return endpoints;
  }

  const content = readFileSync(endpointFile, 'utf-8');

  // Parse ENDPOINTS array
  const endpointRegex = /Endpoint\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/gs;
  let match;

  while ((match = endpointRegex.exec(content)) !== null) {
    const block = match[1];

    const getField = (name: string): string | null => {
      const patterns = [
        new RegExp(`${name}:\\s*Some\\("([^"]+)"\\)`),
        new RegExp(`${name}:\\s*"([^"]+)"`),
        new RegExp(`${name}:\\s*HttpMethod::(\\w+)`),
      ];

      for (const pattern of patterns) {
        const fieldMatch = block.match(pattern);
        if (fieldMatch) {
          return fieldMatch[1].trim();
        }
      }
      return null;
    };

    const command = getField('command');
    const method = getField('method');
    const path = getField('path');
    const requestType = getField('request_type');
    const responseType = getField('response_type');

    if (command && method && path && responseType) {
      endpoints.push({
        command,
        method: method.toLowerCase(),
        path,
        requestType,
        responseType,
      });
    }
  }

  return endpoints;
}

/**
 * Extract schema names from generated Zod file
 */
function extractZodSchemas(zodFile: string): Set<string> {
  const schemas = new Set<string>();

  if (!existsSync(zodFile)) {
    return schemas;
  }

  const content = readFileSync(zodFile, 'utf-8');

  // Match schema exports: export const fooBarSchema = z.object
  const schemaRegex = /export\s+const\s+(\w+Schema)\s*=/g;
  let match;

  while ((match = schemaRegex.exec(content)) !== null) {
    // Convert schema name to type name: fooBarSchema -> FooBar
    const schemaName = match[1];
    const typeName = schemaName.replace(/Schema$/, '').replace(/^./, (c) => c.toUpperCase());
    schemas.add(typeName);
  }

  return schemas;
}

/**
 * Extract query function names from generated queries
 */
function extractQueryFunctions(queriesDir: string): Set<string> {
  const functions = new Set<string>();

  if (!existsSync(queriesDir)) {
    return functions;
  }

  const files = globSync('*.ts', { cwd: queriesDir });

  for (const file of files) {
    if (file === 'index.ts' || file === 'command-map.ts') continue;

    const fullPath = resolve(queriesDir, file);
    const content = readFileSync(fullPath, 'utf-8');

    // Match function exports: export async function fooBar
    const funcRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
    let match;

    while ((match = funcRegex.exec(content)) !== null) {
      functions.add(match[1]);
    }
  }

  return functions;
}

/**
 * Extract commands from command map
 */
function extractCommandMapCommands(commandMapFile: string): Set<string> {
  const commands = new Set<string>();

  if (!existsSync(commandMapFile)) {
    return commands;
  }

  const content = readFileSync(commandMapFile, 'utf-8');

  // Match command keys: 'command_name': {
  const cmdRegex = /'(\w+)':\s*\{/g;
  let match;

  while ((match = cmdRegex.exec(content)) !== null) {
    commands.add(match[1]);
  }

  return commands;
}

/**
 * Check if a generated file is stale compared to source
 */
function isFileStale(generatedPath: string, sourcePaths: string[]): boolean {
  if (!existsSync(generatedPath)) {
    return true;
  }

  const generatedStat = statSync(generatedPath);
  const generatedTime = generatedStat.mtime.getTime();

  for (const sourcePath of sourcePaths) {
    if (!existsSync(sourcePath)) continue;
    const sourceStat = statSync(sourcePath);
    if (sourceStat.mtime.getTime() > generatedTime) {
      return true;
    }
  }

  return false;
}

// =============================================================================
// Validation Functions
// =============================================================================

interface ValidationResult {
  violations: Violation[];
  stats: {
    rustTypes: number;
    zodSchemas: number;
    endpoints: number;
    queryFunctions: number;
    commandMapEntries: number;
  };
}

function validate(verbose = false): ValidationResult {
  const violations: Violation[] = [];
  const contractsDir = resolve(ROOT_DIR, 'crates/openflow-contracts');
  const zodFile = resolve(ROOT_DIR, 'packages/validation/schemas-generated.ts');
  const queriesDir = resolve(ROOT_DIR, 'packages/queries/generated');
  const commandMapFile = resolve(queriesDir, 'command-map.ts');

  // Check if contracts directory exists
  if (!existsSync(contractsDir)) {
    violations.push({
      file: 'crates/openflow-contracts',
      rule: 'contracts/missing-contracts-crate',
      message: 'Contracts crate not found',
      severity: 'error',
      suggestion: 'Create the openflow-contracts crate with type definitions',
    });
    return {
      violations,
      stats: {
        rustTypes: 0,
        zodSchemas: 0,
        endpoints: 0,
        queryFunctions: 0,
        commandMapEntries: 0,
      },
    };
  }

  // Extract all data
  const rustTypes = extractRustTypes(resolve(contractsDir, 'src'));
  const endpoints = extractEndpoints(contractsDir);
  const zodSchemas = extractZodSchemas(zodFile);
  const queryFunctions = extractQueryFunctions(queriesDir);
  const commandMapCommands = extractCommandMapCommands(commandMapFile);

  if (verbose) {
    console.log(`Found ${rustTypes.length} Rust types`);
    console.log(`Found ${endpoints.length} endpoints`);
    console.log(`Found ${zodSchemas.size} Zod schemas`);
    console.log(`Found ${queryFunctions.size} query functions`);
    console.log(`Found ${commandMapCommands.size} command map entries`);
  }

  // ==========================================================================
  // Check 1: Request types with validation should have Zod schemas
  // ==========================================================================
  const requestTypes = rustTypes.filter((t) => t.isRequest || t.hasValidation);

  for (const type of requestTypes) {
    // Convert to schema name format (camelCase)
    const schemaTypeName = type.name;

    // Check if schema exists (schemas use camelCase: CreateProjectRequest -> createProjectRequest)
    const hasSchema = Array.from(zodSchemas).some(
      (s) => s.toLowerCase() === schemaTypeName.toLowerCase()
    );

    if (!hasSchema) {
      violations.push({
        file: `crates/openflow-contracts/src/${type.file}`,
        rule: 'contracts/missing-zod-schema',
        message: `Type "${type.name}" has validation but no Zod schema`,
        severity: type.isRequest ? 'error' : 'warning',
        suggestion: `Run 'pnpm generate:zod' to generate missing schema`,
      });
    }
  }

  // ==========================================================================
  // Check 2: Endpoints should have query functions
  // ==========================================================================
  for (const endpoint of endpoints) {
    // Convert command to camelCase function name: create_project -> createProject
    const funcName = endpoint.command.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

    if (!queryFunctions.has(funcName)) {
      violations.push({
        file: 'packages/queries/generated',
        rule: 'contracts/missing-query-function',
        message: `Endpoint "${endpoint.command}" has no generated query function`,
        severity: 'error',
        suggestion: `Run 'pnpm generate:queries' to generate missing function`,
      });
    }
  }

  // ==========================================================================
  // Check 3: Endpoints should be in command map
  // ==========================================================================
  for (const endpoint of endpoints) {
    if (!commandMapCommands.has(endpoint.command)) {
      violations.push({
        file: 'packages/queries/generated/command-map.ts',
        rule: 'contracts/missing-command-mapping',
        message: `Endpoint "${endpoint.command}" not in command map`,
        severity: 'error',
        suggestion: `Run 'pnpm generate:command-map' to generate missing mapping`,
      });
    }
  }

  // ==========================================================================
  // Check 4: Command map entries should have matching endpoints
  // ==========================================================================
  const endpointCommands = new Set(endpoints.map((e) => e.command));

  for (const command of commandMapCommands) {
    if (!endpointCommands.has(command)) {
      violations.push({
        file: 'packages/queries/generated/command-map.ts',
        rule: 'contracts/orphan-command-mapping',
        message: `Command map entry "${command}" has no matching endpoint`,
        severity: 'warning',
        suggestion: 'Remove orphan entry or add missing endpoint definition',
      });
    }
  }

  // ==========================================================================
  // Check 5: Generated files should not be stale
  // ==========================================================================
  const rustSourceFiles = globSync('**/*.rs', {
    cwd: resolve(contractsDir, 'src'),
    absolute: true,
  });

  // Check Zod file staleness
  if (existsSync(zodFile)) {
    if (isFileStale(zodFile, rustSourceFiles)) {
      violations.push({
        file: 'packages/validation/schemas-generated.ts',
        rule: 'contracts/stale-zod-schemas',
        message: 'Zod schemas may be stale (source modified after generation)',
        severity: 'warning',
        suggestion: `Run 'pnpm generate:zod' to regenerate`,
      });
    }
  } else {
    violations.push({
      file: 'packages/validation/schemas-generated.ts',
      rule: 'contracts/missing-generated-file',
      message: 'Generated Zod schemas file not found',
      severity: 'error',
      suggestion: `Run 'pnpm generate:zod' to generate`,
    });
  }

  // Check queries staleness
  const indexFile = resolve(queriesDir, 'index.ts');
  if (existsSync(indexFile)) {
    if (isFileStale(indexFile, rustSourceFiles)) {
      violations.push({
        file: 'packages/queries/generated/index.ts',
        rule: 'contracts/stale-query-functions',
        message: 'Query functions may be stale (source modified after generation)',
        severity: 'warning',
        suggestion: `Run 'pnpm generate:queries' to regenerate`,
      });
    }
  } else {
    violations.push({
      file: 'packages/queries/generated/index.ts',
      rule: 'contracts/missing-generated-file',
      message: 'Generated queries index file not found',
      severity: 'error',
      suggestion: `Run 'pnpm generate:queries' to generate`,
    });
  }

  // Check command map staleness
  if (existsSync(commandMapFile)) {
    if (isFileStale(commandMapFile, rustSourceFiles)) {
      violations.push({
        file: 'packages/queries/generated/command-map.ts',
        rule: 'contracts/stale-command-map',
        message: 'Command map may be stale (source modified after generation)',
        severity: 'warning',
        suggestion: `Run 'pnpm generate:command-map' to regenerate`,
      });
    }
  } else {
    violations.push({
      file: 'packages/queries/generated/command-map.ts',
      rule: 'contracts/missing-generated-file',
      message: 'Generated command map file not found',
      severity: 'error',
      suggestion: `Run 'pnpm generate:command-map' to generate`,
    });
  }

  return {
    violations,
    stats: {
      rustTypes: rustTypes.length,
      zodSchemas: zodSchemas.size,
      endpoints: endpoints.length,
      queryFunctions: queryFunctions.size,
      commandMapEntries: commandMapCommands.size,
    },
  };
}

// =============================================================================
// Main Entry Point
// =============================================================================

function main(): void {
  const args = parseValidatorArgs();

  if (args.help) {
    console.log(`
Contract Validator

Usage: pnpm validate:contracts [options]

Options:
  --report, -r    Generate JSON report in reports/contracts.json
  --verbose, -v   Show detailed output including file processing
  --help, -h      Show this help message

Description:
  Validates that all API contracts are in sync between:
  - Rust contract types (crates/openflow-contracts)
  - Generated Zod schemas (packages/validation/schemas-generated.ts)
  - Generated query functions (packages/queries/generated/*.ts)
  - Command-to-endpoint mapping (packages/queries/generated/command-map.ts)

Checks:
  1. Request types with @validate annotations have Zod schemas
  2. Every endpoint has a generated query function
  3. Every endpoint is in the command map
  4. No orphan entries in command map
  5. Generated files are not stale

Regenerate commands:
  pnpm generate:zod         - Regenerate Zod schemas
  pnpm generate:queries     - Regenerate query functions
  pnpm generate:command-map - Regenerate command map
  pnpm generate:all         - Regenerate everything
`);
    process.exit(0);
  }

  const reporter = new Reporter('contracts', {
    json: false,
    verbose: args.verbose,
    reportDir: 'reports',
  });

  // Print header
  reporter.printHeader();

  // Run validation
  const result = validate(args.verbose);

  // Add violations to reporter
  reporter.addViolations(result.violations);

  // Add metadata
  reporter.setMetadata({
    rustTypes: result.stats.rustTypes,
    zodSchemas: result.stats.zodSchemas,
    endpoints: result.stats.endpoints,
    queryFunctions: result.stats.queryFunctions,
    commandMapEntries: result.stats.commandMapEntries,
  });

  // Print summary
  reporter.printSummary();

  // Write JSON report if requested
  if (args.report) {
    reporter.writeReport();
  }

  // Exit with appropriate code
  process.exit(reporter.getExitCode());
}

// Run main
main();
