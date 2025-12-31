import type { Meta, StoryObj } from '@storybook/react';
import { SkeletonCard } from './SkeletonCard';

const meta: Meta<typeof SkeletonCard> = {
  title: 'Molecules/SkeletonCard',
  component: SkeletonCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SkeletonCard>;

/** Default card skeleton with avatar */
export const Default: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard />
    </div>
  ),
};

/** Card skeleton with action buttons */
export const WithActions: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard showActions />
    </div>
  ),
};

/** Card skeleton without avatar */
export const NoAvatar: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard showAvatar={false} />
    </div>
  ),
};

/** Full card skeleton with avatar and actions */
export const Full: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard showAvatar showActions />
    </div>
  ),
};

/** Minimal card skeleton - no avatar, no actions */
export const Minimal: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonCard showAvatar={false} showActions={false} />
    </div>
  ),
};
