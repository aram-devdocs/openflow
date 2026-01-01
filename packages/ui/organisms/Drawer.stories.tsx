import type { Meta, StoryObj } from '@storybook/react';
import { Folder, Home, MessageCircle, Settings, Users } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import {
  DEFAULT_ARIA_LABEL,
  DEFAULT_CLOSE_LABEL,
  DRAWER_POSITION_CLASSES,
  DRAWER_SIZE_CLASSES,
  Drawer,
  SR_DRAWER_CLOSED,
  SR_DRAWER_OPENED,
} from './Drawer';

const meta: Meta<typeof Drawer> = {
  title: 'Organisms/Drawer',
  component: Drawer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A slide-in navigation panel for mobile screens with comprehensive accessibility support.

## Accessibility Features

- **Focus Management**: Focus is trapped within the drawer when open
- **Focus Restoration**: Focus returns to the trigger element on close
- **Keyboard Support**: Escape key closes the drawer (configurable)
- **Screen Reader Support**: ARIA modal pattern with proper labels and announcements
- **Touch Target**: Close button meets 44px minimum (WCAG 2.5.5)
- **Reduced Motion**: Animations respect prefers-reduced-motion
- **Reduced Transparency**: Backdrop adapts to prefers-reduced-transparency

## Responsive Sizing

Supports responsive values for size:
\`\`\`tsx
<Drawer size={{ base: 'sm', md: 'lg' }} ... />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the drawer is open',
    },
    position: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Which side the drawer slides in from',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the drawer (supports responsive values)',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessible label for the drawer',
    },
    closeOnBackdropClick: {
      control: 'boolean',
      description: 'Whether clicking backdrop closes the drawer',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Whether Escape key closes the drawer',
    },
    closeLabel: {
      control: 'text',
      description: 'Accessible label for close button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Drawer>;

// ============================================================================
// Helper Components
// ============================================================================

/** Sample navigation content for the drawer */
function SampleNavigation() {
  const navItems = [
    { icon: Home, label: 'Home', href: '#' },
    { icon: Folder, label: 'Projects', href: '#' },
    { icon: MessageCircle, label: 'Chats', href: '#' },
    { icon: Users, label: 'Team', href: '#' },
    { icon: Settings, label: 'Settings', href: '#' },
  ];

  return (
    <nav className="flex h-full flex-col p-4" aria-label="Main navigation">
      <div className="mb-6 pt-12">
        <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">OpenFlow</h2>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">AI Task Orchestration</p>
      </div>

      <ul className="space-y-1" role="list">
        {navItems.map((item) => (
          <li key={item.label} role="listitem">
            <a
              href={item.href}
              className="flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2 text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-1))] transition-colors focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2"
            >
              <Icon icon={item.icon} size="sm" className="text-[rgb(var(--muted-foreground))]" />
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-auto border-t border-[rgb(var(--border))] pt-4">
        <p className="text-xs text-[rgb(var(--muted-foreground))]">
          Press Escape or click outside to close
        </p>
      </div>
    </nav>
  );
}

/** Interactive drawer demo wrapper */
function DrawerDemo(
  props: Omit<React.ComponentProps<typeof Drawer>, 'isOpen' | 'onClose' | 'children'>
) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setIsOpen(true)}>
        Open {props.position === 'right' ? 'Right' : 'Left'} Drawer
      </Button>
      <p className="mt-4 text-sm text-[rgb(var(--muted-foreground))]">
        Drawer opens from the {props.position === 'right' ? 'right' : 'left'} side. Click outside,
        press Escape, or click the X button to close.
      </p>
      <Drawer {...props} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <SampleNavigation />
      </Drawer>
    </div>
  );
}

// ============================================================================
// Basic Stories
// ============================================================================

/** Default left-side drawer */
export const Default: Story = {
  render: () => <DrawerDemo position="left" aria-label="Navigation menu" data-testid="drawer" />,
};

/** Right-side drawer */
export const RightPosition: Story = {
  render: () => <DrawerDemo position="right" aria-label="Side panel" data-testid="drawer" />,
};

// ============================================================================
// Size Variants
// ============================================================================

/** Small drawer (240px width) */
export const SizeSmall: Story = {
  render: () => (
    <DrawerDemo position="left" size="sm" aria-label="Compact navigation" data-testid="drawer" />
  ),
};

/** Medium drawer (default, 288px width) */
export const SizeMedium: Story = {
  render: () => (
    <DrawerDemo position="left" size="md" aria-label="Navigation menu" data-testid="drawer" />
  ),
};

/** Large drawer (320px width) */
export const SizeLarge: Story = {
  render: () => (
    <DrawerDemo position="left" size="lg" aria-label="Wide navigation" data-testid="drawer" />
  ),
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    const widths = { sm: '240px', md: '288px', lg: '320px' };

    return (
      <div className="p-8">
        <h2 className="text-lg font-semibold mb-4">Drawer Size Variants</h2>
        <div className="flex flex-wrap gap-4">
          {sizes.map((size) => {
            const [isOpen, setIsOpen] = useState(false);
            return (
              <div key={size}>
                <Button onClick={() => setIsOpen(true)}>
                  {size.toUpperCase()} ({widths[size]})
                </Button>
                <Drawer
                  isOpen={isOpen}
                  onClose={() => setIsOpen(false)}
                  position="left"
                  size={size}
                  aria-label={`${size.toUpperCase()} navigation`}
                  data-testid={`drawer-${size}`}
                >
                  <div className="p-6 pt-16">
                    <h3 className="font-semibold">Size: {size.toUpperCase()}</h3>
                    <p className="text-sm text-[rgb(var(--muted-foreground))] mt-2">
                      Width: {widths[size]}
                    </p>
                  </div>
                </Drawer>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
};

/** Responsive sizing */
export const ResponsiveSizing: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <Button onClick={() => setIsOpen(true)}>Open Responsive Drawer</Button>
        <p className="mt-4 text-sm text-[rgb(var(--muted-foreground))]">
          This drawer uses responsive sizing: small on mobile, medium on tablet, large on desktop.
        </p>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position="left"
          size={{ base: 'sm', md: 'md', lg: 'lg' }}
          aria-label="Responsive navigation"
          data-testid="drawer"
        >
          <div className="p-6 pt-16">
            <h3 className="font-semibold">Responsive Drawer</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mt-2">
              Width changes based on viewport:
            </p>
            <ul className="text-sm text-[rgb(var(--muted-foreground))] mt-2 list-disc list-inside">
              <li>Mobile: Small (240px)</li>
              <li>Tablet: Medium (288px)</li>
              <li>Desktop: Large (320px)</li>
            </ul>
          </div>
        </Drawer>
      </div>
    );
  },
};

// ============================================================================
// Configuration Options
// ============================================================================

/** Drawer with backdrop click disabled */
export const NoBackdropClose: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <Button onClick={() => setIsOpen(true)}>Open Drawer (No Backdrop Close)</Button>
        <p className="mt-4 text-sm text-[rgb(var(--muted-foreground))]">
          Backdrop click is disabled. Use Escape or the close button.
        </p>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position="left"
          closeOnBackdropClick={false}
          aria-label="Navigation menu"
          data-testid="drawer"
        >
          <div className="p-6 pt-16">
            <h3 className="font-semibold">Backdrop Click Disabled</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mt-2">
              You must use Escape or the X button to close this drawer.
            </p>
          </div>
        </Drawer>
      </div>
    );
  },
};

/** Drawer with Escape disabled */
export const NoEscapeClose: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <Button onClick={() => setIsOpen(true)}>Open Drawer (No Escape Close)</Button>
        <p className="mt-4 text-sm text-[rgb(var(--muted-foreground))]">
          Escape key is disabled. Use backdrop click or the close button.
        </p>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position="left"
          closeOnEscape={false}
          aria-label="Navigation menu"
          data-testid="drawer"
        >
          <div className="p-6 pt-16">
            <h3 className="font-semibold">Escape Key Disabled</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mt-2">
              The Escape key won't close this drawer.
            </p>
          </div>
        </Drawer>
      </div>
    );
  },
};

/** Custom close label */
export const CustomCloseLabel: Story = {
  render: () => (
    <DrawerDemo
      position="left"
      closeLabel="Dismiss menu"
      aria-label="Navigation menu"
      data-testid="drawer"
    />
  ),
};

// ============================================================================
// Content Variations
// ============================================================================

/** Drawer with custom content */
export const CustomContent: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <Button onClick={() => setIsOpen(true)}>Open Settings Panel</Button>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position="right"
          size="lg"
          aria-label="Settings panel"
          data-testid="drawer"
        >
          <div className="p-6 pt-16">
            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Settings</h2>
            <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
              Configure your application settings here.
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[rgb(var(--surface-1))]">
                <div>
                  <span className="text-sm font-medium text-[rgb(var(--foreground))]">Theme</span>
                  <p className="text-xs text-[rgb(var(--muted-foreground))]">System default</p>
                </div>
                <Button variant="secondary" size="sm">
                  Change
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[rgb(var(--surface-1))]">
                <div>
                  <span className="text-sm font-medium text-[rgb(var(--foreground))]">
                    Notifications
                  </span>
                  <p className="text-xs text-[rgb(var(--muted-foreground))]">Enabled</p>
                </div>
                <Button variant="secondary" size="sm">
                  Manage
                </Button>
              </div>
            </div>
          </div>
        </Drawer>
      </div>
    );
  },
};

/** Both positions side by side */
export const BothPositions: Story = {
  render: () => {
    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);

    return (
      <div className="flex gap-4 p-8">
        <Button onClick={() => setLeftOpen(true)}>Open Left</Button>
        <Button onClick={() => setRightOpen(true)}>Open Right</Button>

        <Drawer
          isOpen={leftOpen}
          onClose={() => setLeftOpen(false)}
          position="left"
          aria-label="Left navigation"
          data-testid="drawer-left"
        >
          <SampleNavigation />
        </Drawer>

        <Drawer
          isOpen={rightOpen}
          onClose={() => setRightOpen(false)}
          position="right"
          aria-label="Right panel"
          data-testid="drawer-right"
        >
          <div className="p-6 pt-16">
            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Right Panel</h2>
            <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
              This drawer slides in from the right side.
            </p>
          </div>
        </Drawer>
      </div>
    );
  },
};

// ============================================================================
// Accessibility Demonstrations
// ============================================================================

/** Focus trap demonstration */
export const FocusTrapDemo: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <div className="space-y-4">
          <Button onClick={() => setIsOpen(true)}>Open Drawer</Button>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Tab through the elements in the drawer. Focus stays trapped within.
          </p>
        </div>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          aria-label="Focus trap demo"
          data-testid="drawer"
        >
          <div className="p-6 pt-16">
            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Focus Trap Demo</h2>
            <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
              Press Tab to cycle through these buttons. Focus wraps when reaching the end.
            </p>
            <div className="mt-4 space-y-2">
              <Button variant="secondary" className="w-full">
                First Button
              </Button>
              <Button variant="secondary" className="w-full">
                Second Button
              </Button>
              <Button variant="secondary" className="w-full">
                Third Button
              </Button>
              <Button variant="secondary" className="w-full">
                Fourth Button
              </Button>
            </div>
          </div>
        </Drawer>
      </div>
    );
  },
};

/** Touch target accessibility */
export const TouchTargetDemo: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <Button onClick={() => setIsOpen(true)}>Open Drawer</Button>
        <p className="mt-4 text-sm text-[rgb(var(--muted-foreground))]">
          Close button meets WCAG 2.5.5 minimum 44x44px touch target.
        </p>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          aria-label="Touch target demo"
          data-testid="drawer"
        >
          <div className="p-6 pt-16">
            <h3 className="font-semibold">Touch Target Compliance</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mt-2">
              The close button in the top-right corner has a minimum touch target of 44x44 pixels,
              meeting WCAG 2.5.5 requirements for touch accessibility.
            </p>
          </div>
        </Drawer>
      </div>
    );
  },
};

/** Screen reader accessibility */
export const ScreenReaderDemo: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <h2 className="text-lg font-semibold mb-4">Screen Reader Features</h2>
        <div className="space-y-4">
          <Button onClick={() => setIsOpen(true)}>Open Drawer</Button>
          <div className="rounded-lg border border-[rgb(var(--border))] p-4">
            <h3 className="font-medium text-[rgb(var(--foreground))]">
              Screen Reader Announcements
            </h3>
            <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
              <li>Opening announces: "{SR_DRAWER_OPENED}"</li>
              <li>Closing announces: "{SR_DRAWER_CLOSED}"</li>
              <li>role="dialog" for modal semantics</li>
              <li>aria-modal="true" for focus management</li>
              <li>aria-label for drawer purpose</li>
              <li>Close button has aria-label</li>
            </ul>
          </div>
        </div>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          aria-label="Main navigation"
          closeLabel="Close navigation drawer"
          data-testid="drawer"
        >
          <SampleNavigation />
        </Drawer>
      </div>
    );
  },
};

/** Keyboard navigation */
export const KeyboardNavigationDemo: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <h2 className="text-lg font-semibold mb-4">Keyboard Navigation</h2>
        <div className="space-y-4">
          <Button onClick={() => setIsOpen(true)}>Open Drawer</Button>
          <div className="rounded-lg border border-[rgb(var(--border))] p-4">
            <h3 className="font-medium text-[rgb(var(--foreground))]">Keyboard Shortcuts</h3>
            <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
              <li>
                <kbd className="px-1 rounded bg-[rgb(var(--surface-1))]">Escape</kbd> - Close drawer
              </li>
              <li>
                <kbd className="px-1 rounded bg-[rgb(var(--surface-1))]">Tab</kbd> - Move focus
                forward
              </li>
              <li>
                <kbd className="px-1 rounded bg-[rgb(var(--surface-1))]">Shift+Tab</kbd> - Move
                focus backward
              </li>
              <li>Focus wraps within drawer (focus trap)</li>
            </ul>
          </div>
        </div>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          aria-label="Keyboard demo"
          data-testid="drawer"
        >
          <SampleNavigation />
        </Drawer>
      </div>
    );
  },
};

/** Reduced motion demo */
export const ReducedMotionDemo: Story = {
  render: () => (
    <div className="p-8">
      <h2 className="text-lg font-semibold mb-4">Reduced Motion Support</h2>
      <p className="text-sm text-[rgb(var(--muted-foreground))] mb-4">
        When "Reduce Motion" is enabled in system preferences, drawer animations are disabled.
      </p>
      <DrawerDemo position="left" aria-label="Reduced motion demo" data-testid="drawer" />
      <div className="mt-4 rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">motion-safe Classes Used:</h3>
        <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
          <li>motion-safe:transition-opacity</li>
          <li>motion-safe:transition-transform</li>
          <li>motion-safe:duration-200</li>
        </ul>
      </div>
    </div>
  ),
};

/** Focus ring visibility */
export const FocusRingDemo: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <h2 className="text-lg font-semibold mb-4">Focus Ring Visibility</h2>
        <p className="text-sm text-[rgb(var(--muted-foreground))] mb-4">
          All interactive elements show visible focus rings with offset for visibility on all
          backgrounds.
        </p>
        <Button onClick={() => setIsOpen(true)}>Open Drawer</Button>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          aria-label="Focus ring demo"
          data-testid="drawer"
        >
          <div className="p-6 pt-16">
            <h3 className="font-semibold">Focus Ring Demo</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mt-2">
              Use Tab to see focus rings on all interactive elements:
            </p>
            <div className="mt-4 space-y-2">
              <Button variant="primary" className="w-full">
                Primary Button
              </Button>
              <Button variant="secondary" className="w-full">
                Secondary Button
              </Button>
              <Button variant="ghost" className="w-full">
                Ghost Button
              </Button>
            </div>
          </div>
        </Drawer>
      </div>
    );
  },
};

// ============================================================================
// Ref Forwarding
// ============================================================================

/** Ref forwarding demonstration */
export const RefForwardingDemo: Story = {
  render: () => {
    const drawerRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

    const handleOpen = () => {
      setIsOpen(true);
      // Use setTimeout to measure after render
      setTimeout(() => {
        if (drawerRef.current) {
          setDimensions({
            width: drawerRef.current.offsetWidth,
            height: drawerRef.current.offsetHeight,
          });
        }
      }, 100);
    };

    return (
      <div className="p-8">
        <h2 className="text-lg font-semibold mb-4">Ref Forwarding</h2>
        <Button onClick={handleOpen}>Open and Measure Drawer</Button>
        {dimensions && (
          <p className="mt-4 text-sm text-[rgb(var(--muted-foreground))]">
            Drawer dimensions: {dimensions.width}px x {dimensions.height}px
          </p>
        )}
        <Drawer
          ref={drawerRef}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          aria-label="Ref forwarding demo"
          data-testid="drawer"
        >
          <div className="p-6 pt-16">
            <h3 className="font-semibold">Ref Forwarding</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mt-2">
              This drawer's ref is forwarded to the panel element for programmatic access.
            </p>
          </div>
        </Drawer>
      </div>
    );
  },
};

/** Data attributes demonstration */
export const DataAttributesDemo: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <h2 className="text-lg font-semibold mb-4">Data Attributes</h2>
        <p className="text-sm text-[rgb(var(--muted-foreground))] mb-4">
          Drawer uses data attributes for testing and CSS styling.
        </p>
        <Button onClick={() => setIsOpen(true)}>Open Drawer</Button>
        <div className="mt-4 rounded-lg border border-[rgb(var(--border))] p-4">
          <h3 className="font-medium text-[rgb(var(--foreground))]">Available Data Attributes:</h3>
          <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
            <li>data-testid="drawer" (on panel)</li>
            <li>data-testid="drawer-container"</li>
            <li>data-testid="drawer-backdrop"</li>
            <li>data-testid="drawer-close-button"</li>
            <li>data-testid="drawer-content"</li>
            <li>data-state="open" | "closed"</li>
            <li>data-position="left" | "right"</li>
            <li>data-size="sm" | "md" | "lg"</li>
          </ul>
        </div>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position="left"
          size="md"
          aria-label="Data attributes demo"
          data-testid="drawer"
        >
          <div className="p-6 pt-16">
            <h3 className="font-semibold">Inspect Element</h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mt-2">
              Open browser DevTools to see data attributes on the drawer elements.
            </p>
          </div>
        </Drawer>
      </div>
    );
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** Mobile header with drawer */
export const MobileHeaderExample: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="min-h-[400px] bg-[rgb(var(--background))]">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] p-2"
            onClick={() => setIsOpen(true)}
            aria-label="Open navigation menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </Button>
          <span className="font-semibold">OpenFlow</span>
          <div className="w-11" /> {/* Spacer for centering */}
        </header>

        <main className="p-4">
          <h1 className="text-xl font-bold mb-4">Dashboard</h1>
          <p className="text-[rgb(var(--muted-foreground))]">
            This demonstrates a typical mobile header with a hamburger menu that opens a navigation
            drawer.
          </p>
        </main>

        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position="left"
          aria-label="Main navigation"
          data-testid="drawer"
        >
          <SampleNavigation />
        </Drawer>
      </div>
    );
  },
};

/** Sidebar toggle */
export const SidebarToggleExample: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="min-h-[400px] bg-[rgb(var(--background))] flex">
        <aside className="hidden md:flex w-64 flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--card))]">
          <SampleNavigation />
        </aside>

        <div className="flex-1">
          <header className="flex h-16 items-center gap-4 border-b border-[rgb(var(--border))] px-4 md:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px] p-2"
              onClick={() => setIsOpen(true)}
              aria-label="Open navigation"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
            <span className="font-semibold">OpenFlow</span>
          </header>

          <main className="p-4">
            <h1 className="text-xl font-bold mb-4">Content Area</h1>
            <p className="text-[rgb(var(--muted-foreground))]">
              On desktop (≥768px), the sidebar is always visible. On mobile, it becomes a drawer.
            </p>
          </main>
        </div>

        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position="left"
          aria-label="Mobile navigation"
          data-testid="drawer"
        >
          <SampleNavigation />
        </Drawer>
      </div>
    );
  },
};

/** Filter panel */
export const FilterPanelExample: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Products</h2>
          <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
            <Icon icon={Settings} size="sm" className="mr-2" aria-hidden="true" />
            Filters
          </Button>
        </div>
        <p className="text-[rgb(var(--muted-foreground))]">
          Right-side drawer is common for filter panels that don't need to be always visible.
        </p>

        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position="right"
          size="lg"
          aria-label="Filter options"
          data-testid="drawer"
        >
          <div className="p-6 pt-16">
            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Filters</h2>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Category</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 min-h-[44px]">
                    <input type="checkbox" className="rounded" />
                    <span>Electronics</span>
                  </label>
                  <label className="flex items-center gap-2 min-h-[44px]">
                    <input type="checkbox" className="rounded" />
                    <span>Clothing</span>
                  </label>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Price Range</h3>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" className="flex-1 p-2 rounded border" />
                  <input type="number" placeholder="Max" className="flex-1 p-2 rounded border" />
                </div>
              </div>
              <Button className="w-full">Apply Filters</Button>
            </div>
          </div>
        </Drawer>
      </div>
    );
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/** Constants and utilities reference */
export const ConstantsReference: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <h2 className="text-lg font-semibold">Drawer Constants & Utilities</h2>

      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium mb-2">Default Labels</h3>
        <ul className="text-sm text-[rgb(var(--muted-foreground))] space-y-1">
          <li>DEFAULT_ARIA_LABEL: "{DEFAULT_ARIA_LABEL}"</li>
          <li>DEFAULT_CLOSE_LABEL: "{DEFAULT_CLOSE_LABEL}"</li>
        </ul>
      </div>

      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium mb-2">Screen Reader Announcements</h3>
        <ul className="text-sm text-[rgb(var(--muted-foreground))] space-y-1">
          <li>SR_DRAWER_OPENED: "{SR_DRAWER_OPENED}"</li>
          <li>SR_DRAWER_CLOSED: "{SR_DRAWER_CLOSED}"</li>
        </ul>
      </div>

      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium mb-2">Size Classes</h3>
        <ul className="text-sm text-[rgb(var(--muted-foreground))] space-y-1">
          {Object.entries(DRAWER_SIZE_CLASSES).map(([size, classes]) => (
            <li key={size}>
              {size}: "{classes}"
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium mb-2">Position Classes</h3>
        <ul className="text-sm text-[rgb(var(--muted-foreground))] space-y-1">
          {Object.entries(DRAWER_POSITION_CLASSES).map(([pos, classes]) => (
            <li key={pos}>
              {pos}: "{classes}"
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium mb-2">Utility Functions</h3>
        <ul className="text-sm text-[rgb(var(--muted-foreground))] space-y-1">
          <li>getBaseSize(size) - Get base size from responsive value</li>
          <li>getResponsiveSizeClasses(size) - Generate responsive width classes</li>
          <li>buildDrawerAccessibleLabel(label, position) - Build accessible label</li>
          <li>getOpenedAnnouncement(label) - Get SR announcement for open</li>
        </ul>
      </div>

      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium mb-2">CSS Class Constants</h3>
        <ul className="text-sm text-[rgb(var(--muted-foreground))] space-y-1">
          <li>DRAWER_CONTAINER_CLASSES</li>
          <li>DRAWER_BACKDROP_CLASSES</li>
          <li>DRAWER_PANEL_BASE_CLASSES</li>
          <li>DRAWER_POSITION_CLASSES</li>
          <li>DRAWER_CLOSE_BUTTON_CONTAINER_CLASSES</li>
          <li>DRAWER_CLOSE_BUTTON_CLASSES</li>
          <li>DRAWER_CONTENT_CLASSES</li>
        </ul>
      </div>
    </div>
  ),
};
