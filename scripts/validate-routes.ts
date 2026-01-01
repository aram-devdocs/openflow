/**
 * Route Component Validator (FR-5)
 *
 * Ensures route components follow the import hierarchy and maintain purity:
 * - No @openflow/queries imports (routes should use hooks, not queries directly)
 * - No @tauri-apps/api/core imports (no direct invoke calls)
 * - Route files should not exceed 300 lines (complexity warning)
 * - No inline component definitions (routes should be pure composition)
 * - No styled-components usage (styles belong in UI components)
 * - No complex JSX logic (map/filter/ternaries should be in UI components)
 *
 * Routes are the orchestration layer that connects hooks to UI components.
 * They should read like pseudocode - pure composition with minimal logic.
 *
 * Run: pnpm validate:routes
 * Run with report: pnpm validate:routes --report
 */

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { globSync } from 'glob';
import * as ts from 'typescript';

import { PACKAGE_NAMES, RELATIVE_PATHS, ROOT_DIR, ROUTES_CONFIG } from './lib/config';
import { analyzeImports } from './lib/import-analyzer';
import { Reporter, parseValidatorArgs } from './lib/reporter';
import type { Severity, Violation } from './lib/types';

// =============================================================================
// Constants
// =============================================================================

/** Maximum allowed line count for route files */
const MAX_ROUTE_LINES = 300;

// =============================================================================
// Types
// =============================================================================

interface RouteRule {
  ruleId: string;
  description: string;
  forbiddenPackages?: string[];
  recommendedPackages?: string[];
  severity: Severity;
}

interface ComponentDefinition {
  name: string;
  line: number;
  column: number;
  type: 'function' | 'arrow' | 'forwardRef';
}

interface StyledUsage {
  name: string;
  line: number;
  column: number;
}

interface JsxLogicUsage {
  type: 'map' | 'filter' | 'ternary' | 'conditional';
  line: number;
  column: number;
  snippet?: string;
}

// =============================================================================
// Route Rules
// =============================================================================

const RULES: RouteRule[] = [
  {
    ruleId: 'route/no-queries-import',
    description: 'Routes must use hooks from @openflow/hooks, not @openflow/queries directly',
    forbiddenPackages: ['@openflow/queries'],
    severity: 'error',
  },
  {
    ruleId: 'route/no-direct-invoke',
    description: 'Routes cannot use Tauri invoke directly',
    forbiddenPackages: ['@tauri-apps/api/core'],
    severity: 'error',
  },
  {
    ruleId: 'route/max-lines',
    description: `Route file exceeds maximum line count (${MAX_ROUTE_LINES})`,
    severity: 'error',
  },
  {
    ruleId: 'route/no-component-definition',
    description: 'Routes must not define React components inline - extract to @openflow/ui',
    severity: 'error',
  },
  {
    ruleId: 'route/no-styled-components',
    description: 'Routes must not use styled-components - styles belong in UI components',
    severity: 'error',
  },
  {
    ruleId: 'route/no-jsx-logic',
    description: 'Complex JSX logic (map/filter/ternaries) must be in UI components',
    severity: 'error',
  },
  {
    ruleId: 'route/imports-ui-package',
    description: 'Routes should import UI components from @openflow/ui',
    recommendedPackages: [PACKAGE_NAMES.UI],
    severity: 'warning',
  },
  {
    ruleId: 'route/imports-hooks-package',
    description: 'Routes should import hooks from @openflow/hooks',
    recommendedPackages: [PACKAGE_NAMES.HOOKS],
    severity: 'warning',
  },
];

// =============================================================================
// Import Checking
// =============================================================================

/**
 * Check if an import source matches a forbidden package
 */
function matchesForbiddenPackage(importSource: string, forbiddenPackage: string): boolean {
  // Exact match
  if (importSource === forbiddenPackage) {
    return true;
  }
  // Subpath import (e.g., @openflow/queries/tasks)
  if (importSource.startsWith(`${forbiddenPackage}/`)) {
    return true;
  }
  return false;
}

/**
 * Get a code snippet for context
 */
function getCodeSnippet(filePath: string, lineNumber: number): string | undefined {
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
 * Count lines in a file
 */
function countLines(filePath: string): number {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

/**
 * Generate a helpful suggestion based on the rule
 */
function getSuggestion(ruleId: string, context?: Record<string, unknown>): string {
  switch (ruleId) {
    case 'route/no-queries-import':
      return 'Use hooks from @openflow/hooks instead of importing queries directly. Create a custom hook if one does not exist.';
    case 'route/no-direct-invoke':
      return 'Move Tauri invoke calls to @openflow/queries and use hooks from @openflow/hooks.';
    case 'route/max-lines':
      return 'Extract inline components to @openflow/ui and business logic to @openflow/hooks. Routes should be pure composition.';
    case 'route/no-component-definition': {
      const name = context?.name ?? 'Component';
      return `Move "${name}" to packages/ui/organisms/ or packages/ui/molecules/. Routes should only compose existing UI components.`;
    }
    case 'route/no-styled-components':
      return 'Move styled components to the relevant UI component file in @openflow/ui.';
    case 'route/no-jsx-logic':
      return 'Extract this rendering logic to a UI component. Routes should read like pseudocode with minimal JSX logic.';
    case 'route/imports-ui-package':
      return 'Import UI components from @openflow/ui to maintain proper layer separation.';
    case 'route/imports-hooks-package':
      return 'Import hooks from @openflow/hooks for data fetching and state management.';
    default:
      return 'Follow the route component patterns documented in CLAUDE.md';
  }
}

// =============================================================================
// AST Analysis
// =============================================================================

/**
 * Get a TypeScript source file for analysis
 */
function getSourceFile(filePath: string): ts.SourceFile | undefined {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  } catch {
    return undefined;
  }
}

/**
 * Get the main route component name from the file
 * Looks for: export const Route = createFileRoute(...)({ component: ComponentName })
 * or createRootRouteWithContext(...)({ component: ComponentName })
 * or the component function itself if it matches the file pattern
 */
function getMainRouteComponentName(sourceFile: ts.SourceFile): string | undefined {
  let routeComponentName: string | undefined;

  // First, try to find the component specified in createFileRoute or createRootRouteWithContext
  function findRouteComponent(node: ts.Node): void {
    // Look for createFileRoute or createRootRouteWithContext call
    if (ts.isCallExpression(node)) {
      const expr = node.expression;

      // Check for createFileRoute()({component: X}) or createRootRouteWithContext()({component: X}) pattern
      if (ts.isCallExpression(expr)) {
        const innerExpr = expr.expression;
        if (
          ts.isIdentifier(innerExpr) &&
          (innerExpr.text === 'createFileRoute' || innerExpr.text === 'createRootRouteWithContext')
        ) {
          // Found route creator, now look for component property in the arguments
          for (const arg of node.arguments) {
            if (ts.isObjectLiteralExpression(arg)) {
              for (const prop of arg.properties) {
                if (
                  ts.isPropertyAssignment(prop) &&
                  ts.isIdentifier(prop.name) &&
                  prop.name.text === 'component' &&
                  ts.isIdentifier(prop.initializer)
                ) {
                  routeComponentName = prop.initializer.text;
                  return;
                }
              }
            }
          }
        }
      }
    }
    ts.forEachChild(node, findRouteComponent);
  }

  findRouteComponent(sourceFile);
  return routeComponentName;
}

/**
 * Check if a function/variable looks like a React component
 * (starts with uppercase and returns JSX)
 */
function looksLikeReactComponent(name: string): boolean {
  // React components start with uppercase letter
  return /^[A-Z]/.test(name);
}

/**
 * Check if a route is a passthrough route (only renders <Outlet />)
 * These routes don't need @openflow/ui or @openflow/hooks imports
 */
function isPassthroughRoute(sourceFile: ts.SourceFile): boolean {
  const content = sourceFile.text;
  // A passthrough route typically:
  // 1. Has very few lines (< 20)
  // 2. Returns only <Outlet /> or <Outlet></Outlet>
  // 3. Has no meaningful JSX other than Outlet
  const lines = content.split('\n').length;
  if (lines > 25) return false;

  // Check if the only JSX is Outlet
  let hasOutlet = false;
  let hasOtherJsx = false;

  function visit(node: ts.Node): void {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const tagName = node.tagName;
      if (ts.isIdentifier(tagName)) {
        if (tagName.text === 'Outlet') {
          hasOutlet = true;
        } else {
          hasOtherJsx = true;
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return hasOutlet && !hasOtherJsx;
}

/**
 * Check if this is the root route file (__root.tsx)
 */
function isRootRoute(filePath: string): boolean {
  return basename(filePath) === '__root.tsx';
}

/**
 * Check if this is a layout route (file starts with underscore)
 * Layout routes are pathless wrappers that don't need UI/hooks imports
 * Examples: _app.tsx, _auth.tsx, _dashboard.tsx
 */
function isLayoutRoute(filePath: string): boolean {
  const name = basename(filePath);
  // Layout routes start with underscore but are not the root route
  return name.startsWith('_') && name !== '__root.tsx';
}

/**
 * Find all component definitions in a file (excluding the main route component)
 */
function findComponentDefinitions(
  sourceFile: ts.SourceFile,
  mainComponentName?: string
): ComponentDefinition[] {
  const components: ComponentDefinition[] = [];

  function visit(node: ts.Node): void {
    // Function declarations: function MyComponent() {}
    if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.text;
      if (looksLikeReactComponent(name) && name !== mainComponentName) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(
          node.getStart(sourceFile)
        );
        components.push({
          name,
          line: line + 1,
          column: character + 1,
          type: 'function',
        });
      }
    }

    // Variable declarations: const MyComponent = () => {} or const MyComponent = function() {}
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          const name = decl.name.text;
          if (
            looksLikeReactComponent(name) &&
            name !== mainComponentName &&
            name !== 'Route' // Exclude TanStack Router's Route export
          ) {
            // Check if initializer is an arrow function, function expression, or forwardRef
            if (decl.initializer) {
              let isComponent = false;
              let componentType: ComponentDefinition['type'] = 'arrow';

              if (ts.isArrowFunction(decl.initializer)) {
                isComponent = true;
                componentType = 'arrow';
              } else if (ts.isFunctionExpression(decl.initializer)) {
                isComponent = true;
                componentType = 'function';
              } else if (ts.isCallExpression(decl.initializer)) {
                // Check for React.forwardRef, forwardRef, React.memo, memo
                const callExpr = decl.initializer.expression;
                const callName = ts.isIdentifier(callExpr)
                  ? callExpr.text
                  : ts.isPropertyAccessExpression(callExpr) && ts.isIdentifier(callExpr.name)
                    ? callExpr.name.text
                    : '';
                if (['forwardRef', 'memo', 'lazy'].includes(callName)) {
                  isComponent = true;
                  componentType = 'forwardRef';
                }
              }

              if (isComponent) {
                const { line, character } = sourceFile.getLineAndCharacterOfPosition(
                  node.getStart(sourceFile)
                );
                components.push({
                  name,
                  line: line + 1,
                  column: character + 1,
                  type: componentType,
                });
              }
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return components;
}

/**
 * Find styled-components or styled usage
 */
function findStyledUsage(sourceFile: ts.SourceFile): StyledUsage[] {
  const usages: StyledUsage[] = [];

  function visit(node: ts.Node): void {
    // Look for styled.div, styled(Component), etc.
    if (ts.isTaggedTemplateExpression(node)) {
      const tag = node.tag;
      let isStyled = false;
      let name = '';

      // styled.div``
      if (ts.isPropertyAccessExpression(tag) && ts.isIdentifier(tag.expression)) {
        if (tag.expression.text === 'styled') {
          isStyled = true;
          name = `styled.${tag.name.text}`;
        }
      }

      // styled(Component)``
      if (ts.isCallExpression(tag) && ts.isIdentifier(tag.expression)) {
        if (tag.expression.text === 'styled') {
          isStyled = true;
          name = 'styled()';
        }
      }

      if (isStyled) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(
          node.getStart(sourceFile)
        );
        usages.push({
          name,
          line: line + 1,
          column: character + 1,
        });
      }
    }

    // Also check for css`` template literals from styled-components
    if (ts.isTaggedTemplateExpression(node) && ts.isIdentifier(node.tag)) {
      if (node.tag.text === 'css') {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(
          node.getStart(sourceFile)
        );
        usages.push({
          name: 'css',
          line: line + 1,
          column: character + 1,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return usages;
}

/**
 * Find complex JSX logic (map/filter calls in JSX, complex ternaries)
 */
function findJsxLogic(sourceFile: ts.SourceFile): JsxLogicUsage[] {
  const usages: JsxLogicUsage[] = [];

  function isInsideJsx(node: ts.Node): boolean {
    let parent = node.parent;
    while (parent) {
      if (
        ts.isJsxElement(parent) ||
        ts.isJsxFragment(parent) ||
        ts.isJsxSelfClosingElement(parent)
      ) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  function containsJsx(node: ts.Node): boolean {
    let found = false;
    function check(n: ts.Node): void {
      if (ts.isJsxElement(n) || ts.isJsxFragment(n) || ts.isJsxSelfClosingElement(n)) {
        found = true;
        return;
      }
      ts.forEachChild(n, check);
    }
    check(node);
    return found;
  }

  function getSnippet(node: ts.Node): string {
    const text = node.getText(sourceFile);
    // Truncate long snippets
    return text.length > 50 ? `${text.substring(0, 50)}...` : text;
  }

  function visit(node: ts.Node): void {
    // Find .map() and .filter() calls inside JSX
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const methodName = node.expression.name.text;
      if ((methodName === 'map' || methodName === 'filter') && isInsideJsx(node)) {
        // Check if the callback contains JSX
        const callback = node.arguments[0];
        if (callback && containsJsx(callback)) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(
            node.getStart(sourceFile)
          );
          usages.push({
            type: methodName as 'map' | 'filter',
            line: line + 1,
            column: character + 1,
            snippet: getSnippet(node),
          });
        }
      }
    }

    // Find ternaries in JSX that return JSX in both branches
    if (ts.isConditionalExpression(node) && isInsideJsx(node)) {
      const hasJsxInTrue = containsJsx(node.whenTrue);
      const hasJsxInFalse = containsJsx(node.whenFalse);
      // Only flag if both branches have significant JSX (not just null)
      if (hasJsxInTrue && hasJsxInFalse) {
        const falseText = node.whenFalse.getText(sourceFile).trim();
        // Don't flag simple conditional rendering like {x ? <A/> : null}
        if (falseText !== 'null' && falseText !== 'undefined') {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(
            node.getStart(sourceFile)
          );
          usages.push({
            type: 'ternary',
            line: line + 1,
            column: character + 1,
            snippet: getSnippet(node),
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return usages;
}

// =============================================================================
// Validation
// =============================================================================

interface ValidationResult {
  violations: Violation[];
  filesChecked: number;
  rulesChecked: number;
  routeStats: {
    totalLines: number;
    avgLinesPerRoute: number;
    maxLines: number;
    maxLinesFile: string;
    oversizedRoutes: number;
    inlineComponents: number;
    styledUsages: number;
    jsxLogicUsages: number;
  };
}

function validate(verbose = false): ValidationResult {
  const violations: Violation[] = [];
  const filesSet = new Set<string>();

  // Track route statistics
  let totalLines = 0;
  let maxLines = 0;
  let maxLinesFile = '';
  let oversizedRoutes = 0;
  let totalInlineComponents = 0;
  let totalStyledUsages = 0;
  let totalJsxLogicUsages = 0;

  // Get all route files
  const pattern = `${RELATIVE_PATHS.ROUTES}/**/*.tsx`;
  const files = globSync(pattern, {
    cwd: ROOT_DIR,
    ignore: ['**/node_modules/**', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/*.d.ts'],
  });

  if (verbose) {
    console.log(`Found ${files.length} route files to validate`);
    console.log('');
  }

  for (const file of files) {
    filesSet.add(file);
    const fullPath = `${ROOT_DIR}/${file}`;
    const fileName = basename(file);

    try {
      // Count lines for stats and max-lines rule
      const lineCount = countLines(fullPath);
      totalLines += lineCount;

      if (lineCount > maxLines) {
        maxLines = lineCount;
        maxLinesFile = file;
      }

      // Check max lines rule
      if (lineCount > MAX_ROUTE_LINES) {
        oversizedRoutes++;
        violations.push({
          file,
          line: 1,
          rule: 'route/max-lines',
          message: `Route file has ${lineCount} lines, exceeds maximum of ${MAX_ROUTE_LINES}`,
          severity: 'error',
          suggestion: getSuggestion('route/max-lines'),
          metadata: {
            lineCount,
            maxAllowed: MAX_ROUTE_LINES,
            excessLines: lineCount - MAX_ROUTE_LINES,
          },
        });
      }

      // Use AST-based import analysis for accuracy
      const imports = analyzeImports(fullPath);

      // Check forbidden import rules
      for (const rule of RULES) {
        if (!rule.forbiddenPackages) continue;

        for (const forbiddenPackage of rule.forbiddenPackages) {
          // Check each import against the forbidden package
          for (const imp of imports) {
            if (matchesForbiddenPackage(imp.source, forbiddenPackage)) {
              const snippet = getCodeSnippet(fullPath, imp.line);

              violations.push({
                file,
                line: imp.line,
                column: imp.column,
                rule: rule.ruleId,
                message: `${rule.description}: imports "${imp.source}"`,
                severity: rule.severity,
                suggestion: getSuggestion(rule.ruleId),
                snippet,
                metadata: {
                  importSource: imp.source,
                  importSpecifiers: imp.specifiers,
                  isTypeOnly: imp.isTypeOnly,
                },
              });
            }
          }
        }
      }

      // AST-based analysis for route purity
      const sourceFile = getSourceFile(fullPath);

      // Check if this is a passthrough, root, or layout route (special handling)
      const isPassthrough = sourceFile ? isPassthroughRoute(sourceFile) : false;
      const isRoot = isRootRoute(file);
      const isLayout = isLayoutRoute(file);

      // Check recommended package imports (warning level)
      // Skip for passthrough routes (they only render <Outlet />)
      // Skip for root route (it's a special case with providers)
      // Skip for layout routes (they're pathless wrappers like _app.tsx)
      if (!isPassthrough && !isRoot && !isLayout) {
        const hasUiImport = imports.some((imp) => imp.source.startsWith(PACKAGE_NAMES.UI));
        const hasHooksImport = imports.some((imp) => imp.source.startsWith(PACKAGE_NAMES.HOOKS));

        if (!hasUiImport) {
          violations.push({
            file,
            line: 1,
            rule: 'route/imports-ui-package',
            message: `Route does not import from ${PACKAGE_NAMES.UI}`,
            severity: 'warning',
            suggestion: getSuggestion('route/imports-ui-package'),
          });
        }

        if (!hasHooksImport) {
          violations.push({
            file,
            line: 1,
            rule: 'route/imports-hooks-package',
            message: `Route does not import from ${PACKAGE_NAMES.HOOKS}`,
            severity: 'warning',
            suggestion: getSuggestion('route/imports-hooks-package'),
          });
        }
      }

      if (sourceFile) {
        // Find the main route component
        const mainComponent = getMainRouteComponentName(sourceFile);

        // Check for inline component definitions
        // Skip for root route - it's allowed to have the root layout component inline
        if (!isRoot) {
          const componentDefs = findComponentDefinitions(sourceFile, mainComponent);
          totalInlineComponents += componentDefs.length;

          for (const comp of componentDefs) {
            violations.push({
              file,
              line: comp.line,
              column: comp.column,
              rule: 'route/no-component-definition',
              message: `Inline component "${comp.name}" should be extracted to @openflow/ui`,
              severity: 'error',
              suggestion: getSuggestion('route/no-component-definition', { name: comp.name }),
              metadata: {
                componentName: comp.name,
                componentType: comp.type,
              },
            });
          }
        }

        // Check for styled-components usage
        const styledUsages = findStyledUsage(sourceFile);
        totalStyledUsages += styledUsages.length;

        for (const usage of styledUsages) {
          violations.push({
            file,
            line: usage.line,
            column: usage.column,
            rule: 'route/no-styled-components',
            message: `Styled component "${usage.name}" should be in @openflow/ui`,
            severity: 'error',
            suggestion: getSuggestion('route/no-styled-components'),
            metadata: {
              styledName: usage.name,
            },
          });
        }

        // Check for complex JSX logic
        // Skip for root route - it has conditional devtools rendering which is acceptable
        if (!isRoot) {
          const jsxLogic = findJsxLogic(sourceFile);
          totalJsxLogicUsages += jsxLogic.length;

          for (const usage of jsxLogic) {
            violations.push({
              file,
              line: usage.line,
              column: usage.column,
              rule: 'route/no-jsx-logic',
              message: `Complex JSX ${usage.type} must be extracted to a UI component`,
              severity: 'error',
              suggestion: getSuggestion('route/no-jsx-logic'),
              snippet: usage.snippet,
              metadata: {
                logicType: usage.type,
              },
            });
          }
        }
      }

      if (verbose && sourceFile) {
        const componentCount = findComponentDefinitions(
          sourceFile,
          getMainRouteComponentName(sourceFile)
        ).length;
        console.log(
          `  ${fileName}: ${lineCount} lines, ${imports.length} imports, ${componentCount} inline components`
        );
      }
    } catch (error) {
      // Log file read/parse errors in verbose mode
      if (verbose) {
        console.error(`Error analyzing file ${file}:`, error);
      }
    }
  }

  const avgLinesPerRoute = filesSet.size > 0 ? Math.round(totalLines / filesSet.size) : 0;

  return {
    violations,
    filesChecked: filesSet.size,
    rulesChecked: RULES.length,
    routeStats: {
      totalLines,
      avgLinesPerRoute,
      maxLines,
      maxLinesFile,
      oversizedRoutes,
      inlineComponents: totalInlineComponents,
      styledUsages: totalStyledUsages,
      jsxLogicUsages: totalJsxLogicUsages,
    },
  };
}

// =============================================================================
// Main Entry Point
// =============================================================================

function main(): void {
  const args = parseValidatorArgs();

  if (args.help) {
    console.log(`
Route Component Validator (Route Purity)

Usage: pnpm validate:routes [options]

Options:
  --report, -r    Generate JSON report in reports/routes.json
  --verbose, -v   Show detailed output including file processing
  --help, -h      Show this help message

Description:
  Ensures route components in src/routes follow the import hierarchy and
  maintain purity as composition layers. Routes should read like pseudocode.

Rules:
  route/no-queries-import     Routes must use hooks, not @openflow/queries (error)
  route/no-direct-invoke      Routes cannot use @tauri-apps/api/core (error)
  route/max-lines             Route files must not exceed ${MAX_ROUTE_LINES} lines (error)
  route/no-component-definition  No inline React component definitions (error)
  route/no-styled-components  No styled-components usage (error)
  route/no-jsx-logic          No complex JSX logic (map/filter/ternaries) (error)
  route/imports-ui-package    Routes should import from @openflow/ui (warning)
  route/imports-hooks-package Routes should import from @openflow/hooks (warning)

Exempt Routes (not checked for UI/hooks imports):
  - Root route (__root.tsx) - special case with providers
  - Layout routes (_app.tsx, _auth.tsx, etc.) - pathless wrappers
  - Passthrough routes - routes that only render <Outlet />

Route Purity Philosophy:
  Routes are the orchestration layer that connects hooks to UI components.
  They should be pure composition - like pseudocode describing page structure.

  GOOD Route Pattern:
    function ProjectPage() {
      const { projectId } = useParams();
      const project = useProject(projectId);
      const tasks = useProjectTasks(projectId);

      return (
        <ProjectLayout>
          <ProjectHeader project={project} />
          <TaskList tasks={tasks} />
        </ProjectLayout>
      );
    }

  BAD Route Pattern:
    function ProjectPage() {
      // BAD: Inline component definition
      const TaskCard = ({ task }) => <div>{task.name}</div>;

      // BAD: Complex JSX logic
      return tasks.map(t => <TaskCard task={t} />);
    }

Architecture:
  Level 5 (Routes) may import from:
  - Level 4: @openflow/ui (components)
  - Level 3: @openflow/hooks (data fetching)
  - Level 0: @openflow/generated (types), @openflow/utils

  Routes should NOT:
  - Import from Level 2: @openflow/queries (use hooks instead)
  - Use @tauri-apps/api/core (use hooks/queries)
  - Define inline React components (extract to @openflow/ui)
  - Use styled-components (styles in UI components)
  - Have complex JSX logic (extract to UI components)
`);
    process.exit(0);
  }

  const reporter = new Reporter('routes', {
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
    rulesChecked: result.rulesChecked,
    config: ROUTES_CONFIG.name,
    scope: RELATIVE_PATHS.ROUTES,
    routeStats: result.routeStats,
  });

  // Print stats if verbose
  if (args.verbose) {
    const stats = result.routeStats;
    console.log('');
    console.log('Route Statistics:');
    console.log(`  Total route files: ${result.filesChecked}`);
    console.log(`  Total lines: ${stats.totalLines}`);
    console.log(`  Average lines/route: ${stats.avgLinesPerRoute}`);
    console.log(`  Largest route: ${stats.maxLinesFile} (${stats.maxLines} lines)`);
    console.log(`  Oversized routes: ${stats.oversizedRoutes}`);
    console.log(`  Inline components: ${stats.inlineComponents}`);
    console.log(`  Styled usages: ${stats.styledUsages}`);
    console.log(`  JSX logic usages: ${stats.jsxLogicUsages}`);
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
