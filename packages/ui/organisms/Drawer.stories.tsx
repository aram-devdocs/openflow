import type { Meta, StoryObj } from '@storybook/react';
import { Folder, Home, Settings } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Drawer } from './Drawer';

const meta: Meta<typeof Drawer> = {
  title: 'Organisms/Drawer',
  component: Drawer,
  parameters: {
    layout: 'fullscreen',
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
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for the drawer',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Drawer>;

/** Sample navigation content for the drawer */
function SampleNavigation() {
  const navItems = [
    { icon: Home, label: 'Home', href: '#' },
    { icon: Folder, label: 'Projects', href: '#' },
    { icon: Settings, label: 'Settings', href: '#' },
  ];

  return (
    <nav className="flex h-full flex-col p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">OpenFlow</h2>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">AI Task Orchestration</p>
      </div>

      <ul className="space-y-1">
        {navItems.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-1))] transition-colors"
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

/** Default left-side drawer */
export const Default: Story = {
  render: () => <DrawerDemo position="left" ariaLabel="Navigation menu" />,
};

/** Right-side drawer */
export const RightPosition: Story = {
  render: () => <DrawerDemo position="right" ariaLabel="Navigation menu" />,
};

/** Drawer with custom content */
export const CustomContent: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <Button onClick={() => setIsOpen(true)}>Open Settings Drawer</Button>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          position="right"
          ariaLabel="Settings panel"
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Settings</h2>
            <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
              Configure your application settings here.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <span className="text-sm font-medium text-[rgb(var(--foreground))]">Theme</span>
                <p className="text-xs text-[rgb(var(--muted-foreground))]">System default</p>
              </div>
              <div>
                <span className="text-sm font-medium text-[rgb(var(--foreground))]">
                  Notifications
                </span>
                <p className="text-xs text-[rgb(var(--muted-foreground))]">Enabled</p>
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
          ariaLabel="Left navigation"
        >
          <SampleNavigation />
        </Drawer>

        <Drawer
          isOpen={rightOpen}
          onClose={() => setRightOpen(false)}
          position="right"
          ariaLabel="Right panel"
        >
          <div className="p-6">
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

/** Accessibility features demonstration */
export const AccessibilityDemo: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <div className="space-y-4">
          <Button onClick={() => setIsOpen(true)}>Open Drawer</Button>
          <div className="rounded-lg border border-[rgb(var(--border))] p-4">
            <h3 className="font-medium text-[rgb(var(--foreground))]">Accessibility Features</h3>
            <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
              <li>Focus is trapped within the drawer when open</li>
              <li>Escape key closes the drawer</li>
              <li>Focus returns to trigger element on close</li>
              <li>Body scroll is locked when drawer is open</li>
              <li>ARIA attributes for screen readers</li>
              <li>Respects reduced motion preferences</li>
            </ul>
          </div>
        </div>
        <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} ariaLabel="Demo navigation">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Focus Trap Demo</h2>
            <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
              Tab through the elements below. Focus stays within the drawer.
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
            </div>
          </div>
        </Drawer>
      </div>
    );
  },
};
