import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { Theme } from './ThemeToggle';
import { ThemeToggle } from './ThemeToggle';

const meta: Meta<typeof ThemeToggle> = {
  title: 'Atoms/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    theme: {
      control: 'select',
      options: ['light', 'dark', 'system'],
      description: 'Current theme value',
    },
    onThemeChange: { action: 'themeChanged' },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

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

/** Interactive theme toggle with state */
export const Interactive: Story = {
  render: function InteractiveStory() {
    const [theme, setTheme] = useState<Theme>('system');
    return (
      <div className="flex flex-col items-center gap-4">
        <ThemeToggle theme={theme} onThemeChange={setTheme} />
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Current: {theme}</p>
      </div>
    );
  },
};

/** Theme toggle with custom className */
export const CustomClass: Story = {
  args: {
    theme: 'dark',
    className: 'shadow-lg',
  },
};
