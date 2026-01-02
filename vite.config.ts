/**
 * Vite Configuration
 *
 * This config supports both Tauri and standalone browser modes.
 *
 * ## Environment Variables
 *
 * The following environment variables are supported:
 *
 * | Variable | Default | Description |
 * |----------|---------|-------------|
 * | `VITE_BACKEND_URL` | `http://localhost:3001` | Backend server URL (HTTP mode only) |
 *
 * ## Development Modes
 *
 * 1. **Tauri Mode** (default): `pnpm dev`
 *    - Frontend connects to backend via Tauri IPC
 *    - VITE_BACKEND_URL is ignored (IPC is used instead)
 *
 * 2. **Browser Mode**: `pnpm dev:web` (with separate `pnpm dev:server`)
 *    - Frontend connects to backend via HTTP/WebSocket
 *    - Uses VITE_BACKEND_URL to connect to the server
 *
 * @see packages/queries/transport/index.ts - Transport abstraction
 * @see CLAUDE.md - Flexible Backend Architecture
 */

import { resolve } from 'node:path';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  // Log backend URL in development for debugging
  if (mode === 'development' && env.VITE_BACKEND_URL) {
    console.log(`[vite] Using backend URL: ${env.VITE_BACKEND_URL}`);
  }

  return {
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
  };
});
