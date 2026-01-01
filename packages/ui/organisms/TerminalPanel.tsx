/**
 * TerminalPanel - Interactive terminal panel with process integration
 *
 * This component wraps the Terminal component and provides integration
 * with process input/output. It's designed to be used in the dashboard
 * as a slide-up panel or modal.
 *
 * The component is stateless - all process communication is handled
 * via callbacks, following the OpenFlow architecture pattern.
 *
 * Accessibility Features:
 * - role="dialog" for panel semantics
 * - aria-modal="true" when open
 * - aria-labelledby for title association
 * - aria-describedby for description
 * - Focus trap within panel
 * - Escape key closes (configurable)
 * - Screen reader announcements via VisuallyHidden
 * - Touch targets ≥44px (WCAG 2.5.5)
 * - motion-safe: prefix for reduced motion support
 */

import type { ResponsiveValue } from '@openflow/primitives';
import { Box, Heading, Paragraph, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import {
  type HTMLAttributes,
  type KeyboardEvent,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { Spinner } from '../atoms/Spinner';
import { Terminal, type TerminalHandle } from './Terminal';

// ============================================================================
// Types
// ============================================================================

export type TerminalPanelSize = 'sm' | 'md' | 'lg';
export type TerminalPanelBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface TerminalPanelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onInput'> {
  /** Whether the terminal panel is open */
  isOpen: boolean;
  /** Callback when the terminal should be closed */
  onClose: () => void;
  /** Process ID for the terminal session */
  processId: string | null;
  /** Raw output to write to the terminal */
  rawOutput: string;
  /** Callback when user types input in the terminal */
  onInput: (data: string) => void;
  /** Callback when terminal is resized (cols, rows) */
  onResize?: (cols: number, rows: number) => void;
  /** Whether the process is currently running */
  isRunning?: boolean;
  /** Whether the terminal is loading */
  isLoading?: boolean;
  /** Whether there was an error */
  hasError?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Callback to retry after error */
  onRetry?: () => void;
  /** Color mode for the terminal */
  colorMode?: 'dark' | 'light';
  /** Title for the terminal panel */
  title?: string;
  /** Description for accessibility */
  description?: string;
  /** Panel size for responsive layouts */
  size?: ResponsiveValue<TerminalPanelSize>;
  /** Whether to close on Escape key */
  closeOnEscape?: boolean;
  /** Custom close button label for accessibility */
  closeLabel?: string;
  /** Custom label for loading state */
  loadingLabel?: string;
  /** Custom label for running status */
  runningLabel?: string;
  /** Custom label for stopped status */
  stoppedLabel?: string;
  /** Custom label for no session state */
  noSessionLabel?: string;
  /** data-testid attribute for testing */
  'data-testid'?: string;
}

export interface TerminalPanelSkeletonProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Panel size for responsive layouts */
  size?: ResponsiveValue<TerminalPanelSize>;
  /** Number of skeleton lines to show */
  lines?: number;
  /** data-testid attribute for testing */
  'data-testid'?: string;
}

export interface TerminalPanelErrorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
  /** Panel size for responsive layouts */
  size?: ResponsiveValue<TerminalPanelSize>;
  /** Error title */
  title?: string;
  /** Error message */
  message?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Custom retry button label */
  retryLabel?: string;
  /** data-testid attribute for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

// Default labels
export const DEFAULT_PANEL_TITLE = 'Terminal';
export const DEFAULT_PANEL_DESCRIPTION = 'Interactive terminal panel for process output';
export const DEFAULT_CLOSE_LABEL = 'Close terminal panel';
export const DEFAULT_LOADING_LABEL = 'Starting terminal...';
export const DEFAULT_RUNNING_LABEL = 'Running';
export const DEFAULT_STOPPED_LABEL = 'Stopped';
export const DEFAULT_NO_SESSION_LABEL = 'No terminal session active';

// Error defaults
export const DEFAULT_ERROR_TITLE = 'Terminal Error';
export const DEFAULT_ERROR_MESSAGE = 'Failed to connect to terminal. Please try again.';
export const DEFAULT_RETRY_LABEL = 'Retry';

// Screen reader announcements
export const SR_PANEL_OPENED = 'Terminal panel opened';
export const SR_PANEL_CLOSED = 'Terminal panel closed';
export const SR_PROCESS_RUNNING = 'Process is running';
export const SR_PROCESS_STOPPED = 'Process has stopped';
export const SR_LOADING = 'Terminal is loading';
export const SR_NO_SESSION = 'No active terminal session';
export const SR_ERROR_OCCURRED = 'Terminal error occurred';

// CSS class constants
export const TERMINAL_PANEL_BASE_CLASSES = [
  'fixed',
  'inset-x-0',
  'bottom-0',
  'z-50',
  'flex',
  'flex-col',
  'bg-[hsl(var(--background))]',
  'border-t',
  'border-[hsl(var(--border))]',
  'shadow-lg',
].join(' ');

export const TERMINAL_PANEL_ANIMATION_CLASSES = [
  'motion-safe:animate-in',
  'motion-safe:slide-in-from-bottom',
  'motion-safe:duration-200',
].join(' ');

export const TERMINAL_PANEL_HEIGHT_CLASSES: Record<TerminalPanelSize, string> = {
  sm: 'h-64',
  md: 'h-80',
  lg: 'h-96',
};

export const TERMINAL_PANEL_HEADER_CLASSES = [
  'flex',
  'h-10',
  'items-center',
  'justify-between',
  'border-b',
  'border-[hsl(var(--border))]',
  'bg-[hsl(var(--muted))]',
  'px-4',
].join(' ');

export const TERMINAL_PANEL_HEADER_TITLE_CLASSES = ['font-medium', 'text-sm'].join(' ');

export const TERMINAL_PANEL_STATUS_CLASSES = [
  'text-xs',
  'text-[hsl(var(--muted-foreground))]',
].join(' ');

export const TERMINAL_PANEL_STATUS_RUNNING_CLASSES = ['text-[hsl(var(--success))]'].join(' ');

export const TERMINAL_PANEL_CLOSE_BUTTON_CLASSES = [
  'h-8',
  'w-8',
  'p-0',
  'min-h-[44px]',
  'min-w-[44px]',
  'sm:min-h-0',
  'sm:min-w-0',
  'sm:h-6',
  'sm:w-6',
].join(' ');

export const TERMINAL_PANEL_CONTENT_CLASSES = ['flex-1', 'overflow-hidden'].join(' ');

export const TERMINAL_PANEL_LOADING_CLASSES = [
  'flex',
  'h-full',
  'items-center',
  'justify-center',
].join(' ');

export const TERMINAL_PANEL_LOADING_CONTAINER_CLASSES = [
  'flex',
  'flex-col',
  'items-center',
  'gap-2',
].join(' ');

export const TERMINAL_PANEL_LOADING_TEXT_CLASSES = [
  'text-sm',
  'text-[hsl(var(--muted-foreground))]',
].join(' ');

export const TERMINAL_PANEL_NO_SESSION_CLASSES = [
  'flex',
  'h-full',
  'items-center',
  'justify-center',
].join(' ');

export const TERMINAL_PANEL_NO_SESSION_TEXT_CLASSES = [
  'text-sm',
  'text-[hsl(var(--muted-foreground))]',
].join(' ');

// Skeleton classes
export const TERMINAL_PANEL_SKELETON_BASE_CLASSES = [
  'fixed',
  'inset-x-0',
  'bottom-0',
  'z-50',
  'flex',
  'flex-col',
  'bg-[hsl(var(--background))]',
  'border-t',
  'border-[hsl(var(--border))]',
  'shadow-lg',
].join(' ');

export const TERMINAL_PANEL_SKELETON_HEADER_CLASSES = [
  'flex',
  'h-10',
  'items-center',
  'justify-between',
  'border-b',
  'border-[hsl(var(--border))]',
  'bg-[hsl(var(--muted))]',
  'px-4',
].join(' ');

export const TERMINAL_PANEL_SKELETON_CONTENT_CLASSES = ['flex-1', 'p-4', 'space-y-2'].join(' ');

export const TERMINAL_PANEL_SKELETON_LINE_WIDTHS = ['60%', '75%', '50%', '80%', '45%'];

// Error classes
export const TERMINAL_PANEL_ERROR_BASE_CLASSES = [
  'flex',
  'h-full',
  'flex-col',
  'items-center',
  'justify-center',
  'gap-4',
  'p-4',
].join(' ');

export const TERMINAL_PANEL_ERROR_ICON_CLASSES = [
  'h-12',
  'w-12',
  'text-[hsl(var(--destructive))]',
].join(' ');

export const TERMINAL_PANEL_ERROR_TITLE_CLASSES = [
  'text-lg',
  'font-semibold',
  'text-[hsl(var(--foreground))]',
].join(' ');

export const TERMINAL_PANEL_ERROR_MESSAGE_CLASSES = [
  'text-sm',
  'text-[hsl(var(--muted-foreground))]',
  'text-center',
  'max-w-md',
].join(' ');

export const TERMINAL_PANEL_ERROR_BUTTON_CLASSES = [
  'min-h-[44px]',
  'min-w-[44px]',
  'sm:min-h-0',
  'sm:min-w-0',
].join(' ');

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get base size from a potentially responsive size value.
 */
export function getBaseSize(
  size: ResponsiveValue<TerminalPanelSize> | undefined
): TerminalPanelSize {
  if (!size) return 'md';
  if (typeof size === 'string') return size;
  return size.base ?? 'md';
}

/**
 * Generate responsive size classes from a size prop.
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<TerminalPanelSize> | undefined,
  classMap: Record<TerminalPanelSize, string>
): string {
  if (!size) return classMap.md;

  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointOrder: TerminalPanelBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

  for (const breakpoint of breakpointOrder) {
    const sizeValue = size[breakpoint];
    if (sizeValue) {
      const sizeClass = classMap[sizeValue];
      if (breakpoint === 'base') {
        classes.push(sizeClass);
      } else {
        classes.push(`${breakpoint}:${sizeClass}`);
      }
    }
  }

  return classes.join(' ');
}

/**
 * Build accessible label for the terminal panel.
 */
export function buildPanelAccessibleLabel(
  title: string,
  processId: string | null,
  isRunning: boolean
): string {
  const parts = [title];
  if (processId) {
    parts.push(`Process: ${processId}`);
    parts.push(isRunning ? 'Running' : 'Stopped');
  } else {
    parts.push('No active session');
  }
  return parts.join('. ');
}

/**
 * Build status announcement for screen readers.
 */
export function buildStatusAnnouncement(
  isRunning: boolean,
  isLoading: boolean,
  hasError: boolean,
  processId: string | null
): string {
  if (hasError) return SR_ERROR_OCCURRED;
  if (isLoading) return SR_LOADING;
  if (!processId) return SR_NO_SESSION;
  return isRunning ? SR_PROCESS_RUNNING : SR_PROCESS_STOPPED;
}

/**
 * Get status indicator text and classes.
 */
export function getStatusDisplay(
  isRunning: boolean,
  runningLabel: string,
  stoppedLabel: string
): { text: string; indicator: string; classes: string } {
  if (isRunning) {
    return {
      text: runningLabel,
      indicator: '●',
      classes: cn(TERMINAL_PANEL_STATUS_CLASSES, TERMINAL_PANEL_STATUS_RUNNING_CLASSES),
    };
  }
  return {
    text: stoppedLabel,
    indicator: '○',
    classes: TERMINAL_PANEL_STATUS_CLASSES,
  };
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Skeleton loading state for TerminalPanel.
 */
export const TerminalPanelSkeleton = forwardRef<HTMLDivElement, TerminalPanelSkeletonProps>(
  function TerminalPanelSkeleton(
    { size = 'md', lines = 5, className, 'data-testid': testId, ...props },
    ref
  ) {
    const heightClasses = getResponsiveSizeClasses(size, TERMINAL_PANEL_HEIGHT_CLASSES);

    return (
      <Box
        ref={ref}
        role="presentation"
        aria-hidden={true}
        className={cn(TERMINAL_PANEL_SKELETON_BASE_CLASSES, heightClasses, className)}
        data-testid={testId}
        data-lines={lines}
        data-size={getBaseSize(size)}
        {...props}
      >
        {/* Header skeleton */}
        <Box className={TERMINAL_PANEL_SKELETON_HEADER_CLASSES}>
          <Box className="flex items-center gap-2">
            <Skeleton variant="text" width={80} height={16} />
            <Skeleton variant="text" width={60} height={12} />
          </Box>
          <Skeleton variant="circular" width={24} height={24} />
        </Box>

        {/* Content skeleton */}
        <Box className={TERMINAL_PANEL_SKELETON_CONTENT_CLASSES}>
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              variant="text"
              width={
                TERMINAL_PANEL_SKELETON_LINE_WIDTHS[
                  index % TERMINAL_PANEL_SKELETON_LINE_WIDTHS.length
                ]
              }
              height={14}
            />
          ))}
        </Box>
      </Box>
    );
  }
);

TerminalPanelSkeleton.displayName = 'TerminalPanelSkeleton';

/**
 * Error state for TerminalPanel.
 */
export const TerminalPanelError = forwardRef<HTMLDivElement, TerminalPanelErrorProps>(
  function TerminalPanelError(
    {
      size = 'md',
      title = DEFAULT_ERROR_TITLE,
      message = DEFAULT_ERROR_MESSAGE,
      onRetry,
      retryLabel = DEFAULT_RETRY_LABEL,
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    const errorId = useId();
    const descriptionId = useId();
    const heightClasses = getResponsiveSizeClasses(size, TERMINAL_PANEL_HEIGHT_CLASSES);

    return (
      <Box
        ref={ref}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        aria-labelledby={errorId}
        aria-describedby={descriptionId}
        className={cn(TERMINAL_PANEL_SKELETON_BASE_CLASSES, heightClasses, className)}
        data-testid={testId}
        data-size={getBaseSize(size)}
        {...props}
      >
        <Box className={TERMINAL_PANEL_ERROR_BASE_CLASSES}>
          <Icon
            icon={AlertTriangle}
            aria-hidden="true"
            className={TERMINAL_PANEL_ERROR_ICON_CLASSES}
          />
          <Heading level={3} id={errorId} className={TERMINAL_PANEL_ERROR_TITLE_CLASSES}>
            {title}
          </Heading>
          <Paragraph id={descriptionId} className={TERMINAL_PANEL_ERROR_MESSAGE_CLASSES}>
            {message}
          </Paragraph>
          {onRetry && (
            <Button
              variant="primary"
              onClick={onRetry}
              className={TERMINAL_PANEL_ERROR_BUTTON_CLASSES}
            >
              <Icon icon={RefreshCw} size="sm" aria-hidden="true" className="mr-2" />
              {retryLabel}
            </Button>
          )}
        </Box>
      </Box>
    );
  }
);

TerminalPanelError.displayName = 'TerminalPanelError';

// ============================================================================
// Main Component
// ============================================================================

/**
 * TerminalPanel - A slide-up terminal panel for the dashboard.
 *
 * Features:
 * - xterm.js terminal emulation
 * - Process output streaming
 * - User input forwarding
 * - Resize handling
 * - Loading, error, and closed states
 * - Full accessibility support
 * - Responsive sizing
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { rawOutput } = useProcessOutput(processId);
 *   const sendInput = useSendProcessInput();
 *
 *   return (
 *     <TerminalPanel
 *       isOpen={terminalOpen}
 *       onClose={() => setTerminalOpen(false)}
 *       processId={processId}
 *       rawOutput={rawOutput}
 *       onInput={(data) => sendInput.mutate({ processId, input: data })}
 *       onResize={(cols, rows) => resizeTerminal({ processId, cols, rows })}
 *     />
 *   );
 * }
 * ```
 */
export const TerminalPanel = forwardRef<HTMLDivElement, TerminalPanelProps>(function TerminalPanel(
  {
    isOpen,
    onClose,
    processId,
    rawOutput,
    onInput,
    onResize,
    isRunning = true,
    isLoading = false,
    hasError = false,
    errorMessage,
    onRetry,
    colorMode = 'dark',
    title = DEFAULT_PANEL_TITLE,
    description = DEFAULT_PANEL_DESCRIPTION,
    size = 'md',
    closeOnEscape = true,
    closeLabel = DEFAULT_CLOSE_LABEL,
    loadingLabel = DEFAULT_LOADING_LABEL,
    runningLabel = DEFAULT_RUNNING_LABEL,
    stoppedLabel = DEFAULT_STOPPED_LABEL,
    noSessionLabel = DEFAULT_NO_SESSION_LABEL,
    className,
    'data-testid': testId,
    ...props
  },
  ref
) {
  const panelRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<TerminalHandle>(null);
  const lastOutputLengthRef = useRef(0);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // IDs for accessibility
  const titleId = useId();
  const descriptionId = useId();

  // Screen reader announcement state
  const [announcement, setAnnouncement] = useState('');

  // Height classes based on size
  const heightClasses = getResponsiveSizeClasses(size, TERMINAL_PANEL_HEIGHT_CLASSES);

  // Status display
  const statusDisplay = getStatusDisplay(isRunning, runningLabel, stoppedLabel);

  // Handle terminal ready
  const handleReady = useCallback(() => {
    if (terminalRef.current && rawOutput) {
      terminalRef.current.write(rawOutput);
      lastOutputLengthRef.current = rawOutput.length;
    }
  }, [rawOutput]);

  // Write new output to terminal when rawOutput changes
  useEffect(() => {
    if (!terminalRef.current) return;

    const newContent = rawOutput.slice(lastOutputLengthRef.current);
    if (newContent) {
      terminalRef.current.write(newContent);
      lastOutputLengthRef.current = rawOutput.length;
    }
  }, [rawOutput]);

  // Reset output tracking when process changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: processId is intentionally used to reset tracking on process change
  useEffect(() => {
    lastOutputLengthRef.current = 0;
    if (terminalRef.current) {
      terminalRef.current.clear();
    }
  }, [processId]);

  // Handle panel open/close for focus management
  useEffect(() => {
    if (isOpen) {
      // Store previous focus
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      // Announce panel opened
      setAnnouncement(SR_PANEL_OPENED);
      // Focus panel after render
      requestAnimationFrame(() => {
        panelRef.current?.focus();
      });
    } else {
      // Restore focus on close
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
        previousActiveElementRef.current = null;
      }
      // Announce panel closed
      setAnnouncement(SR_PANEL_CLOSED);
    }
  }, [isOpen]);

  // Announce status changes
  useEffect(() => {
    if (isOpen) {
      const statusAnnouncement = buildStatusAnnouncement(isRunning, isLoading, hasError, processId);
      setAnnouncement(statusAnnouncement);
    }
  }, [isOpen, isRunning, isLoading, hasError, processId]);

  // Handle escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (closeOnEscape && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  if (!isOpen) {
    return null;
  }

  // Build accessible label
  const accessibleLabel = buildPanelAccessibleLabel(title, processId, isRunning);

  return (
    <Box
      ref={(node) => {
        // Handle both refs
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        (panelRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-label={accessibleLabel}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={cn(
        TERMINAL_PANEL_BASE_CLASSES,
        heightClasses,
        TERMINAL_PANEL_ANIMATION_CLASSES,
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2',
        className
      )}
      data-testid={testId}
      data-state={isOpen ? 'open' : 'closed'}
      data-size={getBaseSize(size)}
      data-process-id={processId ?? undefined}
      data-running={isRunning}
      data-loading={isLoading}
      data-error={hasError}
      {...props}
    >
      {/* Screen reader announcements */}
      <VisuallyHidden>
        <Text as="span" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </Text>
        <Text as="span" id={descriptionId}>
          {description}
        </Text>
      </VisuallyHidden>

      {/* Header */}
      <Box className={TERMINAL_PANEL_HEADER_CLASSES}>
        <Box className="flex items-center gap-2">
          <Text as="span" id={titleId} className={TERMINAL_PANEL_HEADER_TITLE_CLASSES}>
            {title}
          </Text>
          {processId && (
            <Text as="span" className={statusDisplay.classes} aria-label={statusDisplay.text}>
              {statusDisplay.indicator} {statusDisplay.text}
            </Text>
          )}
        </Box>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className={TERMINAL_PANEL_CLOSE_BUTTON_CLASSES}
          aria-label={closeLabel}
        >
          <Icon icon={X} size="sm" aria-hidden="true" />
        </Button>
      </Box>

      {/* Terminal content */}
      <Box className={TERMINAL_PANEL_CONTENT_CLASSES}>
        {hasError ? (
          <Box className={TERMINAL_PANEL_ERROR_BASE_CLASSES}>
            <Icon
              icon={AlertTriangle}
              aria-hidden="true"
              className={TERMINAL_PANEL_ERROR_ICON_CLASSES}
            />
            <Heading level={3} className={TERMINAL_PANEL_ERROR_TITLE_CLASSES}>
              {DEFAULT_ERROR_TITLE}
            </Heading>
            <Paragraph className={TERMINAL_PANEL_ERROR_MESSAGE_CLASSES}>
              {errorMessage ?? DEFAULT_ERROR_MESSAGE}
            </Paragraph>
            {onRetry && (
              <Button
                variant="primary"
                onClick={onRetry}
                className={TERMINAL_PANEL_ERROR_BUTTON_CLASSES}
              >
                <Icon icon={RefreshCw} size="sm" aria-hidden="true" className="mr-2" />
                {DEFAULT_RETRY_LABEL}
              </Button>
            )}
          </Box>
        ) : isLoading ? (
          <Box className={TERMINAL_PANEL_LOADING_CLASSES} role="status" aria-busy={true}>
            <Box className={TERMINAL_PANEL_LOADING_CONTAINER_CLASSES}>
              <Spinner size="md" label={loadingLabel} />
              <Text as="span" className={TERMINAL_PANEL_LOADING_TEXT_CLASSES}>
                {loadingLabel}
              </Text>
            </Box>
          </Box>
        ) : processId ? (
          <Terminal
            ref={terminalRef}
            id={`terminal-${processId}`}
            onInput={onInput}
            onResize={onResize}
            onReady={handleReady}
            colorMode={colorMode}
            autoFocus
            fontSize={13}
            scrollback={10000}
            cursorBlink
          />
        ) : (
          <Box className={TERMINAL_PANEL_NO_SESSION_CLASSES} role="status">
            <Text as="span" className={TERMINAL_PANEL_NO_SESSION_TEXT_CLASSES}>
              {noSessionLabel}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
});

TerminalPanel.displayName = 'TerminalPanel';
