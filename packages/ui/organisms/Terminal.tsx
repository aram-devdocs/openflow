import type { ResponsiveValue } from '@openflow/primitives';
import { VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal as XTerm } from '@xterm/xterm';
import {
  type HTMLAttributes,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import '@xterm/xterm/css/xterm.css';
import { AlertTriangle, RefreshCw, Terminal as TerminalIcon } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';

// ============================================================================
// Types
// ============================================================================

/**
 * Terminal theme configuration.
 */
export interface TerminalTheme {
  background?: string;
  foreground?: string;
  cursor?: string;
  cursorAccent?: string;
  selection?: string;
  black?: string;
  red?: string;
  green?: string;
  yellow?: string;
  blue?: string;
  magenta?: string;
  cyan?: string;
  white?: string;
  brightBlack?: string;
  brightRed?: string;
  brightGreen?: string;
  brightYellow?: string;
  brightBlue?: string;
  brightMagenta?: string;
  brightCyan?: string;
  brightWhite?: string;
}

export type TerminalSize = 'sm' | 'md' | 'lg';
export type TerminalBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default dark theme for the terminal.
 */
export const defaultDarkTheme: TerminalTheme = {
  background: '#1a1a1a',
  foreground: '#e0e0e0',
  cursor: '#e0e0e0',
  cursorAccent: '#1a1a1a',
  selection: 'rgba(255, 255, 255, 0.2)',
  black: '#1a1a1a',
  red: '#ff6b6b',
  green: '#69db7c',
  yellow: '#ffd43b',
  blue: '#74c0fc',
  magenta: '#da77f2',
  cyan: '#66d9e8',
  white: '#e0e0e0',
  brightBlack: '#4a4a4a',
  brightRed: '#ff8787',
  brightGreen: '#8ce99a',
  brightYellow: '#ffe066',
  brightBlue: '#a5d8ff',
  brightMagenta: '#e599f7',
  brightCyan: '#99e9f2',
  brightWhite: '#ffffff',
};

/**
 * Default light theme for the terminal.
 */
export const defaultLightTheme: TerminalTheme = {
  background: '#ffffff',
  foreground: '#1a1a1a',
  cursor: '#1a1a1a',
  cursorAccent: '#ffffff',
  selection: 'rgba(0, 0, 0, 0.1)',
  black: '#1a1a1a',
  red: '#c92a2a',
  green: '#2f9e44',
  yellow: '#e67700',
  blue: '#1971c2',
  magenta: '#9c36b5',
  cyan: '#0c8599',
  white: '#868e96',
  brightBlack: '#495057',
  brightRed: '#e03131',
  brightGreen: '#40c057',
  brightYellow: '#fab005',
  brightBlue: '#339af0',
  brightMagenta: '#be4bdb',
  brightCyan: '#15aabf',
  brightWhite: '#212529',
};

// Default labels for screen readers
export const DEFAULT_TERMINAL_LABEL = 'Terminal';
export const DEFAULT_TERMINAL_DESCRIPTION = 'Interactive terminal emulator';
export const DEFAULT_LOADING_LABEL = 'Terminal is loading';
export const DEFAULT_ERROR_TITLE = 'Terminal Error';
export const DEFAULT_ERROR_DESCRIPTION = 'Failed to initialize terminal. Please try again.';
export const DEFAULT_RETRY_LABEL = 'Retry';
export const DEFAULT_READ_ONLY_LABEL = 'Read-only terminal';
export const DEFAULT_FOCUS_INSTRUCTION = 'Click or press Enter to focus the terminal';

// Screen reader announcements
export const SR_TERMINAL_READY = 'Terminal is ready for input';
export const SR_TERMINAL_FOCUSED = 'Terminal focused';
export const SR_TERMINAL_READ_ONLY = 'This terminal is read-only';
export const SR_TERMINAL_RESIZED = (cols: number, rows: number) =>
  `Terminal resized to ${cols} columns by ${rows} rows`;
export const SR_TERMINAL_LOADING = 'Terminal is loading, please wait';

// CSS class constants
export const TERMINAL_BASE_CLASSES = 'relative overflow-hidden';
export const TERMINAL_CONTAINER_CLASSES = 'h-full w-full';

export const TERMINAL_PADDING_CLASSES: Record<TerminalSize, string> = {
  sm: 'p-1',
  md: 'p-2',
  lg: 'p-3',
};

export const TERMINAL_FONT_SIZES: Record<TerminalSize, number> = {
  sm: 12,
  md: 14,
  lg: 16,
};

// Focus ring classes for accessible focus indication
export const TERMINAL_FOCUS_CLASSES =
  'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background';

// Skeleton classes
export const TERMINAL_SKELETON_BASE_CLASSES =
  'h-full w-full bg-muted rounded-md flex flex-col gap-2 p-4';
export const TERMINAL_SKELETON_LINE_CLASSES =
  'h-4 rounded motion-safe:animate-pulse bg-muted-foreground/20';

// Error state classes
export const TERMINAL_ERROR_BASE_CLASSES =
  'h-full w-full flex flex-col items-center justify-center gap-4 p-6 text-center bg-muted/50 rounded-md';
export const TERMINAL_ERROR_ICON_CLASSES = 'text-destructive';
export const TERMINAL_ERROR_TITLE_CLASSES = 'text-lg font-semibold text-foreground';
export const TERMINAL_ERROR_DESCRIPTION_CLASSES = 'text-sm text-muted-foreground max-w-md';
export const TERMINAL_ERROR_BUTTON_CLASSES = 'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size value from a responsive size value
 */
export function getBaseSize(size: ResponsiveValue<TerminalSize>): TerminalSize {
  if (typeof size === 'string') {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Get responsive CSS classes from a size value
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<TerminalSize>,
  classMap: Record<TerminalSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];

  if (size.base) {
    classes.push(classMap[size.base]);
  }
  if (size.sm) {
    classes.push(...classMap[size.sm].split(' ').map((c) => `sm:${c}`));
  }
  if (size.md) {
    classes.push(...classMap[size.md].split(' ').map((c) => `md:${c}`));
  }
  if (size.lg) {
    classes.push(...classMap[size.lg].split(' ').map((c) => `lg:${c}`));
  }
  if (size.xl) {
    classes.push(...classMap[size.xl].split(' ').map((c) => `xl:${c}`));
  }
  if (size['2xl']) {
    classes.push(...classMap[size['2xl']].split(' ').map((c) => `2xl:${c}`));
  }

  return classes.join(' ');
}

/**
 * Get the font size for a given terminal size
 */
export function getFontSizeForSize(size: ResponsiveValue<TerminalSize>): number {
  const baseSize = getBaseSize(size);
  return TERMINAL_FONT_SIZES[baseSize];
}

/**
 * Build an accessible label for the terminal
 */
export function buildTerminalAccessibleLabel(
  label: string,
  readOnly: boolean,
  isReady: boolean
): string {
  const parts = [label];

  if (readOnly) {
    parts.push('(read-only)');
  }

  if (!isReady) {
    parts.push('- Loading');
  }

  return parts.join(' ');
}

/**
 * Build a resize announcement for screen readers
 */
export function buildResizeAnnouncement(cols: number, rows: number): string {
  return SR_TERMINAL_RESIZED(cols, rows);
}

// ============================================================================
// Component Types
// ============================================================================

export interface TerminalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onInput' | 'onError'> {
  /** Unique identifier for this terminal instance */
  id?: string;
  /** Callback when user types input in the terminal */
  onInput?: (data: string) => void;
  /** Callback when terminal is resized (cols, rows) */
  onResize?: (cols: number, rows: number) => void;
  /** Callback when terminal is ready (initialized) */
  onReady?: (terminal: XTerm) => void;
  /** Callback when terminal encounters an error */
  onError?: (error: Error) => void;
  /** Whether the terminal should be focused on mount */
  autoFocus?: boolean;
  /** Font size in pixels (overrides size-based default) */
  fontSize?: number;
  /** Font family for the terminal */
  fontFamily?: string;
  /** Line height multiplier */
  lineHeight?: number;
  /** Terminal theme colors */
  theme?: TerminalTheme;
  /** Whether to use dark or light mode (overrides theme) */
  colorMode?: 'dark' | 'light';
  /** Whether terminal is read-only (no input) */
  readOnly?: boolean;
  /** Scrollback buffer size (number of lines) */
  scrollback?: number;
  /** Whether to enable cursor blink */
  cursorBlink?: boolean;
  /** Cursor style */
  cursorStyle?: 'block' | 'underline' | 'bar';
  /** Additional CSS classes for the container */
  className?: string;
  /** Accessible label for the terminal */
  'aria-label'?: string;
  /** Accessible description for the terminal */
  'aria-describedby'?: string;
  /** Responsive size variant */
  size?: ResponsiveValue<TerminalSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

export interface TerminalHandle {
  /** Focus the terminal */
  focus: () => void;
  /** Write data to the terminal */
  write: (data: string) => void;
  /** Clear the terminal */
  clear: () => void;
  /** Get the xterm instance (for advanced use) */
  getTerminal: () => XTerm | null;
  /** Fit the terminal to its container */
  fit: () => void;
}

export interface TerminalSkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Number of skeleton lines to show */
  lineCount?: number;
  /** Responsive size variant */
  size?: ResponsiveValue<TerminalSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

export interface TerminalErrorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Error title */
  title?: string;
  /** Error description */
  description?: string;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Responsive size variant */
  size?: ResponsiveValue<TerminalSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * TerminalSkeleton - Loading placeholder for terminal
 */
export const TerminalSkeleton = forwardRef<HTMLDivElement, TerminalSkeletonProps>(
  function TerminalSkeleton(
    { lineCount = 8, size = 'md', className, 'data-testid': testId, ...props },
    ref
  ) {
    const paddingClasses = getResponsiveSizeClasses(size, TERMINAL_PADDING_CLASSES);

    // Generate random widths for skeleton lines to mimic terminal output
    const lineWidths = Array.from({ length: lineCount }, (_, i) => {
      // Use deterministic widths based on index for consistency
      const widths = [75, 90, 45, 80, 60, 95, 40, 70];
      return widths[i % widths.length];
    });

    return (
      <div
        ref={ref}
        role="presentation"
        aria-hidden="true"
        className={cn(TERMINAL_SKELETON_BASE_CLASSES, paddingClasses, className)}
        data-testid={testId}
        data-size={typeof size === 'string' ? size : undefined}
        {...props}
      >
        {/* Prompt skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" variant="circular" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Output lines */}
        {lineWidths.map((width, index) => (
          <Skeleton
            key={index}
            className={TERMINAL_SKELETON_LINE_CLASSES}
            style={{ width: `${width}%` }}
          />
        ))}
      </div>
    );
  }
);

/**
 * TerminalError - Error state component for terminal
 */
export const TerminalError = forwardRef<HTMLDivElement, TerminalErrorProps>(function TerminalError(
  {
    title = DEFAULT_ERROR_TITLE,
    description = DEFAULT_ERROR_DESCRIPTION,
    showRetry = true,
    onRetry,
    size = 'md',
    className,
    'data-testid': testId,
    ...props
  },
  ref
) {
  const [isRetrying, setIsRetrying] = useState(false);
  const baseSize = getBaseSize(size);

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const iconSize = baseSize === 'sm' ? 'md' : baseSize === 'lg' ? 'xl' : 'lg';

  return (
    <div
      ref={ref}
      role="alert"
      aria-live="assertive"
      className={cn(TERMINAL_ERROR_BASE_CLASSES, className)}
      data-testid={testId}
      data-size={typeof size === 'string' ? size : undefined}
      {...props}
    >
      <Icon
        icon={AlertTriangle}
        size={iconSize}
        className={TERMINAL_ERROR_ICON_CLASSES}
        aria-hidden="true"
      />
      <div>
        <h3 className={TERMINAL_ERROR_TITLE_CLASSES}>{title}</h3>
        <p className={TERMINAL_ERROR_DESCRIPTION_CLASSES}>{description}</p>
      </div>
      {showRetry && onRetry && (
        <Button
          variant="secondary"
          onClick={handleRetry}
          disabled={isRetrying}
          loading={isRetrying}
          loadingText="Retrying..."
          className={TERMINAL_ERROR_BUTTON_CLASSES}
          aria-label={isRetrying ? 'Retrying terminal initialization' : DEFAULT_RETRY_LABEL}
        >
          <Icon icon={RefreshCw} size="sm" className="mr-2" aria-hidden="true" />
          {DEFAULT_RETRY_LABEL}
        </Button>
      )}
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * Terminal is a fully-featured terminal emulator component built on xterm.js.
 *
 * Features:
 * - Real terminal emulation with PTY support
 * - Automatic resize handling with FitAddon
 * - Dark and light theme support
 * - Customizable fonts, colors, and cursor
 * - Read-only mode for output-only terminals
 * - Keyboard and mouse input forwarding
 * - Scrollback buffer
 * - Selection and copy support
 * - Full accessibility support with screen reader announcements
 * - Responsive sizing
 * - Error handling with retry support
 *
 * The component is stateless in terms of business logic - it receives data
 * via callbacks and renders the terminal. However, it uses refs internally
 * to manage the xterm instance, which is required by the library.
 *
 * @example
 * // Basic terminal with input handling
 * <Terminal
 *   onInput={(data) => sendToProcess(data)}
 *   onResize={(cols, rows) => resizeProcess(cols, rows)}
 * />
 *
 * @example
 * // Read-only terminal for displaying logs
 * <Terminal
 *   readOnly
 *   colorMode="dark"
 *   onReady={(term) => term.write('Log output here...')}
 * />
 *
 * @example
 * // Custom themed terminal
 * <Terminal
 *   fontSize={14}
 *   fontFamily="'Fira Code', monospace"
 *   theme={customTheme}
 *   scrollback={5000}
 * />
 */
export const Terminal = forwardRef<TerminalHandle, TerminalProps>(function Terminal(
  {
    id,
    onInput,
    onResize,
    onReady,
    onError,
    autoFocus = true,
    fontSize: fontSizeProp,
    fontFamily = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
    lineHeight = 1.2,
    theme,
    colorMode = 'dark',
    readOnly = false,
    scrollback = 10000,
    cursorBlink = true,
    cursorStyle = 'block',
    className,
    'aria-label': ariaLabel = DEFAULT_TERMINAL_LABEL,
    'aria-describedby': ariaDescribedBy,
    size = 'md',
    'data-testid': testId,
    ...props
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Generate unique IDs for accessibility
  const uniqueId = useId();
  const terminalId = id ?? `terminal-${uniqueId}`;
  const announcementId = `${terminalId}-announcements`;

  // Determine effective font size (prop overrides size-based default)
  const fontSize = fontSizeProp ?? getFontSizeForSize(size);

  // Determine the effective theme
  const effectiveTheme = theme || (colorMode === 'dark' ? defaultDarkTheme : defaultLightTheme);

  // Expose imperative handle for parent components
  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        terminalRef.current?.focus();
      },
      write: (data: string) => {
        terminalRef.current?.write(data);
      },
      clear: () => {
        terminalRef.current?.clear();
      },
      getTerminal: () => terminalRef.current,
      fit: () => {
        try {
          fitAddonRef.current?.fit();
        } catch {
          // Ignore fit errors
        }
      },
    }),
    []
  );

  // Announce screen reader messages
  const announce = useCallback((message: string) => {
    setAnnouncement(message);
    // Clear after a short delay to allow re-announcements
    setTimeout(() => setAnnouncement(''), 1000);
  }, []);

  // Initialize terminal
  const initializeTerminal = useCallback(() => {
    if (!containerRef.current) return;

    try {
      // Create terminal instance
      const terminal = new XTerm({
        cursorBlink,
        cursorStyle,
        fontSize,
        fontFamily,
        lineHeight,
        scrollback,
        theme: effectiveTheme,
        disableStdin: readOnly,
        allowTransparency: true,
        convertEol: true,
      });

      // Create and load fit addon
      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      // Open terminal in container
      terminal.open(containerRef.current);

      // Initial fit
      try {
        fitAddon.fit();
      } catch {
        // Ignore fit errors during initialization
      }

      // Store refs
      terminalRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // Set up input handler
      if (!readOnly && onInput) {
        terminal.onData((data) => {
          onInput(data);
        });
      }

      // Set up resize observer
      const resizeObserver = new ResizeObserver(() => {
        if (fitAddonRef.current && terminalRef.current) {
          try {
            fitAddonRef.current.fit();
            const { cols, rows } = terminalRef.current;
            onResize?.(cols, rows);
            announce(buildResizeAnnouncement(cols, rows));
          } catch {
            // Ignore resize errors
          }
        }
      });
      resizeObserver.observe(containerRef.current);
      resizeObserverRef.current = resizeObserver;

      // Initial size notification
      const { cols, rows } = terminal;
      onResize?.(cols, rows);

      // Auto-focus if enabled
      if (autoFocus && !readOnly) {
        terminal.focus();
        announce(SR_TERMINAL_FOCUSED);
      }

      setIsReady(true);
      setHasError(false);
      announce(readOnly ? SR_TERMINAL_READ_ONLY : SR_TERMINAL_READY);

      // Notify that terminal is ready
      onReady?.(terminal);
    } catch (error) {
      setHasError(true);
      setIsReady(false);
      onError?.(error instanceof Error ? error : new Error('Failed to initialize terminal'));
    }
  }, [
    cursorBlink,
    cursorStyle,
    fontSize,
    fontFamily,
    lineHeight,
    scrollback,
    effectiveTheme,
    readOnly,
    onInput,
    onResize,
    onReady,
    onError,
    autoFocus,
    announce,
  ]);

  // Initialize xterm on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally only run on mount
  useEffect(() => {
    initializeTerminal();

    // Cleanup on unmount
    return () => {
      resizeObserverRef.current?.disconnect();
      terminalRef.current?.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
      resizeObserverRef.current = null;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update theme when it changes
  useEffect(() => {
    if (terminalRef.current && isReady) {
      terminalRef.current.options.theme = effectiveTheme;
    }
  }, [effectiveTheme, isReady]);

  // Update font size when it changes
  useEffect(() => {
    if (terminalRef.current && isReady) {
      terminalRef.current.options.fontSize = fontSize;
      fitAddonRef.current?.fit();
    }
  }, [fontSize, isReady]);

  // Handle container click to focus terminal
  const handleContainerClick = useCallback(() => {
    if (!readOnly) {
      terminalRef.current?.focus();
      announce(SR_TERMINAL_FOCUSED);
    }
  }, [readOnly, announce]);

  // Handle keyboard focus for accessibility
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Allow Enter/Space to focus the terminal from keyboard
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleContainerClick();
      }
    },
    [handleContainerClick]
  );

  // Handle retry after error
  const handleRetry = useCallback(() => {
    // Clean up previous instance
    resizeObserverRef.current?.disconnect();
    terminalRef.current?.dispose();
    terminalRef.current = null;
    fitAddonRef.current = null;
    resizeObserverRef.current = null;

    // Re-initialize
    initializeTerminal();
  }, [initializeTerminal]);

  // Get responsive padding classes
  const paddingClasses = getResponsiveSizeClasses(size, TERMINAL_PADDING_CLASSES);
  const baseSize = getBaseSize(size);

  // Build accessible label
  const accessibleLabel = buildTerminalAccessibleLabel(ariaLabel, readOnly, isReady);

  // Render error state
  if (hasError) {
    return (
      <TerminalError
        onRetry={handleRetry}
        size={size}
        data-testid={testId ? `${testId}-error` : undefined}
      />
    );
  }

  return (
    <div
      id={terminalId}
      className={cn(
        TERMINAL_BASE_CLASSES,
        TERMINAL_CONTAINER_CLASSES,
        TERMINAL_FOCUS_CLASSES,
        'bg-[var(--background)]',
        className
      )}
      onClick={handleContainerClick}
      onKeyDown={handleKeyDown}
      role="application"
      aria-label={accessibleLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={!isReady}
      aria-roledescription="terminal emulator"
      tabIndex={readOnly ? -1 : 0}
      data-testid={testId}
      data-size={typeof size === 'string' ? size : undefined}
      data-ready={isReady}
      data-read-only={readOnly}
      data-color-mode={colorMode}
      {...props}
    >
      {/* Screen reader announcements */}
      <VisuallyHidden>
        <div id={announcementId} role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
        {!isReady && <span>{SR_TERMINAL_LOADING}</span>}
        {readOnly && isReady && <span>{SR_TERMINAL_READ_ONLY}</span>}
      </VisuallyHidden>

      {/* Terminal container */}
      <div
        ref={containerRef}
        className={cn(TERMINAL_CONTAINER_CLASSES, paddingClasses)}
        style={{
          minHeight: '100px',
        }}
        aria-hidden="true"
      />

      {/* Loading indicator (overlay when not ready) */}
      {!isReady && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-muted/80"
          aria-hidden="true"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon
              icon={TerminalIcon}
              size={baseSize === 'sm' ? 'md' : 'lg'}
              className="motion-safe:animate-pulse"
            />
            <span className="text-sm">Initializing terminal...</span>
          </div>
        </div>
      )}
    </div>
  );
});

Terminal.displayName = 'Terminal';

/**
 * Terminal utilities exposed for advanced use cases.
 */
export type TerminalInstance = XTerm;
