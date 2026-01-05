import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useRef } from 'react';
import {
  CHAT_TERMINAL_BASE_CLASSES,
  CHAT_TERMINAL_BYTES_CLASSES,
  CHAT_TERMINAL_CONNECTED_DOT_CLASSES,
  CHAT_TERMINAL_DISCONNECTED_DOT_CLASSES,
  CHAT_TERMINAL_IDLE_DOT_CLASSES,
  CHAT_TERMINAL_STATUS_CLASSES,
  ChatTerminal,
  type ChatTerminalHandle,
} from './ChatTerminal';

const meta: Meta<typeof ChatTerminal> = {
  title: 'Organisms/ChatTerminal',
  component: ChatTerminal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A stateless terminal component for displaying Claude Code CLI output.
It receives stream state via props from the parent component.

## Features

- Displays raw PTY output (written via ref.write())
- Supports initial content for historical replay
- Shows connection status indicator
- Displays bytes received counter
- Read-only terminal (no input - Claude handles interaction)

## Usage Pattern

The parent component is responsible for managing the stream connection
and writing data to the terminal via the imperative handle.

\`\`\`tsx
const terminalRef = useRef<ChatTerminalHandle>(null);
const handleData = (data: string) => terminalRef.current?.write(data);
const { isConnected, totalBytes, error } = useRawOutputStream(processId, handleData);

<ChatTerminal
  ref={terminalRef}
  processId={process.id}
  isConnected={isConnected}
  totalBytes={totalBytes}
  streamError={error}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    processId: {
      control: 'text',
      description: 'Process ID for data attributes',
    },
    isConnected: {
      control: 'boolean',
      description: 'Whether connected to stream (provided by parent)',
    },
    totalBytes: {
      control: 'number',
      description: 'Total bytes received (provided by parent)',
    },
    colorMode: {
      control: 'radio',
      options: ['dark', 'light'],
      description: 'Color mode for the terminal',
    },
    autoFocus: {
      control: 'boolean',
      description: 'Auto-focus terminal on mount',
    },
    scrollback: {
      control: { type: 'number', min: 100, max: 100000 },
      description: 'Scrollback buffer size',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatTerminal>;

// ============================================================================
// Basic Examples
// ============================================================================

/**
 * Default ChatTerminal with no active process.
 */
export const Default: Story = {
  render: () => {
    const terminalRef = useRef<ChatTerminalHandle>(null);

    return (
      <div className="h-[400px] w-full bg-[rgb(var(--background))]">
        <ChatTerminal
          ref={terminalRef}
          processId={null}
          colorMode="dark"
          data-testid="default-chat-terminal"
        />
      </div>
    );
  },
};

/**
 * ChatTerminal with historical content (no active process).
 */
export const HistoricalContent: Story = {
  render: () => {
    const terminalRef = useRef<ChatTerminalHandle>(null);

    const historicalOutput = `\x1b[1;36mClaude Code CLI\x1b[0m

\x1b[32m$\x1b[0m claude chat
\x1b[90mStarting chat session...\x1b[0m

\x1b[1;33mUser:\x1b[0m Help me write a function to calculate fibonacci numbers

\x1b[1;34mClaude:\x1b[0m I'll create a function that calculates fibonacci numbers efficiently.

\x1b[90m┌─────────────────────────────────────────────────────────────────────┐\x1b[0m
\x1b[90m│\x1b[0m \x1b[32mfunction fibonacci(n: number): number {\x1b[0m                             \x1b[90m│\x1b[0m
\x1b[90m│\x1b[0m \x1b[32m  if (n <= 1) return n;\x1b[0m                                            \x1b[90m│\x1b[0m
\x1b[90m│\x1b[0m \x1b[32m  return fibonacci(n - 1) + fibonacci(n - 2);\x1b[0m                       \x1b[90m│\x1b[0m
\x1b[90m│\x1b[0m \x1b[32m}\x1b[0m                                                                   \x1b[90m│\x1b[0m
\x1b[90m└─────────────────────────────────────────────────────────────────────┘\x1b[0m

\x1b[32m✓\x1b[0m Session completed
`;

    return (
      <div className="h-[500px] w-full bg-[rgb(var(--background))]">
        <ChatTerminal
          ref={terminalRef}
          processId={null}
          initialContent={historicalOutput}
          colorMode="dark"
          data-testid="historical-chat-terminal"
        />
      </div>
    );
  },
};

/**
 * ChatTerminal with active connection showing bytes.
 */
export const ActiveConnection: Story = {
  render: () => {
    const terminalRef = useRef<ChatTerminalHandle>(null);

    // Simulate receiving data
    const handleWrite = useCallback(() => {
      const data = '\x1b[32m$\x1b[0m Processing request...\r\n';
      terminalRef.current?.write(data);
    }, []);

    return (
      <div className="flex h-[400px] flex-col bg-[rgb(var(--background))]">
        <div className="flex items-center gap-4 border-b border-[rgb(var(--border))] p-4">
          <button
            type="button"
            onClick={handleWrite}
            className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground"
          >
            Write Data
          </button>
        </div>
        <div className="flex-1">
          <ChatTerminal
            ref={terminalRef}
            processId="proc-123"
            isConnected={true}
            totalBytes={4096}
            colorMode="dark"
            data-testid="active-chat-terminal"
          />
        </div>
      </div>
    );
  },
};

/**
 * ChatTerminal disconnected state.
 */
export const Disconnected: Story = {
  render: () => {
    const terminalRef = useRef<ChatTerminalHandle>(null);

    return (
      <div className="h-[400px] w-full bg-[rgb(var(--background))]">
        <ChatTerminal
          ref={terminalRef}
          processId="proc-123"
          isConnected={false}
          totalBytes={2048}
          colorMode="dark"
          data-testid="disconnected-chat-terminal"
        />
      </div>
    );
  },
};

// ============================================================================
// Color Modes
// ============================================================================

/**
 * Light mode ChatTerminal.
 */
export const LightMode: Story = {
  render: () => {
    const terminalRef = useRef<ChatTerminalHandle>(null);

    const content = `\x1b[1mLight Theme ChatTerminal\x1b[0m

$ echo "Hello from light mode!"
Hello from light mode!
$ `;

    return (
      <div className="h-[400px] w-full bg-white">
        <ChatTerminal
          ref={terminalRef}
          processId={null}
          initialContent={content}
          colorMode="light"
          data-testid="light-chat-terminal"
        />
      </div>
    );
  },
};

/**
 * Side-by-side dark and light modes.
 */
export const ThemeComparison: Story = {
  render: () => {
    const darkRef = useRef<ChatTerminalHandle>(null);
    const lightRef = useRef<ChatTerminalHandle>(null);

    const content = `\x1b[1;36mClaude Code Session\x1b[0m

\x1b[32m$\x1b[0m npm run build
\x1b[90m> building...\x1b[0m
\x1b[32m✓\x1b[0m Build completed
`;

    return (
      <div className="flex h-[400px] gap-4 p-4 bg-[rgb(var(--muted))]">
        <div className="flex-1 overflow-hidden rounded-lg border border-[rgb(var(--border))]">
          <ChatTerminal
            ref={darkRef}
            processId={null}
            initialContent={content}
            colorMode="dark"
            aria-label="Dark mode terminal"
          />
        </div>
        <div className="flex-1 overflow-hidden rounded-lg border border-[rgb(var(--border))]">
          <ChatTerminal
            ref={lightRef}
            processId={null}
            initialContent={content}
            colorMode="light"
            aria-label="Light mode terminal"
          />
        </div>
      </div>
    );
  },
};

// ============================================================================
// Imperative Handle
// ============================================================================

/**
 * Using the imperative handle for programmatic control.
 */
export const ImperativeHandle: Story = {
  render: () => {
    const terminalRef = useRef<ChatTerminalHandle>(null);

    const handleWrite = () => {
      terminalRef.current?.write('Hello from imperative write!\r\n');
    };

    const handleClear = () => {
      terminalRef.current?.clear();
    };

    const handleFocus = () => {
      terminalRef.current?.focus();
    };

    return (
      <div className="flex h-[400px] flex-col bg-[rgb(var(--background))]">
        <div className="flex items-center gap-4 border-b border-[rgb(var(--border))] p-4">
          <button
            type="button"
            onClick={handleWrite}
            className="rounded bg-secondary px-3 py-1 text-sm"
          >
            Write
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded bg-secondary px-3 py-1 text-sm"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleFocus}
            className="rounded bg-secondary px-3 py-1 text-sm"
          >
            Focus
          </button>
        </div>
        <div className="flex-1">
          <ChatTerminal
            ref={terminalRef}
            processId={null}
            colorMode="dark"
            data-testid="imperative-chat-terminal"
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
 * Reference for all exported constants.
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">CSS Class Constants</h3>
        <pre className="text-xs bg-muted p-4 rounded overflow-auto">
          {`CHAT_TERMINAL_BASE_CLASSES: "${CHAT_TERMINAL_BASE_CLASSES}"

CHAT_TERMINAL_STATUS_CLASSES: "${CHAT_TERMINAL_STATUS_CLASSES}"

CHAT_TERMINAL_CONNECTED_DOT_CLASSES: "${CHAT_TERMINAL_CONNECTED_DOT_CLASSES}"

CHAT_TERMINAL_DISCONNECTED_DOT_CLASSES: "${CHAT_TERMINAL_DISCONNECTED_DOT_CLASSES}"

CHAT_TERMINAL_IDLE_DOT_CLASSES: "${CHAT_TERMINAL_IDLE_DOT_CLASSES}"

CHAT_TERMINAL_BYTES_CLASSES: "${CHAT_TERMINAL_BYTES_CLASSES}"`}
        </pre>
      </div>
    </div>
  ),
};
