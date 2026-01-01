import type { ExecutorProfile, Project } from '@openflow/generated';
import type { ResponsiveValue } from '@openflow/primitives';
import { Box, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { Bot, MessageSquarePlus, Terminal } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Input } from '../atoms/Input';
import { Label } from '../atoms/Label';
import { Dialog, DialogContent, DialogFooter, type DialogSize } from '../molecules/Dialog';
import { Dropdown, type DropdownOption } from '../molecules/Dropdown';
import { ProjectSelector } from './ProjectSelector';

// ============================================================================
// Types
// ============================================================================

export type NewChatDialogSize = 'sm' | 'md' | 'lg';
export type NewChatDialogBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface NewChatDialogProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role' | 'onSubmit'> {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Available projects to choose from */
  projects: Project[];
  /** Available executor profiles */
  executorProfiles: ExecutorProfile[];
  /** Pre-selected project ID (optional) */
  selectedProjectId?: string;
  /** Whether the dialog is in a loading/submitting state */
  isSubmitting?: boolean;
  /** Callback when a new chat is created */
  onCreate: (data: { projectId: string; executorProfileId?: string; title?: string }) => void;
  /** Callback when a new project is requested */
  onNewProject?: () => void;
  /** Responsive size of the dialog */
  size?: ResponsiveValue<NewChatDialogSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;

/**
 * Dialog title
 */
export const DEFAULT_DIALOG_TITLE = 'New Chat';

/**
 * Default create button label
 */
export const DEFAULT_CREATE_LABEL = 'Create Chat';

/**
 * Default cancel button label
 */
export const DEFAULT_CANCEL_LABEL = 'Cancel';

/**
 * Default loading text during submission
 */
export const DEFAULT_LOADING_TEXT = 'Creating...';

/**
 * Default project field label
 */
export const DEFAULT_PROJECT_LABEL = 'Project';

/**
 * Default agent field label
 */
export const DEFAULT_AGENT_LABEL = 'Agent';

/**
 * Default title field label
 */
export const DEFAULT_TITLE_LABEL = 'Title';

/**
 * Default optional indicator text
 */
export const DEFAULT_OPTIONAL_TEXT = '(optional)';

/**
 * Default project placeholder
 */
export const DEFAULT_PROJECT_PLACEHOLDER = 'Select a project...';

/**
 * Default agent placeholder
 */
export const DEFAULT_AGENT_PLACEHOLDER = 'Select an agent...';

/**
 * Default title placeholder
 */
export const DEFAULT_TITLE_PLACEHOLDER = 'Chat title...';

/**
 * Default no agents configured message
 */
export const DEFAULT_NO_AGENTS_MESSAGE = 'No agents configured';

/**
 * Screen reader announcement when dialog opens
 */
export const SR_DIALOG_OPENED = 'New chat dialog opened. Select a project to create a chat.';

/**
 * Screen reader announcement when submitting
 */
export const SR_SUBMITTING = 'Creating chat, please wait...';

/**
 * Screen reader announcement template for validation error
 */
export const SR_VALIDATION_ERROR = 'Please select a project to continue.';

/**
 * Screen reader announcement for default agent message
 */
export const SR_DEFAULT_AGENT_MESSAGE = 'Will use default agent:';

/**
 * Max title length
 */
export const MAX_TITLE_LENGTH = 500;

/**
 * Size mapping from NewChatDialogSize to DialogSize
 */
export const SIZE_TO_DIALOG_SIZE: Record<NewChatDialogSize, DialogSize> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

/**
 * Form field spacing classes by size
 */
export const FORM_FIELD_GAP_CLASSES: Record<NewChatDialogSize, string> = {
  sm: 'space-y-3',
  md: 'space-y-4',
  lg: 'space-y-5',
};

/**
 * Label size mapping
 */
export const LABEL_SIZE_MAP: Record<NewChatDialogSize, 'xs' | 'sm' | 'base' | 'lg'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'base',
};

/**
 * Form field container classes
 */
export const FORM_FIELD_CONTAINER_CLASSES = 'space-y-2';

/**
 * Pre-selected project info container classes
 */
export const PROJECT_INFO_CONTAINER_CLASSES = cn(
  'flex items-center gap-2 rounded-md border px-3 py-2',
  'border-[rgb(var(--border))] bg-[rgb(var(--muted))]',
  'text-sm text-[rgb(var(--foreground))]'
);

/**
 * No agents configured container classes
 */
export const NO_AGENTS_CONTAINER_CLASSES = cn(
  'flex items-center gap-2 rounded-md border px-3 py-2',
  'border-[rgb(var(--border))] bg-[rgb(var(--muted))]',
  'text-sm text-[rgb(var(--muted-foreground))]'
);

/**
 * Default agent helper text classes
 */
export const DEFAULT_AGENT_HELPER_CLASSES = 'text-xs text-[rgb(var(--muted-foreground))]';

/**
 * Footer layout classes - responsive stacking
 */
export const FOOTER_LAYOUT_CLASSES = 'flex-col gap-2 sm:flex-row';

/**
 * Button base classes for full width on mobile
 */
export const BUTTON_RESPONSIVE_CLASSES = 'w-full sm:w-auto sm:flex-1';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size from a responsive value
 */
export function getBaseSize(
  size: ResponsiveValue<NewChatDialogSize> | undefined
): NewChatDialogSize {
  if (size === undefined) {
    return 'md';
  }

  if (typeof size === 'string') {
    return size as NewChatDialogSize;
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<Record<NewChatDialogBreakpoint, NewChatDialogSize>>;
    return sizeObj.base ?? 'md';
  }

  return 'md';
}

/**
 * Generate responsive form gap classes
 */
export function getResponsiveFormGapClasses(
  size: ResponsiveValue<NewChatDialogSize> | undefined
): string {
  if (size === undefined) {
    return FORM_FIELD_GAP_CLASSES.md;
  }

  if (typeof size === 'string') {
    return FORM_FIELD_GAP_CLASSES[size];
  }

  if (typeof size === 'object' && size !== null) {
    const classes: string[] = [];
    const sizeObj = size as Partial<Record<NewChatDialogBreakpoint, NewChatDialogSize>>;

    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = sizeObj[breakpoint];
      if (breakpointValue !== undefined) {
        const gapClass = FORM_FIELD_GAP_CLASSES[breakpointValue];
        if (breakpoint === 'base') {
          classes.push(gapClass);
        } else {
          // Add breakpoint prefix - space-y-X needs to be split
          const match = gapClass.match(/space-y-(\d+)/);
          if (match) {
            classes.push(`${breakpoint}:space-y-${match[1]}`);
          }
        }
      }
    }
    return classes.join(' ');
  }

  return FORM_FIELD_GAP_CLASSES.md;
}

/**
 * Get dialog size from NewChatDialogSize
 */
export function getDialogSize(
  size: ResponsiveValue<NewChatDialogSize> | undefined
): ResponsiveValue<DialogSize> {
  if (size === undefined) {
    return 'md';
  }

  if (typeof size === 'string') {
    return SIZE_TO_DIALOG_SIZE[size];
  }

  if (typeof size === 'object' && size !== null) {
    const result: Partial<Record<NewChatDialogBreakpoint, DialogSize>> = {};
    const sizeObj = size as Partial<Record<NewChatDialogBreakpoint, NewChatDialogSize>>;

    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = sizeObj[breakpoint];
      if (breakpointValue !== undefined) {
        result[breakpoint] = SIZE_TO_DIALOG_SIZE[breakpointValue];
      }
    }
    return result as ResponsiveValue<DialogSize>;
  }

  return 'md';
}

/**
 * Build validation state for form
 */
export function getValidationState(projectId: string | undefined): {
  isValid: boolean;
  errorMessage: string | undefined;
} {
  if (!projectId) {
    return {
      isValid: false,
      errorMessage: SR_VALIDATION_ERROR,
    };
  }
  return {
    isValid: true,
    errorMessage: undefined,
  };
}

/**
 * Get icon for executor profile based on command
 */
export function getExecutorIcon(command: string): typeof Bot | typeof Terminal {
  return command.includes('claude') ? Bot : Terminal;
}

/**
 * Build accessible label for the form
 */
export function buildFormAccessibleLabel(
  selectedProject: Project | undefined,
  selectedProfile: ExecutorProfile | undefined,
  title: string
): string {
  const parts: string[] = ['New chat form'];

  if (selectedProject) {
    parts.push(`Project: ${selectedProject.name}`);
  }

  if (selectedProfile) {
    parts.push(`Agent: ${selectedProfile.name}`);
  }

  if (title.trim()) {
    parts.push(`Title: ${title.trim()}`);
  }

  return parts.join('. ');
}

// ============================================================================
// NewChatDialog Component
// ============================================================================

/**
 * Dialog for creating a new standalone chat.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Accessibility features:
 * - Inherits Dialog focus trap, escape key handling, and ARIA attributes
 * - Form fields properly labeled with htmlFor associations
 * - Screen reader announcements for validation and submission states
 * - Keyboard navigation (Enter to submit when valid)
 * - Touch targets ≥44px via Dialog molecule
 * - Loading state announced to screen readers
 *
 * @example
 * <NewChatDialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   projects={projects}
 *   executorProfiles={executorProfiles}
 *   selectedProjectId={currentProjectId}
 *   onCreate={handleCreate}
 * />
 *
 * @example
 * // Responsive sizing
 * <NewChatDialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   projects={projects}
 *   executorProfiles={executorProfiles}
 *   onCreate={handleCreate}
 *   size={{ base: 'sm', md: 'md' }}
 * />
 */
export const NewChatDialog = forwardRef<HTMLDivElement, NewChatDialogProps>(function NewChatDialog(
  {
    isOpen,
    onClose,
    projects,
    executorProfiles,
    selectedProjectId: preSelectedProjectId,
    isSubmitting = false,
    onCreate,
    onNewProject,
    size = 'md',
    className,
    'data-testid': dataTestId,
    ...props
  },
  ref
) {
  // Generate stable IDs for form fields
  const baseId = useId();
  const projectFieldId = `${baseId}-project`;
  const agentFieldId = `${baseId}-agent`;
  const titleFieldId = `${baseId}-title`;
  const defaultAgentHelperId = `${baseId}-default-agent`;

  // Local form state
  const [projectId, setProjectId] = useState<string | undefined>(preSelectedProjectId);
  const [executorProfileId, setExecutorProfileId] = useState<string | undefined>();
  const [title, setTitle] = useState('');
  const [showValidationError, setShowValidationError] = useState(false);

  // Calculate sizes
  const baseSize = getBaseSize(size);
  const formGapClasses = getResponsiveFormGapClasses(size);
  const dialogSize = getDialogSize(size);
  const labelSize = LABEL_SIZE_MAP[baseSize];

  // Find default executor profile
  const defaultProfile = useMemo(
    () => executorProfiles.find((p) => p.isDefault) ?? executorProfiles[0],
    [executorProfiles]
  );

  // Find selected project and profile
  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId]
  );

  const selectedProfile = useMemo(
    () => executorProfiles.find((p) => p.id === executorProfileId),
    [executorProfiles, executorProfileId]
  );

  // Reset form when dialog opens/closes or pre-selected project changes
  useEffect(() => {
    if (isOpen) {
      setProjectId(preSelectedProjectId);
      setExecutorProfileId(defaultProfile?.id);
      setTitle('');
      setShowValidationError(false);
    }
  }, [isOpen, preSelectedProjectId, defaultProfile?.id]);

  // Convert executor profiles to dropdown options
  const executorOptions = useMemo<DropdownOption[]>(
    () =>
      executorProfiles.map((profile) => ({
        value: profile.id,
        label: profile.name,
        icon: getExecutorIcon(profile.command),
      })),
    [executorProfiles]
  );

  // Determine if we need to show project selector
  const showProjectSelector = !preSelectedProjectId;

  // Validation
  const { isValid, errorMessage } = useMemo(() => getValidationState(projectId), [projectId]);

  const handleSubmit = useCallback(() => {
    if (!isValid || !projectId) {
      setShowValidationError(true);
      return;
    }

    onCreate({
      projectId,
      executorProfileId: executorProfileId || undefined,
      title: title.trim() || undefined,
    });
  }, [isValid, projectId, executorProfileId, title, onCreate]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && isValid && !isSubmitting) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [isValid, isSubmitting, handleSubmit]
  );

  // Clear validation error when project is selected
  useEffect(() => {
    if (projectId && showValidationError) {
      setShowValidationError(false);
    }
  }, [projectId, showValidationError]);

  return (
    <Dialog
      ref={ref}
      isOpen={isOpen}
      onClose={onClose}
      title={DEFAULT_DIALOG_TITLE}
      size={dialogSize}
      closeOnEscape={!isSubmitting}
      closeOnBackdropClick={!isSubmitting}
      data-testid={dataTestId}
      className={className}
      {...props}
    >
      {/* Screen reader announcement for dialog open */}
      <VisuallyHidden>
        <Text as="span" role="status" aria-live="polite">
          {SR_DIALOG_OPENED}
        </Text>
      </VisuallyHidden>

      {/* Screen reader announcement for submitting state */}
      {isSubmitting && (
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite">
            {SR_SUBMITTING}
          </Text>
        </VisuallyHidden>
      )}

      {/* Validation error announcement */}
      {showValidationError && !isValid && (
        <VisuallyHidden>
          <Text as="span" role="alert" aria-live="assertive">
            {errorMessage}
          </Text>
        </VisuallyHidden>
      )}

      <DialogContent data-testid={dataTestId ? `${dataTestId}-content` : undefined}>
        <Box
          className={formGapClasses}
          onKeyDown={handleKeyDown}
          role="form"
          aria-label={buildFormAccessibleLabel(selectedProject, selectedProfile, title)}
          data-testid={dataTestId ? `${dataTestId}-form` : undefined}
        >
          {/* Project selector (if not pre-selected) */}
          {showProjectSelector && (
            <Box
              className={FORM_FIELD_CONTAINER_CLASSES}
              data-testid={dataTestId ? `${dataTestId}-project-field` : undefined}
            >
              <Label htmlFor={projectFieldId} size={labelSize} required>
                {DEFAULT_PROJECT_LABEL}
              </Label>
              <ProjectSelector
                projects={projects}
                selectedProjectId={projectId}
                onSelectProject={setProjectId}
                onNewProject={onNewProject}
                placeholder={DEFAULT_PROJECT_PLACEHOLDER}
                disabled={isSubmitting}
                aria-describedby={
                  showValidationError && !projectId ? `${projectFieldId}-error` : undefined
                }
              />
              {showValidationError && !projectId && (
                <Text
                  as="p"
                  id={`${projectFieldId}-error`}
                  className="text-xs text-[rgb(var(--destructive))]"
                  role="alert"
                >
                  {errorMessage}
                </Text>
              )}
            </Box>
          )}

          {/* Pre-selected project info */}
          {!showProjectSelector && projectId && (
            <Box
              className={FORM_FIELD_CONTAINER_CLASSES}
              data-testid={dataTestId ? `${dataTestId}-project-info` : undefined}
            >
              <Text
                as="span"
                id={projectFieldId}
                className="text-sm font-medium text-[rgb(var(--foreground))]"
              >
                {DEFAULT_PROJECT_LABEL}
              </Text>
              <Box className={PROJECT_INFO_CONTAINER_CLASSES} aria-labelledby={projectFieldId}>
                <Icon
                  icon={Bot}
                  size="sm"
                  className="shrink-0 text-[rgb(var(--muted-foreground))]"
                  aria-hidden="true"
                />
                <Text as="span" className="truncate">
                  {selectedProject?.name ?? 'Unknown Project'}
                </Text>
              </Box>
            </Box>
          )}

          {/* Executor profile selector */}
          <Box
            className={FORM_FIELD_CONTAINER_CLASSES}
            data-testid={dataTestId ? `${dataTestId}-agent-field` : undefined}
          >
            <Label htmlFor={agentFieldId} size={labelSize}>
              {DEFAULT_AGENT_LABEL}
              <Text as="span" className="ml-1 text-xs text-[rgb(var(--muted-foreground))]">
                {DEFAULT_OPTIONAL_TEXT}
              </Text>
            </Label>
            {executorOptions.length > 0 ? (
              <Dropdown
                options={executorOptions}
                value={executorProfileId}
                onChange={setExecutorProfileId}
                placeholder={DEFAULT_AGENT_PLACEHOLDER}
                disabled={isSubmitting}
                aria-label={DEFAULT_AGENT_LABEL}
                aria-describedby={
                  defaultProfile && !executorProfileId ? defaultAgentHelperId : undefined
                }
                data-testid={dataTestId ? `${dataTestId}-agent-dropdown` : undefined}
              />
            ) : (
              <Box
                className={NO_AGENTS_CONTAINER_CLASSES}
                role="status"
                aria-label={DEFAULT_NO_AGENTS_MESSAGE}
              >
                <Icon icon={Bot} size="sm" className="shrink-0" aria-hidden="true" />
                <Text as="span">{DEFAULT_NO_AGENTS_MESSAGE}</Text>
              </Box>
            )}
            {defaultProfile && !executorProfileId && (
              <Text as="p" id={defaultAgentHelperId} className={DEFAULT_AGENT_HELPER_CLASSES}>
                {SR_DEFAULT_AGENT_MESSAGE} {defaultProfile.name}
              </Text>
            )}
          </Box>

          {/* Title input (optional) */}
          <Box
            className={FORM_FIELD_CONTAINER_CLASSES}
            data-testid={dataTestId ? `${dataTestId}-title-field` : undefined}
          >
            <Label htmlFor={titleFieldId} size={labelSize}>
              {DEFAULT_TITLE_LABEL}
              <Text as="span" className="ml-1 text-xs text-[rgb(var(--muted-foreground))]">
                {DEFAULT_OPTIONAL_TEXT}
              </Text>
            </Label>
            <Input
              id={titleFieldId}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={DEFAULT_TITLE_PLACEHOLDER}
              disabled={isSubmitting}
              maxLength={MAX_TITLE_LENGTH}
              data-testid={dataTestId ? `${dataTestId}-title-input` : undefined}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogFooter
        className={FOOTER_LAYOUT_CLASSES}
        data-testid={dataTestId ? `${dataTestId}-footer` : undefined}
      >
        {/* Cancel button - first in DOM for mobile stacking (appears on top)
              Platform convention: Cancel on left/top for safety */}
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={isSubmitting}
          className={BUTTON_RESPONSIVE_CLASSES}
          data-testid={dataTestId ? `${dataTestId}-cancel` : undefined}
        >
          {DEFAULT_CANCEL_LABEL}
        </Button>

        {/* Create button - second in DOM, appears on right/bottom */}
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          loadingText={DEFAULT_LOADING_TEXT}
          className={BUTTON_RESPONSIVE_CLASSES}
          icon={<Icon icon={MessageSquarePlus} size="sm" aria-hidden="true" />}
          data-testid={dataTestId ? `${dataTestId}-create` : undefined}
        >
          {DEFAULT_CREATE_LABEL}
        </Button>
      </DialogFooter>
    </Dialog>
  );
});

NewChatDialog.displayName = 'NewChatDialog';
