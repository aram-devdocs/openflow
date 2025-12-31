import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import type { Theme } from './ThemeToggle';
import { ThemeToggle } from './ThemeToggle';

const meta: Meta<typeof ThemeToggle> = {
  title: 'Atoms/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A theme selection component for switching between light, dark, and system themes.

## Accessibility Features
- **ARIA radiogroup pattern**: Proper role="radiogroup" with role="radio" on options
- **Keyboard navigation**: Arrow keys navigate between options, Home/End jump to first/last
- **Screen reader announcements**: Current theme is announced via aria-live region
- **Touch targets**: Minimum 44x44px on mobile devices (WCAG 2.5.5)
- **Focus management**: Roving tabindex pattern with visible focus ring
- **Descriptive labels**: Each option has an aria-label describing the action

## Responsive Features
- Labels hidden on mobile (icons only), visible on larger screens
- Touch-friendly sizing on mobile
- Responsive size prop with breakpoint support
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    theme: {
      control: 'select',
      options: ['light', 'dark', 'system'],
      description: 'Current theme value',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the toggle buttons',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables all interactions',
    },
    onThemeChange: { action: 'themeChanged' },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

// =============================================================================
// Basic States
// =============================================================================

/** Default theme toggle set to system */
export const Default: Story = {
  args: {
    theme: 'system',
  },
};

/** Theme toggle set to light mode */
export const LightSelected: Story = {
  args: {
    theme: 'light',
  },
};

/** Theme toggle set to dark mode */
export const DarkSelected: Story = {
  args: {
    theme: 'dark',
  },
};

/** Theme toggle set to system mode */
export const SystemSelected: Story = {
  args: {
    theme: 'system',
  },
};

// =============================================================================
// Sizes
// =============================================================================

/** Small size theme toggle */
export const SizeSmall: Story = {
  args: {
    theme: 'system',
    size: 'sm',
  },
};

/** Medium size theme toggle (default) */
export const SizeMedium: Story = {
  args: {
    theme: 'system',
    size: 'md',
  },
};

/** Large size theme toggle */
export const SizeLarge: Story = {
  args: {
    theme: 'system',
    size: 'lg',
  },
};

/** All sizes comparison */
export const AllSizes: Story = {
  render: function AllSizesStory() {
    const [theme, setTheme] = useState<Theme>('system');
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-[rgb(var(--muted-foreground))]">Small</span>
          <ThemeToggle theme={theme} onThemeChange={setTheme} size="sm" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-[rgb(var(--muted-foreground))]">Medium (default)</span>
          <ThemeToggle theme={theme} onThemeChange={setTheme} size="md" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-[rgb(var(--muted-foreground))]">Large</span>
          <ThemeToggle theme={theme} onThemeChange={setTheme} size="lg" />
        </div>
      </div>
    );
  },
};

/** Responsive sizing - changes at breakpoints */
export const ResponsiveSizing: Story = {
  render: function ResponsiveSizingStory() {
    const [theme, setTheme] = useState<Theme>('system');
    return (
      <div className="flex flex-col items-center gap-4">
        <ThemeToggle
          theme={theme}
          onThemeChange={setTheme}
          size={{ base: 'sm', md: 'md', lg: 'lg' }}
        />
        <p className="text-sm text-[rgb(var(--muted-foreground))] text-center max-w-xs">
          Resize your browser to see the toggle change size at different breakpoints: sm → md → lg
        </p>
      </div>
    );
  },
};

// =============================================================================
// States
// =============================================================================

/** Disabled state - no interactions possible */
export const Disabled: Story = {
  args: {
    theme: 'dark',
    disabled: true,
  },
};

/** Interactive theme toggle with state */
export const Interactive: Story = {
  render: function InteractiveStory() {
    const [theme, setTheme] = useState<Theme>('system');
    return (
      <div className="flex flex-col items-center gap-4">
        <ThemeToggle theme={theme} onThemeChange={setTheme} />
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Current theme: {theme}</p>
      </div>
    );
  },
};

// =============================================================================
// Accessibility Demonstrations
// =============================================================================

/** Focus ring visibility demonstration */
export const FocusRingVisibility: Story = {
  render: function FocusRingStory() {
    const [theme, setTheme] = useState<Theme>('light');
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-[rgb(var(--background))]">
          <span className="text-sm font-medium">Light background</span>
          <ThemeToggle theme={theme} onThemeChange={setTheme} />
        </div>
        <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-[rgb(var(--foreground))]">
          <span className="text-sm font-medium text-[rgb(var(--background))]">Dark background</span>
          <ThemeToggle theme={theme} onThemeChange={setTheme} />
        </div>
        <p className="text-sm text-[rgb(var(--muted-foreground))] text-center max-w-sm">
          Tab to the toggle and use arrow keys to navigate. Focus ring uses ring-offset-2 for
          visibility on all backgrounds.
        </p>
      </div>
    );
  },
};

/** Touch target accessibility - demonstrates 44x44px minimum */
export const TouchTargetAccessibility: Story = {
  render: function TouchTargetStory() {
    const [theme, setTheme] = useState<Theme>('system');
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <ThemeToggle theme={theme} onThemeChange={setTheme} size="sm" />
          {/* Overlay showing 44x44 touch target */}
          <div className="absolute inset-0 pointer-events-none flex">
            <div className="min-h-[44px] min-w-[44px] border-2 border-dashed border-blue-500 opacity-30" />
            <div className="min-h-[44px] min-w-[44px] border-2 border-dashed border-blue-500 opacity-30" />
            <div className="min-h-[44px] min-w-[44px] border-2 border-dashed border-blue-500 opacity-30" />
          </div>
        </div>
        <p className="text-sm text-[rgb(var(--muted-foreground))] text-center max-w-sm">
          Blue dashed boxes show the 44x44px minimum touch target area required by WCAG 2.5.5. On
          mobile, buttons expand to meet this requirement.
        </p>
      </div>
    );
  },
};

/** Screen reader accessibility demonstration */
export const ScreenReaderAccessibility: Story = {
  render: function ScreenReaderStory() {
    const [theme, setTheme] = useState<Theme>('system');
    return (
      <div className="flex flex-col items-center gap-6">
        <ThemeToggle theme={theme} onThemeChange={setTheme} data-testid="theme-toggle" />

        <div className="text-sm text-[rgb(var(--muted-foreground))] max-w-md space-y-2">
          <p className="font-medium">Screen reader behavior:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Container announced as &quot;Theme selection, radiogroup&quot;</li>
            <li>
              Each option announced with its aria-label (e.g., &quot;Switch to dark theme&quot;)
            </li>
            <li>Selected state announced (e.g., &quot;checked&quot; / &quot;not checked&quot;)</li>
            <li>Theme changes announced via aria-live region</li>
            <li>Use arrow keys to navigate, Enter/Space to select</li>
          </ul>
        </div>
      </div>
    );
  },
};

/** Keyboard navigation demonstration */
export const KeyboardNavigation: Story = {
  render: function KeyboardNavStory() {
    const [theme, setTheme] = useState<Theme>('system');
    const [lastAction, setLastAction] = useState<string>('');

    const handleChange = (newTheme: Theme) => {
      setTheme(newTheme);
      setLastAction(`Changed to: ${newTheme}`);
    };

    return (
      <div className="flex flex-col items-center gap-6">
        <ThemeToggle theme={theme} onThemeChange={handleChange} />

        {lastAction && (
          <p className="text-sm text-[rgb(var(--primary))]" aria-live="polite">
            {lastAction}
          </p>
        )}

        <div className="text-sm text-[rgb(var(--muted-foreground))] max-w-md space-y-2">
          <p className="font-medium">Keyboard shortcuts:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <kbd className="px-1.5 py-0.5 bg-[rgb(var(--muted))] rounded text-xs">Tab</kbd> -
              Focus the selected option
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 bg-[rgb(var(--muted))] rounded text-xs">→</kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-[rgb(var(--muted))] rounded text-xs">↓</kbd> - Move
              to next option
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 bg-[rgb(var(--muted))] rounded text-xs">←</kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-[rgb(var(--muted))] rounded text-xs">↑</kbd> - Move
              to previous option
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 bg-[rgb(var(--muted))] rounded text-xs">Home</kbd> -
              Jump to first option (Light)
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 bg-[rgb(var(--muted))] rounded text-xs">End</kbd> - Jump
              to last option (System)
            </li>
          </ul>
        </div>
      </div>
    );
  },
};

// =============================================================================
// Ref Forwarding & Data Attributes
// =============================================================================

/** forwardRef demonstration */
export const RefForwarding: Story = {
  render: function RefStory() {
    const [theme, setTheme] = useState<Theme>('system');
    const toggleRef = useRef<HTMLDivElement>(null);
    const [info, setInfo] = useState<string>('');

    const checkRef = () => {
      if (toggleRef.current) {
        const rect = toggleRef.current.getBoundingClientRect();
        setInfo(`Container: ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
      }
    };

    return (
      <div className="flex flex-col items-center gap-4">
        <ThemeToggle ref={toggleRef} theme={theme} onThemeChange={setTheme} />
        <button
          type="button"
          onClick={checkRef}
          className="px-3 py-1.5 text-sm bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-md"
        >
          Check Ref
        </button>
        {info && <p className="text-sm text-[rgb(var(--muted-foreground))]">{info}</p>}
      </div>
    );
  },
};

/** data-testid demonstration */
export const DataTestId: Story = {
  render: function TestIdStory() {
    const [theme, setTheme] = useState<Theme>('dark');
    return (
      <div className="flex flex-col items-center gap-4">
        <ThemeToggle theme={theme} onThemeChange={setTheme} data-testid="theme-toggle" />
        <div className="text-sm text-[rgb(var(--muted-foreground))] max-w-md">
          <p className="font-medium mb-2">Available test IDs:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <code className="px-1 bg-[rgb(var(--muted))] rounded">
                data-testid=&quot;theme-toggle&quot;
              </code>{' '}
              - Container
            </li>
            <li>
              <code className="px-1 bg-[rgb(var(--muted))] rounded">
                data-testid=&quot;theme-toggle-light&quot;
              </code>{' '}
              - Light button
            </li>
            <li>
              <code className="px-1 bg-[rgb(var(--muted))] rounded">
                data-testid=&quot;theme-toggle-dark&quot;
              </code>{' '}
              - Dark button
            </li>
            <li>
              <code className="px-1 bg-[rgb(var(--muted))] rounded">
                data-testid=&quot;theme-toggle-system&quot;
              </code>{' '}
              - System button
            </li>
          </ul>
        </div>
      </div>
    );
  },
};

/** data-state attribute demonstration */
export const DataStateAttribute: Story = {
  render: function DataStateStory() {
    const [theme, setTheme] = useState<Theme>('dark');
    return (
      <div className="flex flex-col items-center gap-4">
        <ThemeToggle theme={theme} onThemeChange={setTheme} />
        <div className="text-sm text-[rgb(var(--muted-foreground))] max-w-md">
          <p>
            Each button has <code className="px-1 bg-[rgb(var(--muted))] rounded">data-state</code>{' '}
            attribute:
          </p>
          <ul className="list-disc list-inside mt-2">
            <li>
              <code className="px-1 bg-[rgb(var(--muted))] rounded">
                data-state=&quot;selected&quot;
              </code>{' '}
              - Currently active option
            </li>
            <li>
              <code className="px-1 bg-[rgb(var(--muted))] rounded">
                data-state=&quot;unselected&quot;
              </code>{' '}
              - Inactive options
            </li>
          </ul>
        </div>
      </div>
    );
  },
};

// =============================================================================
// Real-World Examples
// =============================================================================

/** Settings panel example */
export const SettingsPanel: Story = {
  render: function SettingsPanelStory() {
    const [theme, setTheme] = useState<Theme>('system');
    return (
      <div className="w-80 p-6 bg-[rgb(var(--card))] rounded-lg border border-[rgb(var(--border))]">
        <h3 className="text-lg font-semibold mb-4">Appearance</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Theme</label>
            <ThemeToggle theme={theme} onThemeChange={setTheme} />
          </div>

          <p className="text-xs text-[rgb(var(--muted-foreground))]">
            Choose &quot;System&quot; to automatically match your device&apos;s theme preference.
          </p>
        </div>
      </div>
    );
  },
};

/** Header toolbar example */
export const HeaderToolbar: Story = {
  render: function HeaderToolbarStory() {
    const [theme, setTheme] = useState<Theme>('dark');
    return (
      <div className="w-full max-w-2xl">
        <header className="flex items-center justify-between px-4 py-3 bg-[rgb(var(--surface-1))] rounded-lg">
          <div className="font-semibold">OpenFlow</div>

          <div className="flex items-center gap-4">
            <ThemeToggle theme={theme} onThemeChange={setTheme} size="sm" />
            <button
              type="button"
              className="p-2 text-sm bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-md"
            >
              Sign In
            </button>
          </div>
        </header>
      </div>
    );
  },
};

/** Mobile-first example */
export const MobileFirst: Story = {
  render: function MobileFirstStory() {
    const [theme, setTheme] = useState<Theme>('system');
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-[320px] p-4 bg-[rgb(var(--card))] rounded-lg border border-[rgb(var(--border))]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Theme</span>
            <ThemeToggle theme={theme} onThemeChange={setTheme} size="sm" />
          </div>
        </div>
        <p className="text-sm text-[rgb(var(--muted-foreground))] text-center max-w-xs">
          On mobile, labels are hidden (icons only) to save space. Labels appear on screens ≥640px
          (sm breakpoint).
        </p>
      </div>
    );
  },
};

/** Dropdown menu example */
export const DropdownMenu: Story = {
  render: function DropdownMenuStory() {
    const [theme, setTheme] = useState<Theme>('system');
    const [isOpen, setIsOpen] = useState(true);
    return (
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 text-sm bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-foreground))] rounded-md"
        >
          {isOpen ? 'Hide' : 'Show'} Menu
        </button>

        {isOpen && (
          <div className="w-64 p-3 bg-[rgb(var(--card))] rounded-lg border border-[rgb(var(--border))] shadow-lg">
            <div className="space-y-3">
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-[rgb(var(--muted))] rounded-md"
              >
                Profile
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-[rgb(var(--muted))] rounded-md"
              >
                Settings
              </button>
              <div className="border-t border-[rgb(var(--border))] pt-3">
                <label className="text-xs font-medium text-[rgb(var(--muted-foreground))] mb-2 block">
                  Theme
                </label>
                <ThemeToggle theme={theme} onThemeChange={setTheme} size="sm" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
};

/** Custom class example */
export const CustomClass: Story = {
  args: {
    theme: 'dark',
    className: 'shadow-lg ring-1 ring-[rgb(var(--border))]',
  },
};
