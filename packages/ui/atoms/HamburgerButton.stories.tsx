import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { HamburgerButton } from './HamburgerButton';

const meta: Meta<typeof HamburgerButton> = {
  title: 'Atoms/HamburgerButton',
  component: HamburgerButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the menu is currently open (for aria-expanded)',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for the button',
    },
    onClick: {
      action: 'clicked',
      description: 'Callback when the button is clicked',
    },
  },
  decorators: [
    // Remove md:hidden for Storybook visibility
    (Story) => (
      <div className="[&_button]:!block">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HamburgerButton>;

/** Default closed state */
export const Default: Story = {
  args: {
    isOpen: false,
    onClick: () => {},
  },
};

/** Open state (changes aria-label) */
export const Open: Story = {
  args: {
    isOpen: true,
    onClick: () => {},
  },
};

/** Interactive toggle demo */
export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="space-y-4">
        <HamburgerButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Menu is {isOpen ? 'open' : 'closed'}
        </p>
      </div>
    );
  },
};

/** With custom aria label */
export const CustomLabel: Story = {
  args: {
    isOpen: false,
    ariaLabel: 'Toggle sidebar navigation',
    onClick: () => {},
  },
};

/** Keyboard focus demonstration */
export const FocusDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Tab to the button to see the focus ring:
      </p>
      <HamburgerButton onClick={() => {}} />
    </div>
  ),
};

/** Touch target sizing */
export const TouchTarget: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        The button has a 44x44px minimum touch target for mobile accessibility:
      </p>
      <div className="inline-block rounded border border-dashed border-[rgb(var(--border))] p-px">
        <HamburgerButton onClick={() => {}} />
      </div>
      <p className="text-xs text-[rgb(var(--muted-foreground))]">
        The dashed border shows the touch target area
      </p>
    </div>
  ),
};

/** Mobile visibility note */
export const MobileOnly: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Note: Mobile Only</h3>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          In production, this button is only visible on mobile screens (hidden on md and above). For
          Storybook, we&apos;ve overridden this to make it visible at all sizes.
        </p>
      </div>
      <HamburgerButton onClick={() => {}} />
    </div>
  ),
};
