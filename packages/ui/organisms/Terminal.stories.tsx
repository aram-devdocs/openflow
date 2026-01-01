import type { Meta, StoryObj } from '@storybook/react';
import type { Terminal as XTerm } from '@xterm/xterm';
import { useCallback, useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import {
  DEFAULT_ERROR_DESCRIPTION,
  DEFAULT_ERROR_TITLE,
  DEFAULT_RETRY_LABEL,
  // Constants
  DEFAULT_TERMINAL_LABEL,
  SR_TERMINAL_FOCUSED,
  SR_TERMINAL_LOADING,
  SR_TERMINAL_READY,
  SR_TERMINAL_READ_ONLY,
  SR_TERMINAL_RESIZED,
  TERMINAL_FONT_SIZES,
  TERMINAL_PADDING_CLASSES,
  Terminal,
  TerminalError,
  // Types
  type TerminalHandle,
  TerminalSkeleton,
} from './Terminal';

const meta: Meta<typeof Terminal> = {
  title: 'Organisms/Terminal',
  component: Terminal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A fully-featured terminal emulator component built on xterm.js. Supports real terminal emulation with PTY, automatic resize handling, theming, and read-only mode.

## Accessibility Features

- **role="application"** for proper screen reader interaction
- **aria-roledescription="terminal emulator"** for context
- **aria-busy** indicates loading state
- **aria-live regions** for announcements
- **Keyboard navigation** - Enter/Space to focus
- **Focus ring** visible on keyboard focus
- **Touch targets** ≥44px (WCAG 2.5.5)
- **Error states** with role="alert"
- **Read-only mode** clearly announced

## Responsive Sizing

Use the \`size\` prop for responsive terminal sizing:
- \`sm\`: 12px font, minimal padding
- \`md\`: 14px font, standard padding (default)
- \`lg\`: 16px font, generous padding

Supports responsive objects: \`{ base: 'sm', md: 'md', lg: 'lg' }\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    colorMode: {
      control: 'radio',
      options: ['dark', 'light'],
      description: 'Color mode for the terminal',
    },
    fontSize: {
      control: { type: 'range', min: 10, max: 24, step: 1 },
      description: 'Font size in pixels',
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the terminal is read-only',
    },
    cursorBlink: {
      control: 'boolean',
      description: 'Whether the cursor should blink',
    },
    cursorStyle: {
      control: 'radio',
      options: ['block', 'underline', 'bar'],
      description: 'Cursor style',
    },
    scrollback: {
      control: { type: 'number', min: 100, max: 50000, step: 100 },
      description: 'Scrollback buffer size',
    },
    autoFocus: {
      control: 'boolean',
      description: 'Auto-focus terminal on mount',
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      description: 'Responsive size variant',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Terminal>;

// ============================================================================
// Basic Examples
// ============================================================================

/**
 * Default terminal with dark theme.
 */
export const Default: Story = {
  render: () => {
    const terminalRef = useRef<XTerm | null>(null);

    const handleReady = useCallback((terminal: XTerm) => {
      terminalRef.current = terminal;
      terminal.write('Welcome to OpenFlow Terminal!\r\n');
      terminal.write('$ ');
    }, []);

    const handleInput = useCallback((data: string) => {
      // Echo input back to terminal (local echo simulation)
      if (terminalRef.current) {
        if (data === '\r') {
          terminalRef.current.write('\r\n$ ');
        } else if (data === '\x7f') {
          // Backspace
          terminalRef.current.write('\b \b');
        } else {
          terminalRef.current.write(data);
        }
      }
    }, []);

    const handleResize = useCallback((cols: number, rows: number) => {
      console.log(`Terminal resized to ${cols}x${rows}`);
    }, []);

    return (
      <div className="h-[400px] w-full bg-[rgb(var(--background))]">
        <Terminal
          onReady={handleReady}
          onInput={handleInput}
          onResize={handleResize}
          colorMode="dark"
          data-testid="default-terminal"
        />
      </div>
    );
  },
};

/**
 * Light theme terminal.
 */
export const LightTheme: Story = {
  render: () => {
    const terminalRef = useRef<XTerm | null>(null);

    const handleReady = useCallback((terminal: XTerm) => {
      terminalRef.current = terminal;
      terminal.write('Light themed terminal\r\n');
      terminal.write('$ echo "Hello, World!"\r\n');
      terminal.write('Hello, World!\r\n');
      terminal.write('$ ');
    }, []);

    const handleInput = useCallback((data: string) => {
      if (terminalRef.current) {
        if (data === '\r') {
          terminalRef.current.write('\r\n$ ');
        } else if (data === '\x7f') {
          terminalRef.current.write('\b \b');
        } else {
          terminalRef.current.write(data);
        }
      }
    }, []);

    return (
      <div className="h-[400px] w-full bg-white">
        <Terminal
          onReady={handleReady}
          onInput={handleInput}
          colorMode="light"
          data-testid="light-terminal"
        />
      </div>
    );
  },
};

/**
 * Read-only terminal for displaying output.
 */
export const ReadOnly: Story = {
  render: () => {
    const handleReady = useCallback((terminal: XTerm) => {
      const logs = [
        '\x1b[32m[INFO]\x1b[0m Application starting...',
        '\x1b[32m[INFO]\x1b[0m Loading configuration...',
        '\x1b[33m[WARN]\x1b[0m No config file found, using defaults',
        '\x1b[32m[INFO]\x1b[0m Connecting to database...',
        '\x1b[32m[INFO]\x1b[0m Database connected successfully',
        '\x1b[32m[INFO]\x1b[0m Starting HTTP server on port 3000',
        '\x1b[36m[DEBUG]\x1b[0m Route registered: GET /',
        '\x1b[36m[DEBUG]\x1b[0m Route registered: GET /api/health',
        '\x1b[36m[DEBUG]\x1b[0m Route registered: POST /api/tasks',
        '\x1b[32m[INFO]\x1b[0m Server ready at http://localhost:3000',
      ];

      logs.forEach((log, index) => {
        setTimeout(() => {
          terminal.write(`${log}\r\n`);
        }, index * 200);
      });
    }, []);

    return (
      <div className="h-[400px] w-full bg-[rgb(var(--background))]">
        <Terminal
          onReady={handleReady}
          readOnly
          colorMode="dark"
          aria-label="Application logs"
          data-testid="readonly-terminal"
        />
      </div>
    );
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size terminal - compact for sidebar panels.
 */
export const SizeSmall: Story = {
  render: () => {
    const handleReady = useCallback((terminal: XTerm) => {
      terminal.write('Small terminal (12px font)\r\n$ ');
    }, []);

    return (
      <div className="h-[300px] w-full bg-[rgb(var(--background))]">
        <Terminal
          onReady={handleReady}
          size="sm"
          readOnly
          colorMode="dark"
          data-testid="small-terminal"
        />
      </div>
    );
  },
};

/**
 * Medium size terminal - default size.
 */
export const SizeMedium: Story = {
  render: () => {
    const handleReady = useCallback((terminal: XTerm) => {
      terminal.write('Medium terminal (14px font)\r\n$ ');
    }, []);

    return (
      <div className="h-[400px] w-full bg-[rgb(var(--background))]">
        <Terminal
          onReady={handleReady}
          size="md"
          readOnly
          colorMode="dark"
          data-testid="medium-terminal"
        />
      </div>
    );
  },
};

/**
 * Large size terminal - spacious for main content.
 */
export const SizeLarge: Story = {
  render: () => {
    const handleReady = useCallback((terminal: XTerm) => {
      terminal.write('Large terminal (16px font)\r\n$ ');
    }, []);

    return (
      <div className="h-[500px] w-full bg-[rgb(var(--background))]">
        <Terminal
          onReady={handleReady}
          size="lg"
          readOnly
          colorMode="dark"
          data-testid="large-terminal"
        />
      </div>
    );
  },
};

/**
 * All sizes side by side for comparison.
 */
export const AllSizes: Story = {
  render: () => {
    const handleReady = useCallback(
      (size: string) => (terminal: XTerm) => {
        terminal.write(`${size.toUpperCase()} terminal\r\n`);
        terminal.write(
          `Font: ${TERMINAL_FONT_SIZES[size as keyof typeof TERMINAL_FONT_SIZES]}px\r\n`
        );
        terminal.write(
          `Padding: ${TERMINAL_PADDING_CLASSES[size as keyof typeof TERMINAL_PADDING_CLASSES]}\r\n`
        );
        terminal.write('$ ');
      },
      []
    );

    return (
      <div className="flex gap-4 p-4 bg-[rgb(var(--muted))]">
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <div
            key={size}
            className="flex-1 overflow-hidden rounded-lg border border-[rgb(var(--border))]"
          >
            <div className="h-[300px]">
              <Terminal
                onReady={handleReady(size)}
                size={size}
                readOnly
                colorMode="dark"
                aria-label={`${size} size terminal`}
              />
            </div>
          </div>
        ))}
      </div>
    );
  },
};

/**
 * Responsive sizing - changes with viewport.
 */
export const ResponsiveSizing: Story = {
  render: () => {
    const handleReady = useCallback((terminal: XTerm) => {
      terminal.write('Responsive terminal\r\n');
      terminal.write('Resize the window to see font size change:\r\n');
      terminal.write('- Mobile (base): 12px\r\n');
      terminal.write('- Tablet (md): 14px\r\n');
      terminal.write('- Desktop (lg): 16px\r\n');
      terminal.write('$ ');
    }, []);

    return (
      <div className="h-[400px] w-full bg-[rgb(var(--background))]">
        <Terminal
          onReady={handleReady}
          size={{ base: 'sm', md: 'md', lg: 'lg' }}
          readOnly
          colorMode="dark"
          aria-label="Responsive terminal"
        />
      </div>
    );
  },
};

// ============================================================================
// Customization
// ============================================================================

/**
 * Terminal with custom font settings.
 */
export const CustomFont: Story = {
  render: () => {
    const [fontSize, setFontSize] = useState(14);
    const terminalRef = useRef<XTerm | null>(null);

    const handleReady = useCallback((terminal: XTerm) => {
      terminalRef.current = terminal;
      terminal.write('Custom font terminal\r\n');
      terminal.write('Use the buttons above to adjust font size\r\n\r\n');
      terminal.write('$ ');
    }, []);

    const handleInput = useCallback((data: string) => {
      if (terminalRef.current) {
        if (data === '\r') {
          terminalRef.current.write('\r\n$ ');
        } else if (data === '\x7f') {
          terminalRef.current.write('\b \b');
        } else {
          terminalRef.current.write(data);
        }
      }
    }, []);

    return (
      <div className="flex h-[500px] flex-col bg-[rgb(var(--background))]">
        <div className="flex items-center gap-4 border-b border-[rgb(var(--border))] p-4">
          <span className="text-sm text-[rgb(var(--foreground))]">Font Size: {fontSize}px</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFontSize((s) => Math.max(10, s - 2))}
            aria-label="Decrease font size"
          >
            Smaller
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFontSize((s) => Math.min(24, s + 2))}
            aria-label="Increase font size"
          >
            Larger
          </Button>
        </div>
        <div className="flex-1">
          <Terminal
            onReady={handleReady}
            onInput={handleInput}
            fontSize={fontSize}
            fontFamily="'Fira Code', monospace"
            colorMode="dark"
          />
        </div>
      </div>
    );
  },
};

/**
 * Terminal with cursor style options.
 */
export const CursorStyles: Story = {
  render: () => {
    const [cursorStyle, setCursorStyle] = useState<'block' | 'underline' | 'bar'>('block');
    const terminalRef = useRef<XTerm | null>(null);

    const handleReady = useCallback((terminal: XTerm) => {
      terminalRef.current = terminal;
      terminal.write('Cursor style demonstration\r\n');
      terminal.write('Select a cursor style above to see the difference\r\n\r\n');
      terminal.write('$ ');
    }, []);

    const handleInput = useCallback((data: string) => {
      if (terminalRef.current) {
        if (data === '\r') {
          terminalRef.current.write('\r\n$ ');
        } else if (data === '\x7f') {
          terminalRef.current.write('\b \b');
        } else {
          terminalRef.current.write(data);
        }
      }
    }, []);

    return (
      <div className="flex h-[500px] flex-col bg-[rgb(var(--background))]">
        <div className="flex items-center gap-4 border-b border-[rgb(var(--border))] p-4">
          <span className="text-sm text-[rgb(var(--foreground))]">Cursor Style:</span>
          {(['block', 'underline', 'bar'] as const).map((style) => (
            <Button
              key={style}
              variant={cursorStyle === style ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setCursorStyle(style)}
              aria-pressed={cursorStyle === style}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex-1">
          {/* Note: cursorStyle requires remount due to xterm limitation */}
          <Terminal
            key={cursorStyle}
            onReady={handleReady}
            onInput={handleInput}
            cursorStyle={cursorStyle}
            cursorBlink
            colorMode="dark"
          />
        </div>
      </div>
    );
  },
};

/**
 * Terminal with ANSI color output.
 */
export const AnsiColors: Story = {
  render: () => {
    const handleReady = useCallback((terminal: XTerm) => {
      terminal.write('ANSI Color Support Demo\r\n');
      terminal.write('=======================\r\n\r\n');

      // Standard colors
      terminal.write('Standard Colors:\r\n');
      terminal.write(
        '\x1b[30mBlack\x1b[0m \x1b[31mRed\x1b[0m \x1b[32mGreen\x1b[0m \x1b[33mYellow\x1b[0m '
      );
      terminal.write(
        '\x1b[34mBlue\x1b[0m \x1b[35mMagenta\x1b[0m \x1b[36mCyan\x1b[0m \x1b[37mWhite\x1b[0m\r\n\r\n'
      );

      // Bright colors
      terminal.write('Bright Colors:\r\n');
      terminal.write(
        '\x1b[90mBlack\x1b[0m \x1b[91mRed\x1b[0m \x1b[92mGreen\x1b[0m \x1b[93mYellow\x1b[0m '
      );
      terminal.write(
        '\x1b[94mBlue\x1b[0m \x1b[95mMagenta\x1b[0m \x1b[96mCyan\x1b[0m \x1b[97mWhite\x1b[0m\r\n\r\n'
      );

      // Styles
      terminal.write('Text Styles:\r\n');
      terminal.write('\x1b[1mBold\x1b[0m ');
      terminal.write('\x1b[2mDim\x1b[0m ');
      terminal.write('\x1b[3mItalic\x1b[0m ');
      terminal.write('\x1b[4mUnderline\x1b[0m ');
      terminal.write('\x1b[7mReverse\x1b[0m ');
      terminal.write('\x1b[9mStrikethrough\x1b[0m\r\n\r\n');

      // Background colors
      terminal.write('Background Colors:\r\n');
      terminal.write('\x1b[40m   \x1b[0m\x1b[41m   \x1b[0m\x1b[42m   \x1b[0m\x1b[43m   \x1b[0m');
      terminal.write(
        '\x1b[44m   \x1b[0m\x1b[45m   \x1b[0m\x1b[46m   \x1b[0m\x1b[47m   \x1b[0m\r\n\r\n'
      );

      terminal.write('256-Color Support:\r\n');
      for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 16; j++) {
          const color = i * 16 + j;
          terminal.write(`\x1b[48;5;${color}m  \x1b[0m`);
        }
        terminal.write('\r\n');
      }

      terminal.write('\r\n$ ');
    }, []);

    return (
      <div className="h-[600px] w-full bg-[rgb(var(--background))]">
        <Terminal
          onReady={handleReady}
          readOnly
          colorMode="dark"
          scrollback={1000}
          aria-label="ANSI colors demo"
        />
      </div>
    );
  },
};

// ============================================================================
// Interactive Examples
// ============================================================================

/**
 * Interactive terminal with simulated command execution.
 */
export const InteractiveDemo: Story = {
  render: () => {
    const terminalRef = useRef<XTerm | null>(null);
    const inputBuffer = useRef('');

    const handleReady = useCallback((terminal: XTerm) => {
      terminalRef.current = terminal;
      terminal.write('\x1b[1;36mOpenFlow Terminal\x1b[0m\r\n');
      terminal.write('Type "help" for available commands\r\n\r\n');
      terminal.write('\x1b[32m$\x1b[0m ');
    }, []);

    const executeCommand = useCallback((command: string) => {
      const term = terminalRef.current;
      if (!term) return;

      const cmd = command.trim().toLowerCase();

      switch (cmd) {
        case 'help':
          term.write('\r\nAvailable commands:\r\n');
          term.write('  help     - Show this help message\r\n');
          term.write('  clear    - Clear the terminal\r\n');
          term.write('  date     - Show current date and time\r\n');
          term.write('  echo     - Echo back your text\r\n');
          term.write('  colors   - Show color palette\r\n');
          term.write('  matrix   - Show a Matrix-style animation\r\n');
          break;
        case 'clear':
          term.clear();
          break;
        case 'date':
          term.write(`\r\n${new Date().toString()}\r\n`);
          break;
        case 'colors':
          term.write('\r\n');
          for (let i = 0; i < 8; i++) {
            term.write(`\x1b[4${i}m   \x1b[0m`);
          }
          term.write('\r\n');
          break;
        case 'matrix': {
          term.write('\r\nStarting Matrix animation...\r\n');
          let frames = 0;
          const interval = setInterval(() => {
            const chars = '0123456789ABCDEF';
            let line = '';
            for (let i = 0; i < 40; i++) {
              const char = chars[Math.floor(Math.random() * chars.length)];
              const green = Math.floor(Math.random() * 155) + 100;
              line += `\x1b[38;2;0;${green};0m${char}\x1b[0m`;
            }
            term.write(`${line}\r\n`);
            frames++;
            if (frames > 5) {
              clearInterval(interval);
              term.write('\r\n');
              term.write('\x1b[32m$\x1b[0m ');
            }
          }, 100);
          return; // Don't print prompt immediately
        }
        default:
          if (cmd.startsWith('echo ')) {
            term.write(`\r\n${command.substring(5)}\r\n`);
          } else if (cmd) {
            term.write(`\r\nCommand not found: ${cmd}\r\n`);
          }
      }

      term.write('\x1b[32m$\x1b[0m ');
    }, []);

    const handleInput = useCallback(
      (data: string) => {
        const term = terminalRef.current;
        if (!term) return;

        if (data === '\r') {
          executeCommand(inputBuffer.current);
          inputBuffer.current = '';
        } else if (data === '\x7f') {
          // Backspace
          if (inputBuffer.current.length > 0) {
            inputBuffer.current = inputBuffer.current.slice(0, -1);
            term.write('\b \b');
          }
        } else if (data === '\x03') {
          // Ctrl+C
          term.write('^C\r\n');
          term.write('\x1b[32m$\x1b[0m ');
          inputBuffer.current = '';
        } else if (data >= ' ') {
          // Printable characters
          inputBuffer.current += data;
          term.write(data);
        }
      },
      [executeCommand]
    );

    return (
      <div className="h-[500px] w-full bg-[rgb(var(--background))]">
        <Terminal
          onReady={handleReady}
          onInput={handleInput}
          colorMode="dark"
          fontSize={14}
          cursorBlink
          aria-label="Interactive terminal demo"
        />
      </div>
    );
  },
};

/**
 * Using imperative handle for programmatic control.
 */
export const ImperativeHandle: Story = {
  render: () => {
    const terminalRef = useRef<TerminalHandle>(null);

    const handleWrite = () => {
      terminalRef.current?.write('Hello from button!\r\n$ ');
    };

    const handleClear = () => {
      terminalRef.current?.clear();
      terminalRef.current?.write('Terminal cleared!\r\n$ ');
    };

    const handleFocus = () => {
      terminalRef.current?.focus();
    };

    return (
      <div className="flex h-[500px] flex-col bg-[rgb(var(--background))]">
        <div className="flex items-center gap-4 border-b border-[rgb(var(--border))] p-4">
          <Button variant="secondary" size="sm" onClick={handleWrite}>
            Write Text
          </Button>
          <Button variant="secondary" size="sm" onClick={handleClear}>
            Clear
          </Button>
          <Button variant="secondary" size="sm" onClick={handleFocus}>
            Focus Terminal
          </Button>
        </div>
        <div className="flex-1">
          <Terminal
            ref={terminalRef}
            onReady={(term) => term.write('Use buttons above to control terminal\r\n$ ')}
            colorMode="dark"
            autoFocus={false}
          />
        </div>
      </div>
    );
  },
};

// ============================================================================
// Loading & Error States
// ============================================================================

/**
 * Terminal skeleton loading state.
 */
export const SkeletonLoading: Story = {
  render: () => (
    <div className="flex gap-4 p-4 bg-[rgb(var(--muted))]">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div
          key={size}
          className="flex-1 h-[300px] overflow-hidden rounded-lg border border-[rgb(var(--border))]"
        >
          <TerminalSkeleton size={size} data-testid={`skeleton-${size}`} />
        </div>
      ))}
    </div>
  ),
};

/**
 * Terminal error state with retry.
 */
export const ErrorState: Story = {
  render: () => {
    const [retryCount, setRetryCount] = useState(0);

    const handleRetry = () => {
      setRetryCount((c) => c + 1);
      console.log('Retry clicked', retryCount + 1);
    };

    return (
      <div className="flex gap-4 p-4 bg-[rgb(var(--muted))]">
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <div
            key={size}
            className="flex-1 h-[300px] overflow-hidden rounded-lg border border-[rgb(var(--border))]"
          >
            <TerminalError size={size} onRetry={handleRetry} data-testid={`error-${size}`} />
          </div>
        ))}
      </div>
    );
  },
};

/**
 * Custom error messages.
 */
export const CustomError: Story = {
  render: () => (
    <div className="h-[300px] w-full max-w-lg mx-auto p-4">
      <TerminalError
        title="Connection Lost"
        description="The terminal session was disconnected. Check your network connection and try again."
        onRetry={() => console.log('Reconnecting...')}
      />
    </div>
  ),
};

// ============================================================================
// Theme Comparison
// ============================================================================

/**
 * Side-by-side dark and light themes.
 */
export const ThemeComparison: Story = {
  render: () => {
    const handleReadyDark = useCallback((terminal: XTerm) => {
      terminal.write('\x1b[1mDark Theme\x1b[0m\r\n\r\n');
      terminal.write('$ ls -la\r\n');
      terminal.write('\x1b[34mdrwxr-xr-x\x1b[0m  src/\r\n');
      terminal.write('\x1b[34mdrwxr-xr-x\x1b[0m  tests/\r\n');
      terminal.write('-rw-r--r--  package.json\r\n');
      terminal.write('-rw-r--r--  README.md\r\n');
      terminal.write('\r\n$ ');
    }, []);

    const handleReadyLight = useCallback((terminal: XTerm) => {
      terminal.write('\x1b[1mLight Theme\x1b[0m\r\n\r\n');
      terminal.write('$ git status\r\n');
      terminal.write('\x1b[32mOn branch main\x1b[0m\r\n');
      terminal.write('Changes staged for commit:\r\n');
      terminal.write('  \x1b[32mmodified:   src/index.ts\x1b[0m\r\n');
      terminal.write('\r\n$ ');
    }, []);

    return (
      <div className="flex h-[400px] gap-4 p-4 bg-[rgb(var(--muted))]">
        <div className="flex-1 overflow-hidden rounded-lg border border-[rgb(var(--border))]">
          <Terminal
            onReady={handleReadyDark}
            readOnly
            colorMode="dark"
            aria-label="Dark theme terminal"
          />
        </div>
        <div className="flex-1 overflow-hidden rounded-lg border border-[rgb(var(--border))]">
          <Terminal
            onReady={handleReadyLight}
            readOnly
            colorMode="light"
            aria-label="Light theme terminal"
          />
        </div>
      </div>
    );
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Focus ring visibility demonstration.
 */
export const FocusRingVisibility: Story = {
  render: () => {
    const handleReady = useCallback((terminal: XTerm) => {
      terminal.write('Focus Ring Demo\r\n');
      terminal.write('================\r\n\r\n');
      terminal.write('Tab to this terminal to see the focus ring.\r\n');
      terminal.write('The ring uses ring-offset for visibility\r\n');
      terminal.write('on both light and dark backgrounds.\r\n\r\n');
      terminal.write('$ ');
    }, []);

    return (
      <div className="space-y-8 p-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">On Dark Background</h3>
          <div className="h-[200px] bg-gray-900 p-4 rounded-lg">
            <Terminal
              onReady={handleReady}
              readOnly
              colorMode="dark"
              autoFocus={false}
              aria-label="Terminal on dark background"
            />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">On Light Background</h3>
          <div className="h-[200px] bg-gray-100 p-4 rounded-lg">
            <Terminal
              onReady={handleReady}
              readOnly
              colorMode="light"
              autoFocus={false}
              aria-label="Terminal on light background"
            />
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Screen reader accessibility demonstration.
 */
export const ScreenReaderAccessibility: Story = {
  render: () => {
    const handleReady = useCallback((terminal: XTerm) => {
      terminal.write('Screen Reader Demo\r\n');
      terminal.write('==================\r\n\r\n');
      terminal.write('This terminal announces:\r\n');
      terminal.write('- When it becomes ready\r\n');
      terminal.write('- When it receives focus\r\n');
      terminal.write('- When it is resized\r\n');
      terminal.write('- Its read-only status\r\n\r\n');
      terminal.write('Try resizing the window!\r\n\r\n');
      terminal.write('$ ');
    }, []);

    return (
      <div className="p-8 space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>This terminal provides screen reader announcements for:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>{SR_TERMINAL_READY}</li>
            <li>{SR_TERMINAL_FOCUSED}</li>
            <li>{SR_TERMINAL_READ_ONLY}</li>
            <li>{SR_TERMINAL_RESIZED(80, 24)}</li>
            <li>{SR_TERMINAL_LOADING}</li>
          </ul>
        </div>
        <div className="h-[300px] rounded-lg overflow-hidden border">
          <Terminal
            onReady={handleReady}
            readOnly
            colorMode="dark"
            aria-label="Screen reader demo terminal"
          />
        </div>
      </div>
    );
  },
};

/**
 * Keyboard navigation demonstration.
 */
export const KeyboardNavigation: Story = {
  render: () => {
    const terminalRef = useRef<XTerm | null>(null);

    const handleReady = useCallback((terminal: XTerm) => {
      terminalRef.current = terminal;
      terminal.write('Keyboard Navigation Demo\r\n');
      terminal.write('========================\r\n\r\n');
      terminal.write('Keyboard shortcuts:\r\n');
      terminal.write('- Tab: Focus terminal\r\n');
      terminal.write('- Enter/Space: Activate terminal (when focused)\r\n');
      terminal.write('- Shift+Tab: Move to previous element\r\n');
      terminal.write('- Ctrl+C: Cancel current input\r\n\r\n');
      terminal.write('Try typing a command:\r\n');
      terminal.write('$ ');
    }, []);

    const handleInput = useCallback((data: string) => {
      if (terminalRef.current) {
        if (data === '\r') {
          terminalRef.current.write('\r\nCommand received!\r\n$ ');
        } else if (data === '\x7f') {
          terminalRef.current.write('\b \b');
        } else if (data === '\x03') {
          terminalRef.current.write('^C\r\n$ ');
        } else {
          terminalRef.current.write(data);
        }
      }
    }, []);

    return (
      <div className="p-8 space-y-4">
        <Button variant="secondary" className="mb-4">
          Focus here first, then Tab to terminal
        </Button>
        <div className="h-[350px] rounded-lg overflow-hidden border">
          <Terminal
            onReady={handleReady}
            onInput={handleInput}
            colorMode="dark"
            autoFocus={false}
            aria-label="Keyboard navigation demo terminal"
          />
        </div>
        <Button variant="secondary">Tab past terminal to reach this button</Button>
      </div>
    );
  },
};

// ============================================================================
// Data Attributes & Ref Forwarding
// ============================================================================

/**
 * Data attributes for testing.
 */
export const DataAttributes: Story = {
  render: () => (
    <div className="p-8 space-y-4">
      <pre className="text-xs bg-muted p-4 rounded overflow-auto">
        {`// Data attributes available on Terminal:
data-testid="my-terminal"
data-size="md"
data-ready="true|false"
data-read-only="true|false"
data-color-mode="dark|light"

// On TerminalSkeleton:
data-testid="my-skeleton"
data-size="md"

// On TerminalError:
data-testid="my-error"
data-size="md"
`}
      </pre>
      <div className="h-[300px] rounded-lg overflow-hidden border">
        <Terminal
          onReady={(term) => term.write('Check DOM for data attributes\r\n$ ')}
          readOnly
          colorMode="dark"
          size="md"
          data-testid="demo-terminal"
        />
      </div>
    </div>
  ),
};

// ============================================================================
// Real-World Examples
// ============================================================================

/**
 * Build process output viewer.
 */
export const BuildProcessViewer: Story = {
  render: () => {
    const handleReady = useCallback((terminal: XTerm) => {
      const steps = [
        { text: '\x1b[36m$ npm run build\x1b[0m', delay: 0 },
        { text: '\x1b[90m> openflow@1.0.0 build\x1b[0m', delay: 200 },
        { text: '\x1b[90m> tsc && vite build\x1b[0m', delay: 300 },
        { text: '', delay: 400 },
        { text: '\x1b[32m✓\x1b[0m TypeScript compiled successfully', delay: 800 },
        { text: '', delay: 900 },
        { text: '\x1b[36mvite v5.0.0 building for production...\x1b[0m', delay: 1000 },
        { text: '\x1b[32m✓\x1b[0m 143 modules transformed.', delay: 1500 },
        { text: '', delay: 1600 },
        { text: 'dist/index.html                  0.46 kB │ gzip: 0.30 kB', delay: 1700 },
        {
          text: 'dist/assets/index-\x1b[33mBg5MkQXj\x1b[0m.css   8.12 kB │ gzip: 2.45 kB',
          delay: 1800,
        },
        {
          text: 'dist/assets/index-\x1b[33mCd4LmNpR\x1b[0m.js  245.67 kB │ gzip: 78.23 kB',
          delay: 1900,
        },
        { text: '', delay: 2000 },
        { text: '\x1b[32m✓\x1b[0m built in 2.34s', delay: 2100 },
      ];

      steps.forEach(({ text, delay }) => {
        setTimeout(() => {
          terminal.write(`${text}\r\n`);
        }, delay);
      });
    }, []);

    return (
      <div className="h-[400px] w-full bg-[rgb(var(--background))]">
        <Terminal
          onReady={handleReady}
          readOnly
          colorMode="dark"
          scrollback={5000}
          aria-label="Build process output"
        />
      </div>
    );
  },
};

/**
 * Log viewer with streaming output.
 */
export const LogViewer: Story = {
  render: () => {
    const terminalRef = useRef<XTerm | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleReady = useCallback((terminal: XTerm) => {
      terminalRef.current = terminal;
      terminal.write('\x1b[1;36mApplication Logs\x1b[0m\r\n');
      terminal.write('Click "Start Streaming" to simulate live logs\r\n\r\n');
    }, []);

    const startStreaming = () => {
      if (!terminalRef.current || isStreaming) return;
      setIsStreaming(true);

      const logTypes = [
        {
          prefix: '\x1b[32m[INFO]\x1b[0m',
          messages: ['Request received', 'Processing...', 'Response sent'],
        },
        { prefix: '\x1b[33m[WARN]\x1b[0m', messages: ['High memory usage', 'Slow query detected'] },
        {
          prefix: '\x1b[36m[DEBUG]\x1b[0m',
          messages: ['Cache hit', 'DB query completed', 'Validating input'],
        },
      ];

      intervalRef.current = setInterval(() => {
        if (!terminalRef.current) return;
        const typeIndex = Math.floor(Math.random() * logTypes.length);
        const logType = logTypes[typeIndex];
        if (!logType) return;
        const messageIndex = Math.floor(Math.random() * logType.messages.length);
        const message = logType.messages[messageIndex];
        if (!message) return;
        const timestamp = new Date().toISOString().split('T')[1]?.slice(0, 12) ?? '';
        terminalRef.current.write(`${logType.prefix} ${timestamp} ${message}\r\n`);
      }, 500);
    };

    const stopStreaming = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsStreaming(false);
    };

    return (
      <div className="flex h-[500px] flex-col bg-[rgb(var(--background))]">
        <div className="flex items-center gap-4 border-b border-[rgb(var(--border))] p-4">
          <Button
            variant={isStreaming ? 'destructive' : 'primary'}
            size="sm"
            onClick={isStreaming ? stopStreaming : startStreaming}
          >
            {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => terminalRef.current?.clear()}>
            Clear Logs
          </Button>
        </div>
        <div className="flex-1">
          <Terminal
            onReady={handleReady}
            readOnly
            colorMode="dark"
            scrollback={10000}
            aria-label="Live application logs"
          />
        </div>
      </div>
    );
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Reference for all exported constants and utilities.
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Label Constants</h3>
        <pre className="text-xs bg-muted p-4 rounded overflow-auto">
          {`DEFAULT_TERMINAL_LABEL: "${DEFAULT_TERMINAL_LABEL}"
DEFAULT_ERROR_TITLE: "${DEFAULT_ERROR_TITLE}"
DEFAULT_ERROR_DESCRIPTION: "${DEFAULT_ERROR_DESCRIPTION}"
DEFAULT_RETRY_LABEL: "${DEFAULT_RETRY_LABEL}"`}
        </pre>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Screen Reader Announcements</h3>
        <pre className="text-xs bg-muted p-4 rounded overflow-auto">
          {`SR_TERMINAL_READY: "${SR_TERMINAL_READY}"
SR_TERMINAL_FOCUSED: "${SR_TERMINAL_FOCUSED}"
SR_TERMINAL_READ_ONLY: "${SR_TERMINAL_READ_ONLY}"
SR_TERMINAL_LOADING: "${SR_TERMINAL_LOADING}"
SR_TERMINAL_RESIZED(80, 24): "${SR_TERMINAL_RESIZED(80, 24)}"`}
        </pre>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Size Configuration</h3>
        <pre className="text-xs bg-muted p-4 rounded overflow-auto">
          {`TERMINAL_PADDING_CLASSES: ${JSON.stringify(TERMINAL_PADDING_CLASSES, null, 2)}

TERMINAL_FONT_SIZES: ${JSON.stringify(TERMINAL_FONT_SIZES, null, 2)}`}
        </pre>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Utility Functions</h3>
        <pre className="text-xs bg-muted p-4 rounded overflow-auto">
          {`// getBaseSize - Extract base size from responsive value
getBaseSize('md') // => 'md'
getBaseSize({ base: 'sm', lg: 'lg' }) // => 'sm'

// getResponsiveSizeClasses - Generate responsive classes
getResponsiveSizeClasses('md', TERMINAL_PADDING_CLASSES)
// => 'p-2'

getResponsiveSizeClasses({ base: 'sm', md: 'md', lg: 'lg' }, TERMINAL_PADDING_CLASSES)
// => 'p-1 md:p-2 lg:p-3'

// getFontSizeForSize - Get font size for terminal size
getFontSizeForSize('sm') // => 12
getFontSizeForSize('md') // => 14
getFontSizeForSize('lg') // => 16

// buildTerminalAccessibleLabel - Build ARIA label
buildTerminalAccessibleLabel('Terminal', false, true)
// => 'Terminal'
buildTerminalAccessibleLabel('Terminal', true, false)
// => 'Terminal (read-only) - Loading'

// buildResizeAnnouncement - Build resize announcement
buildResizeAnnouncement(80, 24)
// => 'Terminal resized to 80 columns by 24 rows'`}
        </pre>
      </div>
    </div>
  ),
};
