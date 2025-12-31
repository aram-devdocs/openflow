/**
 * Validation Framework - Rust Analyzer Library
 *
 * Provides regex-based parsing of Rust source files for validation purposes.
 * This library extracts Tauri commands, service functions, and other patterns
 * needed for validating the Rust backend architecture.
 *
 * Note: This is not a full Rust parser - it uses regex patterns that work well
 * for typical Rust code patterns found in the OpenFlow codebase.
 */

import { readFileSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';

// =============================================================================
// Types
// =============================================================================

/**
 * Information about a Tauri command found in Rust code
 */
export interface RustTauriCommand {
  /** Function name (snake_case) */
  name: string;
  /** File where the command is defined */
  file: string;
  /** Line number where #[tauri::command] attribute appears (1-indexed) */
  line: number;
  /** Line number where function signature starts */
  functionLine: number;
  /** Whether the function is async */
  isAsync: boolean;
  /** Function parameters as raw string */
  parameters: string;
  /** Return type as raw string */
  returnType: string;
  /** Whether the function is public */
  isPublic: boolean;
  /** Doc comment if present */
  docComment?: string;
}

/**
 * Information about a Rust function
 */
export interface RustFunction {
  /** Function name */
  name: string;
  /** File where the function is defined */
  file: string;
  /** Line number where function starts (1-indexed) */
  line: number;
  /** Whether the function is async */
  isAsync: boolean;
  /** Whether the function is public */
  isPublic: boolean;
  /** Function parameters as raw string */
  parameters: string;
  /** Return type as raw string */
  returnType: string;
  /** Number of lines in the function body */
  bodyLineCount: number;
  /** Doc comment if present */
  docComment?: string;
  /** Whether the function has complex logic (loops, conditionals) */
  hasComplexLogic: boolean;
  /** Start line of function body */
  bodyStartLine: number;
  /** End line of function body */
  bodyEndLine: number;
}

/**
 * Information about a Rust service struct and its methods
 */
export interface RustService {
  /** Service struct name */
  name: string;
  /** File where the service is defined */
  file: string;
  /** Line number where service is defined */
  line: number;
  /** Methods in the impl block */
  methods: RustFunction[];
}

/**
 * Result of parsing a Rust file
 */
export interface RustFileAnalysis {
  /** File path */
  file: string;
  /** All Tauri commands found */
  tauriCommands: RustTauriCommand[];
  /** All functions found */
  functions: RustFunction[];
  /** All services found (structs with impl blocks) */
  services: RustService[];
  /** Module-level doc comments */
  moduleDoc?: string;
  /** Use statements */
  uses: string[];
  /** Whether this is a mod.rs file */
  isModFile: boolean;
}

/**
 * Information about Tauri command registration in lib.rs
 */
export interface CommandRegistration {
  /** Command name as registered */
  name: string;
  /** Full path (e.g., commands::list_projects) */
  fullPath: string;
  /** Line number in lib.rs */
  line: number;
}

// =============================================================================
// File Reading and Caching
// =============================================================================

const fileCache = new Map<string, string>();

/**
 * Read a Rust file, using cache if available
 */
function readRustFile(filePath: string): string {
  const absolutePath = resolve(filePath);
  const cached = fileCache.get(absolutePath);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const content = readFileSync(absolutePath, 'utf-8');
    fileCache.set(absolutePath, content);
    return content;
  } catch {
    return '';
  }
}

/**
 * Clear the file cache
 */
export function clearRustFileCache(): void {
  fileCache.clear();
}

// =============================================================================
// Core Parsing Functions
// =============================================================================

/**
 * Parse a Rust file and extract all relevant information.
 *
 * @param filePath - Path to the Rust file
 * @returns Complete analysis of the Rust file
 *
 * @example
 * ```ts
 * const analysis = parseRustFile('src-tauri/src/commands/chats.rs');
 * console.log(`Found ${analysis.tauriCommands.length} commands`);
 * ```
 */
export function parseRustFile(filePath: string): RustFileAnalysis {
  const content = readRustFile(filePath);
  const _lines = content.split('\n');
  const relativePath = relative(process.cwd(), resolve(filePath));

  return {
    file: relativePath,
    tauriCommands: findTauriCommands(content, relativePath),
    functions: findAllFunctions(content, relativePath),
    services: findServices(content, relativePath),
    moduleDoc: extractModuleDoc(content),
    uses: extractUseStatements(content),
    isModFile: basename(filePath) === 'mod.rs',
  };
}

/**
 * Find all #[tauri::command] annotated functions in a Rust file.
 *
 * @param filePath - Path to the Rust file
 * @returns Array of TauriCommand objects
 *
 * @example
 * ```ts
 * const commands = findTauriCommands('src-tauri/src/commands/chats.rs');
 * for (const cmd of commands) {
 *   console.log(`Command: ${cmd.name} at line ${cmd.line}`);
 * }
 * ```
 */
export function findTauriCommands(
  filePathOrContent: string,
  filePath?: string
): RustTauriCommand[] {
  const content = filePath ? filePathOrContent : readRustFile(filePathOrContent);
  const actualFilePath = filePath || filePathOrContent;
  const relativePath = relative(process.cwd(), resolve(actualFilePath));

  const commands: RustTauriCommand[] = [];
  const lines = content.split('\n');

  // Pattern to match #[tauri::command] attribute
  const tauriCommandPattern = /^\s*#\[tauri::command\]/;

  for (let i = 0; i < lines.length; i++) {
    if (tauriCommandPattern.test(lines[i])) {
      const attributeLine = i + 1; // 1-indexed

      // Look for the function signature after the attribute
      // Skip any additional attributes or doc comments
      let funcLineIndex = i + 1;
      while (funcLineIndex < lines.length) {
        const line = lines[funcLineIndex].trim();
        // Skip empty lines, attributes, and doc comments
        if (
          line === '' ||
          line.startsWith('#[') ||
          line.startsWith('///') ||
          line.startsWith('//!')
        ) {
          funcLineIndex++;
          continue;
        }
        break;
      }

      // Extract doc comment before the attribute
      const docComment = extractDocComment(lines, i);

      // Parse the function signature
      const funcSignature = extractFunctionSignature(lines, funcLineIndex);
      if (funcSignature) {
        commands.push({
          name: funcSignature.name,
          file: relativePath,
          line: attributeLine,
          functionLine: funcLineIndex + 1,
          isAsync: funcSignature.isAsync,
          parameters: funcSignature.parameters,
          returnType: funcSignature.returnType,
          isPublic: funcSignature.isPublic,
          docComment,
        });
      }
    }
  }

  return commands;
}

/**
 * Find all service structs and their impl blocks.
 *
 * @param filePath - Path to the Rust file
 * @returns Array of RustService objects
 *
 * @example
 * ```ts
 * const services = findServiceFunctions('src-tauri/src/services/chat_service.rs');
 * for (const svc of services) {
 *   console.log(`Service: ${svc.name} with ${svc.methods.length} methods`);
 * }
 * ```
 */
export function findServiceFunctions(filePath: string): RustService[] {
  const content = readRustFile(filePath);
  return findServices(content, relative(process.cwd(), resolve(filePath)));
}

/**
 * Find services (structs with impl blocks) in Rust content.
 */
function findServices(content: string, filePath: string): RustService[] {
  const services: RustService[] = [];
  const lines = content.split('\n');

  // Pattern to match struct definitions (likely services end with "Service")
  const structPattern = /^\s*pub\s+struct\s+(\w+Service)\s*[;{]/;

  // Pattern to match impl blocks
  const implPattern = /^\s*impl\s+(\w+Service)\s*\{/;

  // First pass: find all service structs
  const serviceNames = new Set<string>();
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(structPattern);
    if (match) {
      serviceNames.add(match[1]);
      services.push({
        name: match[1],
        file: filePath,
        line: i + 1,
        methods: [],
      });
    }
  }

  // Second pass: find impl blocks and their methods
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(implPattern);
    if (match && serviceNames.has(match[1])) {
      const serviceName = match[1];
      const implStartLine = i;

      // Find the matching closing brace
      let braceCount = 0;
      let implEndLine = i;
      let foundOpenBrace = false;

      for (let j = i; j < lines.length; j++) {
        for (const char of lines[j]) {
          if (char === '{') {
            braceCount++;
            foundOpenBrace = true;
          } else if (char === '}') {
            braceCount--;
          }
        }
        if (foundOpenBrace && braceCount === 0) {
          implEndLine = j;
          break;
        }
      }

      // Extract methods within the impl block
      const implContent = lines.slice(implStartLine, implEndLine + 1).join('\n');
      const methods = findFunctionsInBlock(implContent, implStartLine, filePath);

      // Add methods to the service
      const service = services.find((s) => s.name === serviceName);
      if (service) {
        service.methods.push(...methods);
      }
    }
  }

  return services;
}

/**
 * Find all functions in a Rust file.
 */
function findAllFunctions(content: string, filePath: string): RustFunction[] {
  return findFunctionsInBlock(content, 0, filePath);
}

/**
 * Find functions within a code block.
 */
function findFunctionsInBlock(
  content: string,
  lineOffset: number,
  filePath: string
): RustFunction[] {
  const functions: RustFunction[] = [];
  const lines = content.split('\n');

  // Pattern to match function definitions
  const funcPattern =
    /^\s*(pub\s+)?(async\s+)?fn\s+(\w+)\s*(<[^>]*>)?\s*\(([^)]*)\)\s*(->\s*([^{]+))?\s*\{?/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(funcPattern);

    if (match) {
      const isPublic = !!match[1];
      const isAsync = !!match[2];
      const name = match[3];
      const parameters = match[5]?.trim() || '';
      const returnType = match[7]?.trim() || '()';

      // Don't include test functions
      if (name.startsWith('test_')) {
        continue;
      }

      // Extract doc comment
      const docComment = extractDocComment(lines, i);

      // Find function body boundaries
      const { bodyStartLine, bodyEndLine, bodyLineCount } = findFunctionBody(lines, i);

      // Check for complex logic in the function body
      const bodyContent = lines.slice(bodyStartLine, bodyEndLine + 1).join('\n');
      const hasComplexLogic = detectComplexLogic(bodyContent);

      functions.push({
        name,
        file: filePath,
        line: lineOffset + i + 1,
        isAsync,
        isPublic,
        parameters,
        returnType,
        bodyLineCount,
        docComment,
        hasComplexLogic,
        bodyStartLine: lineOffset + bodyStartLine + 1,
        bodyEndLine: lineOffset + bodyEndLine + 1,
      });
    }
  }

  return functions;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract function signature from lines starting at a given index.
 */
function extractFunctionSignature(
  lines: string[],
  startIndex: number
): {
  name: string;
  isAsync: boolean;
  isPublic: boolean;
  parameters: string;
  returnType: string;
} | null {
  // Collect lines until we find the opening brace
  const signatureLines: string[] = [];
  let braceCount = 0;

  for (let i = startIndex; i < Math.min(startIndex + 10, lines.length); i++) {
    signatureLines.push(lines[i]);

    for (const char of lines[i]) {
      if (char === '{') {
        braceCount++;
        break;
      }
    }

    if (braceCount > 0) {
      break;
    }
  }

  const signature = signatureLines.join(' ');

  // Pattern to match function signature
  const funcPattern =
    /\s*(pub\s+)?(async\s+)?fn\s+(\w+)\s*(<[^>]*>)?\s*\(([^)]*)\)\s*(->\s*([^{]+))?\s*\{?/;
  const match = signature.match(funcPattern);

  if (!match) {
    return null;
  }

  return {
    name: match[3],
    isAsync: !!match[2],
    isPublic: !!match[1],
    parameters: match[5]?.trim() || '',
    returnType: match[7]?.trim() || '()',
  };
}

/**
 * Extract doc comment preceding a line.
 */
function extractDocComment(lines: string[], lineIndex: number): string | undefined {
  const docLines: string[] = [];

  // Go backwards from the line to collect /// comments
  for (let i = lineIndex - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('///')) {
      docLines.unshift(line.slice(3).trim());
    } else if (line.startsWith('#[') || line === '') {
    } else {
      break;
    }
  }

  return docLines.length > 0 ? docLines.join('\n') : undefined;
}

/**
 * Find the boundaries of a function body.
 */
function findFunctionBody(
  lines: string[],
  startLine: number
): {
  bodyStartLine: number;
  bodyEndLine: number;
  bodyLineCount: number;
} {
  let braceCount = 0;
  let bodyStartLine = startLine;
  let bodyEndLine = startLine;
  let foundOpenBrace = false;

  for (let i = startLine; i < lines.length; i++) {
    for (const char of lines[i]) {
      if (char === '{') {
        if (!foundOpenBrace) {
          bodyStartLine = i;
          foundOpenBrace = true;
        }
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      }
    }

    if (foundOpenBrace && braceCount === 0) {
      bodyEndLine = i;
      break;
    }
  }

  return {
    bodyStartLine,
    bodyEndLine,
    bodyLineCount: bodyEndLine - bodyStartLine + 1,
  };
}

/**
 * Detect if a function body contains complex logic.
 * Complex logic includes: loops, conditionals, match statements, multiple service calls.
 */
export function detectComplexLogic(body: string): boolean {
  // Remove string literals and comments to avoid false positives
  const cleanedBody = body
    .replace(/\/\/[^\n]*/g, '') // Remove line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/"(?:[^"\\]|\\.)*"/g, '""') // Remove string literals
    .replace(/'(?:[^'\\]|\\.)*'/g, "''"); // Remove char literals

  // Patterns that indicate complex logic
  const complexPatterns = [
    /\bfor\s+\w+\s+in\b/, // for loops
    /\bwhile\s+\w/, // while loops
    /\bloop\s*\{/, // infinite loops
    /\bif\s+.*\{[\s\S]*\belse\b/, // if-else (not simple if)
    /\bmatch\s+\w+\s*\{/, // match statements
    /\blet\s+.*=\s*\w+Service::\w+\(.*\).*;\s*let\s+.*=\s*\w+Service::\w+/, // Multiple service calls
  ];

  for (const pattern of complexPatterns) {
    if (pattern.test(cleanedBody)) {
      return true;
    }
  }

  // Count the number of statements (semicolons not in for loops)
  const statementCount = (cleanedBody.match(/;/g) || []).length;

  // More than 5 statements is considered complex
  return statementCount > 10;
}

/**
 * Count the number of lines in a function body.
 *
 * @param content - Full file content
 * @param functionName - Name of the function to find
 * @returns Number of lines in the function body, or -1 if not found
 */
export function countFunctionLines(content: string, functionName: string): number {
  const lines = content.split('\n');

  // Find the function definition
  const funcPattern = new RegExp(`\\b(pub\\s+)?(async\\s+)?fn\\s+${functionName}\\s*`);

  for (let i = 0; i < lines.length; i++) {
    if (funcPattern.test(lines[i])) {
      const { bodyLineCount } = findFunctionBody(lines, i);
      return bodyLineCount;
    }
  }

  return -1;
}

/**
 * Check if a function has complex business logic.
 *
 * @param filePath - Path to the Rust file
 * @param functionName - Name of the function to check
 * @returns true if the function contains complex logic
 */
export function hasComplexLogic(filePath: string, functionName: string): boolean {
  const content = readRustFile(filePath);
  const lines = content.split('\n');

  // Find the function
  const funcPattern = new RegExp(`\\b(pub\\s+)?(async\\s+)?fn\\s+${functionName}\\s*`);

  for (let i = 0; i < lines.length; i++) {
    if (funcPattern.test(lines[i])) {
      const { bodyStartLine, bodyEndLine } = findFunctionBody(lines, i);
      const body = lines.slice(bodyStartLine, bodyEndLine + 1).join('\n');
      return detectComplexLogic(body);
    }
  }

  return false;
}

/**
 * Extract module-level doc comment.
 */
function extractModuleDoc(content: string): string | undefined {
  const lines = content.split('\n');
  const docLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//!')) {
      docLines.push(trimmed.slice(3).trim());
    } else if (trimmed === '' || trimmed.startsWith('//')) {
    } else {
      break;
    }
  }

  return docLines.length > 0 ? docLines.join('\n') : undefined;
}

/**
 * Extract use statements from Rust content.
 */
function extractUseStatements(content: string): string[] {
  const uses: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('use ')) {
      // Extract the full use statement (may span multiple lines)
      uses.push(trimmed);
    }
  }

  return uses;
}

// =============================================================================
// Command Registration Analysis
// =============================================================================

/**
 * Parse the invoke_handler registration in lib.rs.
 *
 * @param libRsPath - Path to lib.rs file
 * @returns Array of registered command names and their paths
 *
 * @example
 * ```ts
 * const registrations = parseInvokeHandler('src-tauri/src/lib.rs');
 * for (const reg of registrations) {
 *   console.log(`Registered: ${reg.name} from ${reg.fullPath}`);
 * }
 * ```
 */
export function parseInvokeHandler(libRsPath: string): CommandRegistration[] {
  const content = readRustFile(libRsPath);
  const registrations: CommandRegistration[] = [];
  const lines = content.split('\n');

  // Find the invoke_handler block
  let inHandler = false;
  let bracketCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for invoke_handler start
    if (line.includes('invoke_handler(tauri::generate_handler![')) {
      inHandler = true;
    }

    if (inHandler) {
      // Count brackets to know when we exit
      for (const char of line) {
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
      }

      // Extract command paths from this line
      // Pattern: commands::command_name (with :: prefix means it's a real command)
      const commandWithPathPattern = /commands::(\w+)/g;
      let match: RegExpExecArray | null = commandWithPathPattern.exec(line);

      while (match !== null) {
        const name = match[1];
        const fullPath = match[0];

        // Skip any remaining non-command matches
        if (['mod', 'use'].includes(name)) {
          continue;
        }

        registrations.push({
          name,
          fullPath,
          line: i + 1,
        });

        match = commandWithPathPattern.exec(line);
      }

      // Exit when we close the generate_handler macro
      if (bracketCount === 0 && line.includes(']')) {
        break;
      }
    }
  }

  return registrations;
}

/**
 * Check if a command is registered in invoke_handler.
 *
 * @param libRsPath - Path to lib.rs file
 * @param commandName - Name of the command to check
 * @returns true if the command is registered
 */
export function isCommandRegistered(libRsPath: string, commandName: string): boolean {
  const registrations = parseInvokeHandler(libRsPath);
  return registrations.some((reg) => reg.name === commandName);
}

/**
 * Find commands that are defined but not registered.
 *
 * @param commandFiles - Array of paths to command files
 * @param libRsPath - Path to lib.rs file
 * @returns Array of unregistered command names and their files
 */
export function findUnregisteredCommands(
  commandFiles: string[],
  libRsPath: string
): Array<{ name: string; file: string; line: number }> {
  const registrations = parseInvokeHandler(libRsPath);
  const registeredNames = new Set(registrations.map((r) => r.name));

  const unregistered: Array<{ name: string; file: string; line: number }> = [];

  for (const file of commandFiles) {
    const commands = findTauriCommands(file);
    for (const cmd of commands) {
      if (!registeredNames.has(cmd.name)) {
        unregistered.push({
          name: cmd.name,
          file: cmd.file,
          line: cmd.line,
        });
      }
    }
  }

  return unregistered;
}

/**
 * Find registrations that have no corresponding command definition.
 *
 * @param commandFiles - Array of paths to command files
 * @param libRsPath - Path to lib.rs file
 * @returns Array of orphan registration names
 */
export function findOrphanRegistrations(
  commandFiles: string[],
  libRsPath: string
): Array<{ name: string; line: number }> {
  const registrations = parseInvokeHandler(libRsPath);

  // Collect all defined command names
  const definedNames = new Set<string>();
  for (const file of commandFiles) {
    const commands = findTauriCommands(file);
    for (const cmd of commands) {
      definedNames.add(cmd.name);
    }
  }

  // Find registrations without definitions
  const orphans: Array<{ name: string; line: number }> = [];
  for (const reg of registrations) {
    if (!definedNames.has(reg.name)) {
      orphans.push({
        name: reg.name,
        line: reg.line,
      });
    }
  }

  return orphans;
}

// =============================================================================
// Naming Convention Validation
// =============================================================================

/**
 * Check if a function name follows snake_case convention.
 */
export function isSnakeCase(name: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(name);
}

/**
 * Check if a struct name follows PascalCase convention.
 */
export function isPascalCase(name: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

/**
 * Validate command naming conventions.
 *
 * @param commands - Array of Tauri commands
 * @returns Array of commands with naming violations
 */
export function validateCommandNaming(
  commands: RustTauriCommand[]
): Array<{ command: RustTauriCommand; issue: string }> {
  const violations: Array<{ command: RustTauriCommand; issue: string }> = [];

  for (const cmd of commands) {
    if (!isSnakeCase(cmd.name)) {
      violations.push({
        command: cmd,
        issue: `Command name '${cmd.name}' should be snake_case`,
      });
    }
  }

  return violations;
}

// =============================================================================
// Service Layer Validation
// =============================================================================

/**
 * Check if a service method returns a Result type.
 *
 * @param method - The function to check
 * @returns true if the return type is Result
 */
export function returnsResult(method: RustFunction): boolean {
  return method.returnType.includes('Result<');
}

/**
 * Find service methods that don't return Result.
 *
 * @param services - Array of services to check
 * @returns Array of methods that don't return Result
 */
export function findNonResultMethods(
  services: RustService[]
): Array<{ service: string; method: RustFunction }> {
  const violations: Array<{ service: string; method: RustFunction }> = [];

  for (const service of services) {
    for (const method of service.methods) {
      // Skip private methods and new/default constructors
      if (!method.isPublic) continue;
      if (method.name === 'new' || method.name === 'default') continue;

      if (!returnsResult(method)) {
        violations.push({
          service: service.name,
          method,
        });
      }
    }
  }

  return violations;
}

/**
 * Find command handlers with complex business logic.
 * Commands should be thin wrappers that delegate to services.
 *
 * @param commands - Array of Tauri commands to check
 * @param maxLines - Maximum allowed lines in a command (default: 20)
 * @returns Array of commands with complexity violations
 */
export function findComplexCommands(
  filePath: string,
  maxLines = 20
): Array<{ command: RustTauriCommand; lineCount: number; hasComplexLogic: boolean }> {
  const content = readRustFile(filePath);
  const commands = findTauriCommands(content, filePath);
  const violations: Array<{
    command: RustTauriCommand;
    lineCount: number;
    hasComplexLogic: boolean;
  }> = [];

  const lines = content.split('\n');

  for (const cmd of commands) {
    // Find the function and analyze its body
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`fn ${cmd.name}`)) {
        const { bodyStartLine, bodyEndLine, bodyLineCount } = findFunctionBody(lines, i);
        const body = lines.slice(bodyStartLine, bodyEndLine + 1).join('\n');
        const hasComplex = detectComplexLogic(body);

        if (bodyLineCount > maxLines || hasComplex) {
          violations.push({
            command: cmd,
            lineCount: bodyLineCount,
            hasComplexLogic: hasComplex,
          });
        }
        break;
      }
    }
  }

  return violations;
}

// =============================================================================
// Rust Analyzer Class (OOP Interface)
// =============================================================================

/**
 * RustAnalyzer class provides an object-oriented interface for Rust code analysis.
 *
 * @example
 * ```ts
 * const analyzer = new RustAnalyzer('/path/to/project');
 * const commands = analyzer.getAllCommands();
 * const registrations = analyzer.getRegistrations();
 * const unregistered = analyzer.findUnregisteredCommands();
 * ```
 */
export class RustAnalyzer {
  private readonly rootDir: string;
  private readonly commandsDir: string;
  private readonly servicesDir: string;
  private readonly libRsPath: string;

  constructor(
    rootDir: string,
    options: {
      commandsDir?: string;
      servicesDir?: string;
      libRsPath?: string;
    } = {}
  ) {
    this.rootDir = resolve(rootDir);
    this.commandsDir = options.commandsDir || 'src-tauri/src/commands';
    this.servicesDir = options.servicesDir || 'src-tauri/src/services';
    this.libRsPath = options.libRsPath || 'src-tauri/src/lib.rs';
  }

  /**
   * Resolve a path relative to the root directory.
   */
  private resolvePath(path: string): string {
    return resolve(this.rootDir, path);
  }

  /**
   * Parse a Rust file.
   */
  parseFile(filePath: string): RustFileAnalysis {
    return parseRustFile(this.resolvePath(filePath));
  }

  /**
   * Get all Tauri commands from a file.
   */
  getCommands(filePath: string): RustTauriCommand[] {
    return findTauriCommands(this.resolvePath(filePath));
  }

  /**
   * Get all services from a file.
   */
  getServices(filePath: string): RustService[] {
    return findServiceFunctions(this.resolvePath(filePath));
  }

  /**
   * Get command registrations from lib.rs.
   */
  getRegistrations(): CommandRegistration[] {
    return parseInvokeHandler(this.resolvePath(this.libRsPath));
  }

  /**
   * Check if a command is registered.
   */
  isRegistered(commandName: string): boolean {
    return isCommandRegistered(this.resolvePath(this.libRsPath), commandName);
  }

  /**
   * Get the root directory.
   */
  getRootDir(): string {
    return this.rootDir;
  }

  /**
   * Clear the file cache.
   */
  clearCache(): void {
    clearRustFileCache();
  }
}
