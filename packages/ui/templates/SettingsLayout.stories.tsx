import type { Meta, StoryObj } from '@storybook/react';
import {
  Bell,
  Database,
  FolderGit2,
  Keyboard,
  Palette,
  Settings,
  Shield,
  Terminal,
  User,
} from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Dropdown } from '../molecules/Dropdown';
import { FormField } from '../molecules/FormField';
import { SettingsLayout, type SettingsNavItem } from './SettingsLayout';

const meta: Meta<typeof SettingsLayout> = {
  title: 'Templates/SettingsLayout',
  component: SettingsLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-screen w-screen">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SettingsLayout>;

// Sample navigation items
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

// Sample settings content components
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
          <div className="grid grid-cols-3 gap-3">
            {['Dark', 'Light', 'System'].map((theme) => (
              <button
                key={theme}
                type="button"
                className={`rounded-lg border-2 p-4 text-center transition-colors ${
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
          <div className="flex gap-2">
            {['blue', 'green', 'purple', 'orange', 'pink'].map((color) => (
              <button
                key={color}
                type="button"
                className={`h-8 w-8 rounded-full ${
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
                aria-label={`Select ${color} accent color`}
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

/**
 * Settings layout with minimal navigation (no sections)
 */
export const SimpleNavigation: Story = {
  args: {
    navigation: [
      { id: 'general', label: 'General', icon: Settings },
      { id: 'profiles', label: 'Executor Profiles', icon: User },
      { id: 'theme', label: 'Theme', icon: Palette },
    ],
    activeNavId: 'general',
    title: 'Settings',
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
    description: 'Manage your application preferences and configuration.',
    children: <GeneralSettingsContent />,
    navWidth: '300px',
  },
};

/**
 * Settings layout with long scrolling content
 */
export const LongContent: Story = {
  args: {
    navigation: sampleNavigation,
    activeNavId: 'general',
    title: 'Settings',
    description: 'Manage your application preferences and configuration.',
    children: (
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
    ),
  },
};
