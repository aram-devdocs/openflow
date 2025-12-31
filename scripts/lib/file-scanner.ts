/**
 * Validation Framework - File Scanner Utility
 *
 * Provides glob-based file discovery with consistent exclude patterns
 * for use across all validators in the OpenFlow validation suite.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { globSync } from 'glob';
import type { FileScanResult, FileScannerOptions } from './types';

// =============================================================================
// Constants
// =============================================================================

/**
 * Default directory exclude patterns applied to all scans.
 * These directories typically contain generated, third-party, or non-source code.
 */
export const DEFAULT_EXCLUDE_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  '.turbo',
  '.next',
  'coverage',
  'target', // Rust target directory
  '.tauri',
  '__mocks__',
  '__snapshots__',
]);

/**
 * Default file patterns to exclude from scanning.
 * Matches test files, story files, declaration files, and build artifacts.
 */
export const DEFAULT_EXCLUDE_PATTERNS = [
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
  '**/*.stories.{ts,tsx}',
  '**/*.d.ts',
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/coverage/**',
  '**/target/**',
];

/**
 * Common file extensions for TypeScript/JavaScript projects
 */
export const TS_EXTENSIONS = ['.ts', '.tsx'];
export const JS_EXTENSIONS = ['.js', '.jsx', '.mjs', '.cjs'];
export const ALL_JS_EXTENSIONS = [...TS_EXTENSIONS, ...JS_EXTENSIONS];

/**
 * Path constants for OpenFlow project structure
 */
export const PATHS = {
  /** Root directory (resolved from this file location) */
  ROOT: resolve(dirname(dirname(__dirname))),
  /** Packages directory */
  PACKAGES: 'packages',
  /** Source directory */
  SRC: 'src',
  /** Routes directory */
  ROUTES: 'src/routes',
  /** Tauri backend directory */
  TAURI: 'src-tauri',
  /** Reports output directory */
  REPORTS: 'reports',
  /** Scripts directory */
  SCRIPTS: 'scripts',
} as const;

/**
 * Package paths for OpenFlow monorepo packages
 */
export const PACKAGE_PATHS = {
  UI: 'packages/ui',
  HOOKS: 'packages/hooks',
  QUERIES: 'packages/queries',
  VALIDATION: 'packages/validation',
  GENERATED: 'packages/generated',
  UTILS: 'packages/utils',
} as const;

// =============================================================================
// File Scanner Functions
// =============================================================================

/**
 * Scan for files matching glob patterns with consistent exclude patterns.
 *
 * @param patterns - Glob pattern(s) to match against
 * @param options - Scanner options for customizing behavior
 * @returns Object containing matched files, counts, and timing
 *
 * @example
 * ```ts
 * // Find all TypeScript files in packages/ui
 * const result = scanFiles('packages/ui/**\/*.{ts,tsx}');
 *
 * // Find files with custom excludes
 * const result = scanFiles(['packages/**\/*.ts'], {
 *   excludes: ['**\/*.config.ts'],
 *   extensions: ['.ts']
 * });
 * ```
 */
export function scanFiles(
  patterns: string | string[],
  options: FileScannerOptions = {}
): FileScanResult {
  const startTime = Date.now();
  const { excludes = [], extensions, cwd = PATHS.ROOT } = options;

  // Normalize patterns to array
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];

  // Combine default excludes with user-provided excludes
  const allExcludes = [...DEFAULT_EXCLUDE_PATTERNS, ...excludes];

  // Use glob to find all matching files
  let files: string[] = [];

  for (const pattern of patternArray) {
    const matches = globSync(pattern, {
      cwd,
      ignore: allExcludes,
      absolute: false,
      nodir: true,
    });
    files.push(...matches);
  }

  // Remove duplicates (in case patterns overlap)
  files = [...new Set(files)];

  // Track total before extension filtering
  const totalScanned = files.length;

  // Filter by extensions if specified
  if (extensions && extensions.length > 0) {
    files = filterByExtension(files, extensions);
  }

  // Sort files for consistent output
  files.sort();

  return {
    files,
    totalScanned,
    scanTimeMs: Date.now() - startTime,
  };
}

/**
 * Recursively scan a directory for source files.
 *
 * This function walks the directory tree manually, respecting exclude directories.
 * Use this when you need more control over directory traversal than glob provides.
 *
 * @param dir - Directory to scan
 * @param options - Scanner options
 * @returns Array of file paths (relative to cwd)
 *
 * @example
 * ```ts
 * const files = scanDirectory('packages/ui/src', {
 *   extensions: ['.ts', '.tsx']
 * });
 * ```
 */
export function scanDirectory(dir: string, options: FileScannerOptions = {}): string[] {
  const { excludes = [], extensions, cwd = PATHS.ROOT } = options;
  const fullDir = resolve(cwd, dir);
  const files: string[] = [];

  if (!existsSync(fullDir)) {
    return files;
  }

  // Create a set of exclude patterns for faster lookup
  const excludePatterns = excludes.map((pattern) => new RegExp(pattern.replace(/\*/g, '.*')));

  function walk(currentDir: string): void {
    try {
      const entries = readdirSync(currentDir);

      for (const entry of entries) {
        const entryPath = join(currentDir, entry);
        const relativePath = relative(cwd, entryPath);

        try {
          const stat = statSync(entryPath);

          if (stat.isDirectory()) {
            // Skip excluded directories
            if (DEFAULT_EXCLUDE_DIRS.has(entry)) {
              continue;
            }

            // Check against exclude patterns
            if (excludePatterns.some((pattern) => pattern.test(relativePath))) {
              continue;
            }

            walk(entryPath);
          } else if (stat.isFile()) {
            // Skip excluded file patterns
            if (shouldSkipFile(relativePath)) {
              continue;
            }

            // Check against exclude patterns
            if (excludePatterns.some((pattern) => pattern.test(relativePath))) {
              continue;
            }

            // Filter by extension if specified
            if (extensions && extensions.length > 0) {
              const ext = extname(entry);
              if (!extensions.includes(ext)) {
                continue;
              }
            }

            files.push(relativePath);
          }
        } catch {
          // Skip files we can't access
        }
      }
    } catch {
      // Skip directories we can't access
    }
  }

  walk(fullDir);
  return files.sort();
}

/**
 * Filter a list of files by extension.
 *
 * @param files - Array of file paths
 * @param extensions - Array of extensions to include (with leading dot)
 * @returns Filtered array of files
 *
 * @example
 * ```ts
 * const tsFiles = filterByExtension(files, ['.ts', '.tsx']);
 * ```
 */
export function filterByExtension(files: string[], extensions: string[]): string[] {
  const extSet = new Set(extensions.map((ext) => (ext.startsWith('.') ? ext : `.${ext}`)));
  return files.filter((file) => extSet.has(extname(file)));
}

/**
 * Get the relative path from the project root.
 *
 * @param absolutePath - Absolute path to convert
 * @param rootDir - Optional root directory (defaults to PATHS.ROOT)
 * @returns Relative path from root
 *
 * @example
 * ```ts
 * const rel = getRelativePath('/Users/dev/openflow/packages/ui/src/Button.tsx');
 * // => 'packages/ui/src/Button.tsx'
 * ```
 */
export function getRelativePath(absolutePath: string, rootDir: string = PATHS.ROOT): string {
  return relative(rootDir, absolutePath);
}

/**
 * Get the absolute path from a relative path.
 *
 * @param relativePath - Relative path from project root
 * @param rootDir - Optional root directory (defaults to PATHS.ROOT)
 * @returns Absolute path
 */
export function getAbsolutePath(relativePath: string, rootDir: string = PATHS.ROOT): string {
  return resolve(rootDir, relativePath);
}

/**
 * Check if a file should be skipped based on default patterns.
 *
 * @param filePath - File path to check
 * @returns true if the file should be skipped
 */
export function shouldSkipFile(filePath: string): boolean {
  // Test files
  if (/\.test\.(ts|tsx)$/.test(filePath)) return true;
  if (/\.spec\.(ts|tsx)$/.test(filePath)) return true;

  // Story files
  if (/\.stories\.(ts|tsx)$/.test(filePath)) return true;

  // Declaration files
  if (/\.d\.ts$/.test(filePath)) return true;

  // Index files in certain contexts (usually just re-exports)
  // Note: We don't skip all index files, just be aware of them

  return false;
}

/**
 * Check if a directory path is within a specific package.
 *
 * @param filePath - File path to check
 * @param packagePath - Package path from PACKAGE_PATHS
 * @returns true if file is within the package
 *
 * @example
 * ```ts
 * if (isInPackage('packages/ui/src/Button.tsx', PACKAGE_PATHS.UI)) {
 *   // Handle UI package file
 * }
 * ```
 */
export function isInPackage(filePath: string, packagePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return normalized.startsWith(packagePath) || normalized.startsWith(`./${packagePath}`);
}

/**
 * Get the package name from a file path.
 *
 * @param filePath - File path to analyze
 * @returns Package path or undefined if not in a known package
 *
 * @example
 * ```ts
 * const pkg = getPackageFromPath('packages/ui/src/Button.tsx');
 * // => 'packages/ui'
 * ```
 */
export function getPackageFromPath(filePath: string): string | undefined {
  const normalized = filePath.replace(/\\/g, '/').replace(/^\.\//, '');

  for (const pkgPath of Object.values(PACKAGE_PATHS)) {
    if (normalized.startsWith(pkgPath)) {
      return pkgPath;
    }
  }

  // Check for routes (special case)
  if (normalized.startsWith(PATHS.ROUTES)) {
    return PATHS.ROUTES;
  }

  // Check for src directory
  if (normalized.startsWith(PATHS.SRC)) {
    return PATHS.SRC;
  }

  return undefined;
}

/**
 * Get all TypeScript files in a package.
 *
 * @param packagePath - Package path from PACKAGE_PATHS
 * @param options - Additional scanner options
 * @returns Array of file paths
 *
 * @example
 * ```ts
 * const uiFiles = getPackageFiles(PACKAGE_PATHS.UI);
 * ```
 */
export function getPackageFiles(
  packagePath: string,
  options: FileScannerOptions = {}
): FileScanResult {
  return scanFiles(`${packagePath}/**/*.{ts,tsx}`, {
    extensions: TS_EXTENSIONS,
    ...options,
  });
}

/**
 * Check if a file exists.
 *
 * @param filePath - Path to check
 * @param rootDir - Optional root directory
 * @returns true if file exists
 */
export function fileExists(filePath: string, rootDir: string = PATHS.ROOT): boolean {
  return existsSync(resolve(rootDir, filePath));
}

// =============================================================================
// Glob Pattern Helpers
// =============================================================================

/**
 * Create a glob pattern for TypeScript files in a directory.
 *
 * @param dir - Directory path
 * @param recursive - Whether to include subdirectories (default: true)
 * @returns Glob pattern string
 */
export function tsGlob(dir: string, recursive = true): string {
  return recursive ? `${dir}/**/*.{ts,tsx}` : `${dir}/*.{ts,tsx}`;
}

/**
 * Create a glob pattern for JavaScript files in a directory.
 *
 * @param dir - Directory path
 * @param recursive - Whether to include subdirectories (default: true)
 * @returns Glob pattern string
 */
export function jsGlob(dir: string, recursive = true): string {
  return recursive ? `${dir}/**/*.{js,jsx,mjs,cjs}` : `${dir}/*.{js,jsx,mjs,cjs}`;
}

/**
 * Create a glob pattern for Rust files in a directory.
 *
 * @param dir - Directory path
 * @param recursive - Whether to include subdirectories (default: true)
 * @returns Glob pattern string
 */
export function rustGlob(dir: string, recursive = true): string {
  return recursive ? `${dir}/**/*.rs` : `${dir}/*.rs`;
}

// =============================================================================
// FileScanner Class (Alternative OOP API)
// =============================================================================

/**
 * FileScanner class provides an object-oriented interface for file scanning.
 * Use this when you need to perform multiple scans with the same base configuration.
 *
 * @example
 * ```ts
 * const scanner = new FileScanner({ cwd: 'packages/ui' });
 * const tsFiles = scanner.scan('**\/*.ts');
 * const components = scanner.scan('src/components/**\/*.tsx');
 * ```
 */
export class FileScanner {
  private readonly options: Required<FileScannerOptions>;

  constructor(options: FileScannerOptions = {}) {
    this.options = {
      excludes: options.excludes ?? [],
      extensions: options.extensions ?? TS_EXTENSIONS,
      cwd: options.cwd ?? PATHS.ROOT,
    };
  }

  /**
   * Scan for files matching the given pattern(s).
   */
  scan(patterns: string | string[]): FileScanResult {
    return scanFiles(patterns, this.options);
  }

  /**
   * Scan a specific directory.
   */
  scanDir(dir: string): string[] {
    return scanDirectory(dir, this.options);
  }

  /**
   * Get the working directory.
   */
  getCwd(): string {
    return this.options.cwd;
  }

  /**
   * Get the configured extensions.
   */
  getExtensions(): string[] {
    return [...this.options.extensions];
  }

  /**
   * Get the configured excludes.
   */
  getExcludes(): string[] {
    return [...this.options.excludes];
  }

  /**
   * Check if a file exists relative to cwd.
   */
  exists(filePath: string): boolean {
    return fileExists(filePath, this.options.cwd);
  }

  /**
   * Get relative path from cwd.
   */
  relative(absolutePath: string): string {
    return getRelativePath(absolutePath, this.options.cwd);
  }

  /**
   * Get absolute path from relative path.
   */
  absolute(relativePath: string): string {
    return getAbsolutePath(relativePath, this.options.cwd);
  }
}
