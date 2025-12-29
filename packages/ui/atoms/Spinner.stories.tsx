import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Atoms/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

/** Default spinner with medium size */
export const Default: Story = {
  args: {
    size: 'md',
  },
};

/** Small spinner for inline use */
export const Small: Story = {
  args: {
    size: 'sm',
  },
};

/** Medium spinner (default) */
export const Medium: Story = {
  args: {
    size: 'md',
  },
};

/** Large spinner for prominent loading states */
export const Large: Story = {
  args: {
    size: 'lg',
  },
};

/** All sizes displayed together */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="sm" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">md</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">lg</span>
      </div>
    </div>
  ),
};

/** Spinner with custom color via className */
export const CustomColor: Story = {
  args: {
    size: 'lg',
    className: 'text-blue-500',
  },
};

/** Spinner in a loading button context */
export const InButtonContext: Story = {
  render: () => (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[rgb(var(--primary-foreground))] opacity-70"
      disabled
    >
      <Spinner size="sm" />
      Loading...
    </button>
  ),
};

/** Spinner in a card loading state */
export const InCardContext: Story = {
  render: () => (
    <div className="flex h-32 w-48 items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" />
        <span className="text-sm text-[rgb(var(--muted-foreground))]">Loading...</span>
      </div>
    </div>
  ),
};

/** Full page loading spinner */
export const FullPageLoading: Story = {
  render: () => (
    <div className="flex h-64 w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" className="text-[rgb(var(--primary))]" />
        <p className="text-sm text-[rgb(var(--muted-foreground))]">Please wait...</p>
      </div>
    </div>
  ),
};
