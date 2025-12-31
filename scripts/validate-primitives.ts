#!/usr/bin/env tsx
/**
 * Primitives Validator
 *
 * Ensures only the @openflow/primitives package uses raw HTML tags in JSX.
 * UI components (atoms, molecules, organisms, templates, pages) must use
 * primitives from @openflow/primitives instead of raw HTML elements.
 *
 * This enforces:
 * - Consistent semantic HTML patterns across the codebase
 * - Centralized accessibility defaults (ARIA attributes, focus handling)
 * - Responsive behavior through primitive props
 * - Maintainable styling through controlled components
 *
 * Run: pnpm validate:primitives
 * Run with report: pnpm validate:primitives --report
 */

import { readFileSync } from 'node:fs';
import { globSync } from 'glob';
import * as ts from 'typescript';

import { PACKAGE_PATHS, ROOT_DIR } from './lib/config';
import { Reporter, parseValidatorArgs } from './lib/reporter';
import type { Severity, Violation } from './lib/types';

// =============================================================================
// Configuration
// =============================================================================

/**
 * Raw HTML tags that should only be used in primitives package.
 * These are the intrinsic JSX elements that we want to wrap for accessibility
 * and responsive behavior.
 */
const RAW_HTML_TAGS = new Set([
  // Layout elements
  'div',
  'span',
  'section',
  'article',
  'aside',
  'nav',
  'main',
  'header',
  'footer',
  'figure',
  'figcaption',
  // Text elements
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  // List elements
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  // Links and media
  'a',
  'img',
  // Form-related elements (these may be wrapped by atoms, but raw usage is flagged)
  // Note: We don't flag form, input, button, etc. as atoms wrap these directly
  // Tables
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'colgroup',
  'col',
]);

/**
 * HTML tags that are exceptions and allowed anywhere.
 * These are either too granular to wrap or are typically used correctly.
 */
const ALLOWED_TAGS = new Set([
  // Inline formatting - too granular to wrap
  'strong',
  'em',
  'b',
  'i',
  'u',
  's',
  'small',
  'mark',
  'del',
  'ins',
  'sub',
  'sup',
  'abbr',
  'cite',
  'code',
  'kbd',
  'samp',
  'var',
  'time',
  'dfn',
  'q',
  'bdi',
  'bdo',
  'ruby',
  'rt',
  'rp',
  'wbr',
  // Line breaks - too simple to wrap
  'br',
  'hr',
  // Meta elements - internal use
  'meta',
  'link',
  'script',
  'noscript',
  'template',
  'slot',
  // SVG and canvas - handled separately
  'svg',
  'path',
  'circle',
  'rect',
  'line',
  'polyline',
  'polygon',
  'ellipse',
  'g',
  'defs',
  'use',
  'symbol',
  'text',
  'tspan',
  'textPath',
  'clipPath',
  'mask',
  'pattern',
  'image',
  'foreignObject',
  'linearGradient',
  'radialGradient',
  'stop',
  'animate',
  'animateMotion',
  'animateTransform',
  'set',
  'canvas',
  // Form elements - wrapped by atoms, allow raw usage there
  'form',
  'input',
  'button',
  'select',
  'option',
  'optgroup',
  'textarea',
  'label',
  'fieldset',
  'legend',
  'datalist',
  'output',
  'progress',
  'meter',
  // Interactive elements
  'details',
  'summary',
  'dialog',
  'menu',
  // Embedded content
  'iframe',
  'embed',
  'object',
  'param',
  'video',
  'audio',
  'source',
  'track',
  'picture',
  'map',
  'area',
  // Pre-formatted
  'pre',
  // Blockquote
  'blockquote',
  'address',
]);

/**
 * Directories that are allowed to use raw HTML tags.
 * These are checked as path prefixes.
 */
const ALLOWED_DIRECTORIES = [
  'packages/primitives', // Primitives package itself
  'packages/ui/hooks', // UI hooks don't render JSX
] as const;

/**
 * File patterns that are exceptions (e.g., story files, test files)
 */
const EXCLUDED_FILE_PATTERNS = [/\.stories\.tsx?$/, /\.test\.tsx?$/, /\.spec\.tsx?$/, /\.d\.ts$/];

// =============================================================================
// Types
// =============================================================================

interface RawTagUsage {
  tag: string;
  line: number;
  column: number;
  file: string;
  snippet?: string;
}

interface PrimitivesRule {
  ruleId: string;
  description: string;
  severity: Severity;
}

// =============================================================================
// Rules
// =============================================================================

const RULES: PrimitivesRule[] = [
  {
    ruleId: 'primitives/no-raw-html',
    description: 'Use primitives from @openflow/primitives instead of raw HTML tags',
    severity: 'error',
  },
];

// =============================================================================
// AST Analysis
// =============================================================================

/**
 * Source file cache for performance
 */
const sourceFileCache = new Map<string, ts.SourceFile>();

/**
 * Get or create a TypeScript source file for AST analysis
 */
function getSourceFile(filePath: string): ts.SourceFile | undefined {
  const cached = sourceFileCache.get(filePath);
  if (cached) {
    return cached;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );
    sourceFileCache.set(filePath, sourceFile);
    return sourceFile;
  } catch {
    return undefined;
  }
}

/**
 * Check if a JSX element is a raw HTML intrinsic element
 */
function isRawHtmlTag(node: ts.JsxOpeningElement | ts.JsxSelfClosingElement): string | null {
  const tagName = node.tagName;

  // Only check identifier tags (not PropertyAccessExpression like React.Fragment)
  if (ts.isIdentifier(tagName)) {
    const name = tagName.text;

    // Intrinsic elements start with lowercase
    if (name[0] === name[0].toLowerCase()) {
      // Check if it's a flagged raw HTML tag
      if (RAW_HTML_TAGS.has(name) && !ALLOWED_TAGS.has(name)) {
        return name;
      }
    }
  }

  return null;
}

/**
 * Get a code snippet for context
 */
function getCodeSnippet(
  sourceFile: ts.SourceFile,
  node: ts.Node
): { snippet: string; line: number; column: number } {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const text = node.getText(sourceFile);
  const snippet = text.length > 80 ? `${text.slice(0, 77)}...` : text;

  return {
    snippet,
    line: line + 1, // 1-indexed
    column: character + 1, // 1-indexed
  };
}

/**
 * Find all raw HTML tag usages in a file
 */
function findRawTagUsages(filePath: string): RawTagUsage[] {
  const sourceFile = getSourceFile(filePath);
  if (!sourceFile) {
    return [];
  }

  const usages: RawTagUsage[] = [];

  function visit(node: ts.Node): void {
    // Check JSX opening elements: <div>
    if (ts.isJsxOpeningElement(node)) {
      const rawTag = isRawHtmlTag(node);
      if (rawTag) {
        const { snippet, line, column } = getCodeSnippet(sourceFile, node);
        usages.push({
          tag: rawTag,
          line,
          column,
          file: filePath,
          snippet,
        });
      }
    }

    // Check JSX self-closing elements: <div />
    if (ts.isJsxSelfClosingElement(node)) {
      const rawTag = isRawHtmlTag(node);
      if (rawTag) {
        const { snippet, line, column } = getCodeSnippet(sourceFile, node);
        usages.push({
          tag: rawTag,
          line,
          column,
          file: filePath,
          snippet,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return usages;
}

// =============================================================================
// File Filtering
// =============================================================================

/**
 * Check if a file path is in an allowed directory
 */
function isInAllowedDirectory(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return ALLOWED_DIRECTORIES.some((dir) => normalizedPath.startsWith(dir));
}

/**
 * Check if a file matches an excluded pattern
 */
function isExcludedFile(filePath: string): boolean {
  return EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
}

// =============================================================================
// Suggestion Generation
// =============================================================================

/**
 * Get suggestion for replacing a raw HTML tag
 */
function getSuggestion(tag: string): string {
  const suggestions: Record<string, string> = {
    // Layout
    div: 'Use Box from @openflow/primitives for generic containers',
    span: 'Use Text from @openflow/primitives for inline text',
    section: 'Use Section from @openflow/primitives (requires aria-label)',
    article: 'Use Article from @openflow/primitives',
    aside: 'Use Aside from @openflow/primitives',
    nav: 'Use Nav from @openflow/primitives',
    main: 'Use Main from @openflow/primitives',
    header: 'Use Header from @openflow/primitives',
    footer: 'Use Footer from @openflow/primitives',
    // Text
    p: 'Use Paragraph from @openflow/primitives',
    h1: 'Use Heading with level={1} from @openflow/primitives',
    h2: 'Use Heading with level={2} from @openflow/primitives',
    h3: 'Use Heading with level={3} from @openflow/primitives',
    h4: 'Use Heading with level={4} from @openflow/primitives',
    h5: 'Use Heading with level={5} from @openflow/primitives',
    h6: 'Use Heading with level={6} from @openflow/primitives',
    // Lists
    ul: 'Use List from @openflow/primitives',
    ol: 'Use List with ordered={true} from @openflow/primitives',
    li: 'Use ListItem from @openflow/primitives',
    // Links and media
    a: 'Use Link from @openflow/primitives',
    img: 'Use Image from @openflow/primitives (requires alt prop)',
    // Tables
    table: 'Consider using a Table primitive or data grid component',
    thead: 'Wrap table sections using primitives',
    tbody: 'Wrap table sections using primitives',
    tr: 'Consider row-level primitive components',
    th: 'Consider cell-level primitive components',
    td: 'Consider cell-level primitive components',
  };

  return suggestions[tag] || `Create a primitive wrapper for <${tag}> or use an existing one`;
}

// =============================================================================
// Validation
// =============================================================================

interface ValidationResult {
  violations: Violation[];
  filesChecked: number;
  rawTagsFound: number;
}

function validate(verbose = false): ValidationResult {
  const violations: Violation[] = [];
  const filesChecked = new Set<string>();
  let rawTagsFound = 0;

  // Get all TSX files in UI package
  const patterns = [
    `${PACKAGE_PATHS.UI}/**/*.tsx`,
    // Could extend to other packages in the future
    // `src/**/*.tsx`,
  ];

  for (const pattern of patterns) {
    const files = globSync(pattern, {
      cwd: ROOT_DIR,
      ignore: ['**/node_modules/**', '**/*.d.ts'],
    });

    for (const file of files) {
      // Skip excluded files
      if (isExcludedFile(file)) {
        continue;
      }

      // Skip allowed directories
      if (isInAllowedDirectory(file)) {
        continue;
      }

      filesChecked.add(file);
      const fullPath = `${ROOT_DIR}/${file}`;

      try {
        const usages = findRawTagUsages(fullPath);

        for (const usage of usages) {
          rawTagsFound++;

          const rule = RULES[0];
          violations.push({
            file,
            line: usage.line,
            column: usage.column,
            rule: rule.ruleId,
            message: `Raw HTML tag <${usage.tag}> used outside primitives package`,
            severity: rule.severity,
            suggestion: getSuggestion(usage.tag),
            snippet: usage.snippet,
            metadata: {
              tag: usage.tag,
            },
          });
        }
      } catch (error) {
        if (verbose) {
          console.error(`Error analyzing file ${file}:`, error);
        }
      }
    }
  }

  return {
    violations,
    filesChecked: filesChecked.size,
    rawTagsFound,
  };
}

// =============================================================================
// Main Entry Point
// =============================================================================

function main(): void {
  const args = parseValidatorArgs();

  if (args.help) {
    console.log(`
Primitives Validator

Usage: pnpm validate:primitives [options]

Options:
  --report, -r    Generate JSON report in reports/primitives.json
  --verbose, -v   Show detailed output including file processing
  --help, -h      Show this help message

Description:
  Ensures only the @openflow/primitives package uses raw HTML tags in JSX.
  UI components must use primitives for consistent accessibility and
  responsive behavior.

Rules:
  primitives/no-raw-html  - No raw HTML tags outside primitives package (error)

Flagged Tags:
  Layout: div, span, section, article, aside, nav, main, header, footer
  Text: p, h1-h6
  Lists: ul, ol, li
  Links/Media: a, img
  Tables: table, thead, tbody, tr, th, td

Allowed Exceptions:
  - packages/primitives/** (primitives package itself)
  - packages/ui/hooks/** (no JSX rendering)
  - Story files (*.stories.tsx)
  - Test files (*.test.tsx, *.spec.tsx)
  - Inline formatting: strong, em, code, etc.
  - SVG elements: svg, path, circle, etc.
  - Form elements: input, button, form, etc. (wrapped by atoms)

Philosophy:
  Raw HTML tags should be wrapped in primitives that provide:
  - Semantic HTML defaults
  - ARIA attributes for accessibility
  - Responsive spacing and sizing props
  - Consistent styling patterns
`);
    process.exit(0);
  }

  const reporter = new Reporter('primitives', {
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
    rulesChecked: RULES.length,
    rawTagsFound: result.rawTagsFound,
    scope: PACKAGE_PATHS.UI,
    flaggedTags: Array.from(RAW_HTML_TAGS),
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
