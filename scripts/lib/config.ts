/**
 * Validation Framework - Configuration Module
 *
 * Centralized configuration for all validators in the OpenFlow validation suite.
 * Provides validator configs, path constants, and common exclude patterns.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Rule, Severity, ValidatorConfig } from './types';

// =============================================================================
// Path Constants
// =============================================================================

/**
 * Get the directory name in ESM context
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Root directory of the OpenFlow project.
 * Resolved relative to this file's location (scripts/lib/config.ts)
 */
export const ROOT_DIR = resolve(__dirname, '..', '..');

/**
 * Directory paths for the OpenFlow project structure
 */
export const PATHS = {
  /** Root directory */
  ROOT: ROOT_DIR,
  /** Packages directory */
  PACKAGES: resolve(ROOT_DIR, 'packages'),
  /** Frontend source directory */
  SRC: resolve(ROOT_DIR, 'src'),
  /** Routes directory */
  ROUTES: resolve(ROOT_DIR, 'src/routes'),
  /** Tauri backend directory */
  TAURI: resolve(ROOT_DIR, 'src-tauri'),
  /** Tauri commands directory */
  TAURI_COMMANDS: resolve(ROOT_DIR, 'src-tauri/src/commands'),
  /** Tauri services directory */
  TAURI_SERVICES: resolve(ROOT_DIR, 'src-tauri/src/services'),
  /** Tauri lib.rs entry point */
  TAURI_LIB: resolve(ROOT_DIR, 'src-tauri/src/lib.rs'),
  /** Reports output directory */
  REPORTS: resolve(ROOT_DIR, 'reports'),
  /** Scripts directory */
  SCRIPTS: resolve(ROOT_DIR, 'scripts'),
} as const;

/**
 * Relative paths for glob patterns (relative to ROOT_DIR)
 */
export const RELATIVE_PATHS = {
  PACKAGES: 'packages',
  SRC: 'src',
  ROUTES: 'src/routes',
  TAURI: 'src-tauri',
  TAURI_COMMANDS: 'src-tauri/src/commands',
  TAURI_SERVICES: 'src-tauri/src/services',
  TAURI_LIB: 'src-tauri/src/lib.rs',
  REPORTS: 'reports',
  SCRIPTS: 'scripts',
} as const;

/**
 * Package paths within the monorepo (relative to ROOT_DIR)
 */
export const PACKAGE_PATHS = {
  UI: 'packages/ui',
  HOOKS: 'packages/hooks',
  QUERIES: 'packages/queries',
  VALIDATION: 'packages/validation',
  GENERATED: 'packages/generated',
  UTILS: 'packages/utils',
  MCP_SERVER: 'packages/mcp-server',
} as const;

/**
 * Package names for @openflow scoped packages
 */
export const PACKAGE_NAMES = {
  UI: '@openflow/ui',
  HOOKS: '@openflow/hooks',
  QUERIES: '@openflow/queries',
  VALIDATION: '@openflow/validation',
  GENERATED: '@openflow/generated',
  UTILS: '@openflow/utils',
  MCP_SERVER: '@openflow/mcp-server',
} as const;

// =============================================================================
// Common Exclude Patterns
// =============================================================================

/**
 * Standard exclude patterns applied to all validators
 */
export const COMMON_EXCLUDES = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/coverage/**',
  '**/target/**',
  '**/.turbo/**',
  '**/.next/**',
  '**/.tauri/**',
] as const;

/**
 * Test file patterns (excluded by default from production code validators)
 */
export const TEST_EXCLUDES = [
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
  '**/__tests__/**',
  '**/__mocks__/**',
  '**/__snapshots__/**',
] as const;

/**
 * Story file patterns (excluded by default from production code validators)
 */
export const STORY_EXCLUDES = ['**/*.stories.{ts,tsx}'] as const;

/**
 * Declaration file patterns (excluded from source validators)
 */
export const DECLARATION_EXCLUDES = ['**/*.d.ts'] as const;

/**
 * Generated code patterns (excluded from code quality validators)
 * These files are auto-generated and should not be flagged for dead code, etc.
 */
export const GENERATED_EXCLUDES = [
  '**/packages/generated/**',
  '**/routeTree.gen.ts',
  '**/*.gen.ts',
  '**/*.generated.ts',
] as const;

/**
 * All non-source file excludes combined
 */
export const NON_SOURCE_EXCLUDES = [
  ...COMMON_EXCLUDES,
  ...TEST_EXCLUDES,
  ...STORY_EXCLUDES,
  ...DECLARATION_EXCLUDES,
] as const;

/**
 * Excludes for code quality validators (non-source + generated)
 */
export const CODE_QUALITY_EXCLUDES = [...NON_SOURCE_EXCLUDES, ...GENERATED_EXCLUDES] as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a Rule object with defaults
 */
export function createRule(
  id: string,
  description: string,
  severity: Severity = 'error',
  enabled = true
): Rule {
  return { id, description, severity, enabled };
}

/**
 * Create a ValidatorConfig object
 */
export function createValidatorConfig(
  name: string,
  description: string,
  rules: Rule[],
  includes: string[],
  excludes: string[] = [...NON_SOURCE_EXCLUDES]
): ValidatorConfig {
  return { name, description, rules, includes, excludes };
}

// =============================================================================
// Validator Configurations
// =============================================================================

/**
 * Configuration for the architecture validator
 */
export const ARCHITECTURE_CONFIG: ValidatorConfig = createValidatorConfig(
  'architecture',
  'Enforces dependency hierarchy rules between packages and layers',
  [
    createRule('arch/forbidden-import', 'Forbidden import detected across layer boundary'),
    createRule(
      'arch/layer-violation',
      'Import violates layer hierarchy (higher layer importing lower)'
    ),
    createRule('arch/circular-cross-package', 'Circular dependency between packages'),
  ],
  [`${RELATIVE_PATHS.PACKAGES}/**/*.{ts,tsx}`, `${RELATIVE_PATHS.ROUTES}/**/*.{ts,tsx}`]
);

/**
 * Configuration for the UI stateless validator (FR-1)
 */
export const UI_STATELESS_CONFIG: ValidatorConfig = createValidatorConfig(
  'ui-stateless',
  'Ensures UI components remain stateless (no direct invoke, hooks, or queries)',
  [
    createRule('ui/no-tauri-invoke', 'UI components cannot import from @tauri-apps/api/core'),
    createRule('ui/no-tanstack-query', 'UI components cannot use TanStack Query directly'),
    createRule('ui/no-hooks-package', 'UI components cannot import from @openflow/hooks'),
    createRule('ui/no-queries-package', 'UI components cannot import from @openflow/queries'),
  ],
  [`${PACKAGE_PATHS.UI}/**/*.{ts,tsx}`],
  [...NON_SOURCE_EXCLUDES, `${PACKAGE_PATHS.UI}/hooks/**`]
);

/**
 * Configuration for the query layer validator (FR-2)
 */
export const QUERIES_CONFIG: ValidatorConfig = createValidatorConfig(
  'queries',
  'Ensures queries only wrap Tauri invoke calls',
  [
    createRule('query/must-use-invoke', 'Query functions must use invoke to call Tauri'),
    createRule('query/no-react-hooks', 'Query files cannot define React hooks'),
    createRule('query/must-return-promise', 'Query functions must return a Promise'),
  ],
  [`${PACKAGE_PATHS.QUERIES}/**/*.ts`],
  [
    ...NON_SOURCE_EXCLUDES,
    `${PACKAGE_PATHS.QUERIES}/index.ts`,
    `${PACKAGE_PATHS.QUERIES}/**/types.ts`,
  ]
);

/**
 * Configuration for the hook layer validator (FR-3)
 */
export const HOOKS_CONFIG: ValidatorConfig = createValidatorConfig(
  'hooks',
  'Ensures hooks use queries instead of direct invoke',
  [
    createRule('hook/no-direct-invoke', 'Hooks cannot import from @tauri-apps/api/core'),
    createRule('hook/must-use-queries', 'Data-fetching hooks must use @openflow/queries'),
  ],
  [`${PACKAGE_PATHS.HOOKS}/**/*.ts`],
  NON_SOURCE_EXCLUDES
);

/**
 * Configuration for the Zod coverage validator (FR-4)
 */
export const ZOD_COVERAGE_CONFIG: ValidatorConfig = createValidatorConfig(
  'zod-coverage',
  'Ensures API types have corresponding Zod validation schemas',
  [
    createRule('zod/missing-input-schema', 'Input type used in query lacks Zod schema'),
    createRule('zod/missing-output-schema', 'Output type used in query lacks Zod schema'),
    createRule('zod/unused-schema', 'Zod schema is defined but never used', 'warning'),
  ],
  [
    `${PACKAGE_PATHS.GENERATED}/**/*.ts`,
    `${PACKAGE_PATHS.VALIDATION}/**/*.ts`,
    `${PACKAGE_PATHS.QUERIES}/**/*.ts`,
  ]
);

/**
 * Configuration for the routes validator (FR-5)
 * Routes should be pure composition - like pseudocode describing page structure
 */
export const ROUTES_CONFIG: ValidatorConfig = createValidatorConfig(
  'routes',
  'Ensures route components maintain purity as composition layers',
  [
    createRule('route/no-queries-import', 'Routes must use hooks, not queries directly'),
    createRule('route/no-direct-invoke', 'Routes cannot use Tauri invoke directly'),
    createRule('route/max-lines', 'Route file exceeds maximum line count (300)'),
    createRule('route/no-component-definition', 'Routes must not define inline React components'),
    createRule('route/no-styled-components', 'Routes must not use styled-components'),
    createRule('route/no-jsx-logic', 'Complex JSX logic must be in UI components'),
    createRule('route/imports-ui-package', 'Routes should import from @openflow/ui', 'warning'),
    createRule(
      'route/imports-hooks-package',
      'Routes should import from @openflow/hooks',
      'warning'
    ),
  ],
  [`${RELATIVE_PATHS.ROUTES}/**/*.tsx`]
);

/**
 * Configuration for the circular dependency validator (FR-6)
 */
export const CIRCULAR_DEPS_CONFIG: ValidatorConfig = createValidatorConfig(
  'circular-deps',
  'Detects circular dependencies at package and module level',
  [
    createRule('circular/package-level', 'Circular dependency between packages'),
    createRule('circular/module-level', 'Circular dependency between modules within a package'),
  ],
  [`${RELATIVE_PATHS.PACKAGES}/**/*.{ts,tsx}`, `${RELATIVE_PATHS.SRC}/**/*.{ts,tsx}`]
);

/**
 * Configuration for the dead code validator (FR-7)
 */
export const DEAD_CODE_CONFIG: ValidatorConfig = createValidatorConfig(
  'dead-code',
  'Identifies unused exports and dependencies',
  [
    createRule('dead/unused-export', 'Exported symbol is never imported', 'warning'),
    createRule('dead/unused-dependency', 'Package.json dependency is never imported'),
    createRule('dead/orphan-file', 'File has no importers and exports nothing', 'warning'),
  ],
  [
    `${RELATIVE_PATHS.PACKAGES}/**/*.{ts,tsx}`,
    `${RELATIVE_PATHS.SRC}/**/*.{ts,tsx}`,
    'package.json',
    `${RELATIVE_PATHS.PACKAGES}/*/package.json`,
  ]
);

/**
 * Configuration for the type staleness validator (FR-8)
 */
export const TYPE_STALENESS_CONFIG: ValidatorConfig = createValidatorConfig(
  'type-staleness',
  'Ensures generated TypeScript types match Rust source',
  [
    createRule('types/stale-generation', 'Generated types are older than Rust source'),
    createRule('types/manual-edits', 'Generated file appears to have manual modifications'),
  ],
  [`${RELATIVE_PATHS.TAURI}/src/**/*.rs`, `${PACKAGE_PATHS.GENERATED}/**/*.ts`]
);

/**
 * Configuration for the Storybook coverage validator (FR-9)
 */
export const STORYBOOK_CONFIG: ValidatorConfig = createValidatorConfig(
  'storybook',
  'Ensures UI components have corresponding Storybook stories',
  [
    createRule('storybook/missing-story', 'Component has no corresponding .stories file'),
    createRule('storybook/orphan-story', 'Story file has no corresponding component', 'warning'),
  ],
  [`${PACKAGE_PATHS.UI}/**/*.tsx`, `${PACKAGE_PATHS.UI}/**/*.stories.tsx`],
  [
    ...COMMON_EXCLUDES,
    ...TEST_EXCLUDES,
    ...DECLARATION_EXCLUDES,
    `${PACKAGE_PATHS.UI}/index.tsx`,
    `${PACKAGE_PATHS.UI}/**/index.tsx`,
  ]
);

/**
 * Configuration for the test coverage validator (FR-10)
 */
export const TEST_COVERAGE_CONFIG: ValidatorConfig = createValidatorConfig(
  'test-coverage',
  'Ensures minimum test coverage thresholds are met',
  [createRule('coverage/below-threshold', 'Test coverage below required threshold')],
  ['coverage/coverage-summary.json']
);

/**
 * Configuration for the Tauri command validator (FR-11)
 */
export const TAURI_COMMANDS_CONFIG: ValidatorConfig = createValidatorConfig(
  'tauri-commands',
  'Ensures all Tauri commands are properly registered',
  [
    createRule('tauri/unregistered-command', '#[tauri::command] not registered in invoke_handler'),
    createRule('tauri/orphan-registration', 'Registered command has no handler'),
    createRule('tauri/naming-convention', 'Command name must be snake_case', 'warning'),
  ],
  [`${RELATIVE_PATHS.TAURI_COMMANDS}/**/*.rs`, RELATIVE_PATHS.TAURI_LIB]
);

/**
 * Configuration for the Rust service layer validator (FR-12)
 */
export const RUST_SERVICES_CONFIG: ValidatorConfig = createValidatorConfig(
  'rust-services',
  'Enforces service layer pattern in Rust backend',
  [
    createRule('rust/business-in-command', 'Complex business logic in command handler'),
    createRule('rust/service-not-result', 'Service function must return Result'),
    createRule('rust/command-complexity', 'Command handler exceeds 20 lines', 'warning'),
  ],
  [`${RELATIVE_PATHS.TAURI_COMMANDS}/**/*.rs`, `${RELATIVE_PATHS.TAURI_SERVICES}/**/*.rs`]
);

// =============================================================================
// Validator Registry
// =============================================================================

/**
 * Map of validator name to configuration
 */
export const VALIDATOR_CONFIGS: Record<string, ValidatorConfig> = {
  architecture: ARCHITECTURE_CONFIG,
  'ui-stateless': UI_STATELESS_CONFIG,
  queries: QUERIES_CONFIG,
  hooks: HOOKS_CONFIG,
  'zod-coverage': ZOD_COVERAGE_CONFIG,
  routes: ROUTES_CONFIG,
  'circular-deps': CIRCULAR_DEPS_CONFIG,
  'dead-code': DEAD_CODE_CONFIG,
  'type-staleness': TYPE_STALENESS_CONFIG,
  storybook: STORYBOOK_CONFIG,
  'test-coverage': TEST_COVERAGE_CONFIG,
  'tauri-commands': TAURI_COMMANDS_CONFIG,
  'rust-services': RUST_SERVICES_CONFIG,
};

/**
 * Get configuration for a specific validator
 * @param validatorName - Name of the validator
 * @returns ValidatorConfig or undefined if not found
 */
export function getConfig(validatorName: string): ValidatorConfig | undefined {
  return VALIDATOR_CONFIGS[validatorName];
}

/**
 * Get all validator names
 */
export function getValidatorNames(): string[] {
  return Object.keys(VALIDATOR_CONFIGS);
}

/**
 * Get all validator configurations
 */
export function getAllConfigs(): ValidatorConfig[] {
  return Object.values(VALIDATOR_CONFIGS);
}

// =============================================================================
// Coverage Thresholds
// =============================================================================

/**
 * Test coverage thresholds by package/path
 */
export const COVERAGE_THRESHOLDS: Record<string, number> = {
  hooks: 40,
  queries: 60,
  validation: 80,
  overall: 30,
};

/**
 * Get coverage threshold for a package
 */
export function getCoverageThreshold(packageName: string): number {
  return COVERAGE_THRESHOLDS[packageName] ?? COVERAGE_THRESHOLDS.overall;
}

// =============================================================================
// Severity Mapping
// =============================================================================

/**
 * Default severities for common violation types
 * After E2 promotion: Most warnings are now errors, info moved to warning
 */
export const DEFAULT_SEVERITIES: Record<string, Severity> = {
  // Always errors (blocking)
  'forbidden-import': 'error',
  'layer-violation': 'error',
  'circular-package': 'error',
  'circular-module': 'error',
  'stale-types': 'error',
  'unregistered-command': 'error',
  'unused-dependency': 'error',
  'missing-story': 'error',
  'missing-schema': 'error',
  'jsx-logic': 'error',

  // Warnings (should fix soon)
  'below-coverage': 'warning',
  'unused-export': 'warning',
  'orphan-file': 'warning',
  'unused-schema': 'warning',
  'naming-convention': 'warning',
  'command-complexity': 'warning',
  'imports-package': 'warning',
  'orphan-story': 'warning',
};

// =============================================================================
// Blocking vs Non-Blocking Configuration
// =============================================================================

/**
 * Validators that block pushes (must pass for CI)
 *
 * Core architectural validators that enforce the dependency hierarchy
 * and type generation flow. These must always pass.
 */
export const BLOCKING_VALIDATORS = [
  // Core architectural validators
  'architecture',
  'ui-stateless',
  'queries',
  'hooks',
  'circular-deps',
  'type-staleness',
  'tauri-commands',
  'dead-code',
] as const;

/**
 * Validators that only warn (do not block pushes)
 *
 * Quality validators that identify areas for improvement but don't
 * represent architectural violations. These should be addressed
 * incrementally in separate PRs.
 */
export const NON_BLOCKING_VALIDATORS = [
  'zod-coverage', // Some unused schemas are intentional
  'routes', // Route refactoring requires separate work
  'storybook', // New components need stories added separately
  'test-coverage', // Test coverage requires writing tests
  'rust-services', // Rust refactoring requires separate work
] as const;

/**
 * Check if a validator is blocking
 */
export function isBlockingValidator(validatorName: string): boolean {
  return (BLOCKING_VALIDATORS as readonly string[]).includes(validatorName);
}

// =============================================================================
// Forbidden Import Mapping
// =============================================================================

/**
 * Forbidden imports by package (used by architecture validator)
 */
export const FORBIDDEN_IMPORTS: Record<string, string[]> = {
  [PACKAGE_NAMES.UI]: [
    PACKAGE_NAMES.HOOKS,
    PACKAGE_NAMES.QUERIES,
    '@tauri-apps/api/core',
    '@tanstack/react-query',
  ],
  [PACKAGE_NAMES.HOOKS]: [PACKAGE_NAMES.UI],
  [PACKAGE_NAMES.QUERIES]: [PACKAGE_NAMES.HOOKS, PACKAGE_NAMES.UI],
  [PACKAGE_NAMES.VALIDATION]: [PACKAGE_NAMES.HOOKS, PACKAGE_NAMES.QUERIES, PACKAGE_NAMES.UI],
  [PACKAGE_NAMES.GENERATED]: [
    PACKAGE_NAMES.HOOKS,
    PACKAGE_NAMES.QUERIES,
    PACKAGE_NAMES.UI,
    PACKAGE_NAMES.VALIDATION,
    PACKAGE_NAMES.UTILS,
  ],
  [PACKAGE_NAMES.UTILS]: [
    PACKAGE_NAMES.HOOKS,
    PACKAGE_NAMES.QUERIES,
    PACKAGE_NAMES.UI,
    PACKAGE_NAMES.VALIDATION,
    PACKAGE_NAMES.GENERATED,
  ],
};

/**
 * Get forbidden imports for a package
 */
export function getForbiddenImports(packageName: string): string[] {
  return FORBIDDEN_IMPORTS[packageName] ?? [];
}
