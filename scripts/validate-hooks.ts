/**
 * Hook Layer Validator (FR-3)
 *
 * Ensures hooks in packages/hooks follow the proper layer pattern:
 * - No direct @tauri-apps/api/core imports (use queries instead)
 * - Data-fetching hooks should use @openflow/queries
 *
 * Event subscription hooks (useClaudeEvents, useProcessOutput, etc.) are allowed
 * to import from @tauri-apps/api/event as they need direct access to the event system.
 *
 * Local state hooks (useConfirmDialog, useTheme, etc.) are exempt from the
 * must-use-queries rule as they don't perform data fetching.
 *
 * Run: pnpm validate:hooks
 * Run with report: pnpm validate:hooks --report
 */

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { globSync } from 'glob';
import * as ts from 'typescript';

import { HOOKS_CONFIG, PACKAGE_PATHS, ROOT_DIR } from './lib/config';
import { analyzeImports } from './lib/import-analyzer';
import { Reporter, parseValidatorArgs } from './lib/reporter';
import type { Severity, Violation } from './lib/types';

// =============================================================================
// Types
// =============================================================================

interface HookRule {
  ruleId: string;
  description: string;
  severity: Severity;
}

interface HookFileInfo {
  file: string;
  fullPath: string;
  hookNames: string[];
  hasQueriesImport: boolean;
  hasTauriInvokeImport: boolean;
  hasTauriEventImport: boolean;
  hasTanstackQueryImport: boolean;
  isEventSubscriptionHook: boolean;
  isLocalStateHook: boolean;
}

// =============================================================================
// Hook Layer Rules
// =============================================================================

const RULES: HookRule[] = [
  {
    ruleId: 'hook/no-direct-invoke',
    description: 'Hooks cannot import from @tauri-apps/api/core',
    severity: 'error',
  },
  {
    ruleId: 'hook/must-use-queries',
    description: 'Data-fetching hooks must use @openflow/queries',
    severity: 'error',
  },
];

// =============================================================================
// Hook Classification
// =============================================================================

/**
 * Patterns that identify event subscription hooks.
 * These hooks use Tauri events directly and are allowed to import from @tauri-apps/api/event.
 */
const EVENT_HOOK_PATTERNS = [
  /Events?$/i, // useClaudeEvents, useSomeEvents
  /Output$/i, // useProcessOutput
  /Stream$/i, // useOutputStream
  /Subscription$/i, // useEventSubscription
  /Listener$/i, // useEventListener
];

/**
 * Patterns that identify local state hooks.
 * These hooks manage UI state and don't need to use queries.
 */
const LOCAL_STATE_HOOK_PATTERNS = [
  /Dialog$/i, // useConfirmDialog
  /Modal$/i, // useOpenModal
  /Toast$/i, // useToast
  /Theme$/i, // useTheme
  /Shortcuts?$/i, // useKeyboardShortcuts
  /Toggle$/i, // useDarkModeToggle
  /State$/i, // useLocalState
  /Context$/i, // useSomeContext (when not data fetching)
  /Form$/i, // useFormState
  /Navigation$/i, // useNavigationState
  /Provider$/i, // useThemeProvider
];

/**
 * Specific hook files that are known to be local state hooks
 */
const LOCAL_STATE_HOOK_FILES = [
  'useConfirmDialog.ts',
  'useKeyboardShortcuts.ts',
  'useKeyboardShortcutsDialog.ts',
  'useTheme.ts',
  'useToastMutation.ts',
];

/**
 * Check if a hook name matches event subscription patterns
 */
function isEventSubscriptionHookName(hookName: string): boolean {
  return EVENT_HOOK_PATTERNS.some((pattern) => pattern.test(hookName));
}

/**
 * Check if a hook name matches local state patterns
 */
function isLocalStateHookName(hookName: string): boolean {
  return LOCAL_STATE_HOOK_PATTERNS.some((pattern) => pattern.test(hookName));
}

/**
 * Check if a file is known to be a local state hook
 */
function isLocalStateHookFile(fileName: string): boolean {
  return LOCAL_STATE_HOOK_FILES.includes(fileName);
}

// =============================================================================
// AST Analysis
// =============================================================================

/**
 * Extract hook function names from a file (functions starting with 'use')
 */
function extractHookNames(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const hookNames: string[] = [];

  function hasExportModifier(node: ts.Node): boolean {
    if (!ts.canHaveModifiers(node)) return false;
    const modifiers = ts.getModifiers(node);
    return modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
  }

  function isHookName(name: string): boolean {
    return /^use[A-Z]/.test(name);
  }

  function visit(node: ts.Node): void {
    // Function declarations: export function useX() {}
    if (ts.isFunctionDeclaration(node) && node.name && hasExportModifier(node)) {
      if (isHookName(node.name.text)) {
        hookNames.push(node.name.text);
      }
    }

    // Arrow functions in variable declarations: export const useX = () => {}
    if (ts.isVariableStatement(node) && hasExportModifier(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.initializer) {
          if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
            if (isHookName(decl.name.text)) {
              hookNames.push(decl.name.text);
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return hookNames;
}

// =============================================================================
// File Analysis
// =============================================================================

/**
 * Analyze a hook file to gather information for validation
 */
function analyzeHookFile(file: string, fullPath: string): HookFileInfo {
  const imports = analyzeImports(fullPath);
  const hookNames = extractHookNames(fullPath);
  const fileName = basename(file);

  // Check import sources
  const hasQueriesImport = imports.some(
    (imp) => imp.source === '@openflow/queries' || imp.source.startsWith('@openflow/queries/')
  );

  const hasTauriInvokeImport = imports.some(
    (imp) => imp.source === '@tauri-apps/api/core' || imp.source.startsWith('@tauri-apps/api/core/')
  );

  const hasTauriEventImport = imports.some(
    (imp) =>
      imp.source === '@tauri-apps/api/event' || imp.source.startsWith('@tauri-apps/api/event/')
  );

  const hasTanstackQueryImport = imports.some(
    (imp) =>
      imp.source === '@tanstack/react-query' || imp.source.startsWith('@tanstack/react-query/')
  );

  // Classify the hook file
  const isEventSubscriptionHook =
    hasTauriEventImport || hookNames.some(isEventSubscriptionHookName);

  const isLocalStateHook =
    isLocalStateHookFile(fileName) ||
    (!hasQueriesImport &&
      !hasTauriInvokeImport &&
      !hasTanstackQueryImport &&
      hookNames.every(isLocalStateHookName));

  return {
    file,
    fullPath,
    hookNames,
    hasQueriesImport,
    hasTauriInvokeImport,
    hasTauriEventImport,
    hasTanstackQueryImport,
    isEventSubscriptionHook,
    isLocalStateHook,
  };
}

// =============================================================================
// Code Snippet
// =============================================================================

/**
 * Get a code snippet from a file at a specific line
 */
function getCodeSnippetAtLine(filePath: string, lineNumber: number): string | undefined {
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
 * Get line number of a specific import
 */
function getImportLineNumber(filePath: string, packageName: string): number {
  const imports = analyzeImports(filePath);
  const imp = imports.find(
    (i) => i.source === packageName || i.source.startsWith(`${packageName}/`)
  );
  return imp?.line ?? 1;
}

// =============================================================================
// Suggestion Generation
// =============================================================================

/**
 * Generate a helpful suggestion based on the rule
 */
function getSuggestion(ruleId: string, info: HookFileInfo): string {
  switch (ruleId) {
    case 'hook/no-direct-invoke':
      if (info.isEventSubscriptionHook) {
        return 'Event subscription hooks should use @tauri-apps/api/event, not @tauri-apps/api/core';
      }
      return 'Use @openflow/queries to wrap Tauri invoke calls, then import queries in this hook';
    case 'hook/must-use-queries':
      if (info.hasTanstackQueryImport) {
        return 'Import query functions from @openflow/queries and use them with useMutation/useQuery';
      }
      return 'Import from @openflow/queries for data fetching instead of local implementations';
    default:
      return 'Review the hook layer pattern in the architecture documentation';
  }
}

// =============================================================================
// Validation
// =============================================================================

interface ValidationResult {
  violations: Violation[];
  filesChecked: number;
  hooksFound: number;
  rulesChecked: number;
  eventHooksSkipped: number;
  localStateHooksSkipped: number;
}

function validate(verbose = false): ValidationResult {
  const violations: Violation[] = [];
  const filesSet = new Set<string>();
  let totalHooks = 0;
  let eventHooksSkipped = 0;
  let localStateHooksSkipped = 0;

  // Get all files in packages/hooks
  const pattern = `${PACKAGE_PATHS.HOOKS}/**/*.ts`;
  const files = globSync(pattern, {
    cwd: ROOT_DIR,
    ignore: [
      '**/node_modules/**',
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/*.d.ts',
      // Exclude index.ts (just re-exports)
      `${PACKAGE_PATHS.HOOKS}/index.ts`,
    ],
  });

  for (const file of files) {
    filesSet.add(file);
    const fullPath = `${ROOT_DIR}/${file}`;

    try {
      const info = analyzeHookFile(file, fullPath);
      totalHooks += info.hookNames.length;

      if (verbose) {
        console.log(`  Checking ${file}:`);
        console.log(`    Hooks: ${info.hookNames.join(', ') || '(none)'}`);
        console.log(
          `    Classification: ${info.isEventSubscriptionHook ? 'event-subscription' : info.isLocalStateHook ? 'local-state' : 'data-hook'}`
        );
      }

      // Track skipped hooks
      if (info.isEventSubscriptionHook) {
        eventHooksSkipped += info.hookNames.length;
      }
      if (info.isLocalStateHook) {
        localStateHooksSkipped += info.hookNames.length;
      }

      // Rule: hook/no-direct-invoke
      // Event subscription hooks are allowed to use @tauri-apps/api/event but NOT @tauri-apps/api/core
      if (info.hasTauriInvokeImport) {
        const line = getImportLineNumber(fullPath, '@tauri-apps/api/core');
        const snippet = getCodeSnippetAtLine(fullPath, line);

        violations.push({
          file,
          line,
          column: 1,
          rule: 'hook/no-direct-invoke',
          message: 'Hook imports from @tauri-apps/api/core (direct invoke)',
          severity: 'error',
          suggestion: getSuggestion('hook/no-direct-invoke', info),
          snippet,
          metadata: {
            hookNames: info.hookNames,
            isEventSubscriptionHook: info.isEventSubscriptionHook,
            isLocalStateHook: info.isLocalStateHook,
          },
        });
      }

      // Rule: hook/must-use-queries
      // Only applies to data-fetching hooks (not event subscription or local state hooks)
      // A data-fetching hook uses TanStack Query but doesn't import from queries
      if (
        !info.isEventSubscriptionHook &&
        !info.isLocalStateHook &&
        info.hasTanstackQueryImport &&
        !info.hasQueriesImport
      ) {
        // This is a data hook using TanStack Query without importing from @openflow/queries
        // This could be a violation if it's doing data fetching without using the queries package
        violations.push({
          file,
          line: 1,
          column: 1,
          rule: 'hook/must-use-queries',
          message: 'Data hook uses TanStack Query but does not import from @openflow/queries',
          severity: 'error',
          suggestion: getSuggestion('hook/must-use-queries', info),
          metadata: {
            hookNames: info.hookNames,
            hasTanstackQueryImport: info.hasTanstackQueryImport,
            hasQueriesImport: info.hasQueriesImport,
          },
        });
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
    hooksFound: totalHooks,
    rulesChecked: RULES.length,
    eventHooksSkipped,
    localStateHooksSkipped,
  };
}

// =============================================================================
// Main Entry Point
// =============================================================================

function main(): void {
  const args = parseValidatorArgs();

  if (args.help) {
    console.log(`
Hook Layer Validator

Usage: pnpm validate:hooks [options]

Options:
  --report, -r    Generate JSON report in reports/hooks.json
  --verbose, -v   Show detailed output including file processing
  --help, -h      Show this help message

Description:
  Ensures hooks in packages/hooks follow the proper layer pattern.
  Hooks should use @openflow/queries for data fetching, not direct invoke calls.

Rules:
  hook/no-direct-invoke   - No imports from @tauri-apps/api/core (error)
  hook/must-use-queries   - Data hooks should import from @openflow/queries (warning)

Philosophy:
  The hooks layer provides React integration for data fetching and state management.
  Hooks wrap query functions with TanStack Query for caching, loading states, and
  cache invalidation. They should never call invoke() directly.

Exceptions:
  - Event subscription hooks (useClaudeEvents, useProcessOutput) may use
    @tauri-apps/api/event for real-time event handling
  - Local state hooks (useConfirmDialog, useTheme) don't need queries
  - packages/hooks/index.ts (re-exports only) is excluded

Hook Classification:
  - Event subscription hooks: Use Tauri events for real-time updates
  - Local state hooks: Manage UI state without server communication
  - Data hooks: Fetch and mutate server data (must use queries)
`);
    process.exit(0);
  }

  const reporter = new Reporter('hooks', {
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
    hooksFound: result.hooksFound,
    rulesChecked: result.rulesChecked,
    eventHooksSkipped: result.eventHooksSkipped,
    localStateHooksSkipped: result.localStateHooksSkipped,
    config: HOOKS_CONFIG.name,
    scope: PACKAGE_PATHS.HOOKS,
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
