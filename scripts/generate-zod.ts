#!/usr/bin/env tsx
// biome-ignore-all lint/suspicious/noAssignInExpressions: Regex exec loop is idiomatic JS
// biome-ignore-all lint/suspicious/noImplicitAnyLet: Used for regex match results
/**
 * Zod Schema Generator
 *
 * Parses Rust contract types and generates Zod validation schemas.
 * Reads @validate: annotations in doc comments from the openflow-contracts crate.
 *
 * This generator is part of the contract-first architecture that ensures:
 * - Types are defined once in Rust with validation metadata
 * - Zod schemas are auto-generated to match Rust validation rules
 * - Frontend validation mirrors backend validation
 *
 * Usage: pnpm generate:zod
 *
 * @see CLAUDE.md - Type Generation Flow section
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';

// =============================================================================
// Configuration
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');

const CONTRACTS_DIR = resolve(ROOT_DIR, 'crates/openflow-contracts/src');
const OUTPUT_FILE = resolve(ROOT_DIR, 'packages/validation/schemas-generated.ts');

// =============================================================================
// Types
// =============================================================================

interface FieldValidation {
  name: string;
  rustName: string;
  type: string;
  isOptional: boolean;
  isRequired: boolean;
  minLength?: number;
  maxLength?: number;
  format?: string;
  pattern?: string;
  min?: number;
  max?: number;
  isArray?: boolean;
  arrayItemType?: string;
  enumValues?: string[];
}

interface TypeDefinition {
  name: string;
  fields: FieldValidation[];
  isRequest: boolean;
  isEntity: boolean;
  isEnum: boolean;
  enumVariants?: string[];
  sourceFile: string;
  docComment?: string;
}

interface ParseResult {
  types: TypeDefinition[];
  enums: TypeDefinition[];
}

// =============================================================================
// Rust Type to Zod Type Mapping
// =============================================================================

const RUST_TO_ZOD_TYPE: Record<string, string> = {
  // Primitives
  String: 'z.string()',
  bool: 'z.boolean()',
  i8: 'z.number().int()',
  i16: 'z.number().int()',
  i32: 'z.number().int()',
  i64: 'z.number().int()',
  u8: 'z.number().int().nonnegative()',
  u16: 'z.number().int().nonnegative()',
  u32: 'z.number().int().nonnegative()',
  u64: 'z.number().int().nonnegative()',
  f32: 'z.number()',
  f64: 'z.number()',
  usize: 'z.number().int().nonnegative()',
  isize: 'z.number().int()',

  // Special types that become strings in TypeScript/JSON
  DateTime: 'z.string().datetime()',
  'DateTime<Utc>': 'z.string().datetime()',
  'chrono::DateTime<chrono::Utc>': 'z.string().datetime()',

  // JSON value becomes unknown
  Value: 'z.unknown()',
  'serde_json::Value': 'z.unknown()',
};

// Formats that map to Zod refinements
const FORMAT_TO_ZOD: Record<string, string> = {
  uuid: '.uuid()',
  url: '.url()',
  email: '.email()',
  datetime: '.datetime()',
  path: '', // Path validation done at runtime
};

// =============================================================================
// Parser Functions
// =============================================================================

/**
 * Parse all Rust files in the contracts directory
 */
function parseContractsDirectory(): ParseResult {
  const files = globSync('**/*.rs', { cwd: CONTRACTS_DIR });
  const allTypes: TypeDefinition[] = [];
  const allEnums: TypeDefinition[] = [];

  for (const file of files) {
    // Skip test files and mod.rs (just re-exports)
    if (file.includes('tests') || file === 'mod.rs') {
      continue;
    }

    const filePath = resolve(CONTRACTS_DIR, file);
    const content = readFileSync(filePath, 'utf-8');
    const { types, enums } = parseRustFile(content, file);
    allTypes.push(...types);
    allEnums.push(...enums);
  }

  return { types: allTypes, enums: allEnums };
}

/**
 * Parse a single Rust file for typeshare types and enums
 */
function parseRustFile(content: string, sourceFile: string): ParseResult {
  const types: TypeDefinition[] = [];
  const enums: TypeDefinition[] = [];

  // Remove line comments to simplify parsing (but keep doc comments)
  const cleanContent = content.replace(/(?<!\/\/\/)\/\/[^\n]*/g, '');

  // Parse enums with #[typeshare]
  parseEnums(cleanContent, sourceFile, enums);

  // Parse structs with #[typeshare]
  parseStructs(cleanContent, sourceFile, types);

  return { types, enums };
}

/**
 * Parse enum definitions with #[typeshare] attribute
 */
function parseEnums(content: string, sourceFile: string, enums: TypeDefinition[]): void {
  // Match enums with #[typeshare] attribute
  // Pattern: doc comments, #[typeshare], optional derives, pub enum Name { variants }
  const enumRegex =
    /((?:\/\/\/[^\n]*\n)*)\s*#\[typeshare\]\s*(?:#\[[^\]]+\]\s*)*pub\s+enum\s+(\w+)\s*\{([^}]+)\}/gs;

  let match;
  while ((match = enumRegex.exec(content)) !== null) {
    const docComment = match[1]?.trim() || '';
    const enumName = match[2];
    const variantsBlock = match[3];

    // Extract variant names (simple string variants)
    const variantRegex = /^\s*(\w+)/gm;
    const variants: string[] = [];
    let variantMatch;
    while ((variantMatch = variantRegex.exec(variantsBlock)) !== null) {
      const variantName = variantMatch[1];
      // Skip comments and empty lines
      if (variantName && !variantName.startsWith('//')) {
        variants.push(variantName);
      }
    }

    if (variants.length > 0) {
      enums.push({
        name: enumName,
        fields: [],
        isRequest: false,
        isEntity: false,
        isEnum: true,
        enumVariants: variants,
        sourceFile,
        docComment,
      });
    }
  }
}

/**
 * Parse struct definitions with #[typeshare] attribute
 */
function parseStructs(content: string, sourceFile: string, types: TypeDefinition[]): void {
  // Match structs with #[typeshare] attribute
  // Pattern: doc comments, #[typeshare], optional attributes, pub struct Name { fields }
  const structRegex =
    /((?:\/\/\/[^\n]*\n)*)\s*#\[typeshare\]\s*(?:#\[[^\]]+\]\s*)*pub\s+struct\s+(\w+)\s*\{([^}]+)\}/gs;

  let match;
  while ((match = structRegex.exec(content)) !== null) {
    const docComment = match[1]?.trim() || '';
    const structName = match[2];
    const fieldsBlock = match[3];

    const fields = parseFields(fieldsBlock);

    if (fields.length > 0) {
      types.push({
        name: structName,
        fields,
        isRequest: structName.endsWith('Request'),
        isEntity: docComment.includes('@entity') || docComment.includes('@table:'),
        isEnum: false,
        sourceFile,
        docComment,
      });
    }
  }
}

/**
 * Parse fields from a struct body
 */
function parseFields(block: string): FieldValidation[] {
  const fields: FieldValidation[] = [];

  // Split by lines and process each field with its preceding doc comments
  const lines = block.split('\n');
  let _currentDocComment = '';
  let pendingValidation = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Accumulate doc comments
    if (trimmed.startsWith('///')) {
      _currentDocComment += `${trimmed.slice(3).trim()} `;

      // Check for @validate annotation
      const validateMatch = trimmed.match(/@validate:\s*(.+)/);
      if (validateMatch) {
        pendingValidation = validateMatch[1];
      }
      continue;
    }

    // Check for #[serde(flatten)] - skip flattened fields
    if (trimmed.startsWith('#[serde(flatten)]')) {
      continue;
    }

    // Match field definition: pub field_name: Type,
    const fieldMatch = trimmed.match(/^pub\s+(\w+):\s*(.+?),?\s*$/);
    if (fieldMatch) {
      const rustFieldName = fieldMatch[1];
      const rawType = fieldMatch[2].trim().replace(/,$/, '');

      const field = parseFieldType(rustFieldName, rawType, pendingValidation);
      if (field) {
        fields.push(field);
      }

      // Reset for next field
      _currentDocComment = '';
      pendingValidation = '';
    }
  }

  return fields;
}

/**
 * Parse a field type and validation rules
 */
function parseFieldType(
  rustName: string,
  rawType: string,
  validationString: string
): FieldValidation | null {
  // Convert rust snake_case to camelCase
  const name = snakeToCamel(rustName);

  // Check if optional (Option<T>)
  const optionMatch = rawType.match(/^Option<(.+)>$/);
  const isOptional = !!optionMatch;
  const innerType = optionMatch ? optionMatch[1] : rawType;

  // Check if array (Vec<T>)
  const vecMatch = innerType.match(/^Vec<(.+)>$/);
  const isArray = !!vecMatch;
  const elementType = vecMatch ? vecMatch[1] : innerType;

  // Parse validation rules
  const validation = parseValidationString(validationString);

  return {
    name,
    rustName,
    type: elementType,
    isOptional,
    isRequired: validation.isRequired,
    minLength: validation.minLength,
    maxLength: validation.maxLength,
    format: validation.format,
    pattern: validation.pattern,
    min: validation.min,
    max: validation.max,
    isArray,
    arrayItemType: isArray ? elementType : undefined,
  };
}

/**
 * Parse @validate: annotation string into validation rules
 */
function parseValidationString(str: string): {
  isRequired: boolean;
  minLength?: number;
  maxLength?: number;
  format?: string;
  pattern?: string;
  min?: number;
  max?: number;
} {
  const result: ReturnType<typeof parseValidationString> = {
    isRequired: false,
  };

  if (!str) return result;

  // Split by comma and parse each rule
  const rules = str.split(',').map((r) => r.trim());

  for (const rule of rules) {
    if (rule === 'required') {
      result.isRequired = true;
      continue;
    }

    const kvMatch = rule.match(/^(\w+)=(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const value = kvMatch[2];

      switch (key) {
        case 'min_length':
          result.minLength = Number.parseInt(value, 10);
          break;
        case 'max_length':
          result.maxLength = Number.parseInt(value, 10);
          break;
        case 'format':
          result.format = value;
          break;
        case 'pattern':
          result.pattern = value;
          break;
        case 'min':
          result.min = Number.parseFloat(value);
          break;
        case 'max':
          result.max = Number.parseFloat(value);
          break;
      }
    }
  }

  return result;
}

/**
 * Convert snake_case to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert CamelCase to camelCase (for schema variable names)
 */
function toLowerCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// =============================================================================
// Zod Schema Generation
// =============================================================================

/**
 * Generate Zod schema for an enum
 */
function generateEnumSchema(enumDef: TypeDefinition): string {
  if (!enumDef.enumVariants || enumDef.enumVariants.length === 0) {
    return '';
  }

  const schemaName = `${toLowerCamelCase(enumDef.name)}Schema`;

  // Check if we need to convert to lowercase (by looking at serde attributes in source)
  // For safety, assume lowercase serialization if the doc comment or source suggests it
  const variants = enumDef.enumVariants.map((v) => `'${v.toLowerCase()}'`);

  const lines: string[] = [];
  lines.push('/**');
  lines.push(` * Zod schema for ${enumDef.name} enum`);
  lines.push(` * @generated from ${enumDef.sourceFile}`);
  lines.push(' */');
  lines.push(`export const ${schemaName} = z.enum([${variants.join(', ')}]);`);

  return lines.join('\n');
}

/**
 * Generate Zod schema for a struct type
 */
function generateStructSchema(typeDef: TypeDefinition, enumNames: Set<string>): string {
  const schemaName = `${toLowerCamelCase(typeDef.name)}Schema`;
  const lines: string[] = [];

  // Generate schema
  lines.push('/**');
  lines.push(` * Zod schema for ${typeDef.name}`);
  if (typeDef.isRequest) {
    lines.push(' * @request');
  }
  if (typeDef.isEntity) {
    lines.push(' * @entity');
  }
  lines.push(` * @generated from ${typeDef.sourceFile}`);
  lines.push(' */');
  lines.push(`export const ${schemaName} = z.object({`);

  for (const field of typeDef.fields) {
    const fieldSchema = generateFieldSchema(field, enumNames);
    lines.push(`  ${field.name}: ${fieldSchema},`);
  }

  lines.push('});');

  return lines.join('\n');
}

/**
 * Generate Zod schema for a single field
 */
function generateFieldSchema(field: FieldValidation, enumNames: Set<string>): string {
  let schema: string;

  // Check if this is a known enum type
  if (enumNames.has(field.type)) {
    schema = `${toLowerCamelCase(field.type)}Schema`;
  } else if (RUST_TO_ZOD_TYPE[field.type]) {
    schema = RUST_TO_ZOD_TYPE[field.type];
  } else if (field.type === 'String') {
    schema = 'z.string()';
  } else {
    // Unknown type - use string as fallback with a comment
    schema = `z.string() /* ${field.type} */`;
  }

  // Apply string validations
  if (field.type === 'String' || !RUST_TO_ZOD_TYPE[field.type]) {
    // Apply format validation
    if (field.format && FORMAT_TO_ZOD[field.format]) {
      schema = schema.replace(/\)$/, `${FORMAT_TO_ZOD[field.format]})`);
      // Actually, we need to chain it properly
      schema = 'z.string()';
      if (FORMAT_TO_ZOD[field.format]) {
        schema += FORMAT_TO_ZOD[field.format];
      }
    }

    // Apply length validations
    if (field.minLength !== undefined) {
      schema += `.min(${field.minLength})`;
    }
    if (field.maxLength !== undefined) {
      schema += `.max(${field.maxLength})`;
    }

    // Apply pattern validation
    if (field.pattern) {
      schema += `.regex(/${field.pattern}/)`;
    }
  }

  // Apply numeric validations
  if (['i8', 'i16', 'i32', 'i64', 'u8', 'u16', 'u32', 'u64', 'f32', 'f64'].includes(field.type)) {
    if (field.min !== undefined) {
      schema += `.min(${field.min})`;
    }
    if (field.max !== undefined) {
      schema += `.max(${field.max})`;
    }
  }

  // Handle arrays
  if (field.isArray) {
    let itemSchema: string;
    if (enumNames.has(field.arrayItemType || '')) {
      itemSchema = `${toLowerCamelCase(field.arrayItemType || '')}Schema`;
    } else if (RUST_TO_ZOD_TYPE[field.arrayItemType || '']) {
      itemSchema = RUST_TO_ZOD_TYPE[field.arrayItemType || ''];
    } else {
      itemSchema = 'z.string()';
    }
    schema = `z.array(${itemSchema})`;
  }

  // Handle optionality
  if (field.isOptional) {
    schema += '.optional().nullable()';
  }

  return schema;
}

/**
 * Generate the complete output file
 */
function generateOutput(types: TypeDefinition[], enums: TypeDefinition[]): string {
  const lines: string[] = [];

  // Header
  lines.push('// =============================================================================');
  lines.push('// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY');
  lines.push('// =============================================================================');
  lines.push('//');
  lines.push('// Generated by: scripts/generate-zod.ts');
  lines.push('// Source: crates/openflow-contracts/src/**/*.rs');
  lines.push(`// Generated at: ${new Date().toISOString()}`);
  lines.push('//');
  lines.push('// This file contains Zod validation schemas auto-generated from Rust contract');
  lines.push('// types. Validation rules are extracted from @validate: annotations in doc');
  lines.push('// comments and converted to equivalent Zod constraints.');
  lines.push('//');
  lines.push('// To regenerate: pnpm generate:zod');
  lines.push('//');
  lines.push('// @see CLAUDE.md - Type Generation Flow section');
  lines.push('// =============================================================================');
  lines.push('');
  lines.push(`import { z } from 'zod';`);
  lines.push('');

  // Collect enum names for reference in struct schemas
  const enumNames = new Set(enums.map((e) => e.name));

  // Generate enum schemas first (they may be referenced by structs)
  if (enums.length > 0) {
    lines.push('// =============================================================================');
    lines.push('// Enum Schemas');
    lines.push('// =============================================================================');
    lines.push('');

    for (const enumDef of enums.sort((a, b) => a.name.localeCompare(b.name))) {
      const schema = generateEnumSchema(enumDef);
      if (schema) {
        lines.push(schema);
        lines.push('');
      }
    }
  }

  // Separate request types from entity types
  const requestTypes = types.filter((t) => t.isRequest);
  const entityTypes = types.filter((t) => t.isEntity);
  const otherTypes = types.filter((t) => !t.isRequest && !t.isEntity);

  // Generate entity schemas
  if (entityTypes.length > 0) {
    lines.push('// =============================================================================');
    lines.push('// Entity Schemas');
    lines.push('// =============================================================================');
    lines.push('');

    for (const typeDef of entityTypes.sort((a, b) => a.name.localeCompare(b.name))) {
      lines.push(generateStructSchema(typeDef, enumNames));
      lines.push('');
    }
  }

  // Generate request schemas
  if (requestTypes.length > 0) {
    lines.push('// =============================================================================');
    lines.push('// Request Schemas');
    lines.push('// =============================================================================');
    lines.push('');

    for (const typeDef of requestTypes.sort((a, b) => a.name.localeCompare(b.name))) {
      lines.push(generateStructSchema(typeDef, enumNames));
      lines.push('');
    }
  }

  // Generate other schemas
  if (otherTypes.length > 0) {
    lines.push('// =============================================================================');
    lines.push('// Other Schemas');
    lines.push('// =============================================================================');
    lines.push('');

    for (const typeDef of otherTypes.sort((a, b) => a.name.localeCompare(b.name))) {
      lines.push(generateStructSchema(typeDef, enumNames));
      lines.push('');
    }
  }

  // Generate type exports
  lines.push('// =============================================================================');
  lines.push('// Type Exports (inferred from schemas)');
  lines.push('// =============================================================================');
  lines.push('');

  // Export enum types
  for (const enumDef of enums.sort((a, b) => a.name.localeCompare(b.name))) {
    const schemaName = `${toLowerCamelCase(enumDef.name)}Schema`;
    lines.push(`export type ${enumDef.name}Generated = z.infer<typeof ${schemaName}>;`);
  }

  if (enums.length > 0) {
    lines.push('');
  }

  // Export struct types
  const allStructs = [...entityTypes, ...requestTypes, ...otherTypes].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  for (const typeDef of allStructs) {
    const schemaName = `${toLowerCamelCase(typeDef.name)}Schema`;
    lines.push(`export type ${typeDef.name}Generated = z.infer<typeof ${schemaName}>;`);
  }

  lines.push('');

  return lines.join('\n');
}

// =============================================================================
// Main Execution
// =============================================================================

function main(): void {
  console.log('🔧 Generating Zod schemas from Rust contracts...\n');

  // Check if contracts directory exists
  if (!existsSync(CONTRACTS_DIR)) {
    console.error(`❌ Contracts directory not found: ${CONTRACTS_DIR}`);
    process.exit(1);
  }

  // Parse all contract files
  const { types, enums } = parseContractsDirectory();

  console.log(`📁 Parsed ${types.length} struct types and ${enums.length} enums`);

  if (types.length === 0 && enums.length === 0) {
    console.log('⚠️  No types found with #[typeshare] attribute');
    process.exit(0);
  }

  // Log details
  const requestTypes = types.filter((t) => t.isRequest);
  const entityTypes = types.filter((t) => t.isEntity);
  console.log(`   - ${requestTypes.length} request types`);
  console.log(`   - ${entityTypes.length} entity types`);
  console.log(`   - ${types.length - requestTypes.length - entityTypes.length} other types`);

  // Generate output
  const output = generateOutput(types, enums);

  // Ensure output directory exists
  const outputDir = dirname(OUTPUT_FILE);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Write output file
  writeFileSync(OUTPUT_FILE, output);

  console.log(`\n✅ Generated ${relative(ROOT_DIR, OUTPUT_FILE)}`);
  console.log(`   Total schemas: ${types.length + enums.length}`);
}

// Run the generator
main();
