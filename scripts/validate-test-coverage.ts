/**
 * Test Coverage Validator (FR-10)
 *
 * Ensures minimum test coverage thresholds are met for each package.
 * Reads coverage data from Vitest's JSON coverage report.
 *
 * Rules:
 * - coverage/below-threshold: Test coverage below required threshold (error)
 *
 * Thresholds:
 * - hooks: 40% minimum
 * - queries: 60% minimum
 * - validation: 80% minimum
 * - overall: 30% minimum
 *
 * Run: pnpm validate:coverage
 * Run with report: pnpm validate:coverage --report
 */

import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import { COVERAGE_THRESHOLDS, PACKAGE_PATHS, ROOT_DIR, TEST_COVERAGE_CONFIG } from './lib/config';
import { Reporter, parseValidatorArgs } from './lib/reporter';
import type { Severity, Violation } from './lib/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Coverage data structure from Vitest's json-summary reporter
 * Follows Istanbul coverage format
 */
interface CoverageSummaryEntry {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

interface FileCoverage {
  lines: CoverageSummaryEntry;
  statements: CoverageSummaryEntry;
  functions: CoverageSummaryEntry;
  branches: CoverageSummaryEntry;
}

/**
 * Vitest coverage-summary.json format
 */
interface CoverageReport {
  total: FileCoverage;
  [filePath: string]: FileCoverage;
}

interface PackageCoverage {
  packageName: string;
  packagePath: string;
  threshold: number;
  actualCoverage: number;
  filesCount: number;
  linesCovered: number;
  linesTotal: number;
  meetsThreshold: boolean;
}

interface CoverageRule {
  ruleId: string;
  description: string;
  severity: Severity;
}

// =============================================================================
// Coverage Rules
// =============================================================================

const RULES: CoverageRule[] = [
  {
    ruleId: 'coverage/below-threshold',
    description: 'Test coverage below required threshold',
    // Warning severity because test-coverage is a non-blocking validator
    // Tests should be added incrementally, not block PRs
    severity: 'warning',
  },
];

// =============================================================================
// Default Coverage Report Path
// =============================================================================

const DEFAULT_COVERAGE_PATH = resolve(ROOT_DIR, 'coverage', 'coverage-summary.json');

// =============================================================================
// Package Coverage Mapping
// =============================================================================

/**
 * Map package paths to their threshold keys
 */
const PACKAGE_THRESHOLD_MAPPING: Record<string, string> = {
  [PACKAGE_PATHS.HOOKS]: 'hooks',
  [PACKAGE_PATHS.QUERIES]: 'queries',
  [PACKAGE_PATHS.VALIDATION]: 'validation',
};

// =============================================================================
// Coverage Parsing
// =============================================================================

/**
 * Load and parse the coverage summary JSON file
 */
function loadCoverageReport(coveragePath: string): CoverageReport | null {
  if (!existsSync(coveragePath)) {
    return null;
  }

  try {
    const content = readFileSync(coveragePath, 'utf-8');
    return JSON.parse(content) as CoverageReport;
  } catch (error) {
    console.error(`Error parsing coverage report: ${error}`);
    return null;
  }
}

/**
 * Group coverage data by package
 */
function groupCoverageByPackage(report: CoverageReport): Map<string, FileCoverage[]> {
  const packageCoverage = new Map<string, FileCoverage[]>();

  for (const [filePath, coverage] of Object.entries(report)) {
    // Skip the 'total' entry
    if (filePath === 'total') {
      continue;
    }

    // Determine which package this file belongs to
    const relativePath = filePath.startsWith('/') ? relative(ROOT_DIR, filePath) : filePath;

    for (const [packagePath, thresholdKey] of Object.entries(PACKAGE_THRESHOLD_MAPPING)) {
      if (relativePath.startsWith(packagePath)) {
        const existing = packageCoverage.get(thresholdKey) || [];
        existing.push(coverage);
        packageCoverage.set(thresholdKey, existing);
        break;
      }
    }
  }

  return packageCoverage;
}

/**
 * Calculate aggregate coverage for a set of files
 */
function calculateAggregateCoverage(files: FileCoverage[]): {
  coverage: number;
  linesCovered: number;
  linesTotal: number;
} {
  if (files.length === 0) {
    return { coverage: 0, linesCovered: 0, linesTotal: 0 };
  }

  let totalLines = 0;
  let coveredLines = 0;

  for (const file of files) {
    totalLines += file.lines.total;
    coveredLines += file.lines.covered;
  }

  const coverage = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;

  return {
    coverage: Math.round(coverage * 100) / 100,
    linesCovered: coveredLines,
    linesTotal: totalLines,
  };
}

// =============================================================================
// Validation
// =============================================================================

interface ValidationResult {
  violations: Violation[];
  coverageReport: CoverageReport | null;
  packageCoverages: PackageCoverage[];
  overallCoverage: number;
  overallThreshold: number;
  coverageFileExists: boolean;
  coverageFilePath: string;
}

function validate(coveragePath: string, verbose = false): ValidationResult {
  const violations: Violation[] = [];
  const packageCoverages: PackageCoverage[] = [];

  // Check if coverage file exists
  if (!existsSync(coveragePath)) {
    return {
      violations: [
        {
          file: relative(ROOT_DIR, coveragePath),
          rule: 'coverage/below-threshold',
          message: `Coverage report not found. Run 'pnpm test --coverage' to generate coverage data.`,
          severity: 'warning',
          suggestion: 'Run "pnpm test --coverage" to generate coverage report',
          metadata: {
            coveragePath,
            expected: 'coverage/coverage-summary.json',
          },
        },
      ],
      coverageReport: null,
      packageCoverages: [],
      overallCoverage: 0,
      overallThreshold: COVERAGE_THRESHOLDS.overall,
      coverageFileExists: false,
      coverageFilePath: coveragePath,
    };
  }

  // Load coverage report
  const report = loadCoverageReport(coveragePath);
  if (!report) {
    return {
      violations: [
        {
          file: relative(ROOT_DIR, coveragePath),
          rule: 'coverage/below-threshold',
          message: 'Failed to parse coverage report. The file may be corrupted.',
          severity: 'warning',
          suggestion: 'Delete coverage/ directory and run "pnpm test --coverage" again',
        },
      ],
      coverageReport: null,
      packageCoverages: [],
      overallCoverage: 0,
      overallThreshold: COVERAGE_THRESHOLDS.overall,
      coverageFileExists: true,
      coverageFilePath: coveragePath,
    };
  }

  if (verbose) {
    console.log(`  Loaded coverage report from: ${coveragePath}`);
    const fileCount = Object.keys(report).filter((k) => k !== 'total').length;
    console.log(`  Found coverage data for ${fileCount} files`);
  }

  // Group coverage by package
  const groupedCoverage = groupCoverageByPackage(report);

  if (verbose) {
    console.log(`  Grouped coverage into ${groupedCoverage.size} packages`);
  }

  // Check each package threshold
  for (const [packageName, threshold] of Object.entries(COVERAGE_THRESHOLDS)) {
    if (packageName === 'overall') continue;

    const packagePath =
      Object.entries(PACKAGE_THRESHOLD_MAPPING).find(([, key]) => key === packageName)?.[0] || '';

    const files = groupedCoverage.get(packageName) || [];
    const { coverage, linesCovered, linesTotal } = calculateAggregateCoverage(files);

    const meetsThreshold = coverage >= threshold;

    const packageCoverage: PackageCoverage = {
      packageName,
      packagePath,
      threshold,
      actualCoverage: coverage,
      filesCount: files.length,
      linesCovered,
      linesTotal,
      meetsThreshold,
    };

    packageCoverages.push(packageCoverage);

    if (verbose) {
      const status = meetsThreshold ? '✓' : '✗';
      console.log(
        `  ${status} ${packageName}: ${coverage.toFixed(1)}% (threshold: ${threshold}%, files: ${files.length})`
      );
    }

    // Only report violations if the package has files with coverage data
    if (files.length > 0 && !meetsThreshold) {
      violations.push({
        file: packagePath,
        rule: 'coverage/below-threshold',
        message: `Package "${packageName}" coverage is ${coverage.toFixed(1)}%, below threshold of ${threshold}%`,
        severity: 'warning',
        suggestion: `Add tests to improve coverage from ${coverage.toFixed(1)}% to at least ${threshold}%`,
        metadata: {
          packageName,
          threshold,
          actualCoverage: coverage,
          linesCovered,
          linesTotal,
          filesCount: files.length,
        },
      });
    }
  }

  // Check overall coverage
  const overallCoverage = report.total?.lines?.pct ?? 0;
  const overallThreshold = COVERAGE_THRESHOLDS.overall;

  if (verbose) {
    console.log(
      `  Overall coverage: ${overallCoverage.toFixed(1)}% (threshold: ${overallThreshold}%)`
    );
  }

  if (overallCoverage < overallThreshold) {
    violations.push({
      file: 'coverage/coverage-summary.json',
      rule: 'coverage/below-threshold',
      message: `Overall coverage is ${overallCoverage.toFixed(1)}%, below threshold of ${overallThreshold}%`,
      severity: 'warning',
      suggestion: `Add tests to improve overall coverage from ${overallCoverage.toFixed(1)}% to at least ${overallThreshold}%`,
      metadata: {
        packageName: 'overall',
        threshold: overallThreshold,
        actualCoverage: overallCoverage,
        linesCovered: report.total?.lines?.covered ?? 0,
        linesTotal: report.total?.lines?.total ?? 0,
      },
    });
  }

  return {
    violations,
    coverageReport: report,
    packageCoverages,
    overallCoverage,
    overallThreshold,
    coverageFileExists: true,
    coverageFilePath: coveragePath,
  };
}

// =============================================================================
// Main Entry Point
// =============================================================================

function main(): void {
  const args = parseValidatorArgs();

  if (args.help) {
    console.log(`
Test Coverage Validator

Usage: pnpm validate:coverage [options] [coverage-path]

Options:
  --report, -r    Generate JSON report in reports/test-coverage.json
  --verbose, -v   Show detailed output including per-package coverage
  --help, -h      Show this help message

Arguments:
  coverage-path   Path to coverage-summary.json (default: coverage/coverage-summary.json)

Description:
  Ensures minimum test coverage thresholds are met for each package.
  Reads coverage data from Vitest's JSON coverage reporter.

Coverage Thresholds:
  hooks:      ${COVERAGE_THRESHOLDS.hooks}% minimum
  queries:    ${COVERAGE_THRESHOLDS.queries}% minimum
  validation: ${COVERAGE_THRESHOLDS.validation}% minimum
  overall:    ${COVERAGE_THRESHOLDS.overall}% minimum

Prerequisites:
  1. Enable json-summary reporter in vitest.config.ts:
     coverage: {
       reporter: ['text', 'json-summary', 'json'],
     }

  2. Run tests with coverage:
     pnpm test --coverage

Example:
  # Validate coverage after running tests
  pnpm test --coverage && pnpm validate:coverage

  # Use custom coverage file path
  pnpm validate:coverage ./custom-coverage/coverage-summary.json

Note:
  If no coverage data exists for a package, the threshold check is skipped.
  This allows gradual adoption of coverage requirements.
`);
    process.exit(0);
  }

  // Determine coverage file path
  const coveragePath = args.files.length > 0 ? resolve(args.files[0]) : DEFAULT_COVERAGE_PATH;

  const reporter = new Reporter('test-coverage', {
    json: false,
    verbose: args.verbose,
    reportDir: 'reports',
  });

  // Print header
  reporter.printHeader();

  // Run validation
  const result = validate(coveragePath, args.verbose);

  // Add violations to reporter
  reporter.addViolations(result.violations);

  // Add metadata
  reporter.setMetadata({
    coverageFileExists: result.coverageFileExists,
    coverageFilePath: relative(ROOT_DIR, result.coverageFilePath),
    overallCoverage: result.overallCoverage,
    overallThreshold: result.overallThreshold,
    packageCoverages: result.packageCoverages,
    thresholds: COVERAGE_THRESHOLDS,
    rulesChecked: RULES.length,
    config: TEST_COVERAGE_CONFIG.name,
  });

  // Print coverage summary if coverage exists
  if (result.coverageFileExists && result.coverageReport) {
    if (!args.verbose) {
      reporter.printInfo(
        `Overall coverage: ${result.overallCoverage.toFixed(1)}% (threshold: ${result.overallThreshold}%)`
      );

      for (const pkg of result.packageCoverages) {
        if (pkg.filesCount > 0) {
          const status = pkg.meetsThreshold ? '✓' : '✗';
          const color = pkg.meetsThreshold ? '' : ' (below threshold)';
          reporter.printInfo(
            `  ${status} ${pkg.packageName}: ${pkg.actualCoverage.toFixed(1)}%${color}`
          );
        }
      }
    }
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
