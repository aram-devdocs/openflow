/**
 * Dead Code Validator (FR-7)
 *
 * Identifies unused exports and dependencies across the codebase.
 * Uses AST-based analysis for accurate detection.
 *
 * Rules:
 * - dead/unused-export: Export not imported anywhere (info)
 * - dead/unused-dependency: Package.json dependency not imported (warning)
 * - dead/orphan-file: File with no importers and no exports used (info)
 *
 * Run: pnpm validate:dead-code
 * Run with report: pnpm validate:dead-code --report
 * Run verbose: pnpm validate:dead-code --verbose
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { globSync } from 'glob';

import {
  CODE_QUALITY_EXCLUDES,
  DEAD_CODE_CONFIG,
  PACKAGE_NAMES,
  PACKAGE_PATHS,
  ROOT_DIR,
} from './lib/config';
import {
  analyzeImports,
  getBasePackage,
  getExportedSymbols,
  isRelativeImport,
} from './lib/import-analyzer';
import { Reporter, parseValidatorArgs } from './lib/reporter';
import type { ExportInfo, Severity, Violation } from './lib/types';

// =============================================================================
// Types
// =============================================================================

interface DeadCodeRule {
  ruleId: string;
  description: string;
  severity: Severity;
}

interface UnusedExportInfo {
  name: string;
  file: string;
  line: number;
  isType: boolean;
  packageName: string;
}

interface UnusedDependencyInfo {
  name: string;
  packageJsonPath: string;
  isDevDependency: boolean;
}

interface OrphanFileInfo {
  file: string;
  packageName: string;
  hasExports: boolean;
  hasImports: boolean;
}

interface PackageInfo {
  name: string;
  path: string;
  packageJsonPath: string;
  dependencies: string[];
  devDependencies: string[];
}

// =============================================================================
// Rules
// =============================================================================

const _RULES: DeadCodeRule[] = [
  {
    ruleId: 'dead/unused-export',
    description: 'Exported symbol is never imported anywhere',
    severity: 'warning',
  },
  {
    ruleId: 'dead/unused-dependency',
    description: 'Package.json dependency is never imported',
    severity: 'error',
  },
  {
    ruleId: 'dead/orphan-file',
    description: 'File has no importers and exports nothing used',
    severity: 'warning',
  },
];

// =============================================================================
// Configuration
// =============================================================================

/**
 * Packages where exports are considered "API surface" and should not be flagged
 */
const RELAXED_EXPORT_PACKAGES = [
  PACKAGE_NAMES.GENERATED, // Auto-generated types are the source of truth
  PACKAGE_NAMES.VALIDATION, // Schemas may not all be imported yet
  PACKAGE_NAMES.MCP_SERVER, // Standalone entry point with public API for programmatic use
];

/**
 * Export names that are commonly used dynamically or are framework-required
 */
const IGNORED_EXPORT_NAMES = [
  'default', // Default exports may be used dynamically
  'Route', // TanStack Router convention
  'ErrorBoundary', // React error boundary pattern
  'loader', // Route loaders
  'action', // Route actions
];

/**
 * Dependencies that are commonly false positives (used dynamically or in config)
 */
const IGNORED_DEPENDENCIES = [
  // Peer dependencies / framework core
  'react',
  'react-dom',
  'typescript',
  // Type packages
  '@types/node',
  '@types/react',
  '@types/react-dom',
  // Build tools (used in config files)
  'vite',
  '@vitejs/plugin-react',
  'tailwindcss',
  'autoprefixer',
  'postcss',
  'tsx',
  'glob',
  // Testing frameworks (used in config)
  'vitest',
  '@vitest/coverage-v8', // Coverage provider loaded dynamically by vitest
  // Linting/formatting (used in config)
  '@biomejs/biome',
  'husky',
  'lint-staged',
  // Storybook addons (used dynamically)
  'storybook',
  '@storybook/addon-a11y',
  '@storybook/addon-essentials',
  '@storybook/addon-interactions',
  '@storybook/react',
  '@storybook/react-vite',
  '@storybook/test',
  // Tauri (used in build process and plugins)
  '@tauri-apps/cli',
  '@tauri-apps/plugin-shell', // JS bindings for Rust plugin, used via shell:allow-open permission
  // Router CLI (used in scripts)
  '@tanstack/router-cli',
  '@tanstack/router-plugin',
];

/**
 * File patterns that should be excluded from orphan detection
 */
const ORPHAN_EXCLUDE_PATTERNS = [
  /index\.(ts|tsx)$/, // Index files are entry points
  /types?\.(ts|tsx)$/, // Type definition files
  /\.d\.ts$/, // Declaration files
  /\.config\.(ts|js|mjs)$/, // Config files
  /main\.(ts|tsx)$/, // Entry points
  /App\.(ts|tsx)$/, // Main app component
  /vite-env\.d\.ts$/, // Vite environment types
  /routeTree\.gen\.ts$/, // Generated route tree
];

// =============================================================================
// Package Discovery
// =============================================================================

/**
 * Discover all packages in the monorepo
 */
function discoverPackages(): PackageInfo[] {
  const packages: PackageInfo[] = [];

  // Root package.json
  const rootPkgPath = resolve(ROOT_DIR, 'package.json');
  if (existsSync(rootPkgPath)) {
    const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
    packages.push({
      name: rootPkg.name || 'root',
      path: ROOT_DIR,
      packageJsonPath: rootPkgPath,
      dependencies: Object.keys(rootPkg.dependencies || {}),
      devDependencies: Object.keys(rootPkg.devDependencies || {}),
    });
  }

  // Discover packages in packages/ directory
  for (const [pkgName, pkgPath] of Object.entries(PACKAGE_PATHS)) {
    const pkgJsonPath = resolve(ROOT_DIR, pkgPath, 'package.json');
    if (existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
        packages.push({
          name: pkg.name || pkgName,
          path: resolve(ROOT_DIR, pkgPath),
          packageJsonPath: pkgJsonPath,
          dependencies: Object.keys(pkg.dependencies || {}),
          devDependencies: Object.keys(pkg.devDependencies || {}),
        });
      } catch {
        // Skip invalid package.json files
      }
    }
  }

  return packages;
}

/**
 * Get package name from file path
 */
function getPackageFromFile(filePath: string): string {
  const relativePath = relative(ROOT_DIR, filePath);

  for (const [name, pkgPath] of Object.entries(PACKAGE_PATHS)) {
    if (relativePath.startsWith(pkgPath)) {
      return (PACKAGE_NAMES as Record<string, string>)[name] || name;
    }
  }

  // Files in src/ are part of the root package
  if (relativePath.startsWith('src/')) {
    return 'openflow';
  }

  return 'root';
}

// =============================================================================
// File Scanning
// =============================================================================

/**
 * Get all TypeScript files for analysis
 */
function getAllTypeScriptFiles(): string[] {
  const patterns = ['packages/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'];

  const excludes = [
    ...CODE_QUALITY_EXCLUDES,
    // Additional excludes for dead code analysis
    '**/*.config.{ts,js,mjs}',
    '**/vite-env.d.ts',
  ];

  const allFiles: string[] = [];
  for (const pattern of patterns) {
    const files = globSync(pattern, {
      cwd: ROOT_DIR,
      ignore: excludes,
    });
    allFiles.push(...files);
  }

  return [...new Set(allFiles)];
}

// =============================================================================
// Export Analysis
// =============================================================================

/**
 * Build a map of all exports across the codebase
 */
function buildExportMap(files: string[]): Map<string, Map<string, ExportInfo>> {
  const exportMap = new Map<string, Map<string, ExportInfo>>();

  for (const file of files) {
    const fullPath = resolve(ROOT_DIR, file);
    const exports = getExportedSymbols(fullPath);

    if (exports.length > 0) {
      const fileExports = new Map<string, ExportInfo>();
      for (const exp of exports) {
        fileExports.set(exp.name, exp);
      }
      exportMap.set(file, fileExports);
    }
  }

  return exportMap;
}

/**
 * Build a map of all imports across the codebase
 * Returns: Map<importSource, Set<importedNames>>
 */
function buildImportUsageMap(files: string[]): {
  // Map of import specifier to set of specifiers used
  packageImports: Map<string, Set<string>>;
  // Map of relative file path to set of files that import it
  fileImporters: Map<string, Set<string>>;
  // Map of file path to set of external packages imported
  fileExternalImports: Map<string, Set<string>>;
} {
  const packageImports = new Map<string, Set<string>>();
  const fileImporters = new Map<string, Set<string>>();
  const fileExternalImports = new Map<string, Set<string>>();

  for (const file of files) {
    const fullPath = resolve(ROOT_DIR, file);
    const imports = analyzeImports(fullPath);

    const externalImports = new Set<string>();

    for (const imp of imports) {
      // Track external/package imports
      if (!isRelativeImport(imp.source)) {
        const basePkg = getBasePackage(imp.source);
        externalImports.add(basePkg);

        // Track which specifiers are used from each package
        const existing = packageImports.get(basePkg) || new Set();
        for (const spec of imp.specifiers) {
          existing.add(spec);
        }
        if (imp.specifiers.length === 0 && (imp.isDefault || imp.isNamespace)) {
          existing.add('default');
        }
        packageImports.set(basePkg, existing);
      }

      // Track relative imports (file-to-file dependencies)
      if (isRelativeImport(imp.source)) {
        const importerDir = dirname(file);
        let importedPath = resolve(ROOT_DIR, importerDir, imp.source);

        // Normalize the path (remove .ts/.tsx extension if not present)
        if (!importedPath.endsWith('.ts') && !importedPath.endsWith('.tsx')) {
          // Try different extensions
          for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
            const tryPath = importedPath + ext;
            if (files.includes(relative(ROOT_DIR, tryPath))) {
              importedPath = tryPath;
              break;
            }
          }
        }

        const relativeImportedPath = relative(ROOT_DIR, importedPath);
        const existingImporters = fileImporters.get(relativeImportedPath) || new Set();
        existingImporters.add(file);
        fileImporters.set(relativeImportedPath, existingImporters);
      }
    }

    fileExternalImports.set(file, externalImports);
  }

  return { packageImports, fileImporters, fileExternalImports };
}

/**
 * Find unused exports
 */
function findUnusedExports(
  exportMap: Map<string, Map<string, ExportInfo>>,
  fileImporters: Map<string, Set<string>>
): UnusedExportInfo[] {
  const unusedExports: UnusedExportInfo[] = [];

  for (const [file, exports] of exportMap) {
    const packageName = getPackageFromFile(resolve(ROOT_DIR, file));

    // Skip relaxed packages
    if (RELAXED_EXPORT_PACKAGES.includes(packageName)) {
      continue;
    }

    // Check if this file is imported anywhere
    const importers = fileImporters.get(file);

    // If the file has no importers, all its exports are potentially unused
    // (unless they're re-exported from an index file)
    if (!importers || importers.size === 0) {
      // Check if this is an index file or entry point
      if (ORPHAN_EXCLUDE_PATTERNS.some((p) => p.test(file))) {
        continue;
      }

      // Check each export
      for (const [exportName, exportInfo] of exports) {
        // Skip ignored export names
        if (IGNORED_EXPORT_NAMES.includes(exportName)) {
          continue;
        }

        // Skip re-exports (these are handled at the source)
        if (exportInfo.isReExport) {
          continue;
        }

        unusedExports.push({
          name: exportName,
          file,
          line: exportInfo.line,
          isType: exportInfo.isType,
          packageName,
        });
      }
    }
  }

  return unusedExports;
}

// =============================================================================
// Dependency Analysis
// =============================================================================

/**
 * Find unused dependencies in package.json files
 */
function findUnusedDependencies(
  packages: PackageInfo[],
  fileExternalImports: Map<string, Set<string>>
): UnusedDependencyInfo[] {
  const unusedDeps: UnusedDependencyInfo[] = [];

  // Aggregate all external imports across the codebase
  const allUsedPackages = new Set<string>();
  for (const imports of fileExternalImports.values()) {
    for (const pkg of imports) {
      allUsedPackages.add(pkg);
    }
  }

  // Check each package's dependencies
  for (const pkg of packages) {
    // Check dependencies
    for (const dep of pkg.dependencies) {
      if (IGNORED_DEPENDENCIES.includes(dep)) {
        continue;
      }
      if (!allUsedPackages.has(dep)) {
        unusedDeps.push({
          name: dep,
          packageJsonPath: relative(ROOT_DIR, pkg.packageJsonPath),
          isDevDependency: false,
        });
      }
    }

    // Check devDependencies (only for root package, as workspace packages may inherit)
    if (pkg.name === 'openflow' || pkg.name === 'root') {
      for (const dep of pkg.devDependencies) {
        if (IGNORED_DEPENDENCIES.includes(dep)) {
          continue;
        }
        if (!allUsedPackages.has(dep)) {
          unusedDeps.push({
            name: dep,
            packageJsonPath: relative(ROOT_DIR, pkg.packageJsonPath),
            isDevDependency: true,
          });
        }
      }
    }
  }

  return unusedDeps;
}

// =============================================================================
// Orphan File Detection
// =============================================================================

/**
 * Find orphan files (files with no importers)
 */
function findOrphanFiles(
  files: string[],
  exportMap: Map<string, Map<string, ExportInfo>>,
  fileImporters: Map<string, Set<string>>
): OrphanFileInfo[] {
  const orphanFiles: OrphanFileInfo[] = [];

  for (const file of files) {
    // Skip excluded patterns
    if (ORPHAN_EXCLUDE_PATTERNS.some((p) => p.test(file))) {
      continue;
    }

    const importers = fileImporters.get(file);
    const exports = exportMap.get(file);

    // File is an orphan if:
    // 1. No other files import it
    // 2. It either has no exports OR its exports are not used
    if (!importers || importers.size === 0) {
      const packageName = getPackageFromFile(resolve(ROOT_DIR, file));

      // Skip relaxed packages
      if (RELAXED_EXPORT_PACKAGES.includes(packageName)) {
        continue;
      }

      const hasExports = exports && exports.size > 0;
      const fullPath = resolve(ROOT_DIR, file);
      const imports = analyzeImports(fullPath);
      const hasImports = imports.length > 0;

      // Only flag files that have no importers and either no exports or unused exports
      // Files with imports but no importers might be entry points
      if (!hasImports && !hasExports) {
        orphanFiles.push({
          file,
          packageName,
          hasExports: false,
          hasImports: false,
        });
      }
    }
  }

  return orphanFiles;
}

// =============================================================================
// Validation
// =============================================================================

interface ValidationResult {
  violations: Violation[];
  filesChecked: number;
  packagesChecked: number;
  exportsAnalyzed: number;
  dependenciesAnalyzed: number;
  unusedExports: UnusedExportInfo[];
  unusedDependencies: UnusedDependencyInfo[];
  orphanFiles: OrphanFileInfo[];
}

function validate(verbose = false): ValidationResult {
  const violations: Violation[] = [];

  // Discover packages
  const packages = discoverPackages();
  if (verbose) {
    console.log(`  Found ${packages.length} packages to analyze\n`);
  }

  // Get all TypeScript files
  const files = getAllTypeScriptFiles();
  if (verbose) {
    console.log(`  Analyzing ${files.length} TypeScript files...\n`);
  }

  // Build export map
  if (verbose) {
    console.log('  Phase 1: Building export map...');
  }
  const exportMap = buildExportMap(files);

  let totalExports = 0;
  for (const exports of exportMap.values()) {
    totalExports += exports.size;
  }
  if (verbose) {
    console.log(`    Found ${totalExports} exports across ${exportMap.size} files\n`);
  }

  // Build import usage map
  if (verbose) {
    console.log('  Phase 2: Analyzing imports...');
  }
  const { packageImports, fileImporters, fileExternalImports } = buildImportUsageMap(files);
  if (verbose) {
    console.log(`    Found ${packageImports.size} external packages imported`);
    console.log(`    Found ${fileImporters.size} files with importers\n`);
  }

  // Find unused exports
  if (verbose) {
    console.log('  Phase 3: Finding unused exports...');
  }
  const unusedExports = findUnusedExports(exportMap, fileImporters);
  if (verbose) {
    console.log(`    Found ${unusedExports.length} potentially unused exports\n`);
  }

  // Find unused dependencies
  if (verbose) {
    console.log('  Phase 4: Finding unused dependencies...');
  }
  const totalDeps = packages.reduce(
    (sum, p) => sum + p.dependencies.length + p.devDependencies.length,
    0
  );
  const unusedDependencies = findUnusedDependencies(packages, fileExternalImports);
  if (verbose) {
    console.log(`    Analyzed ${totalDeps} dependencies`);
    console.log(`    Found ${unusedDependencies.length} potentially unused dependencies\n`);
  }

  // Find orphan files
  if (verbose) {
    console.log('  Phase 5: Finding orphan files...');
  }
  const orphanFiles = findOrphanFiles(files, exportMap, fileImporters);
  if (verbose) {
    console.log(`    Found ${orphanFiles.length} orphan files\n`);
  }

  // Convert to violations
  for (const exp of unusedExports) {
    violations.push({
      file: exp.file,
      line: exp.line,
      column: 1,
      rule: 'dead/unused-export',
      message: `Export "${exp.name}" is never imported${exp.isType ? ' (type)' : ''}`,
      severity: 'warning',
      suggestion: exp.isType
        ? 'Remove unused type export or ensure it is re-exported from package barrel file'
        : 'Remove unused export or add it to the package public API',
      metadata: {
        exportName: exp.name,
        packageName: exp.packageName,
        isType: exp.isType,
      },
    });
  }

  for (const dep of unusedDependencies) {
    violations.push({
      file: dep.packageJsonPath,
      line: 1,
      column: 1,
      rule: 'dead/unused-dependency',
      message: `Dependency "${dep.name}" is not imported anywhere`,
      severity: 'error',
      suggestion: dep.isDevDependency
        ? `Remove "${dep.name}" from devDependencies if not needed for build/test`
        : `Remove "${dep.name}" from dependencies or ensure it is actually used`,
      metadata: {
        dependencyName: dep.name,
        isDevDependency: dep.isDevDependency,
      },
    });
  }

  for (const orphan of orphanFiles) {
    violations.push({
      file: orphan.file,
      line: 1,
      column: 1,
      rule: 'dead/orphan-file',
      message: 'File is not imported by any other file and has no used exports',
      severity: 'warning',
      suggestion: 'Remove this file if it is no longer needed, or import it from another module',
      metadata: {
        packageName: orphan.packageName,
        hasExports: orphan.hasExports,
        hasImports: orphan.hasImports,
      },
    });
  }

  return {
    violations,
    filesChecked: files.length,
    packagesChecked: packages.length,
    exportsAnalyzed: totalExports,
    dependenciesAnalyzed: totalDeps,
    unusedExports,
    unusedDependencies,
    orphanFiles,
  };
}

// =============================================================================
// Main Entry Point
// =============================================================================

function main(): void {
  const args = parseValidatorArgs();

  if (args.help) {
    console.log(`
Dead Code Validator

Usage: pnpm validate:dead-code [options]

Options:
  --report, -r    Generate JSON report in reports/dead-code.json
  --verbose, -v   Show detailed output including analysis progress
  --help, -h      Show this help message

Description:
  Identifies unused exports and dependencies across the codebase.
  Uses AST-based analysis for accurate detection of dead code.

Rules:
  dead/unused-export      - Export not imported anywhere (info)
  dead/unused-dependency  - Package.json dependency not imported (warning)
  dead/orphan-file        - File with no importers (info)

Exclusions:
  The following are excluded from analysis:
  - Generated code (packages/generated/**, *.gen.ts, *.generated.ts)
  - Test files (*.test.ts, *.spec.ts)
  - Story files (*.stories.tsx)
  - Index and type definition files
  - Configuration files (*.config.ts, vite-env.d.ts)
  - Common peer/build dependencies

Philosophy:
  Dead code increases maintenance burden and cognitive load.
  However, not all unused exports are necessarily dead code:
  - Public API surfaces may have unused exports
  - Generated types are sources of truth
  - Some dependencies are used in configuration files

  This validator uses 'info' severity for exports and 'warning' for
  dependencies to avoid blocking builds while still highlighting
  potential cleanup opportunities.

Examples:
  pnpm validate:dead-code              # Run with default output
  pnpm validate:dead-code --verbose    # Show detailed analysis
  pnpm validate:dead-code --report     # Generate JSON report
`);
    process.exit(0);
  }

  const reporter = new Reporter('dead-code', {
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
    packagesChecked: result.packagesChecked,
    exportsAnalyzed: result.exportsAnalyzed,
    dependenciesAnalyzed: result.dependenciesAnalyzed,
    unusedExportsCount: result.unusedExports.length,
    unusedDependenciesCount: result.unusedDependencies.length,
    orphanFilesCount: result.orphanFiles.length,
    config: DEAD_CODE_CONFIG.name,
  });

  // Print summary info
  if (!args.verbose) {
    console.log(`  Files analyzed: ${result.filesChecked}`);
    console.log(`  Packages analyzed: ${result.packagesChecked}`);
    console.log(`  Exports analyzed: ${result.exportsAnalyzed}`);
    console.log(`  Dependencies analyzed: ${result.dependenciesAnalyzed}`);
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
