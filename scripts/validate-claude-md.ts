/**
 * CLAUDE.md Length Validator
 *
 * Ensures all CLAUDE.md files stay within configured line limits.
 * Limits are based on directory depth from the project root.
 *
 * Rules:
 * - claude-md/root-length: Root CLAUDE.md exceeds max lines (error)
 * - claude-md/directory-length: Directory-level CLAUDE.md exceeds max lines (error)
 * - claude-md/subdirectory-length: Subdirectory CLAUDE.md exceeds max lines (error)
 *
 * Run: pnpm validate:claude-md
 * Run with report: pnpm validate:claude-md --report
 * Run verbose: pnpm validate:claude-md --verbose
 */

import { readFileSync } from 'node:fs';
import { globSync } from 'glob';

import { COMMON_EXCLUDES, ROOT_DIR, createRule, createValidatorConfig } from './lib/config';
import { Reporter, parseValidatorArgs } from './lib/reporter';
import type { Violation } from './lib/types';

// =============================================================================
// Configuration
// =============================================================================

/**
 * Line limits by depth level
 * - Root (depth 0): Main project CLAUDE.md
 * - Directory (depth 1): Top-level directories like crates/, packages/, src/
 * - Subdirectory (depth 2+): Nested directories like crates/openflow-core/
 */
const LINE_LIMITS = {
  root: 100,
  directory: 60,
  subdirectory: 40,
} as const;

/**
 * Validator configuration
 */
export const CLAUDE_MD_CONFIG = createValidatorConfig(
  'claude-md',
  'Ensures CLAUDE.md files stay within configured line limits by depth',
  [
    createRule('claude-md/root-length', `Root CLAUDE.md exceeds ${LINE_LIMITS.root} lines`),
    createRule(
      'claude-md/directory-length',
      `Directory-level CLAUDE.md exceeds ${LINE_LIMITS.directory} lines`
    ),
    createRule(
      'claude-md/subdirectory-length',
      `Subdirectory CLAUDE.md exceeds ${LINE_LIMITS.subdirectory} lines`
    ),
  ],
  ['**/CLAUDE.md'],
  [...COMMON_EXCLUDES]
);

// =============================================================================
// Types
// =============================================================================

interface ClaudeMdFile {
  path: string;
  relativePath: string;
  lineCount: number;
  depth: number;
  depthLevel: 'root' | 'directory' | 'subdirectory';
  maxAllowed: number;
}

// =============================================================================
// Analysis Functions
// =============================================================================

/**
 * Calculate the depth of a file from the root directory
 * - CLAUDE.md at root = depth 0
 * - crates/CLAUDE.md = depth 1
 * - crates/openflow-core/CLAUDE.md = depth 2
 */
function getDepth(relativePath: string): number {
  const parts = relativePath.split('/').filter(Boolean);
  // Subtract 1 for the filename itself (CLAUDE.md)
  return Math.max(0, parts.length - 1);
}

/**
 * Get the depth level classification
 */
function getDepthLevel(depth: number): 'root' | 'directory' | 'subdirectory' {
  if (depth === 0) return 'root';
  if (depth === 1) return 'directory';
  return 'subdirectory';
}

/**
 * Get the max allowed lines for a depth level
 */
function getMaxLines(depthLevel: 'root' | 'directory' | 'subdirectory'): number {
  return LINE_LIMITS[depthLevel];
}

/**
 * Get the rule ID for a depth level
 */
function getRuleId(depthLevel: 'root' | 'directory' | 'subdirectory'): string {
  return `claude-md/${depthLevel}-length`;
}

/**
 * Find and analyze all CLAUDE.md files
 */
function findClaudeMdFiles(): ClaudeMdFile[] {
  const files = globSync('**/CLAUDE.md', {
    cwd: ROOT_DIR,
    ignore: [...COMMON_EXCLUDES],
    absolute: false,
  });

  return files.map((relativePath) => {
    const fullPath = `${ROOT_DIR}/${relativePath}`;
    const content = readFileSync(fullPath, 'utf-8');
    const lineCount = content.split('\n').length;
    const depth = getDepth(relativePath);
    const depthLevel = getDepthLevel(depth);

    return {
      path: fullPath,
      relativePath,
      lineCount,
      depth,
      depthLevel,
      maxAllowed: getMaxLines(depthLevel),
    };
  });
}

// =============================================================================
// Validation
// =============================================================================

interface ValidationResult {
  violations: Violation[];
  filesChecked: number;
  filesByLevel: {
    root: number;
    directory: number;
    subdirectory: number;
  };
  violations_by_level: {
    root: number;
    directory: number;
    subdirectory: number;
  };
}

function validate(verbose = false): ValidationResult {
  const violations: Violation[] = [];
  const filesByLevel = { root: 0, directory: 0, subdirectory: 0 };
  const violations_by_level = { root: 0, directory: 0, subdirectory: 0 };

  if (verbose) {
    console.log('\n  Scanning for CLAUDE.md files...');
  }

  const files = findClaudeMdFiles();

  if (verbose) {
    console.log(`  Found ${files.length} CLAUDE.md files\n`);
  }

  for (const file of files) {
    filesByLevel[file.depthLevel]++;

    if (verbose) {
      const status = file.lineCount <= file.maxAllowed ? 'OK' : 'OVER';
      console.log(
        `    [${status}] ${file.relativePath} (${file.lineCount}/${file.maxAllowed} lines, ${file.depthLevel})`
      );
    }

    if (file.lineCount > file.maxAllowed) {
      violations_by_level[file.depthLevel]++;

      violations.push({
        file: file.relativePath,
        line: file.lineCount,
        rule: getRuleId(file.depthLevel),
        message: `File has ${file.lineCount} lines, exceeds ${file.depthLevel} limit of ${file.maxAllowed}`,
        severity: 'error',
        suggestion: `Reduce content to ${file.maxAllowed} lines or less. Consider moving details to subdirectory CLAUDE.md files.`,
        metadata: {
          lineCount: file.lineCount,
          maxAllowed: file.maxAllowed,
          depthLevel: file.depthLevel,
          depth: file.depth,
          excessLines: file.lineCount - file.maxAllowed,
        },
      });
    }
  }

  return {
    violations,
    filesChecked: files.length,
    filesByLevel,
    violations_by_level,
  };
}

// =============================================================================
// Main Entry Point
// =============================================================================

function main(): void {
  const args = parseValidatorArgs();

  if (args.help) {
    console.log(`
CLAUDE.md Length Validator

Usage: pnpm validate:claude-md [options]

Options:
  --report, -r    Generate JSON report in reports/claude-md.json
  --verbose, -v   Show detailed output for each file
  --help, -h      Show this help message

Description:
  Validates that all CLAUDE.md files in the repository stay within
  configured line limits based on their directory depth.

Line Limits:
  Root (depth 0):        ${LINE_LIMITS.root} lines  - Main project CLAUDE.md
  Directory (depth 1):   ${LINE_LIMITS.directory} lines  - e.g., crates/CLAUDE.md, packages/CLAUDE.md
  Subdirectory (depth 2+): ${LINE_LIMITS.subdirectory} lines  - e.g., crates/openflow-core/CLAUDE.md

Rules:
  claude-md/root-length         - Root CLAUDE.md exceeds limit (error)
  claude-md/directory-length    - Directory-level CLAUDE.md exceeds limit (error)
  claude-md/subdirectory-length - Subdirectory CLAUDE.md exceeds limit (error)

Philosophy:
  CLAUDE.md files contain timeless architectural patterns that remain
  stable as the codebase evolves. They should be concise, high-level,
  and avoid specific file paths, magic numbers, or implementation details.

  Distributed files allow agents to find relevant guidance where they're
  working, without overwhelming them with irrelevant content.

Examples:
  pnpm validate:claude-md              # Run with default output
  pnpm validate:claude-md --verbose    # Show each file's status
  pnpm validate:claude-md --report     # Generate JSON report
`);
    process.exit(0);
  }

  const reporter = new Reporter('claude-md', {
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
    filesByLevel: result.filesByLevel,
    violationsByLevel: result.violations_by_level,
    lineLimits: LINE_LIMITS,
  });

  // Print summary info
  if (!args.verbose) {
    console.log(`  Files checked: ${result.filesChecked}`);
    console.log(
      `    Root: ${result.filesByLevel.root}, Directory: ${result.filesByLevel.directory}, Subdirectory: ${result.filesByLevel.subdirectory}`
    );
  }

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
