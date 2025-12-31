/**
 * Query Layer Validator (FR-2)
 *
 * Ensures query files in packages/queries follow the thin wrapper pattern:
 * - Exported functions must call invoke to communicate with Tauri
 * - No React hooks can be defined in query files
 * - Query functions should return Promises
 *
 * The query layer should be a thin abstraction over Tauri IPC, providing
 * type-safe wrappers around invoke() calls. Business logic and state
 * management belong in the hooks layer.
 *
 * Run: pnpm validate:queries
 * Run with report: pnpm validate:queries --report
 */

import { readFileSync } from 'node:fs';
import { globSync } from 'glob';
import * as ts from 'typescript';

import { PACKAGE_PATHS, QUERIES_CONFIG, ROOT_DIR } from './lib/config';
import { analyzeImports } from './lib/import-analyzer';
import { Reporter, parseValidatorArgs } from './lib/reporter';
import type { Severity, Violation } from './lib/types';

// =============================================================================
// Types
// =============================================================================

interface QueryRule {
  ruleId: string;
  description: string;
  severity: Severity;
}

interface FunctionInfo {
  name: string;
  line: number;
  column: number;
  isExported: boolean;
  isAsync: boolean;
  hasInvokeCall: boolean;
  returnsPromise: boolean;
  isReactHook: boolean;
}

// =============================================================================
// Query Layer Rules
// =============================================================================

const RULES: QueryRule[] = [
  {
    ruleId: 'query/must-use-invoke',
    description: 'Query functions must use invoke to call Tauri',
    severity: 'error',
  },
  {
    ruleId: 'query/no-react-hooks',
    description: 'Query files cannot define React hooks',
    severity: 'error',
  },
  {
    ruleId: 'query/must-return-promise',
    description: 'Query functions must return a Promise',
    severity: 'error',
  },
];

// =============================================================================
// AST Analysis
// =============================================================================

/**
 * Check if a node contains a call to `invoke`
 */
function containsInvokeCall(node: ts.Node): boolean {
  let found = false;

  function visit(n: ts.Node): void {
    if (found) return;

    if (ts.isCallExpression(n)) {
      const expression = n.expression;
      // Check for direct invoke() call
      if (ts.isIdentifier(expression) && expression.text === 'invoke') {
        found = true;
        return;
      }
      // Check for something.invoke() or similar patterns
      if (ts.isPropertyAccessExpression(expression) && expression.name.text === 'invoke') {
        found = true;
        return;
      }
    }

    ts.forEachChild(n, visit);
  }

  visit(node);
  return found;
}

/**
 * Check if a function name follows React hook naming convention (starts with 'use')
 */
function isReactHookName(name: string): boolean {
  return /^use[A-Z]/.test(name);
}

/**
 * Check if a type node represents a Promise type
 */
function isPromiseType(typeNode: ts.TypeNode | undefined): boolean {
  if (!typeNode) return false;

  // Direct Promise<T>
  if (ts.isTypeReferenceNode(typeNode)) {
    const typeName = typeNode.typeName;
    if (ts.isIdentifier(typeName) && typeName.text === 'Promise') {
      return true;
    }
  }

  return false;
}

/**
 * Analyze a TypeScript file to extract function information
 */
function analyzeFunctions(filePath: string): FunctionInfo[] {
  const content = readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const functions: FunctionInfo[] = [];

  function hasExportModifier(node: ts.Node): boolean {
    if (!ts.canHaveModifiers(node)) return false;
    const modifiers = ts.getModifiers(node);
    return modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
  }

  function visit(node: ts.Node): void {
    // Function declarations: export function foo() {}
    if (ts.isFunctionDeclaration(node) && node.name) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart(sourceFile)
      );
      functions.push({
        name: node.name.text,
        line: line + 1,
        column: character + 1,
        isExported: hasExportModifier(node),
        isAsync: node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false,
        hasInvokeCall: containsInvokeCall(node),
        returnsPromise:
          isPromiseType(node.type) ||
          (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false),
        isReactHook: isReactHookName(node.name.text),
      });
    }

    // Arrow functions in variable declarations: export const foo = () => {}
    if (ts.isVariableStatement(node)) {
      const isExported = hasExportModifier(node);

      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.initializer) {
          // Check for arrow function or function expression
          if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(
              node.getStart(sourceFile)
            );
            const func = decl.initializer;
            functions.push({
              name: decl.name.text,
              line: line + 1,
              column: character + 1,
              isExported,
              isAsync: func.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false,
              hasInvokeCall: containsInvokeCall(func),
              returnsPromise:
                isPromiseType(func.type) ||
                (func.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false),
              isReactHook: isReactHookName(decl.name.text),
            });
          }

          // Check for object with method properties: export const queries = { list: () => invoke(...) }
          if (ts.isObjectLiteralExpression(decl.initializer)) {
            for (const prop of decl.initializer.properties) {
              if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
                const value = prop.initializer;
                if (ts.isArrowFunction(value) || ts.isFunctionExpression(value)) {
                  const { line, character } = sourceFile.getLineAndCharacterOfPosition(
                    prop.getStart(sourceFile)
                  );
                  functions.push({
                    name: `${decl.name.text}.${prop.name.text}`,
                    line: line + 1,
                    column: character + 1,
                    isExported, // Methods in exported object are effectively exported
                    isAsync:
                      value.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false,
                    hasInvokeCall: containsInvokeCall(value),
                    returnsPromise:
                      isPromiseType(value.type) ||
                      (value.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ??
                        false),
                    isReactHook: isReactHookName(prop.name.text),
                  });
                }

                // Handle method shorthand: { list() { return invoke(...) } }
                if (ts.isMethodDeclaration(prop) && ts.isIdentifier(prop.name)) {
                  const { line, character } = sourceFile.getLineAndCharacterOfPosition(
                    prop.getStart(sourceFile)
                  );
                  functions.push({
                    name: `${decl.name.text}.${prop.name.text}`,
                    line: line + 1,
                    column: character + 1,
                    isExported,
                    isAsync:
                      prop.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false,
                    hasInvokeCall: containsInvokeCall(prop),
                    returnsPromise:
                      isPromiseType(prop.type) ||
                      (prop.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false),
                    isReactHook: isReactHookName(prop.name.text),
                  });
                }
              }

              // Handle method shorthand directly on property
              if (ts.isMethodDeclaration(prop) && ts.isIdentifier(prop.name)) {
                const { line, character } = sourceFile.getLineAndCharacterOfPosition(
                  prop.getStart(sourceFile)
                );
                functions.push({
                  name: `${decl.name.text}.${prop.name.text}`,
                  line: line + 1,
                  column: character + 1,
                  isExported,
                  isAsync:
                    prop.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false,
                  hasInvokeCall: containsInvokeCall(prop),
                  returnsPromise:
                    isPromiseType(prop.type) ||
                    (prop.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false),
                  isReactHook: isReactHookName(prop.name.text),
                });
              }
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return functions;
}

/**
 * Get a code snippet from a file at a specific line
 */
function getCodeSnippet(filePath: string, lineNumber: number): string | undefined {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    if (lineNumber > 0 && lineNumber <= lines.length) {
      return lines[lineNumber - 1].trim();
    }
  } catch {
    // Ignore errors
  }
  return undefined;
}

/**
 * Generate a helpful suggestion based on the rule
 */
function getSuggestion(ruleId: string): string {
  switch (ruleId) {
    case 'query/must-use-invoke':
      return 'Query functions should wrap Tauri invoke() calls. Import { invoke } from "./utils.js"';
    case 'query/no-react-hooks':
      return 'Move React hooks to @openflow/hooks package. Query layer should be framework-agnostic';
    case 'query/must-return-promise':
      return 'Query functions should return Promise<T> to allow async Tauri IPC';
    default:
      return 'Review the query layer pattern in the architecture documentation';
  }
}

// =============================================================================
// Validation
// =============================================================================

interface ValidationResult {
  violations: Violation[];
  filesChecked: number;
  functionsChecked: number;
  rulesChecked: number;
}

function validate(verbose = false): ValidationResult {
  const violations: Violation[] = [];
  const filesSet = new Set<string>();
  let totalFunctions = 0;

  // Get all files in packages/queries
  const pattern = `${PACKAGE_PATHS.QUERIES}/**/*.ts`;
  const files = globSync(pattern, {
    cwd: ROOT_DIR,
    ignore: [
      '**/node_modules/**',
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/*.d.ts',
      // Exclude index.ts (just re-exports)
      `${PACKAGE_PATHS.QUERIES}/index.ts`,
      // Exclude types files
      `${PACKAGE_PATHS.QUERIES}/**/types.ts`,
      `${PACKAGE_PATHS.QUERIES}/**/types/**`,
    ],
  });

  for (const file of files) {
    filesSet.add(file);
    const fullPath = `${ROOT_DIR}/${file}`;

    try {
      // Analyze functions in the file
      const functions = analyzeFunctions(fullPath);
      totalFunctions += functions.length;

      // Check if file imports invoke (needed for must-use-invoke check)
      const imports = analyzeImports(fullPath);
      const hasInvokeImport = imports.some(
        (imp) =>
          imp.source === './utils.js' ||
          imp.source === './utils' ||
          imp.source === '@tauri-apps/api/core' ||
          imp.specifiers.includes('invoke')
      );

      // Special case for utils.ts - it's the invoke wrapper, so it's allowed to import from @tauri-apps/api/core
      const isUtilsFile = file.endsWith('utils.ts');

      for (const func of functions) {
        // Only check exported functions (internal helpers are exempt)
        if (!func.isExported) continue;

        // Rule: query/no-react-hooks
        if (func.isReactHook) {
          const snippet = getCodeSnippet(fullPath, func.line);
          violations.push({
            file,
            line: func.line,
            column: func.column,
            rule: 'query/no-react-hooks',
            message: `React hook "${func.name}" found in query file`,
            severity: 'error',
            suggestion: getSuggestion('query/no-react-hooks'),
            snippet,
            metadata: {
              functionName: func.name,
            },
          });
        }

        // Rule: query/must-use-invoke
        // Skip utils.ts as it defines the invoke wrapper itself
        // Also skip if the function is a type export or utility function (like TauriContextError class)
        if (!isUtilsFile && !func.hasInvokeCall) {
          // Only flag if this looks like a query function (not a utility)
          // Check if file has invoke import - if not, entire file might be a utility
          if (hasInvokeImport || func.name.includes('.')) {
            const snippet = getCodeSnippet(fullPath, func.line);
            violations.push({
              file,
              line: func.line,
              column: func.column,
              rule: 'query/must-use-invoke',
              message: `Exported function "${func.name}" does not call invoke()`,
              severity: 'error',
              suggestion: getSuggestion('query/must-use-invoke'),
              snippet,
              metadata: {
                functionName: func.name,
                hasInvokeImport,
              },
            });
          }
        }

        // Rule: query/must-return-promise
        // Skip if function doesn't call invoke (already flagged above)
        // Skip utils.ts helper functions
        if (!isUtilsFile && func.hasInvokeCall && !func.returnsPromise && !func.isAsync) {
          const snippet = getCodeSnippet(fullPath, func.line);
          violations.push({
            file,
            line: func.line,
            column: func.column,
            rule: 'query/must-return-promise',
            message: `Query function "${func.name}" must return a Promise`,
            severity: 'error',
            suggestion: getSuggestion('query/must-return-promise'),
            snippet,
            metadata: {
              functionName: func.name,
              isAsync: func.isAsync,
            },
          });
        }
      }

      // Verbose output
      if (verbose) {
        console.log(`  Checked ${file}: ${functions.length} functions`);
      }
    } catch (error) {
      if (verbose) {
        console.error(`Error analyzing file ${file}:`, error);
      }
    }
  }

  return {
    violations,
    filesChecked: filesSet.size,
    functionsChecked: totalFunctions,
    rulesChecked: RULES.length,
  };
}

// =============================================================================
// Main Entry Point
// =============================================================================

function main(): void {
  const args = parseValidatorArgs();

  if (args.help) {
    console.log(`
Query Layer Validator

Usage: pnpm validate:queries [options]

Options:
  --report, -r    Generate JSON report in reports/queries.json
  --verbose, -v   Show detailed output including file processing
  --help, -h      Show this help message

Description:
  Ensures query files in packages/queries follow the thin wrapper pattern.
  Query functions should wrap Tauri invoke() calls with type safety.

Rules:
  query/must-use-invoke   - Exported functions must call invoke (error)
  query/no-react-hooks    - Cannot define React hooks (use* functions) (error)
  query/must-return-promise - Functions should return Promise<T> (warning)

Philosophy:
  The query layer is a thin abstraction over Tauri IPC. Each query function
  should simply call invoke() with the command name and arguments, and return
  the typed result. No business logic, no state management, no React hooks.
  Those belong in the hooks layer (@openflow/hooks).

Exceptions:
  - packages/queries/index.ts (re-exports only)
  - packages/queries/utils.ts (defines the invoke wrapper)
  - Internal (non-exported) helper functions
  - Type definition files
`);
    process.exit(0);
  }

  const reporter = new Reporter('queries', {
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
    filesChecked: result.filesChecked,
    functionsChecked: result.functionsChecked,
    rulesChecked: result.rulesChecked,
    config: QUERIES_CONFIG.name,
    scope: PACKAGE_PATHS.QUERIES,
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
