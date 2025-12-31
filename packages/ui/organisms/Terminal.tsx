import { cn } from '@openflow/utils';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal as XTerm } from '@xterm/xterm';
import { useCallback, useEffect, useRef, useState } from 'react';
import '@xterm/xterm/css/xterm.css';

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

export interface TerminalProps {
  /** Unique identifier for this terminal instance */
  id?: string;
  /** Callback when user types input in the terminal */
  onInput?: (data: string) => void;
  /** Callback when terminal is resized (cols, rows) */
  onResize?: (cols: number, rows: number) => void;
  /** Callback when terminal is ready (initialized) */
  onReady?: (terminal: XTerm) => void;
  /** Whether the terminal should be focused on mount */
  autoFocus?: boolean;
  /** Font size in pixels */
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
  ariaLabel?: string;
}

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
export function Terminal({
  id,
  onInput,
  onResize,
  onReady,
  autoFocus = true,
  fontSize = 14,
  fontFamily = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
  lineHeight = 1.2,
  theme,
  colorMode = 'dark',
  readOnly = false,
  scrollback = 10000,
  cursorBlink = true,
  cursorStyle = 'block',
  className,
  ariaLabel = 'Terminal',
}: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Determine the effective theme
  const effectiveTheme = theme || (colorMode === 'dark' ? defaultDarkTheme : defaultLightTheme);

  // Initialize xterm on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: Terminal initialization must only run once on mount; options are captured at creation time
  useEffect(() => {
    if (!containerRef.current) return;

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
    if (autoFocus) {
      terminal.focus();
    }

    setIsInitialized(true);

    // Notify that terminal is ready
    onReady?.(terminal);

    // Cleanup on unmount
    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
      resizeObserverRef.current = null;
    };
    // Only run on mount - options are captured at creation time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update theme when it changes
  useEffect(() => {
    if (terminalRef.current && isInitialized) {
      terminalRef.current.options.theme = effectiveTheme;
    }
  }, [effectiveTheme, isInitialized]);

  // Update font size when it changes
  useEffect(() => {
    if (terminalRef.current && isInitialized) {
      terminalRef.current.options.fontSize = fontSize;
      fitAddonRef.current?.fit();
    }
  }, [fontSize, isInitialized]);

  // Handle container click to focus terminal
  const handleContainerClick = useCallback(() => {
    terminalRef.current?.focus();
  }, []);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Terminal handles its own keyboard events internally via xterm.js
    <div
      id={id}
      className={cn(
        'relative h-full w-full overflow-hidden',
        'bg-[rgb(var(--background))]',
        className
      )}
      onClick={handleContainerClick}
      role="application"
      aria-label={ariaLabel}
    >
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{
          padding: '8px',
        }}
      />
    </div>
  );
}

Terminal.displayName = 'Terminal';

/**
 * Terminal utilities exposed for advanced use cases.
 */
export type TerminalInstance = XTerm;
