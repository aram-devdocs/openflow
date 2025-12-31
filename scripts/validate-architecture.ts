/**
 * Architecture Validation Script
 *
 * Enforces the dependency hierarchy rules defined in the spec:
 *
 * Level 5: src/routes/         → Can import: all packages
 * Level 4: packages/ui/        → Can import: validation, generated, utils
 * Level 3: packages/hooks/     → Can import: queries, validation, generated, utils
 * Level 2: packages/queries/   → Can import: generated, utils
 * Level 1: packages/validation/→ Can import: generated, utils
 * Level 0: packages/generated/ → No imports (auto-generated)
 *          packages/utils/     → No internal imports
 *
 * Run: pnpm validate:arch
 * Run with report: pnpm validate:arch --report
 */

import { readFileSync } from 'node:fs';
import { globSync } from 'glob';

import { ARCHITECTURE_CONFIG, ROOT_DIR } from './lib/config';
import { analyzeImports } from './lib/import-analyzer';
import { Reporter, parseValidatorArgs } from './lib/reporter';
import type { Severity, Violation } from './lib/types';

// =============================================================================
// Types
// =============================================================================

interface ArchRule {
  name: string;
  ruleId: string;
  pattern: string;
  forbidden: string[];
  severity: Severity;
}

// =============================================================================
// Architecture Rules
// =============================================================================

const RULES: ArchRule[] = [
  // UI components cannot import hooks or queries (they must be stateless)
  {
    name: 'UI cannot import hooks',
    ruleId: 'arch/forbidden-import',
    pattern: 'packages/ui/**/*.{ts,tsx}',
    forbidden: ['@openflow/hooks', '../hooks', './hooks'],
    severity: 'error',
  },
  {
    name: 'UI cannot import queries',
    ruleId: 'arch/forbidden-import',
    pattern: 'packages/ui/**/*.{ts,tsx}',
    forbidden: ['@openflow/queries', '../queries', './queries'],
    severity: 'error',
  },
  // Queries cannot import hooks (lower level in hierarchy)
  {
    name: 'Queries cannot import hooks',
    ruleId: 'arch/forbidden-import',
    pattern: 'packages/queries/**/*.{ts,tsx}',
    forbidden: ['@openflow/hooks', '../hooks', './hooks'],
    severity: 'error',
  },
  // Validation cannot import hooks, queries, or UI
  {
    name: 'Validation cannot import hooks',
    ruleId: 'arch/forbidden-import',
    pattern: 'packages/validation/**/*.{ts,tsx}',
    forbidden: ['@openflow/hooks', '../hooks', './hooks'],
    severity: 'error',
  },
  {
    name: 'Validation cannot import queries',
    ruleId: 'arch/forbidden-import',
    pattern: 'packages/validation/**/*.{ts,tsx}',
    forbidden: ['@openflow/queries', '../queries', './queries'],
    severity: 'error',
  },
  {
    name: 'Validation cannot import UI',
    ruleId: 'arch/forbidden-import',
    pattern: 'packages/validation/**/*.{ts,tsx}',
    forbidden: ['@openflow/ui', '../ui', './ui'],
    severity: 'error',
  },
  // Generated types should have no internal imports (auto-generated)
  {
    name: 'Generated cannot import internal packages',
    ruleId: 'arch/forbidden-import',
    pattern: 'packages/generated/**/*.{ts,tsx}',
    forbidden: [
      '@openflow/hooks',
      '@openflow/queries',
      '@openflow/ui',
      '@openflow/validation',
      '@openflow/utils',
    ],
    severity: 'error',
  },
  // Utils should have no internal imports
  {
    name: 'Utils cannot import internal packages',
    ruleId: 'arch/forbidden-import',
    pattern: 'packages/utils/**/*.{ts,tsx}',
    forbidden: [
      '@openflow/hooks',
      '@openflow/queries',
      '@openflow/ui',
      '@openflow/validation',
      '@openflow/generated',
    ],
    severity: 'error',
  },
  // No package should import from src/ (app layer)
  {
    name: 'Packages cannot import from src/',
    ruleId: 'arch/layer-violation',
    pattern: 'packages/**/*.{ts,tsx}',
    forbidden: ['../../src/', '../../../src/', '../../../../src/'],
    severity: 'error',
  },
  // Hooks cannot import UI
  {
    name: 'Hooks cannot import UI',
    ruleId: 'arch/forbidden-import',
    pattern: 'packages/hooks/**/*.{ts,tsx}',
    forbidden: ['@openflow/ui', '../ui', './ui'],
    severity: 'error',
  },
];

// =============================================================================
// Import Checking
// =============================================================================

/**
 * Check if file content contains a forbidden import (simple string-based check)
 */
function checkImportSimple(content: string, forbidden: string): boolean {
  const patterns = [
    `from '${forbidden}`,
    `from "${forbidden}`,
    `import('${forbidden}`,
    `import("${forbidden}`,
    `require('${forbidden}`,
    `require("${forbidden}`,
  ];

  return patterns.some((pattern) => content.includes(pattern));
}

/**
 * Find the line number of a forbidden import using AST analysis
 */
function findImportLineNumber(filePath: string, forbidden: string): number | undefined {
  try {
    const imports = analyzeImports(filePath);
    for (const imp of imports) {
      if (imp.source === forbidden || imp.source.startsWith(`${forbidden}/`)) {
        return imp.line;
      }
    }
    // Fall back to string-based search for relative imports
    if (forbidden.startsWith('./') || forbidden.startsWith('../')) {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`from '${forbidden}`) || lines[i].includes(`from "${forbidden}`)) {
          return i + 1; // 1-indexed
        }
      }
    }
  } catch {
    // Ignore errors, return undefined
  }
  return undefined;
}

/**
 * Get a code snippet for the violation
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
  let filesChecked = 0;
  const filesSet = new Set<string>();

  for (const rule of RULES) {
    const files = globSync(rule.pattern, {
      cwd: ROOT_DIR,
      ignore: ['**/node_modules/**', '**/*.stories.{ts,tsx}', '**/*.test.{ts,tsx}'],
    });

    for (const file of files) {
      filesSet.add(file);
      try {
        const fullPath = `${ROOT_DIR}/${file}`;
        const content = readFileSync(fullPath, 'utf-8');

        for (const forbidden of rule.forbidden) {
          if (checkImportSimple(content, forbidden)) {
            const line = findImportLineNumber(fullPath, forbidden);
            const snippet = line ? getCodeSnippet(fullPath, line) : undefined;

            violations.push({
              file,
              line,
              rule: rule.ruleId,
              message: `${rule.name}: imports "${forbidden}"`,
              severity: rule.severity,
              suggestion: `Remove the import from "${forbidden}" to comply with architecture rules`,
              snippet,
            });
          }
        }
      } catch (error) {
        // Log file read errors in verbose mode
        if (verbose) {
          console.error(`Error reading file ${file}:`, error);
        }
      }
    }
  }

  filesChecked = filesSet.size;

  return {
    violations,
    filesChecked,
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
Architecture Validator

Usage: pnpm validate:arch [options]

Options:
  --report, -r    Generate JSON report in reports/architecture.json
  --verbose, -v   Show detailed output including file processing
  --help, -h      Show this help message

Description:
  Enforces the dependency hierarchy rules between packages and layers.

  Level 5: src/routes/         → Can import: all packages
  Level 4: packages/ui/        → Can import: validation, generated, utils
  Level 3: packages/hooks/     → Can import: queries, validation, generated, utils
  Level 2: packages/queries/   → Can import: generated, utils
  Level 1: packages/validation/→ Can import: generated, utils
  Level 0: packages/generated/ → No imports (auto-generated)
           packages/utils/     → No internal imports
`);
    process.exit(0);
  }

  const reporter = new Reporter('architecture', {
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
    config: ARCHITECTURE_CONFIG.name,
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
