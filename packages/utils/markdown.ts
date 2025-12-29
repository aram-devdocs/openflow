/**
 * Markdown parsing utilities for OpenFlow
 *
 * Provides workflow step parsing and markdown processing
 * for the workflow system.
 */

/**
 * Represents a workflow step parsed from markdown
 */
export interface WorkflowStep {
  /** Unique identifier for the step */
  id: string;
  /** Step name/title */
  name: string;
  /** Step instructions/content */
  content: string;
  /** Whether the step is completed */
  isCompleted: boolean;
  /** Optional chat ID associated with the step */
  chatId?: string;
  /** Line number where the step was found (1-indexed) */
  lineNumber: number;
}

/**
 * Result of parsing a workflow markdown file
 */
export interface ParsedWorkflow {
  /** Title of the workflow (from first H1) */
  title: string;
  /** Description/preamble before first step */
  description: string;
  /** Parsed workflow steps */
  steps: WorkflowStep[];
}

/**
 * Regex pattern for matching workflow step headers
 * Matches: ### [ ] Step: Step Name or ### [x] Step: Step Name
 */
const STEP_PATTERN = /^###\s*\[([ xX-])\]\s*Step:\s*(.+)$/;

/**
 * Regex pattern for extracting chat ID from HTML comment
 * Matches: <!-- chat-id: uuid -->
 */
const CHAT_ID_PATTERN = /<!--\s*chat-id:\s*([a-f0-9-]+)\s*-->/i;

/**
 * Parses workflow markdown content into structured steps.
 *
 * @param content - Markdown content of the workflow file
 * @returns Parsed workflow with steps
 *
 * @example
 * const workflow = parseWorkflowSteps(`
 * # My Workflow
 *
 * Some description
 *
 * ### [ ] Step: First Step
 * Do something
 *
 * ### [x] Step: Second Step
 * <!-- chat-id: abc-123 -->
 * Already done
 * `);
 * // => { title: 'My Workflow', steps: [...] }
 */
export function parseWorkflowSteps(content: string): ParsedWorkflow {
  const lines = content.split('\n');
  const steps: WorkflowStep[] = [];
  let title = '';
  let description = '';
  let currentStep: WorkflowStep | null = null;
  let stepContent: string[] = [];
  let inPreamble = true;
  let preambleLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    const lineNumber = i + 1;

    // Extract title from first H1
    if (!title && line.startsWith('# ')) {
      title = line.slice(2).trim();
      continue;
    }

    // Check for step header
    const stepMatch = line.match(STEP_PATTERN);

    if (stepMatch) {
      // Save previous step if exists
      if (currentStep) {
        currentStep.content = stepContent.join('\n').trim();
        steps.push(currentStep);
      }

      // End preamble
      if (inPreamble) {
        inPreamble = false;
        description = preambleLines.join('\n').trim();
      }

      const checkMark = stepMatch[1] ?? ' ';
      const stepName = stepMatch[2] ?? '';
      const isCompleted = checkMark.toLowerCase() === 'x';

      currentStep = {
        id: generateStepId(steps.length),
        name: stepName.trim(),
        content: '',
        isCompleted,
        lineNumber,
      };
      stepContent = [];
    } else if (currentStep) {
      // Check for chat ID in current step
      const chatIdMatch = line.match(CHAT_ID_PATTERN);
      if (chatIdMatch && chatIdMatch[1]) {
        currentStep.chatId = chatIdMatch[1];
      } else {
        stepContent.push(line);
      }
    } else if (inPreamble) {
      preambleLines.push(line);
    }
  }

  // Don't forget the last step
  if (currentStep) {
    currentStep.content = stepContent.join('\n').trim();
    steps.push(currentStep);
  }

  return {
    title,
    description,
    steps,
  };
}

/**
 * Generates a step ID based on index
 */
function generateStepId(index: number): string {
  return `step-${index + 1}`;
}

/**
 * Extracts the status of a step from markdown checkbox syntax.
 *
 * @param line - Line containing the step header
 * @returns Object with isCompleted and isInProgress flags
 *
 * @example
 * extractStepStatus('### [ ] Step: Pending') // => { isCompleted: false, isInProgress: false }
 * extractStepStatus('### [x] Step: Done') // => { isCompleted: true, isInProgress: false }
 * extractStepStatus('### [-] Step: In Progress') // => { isCompleted: false, isInProgress: true }
 */
export function extractStepStatus(line: string): {
  isCompleted: boolean;
  isInProgress: boolean;
} {
  const match = line.match(STEP_PATTERN);

  if (!match) {
    return { isCompleted: false, isInProgress: false };
  }

  const checkMark = match[1] ?? ' ';

  return {
    isCompleted: checkMark.toLowerCase() === 'x',
    isInProgress: checkMark === '-',
  };
}

/**
 * Updates a step's completion status in markdown content.
 *
 * @param content - Full markdown content
 * @param stepName - Name of the step to update
 * @param isCompleted - New completion status
 * @returns Updated markdown content
 *
 * @example
 * updateStepStatus(content, 'First Step', true)
 * // Changes '### [ ] Step: First Step' to '### [x] Step: First Step'
 */
export function updateStepStatus(
  content: string,
  stepName: string,
  isCompleted: boolean
): string {
  const lines = content.split('\n');
  const escapedName = escapeRegExp(stepName);
  const pattern = new RegExp(`^(###\\s*)\\[([ xX-])\\](\\s*Step:\\s*${escapedName}\\s*)$`);

  const updatedLines = lines.map((line) => {
    const match = line.match(pattern);
    if (match) {
      const prefix = match[1] ?? '### ';
      const suffix = match[3] ?? '';
      const newCheckMark = isCompleted ? 'x' : ' ';
      return `${prefix}[${newCheckMark}]${suffix}`;
    }
    return line;
  });

  return updatedLines.join('\n');
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Substitutes variables in workflow content.
 *
 * Variables use the format {@variable_name} and are replaced
 * with values from the provided map.
 *
 * @param content - Content with variable placeholders
 * @param variables - Map of variable names to values
 * @returns Content with variables substituted
 *
 * @example
 * substituteVariables(
 *   'Save to {@artifacts_path}/output.md',
 *   { artifacts_path: '.zenflow/tasks/abc' }
 * )
 * // => 'Save to .zenflow/tasks/abc/output.md'
 */
export function substituteVariables(
  content: string,
  variables: Record<string, string>
): string {
  return content.replace(/\{@(\w+)\}/g, (match, varName) => {
    return variables[varName] ?? match;
  });
}

/**
 * Extracts all variable placeholders from content.
 *
 * @param content - Content to scan for variables
 * @returns Array of unique variable names found
 *
 * @example
 * extractVariables('Use {@project_path} and {@artifacts_path}')
 * // => ['project_path', 'artifacts_path']
 */
export function extractVariables(content: string): string[] {
  const matches = content.matchAll(/\{@(\w+)\}/g);
  const variables = new Set<string>();

  for (const match of matches) {
    const varName = match[1];
    if (varName) {
      variables.add(varName);
    }
  }

  return Array.from(variables);
}

/**
 * Formats a workflow step for display in markdown.
 *
 * @param step - Workflow step to format
 * @returns Markdown string for the step
 */
export function formatWorkflowStep(step: WorkflowStep): string {
  const checkMark = step.isCompleted ? 'x' : ' ';
  const chatIdComment = step.chatId ? `\n<!-- chat-id: ${step.chatId} -->` : '';

  return `### [${checkMark}] Step: ${step.name}${chatIdComment}\n${step.content}`;
}
