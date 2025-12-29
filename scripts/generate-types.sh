#!/bin/bash
set -e

# Change to project root directory
cd "$(dirname "$0")/.."

echo "Generating TypeScript types from Rust..."

# Check if typeshare-cli is installed
if ! command -v typeshare &> /dev/null; then
    echo "typeshare-cli not found. Installing..."
    cargo install typeshare-cli
fi

# Generate TypeScript types from Rust types directory
typeshare ./src-tauri/src/types --lang=typescript --output-file=./packages/generated/types.ts

echo "Types generated successfully at packages/generated/types.ts"
