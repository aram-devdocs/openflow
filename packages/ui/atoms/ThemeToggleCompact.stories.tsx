import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { ResolvedTheme } from './ThemeToggleCompact';
import { ThemeToggleCompact } from './ThemeToggleCompact';

const meta: Meta<typeof ThemeToggleCompact> = {
  title: 'Atoms/ThemeToggleCompact',
  component: ThemeToggleCompact,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    resolvedTheme: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'The resolved theme (light or dark)',
    },
    onToggle: { action: 'toggled' },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeToggleCompact>;

/** Compact toggle in dark mode (shows sun icon to switch to light) */
export const DarkMode: Story = {
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

/** Compact toggle in a header-like context */
export const InHeaderContext: Story = {
  render: function HeaderContextStory() {
    const [theme, setTheme] = useState<ResolvedTheme>('dark');
    const handleToggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-4 py-2">
        <span className="text-sm text-[rgb(var(--foreground))]">Header Actions</span>
        <div className="flex-1" />
        <ThemeToggleCompact resolvedTheme={theme} onToggle={handleToggle} />
      </div>
    );
  },
};

/** Compact toggle with custom className */
export const CustomClass: Story = {
  args: {
    resolvedTheme: 'dark',
    className: 'bg-[rgb(var(--surface-1))] rounded-full',
  },
};
