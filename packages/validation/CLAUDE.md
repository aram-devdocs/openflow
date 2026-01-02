# Validation Package

## Purpose

Zod schemas for runtime validation. Validates data at system boundaries - user input, API responses.

## Schema Pattern

Define schemas that match generated types. Use Zod's type inference to ensure schemas stay in sync.

## Input Validation

Validate user input before sending to backend. Provide clear error messages for validation failures.

## Response Validation

Optionally validate API responses for debugging. Helps catch contract drift early.

## Error Messages

Customize error messages for user-friendly feedback. Map Zod errors to form field errors.

## Testing

Test schemas with valid and invalid inputs. Verify error messages are helpful.
