#!/usr/bin/env tsx
/**
 * Validation Suite Orchestrator
 *
 * Runs all validators in the OpenFlow validation suite and aggregates results.
 * Supports sequential and parallel execution modes with fail-fast option.
 *
 * Run: pnpm validate:all
 * Run with report: pnpm validate:all --report
 * Run parallel: pnpm validate:all --parallel
 * Run fail-fast: pnpm validate:all --fail-fast
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { BLOCKING_VALIDATORS, NON_BLOCKING_VALIDATORS, PATHS, ROOT_DIR } from './lib/config';
import type {
  AggregatedReport,
  ExitCode,
  Status,
  ValidationReport,
  ValidatorSummary,
} from './lib/types';

// =============================================================================
// ANSI Color Codes
// =============================================================================

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
} as const;

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

const SYMBOLS = {
  pass: isColorEnabled() ? '✓' : '[PASS]',
  fail: isColorEnabled() ? '✗' : '[FAIL]',
  warn: isColorEnabled() ? '⚠' : '[WARN]',
  info: isColorEnabled() ? 'ℹ' : '[INFO]',
  spinner: isColorEnabled() ? '◌' : '[...]',
  arrow: isColorEnabled() ? '→' : '->',
  bullet: isColorEnabled() ? '•' : '*',
} as const;

// =============================================================================
// Types
// =============================================================================

interface ValidatorRunResult {
  name: string;
  exitCode: ExitCode;
  report?: ValidationReport;
  output: string;
  errorOutput: string;
  executionTimeMs: number;
  skipped?: boolean;
}

interface OrchestratorOptions {
  report: boolean;
  verbose: boolean;
  parallel: boolean;
  failFast: boolean;
  blocking: boolean; // Only run blocking validators
  nonBlocking: boolean; // Only run non-blocking validators
  validators?: string[]; // Specific validators to run
}

// =============================================================================
// Validator Configuration
// =============================================================================

/**
 * Map of validator name to npm script
 */
const VALIDATOR_SCRIPTS: Record<string, string> = {
  architecture: 'validate:arch',
  'ui-stateless': 'validate:ui',
  queries: 'validate:queries',
  hooks: 'validate:hooks',
  'zod-coverage': 'validate:zod',
  'circular-deps': 'validate:circular',
  routes: 'validate:routes',
  'dead-code': 'validate:dead-code',
  'type-staleness': 'validate:type-staleness',
  storybook: 'validate:storybook',
  'test-coverage': 'validate:coverage',
  'tauri-commands': 'validate:tauri',
  'rust-services': 'validate:rust',
  primitives: 'validate:primitives',
  a11y: 'validate:a11y',
};

/**
 * Order for sequential execution (blocking first, then non-blocking)
 */
const EXECUTION_ORDER: string[] = [
  // Blocking validators (in order of importance)
  'architecture',
  'type-staleness',
  'ui-stateless',
  'queries',
  'hooks',
  'circular-deps',
  'tauri-commands',
  // Non-blocking validators
  'zod-coverage',
  'routes',
  'dead-code',
  'storybook',
  'test-coverage',
  'rust-services',
  'primitives',
  'a11y',
];

// =============================================================================
// Validator Execution
// =============================================================================

/**
 * Run a single validator and capture its output
 */
async function runValidator(
  name: string,
  generateReport: boolean,
  _verbose: boolean
): Promise<ValidatorRunResult> {
  const script = VALIDATOR_SCRIPTS[name];
  if (!script) {
    return {
      name,
      exitCode: 1,
      output: '',
      errorOutput: `Unknown validator: ${name}`,
      executionTimeMs: 0,
    };
  }

  const startTime = Date.now();
  const args = ['run', script];
  if (generateReport) {
    args.push('--', '--report');
  }

  return new Promise((resolve) => {
    const child = spawn('pnpm', args, {
      cwd: ROOT_DIR,
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      const executionTimeMs = Date.now() - startTime;
      const exitCode = (code ?? 1) as ExitCode;

      // Try to read the JSON report if it was generated
      let report: ValidationReport | undefined;
      if (generateReport) {
        const reportPath = resolvePath(PATHS.REPORTS, `${name}.json`);
        if (existsSync(reportPath)) {
          try {
            report = JSON.parse(readFileSync(reportPath, 'utf-8'));
          } catch {
            // Ignore parse errors
          }
        }
      }

      resolve({
        name,
        exitCode,
        report,
        output: stdout,
        errorOutput: stderr,
        executionTimeMs,
      });
    });

    child.on('error', (err) => {
      resolve({
        name,
        exitCode: 1,
        output: '',
        errorOutput: err.message,
        executionTimeMs: Date.now() - startTime,
      });
    });
  });
}

/**
 * Run validators sequentially
 */
async function runSequential(
  validators: string[],
  options: OrchestratorOptions
): Promise<ValidatorRunResult[]> {
  const results: ValidatorRunResult[] = [];

  for (const name of validators) {
    if (options.verbose) {
      console.log(color(`\n${SYMBOLS.spinner} Running ${name}...`, 'cyan'));
    }

    const result = await runValidator(name, options.report, options.verbose);
    results.push(result);

    // Print inline result
    printValidatorResult(result, options.verbose);

    // Fail-fast: stop on first error (exit code 1)
    if (options.failFast && result.exitCode === 1) {
      console.log(color(`\n${SYMBOLS.fail} Fail-fast: stopping after ${name} error`, 'red'));
      break;
    }
  }

  return results;
}

/**
 * Run validators in parallel
 */
async function runParallel(
  validators: string[],
  options: OrchestratorOptions
): Promise<ValidatorRunResult[]> {
  if (options.verbose) {
    console.log(
      color(`\n${SYMBOLS.spinner} Running ${validators.length} validators in parallel...`, 'cyan')
    );
  }

  const promises = validators.map((name) => runValidator(name, options.report, options.verbose));
  const results = await Promise.all(promises);

  // Sort results by execution order for consistent output
  results.sort((a, b) => {
    const aIndex = EXECUTION_ORDER.indexOf(a.name);
    const bIndex = EXECUTION_ORDER.indexOf(b.name);
    return aIndex - bIndex;
  });

  // Print results
  for (const result of results) {
    printValidatorResult(result, options.verbose);
  }

  return results;
}

/**
 * Print a single validator result
 */
function printValidatorResult(result: ValidatorRunResult, verbose: boolean): void {
  const statusIcon =
    result.exitCode === 0
      ? color(SYMBOLS.pass, 'green')
      : result.exitCode === 2
        ? color(SYMBOLS.warn, 'yellow')
        : color(SYMBOLS.fail, 'red');

  // Use plain text for padding, then colorize
  const statusWord = result.exitCode === 0 ? 'pass' : result.exitCode === 2 ? 'warn' : 'fail';
  const statusColor = result.exitCode === 0 ? 'green' : result.exitCode === 2 ? 'yellow' : 'red';
  const statusText = color(statusWord.padEnd(8), statusColor as keyof typeof COLORS);

  const time = color(`${result.executionTimeMs}ms`, 'dim');

  console.log(`  ${statusIcon} ${result.name.padEnd(18)} ${statusText} ${time}`);

  if (verbose && result.report) {
    const { errorCount, warningCount, infoCount } = result.report;
    if (errorCount > 0 || warningCount > 0 || infoCount > 0) {
      const parts: string[] = [];
      if (errorCount > 0)
        parts.push(color(`${errorCount} error${errorCount !== 1 ? 's' : ''}`, 'red'));
      if (warningCount > 0)
        parts.push(color(`${warningCount} warning${warningCount !== 1 ? 's' : ''}`, 'yellow'));
      if (infoCount > 0)
        parts.push(color(`${infoCount} info${infoCount !== 1 ? 's' : ''}`, 'blue'));
      console.log(color(`     ${parts.join(', ')}`, 'dim'));
    }
  }
}

// =============================================================================
// Report Aggregation
// =============================================================================

/**
 * Determine overall status from multiple exit codes
 */
function getOverallStatus(exitCodes: ExitCode[]): Status {
  if (exitCodes.some((code) => code === 1)) return 'fail';
  if (exitCodes.some((code) => code === 2)) return 'warn';
  return 'pass';
}

/**
 * Determine overall exit code
 */
function getOverallExitCode(exitCodes: ExitCode[]): ExitCode {
  if (exitCodes.some((code) => code === 1)) return 1;
  if (exitCodes.some((code) => code === 2)) return 2;
  return 0;
}

/**
 * Create validator summary from result
 */
function createSummary(result: ValidatorRunResult): ValidatorSummary {
  if (result.report) {
    return {
      name: result.name,
      status: result.report.status,
      errors: result.report.errorCount,
      warnings: result.report.warningCount,
      infos: result.report.infoCount,
      executionTimeMs: result.executionTimeMs,
    };
  }

  // Fallback for validators that didn't produce a report
  const status: Status = result.exitCode === 0 ? 'pass' : result.exitCode === 2 ? 'warn' : 'fail';
  return {
    name: result.name,
    status,
    errors: result.exitCode === 1 ? 1 : 0,
    warnings: result.exitCode === 2 ? 1 : 0,
    infos: 0,
    executionTimeMs: result.executionTimeMs,
  };
}

/**
 * Create aggregated report from all results
 */
function createAggregatedReport(results: ValidatorRunResult[]): AggregatedReport {
  const exitCodes = results.map((r) => r.exitCode);
  const summaries = results.map(createSummary);
  const reports = results.filter((r) => r.report).map((r) => r.report as ValidationReport);

  return {
    timestamp: new Date().toISOString(),
    status: getOverallStatus(exitCodes),
    totalErrors: summaries.reduce((sum, s) => sum + s.errors, 0),
    totalWarnings: summaries.reduce((sum, s) => sum + s.warnings, 0),
    totalInfos: summaries.reduce((sum, s) => sum + s.infos, 0),
    validators: summaries,
    reports,
    totalExecutionTimeMs: results.reduce((sum, r) => sum + r.executionTimeMs, 0),
  };
}

/**
 * Write aggregated report to file
 */
function writeAggregatedReport(report: AggregatedReport): string {
  const reportPath = resolvePath(PATHS.REPORTS, 'all.json');

  // Ensure reports directory exists
  if (!existsSync(PATHS.REPORTS)) {
    mkdirSync(PATHS.REPORTS, { recursive: true });
  }

  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  return reportPath;
}

// =============================================================================
// CLI Argument Parsing
// =============================================================================

function parseArgs(): OrchestratorOptions {
  const args = process.argv.slice(2);
  const options: OrchestratorOptions = {
    report: false,
    verbose: false,
    parallel: false,
    failFast: false,
    blocking: false,
    nonBlocking: false,
    validators: undefined,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--report':
      case '-r':
        options.report = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--parallel':
      case '-p':
        options.parallel = true;
        break;
      case '--fail-fast':
      case '-f':
        options.failFast = true;
        break;
      case '--blocking':
      case '-b':
        options.blocking = true;
        break;
      case '--non-blocking':
      case '-n':
        options.nonBlocking = true;
        break;
      case '--validators':
        // Next arg should be comma-separated list
        if (i + 1 < args.length) {
          options.validators = args[i + 1].split(',').map((v) => v.trim());
          i++;
        }
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  // Fail-fast implies sequential execution
  if (options.failFast && options.parallel) {
    console.warn(
      color(
        `${SYMBOLS.warn} --fail-fast is incompatible with --parallel, using sequential`,
        'yellow'
      )
    );
    options.parallel = false;
  }

  return options;
}

function printHelp(): void {
  console.log(`
${color('Validation Suite Orchestrator', 'bold', 'cyan')}

Runs all validators in the OpenFlow validation suite.

${color('Usage:', 'bold')}
  pnpm validate:all [options]

${color('Options:', 'bold')}
  --report, -r       Generate JSON reports for all validators
  --verbose, -v      Show detailed output including violation counts
  --parallel, -p     Run validators in parallel (faster, but mixed output)
  --fail-fast, -f    Stop on first error (incompatible with --parallel)
  --blocking, -b     Only run blocking validators
  --non-blocking, -n Only run non-blocking validators
  --validators LIST  Run specific validators (comma-separated)
  --help, -h         Show this help message

${color('Blocking Validators:', 'bold')} (exit 1 fails CI)
  ${BLOCKING_VALIDATORS.map((v) => `  ${v}`).join('\n')}

${color('Non-Blocking Validators:', 'bold')} (warnings only)
  ${NON_BLOCKING_VALIDATORS.map((v) => `  ${v}`).join('\n')}

${color('Examples:', 'bold')}
  pnpm validate:all                    # Run all validators sequentially
  pnpm validate:all --parallel         # Run all validators in parallel
  pnpm validate:all --fail-fast        # Stop on first error
  pnpm validate:all --blocking         # Only blocking validators
  pnpm validate:all --report           # Generate JSON reports
  pnpm validate:all --validators arch,ui-stateless,queries
`);
}

// =============================================================================
// Summary Printing
// =============================================================================

function printHeader(): void {
  console.log(
    color('\n═══════════════════════════════════════════════════════════════════', 'cyan')
  );
  console.log(
    color('                    OpenFlow Validation Suite                      ', 'bold', 'cyan')
  );
  console.log(
    color('═══════════════════════════════════════════════════════════════════\n', 'cyan')
  );
}

function printSummary(report: AggregatedReport, options: OrchestratorOptions): void {
  console.log(
    color('\n───────────────────────────────────────────────────────────────────', 'dim')
  );
  console.log(color('                           Summary                                ', 'bold'));
  console.log(
    color('───────────────────────────────────────────────────────────────────\n', 'dim')
  );

  // Status
  const statusIcon =
    report.status === 'pass'
      ? color(SYMBOLS.pass, 'green')
      : report.status === 'warn'
        ? color(SYMBOLS.warn, 'yellow')
        : color(SYMBOLS.fail, 'red');

  const statusText =
    report.status === 'pass'
      ? color('PASSED', 'green', 'bold')
      : report.status === 'warn'
        ? color('PASSED WITH WARNINGS', 'yellow', 'bold')
        : color('FAILED', 'red', 'bold');

  console.log(`  ${statusIcon} Overall Status: ${statusText}`);
  console.log('');

  // Counts
  const passed = report.validators.filter((v) => v.status === 'pass').length;
  const warned = report.validators.filter((v) => v.status === 'warn').length;
  const failed = report.validators.filter((v) => v.status === 'fail').length;

  console.log(
    `  Validators: ${color(String(passed), 'green')} passed, ${color(String(warned), 'yellow')} warned, ${color(String(failed), 'red')} failed`
  );

  if (report.totalErrors > 0 || report.totalWarnings > 0 || report.totalInfos > 0) {
    const parts: string[] = [];
    if (report.totalErrors > 0) {
      parts.push(color(`${report.totalErrors} error${report.totalErrors !== 1 ? 's' : ''}`, 'red'));
    }
    if (report.totalWarnings > 0) {
      parts.push(
        color(`${report.totalWarnings} warning${report.totalWarnings !== 1 ? 's' : ''}`, 'yellow')
      );
    }
    if (report.totalInfos > 0) {
      parts.push(color(`${report.totalInfos} info${report.totalInfos !== 1 ? 's' : ''}`, 'blue'));
    }
    console.log(`  Violations: ${parts.join(', ')}`);
  }

  console.log(`  Total Time: ${color(formatDuration(report.totalExecutionTimeMs), 'dim')}`);
  console.log('');

  // Report path
  if (options.report) {
    const reportPath = resolvePath(PATHS.REPORTS, 'all.json');
    console.log(color(`  Report: ${reportPath}`, 'dim'));
    console.log('');
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const options = parseArgs();

  printHeader();

  // Determine which validators to run
  let validators: string[];
  if (options.validators) {
    validators = options.validators.filter((v) => VALIDATOR_SCRIPTS[v]);
    const invalid = options.validators.filter((v) => !VALIDATOR_SCRIPTS[v]);
    if (invalid.length > 0) {
      console.warn(color(`${SYMBOLS.warn} Unknown validators: ${invalid.join(', ')}`, 'yellow'));
    }
  } else if (options.blocking) {
    validators = EXECUTION_ORDER.filter((v) =>
      (BLOCKING_VALIDATORS as readonly string[]).includes(v)
    );
  } else if (options.nonBlocking) {
    validators = EXECUTION_ORDER.filter((v) =>
      (NON_BLOCKING_VALIDATORS as readonly string[]).includes(v)
    );
  } else {
    validators = EXECUTION_ORDER;
  }

  if (validators.length === 0) {
    // If --non-blocking was specified and there are no non-blocking validators,
    // this is expected behavior after Phase E cleanup (all validators are blocking).
    if (options.nonBlocking) {
      console.log(
        color(
          `${SYMBOLS.pass} No non-blocking validators to run (all validators are now blocking)`,
          'green'
        )
      );
      process.exit(0);
    }
    console.error(color(`${SYMBOLS.fail} No validators to run`, 'red'));
    process.exit(1);
  }

  console.log(
    color(
      `Running ${validators.length} validator${validators.length !== 1 ? 's' : ''}${options.parallel ? ' in parallel' : ''}...`,
      'dim'
    )
  );
  console.log('');

  // Ensure reports directory exists if generating reports
  if (options.report && !existsSync(PATHS.REPORTS)) {
    mkdirSync(PATHS.REPORTS, { recursive: true });
  }

  // Run validators
  const startTime = Date.now();
  const results = options.parallel
    ? await runParallel(validators, options)
    : await runSequential(validators, options);

  // Create aggregated report
  const report = createAggregatedReport(results);
  report.totalExecutionTimeMs = Date.now() - startTime;

  // Write aggregated report if requested
  if (options.report) {
    writeAggregatedReport(report);
  }

  // Print summary
  printSummary(report, options);

  // Exit with appropriate code
  process.exit(getOverallExitCode(results.map((r) => r.exitCode)));
}

main().catch((error) => {
  console.error(color(`${SYMBOLS.fail} Orchestrator error: ${error.message}`, 'red'));
  process.exit(1);
});
