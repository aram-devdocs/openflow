/**
 * Storybook Coverage Validator (FR-9)
 *
 * Ensures UI components in packages/ui have corresponding Storybook stories.
 * This validator helps maintain comprehensive component documentation and testing.
 *
 * Rules:
 * - storybook/missing-story: Component file has no corresponding .stories file (error)
 * - storybook/orphan-story: Story file has no corresponding component file (warning)
 *
 * Run: pnpm validate:storybook
 * Run with report: pnpm validate:storybook --report
 */

import { basename, dirname } from 'node:path';
import { globSync } from 'glob';

import {
  COMMON_EXCLUDES,
  PACKAGE_PATHS,
  ROOT_DIR,
  STORYBOOK_CONFIG,
  TEST_EXCLUDES,
} from './lib/config';
import { Reporter, parseValidatorArgs } from './lib/reporter';
import type { Severity, Violation } from './lib/types';

// =============================================================================
// Types
// =============================================================================

interface ComponentInfo {
  /** Relative path to the component file */
  filePath: string;
  /** Component name derived from filename */
  componentName: string;
  /** Directory containing the component */
  directory: string;
  /** Whether a story file exists */
  hasStory: boolean;
}

interface StoryInfo {
  /** Relative path to the story file */
  filePath: string;
  /** Component name derived from story filename */
  componentName: string;
  /** Directory containing the story */
  directory: string;
  /** Whether a component file exists */
  hasComponent: boolean;
}

interface StorybookRule {
  ruleId: string;
  description: string;
  severity: Severity;
}

// =============================================================================
// Storybook Rules
// =============================================================================

const RULES: StorybookRule[] = [
  {
    ruleId: 'storybook/missing-story',
    description: 'Component has no corresponding .stories file',
    severity: 'error',
  },
  {
    ruleId: 'storybook/orphan-story',
    description: 'Story file has no corresponding component',
    severity: 'warning',
  },
];

// =============================================================================
// File Pattern Matching
// =============================================================================

/**
 * Files that should be excluded from requiring stories
 */
const EXCLUDED_PATTERNS = [
  // Index/barrel files
  /index\.tsx?$/,
  // Type definition files
  /types\.tsx?$/,
  // Provider components (typically wrap the app, not visual components)
  /Provider\.tsx$/,
  // Context files
  /Context\.tsx$/,
  // Hook files within UI package
  /use[A-Z].*\.tsx?$/,
];

/**
 * Check if a component file should be excluded from story requirement
 */
function shouldExcludeComponent(filePath: string): boolean {
  const fileName = basename(filePath);
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(fileName));
}

/**
 * Check if a story file corresponds to an excluded component pattern
 * This prevents "orphan story" warnings for stories of excluded components like ToastProvider
 */
function isStoryForExcludedComponent(storyPath: string): boolean {
  const componentName = getComponentNameFromStory(storyPath);
  // Check if the corresponding component name would match any exclusion pattern
  const hypotheticalComponentFile = `${componentName}.tsx`;
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(hypotheticalComponentFile));
}

/**
 * Get the component name from a file path
 * e.g., "packages/ui/atoms/Button.tsx" -> "Button"
 */
function getComponentNameFromPath(filePath: string): string {
  const fileName = basename(filePath);
  // Remove .tsx or .ts extension
  return fileName.replace(/\.(tsx?|stories\.tsx?)$/, '');
}

/**
 * Get the component name from a story file path
 * e.g., "packages/ui/atoms/Button.stories.tsx" -> "Button"
 */
function getComponentNameFromStory(storyPath: string): string {
  const fileName = basename(storyPath);
  // Remove .stories.tsx extension
  return fileName.replace(/\.stories\.tsx?$/, '');
}

/**
 * Find all component files in the UI package
 */
function findComponentFiles(): ComponentInfo[] {
  const pattern = `${PACKAGE_PATHS.UI}/**/*.tsx`;
  const files = globSync(pattern, {
    cwd: ROOT_DIR,
    ignore: [
      ...COMMON_EXCLUDES,
      ...TEST_EXCLUDES,
      // Exclude story files
      '**/*.stories.tsx',
      // Exclude declaration files
      '**/*.d.ts',
    ],
  });

  return files
    .filter((file) => !shouldExcludeComponent(file))
    .map((file) => ({
      filePath: file,
      componentName: getComponentNameFromPath(file),
      directory: dirname(file),
      hasStory: false, // Will be set later
    }));
}

/**
 * Find all story files in the UI package
 */
function findStoryFiles(): StoryInfo[] {
  const pattern = `${PACKAGE_PATHS.UI}/**/*.stories.tsx`;
  const files = globSync(pattern, {
    cwd: ROOT_DIR,
    ignore: COMMON_EXCLUDES,
  });

  return files.map((file) => ({
    filePath: file,
    componentName: getComponentNameFromStory(file),
    directory: dirname(file),
    hasComponent: false, // Will be set later
  }));
}

// =============================================================================
// Suggestion Helpers
// =============================================================================

/**
 * Generate a helpful suggestion for missing stories
 */
function getMissingStorySuggestion(componentPath: string): string {
  const componentName = getComponentNameFromPath(componentPath);
  const storyPath = componentPath.replace(/\.tsx$/, '.stories.tsx');
  return `Create ${storyPath} with stories for ${componentName}`;
}

/**
 * Generate a helpful suggestion for orphan stories
 */
function getOrphanStorySuggestion(storyPath: string): string {
  const componentName = getComponentNameFromStory(storyPath);
  return `Remove orphan story or create corresponding ${componentName}.tsx component`;
}

// =============================================================================
// Validation
// =============================================================================

interface ValidationResult {
  violations: Violation[];
  componentsChecked: number;
  storiesFound: number;
  coverage: number;
  componentsMissingStories: string[];
  orphanStories: string[];
}

function validate(verbose = false): ValidationResult {
  const violations: Violation[] = [];

  // Find all components and stories
  const components = findComponentFiles();
  const stories = findStoryFiles();

  if (verbose) {
    console.log(`  Found ${components.length} component files`);
    console.log(`  Found ${stories.length} story files`);
  }

  // Build lookup maps
  const storyByNameAndDir = new Map<string, StoryInfo>();
  for (const story of stories) {
    const key = `${story.directory}/${story.componentName}`;
    storyByNameAndDir.set(key, story);
  }

  const componentByNameAndDir = new Map<string, ComponentInfo>();
  for (const component of components) {
    const key = `${component.directory}/${component.componentName}`;
    componentByNameAndDir.set(key, component);
  }

  // Check for missing stories
  const componentsMissingStories: string[] = [];
  for (const component of components) {
    const key = `${component.directory}/${component.componentName}`;
    if (storyByNameAndDir.has(key)) {
      component.hasStory = true;
    } else {
      componentsMissingStories.push(component.filePath);
      violations.push({
        file: component.filePath,
        rule: 'storybook/missing-story',
        message: `Component "${component.componentName}" has no corresponding .stories.tsx file`,
        severity: 'error',
        suggestion: getMissingStorySuggestion(component.filePath),
        metadata: {
          componentName: component.componentName,
          expectedStoryPath: component.filePath.replace(/\.tsx$/, '.stories.tsx'),
        },
      });
    }
  }

  // Check for orphan stories
  const orphanStories: string[] = [];
  for (const story of stories) {
    const key = `${story.directory}/${story.componentName}`;
    if (componentByNameAndDir.has(key)) {
      story.hasComponent = true;
    } else if (isStoryForExcludedComponent(story.filePath)) {
      // Story corresponds to an excluded component (e.g., ToastProvider)
      // This is not an orphan - the component exists but is intentionally excluded from coverage
      story.hasComponent = true;
    } else {
      orphanStories.push(story.filePath);
      violations.push({
        file: story.filePath,
        rule: 'storybook/orphan-story',
        message: `Story file "${basename(story.filePath)}" has no corresponding component`,
        severity: 'warning',
        suggestion: getOrphanStorySuggestion(story.filePath),
        metadata: {
          componentName: story.componentName,
          expectedComponentPath: story.filePath.replace(/\.stories\.tsx$/, '.tsx'),
        },
      });
    }
  }

  // Calculate coverage
  const componentsWithStories = components.filter((c) => c.hasStory).length;
  const coverage =
    components.length > 0 ? Math.round((componentsWithStories / components.length) * 100) : 100;

  if (verbose) {
    console.log(
      `  Components with stories: ${componentsWithStories}/${components.length} (${coverage}%)`
    );
    console.log(`  Components missing stories: ${componentsMissingStories.length}`);
    console.log(`  Orphan stories: ${orphanStories.length}`);
  }

  return {
    violations,
    componentsChecked: components.length,
    storiesFound: stories.length,
    coverage,
    componentsMissingStories,
    orphanStories,
  };
}

// =============================================================================
// Main Entry Point
// =============================================================================

function main(): void {
  const args = parseValidatorArgs();

  if (args.help) {
    console.log(`
Storybook Coverage Validator

Usage: pnpm validate:storybook [options]

Options:
  --report, -r    Generate JSON report in reports/storybook.json
  --verbose, -v   Show detailed output including file processing
  --help, -h      Show this help message

Description:
  Ensures UI components in packages/ui have corresponding Storybook stories.
  Story coverage helps maintain component documentation and enables visual testing.

Rules:
  storybook/missing-story  - Component has no .stories.tsx file (error)
  storybook/orphan-story   - Story file has no corresponding component (warning)

Coverage Calculation:
  Coverage = (Components with Stories) / (Total Components) * 100

Excluded from Coverage:
  - index.tsx files (barrel exports)
  - types.tsx files (type definitions)
  - *Provider.tsx files (app-level providers)
  - *Context.tsx files (React context files)
  - use*.tsx files (hook files)

Story File Convention:
  - Component: packages/ui/atoms/Button.tsx
  - Story:     packages/ui/atoms/Button.stories.tsx
`);
    process.exit(0);
  }

  const reporter = new Reporter('storybook', {
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
    componentsChecked: result.componentsChecked,
    storiesFound: result.storiesFound,
    coveragePercent: result.coverage,
    componentsMissingStories: result.componentsMissingStories.length,
    orphanStories: result.orphanStories.length,
    rulesChecked: RULES.length,
    config: STORYBOOK_CONFIG.name,
    scope: PACKAGE_PATHS.UI,
  });

  // Print coverage info
  if (!args.verbose) {
    reporter.printInfo(
      `Coverage: ${result.coverage}% (${result.storiesFound}/${result.componentsChecked} components have stories)`
    );
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
