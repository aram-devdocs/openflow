/**
 * CreatePRDialog Organism - Dialog for creating GitHub Pull Requests
 *
 * Combines Dialog molecule with form fields and GitHub status indicators.
 * Fully accessible with proper form labeling, error handling, and screen reader support.
 *
 * @example
 * <CreatePRDialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onCreate={handleCreate}
 *   defaultTitle="Add user authentication"
 *   defaultBase="main"
 *   ghCliInstalled={true}
 *   ghAuthenticated={true}
 * />
 */

import { Box, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertCircle, GitPullRequest } from 'lucide-react';
import { type HTMLAttributes, forwardRef, useCallback, useEffect, useId, useState } from 'react';
import { Button } from '../atoms/Button';
import { Checkbox } from '../atoms/Checkbox';
import { Icon } from '../atoms/Icon';
import { Input } from '../atoms/Input';
import { Label } from '../atoms/Label';
import { Textarea } from '../atoms/Textarea';
import { Dialog, DialogContent, DialogFooter, type DialogSize } from '../molecules/Dialog';

// ============================================================================
// Types
// ============================================================================

export type CreatePRDialogSize = 'sm' | 'md' | 'lg';
export type CreatePRDialogBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface CreatePRDialogProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onSubmit'> {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Callback when a PR is created */
  onCreate: (data: {
    title: string;
    body: string;
    base?: string;
    draft?: boolean;
  }) => void;
  /** Pre-filled title (usually from task title) */
  defaultTitle?: string;
  /** Pre-filled body (optional) */
  defaultBody?: string;
  /** Base branch for the PR (e.g., "main", "develop") */
  defaultBase?: string;
  /** Whether the dialog is in a loading/submitting state */
  isSubmitting?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Whether GitHub CLI is installed */
  ghCliInstalled?: boolean;
  /** Whether user is authenticated with GitHub */
  ghAuthenticated?: boolean;
  /** Responsive size of the dialog */
  size?: ResponsiveValue<CreatePRDialogSize>;
  /** Accessible label for the create button */
  createAriaLabel?: string;
  /** Accessible label for the cancel button */
  cancelAriaLabel?: string;
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
 * Default dialog title
 */
export const DEFAULT_DIALOG_TITLE = 'Create Pull Request';

/**
 * Default create button label
 */
export const DEFAULT_CREATE_LABEL = 'Create Pull Request';

/**
 * Default cancel button label
 */
export const DEFAULT_CANCEL_LABEL = 'Cancel';

/**
 * Default loading text for create button
 */
export const DEFAULT_LOADING_TEXT = 'Creating PR...';

/**
 * Default placeholder for title input
 */
export const DEFAULT_TITLE_PLACEHOLDER = 'Brief description of changes';

/**
 * Default placeholder for body textarea
 */
export const DEFAULT_BODY_PLACEHOLDER = 'Describe your changes in detail. Supports markdown.';

/**
 * Default placeholder for base branch input
 */
export const DEFAULT_BASE_PLACEHOLDER = 'main';

/**
 * Maximum length for PR title
 */
export const MAX_TITLE_LENGTH = 256;

/**
 * Screen reader announcement for dialog open
 */
export const SR_DIALOG_OPENED =
  'Create Pull Request dialog opened. Fill in the form to create a new pull request.';

/**
 * Screen reader announcement for submitting
 */
export const SR_SUBMITTING = 'Creating pull request, please wait...';

/**
 * Screen reader announcement for validation error
 */
export const SR_VALIDATION_ERROR = 'Please enter a title for the pull request.';

/**
 * Screen reader announcement for GitHub CLI not installed
 */
export const SR_GH_NOT_INSTALLED =
  'Warning: GitHub CLI is not installed. You must install it to create pull requests.';

/**
 * Screen reader announcement for not authenticated
 */
export const SR_NOT_AUTHENTICATED =
  'Warning: You are not authenticated with GitHub. Please run gh auth login.';

/**
 * GitHub CLI warning messages
 */
export const GH_NOT_INSTALLED_TITLE = 'GitHub CLI not installed';
export const GH_NOT_INSTALLED_MESSAGE =
  'Install the GitHub CLI to create pull requests: brew install gh';

export const GH_NOT_AUTHENTICATED_TITLE = 'Not authenticated with GitHub';
export const GH_NOT_AUTHENTICATED_MESSAGE = 'Run gh auth login to authenticate.';

/**
 * Info text for PR creation
 */
export const PR_INFO_TEXT =
  'This will create a pull request from your task branch to the target branch.';

/**
 * Base branch helper text
 */
export const BASE_BRANCH_HELPER = "Leave empty to use the project's default base branch.";

/**
 * Draft PR label
 */
export const DRAFT_LABEL = 'Create as draft PR';

/**
 * Draft PR helper text
 */
export const DRAFT_HELPER = '(can be marked ready for review later)';

/**
 * Keyboard shortcut hint
 */
export const KEYBOARD_SHORTCUT_HINT = 'Press Cmd+Enter to submit';

/**
 * Size mapping from CreatePRDialogSize to DialogSize
 */
export const SIZE_TO_DIALOG_SIZE: Record<CreatePRDialogSize, DialogSize> = {
  sm: 'md',
  md: 'lg',
  lg: 'xl',
};

/**
 * Form field spacing classes by size
 */
export const FORM_FIELD_GAP_CLASSES: Record<CreatePRDialogSize, string> = {
  sm: 'space-y-3',
  md: 'space-y-4',
  lg: 'space-y-5',
};

/**
 * Label size mapping by dialog size
 */
export const LABEL_SIZE_MAP: Record<CreatePRDialogSize, 'xs' | 'sm' | 'base'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'sm',
};

/**
 * Warning container base classes
 */
export const WARNING_CONTAINER_CLASSES = [
  'flex',
  'items-start',
  'gap-3',
  'rounded-md',
  'border',
  'p-3',
] as const;

/**
 * Warning border color classes by type
 */
export const WARNING_BORDER_CLASSES = {
  warning: 'border-[rgb(var(--warning))]/30 bg-[rgb(var(--warning))]/10',
  error: 'border-[rgb(var(--destructive))]/30 bg-[rgb(var(--destructive))]/10',
} as const;

/**
 * PR icon container classes
 */
export const PR_ICON_CONTAINER_CLASSES = [
  'flex',
  'h-10',
  'w-10',
  'items-center',
  'justify-center',
  'rounded-full',
  'bg-[rgb(var(--primary))]/10',
] as const;

/**
 * Form field container classes
 */
export const FORM_FIELD_CONTAINER_CLASSES = ['space-y-2'] as const;

/**
 * Draft checkbox container classes
 */
export const DRAFT_CHECKBOX_CONTAINER_CLASSES = ['flex', 'items-center', 'gap-3'] as const;

/**
 * Footer layout classes
 */
export const FOOTER_LAYOUT_CLASSES = ['flex-col', 'gap-2', 'sm:flex-row'] as const;

/**
 * Button responsive classes
 */
export const BUTTON_RESPONSIVE_CLASSES = ['w-full', 'sm:w-auto'] as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size from a responsive value
 */
export function getBaseSize(
  size: ResponsiveValue<CreatePRDialogSize> | undefined
): CreatePRDialogSize {
  if (size === undefined) {
    return 'md';
  }

  if (typeof size === 'string') {
    return size;
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<Record<CreatePRDialogBreakpoint, CreatePRDialogSize>>;
    return sizeObj.base ?? 'md';
  }

  return 'md';
}

/**
 * Generate responsive form gap classes
 */
export function getResponsiveFormGapClasses(
  size: ResponsiveValue<CreatePRDialogSize> | undefined
): string {
  if (size === undefined) {
    return FORM_FIELD_GAP_CLASSES.md;
  }

  if (typeof size === 'string') {
    return FORM_FIELD_GAP_CLASSES[size];
  }

  if (typeof size === 'object' && size !== null) {
    const classes: string[] = [];
    const sizeObj = size as Partial<Record<CreatePRDialogBreakpoint, CreatePRDialogSize>>;

    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = sizeObj[breakpoint];
      if (breakpointValue !== undefined) {
        const gapClass = FORM_FIELD_GAP_CLASSES[breakpointValue];
        if (breakpoint === 'base') {
          classes.push(gapClass);
        } else {
          // Convert space-y-X to breakpoint:space-y-X
          const parts = gapClass.split(' ');
          classes.push(...parts.map((c) => `${breakpoint}:${c}`));
        }
      }
    }
    return classes.join(' ');
  }

  return FORM_FIELD_GAP_CLASSES.md;
}

/**
 * Get dialog size from CreatePRDialogSize
 */
export function getDialogSize(
  size: ResponsiveValue<CreatePRDialogSize> | undefined
): ResponsiveValue<DialogSize> {
  if (size === undefined) {
    return 'lg';
  }

  if (typeof size === 'string') {
    return SIZE_TO_DIALOG_SIZE[size];
  }

  if (typeof size === 'object' && size !== null) {
    const result: Partial<Record<CreatePRDialogBreakpoint, DialogSize>> = {};
    const sizeObj = size as Partial<Record<CreatePRDialogBreakpoint, CreatePRDialogSize>>;

    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = sizeObj[breakpoint];
      if (breakpointValue !== undefined) {
        result[breakpoint] = SIZE_TO_DIALOG_SIZE[breakpointValue];
      }
    }
    return result as ResponsiveValue<DialogSize>;
  }

  return 'lg';
}

/**
 * Build the GitHub CLI warning announcement
 */
export function buildGhWarningAnnouncement(
  ghCliInstalled: boolean,
  ghAuthenticated: boolean
): string {
  if (!ghCliInstalled) {
    return SR_GH_NOT_INSTALLED;
  }
  if (!ghAuthenticated) {
    return SR_NOT_AUTHENTICATED;
  }
  return '';
}

/**
 * Get validation state for form
 */
export function getValidationState(
  title: string,
  ghCliInstalled: boolean,
  ghAuthenticated: boolean
): { isValid: boolean; errorMessage: string | null } {
  if (!ghCliInstalled) {
    return { isValid: false, errorMessage: 'GitHub CLI is not installed' };
  }
  if (!ghAuthenticated) {
    return { isValid: false, errorMessage: 'Not authenticated with GitHub' };
  }
  if (!title.trim()) {
    return { isValid: false, errorMessage: 'Title is required' };
  }
  return { isValid: true, errorMessage: null };
}

// ============================================================================
// CreatePRDialog Component
// ============================================================================

/**
 * Dialog for creating a GitHub Pull Request.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Accessibility features:
 * - Proper form labeling with htmlFor/id associations
 * - Error messages linked via aria-describedby
 * - Screen reader announcements for state changes
 * - Keyboard shortcut (Cmd+Enter) to submit
 * - Focus management via Dialog molecule
 * - Touch targets ≥44px on mobile (WCAG 2.5.5)
 * - Warning regions for GitHub CLI status
 *
 * @example
 * <CreatePRDialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onCreate={handleCreate}
 *   defaultTitle="Add user authentication"
 *   defaultBase="main"
 *   ghCliInstalled={true}
 *   ghAuthenticated={true}
 * />
 */
export const CreatePRDialog = forwardRef<HTMLDivElement, CreatePRDialogProps>(
  function CreatePRDialog(
    {
      isOpen,
      onClose,
      onCreate,
      defaultTitle = '',
      defaultBody = '',
      defaultBase = '',
      isSubmitting = false,
      error,
      ghCliInstalled = true,
      ghAuthenticated = true,
      size = 'md',
      createAriaLabel,
      cancelAriaLabel,
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) {
    // Generate unique IDs for form fields
    const uniqueId = useId();
    const titleId = `pr-title-${uniqueId}`;
    const bodyId = `pr-body-${uniqueId}`;
    const baseId = `pr-base-${uniqueId}`;
    const draftId = `pr-draft-${uniqueId}`;
    const errorId = `pr-error-${uniqueId}`;
    const baseHelperId = `pr-base-helper-${uniqueId}`;

    // Local form state
    const [title, setTitle] = useState(defaultTitle);
    const [body, setBody] = useState(defaultBody);
    const [base, setBase] = useState(defaultBase);
    const [isDraft, setIsDraft] = useState(false);

    // Reset form when dialog opens
    useEffect(() => {
      if (isOpen) {
        setTitle(defaultTitle);
        setBody(defaultBody);
        setBase(defaultBase);
        setIsDraft(false);
      }
    }, [isOpen, defaultTitle, defaultBody, defaultBase]);

    // Validation
    const showGhWarning = !ghCliInstalled || !ghAuthenticated;
    const validation = getValidationState(title, ghCliInstalled, ghAuthenticated);
    const isValid = validation.isValid;

    // Sizes
    const baseSize = getBaseSize(size);
    const dialogSize = getDialogSize(size);
    const formGapClasses = getResponsiveFormGapClasses(size);
    const labelSize = LABEL_SIZE_MAP[baseSize];

    const handleSubmit = useCallback(() => {
      if (!isValid || isSubmitting) return;

      onCreate({
        title: title.trim(),
        body: body.trim(),
        base: base.trim() || undefined,
        draft: isDraft || undefined,
      });
    }, [isValid, isSubmitting, title, body, base, isDraft, onCreate]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && event.metaKey && isValid && !isSubmitting) {
          event.preventDefault();
          handleSubmit();
        }
      },
      [isValid, isSubmitting, handleSubmit]
    );

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
        {/* Screen reader announcements */}
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite">
            {isOpen && SR_DIALOG_OPENED}
          </Text>
        </VisuallyHidden>

        {isSubmitting && (
          <VisuallyHidden>
            <Text as="span" role="status" aria-live="polite">
              {SR_SUBMITTING}
            </Text>
          </VisuallyHidden>
        )}

        {showGhWarning && (
          <VisuallyHidden>
            <Text as="span" role="alert" aria-live="assertive">
              {buildGhWarningAnnouncement(ghCliInstalled, ghAuthenticated)}
            </Text>
          </VisuallyHidden>
        )}

        <DialogContent data-testid={dataTestId ? `${dataTestId}-content` : undefined}>
          <Box className={formGapClasses} onKeyDown={handleKeyDown}>
            {/* GitHub CLI warning */}
            {showGhWarning && (
              <Box
                className={cn(...WARNING_CONTAINER_CLASSES, WARNING_BORDER_CLASSES.warning)}
                role="alert"
                data-testid={dataTestId ? `${dataTestId}-gh-warning` : undefined}
              >
                <Icon
                  icon={AlertCircle}
                  size="sm"
                  className="mt-0.5 shrink-0 text-[rgb(var(--warning))]"
                  aria-hidden="true"
                />
                <Box className="text-sm">
                  {!ghCliInstalled ? (
                    <>
                      <Text weight="medium" color="warning" as="p">
                        {GH_NOT_INSTALLED_TITLE}
                      </Text>
                      <Text color="muted-foreground" as="p" className="mt-1">
                        Install the GitHub CLI to create pull requests:{' '}
                        <Box as="code" className="rounded bg-[rgb(var(--muted))] px-1 py-0.5">
                          brew install gh
                        </Box>
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text weight="medium" color="warning" as="p">
                        {GH_NOT_AUTHENTICATED_TITLE}
                      </Text>
                      <Text color="muted-foreground" as="p" className="mt-1">
                        Run{' '}
                        <Box as="code" className="rounded bg-[rgb(var(--muted))] px-1 py-0.5">
                          gh auth login
                        </Box>{' '}
                        to authenticate.
                      </Text>
                    </>
                  )}
                </Box>
              </Box>
            )}

            {/* PR Icon and info */}
            <Box
              className="flex items-center gap-3 text-[rgb(var(--muted-foreground))]"
              data-testid={dataTestId ? `${dataTestId}-info` : undefined}
            >
              <Box className={cn(...PR_ICON_CONTAINER_CLASSES)} aria-hidden={true}>
                <Icon icon={GitPullRequest} size="md" className="text-[rgb(var(--primary))]" />
              </Box>
              <Text size="sm" color="muted-foreground" as="p">
                {PR_INFO_TEXT}
              </Text>
            </Box>

            {/* Title input (required) */}
            <Box
              className={cn(...FORM_FIELD_CONTAINER_CLASSES)}
              data-testid={dataTestId ? `${dataTestId}-title-field` : undefined}
            >
              <Label
                htmlFor={titleId}
                required
                size={labelSize}
                disabled={isSubmitting || showGhWarning}
              >
                Title
              </Label>
              <Input
                id={titleId}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={DEFAULT_TITLE_PLACEHOLDER}
                disabled={isSubmitting || showGhWarning}
                error={!title.trim() && title.length > 0}
                aria-required="true"
                aria-describedby={error ? errorId : undefined}
                maxLength={MAX_TITLE_LENGTH}
                data-testid={dataTestId ? `${dataTestId}-title-input` : undefined}
              />
            </Box>

            {/* Body textarea */}
            <Box
              className={cn(...FORM_FIELD_CONTAINER_CLASSES)}
              data-testid={dataTestId ? `${dataTestId}-body-field` : undefined}
            >
              <Label htmlFor={bodyId} size={labelSize} disabled={isSubmitting || showGhWarning}>
                Description
                <Text
                  as="span"
                  className="ml-1 text-xs font-normal text-[rgb(var(--muted-foreground))]"
                >
                  (optional)
                </Text>
              </Label>
              <Textarea
                id={bodyId}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={DEFAULT_BODY_PLACEHOLDER}
                disabled={isSubmitting || showGhWarning}
                rows={6}
                resize="vertical"
                data-testid={dataTestId ? `${dataTestId}-body-input` : undefined}
              />
            </Box>

            {/* Base branch input */}
            <Box
              className={cn(...FORM_FIELD_CONTAINER_CLASSES)}
              data-testid={dataTestId ? `${dataTestId}-base-field` : undefined}
            >
              <Label htmlFor={baseId} size={labelSize} disabled={isSubmitting || showGhWarning}>
                Base Branch
                <Text
                  as="span"
                  className="ml-1 text-xs font-normal text-[rgb(var(--muted-foreground))]"
                >
                  (optional)
                </Text>
              </Label>
              <Input
                id={baseId}
                type="text"
                value={base}
                onChange={(e) => setBase(e.target.value)}
                placeholder={DEFAULT_BASE_PLACEHOLDER}
                disabled={isSubmitting || showGhWarning}
                aria-describedby={baseHelperId}
                data-testid={dataTestId ? `${dataTestId}-base-input` : undefined}
              />
              <Text id={baseHelperId} size="xs" color="muted-foreground" as="p">
                {BASE_BRANCH_HELPER}
              </Text>
            </Box>

            {/* Draft PR toggle - using native checkbox with label */}
            <Box
              className={cn(...DRAFT_CHECKBOX_CONTAINER_CLASSES)}
              data-testid={dataTestId ? `${dataTestId}-draft-field` : undefined}
            >
              <Checkbox
                id={draftId}
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
                disabled={isSubmitting || showGhWarning}
                data-testid={dataTestId ? `${dataTestId}-draft-checkbox` : undefined}
              />
              <Box
                as="label"
                htmlFor={draftId}
                className={cn(
                  'text-sm text-[rgb(var(--foreground))]',
                  (isSubmitting || showGhWarning) && 'cursor-not-allowed opacity-50'
                )}
              >
                {DRAFT_LABEL}
                <Text as="span" className="ml-1 text-xs text-[rgb(var(--muted-foreground))]">
                  {DRAFT_HELPER}
                </Text>
              </Box>
            </Box>

            {/* Error message */}
            {error && (
              <Box
                className={cn(...WARNING_CONTAINER_CLASSES, WARNING_BORDER_CLASSES.error)}
                role="alert"
                aria-live="assertive"
                data-testid={dataTestId ? `${dataTestId}-error` : undefined}
              >
                <Icon
                  icon={AlertCircle}
                  size="sm"
                  className="mt-0.5 shrink-0 text-[rgb(var(--destructive))]"
                  aria-hidden="true"
                />
                <Text id={errorId} size="sm" color="destructive" as="p">
                  {error}
                </Text>
              </Box>
            )}

            {/* Keyboard shortcut hint - only on desktop */}
            <Text
              size="xs"
              color="muted-foreground"
              className="hidden sm:block"
              as="p"
              data-testid={dataTestId ? `${dataTestId}-shortcut-hint` : undefined}
            >
              <Box
                as="kbd"
                className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-[10px]"
              >
                ⌘
              </Box>
              {' + '}
              <Box
                as="kbd"
                className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-[10px]"
              >
                Enter
              </Box>
              {' to submit'}
            </Text>
          </Box>
        </DialogContent>

        <DialogFooter
          className={cn(...FOOTER_LAYOUT_CLASSES)}
          data-testid={dataTestId ? `${dataTestId}-footer` : undefined}
        >
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className={cn(...BUTTON_RESPONSIVE_CLASSES)}
            aria-label={cancelAriaLabel}
            data-testid={dataTestId ? `${dataTestId}-cancel` : undefined}
          >
            {DEFAULT_CANCEL_LABEL}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
            loadingText={DEFAULT_LOADING_TEXT}
            className={cn(...BUTTON_RESPONSIVE_CLASSES)}
            aria-label={createAriaLabel}
            data-testid={dataTestId ? `${dataTestId}-submit` : undefined}
          >
            <Icon icon={GitPullRequest} size="sm" className="mr-2" aria-hidden="true" />
            {DEFAULT_CREATE_LABEL}
          </Button>
        </DialogFooter>
      </Dialog>
    );
  }
);

CreatePRDialog.displayName = 'CreatePRDialog';
