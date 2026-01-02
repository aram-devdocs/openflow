# Scripts

## Validator Pattern

Validators enforce architectural rules. Each validator:
- Defines rules with IDs, descriptions, and severity
- Scans relevant files using glob patterns
- Reports violations with file, line, rule, and suggestion
- Integrates with the Reporter for consistent output

## Generator Pattern

Generators create TypeScript from Rust sources:
- Read Rust type definitions
- Parse annotations for validation rules
- Output TypeScript types, Zod schemas, or query functions
- Never require manual editing of output

## Shared Utilities

Common utilities live in the lib directory:
- Reporter: Consistent console and JSON output
- Config: Centralized validator configurations
- Types: Shared type definitions

## Integration

Validators run in pre-push hooks and CI. Blocking validators must pass; non-blocking validators report warnings only.

Generators run via npm scripts. Always run after modifying Rust types.
