import type { Meta, StoryObj } from '@storybook/react';
import type { Terminal as XTerm } from '@xterm/xterm';
import { useCallback, useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import { Terminal } from './Terminal';

const meta: Meta<typeof Terminal> = {
  title: 'Organisms/Terminal',
  component: Terminal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A fully-featured terminal emulator component built on xterm.js. Supports real terminal emulation with PTY, automatic resize handling, theming, and read-only mode.',
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
  },
};

export default meta;
type Story = StoryObj<typeof Terminal>;

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
        <Terminal onReady={handleReady} onInput={handleInput} colorMode="light" />
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
        <Terminal onReady={handleReady} readOnly colorMode="dark" ariaLabel="Application logs" />
      </div>
    );
  },
};

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
          >
            Smaller
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFontSize((s) => Math.min(24, s + 2))}
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
          ariaLabel="ANSI colors demo"
        />
      </div>
    );
  },
};

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
        />
      </div>
    );
  },
};

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
          <Terminal onReady={handleReadyDark} readOnly colorMode="dark" />
        </div>
        <div className="flex-1 overflow-hidden rounded-lg border border-[rgb(var(--border))]">
          <Terminal onReady={handleReadyLight} readOnly colorMode="light" />
        </div>
      </div>
    );
  },
};
