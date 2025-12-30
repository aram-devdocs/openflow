import type { Meta, StoryObj } from '@storybook/react';
import { SkeletonChat } from './SkeletonChat';

const meta: Meta<typeof SkeletonChat> = {
  title: 'Molecules/SkeletonChat',
  component: SkeletonChat,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SkeletonChat>;

/** Default chat skeleton with 3 messages */
export const Default: Story = {
  render: () => (
    <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <SkeletonChat />
    </div>
  ),
};

/** Chat skeleton with more messages */
export const Extended: Story = {
  render: () => (
    <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <SkeletonChat messageCount={6} />
    </div>
  ),
};

/** Minimal chat skeleton with 2 messages */
export const Minimal: Story = {
  render: () => (
    <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <SkeletonChat messageCount={2} />
    </div>
  ),
};

/** Single message skeleton */
export const SingleMessage: Story = {
  render: () => (
    <div className="w-[500px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
      <SkeletonChat messageCount={1} />
    </div>
  ),
};
