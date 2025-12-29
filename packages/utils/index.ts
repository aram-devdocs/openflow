/**
 * @openflow/utils - Shared utility functions
 *
 * Level 0 package - no internal @openflow dependencies
 */

export { cn } from './cn';

export {
  formatDate,
  formatRelativeTime,
  parseDate,
  isToday,
  formatCompact,
  type FormatDateOptions,
} from './date';

export {
  parseWorkflowSteps,
  extractStepStatus,
  updateStepStatus,
  substituteVariables,
  extractVariables,
  formatWorkflowStep,
  type WorkflowStep,
  type ParsedWorkflow,
} from './markdown';
