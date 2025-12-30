import type { Meta, StoryObj } from '@storybook/react';
import { SkeletonList } from './SkeletonList';

const meta: Meta<typeof SkeletonList> = {
  title: 'Molecules/SkeletonList',
  component: SkeletonList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SkeletonList>;

/** Default list skeleton with 5 items */
export const Default: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonList />
    </div>
  ),
};

/** List skeleton with 3 items */
export const ThreeItems: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonList count={3} />
    </div>
  ),
};

/** List skeleton without avatars */
export const NoAvatars: Story = {
  render: () => (
    <div className="w-80">
      <SkeletonList showAvatar={false} />
    </div>
  ),
};

/** Wide list skeleton */
export const Wide: Story = {
  render: () => (
    <div className="w-[500px]">
      <SkeletonList count={4} />
    </div>
  ),
};
