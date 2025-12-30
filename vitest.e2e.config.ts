import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * E2E test configuration.
 * These tests require the Tauri app to be running.
 * Run with: pnpm test:e2e (after starting the app with pnpm dev:mcp)
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts', 'tests/e2e/**/*.test.tsx'],
    setupFiles: ['tests/e2e/setup.ts'],
  },
  resolve: {
    alias: {
      '@openflow/generated': resolve(__dirname, 'packages/generated/index.ts'),
      '@openflow/utils': resolve(__dirname, 'packages/utils/index.ts'),
      '@openflow/validation': resolve(__dirname, 'packages/validation/index.ts'),
      '@openflow/queries': resolve(__dirname, 'packages/queries/index.ts'),
      '@openflow/hooks': resolve(__dirname, 'packages/hooks/index.ts'),
      '@openflow/ui': resolve(__dirname, 'packages/ui/index.ts'),
    },
  },
});
