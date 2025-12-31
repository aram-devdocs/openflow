/**
 * Validation Framework - Import Analyzer Library
 *
 * Provides AST-based import analysis using the TypeScript compiler API.
 * This ensures accurate parsing of ES6 imports, dynamic imports, and require calls.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as ts from 'typescript';
import type { ExportInfo, ImportInfo } from './types';

// =============================================================================
// TypeScript Program Cache
// =============================================================================

/**
 * Cache for TypeScript source files to avoid repeated parsing
 */
const sourceFileCache = new Map<string, ts.SourceFile>();

/**
 * Get or create a TypeScript source file for the given path.
 * Uses caching to improve performance when analyzing the same file multiple times.
 */
function getSourceFile(filePath: string): ts.SourceFile | undefined {
  const absolutePath = resolve(filePath);

  // Check cache first
  const cached = sourceFileCache.get(absolutePath);
  if (cached) {
    return cached;
  }

  try {
    const content = readFileSync(absolutePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      absolutePath,
      content,
      ts.ScriptTarget.Latest,
      true, // setParentNodes
      ts.ScriptKind.TSX // Handle both TS and TSX
    );

    sourceFileCache.set(absolutePath, sourceFile);
    return sourceFile;
  } catch {
    return undefined;
  }
}

/**
 * Clear the source file cache.
 * Useful when files may have changed between analyses.
 */
export function clearSourceFileCache(): void {
  sourceFileCache.clear();
}

// =============================================================================
// Import Analysis
// =============================================================================

/**
 * Analyze all imports in a TypeScript/JavaScript file.
 *
 * Handles:
 * - ES6 static imports (import { x } from 'y')
 * - Default imports (import x from 'y')
 * - Namespace imports (import * as x from 'y')
 * - Type-only imports (import type { x } from 'y')
 * - Dynamic imports (import('y'))
 * - CommonJS require calls (require('y'))
 *
 * @param filePath - Path to the file to analyze
 * @returns Array of ImportInfo objects describing each import
 *
 * @example
 * ```ts
 * const imports = analyzeImports('src/components/Button.tsx');
 * for (const imp of imports) {
 *   console.log(`Import from ${imp.source} at line ${imp.line}`);
 * }
 * ```
 */
export function analyzeImports(filePath: string): ImportInfo[] {
  const sourceFile = getSourceFile(filePath);
  if (!sourceFile) {
    return [];
  }

  const imports: ImportInfo[] = [];

  function visit(node: ts.Node): void {
    // Handle ES6 imports
    if (ts.isImportDeclaration(node)) {
      const importInfo = parseImportDeclaration(node, sourceFile);
      if (importInfo) {
        imports.push(importInfo);
      }
    }

    // Handle re-exports: export { foo } from './module' or export * from './module'
    // These are effectively imports that get re-exported, so we count them as imports
    if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      const reExportImport = parseReExportAsImport(node, sourceFile);
      if (reExportImport) {
        imports.push(reExportImport);
      }
    }

    // Handle dynamic imports: import('module')
    if (ts.isCallExpression(node)) {
      const dynamicImport = parseDynamicImport(node, sourceFile);
      if (dynamicImport) {
        imports.push(dynamicImport);
      }
    }

    // Handle require calls: require('module')
    if (ts.isCallExpression(node)) {
      const requireImport = parseRequireCall(node, sourceFile);
      if (requireImport) {
        imports.push(requireImport);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return imports;
}

/**
 * Parse an ES6 import declaration into ImportInfo
 */
function parseImportDeclaration(
  node: ts.ImportDeclaration,
  sourceFile: ts.SourceFile
): ImportInfo | null {
  const moduleSpecifier = node.moduleSpecifier;
  if (!ts.isStringLiteral(moduleSpecifier)) {
    return null;
  }

  const source = moduleSpecifier.text;
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

  // Check if this is a type-only import
  const isTypeOnly = node.importClause?.isTypeOnly ?? false;

  // Extract specifiers
  const specifiers: string[] = [];
  let isDefault = false;
  let isNamespace = false;

  if (node.importClause) {
    // Default import: import Foo from 'bar'
    if (node.importClause.name) {
      specifiers.push(node.importClause.name.text);
      isDefault = true;
    }

    // Named/namespace bindings
    if (node.importClause.namedBindings) {
      if (ts.isNamespaceImport(node.importClause.namedBindings)) {
        // Namespace import: import * as Foo from 'bar'
        specifiers.push(node.importClause.namedBindings.name.text);
        isNamespace = true;
      } else if (ts.isNamedImports(node.importClause.namedBindings)) {
        // Named imports: import { Foo, Bar } from 'baz'
        for (const element of node.importClause.namedBindings.elements) {
          specifiers.push(element.name.text);
        }
      }
    }
  }

  return {
    source,
    specifiers,
    line: line + 1, // Convert to 1-indexed
    column: character + 1, // Convert to 1-indexed
    isTypeOnly,
    isDefault,
    isNamespace,
    text: node.getText(sourceFile),
  };
}

/**
 * Parse a dynamic import expression: import('module')
 */
function parseDynamicImport(node: ts.CallExpression, sourceFile: ts.SourceFile): ImportInfo | null {
  // Check if this is a dynamic import
  if (node.expression.kind !== ts.SyntaxKind.ImportKeyword) {
    return null;
  }

  // Get the module specifier
  const arg = node.arguments[0];
  if (!arg || !ts.isStringLiteral(arg)) {
    return null;
  }

  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

  return {
    source: arg.text,
    specifiers: [],
    line: line + 1,
    column: character + 1,
    isTypeOnly: false,
    isDefault: false,
    isNamespace: false,
    text: node.getText(sourceFile),
  };
}

/**
 * Parse a re-export as an import: export { foo } from './module' or export * from './module'
 * These are effectively imports that get re-exported, so we track them for dependency analysis.
 */
function parseReExportAsImport(
  node: ts.ExportDeclaration,
  sourceFile: ts.SourceFile
): ImportInfo | null {
  if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) {
    return null;
  }

  const source = node.moduleSpecifier.text;
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

  // Check if this is a type-only export
  const isTypeOnly = node.isTypeOnly;

  // Extract specifiers
  const specifiers: string[] = [];

  if (node.exportClause && ts.isNamedExports(node.exportClause)) {
    // Named re-exports: export { foo, bar } from './module'
    for (const element of node.exportClause.elements) {
      specifiers.push(element.name.text);
    }
  }
  // For export * from './module', specifiers remains empty (namespace re-export)

  return {
    source,
    specifiers,
    line: line + 1,
    column: character + 1,
    isTypeOnly,
    isDefault: false,
    isNamespace: !node.exportClause, // export * from '...' is a namespace re-export
    text: node.getText(sourceFile),
  };
}

/**
 * Parse a require call: require('module')
 */
function parseRequireCall(node: ts.CallExpression, sourceFile: ts.SourceFile): ImportInfo | null {
  // Check if this is a require call
  if (!ts.isIdentifier(node.expression) || node.expression.text !== 'require') {
    return null;
  }

  // Get the module specifier
  const arg = node.arguments[0];
  if (!arg || !ts.isStringLiteral(arg)) {
    return null;
  }

  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

  return {
    source: arg.text,
    specifiers: [],
    line: line + 1,
    column: character + 1,
    isTypeOnly: false,
    isDefault: false,
    isNamespace: false,
    text: node.getText(sourceFile),
  };
}

// =============================================================================
// Export Analysis
// =============================================================================

/**
 * Get all exported symbols from a TypeScript/JavaScript file.
 *
 * @param filePath - Path to the file to analyze
 * @returns Array of ExportInfo objects describing each export
 *
 * @example
 * ```ts
 * const exports = getExportedSymbols('src/utils/helpers.ts');
 * for (const exp of exports) {
 *   console.log(`Export: ${exp.name} (${exp.isType ? 'type' : 'value'})`);
 * }
 * ```
 */
export function getExportedSymbols(filePath: string): ExportInfo[] {
  const sourceFile = getSourceFile(filePath);
  if (!sourceFile) {
    return [];
  }

  const exports: ExportInfo[] = [];

  function visit(node: ts.Node): void {
    // Export declarations: export { foo, bar }
    if (ts.isExportDeclaration(node)) {
      const exportDecl = parseExportDeclaration(node, sourceFile);
      exports.push(...exportDecl);
    }

    // Named exports: export const foo = ..., export function bar() {}
    if (hasExportModifier(node)) {
      const namedExport = parseNamedExport(node, sourceFile);
      if (namedExport) {
        exports.push(namedExport);
      }
    }

    // Default exports: export default ...
    if (ts.isExportAssignment(node)) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      exports.push({
        name: 'default',
        isType: false,
        isDefault: true,
        isReExport: false,
        line: line + 1,
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return exports;
}

/**
 * Get exported symbol names as a simple string array.
 *
 * @param filePath - Path to the file to analyze
 * @returns Array of exported symbol names
 */
export function getExportedSymbolNames(filePath: string): string[] {
  return getExportedSymbols(filePath).map((e) => e.name);
}

/**
 * Parse an export declaration: export { foo, bar } from 'baz'
 */
function parseExportDeclaration(
  node: ts.ExportDeclaration,
  sourceFile: ts.SourceFile
): ExportInfo[] {
  const exports: ExportInfo[] = [];
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const isTypeOnly = node.isTypeOnly;
  const isReExport = node.moduleSpecifier !== undefined;

  if (node.exportClause && ts.isNamedExports(node.exportClause)) {
    for (const element of node.exportClause.elements) {
      exports.push({
        name: element.name.text,
        isType: isTypeOnly,
        isDefault: false,
        isReExport,
        line: line + 1,
      });
    }
  } else if (!node.exportClause && isReExport) {
    // export * from 'module'
    exports.push({
      name: '*',
      isType: isTypeOnly,
      isDefault: false,
      isReExport: true,
      line: line + 1,
    });
  }

  return exports;
}

/**
 * Parse a named export: export const foo = ...
 */
function parseNamedExport(node: ts.Node, sourceFile: ts.SourceFile): ExportInfo | null {
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

  // Variable declarations: export const foo = ...
  if (ts.isVariableStatement(node)) {
    const firstDecl = node.declarationList.declarations[0];
    if (firstDecl && ts.isIdentifier(firstDecl.name)) {
      return {
        name: firstDecl.name.text,
        isType: false,
        isDefault: false,
        isReExport: false,
        line: line + 1,
      };
    }
  }

  // Function declarations: export function foo() {}
  if (ts.isFunctionDeclaration(node) && node.name) {
    return {
      name: node.name.text,
      isType: false,
      isDefault: false,
      isReExport: false,
      line: line + 1,
    };
  }

  // Class declarations: export class Foo {}
  if (ts.isClassDeclaration(node) && node.name) {
    return {
      name: node.name.text,
      isType: false,
      isDefault: false,
      isReExport: false,
      line: line + 1,
    };
  }

  // Type alias: export type Foo = ...
  if (ts.isTypeAliasDeclaration(node)) {
    return {
      name: node.name.text,
      isType: true,
      isDefault: false,
      isReExport: false,
      line: line + 1,
    };
  }

  // Interface: export interface Foo {}
  if (ts.isInterfaceDeclaration(node)) {
    return {
      name: node.name.text,
      isType: true,
      isDefault: false,
      isReExport: false,
      line: line + 1,
    };
  }

  // Enum: export enum Foo {}
  if (ts.isEnumDeclaration(node)) {
    return {
      name: node.name.text,
      isType: false,
      isDefault: false,
      isReExport: false,
      line: line + 1,
    };
  }

  return null;
}

/**
 * Check if a node has an export modifier
 */
function hasExportModifier(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) {
    return false;
  }

  const modifiers = ts.getModifiers(node);
  if (!modifiers) {
    return false;
  }

  return modifiers.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword);
}

// =============================================================================
// Quick Check Functions
// =============================================================================

/**
 * Check if a file has an import from a specific package/module.
 *
 * @param filePath - Path to the file to check
 * @param packageName - Package or module name to check for
 * @returns true if the file imports from the package
 *
 * @example
 * ```ts
 * if (hasImportFrom('src/Button.tsx', '@tauri-apps/api')) {
 *   console.log('File uses Tauri API');
 * }
 * ```
 */
export function hasImportFrom(filePath: string, packageName: string): boolean {
  const imports = analyzeImports(filePath);
  return imports.some(
    (imp) => imp.source === packageName || imp.source.startsWith(`${packageName}/`)
  );
}

/**
 * Check if a file has an import matching a pattern.
 *
 * @param filePath - Path to the file to check
 * @param pattern - Regex pattern to match against import sources
 * @returns true if any import source matches the pattern
 *
 * @example
 * ```ts
 * if (hasImportMatching('src/Button.tsx', /^@openflow\//)) {
 *   console.log('File uses @openflow packages');
 * }
 * ```
 */
export function hasImportMatching(filePath: string, pattern: RegExp): boolean {
  const imports = analyzeImports(filePath);
  return imports.some((imp) => pattern.test(imp.source));
}

/**
 * Get the line number of the first import from a specific package.
 *
 * @param filePath - Path to the file to check
 * @param packageName - Package or module name to find
 * @returns Line number (1-indexed) or undefined if not found
 *
 * @example
 * ```ts
 * const line = getImportLine('src/Button.tsx', '@tauri-apps/api');
 * if (line) {
 *   console.log(`Tauri import at line ${line}`);
 * }
 * ```
 */
export function getImportLine(filePath: string, packageName: string): number | undefined {
  const imports = analyzeImports(filePath);
  const found = imports.find(
    (imp) => imp.source === packageName || imp.source.startsWith(`${packageName}/`)
  );
  return found?.line;
}

/**
 * Get all imports from a specific package or matching a pattern.
 *
 * @param filePath - Path to the file to analyze
 * @param filter - Package name string or RegExp pattern
 * @returns Array of matching ImportInfo objects
 *
 * @example
 * ```ts
 * const reactImports = getImportsFrom('src/App.tsx', /^react/);
 * ```
 */
export function getImportsFrom(filePath: string, filter: string | RegExp): ImportInfo[] {
  const imports = analyzeImports(filePath);

  if (typeof filter === 'string') {
    return imports.filter((imp) => imp.source === filter || imp.source.startsWith(`${filter}/`));
  }

  return imports.filter((imp) => filter.test(imp.source));
}

// =============================================================================
// Package/Module Analysis
// =============================================================================

/**
 * OpenFlow package layer mapping
 */
export const OPENFLOW_PACKAGE_LAYERS = {
  '@openflow/ui': 4,
  '@openflow/hooks': 3,
  '@openflow/queries': 2,
  '@openflow/validation': 1,
  '@openflow/generated': 0,
  '@openflow/utils': 0,
} as const;

/**
 * Get the base package name from an import specifier.
 * Handles scoped packages like @openflow/utils/helpers -> @openflow/utils
 *
 * @param specifier - Import specifier
 * @returns Base package name
 */
export function getBasePackage(specifier: string): string {
  if (!specifier.startsWith('@')) {
    // Unscoped package: 'lodash/fp' -> 'lodash'
    const slashIndex = specifier.indexOf('/');
    return slashIndex === -1 ? specifier : specifier.substring(0, slashIndex);
  }

  // Scoped package: '@openflow/utils/helpers' -> '@openflow/utils'
  const parts = specifier.split('/');
  if (parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }

  return specifier;
}

/**
 * Check if an import specifier is an OpenFlow internal package.
 */
export function isOpenflowPackage(specifier: string): boolean {
  return specifier.startsWith('@openflow/');
}

/**
 * Check if an import specifier is a relative import.
 */
export function isRelativeImport(specifier: string): boolean {
  return specifier.startsWith('./') || specifier.startsWith('../');
}

/**
 * Check if an import specifier is an external (node_modules) package.
 */
export function isExternalImport(specifier: string): boolean {
  return !isRelativeImport(specifier) && !specifier.startsWith('@openflow/');
}

// =============================================================================
// Dependency Graph Building
// =============================================================================

/**
 * Build a dependency graph from a list of files.
 *
 * @param files - Array of file paths to analyze
 * @returns Map of file path to array of imported module specifiers
 *
 * @example
 * ```ts
 * const files = ['src/a.ts', 'src/b.ts', 'src/c.ts'];
 * const graph = buildDependencyGraph(files);
 * for (const [file, deps] of graph) {
 *   console.log(`${file} depends on: ${deps.join(', ')}`);
 * }
 * ```
 */
export function buildDependencyGraph(files: string[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const file of files) {
    const imports = analyzeImports(file);
    const dependencies = imports.map((imp) => imp.source);
    graph.set(file, dependencies);
  }

  return graph;
}

/**
 * Find circular dependencies in a dependency graph.
 *
 * @param graph - Dependency graph from buildDependencyGraph
 * @returns Array of cycles, where each cycle is an array of file paths
 *
 * @example
 * ```ts
 * const graph = buildDependencyGraph(files);
 * const cycles = findCircularDependencies(graph);
 * for (const cycle of cycles) {
 *   console.log(`Circular: ${cycle.join(' -> ')}`);
 * }
 * ```
 */
export function findCircularDependencies(graph: Map<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): void {
    if (recursionStack.has(node)) {
      // Found a cycle
      const cycleStart = path.indexOf(node);
      if (cycleStart !== -1) {
        const cycle = [...path.slice(cycleStart), node];
        cycles.push(cycle);
      }
      return;
    }

    if (visited.has(node)) {
      return;
    }

    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const dependencies = graph.get(node) || [];
    for (const dep of dependencies) {
      // Only follow internal dependencies (files in the graph)
      if (graph.has(dep)) {
        dfs(dep);
      }
    }

    path.pop();
    recursionStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

// =============================================================================
// Import Analyzer Class (OOP Interface)
// =============================================================================

/**
 * ImportAnalyzer class provides an object-oriented interface for import analysis.
 * Useful when analyzing multiple files with shared configuration.
 *
 * @example
 * ```ts
 * const analyzer = new ImportAnalyzer('/path/to/project');
 * const imports = analyzer.analyzeFile('src/Button.tsx');
 * const hasHooks = analyzer.hasImportFrom('src/Button.tsx', '@openflow/hooks');
 * ```
 */
export class ImportAnalyzer {
  private readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  /**
   * Resolve a relative file path to an absolute path.
   */
  private resolvePath(filePath: string): string {
    return resolve(this.rootDir, filePath);
  }

  /**
   * Analyze imports in a file.
   */
  analyzeFile(filePath: string): ImportInfo[] {
    return analyzeImports(this.resolvePath(filePath));
  }

  /**
   * Get exported symbols from a file.
   */
  getExports(filePath: string): ExportInfo[] {
    return getExportedSymbols(this.resolvePath(filePath));
  }

  /**
   * Check if a file has an import from a specific package.
   */
  hasImportFrom(filePath: string, packageName: string): boolean {
    return hasImportFrom(this.resolvePath(filePath), packageName);
  }

  /**
   * Get the line number of an import from a specific package.
   */
  getImportLine(filePath: string, packageName: string): number | undefined {
    return getImportLine(this.resolvePath(filePath), packageName);
  }

  /**
   * Build a dependency graph for the given files.
   */
  buildGraph(files: string[]): Map<string, string[]> {
    const absoluteFiles = files.map((f) => this.resolvePath(f));
    return buildDependencyGraph(absoluteFiles);
  }

  /**
   * Find circular dependencies in the given files.
   */
  findCycles(files: string[]): string[][] {
    const graph = this.buildGraph(files);
    return findCircularDependencies(graph);
  }

  /**
   * Get the root directory.
   */
  getRootDir(): string {
    return this.rootDir;
  }

  /**
   * Clear the internal source file cache.
   */
  clearCache(): void {
    clearSourceFileCache();
  }
}
