/**
 * TerminalPanel - Interactive terminal panel with process integration
 *
 * This component wraps the Terminal component and provides integration
 * with process input/output. It's designed to be used in the dashboard
 * as a slide-up panel or modal.
 *
 * The component is stateless - all process communication is handled
 * via callbacks, following the OpenFlow architecture pattern.
 */

import { cn } from '@openflow/utils';
import { X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { Button } from '../atoms/Button';
import { Terminal, type TerminalInstance } from './Terminal';

export interface TerminalPanelProps {
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
  /** Color mode for the terminal */
  colorMode?: 'dark' | 'light';
  /** Additional CSS classes for the panel */
  className?: string;
  /** Title for the terminal panel */
  title?: string;
}

/**
 * TerminalPanel - A slide-up terminal panel for the dashboard.
 *
 * Features:
 * - xterm.js terminal emulation
 * - Process output streaming
 * - User input forwarding
 * - Resize handling
 * - Loading and closed states
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
export function TerminalPanel({
  isOpen,
  onClose,
  processId,
  rawOutput,
  onInput,
  onResize,
  isRunning = true,
  isLoading = false,
  colorMode = 'dark',
  className,
  title = 'Terminal',
}: TerminalPanelProps) {
  const terminalRef = useRef<TerminalInstance | null>(null);
  const lastOutputLengthRef = useRef(0);

  // Handle terminal ready
  const handleReady = useCallback(
    (terminal: TerminalInstance) => {
      terminalRef.current = terminal;
      // Write any existing output
      if (rawOutput) {
        terminal.write(rawOutput);
        lastOutputLengthRef.current = rawOutput.length;
      }
    },
    [rawOutput]
  );

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

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-50',
        'h-80 md:h-96',
        'flex flex-col',
        'bg-[hsl(var(--background))]',
        'border-t border-[hsl(var(--border))]',
        'shadow-lg',
        'animate-in slide-in-from-bottom duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          {processId && (
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {isRunning ? '● Running' : '○ Stopped'}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
          aria-label="Close terminal"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Terminal content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent" />
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Starting terminal...
              </span>
            </div>
          </div>
        ) : processId ? (
          <Terminal
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
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              No terminal session active
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

TerminalPanel.displayName = 'TerminalPanel';
