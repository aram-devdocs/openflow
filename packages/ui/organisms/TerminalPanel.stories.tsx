import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import { TerminalPanel } from './TerminalPanel';

const meta: Meta<typeof TerminalPanel> = {
  title: 'Organisms/TerminalPanel',
  component: TerminalPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A slide-up terminal panel for the dashboard. Integrates with process input/output and provides xterm.js terminal emulation with loading, running, and stopped states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the panel is visible',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the terminal is loading',
    },
    isRunning: {
      control: 'boolean',
      description: 'Whether the process is running',
    },
    colorMode: {
      control: 'radio',
      options: ['dark', 'light'],
      description: 'Terminal color mode',
    },
    title: {
      control: 'text',
      description: 'Panel title',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TerminalPanel>;

/**
 * Default terminal panel with simulated output.
 */
export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [output, setOutput] = useState(
      '$ echo "Welcome to OpenFlow Terminal"\nWelcome to OpenFlow Terminal\n$ '
    );
    const inputBuffer = useRef('');

    const handleInput = useCallback((data: string) => {
      if (data === '\r') {
        const command = inputBuffer.current;
        inputBuffer.current = '';
        setOutput((prev) => `${prev}\r\n$ `);
        if (command) {
          setOutput(
            (prev) => `${prev.slice(0, -2)}${command}\r\nCommand executed: ${command}\r\n$ `
          );
        }
      } else if (data === '\x7f') {
        // Backspace
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = inputBuffer.current.slice(0, -1);
          setOutput((prev) => prev.slice(0, -1));
        }
      } else if (data >= ' ') {
        inputBuffer.current += data;
        setOutput((prev) => prev + data);
      }
    }, []);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Terminal</Button>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="process-123"
          rawOutput={output}
          onInput={handleInput}
          onResize={(cols, rows) => console.log(`Resized to ${cols}x${rows}`)}
          isRunning={true}
        />
      </div>
    );
  },
};

/**
 * Terminal in loading state.
 */
export const Loading: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Terminal</Button>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId={null}
          rawOutput=""
          onInput={() => {}}
          isLoading={true}
        />
      </div>
    );
  },
};

/**
 * Terminal with no active session.
 */
export const NoSession: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Terminal</Button>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId={null}
          rawOutput=""
          onInput={() => {}}
        />
      </div>
    );
  },
};

/**
 * Terminal with stopped process.
 */
export const Stopped: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Terminal</Button>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="process-456"
          rawOutput="$ npm run build\n\n> openflow@1.0.0 build\n> tsc && vite build\n\n\x1b[32m✓ Build completed successfully\x1b[0m\n\nProcess exited with code 0\n"
          onInput={() => {}}
          isRunning={false}
        />
      </div>
    );
  },
};

/**
 * Light mode terminal.
 */
export const LightMode: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [output] = useState(
      '$ git status\n\x1b[32mOn branch main\x1b[0m\nYour branch is up to date.\n\n$ '
    );

    return (
      <div className="h-screen bg-white">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Terminal</Button>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="process-789"
          rawOutput={output}
          onInput={() => {}}
          colorMode="light"
        />
      </div>
    );
  },
};

/**
 * Terminal with custom title.
 */
export const CustomTitle: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Terminal</Button>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="dev-server"
          rawOutput="Starting development server...\n\n\x1b[36m➜\x1b[0m  Local:   \x1b[32mhttp://localhost:5173/\x1b[0m\n\x1b[36m➜\x1b[0m  Network: \x1b[32mhttp://192.168.1.100:5173/\x1b[0m\n"
          onInput={() => {}}
          title="Development Server"
          isRunning={true}
        />
      </div>
    );
  },
};

/**
 * Streaming output simulation.
 */
export const StreamingOutput: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [output, setOutput] = useState('$ npm install\n');

    useEffect(() => {
      if (!isOpen) return;

      const lines = [
        '\nadded 1247 packages in 12s\n',
        '\n\x1b[32m✓\x1b[0m Installing dependencies...\n',
        '\x1b[32m✓\x1b[0m Building TypeScript...\n',
        '\x1b[32m✓\x1b[0m Generating types...\n',
        '\x1b[32m✓\x1b[0m All tasks completed!\n',
        '\n$ ',
      ];

      let index = 0;
      const interval = setInterval(() => {
        if (index < lines.length) {
          setOutput((prev) => prev + lines[index]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 800);

      return () => clearInterval(interval);
    }, [isOpen]);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button
            onClick={() => {
              setIsOpen(true);
              setOutput('$ npm install\n');
            }}
          >
            Open Terminal
          </Button>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="npm-install"
          rawOutput={output}
          onInput={() => {}}
          isRunning={true}
        />
      </div>
    );
  },
};
