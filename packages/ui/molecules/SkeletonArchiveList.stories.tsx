import type { Meta, StoryObj } from '@storybook/react';
import { SkeletonArchiveList } from './SkeletonArchiveList';

const meta: Meta<typeof SkeletonArchiveList> = {
  title: 'Molecules/SkeletonArchiveList',
  component: SkeletonArchiveList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SkeletonArchiveList>;

/** Default archive list skeleton with 5 items */
export const Default: Story = {
  render: () => (
    <div className="max-w-3xl">
      <SkeletonArchiveList />
    </div>
  ),
};

/** Archive list skeleton with 3 items */
export const ThreeItems: Story = {
  render: () => (
    <div className="max-w-3xl">
      <SkeletonArchiveList count={3} />
    </div>
  ),
};

/** Archive list skeleton with many items */
export const ManyItems: Story = {
  render: () => (
    <div className="max-w-3xl">
      <SkeletonArchiveList count={10} />
    </div>
  ),
};

/** Single archive item skeleton */
export const SingleItem: Story = {
  render: () => (
    <div className="max-w-3xl">
      <SkeletonArchiveList count={1} />
    </div>
  ),
};
