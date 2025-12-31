/**
 * UI Stateless Validator (FR-1)
 *
 * Ensures UI components in packages/ui remain stateless by checking for forbidden imports:
 * - No @tauri-apps/api/core (direct invoke calls)
 * - No @tanstack/react-query (query hooks)
 * - No @openflow/hooks (internal hooks package)
 * - No @openflow/queries (internal queries package)
 *
 * UI components should only receive data via props and call callback functions.
 * They should never fetch data or manage server state directly.
 *
 * Run: pnpm validate:ui
 * Run with report: pnpm validate:ui --report
 */

import { readFileSync } from 'node:fs';
import { globSync } from 'glob';

import { PACKAGE_PATHS, ROOT_DIR, UI_STATELESS_CONFIG } from './lib/config';
import { analyzeImports } from './lib/import-analyzer';
import { Reporter, parseValidatorArgs } from './lib/reporter';
import type { Severity, Violation } from './lib/types';

// =============================================================================
// Types
// =============================================================================

interface UIRule {
  ruleId: string;
  description: string;
  forbiddenPackages: string[];
  severity: Severity;
}

// =============================================================================
// UI Stateless Rules
// =============================================================================

const RULES: UIRule[] = [
  {
    ruleId: 'ui/no-tauri-invoke',
    description: 'UI components cannot import from @tauri-apps/api/core',
    forbiddenPackages: ['@tauri-apps/api/core'],
    severity: 'error',
  },
  {
    ruleId: 'ui/no-tanstack-query',
    description: 'UI components cannot use TanStack Query directly',
    forbiddenPackages: ['@tanstack/react-query'],
    severity: 'error',
  },
  {
    ruleId: 'ui/no-hooks-package',
    description: 'UI components cannot import from @openflow/hooks',
    forbiddenPackages: ['@openflow/hooks'],
    severity: 'error',
  },
  {
    ruleId: 'ui/no-queries-package',
    description: 'UI components cannot import from @openflow/queries',
    forbiddenPackages: ['@openflow/queries'],
    severity: 'error',
  },
];

// =============================================================================
// Import Checking
// =============================================================================

/**
 * Check if an import source matches a forbidden package
 */
function matchesForbiddenPackage(importSource: string, forbiddenPackage: string): boolean {
  // Exact match
  if (importSource === forbiddenPackage) {
    return true;
  }
  // Subpath import (e.g., @tauri-apps/api/core/invoke)
  if (importSource.startsWith(`${forbiddenPackage}/`)) {
    return true;
  }
  return false;
}

/**
 * Get a code snippet for context
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
    case 'ui/no-tauri-invoke':
      return 'Move Tauri invoke calls to @openflow/queries and use hooks from @openflow/hooks in parent components';
    case 'ui/no-tanstack-query':
      return 'Use hooks from @openflow/hooks instead of TanStack Query directly in UI components';
    case 'ui/no-hooks-package':
      return 'Pass data via props from parent route components that use hooks';
    case 'ui/no-queries-package':
      return 'Use @openflow/hooks to wrap queries, or pass data via props from parent components';
    default:
      return 'Remove the forbidden import to comply with UI stateless pattern';
  }
}

// =============================================================================
// Validation
// =============================================================================

interface ValidationResult {
  violations: Violation[];
  filesChecked: number;
  rulesChecked: number;
}

function validate(verbose = false): ValidationResult {
  const violations: Violation[] = [];
  const filesSet = new Set<string>();

  // Get all files in packages/ui
  const pattern = `${PACKAGE_PATHS.UI}/**/*.{ts,tsx}`;
  const files = globSync(pattern, {
    cwd: ROOT_DIR,
    ignore: [
      '**/node_modules/**',
      '**/*.stories.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/*.d.ts',
      // Exclude hooks directory within UI package (these are allowed to have different rules)
      `${PACKAGE_PATHS.UI}/hooks/**`,
    ],
  });

  for (const file of files) {
    filesSet.add(file);
    const fullPath = `${ROOT_DIR}/${file}`;

    try {
      // Use AST-based import analysis for accuracy
      const imports = analyzeImports(fullPath);

      for (const rule of RULES) {
        for (const forbiddenPackage of rule.forbiddenPackages) {
          // Check each import against the forbidden package
          for (const imp of imports) {
            if (matchesForbiddenPackage(imp.source, forbiddenPackage)) {
              const snippet = getCodeSnippet(fullPath, imp.line);

              violations.push({
                file,
                line: imp.line,
                column: imp.column,
                rule: rule.ruleId,
                message: `${rule.description}: imports "${imp.source}"`,
                severity: rule.severity,
                suggestion: getSuggestion(rule.ruleId),
                snippet,
                metadata: {
                  importSource: imp.source,
                  importSpecifiers: imp.specifiers,
                  isTypeOnly: imp.isTypeOnly,
                },
              });
            }
          }
        }
      }
    } catch (error) {
      // Log file read/parse errors in verbose mode
      if (verbose) {
        console.error(`Error analyzing file ${file}:`, error);
      }
    }
  }

  return {
    violations,
    filesChecked: filesSet.size,
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
UI Stateless Validator

Usage: pnpm validate:ui [options]

Options:
  --report, -r    Generate JSON report in reports/ui-stateless.json
  --verbose, -v   Show detailed output including file processing
  --help, -h      Show this help message

Description:
  Ensures UI components in packages/ui remain stateless by checking for
  forbidden imports that would introduce state management or data fetching.

Rules:
  ui/no-tauri-invoke   - No imports from @tauri-apps/api/core (error)
  ui/no-tanstack-query - No imports from @tanstack/react-query (error)
  ui/no-hooks-package  - No imports from @openflow/hooks (error)
  ui/no-queries-package- No imports from @openflow/queries (error)

Philosophy:
  UI components should be pure functions of their props. They receive data
  and callback functions, render UI, and call callbacks on user interaction.
  All data fetching and state management should happen in higher-level
  components (routes) or through the hooks layer.

Exceptions:
  - packages/ui/hooks/** directory is excluded (local UI state helpers)
  - Story files (*.stories.tsx) are excluded
  - Test files (*.test.tsx, *.spec.tsx) are excluded
`);
    process.exit(0);
  }

  const reporter = new Reporter('ui-stateless', {
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
    rulesChecked: result.rulesChecked,
    config: UI_STATELESS_CONFIG.name,
    scope: PACKAGE_PATHS.UI,
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
