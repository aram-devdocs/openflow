#!/usr/bin/env tsx
/**
 * Accessibility (A11y) Validator
 *
 * Performs static analysis of JSX to detect common accessibility issues.
 * This is a compile-time validator that catches issues before runtime.
 *
 * Checks for:
 * - Images without alt text
 * - Buttons without accessible names
 * - Form inputs without labels
 * - Click handlers on non-interactive elements without keyboard support
 * - Missing ARIA attributes on interactive patterns
 *
 * Run: pnpm validate:a11y
 * Run with report: pnpm validate:a11y --report
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
 * Non-interactive elements that should not have click handlers
 * without role and keyboard support.
 */
const NON_INTERACTIVE_ELEMENTS = new Set([
  'div',
  'span',
  'section',
  'article',
  'aside',
  'header',
  'footer',
  'nav',
  'main',
  'p',
  'li',
  'dd',
  'dt',
  'figure',
  'figcaption',
]);

/**
 * Interactive elements that natively support click
 */
const INTERACTIVE_ELEMENTS = new Set([
  'button',
  'a',
  'input',
  'select',
  'textarea',
  'summary',
  'option',
]);

/**
 * Elements that require accessible names
 * @internal Reserved for future use - validates that interactive elements have accessible names
 */
const _REQUIRES_ACCESSIBLE_NAME = new Set(['button', 'a', 'input', 'select', 'textarea', 'img']);

/**
 * ARIA roles that make an element interactive
 */
const INTERACTIVE_ROLES = new Set([
  'button',
  'link',
  'checkbox',
  'radio',
  'switch',
  'tab',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'treeitem',
  'listbox',
  'combobox',
  'slider',
  'spinbutton',
  'textbox',
  'searchbox',
]);

/**
 * Directories to scan
 */
const SCAN_DIRECTORIES = [PACKAGE_PATHS.UI] as const;

/**
 * File patterns that are exceptions (e.g., story files, test files)
 */
const EXCLUDED_FILE_PATTERNS = [/\.stories\.tsx?$/, /\.test\.tsx?$/, /\.spec\.tsx?$/, /\.d\.ts$/];

// =============================================================================
// Types
// =============================================================================

interface A11yIssue {
  rule: string;
  message: string;
  severity: Severity;
  suggestion: string;
  line: number;
  column: number;
  file: string;
  snippet?: string;
}

interface A11yRule {
  ruleId: string;
  description: string;
  severity: Severity;
}

// =============================================================================
// Rules
// =============================================================================

const RULES: A11yRule[] = [
  {
    ruleId: 'a11y/img-alt',
    description: 'Images must have alt text for screen readers',
    severity: 'error',
  },
  {
    ruleId: 'a11y/button-has-name',
    description: 'Buttons must have an accessible name',
    severity: 'error',
  },
  {
    ruleId: 'a11y/click-events-have-key-events',
    description: 'Click handlers on non-interactive elements need keyboard support',
    severity: 'warning',
  },
  {
    ruleId: 'a11y/no-noninteractive-element-interactions',
    description: 'Non-interactive elements should not have click handlers without role',
    severity: 'warning',
  },
  {
    ruleId: 'a11y/anchor-has-content',
    description: 'Anchors must have content or aria-label',
    severity: 'error',
  },
  {
    ruleId: 'a11y/no-autofocus',
    description: 'Avoid autofocus as it can cause accessibility issues',
    severity: 'warning',
  },
  {
    ruleId: 'a11y/no-positive-tabindex',
    description: 'Avoid positive tabIndex values',
    severity: 'warning',
  },
  {
    ruleId: 'a11y/role-has-required-aria-props',
    description: 'ARIA roles require specific attributes',
    severity: 'warning',
  },
];

/**
 * Required ARIA attributes for specific roles
 */
const ROLE_REQUIRED_PROPS: Record<string, string[]> = {
  checkbox: ['aria-checked'],
  combobox: ['aria-expanded'],
  slider: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
  spinbutton: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
  switch: ['aria-checked'],
  tab: ['aria-selected'],
  tabpanel: ['aria-labelledby'],
  progressbar: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
};

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
 * Get the tag name from a JSX element
 */
function getTagName(node: ts.JsxOpeningElement | ts.JsxSelfClosingElement): string | null {
  const tagName = node.tagName;
  if (ts.isIdentifier(tagName)) {
    return tagName.text;
  }
  return null;
}

/**
 * Get JSX attribute value as a string (handles string literals and expressions)
 */
function getAttributeValue(
  attr: ts.JsxAttribute | ts.JsxSpreadAttribute
): string | boolean | null | undefined {
  if (ts.isJsxSpreadAttribute(attr)) {
    return undefined; // Can't statically analyze spread attributes
  }

  if (!attr.initializer) {
    // Boolean attribute like `disabled`
    return true;
  }

  if (ts.isStringLiteral(attr.initializer)) {
    return attr.initializer.text;
  }

  if (ts.isJsxExpression(attr.initializer)) {
    const expr = attr.initializer.expression;
    if (!expr) return null;

    if (ts.isStringLiteral(expr)) {
      return expr.text;
    }
    if (ts.isNumericLiteral(expr)) {
      return expr.text;
    }
    if (expr.kind === ts.SyntaxKind.TrueKeyword) {
      return true;
    }
    if (expr.kind === ts.SyntaxKind.FalseKeyword) {
      return false;
    }
    // Complex expression - can't statically analyze
    return undefined;
  }

  return undefined;
}

/**
 * Check if a JSX element has a specific attribute
 * @internal Reserved for future use - validates attribute presence
 */
function _hasAttribute(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  name: string
): boolean {
  return node.attributes.properties.some(
    (prop) => ts.isJsxAttribute(prop) && prop.name.text === name
  );
}

/**
 * Get all attributes from a JSX element
 */
function getAttributes(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement
): Map<string, string | boolean | null | undefined> {
  const attrs = new Map<string, string | boolean | null | undefined>();

  for (const prop of node.attributes.properties) {
    if (ts.isJsxAttribute(prop)) {
      attrs.set(prop.name.text, getAttributeValue(prop));
    }
  }

  return attrs;
}

/**
 * Check if element has text children
 */
function hasTextChildren(node: ts.JsxElement): boolean {
  for (const child of node.children) {
    if (ts.isJsxText(child) && child.text.trim().length > 0) {
      return true;
    }
    if (ts.isJsxExpression(child) && child.expression) {
      // Has some expression as child - assume it could be text
      return true;
    }
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      // Has child elements - could contain text
      return true;
    }
  }
  return false;
}

/**
 * Get code snippet for context
 */
function getCodeSnippet(
  sourceFile: ts.SourceFile,
  node: ts.Node
): { snippet: string; line: number; column: number } {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const text = node.getText(sourceFile);
  const snippet = text.length > 100 ? `${text.slice(0, 97)}...` : text;

  return {
    snippet,
    line: line + 1, // 1-indexed
    column: character + 1, // 1-indexed
  };
}

// =============================================================================
// Validators
// =============================================================================

/**
 * Check for img elements without alt
 */
function checkImgAlt(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  tagName: string,
  sourceFile: ts.SourceFile,
  filePath: string
): A11yIssue | null {
  if (tagName !== 'img') return null;

  const attrs = getAttributes(node);

  // Check for alt attribute
  if (!attrs.has('alt')) {
    const { snippet, line, column } = getCodeSnippet(sourceFile, node);
    return {
      rule: 'a11y/img-alt',
      message: '<img> element missing alt attribute',
      severity: 'error',
      suggestion: 'Add alt="" for decorative images or descriptive alt text for meaningful images',
      line,
      column,
      file: filePath,
      snippet,
    };
  }

  return null;
}

/**
 * Check for buttons without accessible name
 */
function checkButtonHasName(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  tagName: string,
  sourceFile: ts.SourceFile,
  filePath: string,
  parentElement?: ts.JsxElement
): A11yIssue | null {
  if (tagName !== 'button') return null;

  const attrs = getAttributes(node);

  // Has aria-label or aria-labelledby
  if (attrs.has('aria-label') || attrs.has('aria-labelledby')) {
    return null;
  }

  // Has title (less preferred but acceptable)
  if (attrs.has('title')) {
    return null;
  }

  // Check if it's a self-closing element (must have accessible name via attr)
  if (ts.isJsxSelfClosingElement(node)) {
    const { snippet, line, column } = getCodeSnippet(sourceFile, node);
    return {
      rule: 'a11y/button-has-name',
      message: 'Self-closing <button> must have aria-label or aria-labelledby',
      severity: 'error',
      suggestion: 'Add aria-label="..." to provide an accessible name',
      line,
      column,
      file: filePath,
      snippet,
    };
  }

  // For opening elements, check if parent has text children
  if (parentElement && hasTextChildren(parentElement)) {
    return null;
  }

  // If we can't determine children, don't flag (could be dynamic)
  return null;
}

/**
 * Check for anchors without content
 */
function checkAnchorHasContent(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  tagName: string,
  sourceFile: ts.SourceFile,
  filePath: string,
  parentElement?: ts.JsxElement
): A11yIssue | null {
  if (tagName !== 'a') return null;

  const attrs = getAttributes(node);

  // Has aria-label or aria-labelledby
  if (attrs.has('aria-label') || attrs.has('aria-labelledby')) {
    return null;
  }

  // Check if it's a self-closing element
  if (ts.isJsxSelfClosingElement(node)) {
    const { snippet, line, column } = getCodeSnippet(sourceFile, node);
    return {
      rule: 'a11y/anchor-has-content',
      message: 'Self-closing <a> must have aria-label or aria-labelledby',
      severity: 'error',
      suggestion: 'Add aria-label="..." to provide an accessible name',
      line,
      column,
      file: filePath,
      snippet,
    };
  }

  // For opening elements, check if parent has text children
  if (parentElement && hasTextChildren(parentElement)) {
    return null;
  }

  return null;
}

/**
 * Check for click handlers on non-interactive elements
 */
function checkClickEventsHaveKeyEvents(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  tagName: string,
  sourceFile: ts.SourceFile,
  filePath: string
): A11yIssue | null {
  // Skip if it's an interactive element
  if (INTERACTIVE_ELEMENTS.has(tagName)) return null;

  // Skip if not a non-interactive element we care about
  if (!NON_INTERACTIVE_ELEMENTS.has(tagName)) return null;

  const attrs = getAttributes(node);

  // Check if has onClick
  if (!attrs.has('onClick')) return null;

  // Check if has role that makes it interactive
  const role = attrs.get('role');
  if (typeof role === 'string' && INTERACTIVE_ROLES.has(role)) {
    // Has interactive role - check for keyboard support
    if (attrs.has('onKeyDown') || attrs.has('onKeyUp') || attrs.has('onKeyPress')) {
      return null; // Has keyboard support
    }

    const { snippet, line, column } = getCodeSnippet(sourceFile, node);
    return {
      rule: 'a11y/click-events-have-key-events',
      message: `<${tagName}> with onClick and role="${role}" is missing keyboard event handler`,
      severity: 'warning',
      suggestion: 'Add onKeyDown handler for Enter/Space key support',
      line,
      column,
      file: filePath,
      snippet,
    };
  }

  // No role - flag as non-interactive element with click
  const { snippet, line, column } = getCodeSnippet(sourceFile, node);
  return {
    rule: 'a11y/no-noninteractive-element-interactions',
    message: `<${tagName}> has onClick but is not interactive`,
    severity: 'warning',
    suggestion: 'Add role="button" and keyboard support, or use a <button> element',
    line,
    column,
    file: filePath,
    snippet,
  };
}

/**
 * Check for autofocus attribute
 */
function checkNoAutofocus(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  _tagName: string,
  sourceFile: ts.SourceFile,
  filePath: string
): A11yIssue | null {
  const attrs = getAttributes(node);

  if (attrs.has('autoFocus') || attrs.has('autofocus')) {
    const { snippet, line, column } = getCodeSnippet(sourceFile, node);
    return {
      rule: 'a11y/no-autofocus',
      message: 'Avoid using autoFocus as it can cause accessibility issues',
      severity: 'warning',
      suggestion:
        'Manage focus programmatically when needed, or ensure autofocus is user-initiated',
      line,
      column,
      file: filePath,
      snippet,
    };
  }

  return null;
}

/**
 * Check for positive tabIndex values
 */
function checkNoPositiveTabindex(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  _tagName: string,
  sourceFile: ts.SourceFile,
  filePath: string
): A11yIssue | null {
  const attrs = getAttributes(node);

  const tabIndex = attrs.get('tabIndex');
  if (tabIndex !== undefined && typeof tabIndex === 'string') {
    const value = Number.parseInt(tabIndex, 10);
    if (!Number.isNaN(value) && value > 0) {
      const { snippet, line, column } = getCodeSnippet(sourceFile, node);
      return {
        rule: 'a11y/no-positive-tabindex',
        message: `Avoid tabIndex greater than 0 (found ${value})`,
        severity: 'warning',
        suggestion: 'Use tabIndex={0} or tabIndex={-1} instead',
        line,
        column,
        file: filePath,
        snippet,
      };
    }
  }

  return null;
}

/**
 * Check that ARIA roles have required properties
 */
function checkRoleHasRequiredAriaProps(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  _tagName: string,
  sourceFile: ts.SourceFile,
  filePath: string
): A11yIssue | null {
  const attrs = getAttributes(node);

  const role = attrs.get('role');
  if (typeof role !== 'string') return null;

  const requiredProps = ROLE_REQUIRED_PROPS[role];
  if (!requiredProps) return null;

  const missingProps = requiredProps.filter((prop) => {
    // If attribute exists (even if we can't determine value), consider it present
    return !attrs.has(prop);
  });

  if (missingProps.length > 0) {
    const { snippet, line, column } = getCodeSnippet(sourceFile, node);
    return {
      rule: 'a11y/role-has-required-aria-props',
      message: `role="${role}" requires: ${missingProps.join(', ')}`,
      severity: 'warning',
      suggestion: `Add ${missingProps.map((p) => `${p}="..."`).join(', ')} to the element`,
      line,
      column,
      file: filePath,
      snippet,
    };
  }

  return null;
}

// =============================================================================
// File Analysis
// =============================================================================

/**
 * Find all accessibility issues in a file
 */
function findA11yIssues(filePath: string): A11yIssue[] {
  const sourceFile = getSourceFile(filePath);
  if (!sourceFile) {
    return [];
  }

  const issues: A11yIssue[] = [];

  function visit(node: ts.Node, parentElement?: ts.JsxElement): void {
    const openingElement =
      ts.isJsxElement(node) && ts.isJsxOpeningElement(node.openingElement)
        ? node.openingElement
        : ts.isJsxSelfClosingElement(node)
          ? node
          : null;

    if (openingElement) {
      const tagName = getTagName(openingElement);

      if (tagName) {
        // Only check lowercase tags (intrinsic elements)
        if (tagName[0] === tagName[0].toLowerCase()) {
          const currentParent = ts.isJsxElement(node) ? node : parentElement;

          // Run all checks
          const checks = [
            checkImgAlt(openingElement, tagName, sourceFile, filePath),
            checkButtonHasName(openingElement, tagName, sourceFile, filePath, currentParent),
            checkAnchorHasContent(openingElement, tagName, sourceFile, filePath, currentParent),
            checkClickEventsHaveKeyEvents(openingElement, tagName, sourceFile, filePath),
            checkNoAutofocus(openingElement, tagName, sourceFile, filePath),
            checkNoPositiveTabindex(openingElement, tagName, sourceFile, filePath),
            checkRoleHasRequiredAriaProps(openingElement, tagName, sourceFile, filePath),
          ];

          for (const issue of checks) {
            if (issue) {
              issues.push(issue);
            }
          }
        }
      }
    }

    // Recursively visit children
    const nextParent = ts.isJsxElement(node) ? node : parentElement;
    ts.forEachChild(node, (child) => visit(child, nextParent));
  }

  visit(sourceFile);
  return issues;
}

// =============================================================================
// File Filtering
// =============================================================================

/**
 * Check if a file matches an excluded pattern
 */
function isExcludedFile(filePath: string): boolean {
  return EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
}

// =============================================================================
// Validation
// =============================================================================

interface ValidationResult {
  violations: Violation[];
  filesChecked: number;
  issuesFound: number;
  ruleBreakdown: Record<string, number>;
}

function validate(verbose = false): ValidationResult {
  const violations: Violation[] = [];
  const filesChecked = new Set<string>();
  let issuesFound = 0;
  const ruleBreakdown: Record<string, number> = {};

  // Initialize rule breakdown
  for (const rule of RULES) {
    ruleBreakdown[rule.ruleId] = 0;
  }

  // Scan all directories
  for (const dir of SCAN_DIRECTORIES) {
    const pattern = `${dir}/**/*.tsx`;
    const files = globSync(pattern, {
      cwd: ROOT_DIR,
      ignore: ['**/node_modules/**', '**/*.d.ts'],
    });

    for (const file of files) {
      // Skip excluded files
      if (isExcludedFile(file)) {
        continue;
      }

      filesChecked.add(file);
      const fullPath = `${ROOT_DIR}/${file}`;

      try {
        const issues = findA11yIssues(fullPath);

        for (const issue of issues) {
          issuesFound++;
          ruleBreakdown[issue.rule] = (ruleBreakdown[issue.rule] || 0) + 1;

          violations.push({
            file,
            line: issue.line,
            column: issue.column,
            rule: issue.rule,
            message: issue.message,
            severity: issue.severity,
            suggestion: issue.suggestion,
            snippet: issue.snippet,
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
    issuesFound,
    ruleBreakdown,
  };
}

// =============================================================================
// Main Entry Point
// =============================================================================

function main(): void {
  const args = parseValidatorArgs();

  if (args.help) {
    console.log(`
Accessibility (A11y) Validator

Usage: pnpm validate:a11y [options]

Options:
  --report, -r    Generate JSON report in reports/a11y.json
  --verbose, -v   Show detailed output including file processing
  --help, -h      Show this help message

Description:
  Performs static analysis of JSX to detect common accessibility issues.
  This catches issues at build time rather than requiring runtime testing.

Rules:
  a11y/img-alt                               - Images must have alt text (error)
  a11y/button-has-name                       - Buttons must have accessible name (error)
  a11y/anchor-has-content                    - Anchors must have content (error)
  a11y/click-events-have-key-events          - Click handlers need keyboard support (warning)
  a11y/no-noninteractive-element-interactions - Non-interactive elements shouldn't handle clicks (warning)
  a11y/no-autofocus                          - Avoid autofocus attribute (warning)
  a11y/no-positive-tabindex                  - Avoid positive tabIndex values (warning)
  a11y/role-has-required-aria-props          - ARIA roles require specific attributes (warning)

Scope:
  Checks all .tsx files in:
  - packages/ui/**

Excludes:
  - Story files (*.stories.tsx)
  - Test files (*.test.tsx, *.spec.tsx)
  - Type declaration files (*.d.ts)

Philosophy:
  Static a11y validation catches common issues early in development.
  For comprehensive accessibility testing, also use:
  - axe-core runtime testing
  - Manual keyboard navigation testing
  - Screen reader testing
`);
    process.exit(0);
  }

  const reporter = new Reporter('a11y', {
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
    issuesFound: result.issuesFound,
    ruleBreakdown: result.ruleBreakdown,
    scope: SCAN_DIRECTORIES,
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
