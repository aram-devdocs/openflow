/**
 * Circular Dependency Validator (FR-6)
 *
 * Detects circular dependencies at two levels:
 * 1. Package-level cycles: Cycles between @openflow/* packages (error)
 * 2. Module-level cycles: Cycles within a single package (warning)
 *
 * Uses the import-analyzer library to build a dependency graph from AST analysis,
 * then applies Tarjan's algorithm variant to detect strongly connected components.
 *
 * Run: pnpm validate:circular
 * Run with report: pnpm validate:circular --report
 */

import { basename, dirname, relative, resolve } from 'node:path';
import { globSync } from 'glob';

import {
  CIRCULAR_DEPS_CONFIG,
  GENERATED_EXCLUDES,
  PACKAGE_NAMES,
  PACKAGE_PATHS,
  ROOT_DIR,
} from './lib/config';
import { analyzeImports, isRelativeImport } from './lib/import-analyzer';
import { Reporter, parseValidatorArgs } from './lib/reporter';
import type { CycleInfo, Severity, Violation } from './lib/types';

// =============================================================================
// Types
// =============================================================================

interface CircularDepsRule {
  ruleId: string;
  description: string;
  severity: Severity;
}

interface DependencyEdge {
  from: string;
  to: string;
  importLine: number;
  importSource: string;
}

interface PackageDependency {
  fromPackage: string;
  toPackage: string;
  files: Array<{ file: string; line: number; importSource: string }>;
}

// =============================================================================
// Rules
// =============================================================================

const RULES: CircularDepsRule[] = [
  {
    ruleId: 'circular/package-level',
    description: 'Circular dependency between packages',
    severity: 'error',
  },
  {
    ruleId: 'circular/module-level',
    description: 'Circular dependency between modules within a package',
    severity: 'error',
  },
];

// =============================================================================
// Package Detection
// =============================================================================

/**
 * Map of package names to their directory paths
 */
const PACKAGE_NAME_TO_PATH: Record<string, string> = {
  [PACKAGE_NAMES.UI]: PACKAGE_PATHS.UI,
  [PACKAGE_NAMES.HOOKS]: PACKAGE_PATHS.HOOKS,
  [PACKAGE_NAMES.QUERIES]: PACKAGE_PATHS.QUERIES,
  [PACKAGE_NAMES.VALIDATION]: PACKAGE_PATHS.VALIDATION,
  [PACKAGE_NAMES.GENERATED]: PACKAGE_PATHS.GENERATED,
  [PACKAGE_NAMES.UTILS]: PACKAGE_PATHS.UTILS,
};

/**
 * Map of directory paths to package names
 */
const PATH_TO_PACKAGE_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(PACKAGE_NAME_TO_PATH).map(([name, path]) => [path, name])
);

/**
 * Get the package name from a file path
 */
function getPackageFromFile(filePath: string): string | undefined {
  const normalized = filePath.replace(/\\/g, '/').replace(/^\.\//, '');

  for (const [pkgPath, pkgName] of Object.entries(PATH_TO_PACKAGE_NAME)) {
    if (normalized.startsWith(pkgPath)) {
      return pkgName;
    }
  }

  // Handle src/ directory (routes, components, etc.)
  if (normalized.startsWith('src/')) {
    return 'src';
  }

  return undefined;
}

/**
 * Get the package name from an import source
 */
function getPackageFromImport(importSource: string): string | undefined {
  // Handle @openflow/* packages
  if (importSource.startsWith('@openflow/')) {
    const parts = importSource.split('/');
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
  }

  return undefined;
}

/**
 * Resolve a relative import to an absolute module path
 */
function resolveRelativeImport(fromFile: string, importSource: string): string {
  const fromDir = dirname(fromFile);
  let resolved = resolve(ROOT_DIR, fromDir, importSource);

  // Normalize and make relative to ROOT_DIR
  resolved = relative(ROOT_DIR, resolved);

  // Remove .ts/.tsx extension if present, or add it
  if (!resolved.endsWith('.ts') && !resolved.endsWith('.tsx')) {
    // Check if it's a directory import (index file)
    const withTs = `${resolved}.ts`;
    const _withTsx = `${resolved}.tsx`;
    const _withIndex = `${resolved}/index.ts`;
    const _withIndexTsx = `${resolved}/index.tsx`;

    // For simplicity, just append .ts for now
    // In a real implementation, we'd check which file exists
    resolved = withTs;
  }

  return resolved.replace(/\\/g, '/');
}

// =============================================================================
// Dependency Graph Building
// =============================================================================

/**
 * Build a module-level dependency graph for files within a package
 */
function buildModuleDependencyGraph(
  files: string[],
  packagePath: string
): Map<string, DependencyEdge[]> {
  const graph = new Map<string, DependencyEdge[]>();

  for (const file of files) {
    const fullPath = resolve(ROOT_DIR, file);
    const imports = analyzeImports(fullPath);
    const edges: DependencyEdge[] = [];

    for (const imp of imports) {
      // Only consider relative imports within the same package
      if (isRelativeImport(imp.source)) {
        const resolved = resolveRelativeImport(file, imp.source);

        // Check if the resolved import is within the same package
        if (resolved.startsWith(packagePath)) {
          edges.push({
            from: file,
            to: resolved,
            importLine: imp.line,
            importSource: imp.source,
          });
        }
      }
    }

    graph.set(file, edges);
  }

  return graph;
}

/**
 * Build a package-level dependency graph
 */
function buildPackageDependencyGraph(files: string[]): Map<string, PackageDependency[]> {
  const packageDeps = new Map<string, PackageDependency[]>();

  for (const file of files) {
    const fullPath = resolve(ROOT_DIR, file);
    const fromPackage = getPackageFromFile(file);

    if (!fromPackage) continue;

    const imports = analyzeImports(fullPath);

    for (const imp of imports) {
      const toPackage = getPackageFromImport(imp.source);

      if (toPackage && fromPackage !== toPackage && fromPackage.startsWith('@openflow/')) {
        // Add edge to package graph
        const existingDeps = packageDeps.get(fromPackage) || [];
        let dep = existingDeps.find((d) => d.toPackage === toPackage);

        if (!dep) {
          dep = { fromPackage, toPackage, files: [] };
          existingDeps.push(dep);
          packageDeps.set(fromPackage, existingDeps);
        }

        dep.files.push({
          file,
          line: imp.line,
          importSource: imp.source,
        });
      }
    }
  }

  return packageDeps;
}

// =============================================================================
// Cycle Detection (Tarjan's Algorithm)
// =============================================================================

interface TarjanState {
  index: number;
  nodeIndex: Map<string, number>;
  nodeLowLink: Map<string, number>;
  onStack: Set<string>;
  stack: string[];
  sccs: string[][];
}

/**
 * Find strongly connected components using Tarjan's algorithm
 * Returns all SCCs with more than one node (cycles)
 */
function findCycles(adjacencyList: Map<string, string[]>): string[][] {
  const state: TarjanState = {
    index: 0,
    nodeIndex: new Map(),
    nodeLowLink: new Map(),
    onStack: new Set(),
    stack: [],
    sccs: [],
  };

  function strongConnect(node: string): void {
    state.nodeIndex.set(node, state.index);
    state.nodeLowLink.set(node, state.index);
    state.index++;
    state.stack.push(node);
    state.onStack.add(node);

    const neighbors = adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      if (!state.nodeIndex.has(neighbor)) {
        strongConnect(neighbor);
        const nodeLowLink = state.nodeLowLink.get(node) ?? 0;
        const neighborLowLink = state.nodeLowLink.get(neighbor) ?? 0;
        state.nodeLowLink.set(node, Math.min(nodeLowLink, neighborLowLink));
      } else if (state.onStack.has(neighbor)) {
        const nodeLowLink = state.nodeLowLink.get(node) ?? 0;
        const neighborIndex = state.nodeIndex.get(neighbor) ?? 0;
        state.nodeLowLink.set(node, Math.min(nodeLowLink, neighborIndex));
      }
    }

    // If node is a root of an SCC
    if (state.nodeLowLink.get(node) === state.nodeIndex.get(node)) {
      const scc: string[] = [];
      let w: string | undefined;
      do {
        w = state.stack.pop();
        if (!w) break;
        state.onStack.delete(w);
        scc.push(w);
      } while (w !== node);

      // Only include SCCs with more than one node (actual cycles)
      if (scc.length > 1) {
        state.sccs.push(scc);
      }
    }
  }

  for (const node of adjacencyList.keys()) {
    if (!state.nodeIndex.has(node)) {
      strongConnect(node);
    }
  }

  return state.sccs;
}

/**
 * Convert module dependency graph to simple adjacency list
 */
function toAdjacencyList(graph: Map<string, DependencyEdge[]>): Map<string, string[]> {
  const adj = new Map<string, string[]>();

  for (const [node, edges] of graph) {
    adj.set(
      node,
      edges.map((e) => e.to)
    );
  }

  // Also ensure all target nodes are in the map
  for (const edges of graph.values()) {
    for (const edge of edges) {
      if (!adj.has(edge.to)) {
        adj.set(edge.to, []);
      }
    }
  }

  return adj;
}

/**
 * Convert package dependency graph to simple adjacency list
 */
function packageGraphToAdjacencyList(
  graph: Map<string, PackageDependency[]>
): Map<string, string[]> {
  const adj = new Map<string, string[]>();

  for (const [pkg, deps] of graph) {
    adj.set(
      pkg,
      deps.map((d) => d.toPackage)
    );
  }

  // Also ensure all target packages are in the map
  for (const deps of graph.values()) {
    for (const dep of deps) {
      if (!adj.has(dep.toPackage)) {
        adj.set(dep.toPackage, []);
      }
    }
  }

  return adj;
}

/**
 * Extract a representative cycle path from an SCC
 * Returns an ordered path through the cycle
 */
function extractCyclePath(scc: string[], adjacencyList: Map<string, string[]>): string[] {
  if (scc.length === 0) return [];
  if (scc.length === 1) return [scc[0], scc[0]];

  const sccSet = new Set(scc);

  // DFS to find a path through the cycle
  const visited = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): boolean {
    if (visited.has(node)) {
      // Found cycle back to a visited node
      const cycleStart = path.indexOf(node);
      if (cycleStart !== -1) {
        path.push(node); // Close the cycle
        return true;
      }
      return false;
    }

    visited.add(node);
    path.push(node);

    const neighbors = adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      if (sccSet.has(neighbor)) {
        if (dfs(neighbor)) {
          return true;
        }
      }
    }

    path.pop();
    return false;
  }

  dfs(scc[0]);

  return path.length > 1 ? path : [...scc, scc[0]];
}

// =============================================================================
// Validation
// =============================================================================

interface ValidationResult {
  violations: Violation[];
  filesChecked: number;
  packagesChecked: number;
  rulesChecked: number;
  packageCycles: CycleInfo[];
  moduleCycles: CycleInfo[];
}

function validate(verbose = false): ValidationResult {
  const violations: Violation[] = [];
  const packageCycles: CycleInfo[] = [];
  const moduleCycles: CycleInfo[] = [];

  // Get all TypeScript files in packages and src
  const patterns = ['packages/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'];

  const excludes = [
    '**/node_modules/**',
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
    '**/*.stories.{ts,tsx}',
    '**/*.d.ts',
    '**/dist/**',
    '**/build/**',
    // Generated code is excluded - it's auto-generated and shouldn't create cycles
    ...GENERATED_EXCLUDES,
  ];

  let allFiles: string[] = [];
  for (const pattern of patterns) {
    const files = globSync(pattern, {
      cwd: ROOT_DIR,
      ignore: excludes,
    });
    allFiles.push(...files);
  }

  // Remove duplicates
  allFiles = [...new Set(allFiles)];

  if (verbose) {
    console.log(`  Analyzing ${allFiles.length} files for circular dependencies...\n`);
  }

  // ==========================================================================
  // Phase 1: Package-level circular dependency detection
  // ==========================================================================

  if (verbose) {
    console.log('  Phase 1: Checking package-level dependencies...');
  }

  const packageGraph = buildPackageDependencyGraph(allFiles);
  const packageAdjList = packageGraphToAdjacencyList(packageGraph);
  const packageSCCs = findCycles(packageAdjList);

  const checkedPackages = new Set<string>();
  for (const [pkg] of packageGraph) {
    checkedPackages.add(pkg);
  }
  for (const deps of packageGraph.values()) {
    for (const dep of deps) {
      checkedPackages.add(dep.toPackage);
    }
  }

  if (verbose) {
    console.log(`    Packages analyzed: ${checkedPackages.size}`);
    console.log(
      `    Package dependencies found: ${Array.from(packageGraph.values()).flat().length}`
    );
  }

  for (const scc of packageSCCs) {
    const cyclePath = extractCyclePath(scc, packageAdjList);

    packageCycles.push({
      path: cyclePath,
      level: 'package',
    });

    // Find the first file that creates this cycle for the violation
    const cycleStr = cyclePath.join(' → ');
    let firstFile = '';
    let firstLine = 1;
    let firstImport = '';

    // Find the edge that completes the cycle
    for (let i = 0; i < cyclePath.length - 1; i++) {
      const from = cyclePath[i];
      const to = cyclePath[i + 1];
      const deps = packageGraph.get(from);
      const dep = deps?.find((d) => d.toPackage === to);
      if (dep && dep.files.length > 0) {
        firstFile = dep.files[0].file;
        firstLine = dep.files[0].line;
        firstImport = dep.files[0].importSource;
        break;
      }
    }

    violations.push({
      file: firstFile || cyclePath[0],
      line: firstLine,
      column: 1,
      rule: 'circular/package-level',
      message: `Circular dependency between packages: ${cycleStr}`,
      severity: 'error',
      suggestion:
        'Refactor to break the dependency cycle. Consider introducing an interface package or moving shared types to @openflow/generated.',
      metadata: {
        cycle: cyclePath,
        importSource: firstImport,
      },
    });
  }

  if (verbose) {
    console.log(`    Package-level cycles found: ${packageSCCs.length}\n`);
  }

  // ==========================================================================
  // Phase 2: Module-level circular dependency detection (within packages)
  // ==========================================================================

  if (verbose) {
    console.log('  Phase 2: Checking module-level dependencies within packages...');
  }

  // Group files by package
  const filesByPackage = new Map<string, string[]>();
  for (const file of allFiles) {
    const pkg = getPackageFromFile(file);
    if (pkg) {
      const existing = filesByPackage.get(pkg) || [];
      existing.push(file);
      filesByPackage.set(pkg, existing);
    }
  }

  for (const [pkgPath, pkgFiles] of filesByPackage) {
    // Only check within actual package directories (not src/)
    if (!pkgPath.startsWith('@openflow/')) {
      continue;
    }

    const dirPath = PACKAGE_NAME_TO_PATH[pkgPath];
    if (!dirPath) continue;

    if (verbose) {
      console.log(`    Checking ${pkgPath} (${pkgFiles.length} files)...`);
    }

    const moduleGraph = buildModuleDependencyGraph(pkgFiles, dirPath);
    const moduleAdjList = toAdjacencyList(moduleGraph);
    const moduleSCCs = findCycles(moduleAdjList);

    for (const scc of moduleSCCs) {
      const cyclePath = extractCyclePath(scc, moduleAdjList);

      // Make paths relative and more readable
      const readablePath = cyclePath.map((p) => {
        const rel = p.replace(`${dirPath}/`, '');
        return basename(rel, '.ts').replace('.tsx', '');
      });

      moduleCycles.push({
        path: cyclePath,
        level: 'module',
      });

      // Find the import that creates this cycle
      let firstFile = cyclePath[0];
      let firstLine = 1;
      let firstImport = '';

      for (let i = 0; i < cyclePath.length - 1; i++) {
        const from = cyclePath[i];
        const edges = moduleGraph.get(from);
        const edge = edges?.find((e) => e.to === cyclePath[i + 1]);
        if (edge) {
          firstFile = edge.from;
          firstLine = edge.importLine;
          firstImport = edge.importSource;
          break;
        }
      }

      violations.push({
        file: firstFile,
        line: firstLine,
        column: 1,
        rule: 'circular/module-level',
        message: `Circular dependency within ${pkgPath}: ${readablePath.join(' → ')}`,
        severity: 'error',
        suggestion:
          'Consider extracting shared code to a separate module or restructuring to eliminate the cycle.',
        metadata: {
          package: pkgPath,
          cycle: cyclePath,
          importSource: firstImport,
        },
      });
    }

    if (verbose && moduleSCCs.length > 0) {
      console.log(`      Module-level cycles found: ${moduleSCCs.length}`);
    }
  }

  const totalModuleCycles = moduleCycles.length;
  if (verbose) {
    console.log(`    Total module-level cycles found: ${totalModuleCycles}\n`);
  }

  return {
    violations,
    filesChecked: allFiles.length,
    packagesChecked: checkedPackages.size,
    rulesChecked: RULES.length,
    packageCycles,
    moduleCycles,
  };
}

// =============================================================================
// Main Entry Point
// =============================================================================

function main(): void {
  const args = parseValidatorArgs();

  if (args.help) {
    console.log(`
Circular Dependency Validator

Usage: pnpm validate:circular [options]

Options:
  --report, -r    Generate JSON report in reports/circular-deps.json
  --verbose, -v   Show detailed output including analysis progress
  --help, -h      Show this help message

Description:
  Detects circular dependencies at two levels:
  1. Package-level: Cycles between @openflow/* packages (error)
  2. Module-level: Cycles within a single package (warning)

Rules:
  circular/package-level   - No cycles between packages (error)
  circular/module-level    - No cycles within packages (warning)

Philosophy:
  Circular dependencies make code harder to understand, test, and maintain.
  Package-level cycles are particularly problematic as they indicate
  architectural issues. Module-level cycles are less severe but should
  still be avoided where possible.

Examples of package cycles to avoid:
  @openflow/hooks → @openflow/ui → @openflow/hooks
  @openflow/queries → @openflow/hooks → @openflow/queries

Examples of module cycles to avoid:
  packages/hooks/useA.ts → packages/hooks/useB.ts → packages/hooks/useA.ts
`);
    process.exit(0);
  }

  const reporter = new Reporter('circular-deps', {
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
    rulesChecked: result.rulesChecked,
    packageCyclesFound: result.packageCycles.length,
    moduleCyclesFound: result.moduleCycles.length,
    config: CIRCULAR_DEPS_CONFIG.name,
    packageCycles: result.packageCycles,
    moduleCycles: result.moduleCycles,
  });

  // Print summary info
  if (!args.verbose) {
    console.log(`  Files analyzed: ${result.filesChecked}`);
    console.log(`  Packages analyzed: ${result.packagesChecked}`);
    console.log(`  Package-level cycles: ${result.packageCycles.length}`);
    console.log(`  Module-level cycles: ${result.moduleCycles.length}`);
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
