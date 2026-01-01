import { resolve } from 'node:path';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [TanStackRouterVite(), react()],

  resolve: {
    alias: {
      '@openflow/generated': resolve(__dirname, 'packages/generated/index.ts'),
      '@openflow/primitives': resolve(__dirname, 'packages/primitives/index.ts'),
      '@openflow/utils': resolve(__dirname, 'packages/utils/index.ts'),
      '@openflow/validation': resolve(__dirname, 'packages/validation/index.ts'),
      '@openflow/queries': resolve(__dirname, 'packages/queries/index.ts'),
      '@openflow/hooks': resolve(__dirname, 'packages/hooks/index.ts'),
      '@openflow/ui': resolve(__dirname, 'packages/ui/index.ts'),
    },
  },

  // Tauri-specific settings
  clearScreen: false,

  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // Ignore src-tauri to prevent reloads during Rust compilation
      ignored: ['**/src-tauri/**'],
    },
  },

  envPrefix: ['VITE_', 'TAURI_'],

  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari14',
    // Don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
