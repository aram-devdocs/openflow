/**
 * Tauri Command Registration Validator (FR-11)
 *
 * Ensures all Rust Tauri commands are properly registered and follow conventions:
 * - All #[tauri::command] functions must be registered in invoke_handler
 * - All registered commands must have corresponding #[tauri::command] definitions
 * - Command names must follow snake_case naming convention
 *
 * This validator parses Rust source files to find command definitions and
 * cross-references them with the invoke_handler registration in lib.rs.
 *
 * Run: pnpm validate:tauri
 * Run with report: pnpm validate:tauri --report
 */

import { globSync } from 'glob';

import { RELATIVE_PATHS, ROOT_DIR, TAURI_COMMANDS_CONFIG } from './lib/config';
import { Reporter, parseValidatorArgs } from './lib/reporter';
import { findTauriCommands, isSnakeCase, parseInvokeHandler } from './lib/rust-analyzer';
import type { Severity, Violation } from './lib/types';

// =============================================================================
// Types
// =============================================================================

interface TauriRule {
  ruleId: string;
  description: string;
  severity: Severity;
}

interface CommandInfo {
  name: string;
  file: string;
  line: number;
  isAsync: boolean;
  isPublic: boolean;
}

interface RegistrationInfo {
  name: string;
  fullPath: string;
  line: number;
}

// =============================================================================
// Rules
// =============================================================================

const RULES: Record<string, TauriRule> = {
  unregistered: {
    ruleId: 'tauri/unregistered-command',
    description: '#[tauri::command] not registered in invoke_handler',
    severity: 'error',
  },
  orphan: {
    ruleId: 'tauri/orphan-registration',
    description: 'Registered command has no handler',
    severity: 'error',
  },
  naming: {
    ruleId: 'tauri/naming-convention',
    description: 'Command name must be snake_case',
    severity: 'warning',
  },
};

// =============================================================================
// Validation Logic
// =============================================================================

interface ValidationContext {
  commands: Map<string, CommandInfo>;
  registrations: Map<string, RegistrationInfo>;
  verbose: boolean;
}

/**
 * Collect all #[tauri::command] functions from command files
 */
function collectCommands(commandFiles: string[], verbose: boolean): Map<string, CommandInfo> {
  const commands = new Map<string, CommandInfo>();

  for (const file of commandFiles) {
    const fullPath = `${ROOT_DIR}/${file}`;

    try {
      const fileCommands = findTauriCommands(fullPath);

      for (const cmd of fileCommands) {
        // Check for duplicates (shouldn't happen, but log if it does)
        if (commands.has(cmd.name) && verbose) {
          console.warn(
            `  Duplicate command: ${cmd.name} in ${cmd.file} (previously in ${commands.get(cmd.name)?.file})`
          );
        }

        commands.set(cmd.name, {
          name: cmd.name,
          file: cmd.file,
          line: cmd.line,
          isAsync: cmd.isAsync,
          isPublic: cmd.isPublic,
        });
      }

      if (verbose && fileCommands.length > 0) {
        console.log(`  Found ${fileCommands.length} commands in ${file}`);
      }
    } catch (error) {
      if (verbose) {
        console.error(`  Error parsing ${file}:`, error);
      }
    }
  }

  return commands;
}

/**
 * Collect all command registrations from lib.rs
 */
function collectRegistrations(libRsPath: string, verbose: boolean): Map<string, RegistrationInfo> {
  const registrations = new Map<string, RegistrationInfo>();

  try {
    const fullPath = `${ROOT_DIR}/${libRsPath}`;
    const regs = parseInvokeHandler(fullPath);

    for (const reg of regs) {
      registrations.set(reg.name, {
        name: reg.name,
        fullPath: reg.fullPath,
        line: reg.line,
      });
    }

    if (verbose) {
      console.log(`  Found ${regs.length} registrations in ${libRsPath}`);
    }
  } catch (error) {
    if (verbose) {
      console.error(`  Error parsing ${libRsPath}:`, error);
    }
  }

  return registrations;
}

/**
 * Find commands that are defined but not registered
 */
function findUnregisteredCommands(ctx: ValidationContext): Violation[] {
  const violations: Violation[] = [];

  for (const [name, cmd] of ctx.commands) {
    if (!ctx.registrations.has(name)) {
      violations.push({
        file: cmd.file,
        line: cmd.line,
        rule: RULES.unregistered.ruleId,
        message: `Command "${name}" has #[tauri::command] but is not registered in invoke_handler`,
        severity: RULES.unregistered.severity,
        suggestion: `Add "commands::${name}" to the invoke_handler! macro in lib.rs`,
        metadata: {
          commandName: name,
          isAsync: cmd.isAsync,
          isPublic: cmd.isPublic,
        },
      });
    }
  }

  return violations;
}

/**
 * Find registrations that have no corresponding command definition
 */
function findOrphanRegistrations(ctx: ValidationContext): Violation[] {
  const violations: Violation[] = [];

  for (const [name, reg] of ctx.registrations) {
    if (!ctx.commands.has(name)) {
      violations.push({
        file: RELATIVE_PATHS.TAURI_LIB,
        line: reg.line,
        rule: RULES.orphan.ruleId,
        message: `Registered command "${name}" has no corresponding #[tauri::command] function`,
        severity: RULES.orphan.severity,
        suggestion: `Remove "${reg.fullPath}" from invoke_handler or create the command function`,
        metadata: {
          registrationPath: reg.fullPath,
        },
      });
    }
  }

  return violations;
}

/**
 * Find commands with non-snake_case names
 */
function findNamingViolations(ctx: ValidationContext): Violation[] {
  const violations: Violation[] = [];

  for (const [name, cmd] of ctx.commands) {
    if (!isSnakeCase(name)) {
      violations.push({
        file: cmd.file,
        line: cmd.line,
        rule: RULES.naming.ruleId,
        message: `Command name "${name}" should be snake_case`,
        severity: RULES.naming.severity,
        suggestion: `Rename to "${toSnakeCase(name)}"`,
        metadata: {
          currentName: name,
          suggestedName: toSnakeCase(name),
        },
      });
    }
  }

  return violations;
}

/**
 * Convert a name to snake_case
 */
function toSnakeCase(name: string): string {
  return name
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/__/g, '_');
}

// =============================================================================
// Main Validation
// =============================================================================

interface ValidationResult {
  violations: Violation[];
  commandCount: number;
  registrationCount: number;
  commandFiles: string[];
}

function validate(verbose = false): ValidationResult {
  const violations: Violation[] = [];

  // Get all command files (excluding mod.rs)
  const pattern = `${RELATIVE_PATHS.TAURI_COMMANDS}/**/*.rs`;
  const commandFiles = globSync(pattern, {
    cwd: ROOT_DIR,
    ignore: ['**/mod.rs'],
  });

  if (verbose) {
    console.log(`\nScanning ${commandFiles.length} command files...`);
  }

  // Collect commands
  const commands = collectCommands(commandFiles, verbose);

  if (verbose) {
    console.log('\nParsing invoke_handler registrations...');
  }

  // Collect registrations
  const registrations = collectRegistrations(RELATIVE_PATHS.TAURI_LIB, verbose);

  // Create validation context
  const ctx: ValidationContext = {
    commands,
    registrations,
    verbose,
  };

  if (verbose) {
    console.log(
      `\nValidating ${commands.size} commands against ${registrations.size} registrations...\n`
    );
  }

  // Run all checks
  violations.push(...findUnregisteredCommands(ctx));
  violations.push(...findOrphanRegistrations(ctx));
  violations.push(...findNamingViolations(ctx));

  return {
    violations,
    commandCount: commands.size,
    registrationCount: registrations.size,
    commandFiles,
  };
}

// =============================================================================
// CLI Entry Point
// =============================================================================

function printHelp(): void {
  console.log(`
Tauri Command Registration Validator

Usage: pnpm validate:tauri [options]

Options:
  --report, -r    Generate JSON report in reports/tauri-commands.json
  --verbose, -v   Show detailed output including file processing
  --help, -h      Show this help message

Description:
  Ensures all Tauri commands are properly registered and follow naming conventions.
  Cross-references #[tauri::command] functions with invoke_handler registrations.

Rules:
  tauri/unregistered-command - Command not registered in invoke_handler (error)
  tauri/orphan-registration  - Registered but no handler function (warning)
  tauri/naming-convention    - Command name should be snake_case (info)

Scope:
  Commands: ${RELATIVE_PATHS.TAURI_COMMANDS}/**/*.rs
  Registration: ${RELATIVE_PATHS.TAURI_LIB}

Architecture:
  Tauri commands are the IPC bridge between frontend and Rust backend.
  Each #[tauri::command] function must be:
  1. Defined in src-tauri/src/commands/*.rs
  2. Registered in the invoke_handler! macro in lib.rs
  3. Named using snake_case convention

  The validator ensures no commands are forgotten during development and
  catches stale registrations pointing to deleted commands.
`);
}

function main(): void {
  const args = parseValidatorArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const reporter = new Reporter('tauri-commands', {
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
    registrationCount: result.commandCount,
    commandFilesScanned: result.commandFiles.length,
    config: TAURI_COMMANDS_CONFIG.name,
    rules: Object.keys(RULES),
    scope: {
      commands: RELATIVE_PATHS.TAURI_COMMANDS,
      registration: RELATIVE_PATHS.TAURI_LIB,
    },
  });

  // Show summary counts in verbose mode
  if (args.verbose) {
    reporter.printInfo(`Commands defined: ${result.commandCount}`);
    reporter.printInfo(`Commands registered: ${result.registrationCount}`);

    const matched =
      result.commandCount -
      result.violations.filter((v) => v.rule === RULES.unregistered.ruleId).length;
    reporter.printInfo(`Commands matched: ${matched}`);
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
