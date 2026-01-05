import { Box } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Terminal, type TerminalHandle, type TerminalTheme } from './Terminal';

// ============================================================================
// Types
// ============================================================================

export interface ChatTerminalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onError'> {
  /** Process ID (used for data attributes, not for streaming) */
  processId: string | null;
  /** Initial content to display (for historical replay when process is not running) */
  initialContent?: string;
  /** Whether connected to stream (provided by parent using useRawOutputStream) */
  isConnected?: boolean;
  /** Total bytes received (provided by parent using useRawOutputStream) */
  totalBytes?: number;
  /** Stream error (provided by parent using useRawOutputStream) */
  streamError?: Error | null;
  /** Whether the terminal should auto-focus */
  autoFocus?: boolean;
  /** Terminal theme colors */
  theme?: TerminalTheme;
  /** Whether to use dark or light mode */
  colorMode?: 'dark' | 'light';
  /** Scrollback buffer size */
  scrollback?: number;
  /** Additional CSS classes */
  className?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

export interface ChatTerminalHandle {
  /** Focus the terminal */
  focus: () => void;
  /** Clear the terminal display */
  clear: () => void;
  /** Get the underlying terminal handle */
  getTerminal: () => TerminalHandle | null;
  /** Check if connected to stream */
  isConnected: () => boolean;
  /** Write data directly to terminal */
  write: (data: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

export const CHAT_TERMINAL_BASE_CLASSES = 'relative h-full w-full overflow-hidden';
export const CHAT_TERMINAL_STATUS_CLASSES =
  'absolute top-2 right-2 z-10 flex items-center gap-2 rounded-md bg-background/80 px-2 py-1 text-xs backdrop-blur-sm';
export const CHAT_TERMINAL_CONNECTED_DOT_CLASSES = 'h-2 w-2 rounded-full bg-green-500';
export const CHAT_TERMINAL_DISCONNECTED_DOT_CLASSES = 'h-2 w-2 rounded-full bg-red-500';
export const CHAT_TERMINAL_IDLE_DOT_CLASSES = 'h-2 w-2 rounded-full bg-muted-foreground';
export const CHAT_TERMINAL_BYTES_CLASSES = 'text-muted-foreground';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ChatTerminal is a stateless terminal component for displaying Claude Code CLI output.
 * It receives stream state via props from the parent component which uses useRawOutputStream.
 *
 * Features:
 * - Displays raw PTY output (written via ref.write())
 * - Supports initial content for historical replay (when process is not running)
 * - Shows connection status indicator
 * - Displays bytes received counter
 * - Read-only terminal (no input - Claude handles interaction)
 *
 * @example
 * // Parent component uses hook and passes state/writes to terminal
 * const terminalRef = useRef<ChatTerminalHandle>(null);
 * const handleData = (data: string) => terminalRef.current?.write(data);
 * const { isConnected, totalBytes, error } = useRawOutputStream(processId, handleData);
 *
 * <ChatTerminal
 *   ref={terminalRef}
 *   processId={process.id}
 *   isConnected={isConnected}
 *   totalBytes={totalBytes}
 *   streamError={error}
 *   colorMode="dark"
 * />
 *
 * @example
 * // Display historical output (no active process)
 * <ChatTerminal
 *   processId={null}
 *   initialContent={accumulatedRawOutput}
 *   colorMode="dark"
 * />
 */
export const ChatTerminal = forwardRef<ChatTerminalHandle, ChatTerminalProps>(function ChatTerminal(
  {
    processId,
    initialContent,
    isConnected = false,
    totalBytes = 0,
    streamError: _streamError,
    autoFocus = false,
    theme,
    colorMode = 'dark',
    scrollback = 50000,
    className,
    'data-testid': testId,
    ...props
  },
  ref
) {
  const terminalRef = useRef<TerminalHandle>(null);
  const [showStatus, setShowStatus] = useState(true);
  const [terminalReady, setTerminalReady] = useState(false);
  const initialContentWrittenRef = useRef(false);

  // Track if we have an active process
  const hasActiveProcess = Boolean(processId);

  // Handle terminal ready state
  const handleTerminalReady = useCallback(() => {
    setTerminalReady(true);
  }, []);

  // Write initial content when terminal is ready and we have content
  useEffect(() => {
    if (terminalReady && initialContent && !initialContentWrittenRef.current && !hasActiveProcess) {
      // Only write initial content if there's no active process
      // (otherwise we're in live streaming mode)
      terminalRef.current?.write(initialContent);
      initialContentWrittenRef.current = true;
    }
  }, [terminalReady, initialContent, hasActiveProcess]);

  // Reset initial content flag when process changes
  useEffect(() => {
    if (processId) {
      initialContentWrittenRef.current = false;
      terminalRef.current?.clear();
    }
  }, [processId]);

  // Expose imperative handle
  useImperativeHandle(
    ref,
    () => ({
      focus: () => terminalRef.current?.focus(),
      clear: () => terminalRef.current?.clear(),
      getTerminal: () => terminalRef.current,
      isConnected: () => isConnected,
      write: (data: string) => terminalRef.current?.write(data),
    }),
    [isConnected]
  );

  // Hide status after some activity
  useEffect(() => {
    if (totalBytes > 1000) {
      // Hide status after receiving significant data
      const timer = setTimeout(() => setShowStatus(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [totalBytes]);

  // Determine status display
  const statusMode = hasActiveProcess ? (isConnected ? 'connected' : 'disconnected') : 'idle';

  const statusText = hasActiveProcess
    ? isConnected
      ? formatBytes(totalBytes)
      : 'Disconnected'
    : initialContent
      ? 'Historical'
      : 'No output';

  return (
    <Box
      className={cn(CHAT_TERMINAL_BASE_CLASSES, className)}
      data-testid={testId}
      data-connected={isConnected}
      data-process-id={processId}
      data-mode={hasActiveProcess ? 'live' : 'historical'}
      {...props}
    >
      {/* Status indicator */}
      {showStatus && (
        <Box className={CHAT_TERMINAL_STATUS_CLASSES}>
          <Box
            className={cn(
              statusMode === 'connected' && CHAT_TERMINAL_CONNECTED_DOT_CLASSES,
              statusMode === 'disconnected' && CHAT_TERMINAL_DISCONNECTED_DOT_CLASSES,
              statusMode === 'idle' && CHAT_TERMINAL_IDLE_DOT_CLASSES
            )}
            aria-hidden="true"
          />
          <span className={CHAT_TERMINAL_BYTES_CLASSES}>{statusText}</span>
        </Box>
      )}

      {/* Terminal */}
      <Terminal
        ref={terminalRef}
        readOnly={true}
        autoFocus={autoFocus}
        theme={theme}
        colorMode={colorMode}
        scrollback={scrollback}
        cursorBlink={false}
        cursorStyle="bar"
        onReady={handleTerminalReady}
        aria-label="Claude Code terminal output"
        data-testid={testId ? `${testId}-terminal` : undefined}
      />
    </Box>
  );
});

ChatTerminal.displayName = 'ChatTerminal';
