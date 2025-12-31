import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular'],
    },
    width: {
      control: 'text',
    },
    height: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

/** Default rectangular skeleton */
export const Default: Story = {
  args: {
    width: 200,
    height: 40,
  },
};

/** Text variant for single line content */
export const Text: Story = {
  args: {
    variant: 'text',
    className: 'w-48',
  },
};

/** Circular variant for avatars and icons */
export const Circular: Story = {
  args: {
    variant: 'circular',
    width: 48,
    height: 48,
  },
};

/** Rectangular variant for cards and images */
export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: 200,
    height: 120,
  },
};

/** All variants displayed together */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[rgb(var(--muted-foreground))]">Text</span>
        <Skeleton variant="text" className="w-48" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[rgb(var(--muted-foreground))]">Circular</span>
        <Skeleton variant="circular" width={48} height={48} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[rgb(var(--muted-foreground))]">Rectangular</span>
        <Skeleton variant="rectangular" width={200} height={100} />
      </div>
    </div>
  ),
};

/** Simulated card content loading */
export const CardContentLoading: Story = {
  render: () => (
    <div className="w-64 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <Skeleton variant="rectangular" className="mt-4 h-24 w-full" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  ),
};

/** Multiple text lines */
export const TextLines: Story = {
  render: () => (
    <div className="w-64 space-y-2">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-5/6" />
      <Skeleton variant="text" className="w-4/6" />
      <Skeleton variant="text" className="w-5/6" />
      <Skeleton variant="text" className="w-3/6" />
    </div>
  ),
};

/** Avatar sizes */
export const AvatarSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <Skeleton variant="circular" width={24} height={24} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">24px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Skeleton variant="circular" width={32} height={32} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">32px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Skeleton variant="circular" width={40} height={40} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">40px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Skeleton variant="circular" width={48} height={48} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">48px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Skeleton variant="circular" width={64} height={64} />
        <span className="text-xs text-[rgb(var(--muted-foreground))]">64px</span>
      </div>
    </div>
  ),
};

/** Simulated list loading */
export const ListLoading: Story = {
  render: () => (
    <div className="w-72 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={`list-item-${i}`} className="flex items-center gap-3">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" className="w-2/3" />
            <Skeleton variant="text" className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  ),
};
