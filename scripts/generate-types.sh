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

# Generate TypeScript types from both sources:
# 1. Original Tauri types (src-tauri/src/types) - for backward compatibility during migration
# 2. New contracts crate (crates/openflow-contracts) - the new source of truth
#
# typeshare will search all directories recursively and combine types into a single output file.
# Types from the second directory (contracts) will override types from the first if there are duplicates.
#
# Migration strategy:
# - During migration: Include both directories to ensure all types are available
# - After migration: Remove src-tauri/src/types and only use contracts crate

SOURCES=()

# Include original types for backward compatibility
if [ -d "./src-tauri/src/types" ]; then
    echo "Including src-tauri/src/types for backward compatibility"
    SOURCES+=("./src-tauri/src/types")
fi

# Include contracts crate (new source of truth)
if [ -d "./crates/openflow-contracts/src" ]; then
    echo "Including crates/openflow-contracts (primary source)"
    SOURCES+=("./crates/openflow-contracts/src")
fi

# Generate types from all sources
if [ ${#SOURCES[@]} -eq 0 ]; then
    echo "ERROR: No type sources found!"
    exit 1
fi

echo "Generating from ${#SOURCES[@]} source(s)..."
typeshare "${SOURCES[@]}" --lang=typescript --output-file=./packages/generated/types.ts

echo "Types generated successfully at packages/generated/types.ts"
