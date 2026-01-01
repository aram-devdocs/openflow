import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
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
      description: 'Whether the menu is currently open',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button (supports responsive values)',
    },
    openLabel: {
      control: 'text',
      description: 'Accessible label when closed',
    },
    closeLabel: {
      control: 'text',
      description: 'Accessible label when open',
    },
    controlsId: {
      control: 'text',
      description: 'ID of the controlled navigation element',
    },
    onClick: {
      action: 'clicked',
      description: 'Callback when the button is clicked',
    },
  },
  decorators: [
    // Remove md:hidden for Storybook visibility
    (Story) => (
      <div className="[&_button]:!flex">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HamburgerButton>;

// ============================================================================
// Basic States
// ============================================================================

/** Default closed state showing Menu (hamburger) icon */
export const Default: Story = {
  args: {
    isOpen: false,
    onClick: () => {},
  },
};

/** Open state showing X (close) icon */
export const Open: Story = {
  args: {
    isOpen: true,
    onClick: () => {},
  },
};

// ============================================================================
// Sizes
// ============================================================================

/** Small size - 20px icon, 36px button on desktop, 44px touch target on mobile */
export const SizeSmall: Story = {
  args: {
    size: 'sm',
    onClick: () => {},
  },
};

/** Medium size (default) - 24px icon, 44px button */
export const SizeMedium: Story = {
  args: {
    size: 'md',
    onClick: () => {},
  },
};

/** Large size - 28px icon, 44px button */
export const SizeLarge: Story = {
  args: {
    size: 'lg',
    onClick: () => {},
  },
};

/** All sizes side by side for comparison */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <HamburgerButton size="sm" onClick={() => {}} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <HamburgerButton size="md" onClick={() => {}} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <HamburgerButton size="lg" onClick={() => {}} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">Large</span>
      </div>
    </div>
  ),
};

// ============================================================================
// Responsive Sizing
// ============================================================================

/** Responsive sizing: small on mobile, medium on tablet, large on desktop */
export const ResponsiveSizing: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="max-w-md text-sm text-[rgb(var(--muted-foreground))]">
        This button uses responsive sizing. Resize your browser to see it change:
        <br />• <strong>Mobile</strong>: Small size
        <br />• <strong>Tablet (md)</strong>: Medium size
        <br />• <strong>Desktop (lg)</strong>: Large size
      </p>
      <HamburgerButton size={{ base: 'sm', md: 'md', lg: 'lg' }} onClick={() => {}} />
    </div>
  ),
};

// ============================================================================
// Interactive
// ============================================================================

/** Interactive toggle demo - click to toggle between Menu and X icons */
export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="space-y-4">
        <HamburgerButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Menu is <strong>{isOpen ? 'open' : 'closed'}</strong>
          <br />
          aria-label: <code>{isOpen ? 'Close navigation menu' : 'Open navigation menu'}</code>
          <br />
          aria-expanded: <code>{String(isOpen)}</code>
        </p>
      </div>
    );
  },
};

// ============================================================================
// Custom Labels
// ============================================================================

/** With custom open/close labels for different contexts */
export const CustomLabels: Story = {
  args: {
    isOpen: false,
    openLabel: 'Open sidebar',
    closeLabel: 'Close sidebar',
    controlsId: 'sidebar-nav',
    onClick: () => {},
  },
};

/** Interactive demo with custom labels showing label changes */
export const CustomLabelsInteractive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="space-y-4">
        <HamburgerButton
          isOpen={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          openLabel="Open the sidebar"
          closeLabel="Close the sidebar"
          controlsId="custom-sidebar"
        />
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Current aria-label:{' '}
          <code>&quot;{isOpen ? 'Close the sidebar' : 'Open the sidebar'}&quot;</code>
        </p>
      </div>
    );
  },
};

// ============================================================================
// Accessibility
// ============================================================================

/** Keyboard focus demonstration - Tab to see focus ring */
export const FocusRing: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Tab to the button to see the focus ring. The ring uses <code>ring-offset-2</code> for
        visibility on all backgrounds.
      </p>
      <div className="flex gap-4">
        <div className="rounded-lg bg-[rgb(var(--background))] p-4">
          <HamburgerButton onClick={() => {}} />
          <p className="mt-2 text-xs text-[rgb(var(--muted-foreground))]">Light background</p>
        </div>
        <div className="rounded-lg bg-[rgb(var(--foreground))] p-4">
          <HamburgerButton onClick={() => {}} className="text-[rgb(var(--background))]" />
          <p className="mt-2 text-xs text-[rgb(var(--background))]">Dark background</p>
        </div>
      </div>
    </div>
  ),
};

/** Touch target sizing - 44x44px minimum for WCAG 2.5.5 */
export const TouchTarget: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        All sizes have a 44x44px minimum touch target on mobile for accessibility (WCAG 2.5.5). The
        dashed border shows the touch target area.
      </p>
      <div className="flex items-center gap-4">
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <div
            key={size}
            className="inline-block rounded border border-dashed border-[rgb(var(--border))]"
          >
            <HamburgerButton size={size} onClick={() => {}} />
          </div>
        ))}
      </div>
      <p className="text-xs text-[rgb(var(--muted-foreground))]">
        On desktop (sm+ breakpoint), smaller sizes may compact to their visual size, but the
        clickable area remains accessible.
      </p>
    </div>
  ),
};

/** Screen reader demo - shows aria attributes and announcements */
export const ScreenReaderAccessibility: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="space-y-4">
        <p className="max-w-md text-sm text-[rgb(var(--muted-foreground))]">
          This component provides excellent screen reader support:
        </p>
        <HamburgerButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <h4 className="font-medium text-[rgb(var(--foreground))]">Current ARIA attributes:</h4>
          <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted-foreground))]">
            <li>
              <code>aria-label</code>:{' '}
              <strong>{isOpen ? 'Close navigation menu' : 'Open navigation menu'}</strong>
            </li>
            <li>
              <code>aria-expanded</code>: <strong>{String(isOpen)}</strong>
            </li>
            <li>
              <code>aria-controls</code>: <strong>mobile-nav</strong>
            </li>
            <li>
              <code>data-state</code>: <strong>{isOpen ? 'open' : 'closed'}</strong>
            </li>
          </ul>
          <p className="mt-3 text-sm text-[rgb(var(--muted-foreground))]">
            <strong>Live region:</strong> Screen readers will announce &quot;
            {isOpen ? 'Menu open' : 'Menu closed'}&quot;
          </p>
        </div>
      </div>
    );
  },
};

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="space-y-4">
        <div className="max-w-md rounded-lg border border-[rgb(var(--border))] p-4">
          <h4 className="font-medium text-[rgb(var(--foreground))]">Keyboard Support:</h4>
          <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted-foreground))]">
            <li>
              <kbd className="rounded bg-[rgb(var(--muted))] px-1.5 py-0.5 text-xs">Tab</kbd> - Move
              focus to button
            </li>
            <li>
              <kbd className="rounded bg-[rgb(var(--muted))] px-1.5 py-0.5 text-xs">Enter</kbd> or{' '}
              <kbd className="rounded bg-[rgb(var(--muted))] px-1.5 py-0.5 text-xs">Space</kbd> -
              Toggle menu
            </li>
          </ul>
        </div>
        <HamburgerButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Status: {isOpen ? 'Open' : 'Closed'}
        </p>
      </div>
    );
  },
};

// ============================================================================
// Ref Forwarding
// ============================================================================

/** Demonstrates ref forwarding capability */
export const WithRef: Story = {
  render: () => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [focused, setFocused] = useState(false);

    return (
      <div className="space-y-4">
        <HamburgerButton
          ref={buttonRef}
          onClick={() => {}}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => buttonRef.current?.focus()}
            className="rounded bg-[rgb(var(--primary))] px-3 py-1 text-sm text-[rgb(var(--primary-foreground))]"
          >
            Focus button via ref
          </button>
          <button
            type="button"
            onClick={() => buttonRef.current?.click()}
            className="rounded bg-[rgb(var(--secondary))] px-3 py-1 text-sm text-[rgb(var(--secondary-foreground))]"
          >
            Click via ref
          </button>
        </div>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Button is {focused ? 'focused' : 'not focused'}
        </p>
      </div>
    );
  },
};

// ============================================================================
// Data Attributes
// ============================================================================

/** With data-testid for testing */
export const WithTestId: Story = {
  args: {
    'data-testid': 'hamburger-button',
    onClick: () => {},
  },
  render: (args) => (
    <div className="space-y-4">
      <HamburgerButton {...args} />
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        This button has <code>data-testid=&quot;hamburger-button&quot;</code> for testing.
      </p>
    </div>
  ),
};

/** With data-state attribute showing open/closed */
export const DataState: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="space-y-4">
        <HamburgerButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          <code>data-state</code>: <strong>{isOpen ? 'open' : 'closed'}</strong>
          <br />
          Use this attribute for CSS styling based on state.
        </p>
        <pre className="rounded bg-[rgb(var(--muted))] p-2 text-xs">
          {`/* CSS example */
button[data-state="open"] {
  /* styles for open state */
}
button[data-state="closed"] {
  /* styles for closed state */
}`}
        </pre>
      </div>
    );
  },
};

// ============================================================================
// Real-world Usage
// ============================================================================

/** Mobile header with hamburger button */
export const InMobileHeader: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="w-full max-w-md">
        <header className="flex items-center justify-between rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-4 py-2">
          <span className="font-semibold text-[rgb(var(--foreground))]">My App</span>
          <HamburgerButton
            isOpen={isOpen}
            onClick={() => setIsOpen(!isOpen)}
            controlsId="mobile-menu"
          />
        </header>
        {isOpen && (
          <nav
            id="mobile-menu"
            className="mt-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-4"
          >
            <ul className="space-y-2">
              <li>
                <button type="button" className="text-[rgb(var(--foreground))]">
                  Home
                </button>
              </li>
              <li>
                <button type="button" className="text-[rgb(var(--foreground))]">
                  About
                </button>
              </li>
              <li>
                <button type="button" className="text-[rgb(var(--foreground))]">
                  Contact
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    );
  },
};

/** Sidebar toggle with hamburger button */
export const SidebarToggle: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="flex h-64 w-full max-w-lg overflow-hidden rounded-lg border border-[rgb(var(--border))]">
        {/* Sidebar */}
        <aside
          id="sidebar"
          className={`border-r border-[rgb(var(--border))] bg-[rgb(var(--muted))] p-4 transition-all duration-200 ${
            isOpen ? 'w-48' : 'w-0 overflow-hidden'
          }`}
        >
          <nav className="space-y-2">
            <button type="button" className="block text-sm text-[rgb(var(--foreground))]">
              Dashboard
            </button>
            <button type="button" className="block text-sm text-[rgb(var(--foreground))]">
              Settings
            </button>
            <button type="button" className="block text-sm text-[rgb(var(--foreground))]">
              Profile
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4">
          <div className="flex items-center gap-4">
            <HamburgerButton
              isOpen={isOpen}
              onClick={() => setIsOpen(!isOpen)}
              openLabel="Open sidebar"
              closeLabel="Close sidebar"
              controlsId="sidebar"
            />
            <h1 className="text-lg font-semibold text-[rgb(var(--foreground))]">Main Content</h1>
          </div>
          <p className="mt-4 text-sm text-[rgb(var(--muted-foreground))]">
            Click the hamburger button to toggle the sidebar.
          </p>
        </main>
      </div>
    );
  },
};

// ============================================================================
// Mobile Only Note
// ============================================================================

/** Information about mobile-only visibility */
export const MobileOnlyNote: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgb(var(--border))] p-4">
        <h3 className="font-medium text-[rgb(var(--foreground))]">Note: Mobile Only by Default</h3>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          In production, this button is only visible on mobile screens (
          <code className="rounded bg-[rgb(var(--muted))] px-1">md:hidden</code>). For Storybook,
          we&apos;ve overridden this to make it visible at all sizes.
        </p>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          To show on all screen sizes, add <code>className=&quot;!flex&quot;</code> or remove the
          md:hidden class in your custom wrapper.
        </p>
      </div>
      <HamburgerButton onClick={() => {}} />
    </div>
  ),
};

/** Disabled state (native button disabled attribute) */
export const Disabled: Story = {
  args: {
    onClick: () => {},
    disabled: true,
  },
  render: (args) => (
    <div className="space-y-4">
      <HamburgerButton {...args} />
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        The button can be disabled using the native <code>disabled</code> attribute. When disabled,
        it cannot be clicked or focused.
      </p>
    </div>
  ),
};
