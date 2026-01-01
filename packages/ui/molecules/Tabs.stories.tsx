import type { Meta, StoryObj } from '@storybook/react';
import { Bell, FileDiff, GitCommit, Home, ListTodo, Settings, User } from 'lucide-react';
import { useState } from 'react';
import {
  DEFAULT_SIZE,
  DEFAULT_VARIANT,
  TABS_CONTAINER_BASE_CLASSES,
  TABS_CONTAINER_CLASSES,
  TABS_ICON_SIZE_MAP,
  TABS_PANEL_CLASSES,
  TABS_SIZE_CLASSES,
  TABS_TAB_ACTIVE_CLASSES,
  TABS_TAB_BASE_CLASSES,
  TABS_TAB_COMMON_CLASSES,
  TABS_TAB_DISABLED_CLASSES,
  TABS_TAB_INACTIVE_CLASSES,
  TabPanel,
  Tabs,
  type TabsSize,
  type TabsVariant,
} from './Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Molecules/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    activeTab: {
      control: 'text',
      description: 'ID of the currently active tab',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the tabs (supports responsive values)',
    },
    variant: {
      control: 'select',
      options: ['default', 'pills', 'underline'],
      description: 'Visual variant of the tabs',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether tabs should take full width',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

// ============================================================================
// Test Data
// ============================================================================

const simpleTabs = [
  { id: 'steps', label: 'Steps' },
  { id: 'changes', label: 'Changes' },
  { id: 'commits', label: 'Commits' },
];

const tabsWithIcons = [
  { id: 'steps', label: 'Steps', icon: ListTodo },
  { id: 'changes', label: 'Changes', icon: FileDiff },
  { id: 'commits', label: 'Commits', icon: GitCommit },
];

const tabsWithBadges = [
  { id: 'steps', label: 'Steps', icon: ListTodo, badge: 3 },
  { id: 'changes', label: 'Changes', icon: FileDiff, badge: 12 },
  { id: 'commits', label: 'Commits', icon: GitCommit, badge: 5 },
];

const tabsWithDisabled = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'profile', label: 'Profile', icon: User, disabled: true },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

// ============================================================================
// Basic Examples
// ============================================================================

/** Default tabs with simple labels */
export const Default: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return <Tabs tabs={simpleTabs} activeTab={activeTab} onTabChange={setActiveTab} />;
  },
};

/** Tabs with icons */
export const WithIcons: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return <Tabs tabs={tabsWithIcons} activeTab={activeTab} onTabChange={setActiveTab} />;
  },
};

/** Tabs with badges showing counts */
export const WithBadges: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return <Tabs tabs={tabsWithBadges} activeTab={activeTab} onTabChange={setActiveTab} />;
  },
};

// ============================================================================
// Variant Examples
// ============================================================================

/** Underline variant */
export const UnderlineVariant: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return (
      <Tabs
        tabs={tabsWithIcons}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
      />
    );
  },
};

/** Pills variant */
export const PillsVariant: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return (
      <Tabs tabs={tabsWithIcons} activeTab={activeTab} onTabChange={setActiveTab} variant="pills" />
    );
  },
};

/** All variant styles */
export const AllVariants: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-2 text-sm text-[rgb(var(--muted-foreground))]">Default</p>
          <Tabs
            tabs={tabsWithIcons}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="default"
          />
        </div>
        <div>
          <p className="mb-2 text-sm text-[rgb(var(--muted-foreground))]">Underline</p>
          <Tabs
            tabs={tabsWithIcons}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="underline"
          />
        </div>
        <div>
          <p className="mb-2 text-sm text-[rgb(var(--muted-foreground))]">Pills</p>
          <Tabs
            tabs={tabsWithIcons}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="pills"
          />
        </div>
      </div>
    );
  },
};

// ============================================================================
// Size Examples
// ============================================================================

/** Small size tabs */
export const SmallSize: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return <Tabs tabs={tabsWithIcons} activeTab={activeTab} onTabChange={setActiveTab} size="sm" />;
  },
};

/** Large size tabs */
export const LargeSize: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return <Tabs tabs={tabsWithIcons} activeTab={activeTab} onTabChange={setActiveTab} size="lg" />;
  },
};

/** All size variants */
export const AllSizes: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-2 text-sm text-[rgb(var(--muted-foreground))]">Small</p>
          <Tabs tabs={tabsWithIcons} activeTab={activeTab} onTabChange={setActiveTab} size="sm" />
        </div>
        <div>
          <p className="mb-2 text-sm text-[rgb(var(--muted-foreground))]">Medium (default)</p>
          <Tabs tabs={tabsWithIcons} activeTab={activeTab} onTabChange={setActiveTab} size="md" />
        </div>
        <div>
          <p className="mb-2 text-sm text-[rgb(var(--muted-foreground))]">Large</p>
          <Tabs tabs={tabsWithIcons} activeTab={activeTab} onTabChange={setActiveTab} size="lg" />
        </div>
      </div>
    );
  },
};

// ============================================================================
// Responsive Sizing
// ============================================================================

/** Responsive sizing - small on mobile, medium on tablet, large on desktop */
export const ResponsiveSizing: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return (
      <div className="w-full max-w-3xl">
        <p className="mb-2 text-sm text-[rgb(var(--muted-foreground))]">
          Resize viewport to see size change: sm (mobile) → md (tablet) → lg (desktop)
        </p>
        <Tabs
          tabs={tabsWithIcons}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          size={{ base: 'sm', md: 'md', lg: 'lg' }}
        />
      </div>
    );
  },
};

/** Mobile-first responsive sizing */
export const ResponsiveMobileFirst: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return (
      <div className="w-full">
        <p className="mb-2 text-sm text-[rgb(var(--muted-foreground))]">
          Base: sm → Grows at each breakpoint
        </p>
        <Tabs
          tabs={tabsWithIcons}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          size={{ base: 'sm', sm: 'sm', md: 'md', lg: 'lg', xl: 'lg' }}
        />
      </div>
    );
  },
};

// ============================================================================
// Layout Options
// ============================================================================

/** Full width tabs */
export const FullWidth: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return (
      <div className="w-[500px]">
        <Tabs tabs={simpleTabs} activeTab={activeTab} onTabChange={setActiveTab} fullWidth />
      </div>
    );
  },
};

/** Full width with all variants */
export const FullWidthVariants: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return (
      <div className="flex w-[500px] flex-col gap-6">
        <div>
          <p className="mb-2 text-sm text-[rgb(var(--muted-foreground))]">Default (Full Width)</p>
          <Tabs
            tabs={simpleTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="default"
            fullWidth
          />
        </div>
        <div>
          <p className="mb-2 text-sm text-[rgb(var(--muted-foreground))]">Underline (Full Width)</p>
          <Tabs
            tabs={simpleTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="underline"
            fullWidth
          />
        </div>
        <div>
          <p className="mb-2 text-sm text-[rgb(var(--muted-foreground))]">Pills (Full Width)</p>
          <Tabs
            tabs={simpleTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="pills"
            fullWidth
          />
        </div>
      </div>
    );
  },
};

// ============================================================================
// State Variations
// ============================================================================

/** Tabs with a disabled tab */
export const WithDisabledTab: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('home');
    return <Tabs tabs={tabsWithDisabled} activeTab={activeTab} onTabChange={setActiveTab} />;
  },
};

/** All interactive states */
export const AllStates: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-2 text-sm text-[rgb(var(--muted-foreground))]">
            Interactive tabs - Click to select, keyboard navigation supported
          </p>
          <Tabs tabs={tabsWithBadges} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <div>
          <p className="mb-2 text-sm text-[rgb(var(--muted-foreground))]">
            With disabled tab (Profile is disabled)
          </p>
          <Tabs tabs={tabsWithDisabled} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
    );
  },
};

// ============================================================================
// With Tab Panels
// ============================================================================

/** Tabs with TabPanel for content */
export const WithTabPanels: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return (
      <div className="w-[500px]">
        <Tabs tabs={tabsWithIcons} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="mt-4 rounded-lg border border-[rgb(var(--border))] p-4">
          <TabPanel tabId="steps" activeTab={activeTab}>
            <div className="space-y-2">
              <h3 className="font-semibold text-[rgb(var(--foreground))]">Steps Panel</h3>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                This is the content for the Steps tab. It shows workflow steps.
              </p>
            </div>
          </TabPanel>
          <TabPanel tabId="changes" activeTab={activeTab}>
            <div className="space-y-2">
              <h3 className="font-semibold text-[rgb(var(--foreground))]">Changes Panel</h3>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                This is the content for the Changes tab. It shows file diffs.
              </p>
            </div>
          </TabPanel>
          <TabPanel tabId="commits" activeTab={activeTab}>
            <div className="space-y-2">
              <h3 className="font-semibold text-[rgb(var(--foreground))]">Commits Panel</h3>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                This is the content for the Commits tab. It shows git commits.
              </p>
            </div>
          </TabPanel>
        </div>
      </div>
    );
  },
};

// ============================================================================
// Accessibility Demos
// ============================================================================

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return (
      <div className="space-y-4">
        <Tabs
          tabs={tabsWithIcons}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          data-testid="keyboard-demo"
        />
        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Focus on a tab and use keyboard navigation:
          </p>
          <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
            <li>Arrow Left/Right: Navigate between tabs</li>
            <li>Arrow Up/Down: Navigate between tabs (alternative)</li>
            <li>Home: Go to first tab</li>
            <li>End: Go to last tab</li>
            <li>Enter/Space: Select focused tab (via click)</li>
          </ul>
        </div>
      </div>
    );
  },
};

/** Accessibility attributes demo */
export const AccessibilityDemo: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return (
      <div className="space-y-4">
        <Tabs
          tabs={tabsWithIcons}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          data-testid="a11y-demo"
        />
        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <h4 className="font-medium text-[rgb(var(--foreground))]">ARIA Attributes</h4>
          <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted-foreground))]">
            <li>
              <code>role="tablist"</code> on container
            </li>
            <li>
              <code>role="tab"</code> on each tab button
            </li>
            <li>
              <code>role="tabpanel"</code> on content panels
            </li>
            <li>
              <code>aria-selected</code> indicates active tab
            </li>
            <li>
              <code>aria-controls</code> links tab to panel
            </li>
            <li>
              <code>aria-labelledby</code> links panel to tab
            </li>
            <li>
              <code>aria-disabled</code> for disabled tabs
            </li>
            <li>
              <code>aria-orientation="horizontal"</code> for navigation context
            </li>
            <li>Roving tabindex for keyboard navigation</li>
          </ul>
        </div>
      </div>
    );
  },
};

// ============================================================================
// Real-World Examples
// ============================================================================

/** Task detail tabs (common usage) */
export const TaskDetailTabs: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('chat');
    const taskDetailTabs = [
      { id: 'chat', label: 'Chat' },
      { id: 'steps', label: 'Steps', icon: ListTodo, badge: 5 },
      { id: 'changes', label: 'Changes', icon: FileDiff, badge: 12 },
      { id: 'commits', label: 'Commits', icon: GitCommit, badge: 3 },
    ];
    return (
      <div className="w-[600px]">
        <Tabs tabs={taskDetailTabs} activeTab={activeTab} onTabChange={setActiveTab} fullWidth />
        <div className="mt-4 min-h-[200px] rounded-lg border border-[rgb(var(--border))] p-4">
          <TabPanel tabId="chat" activeTab={activeTab}>
            <div className="text-[rgb(var(--muted-foreground))]">Chat content goes here...</div>
          </TabPanel>
          <TabPanel tabId="steps" activeTab={activeTab}>
            <div className="text-[rgb(var(--muted-foreground))]">Steps content goes here...</div>
          </TabPanel>
          <TabPanel tabId="changes" activeTab={activeTab}>
            <div className="text-[rgb(var(--muted-foreground))]">Changes content goes here...</div>
          </TabPanel>
          <TabPanel tabId="commits" activeTab={activeTab}>
            <div className="text-[rgb(var(--muted-foreground))]">Commits content goes here...</div>
          </TabPanel>
        </div>
      </div>
    );
  },
};

/** Settings page tabs */
export const SettingsPageTabs: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('general');
    const settingsTabs = [
      { id: 'general', label: 'General', icon: Settings },
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ];
    return (
      <div className="w-[500px]">
        <Tabs
          tabs={settingsTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="underline"
        />
        <div className="mt-4 min-h-[150px]">
          <TabPanel tabId="general" activeTab={activeTab}>
            <h3 className="font-medium text-[rgb(var(--foreground))]">General Settings</h3>
            <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
              Configure general application settings.
            </p>
          </TabPanel>
          <TabPanel tabId="profile" activeTab={activeTab}>
            <h3 className="font-medium text-[rgb(var(--foreground))]">Profile Settings</h3>
            <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
              Update your profile information.
            </p>
          </TabPanel>
          <TabPanel tabId="notifications" activeTab={activeTab}>
            <h3 className="font-medium text-[rgb(var(--foreground))]">Notification Settings</h3>
            <p className="mt-1 text-sm text-[rgb(var(--muted-foreground))]">
              Manage your notification preferences.
            </p>
          </TabPanel>
        </div>
      </div>
    );
  },
};

// ============================================================================
// Constants Reference (for developers)
// ============================================================================

/** Constants reference showing all exported styling constants */
export const ConstantsReference: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6 text-sm">
      <div>
        <h3 className="mb-2 font-semibold text-[rgb(var(--foreground))]">Defaults</h3>
        <dl className="space-y-1">
          <div className="flex gap-2">
            <dt className="font-mono text-[rgb(var(--muted-foreground))]">DEFAULT_SIZE:</dt>
            <dd className="text-[rgb(var(--foreground))]">"{DEFAULT_SIZE}"</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-mono text-[rgb(var(--muted-foreground))]">DEFAULT_VARIANT:</dt>
            <dd className="text-[rgb(var(--foreground))]">"{DEFAULT_VARIANT}"</dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-[rgb(var(--foreground))]">Size Classes</h3>
        <dl className="space-y-1">
          {(Object.entries(TABS_SIZE_CLASSES) as [TabsSize, string][]).map(([size, classes]) => (
            <div key={size} className="flex gap-2">
              <dt className="font-mono text-[rgb(var(--muted-foreground))]">{size}:</dt>
              <dd className="font-mono text-xs text-[rgb(var(--foreground))]">{classes}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-[rgb(var(--foreground))]">Container Classes</h3>
        <dl className="space-y-1">
          <div className="flex gap-2">
            <dt className="font-mono text-[rgb(var(--muted-foreground))]">Base:</dt>
            <dd className="font-mono text-xs text-[rgb(var(--foreground))]">
              {TABS_CONTAINER_BASE_CLASSES}
            </dd>
          </div>
          {(Object.entries(TABS_CONTAINER_CLASSES) as [TabsVariant, string][]).map(
            ([variant, classes]) => (
              <div key={variant} className="flex gap-2">
                <dt className="font-mono text-[rgb(var(--muted-foreground))]">{variant}:</dt>
                <dd className="font-mono text-xs text-[rgb(var(--foreground))]">{classes}</dd>
              </div>
            )
          )}
        </dl>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-[rgb(var(--foreground))]">Tab Base Classes</h3>
        <dl className="space-y-1">
          <div>
            <dt className="font-mono text-[rgb(var(--muted-foreground))]">Common:</dt>
            <dd className="mt-1 font-mono text-xs text-[rgb(var(--foreground))]">
              {TABS_TAB_COMMON_CLASSES}
            </dd>
          </div>
          {(Object.entries(TABS_TAB_BASE_CLASSES) as [TabsVariant, string][]).map(
            ([variant, classes]) => (
              <div key={variant} className="flex gap-2">
                <dt className="font-mono text-[rgb(var(--muted-foreground))]">{variant}:</dt>
                <dd className="font-mono text-xs text-[rgb(var(--foreground))]">{classes}</dd>
              </div>
            )
          )}
        </dl>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-[rgb(var(--foreground))]">Active State Classes</h3>
        <dl className="space-y-1">
          {(Object.entries(TABS_TAB_ACTIVE_CLASSES) as [TabsVariant, string][]).map(
            ([variant, classes]) => (
              <div key={variant} className="flex gap-2">
                <dt className="font-mono text-[rgb(var(--muted-foreground))]">{variant}:</dt>
                <dd className="font-mono text-xs text-[rgb(var(--foreground))]">{classes}</dd>
              </div>
            )
          )}
        </dl>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-[rgb(var(--foreground))]">Inactive State Classes</h3>
        <dl className="space-y-1">
          {(Object.entries(TABS_TAB_INACTIVE_CLASSES) as [TabsVariant, string][]).map(
            ([variant, classes]) => (
              <div key={variant}>
                <dt className="font-mono text-[rgb(var(--muted-foreground))]">{variant}:</dt>
                <dd className="mt-1 font-mono text-xs text-[rgb(var(--foreground))]">{classes}</dd>
              </div>
            )
          )}
        </dl>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-[rgb(var(--foreground))]">Other Classes</h3>
        <dl className="space-y-1">
          <div className="flex gap-2">
            <dt className="font-mono text-[rgb(var(--muted-foreground))]">Disabled:</dt>
            <dd className="font-mono text-xs text-[rgb(var(--foreground))]">
              {TABS_TAB_DISABLED_CLASSES}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-mono text-[rgb(var(--muted-foreground))]">Panel:</dt>
            <dd className="font-mono text-xs text-[rgb(var(--foreground))]">
              {TABS_PANEL_CLASSES}
            </dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-[rgb(var(--foreground))]">Icon Size Map</h3>
        <dl className="space-y-1">
          {(Object.entries(TABS_ICON_SIZE_MAP) as [TabsSize, 'sm' | 'md'][]).map(
            ([size, iconSize]) => (
              <div key={size} className="flex gap-2">
                <dt className="font-mono text-[rgb(var(--muted-foreground))]">{size}:</dt>
                <dd className="text-[rgb(var(--foreground))]">"{iconSize}"</dd>
              </div>
            )
          )}
        </dl>
      </div>
    </div>
  ),
};
