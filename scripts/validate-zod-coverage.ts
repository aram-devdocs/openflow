/**
 * Zod Schema Coverage Validator (FR-4)
 *
 * Ensures that types used in the query layer have corresponding Zod validation schemas.
 * This validator analyzes:
 * - Types imported from @openflow/generated in query files
 * - Zod schemas defined in @openflow/validation
 * - Cross-references to identify missing schemas and unused schemas
 *
 * Run: pnpm validate:zod
 * Run with report: pnpm validate:zod --report
 */

import { readFileSync } from 'node:fs';
import { globSync } from 'glob';
import * as ts from 'typescript';

import { PACKAGE_PATHS, ROOT_DIR, ZOD_COVERAGE_CONFIG } from './lib/config';
import { analyzeImports } from './lib/import-analyzer';
import { Reporter, parseValidatorArgs } from './lib/reporter';
import type { Severity, Violation } from './lib/types';

// =============================================================================
// Types
// =============================================================================

interface ZodRule {
  ruleId: string;
  description: string;
  severity: Severity;
}

interface TypeUsage {
  typeName: string;
  file: string;
  line: number;
  isInput: boolean; // true if used as input parameter, false if output
}

interface SchemaInfo {
  schemaName: string;
  correspondingTypeName: string;
  file: string;
  line: number;
  isUsed: boolean;
}

interface CoverageResult {
  typesUsedInQueries: TypeUsage[];
  schemasDefinedInValidation: SchemaInfo[];
  missingInputSchemas: TypeUsage[];
  missingOutputSchemas: TypeUsage[];
  unusedSchemas: SchemaInfo[];
}

// =============================================================================
// Zod Coverage Rules
// =============================================================================

const _RULES: ZodRule[] = [
  {
    ruleId: 'zod/missing-input-schema',
    description: 'Input type used in query lacks Zod schema',
    severity: 'error',
  },
  {
    ruleId: 'zod/missing-output-schema',
    description: 'Output type used in query lacks Zod schema',
    severity: 'error',
  },
  {
    ruleId: 'zod/unused-schema',
    description: 'Zod schema is defined but never used',
    severity: 'warning',
  },
];

// =============================================================================
// Schema Name Mapping
// =============================================================================

/**
 * Convert a schema name to its corresponding type name
 * e.g., createProjectSchema -> CreateProjectRequest
 *       taskStatusSchema -> TaskStatus
 */
function schemaNameToTypeName(schemaName: string): string {
  // Remove 'Schema' suffix
  const baseName = schemaName.replace(/Schema$/, '');

  // Convert from camelCase to PascalCase
  const pascalCase = baseName.charAt(0).toUpperCase() + baseName.slice(1);

  // Handle common patterns
  // createFooSchema -> CreateFooRequest
  if (baseName.startsWith('create')) {
    return `${pascalCase.replace(/^Create/, 'Create')}Request`;
  }

  // updateFooSchema -> UpdateFooRequest
  if (baseName.startsWith('update')) {
    return `${pascalCase.replace(/^Update/, 'Update')}Request`;
  }

  // searchQuerySchema -> SearchQuery (but often used for input validation)
  if (baseName.endsWith('Query')) {
    return pascalCase;
  }

  // setFooSchema -> SetFooRequest
  if (baseName.startsWith('set')) {
    return `${pascalCase.replace(/^Set/, 'Set')}Request`;
  }

  // Enum schemas: taskStatusSchema -> TaskStatus
  return pascalCase;
}

/**
 * Convert a type name to expected schema name
 * e.g., CreateProjectRequest -> createProjectSchema
 *       TaskStatus -> taskStatusSchema
 */
function typeNameToSchemaName(typeName: string): string {
  // Handle Request types: CreateProjectRequest -> createProjectSchema
  if (typeName.endsWith('Request')) {
    const baseName = typeName.replace(/Request$/, '');
    const camelCase = baseName.charAt(0).toLowerCase() + baseName.slice(1);
    return `${camelCase}Schema`;
  }

  // Handle regular types: TaskStatus -> taskStatusSchema
  const camelCase = typeName.charAt(0).toLowerCase() + typeName.slice(1);
  return `${camelCase}Schema`;
}

// =============================================================================
// Type Usage Analysis
// =============================================================================

/**
 * Extract types used in query files from @openflow/generated
 */
function extractTypesUsedInQueries(verbose = false): TypeUsage[] {
  const typesUsed: TypeUsage[] = [];
  const pattern = `${PACKAGE_PATHS.QUERIES}/**/*.ts`;

  const files = globSync(pattern, {
    cwd: ROOT_DIR,
    ignore: [
      '**/node_modules/**',
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/*.d.ts',
      `${PACKAGE_PATHS.QUERIES}/index.ts`,
    ],
  });

  for (const file of files) {
    const fullPath = `${ROOT_DIR}/${file}`;

    try {
      // Get imports from this file
      const imports = analyzeImports(fullPath);

      // Find imports from @openflow/generated
      const generatedImports = imports.filter(
        (imp) =>
          imp.source === '@openflow/generated' || imp.source.startsWith('@openflow/generated/')
      );

      for (const genImport of generatedImports) {
        // Only count type imports (these are the types from generated)
        if (genImport.isTypeOnly || genImport.specifiers.length > 0) {
          for (const specifier of genImport.specifiers) {
            // Determine if this is an input type (Request suffix) or output type
            const isInput = specifier.endsWith('Request');

            typesUsed.push({
              typeName: specifier,
              file,
              line: genImport.line,
              isInput,
            });

            if (verbose) {
              console.log(
                `    Found type ${specifier} (${isInput ? 'input' : 'output'}) in ${file}:${genImport.line}`
              );
            }
          }
        }
      }
    } catch (error) {
      if (verbose) {
        console.error(`Error analyzing file ${file}:`, error);
      }
    }
  }

  return typesUsed;
}

// =============================================================================
// Schema Definition Analysis
// =============================================================================

/**
 * Extract Zod schemas defined in validation package
 */
function extractDefinedSchemas(verbose = false): SchemaInfo[] {
  const schemas: SchemaInfo[] = [];
  const pattern = `${PACKAGE_PATHS.VALIDATION}/**/*.ts`;

  const files = globSync(pattern, {
    cwd: ROOT_DIR,
    ignore: [
      '**/node_modules/**',
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/*.d.ts',
      `${PACKAGE_PATHS.VALIDATION}/index.ts`,
    ],
  });

  for (const file of files) {
    const fullPath = `${ROOT_DIR}/${file}`;

    try {
      const content = readFileSync(fullPath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        fullPath,
        content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS
      );

      // Find exported const declarations that end with 'Schema'
      function visit(node: ts.Node): void {
        if (ts.isVariableStatement(node)) {
          // Check for export modifier
          const hasExport = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

          if (hasExport) {
            for (const decl of node.declarationList.declarations) {
              if (ts.isIdentifier(decl.name)) {
                const name = decl.name.text;
                if (name.endsWith('Schema')) {
                  const { line } = sourceFile.getLineAndCharacterOfPosition(
                    node.getStart(sourceFile)
                  );

                  const correspondingTypeName = schemaNameToTypeName(name);

                  schemas.push({
                    schemaName: name,
                    correspondingTypeName,
                    file,
                    line: line + 1,
                    isUsed: false, // Will be determined later
                  });

                  if (verbose) {
                    console.log(
                      `    Found schema ${name} -> ${correspondingTypeName} in ${file}:${line + 1}`
                    );
                  }
                }
              }
            }
          }
        }

        ts.forEachChild(node, visit);
      }

      visit(sourceFile);
    } catch (error) {
      if (verbose) {
        console.error(`Error analyzing file ${file}:`, error);
      }
    }
  }

  return schemas;
}

// =============================================================================
// Schema Usage Analysis
// =============================================================================

/**
 * Check if schemas are used in the codebase
 */
function findSchemaUsage(schemas: SchemaInfo[], verbose = false): void {
  // Search in routes, hooks, and query files for schema usage
  const patterns = [
    'src/routes/**/*.{ts,tsx}',
    `${PACKAGE_PATHS.HOOKS}/**/*.ts`,
    `${PACKAGE_PATHS.QUERIES}/**/*.ts`,
  ];

  const allFiles: string[] = [];
  for (const pattern of patterns) {
    const files = globSync(pattern, {
      cwd: ROOT_DIR,
      ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.spec.ts'],
    });
    allFiles.push(...files);
  }

  // Build a map of schema names
  const schemaNameSet = new Set(schemas.map((s) => s.schemaName));

  for (const file of allFiles) {
    const fullPath = `${ROOT_DIR}/${file}`;

    try {
      const imports = analyzeImports(fullPath);

      // Check for @openflow/validation imports
      const validationImports = imports.filter(
        (imp) =>
          imp.source === '@openflow/validation' || imp.source.startsWith('@openflow/validation/')
      );

      for (const valImport of validationImports) {
        for (const specifier of valImport.specifiers) {
          if (schemaNameSet.has(specifier)) {
            // Mark this schema as used
            const schema = schemas.find((s) => s.schemaName === specifier);
            if (schema) {
              schema.isUsed = true;
              if (verbose) {
                console.log(`    Schema ${specifier} used in ${file}`);
              }
            }
          }
        }
      }
    } catch {
      // Ignore errors when scanning for usage
    }
  }
}

// =============================================================================
// Coverage Analysis
// =============================================================================

/**
 * Analyze Zod schema coverage
 */
function analyzeCoverage(verbose = false): CoverageResult {
  if (verbose) {
    console.log('\n  Analyzing types used in queries...');
  }
  const typesUsedInQueries = extractTypesUsedInQueries(verbose);

  if (verbose) {
    console.log('\n  Analyzing schemas defined in validation...');
  }
  const schemasDefinedInValidation = extractDefinedSchemas(verbose);

  if (verbose) {
    console.log('\n  Checking schema usage...');
  }
  findSchemaUsage(schemasDefinedInValidation, verbose);

  // Build set of type names that have schemas
  const typesWithSchemas = new Set(schemasDefinedInValidation.map((s) => s.correspondingTypeName));

  // Find types without schemas
  // Deduplicate types by name
  const uniqueTypes = new Map<string, TypeUsage>();
  for (const typeUsage of typesUsedInQueries) {
    // Keep the first occurrence of each type
    if (!uniqueTypes.has(typeUsage.typeName)) {
      uniqueTypes.set(typeUsage.typeName, typeUsage);
    }
  }

  const missingInputSchemas: TypeUsage[] = [];
  const missingOutputSchemas: TypeUsage[] = [];

  for (const typeUsage of uniqueTypes.values()) {
    // Skip common types that don't need schemas (primitives, arrays, etc.)
    if (isCommonType(typeUsage.typeName)) {
      continue;
    }

    if (!typesWithSchemas.has(typeUsage.typeName)) {
      if (typeUsage.isInput) {
        missingInputSchemas.push(typeUsage);
      } else {
        missingOutputSchemas.push(typeUsage);
      }
    }
  }

  // Find unused schemas
  const unusedSchemas = schemasDefinedInValidation.filter((s) => !s.isUsed);

  return {
    typesUsedInQueries: [...uniqueTypes.values()],
    schemasDefinedInValidation,
    missingInputSchemas,
    missingOutputSchemas,
    unusedSchemas,
  };
}

/**
 * Check if a type is a common type that doesn't need a schema
 */
function isCommonType(typeName: string): boolean {
  const commonTypes = [
    'string',
    'number',
    'boolean',
    'void',
    'null',
    'undefined',
    'any',
    'unknown',
    'never',
    'object',
    'Promise',
    'Array',
    // Common return types that are output-only
    'Project',
    'Task',
    'Chat',
    'Message',
    'ExecutionProcess',
    'ExecutorProfile',
    'TaskWithChats',
    'ChatWithMessages',
    'ProcessOutput',
    'Setting',
    'SearchResult',
    'GitStatus',
    'GitBranch',
    'Workflow',
    'WorkflowStep',
    'ArtifactFile',
  ];

  return commonTypes.includes(typeName);
}

// =============================================================================
// Code Snippet
// =============================================================================

/**
 * Get a code snippet from a file at a specific line
 */
function getCodeSnippetAtLine(filePath: string, lineNumber: number): string | undefined {
  try {
    const content = readFileSync(`${ROOT_DIR}/${filePath}`, 'utf-8');
    const lines = content.split('\n');
    if (lineNumber > 0 && lineNumber <= lines.length) {
      return lines[lineNumber - 1].trim();
    }
  } catch {
    // Ignore errors
  }
  return undefined;
}

// =============================================================================
// Validation
// =============================================================================

interface ValidationResult {
  violations: Violation[];
  coverage: CoverageResult;
  totalTypes: number;
  typesWithSchemas: number;
  coveragePercent: number;
}

function validate(verbose = false): ValidationResult {
  const violations: Violation[] = [];
  const coverage = analyzeCoverage(verbose);

  // Calculate coverage stats
  const inputTypes = coverage.typesUsedInQueries.filter((t) => t.isInput);
  const totalTypes = inputTypes.length;
  const typesWithSchemas = totalTypes - coverage.missingInputSchemas.length;
  const coveragePercent = totalTypes > 0 ? Math.round((typesWithSchemas / totalTypes) * 100) : 100;

  // Rule: zod/missing-input-schema
  for (const typeUsage of coverage.missingInputSchemas) {
    const expectedSchema = typeNameToSchemaName(typeUsage.typeName);
    const snippet = getCodeSnippetAtLine(typeUsage.file, typeUsage.line);

    violations.push({
      file: typeUsage.file,
      line: typeUsage.line,
      column: 1,
      rule: 'zod/missing-input-schema',
      message: `Input type "${typeUsage.typeName}" is used in query but has no Zod validation schema`,
      severity: 'error',
      suggestion: `Create ${expectedSchema} in packages/validation/schemas.ts`,
      snippet,
      metadata: {
        typeName: typeUsage.typeName,
        expectedSchema,
      },
    });
  }

  // Rule: zod/missing-output-schema (warning only)
  for (const typeUsage of coverage.missingOutputSchemas) {
    const expectedSchema = typeNameToSchemaName(typeUsage.typeName);
    const snippet = getCodeSnippetAtLine(typeUsage.file, typeUsage.line);

    violations.push({
      file: typeUsage.file,
      line: typeUsage.line,
      column: 1,
      rule: 'zod/missing-output-schema',
      message: `Output type "${typeUsage.typeName}" is used in query but has no Zod validation schema`,
      severity: 'error',
      suggestion: `Create ${expectedSchema} in packages/validation/schemas.ts for runtime validation`,
      snippet,
      metadata: {
        typeName: typeUsage.typeName,
        expectedSchema,
      },
    });
  }

  // Rule: zod/unused-schema
  for (const schema of coverage.unusedSchemas) {
    const snippet = getCodeSnippetAtLine(schema.file, schema.line);

    violations.push({
      file: schema.file,
      line: schema.line,
      column: 1,
      rule: 'zod/unused-schema',
      message: `Schema "${schema.schemaName}" is defined but never used in validation`,
      severity: 'warning',
      suggestion: 'Either use this schema in validation logic or remove it if unnecessary',
      snippet,
      metadata: {
        schemaName: schema.schemaName,
        correspondingType: schema.correspondingTypeName,
      },
    });
  }

  return {
    violations,
    coverage,
    totalTypes,
    typesWithSchemas,
    coveragePercent,
  };
}

// =============================================================================
// Main Entry Point
// =============================================================================

function main(): void {
  const args = parseValidatorArgs();

  if (args.help) {
    console.log(`
Zod Schema Coverage Validator

Usage: pnpm validate:zod [options]

Options:
  --report, -r    Generate JSON report in reports/zod-coverage.json
  --verbose, -v   Show detailed output including type/schema discovery
  --help, -h      Show this help message

Description:
  Ensures that types used in the query layer have corresponding Zod validation schemas.
  This helps maintain runtime type safety by validating data at system boundaries.

Rules:
  zod/missing-input-schema   - Input type lacks Zod schema (error)
  zod/missing-output-schema  - Output type lacks Zod schema (warning)
  zod/unused-schema          - Schema defined but not used (info)

Philosophy:
  The validation layer bridges TypeScript's compile-time types and runtime reality.
  Input types (Request types) MUST have Zod schemas for form validation.
  Output types SHOULD have schemas for runtime validation of API responses.

Type Categories:
  - Input types: End with "Request" (e.g., CreateProjectRequest)
  - Output types: Entity types returned from queries (e.g., Project, Task)

Coverage Tracking:
  Reports coverage percentage for input types with schemas.
  100% coverage means all Request types have corresponding Zod schemas.
`);
    process.exit(0);
  }

  const reporter = new Reporter('zod-coverage', {
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
    totalTypesUsedInQueries: result.coverage.typesUsedInQueries.length,
    totalSchemasDefinedInValidation: result.coverage.schemasDefinedInValidation.length,
    inputTypes: result.totalTypes,
    inputTypesWithSchemas: result.typesWithSchemas,
    inputCoveragePercent: result.coveragePercent,
    missingInputSchemas: result.coverage.missingInputSchemas.length,
    missingOutputSchemas: result.coverage.missingOutputSchemas.length,
    unusedSchemas: result.coverage.unusedSchemas.length,
    config: ZOD_COVERAGE_CONFIG.name,
    scope: [PACKAGE_PATHS.GENERATED, PACKAGE_PATHS.VALIDATION, PACKAGE_PATHS.QUERIES],
  });

  // Print summary
  reporter.printSummary();

  // Print coverage stats
  if (!args.verbose) {
    console.log(
      `   Input type coverage: ${result.coveragePercent}% (${result.typesWithSchemas}/${result.totalTypes})`
    );
    console.log('');
  }

  // Write JSON report if requested
  if (args.report) {
    reporter.writeReport();
  }

  // Exit with appropriate code
  process.exit(reporter.getExitCode());
}

// Run main
main();
