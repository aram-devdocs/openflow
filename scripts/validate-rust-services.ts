/**
 * Rust Service Layer Validator (FR-12)
 *
 * Enforces the service layer pattern in the Rust backend:
 * - Command handlers should be thin wrappers delegating to services
 * - Service functions must return Result types
 * - Commands should not contain complex business logic
 *
 * The service layer pattern keeps business logic in dedicated service modules,
 * making code testable, maintainable, and following separation of concerns.
 *
 * Run: pnpm validate:rust
 * Run with report: pnpm validate:rust --report
 */

import { globSync } from 'glob';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RELATIVE_PATHS, ROOT_DIR, RUST_SERVICES_CONFIG } from './lib/config';
import { Reporter, parseValidatorArgs } from './lib/reporter';
import {
  type RustFunction,
  type RustService,
  type RustTauriCommand,
  detectComplexLogic,
  findServiceFunctions,
  findTauriCommands,
} from './lib/rust-analyzer';
import type { Severity, Violation } from './lib/types';

// =============================================================================
// Types
// =============================================================================

interface RustServiceRule {
  ruleId: string;
  description: string;
  severity: Severity;
}

interface CommandAnalysis {
  command: RustTauriCommand;
  bodyLineCount: number;
  hasComplexLogic: boolean;
  complexityPatterns: string[];
  bodyContent: string;
}

interface ServiceMethodAnalysis {
  service: string;
  method: RustFunction;
  file: string;
  returnsResult: boolean;
}

// =============================================================================
// Configuration
// =============================================================================

/** Maximum allowed lines in a command handler body */
const MAX_COMMAND_LINES = 20;

// =============================================================================
// Rules
// =============================================================================

const RULES: Record<string, RustServiceRule> = {
  businessInCommand: {
    ruleId: 'rust/business-in-command',
    description: 'Complex business logic detected in command handler',
    severity: 'error',
  },
  serviceNotResult: {
    ruleId: 'rust/service-not-result',
    description: 'Service function must return Result',
    severity: 'error',
  },
  commandComplexity: {
    ruleId: 'rust/command-complexity',
    description: `Command handler exceeds ${MAX_COMMAND_LINES} lines`,
    severity: 'warning',
  },
};

// =============================================================================
// Analysis Functions
// =============================================================================

/**
 * Read file content and return lines
 */
function readFileLines(filePath: string): string[] {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return content.split('\n');
  } catch {
    return [];
  }
}

/**
 * Find function body boundaries from a starting line
 */
function findFunctionBody(
  lines: string[],
  startLine: number
): { bodyStartLine: number; bodyEndLine: number; bodyContent: string } {
  let braceCount = 0;
  let bodyStartLine = startLine;
  let bodyEndLine = startLine;
  let foundOpenBrace = false;

  for (let i = startLine; i < lines.length; i++) {
    for (const char of lines[i]) {
      if (char === '{') {
        if (!foundOpenBrace) {
          bodyStartLine = i;
          foundOpenBrace = true;
        }
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      }
    }

    if (foundOpenBrace && braceCount === 0) {
      bodyEndLine = i;
      break;
    }
  }

  const bodyContent = lines.slice(bodyStartLine, bodyEndLine + 1).join('\n');
  return { bodyStartLine, bodyEndLine, bodyContent };
}

/**
 * Detect specific complexity patterns in code
 */
function getComplexityPatterns(body: string): string[] {
  const patterns: string[] = [];

  // Remove string literals and comments to avoid false positives
  const cleanedBody = body
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");

  if (/\bfor\s+\w+\s+in\b/.test(cleanedBody)) {
    patterns.push('for loop');
  }
  if (/\bwhile\s+\w/.test(cleanedBody)) {
    patterns.push('while loop');
  }
  if (/\bloop\s*\{/.test(cleanedBody)) {
    patterns.push('infinite loop');
  }
  if (/\bif\s+.*\{[\s\S]*\belse\b/.test(cleanedBody)) {
    patterns.push('if-else branching');
  }
  if (/\bmatch\s+\w+\s*\{/.test(cleanedBody)) {
    patterns.push('match statement');
  }
  // Multiple await calls could indicate orchestration logic
  const awaitCount = (cleanedBody.match(/\.await/g) || []).length;
  if (awaitCount > 3) {
    patterns.push(`multiple awaits (${awaitCount})`);
  }
  // Multiple service calls
  const serviceCallCount = (cleanedBody.match(/\w+Service::\w+/g) || []).length;
  if (serviceCallCount > 2) {
    patterns.push(`multiple service calls (${serviceCallCount})`);
  }

  return patterns;
}

/**
 * Analyze a command handler for complexity
 */
function analyzeCommand(filePath: string, command: RustTauriCommand): CommandAnalysis | null {
  const fullPath = resolve(ROOT_DIR, filePath);
  const lines = readFileLines(fullPath);

  if (lines.length === 0) {
    return null;
  }

  // Find the function line (0-indexed, command.functionLine is 1-indexed)
  const funcLineIndex = command.functionLine - 1;

  if (funcLineIndex < 0 || funcLineIndex >= lines.length) {
    return null;
  }

  // Find the function body
  const { bodyStartLine, bodyEndLine, bodyContent } = findFunctionBody(lines, funcLineIndex);
  const bodyLineCount = bodyEndLine - bodyStartLine + 1;

  // Detect complex logic
  const hasComplexLogic = detectComplexLogic(bodyContent);
  const complexityPatterns = getComplexityPatterns(bodyContent);

  return {
    command,
    bodyLineCount,
    hasComplexLogic,
    complexityPatterns,
    bodyContent,
  };
}

/**
 * Check if a return type is a Result type
 */
function isResultType(returnType: string): boolean {
  // Handle various Result patterns
  return (
    returnType.includes('Result<') ||
    returnType.includes('ServiceResult<') ||
    returnType.includes('anyhow::Result<') ||
    returnType.includes('sqlx::Result<')
  );
}

/**
 * Analyze a service method
 */
function analyzeServiceMethod(service: RustService, method: RustFunction): ServiceMethodAnalysis {
  return {
    service: service.name,
    method,
    file: service.file,
    returnsResult: isResultType(method.returnType),
  };
}

// =============================================================================
// Validation Logic
// =============================================================================

interface ValidationContext {
  commandAnalyses: CommandAnalysis[];
  serviceMethodAnalyses: ServiceMethodAnalysis[];
  verbose: boolean;
}

/**
 * Find commands with complex business logic
 */
function findBusinessLogicInCommands(ctx: ValidationContext): Violation[] {
  const violations: Violation[] = [];

  for (const analysis of ctx.commandAnalyses) {
    if (analysis.hasComplexLogic && analysis.complexityPatterns.length > 0) {
      violations.push({
        file: analysis.command.file,
        line: analysis.command.functionLine,
        rule: RULES.businessInCommand.ruleId,
        message: `Command "${analysis.command.name}" contains complex business logic`,
        severity: RULES.businessInCommand.severity,
        suggestion: `Move business logic to a service function. Found: ${analysis.complexityPatterns.join(', ')}`,
        metadata: {
          commandName: analysis.command.name,
          patterns: analysis.complexityPatterns,
          bodyLineCount: analysis.bodyLineCount,
        },
      });
    }
  }

  return violations;
}

/**
 * Find service methods that don't return Result
 */
function findNonResultServices(ctx: ValidationContext): Violation[] {
  const violations: Violation[] = [];

  for (const analysis of ctx.serviceMethodAnalyses) {
    // Skip constructors and private methods
    if (analysis.method.name === 'new' || analysis.method.name === 'default') {
      continue;
    }
    if (!analysis.method.isPublic) {
      continue;
    }

    if (!analysis.returnsResult) {
      violations.push({
        file: analysis.file,
        line: analysis.method.line,
        rule: RULES.serviceNotResult.ruleId,
        message: `Service method "${analysis.service}::${analysis.method.name}" does not return Result`,
        severity: RULES.serviceNotResult.severity,
        suggestion: 'Return Result<T, ServiceError> to enable proper error handling',
        metadata: {
          serviceName: analysis.service,
          methodName: analysis.method.name,
          returnType: analysis.method.returnType,
        },
      });
    }
  }

  return violations;
}

/**
 * Find commands exceeding line count threshold
 */
function findComplexCommands(ctx: ValidationContext): Violation[] {
  const violations: Violation[] = [];

  for (const analysis of ctx.commandAnalyses) {
    if (analysis.bodyLineCount > MAX_COMMAND_LINES) {
      violations.push({
        file: analysis.command.file,
        line: analysis.command.functionLine,
        rule: RULES.commandComplexity.ruleId,
        message: `Command "${analysis.command.name}" has ${analysis.bodyLineCount} lines (max: ${MAX_COMMAND_LINES})`,
        severity: RULES.commandComplexity.severity,
        suggestion: 'Consider extracting logic to service functions to reduce command size',
        metadata: {
          commandName: analysis.command.name,
          bodyLineCount: analysis.bodyLineCount,
          threshold: MAX_COMMAND_LINES,
        },
      });
    }
  }

  return violations;
}

// =============================================================================
// Main Validation
// =============================================================================

interface ValidationResult {
  violations: Violation[];
  commandCount: number;
  serviceCount: number;
  methodCount: number;
  commandFiles: string[];
  serviceFiles: string[];
}

function validate(verbose = false): ValidationResult {
  const violations: Violation[] = [];

  // Get command files
  const commandPattern = `${RELATIVE_PATHS.TAURI_COMMANDS}/**/*.rs`;
  const commandFiles = globSync(commandPattern, {
    cwd: ROOT_DIR,
    ignore: ['**/mod.rs'],
  });

  // Get service files
  const servicePattern = `${RELATIVE_PATHS.TAURI_SERVICES}/**/*.rs`;
  const serviceFiles = globSync(servicePattern, {
    cwd: ROOT_DIR,
    ignore: ['**/mod.rs'],
  });

  if (verbose) {
    console.log(`\nScanning ${commandFiles.length} command files...`);
  }

  // Analyze commands
  const commandAnalyses: CommandAnalysis[] = [];
  let totalCommands = 0;

  for (const file of commandFiles) {
    const fullPath = `${ROOT_DIR}/${file}`;
    const commands = findTauriCommands(fullPath);
    totalCommands += commands.length;

    for (const cmd of commands) {
      const analysis = analyzeCommand(file, cmd);
      if (analysis) {
        commandAnalyses.push(analysis);
      }
    }

    if (verbose && commands.length > 0) {
      console.log(`  Found ${commands.length} commands in ${file}`);
    }
  }

  if (verbose) {
    console.log(`\nScanning ${serviceFiles.length} service files...`);
  }

  // Analyze services
  const serviceMethodAnalyses: ServiceMethodAnalysis[] = [];
  let totalServices = 0;
  let totalMethods = 0;

  for (const file of serviceFiles) {
    const fullPath = `${ROOT_DIR}/${file}`;
    const services = findServiceFunctions(fullPath);
    totalServices += services.length;

    for (const service of services) {
      totalMethods += service.methods.length;

      for (const method of service.methods) {
        serviceMethodAnalyses.push(analyzeServiceMethod(service, method));
      }

      if (verbose && service.methods.length > 0) {
        console.log(`  Found ${service.name} with ${service.methods.length} methods in ${file}`);
      }
    }
  }

  if (verbose) {
    console.log(
      `\nAnalyzing ${commandAnalyses.length} commands and ${serviceMethodAnalyses.length} service methods...\n`
    );
  }

  // Create validation context
  const ctx: ValidationContext = {
    commandAnalyses,
    serviceMethodAnalyses,
    verbose,
  };

  // Run all checks
  violations.push(...findBusinessLogicInCommands(ctx));
  violations.push(...findNonResultServices(ctx));
  violations.push(...findComplexCommands(ctx));

  return {
    violations,
    commandCount: totalCommands,
    serviceCount: totalServices,
    methodCount: totalMethods,
    commandFiles,
    serviceFiles,
  };
}

// =============================================================================
// CLI Entry Point
// =============================================================================

function printHelp(): void {
  console.log(`
Rust Service Layer Validator

Usage: pnpm validate:rust [options]

Options:
  --report, -r    Generate JSON report in reports/rust-services.json
  --verbose, -v   Show detailed output including file processing
  --help, -h      Show this help message

Description:
  Enforces the service layer pattern in the Rust backend.
  Commands should be thin wrappers delegating to service functions.

Rules:
  rust/business-in-command - Complex logic in command handler (warning)
  rust/service-not-result  - Service must return Result (error)
  rust/command-complexity  - Command exceeds ${MAX_COMMAND_LINES} lines (info)

Scope:
  Commands: ${RELATIVE_PATHS.TAURI_COMMANDS}/**/*.rs
  Services: ${RELATIVE_PATHS.TAURI_SERVICES}/**/*.rs

Architecture:
  The service layer pattern separates concerns:

  1. Command Handlers (thin wrappers):
     - Extract state and parameters
     - Call service functions
     - Map errors to strings

  2. Service Functions (business logic):
     - Contain all business logic
     - Return Result<T, ServiceError>
     - Are easily testable

Example of proper pattern:
  // Command (thin wrapper)
  #[tauri::command]
  pub async fn list_chats(state: State<'_, AppState>, task_id: String) -> Result<Vec<Chat>, String> {
      let pool = state.db.lock().await;
      ChatService::list(&pool, &task_id).await.map_err(|e| e.to_string())
  }

  // Service (business logic)
  impl ChatService {
      pub async fn list(pool: &SqlitePool, task_id: &str) -> ServiceResult<Vec<Chat>> {
          // Business logic here...
      }
  }

Complexity Detection:
  - for/while/loop statements
  - if-else branching
  - match statements
  - Multiple await calls (>3)
  - Multiple service calls (>2)
`);
}

function main(): void {
  const args = parseValidatorArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const reporter = new Reporter('rust-services', {
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
    commandCount: result.commandCount,
    serviceCount: result.serviceCount,
    methodCount: result.methodCount,
    commandFilesScanned: result.commandFiles.length,
    serviceFilesScanned: result.serviceFiles.length,
    config: RUST_SERVICES_CONFIG.name,
    rules: Object.keys(RULES),
    thresholds: {
      maxCommandLines: MAX_COMMAND_LINES,
    },
    scope: {
      commands: RELATIVE_PATHS.TAURI_COMMANDS,
      services: RELATIVE_PATHS.TAURI_SERVICES,
    },
  });

  // Show summary counts in verbose mode
  if (args.verbose) {
    reporter.printInfo(`Commands analyzed: ${result.commandCount}`);
    reporter.printInfo(`Services found: ${result.serviceCount}`);
    reporter.printInfo(`Service methods analyzed: ${result.methodCount}`);
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
