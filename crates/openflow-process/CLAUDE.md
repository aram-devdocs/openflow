# Process Crate

## Purpose

Manages PTY processes and output streaming. Handles spawning CLI tools, capturing output, and process lifecycle.

## PTY Management

Use portable PTY library for cross-platform support. Manage PTY size, handle resize events, and clean up on process exit.

## Output Streaming

Stream output chunks as they arrive. Don't buffer entire output - send incrementally. Handle both stdout and stderr.

## Process Lifecycle

Track process state (pending, running, completed, failed, killed). Clean up resources on completion. Support graceful termination.

## Input Handling

Forward user input to PTY. Handle special sequences appropriately. Support resize operations.

## Error Handling

Handle process spawn failures, I/O errors, and unexpected termination. Provide clear error messages for debugging.
