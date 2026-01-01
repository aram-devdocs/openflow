import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import type { ResolvedTheme, ThemeToggleCompactSize } from './ThemeToggleCompact';
import { ThemeToggleCompact } from './ThemeToggleCompact';

const meta: Meta<typeof ThemeToggleCompact> = {
  title: 'Atoms/ThemeToggleCompact',
  component: ThemeToggleCompact,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Compact theme toggle button for quick access in headers and sidebars.

## Features
- Single button toggle between light and dark themes
- Shows opposite theme icon (sun when dark, moon when light) to indicate what clicking will switch to
- Touch target ≥44px on mobile (WCAG 2.5.5/2.5.8)
- Focus-visible ring for keyboard navigation
- Screen reader announcements for theme changes
- Responsive sizing via ResponsiveValue
- Disabled state support
- forwardRef support for programmatic control

## Accessibility
- Proper aria-label indicating the action ("Switch to light/dark theme")
- Screen reader announces current theme state
- Motion-safe transitions respect prefers-reduced-motion
- Focus ring with ring-offset for visibility on all backgrounds

## Usage
\`\`\`tsx
const { resolvedTheme, setTheme } = useTheme();
const handleToggle = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
<ThemeToggleCompact resolvedTheme={resolvedTheme} onToggle={handleToggle} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    resolvedTheme: {
      control: 'radio',
      options: ['light', 'dark'],
      description: 'The resolved theme (light or dark, not system)',
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the toggle button',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    lightLabel: {
      control: 'text',
      description: 'Custom aria-label for switching to light theme',
    },
    darkLabel: {
      control: 'text',
      description: 'Custom aria-label for switching to dark theme',
    },
    onToggle: { action: 'toggled' },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeToggleCompact>;

// =============================================================================
// Basic Examples
// =============================================================================

/** Default compact toggle in dark mode (shows sun icon to switch to light) */
export const Default: Story = {
  args: {
    resolvedTheme: 'dark',
  },
};

/** Compact toggle in light mode (shows moon icon to switch to dark) */
export const LightMode: Story = {
  args: {
    resolvedTheme: 'light',
  },
};

/** Compact toggle in dark mode (shows sun icon to switch to light) */
export const DarkMode: Story = {
  args: {
    resolvedTheme: 'dark',
  },
};

// =============================================================================
// Sizes
// =============================================================================

/** Small size - 44px touch target on mobile, 36px on desktop */
export const SizeSmall: Story = {
  args: {
    resolvedTheme: 'dark',
    size: 'sm',
  },
};

/** Medium size (default) - 44px touch target */
export const SizeMedium: Story = {
  args: {
    resolvedTheme: 'dark',
    size: 'md',
  },
};

/** Large size - 48px touch target */
export const SizeLarge: Story = {
  args: {
    resolvedTheme: 'dark',
    size: 'lg',
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: () => {
    const sizes: ThemeToggleCompactSize[] = ['sm', 'md', 'lg'];
    return (
      <div className="flex items-center gap-4">
        {sizes.map((size) => (
          <div key={size} className="flex flex-col items-center gap-2">
            <ThemeToggleCompact
              resolvedTheme="dark"
              onToggle={() => {}}
              size={size}
              data-testid={`toggle-${size}`}
            />
            <span className="text-xs text-[rgb(var(--muted-foreground))]">{size}</span>
          </div>
        ))}
      </div>
    );
  },
};

/** Responsive sizing - small on mobile, medium on tablet, large on desktop */
export const ResponsiveSizing: Story = {
  render: function ResponsiveSizingStory() {
    const [theme, setTheme] = useState<ResolvedTheme>('dark');
    const handleToggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Resize browser to see size change
        </p>
        <ThemeToggleCompact
          resolvedTheme={theme}
          onToggle={handleToggle}
          size={{ base: 'sm', md: 'md', lg: 'lg' }}
        />
        <p className="text-xs text-[rgb(var(--muted-foreground))]">base: sm, md: md, lg: lg</p>
      </div>
    );
  },
};

// =============================================================================
// States
// =============================================================================

/** Disabled state */
export const Disabled: Story = {
  args: {
    resolvedTheme: 'dark',
    disabled: true,
  },
};

/** Disabled in light mode */
export const DisabledLight: Story = {
  args: {
    resolvedTheme: 'light',
    disabled: true,
  },
};

// =============================================================================
// Interactive Examples
// =============================================================================

/** Interactive compact toggle with state */
export const Interactive: Story = {
  render: function InteractiveStory() {
    const [theme, setTheme] = useState<ResolvedTheme>('dark');
    const handleToggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');
    return (
      <div className="flex flex-col items-center gap-4">
        <ThemeToggleCompact resolvedTheme={theme} onToggle={handleToggle} />
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Current: {theme}</p>
      </div>
    );
  },
};

/** Custom labels for the toggle */
export const CustomLabels: Story = {
  args: {
    resolvedTheme: 'dark',
    lightLabel: 'Enable day mode',
    darkLabel: 'Enable night mode',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom aria-labels for localization or branding.',
      },
    },
  },
};

// =============================================================================
// Accessibility Demos
// =============================================================================

/** Focus ring visibility demo */
export const FocusRingVisibility: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-[rgb(var(--background))]">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Light background</p>
        <ThemeToggleCompact resolvedTheme="dark" onToggle={() => {}} />
        <p className="text-xs text-[rgb(var(--muted-foreground))]">Press Tab to see focus ring</p>
      </div>
      <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-[rgb(var(--surface-1))]">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Dark surface</p>
        <ThemeToggleCompact resolvedTheme="light" onToggle={() => {}} />
        <p className="text-xs text-[rgb(var(--muted-foreground))]">
          Focus ring visible on all backgrounds
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Focus ring uses ring-offset to ensure visibility on all background colors.',
      },
    },
  },
};

/** Touch target accessibility - minimum 44px */
export const TouchTargetAccessibility: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        All sizes meet WCAG 2.5.5 (44px touch target on mobile)
      </p>
      <div className="flex items-center gap-4">
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <div key={size} className="relative">
            <div
              className="absolute inset-0 border-2 border-dashed border-green-500 -m-0.5"
              style={{
                width: size === 'lg' ? '48px' : '44px',
                height: size === 'lg' ? '48px' : '44px',
              }}
            />
            <ThemeToggleCompact resolvedTheme="dark" onToggle={() => {}} size={size} />
          </div>
        ))}
      </div>
      <p className="text-xs text-[rgb(var(--muted-foreground))]">
        Green dashed border shows touch target area
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All sizes maintain a minimum 44px touch target on touch devices for WCAG 2.5.5 compliance.',
      },
    },
  },
};

/** Screen reader accessibility */
export const ScreenReaderAccessibility: Story = {
  render: function ScreenReaderAccessibilityStory() {
    const [theme, setTheme] = useState<ResolvedTheme>('dark');
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Screen reader announces: &quot;Switch to {theme === 'dark' ? 'light' : 'dark'} theme&quot;
        </p>
        <ThemeToggleCompact
          resolvedTheme={theme}
          onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
        <div className="text-xs text-[rgb(var(--muted-foreground))] space-y-1">
          <p>• aria-label changes based on current state</p>
          <p>• Screen reader announces current theme on change</p>
          <p>• Uses VisuallyHidden for state announcements</p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Screen readers announce the action (what clicking will do) and current theme state.',
      },
    },
  },
};

/** Keyboard navigation */
export const KeyboardNavigation: Story = {
  render: function KeyboardNavigationStory() {
    const [theme, setTheme] = useState<ResolvedTheme>('dark');
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Press Tab to focus, Enter or Space to toggle
        </p>
        <ThemeToggleCompact
          resolvedTheme={theme}
          onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
        <div className="text-xs text-[rgb(var(--muted-foreground))] space-y-1">
          <p>• Tab: Focus the button</p>
          <p>• Enter/Space: Toggle theme</p>
        </div>
      </div>
    );
  },
};

// =============================================================================
// Ref and Testing
// =============================================================================

/** forwardRef demo - programmatic focus */
export const RefForwarding: Story = {
  render: function RefForwardingStory() {
    const [theme, setTheme] = useState<ResolvedTheme>('dark');
    const buttonRef = useRef<HTMLButtonElement>(null);

    const focusButton = () => {
      buttonRef.current?.focus();
    };

    return (
      <div className="flex flex-col items-center gap-4">
        <ThemeToggleCompact
          ref={buttonRef}
          resolvedTheme={theme}
          onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
        <button
          type="button"
          onClick={focusButton}
          className="px-4 py-2 text-sm rounded-md bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]"
        >
          Focus Toggle Button
        </button>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'forwardRef allows programmatic focus management.',
      },
    },
  },
};

/** data-testid demo for testing */
export const DataTestId: Story = {
  args: {
    resolvedTheme: 'dark',
    'data-testid': 'theme-toggle-compact',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use data-testid for integration testing.',
      },
    },
  },
};

/** data-state attribute shows current theme */
export const DataStateAttribute: Story = {
  render: function DataStateAttributeStory() {
    const [theme, setTheme] = useState<ResolvedTheme>('dark');
    return (
      <div className="flex flex-col items-center gap-4">
        <ThemeToggleCompact
          resolvedTheme={theme}
          onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          data-testid="theme-toggle"
        />
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          data-state=&quot;{theme}&quot;
        </p>
        <p className="text-xs text-[rgb(var(--muted-foreground))]">
          Use [data-state=&quot;dark&quot;] for CSS styling
        </p>
      </div>
    );
  },
};

// =============================================================================
// Real-World Usage Examples
// =============================================================================

/** Compact toggle in a header context */
export const InHeaderContext: Story = {
  render: function HeaderContextStory() {
    const [theme, setTheme] = useState<ResolvedTheme>('dark');
    const handleToggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-4 py-2">
        <span className="text-sm font-semibold text-[rgb(var(--foreground))]">OpenFlow</span>
        <div className="flex-1" />
        <ThemeToggleCompact resolvedTheme={theme} onToggle={handleToggle} size="sm" />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact toggle fits well in application headers.',
      },
    },
  },
};

/** In a sidebar */
export const InSidebarContext: Story = {
  render: function SidebarContextStory() {
    const [theme, setTheme] = useState<ResolvedTheme>('dark');
    const handleToggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');
    return (
      <div className="w-64 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-4">
        <div className="space-y-4">
          <div className="text-sm text-[rgb(var(--muted-foreground))]">Navigation items...</div>
          <div className="flex-1" />
          <div className="flex items-center justify-between pt-4 border-t border-[rgb(var(--border))]">
            <span className="text-sm text-[rgb(var(--muted-foreground))]">Theme</span>
            <ThemeToggleCompact resolvedTheme={theme} onToggle={handleToggle} size="sm" />
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact toggle in a sidebar settings section.',
      },
    },
  },
};

/** In a mobile menu */
export const InMobileMenu: Story = {
  render: function MobileMenuStory() {
    const [theme, setTheme] = useState<ResolvedTheme>('dark');
    const handleToggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');
    return (
      <div className="w-80 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-4">
        <div className="space-y-2">
          <button
            type="button"
            className="w-full px-4 py-3 text-left text-sm rounded-md hover:bg-[rgb(var(--surface-1))]"
          >
            Dashboard
          </button>
          <button
            type="button"
            className="w-full px-4 py-3 text-left text-sm rounded-md hover:bg-[rgb(var(--surface-1))]"
          >
            Projects
          </button>
          <button
            type="button"
            className="w-full px-4 py-3 text-left text-sm rounded-md hover:bg-[rgb(var(--surface-1))]"
          >
            Settings
          </button>
          <div className="pt-2 border-t border-[rgb(var(--border))]">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[rgb(var(--foreground))]">Theme</span>
              <ThemeToggleCompact resolvedTheme={theme} onToggle={handleToggle} />
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact toggle in a mobile navigation menu with 44px touch target.',
      },
    },
  },
};

/** With custom className */
export const CustomClassName: Story = {
  args: {
    resolvedTheme: 'dark',
    className: 'bg-[rgb(var(--surface-1))] rounded-full',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom className can modify the button appearance.',
      },
    },
  },
};

/** In a toolbar with other buttons */
export const InToolbar: Story = {
  render: function ToolbarStory() {
    const [theme, setTheme] = useState<ResolvedTheme>('dark');
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-1))] p-2">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-[rgb(var(--surface-2))]"
          aria-label="Search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden={true}
            focusable="false"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-[rgb(var(--surface-2))]"
          aria-label="Notifications"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden={true}
            focusable="false"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        </button>
        <div className="mx-2 h-6 w-px bg-[rgb(var(--border))]" />
        <ThemeToggleCompact
          resolvedTheme={theme}
          onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          size="sm"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact toggle fits naturally in toolbars alongside other icon buttons.',
      },
    },
  },
};
