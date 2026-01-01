import { type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertTriangle, FileText, Shield, Terminal, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { type HTMLAttributes, forwardRef, useCallback, useEffect, useId, useRef } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

// ============================================================================
// Types
// ============================================================================

export type PermissionDialogSize = 'sm' | 'md' | 'lg';
export type PermissionDialogBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface PermissionRequest {
  /** Unique identifier for the process requesting permission */
  processId: string;
  /** Name of the tool requesting permission */
  toolName: string;
  /** Optional file path being accessed */
  filePath?: string;
  /** Description of the permission request */
  description: string;
}

export interface PermissionDialogProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'title'> {
  /** The permission request to display */
  request: PermissionRequest;
  /** Called when user approves the permission */
  onApprove: () => void;
  /** Called when user denies the permission */
  onDeny: () => void;
  /** Whether the approve action is in progress */
  approving?: boolean;
  /** Whether the deny action is in progress */
  denying?: boolean;
  /** Responsive size of the dialog */
  size?: ResponsiveValue<PermissionDialogSize>;
  /** Accessible label for approve button */
  approveLabel?: string;
  /** Accessible label for deny button */
  denyLabel?: string;
  /** Accessible label for close button */
  closeLabel?: string;
  /** Whether pressing Escape closes/denies the dialog */
  closeOnEscape?: boolean;
  /** Whether clicking the backdrop closes/denies the dialog */
  closeOnBackdropClick?: boolean;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: readonly PermissionDialogBreakpoint[] = [
  'base',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
];

/**
 * Default label for approve button
 */
export const DEFAULT_APPROVE_LABEL = 'Allow';

/**
 * Default label for deny button
 */
export const DEFAULT_DENY_LABEL = 'Deny';

/**
 * Default label for close button (screen reader)
 */
export const DEFAULT_CLOSE_LABEL = 'Close and deny permission';

/**
 * Screen reader announcement when dialog opens
 */
export const SR_DIALOG_OPENED = 'Permission request dialog opened.';

/**
 * Screen reader announcement template for permission details
 */
export const SR_PERMISSION_REQUEST = 'Claude is requesting permission to';

/**
 * Screen reader announcement for approving
 */
export const SR_APPROVING = 'Approving permission, please wait...';

/**
 * Screen reader announcement for denying
 */
export const SR_DENYING = 'Denying permission, please wait...';

/**
 * Screen reader warning prefix for security-sensitive actions
 */
export const SR_SECURITY_WARNING = 'Security warning:';

/**
 * Tool type configuration
 */
export const TOOL_CONFIG: Record<
  string,
  {
    icon: LucideIcon;
    action: string;
    srPrefix?: string;
  }
> = {
  write: {
    icon: FileText,
    action: 'write to',
    srPrefix: 'File write permission:',
  },
  read: {
    icon: FileText,
    action: 'read from',
    srPrefix: 'File read permission:',
  },
  bash: {
    icon: Terminal,
    action: 'execute command in',
    srPrefix: 'Command execution permission:',
  },
};

/**
 * Default tool configuration for unknown tools
 */
export const DEFAULT_TOOL_CONFIG = {
  icon: Shield,
  action: 'access',
  srPrefix: 'Permission required:',
};

/**
 * Size classes for dialog widths
 */
export const PERMISSION_DIALOG_SIZE_CLASSES: Record<PermissionDialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

/**
 * Base classes for dialog container
 */
export const PERMISSION_DIALOG_CONTAINER_CLASSES =
  'fixed inset-0 z-50 flex items-center justify-center';

/**
 * Base classes for dialog backdrop
 */
export const PERMISSION_DIALOG_BACKDROP_CLASSES = [
  'fixed inset-0 motion-safe:transition-opacity',
  'bg-black/60',
  '[@media(prefers-reduced-transparency:reduce)]:bg-black/80',
].join(' ');

/**
 * Base classes for dialog panel
 */
export const PERMISSION_DIALOG_PANEL_CLASSES = [
  'relative z-50 w-full mx-4',
  'rounded-lg border border-[rgb(var(--border))]',
  'bg-[rgb(var(--card))] shadow-xl',
  'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95',
  'focus:outline-none',
].join(' ');

/**
 * Header container classes
 */
export const PERMISSION_DIALOG_HEADER_CLASSES =
  'flex items-center gap-3 border-b border-[rgb(var(--border))] px-4 py-3';

/**
 * Warning icon container classes
 */
export const PERMISSION_DIALOG_WARNING_ICON_CLASSES =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/20';

/**
 * Content container classes
 */
export const PERMISSION_DIALOG_CONTENT_CLASSES = 'p-4';

/**
 * Tool icon container classes
 */
export const PERMISSION_DIALOG_TOOL_ICON_CLASSES =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[rgb(var(--muted))]';

/**
 * File path code block classes
 */
export const PERMISSION_DIALOG_FILEPATH_CLASSES =
  'mt-1 block rounded bg-[rgb(var(--muted))] px-2 py-1 text-xs text-[rgb(var(--muted-foreground))] break-all';

/**
 * Footer container classes
 */
export const PERMISSION_DIALOG_FOOTER_CLASSES =
  'flex flex-col gap-2 border-t border-[rgb(var(--border))] px-4 py-3 sm:flex-row';

/**
 * Button responsive classes
 */
export const PERMISSION_DIALOG_BUTTON_CLASSES = 'w-full sm:w-auto sm:flex-1';

/**
 * Close button classes with touch target compliance
 */
export const PERMISSION_DIALOG_CLOSE_BUTTON_CLASSES = 'h-11 w-11 min-h-[44px] min-w-[44px] p-0';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size from a responsive value
 */
export function getBaseSize(
  size: ResponsiveValue<PermissionDialogSize> | undefined
): PermissionDialogSize {
  if (size === undefined) {
    return 'md';
  }

  if (typeof size === 'string') {
    return size;
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<Record<PermissionDialogBreakpoint, PermissionDialogSize>>;
    return sizeObj.base ?? 'md';
  }

  return 'md';
}

/**
 * Generate responsive size classes from PermissionDialogSize value
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<PermissionDialogSize> | undefined
): string {
  if (size === undefined) {
    return PERMISSION_DIALOG_SIZE_CLASSES.md;
  }

  if (typeof size === 'string') {
    return PERMISSION_DIALOG_SIZE_CLASSES[size];
  }

  if (typeof size === 'object' && size !== null) {
    const classes: string[] = [];
    const sizeObj = size as Partial<Record<PermissionDialogBreakpoint, PermissionDialogSize>>;

    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = sizeObj[breakpoint];
      if (breakpointValue !== undefined) {
        const sizeClass = PERMISSION_DIALOG_SIZE_CLASSES[breakpointValue];
        // Extract the max-w value
        const maxWMatch = sizeClass.match(/max-w-(\w+)/);
        if (maxWMatch) {
          if (breakpoint === 'base') {
            classes.push(`max-w-${maxWMatch[1]}`);
          } else {
            classes.push(`${breakpoint}:max-w-${maxWMatch[1]}`);
          }
        }
      }
    }
    return classes.join(' ') || PERMISSION_DIALOG_SIZE_CLASSES.md;
  }

  return PERMISSION_DIALOG_SIZE_CLASSES.md;
}

/**
 * Get the tool icon for a given tool name
 */
export function getToolIcon(toolName: string): LucideIcon {
  const config = TOOL_CONFIG[toolName.toLowerCase()];
  return config?.icon ?? DEFAULT_TOOL_CONFIG.icon;
}

/**
 * Get human-readable action description for a tool
 */
export function getActionDescription(toolName: string): string {
  const config = TOOL_CONFIG[toolName.toLowerCase()];
  return config?.action ?? DEFAULT_TOOL_CONFIG.action;
}

/**
 * Build accessible label for the permission request
 */
export function buildAccessibleLabel(request: PermissionRequest): string {
  const config = TOOL_CONFIG[request.toolName.toLowerCase()] ?? DEFAULT_TOOL_CONFIG;
  const parts: string[] = [];

  if (config.srPrefix) {
    parts.push(config.srPrefix);
  }
  parts.push(`Claude wants to ${config.action}`);

  if (request.filePath) {
    parts.push(request.filePath);
  }

  parts.push(request.description);

  return parts.join(' ');
}

/**
 * Build screen reader announcement for dialog state
 */
export function buildDialogAnnouncement(
  request: PermissionRequest,
  approving: boolean,
  denying: boolean
): string {
  if (approving) {
    return SR_APPROVING;
  }

  if (denying) {
    return SR_DENYING;
  }

  return `${SR_DIALOG_OPENED} ${buildAccessibleLabel(request)}`;
}

/**
 * Get focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
    (el) => el.offsetParent !== null
  );
}

// ============================================================================
// PermissionDialog Component
// ============================================================================

/**
 * PermissionDialog component for handling Claude Code permission requests.
 * Shows a modal dialog when Claude needs permission to perform an action.
 *
 * Accessibility features:
 * - Focus trapped within dialog
 * - Focus returns to trigger element on close
 * - Escape key closes dialog (configurable)
 * - aria-modal="true" prevents interaction with background content
 * - aria-labelledby points to title
 * - aria-describedby points to description
 * - Screen reader announcements for state changes
 * - Touch targets ≥44px (WCAG 2.5.5)
 * - Clear permission explanation with security context
 *
 * @example
 * ```tsx
 * <PermissionDialog
 *   request={{
 *     processId: "abc123",
 *     toolName: "Write",
 *     filePath: "/path/to/file.txt",
 *     description: "Allow Claude to write to file.txt? (y/n)"
 *   }}
 *   onApprove={() => sendInput(processId, "y\n")}
 *   onDeny={() => sendInput(processId, "n\n")}
 * />
 * ```
 *
 * @example
 * // With loading states
 * <PermissionDialog
 *   request={request}
 *   onApprove={handleApprove}
 *   onDeny={handleDeny}
 *   approving={isApproving}
 *   denying={isDenying}
 * />
 *
 * @example
 * // Responsive sizing
 * <PermissionDialog
 *   request={request}
 *   size={{ base: 'sm', md: 'md', lg: 'lg' }}
 *   onApprove={handleApprove}
 *   onDeny={handleDeny}
 * />
 */
export const PermissionDialog = forwardRef<HTMLDivElement, PermissionDialogProps>(
  function PermissionDialog(
    {
      request,
      onApprove,
      onDeny,
      approving = false,
      denying = false,
      size = 'md',
      approveLabel = DEFAULT_APPROVE_LABEL,
      denyLabel = DEFAULT_DENY_LABEL,
      closeLabel = DEFAULT_CLOSE_LABEL,
      closeOnEscape = true,
      closeOnBackdropClick = true,
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) {
    const internalRef = useRef<HTMLDivElement>(null);
    const dialogRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;
    const previousActiveElement = useRef<HTMLElement | null>(null);
    const id = useId();
    const titleId = `${id}-title`;
    const descriptionId = `${id}-description`;

    const ToolIcon = getToolIcon(request.toolName);
    const actionDesc = getActionDescription(request.toolName);
    const sizeClasses = getResponsiveSizeClasses(size);
    const isLoading = approving || denying;

    // Handle Escape key
    useEffect(() => {
      if (!closeOnEscape || isLoading) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onDeny();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [closeOnEscape, isLoading, onDeny]);

    // Focus trap
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key !== 'Tab') return;

        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusableElements = getFocusableElements(dialog);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      },
      [dialogRef]
    );

    // Focus management on mount
    useEffect(() => {
      previousActiveElement.current = document.activeElement as HTMLElement;

      const timer = setTimeout(() => {
        const dialog = dialogRef.current;
        if (dialog) {
          const focusableElements = getFocusableElements(dialog);
          const firstFocusable = focusableElements[0];
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            dialog.focus();
          }
        }
      }, 0);

      return () => {
        clearTimeout(timer);
        previousActiveElement.current?.focus();
      };
    }, [dialogRef]);

    // Prevent body scroll
    useEffect(() => {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }, []);

    const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdropClick && !isLoading && event.target === event.currentTarget) {
        onDeny();
      }
    };

    return (
      <div
        role="presentation"
        className={PERMISSION_DIALOG_CONTAINER_CLASSES}
        data-testid={dataTestId ? `${dataTestId}-container` : undefined}
      >
        {/* Screen reader announcement */}
        <VisuallyHidden>
          <span role="status" aria-live="assertive" aria-atomic="true">
            {buildDialogAnnouncement(request, approving, denying)}
          </span>
        </VisuallyHidden>

        {/* Backdrop */}
        <div
          className={PERMISSION_DIALOG_BACKDROP_CLASSES}
          aria-hidden="true"
          onClick={handleBackdropClick}
          data-testid={dataTestId ? `${dataTestId}-backdrop` : undefined}
        />

        {/* Dialog panel */}
        <div
          ref={dialogRef}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          data-testid={dataTestId}
          data-tool={request.toolName.toLowerCase()}
          data-approving={approving || undefined}
          data-denying={denying || undefined}
          className={cn(PERMISSION_DIALOG_PANEL_CLASSES, sizeClasses, className)}
          {...props}
        >
          {/* Header */}
          <div
            className={PERMISSION_DIALOG_HEADER_CLASSES}
            data-testid={dataTestId ? `${dataTestId}-header` : undefined}
          >
            <div className={PERMISSION_DIALOG_WARNING_ICON_CLASSES} aria-hidden="true">
              <Icon icon={AlertTriangle} size="md" className="text-warning" />
            </div>
            <div className="flex-1">
              <h2 id={titleId} className="text-sm font-semibold text-[rgb(var(--foreground))]">
                Permission Required
              </h2>
              <Text size="xs" color="muted-foreground">
                Claude is requesting access
              </Text>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeny}
              disabled={isLoading}
              className={PERMISSION_DIALOG_CLOSE_BUTTON_CLASSES}
              aria-label={closeLabel}
              data-testid={dataTestId ? `${dataTestId}-close` : undefined}
            >
              <Icon icon={X} size="sm" />
            </Button>
          </div>

          {/* Content */}
          <div
            id={descriptionId}
            className={PERMISSION_DIALOG_CONTENT_CLASSES}
            data-testid={dataTestId ? `${dataTestId}-content` : undefined}
          >
            <div className="flex items-start gap-3">
              <div className={PERMISSION_DIALOG_TOOL_ICON_CLASSES} aria-hidden="true">
                <Icon icon={ToolIcon} size="sm" className="text-[rgb(var(--primary))]" />
              </div>
              <div className="flex-1">
                <Text size="sm" color="foreground">
                  Claude wants to <span className="font-medium">{actionDesc}</span>
                </Text>
                {request.filePath && (
                  <code className={PERMISSION_DIALOG_FILEPATH_CLASSES}>{request.filePath}</code>
                )}
                <Text as="p" size="xs" color="muted-foreground" className="mt-2">
                  {request.description}
                </Text>
              </div>
            </div>
          </div>

          {/* Footer - Deny first for safety (platform convention) */}
          <div
            className={PERMISSION_DIALOG_FOOTER_CLASSES}
            data-testid={dataTestId ? `${dataTestId}-footer` : undefined}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={onDeny}
              loading={denying}
              disabled={approving}
              className={PERMISSION_DIALOG_BUTTON_CLASSES}
              aria-label={denyLabel}
              data-testid={dataTestId ? `${dataTestId}-deny` : undefined}
            >
              {denyLabel}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onApprove}
              loading={approving}
              disabled={denying}
              className={PERMISSION_DIALOG_BUTTON_CLASSES}
              aria-label={approveLabel}
              data-testid={dataTestId ? `${dataTestId}-approve` : undefined}
            >
              {approveLabel}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

PermissionDialog.displayName = 'PermissionDialog';
