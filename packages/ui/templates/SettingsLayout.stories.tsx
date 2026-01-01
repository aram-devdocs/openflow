import type { Meta, StoryObj } from '@storybook/react';
import {
  Bell,
  Cloud,
  Database,
  FolderGit2,
  Globe,
  HardDrive,
  Keyboard,
  Lock,
  Mail,
  MessageSquare,
  Monitor,
  Palette,
  Settings,
  Shield,
  Terminal,
  User,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Dropdown } from '../molecules/Dropdown';
import { FormField } from '../molecules/FormField';
import {
  DEFAULT_CONTENT_LABEL,
  // Constants
  DEFAULT_NAV_LABEL,
  DEFAULT_NAV_WIDTH,
  SETTINGS_LAYOUT_CONTAINER_CLASSES,
  SETTINGS_LAYOUT_SIZE_CLASSES,
  SETTINGS_MOBILE_TAB_BASE_CLASSES,
  SETTINGS_NAV_ITEM_BASE_CLASSES,
  SR_CURRENT_PAGE,
  SR_NAV_CHANGED,
  SR_SECTION_HEADER,
  SettingsLayout,
  type SettingsNavItem,
  buildNavChangeAnnouncement,
  // Utility functions
  getBaseSize,
  getNavItemId,
  getTabPanelId,
} from './SettingsLayout';

const meta: Meta<typeof SettingsLayout> = {
  title: 'Templates/SettingsLayout',
  component: SettingsLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Settings page layout template with navigation sidebar and content area.

## Accessibility Features
- **Navigation landmark**: Uses \`<nav>\` with \`aria-label\` for screen readers
- **Tablist pattern**: Mobile navigation uses ARIA tablist/tab pattern
- **aria-current="page"**: Indicates the currently active navigation item
- **Keyboard navigation**: Arrow keys, Home, End for navigation; Enter/Space to select
- **Screen reader announcements**: Announces navigation changes via VisuallyHidden
- **Touch targets**: 44px minimum for mobile (WCAG 2.5.5)
- **Focus management**: Visible focus rings with ring-offset for contrast
- **Reduced motion**: Uses motion-safe prefix for transitions

## Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Arrow Left/Up | Navigate to previous item |
| Arrow Right/Down | Navigate to next item |
| Home | Navigate to first item |
| End | Navigate to last item |
| Enter/Space | Select focused item |
| Tab | Move focus between navigation and content |
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-screen w-screen">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant affecting padding and font sizes',
    },
    navWidth: {
      control: 'text',
      description: 'Width of the desktop navigation sidebar',
    },
    navLabel: {
      control: 'text',
      description: 'Accessible label for the navigation region',
    },
    contentLabel: {
      control: 'text',
      description: 'Accessible label for the content region',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SettingsLayout>;

// ============================================================================
// Sample Navigation Items
// ============================================================================

const sampleNavigation: SettingsNavItem[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'profiles', label: 'Executor Profiles', icon: User },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'appearance', label: 'Appearance', isSection: true },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
  { id: 'advanced', label: 'Advanced', isSection: true },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'data', label: 'Data & Storage', icon: Database },
];

const simpleNavigation: SettingsNavItem[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'profiles', label: 'Executor Profiles', icon: User },
  { id: 'theme', label: 'Theme', icon: Palette },
];

const navigationWithDisabled: SettingsNavItem[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'profiles', label: 'Executor Profiles', icon: User },
  { id: 'experimental', label: 'Experimental', icon: Zap, disabled: true },
  { id: 'appearance', label: 'Appearance', isSection: true },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'beta', label: 'Beta Features', icon: Lock, disabled: true },
];

const manyItemsNavigation: SettingsNavItem[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'account', label: 'Account', icon: User },
  { id: 'privacy', label: 'Privacy & Security', isSection: true },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'privacy-settings', label: 'Privacy', icon: Lock },
  { id: 'appearance', label: 'Appearance', isSection: true },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'display', label: 'Display', icon: Monitor },
  { id: 'language', label: 'Language', icon: Globe },
  { id: 'notifications', label: 'Notifications', isSection: true },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'push', label: 'Push Notifications', icon: Bell },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'storage', label: 'Storage & Data', isSection: true },
  { id: 'storage-settings', label: 'Storage', icon: HardDrive },
  { id: 'cloud', label: 'Cloud Sync', icon: Cloud },
  { id: 'data', label: 'Data Export', icon: Database },
];

// ============================================================================
// Sample Content Components
// ============================================================================

function GeneralSettingsContent() {
  return (
    <div className="max-w-2xl space-y-6">
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-[rgb(var(--foreground))]">General Settings</h2>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Configure general application preferences.
        </p>
      </section>

      <div className="space-y-4">
        <FormField label="Default Project" htmlFor="default-project">
          <Dropdown
            options={[
              { value: 'openflow', label: 'OpenFlow' },
              { value: 'auth-service', label: 'Auth Service' },
              { value: 'api-gateway', label: 'API Gateway' },
            ]}
            value="openflow"
            placeholder="Select a default project"
          />
        </FormField>

        <FormField
          label="Auto-start next step"
          htmlFor="auto-start"
          helperText="Automatically start the next workflow step when the current one completes."
        >
          <Dropdown
            options={[
              { value: 'always', label: 'Always' },
              { value: 'never', label: 'Never' },
              { value: 'ask', label: 'Ask each time' },
            ]}
            value="ask"
          />
        </FormField>

        <FormField
          label="Worktree Directory"
          htmlFor="worktree-dir"
          helperText="Where OpenFlow creates git worktrees for task branches."
        >
          <Input
            id="worktree-dir"
            placeholder="/Users/dev/.openflow/worktrees"
            defaultValue="/Users/dev/.openflow/worktrees"
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[rgb(var(--border))]">
        <Button variant="secondary">Reset to Defaults</Button>
        <Button variant="primary">Save Changes</Button>
      </div>
    </div>
  );
}

function ExecutorProfilesContent() {
  return (
    <div className="max-w-2xl space-y-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-[rgb(var(--foreground))]">Executor Profiles</h2>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              Configure AI coding assistants for task execution.
            </p>
          </div>
          <Button variant="primary" size="sm">
            Add Profile
          </Button>
        </div>
      </section>

      <div className="space-y-3">
        {[
          { name: 'Claude Code', command: 'claude', isDefault: true },
          { name: 'Gemini CLI', command: 'gemini', isDefault: false },
          { name: 'Codex CLI', command: 'codex', isDefault: false },
        ].map((profile) => (
          <div
            key={profile.name}
            className="flex items-center justify-between rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[rgb(var(--muted))]">
                <Terminal className="h-5 w-5 text-[rgb(var(--muted-foreground))]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[rgb(var(--card-foreground))]">
                    {profile.name}
                  </span>
                  {profile.isDefault && (
                    <span className="rounded-full bg-[rgb(var(--primary))] px-2 py-0.5 text-xs text-[rgb(var(--primary-foreground))]">
                      Default
                    </span>
                  )}
                </div>
                <span className="text-sm text-[rgb(var(--muted-foreground))]">
                  {profile.command}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                Edit
              </Button>
              <Button variant="ghost" size="sm">
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemeSettingsContent() {
  return (
    <div className="max-w-2xl space-y-6">
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-[rgb(var(--foreground))]">Theme Settings</h2>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Customize the appearance of OpenFlow.
        </p>
      </section>

      <div className="space-y-4">
        <FormField label="Color Theme" htmlFor="color-theme">
          <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Color theme">
            {['Dark', 'Light', 'System'].map((theme) => (
              <button
                key={theme}
                type="button"
                role="radio"
                aria-checked={theme === 'Dark'}
                className={`rounded-lg border-2 p-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 ${
                  theme === 'Dark'
                    ? 'border-[rgb(var(--primary))] bg-[rgb(var(--accent))]'
                    : 'border-[rgb(var(--border))] hover:border-[rgb(var(--muted-foreground))]'
                }`}
              >
                <div
                  className={`mx-auto mb-2 h-8 w-12 rounded ${
                    theme === 'Dark'
                      ? 'bg-gray-900'
                      : theme === 'Light'
                        ? 'bg-gray-100'
                        : 'bg-gradient-to-r from-gray-900 to-gray-100'
                  }`}
                />
                <span className="text-sm font-medium text-[rgb(var(--foreground))]">{theme}</span>
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Accent Color" htmlFor="accent-color">
          <div className="flex gap-2" role="radiogroup" aria-label="Accent color">
            {['blue', 'green', 'purple', 'orange', 'pink'].map((color) => (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={color === 'blue'}
                aria-label={`${color} accent color${color === 'blue' ? ' (selected)' : ''}`}
                className={`h-8 w-8 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 ${
                  color === 'blue'
                    ? 'ring-2 ring-offset-2 ring-offset-[rgb(var(--background))] ring-[rgb(var(--ring))]'
                    : ''
                }`}
                style={{
                  backgroundColor:
                    color === 'blue'
                      ? '#3b82f6'
                      : color === 'green'
                        ? '#22c55e'
                        : color === 'purple'
                          ? '#a855f7'
                          : color === 'orange'
                            ? '#f97316'
                            : '#ec4899',
                }}
              />
            ))}
          </div>
        </FormField>

        <FormField label="Font Size" htmlFor="font-size">
          <Dropdown
            options={[
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium (Default)' },
              { value: 'large', label: 'Large' },
            ]}
            value="medium"
          />
        </FormField>
      </div>
    </div>
  );
}

function EmptySettingsContent() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-[rgb(var(--muted-foreground))]">
        Select a section from the navigation to configure settings.
      </p>
    </div>
  );
}

function LongSettingsContent() {
  return (
    <div className="max-w-2xl space-y-6">
      {Array.from({ length: 10 }).map((_, idx) => (
        <section
          key={`settings-section-${idx}`}
          className="space-y-4 rounded-lg border border-[rgb(var(--border))] p-4"
        >
          <h3 className="font-medium text-[rgb(var(--foreground))]">Section {idx + 1}</h3>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            This is a sample settings section demonstrating scrolling behavior in the content area
            while the navigation remains fixed.
          </p>
          <FormField label={`Setting ${idx + 1}`} htmlFor={`setting-${idx + 1}`}>
            <Input id={`setting-${idx + 1}`} placeholder="Enter value..." />
          </FormField>
        </section>
      ))}
    </div>
  );
}

// ============================================================================
// Basic Examples
// ============================================================================

/**
 * Default settings layout with General tab active
 */
export const Default: Story = {
  args: {
    navigation: sampleNavigation,
    activeNavId: 'general',
    title: 'Settings',
    description: 'Manage your application preferences and configuration.',
    children: <GeneralSettingsContent />,
    'data-testid': 'settings-layout',
  },
};

/**
 * Settings layout showing Executor Profiles
 */
export const ExecutorProfiles: Story = {
  args: {
    navigation: sampleNavigation,
    activeNavId: 'profiles',
    title: 'Executor Profiles',
    description: 'Configure AI coding assistants for task execution.',
    children: <ExecutorProfilesContent />,
  },
};

/**
 * Settings layout showing Theme settings
 */
export const ThemeSettings: Story = {
  args: {
    navigation: sampleNavigation,
    activeNavId: 'theme',
    title: 'Theme',
    description: 'Customize the appearance of OpenFlow.',
    children: <ThemeSettingsContent />,
  },
};

/**
 * Settings layout without title and description
 */
export const NoHeader: Story = {
  args: {
    navigation: sampleNavigation,
    activeNavId: 'general',
    children: <GeneralSettingsContent />,
  },
};

/**
 * Settings layout with no active selection
 */
export const NoSelection: Story = {
  args: {
    navigation: sampleNavigation,
    title: 'Settings',
    description: 'Select a section from the navigation.',
    children: <EmptySettingsContent />,
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size variant - more compact layout
 */
export const SizeSmall: Story = {
  args: {
    navigation: simpleNavigation,
    activeNavId: 'general',
    title: 'Settings',
    description: 'Small size variant with compact spacing.',
    children: <GeneralSettingsContent />,
    size: 'sm',
  },
};

/**
 * Medium size variant (default)
 */
export const SizeMedium: Story = {
  args: {
    navigation: simpleNavigation,
    activeNavId: 'general',
    title: 'Settings',
    description: 'Medium size variant (default).',
    children: <GeneralSettingsContent />,
    size: 'md',
  },
};

/**
 * Large size variant - more spacious layout
 */
export const SizeLarge: Story = {
  args: {
    navigation: simpleNavigation,
    activeNavId: 'general',
    title: 'Settings',
    description: 'Large size variant with generous spacing.',
    children: <GeneralSettingsContent />,
    size: 'lg',
  },
};

/**
 * Responsive size - changes based on breakpoints
 */
export const ResponsiveSize: Story = {
  args: {
    navigation: simpleNavigation,
    activeNavId: 'general',
    title: 'Settings',
    description: 'Responsive size: sm on mobile, md on tablet, lg on desktop.',
    children: <GeneralSettingsContent />,
    size: { base: 'sm', md: 'md', lg: 'lg' },
  },
};

// ============================================================================
// Navigation Variations
// ============================================================================

/**
 * Settings layout with minimal navigation (no sections)
 */
export const SimpleNavigation: Story = {
  args: {
    navigation: simpleNavigation,
    activeNavId: 'general',
    title: 'Settings',
    children: <GeneralSettingsContent />,
  },
};

/**
 * Settings layout with disabled items
 */
export const WithDisabledItems: Story = {
  args: {
    navigation: navigationWithDisabled,
    activeNavId: 'general',
    title: 'Settings',
    description: 'Some navigation items are disabled and cannot be selected.',
    children: <GeneralSettingsContent />,
  },
};

/**
 * Settings layout with many navigation items
 */
export const ManyNavigationItems: Story = {
  args: {
    navigation: manyItemsNavigation,
    activeNavId: 'general',
    title: 'Settings',
    description: 'Settings layout with many navigation items demonstrating scrolling.',
    children: <GeneralSettingsContent />,
  },
};

/**
 * Settings layout with custom nav width
 */
export const WideNavigation: Story = {
  args: {
    navigation: sampleNavigation,
    activeNavId: 'general',
    title: 'Settings',
    description: 'Settings layout with wider navigation sidebar (300px).',
    children: <GeneralSettingsContent />,
    navWidth: '300px',
  },
};

/**
 * Settings layout with narrow nav width
 */
export const NarrowNavigation: Story = {
  args: {
    navigation: sampleNavigation,
    activeNavId: 'general',
    title: 'Settings',
    description: 'Settings layout with narrower navigation sidebar (200px).',
    children: <GeneralSettingsContent />,
    navWidth: '200px',
  },
};

// ============================================================================
// Content Variations
// ============================================================================

/**
 * Settings layout with long scrolling content
 */
export const LongContent: Story = {
  args: {
    navigation: sampleNavigation,
    activeNavId: 'general',
    title: 'Settings',
    description: 'Demonstrates scrolling behavior with long content.',
    children: <LongSettingsContent />,
  },
};

// ============================================================================
// Interactive Examples
// ============================================================================

/**
 * Interactive settings layout with navigation
 */
export const Interactive: Story = {
  render: function InteractiveExample() {
    const [activeNavId, setActiveNavId] = useState('general');

    const getContent = () => {
      switch (activeNavId) {
        case 'general':
          return <GeneralSettingsContent />;
        case 'profiles':
          return <ExecutorProfilesContent />;
        case 'theme':
          return <ThemeSettingsContent />;
        default:
          return (
            <div className="flex h-full items-center justify-center">
              <p className="text-[rgb(var(--muted-foreground))]">Content for {activeNavId}</p>
            </div>
          );
      }
    };

    const getTitle = () => {
      const item = sampleNavigation.find((n) => n.id === activeNavId);
      return item?.label || 'Settings';
    };

    return (
      <SettingsLayout
        navigation={sampleNavigation}
        activeNavId={activeNavId}
        onNavChange={setActiveNavId}
        title={getTitle()}
        description="Click on navigation items to switch sections."
        data-testid="interactive-settings"
      >
        {getContent()}
      </SettingsLayout>
    );
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/**
 * Demonstrates keyboard navigation
 *
 * Use Tab to move focus, Arrow keys to navigate items, Enter/Space to select.
 */
export const KeyboardNavigation: Story = {
  args: {
    navigation: sampleNavigation,
    activeNavId: 'general',
    title: 'Keyboard Navigation Demo',
    description: 'Tab to navigation, use Arrow keys to move, Enter/Space to select.',
    children: (
      <div className="max-w-2xl space-y-4">
        <h2 className="text-lg font-medium text-[rgb(var(--foreground))]">
          Keyboard Navigation Instructions
        </h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-[rgb(var(--muted-foreground))]">
          <li>
            <strong>Tab</strong>: Move focus between navigation and content areas
          </li>
          <li>
            <strong>Arrow Up/Left</strong>: Navigate to previous item
          </li>
          <li>
            <strong>Arrow Down/Right</strong>: Navigate to next item
          </li>
          <li>
            <strong>Home</strong>: Navigate to first item
          </li>
          <li>
            <strong>End</strong>: Navigate to last item
          </li>
          <li>
            <strong>Enter/Space</strong>: Select the focused item
          </li>
        </ul>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          The navigation uses a roving tabindex pattern for optimal keyboard accessibility.
        </p>
      </div>
    ),
    'data-testid': 'keyboard-nav-demo',
  },
};

/**
 * Demonstrates screen reader announcements
 */
export const ScreenReaderAccessibility: Story = {
  render: function ScreenReaderDemo() {
    const [activeNavId, setActiveNavId] = useState('general');
    const [lastAnnouncement, setLastAnnouncement] = useState<string | null>(null);

    const handleNavChange = (id: string) => {
      const item = sampleNavigation.find((n) => n.id === id);
      if (item) {
        setLastAnnouncement(`${SR_NAV_CHANGED} ${item.label}`);
        setActiveNavId(id);
      }
    };

    return (
      <div className="h-full flex flex-col">
        {/* Demo status bar */}
        <div className="shrink-0 bg-[rgb(var(--muted))] p-3 border-b border-[rgb(var(--border))]">
          <p className="text-sm text-[rgb(var(--foreground))]">
            <strong>Last announcement:</strong>{' '}
            {lastAnnouncement || 'Navigate to see announcements'}
          </p>
        </div>

        <div className="flex-1 min-h-0">
          <SettingsLayout
            navigation={sampleNavigation}
            activeNavId={activeNavId}
            onNavChange={handleNavChange}
            title="Screen Reader Demo"
            description="Navigate to different sections and observe the announcements."
          >
            <div className="max-w-2xl space-y-4">
              <h2 className="text-lg font-medium text-[rgb(var(--foreground))]">
                Screen Reader Features
              </h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-[rgb(var(--muted-foreground))]">
                <li>Navigation region is announced with label "{DEFAULT_NAV_LABEL}"</li>
                <li>Content region is announced with label "{DEFAULT_CONTENT_LABEL}"</li>
                <li>Active item is marked with aria-current="page"</li>
                <li>Mobile tabs use role="tab" with aria-selected</li>
                <li>Navigation changes trigger polite live region announcements</li>
                <li>Section headers are marked as aria-hidden but provide context</li>
              </ul>
            </div>
          </SettingsLayout>
        </div>
      </div>
    );
  },
};

/**
 * Demonstrates touch target sizes for mobile
 */
export const TouchTargetAccessibility: Story = {
  args: {
    navigation: simpleNavigation,
    activeNavId: 'general',
    title: 'Touch Target Demo',
    description: 'Navigation items have 44px minimum touch targets (WCAG 2.5.5).',
    children: (
      <div className="max-w-2xl space-y-4">
        <h2 className="text-lg font-medium text-[rgb(var(--foreground))]">Touch Target Sizes</h2>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Mobile navigation items have a minimum touch target of 44×44 pixels as required by WCAG
          2.5.5 Target Size. This ensures users with motor impairments or using touch devices can
          accurately tap navigation items.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-4 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
            <div className="h-11 w-11 rounded bg-[rgb(var(--primary))] flex items-center justify-center">
              <span className="text-xs text-[rgb(var(--primary-foreground))]">44px</span>
            </div>
            <p className="mt-2 text-xs text-[rgb(var(--muted-foreground))]">Minimum target</p>
          </div>
          <div className="p-4 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
            <p className="text-sm text-[rgb(var(--foreground))]">
              Resize window to mobile size to see horizontal tab navigation.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Demonstrates focus ring visibility
 */
export const FocusRingVisibility: Story = {
  args: {
    navigation: simpleNavigation,
    activeNavId: 'general',
    title: 'Focus Ring Demo',
    description: 'Tab through to see focus rings with ring-offset for contrast.',
    children: (
      <div className="max-w-2xl space-y-4">
        <h2 className="text-lg font-medium text-[rgb(var(--foreground))]">Focus Ring Visibility</h2>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Navigation items have visible focus rings with a 2px ring-offset to ensure the focus
          indicator is visible against all backgrounds. The focus ring uses the --ring CSS variable
          for consistent theming.
        </p>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Press{' '}
          <kbd className="px-1 py-0.5 rounded bg-[rgb(var(--muted))] font-mono text-xs">Tab</kbd> to
          navigate through the interface and observe the focus indicators.
        </p>
      </div>
    ),
  },
};

/**
 * Demonstrates reduced motion support
 */
export const ReducedMotion: Story = {
  args: {
    navigation: simpleNavigation,
    activeNavId: 'general',
    title: 'Reduced Motion Demo',
    description: 'Transitions respect prefers-reduced-motion media query.',
    children: (
      <div className="max-w-2xl space-y-4">
        <h2 className="text-lg font-medium text-[rgb(var(--foreground))]">
          Reduced Motion Support
        </h2>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          All transitions and animations use the{' '}
          <code className="px-1 py-0.5 rounded bg-[rgb(var(--muted))] font-mono text-xs">
            motion-safe:
          </code>{' '}
          prefix. When the user has enabled "Reduce motion" in their system settings, transitions
          are disabled or minimized.
        </p>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          Enable "Reduce motion" in your system settings to test this feature.
        </p>
      </div>
    ),
  },
};

// ============================================================================
// Ref Forwarding & Data Attributes
// ============================================================================

/**
 * Demonstrates forwardRef support
 */
export const RefForwarding: Story = {
  render: function RefForwardingDemo() {
    const layoutRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
      if (layoutRef.current) {
        const rect = layoutRef.current.getBoundingClientRect();
        setDimensions({ width: Math.round(rect.width), height: Math.round(rect.height) });
      }
    }, []);

    return (
      <SettingsLayout
        ref={layoutRef}
        navigation={simpleNavigation}
        activeNavId="general"
        title="Ref Forwarding Demo"
        description={`Layout dimensions: ${dimensions.width}×${dimensions.height}px`}
        data-testid="ref-demo"
      >
        <div className="max-w-2xl space-y-4">
          <h2 className="text-lg font-medium text-[rgb(var(--foreground))]">Ref Forwarding</h2>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            The SettingsLayout component supports forwardRef for accessing the container DOM
            element. The dimensions shown in the description are read from the ref.
          </p>
        </div>
      </SettingsLayout>
    );
  },
};

/**
 * Demonstrates data-testid attributes
 */
export const DataTestIds: Story = {
  args: {
    navigation: sampleNavigation,
    activeNavId: 'general',
    title: 'Data Attributes Demo',
    description: 'Inspect the DOM to see data-testid attributes.',
    children: (
      <div className="max-w-2xl space-y-4">
        <h2 className="text-lg font-medium text-[rgb(var(--foreground))]">Data Attributes</h2>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          When data-testid is provided, nested elements receive derived test IDs:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-[rgb(var(--muted-foreground))]">
          <li>
            <code className="font-mono">data-testid="demo"</code> - Main container
          </li>
          <li>
            <code className="font-mono">data-testid="demo-mobile-nav"</code> - Mobile navigation
          </li>
          <li>
            <code className="font-mono">data-testid="demo-mobile-tablist"</code> - Mobile tab list
          </li>
          <li>
            <code className="font-mono">data-testid="demo-mobile-tab-general"</code> - Mobile tab
            item
          </li>
          <li>
            <code className="font-mono">data-testid="demo-desktop-nav"</code> - Desktop navigation
          </li>
          <li>
            <code className="font-mono">data-testid="demo-nav-item-general"</code> - Desktop nav
            item
          </li>
          <li>
            <code className="font-mono">data-testid="demo-section-appearance"</code> - Section
            header
          </li>
          <li>
            <code className="font-mono">data-testid="demo-content"</code> - Content area
          </li>
          <li>
            <code className="font-mono">data-testid="demo-header"</code> - Title header
          </li>
          <li>
            <code className="font-mono">data-testid="demo-main-content"</code> - Main content
            wrapper
          </li>
        </ul>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Additional data attributes:</p>
        <ul className="list-disc list-inside space-y-1 text-sm text-[rgb(var(--muted-foreground))]">
          <li>
            <code className="font-mono">data-size="md"</code> - Current size variant
          </li>
          <li>
            <code className="font-mono">data-active-nav="general"</code> - Active nav ID
          </li>
          <li>
            <code className="font-mono">data-active="true"</code> - On active nav items
          </li>
          <li>
            <code className="font-mono">data-disabled="true"</code> - On disabled nav items
          </li>
        </ul>
      </div>
    ),
    'data-testid': 'demo',
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/**
 * Application settings page example
 */
export const ApplicationSettings: Story = {
  render: function ApplicationSettingsExample() {
    const [activeNavId, setActiveNavId] = useState('general');

    const navigation: SettingsNavItem[] = [
      { id: 'general', label: 'General', icon: Settings },
      { id: 'editor', label: 'Editor', icon: Terminal },
      { id: 'appearance', label: 'Appearance', isSection: true },
      { id: 'theme', label: 'Theme', icon: Palette },
      { id: 'display', label: 'Display', icon: Monitor },
      { id: 'integrations', label: 'Integrations', isSection: true },
      { id: 'github', label: 'GitHub', icon: FolderGit2 },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    return (
      <SettingsLayout
        navigation={navigation}
        activeNavId={activeNavId}
        onNavChange={setActiveNavId}
        title="Application Settings"
        description="Configure OpenFlow to match your workflow."
      >
        <GeneralSettingsContent />
      </SettingsLayout>
    );
  },
};

/**
 * User profile settings example
 */
export const UserProfileSettings: Story = {
  render: function UserProfileSettingsExample() {
    const [activeNavId, setActiveNavId] = useState('profile');

    const navigation: SettingsNavItem[] = [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'security', label: 'Security', icon: Shield },
      { id: 'privacy', label: 'Privacy', icon: Lock },
      { id: 'notifications', label: 'Notifications', isSection: true },
      { id: 'email', label: 'Email Notifications', icon: Mail },
      { id: 'push', label: 'Push Notifications', icon: Bell },
    ];

    return (
      <SettingsLayout
        navigation={navigation}
        activeNavId={activeNavId}
        onNavChange={setActiveNavId}
        title="Profile Settings"
        description="Manage your account and privacy preferences."
        navLabel="Profile settings navigation"
        contentLabel="Profile settings content"
      >
        <div className="max-w-2xl space-y-6">
          <FormField label="Display Name" htmlFor="display-name">
            <Input id="display-name" defaultValue="John Developer" />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <Input id="email" type="email" defaultValue="john@example.com" />
          </FormField>
          <FormField label="Bio" htmlFor="bio" helperText="Brief description for your profile.">
            <Input id="bio" placeholder="Tell us about yourself..." />
          </FormField>
          <div className="flex justify-end gap-3 pt-4 border-t border-[rgb(var(--border))]">
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary">Save Profile</Button>
          </div>
        </div>
      </SettingsLayout>
    );
  },
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Reference for all exported constants and utility functions
 */
export const ConstantsReference: Story = {
  render: function ConstantsReferenceComponent() {
    return (
      <SettingsLayout
        navigation={simpleNavigation}
        activeNavId="general"
        title="Constants & Utilities Reference"
        description="All exported constants and utility functions for testing and customization."
      >
        <div className="max-w-3xl space-y-8">
          {/* Default Labels */}
          <section>
            <h2 className="text-lg font-medium text-[rgb(var(--foreground))] mb-3">
              Default Labels
            </h2>
            <div className="space-y-2 font-mono text-sm">
              <p>
                <strong>DEFAULT_NAV_LABEL:</strong> "{DEFAULT_NAV_LABEL}"
              </p>
              <p>
                <strong>DEFAULT_CONTENT_LABEL:</strong> "{DEFAULT_CONTENT_LABEL}"
              </p>
              <p>
                <strong>DEFAULT_NAV_WIDTH:</strong> "{DEFAULT_NAV_WIDTH}"
              </p>
            </div>
          </section>

          {/* Screen Reader Text */}
          <section>
            <h2 className="text-lg font-medium text-[rgb(var(--foreground))] mb-3">
              Screen Reader Text
            </h2>
            <div className="space-y-2 font-mono text-sm">
              <p>
                <strong>SR_NAV_CHANGED:</strong> "{SR_NAV_CHANGED}"
              </p>
              <p>
                <strong>SR_SECTION_HEADER:</strong> "{SR_SECTION_HEADER}"
              </p>
              <p>
                <strong>SR_CURRENT_PAGE:</strong> "{SR_CURRENT_PAGE}"
              </p>
            </div>
          </section>

          {/* Size Classes */}
          <section>
            <h2 className="text-lg font-medium text-[rgb(var(--foreground))] mb-3">Size Classes</h2>
            <div className="space-y-4">
              {(['sm', 'md', 'lg'] as const).map((size) => (
                <div key={size}>
                  <h3 className="font-medium text-[rgb(var(--foreground))]">{size}:</h3>
                  <pre className="mt-1 p-2 rounded bg-[rgb(var(--muted))] text-xs overflow-x-auto">
                    {JSON.stringify(SETTINGS_LAYOUT_SIZE_CLASSES[size], null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </section>

          {/* Utility Functions */}
          <section>
            <h2 className="text-lg font-medium text-[rgb(var(--foreground))] mb-3">
              Utility Functions
            </h2>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded border border-[rgb(var(--border))]">
                <code className="font-mono">getBaseSize(size)</code>
                <p className="mt-1 text-[rgb(var(--muted-foreground))]">
                  Extracts base size from ResponsiveValue. Example:{' '}
                  {getBaseSize({ base: 'sm', md: 'lg' })}
                </p>
              </div>
              <div className="p-3 rounded border border-[rgb(var(--border))]">
                <code className="font-mono">getResponsiveSizeClasses(size, property)</code>
                <p className="mt-1 text-[rgb(var(--muted-foreground))]">
                  Gets size-specific classes for a property.
                </p>
              </div>
              <div className="p-3 rounded border border-[rgb(var(--border))]">
                <code className="font-mono">buildNavChangeAnnouncement(label)</code>
                <p className="mt-1 text-[rgb(var(--muted-foreground))]">
                  Builds screen reader announcement. Example: "
                  {buildNavChangeAnnouncement('General')}"
                </p>
              </div>
              <div className="p-3 rounded border border-[rgb(var(--border))]">
                <code className="font-mono">getNavItemId(prefix, itemId)</code>
                <p className="mt-1 text-[rgb(var(--muted-foreground))]">
                  Gets element ID for nav item. Example: "{getNavItemId('prefix', 'general')}"
                </p>
              </div>
              <div className="p-3 rounded border border-[rgb(var(--border))]">
                <code className="font-mono">getTabPanelId(prefix)</code>
                <p className="mt-1 text-[rgb(var(--muted-foreground))]">
                  Gets element ID for tab panel. Example: "{getTabPanelId('prefix')}"
                </p>
              </div>
              <div className="p-3 rounded border border-[rgb(var(--border))]">
                <code className="font-mono">getClickableNavItems(navigation)</code>
                <p className="mt-1 text-[rgb(var(--muted-foreground))]">
                  Filters to only clickable items (excludes section headers).
                </p>
              </div>
              <div className="p-3 rounded border border-[rgb(var(--border))]">
                <code className="font-mono">getNavItemIndex(items, itemId)</code>
                <p className="mt-1 text-[rgb(var(--muted-foreground))]">
                  Gets index of item in clickable items list.
                </p>
              </div>
              <div className="p-3 rounded border border-[rgb(var(--border))]">
                <code className="font-mono">
                  findNextEnabledItem(items, currentIndex, direction)
                </code>
                <p className="mt-1 text-[rgb(var(--muted-foreground))]">
                  Finds next non-disabled item (wrapping).
                </p>
              </div>
            </div>
          </section>

          {/* CSS Class Constants */}
          <section>
            <h2 className="text-lg font-medium text-[rgb(var(--foreground))] mb-3">
              CSS Class Constants
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <code className="font-mono">SETTINGS_LAYOUT_CONTAINER_CLASSES</code>
                <pre className="mt-1 p-2 rounded bg-[rgb(var(--muted))] text-xs overflow-x-auto">
                  {SETTINGS_LAYOUT_CONTAINER_CLASSES}
                </pre>
              </div>
              <div>
                <code className="font-mono">SETTINGS_MOBILE_TAB_BASE_CLASSES</code>
                <pre className="mt-1 p-2 rounded bg-[rgb(var(--muted))] text-xs overflow-x-auto">
                  {SETTINGS_MOBILE_TAB_BASE_CLASSES}
                </pre>
              </div>
              <div>
                <code className="font-mono">SETTINGS_NAV_ITEM_BASE_CLASSES</code>
                <pre className="mt-1 p-2 rounded bg-[rgb(var(--muted))] text-xs overflow-x-auto">
                  {SETTINGS_NAV_ITEM_BASE_CLASSES}
                </pre>
              </div>
            </div>
          </section>
        </div>
      </SettingsLayout>
    );
  },
};
