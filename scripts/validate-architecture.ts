/**
 * Architecture Validation Script
 *
 * Enforces the dependency hierarchy rules defined in the spec:
 *
 * Level 5: src/routes/         → Can import: all packages
 * Level 4: packages/ui/        → Can import: validation, generated, utils
 * Level 3: packages/hooks/     → Can import: queries, validation, generated, utils
 * Level 2: packages/queries/   → Can import: generated, utils
 * Level 1: packages/validation/→ Can import: generated, utils
 * Level 0: packages/generated/ → No imports (auto-generated)
 *          packages/utils/     → No internal imports
 *
 * Run: pnpm validate:arch
 */

import { globSync } from 'glob';
import { readFileSync } from 'fs';

interface Rule {
  name: string;
  pattern: string;
  forbidden: string[];
}

const RULES: Rule[] = [
  // UI components cannot import hooks or queries (they must be stateless)
  {
    name: 'UI cannot import hooks',
    pattern: 'packages/ui/**/*.{ts,tsx}',
    forbidden: ['@openflow/hooks', '../hooks', './hooks'],
  },
  {
    name: 'UI cannot import queries',
    pattern: 'packages/ui/**/*.{ts,tsx}',
    forbidden: ['@openflow/queries', '../queries', './queries'],
  },
  // Queries cannot import hooks (lower level in hierarchy)
  {
    name: 'Queries cannot import hooks',
    pattern: 'packages/queries/**/*.{ts,tsx}',
    forbidden: ['@openflow/hooks', '../hooks', './hooks'],
  },
  // Validation cannot import hooks, queries, or UI
  {
    name: 'Validation cannot import hooks',
    pattern: 'packages/validation/**/*.{ts,tsx}',
    forbidden: ['@openflow/hooks', '../hooks', './hooks'],
  },
  {
    name: 'Validation cannot import queries',
    pattern: 'packages/validation/**/*.{ts,tsx}',
    forbidden: ['@openflow/queries', '../queries', './queries'],
  },
  {
    name: 'Validation cannot import UI',
    pattern: 'packages/validation/**/*.{ts,tsx}',
    forbidden: ['@openflow/ui', '../ui', './ui'],
  },
  // Generated types should have no internal imports (auto-generated)
  {
    name: 'Generated cannot import internal packages',
    pattern: 'packages/generated/**/*.{ts,tsx}',
    forbidden: [
      '@openflow/hooks',
      '@openflow/queries',
      '@openflow/ui',
      '@openflow/validation',
      '@openflow/utils',
    ],
  },
  // Utils should have no internal imports
  {
    name: 'Utils cannot import internal packages',
    pattern: 'packages/utils/**/*.{ts,tsx}',
    forbidden: [
      '@openflow/hooks',
      '@openflow/queries',
      '@openflow/ui',
      '@openflow/validation',
      '@openflow/generated',
    ],
  },
  // No package should import from src/ (app layer)
  {
    name: 'Packages cannot import from src/',
    pattern: 'packages/**/*.{ts,tsx}',
    forbidden: ['../../src/', '../../../src/', '../../../../src/'],
  },
  // Hooks cannot import UI
  {
    name: 'Hooks cannot import UI',
    pattern: 'packages/hooks/**/*.{ts,tsx}',
    forbidden: ['@openflow/ui', '../ui', './ui'],
  },
];

function checkImport(content: string, forbidden: string): boolean {
  // Check for various import patterns:
  // import ... from 'package'
  // import ... from "package"
  // import('package')
  // require('package')
  const patterns = [
    `from '${forbidden}`,
    `from "${forbidden}`,
    `import('${forbidden}`,
    `import("${forbidden}`,
    `require('${forbidden}`,
    `require("${forbidden}`,
  ];

  return patterns.some((pattern) => content.includes(pattern));
}

function validate(): boolean {
  let hasErrors = false;
  const violations: { rule: string; file: string; forbidden: string }[] = [];

  for (const rule of RULES) {
    const files = globSync(rule.pattern, {
      ignore: ['**/node_modules/**', '**/*.stories.{ts,tsx}', '**/*.test.{ts,tsx}'],
    });

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');

        for (const forbidden of rule.forbidden) {
          if (checkImport(content, forbidden)) {
            violations.push({
              rule: rule.name,
              file,
              forbidden,
            });
            hasErrors = true;
          }
        }
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
        hasErrors = true;
      }
    }
  }

  // Output results
  if (violations.length > 0) {
    console.error('\n❌ Architecture violations found:\n');

    // Group by rule for cleaner output
    const byRule = violations.reduce(
      (acc, v) => {
        if (!acc[v.rule]) {
          acc[v.rule] = [];
        }
        acc[v.rule].push(v);
        return acc;
      },
      {} as Record<string, typeof violations>
    );

    for (const [ruleName, ruleViolations] of Object.entries(byRule)) {
      console.error(`  ${ruleName}:`);
      for (const v of ruleViolations) {
        console.error(`    - ${v.file} imports "${v.forbidden}"`);
      }
      console.error('');
    }

    console.error(`Total: ${violations.length} violation(s)\n`);
  } else {
    console.log('✅ Architecture validation passed');
    console.log(`   Checked ${RULES.length} rules across all packages`);
  }

  return !hasErrors;
}

// Run validation
const success = validate();
process.exit(success ? 0 : 1);
