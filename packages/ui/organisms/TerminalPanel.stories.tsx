import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import {
  DEFAULT_CLOSE_LABEL,
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_ERROR_TITLE,
  DEFAULT_LOADING_LABEL,
  DEFAULT_NO_SESSION_LABEL,
  DEFAULT_PANEL_DESCRIPTION,
  // Constants
  DEFAULT_PANEL_TITLE,
  DEFAULT_RETRY_LABEL,
  DEFAULT_RUNNING_LABEL,
  DEFAULT_STOPPED_LABEL,
  SR_ERROR_OCCURRED,
  SR_LOADING,
  SR_NO_SESSION,
  SR_PANEL_CLOSED,
  SR_PANEL_OPENED,
  SR_PROCESS_RUNNING,
  SR_PROCESS_STOPPED,
  TERMINAL_PANEL_HEIGHT_CLASSES,
  TerminalPanel,
  TerminalPanelError,
  TerminalPanelSkeleton,
} from './TerminalPanel';

const meta: Meta<typeof TerminalPanel> = {
  title: 'Organisms/TerminalPanel',
  component: TerminalPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A slide-up terminal panel for the dashboard with full accessibility support.

## Features
- **Loading/Error/Empty States**: Proper handling of all async states
- **Dialog Semantics**: role="dialog" with aria-modal and focus management
- **Keyboard Navigation**: Escape key closes panel (configurable)
- **Screen Reader Support**: VisuallyHidden announcements for state changes
- **Touch Targets**: ≥44px on mobile (WCAG 2.5.5)
- **Responsive Sizing**: sm/md/lg with breakpoint support
- **Reduced Motion**: motion-safe: prefix on all animations

## Accessibility
- role="dialog" with aria-modal="true"
- aria-labelledby points to title
- aria-describedby for description
- Focus management (stores/restores focus)
- Screen reader announcements for:
  - Panel open/close
  - Process status changes
  - Loading/error states
        `,
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
    hasError: {
      control: 'boolean',
      description: 'Whether there is an error',
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
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Panel height size',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TerminalPanel>;

// =============================================================================
// Basic Examples
// =============================================================================

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
          data-testid="terminal-panel"
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
          data-testid="terminal-panel-loading"
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
          data-testid="terminal-panel-no-session"
        />
      </div>
    );
  },
};

/**
 * Terminal with error state.
 */
export const ErrorState: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [hasError, setHasError] = useState(true);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Terminal</Button>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="process-456"
          rawOutput=""
          onInput={() => {}}
          hasError={hasError}
          errorMessage="Connection to terminal server failed. Check your network."
          onRetry={() => {
            setHasError(false);
          }}
          data-testid="terminal-panel-error"
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
          data-testid="terminal-panel-stopped"
        />
      </div>
    );
  },
};

// =============================================================================
// Size Variants
// =============================================================================

/**
 * Small size terminal panel.
 */
export const SizeSmall: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Small Terminal</Button>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="process-sm"
          rawOutput="$ echo 'Small terminal'\nSmall terminal\n$ "
          onInput={() => {}}
          size="sm"
          data-testid="terminal-panel-sm"
        />
      </div>
    );
  },
};

/**
 * Medium size terminal panel (default).
 */
export const SizeMedium: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Medium Terminal</Button>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="process-md"
          rawOutput="$ echo 'Medium terminal'\nMedium terminal\n$ "
          onInput={() => {}}
          size="md"
          data-testid="terminal-panel-md"
        />
      </div>
    );
  },
};

/**
 * Large size terminal panel.
 */
export const SizeLarge: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Large Terminal</Button>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="process-lg"
          rawOutput="$ echo 'Large terminal'\nLarge terminal\n$ "
          onInput={() => {}}
          size="lg"
          data-testid="terminal-panel-lg"
        />
      </div>
    );
  },
};

/**
 * Responsive sizing that changes based on breakpoint.
 */
export const ResponsiveSizing: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Responsive Terminal</Button>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Resize your browser to see the panel change height (sm on mobile, md on tablet, lg on
            desktop)
          </p>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="process-responsive"
          rawOutput="$ echo 'Responsive terminal'\nResponsive terminal\n$ "
          onInput={() => {}}
          size={{ base: 'sm', md: 'md', lg: 'lg' }}
          data-testid="terminal-panel-responsive"
        />
      </div>
    );
  },
};

// =============================================================================
// Color Modes
// =============================================================================

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
          data-testid="terminal-panel-light"
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
          data-testid="terminal-panel-custom-title"
        />
      </div>
    );
  },
};

// =============================================================================
// Interactive Examples
// =============================================================================

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
          data-testid="terminal-panel-streaming"
        />
      </div>
    );
  },
};

/**
 * Interactive terminal with full input handling.
 */
export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [output, setOutput] = useState(
      '$ Welcome to the interactive terminal!\n$ Type commands and press Enter.\n$ '
    );
    const inputBuffer = useRef('');

    const handleInput = useCallback((data: string) => {
      if (data === '\r') {
        const command = inputBuffer.current.trim();
        inputBuffer.current = '';

        if (command === 'help') {
          setOutput(
            (prev) =>
              `${prev}\r\nAvailable commands:\n  help - Show this help\n  date - Show current date\n  clear - Clear terminal\n  exit - Close terminal\n$ `
          );
        } else if (command === 'date') {
          setOutput((prev) => `${prev}\r\n${new Date().toString()}\n$ `);
        } else if (command === 'clear') {
          setOutput('$ ');
        } else if (command === 'exit') {
          setIsOpen(false);
        } else if (command) {
          setOutput((prev) => `${prev}\r\nUnknown command: ${command}\n$ `);
        } else {
          setOutput((prev) => `${prev}\r\n$ `);
        }
      } else if (data === '\x7f') {
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
          <Button onClick={() => setIsOpen(true)}>Open Interactive Terminal</Button>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Try commands: help, date, clear, exit
          </p>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="interactive-session"
          rawOutput={output}
          onInput={handleInput}
          isRunning={true}
          title="Interactive Shell"
          data-testid="terminal-panel-interactive"
        />
      </div>
    );
  },
};

// =============================================================================
// Skeleton & Error Sub-components
// =============================================================================

/**
 * Skeleton loading state component.
 */
export const SkeletonDemo: Story = {
  render: () => (
    <div className="h-screen bg-[hsl(var(--background))]">
      <TerminalPanelSkeleton size="md" lines={5} data-testid="terminal-panel-skeleton" />
    </div>
  ),
};

/**
 * Error state component.
 */
export const ErrorComponent: Story = {
  render: () => (
    <div className="h-screen bg-[hsl(var(--background))]">
      <TerminalPanelError
        size="md"
        title="Connection Failed"
        message="Unable to connect to the terminal server. Please check your network connection and try again."
        onRetry={() => alert('Retry clicked!')}
        retryLabel="Reconnect"
        data-testid="terminal-panel-error-component"
      />
    </div>
  ),
};

/**
 * All skeleton sizes comparison.
 */
export const SkeletonSizes: Story = {
  render: () => (
    <div className="h-screen bg-[hsl(var(--background))] space-y-4 p-4">
      <div>
        <h3 className="mb-2 font-medium">Small</h3>
        <div className="relative h-64">
          <TerminalPanelSkeleton size="sm" lines={3} />
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-medium">Medium</h3>
        <div className="relative h-80">
          <TerminalPanelSkeleton size="md" lines={5} />
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-medium">Large</h3>
        <div className="relative h-96">
          <TerminalPanelSkeleton size="lg" lines={7} />
        </div>
      </div>
    </div>
  ),
};

// =============================================================================
// Accessibility Demos
// =============================================================================

/**
 * Keyboard navigation demo - press Escape to close.
 */
export const KeyboardNavigation: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Terminal</Button>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Press Escape to close the terminal panel
          </p>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="keyboard-demo"
          rawOutput="$ Press Escape to close this panel\n$ "
          onInput={() => {}}
          closeOnEscape={true}
          data-testid="terminal-panel-keyboard"
        />
      </div>
    );
  },
};

/**
 * Demo showing escape key disabled.
 */
export const NoEscapeClose: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Terminal</Button>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Escape key is disabled - use the close button
          </p>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="no-escape-demo"
          rawOutput="$ Escape key disabled - use close button\n$ "
          onInput={() => {}}
          closeOnEscape={false}
          data-testid="terminal-panel-no-escape"
        />
      </div>
    );
  },
};

/**
 * Screen reader accessibility demo.
 */
export const ScreenReaderAccessibility: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [status, setStatus] = useState<'loading' | 'running' | 'stopped' | 'error'>('loading');

    useEffect(() => {
      if (!isOpen) return;

      // Simulate status changes
      const timer1 = setTimeout(() => setStatus('running'), 2000);
      const timer2 = setTimeout(() => setStatus('stopped'), 5000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }, [isOpen]);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button
            onClick={() => {
              setIsOpen(true);
              setStatus('loading');
            }}
          >
            Open Terminal
          </Button>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Screen readers will announce: panel open/close, loading, running, stopped states
          </p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Current status: {status}
          </p>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId={status !== 'loading' ? 'sr-demo' : null}
          rawOutput={
            status === 'running'
              ? '$ Process running...\n'
              : status === 'stopped'
                ? '$ Process completed.\n'
                : ''
          }
          onInput={() => {}}
          isLoading={status === 'loading'}
          isRunning={status === 'running'}
          hasError={status === 'error'}
          data-testid="terminal-panel-sr"
        />
      </div>
    );
  },
};

/**
 * Touch target accessibility demo.
 */
export const TouchTargetAccessibility: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Terminal</Button>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Close button has 44x44px touch target on mobile (WCAG 2.5.5)
          </p>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="touch-demo"
          rawOutput="$ Touch target demo\n$ "
          onInput={() => {}}
          data-testid="terminal-panel-touch"
        />
      </div>
    );
  },
};

/**
 * Focus ring visibility demo.
 */
export const FocusRingVisibility: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Terminal</Button>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Tab to see focus ring with ring-offset for visibility on all backgrounds
          </p>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="focus-demo"
          rawOutput="$ Focus ring demo\n$ "
          onInput={() => {}}
          data-testid="terminal-panel-focus"
        />
      </div>
    );
  },
};

/**
 * Reduced motion demo.
 */
export const ReducedMotion: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Terminal</Button>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Animations use motion-safe: prefix and respect prefers-reduced-motion
          </p>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="motion-demo"
          rawOutput="$ Reduced motion demo\n$ "
          onInput={() => {}}
          data-testid="terminal-panel-motion"
        />
      </div>
    );
  },
};

// =============================================================================
// Ref Forwarding & Data Attributes
// =============================================================================

/**
 * Ref forwarding demo.
 */
export const RefForwarding: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const panelRef = useRef<HTMLDivElement>(null);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4 space-x-2">
          <Button onClick={() => setIsOpen(true)}>Open Terminal</Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (panelRef.current) {
                alert(`Panel height: ${panelRef.current.offsetHeight}px`);
              }
            }}
          >
            Get Panel Height
          </Button>
        </div>
        <TerminalPanel
          ref={panelRef}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="ref-demo"
          rawOutput="$ Ref forwarding demo\n$ "
          onInput={() => {}}
          data-testid="terminal-panel-ref"
        />
      </div>
    );
  },
};

/**
 * Data attributes demo.
 */
export const DataAttributes: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Terminal</Button>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Inspect element to see data-* attributes: data-state, data-size, data-process-id,
            data-running, data-loading, data-error
          </p>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="data-attrs-demo"
          rawOutput="$ Data attributes demo\n$ "
          onInput={() => {}}
          isRunning={true}
          size="md"
          data-testid="terminal-panel-data-attrs"
        />
      </div>
    );
  },
};

// =============================================================================
// Real-World Examples
// =============================================================================

/**
 * Development server panel.
 */
export const DevServerPanel: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [output, setOutput] = useState('');

    useEffect(() => {
      if (!isOpen) return;

      const lines = [
        '$ pnpm dev\n',
        '\n',
        '> openflow@1.0.0 dev\n',
        '> tauri dev\n',
        '\n',
        '   VITE v5.0.0  ready in 234 ms\n',
        '\n',
        '   ➜  Local:   http://localhost:5173/\n',
        '   ➜  Network: http://192.168.1.100:5173/\n',
        '\n',
        '   Tauri  running dev server...\n',
        '   Tauri  building app...\n',
        '   ✓  App built in 12.5s\n',
      ];

      let index = 0;
      const interval = setInterval(() => {
        if (index < lines.length) {
          setOutput((prev) => prev + lines[index]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 200);

      return () => clearInterval(interval);
    }, [isOpen]);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button
            onClick={() => {
              setIsOpen(true);
              setOutput('');
            }}
          >
            Start Dev Server
          </Button>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="dev-server"
          rawOutput={output}
          onInput={() => {}}
          isRunning={true}
          title="Development Server"
          size="lg"
          data-testid="terminal-panel-dev-server"
        />
      </div>
    );
  },
};

/**
 * Build process with completion.
 */
export const BuildProcess: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(true);

    useEffect(() => {
      if (!isOpen) return;

      const lines = [
        '$ pnpm build\n',
        '\n',
        '> openflow@1.0.0 build\n',
        '> tsc && vite build\n',
        '\n',
        'vite v5.0.0 building for production...\n',
        '✓ 234 modules transformed.\n',
        'dist/index.html                  0.45 kB │ gzip: 0.29 kB\n',
        'dist/assets/index-d526a0c5.js    145.67 kB │ gzip: 46.78 kB\n',
        '\n',
        '✓ Built in 4.23s\n',
      ];

      let index = 0;
      const interval = setInterval(() => {
        if (index < lines.length) {
          setOutput((prev) => prev + lines[index]);
          index++;
        } else {
          clearInterval(interval);
          setIsRunning(false);
        }
      }, 300);

      return () => clearInterval(interval);
    }, [isOpen]);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button
            onClick={() => {
              setIsOpen(true);
              setOutput('');
              setIsRunning(true);
            }}
          >
            Run Build
          </Button>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="build-process"
          rawOutput={output}
          onInput={() => {}}
          isRunning={isRunning}
          title="Build"
          data-testid="terminal-panel-build"
        />
      </div>
    );
  },
};

/**
 * Git operations panel.
 */
export const GitOperations: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="h-screen bg-[hsl(var(--background))]">
        <div className="p-4">
          <Button onClick={() => setIsOpen(true)}>Open Git Terminal</Button>
        </div>
        <TerminalPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          processId="git-ops"
          rawOutput={`$ git status
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        \x1b[31mmodified:   src/App.tsx\x1b[0m
        \x1b[31mmodified:   src/components/Terminal.tsx\x1b[0m

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        \x1b[31msrc/new-feature/\x1b[0m

no changes added to commit (use "git add" and/or "git commit -a")
$ `}
          onInput={() => {}}
          isRunning={true}
          title="Git"
          colorMode="dark"
          data-testid="terminal-panel-git"
        />
      </div>
    );
  },
};

// =============================================================================
// Constants Reference
// =============================================================================

/**
 * Reference for all exported constants.
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="p-8 max-w-4xl space-y-8">
      <section>
        <h2 className="text-xl font-bold mb-4">Default Labels</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm font-mono">
          <dt className="font-semibold">DEFAULT_PANEL_TITLE</dt>
          <dd>"{DEFAULT_PANEL_TITLE}"</dd>
          <dt className="font-semibold">DEFAULT_PANEL_DESCRIPTION</dt>
          <dd>"{DEFAULT_PANEL_DESCRIPTION}"</dd>
          <dt className="font-semibold">DEFAULT_CLOSE_LABEL</dt>
          <dd>"{DEFAULT_CLOSE_LABEL}"</dd>
          <dt className="font-semibold">DEFAULT_LOADING_LABEL</dt>
          <dd>"{DEFAULT_LOADING_LABEL}"</dd>
          <dt className="font-semibold">DEFAULT_RUNNING_LABEL</dt>
          <dd>"{DEFAULT_RUNNING_LABEL}"</dd>
          <dt className="font-semibold">DEFAULT_STOPPED_LABEL</dt>
          <dd>"{DEFAULT_STOPPED_LABEL}"</dd>
          <dt className="font-semibold">DEFAULT_NO_SESSION_LABEL</dt>
          <dd>"{DEFAULT_NO_SESSION_LABEL}"</dd>
        </dl>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Error Labels</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm font-mono">
          <dt className="font-semibold">DEFAULT_ERROR_TITLE</dt>
          <dd>"{DEFAULT_ERROR_TITLE}"</dd>
          <dt className="font-semibold">DEFAULT_ERROR_MESSAGE</dt>
          <dd>"{DEFAULT_ERROR_MESSAGE}"</dd>
          <dt className="font-semibold">DEFAULT_RETRY_LABEL</dt>
          <dd>"{DEFAULT_RETRY_LABEL}"</dd>
        </dl>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Screen Reader Announcements</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm font-mono">
          <dt className="font-semibold">SR_PANEL_OPENED</dt>
          <dd>"{SR_PANEL_OPENED}"</dd>
          <dt className="font-semibold">SR_PANEL_CLOSED</dt>
          <dd>"{SR_PANEL_CLOSED}"</dd>
          <dt className="font-semibold">SR_PROCESS_RUNNING</dt>
          <dd>"{SR_PROCESS_RUNNING}"</dd>
          <dt className="font-semibold">SR_PROCESS_STOPPED</dt>
          <dd>"{SR_PROCESS_STOPPED}"</dd>
          <dt className="font-semibold">SR_LOADING</dt>
          <dd>"{SR_LOADING}"</dd>
          <dt className="font-semibold">SR_NO_SESSION</dt>
          <dd>"{SR_NO_SESSION}"</dd>
          <dt className="font-semibold">SR_ERROR_OCCURRED</dt>
          <dd>"{SR_ERROR_OCCURRED}"</dd>
        </dl>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Height Classes</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm font-mono">
          {Object.entries(TERMINAL_PANEL_HEIGHT_CLASSES).map(([size, classes]) => (
            <div key={size} className="contents">
              <dt className="font-semibold">{size}</dt>
              <dd>{classes}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Utility Functions</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <code className="font-mono">getBaseSize(size)</code> - Get base size from responsive
            value
          </li>
          <li>
            <code className="font-mono">getResponsiveSizeClasses(size, classMap)</code> - Generate
            responsive size classes
          </li>
          <li>
            <code className="font-mono">
              buildPanelAccessibleLabel(title, processId, isRunning)
            </code>{' '}
            - Build accessible label
          </li>
          <li>
            <code className="font-mono">
              buildStatusAnnouncement(isRunning, isLoading, hasError, processId)
            </code>{' '}
            - Build status announcement
          </li>
          <li>
            <code className="font-mono">
              getStatusDisplay(isRunning, runningLabel, stoppedLabel)
            </code>{' '}
            - Get status display info
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">CSS Class Constants</h2>
        <ul className="space-y-1 text-sm font-mono">
          <li>TERMINAL_PANEL_BASE_CLASSES</li>
          <li>TERMINAL_PANEL_ANIMATION_CLASSES</li>
          <li>TERMINAL_PANEL_HEADER_CLASSES</li>
          <li>TERMINAL_PANEL_CLOSE_BUTTON_CLASSES</li>
          <li>TERMINAL_PANEL_CONTENT_CLASSES</li>
          <li>TERMINAL_PANEL_LOADING_CLASSES</li>
          <li>TERMINAL_PANEL_NO_SESSION_CLASSES</li>
          <li>TERMINAL_PANEL_SKELETON_BASE_CLASSES</li>
          <li>TERMINAL_PANEL_ERROR_BASE_CLASSES</li>
        </ul>
      </section>
    </div>
  ),
};
