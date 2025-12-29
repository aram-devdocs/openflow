import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Header } from './Header';

const meta = {
  title: 'Organisms/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    onSearch: fn(),
    onNewChat: fn(),
    onNewTerminal: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-full bg-[rgb(var(--background))]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default header with all features enabled
 */
export const Default: Story = {
  args: {},
};

/**
 * Header with title and subtitle
 */
export const WithTitle: Story = {
  args: {
    title: 'OpenFlow Project',
    subtitle: '3 tasks in progress',
  },
};

/**
 * Header with title only
 */
export const WithTitleOnly: Story = {
  args: {
    title: 'My Awesome Project',
  },
};

/**
 * Header with long title and subtitle
 */
export const LongTitleAndSubtitle: Story = {
  args: {
    title: 'This is a very long project name that might need truncation',
    subtitle: 'Currently working on 15 tasks across 3 different workflows',
  },
};

/**
 * Header with only search enabled
 */
export const SearchOnly: Story = {
  args: {
    newChatEnabled: false,
    newTerminalEnabled: false,
  },
};

/**
 * Header with only new chat enabled
 */
export const NewChatOnly: Story = {
  args: {
    searchEnabled: false,
    newTerminalEnabled: false,
  },
};

/**
 * Header with only new terminal enabled
 */
export const NewTerminalOnly: Story = {
  args: {
    searchEnabled: false,
    newChatEnabled: false,
  },
};

/**
 * Header with search and new chat (no terminal)
 */
export const SearchAndChat: Story = {
  args: {
    title: 'Task: Implement Authentication',
    newTerminalEnabled: false,
  },
};

/**
 * Header with all features disabled (minimal)
 */
export const Minimal: Story = {
  args: {
    searchEnabled: false,
    newChatEnabled: false,
    newTerminalEnabled: false,
  },
};

/**
 * Header with all features and title
 */
export const Complete: Story = {
  args: {
    title: 'OpenFlow',
    subtitle: 'AI Task Orchestration',
    searchEnabled: true,
    newChatEnabled: true,
    newTerminalEnabled: true,
  },
};

/**
 * Header with project context
 */
export const ProjectContext: Story = {
  args: {
    title: 'Feature: User Authentication',
    subtitle: 'Step: Implementation (2/4)',
  },
};

/**
 * Header with task context
 */
export const TaskContext: Story = {
  args: {
    title: 'Implement dark mode toggle',
    subtitle: 'In Progress - 2 chats active',
  },
};
