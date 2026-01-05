#!/bin/bash
# Build the agent-bridge package for production bundling
#
# This script:
# 1. Builds the TypeScript code
# 2. Copies the output to Tauri resources for bundling
#
# Usage:
#   ./scripts/build-bridge.sh
#
# The built bridge will be available at:
#   - packages/agent-bridge/dist/  (for development/standalone)
#   - src-tauri/resources/agent-bridge/  (for Tauri bundling)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BRIDGE_DIR="$PROJECT_ROOT/packages/agent-bridge"
TAURI_RESOURCES="$PROJECT_ROOT/src-tauri/resources"

echo "Building agent-bridge..."

# Navigate to the bridge package
cd "$BRIDGE_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    pnpm install
fi

# Build TypeScript
echo "Compiling TypeScript..."
pnpm build

# Verify build succeeded
if [ ! -f "dist/server.js" ]; then
    echo "Error: Build failed - dist/server.js not found"
    exit 1
fi

echo "Build succeeded: $BRIDGE_DIR/dist/"

# Copy to Tauri resources for bundling
echo "Copying to Tauri resources..."
mkdir -p "$TAURI_RESOURCES/agent-bridge"
cp -r dist/* "$TAURI_RESOURCES/agent-bridge/"

echo "Copied to: $TAURI_RESOURCES/agent-bridge/"

# List the contents
echo ""
echo "Bridge files:"
ls -la "$TAURI_RESOURCES/agent-bridge/"

echo ""
echo "✓ Agent bridge build complete!"
echo ""
echo "The bridge is now available for:"
echo "  - Development: packages/agent-bridge/dist/server.js"
echo "  - Tauri bundle: src-tauri/resources/agent-bridge/server.js"

