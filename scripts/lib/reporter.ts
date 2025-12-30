/**
 * Validation Framework - Reporter System
 *
 * Provides consistent console and JSON output across all validators.
 * Handles colored terminal output, violation formatting, and report generation.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type {
  ExitCode,
  ReporterOptions,
  Severity,
  Status,
  ValidationReport,
  ValidatorResult,
  Violation,
} from './types';

// =============================================================================
// ANSI Color Codes (no external dependencies)
// =============================================================================

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
} as const;

// Check if colors should be disabled (CI, NO_COLOR env, or piped output)
const isColorEnabled = (): boolean => {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  return process.stdout.isTTY === true;
};

const color = (text: string, ...codes: (keyof typeof COLORS)[]): string => {
  if (!isColorEnabled()) return text;
  const colorCodes = codes.map((c) => COLORS[c]).join('');
  return `${colorCodes}${text}${COLORS.reset}`;
};

// =============================================================================
// Symbols
// =============================================================================

const SYMBOLS = {
  pass: isColorEnabled() ? '✓' : '[PASS]',
  fail: isColorEnabled() ? '✗' : '[FAIL]',
  warn: isColorEnabled() ? '⚠' : '[WARN]',
  info: isColorEnabled() ? 'ℹ' : '[INFO]',
  arrow: isColorEnabled() ? '→' : '->',
  bullet: isColorEnabled() ? '•' : '*',
} as const;

// =============================================================================
// Reporter Class
// =============================================================================

/**
 * Reporter class for consistent validation output across all validators.
 *
 * Usage:
 * ```ts
 * const reporter = new Reporter('architecture');
 * reporter.addViolation({ ... });
 * reporter.printSummary();
 * const result = reporter.getResult();
 * process.exit(result.exitCode);
 * ```
 */
export class Reporter {
  private readonly validatorName: string;
  private readonly options: Required<ReporterOptions>;
  private readonly violations: Violation[] = [];
  private readonly startTime: number;
  private metadata: Record<string, unknown> = {};

  constructor(validatorName: string, options: ReporterOptions = {}) {
    this.validatorName = validatorName;
    this.options = {
      json: options.json ?? false,
      verbose: options.verbose ?? false,
      reportDir: options.reportDir ?? 'reports',
    };
    this.startTime = Date.now();
  }

  // ---------------------------------------------------------------------------
  // Violation Management
  // ---------------------------------------------------------------------------

  /**
   * Add a single violation to the report
   */
  addViolation(violation: Violation): void {
    this.violations.push(violation);
  }

  /**
   * Add multiple violations to the report
   */
  addViolations(violations: Violation[]): void {
    this.violations.push(...violations);
  }

  /**
   * Get all violations
   */
  getViolations(): Violation[] {
    return [...this.violations];
  }

  /**
   * Get violations filtered by severity
   */
  getViolationsBySeverity(severity: Severity): Violation[] {
    return this.violations.filter((v) => v.severity === severity);
  }

  // ---------------------------------------------------------------------------
  // Metadata Management
  // ---------------------------------------------------------------------------

  /**
   * Set report metadata
   */
  setMetadata(metadata: Record<string, unknown>): void {
    this.metadata = { ...this.metadata, ...metadata };
  }

  // ---------------------------------------------------------------------------
  // Counts and Status
  // ---------------------------------------------------------------------------

  /**
   * Get count of violations by severity
   */
  private getCounts(): { errors: number; warnings: number; infos: number } {
    return {
      errors: this.violations.filter((v) => v.severity === 'error').length,
      warnings: this.violations.filter((v) => v.severity === 'warning').length,
      infos: this.violations.filter((v) => v.severity === 'info').length,
    };
  }

  /**
   * Determine overall status based on violations
   */
  private getStatus(): Status {
    const counts = this.getCounts();
    if (counts.errors > 0) return 'fail';
    if (counts.warnings > 0) return 'warn';
    return 'pass';
  }

  /**
   * Get exit code based on status
   * - 0: pass (no issues)
   * - 1: fail (errors found)
   * - 2: warn (warnings only, no errors)
   */
  getExitCode(): ExitCode {
    const status = this.getStatus();
    switch (status) {
      case 'fail':
        return 1;
      case 'warn':
        return 2;
      case 'pass':
        return 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Report Generation
  // ---------------------------------------------------------------------------

  /**
   * Generate the complete validation report
   */
  getReport(): ValidationReport {
    const counts = this.getCounts();
    return {
      validator: this.validatorName,
      timestamp: new Date().toISOString(),
      status: this.getStatus(),
      errorCount: counts.errors,
      warningCount: counts.warnings,
      infoCount: counts.infos,
      violations: this.violations,
      executionTimeMs: Date.now() - this.startTime,
      metadata: Object.keys(this.metadata).length > 0 ? this.metadata : undefined,
    };
  }

  /**
   * Get the complete validator result (report + exit code)
   */
  getResult(): ValidatorResult {
    return {
      report: this.getReport(),
      exitCode: this.getExitCode(),
    };
  }

  // ---------------------------------------------------------------------------
  // Console Output
  // ---------------------------------------------------------------------------

  /**
   * Print the validation header
   */
  printHeader(): void {
    if (this.options.json) return;
    console.log(color(`\n${SYMBOLS.bullet} Validating: ${this.validatorName}\n`, 'bold', 'cyan'));
  }

  /**
   * Print a success message
   */
  printSuccess(message: string): void {
    if (this.options.json) return;
    console.log(color(`${SYMBOLS.pass} ${message}`, 'green'));
  }

  /**
   * Print an error message
   */
  printError(message: string): void {
    if (this.options.json) return;
    console.error(color(`${SYMBOLS.fail} ${message}`, 'red'));
  }

  /**
   * Print a warning message
   */
  printWarning(message: string): void {
    if (this.options.json) return;
    console.warn(color(`${SYMBOLS.warn} ${message}`, 'yellow'));
  }

  /**
   * Print an info message
   */
  printInfo(message: string): void {
    if (this.options.json) return;
    console.log(color(`${SYMBOLS.info} ${message}`, 'blue'));
  }

  /**
   * Print verbose message (only when verbose mode is enabled)
   */
  printVerbose(message: string): void {
    if (this.options.json || !this.options.verbose) return;
    console.log(color(`   ${message}`, 'dim'));
  }

  /**
   * Format a single violation for console output
   */
  private formatViolation(violation: Violation): string {
    const severityColor =
      violation.severity === 'error' ? 'red' : violation.severity === 'warning' ? 'yellow' : 'blue';

    const severitySymbol =
      violation.severity === 'error'
        ? SYMBOLS.fail
        : violation.severity === 'warning'
          ? SYMBOLS.warn
          : SYMBOLS.info;

    const lines: string[] = [];

    // File location
    const location = violation.line
      ? `${violation.file}:${violation.line}${violation.column ? `:${violation.column}` : ''}`
      : violation.file;

    lines.push(color(`  ${severitySymbol} ${location}`, severityColor, 'bold'));

    // Rule and message
    lines.push(color(`    [${violation.rule}] ${violation.message}`, severityColor));

    // Code snippet
    if (violation.snippet) {
      lines.push(color(`    ${violation.snippet}`, 'gray'));
    }

    // Suggestion
    if (violation.suggestion) {
      lines.push(color(`    ${SYMBOLS.arrow} ${violation.suggestion}`, 'cyan'));
    }

    return lines.join('\n');
  }

  /**
   * Print all violations grouped by file
   */
  printViolations(): void {
    if (this.options.json || this.violations.length === 0) return;

    // Group violations by file
    const byFile = new Map<string, Violation[]>();
    for (const violation of this.violations) {
      const existing = byFile.get(violation.file) || [];
      existing.push(violation);
      byFile.set(violation.file, existing);
    }

    // Sort files and print violations
    const sortedFiles = [...byFile.keys()].sort();
    for (const file of sortedFiles) {
      const fileViolations = byFile.get(file);
      if (!fileViolations) continue;
      console.error(color(`\n${file}`, 'white', 'bold'));
      for (const violation of fileViolations.sort((a, b) => (a.line ?? 0) - (b.line ?? 0))) {
        console.error(this.formatViolation(violation));
      }
    }
  }

  /**
   * Print the summary (counts and status)
   */
  printSummary(): void {
    if (this.options.json) {
      // In JSON mode, just output the report to stdout
      console.log(JSON.stringify(this.getReport(), null, 2));
      return;
    }

    const counts = this.getCounts();
    const status = this.getStatus();
    const executionTime = Date.now() - this.startTime;

    console.log(''); // Empty line before summary

    // Print violations if any
    if (this.violations.length > 0) {
      this.printViolations();
      console.log(''); // Empty line after violations
    }

    // Status line
    const statusLine =
      status === 'pass'
        ? color(`${SYMBOLS.pass} ${this.validatorName}: passed`, 'green', 'bold')
        : status === 'warn'
          ? color(`${SYMBOLS.warn} ${this.validatorName}: passed with warnings`, 'yellow', 'bold')
          : color(`${SYMBOLS.fail} ${this.validatorName}: failed`, 'red', 'bold');

    console.log(statusLine);

    // Counts
    if (this.violations.length > 0) {
      const parts: string[] = [];
      if (counts.errors > 0) {
        parts.push(color(`${counts.errors} error${counts.errors !== 1 ? 's' : ''}`, 'red'));
      }
      if (counts.warnings > 0) {
        parts.push(
          color(`${counts.warnings} warning${counts.warnings !== 1 ? 's' : ''}`, 'yellow')
        );
      }
      if (counts.infos > 0) {
        parts.push(color(`${counts.infos} info${counts.infos !== 1 ? 's' : ''}`, 'blue'));
      }
      console.log(`   ${parts.join(', ')}`);
    }

    // Execution time
    console.log(color(`   Completed in ${executionTime}ms`, 'dim'));
    console.log('');
  }

  // ---------------------------------------------------------------------------
  // File Output
  // ---------------------------------------------------------------------------

  /**
   * Write the JSON report to a file
   * @returns The path where the report was written, or null if not written
   */
  writeReport(customPath?: string): string | null {
    const reportPath = customPath ?? resolve(this.options.reportDir, `${this.validatorName}.json`);

    // Ensure directory exists
    const dir = dirname(reportPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const report = this.getReport();
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    if (!this.options.json) {
      console.log(color(`   Report written to: ${reportPath}`, 'dim'));
    }

    return reportPath;
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a violation object with common defaults
 */
export function createViolation(
  partial: Omit<Violation, 'severity'> & { severity?: Severity }
): Violation {
  return {
    severity: 'error',
    ...partial,
  };
}

/**
 * Parse common CLI arguments for validators
 */
export function parseValidatorArgs(args: string[] = process.argv.slice(2)): {
  report: boolean;
  verbose: boolean;
  files: string[];
  help: boolean;
} {
  const result = {
    report: false,
    verbose: false,
    files: [] as string[],
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--report' || arg === '-r') {
      result.report = true;
    } else if (arg === '--verbose' || arg === '-v') {
      result.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (!arg.startsWith('-')) {
      result.files.push(arg);
    }
  }

  return result;
}

/**
 * Format a number with thousands separator
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Get severity from exit code
 */
export function severityFromExitCode(exitCode: ExitCode): Severity {
  switch (exitCode) {
    case 0:
      return 'info';
    case 1:
      return 'error';
    case 2:
      return 'warning';
  }
}

/**
 * Combine multiple validator results into an aggregated exit code
 * Returns the worst exit code (1 > 2 > 0)
 */
export function combineExitCodes(exitCodes: ExitCode[]): ExitCode {
  if (exitCodes.includes(1)) return 1;
  if (exitCodes.includes(2)) return 2;
  return 0;
}
