import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // Exclude e2e tests - they require the Tauri app running
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'src-tauri/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/index.ts',
        'tests/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@openflow/generated': resolve(__dirname, 'packages/generated/index.ts'),
      '@openflow/utils': resolve(__dirname, 'packages/utils/index.ts'),
      '@openflow/primitives': resolve(__dirname, 'packages/primitives/index.ts'),
      '@openflow/validation': resolve(__dirname, 'packages/validation/index.ts'),
      '@openflow/queries': resolve(__dirname, 'packages/queries/index.ts'),
      '@openflow/hooks': resolve(__dirname, 'packages/hooks/index.ts'),
      // UI package with sub-package support
      '@openflow/ui/atoms': resolve(__dirname, 'packages/ui/atoms/index.ts'),
      '@openflow/ui/molecules': resolve(__dirname, 'packages/ui/molecules/index.ts'),
      '@openflow/ui/organisms': resolve(__dirname, 'packages/ui/organisms/index.ts'),
      '@openflow/ui/templates': resolve(__dirname, 'packages/ui/templates/index.ts'),
      '@openflow/ui/pages': resolve(__dirname, 'packages/ui/pages/index.ts'),
      '@openflow/ui': resolve(__dirname, 'packages/ui/index.ts'),
    },
  },
});
