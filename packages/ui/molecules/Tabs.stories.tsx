import type { Meta, StoryObj } from '@storybook/react';
import { Bell, FileDiff, GitCommit, Home, ListTodo, Settings, User } from 'lucide-react';
import { useState } from 'react';
import { TabPanel, Tabs } from './Tabs';

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
      description: 'Size of the tabs',
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

/** Tabs with a disabled tab */
export const WithDisabledTab: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('home');
    return <Tabs tabs={tabsWithDisabled} activeTab={activeTab} onTabChange={setActiveTab} />;
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

/** Keyboard navigation demo */
export const KeyboardNavigation: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('steps');
    return (
      <div className="space-y-4">
        <Tabs tabs={tabsWithIcons} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="rounded-lg border border-[rgb(var(--border))] p-4">
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            Focus on a tab and use keyboard navigation:
          </p>
          <ul className="mt-2 list-inside list-disc text-sm text-[rgb(var(--muted-foreground))]">
            <li>Arrow Left/Right: Navigate between tabs</li>
            <li>Home: Go to first tab</li>
            <li>End: Go to last tab</li>
            <li>Enter/Space: Select focused tab</li>
          </ul>
        </div>
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
